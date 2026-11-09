// Private storage for commenter emails. Documents are created by
// /api/submitComment with an _id like "commentEmail.<commentId>"; the dot in
// the _id keeps them out of public (unauthenticated) queries.
// The address is never stored in plaintext: it is encrypted (emailEncrypted)
// and hashed (emailHash) server-side — see lib/emailCrypto.js.
export default {
  name: "commentEmail",
  type: "document",
  title: "Comment Emails (private)",
  readOnly: true,
  fields: [
    {
      name: "emailEncrypted",
      type: "string",
      title: "Email (encrypted)",
      description: "AES-256-GCM",
      readOnly: true
    },
    {
      name: "emailHash",
      type: "string",
      title: "Email hash",
      description: "HMAC-SHA-256 of the normalized email, used for matching",
      readOnly: true
    },
    // Legacy plaintext field (docs created before encryption). Removed by
    // scripts/migrate-comment-emails.mjs; kept hidden so old docs don't show
    // "unknown field" warnings.
    { name: "email", type: "string", title: "Email (legacy)", hidden: true },
    { name: "author", type: "string", title: "Author" },
    { name: "commentId", type: "string", title: "Comment ID" },
    { name: "postId", type: "string", title: "Post ID" },
    { name: "threadId", type: "string", title: "Thread (top-level comment) ID" },
    { name: "subscribed", type: "boolean", title: "Receives notifications" },
    { name: "unsubscribeToken", type: "string", title: "Unsubscribe token", hidden: true },
    { name: "createdAt", type: "datetime", title: "Created At" }
  ],
  preview: {
    select: { title: "author", subtitle: "createdAt" }
  }
};
