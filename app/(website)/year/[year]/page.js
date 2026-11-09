import Year from "./year";
import { getPostsByYear } from "@/lib/sanity/client";

export default async function YearPage({ params }) {
  const year = parseInt(params.year, 10);
  const posts = await getPostsByYear(year);
  return <Year posts={posts} year={year} />;
}

// export const revalidate = 60;
