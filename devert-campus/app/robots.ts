// Required for output: 'export' - without this Next.js can't tell that this
// route has no per-request dynamic behavior to statically pre-render.
export const dynamic = "force-static";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Real workspace sub-routes with no dedicated static page/metadata -
      // always a signed-in member's own data, never public content. Mirrors
      // devert-frontend/app/robots.ts's own disallow list, scoped to this
      // origin's path shape (no leading /campus segment).
      disallow: ["/*/profile", "/*/manage"],
    },
    sitemap: "https://campus.devert.in/sitemap.xml",
  };
}
