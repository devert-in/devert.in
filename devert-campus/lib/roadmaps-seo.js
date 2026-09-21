// Shared build-time SEO helpers for the statically-generated Roadmaps routes
// (app/roadmaps/**). Mirrors lib/campus-seo.js's export shape exactly - same
// reasoning: everything here runs only inside generateStaticParams/
// generateMetadata (server-only, executed once at `next build` - output:
// 'export' has no per-request server).
//
// Lives here (not devert-frontend/lib) for the same reason campus-seo.js
// does: campus.devert.in is a different origin from devert.in, so its own
// SEO helpers need their own URLs, not devert.in/campus/roadmaps ones. This
// is a static SIBLING directory of app/[slug] (same shape as
// app/[slug]/pro didn't move, but see app/[slug]/page.jsx), which Next
// resolves ahead of the dynamic [slug] segment.
//
// Reuses the exact same public client Firestore read (lib/roadmaps.js's
// fetchRoadmaps, the same "firebase/firestore" client SDK lib/campus-seo.js
// already calls from generateStaticParams/generateMetadata today) - no
// admin credentials, no new secrets. Every route file goes through this one
// function, never lib/roadmaps.js directly, so a later change to how the
// catalog is fetched (e.g. a dedicated lightweight index doc once the
// catalog grows past ~20 roadmaps) touches this file alone.
import { fetchRoadmaps } from "@/lib/roadmaps";

const SITE = "https://campus.devert.in";

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
  const url = `${SITE}/roadmaps`;
  // `title` carries NO site suffix: app/layout.jsx sets a title template of
  // "%s | DeVert Campus", which Next applies to this value, so including the
  // suffix here rendered "Career Roadmaps | DeVert Campus | DeVert Campus".
  // openGraph/twitter get the suffixed form explicitly, because a template is
  // NOT applied to an openGraph.title that is set directly - a social card
  // titled just "Career Roadmaps" would lose the brand entirely.
  const title = "Career Roadmaps";
  const socialTitle = "Career Roadmaps | DeVert Campus";
  const description =
    "Structured, level-by-level career and skill roadmaps for students - software, AI, cloud, cybersecurity, hardware, design, business and more, free on DeVert Campus.";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle, description, url,
      siteName: "DeVert Campus",
      type: "website",
      images: [{ url: `${SITE}/logo.png`, alt: "DeVert Campus Roadmaps" }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [`${SITE}/logo.png`] },
    robots: { index: true, follow: true },
  };
}

export function buildRoadmapMetadata(roadmap) {
  if (!roadmap) return { title: "Roadmap not found" };
  const url = `${SITE}/roadmaps/${roadmap.slug}`;
  // Same split as buildRoadmapsIndexMetadata above - see its comment.
  const title = `${roadmap.title} Roadmap`;
  const socialTitle = `${roadmap.title} Roadmap | DeVert Campus`;
  const description = roadmap.tagline || `A structured, level-by-level ${roadmap.title} roadmap on DeVert Campus.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle, description, url,
      siteName: "DeVert Campus",
      type: "website",
      images: [{ url: `${SITE}/logo.png`, alt: `${roadmap.title} on DeVert Campus` }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [`${SITE}/logo.png`] },
    robots: { index: true, follow: true },
  };
}

export function roadmapsIndexJsonLd(catalog) {
  const url = `${SITE}/roadmaps`;
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Roadmaps", item: url },
    ],
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: catalog.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.title,
      url: `${SITE}/roadmaps/${r.slug}`,
    })),
  };
  return [breadcrumbList, itemList];
}

export function roadmapJsonLd(roadmap) {
  const url = `${SITE}/roadmaps/${roadmap.slug}`;
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Roadmaps", item: `${SITE}/roadmaps` },
      { "@type": "ListItem", position: 3, name: roadmap.title, item: url },
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
