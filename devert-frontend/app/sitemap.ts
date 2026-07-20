import { fetchInstitutions } from "@/lib/institutions";
import { fetchPublishedContests } from "@/lib/contests";
import { fetchPublishedProblems } from "@/lib/codelab";

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
    { url: "https://devert.in/codelab", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/shipyard", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/intel", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/missions", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/grind", changeFrequency: "daily", priority: 0.9 },
    { url: "https://devert.in/pulse", changeFrequency: "hourly", priority: 0.9 },
    { url: "https://devert.in/campus", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/broadcast", changeFrequency: "weekly", priority: 0.7 },
    { url: "https://devert.in/ranks", changeFrequency: "daily", priority: 0.8 },
    { url: "https://devert.in/hackathons", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://devert.in/login", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://devert.in/privacy", changeFrequency: "monthly", priority: 0.3 },
    { url: "https://devert.in/terms", changeFrequency: "monthly", priority: 0.3 },
  ].map(r => ({ ...r, lastModified: new Date() }));

  const [institutions, contests, problems] = await Promise.allSettled([
    fetchInstitutions(),
    fetchPublishedContests(),
    fetchPublishedProblems(),
  ]);

  // lib/contests.js and lib/institutions.js are plain JS (no declared return
  // shape) - `any` here is the pragmatic match for a codebase that isn't
  // otherwise typed, not a real type-safety gap.
  const institutionUrls = (institutions.status === "fulfilled" ? institutions.value : []).map((inst: any) => ({
    url: `https://devert.in/campus/${inst.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

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

  const problemUrls = (problems.status === "fulfilled" ? problems.value : []).map((p: any) => ({
    url: `https://devert.in/codelab/problem?id=${p.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...institutionUrls, ...contestUrls, ...problemUrls];
}
