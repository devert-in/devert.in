import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// Manage's routes are real, addressable pages (app/campus/[slug]/manage/**)
// so refresh/back-forward/deep-link/bookmark all work - but which manage
// tab and sub-view to show is resolved entirely client-side, from the
// live URL (see CampusApp's own [first,second,third,fourth] parsing and
// SEGMENT_TO_MANAGE_TAB in campus-manage.jsx), not from anything this page
// passes in. Every manage/** page.jsx is this same one-liner for that
// reason - only the metadata differs.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "Manage");
}

export default async function CampusManagePage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp initialTab="manage" />;
}
