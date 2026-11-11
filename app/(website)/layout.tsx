import "@/styles/tailwind.css";
import { Providers } from "./providers";
import { cx } from "@/utils/all";
import { Inter, Lora, Open_Sans } from "next/font/google";
import { getSettings, getTopPosts } from "@/lib/sanity/client";
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

const SITE_NAME = "JumpmanClub Brasil Traduções";
const SITE_DESCRIPTION =
  "Somos a equipe JumpManClub Brasil, um grupo independente de tradução de games! Traduzimos pra PT-BR jogos que nativamente não têm idioma PT-BR, de fã pra fã!";

// Absolute base URL for canonical links and link previews (WhatsApp, Discord...).
function siteUrl(settings: any) {
  const url =
    process.env.SITE_URL ||
    settings?.url ||
    "https://www.jumpmanclubbrasil.com.br";
  try {
    return new URL(url);
  } catch {
    return new URL("https://www.jumpmanclubbrasil.com.br");
  }
}

async function sharedMetaData(params: any) {
  const settings = await getSettings();
  const name = settings?.title || SITE_NAME;
  const description = settings?.description || SITE_DESCRIPTION;
  const ogImage = urlForImage(settings?.openGraphImage);

  return {
    metadataBase: siteUrl(settings),
    title: {
      default: name,
      // Page titles become "Post title | JumpmanClub Brasil Traduções"
      template: `%s | ${name}`
    },
    description,
    applicationName: name,
    keywords: [
      "tradução de jogos",
      "tradução PT-BR",
      "jogos em português",
      "patch de tradução",
      "tradução de games",
      "JumpmanClub Brasil"
    ],
    authors: [{ name }],
    creator: name,
    publisher: name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: name,
      title: name,
      description,
      url: "/",
      images: [
        {
          url: ogImage?.src || "/img/opengraph.jpg",
          width: ogImage?.width || 800,
          height: ogImage?.height || 600,
          alt: name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description
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
  const [settings, topPosts] = await Promise.all([
    getSettings(),
    getTopPosts()
  ]);
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cx(inter.variable, lora.variable,openSans.variable)}>
      <body className="dark:bg-black-800 flex flex-row bg-gray-100 text-gray-800">
        <Providers>
          <div className="flex flex-grow flex-col items-center justify-center">
          {/* <div className="container mx-auto flex flex-grow flex-col items-center justify-center"> */}
            <GetNavbar {...settings} />

            <a href="/" style={{ display: "block", width: "90%" }}>
              <img
                src="/static/moldura.webp"
                alt="JumpmanClub Brasil Traduções — página inicial"
                style={{ marginTop: "10px", width: "100%" }}
              />
            </a>

            <div className="flex flex-row items-center justify-center">
              <div className="flex h-full max-w-[1030px] flex-col items-center justify-start lg:w-[58vw]">
                <a href="/doacao" style={{ display: "block" }}>
                  <img
                    src="/static/padrinho.webp"
                    alt="Faça uma doação"
                    style={{
                      marginTop: "32px",
                      width: "100%"
                    }}
                  />
                </a>
                
                {children}
              </div>
              <SidebarRight topPosts={topPosts} />
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
