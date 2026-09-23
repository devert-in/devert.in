"use client";

import { usePathname } from "next/navigation";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";
import { FOUNDERS } from "@/lib/founders";
import { NAV_ROUTES } from "@/lib/navConfig";

// The site footer. Structurally the same four-column sitemap + credit bar that
// careers.devert.in uses, in this app's own neon-terminal type rather than
// Careers' quiet one - asked for directly after the Careers version landed.
//
// WHAT IT REPLACED, so nobody puts it back: this used to be a marketing panel -
// a four-line manifesto, a "$ ls /social" terminal affectation, and a
// [ JOIN_THE_SQUAD ] signup button. That button was being shown to signed-in
// members on their own dashboard, and the fix at the time was to hide the whole
// footer from them, which left the dashboard ending on a hard edge with no
// route to About or the legal pages. A sitemap footer solves both: it is
// genuinely useful signed-in, so it no longer needs a logged-in special case,
// and nothing in it asks an existing member to sign up.
//
// COLUMNS COME FROM lib/navConfig.js, not a hand-kept list. CLAUDE.md's rule is
// that every nav surface reads from that one registry; a footer sitemap is a
// nav surface, and a hand-maintained copy here would drift the first time a
// route was added. Only LEGAL is literal - none of those are nav routes.

const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/111474265/" },
  { label: "Instagram", href: "https://www.instagram.com/devert.in" },
  { label: "YouTube", href: "https://youtube.com/@devert5" },
];

// `desktop` is the group key each route already carries for top-navbar.jsx's
// dropdowns. "more" is folded into Connect rather than given a column of its
// own: it is mostly coming-soon placeholders, and a column of four dead links
// reads worse than four quiet ones at the end of a real list.
const GROUPS = [
  { key: "explore", title: "Explore", keys: ["explore"] },
  { key: "build", title: "Build", keys: ["build"] },
  { key: "connect", title: "Connect", keys: ["connect", "more"] },
];

const LEGAL = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "https://careers.devert.in" },
  { label: "Changelog", href: "/logs" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Workplace Policy", href: "/workplace" },
];

function columnLinks(keys) {
  return NAV_ROUTES.filter(r => keys.includes(r.desktop));
}

function FooterLink({ href, children }) {
  // Anything off this origin opens in a new tab; everything else is a normal
  // same-origin navigation. Plain <a> throughout - a footer is the one place
  // a full document load costs nothing and avoids prefetching the entire
  // sitemap on every page.
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-mono text-[13px] text-white/40 hover:text-neon-cyan transition-colors w-fit"
    >
      {children}
    </a>
  );
}

export function Footer() {
  const pathname = usePathname();
  const { hasShownIntro } = useIntro();
  const { user } = useAuth();

  // "/" is suppressed only during the pre-auth intro splash, which this would
  // otherwise render behind. Signed-in members DO get the footer now - see the
  // header comment for why that reversed.
  //
  // /pulse is a continuously-scrolling feed and /u/* is a public portfolio that
  // carries its own minimal credit line (see app/u/page.jsx); DeVert chrome is
  // not part of someone else's portfolio. /admin is a tool, not a page.
  if (pathname === "/" && !user && !hasShownIntro) return null;
  if (pathname.startsWith("/admin") || pathname === "/pulse" || pathname.startsWith("/u/")) return null;

  return (
    <footer className="relative border-t border-white/5 mt-20 pb-28">
      <div className="relative max-w-6xl mx-auto px-6 pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 mb-12">

          {/* Brand + who built it */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-sans font-bold text-lg text-white mb-3">
              De<span className="text-neon-green">Vert</span>
            </p>
            <p className="font-mono text-[12.5px] text-white/35 leading-relaxed max-w-xs mb-5">
              An operating system for serious developers, and the learning
              platform built on top of it for colleges across India.
            </p>
            {/* Footer credit - the only place founder names belong. Links go to
                LinkedIn, not /u/{handle}: see lib/founders.js. */}
            <p className="font-mono text-[12.5px] text-white/25 leading-relaxed">
              Built by{" "}
              {FOUNDERS.map((f, i) => (
                <span key={f.key}>
                  {i > 0 && " & "}
                  <a
                    href={f.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/45 hover:text-neon-cyan transition-colors"
                  >
                    {f.name}
                  </a>
                </span>
              ))}
            </p>
          </div>

          {GROUPS.map(group => (
            <div key={group.key}>
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neon-green/55 mb-4">
                {group.title}
              </p>
              <div className="flex flex-col gap-2.5">
                {columnLinks(group.keys).map(r => (
                  <FooterLink key={r.key} href={r.href}>{r.label}</FooterLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-neon-green/55 mb-4">
              Legal
            </p>
            <div className="flex flex-col gap-2.5">
              {LEGAL.map(l => (
                <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="font-mono text-xs text-white/20">
            &copy; 2026 DeVert.in - All systems operational.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {SOCIAL.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-white/30 hover:text-neon-cyan transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
