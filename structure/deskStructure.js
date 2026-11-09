// src/structure/deskStructure.js
import S from "@sanity/desk-tool/structure-builder";
import { MdComment } from "react-icons/md";
import { FaRegFileAlt } from "react-icons/fa"; // Optional icon for posts

// Create a custom view for comments grouped by post
export const structure = S.list()
  .title("Content")
  .items([
    S.listItem()
      .title("Posts")
      .schemaType("post") // The schema type for your post document
      .icon(FaRegFileAlt)
      .child(
        S.documentTypeList("post") // Display the posts in the list
          .title("Posts")
          .child(
            postId =>
              S.documentList()
                .title("Comments")
                .filter(
                  `_type == "comment" && references("${postId}")`
                ) // Filter comments by post
          )
      ),
    S.listItem()
      .title("Comments") // Show all comments, regardless of post
      .schemaType("comment")
      .icon(MdComment)
      .child(S.documentList("comment").title("All Comments")) // View for all comments
  ]);
