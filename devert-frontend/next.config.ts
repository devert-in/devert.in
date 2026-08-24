import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const config = (phase: string): NextConfig => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      images: { unoptimized: true },
      async rewrites() {
        return {
          afterFiles: [
            { source: "/u/:path*", destination: "/u" },
            { source: "/h/:path*", destination: "/h" },
            { source: "/contest/:path*", destination: "/contest" },
            // :path+ (one-or-more), not :path* - bare /pulse must stay the
            // feed itself, mirroring how production's "/pulse/**" Hosting
            // rewrite only ever matches a real nested path.
            { source: "/pulse/:path+", destination: "/pulse" },
          ],
          // campus/:path* is `fallback`, not `afterFiles` - it must only
          // catch paths with NO real page (student's own /profile, /manage,
          // a specific /contest/{id}), same as production's Firebase Hosting
          // rewrite (which only fires when no exact static file matches).
          // afterFiles rewrites run BEFORE Next tries dynamic routes at all,
          // so putting this rule there unconditionally sent every
          // /campus/[slug]/** request - including the real generateStaticParams
          // pages like /campus/[slug]/dsa - back to the flat /campus shell,
          // making those routes permanently unreachable in `next dev` (while
          // still working in production, since Hosting's exact-file match
          // wins there) - fallback is only tried after dynamic routes miss.
          fallback: [
            { source: "/campus/:path*", destination: "/campus" },
          ],
        };
      },
    };
  }

  return {
    output: "export",
    images: { unoptimized: true },
  };
};

export default config;
