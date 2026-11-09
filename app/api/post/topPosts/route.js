import { groq } from "next-sanity";
import { NextResponse } from "next/server"; // Import NextResponse
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url"; // Import imageUrlBuilder

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2023-01-01",
});

// Create imageUrlBuilder instance
const builder = imageUrlBuilder(client);

export async function GET(req) {
  try {
    const query = groq`
      *[_type == "post"] | order(viewCount desc)[0..4] {
        title,
        slug,
        viewCount,
        mainImage {
          asset->{
            _id,
            url
          },
          alt
        }
      }
    `;

    const posts = await client.fetch(query);

    // Add image URLs to each post
    const postsWithImages = posts.map((post) => {
      const imageUrl = post.mainImage?.asset
        ? builder.image(post.mainImage.asset).url()
        : null;
      return { ...post, imageUrl };
    });

    return NextResponse.json(postsWithImages, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch top posts" },
      { status: 500 }
    );
  }
}

export const revalidate = 3600;
