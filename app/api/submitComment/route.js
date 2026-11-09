import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";
import {
  PRIVATE_EMAIL_PREFIX,
  findThreadRootId,
  normalizeEmail,
  notifyAdmin,
  notifyThreadParticipants
} from "@/lib/commentNotifications";
import {
  EmailCryptoConfigError,
  encryptEmail,
  hashEmail
} from "@/lib/emailCrypto";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Add this to your .env file
  apiVersion: "2023-01-01" // Add this line with the latest API version
});

// ---------------------------------------------------------------------------
// Anti-spam
// ---------------------------------------------------------------------------
const MAX_AUTHOR_LENGTH = 80;
const MAX_TEXT_LENGTH = 5000;
const MAX_LINKS = 2;
const MIN_FILL_TIME_MS = 3000; // humans take longer than this to write a comment
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 }; // per IP

// Best-effort, per server instance (instances are reused between requests).
// For a global limit, also add a Rate Limiting rule in the Vercel Firewall.
const recentByIp = new Map();
function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const recent = (recentByIp.get(ip) || []).filter(
    t => now - t < RATE_LIMIT.windowMs
  );
  if (recent.length >= RATE_LIMIT.max) {
    recentByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentByIp.set(ip, recent);
  if (recentByIp.size > 5000) recentByIp.clear(); // keep memory bounded
  return false;
}

function clientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null
  );
}

function countLinks(text) {
  return (text.match(/(https?:\/\/|www\.)/gi) || []).length;
}

const reject = (message, status = 400) =>
  NextResponse.json({ message }, { status });

export async function POST(req) {
  try {
    const {
      postId,
      author,
      text,
      parent,
      email,
      hp_field, // honeypot: hidden field, only bots fill it
      elapsedMs // time between opening the form and sending it
    } = await req.json();

    if (!author?.trim() || !text?.trim()) {
      return reject("Name and comment are required");
    }

    // Bots: hidden field filled in, or the form was "filled" too fast.
    if (hp_field || !(Number(elapsedMs) >= MIN_FILL_TIME_MS)) {
      return reject(
        "Não foi possível enviar o comentário. Aguarde alguns segundos e tente novamente."
      );
    }

    if (author.length > MAX_AUTHOR_LENGTH) {
      return reject(`O nome pode ter no máximo ${MAX_AUTHOR_LENGTH} caracteres.`);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return reject(
        `O comentário pode ter no máximo ${MAX_TEXT_LENGTH} caracteres.`
      );
    }

    const authorEmail = normalizeEmail(email);
    if (authorEmail === undefined) {
      return reject("E-mail inválido.");
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes("telegram") || lowerText.includes("business")) {
      return reject("Spam detected.");
    }
    if (countLinks(text) > MAX_LINKS) {
      return reject("Comentários com muitos links não são permitidos.");
    }

    if (isRateLimited(clientIp(req))) {
      return reject(
        "Você enviou muitos comentários em pouco tempo. Tente novamente em alguns minutos.",
        429
      );
    }

    // One query: the post must exist, the parent (if any) must be a comment
    // of the same post, and the same text must not have just been posted.
    const context = await client.fetch(
      `{
        "post": *[_type == "post" && _id == $postId][0]{ _id, title, "slug": slug.current },
        "parent": *[_type == "comment" && _id == $parent && post._ref == $postId][0]{ _id, author, text },
        "duplicate": count(*[_type == "comment" && post._ref == $postId && author == $author && text == $text && createdAt > $since]) > 0
      }`,
      {
        postId: postId || "",
        parent: parent || "",
        author,
        text,
        since: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    );
    if (!context?.post) {
      return reject("Post não encontrado.", 404);
    }
    if (parent && !context.parent) {
      return reject("O comentário que você está respondendo não existe mais.", 404);
    }
    if (context.duplicate) {
      return reject("Este comentário já foi enviado.", 409);
    }

    const commentData = {
      _type: "comment",
      post: { _type: "reference", _ref: postId },
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    if (parent) {
      commentData.parent = { _type: "reference", _ref: parent }; // ✅ Store reply reference
    }

    // The public comment never contains the email.
    const comment = await client.create(commentData);
    const siteUrl = process.env.SITE_URL || new URL(req.url).origin;

    // The comment is saved from here on: nothing below may turn this into an
    // error response.
    let threadId = comment._id;
    if (parent) {
      try {
        threadId = await findThreadRootId(client, postId, parent);
      } catch (threadError) {
        console.error("Could not find the thread root:", threadError);
        threadId = parent;
      }
    }

    // Tell the site owner about every new comment.
    try {
      await notifyAdmin({
        comment,
        post: context.post,
        parentComment: context.parent,
        authorEmail,
        siteUrl
      });
    } catch (adminError) {
      console.error("Error sending the admin notification:", adminError);
    }

    // Store the email privately (dot in the _id = not publicly readable),
    // encrypted, plus an HMAC for comparisons. Never store it in plaintext.
    // The comment is already saved: a failure here only means no notifications.
    if (authorEmail) {
      try {
        const emailEncrypted = encryptEmail(authorEmail);
        const emailHash = hashEmail(authorEmail);
        await client.createOrReplace({
          _id: `${PRIVATE_EMAIL_PREFIX}${comment._id}`,
          _type: "commentEmail",
          emailEncrypted,
          emailHash,
          author,
          commentId: comment._id,
          postId,
          threadId,
          subscribed: true,
          unsubscribeToken: randomUUID(),
          createdAt: comment.createdAt
        });
      } catch (emailError) {
        console.error(
          `Commenter email NOT stored for comment ${comment._id}: ${emailError.message}` +
            (emailError instanceof EmailCryptoConfigError
              ? " (set EMAIL_ENCRYPTION_KEY and EMAIL_HASH_KEY in the environment)"
              : "")
        );
      }
    }

    // Notify everyone in the thread. A failure here must not fail the comment.
    if (parent) {
      try {
        await notifyThreadParticipants({
          client,
          threadId,
          comment,
          authorEmail,
          siteUrl
        });
      } catch (notifyError) {
        console.error("Error sending comment notifications:", notifyError);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error saving comment:", error);
    return NextResponse.json(
      { error: "Error saving comment" },
      { status: 500 }
    );
  }
}
