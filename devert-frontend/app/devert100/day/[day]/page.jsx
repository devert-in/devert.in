import { Devert100Workspace } from "@/components/devert100/devert100-workspace";

// All 100 params are known from a constant, with no Firestore read - unlike
// /h/[slug] and the other dynamic routes here, which have to reach the database
// at build time. That matters under `output: export`: this route cannot be the
// one that breaks a build when the network is unavailable, and an empty param
// list (which fails the WHOLE export with a misleading error) is impossible.
export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ day: String(i + 1) }));
}

export default async function Devert100DayPage({ params }) {
  const { day } = await params;
  return <Devert100Workspace day={day} />;
}
