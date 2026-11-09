import Link from "next/link";
import Container from "@/components/container";
import PostList from "@/components/postlist";
import Sidebar from "@/components/sidebar2";

export default function Year(props) {
  const { posts, year } = props;
  return (
    <div
      style={{
        backgroundColor: "rgb(0, 0, 0, 0.1)",
        marginTop: "32px",
        borderRadius: "15px",
      }}
    >
      {posts && (
        <Container>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-brand-primary text-3xl font-semibold tracking-tight dark:text-white lg:text-5xl lg:leading-tight">
              {"Postagens de "}
              {year}
            </h1>
            <p className="mb-[20px] mt-1 text-gray-600">
              {posts.length} {posts.length === 1 ? "Postagem" : "Postagens"}
            </p>
          </div>
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
            <Link
              href="/"
              className="relative inline-flex items-center gap-1 rounded-2xl border border-gray-300 bg-white px-3 py-2 pl-4 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
            >
              <span>Voltar para a Página Inicial</span>
            </Link>
          </div>
        </Container>
      )}
    </div>
  );
}
