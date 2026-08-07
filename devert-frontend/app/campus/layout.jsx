// Generic fallback - real per-institution title/description come from
// CampusPreviewService via campusPreviewRouter (functions/index.js), which
// only crawlers ever see (see Phase 2 of the SEO plan).
// Reworded when /campus stopped being a college picker and became the open
// learning surface (see components/campus/campus-landing.jsx's header): a
// description promising something "run by your college" is the wrong first
// impression for the search visitor who has no college here, and it was the
// leak - they arrived, found only a login they could not pass, and left.
export const metadata = {
  title: { default: "DeVert Campus - learn to code, prepare for placements", template: "%s | DeVert Campus" },
  description: "Programming, CS Core, aptitude, DSA and company-wise interview prep - open to anyone, no college required. Colleges add scheduled Daily Learning, assessments, contests and leaderboards on top.",
  alternates: { canonical: "https://devert.in/campus" },
  openGraph: {
    title: "DeVert Campus",
    description: "Open technical learning and placement prep - plus a licensed workspace for colleges.",
    url: "https://devert.in/campus",
  },
};

export default function CampusLayout({ children }) {
  return children;
}
