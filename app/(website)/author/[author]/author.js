import Container from "@/components/container";
import { PortableText } from "@/lib/sanity/plugins/portabletext";
import { urlForImage } from "@/lib/sanity/image";
import PostList from "@/components/postlist";
import Image from "next/image";
import { notFound } from "next/navigation";

export default function Author(props) {
  const { loading, posts, author } = props;

  const slug = author?.slug;

  if (!loading && !slug) {
    notFound();
  }

  return (
    <>
      <Container>
        <div
          style={{
            backgroundColor: "rgb(0, 0, 0, 0.1)",
            marginTop: "32px",
            padding: "0 10px 20px 10px",
            borderRadius: "15px",
          }}
        >
          <div className="flex flex-col items-center justify-center pt-[20px]">
            <div className="relative h-20 w-20 overflow-hidden rounded-full">
              {author?.image && (
                <Image
                  src={urlForImage(author.image).src}
                  alt={author.name || " "}
                  fill
                  sizes="(max-width: 320px) 100vw, 320px"
                  className="object-cover"
                />
              )}
            </div>
            <h1 className="text-brand-primary mt-2 text-3xl font-semibold tracking-tight dark:text-white lg:text-3xl lg:leading-tight">
              {author.name}
            </h1>
            <div className="mx-auto mt-2 flex max-w-xl flex-col px-5 text-center text-gray-500">
              {author.bio && <PortableText value={author.bio} />}
            </div>
          </div>

          <div className="align-stretch mt-3 flex grid  md:grid-cols-2 lg:gap-[10px] xl:grid-cols-3">
            {posts.map((post) => (
              <PostList
                key={post._id}
                post={post}
                aspect="landscape"
                maxHeight="190px"
              />
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
