export default {
  name: "comment",
  type: "document",
  title: "Comments",
  fields: [
    {
      name: "post",
      type: "reference",
      to: [{ type: "post" }],
      title: "Post"
    },
    {
      name: "author",
      type: "string",
      title: "Author"
    },
    {
      name: "text",
      type: "text",
      title: "Comment"
    },
    {
      name: "createdAt",
      type: "datetime",
      title: "Created At",
      initialValue: new Date().toISOString()
    },
    {
      name: "parent",
      type: "reference",
      to: [{ type: "comment" }], // ✅ Reference comments for replies
      title: "Parent Comment"
    }    
  ],
  preview: {
    select: {
      title: "author",
      subtitle: "text",
      post: "post.title"
    },
    prepare({ title, subtitle, post }) {
      return {
        title: `${title} (${post})`,
        subtitle: subtitle
      };
    }
  }
};
