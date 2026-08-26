// Every cross-app link to Campus (navbar.jsx, top-navbar.jsx, the homepage
// cards, about/page.jsx) resolves through this, not a hardcoded
// "https://campus.devert.in" string - that string is correct in production
// but breaks `next dev`: it silently sends a local click at the LIVE site
// instead of the devert-campus dev server also running on this machine.
//
// `next dev` sets NODE_ENV=development for us (`next build`/`next start`
// don't), so this needs no new env var wiring in deploy-prod.yml/deploy-mock.yml.
// The local port is fixed by devert-campus/package.json's own `dev` script
// (`next dev -p 3001`) specifically so this constant has something stable to
// point at - devert-frontend already defaults to 3000, and both apps need to
// run side by side to test a cross-app link at all.
export const CAMPUS_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://campus.devert.in";

// The reverse direction - devert-campus's own "Return to DeVert" links
// (campus-public-nav.jsx) import this the same way, via the jsconfig.json
// @/* fallback to this file. devert-frontend's dev server has no fixed
// port of its own the way devert-campus's does (3001), but `next dev`
// defaults to 3000 when nothing else is already holding it, which is the
// same assumption CAMPUS_URL above makes about devert-campus.
export const DEVERT_URL =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://devert.in";
