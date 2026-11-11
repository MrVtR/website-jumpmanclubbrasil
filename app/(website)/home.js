import Link from "next/link";
import Container from "@/components/container";
import PostList from "@/components/postlist";

export default function Post({ posts }) {
  return (
    <div
      style={{
        backgroundColor: "rgb(0, 0, 0, 0.1)",
        marginTop: "32px",
        borderRadius: "15px",
      }}
    >
      {posts && (
        <Container className="xxs:px-0">
          <div className="align-stretch mt-3 flex grid  md:grid-cols-2 lg:gap-[10px] xl:grid-cols-2">
            {posts.slice(0, 8).map((post) => (
              <PostList
                key={post._id}
                post={post}
                aspect="landscape"
                maxHeight="310px"
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link prefetch={false}
              href="/archive"
              className="relative inline-flex items-center gap-1 rounded-2xl border border-gray-300 bg-white px-3 py-2 pl-4 text-sm font-medium text-gray-500 hover:bg-gray-300 focus:z-20 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-300 dark:hover:text-gray-500"
            >
              <span>Ver todas as postagens</span>
            </Link>
          </div>
        </Container>
      )}
    </div>
  );
}
