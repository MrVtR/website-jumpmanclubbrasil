import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";
import {
  PRIVATE_EMAIL_PREFIX,
  findThreadRootId,
  normalizeEmail,
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

export async function POST(req) {
  try {
    const { postId, author, text, parent, email } = await req.json();

    if (!author?.trim() || !text?.trim()) {
      return NextResponse.json(
        { message: "Name and comment are required" },
        { status: 400 }
      );
    }

    const authorEmail = normalizeEmail(email);
    if (authorEmail === undefined) {
      return NextResponse.json(
        { message: "E-mail inválido." },
        { status: 400 }
      );
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes("telegram") || lowerText.includes("business")) {
      return NextResponse.json(
        { message: "Spam detected." },
        { status: 400 }
      );
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

    const threadId = parent
      ? await findThreadRootId(client, postId, parent)
      : comment._id;

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
          siteUrl: process.env.SITE_URL || new URL(req.url).origin
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
