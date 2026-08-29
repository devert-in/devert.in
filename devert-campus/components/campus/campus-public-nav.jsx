"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, UserCircle2,
  X as CloseIcon, Menu, CodeXml, BrainCircuit, Calculator, Layers, Sparkles,
  GraduationCap, BookOpen, Code2, ListChecks, Briefcase, Trophy, Building2,
  Users, ClipboardCheck, LayoutDashboard, LineChart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEVERT_URL } from "@/lib/campusUrl";
import { CAMPUS } from "@/lib/campus-theme";
import { useCampusTheme } from "@/components/campus/campus-theme-provider";
import { CampusBadge, CampusCard, CampusGoogleButton } from "@/components/campus/campus-ui";
import { DemoRequestDialog, DEMO_EMAIL } from "@/components/campus/campus-demo-request";

// The public Campus header, extracted out of campus-landing.jsx so it can sit on
// EVERY public Campus page rather than only the marketing ones.
//
// It used to live inside campus-landing.jsx, which meant it rendered on /campus,
// /campus/campuses, /campus/institutions and /campus/pricing - and vanished the
// moment you followed one of its own links into /campus/learning, /practice or
// /contests. Those pages grew a bespoke left rail listing every section instead,
// so the site had two entirely different navigation systems depending on which
// page you were standing on, and clicking "Programming" landed you on a screen
// whose most prominent element was a list of the six things you had NOT clicked.
// One nav, everywhere, is the whole point of this file.
//
// Deliberately NOT the authenticated workspace's chrome: /campus/{slug} has its
// own institution-scoped navbar + sidebar (CampusTopBar/CampusTopNavbar in
// campus-app.jsx) and must not grow a second one on top.

export const SUPPORT_EMAIL = DEMO_EMAIL;

