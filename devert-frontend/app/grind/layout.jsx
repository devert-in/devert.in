import { jsonLdHtml } from "@/lib/jsonLd";
export const metadata = {
  title: "Daily Grind",
  description: "Daily DSA and system design challenges. Show up every day. Grind is the only strategy that works.",
  alternates: { canonical: "https://devert.in/grind" },
  openGraph: {
    title: "Daily Grind | DeVert",
    description: "Daily DSA and system design challenges. Show up every day.",
    url: "https://devert.in/grind",
  },
};

// Describes the aptitude/DSA practice bank as a learning resource - static
// and generic (the actual topic list is client-fetched from Firestore, not
// known at build time), same additive-only JSON-LD pattern as the root layout.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "DeVert Grind",
  "description": "Daily aptitude and DSA practice challenges covering quantitative, logical, and verbal reasoning topics.",
  "provider": { "@type": "Organization", "name": "DeVert", "url": "https://devert.in" },
  "learningResourceType": "Practice problems",
  "educationalLevel": "Beginner to Advanced",
  "url": "https://devert.in/grind",
};

export default function GrindLayout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      {children}
    </>
  );
}
