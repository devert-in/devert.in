import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import {
  campusStaticParams, campusInstitutionForSlug, buildCampusMetadata,
  campusJsonLd, GLOBAL_SECTIONS,
} from "@/lib/campus-seo";

// campus-app.jsx also treats /campus/{contests|learning|practice} as
// reserved, pre-auth-usable global sections (GLOBAL_SECTIONS), not
// institution slugs - but that dispatch is entirely CLIENT-side. This page
// is what actually decides whether the request even reaches that client
// code: campusInstitutionForSlug() obviously never finds a real institution
// named "practice", so without this special case every one of those 3 paths
// (bookmarked, refreshed, or hit via Next's on-demand RSC fetch for a
// dynamic segment outside generateStaticParams - which is exactly what a
// client-side router.push(\"/campus/practice\") triggers) called notFound()
// unconditionally - a real, live 404 on every Campuses-nav
// Learning/Contests/Practice link.
const GLOBAL_SECTION_SET = new Set(GLOBAL_SECTIONS);

export async function generateStaticParams() {
  const institutionParams = await campusStaticParams();
  return [...institutionParams, ...GLOBAL_SECTIONS.map((slug) => ({ slug }))];
}

const GLOBAL_SECTION_METADATA = {
  contests: { title: "Contests | DeVert Campus", description: "Compete in coding contests across every DeVert Campus institution." },
  learning: { title: "Daily Learning | DeVert Campus", description: "Structured daily coding lessons, open to browse before you join a campus." },
  practice: { title: "Practice | DeVert Campus", description: "Practice DSA and company-wise interview questions, open to browse before you join a campus." },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (GLOBAL_SECTION_SET.has(slug)) return GLOBAL_SECTION_METADATA[slug];
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildCampusMetadata(inst, "dashboard");
}

export default async function CampusInstitutionPage({ params }) {
  const { slug } = await params;
  if (GLOBAL_SECTION_SET.has(slug)) return <CampusApp initialTab="dashboard" />;

  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();

  const jsonLd = campusJsonLd(inst, "dashboard");

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <CampusApp initialTab="dashboard" />
    </>
  );
}
