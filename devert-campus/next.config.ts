import type { NextConfig } from "next";
import path from "node:path";

// Always a static export - this site is served entirely by Firebase Hosting
// (the "campus" target in firebase.json), same as devert-frontend. No
// dev-only rewrites needed here (unlike devert-frontend's next.config.ts) -
// this is a fresh app with no legacy /campus-prefixed routes to emulate.
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Must stay the repo root, not this directory - devert-campus imports
  // shared code from ../devert-frontend (context/AuthContext, lib/firebase,
  // etc; see jsconfig.json's @/* fallback path), and Turbopack refuses to
  // resolve anything outside whatever root it's given. The repo root also
  // has its own package-lock.json (for scripts/ tooling), which is what
  // triggered Next's "inferred workspace root, may not be correct" warning -
  // pinning it explicitly (to the same directory auto-detection already
  // picked) silences that warning without changing the actual behavior.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default config;
