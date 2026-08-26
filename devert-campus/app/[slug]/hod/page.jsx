import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// Dedicated, admin-provisioned-only HOD login - see
// app/campus/[slug]/principal/page.jsx's own comment for why this page is
// just a thin static-route shell around CampusApp's own router.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "HOD Login");
}

export default async function CampusHodLoginPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp />;
}
