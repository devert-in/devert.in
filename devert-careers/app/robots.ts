// Required for output: 'export' - without this Next.js can't tell that this
// route has no per-request dynamic behavior to statically pre-render.
export const dynamic = "force-static";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The build-time placeholder that keeps output: 'export' valid when no
      // role is published (see lib/careers-seo.js's careerStaticParams). It is
      // already served with a noindex meta tag and is in no sitemap; this is
      // belt and braces so it is never even fetched.
      disallow: ["/no-open-roles"],
    },
    sitemap: "https://careers.devert.in/sitemap.xml",
  };
}
