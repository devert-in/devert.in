"use client";

// Sticky top bar.
//
// Every link that leaves this site is ABSOLUTE and cross-origin
// (https://devert.in/..., https://campus.devert.in). This is the single most
// error-prone thing about running DeVert across subdomains: a relative
// href="/" here points at careers.devert.in's own home, not devert.in's, and
// that exact bug shipped during the Campus cutover (campus-public-nav.jsx's
// "Return to DeVert" arrow). Anything pointing off this origin uses a full URL
// and a plain <a>, never next/link.

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";

// FOUNDERS IS DELIBERATELY NOT IMPORTED HERE, unlike the other two apps' navs.
//
// devert.in's top-navbar/dock and campus.devert.in's public nav each render a
// founders DROPDOWN, because neither site has anywhere else to put the
// founders. This site does: components/founders.jsx is a real
// <section id="founders"> on the home page, with a card per founder linking
// straight to their devert.in profile. So the header reaches it the same way
// it reaches Open roles, Life at DeVert and How we hire - through SECTIONS
// below, as an in-page anchor.
//
// A dropdown here as well would put the word "Founders" in this bar twice,
// three inches apart, pointing at two different things. One affordance per
// destination.

const DEVERT_URL = "https://devert.in";
const CAMPUS_URL = "https://campus.devert.in";

// Same-origin links use next/link; the rest are real cross-origin navigations.
const SECTIONS = [
  { label: "Open roles", href: "/#open-roles", external: false },
  { label: "Life at DeVert", href: "/#life", external: false },
  { label: "Founders", href: "/#founders", external: false },
  { label: "How we hire", href: "/#hiring", external: false },
];

const OFF_SITE = [
  { label: "Product", href: DEVERT_URL },
  { label: "Campus", href: CAMPUS_URL },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink-900">DeVert</span>
          <span className="text-[13px] font-medium text-ink-500">Careers</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
          {SECTIONS.map((s) => (
            <Link key={s.label} href={s.href}
              className="text-[14px] font-medium text-ink-600 transition-colors hover:text-ink-900">
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-5 md:flex">
          {OFF_SITE.map((s) => (
            <a key={s.label} href={s.href}
              className="group inline-flex items-center gap-1 text-[14px] font-medium text-ink-500 transition-colors hover:text-ink-900">
              {s.label}
              <ArrowUpRight size={13} className="text-ink-400 transition-colors group-hover:text-ink-700" />
            </a>
          ))}
          <a href="#open-roles"
            className="rounded-full bg-brand-600 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-700">
            See open roles
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2 sm:px-8" aria-label="Sections">
            {SECTIONS.map((s) => (
              <Link key={s.label} href={s.href} onClick={() => setOpen(false)}
                className="border-b border-ink-100 py-3 text-[15px] font-medium text-ink-700">
                {s.label}
              </Link>
            ))}
            {OFF_SITE.map((s) => (
              <a key={s.label} href={s.href} onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 border-b border-ink-100 py-3 text-[15px] font-medium text-ink-500 last:border-0">
                {s.label} <ArrowUpRight size={14} />
              </a>
            ))}

            <a href="#open-roles" onClick={() => setOpen(false)}
              className="my-3 rounded-full bg-brand-600 px-4 py-2.5 text-center text-[14px] font-semibold text-white">
              See open roles
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
