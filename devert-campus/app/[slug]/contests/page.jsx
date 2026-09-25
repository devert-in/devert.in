import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import {
  campusStaticParams, campusInstitutionForSlug, buildCampusMetadata,
  campusJsonLd,
} from "@/lib/campus-seo";
import { jsonLdHtml } from "@/lib/jsonLd";

export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildCampusMetadata(inst, "contests");
}

export default async function CampusContestsPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();

  const jsonLd = campusJsonLd(inst, "contests");

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <CampusApp initialTab="contests" />
    </>
  );
}
