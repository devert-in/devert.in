// Generic fallback only - real per-handle title/description come from
// PortfolioPreviewService via uHandleRouter (functions/index.js), which only
// crawlers ever see. This is what a signed-in browser's tab title reads
// before client-side data loads, and the metadata search engines see if a
// request somehow reaches the SPA shell directly instead of the Function.
export const metadata = {
  title: "Developer Portfolio",
  description: "View a developer's portfolio on DeVert - projects, skills, hackathons, and community contributions.",
  alternates: { canonical: "https://devert.in/u" },
  openGraph: {
    title: "Developer Portfolio | DeVert",
    description: "View a developer's portfolio on DeVert.",
    url: "https://devert.in/u",
  },
};

export default function UHandleLayout({ children }) {
  return children;
}