// The nav's mega-menus. EVERY href is a real route - no "#section" anchors and
// no scrollIntoView. The first version of this nav scrolled the landing page to
// Campuses/Pricing/For-institutions, which meant those three could not be
// linked, shared, bookmarked or indexed independently; they are now their own
// pages (LANDING_PAGES in campus-landing.jsx), and the menu points at them.
//
// An item with `href` and no `columns` renders as a plain link with no chevron:
// a disclosure arrow that opens a one-row panel is worse than just going there.
// An item with `action: "demo"` opens the lead-capture dialog this component
// owns, rather than being a mailto: that does nothing on a machine with no mail
// client registered - see campus-demo-request.jsx's own header.
const NAV_MENUS = [
  {
    label: "Learn",
    columns: [
      {
        title: "Tracks",
        links: [
          { label: "Programming", href: "/learning?tab=programming", icon: CodeXml, hint: "One curriculum per language" },
          { label: "CS Core", href: "/learning?tab=csCore", icon: BrainCircuit, hint: "OS, DBMS, networks, OOP" },
          { label: "Fundamentals", href: "/learning?tab=fundamentals", icon: Layers, hint: "How software is really built" },
          { label: "Aptitude", href: "/learning?tab=aptitude", icon: Calculator, hint: "Quant, logical and verbal" },
        ],
      },
      {
        title: "Also here",
        links: [
          { label: "Courses", href: "/learning?tab=courses", icon: GraduationCap, hint: "Guided, enrollable paths" },
          { label: "DSA Concepts", href: "/practice?mode=concepts", icon: BookOpen, hint: "Theory before the problems" },
        ],
      },
    ],
    featured: {
      title: "One curriculum, every learner",
      body: "Authored once and shared by every college and every public learner, so a fix reaches all of them at once.",
      href: "/learning", cta: "Open Learn",
    },
  },
  // A top-level link of its own, same precedent as Contests below: Roadmaps
  // is the "where do I even start" orientation surface (role/career-based -
  // ML Engineer, Cybersecurity, VLSI, not a bare subject), and burying the
  // one thing a new visitor most needs inside a dropdown defeats its whole
  // purpose. It is also a GLOBAL, non-institution-scoped catalog (see
  // lib/roadmaps.js's header), so /campus/roadmaps is its real, permanent
  // home - never a per-college URL.
  { label: "Roadmaps", href: "/roadmaps" },
  {
    label: "Practice",
    columns: [
      {
        title: "Solve",
        links: [
          { label: "DSA Problems", href: "/practice", icon: Code2, hint: "Graded on real test cases" },
          { label: "DSA Sheets", href: "/practice?mode=sheets", icon: ListChecks, hint: "Curated, ordered curricula" },
          { label: "DSA Concepts", href: "/practice?mode=concepts", icon: BookOpen, hint: "Visualised roadmaps" },
        ],
      },
      {
        title: "Interviews",
        links: [
          { label: "Company Vault", href: "/practice?mode=companyPrep", icon: Briefcase, hint: "Round-by-round breakdowns" },
        ],
      },
    ],
    featured: {
      title: "Solve it once, it counts everywhere",
      body: "One problem set and one progress record sits behind every sheet, concept and contest.",
      href: "/practice", cta: "Open Practice",
    },
  },
  // Promoted to a top-level link of its own. Contests is a real, pre-auth-usable
  // route that was previously reachable only from inside the Practice menu's
  // second column - two clicks and a guess for the one surface on Campus that is
  // time-boxed, i.e. the one where being a click late actually costs something.
  { label: "Contests", href: "/contests" },
  {
    label: "Campuses",
    columns: [
      {
        title: "For students",
        links: [
          { label: "Find your college", href: "/campuses", icon: Building2, hint: "Every live campus" },
          { label: "What a campus adds", href: "/institutions", icon: Sparkles, hint: "Beyond the open tracks" },
        ],
      },
      {
        title: "For colleges",
        links: [
          { label: "Solutions by role", href: "/institutions", icon: Users, hint: "Principal to placement cell" },
        ],
      },
    ],
    featured: {
      title: "Gated to your own students",
      body: "Your Training & Placement Cell approves who gets in - DeVert never grants access on their behalf.",
      href: "/campuses", cta: "Browse campuses",
    },
  },
  {
    label: "For institutions",
    columns: [
      {
        // Daily Learning and Assessments & contests used to anchor into
        // InstitutionsBand's six role cards (#role-training-cell/#role-
        // students) - repurposed to their own dedicated pages instead (see
        // LANDING_PAGES' "daily-learning"/"assessments" entries in
        // campus-landing.jsx), each with its own PLAN/CREATE-stage flow,
        // feature cards and dashboard preview, so "what does Daily Learning
        // mean" gets a real answer instead of a highlighted card among six
        // unrelated roles.
        title: "The workspace",
        links: [
          { label: "Solutions by role", href: "/institutions", icon: Users, hint: "Six roles, one workspace" },
          { label: "Daily Learning", href: "/daily-learning", icon: ClipboardCheck, hint: "Schedule the weekly plan" },
          { label: "Assessments & contests", href: "/assessments", icon: Trophy, hint: "Run and grade your own" },
        ],
      },
      {
        title: "Getting started",
        links: [
          { label: "Licence & pricing", href: "/pricing", icon: LineChart, hint: "Quoted per institution" },
          { label: "Request a demo", action: "demo", icon: ArrowUpRight, hint: "Talk to us directly" },
        ],
      },
    ],
    featured: {
      title: "Schedules and outcomes, not copies",
      body: "A campus schedules the central content and owns the results. It never stores its own duplicate of a lesson.",
      href: "/institutions", cta: "See the platform",
    },
  },
  { label: "Pricing", href: "/pricing" },
];

