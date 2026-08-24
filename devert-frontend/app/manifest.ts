// Required for output: 'export' - same reasoning as robots.ts/sitemap.ts:
// without this Next.js can't tell this route has no per-request dynamic
// behavior to statically pre-render.
export const dynamic = "force-static";

export default function manifest() {
  return {
    name: "DeVert - Builder's OS",
    short_name: "DeVert",
    description:
      "Introvert. Extrovert. DeVert. A new identity for developers who build, ship, and grind.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      { src: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { src: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
