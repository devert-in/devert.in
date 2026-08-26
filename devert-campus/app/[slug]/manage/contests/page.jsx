import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// See app/campus/[slug]/manage/page.jsx's own comment - which manage tab/
// sub-view renders is resolved client-side from the live URL, not from
// anything this page passes in; only the metadata differs per route.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "Contests");
}

export default async function CampusManageContestsPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp initialTab="manage" />;
}
