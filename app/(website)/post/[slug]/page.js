import PostPage from "./default";

import { getAllPostsSlugs, getPostBySlug } from "@/lib/sanity/client";
import { urlForImage } from "@/lib/sanity/image";

export async function generateStaticParams() {
  return await getAllPostsSlugs();
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  const image = urlForImage(post?.mainImage);
  const url = `/post/${params.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    // Link previews (WhatsApp, Discord, X...) show the post's own cover.
    openGraph: {
      type: "article",
      locale: "pt_BR",
      siteName: "JumpmanClub Brasil Traduções",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt || post._createdAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: image
        ? [
            {
              url: image.src,
              width: image.width,
              height: image.height,
              alt: post.mainImage?.alt || post.title
            }
          ]
        : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: image ? [image.src] : undefined
    }
  };
}

export default async function PostDefault({ params }) {
  const post = await getPostBySlug(params.slug);
  return <PostPage post={post} />;
}

// export const revalidate = 60;
