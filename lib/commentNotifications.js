import { Resend } from "resend";
import {
  assertEmailCryptoConfigured,
  hashEmail,
  storedEmailAddress,
  storedEmailHash
} from "@/lib/emailCrypto";

// Commenter emails are stored in separate "commentEmail" documents whose _id
// contains a dot (e.g. "commentEmail.<commentId>"). In a public Sanity dataset,
// documents with a dot in their _id are NOT publicly readable — they can only
// be read with an authenticated token (server-side). Never put the email on the
// public "comment" document itself.
//
// The address itself is stored encrypted (emailEncrypted, AES-256-GCM) next to
// an HMAC (emailHash) that every comparison uses — see lib/emailCrypto.js.
// Legacy docs with a plaintext `email` field are still handled until they are
// migrated by scripts/migrate-comment-emails.mjs.
export const PRIVATE_EMAIL_PREFIX = "commentEmail.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  if (!value) return null;
  if (value.length > 254 || !EMAIL_REGEX.test(value)) return undefined; // invalid
  return value;
}

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Walks up the parent chain to find the top-level comment of a thread.
 */
export async function findThreadRootId(client, postId, commentId) {
  const comments = await client.fetch(
    `*[_type == "comment" && post._ref == $postId]{ _id, "parent": parent._ref }`,
    { postId }
  );
  const parentOf = new Map(comments.map(c => [c._id, c.parent || null]));

  let current = commentId;
  const seen = new Set();
  while (parentOf.get(current) && !seen.has(current)) {
    seen.add(current);
    current = parentOf.get(current);
  }
  return current;
}

function getFromAddress() {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  // onboarding@resend.dev is a test-only sender: only allowed outside production.
  if (process.env.NODE_ENV !== "production") {
    return "Comentários <onboarding@resend.dev>";
  }
  return null;
}

/** The site owner's inbox for new-comment alerts (COMMENT_ADMIN_EMAIL). */
function getAdminEmail() {
  return normalizeEmail(process.env.COMMENT_ADMIN_EMAIL) || null;
}

/**
 * Emails the site owner about every new comment (top-level or reply), with a
 * link straight to it on the site to reply there, and a link to it in the
 * Studio. Skipped when the owner is the one commenting.
 */
export async function notifyAdmin({
  comment,
  post,
  parentComment,
  authorEmail,
  siteUrl
}) {
  const admin = getAdminEmail();
  if (!admin) return; // feature off
  if (authorEmail && authorEmail === admin) return; // owner's own comment
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set — skipping the admin notification.");
    return;
  }
  const from = getFromAddress();
  if (!from) {
    console.warn("RESEND_FROM_EMAIL is not set — skipping the admin notification.");
    return;
  }

  const postTitle = post?.title || "um post";
  const postUrl = post?.slug ? `${siteUrl}/post/${post.slug}` : siteUrl;
  const commentUrl = `${postUrl}#comment-${comment._id}`;
  const studioUrl = `${siteUrl}/studio/intent/edit/id=${comment._id};type=comment/`;
  const isReply = Boolean(parentComment);
  const notified = authorEmail
    ? "Sim, a pessoa deixou e-mail e será avisada se alguém responder."
    : "Não, a pessoa não deixou e-mail.";

  const parentHtml = isReply
    ? `<p style="margin: 16px 0 4px; color: #666;">Em resposta a <strong>${escapeHtml(parentComment.author)}</strong>:</p>
       <blockquote style="margin: 0 0 16px; padding: 8px 12px; border-left: 4px solid #ccc; color: #666; white-space: pre-wrap;">${escapeHtml(parentComment.text)}</blockquote>`
    : "";
  const parentText = isReply
    ? `Em resposta a ${parentComment.author}:\n${parentComment.text}\n\n`
    : "";

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from,
      to: [admin],
      subject: `${isReply ? "Nova resposta" : "Novo comentário"} em "${postTitle}" — ${comment.author}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <p><strong>${escapeHtml(comment.author)}</strong> ${isReply ? "respondeu um comentário" : "comentou"} em <strong>${escapeHtml(postTitle)}</strong>.</p>
          ${parentHtml}
          <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #22c55e; background: #f6f6f6; white-space: pre-wrap;">${escapeHtml(comment.text)}</blockquote>
          <p>
            <a href="${escapeHtml(commentUrl)}" style="display: inline-block; padding: 10px 16px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 6px;">Responder no site</a>
            &nbsp;
            <a href="${escapeHtml(studioUrl)}">Abrir no Studio</a>
          </p>
          <p style="font-size: 12px; color: #666;">Avisado por e-mail se você responder? ${escapeHtml(notified)}</p>
        </div>`,
      text: `${comment.author} ${isReply ? "respondeu um comentário" : "comentou"} em "${postTitle}".\n\n${parentText}${comment.text}\n\nResponder no site: ${commentUrl}\nAbrir no Studio: ${studioUrl}\n\nAvisado por e-mail se você responder? ${notified}`,
      tags: [{ name: "category", value: "comment-admin" }]
    },
    { idempotencyKey: `comment-admin/${comment._id}` }
  );
  if (error) {
    console.error("Failed to send the admin notification:", error);
  }
}

