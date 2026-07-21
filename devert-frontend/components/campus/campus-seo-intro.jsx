import Link from "next/link";

// Plain server component (no "use client") - rendered above <CampusApp> on
// every statically-generated /campus/[slug]/** section page. CampusApp's
// real content is gated behind a client-side membership check (CAMPUS_PHASE)
// that only resolves after hydration in a real browser, so a crawler (or
// anyone loading the page before JS runs) would otherwise see nothing but a
// "Loading..." shell - real title/description/OG tags with no matching
// visible body text. This block guarantees real, keyword-matching text and
// a real breadcrumb <nav> are present in the static HTML output.
export function CampusSeoIntro({ breadcrumbItems, h1, description }) {
  return (
    <header className="max-w-5xl mx-auto px-5 sm:px-8 pt-6">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-1.5 text-[11px] font-medium flex-wrap text-white/45">
          {breadcrumbItems.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:underline hover:text-white/70">{item.label}</Link>
              ) : (
                <span aria-current="page" className="text-white/70 font-semibold">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="text-lg sm:text-xl font-bold text-white mb-1.5">{h1}</h1>
      <p className="text-[13px] leading-relaxed text-white/55 max-w-2xl">{description}</p>
    </header>
  );
}
