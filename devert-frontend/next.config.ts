import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default (phase: string): NextConfig => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      images: { unoptimized: true },
      async rewrites() {
        return [
          { source: "/u/:path*", destination: "/u" },
          { source: "/h/:path*", destination: "/h" },
          { source: "/campus/:path*", destination: "/campus" },
          { source: "/contest/:path*", destination: "/contest" },
          // :path+ (one-or-more), not :path* - bare /pulse must stay the
          // feed itself, mirroring how production's "/pulse/**" Hosting
          // rewrite only ever matches a real nested path.
          { source: "/pulse/:path+", destination: "/pulse" },
        ];
      },
    };
  }

  return {
    output: "export",
    images: { unoptimized: true },
  };
};
