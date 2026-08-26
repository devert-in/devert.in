import { fetchInstitutions } from "@/lib/institutions";
import { CAMPUS_SECTIONS, GLOBAL_SECTIONS } from "@/lib/campus-seo";
import { fetchRoadmapCatalog } from "@/lib/roadmaps-seo";

// Campus's own institution/section URLs, split out of devert-frontend's
// sitemap.ts when Campus moved to its own origin (campus.devert.in) - see
// that file's own note. Same reasoning throughout: everything here runs
// once at `next build` (output: 'export' has no per-request server), using
// the exact same public, unauthenticated client-SDK reads the rest of
// Campus's SEO helpers already rely on.
export const dynamic = "force-static";

const SITE = "https://campus.devert.in";

export default async function sitemap() {
  // "/" replaces the old https://devert.in/campus entry - the root of this
  // origin IS the open Campus landing page now, not a sub-path of the main
  // site. The other GLOBAL_SECTIONS (contests/learning/practice/campuses/
  // institutions/pricing) are real static pages too (see
  // app/[slug]/page.jsx's generateStaticParams) and get the same priority
  // tiers the old devert.in/campus/* entries used.
  const sectionPriority = { contests: 0.8, learning: 0.8, practice: 0.8, campuses: 0.7, institutions: 0.7, pricing: 0.7 };
  const sectionFrequency = { contests: "daily" };
  const staticRoutes = [
    { url: SITE, changeFrequency: "weekly", priority: 0.8 },
    ...GLOBAL_SECTIONS.map((section) => ({
      url: `${SITE}/${section}`,
      changeFrequency: sectionFrequency[section] || "weekly",
      priority: sectionPriority[section] ?? 0.7,
    })),
    { url: `${SITE}/roadmaps`, changeFrequency: "weekly", priority: 0.7 },
  ].map((r) => ({ ...r, lastModified: new Date() }));

  const [institutions, roadmaps] = await Promise.allSettled([
    fetchInstitutions(),
    fetchRoadmapCatalog(),
  ]);

  // One entry for the institution root plus one for each of its statically-
  // generated section pages (app/[slug]/**/page.jsx) - same section list and
  // URL shape generateStaticParams/generateMetadata build from, so this can
  // never drift out of sync with what actually got built.
  const institutionList = institutions.status === "fulfilled" ? institutions.value : [];
  const institutionUrls = institutionList.flatMap((inst) => [
    { url: `${SITE}/${inst.id}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    ...Object.values(CAMPUS_SECTIONS)
      .filter((s) => s.urlSegment)
      .map((s) => ({
        url: `${SITE}/${inst.id}/${s.urlSegment}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      })),
  ]);

  const roadmapList = roadmaps.status === "fulfilled" ? roadmaps.value : [];
  const roadmapUrls = roadmapList.map((r) => ({
    url: `${SITE}/roadmaps/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...institutionUrls, ...roadmapUrls];
}