// One row of a mega-menu column. A link and a dialog trigger have to look
// identical here - the visitor is picking a destination, not a control type -
// so both render through this and only the element differs.
function MenuRow({ link, onNavigate, onDemo }) {
  const body = (
    <>
      {link.icon && <link.icon size={15} style={{ color: CAMPUS.teal, marginTop: 2, flexShrink: 0 }} />}
      <span>
        <span className="block text-[14px] font-medium" style={{ color: CAMPUS.ink }}>{link.label}</span>
        {link.hint && <span className="block text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{link.hint}</span>}
      </span>
    </>
  );
  const className = "group flex items-start gap-2.5 py-1.5 pr-2 text-left w-full";

  if (link.action === "demo") {
    return <button className={className} onClick={() => { onNavigate(); onDemo(); }}>{body}</button>;
  }
  return <Link href={link.href} onClick={onNavigate} className={className}>{body}</Link>;
}

export function CampusPublicNav() {
  const { theme, toggleTheme } = useCampusTheme();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  // Which mega-menu is open, by label. One at a time - opening a second closes
  // the first, so two panels can never overlap.
  const [openMenu, setOpenMenu] = useState(null);
  // Mobile reuses the SAME NAV_MENUS tree as an accordion rather than keeping a
  // second, hand-maintained link list that drifts from the desktop one.
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);

  // Click-outside and Escape both close. Registered once, not per menu, and
  // only while something is actually open.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => { if (!navRef.current?.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const closeAll = () => { setOpenMenu(null); setMobileOpen(false); setOpenGroup(null); };

  return (
    <>
      {/* The horizontal padding lives on the inner row, NOT on <nav> itself: an
          absolutely-positioned child resolves against its ancestor's PADDING box,
          so with px-6 on the nav the dropdown panel below would sit inset by
          24-40px on each side instead of spanning the full bar. */}
      {/* .campus-glass-nav, not .campus-glass - see globals.css. The card glass
          is far too opaque for a bar; this is the iOS material: ~45% fill, a
          30px blur and a saturation boost so colour from the page bleeds through
          instead of being washed grey. Sticky is what makes it read as glass at
          all - content has to travel underneath for the backdrop-filter to have
          anything to work on. */}
      <nav ref={navRef} className="campus-glass-nav"
        style={{ borderBottom: `1px solid ${CAMPUS.line}`, position: "sticky", top: 0, zIndex: 30 }}>
        <div className="flex items-center gap-4 px-6 sm:px-10" style={{ height: 72 }}>
          <Link href="/" onClick={closeAll} className="flex items-center gap-2.5 font-bold text-[17px] flex-shrink-0" style={{ color: CAMPUS.ink }}>
            <CampusBadge size={30} />
            DeVert Campus
          </Link>

          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_MENUS.map(m => {
              if (!m.columns) return (
                <Link key={m.label} href={m.href} onClick={closeAll}
                  className="text-[14px] font-medium px-3 py-2" style={{ color: CAMPUS.ink }}>{m.label}</Link>
              );
              const on = openMenu === m.label;
              return (
                <button key={m.label} onClick={() => setOpenMenu(on ? null : m.label)}
                  aria-expanded={on} aria-haspopup="true"
                  className="text-[14px] font-medium px-3 py-2 inline-flex items-center gap-1.5"
                  style={{ color: on ? CAMPUS.teal : CAMPUS.ink }}>
                  {m.label}
                  <ChevronDown size={14} style={{ transform: on ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            <button onClick={toggleTheme} title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} style={{ color: CAMPUS.ink }}>
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            {/* Absolute, cross-origin - "/" is Campus's OWN home on this
                origin (campus.devert.in) now, not devert.in's, so a relative
                href here would just loop back to the Campus landing page
                instead of actually returning to the main site. */}
            <Link href={DEVERT_URL} title="Return to DeVert" className="hidden sm:block" style={{ color: CAMPUS.ink }}><ArrowLeft size={19} /></Link>

            {/* Signed out, the account panel is the ONLY sign-in surface on the
                public pages, and an icon-only circle never read as one. Both
                buttons open that same panel on purpose: Campus auth is Google-
                only, so "log in" and "sign up" are literally the same action -
                the panel says so rather than this pretending they are two
                different flows. */}
            {user ? (
              <button onClick={() => setFlyoutOpen(true)} title="Account"
                className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                <UserCircle2 size={19} />
              </button>
            ) : (
              <>
                <button onClick={() => setFlyoutOpen(true)}
                  className="campus-btn hidden sm:inline-flex text-[13.5px] font-semibold px-4 py-2 rounded-lg"
                  style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                  Log in
                </button>
                <button onClick={() => setFlyoutOpen(true)}
                  className="campus-btn campus-btn-glow text-[13.5px] font-semibold px-4 py-2 rounded-lg"
                  style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                  Sign up
                </button>
              </>
            )}

            <button onClick={() => setMobileOpen(o => !o)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}
              className="lg:hidden flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, color: CAMPUS.ink }}>
              {mobileOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Full-bleed panel under the whole bar, not a narrow popover anchored to
            one item - the enterprise-nav pattern, and the only way a multi-column
            menu with a featured card fits. Every row is a real <Link> to a real
            route; nothing in here scrolls the current page. */}
        {openMenu && (
          <div className="hidden lg:block absolute left-0 right-0 top-full campus-overlay-shadow"
            style={{ background: CAMPUS.surface, borderBottom: `1px solid ${CAMPUS.line}` }}>
            {NAV_MENUS.filter(m => m.label === openMenu).map(m => (
              <div key={m.label} className="max-w-6xl mx-auto px-6 sm:px-10 py-9 flex gap-12 flex-wrap">
                {m.columns.map(col => (
                  <div key={col.title} className="min-w-[190px]">
                    <p className="text-[10.5px] font-mono uppercase tracking-[0.15em] mb-4" style={{ color: CAMPUS.inkFaint }}>{col.title}</p>
                    <div className="flex flex-col gap-1">
                      {col.links.map(l => (
                        <MenuRow key={l.label} link={l} onNavigate={closeAll} onDemo={() => setDemoOpen(true)} />
                      ))}
                    </div>
                  </div>
                ))}
                {m.featured && (
                  <CampusCard className="p-6 ml-auto" style={{ maxWidth: 300, background: CAMPUS.paper }}>
                    <p className="text-[15.5px] font-semibold leading-snug mb-2" style={{ color: CAMPUS.ink }}>{m.featured.title}</p>
                    <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: CAMPUS.inkSoft }}>{m.featured.body}</p>
                    <Link href={m.featured.href} onClick={closeAll}
                      className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
                      {m.featured.cta} <ArrowRight size={13} />
                    </Link>
                  </CampusCard>
                )}
              </div>
            ))}
          </div>
        )}

        {mobileOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full flex flex-col max-h-[75vh] overflow-y-auto campus-overlay-shadow"
            style={{ background: CAMPUS.surface, borderBottom: `1px solid ${CAMPUS.line}` }}>
            {NAV_MENUS.map(m => {
              if (!m.columns) return (
                <Link key={m.label} href={m.href} onClick={closeAll}
                  className="px-6 py-3.5 text-[14.5px] font-medium" style={{ color: CAMPUS.ink, borderTop: `1px solid ${CAMPUS.line}` }}>
                  {m.label}
                </Link>
              );
              const on = openGroup === m.label;
              return (
                <div key={m.label} style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <button onClick={() => setOpenGroup(on ? null : m.label)} aria-expanded={on}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-[14.5px] font-medium" style={{ color: CAMPUS.ink }}>
                    {m.label}
                    <ChevronDown size={15} style={{ color: CAMPUS.inkFaint, transform: on ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
                  </button>
                  {on && (
                    <div className="pb-2" style={{ background: CAMPUS.paper }}>
                      {m.columns.flatMap(c => c.links).map(l => {
                        const rowClass = "flex items-center gap-2.5 px-6 py-2.5 text-[13.5px] w-full text-left";
                        const inner = (
                          <>
                            {l.icon && <l.icon size={14} style={{ color: CAMPUS.teal, flexShrink: 0 }} />}
                            {l.label}
                          </>
                        );
                        return l.action === "demo" ? (
                          <button key={l.label} className={rowClass} style={{ color: CAMPUS.inkSoft }}
                            onClick={() => { closeAll(); setDemoOpen(true); }}>{inner}</button>
                        ) : (
                          <Link key={l.label} href={l.href} onClick={closeAll} className={rowClass} style={{ color: CAMPUS.inkSoft }}>{inner}</Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <Link href={DEVERT_URL} onClick={closeAll}
              className="sm:hidden px-6 py-3.5 text-[14.5px] font-medium" style={{ color: CAMPUS.ink, borderTop: `1px solid ${CAMPUS.line}` }}>
              Return to DeVert
            </Link>
          </div>
        )}
      </nav>

      <ProfileFlyout open={flyoutOpen} onClose={() => setFlyoutOpen(false)} />
      <DemoRequestDialog open={demoOpen} onClose={() => setDemoOpen(false)} source="campus-nav" />
    </>
  );
}

function ProfileFlyout({ open, onClose }) {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  if (!open) return null;

  const tiles = user
    ? [
        { icon: BookOpen, label: "My learning", href: "/learning" },
        { icon: Code2, label: "My practice", href: "/practice" },
        { icon: Trophy, label: "My contests", href: "/contests" },
        { icon: LayoutDashboard, label: "My campus", href: "/campuses" },
      ]
    : [
        { icon: BookOpen, label: "Start learning", href: "/learning" },
        { icon: Code2, label: "Solve problems", href: "/practice" },
        { icon: Trophy, label: "Coding contests", href: "/contests" },
        { icon: Building2, label: "Find your college", href: "/campuses" },
      ];

  const included = [
    { icon: CodeXml, label: "Programming tracks", href: "/learning?tab=programming" },
    { icon: BrainCircuit, label: "CS Core subjects", href: "/learning?tab=csCore" },
    { icon: Code2, label: "DSA problem set", href: "/practice" },
    { icon: Briefcase, label: "Company Vault", href: "/practice?mode=companyPrep" },
    { icon: Calculator, label: "Aptitude practice", href: "/learning?tab=aptitude" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
        style={{ width: 420, maxWidth: "90vw", background: CAMPUS.surface, borderLeft: `1px solid ${CAMPUS.line}`, padding: "30px 34px" }}>
        <div className="flex items-start justify-between gap-3 mb-7">
          <p className="text-[19px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>
            {user ? `Welcome back, ${(userData?.displayName || "there").split(" ")[0]}` : "Get more with a DeVert account"}
          </p>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}><CloseIcon size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-7 mb-7">
          {tiles.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.label} onClick={() => { router.push(t.href); onClose(); }} className="flex flex-col items-start gap-2.5 text-left">
                <Icon size={26} style={{ color: CAMPUS.teal }} />
                <span className="text-[14px] font-medium" style={{ color: CAMPUS.ink }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {!user ? (
          <>
            <p className="text-[12px] mb-4" style={{ color: CAMPUS.inkSoft }}>
              Browsing needs no account. Sign in to save progress, streaks and submissions - joining a college campus is a separate request your Training &amp; Placement Cell approves.
            </p>
            <CampusGoogleButton label="Log in or register" style={{ background: CAMPUS.gradientPrimary, color: "#fff", width: "100%" }} />
          </>
        ) : (
          <button onClick={async () => { await logout(); onClose(); }}
            className="w-full text-[14.5px] font-bold py-3.5 rounded-lg" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
            Sign out
          </button>
        )}

        <div className="h-px my-5" style={{ background: CAMPUS.line, marginLeft: -34, marginRight: -34 }} />

        <div className="flex items-center justify-between mb-7">
          <span className="text-[13px] px-3 py-2 flex items-center gap-1.5 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            English <ChevronDown size={12} />
          </span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[13px] font-medium" style={{ color: CAMPUS.teal }}>Contact us</a>
        </div>

        <p className="text-[10.5px] font-mono tracking-wide uppercase mb-1" style={{ color: CAMPUS.inkFaint }}>Open to everyone</p>
        {included.map(b => {
          const Icon = b.icon;
          return (
            <button key={b.label} onClick={() => { router.push(b.href); onClose(); }}
              className="flex items-center gap-2.5 py-2.5 text-[13.5px] w-full text-left"
              style={{ borderBottom: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <Icon size={16} style={{ color: CAMPUS.inkSoft }} /> {b.label}
            </button>
          );
        })}
      </aside>
    </>
  );
}
