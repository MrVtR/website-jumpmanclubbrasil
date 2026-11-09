/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    remotePatterns: [{ hostname: "cdn.sanity.io" }],
  },
  typescript: {
    // Set this to false if you want production builds to abort if there's type errors
    ignoreBuildErrors: process.env.VERCEL_ENV === "production",
  },
  eslint: {
    /// Set this to false if you want production builds to abort if there's lint errors
    ignoreDuringBuilds: process.env.VERCEL_ENV === "production",
  },
  experimental: {
    esmExternals: "loose", // Add this
  },

  // The template's demo layouts (/post/minimal/..., /home/alt, ...) were removed:
  // they duplicated every post 3 extra times, were only reachable through the
  // sitemap and were being crawled and regenerated (ISR) by bots.
  // Old URLs permanently redirect to the real pages.
  async redirects() {
    return [
      {
        source: "/post/:variant(minimal|lifestyle|sidebar)/:slug",
        destination: "/post/:slug",
        permanent: true,
      },
      {
        source: "/home/:variant(alt|minimal|lifestyle|2-col)",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Files in /public are served with "max-age=0" by default, so browsers ask the
  // CDN for them again on every page load. Let browsers keep them for a week.
  async headers() {
    const cache = [
      {
        key: "Cache-Control",
        value: "public, max-age=604800, stale-while-revalidate=86400",
      },
    ];
    return [
      { source: "/static/:path*", headers: cache },
      { source: "/img/:path*", headers: cache },
    ];
  },
};

module.exports = nextConfig;
