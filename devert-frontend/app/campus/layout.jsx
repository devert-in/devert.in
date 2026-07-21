// Generic fallback - real per-institution title/description come from
// CampusPreviewService via campusPreviewRouter (functions/index.js), which
// only crawlers ever see (see Phase 2 of the SEO plan).
export const metadata = {
  title: { default: "DeVert Campus", template: "%s | DeVert Campus" },
  description: "Structured learning & placement prep, run by your college - daily practice, assessments, contests and leaderboards on DeVert Campus.",
  alternates: { canonical: "https://devert.in/campus" },
  openGraph: {
    title: "DeVert Campus",
    description: "Structured learning & placement prep, run by your college.",
    url: "https://devert.in/campus",
  },
};

export default function CampusLayout({ children }) {
  return children;
}
