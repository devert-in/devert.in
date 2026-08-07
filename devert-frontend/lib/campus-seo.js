// Shared build-time SEO helpers for the statically-generated per-institution
// Campus section routes (app/campus/[slug]/**). Everything here runs only
// inside generateStaticParams/generateMetadata (server-only, executed once
// at `next build` - output: 'export' has no per-request server), reusing
// the exact same public client Firestore reads (lib/institutions.js) that
// sitemap.ts already relies on. No admin credentials, no new secrets.
import { fetchInstitutions, fetchInstitution } from "@/lib/institutions";

// Reserved top-level /campus/{slug} paths that are NOT institution slugs -
// campus-app.jsx's own pre-auth-usable global sections (contests/learning/
// practice). Lives here, not in campus-app.jsx (a "use client" module),
// because app/campus/[slug]/page.jsx needs this same list at build/server
// time (generateStaticParams/generateMetadata/notFound() guard) - importing
// a plain constant from a client component module into server code doesn't
// give you the real value, Next replaces every export of a "use client"
// module with an opaque client-reference proxy, which isn't iterable. This
// file has no "use client" directive, so both sides import the same array.
export const GLOBAL_SECTIONS = ["contests", "learning", "practice", "campuses", "institutions", "pricing"];

// The subset of GLOBAL_SECTIONS that are marketing/info pages built from the
// landing page's own band components (CampusInfoPage), not the learning shell
// with its sidebar rail. Kept here rather than in campus-app.jsx for the same
// reason GLOBAL_SECTIONS is: app/campus/[slug]/page.jsx needs it at build time,
// and a "use client" module's exports are opaque client-reference proxies on the
// server. Must stay a subset of GLOBAL_SECTIONS or the route never resolves.
export const LANDING_PAGE_SECTIONS = ["campuses", "institutions", "pricing"];

// key: the internal CampusWorkspace tab id (campus-app.jsx's TAB_URL_SEGMENT
// keys must match these exactly). urlSegment: "" means the institution root
// (/campus/[slug] itself, no extra segment).
export const CAMPUS_SECTIONS = {
  dashboard: {
    urlSegment: "",
    label: "Dashboard",
    title: (inst) => `${inst.name} Campus`,
    description: (inst) =>
      inst.description?.trim() ||
      `${inst.name}'s placement preparation hub on DeVert Campus - daily coding practice, company-wise interview prep, assessments, contests and a live leaderboard, run by ${inst.name}'s own Training & Placement Cell.`,
  },
  learning: {
    urlSegment: "daily-learning",
    label: "Daily Learning",
    title: (inst) => `Daily Learning | ${inst.name} Campus`,
    description: (inst) =>
      `Structured daily coding lessons and concept modules for ${inst.name} students - a new short lesson every day, tracked with streaks, XP and progress on DeVert Campus.`,
  },
  dsa: {
    urlSegment: "dsa",
    label: "DSA",
    title: (inst) => `DSA Practice | ${inst.name} Campus`,
    description: (inst) =>
      `Solve curated Data Structures & Algorithms problems as part of ${inst.name}'s placement preparation on DeVert Campus - real test cases, submission grading, and worked Brute Force / Better / Optimal solutions.`,
  },
  companyVault: {
    urlSegment: "company-vault",
    label: "Company Vault",
    title: (inst) => `Company Vault | ${inst.name} Campus`,
    description: (inst) =>
      `Company-wise placement preparation for ${inst.name} students - real hiring-round breakdowns, aptitude, and interview questions for top recruiters, on DeVert Campus.`,
  },
  assessments: {
    urlSegment: "assessments",
    label: "Assessments",
    title: (inst) => `Assessments | ${inst.name} Campus`,
    description: (inst) =>
      `Weekly assessments and mock tests for ${inst.name} students on DeVert Campus, run by ${inst.name}'s Training & Placement Cell.`,
  },
  contests: {
    urlSegment: "contests",
    label: "Contests",
    title: (inst) => `Contests | ${inst.name} Campus`,
    description: (inst) =>
      `Coding contests for ${inst.name} students on DeVert Campus - compete with classmates, climb the leaderboard, and practice under real time pressure.`,
  },
  leaderboard: {
    urlSegment: "leaderboard",
    label: "Leaderboard",
    title: (inst) => `Leaderboard | ${inst.name} Campus`,
    description: (inst) =>
      `See how ${inst.name} students rank on DeVert Campus - XP, coins, streaks and problems solved, updated live.`,
  },
};

