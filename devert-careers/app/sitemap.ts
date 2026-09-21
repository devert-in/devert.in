import { publishedRoleSlugs } from "@/lib/careers-seo";

// Required for output: 'export' - without this Next.js can't tell that this
// route has no per-request dynamic behavior to statically pre-render.
export const dynamic = "force-static";

// Runs once at `next build` (output: 'export' has no per-request server), so
// role URLs here are exactly as fresh as the last deploy - the same staleness
// window as everything else in this static export. The query is the same
// public, unauthenticated client-SDK read lib/careers.js uses everywhere else;
// job_openings is world-readable by rule, so no admin credentials are needed.
//
// careers.devert.in gets its OWN sitemap rather than an entry in
// devert-frontend's: it is a different origin, and a sitemap may only list URLs
// on the host that serves it. devert-frontend/app/sitemap.ts was updated to
// drop its careers entries when this app was split out - the Campus migration
// left a comment there claiming a sitemap had moved when no such file had
// actually been created, so this one exists from day one.
export default async function sitemap() {
  const roles = await publishedRoleSlugs().catch(() => []);

  return [
    {
      url: "https://careers.devert.in",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // publishedRoleSlugs(), NOT careerStaticParams(): the latter substitutes a
    // noindex placeholder when nothing is published, to keep output: 'export'
    // from failing the build, and that placeholder must never be advertised.
    ...roles.map((r: any) => ({
      url: `https://careers.devert.in/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
