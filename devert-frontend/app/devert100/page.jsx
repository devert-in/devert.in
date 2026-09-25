import { Devert100App } from "@/components/devert100/devert100-app";
import { runJsonLd } from "@/lib/devert100Seo";

// A SERVER component that renders the client app beneath it.
//
// It used to be "use client" itself, purely to render <Devert100App />. Making
// it a server component costs nothing - the interactive part is still the
// client component below - and it is the only place the Course markup can go:
// the shared layout also wraps /devert100/day/[day], so putting it there
// stamped the whole 100-entry syllabus onto every day page.
export default function Devert100Page() {
  const jsonLd = runJsonLd();
  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <Devert100App />
    </>
  );
}
