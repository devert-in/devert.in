import { Suspense } from "react";
import { notFound } from "next/navigation";
import { roadmapStaticParams, roadmapForSlug, buildRoadmapMetadata, roadmapJsonLd } from "@/lib/roadmaps-seo";
import { CampusRoadmapsRoute } from "@/components/campus/campus-roadmaps";
import { RoadmapsSyllabusOutline } from "@/components/campus/roadmaps-syllabus-outline";
import { jsonLdHtml } from "@/lib/jsonLd";

// Individual TOPICS deliberately get no static route of their own (would be
// ~1,100 pages for the MVP's 15 roadmaps at 3 levels x ~5 modules x ~5
// topics each, for content that changes the most often under this app's
// rebuild-gated static export) - they're client-rendered via a ?topic=
// query param on this page, matching how CS Core has no per-topic route
// today. This file stays a SERVER component (no "use client") so
// generateStaticParams/generateMetadata can run at build time;
// CampusRoadmapsRoute (the real interactive UI) is a client component
// rendered inside it, wrapped in Suspense because it reads useSearchParams().
export async function generateStaticParams() {
  return roadmapStaticParams();
}

export async function generateMetadata({ params }) {
  const { roadmapSlug } = await params;
  const roadmap = await roadmapForSlug(roadmapSlug);
  return buildRoadmapMetadata(roadmap);
}

export default async function RoadmapDetailPage({ params }) {
  const { roadmapSlug } = await params;
  const roadmap = await roadmapForSlug(roadmapSlug);
  if (!roadmap) notFound();

  const jsonLd = roadmapJsonLd(roadmap);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <Suspense fallback={null}>
        <CampusRoadmapsRoute initialRoadmapSlug={roadmapSlug} />
      </Suspense>
      <RoadmapsSyllabusOutline roadmap={roadmap} mode="detail" />
    </>
  );
}
