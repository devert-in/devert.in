import { Suspense } from "react";
import { fetchRoadmapCatalog, buildRoadmapsIndexMetadata, roadmapsIndexJsonLd } from "@/lib/roadmaps-seo";
import { CampusRoadmapsRoute } from "@/components/campus/campus-roadmaps";
import { RoadmapsSyllabusOutline } from "@/components/campus/roadmaps-syllabus-outline";
import { jsonLdHtml } from "@/lib/jsonLd";

// A static SIBLING of app/campus/[slug], not a dynamic-segment entry - see
// lib/roadmaps-seo.js's header for why. This is the one global, canonical,
// SEO-indexable home for the Roadmaps catalog (never a per-institution URL -
// every DeVert Campus user sees identical roadmaps/recommendations).
//
// This file itself stays a SERVER component (no "use client") purely so
// generateMetadata can run at build time - CampusRoadmapsRoute, the actual
// interactive UI, is a client component rendered inside it. Suspense is
// required around it because it reads useSearchParams(), same reason
// app/campus/page.jsx wraps its own client route the same way.
export async function generateMetadata() {
  return buildRoadmapsIndexMetadata();
}

export default async function RoadmapsIndexPage() {
  const catalog = await fetchRoadmapCatalog();
  const jsonLd = roadmapsIndexJsonLd(catalog);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <Suspense fallback={null}>
        <CampusRoadmapsRoute />
      </Suspense>
      {/* A plain, real, visible list of every roadmap - the biggest available
          SEO win under static export for a list page (the catalog is already
          read at build time above), and useful on its own merits (a
          crawlable, no-JS fallback of "what roadmaps exist"). */}
      <RoadmapsSyllabusOutline catalog={catalog} mode="index" />
    </>
  );
}
