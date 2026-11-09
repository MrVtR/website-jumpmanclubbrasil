// Private storage for commenter emails. Documents are created by
// /api/submitComment with an _id like "commentEmail.<commentId>"; the dot in
// the _id keeps them out of public (unauthenticated) queries.
export default {
  name: "commentEmail",
  type: "document",
  title: "Comment Emails (private)",
  readOnly: true,
  fields: [
    { name: "email", type: "string", title: "Email" },
    { name: "author", type: "string", title: "Author" },
    { name: "commentId", type: "string", title: "Comment ID" },
    { name: "postId", type: "string", title: "Post ID" },
    { name: "threadId", type: "string", title: "Thread (top-level comment) ID" },
    { name: "subscribed", type: "boolean", title: "Receives notifications" },
    { name: "unsubscribeToken", type: "string", title: "Unsubscribe token", hidden: true },
    { name: "createdAt", type: "datetime", title: "Created At" }
  ],
  preview: {
    select: { title: "email", subtitle: "author" }
  }
};
