import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { CampusSeoIntro } from "@/components/campus/campus-seo-intro";
import {
  campusStaticParams, campusInstitutionForSlug, buildCampusMetadata,
  campusJsonLd, campusBreadcrumbItems, CAMPUS_SECTIONS,
} from "@/lib/campus-seo";

export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildCampusMetadata(inst, "leaderboard");
}

export default async function CampusLeaderboardPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();

  const jsonLd = campusJsonLd(inst, "leaderboard");
  const breadcrumbItems = campusBreadcrumbItems(inst, "leaderboard");

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <CampusSeoIntro breadcrumbItems={breadcrumbItems}
        h1={CAMPUS_SECTIONS.leaderboard.title(inst)} description={CAMPUS_SECTIONS.leaderboard.description(inst)} />
      <CampusApp initialTab="leaderboard" />
    </>
  );
}
