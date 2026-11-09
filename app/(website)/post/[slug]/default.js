"use client";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/container";
import { PortableText } from "@/lib/sanity/plugins/portabletext";
import { urlForImage } from "@/lib/sanity/image";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Correct import
import CategoryLabel from "@/components/blog/category";
import AuthorCard from "@/components/blog/authorCard";
import { getPostBySlug, getCommentsByPostId } from "@/lib/sanity/client";
import CommentSection from "@/components/CommentSection";

const STATIC_IMAGES = [
  {
    src: "/static/image1.png",
    linkKey: "downloadLink1",
    captionKey: "caption1",
  },
  {
    src: "/static/image2.png",
    linkKey: "downloadLink2",
    captionKey: "caption2",
  },
  {
    src: "/static/image3.png",
    linkKey: "downloadLink3",
    captionKey: "caption3",
  },
  {
    src: "/static/image4.png",
    linkKey: "downloadLink4",
    captionKey: "caption4",
  },
  {
    src: "/static/image5.png",
    linkKey: "downloadLink5",
    captionKey: "caption5",
  },
];

export default function Post(props) {
  const { post } = props;
  const slug = post?.slug;
  const [views, setViews] = useState(post.viewCount || 0);
  const router = useRouter(); // ✅ Corrected import
  const [loadingViews, setLoadingViews] = useState(true); // New loading state for views

  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([]);
  // ✅ Fetch comments dynamically on component mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getCommentsByPostId(post._id);
        console.log(fetchedComments);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };

    fetchComments();
  }, [post._id]); // ✅ Depend on post ID to trigger fetch

  useEffect(() => {
    const updateViews = async () => {
      try {
        const response = await fetch("/api/post/updateViews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post._id }),
        });

        if (!response.ok) throw new Error("Failed to update views");

        const data = await response.json();
        setViews(data.viewCount);
        setLoadingViews(false); // Mark as loaded once API response is received
      } catch (error) {
        console.error("Error updating views:", error);
        setLoadingViews(false); // Set loading to false even if there's an error
      }
    };

    updateViews();
  }, [router.pathname]); // Use the pathname as a dependency to trigger the update

  const imageProps = post?.mainImage ? urlForImage(post?.mainImage) : null;

  const AuthorimageProps = post?.author?.image
    ? urlForImage(post.author.image)
    : null;

  return (
    <div
      style={{
        backgroundColor: "rgb(0, 0, 0, 0.1)",
        borderRadius: "15px",
        padding: "0 20px 20px 20px",
      }}
      className="my-8"
    >
      <Container>
        <div className="mx-auto max-w-screen-md ">
          <div className="flex justify-center">
            <CategoryLabel categories={post.categories} />
          </div>
          <h1 className="text-brand-primary mb-3 mt-2 text-center text-3xl font-semibold tracking-tight dark:text-white lg:text-4xl lg:leading-snug">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-col items-center justify-center space-x-3 text-gray-500 ">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                {AuthorimageProps && (
                  <Link href={`/author/${post.author.slug.current}`}>
                    <Image
                      src={AuthorimageProps.src}
                      alt={post?.author?.name}
                      className="rounded-full object-cover"
                      fill
                      sizes="40px"
                    />
                  </Link>
                )}
              </div>
              <div>
                <p className="text-gray-800 dark:text-gray-400">
                  <Link href={`/author/${post.author.slug.current}`}>
                    {post.author.name}
                  </Link>
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <time
                    className="text-gray-500 dark:text-gray-400"
                    dateTime={post?.publishedAt || post._createdAt}
                  >
                    {format(
                      parseISO(post?.publishedAt || post._createdAt),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </time>
                  <span>· {post.estReadingTime || "5"} min read</span>
                </div>
              </div>
            </div>
            <p className="self-end text-[14px] lg:text-[16px]">
              {loadingViews
                ? ""
                : `👀 ${views} ${views === 1 ? "visualização" : "visualizações"}`}
            </p>
          </div>
        </div>
      </Container>

      <div className="relative z-0 mx-auto flex max-w-screen-lg items-center justify-center overflow-hidden lg:rounded-lg">
        {imageProps && (
          <Image
            src={imageProps.src}
            alt={post.mainImage?.alt || "Thumbnail"}
            loading="eager"
            width={Math.floor(
              imageProps.height * ((imageProps.width / imageProps.height) * 0.8)
            )} // Calculate width based on 70% height and aspect ratio
            height={Math.floor(imageProps.height * 0.8)} // Set the image height to 70% of the original height
            className="object-contain"
          />
        )}
      </div>

      <Container>
        <article className="mx-auto max-w-screen-md ">
          <div className="prose mx-auto max-w-screen-md dark:prose-invert prose-a:text-blue-600">
            {post.body && <PortableText value={post.body} />}
            <div
              className="grid grid-cols-2 items-center justify-center gap-4"
              style={{
                columnGap: "3rem",
              }}
            >
              {post.tags &&
                post.tags.map((tag) => (
                  <div key={tag}>
                    <img
                      src={`/profile/${tag}.png`}
                      alt={`Profile ${tag}`}
                      style={{
                        display: "block",
                        marginTop: "-20px",
                      }}
                    />
                  </div>
                ))}
            </div>
            {post.body2 && <PortableText value={post.body2} />}
            {post.downloadLink1 && (
              <img src="/static/baixar.png" alt="DownloadLabel" />
            )}
            <div
              className="grid grid-cols-2 items-center justify-center gap-4"
              style={{
                marginTop: "-50px",
              }}
            >
              {STATIC_IMAGES.map(
                (image, index) =>
                  post[image.linkKey] && (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center"
                    >
                      <a
                        href={post[image.linkKey]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-center"
                      >
                        <img
                          src={image.src}
                          alt={`Download ${index + 1}`}
                          className="mb-2"
                        />
                      </a>
                      {post[image.captionKey] && (
                        <figcaption
                          className="prose text-lg font-bold text-gray-800 dark:text-gray-400"
                          style={{
                            marginTop: "0px",
                          }}
                        >
                          {post[image.captionKey]}
                        </figcaption>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="relative inline-flex items-center gap-1 rounded-2xl border border-gray-300 bg-white px-3 py-2 pl-4 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
            >
              <span>Voltar para a Página Inicial</span>
            </Link>
          </div>
          {post.author && <AuthorCard author={post.author} />}
        </article>
      </Container>
      <CommentSection postId={post._id} comments={comments} />
    </div>
  );
}