/**
 * Emails everyone subscribed to the thread (except the new comment's author).
 */
export async function notifyThreadParticipants({
  client,
  threadId,
  comment,
  authorEmail,
  siteUrl
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set — skipping comment notifications.");
    return;
  }
  const from = getFromAddress();
  if (!from) {
    console.warn("RESEND_FROM_EMAIL is not set — skipping comment notifications.");
    return;
  }

  try {
    assertEmailCryptoConfigured();
  } catch (configError) {
    console.error(`Comment notifications skipped: ${configError.message}`);
    return;
  }

  const [subscribers, post] = await Promise.all([
    client.fetch(
      `*[_type == "commentEmail" && threadId == $threadId && subscribed != false] | order(createdAt asc){ emailHash, emailEncrypted, email, unsubscribeToken }`,
      { threadId }
    ),
    client.fetch(`*[_id == $postId][0]{ title, "slug": slug.current }`, {
      postId: comment.post._ref
    })
  ]);

  // One email per person (compared by emailHash; keep the first doc found),
  // never to the new comment's author. Decryption happens only here, right
  // before sending, and the address never leaves this function.
  const authorHash = authorEmail ? hashEmail(authorEmail) : null;
  // The site owner already gets every comment through notifyAdmin().
  const admin = getAdminEmail();
  const adminHash = admin ? hashEmail(admin) : null;
  const recipients = new Map(); // emailHash -> { address, token }
  for (const sub of subscribers) {
    let hash;
    try {
      hash = storedEmailHash(sub);
    } catch (hashError) {
      console.error("Could not hash a stored comment email:", hashError.message);
      continue;
    }
    if (!hash || hash === authorHash || hash === adminHash || recipients.has(hash)) continue;
    let address;
    try {
      address = storedEmailAddress(sub);
    } catch (decryptError) {
      // Wrong key or corrupted value; another doc of the same person may work.
      console.error("Could not decrypt a stored comment email:", decryptError.message);
      continue;
    }
    if (address) recipients.set(hash, { address, token: sub.unsubscribeToken });
  }
  if (recipients.size === 0) return;

  const postTitle = post?.title || "um post";
  const postUrl = post?.slug ? `${siteUrl}/post/${post.slug}` : siteUrl;
  const subject = `Nova resposta na conversa em "${postTitle}"`;

  // Each recipient gets their own email, so addresses are never exposed to each other.
  const emails = [...recipients.values()].map(({ address, token }) => {
    const unsubscribeUrl = `${siteUrl}/api/comments/unsubscribe?token=${encodeURIComponent(token)}`;
    return {
      from,
      to: [address],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <p><strong>${escapeHtml(comment.author)}</strong> comentou em uma conversa da qual você participa em <strong>${escapeHtml(postTitle)}</strong>:</p>
          <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #22c55e; background: #f6f6f6; white-space: pre-wrap;">${escapeHtml(comment.text)}</blockquote>
          <p><a href="${escapeHtml(postUrl)}">Ver a conversa</a></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
          <p style="font-size: 12px; color: #666;">Você recebeu este e-mail porque comentou nesta conversa.
          <a href="${escapeHtml(unsubscribeUrl)}">Parar de receber avisos desta conversa</a>.</p>
        </div>`,
      text: `${comment.author} comentou em uma conversa da qual você participa em "${postTitle}":\n\n${comment.text}\n\nVer a conversa: ${postUrl}\n\nParar de receber avisos desta conversa: ${unsubscribeUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`
      },
      tags: [{ name: "category", value: "comment-reply" }]
    };
  });

  const resend = new Resend(process.env.RESEND_API_KEY);

  // The batch API accepts up to 100 emails per request.
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const { error } = await resend.batch.send(chunk, {
      idempotencyKey: `comment-reply/${comment._id}/${i / 100}`
    });
    if (error) {
      console.error("Failed to send comment notifications:", error);
    }
  }
}
