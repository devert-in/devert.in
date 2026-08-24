import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import { campusStaticParams, campusInstitutionForSlug, buildManageMetadata } from "@/lib/campus-seo";

// Dedicated, admin-provisioned-only Principal login - CampusApp's own
// pathname router resolves this segment to CampusStaffLogin; this page just
// needs to exist as a real static route so the URL is bookmarkable/
// refreshable and generates cleanly under output: 'export'. noindex/nofollow
// since this is a private staff login, not a marketing surface.
export async function generateStaticParams() {
  return campusStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildManageMetadata(inst, "Principal Login");
}

export default async function CampusPrincipalLoginPage({ params }) {
  const { slug } = await params;
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();
  return <CampusApp />;
}
