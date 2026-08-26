// Generic fallback - real per-contest title/description come from
// ContestPreviewService via contestPreviewRouter (functions/index.js) on the
// new /contest/{id} shareable route (see Phase 2 of the SEO plan). This
// covers the existing ?id= in-app route, which keeps working unchanged.
export const metadata = {
  title: "Contest",
  description: "Compete in a scheduled, ranked coding or aptitude contest on DeVert Arena.",
  alternates: { canonical: "https://devert.in/arena/contests/details" },
  openGraph: {
    title: "Contest | DeVert Arena",
    description: "Compete in a scheduled, ranked coding or aptitude contest on DeVert.",
    url: "https://devert.in/arena/contests/details",
  },
};

export default function ContestDetailsLayout({ children }) {
  return children;
}
