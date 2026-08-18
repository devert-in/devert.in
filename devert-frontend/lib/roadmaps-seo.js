// Shared build-time SEO helpers for the statically-generated Roadmaps routes
// (app/campus/roadmaps/**). Mirrors lib/campus-seo.js's export shape exactly -
// same reasoning: everything here runs only inside generateStaticParams/
// generateMetadata (server-only, executed once at `next build` - output:
// 'export' has no per-request server).
//
// Deliberately NOT added to campus-seo.js's CAMPUS_SECTIONS/GLOBAL_SECTIONS:
// those are consumed by the single-segment app/campus/[slug]/page.jsx and
// structurally cannot produce a nested /campus/roadmaps/{roadmapSlug} route.
// This is instead a static SIBLING directory of app/campus/[slug] (same
// shape as app/campus/pro/page.jsx), which Next resolves ahead of the
// dynamic [slug] segment, and which Firebase Hosting serves as an exact
// static file ahead of the /campus/** campusPreviewRouter Cloud Function
// rewrite - see firebase.json's rewrites and functions/index.js's
// makePreviewRouter.
//
// Reuses the exact same public client Firestore read (lib/roadmaps.js's
// fetchRoadmaps, the same "firebase/firestore" client SDK lib/campus-seo.js
// already calls from generateStaticParams/generateMetadata today) - no
// admin credentials, no new secrets. Every route file goes through this one
// function, never lib/roadmaps.js directly, so a later change to how the
// catalog is fetched (e.g. a dedicated lightweight index doc once the
// catalog grows past ~20 roadmaps) touches this file alone.
import { fetchRoadmaps } from "@/lib/roadmaps";

const SITE = "https://devert.in";

export async function fetchRoadmapCatalog() {
  return fetchRoadmaps().catch(() => []);
}

export async function roadmapForSlug(slug) {
  const catalog = await fetchRoadmapCatalog();
  return catalog.find((r) => r.slug === slug) || null;
}

export async function roadmapStaticParams() {
  const catalog = await fetchRoadmapCatalog();
  return catalog.map((r) => ({ roadmapSlug: r.slug }));
}

export function buildRoadmapsIndexMetadata() {
  const url = `${SITE}/campus/roadmaps`;
  const title = "Career Roadmaps | DeVert Campus";
  const description =
    "Structured, level-by-level career and skill roadmaps for students - software, AI, cloud, cybersecurity, hardware, design, business and more, free on DeVert Campus.";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "DeVert Campus",
      type: "website",
      images: [{ url: `${SITE}/logo.png`, alt: "DeVert Campus Roadmaps" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE}/logo.png`] },
    robots: { index: true, follow: true },
  };
}

export function buildRoadmapMetadata(roadmap) {
  if (!roadmap) return { title: "Roadmap not found" };
  const url = `${SITE}/campus/roadmaps/${roadmap.slug}`;
  const title = `${roadmap.title} Roadmap | DeVert Campus`;
  const description = roadmap.tagline || `A structured, level-by-level ${roadmap.title} roadmap on DeVert Campus.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "DeVert Campus",
      type: "website",
      images: [{ url: `${SITE}/logo.png`, alt: `${roadmap.title} on DeVert Campus` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE}/logo.png`] },
    robots: { index: true, follow: true },
  };
}

export function roadmapsIndexJsonLd(catalog) {
  const url = `${SITE}/campus/roadmaps`;
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Campus", item: `${SITE}/campus` },
      { "@type": "ListItem", position: 3, name: "Roadmaps", item: url },
    ],
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: catalog.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.title,
      url: `${SITE}/campus/roadmaps/${r.slug}`,
    })),
  };
  return [breadcrumbList, itemList];
}

export function roadmapJsonLd(roadmap) {
  const url = `${SITE}/campus/roadmaps/${roadmap.slug}`;
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Campus", item: `${SITE}/campus` },
      { "@type": "ListItem", position: 3, name: "Roadmaps", item: `${SITE}/campus/roadmaps` },
      { "@type": "ListItem", position: 4, name: roadmap.title, item: url },
    ],
  };
  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: roadmap.title,
    description: roadmap.tagline,
    provider: { "@type": "Organization", name: "DeVert", url: SITE },
    isAccessibleForFree: true,
    url,
  };
  return [breadcrumbList, course];
}
