// Metadata lives in a layout, not the page, because the page is a client
// component (it reads auth and subscribes to the participant document) and a
// client component cannot export metadata. Same arrangement as /arena.
//
// Only the PUBLIC face of this route is described here - the landing pitch and
// the 100-day plan. The personal dashboard on the same URL renders client-side
// behind auth, so a crawler never sees anyone's progress.
export const metadata = {
  title: "DeVert100 - 100 Days of DSA",
  description:
    "Join DeVert100, a 100-day execution-focused DSA run with 100+ problems, an in-browser scratchpad, progress tracking and developer milestones. Runs 23 Sep to 31 Dec 2026.",
  alternates: { canonical: "https://devert.in/devert100" },
  openGraph: {
    title: "DeVert100 | 100 Days. 100+ Problems.",
    description:
      "Stop collecting tutorials. Start solving. A structured 100-day DSA run for developers who want to actually execute.",
    url: "https://devert.in/devert100",
  },
};

export default function Devert100Layout({ children }) {
  return children;
}
