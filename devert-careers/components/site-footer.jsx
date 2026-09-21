// Footer. Same cross-origin rule as site-header.jsx: every off-site href is a
// full absolute URL, because a relative one resolves against careers.devert.in.
//
// A server component on purpose - it holds no state, so shipping it as a client
// bundle would be pure waste on the page a cold visitor loads first.

import { ArrowUpRight } from "lucide-react";
// Cross-origin by necessity: /u/{handle} is a devert.in route, not one of
// ours. founderUrl() returns an absolute URL for exactly that reason.
import { FOUNDERS, founderUrl } from "@/lib/founders";

const DEVERT_URL = "https://devert.in";
const CAMPUS_URL = "https://campus.devert.in";

const COLUMNS = [
  {
    title: "DeVert",
    links: [
      { label: "Product", href: DEVERT_URL },
      { label: "About", href: `${DEVERT_URL}/about` },
      { label: "Campus", href: CAMPUS_URL },
      { label: "Events", href: `${DEVERT_URL}/events` },
    ],
  },
  {
    title: "Careers",
    links: [
      { label: "Open roles", href: "/#open-roles" },
      { label: "Life at DeVert", href: "/#life" },
      { label: "Founders", href: "/#founders" },
      { label: "How we hire", href: "/#hiring" },
      { label: "Workplace policy", href: `${DEVERT_URL}/workplace` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: `${DEVERT_URL}/privacy` },
      { label: "Terms of Service", href: `${DEVERT_URL}/terms` },
    ],
  },
];

const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/111474265/" },
  { label: "Instagram", href: "https://www.instagram.com/devert.in" },
  { label: "YouTube", href: "https://youtube.com/@devert5" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-semibold tracking-[-0.03em] text-ink-900">DeVert</span>
              <span className="text-[13px] font-medium text-ink-500">Careers</span>
            </div>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-ink-500">
              A developer operating system, and the learning platform built on top of it for
              colleges across India.
            </p>

            <p className="mt-4 text-[13px] text-ink-500">
              Built by{" "}
              {FOUNDERS.map((f, i) => (
                <span key={f.key}>
                  {i > 0 && " and "}
                  <a href={founderUrl(f)}
                    className="font-medium text-ink-700 underline-offset-2 transition-colors hover:text-brand-600 hover:underline">
                    {f.shortName}
                  </a>
                </span>
              ))}
              .
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-900">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}
                      className="text-[13.5px] text-ink-500 transition-colors hover:text-ink-900">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-ink-400">
            © {new Date().getFullYear()} DeVert. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-[12.5px] text-ink-500 transition-colors hover:text-ink-900">
                {s.label}
                <ArrowUpRight size={12} className="text-ink-300 transition-colors group-hover:text-ink-600" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
