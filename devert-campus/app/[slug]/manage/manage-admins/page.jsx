import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// See app/campus/[slug]/manage/students/page.jsx's own comment - which
// manage tab renders is resolved client-side from the live URL.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "Manage Admins");
}

export default async function CampusManageAdminsPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp initialTab="manage" />;
}
