// The single source of truth for DeVert's founder profiles, shared by all
// THREE apps' nav surfaces:
//
//   devert-frontend  components/top-navbar.jsx   (desktop pill dropdown)
//                    components/navbar.jsx        (mobile dock popover)
//                    components/duo-terminal.jsx  (landing page commit logs)
//   devert-campus    components/campus/campus-public-nav.jsx
//   devert-careers   components/site-header.jsx
//
// devert-campus and devert-careers both reach this file through their own
// jsconfig.json `@/*` fallback to ../devert-frontend/*, exactly the way they
// already share AuthContext/firebase/campusUrl - so "@/lib/founders" resolves
// from any of the three, and a founder's handle or role is edited in ONE
// place rather than in five navbars.
//
// WHY THIS FILE EXISTS AT ALL: the founder names/handles were previously
// hardcoded in exactly one place (duo-terminal.jsx's <CommitLog> props), and
// one of those hardcoded values was WRONG - handle="bhanu" links to
// /u/bhanu, which no user account has ever held, so the landing page has been
// shipping a 404 on "view @bhanu". Adding founders to five more nav surfaces
// by copying that same literal would have multiplied the bug by five.
//
// HANDLES ARE VERIFIED AGAINST THE LIVE `users` COLLECTION, not guessed:
//   sammyyy                  -> "Adari Samuel Prasad"     (exists)
//   bhanu_prasad_vengaladas  -> "Bhanu Prasad Vengaladas" (exists)
// Five accounts match /bhanu/i; bhanu_prasad_vengaladas is the only one
// carrying the Vengaladas surname from duo-terminal's own
// "Vengaladas Bhanu Prasad", which is what identifies it as the co-founder's.
import { DEVERT_URL } from "@/lib/campusUrl";

export const FOUNDERS = [
  {
    key: "samuel",
    // `name` is the full legal name as it appears on the profile doc;
    // `shortName` is what the nav actually renders, because a nav row is not
    // the place for three-part names at 375px.
    name: "Adari Samuel Prasad",
    shortName: "Samuel",
    role: "Founder",
    // Lifted verbatim from duo-terminal.jsx's `role` prop so the landing page
    // and the navs cannot drift apart on what each founder actually does.
    focus: "Frontend · Product · Deploy",
    handle: "sammyyy",
    // Rendered as the avatar instead of an <img>. There is no founder
    // headshot committed to any of the three apps' public/ directories, and
    // the only real photos live behind runtime Firebase Storage URLs on the
    // user docs - fetching those would mean a Firestore read on every page of
    // all three static-export sites just to paint two 28px circles. Initials
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
    name: "Bhanu Prasad Vengaladas",
    shortName: "Bhanu",
    role: "Co-Founder",
    focus: "Backend · Systems · Architecture",
    handle: "bhanu_prasad_vengaladas",
    initials: "BV",
    accent: "#00FFFF",
    displayHandle: "bhanu",
  },
];

// Same-origin profile path - for devert-frontend only, where /u/{handle} is a
// real route on this origin and next/link is correct.
export const founderPath = (f) => `/u/${f.handle}`;

// Absolute, cross-origin profile URL - for devert-campus and devert-careers,
// where a relative "/u/..." would resolve against campus.devert.in or
// careers.devert.in and 404. Those call sites must also use a plain <a>, not
// next/link; see campus-public-nav.jsx's own header comment on exactly this
// class of bug. DEVERT_URL is the dev-aware constant from lib/campusUrl.js,
// so this points at localhost:3000 under `next dev` instead of silently
// sending a local click to production.
export const founderUrl = (f) => `${DEVERT_URL}/u/${f.handle}`;
