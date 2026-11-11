import { Resend } from "resend";
import {
  assertEmailCryptoConfigured,
  hashEmail,
  storedEmailAddress,
  storedEmailHash
} from "@/lib/emailCrypto";
import {
  ancestorsOf,
  branchView,
  indexComments,
  loadPostComments,
  renderThreadEmail
} from "@/lib/commentThread";

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
 * Emails the site owner about every new comment (top-level or reply), with the
 * branch of the thread down to the new comment, a link straight to it on the
 * site to reply there, and a link to it in the Studio. Skipped when the owner
 * is the one commenting.
 */
export async function notifyAdmin({
  comment,
  post,
  threadComments,
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
  const isReply = Boolean(comment.parent?._ref);
  const notified = authorEmail
    ? "Sim, a pessoa deixou e-mail e será avisada se alguém responder."
    : "Não, a pessoa não deixou e-mail.";

  // Everything above the new comment in its branch, plus the comment itself.
  const index = indexComments(withComment(threadComments, comment));
  const thread = renderThreadEmail(index, branchView(index, [comment._id]), {
    highlightId: comment._id
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from,
      to: [admin],
      subject: `${isReply ? "Nova resposta" : "Novo comentário"} em "${postTitle}" — ${comment.author}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <p><strong>${escapeHtml(comment.author)}</strong> ${isReply ? "respondeu um comentário" : "comentou"} em <strong>${escapeHtml(postTitle)}</strong>.</p>
          ${isReply ? `<p style="margin: 16px 0 8px; color: #666;">Conversa até a nova resposta:</p>` : ""}
          ${thread.html}
          <p style="margin-top: 16px;">
            <a href="${escapeHtml(commentUrl)}" style="display: inline-block; padding: 10px 16px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 6px;">Responder no site</a>
            &nbsp;
            <a href="${escapeHtml(studioUrl)}">Abrir no Studio</a>
          </p>
          <p style="font-size: 12px; color: #666;">Avisado por e-mail se você responder? ${escapeHtml(notified)}</p>
        </div>`,
      text: `${comment.author} ${isReply ? "respondeu um comentário" : "comentou"} em "${postTitle}".\n\n${thread.text}\n\nResponder no site: ${commentUrl}\nAbrir no Studio: ${studioUrl}\n\nAvisado por e-mail se você responder? ${notified}`,
      tags: [{ name: "category", value: "comment-admin" }]
    },
    { idempotencyKey: `comment-admin/${comment._id}` }
  );
  if (error) {
    console.error("Failed to send the admin notification:", error);
  }
}

// The just-created comment may not be in a list loaded before it existed.
function withComment(threadComments, comment) {
  const list = Array.isArray(threadComments) ? [...threadComments] : [];
  if (!list.some(c => c._id === comment._id)) {
    list.push({
      _id: comment._id,
      author: comment.author,
      text: comment.text,
      createdAt: comment.createdAt,
      parent: comment.parent?._ref || null
    });
  }
  return list;
}

/**
 * Emails the people whose comments are ABOVE the new reply in its branch
 * (its parent, grandparent... up to the top-level comment), except the reply's
 * author and the site owner (who gets notifyAdmin). People in other branches
 * of the same thread are not emailed.
 *
 * Each email shows that person's branch view: for each of their comments in
 * the thread, everything above it, it, and everything below it (siblings are
 * left out) — see lib/commentThread.js.
 */
export async function notifyThreadParticipants({
  client,
  threadId,
  comment,
  authorEmail,
  siteUrl,
  threadComments
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

  const [emailDocs, post, loadedComments] = await Promise.all([
    client.fetch(
      `*[_type == "commentEmail" && threadId == $threadId] | order(createdAt asc){ commentId, subscribed, emailHash, emailEncrypted, email, unsubscribeToken }`,
      { threadId }
    ),
    client.fetch(`*[_id == $postId][0]{ title, "slug": slug.current }`, {
      postId: comment.post._ref
    }),
    threadComments ? null : loadPostComments(client, comment.post._ref)
  ]);

  const index = indexComments(withComment(threadComments || loadedComments, comment));
  const above = new Set(ancestorsOf(index, comment._id));
  if (above.size === 0) return; // top-level comment: nobody above it

  const authorHash = authorEmail ? hashEmail(authorEmail) : null;
  // The site owner already gets every comment through notifyAdmin().
  const admin = getAdminEmail();
  const adminHash = admin ? hashEmail(admin) : null;

  // Group the stored emails by person (emailHash). A person may have several
  // comments in the thread; unsubscribing turns off all of them at once.
  const people = new Map(); // hash -> { commentIds, docs (subscribed) }
  for (const doc of emailDocs || []) {
    let hash;
    try {
      hash = storedEmailHash(doc);
    } catch (hashError) {
      console.error("Could not hash a stored comment email:", hashError.message);
      continue;
    }
    if (!hash || hash === authorHash || hash === adminHash) continue;
    if (!people.has(hash)) people.set(hash, { commentIds: new Set(), docs: [] });
    const person = people.get(hash);
    if (doc.commentId) person.commentIds.add(doc.commentId);
    if (doc.subscribed !== false) person.docs.push(doc);
  }

  const postTitle = post?.title || "um post";
  const postUrl = post?.slug ? `${siteUrl}/post/${post.slug}` : siteUrl;
  // Opens the post scrolled to the new reply, highlighted (see CommentSection).
  const commentUrl = `${postUrl}#comment-${comment._id}`;
  const subject = `Nova resposta na conversa em "${postTitle}"`;

  // Each recipient gets their own email (with their own branch view), so
  // addresses are never exposed to each other. Decryption happens only here.
  const emails = [];
  for (const person of people.values()) {
    const isAbove = [...person.commentIds].some(id => above.has(id));
    if (!isAbove || person.docs.length === 0) continue;

    let address = null;
    let token = null;
    for (const doc of person.docs) {
      try {
        address = storedEmailAddress(doc);
        token = doc.unsubscribeToken;
        if (address) break;
      } catch (decryptError) {
        // Wrong key or corrupted value; another doc of the same person may work.
        console.error("Could not decrypt a stored comment email:", decryptError.message);
      }
    }
    if (!address) continue;

    const thread = renderThreadEmail(index, branchView(index, [...person.commentIds]), {
      highlightId: comment._id,
      ownIds: person.commentIds
    });
    const unsubscribeUrl = `${siteUrl}/api/comments/unsubscribe?token=${encodeURIComponent(token)}`;
    emails.push({
      from,
      to: [address],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
          <p><strong>${escapeHtml(comment.author)}</strong> respondeu em uma conversa da qual você participa em <strong>${escapeHtml(postTitle)}</strong>:</p>
          ${thread.html}
          <p style="margin-top: 16px;">
            <a href="${escapeHtml(commentUrl)}" style="display: inline-block; padding: 10px 16px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 6px;">Ver a conversa</a>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
          <p style="font-size: 12px; color: #666;">Você recebeu este e-mail porque comentou nesta conversa.
          <a href="${escapeHtml(unsubscribeUrl)}">Parar de receber avisos desta conversa</a>.</p>
        </div>`,
      text: `${comment.author} respondeu em uma conversa da qual você participa em "${postTitle}":\n\n${thread.text}\n\nVer a conversa: ${commentUrl}\n\nParar de receber avisos desta conversa: ${unsubscribeUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`
      },
      tags: [{ name: "category", value: "comment-reply" }]
    });
  }
  if (emails.length === 0) return;

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
