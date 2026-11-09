export default {
  name: "post",
  title: "Post",
  type: "document",
  initialValue: () => ({
    publishedAt: new Date().toISOString()
  }),
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string"
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96
      }
    },
    {
      name: "excerpt",
      title: "Excerpt",
      description:
        "The excerpt is used in blog feeds, and also for search results",
      type: "text",
      rows: 3,
      validation: Rule => Rule.max(200)
    },
    {
      name: "author",
      title: "Author",
      type: "reference",
      to: { type: "author" }
    },
    {
      name: "mainImage",
      title: "Main image",
      type: "image",
      fields: [
        // {
        //   name: "caption",
        //   type: "string",
        //   title: "Image caption",
        //   description: "Appears below image.",

        // },
        {
          name: "alt",
          type: "string",
          title: "Alternative text",
          description: "Important for SEO and accessiblity."
        }
      ],
      options: {
        hotspot: true
      }
    },
    {
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: { type: "category" } }]
    },
    {
      name: "publishedAt",
      title: "Published at",
      type: "datetime"
    },
    {
      name: "featured",
      title: "Mark as Featured",
      type: "boolean"
    },
    {
      name: "body",
      title: "Body",
      type: "blockContent"
    },
    {
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "number" }] // Array of integers
    },
    {
      name: "body2",
      title: "Body2",
      type: "blockContent"
    },
    // New Download Links and Captions
    {
      name: "downloadLink1",
      type: "url",
      title: "Download Link 1"
    },
    {
      name: "caption1",
      type: "string",
      title: "Caption for Image 1"
    },
    {
      name: "downloadLink2",
      type: "url",
      title: "Download Link 2"
    },
    {
      name: "caption2",
      type: "string",
      title: "Caption for Image 2"
    },
    {
      name: "downloadLink3",
      type: "url",
      title: "Download Link 3"
    },
    {
      name: "caption3",
      type: "string",
      title: "Caption for Image 3"
    },
    {
      name: "downloadLink4",
      type: "url",
      title: "Download Link 4"
    },
    {
      name: "caption4",
      type: "string",
      title: "Caption for Image 4"
    },
	{
      name: "downloadLink5",
      type: "url",
      title: "Download Link 5"
    },
    {
      name: "caption5",
      type: "string",
      title: "Caption for Image 5"
    },
    {
      name: "viewCount",
      title: "View Count",
      type: "number",
      initialValue: 0
    },{
      name: "likes",
      type: "number",
      title: "Likes",
      initialValue: 0
    }
  ],

  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage"
    },
    prepare(selection) {
      const { author } = selection;
      return Object.assign({}, selection, {
        subtitle: author && `by ${author}`
      });
    }
  }
};
