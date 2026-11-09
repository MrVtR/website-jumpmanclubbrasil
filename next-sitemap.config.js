/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl:
    process.env.SITE_URL || "https://stablo-pro.web3templates.com",
  generateRobotsTxt: true, // (optional)
  // Keep API routes and the Studio out of the sitemap so crawlers don't hit them.
  exclude: ["/api/*", "/studio*"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/studio"] }]
  }
};
