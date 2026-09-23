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
// Shared with devert.in and campus through this app's jsconfig @/* fallback.
// Safe to import here despite the no-@source rule: it is a hook with no JSX and
// no Tailwind class names, so nothing of it needs compiling by this app.
import { useScrolled } from "@/lib/useScrolled";

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
  // Solid on scroll, and forced solid while the mobile sheet is open.
  const solid = useScrolled() || open;

  return (
    // Was a permanently-filled bar (bg-ink-50/85 + blur). Now the shared
    // adaptive bar, so all three sites open on an unbroken plate and gain
    // their surface at the same moment.
    <header className={`devert-navbar ${solid ? "is-solid" : ""}`}>
      <div className="devert-navbar-inner">
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
            className="rounded-full bg-brand-600 px-4 py-2 text-[13.5px] font-semibold text-[#05080F] transition-colors hover:bg-brand-700">
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
        /* An inset card anchored under the menu button, not a full-width
           strip. It was a bg-ink-50 band spanning the whole phone with a
           hairline under every row - nine rules stacked down the screen.
           The header is position:sticky, so this absolute child anchors to
           it with no `relative` needed. */
        <div className="devert-navbar-panel md:hidden absolute right-3 top-full mt-2 flex flex-col p-2.5 max-h-[70vh] overflow-y-auto"
          style={{ width: "min(320px, calc(100vw - 24px))", borderRadius: 16 }}>
          <nav className="flex flex-col gap-0.5" aria-label="Sections">
            {SECTIONS.map((s) => (
              <Link key={s.label} href={s.href} onClick={() => setOpen(false)}
                className="px-3.5 py-3 text-[15px] font-medium text-ink-800"
                style={{ borderRadius: 10 }}>
                {s.label}
              </Link>
            ))}
            <span className="my-1.5 h-px" style={{ background: "var(--color-ink-200)" }} />
            {OFF_SITE.map((s) => (
              <a key={s.label} href={s.href} onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-3 text-[15px] font-medium text-ink-600"
                style={{ borderRadius: 10 }}>
                {s.label} <ArrowUpRight size={14} />
              </a>
            ))}

            <a href="#open-roles" onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-brand-600 px-4 py-2.5 text-center text-[14px] font-semibold text-[#05080F]">
              See open roles
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
