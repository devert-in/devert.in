import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// Dedicated, admin-provisioned-only Faculty / Class Teacher login - see
// app/campus/[slug]/principal/page.jsx's own comment for why this page is
// just a thin static-route shell around CampusApp's own router. "Faculty"
// and "Class Teacher" are one unified role (facultyClassTeacher) - this one
// URL/login page covers both.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "Faculty Login");
}

export default async function CampusFacultyLoginPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp />;
}
