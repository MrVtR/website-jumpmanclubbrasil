import Image from "next/image";
import Link from "next/link";
import { cx } from "@/utils/all";
import { urlForImage } from "@/lib/sanity/image";
import { parseISO, format } from "date-fns";
import { PhotoIcon } from "@heroicons/react/24/outline";
import CategoryLabel from "@/components/blog/category";
import { ptBR } from "date-fns/locale";
import LikeButton from "@/components/LikeButton";
export default function PostList({
  post,
  aspect,
  minimal,
  pathPrefix,
  preloadImage,
  fontSize,
  fontWeight,
  maxHeight,
}) {
  const imageProps = post?.mainImage ? urlForImage(post.mainImage) : null;
  const heightControl = maxHeight === "190px" ? true : false;
  const AuthorimageProps = post?.author?.image
    ? urlForImage(post.author.image)
    : null;

  const view = post?.viewCount ? post.viewCount : 0;
  const comments = post?.commentCount ? post.commentCount : 0;
  const likes = post?.likes ? post.likes : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between" /* Distributes content evenly */,
        flex: "1" /* Ensures equal width distribution */,
      }}
    >
      <div
        className={cx(
          "group cursor-pointer",
          minimal && "grid gap-10 md:grid-cols-2"
        )}
        style={{
          margin: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className={cx(
            " overflow-hidden rounded-md  transition-all hover:scale-105   dark:bg-gray-800"
          )}
          style={{
            display: "inline-block",
          }}
        >
          <Link prefetch={false}
            className={cx(
              "landscape relative block", // Centers content
              aspect === "landscape"
                ? "aspect-video"
                : aspect === "custom"
                  ? "aspect-[5/4]"
                  : "aspect-square"
            )}
            href={`/post/${pathPrefix ? `${pathPrefix}/` : ""}${post.slug?.current}`}
          >
            {imageProps && heightControl ? (
              <div className="align-center flex justify-center xs:h-[400px] lg:h-[190px]">
                <img
                  src={imageProps.src}
                  alt={post.mainImage?.alt || "Thumbnail"}
                  className="transition-all"
                  style={{ objectFit: "contain", width: "auto" }}
                />
              </div>
            ) : imageProps && !heightControl ? (
              <div className="align-center flex justify-center xs:h-[400px] lg:h-[310px]">
                <img
                  src={imageProps.src}
                  alt={post.mainImage?.alt || "Thumbnail"}
                  className="transition-all"
                  style={{ objectFit: "contain", width: "auto" }}
                />
              </div>
            ) : (
              <span className="h-16 w-16 text-gray-200">
                <PhotoIcon />
              </span>
            )}
          </Link>
        </div>

        <div className={cx(minimal && "flex items-center")}>
          <div>
            <CategoryLabel categories={post.categories} nomargin={minimal} />
            <h2 className="mt-2 text-center text-xl font-semibold leading-snug tracking-tight dark:text-white">
              <Link prefetch={false}
                href={`/post/${pathPrefix ? `${pathPrefix}/` : ""}${
                  post.slug?.current
                }`}
              >
                <span
                  className="bg-gradient-to-r from-green-200 to-green-100 bg-[length:0px_10px] bg-left-bottom
      bg-no-repeat
      transition-[background-size]
      duration-500
      hover:bg-[length:100%_3px] group-hover:bg-[length:100%_10px] dark:from-purple-800 dark:to-purple-900"
                >
                  {post.title}
                </span>
              </Link>
            </h2>

            <div className="hidden">
              {post.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                  <Link prefetch={false}
                    href={`/post/${
                      pathPrefix ? `${pathPrefix}/` : ""
                    }${post.slug?.current}`}
                  >
                    {post.excerpt}
                  </Link>
                </p>
              )}
            </div>

            <div className=" flex flex-col items-center justify-center gap-2 py-4 text-gray-500 dark:text-gray-400">
              <Link prefetch={false} href={`/author/${post.author?.slug?.current}`}>
                <div className="flex items-center justify-center gap-3">
                  <div className="relative h-5 w-5 flex-shrink-0">
                    {post.author?.image && (
                      <Image
                        src={AuthorimageProps.src}
                        loader={AuthorimageProps.loader}
                        alt={post?.author?.name}
                        className="rounded-full object-cover"
                        fill
                        sizes="20px"
                      />
                    )}
                  </div>
                  <span className="truncate text-[14px] text-sm">
                    {post.author?.name}
                  </span>
                </div>
              </Link>
              <time
                className="text-[14px] text-gray-500 dark:text-gray-400"
                dateTime={post?.publishedAt || post._createdAt}
              >
                {format(
                  parseISO(post?.publishedAt || post._createdAt),
                  "dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR }
                )}
              </time>
            </div>
          </div>
        </div>
      </div>
      <div
        className="align-center mt-[10px] flex w-full flex-row justify-between"
        style={{ padding: "0 20px" }}
      >
        <div className="align-center flex flex-row justify-center gap-2 pl-0 pr-5">
          <div className="align-center flex flex-row justify-center gap-2">
            <img src="/static/eye.webp" alt="" className="h-[22px]" />
            <p className="h-[22px]">{view}</p>
          </div>
          <div className="align-center flex flex-row justify-center gap-2">
            <img src="/static/comment.webp" alt="" className="h-[22px]" />
            <p className="h-[22px]">{comments}</p>
          </div>
        </div>
        <LikeButton postId={post._id} initialLikes={likes} />
      </div>
    </div>
  );
}