// Shared generateStaticParams for every app/campus/[slug]/**/page.jsx -
// same public institutions list sitemap.ts already builds from.
export async function campusStaticParams() {
  const institutions = await fetchInstitutions().catch(() => []);
  return institutions.map((inst) => ({ slug: inst.id }));
}

// Institution fetch used by each page's own generateMetadata + default
// export. Returns null (not a throw) for an unknown/removed slug so the
// page component can render its own not-found state instead of a build
// failure - matches CampusWorkspace's own "NOT_FOUND" phase, which already
// handles this exact case client-side.
export async function campusInstitutionForSlug(slug) {
  return fetchInstitution(slug).catch(() => null);
}

// Manage's own static routes (app/campus/[slug]/manage/**) are real,
// bookmarkable/refreshable pages for the SAME reason the public sections
// above are, but they're private admin tooling, not marketing surfaces -
// noindex/nofollow, no OpenGraph/JSON-LD, and no dependency on
// CAMPUS_SECTIONS (which sitemap.ts iterates to build the public sitemap -
// these must never end up there).
export function buildManageMetadata(inst, label) {
  return {
    title: `${label} - Manage | ${inst?.name || "Campus"}`,
    robots: { index: false, follow: false },
  };
}

const SITE = "https://devert.in";

// One shared Metadata builder for all 7 routes - only the section key and
// the fetched institution doc differ per call site.
export function buildCampusMetadata(inst, sectionKey) {
  const section = CAMPUS_SECTIONS[sectionKey];
  const path = section.urlSegment ? `/campus/${inst.id}/${section.urlSegment}` : `/campus/${inst.id}`;
  const url = `${SITE}${path}`;
  const title = section.title(inst);
  const description = section.description(inst);
  const image = inst.bannerUrl || inst.logoUrl || `${SITE}/logo.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "DeVert Campus",
      type: "website",
      images: [{ url: image, alt: `${inst.name} on DeVert Campus` }],
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

// BreadcrumbList + EducationalOrganization/WebPage JSON-LD for a section
// page. Returned as plain objects - the page component embeds them via
// <script type="application/ld+json">.
export function campusJsonLd(inst, sectionKey) {
  const section = CAMPUS_SECTIONS[sectionKey];
  const path = section.urlSegment ? `/campus/${inst.id}/${section.urlSegment}` : `/campus/${inst.id}`;
  const url = `${SITE}${path}`;

  const breadcrumbItems = [
    { name: "Home", item: SITE },
    { name: "Campus", item: `${SITE}/campus` },
    { name: inst.name, item: `${SITE}/campus/${inst.id}` },
  ];
  if (section.urlSegment) breadcrumbItems.push({ name: section.label, item: url });

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: section.title(inst),
    description: section.description(inst),
    url,
    isPartOf: { "@type": "WebSite", name: "DeVert", url: SITE },
    about: {
      "@type": "EducationalOrganization",
      name: inst.name,
      url: `${SITE}/campus/${inst.id}`,
    },
  };

  return [breadcrumbList, webPage];
}

// Breadcrumb items in the shape CampusSeoBreadcrumb (campus-app.jsx) expects
// ({ label, href }) - built from the same data as campusJsonLd so the two
// never drift out of sync with each other.
export function campusBreadcrumbItems(inst, sectionKey) {
  const section = CAMPUS_SECTIONS[sectionKey];
  const items = [
    { label: "Home", href: "/" },
    { label: "Campus", href: "/campus" },
    { label: inst.name, href: section.urlSegment ? `/campus/${inst.id}` : undefined },
  ];
  if (section.urlSegment) items.push({ label: section.label });
  return items;
}
