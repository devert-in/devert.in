import { notFound } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";
import {
  campusStaticParams, campusInstitutionForSlug, buildCampusMetadata,
  campusJsonLd, GLOBAL_SECTIONS,
} from "@/lib/campus-seo";

// campus-app.jsx also treats /campus/{contests|learning|practice} as
// reserved, pre-auth-usable global sections (GLOBAL_SECTIONS), not
// institution slugs - but that dispatch is entirely CLIENT-side. This page
// is what actually decides whether the request even reaches that client
// code: campusInstitutionForSlug() obviously never finds a real institution
// named "practice", so without this special case every one of those 3 paths
// (bookmarked, refreshed, or hit via Next's on-demand RSC fetch for a
// dynamic segment outside generateStaticParams - which is exactly what a
// client-side router.push(\"/practice\") triggers) called notFound()
// unconditionally - a real, live 404 on every Campuses-nav
// Learning/Contests/Practice link.
const GLOBAL_SECTION_SET = new Set(GLOBAL_SECTIONS);

export async function generateStaticParams() {
  const institutionParams = await campusStaticParams();
  return [...institutionParams, ...GLOBAL_SECTIONS.map((slug) => ({ slug }))];
}

// `learning` hosts the whole public Learn hub, not just the course catalog -
// Fundamentals, Programming, CS Core and Aptitude are selected within it via
// ?tab= (see LEARN_MODULES in campus-app.jsx), and `practice` likewise carries
// DSA sheets and concepts alongside the problem set. These titles describe what
// is actually reachable there rather than the single surface each route started
// life as.
const GLOBAL_SECTION_METADATA = {
  contests: { title: "Contests", description: "Compete in open coding contests - real submissions and ranks, no college required." },
  learning: { title: "Learn", description: "Programming languages, CS Core subjects, software engineering fundamentals and aptitude - one central curriculum, open to anyone." },
  practice: { title: "Practice", description: "DSA problems graded against real test cases, curated sheets, concept roadmaps and company-wise interview prep." },
  // Titled for what candidates actually search - "GATE CSE previous year
  // questions" - rather than for the internal module name, and naming the
  // paper codes (CS/DA) because that is how the exam itself is referred to.
  gate: {
    title: "GATE CSE Preparation & Previous Year Questions",
    description: "Prepare for GATE CS & DA - the full syllabus subject by subject, previous year questions sliced by year, subject and topic, mock tests, a mistakes notebook and per-topic analytics. Free and open to everyone.",
  },
  // The three former landing-page sections, now real pages (see
  // LANDING_PAGE_SECTIONS) - each with its own title/description precisely so
  // it can rank and be shared as itself rather than as a fragment of /campus.
  campuses: { title: "Campuses", description: "Every college running DeVert Campus. Find yours and request access - your Training & Placement Cell approves it." },
  institutions: { title: "For institutions", description: "Daily Learning scheduling, assessments, contests, leaderboards and role-based dashboards for principals, HODs, faculty and placement cells." },
  pricing: { title: "Pricing", description: "Free to learn. Individual Premium is ₹29 a month per learner, down to ₹19.1 a month on the yearly plan, with an 11-day free trial; a campus licence is quoted per institution." },
  "daily-learning": { title: "Daily Learning for institutions", description: "Schedule structured weekly learning plans for every batch, track classroom and department progress, and turn daily learning into a campus-wide habit." },
  assessments: { title: "Assessments & Contests for institutions", description: "Create assessments and coding contests, auto-evaluate submissions, rank performance, and surface placement readiness for your students." },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (GLOBAL_SECTION_SET.has(slug)) return GLOBAL_SECTION_METADATA[slug];
  const inst = await campusInstitutionForSlug(slug);
  if (!inst) return { title: "Campus not found" };
  return buildCampusMetadata(inst, "dashboard");
}

export default async function CampusInstitutionPage({ params }) {
  const { slug } = await params;
  if (GLOBAL_SECTION_SET.has(slug)) return <CampusApp initialTab="dashboard" />;

  const inst = await campusInstitutionForSlug(slug);
  if (!inst) notFound();

  const jsonLd = campusJsonLd(inst, "dashboard");

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <CampusApp initialTab="dashboard" />
    </>
  );
}
