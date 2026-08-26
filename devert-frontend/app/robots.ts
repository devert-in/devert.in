// Required for output: 'export' - without this Next.js can't tell that this
// route has no per-request dynamic behavior to statically pre-render.
export const dynamic = "force-static";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/wallet", "/api/"],
    },
    sitemap: "https://devert.in/sitemap.xml",
  };
}
