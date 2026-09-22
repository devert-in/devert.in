// The single source of truth for DeVert's founder profiles.
//
// WHERE THIS IS RENDERED (footers and page content only):
//
//   devert-frontend  components/footer.jsx        (site footer credit)
//                    components/duo-terminal.jsx  (landing page commit logs)
//   devert-campus    components/campus/campus-landing.jsx (LandingFooter)
//   devert-careers   components/site-footer.jsx   (footer credit)
//                    components/founders.jsx      ("who you'd be working with")
//
// NOT IN ANY NAVBAR. Founder credits were briefly shipped as a dropdown in
// devert-frontend's top-navbar/navbar and devert-campus's public nav; that was
// wrong and has been reverted. Primary navigation is for product destinations
// a user is trying to reach - credibility ("who built this") belongs in the
// footer, where every other site puts it and where users already look for it.
// Do not re-add a Founders entry to a nav surface.
//
// devert-campus and devert-careers both reach this file through their own
// jsconfig.json `@/*` fallback to ../devert-frontend/*, exactly the way they
// already share AuthContext/firebase/campusUrl - so "@/lib/founders" resolves
// from any of the three, and a founder's link or focus is edited in ONE place.
//
// BOTH ARE FOUNDERS. There is no founder/co-founder split - an earlier version
// of this file invented one and it was wrong.
//
// LINKEDIN IS THE CANONICAL OUTBOUND LINK, not the on-platform /u/{handle}
// profile. Someone reading a footer credit is checking who is behind the
// product, and LinkedIn is where that check actually lands. `handle` is kept
// because duo-terminal.jsx still prints an in-product "view @handle" link on
// the landing page, where a DeVert profile IS the right destination.
//
// HANDLES ARE VERIFIED AGAINST THE LIVE `users` COLLECTION, not guessed:
//   sammyyy                  -> "Adari Samuel Prasad"     (exists)
//   bhanu_prasad_vengaladas  -> "Bhanu Prasad Vengaladas" (exists)
import { DEVERT_URL } from "@/lib/campusUrl";

export const FOUNDERS = [
  {
    key: "samuel",
    // `name` is the full name as it appears on the profile doc; `shortName`
    // is for tight surfaces, because a footer row at 375px is not the place
    // for three-part names.
    name: "Adari Samuel Prasad",
    shortName: "Samuel",
    role: "Founder",
    focus: "UI · Backend · Architecture · Deployments",
    linkedin: "https://www.linkedin.com/in/adarisamuelprasad/",
    handle: "sammyyy",
    // Rendered as the avatar instead of an <img>. There is no founder
    // headshot committed to any of the three apps' public/ directories, and
    // the only real photos live behind runtime Firebase Storage URLs on the
    // user docs - fetching those would mean a Firestore read on every page of
    // all three static-export sites just to paint two small circles. Initials
    // cost nothing, never 404, and read correctly in both campus themes.
    initials: "AS",
    // Matches this founder's existing accent in duo-terminal.jsx.
    accent: "#00FF41",
    // The cosmetic "@handle" duo-terminal prints in its terminal chrome.
    // Kept separate from `handle` on purpose: for Bhanu the short form is the
    // established display text but is NOT a resolvable profile, so only
    // `handle` may ever be used to build a URL.
    displayHandle: "sammyyy",
  },
  {
    key: "bhanu",
    name: "Vengaladas Bhanu Prasad",
    shortName: "Bhanu",
    role: "Founder",
    focus: "Ideology · Deployments",
    linkedin: "https://www.linkedin.com/in/bhanu-prasad-vengaladas-8550bb41a/",
    handle: "bhanu_prasad_vengaladas",
    initials: "VB",
    accent: "#00FFFF",
    displayHandle: "bhanu",
  },
];

// Same-origin profile path - for devert-frontend only, where /u/{handle} is a
// real route on this origin and next/link is correct. Used by duo-terminal.
export const founderPath = (f) => `/u/${f.handle}`;

// Absolute, cross-origin profile URL - for devert-campus and devert-careers,
// where a relative "/u/..." would resolve against campus.devert.in or
// careers.devert.in and 404. Those call sites must also use a plain <a>, not
// next/link. DEVERT_URL is the dev-aware constant from lib/campusUrl.js, so
// this points at localhost:3000 under `next dev` instead of silently sending
// a local click to production.
export const founderUrl = (f) => `${DEVERT_URL}/u/${f.handle}`;
