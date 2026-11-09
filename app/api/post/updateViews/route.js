import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Add this to your .env file
  apiVersion: "2023-01-01" // Add this line with the latest API version
});

export async function POST(req) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Missing postId" },
        { status: 400 }
      );
    }

    // Fetch current views
    const post = await client.getDocument(postId);
    const currentViews = post?.viewCount || 0;

    // Update the views count in Sanity
    await client
      .patch(postId)
      .set({ viewCount: currentViews + 1 })
      .commit();

    return NextResponse.json(
      { viewCount: currentViews + 1 },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating views:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
