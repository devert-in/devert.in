// Build-time SEO helpers for careers.devert.in.
//
// This file lives HERE, in devert-careers, and not in devert-frontend/lib -
// deliberately. Its predecessor did live there, and the Campus migration
// taught exactly this lesson the hard way: lib/roadmaps-seo.js stayed behind in
// devert-frontend when its pages moved to campus.devert.in, kept hardcoding
// SITE = "https://devert.in" and a /campus/... path, and quietly emitted wrong
// canonical URLs for pages on another origin. Anything that builds an absolute
// URL for THIS site belongs in THIS app.
//
// Two things changed versus the devert.in version of this file:
//   1. SITE is https://careers.devert.in, not https://devert.in.
//   2. A role lives at /{slug}, not /careers/{slug}. This app is domain-root -
//      there is no "careers" path segment any more. Same reshaping Campus went
//      through (/campus/{slug} -> /{slug}), and the same place its bugs came
//      from, so treat any surviving "/careers/" string in a URL here as a bug.
//
// Runs only inside generateStaticParams/generateMetadata - server-only,
// executed once at `next build`, since output: 'export' has no per-request
// server. It reuses the same public, unauthenticated client Firestore reads
// lib/careers.js already exposes. No admin credentials, no new secrets.
//
// FRESHNESS WINDOW: the home page reads Firestore live in the browser, so a
// role published from devert.in/admin appears there immediately. Its own
// /{slug} page does NOT - that URL only exists for slugs present at the last
// `next build`. A newly published role is therefore reachable and applicable
// from the listing right away; its dedicated, indexable page appears on the
// next deploy.
import { JOB_STATUS, fetchPublishedRoles, fetchRoleBySlug } from "@/lib/careers";

const SITE = "https://careers.devert.in";

// What the SITEMAP uses. Must stay separate from careerStaticParams below, or
// the build placeholder ends up advertised as a real job.
export async function publishedRoleSlugs() {
  const roles = await fetchPublishedRoles().catch(() => []);
  return roles.map((r) => ({ slug: r.id }));
}

// The slug the route falls back to when nothing is published. Nothing links to
// it, it is excluded from the sitemap, and its page is served noindex.
export const NO_OPEN_ROLES_SLUG = "no-open-roles";

// What app/[slug] uses, and it is deliberately never empty.
//
// next/dist/build/index.js does this, verbatim:
//
//   const hasGenerateStaticParams = workerResult.prerenderedRoutes
//     && workerResult.prerenderedRoutes.length > 0;
//   if (config.output === 'export' && isDynamic && !hasGenerateStaticParams) throw ...
//     `Page "..." is missing "generateStaticParams()"`
//
// An empty array is therefore indistinguishable from no function at all, and
// fails the WHOLE build - not just this route. That matters more on a careers
// site than anywhere else, because "nothing is open right now" is an ordinary
// state, not an error: the day the last role is closed, an untouched deploy
// would start failing with an error pointing at a function that is right there
// and working.
//
// So one placeholder param keeps the route valid when there is nothing to list.
// It costs a single orphan HTML file that renders the same "no longer listed"
// view a deleted role does, carries robots: noindex, and appears in no sitemap
// or link anywhere.
export async function careerStaticParams() {
  const real = await publishedRoleSlugs();
  return real.length > 0 ? real : [{ slug: NO_OPEN_ROLES_SLUG }];
}

// Returns null (not a throw) for an unknown slug, so the page component can
// render its empty state instead of failing the whole static export.
export { fetchRoleBySlug as roleForSlug };

function trimmedDescription(role) {
  const source = role.blurb?.trim() || role.description?.trim() || "";
  return source.length > 160 ? `${source.slice(0, 157)}...` : source;
}

function locationLabel(role) {
  const type = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" }[role.locationType];
  if (type && role.location) return `${type} · ${role.location}`;
  return type || role.location || "";
}

// The placeholder route, and any slug whose role has gone, must never be
// indexed - there is no job on the other side of it.
export function buildEmptyRoleMetadata() {
  return {
    title: "No open roles",
    description: "There are no open roles listed right now.",
    alternates: { canonical: SITE },
    robots: { index: false, follow: true },
  };
}

export function buildRoleMetadata(role, slug) {
  const url = `${SITE}/${slug}`;
  const where = locationLabel(role);
  const title = where ? `${role.title} - ${where}` : role.title;
  const description = trimmedDescription(role);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${role.title} | Careers at DeVert`,
      description,
      url,
      siteName: "DeVert Careers",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${role.title} | Careers at DeVert`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

const EMPLOYMENT_TYPE = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

function toIso(value) {
  if (value?.toDate) return value.toDate().toISOString();
  if (typeof value === "string" && value) return new Date(value).toISOString();
  return null;
}

// A JobPosting's description is the one field Google actually renders, and it
// wants markup rather than a wall of text. Built from the same arrays the page
// itself displays - never crawler-only content a visitor cannot see.
function descriptionHtml(role) {
  const list = (heading, items) => (
    Array.isArray(items) && items.length
      ? `<h3>${heading}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
      : ""
  );
  return [
    role.description ? `<p>${role.description}</p>` : "",
    list("Responsibilities", role.responsibilities),
    list("Requirements", role.requirements),
    list("Nice to have", role.niceToHave),
    list("What you get", role.perks),
  ].filter(Boolean).join("");
}

// Real, non-fabricated schema.org objects built only from fields that actually
// exist on the doc. Salary is never emitted: nothing in the admin panel collects
// it, and inventing a baseSalary is both a structured-data violation and a
// promise to a candidate. datePosted is required by Google for a JobPosting, so
// a role missing postedAt gets no JobPosting block at all rather than a guessed
// date - an absent rich result beats an invalid one.
export function roleJsonLd(role, slug) {
  const url = `${SITE}/${slug}`;
  const datePosted = toIso(role.postedAt);
  const validThrough = toIso(role.validThrough);

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Careers", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: role.title, item: url },
    ],
  };

  if (!datePosted || role.status !== JOB_STATUS.PUBLISHED) return [breadcrumbList];

  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: descriptionHtml(role) || role.blurb || "",
    datePosted,
    ...(validThrough ? { validThrough } : {}),
    ...(EMPLOYMENT_TYPE[role.employmentType]
      ? { employmentType: EMPLOYMENT_TYPE[role.employmentType] }
      : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: "DeVert",
      sameAs: "https://devert.in",
      logo: "https://devert.in/og-image.png",
    },
    directApply: true,
    url,
  };

  // Google requires jobLocation for anything that isn't fully remote, and
  // requires jobLocationType TELECOMMUTE plus applicantLocationRequirements for
  // anything that is. Hybrid/on-site roles without a written location get
  // neither rather than a fabricated address.
  if (role.locationType === "remote") {
    jobPosting.jobLocationType = "TELECOMMUTE";
    jobPosting.applicantLocationRequirements = { "@type": "Country", name: "IN" };
  } else if (role.location) {
    jobPosting.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: role.location, addressCountry: "IN" },
    };
  }

  return [jobPosting, breadcrumbList];
}
