// Called by the Sanity webhook when content changes.
//
// IMPORTANT (cost): this route used to call revalidatePath('/', 'layout') on
// every webhook, purging the ISR cache of the WHOLE site. Since every post view
// and like patches the post document (viewCount/likes), the webhook fired on
// almost every visit and every page had to be regenerated again and again,
// blowing the Vercel "ISR Writes" quota. Now only the affected pages are purged.
// The webhook filter in Sanity should also ignore view/like-only changes:
//   _type in ["post", "author", "category", "settings"] && !delta::changedOnly((viewCount, likes))
// Projection:
//   {_type, "slug": slug.current}

import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = {
  _type?: string;
  slug?: string | { current?: string }; // string with the projection above, object if no projection
  path?: string; // legacy projection
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SANITY_REVALIDATE_SECRET) {
      return new Response(
        "Missing environment variable SANITY_REVALIDATE_SECRET",
        { status: 500 }
      );
    }

    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    );

    if (!isValidSignature) {
      const message = "Invalid signature";
      return new Response(JSON.stringify({ message, isValidSignature, body }), {
        status: 401
      });
    }
    if (!body?._type && !body?.path) {
      const message = "Bad Request";
      return new Response(JSON.stringify({ message, body }), { status: 400 });
    }

    const revalidated: string[] = [];
    const purge = (path: string, type?: "page" | "layout") => {
      revalidatePath(path, type);
      revalidated.push(type ? `${path} (${type})` : path);
    };

    const slug =
      typeof body.slug === "string" ? body.slug : body.slug?.current;

    switch (body._type) {
      case "post":
        // The post itself + the pages that list posts.
        if (slug) purge(`/post/${slug}`);
        purge("/");
        purge("/category/[category]", "page");
        purge("/author/[author]", "page");
        purge("/year/[year]", "page");
        break;
      case "category":
        purge("/category/[category]", "page");
        purge("/post/[slug]", "page");
        purge("/");
        break;
      case "author":
        purge("/author/[author]", "page");
        purge("/post/[slug]", "page");
        purge("/");
        break;
      case "settings":
        // Site-wide settings (title, menu, footer...): rare, purge everything.
        purge("/", "layout");
        break;
      default:
        // Legacy projection that only sends a path.
        if (body.path) {
          purge(body.path);
          purge("/");
        }
    }

    return NextResponse.json({ body, revalidated });
  } catch (err: any) {
    console.error(err);
    return new Response(err.message, { status: 500 });
  }
}
