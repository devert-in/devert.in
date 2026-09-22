import type { NextConfig } from "next";
import path from "node:path";

// Always a static export - this site is served entirely by Firebase Hosting
// (the "careers" target in firebase.json), same as devert-frontend and
// devert-campus. No dev-only rewrites: this app's routes are already
// domain-root (`/` and `/{slug}`), with no legacy `/careers`-prefixed shape to
// emulate locally.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Must stay the repo root, not this directory - devert-careers imports
  // lib/careers.js and lib/firebase.js straight from ../devert-frontend (see
  // jsconfig.json's @/* fallback), and Turbopack refuses to resolve anything
  // outside whatever root it is given. Same reasoning, verbatim, as
  // devert-campus/next.config.ts.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default config;
