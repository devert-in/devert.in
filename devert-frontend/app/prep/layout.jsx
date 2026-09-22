// Next.js metadata inherits down the segment tree - one layout here covers
// all 13 routes under app/prep/** (admin, analytics, code, contests(/run),
// exams(/take, /review), faculty, learn, onboarding, practice), none of
// which had ever set their own, unlike every sibling module. They fell back
// to the root layout's generic title/description instead. A single shared
// title is deliberate here (not 13 near-duplicate layout files): Prep is one
// cohesive module, and its internal screens (exam-taking, faculty cohort
// view, admin content management) aren't individually SEO-relevant the way
// e.g. a public hackathon page is - see PREP_MODULE.md for what each route
// actually does.
export const metadata = {
  title: "Placements Prep",
  description: "Weekday lessons, a practice question bank, timed coding contests and weekend mock tests for placement prep - plus your own progress analytics.",
  alternates: { canonical: "https://devert.in/prep" },
  openGraph: {
    title: "Placements Prep | DeVert",
    description: "Weekday lessons, practice, contests and mock tests for placement prep.",
    url: "https://devert.in/prep",
  },
};

export default function PrepLayout({ children }) {
  return children;
}
