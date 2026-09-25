import { Devert100Workspace } from "@/components/devert100/devert100-workspace";
import { dayMetadata, dayJsonLd } from "@/lib/devert100Seo";
import { jsonLdHtml } from "@/lib/jsonLd";

// All 100 params come from a constant, with no Firestore read - unlike
// /h/[slug] and the other dynamic routes here, which have to reach the database
// at build time. That matters under `output: export`: this route cannot be the
// one that breaks a build when the network is unavailable, and an empty param
// list (which fails the WHOLE export with a misleading error) is impossible.
export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ day: String(i + 1) }));
}

// Per-day titles and descriptions, from the build-time catalogue rather than
// Firestore for the same reason. Without this all 100 pages shared the site
// default, which gave Google 100 indistinguishable entries for 100 pages about
// 100 different, heavily-searched problems.
export async function generateMetadata({ params }) {
  const { day } = await params;
  return dayMetadata(day);
}

export default async function Devert100DayPage({ params }) {
  const { day } = await params;
  const jsonLd = dayJsonLd(day);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <Devert100Workspace day={day} />
    </>
  );
}
