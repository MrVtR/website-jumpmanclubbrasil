import Year from "./year";
import { getAllYears, getPostsByYear } from "@/lib/sanity/client";

// Pre-render one page per year that has posts, so year pages are served from
// the cache (ISR, same revalidation as the rest of the site) instead of being
// rendered on every visit. A year added later is rendered on its first visit
// and cached from then on.
export async function generateStaticParams() {
  const posts = await getAllYears();
  const years = new Set(
    (Array.isArray(posts) ? posts : [])
      .map(post => post?.publishedAt?.slice(0, 4))
      .filter(year => /^\d{4}$/.test(year || ""))
  );
  return [...years].map(year => ({ year }));
}

export default async function YearPage({ params }) {
  const year = parseInt(params.year, 10);
  const posts = await getPostsByYear(year);
  return <Year posts={posts} year={year} />;
}
