import { fetchPublishedContests } from "@/lib/contests";
import { hackathonStaticParams } from "@/lib/hackathon-seo";
// Campus's own institution/section URLs moved to devert-campus/app/sitemap.ts
// alongside the rest of Campus - it's now a different origin
// (campus.devert.in), so it needs its own sitemap, not an entry in this one.

// Required for output: 'export' - without this Next.js can't tell that this
// route has no per-request dynamic behavior to statically pre-render.
export const dynamic = "force-static";

// Runs once at `next build` time (output: 'export' has no per-request
// server), so entity URLs here are exactly as fresh as the last deploy -
// same staleness window as everything else in this static export. Every
// query here is the same public, unauthenticated client-SDK call
// lib/*.js already uses elsewhere - no admin credentials needed, since
// these collections are already publicly readable per firestore.rules
// (published/status-gated, or public directories like institutions).
export default async function sitemap() {
  const staticRoutes = [
    { url: "https://devert.in/", changeFrequency: "daily", priority: 1.0 },
    { url: "https://devert.in/arena", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/shipyard", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/intel", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/missions", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/grind", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/pulse", changeFrequency: "hourly", priority: 0.9 },
    { url: "https://devert.in/broadcast", changeFrequency: "weekly", priority: 0.7 },
    { url: "https://devert.in/ranks", changeFrequency: "daily", priority: 0.8 },
    { url: "https://devert.in/events", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/about", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://devert.in/login", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://devert.in/privacy", changeFrequency: "monthly", priority: 0.3 },
    { url: "https://devert.in/terms", changeFrequency: "monthly", priority: 0.3 },
  ].map(r => ({ ...r, lastModified: new Date() }));

  const [contests, hackathons] = await Promise.allSettled([
    fetchPublishedContests(),
    hackathonStaticParams(),
  ]);

  // lib/contests.js is plain JS (no declared return shape) - `any` here is
  // the pragmatic match for a codebase that isn't otherwise typed, not a
  // real type-safety gap.

  // Global (non-institution-scoped) contests only - institution-scoped ones
  // are gated to that college's own members, never meant to be public/indexed.
  const contestUrls = (contests.status === "fulfilled" ? contests.value : [])
    .filter((c: any) => !c.institutionId)
    .map((c: any) => ({
      url: `https://devert.in/contest/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const hackathonUrls = (hackathons.status === "fulfilled" ? hackathons.value : []).map((h: any) => ({
    url: `https://devert.in/h/${h.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // No careers URLs here on purpose: careers.devert.in is a different origin
  // and ships its own sitemap (devert-careers/app/sitemap.ts). A sitemap may
  // only list URLs on the host that serves it, and devert.in/careers is now
  // just a 301 to that host.

  return [...staticRoutes, ...contestUrls, ...hackathonUrls];
}
