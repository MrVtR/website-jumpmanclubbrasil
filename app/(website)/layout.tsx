import "@/styles/tailwind.css";
import { Providers } from "./providers";
import { cx } from "@/utils/all";
import { Inter, Lora, Open_Sans } from "next/font/google";
import { getSettings } from "@/lib/sanity/client";
import Footer from "@/components/footer";
import GetNavbar from "@/components/getnavbar";
import { urlForImage } from "@/lib/sanity/image";
import SidebarRight from "@/components/sidebar2";
import SidebarLeft from "@/components/sidebar";

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'], // Choose the weights you need
  variable: '--font-open-sans', // Optional: Define a CSS variable
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora"
});

async function sharedMetaData(params: any) {
  const settings = await getSettings();

  return {
    // enable this for resolving opengraph images
    // metadataBase: new URL(settings.url),
    title: {
      default:
        settings?.title ||
        "Stablo Pro - Blog Template for Next.js & Sanity CMS",
      template: "%s"
    },
    description:
      settings?.description ||
      "Pro version of Stablo, popular open-source next.js and sanity blog template",
    keywords: ["Next.js", "Sanity", "Tailwind CSS"],
    authors: [{ name: "Surjith" }],
    canonical: settings?.url,
    openGraph: {
      images: [
        {
          url:
            urlForImage(settings?.openGraphImage)?.src ||
            "/img/opengraph.jpg",
          width: 800,
          height: 600
        }
      ]
    },
    twitter: {
      title: settings?.title || "Stablo Template",
      card: "summary_large_image"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export async function generateMetadata({ params }: any) {
  return await sharedMetaData(params);
}

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: any;
}) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(inter.variable, lora.variable,openSans.variable)}>
      <body className="dark:bg-black-800 flex flex-row bg-gray-100 text-gray-800">
        <Providers>
          <div className="flex flex-grow flex-col items-center justify-center">
          {/* <div className="container mx-auto flex flex-grow flex-col items-center justify-center"> */}
            <GetNavbar {...settings} />

            <a href="/" style={{ display: "block", width: "90%" }}>
              <img
                src="/static/moldura.png"
                style={{ marginTop: "10px", width: "100%" }}
              />
            </a>

            <div className="flex flex-row items-center justify-center">
              <div className="flex h-full max-w-[1030px] flex-col items-center justify-start lg:w-[58vw]">
                <a href="/doacao" style={{ display: "block" }}>
                  <img
                    src="/static/padrinho.gif"
                    style={{
                      marginTop: "32px",
                      width: "100%"
                    }}
                  />
                </a>
                
                {children}
              </div>
              <SidebarRight />
            </div>

            <Footer {...settings} />
          </div>
        </Providers>
      </body>
    </html>
  );
}

// Default for every page of the site: regenerate at most every 12h.
// Content edits show up right away through the Sanity webhook
// (/api/revalidate); the home page uses 1h (see app/(website)/page.js).
// Comments, views and likes are loaded/updated on the client, not from this cache.
export const revalidate = 43200;
