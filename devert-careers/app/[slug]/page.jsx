// A single role, at careers.devert.in/{slug}.
//
// Note the path shape: domain-root, NOT /careers/{slug}. This app IS careers,
// so there is no "careers" segment any more - the same reshaping Campus went
// through when it moved to its own origin. Any absolute URL built here must use
// lib/careers-seo.js's SITE (careers.devert.in), never devert.in.
//
// This [slug] route sits at the app root, so it matches any single path segment
// that is not a real file or folder. Everything else in this app must therefore
// live at a reserved path (/sitemap.xml, /robots.txt) or be a known segment -
// adding a top-level marketing page later means adding its folder here, which
// takes precedence over this catch-all.

import { RoleDetailView } from "@/components/role-detail-view";
import {
  buildEmptyRoleMetadata, buildRoleMetadata, careerStaticParams, roleForSlug, roleJsonLd,
} from "@/lib/careers-seo";
import { jsonLdHtml } from "@/lib/jsonLd";

export async function generateStaticParams() {
  return careerStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const role = await roleForSlug(slug);
  // Covers the NO_OPEN_ROLES_SLUG placeholder and any role deleted between the
  // param list being built and this running. Both get noindex - see
  // careerStaticParams for why the placeholder exists at all.
  if (!role) return buildEmptyRoleMetadata();
  return buildRoleMetadata(role, slug);
}

export default async function RolePage({ params }) {
  const { slug } = await params;
  const role = await roleForSlug(slug);

  // Deliberately NOT notFound(). Under output: 'export' the only slugs that get
  // an HTML file are the ones generateStaticParams returned, so a genuinely
  // unknown URL never reaches this component - Firebase Hosting serves its own
  // 404 for it. What DOES reach here is the placeholder, and calling notFound()
  // on the one route that exists to keep the build valid would defeat the point.
  // RoleDetailView renders its "no longer listed" state for a null role.
  if (!role) return <RoleDetailView slug={slug} />;

  const jsonLd = roleJsonLd(role, slug);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <RoleDetailView slug={slug} />
    </>
  );
}
