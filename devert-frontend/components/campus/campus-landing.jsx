"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin, Search, BookOpen, ClipboardCheck, Trophy, ShieldCheck,
  ArrowRight, ArrowUpRight, GraduationCap, Building2,
  Users, ChevronRight, TrendingUp, Code2, Briefcase,
  CodeXml, BrainCircuit, Calculator, Layers, Sparkles,
  Lock, Check, ListChecks, Mic, LineChart, Flame, Plus, Minus, Crown,
} from "lucide-react";
import { fetchInstitutions, DEPARTMENTS } from "@/lib/institutions";
import { fetchPublishedContests, bucketContests, contestPhase } from "@/lib/contests";
import { fetchPublicCatalog } from "@/lib/campusCatalog";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { LanguageLogo } from "@/components/campus/language-logo";
import { useCampusTheme } from "@/components/campus/campus-theme-provider";
import { CampusPublicNav, SUPPORT_EMAIL } from "@/components/campus/campus-public-nav";
import { DemoRequestDialog } from "@/components/campus/campus-demo-request";
import { WaitlistDialog } from "@/components/campus/campus-waitlist";
import {
  CampusCard, CampusChip, CampusSkeleton, CampusEmptyState,
  CampusTable, CampusBadge,
} from "@/components/campus/campus-ui";

// The public front door at devert.in/campus.
//
// WHY THIS IS A PRODUCT PAGE AND NOT A COLLEGE PICKER. It used to be a
// directory: hero, search, a grid of institutions. That leaked every visitor
// who arrived from search - the only call to action was "pick your college",
// and picking one lands on a login the visitor's college has not approved them
// for, so they left without ever seeing the content. Everything the platform
// teaches is already CENTRAL and already world-readable (see
// lib/campusCatalog.js's header), so this page now leads with the learning
// itself and treats the campus directory as one section among many.
//
// The two audiences stay explicit and separate, exactly as the routes already
// are: /campus (here) is the open learning surface, /campus/{slug} is an
// institution's private workspace. Nothing here links into a workspace except
// the directory section, and nothing here promises institution-scoped features
// (Daily Learning schedules, leaderboards, analytics) as though a public
// learner had them - those are listed under "For institutions".
//
// DESIGN: the section rhythm is borrowed from enterprise product homepages -
// full-bleed alternating bands, one idea per band, an eyebrow label above every
// heading, and a left-rail explorer for the content catalog. The visual
// language is still Campus's own (CAMPUS tokens, hairline borders, the sharp
// pre-auth chrome the landing nav already established); only the information
// hierarchy is new.

// The nav bar, its mega-menus and the account flyout now live in
// campus-public-nav.jsx - see that file's header for why. SUPPORT_EMAIL comes
// back from there so this page and the nav can never disagree about the
// address, and campus-demo-request.jsx remains its single definition.

// Both public content surfaces already exist as real routes. `?tab=` is not
// invented here - it is exactly what CampusProgrammingTab/CampusCsCoreTab/
// CampusAptitudeTab/SeCourseApp each write into the URL themselves via their
// own replaceState effects, so deep-linking a module and then navigating
// inside it round-trips instead of fighting the component that owns the URL.
const LEARN_TRACKS = [
  {
    key: "programming",
    label: "Programming",
    icon: CodeXml,
    color: CAMPUS.teal,
    href: "/campus/learning?tab=programming",
    unit: "languages",
    countOf: (c) => c.languages.length,
    itemsOf: (c) => c.languages.map(l => l.name || l.id),
    blurb: "One curriculum per language, from syntax to the patterns interviews actually test. Every topic carries key points, a worked code example, and a quiz that has to be passed before the next topic unlocks.",
  },
  {
    key: "csCore",
    label: "CS Core",
    icon: BrainCircuit,
    color: CAMPUS.purple,
    href: "/campus/learning?tab=csCore",
    unit: "subjects",
    countOf: (c) => c.subjects.length,
    itemsOf: (c) => c.subjects.map(s => s.name || s.id),
    blurb: "The subjects every technical interview circles back to - operating systems, DBMS, networks, OOP. Same lesson engine as Programming, sequenced per subject.",
  },
  {
    key: "fundamentals",
    label: "Fundamentals",
    icon: Layers,
    color: CAMPUS.cyan,
    href: "/campus/learning?tab=fundamentals",
    unit: "modules",
    countOf: (c) => c.seModules.length,
    itemsOf: (c) => c.seModules.map(m => m.title || m.name || m.id),
    blurb: "How software is actually built: version control, the SDLC, testing, deployment, and working in a team. The part of the job a DSA sheet never covers.",
  },
  {
    key: "aptitude",
    label: "Aptitude",
    icon: Calculator,
    color: CAMPUS.gold,
    href: "/campus/learning?tab=aptitude",
    unit: "topics",
    countOf: (c) => c.aptitudeTopics.length,
    itemsOf: (c) => c.aptitudeTopics.map(t => t.name || t.title || t.id),
    blurb: "Quantitative, logical and verbal sets in the shape placement papers use, with per-topic accuracy so you can see which category is actually costing you the round.",
  },
  {
    key: "dsaConcepts",
    label: "DSA Concepts",
    icon: BookOpen,
    color: CAMPUS.blue,
    href: "/campus/practice?mode=concepts",
    unit: "roadmaps",
    countOf: (c) => c.conceptTracks.length,
    itemsOf: (c) => c.conceptTracks.map(t => t.name || t.id),
    blurb: "The theory behind the problem set - arrays through graphs and DP, explained with visualisations, before you are asked to implement any of it.",
  },
  {
    key: "dsa",
    label: "DSA Practice",
    icon: Code2,
    color: CAMPUS.good,
    href: "/campus/practice",
    unit: "problems",
    countOf: (c) => c.problemCount,
    itemsOf: () => [],
    blurb: "Real submissions against real test cases, graded server-side, with worked Brute Force / Better / Optimal write-ups once you have solved it yourself.",
  },
  {
    key: "companyVault",
    label: "Company Vault",
    icon: Briefcase,
    color: CAMPUS.warn,
    href: "/campus/practice?mode=companyPrep",
    unit: "companies",
    countOf: (c) => c.companyCount,
    itemsOf: () => [],
    blurb: "Hiring-round breakdowns per company - which rounds exist, what each one asks, and the question banks and mock interviews that go with them.",
  },
];

// Deliberately labelled as roadmap, not as product. Nothing here is
// purchasable and nothing here is gated yet - there is no payment integration
// and no entitlement check in the codebase, so presenting these as live
// premium features would be a claim the app cannot honour. See the section's
// own copy.
const PREMIUM_ROADMAP = [
  { icon: Mic, label: "DeVert ReadOut", body: "Lessons read aloud, so a commute counts as revision." },
  { icon: LineChart, label: "Deeper analytics", body: "Per-topic accuracy trends and weak-area targeting across every module." },
  { icon: ListChecks, label: "Premium sheets", body: "Curated interview sheets beyond the open catalog." },
  { icon: Briefcase, label: "Full Company Vault", body: "Every round, interview experience and mock interview, unlocked." },
  { icon: ClipboardCheck, label: "Full mock tests", body: "Timed, negative-marked full-length papers with a real report after." },
  { icon: Sparkles, label: "Unlimited Daily Learning", body: "The whole streak calendar rather than a sample window." },
];

const INSTITUTION_ROLES = [
  {
    icon: ShieldCheck, label: "Principal", color: CAMPUS.teal,
    points: ["Institution-wide readiness view", "Department comparisons", "Downloadable reports"],
  },
  {
    icon: Building2, label: "HOD", color: CAMPUS.purple,
    points: ["Department dashboard", "Scoped content management", "Classroom-level progress"],
  },
  {
    icon: Users, label: "Faculty & class teachers", color: CAMPUS.cyan,
    points: ["Own classroom roster", "Per-module enable/disable", "Assessment results"],
  },
  {
    icon: GraduationCap, label: "Students", color: CAMPUS.good,
    points: ["Daily Learning with streaks", "Assessments and contests", "Live leaderboard rank"],
  },
  {
    icon: TrendingUp, label: "Placement cell", color: CAMPUS.gold,
    points: ["Company-wise preparation", "Readiness by batch", "Contest-based shortlisting"],
  },
  {
    icon: ClipboardCheck, label: "Training cell", color: CAMPUS.warn,
    points: ["Schedule the weekly plan", "Bulk roster onboarding", "Approve join requests"],
  },
];

// The individual ladder. Priced for a student paying out of their own pocket at
// Indian campus scale - the goal is adoption, not revenue per user, so the entry
// point is deliberately low enough to be a non-decision.
//
// BASE_MONTHLY is the only real number here. Every tier is expressed as "pay for
// N months, get the rest free", and both the headline price and the effective
// monthly rate are DERIVED from it below - so the price on the card and the
// offer in the copy can never drift apart the way two hand-typed figures do.
const BASE_MONTHLY = 29;

// Each tier hand-sets only its `price` - the prices are not a clean multiple of
// the base any more, so that one figure per row is unavoidable. EVERYTHING else
// on the card (the struck-through regular price, the discount %, the effective
// monthly rate, the rupees saved and the free-time equivalent) is derived from
// `price` and `months` in planMath below, so no card can ever advertise a saving
// it does not actually give.
//
// The ladder now descends the whole way - ₹29 / ₹23 / ₹21.5 / ₹19.9 / ₹19.1 -
// so each longer commitment is genuinely cheaper per month than the one before
// it, rather than three tiers sharing one rate.
//
// `accent` replaces the coloured dots from the pricing spec: CAMPUS tokens, not
// emoji, per CLAUDE.md's design system.
const PLANS = [
  {
    key: "monthly", label: "Monthly", months: 1, price: 29, period: "month",
    badge: "Starter", accent: CAMPUS.good,
    blurb: "Try Premium. No commitment.",
  },
  {
    key: "quarterly", label: "3 months", months: 3, price: 69, period: "3 months",
    // Specified twice by the product owner after the concern below was raised,
    // so it stands as their call. Worth keeping in view: nothing has been sold
    // yet, so this is a claim to MAKE true before checkout goes live rather than
    // one the data currently supports.
    badge: "Most popular", accent: CAMPUS.blue, featured: true,
    blurb: "Covers one semester.",
  },
  {
    key: "halfyear", label: "6 months", months: 6, price: 129, period: "6 months",
    badge: "Save more", accent: CAMPUS.purple,
    blurb: "Ideal for consistent preparation.",
  },
  {
    key: "ninemonth", label: "9 months", months: 9, price: 179, period: "9 months",
    badge: "Placement season", accent: CAMPUS.warn,
    blurb: "Covers a full placement cycle.",
  },
  {
    key: "yearly", label: "12 months", months: 12, price: 229, period: "year",
    badge: "Best value", accent: CAMPUS.gold,
    blurb: "The lowest monthly price.",
  },
];

// Derived, never typed by hand - see the note on PLANS above.
function planMath(plan) {
  const regular = plan.months * BASE_MONTHLY;
  const saved = regular - plan.price;
  const monthsFree = saved / BASE_MONTHLY;

  // FLOOR, not round, on the free-time equivalent. It is the one figure here
  // that is a persuasive claim rather than a fact off the invoice, so it should
  // understate: "18 days free" when the true value is 18.6 is safe, "19 days"
  // when it is 18.6 is a small lie in our own favour.
  const freeLabel = saved <= 0 ? null
    : monthsFree < 1
      ? `like getting ${Math.floor(monthsFree * 30)} days free`
      : `like getting over ${Math.floor(monthsFree * 10) / 10} months free`;

  return {
    regular,
    saved,
    // One decimal, trailing .0 dropped: ₹23, but ₹21.5 and ₹19.9.
    effective: Math.round((plan.price / plan.months) * 10) / 10,
    savePct: Math.round((1 - plan.price / regular) * 100),
    freeLabel,
  };
}

// A one-time pass, capped at a real number of accounts. The cap is stated as a
// plain fact and is NOT paired with a live "only N left" counter: there is no
// purchase record to count yet, so any such number would be theatre. When
// Premium ships, the counter can read the real total or stay absent.
const LIFETIME = {
  price: 999,
  cap: 500,
  perks: [
    "Every Premium track, for good",
    "Future modules included as they ship",
    "All DSA sheets and the full Company Vault",
    "Programming, CS Core, Aptitude and GATE",
    "DeVert ReadOut and AI features",
    "Founder badge on your profile",
    "Priority support",
  ],
};

// Free vs Premium. Lucide icons, never emoji ticks and crosses (see CLAUDE.md's
// design system) - and a dash rather than a red cross for "not included", since
// the free tier is a real product here, not a punishment.
const COMPARISON = [
  { feature: "Daily Learning", free: "Limited", premium: "Unlimited" },
  { feature: "DSA Concepts", free: "First 20%", premium: "Everything" },
  { feature: "Programming", free: "Opening chapters", premium: "Complete" },
  { feature: "CS Core", free: "Intro module", premium: "Full subjects" },
  { feature: "Aptitude", free: "Basic sets", premium: "Complete" },
  { feature: "Company Vault", free: "Preview", premium: "Full" },
  { feature: "Mock tests", free: "2 a month", premium: "Unlimited" },
  { feature: "Contests", free: "Public only", premium: "Premium + campus" },
  { feature: "Progress analytics", free: "Basic", premium: "Advanced" },
  { feature: "DeVert ReadOut", free: "Limited", premium: "Unlimited" },
  { feature: "AI companion", free: null, premium: "Included" },
  { feature: "Notes & bookmarks", free: "Limited", premium: "Unlimited" },
  { feature: "Certificates", free: null, premium: "Included" },
];

const FAQ = [
  {
    q: "Do I need a college account to use DeVert Campus?",
    a: "No. Programming, CS Core, Fundamentals, Aptitude, DSA concepts, the problem set and the Company Vault are all open - browse them signed out, and sign in with Google when you want progress, streaks and submissions saved to your account.",
  },
  {
    q: "Then what does joining a campus actually add?",
    a: "Everything that only makes sense inside an institution: the Daily Learning plan your own faculty schedules, weekly assessments, your college's contests, your batch leaderboard, and the dashboards your HOD and placement cell run. That layer is licensed to the college, not sold to individuals.",
  },
  {
    q: "How do I join my college's campus?",
    a: "Open your college from the directory below and request to join with your roll number. Your Training & Placement Cell approves it - DeVert does not grant access to a campus on their behalf. If your college is not listed yet, ask your T&P cell to get in touch.",
  },
  {
    q: "Is the content different inside a campus?",
    a: "No, and that is deliberate. There is exactly one copy of every lesson and problem, authored centrally. A campus schedules and tracks that content; it never stores its own duplicate, so a fix to a lesson reaches every college and every public learner at once.",
  },
  {
    q: "Is Premium available today?",
    a: "Not yet. The plans are published intent so nobody is surprised by pricing later, and there is no checkout behind them. Nothing is behind a paywall right now - if you can reach it on this page, it is free while Premium is in build.",
  },
  {
    q: "Why is Premium only ₹29 a month?",
    a: "Because a price a student has to think about is a price most students will not pay. The aim is that everyone on a campus can afford it, not that a few pay a lot - so the entry plan is ₹29, the yearly works out to ₹19.1 a month, and there is a seven-day free trial before any of it. The free tier is not a trap either: it stays genuinely usable forever.",
  },
  {
    q: "Do coins and XP work outside a campus?",
    a: "Coins and XP are earned on the shared DeVert account, so practice and lessons count wherever you do them. Leaderboards, department ranks and certificates are campus features, because they only mean something relative to a cohort.",
  },
];

// ---------------- small shared pieces ----------------

// One eyebrow + heading + optional description + optional right-side action,
// on a full-bleed band. `tone` alternates the band background so consecutive
// sections separate without a divider rule between every one of them.
function Band({ id, tone = "paper", children, className = "" }) {
  return (
    <section id={id} className={`px-6 sm:px-10 scroll-mt-20 ${className}`}
      style={{ background: tone === "surface" ? CAMPUS.surface : CAMPUS.paper, borderTop: `1px solid ${CAMPUS.line}` }}>
      <div className="max-w-6xl mx-auto py-16 sm:py-20">{children}</div>
    </section>
  );
}

function BandHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
      <div className="max-w-[62ch]">
        {eyebrow && (
          <p className="text-[10.5px] font-mono tracking-[0.18em] uppercase mb-3" style={{ color: CAMPUS.teal }}>{eyebrow}</p>
        )}
        <h2 className="font-bold tracking-tight leading-[1.15]" style={{ color: CAMPUS.ink, fontSize: "clamp(1.5rem,3vw,2.15rem)" }}>{title}</h2>
        {description && <p className="text-[14.5px] mt-3 leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Counts up to `value` once the element is on screen. Purely presentational -
// the number itself is always the real fetched figure, and a value that has not
// arrived yet renders as a dash rather than animating up to a placeholder.
function CountUp({ value, suffix = "" }) {
  const [shown, setShown] = useState(0);
  const ref = useRef(null);
  // Resolved once at mount rather than inside the effect, so the reduced-motion
  // path is a render-time choice (see the return below) instead of a synchronous
  // setState from an effect body.
  const [reduced] = useState(() => (
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    if (reduced || typeof value !== "number") return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let started = false;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 900);
        // easeOutCubic - fast first, settles on the real number.
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) { started = true; run(); }
    }, { threshold: 0.4 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value, reduced]);

  if (typeof value !== "number") return <span ref={ref}>—</span>;
  return <span ref={ref}>{(reduced ? value : shown).toLocaleString()}{suffix}</span>;
}

function toJsDate(v) {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------- hero ----------------

// The four module tiles that float around the product preview. Each is a real
// destination, so the illustration doubles as navigation rather than being a
// picture of navigation - and the accent per module is the SAME one that module
// uses everywhere else in Campus (see LEARN_TRACKS above), so the tiles read as
// the product, not as decoration invented for this page.
//
// `at` is the tile's position within the preview box. Deliberately kept inside
// the box's own bounds (no negative offsets larger than the wrapper's padding):
// a hero that introduces a horizontal scrollbar on a 360px phone is a worse bug
// than a slightly tamer composition.
const HERO_TILES = [
  { label: "Programming", icon: CodeXml, color: CAMPUS.teal, href: "/campus/learning?tab=programming", at: "top-[2%] left-[1%]" },
  { label: "DSA", icon: Code2, color: CAMPUS.blue, href: "/campus/practice", at: "top-[34%] left-[-1%]" },
  { label: "CS Core", icon: BrainCircuit, color: CAMPUS.purple, href: "/campus/learning?tab=csCore", at: "bottom-[16%] left-[4%]" },
  { label: "Contests", icon: Trophy, color: CAMPUS.good, href: "/campus/contests", at: "bottom-[4%] right-[2%]" },
];

// The rows inside the mocked "Today's plan" panel.
//
// THESE FIGURES ARE ILLUSTRATIVE AND THAT IS THE ONE PLACE ON THIS PAGE WHERE
// THAT IS ALLOWED. Everything the page ASSERTS about the platform - every number
// in the stats bar below - is a real length of a real query (see
// lib/campusCatalog.js's header, and heroStats in CampusLanding). This block is
// a picture of the product's own dashboard, the equivalent of a screenshot, and
// is marked aria-hidden so it is never read out as data. Do not wire real user
// progress in here: a logged-out visitor is the audience, and a hero that shows
// 0/0 to everyone who has not signed up yet sells nothing.
const HERO_PLAN = [
  { label: "DSA", detail: "Binary Search", color: CAMPUS.blue, pct: 60 },
  { label: "CS Core", detail: "Operating Systems", color: CAMPUS.purple, pct: 50 },
  { label: "Aptitude", detail: "Quantitative", color: CAMPUS.gold, pct: 33 },
  { label: "Programming", detail: "Python Basics", color: CAMPUS.teal, pct: 66 },
];

// A LAPTOP SCREEN IS DARK IN BOTH SITE THEMES, so everything inside the bezel
// uses fixed values rather than CAMPUS.* tokens. A token would invert to
// near-black ink under the light theme and render invisible on a panel that
// stays dark either way - exactly the reasoning behind --campus-chrome-bg/fg in
// globals.css, which is what the panel itself is painted with. The accents are
// not new colors: they are the palette's own dark-theme values (see the
// .campus-theme[data-theme="dark"] block), so the screen shows Campus in dark
// mode rather than inventing a third palette.
const SCREEN = {
  ink: "rgba(255,255,255,0.94)",
  inkSoft: "rgba(255,255,255,0.60)",
  inkFaint: "rgba(255,255,255,0.38)",
  line: "rgba(255,255,255,0.10)",
  panel: "rgba(255,255,255,0.05)",
  indigo: "#818CF8",
  violet: "#C084FC",
  blue: "#60A5FA",
  amber: "#FACC15",
  green: "#34D399",
};

// Likewise the machine itself: an aluminium lid and deck are grey in both
// themes. These four are the only literal device colors on the page.
const DEVICE = {
  lid: "linear-gradient(155deg, #3B4152 0%, #262B39 100%)",
  lidEdge: "#171A25",
  deck: "linear-gradient(180deg, #4A5164 0%, #2B303E 62%, #1D2029 100%)",
  notch: "rgba(255,255,255,0.16)",
};

// The four module tiles that float around the laptop, mirroring the reference
// render. Each is a REAL destination, so the illustration doubles as navigation
// rather than being a picture of navigation.
// `floating` is the desktop treatment: absolutely positioned around the laptop.
// Below sm: there is no room to float anything without covering the machine, so
// the SAME tiles render as a plain grid underneath it instead (see HeroPreview).
//
// They used to be `hidden sm:flex`, which quietly cost mobile four real
// destinations - these are links, not decoration, and on a phone they were the
// only thing between the hero CTAs and the stats bar. Hiding navigation is only
// acceptable when it exists somewhere else on that breakpoint; this did not.
function HeroTile({ tile, floating }) {
  return (
    <Link href={tile.href}
      className={floating
        ? `campus-btn hidden sm:flex absolute ${tile.at} flex-col items-start gap-2 px-3 py-2.5 rounded-xl w-[100px] z-20`
        : "campus-btn flex flex-col items-start gap-2 px-3 py-2.5 rounded-xl"}
      style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: tint(tile.color, 16), color: tile.color }}>
        <tile.icon size={15} />
      </span>
      <span className="text-[11px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>{tile.label}</span>
    </Link>
  );
}

// The hero's product shot, drawn in CSS rather than dropped in as a PNG.
//
// WHY NOT A RASTER: the reference render is a single baked image with its own
// light background and its own baked-in screen contents. Shipping it would mean
// (a) a hero that is wrong in one of the two themes - the one thing that was
// explicitly asked to work in both - (b) text inside an image, unreadable to
// search and screen readers and blurry on any display it was not exported for,
// and (c) a few hundred KB on the page every search visitor lands on. Everything
// below is a CAMPUS token, a tint() of one, or one of the two fixed device
// palettes above, so the whole thing repaints with the toggle.
//
// If a real 3D render is preferred later, this is the one component to swap: put
// the asset in public/ and replace the laptop block, keeping the tiles and the
// stats bar where they are.
function HeroPreview() {
  return (
    // min-height from sm: only. Below that the floating tiles are not absolutely
    // positioned any more (they are the grid at the bottom), so reserving their
    // space would leave a gap instead of filling it.
    <div className="relative w-full max-w-[540px] mx-auto lg:mx-0 pb-8 sm:min-h-[390px]">
      {/* Ambient wash behind the machine - reads as a soft violet haze in light
          mode and a glow in dark mode, from one element, because tint()
          composites over whatever sits behind it. */}
      <div className="absolute inset-x-2 top-6 bottom-4 rounded-full pointer-events-none" aria-hidden="true"
        style={{ background: `radial-gradient(ellipse at center, ${tint(CAMPUS.purple, 30)} 0%, transparent 70%)`, filter: "blur(34px)" }} />

      {/* The lit ring the render stands the laptop on. Two ellipses, not an
          image: the outer one is the bright rim, the inner one the falloff. */}
      <div className="absolute left-[12%] right-[2%] bottom-0 h-[74px] pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 rounded-[50%]" style={{ border: `1.5px solid ${tint(CAMPUS.purple, 55)}`, filter: "blur(0.5px)" }} />
        <div className="absolute inset-x-[7%] inset-y-[16%] rounded-[50%]" style={{ border: `1px solid ${tint(CAMPUS.teal, 42)}` }} />
        <div className="absolute inset-x-[2%] top-[30%] bottom-[-30%] rounded-[50%]"
          style={{ background: `radial-gradient(ellipse at center, ${tint(CAMPUS.purple, 26)} 0%, transparent 68%)`, filter: "blur(12px)" }} />
      </div>

      {/* The machine. Inset from the left so the floating tiles have somewhere
          to sit inside the box - no negative offsets wide enough to push the
          page into a horizontal scrollbar on a narrow phone. */}
      <div className="relative z-10" style={{ width: "84%", marginLeft: "15%" }} aria-hidden="true">
        {/* Lid + bezel */}
        <div className="rounded-t-xl rounded-b-md p-[7px] pb-[9px]"
          style={{ background: DEVICE.lid, border: `1px solid ${DEVICE.lidEdge}`, boxShadow: CAMPUS.shadowLg }}>
          <div className="rounded-[5px] overflow-hidden" style={{ background: CAMPUS.chromeBg }}>
            {/* Screen chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: `1px solid ${SCREEN.line}` }}>
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: SCREEN.inkFaint }} />
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: SCREEN.inkFaint }} />
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: SCREEN.inkFaint }} />
              <span className="text-[8.5px] font-mono ml-1 tracking-wide" style={{ color: SCREEN.inkFaint }}>devert.in/campus</span>
            </div>

            <div className="p-3">
              <p className="text-[11.5px] font-semibold mb-2.5" style={{ color: SCREEN.ink }}>Welcome back</p>

              <div className="flex gap-2.5">
                {/* Today's plan */}
                <div className="flex-1 min-w-0 rounded-lg p-2.5" style={{ background: SCREEN.panel, border: `1px solid ${SCREEN.line}` }}>
                  <p className="text-[7.5px] font-mono tracking-[0.14em] mb-2" style={{ color: SCREEN.inkFaint }}>TODAY&apos;S PLAN</p>
                  <div className="flex flex-col gap-[7px]">
                    {HERO_PLAN.map(row => (
                      <div key={row.label} className="flex items-center gap-1.5">
                        <span className="w-[14px] h-[14px] rounded flex-shrink-0"
                          style={{ background: `color-mix(in srgb, ${row.color} 34%, transparent)`, border: `1px solid ${row.color}` }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[8.5px] font-semibold leading-[1.15] truncate" style={{ color: SCREEN.ink }}>{row.label}</span>
                          <span className="block text-[7px] leading-[1.15] truncate" style={{ color: SCREEN.inkFaint }}>{row.detail}</span>
                        </span>
                        <span className="w-[26px] h-[3px] rounded-full flex-shrink-0 overflow-hidden" style={{ background: SCREEN.line }}>
                          <span className="block h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Learning + streak, the two things a college campus adds
                    on top - which is the pitch the copy beside this makes. */}
                <div className="w-[38%] flex-shrink-0 flex flex-col gap-2.5">
                  <div className="rounded-lg p-2.5" style={{ background: SCREEN.panel, border: `1px solid ${SCREEN.line}` }}>
                    <p className="text-[7.5px] font-mono tracking-[0.14em] mb-1.5" style={{ color: SCREEN.inkFaint }}>DAILY LEARNING</p>
                    <div className="grid grid-cols-7 gap-[3px]">
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <span key={i} className="text-[6px] font-mono text-center" style={{ color: SCREEN.inkFaint }}>{d}</span>
                      ))}
                      {Array.from({ length: 21 }, (_, i) => (
                        <span key={i} className="h-[7px] rounded-[2px]"
                          style={{ background: i < 11 ? `color-mix(in srgb, ${SCREEN.indigo} ${i % 4 === 3 ? 30 : 72}%, transparent)` : SCREEN.line }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: SCREEN.panel, border: `1px solid ${SCREEN.line}` }}>
                    <p className="text-[7.5px] font-mono tracking-[0.14em] mb-1" style={{ color: SCREEN.inkFaint }}>CURRENT STREAK</p>
                    <p className="flex items-baseline gap-1 text-[13px] font-bold leading-none" style={{ color: SCREEN.ink }}>
                      <Flame size={12} style={{ color: SCREEN.amber, alignSelf: "center" }} /> 12
                      <span className="text-[7.5px] font-medium" style={{ color: SCREEN.inkFaint }}>days</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deck. The clip-path is what sells the perspective - a base wider than
            the lid, tapering the way a laptop does when you look down at it. */}
        <div className="relative h-[13px]" style={{ marginLeft: "-6%", marginRight: "-6%" }}>
          <div className="absolute inset-0" style={{ background: DEVICE.deck, clipPath: "polygon(4.5% 0, 95.5% 0, 100% 74%, 0 74%)" }} />
          <div className="absolute left-1/2 top-0 h-[3px] w-[13%] -translate-x-1/2 rounded-b-full" style={{ background: DEVICE.notch }} />
        </div>
      </div>

      {/* Floating module tiles - the only interactive part of the illustration.
          sm: and up only; the mobile arrangement is the grid below. */}
      {HERO_TILES.map(t => <HeroTile key={t.label} tile={t} floating />)}

      {/* Deliberately CAMPUS.chromeBg, the one token that stays dark in BOTH
          themes (see globals.css) - the render's XP card is a dark chip against
          a pale ground, and a token that inverted would flatten it into the page
          in light mode. */}
      <div className="hidden sm:block absolute top-[-4%] right-0 rounded-xl px-3.5 py-2.5 z-20" aria-hidden="true"
        style={{ background: CAMPUS.chromeBg, boxShadow: CAMPUS.shadowLg }}>
        <p className="text-[8.5px] font-mono tracking-[0.14em] mb-1" style={{ color: SCREEN.inkSoft }}>XP TODAY</p>
        <p className="flex items-center gap-1.5 text-[18px] font-bold leading-none" style={{ color: CAMPUS.chromeFg }}>
          350 <TrendingUp size={14} style={{ color: SCREEN.green }} />
        </p>
      </div>

      {/* The mobile counterpart of the floating tiles above. Same four links,
          laid out in flow instead of absolutely, so a phone gets the navigation
          rather than an illustration with nothing to tap. Not `absolute`, so it
          adds real height - which is why HeroPreview's minHeight only applies
          from sm: up (below that the laptop shrinks and this sits under it). */}
      <div className="grid grid-cols-2 gap-2.5 sm:hidden mt-5">
        {HERO_TILES.map(t => <HeroTile key={t.label} tile={t} />)}
      </div>
    </div>
  );
}

// Fully theme-reactive - no fixed dark ground. An earlier version hardcoded
// #0A0E17 with white text, which meant light mode still opened on a black hero:
// the one band on the page that ignored the theme toggle, and the first thing
// anyone saw. Everything here is a CAMPUS token or a tint() of one, including
// the decorative blobs and the whole product preview, so the hero repaints with
// the rest of the page.
function Hero({ stats }) {
  return (
    // overflow-hidden on the SECTION, not just the blob layer: the preview's
    // floating tiles and glow sit near its right edge, and on a narrow viewport
    // any of them poking past the viewport width would add a horizontal
    // scrollbar to the whole document.
    <div className="relative overflow-hidden" style={{ background: CAMPUS.paper }}>
      {/* tint() composites over whatever sits behind, so these read as a soft
          wash in light mode and a glow in dark mode rather than being tuned for
          one of them. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -right-32 -top-32 w-[460px] h-[460px] rounded-full"
          style={{ background: `radial-gradient(circle, ${tint(CAMPUS.teal, 30)} 0%, transparent 70%)` }} />
        <div className="absolute left-[-12%] bottom-[-35%] w-[420px] h-[420px] rounded-full"
          style={{ background: `radial-gradient(circle, ${tint(CAMPUS.purple, 26)} 0%, transparent 70%)` }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-14 sm:pt-16 pb-12">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] gap-10 lg:gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest px-3.5 py-2 rounded-full mb-7"
              style={{ background: tint(CAMPUS.teal, 12), color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 26)}` }}>
              <Sparkles size={11} /> BUILT FOR LEARNERS. MADE FOR YOU.
            </div>
            {/* The accent lands on "every day" because that is the claim the rest
                of the page has to keep - the daily habit, not the one-off cram. */}
            <h1 className="font-bold leading-[1.05] mb-6 tracking-tight" style={{ color: CAMPUS.ink, fontSize: "clamp(2.1rem,4.6vw,3.4rem)" }}>
              Master technical skills.<br />Ace placements.<br />
              Learn <span style={{ color: CAMPUS.teal }}>every day.</span>
            </h1>
            <p className="text-[15.5px] mb-8 max-w-[52ch] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
              Programming, CS Core, aptitude, DSA and company-wise interview prep - open to anyone,
              no college required. Colleges add the layer on top: scheduled Daily Learning,
              assessments, contests and their own leaderboards.
            </p>
            {/* Real routes, not scrollIntoView. Campuses and For-institutions are
                their own pages now (LANDING_PAGES), so scrolling this page to a
                band instead of going there left the two CTAs unable to be
                bookmarked, shared or opened in a new tab. */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/campus/learning"
                className="campus-btn campus-btn-glow text-[14px] font-bold px-6 py-3.5 rounded-xl inline-flex items-center gap-2"
                style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                Start learning <ArrowRight size={15} />
              </Link>
              <Link href="/campus/campuses"
                className="campus-btn text-[14px] font-bold px-6 py-3.5 rounded-xl inline-flex items-center gap-2"
                style={{ background: CAMPUS.surface, color: CAMPUS.ink, border: `1px solid ${CAMPUS.line}` }}>
                Explore campuses <ArrowRight size={15} />
              </Link>
              <Link href="/campus/institutions"
                className="text-[14px] font-bold px-4 py-3.5 inline-flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
                For institutions <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <HeroPreview />
        </div>
      </div>

      {/* One bar, not four floating cards: these six are the page's factual
          claims about the platform and belong together as a single row of
          evidence under the pitch. Every value is a real count or a dash -
          `null` renders as "—", never as 0 (lib/campusCatalog.js's policy). */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pb-16">
        <CampusCard glass className="p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: tint(s.color, 14), color: s.color }}>
                  <s.icon size={17} />
                </span>
                <span className="min-w-0">
                  <b className="block font-bold leading-tight" style={{ color: CAMPUS.ink, fontSize: 20 }}>
                    {typeof s.value === "number" ? <CountUp value={s.value} /> : "—"}
                  </b>
                  <span className="block text-[11px] leading-tight mt-0.5" style={{ color: CAMPUS.inkSoft }}>{s.label}</span>
                </span>
              </div>
            ))}
          </div>
        </CampusCard>
      </div>
    </div>
  );
}

// ---------------- learn explorer ----------------

// Left rail of tracks, right panel of detail. The rail is a real tab list
// (roving selection, not links) so a visitor can compare tracks without
// leaving the page and losing their place; the panel's CTA is the link.
function LearnExplorer({ catalog, loading }) {
  const [activeKey, setActiveKey] = useState(LEARN_TRACKS[0].key);
  const active = LEARN_TRACKS.find(t => t.key === activeKey) || LEARN_TRACKS[0];
  const count = catalog ? active.countOf(catalog) : null;
  const items = catalog ? active.itemsOf(catalog).slice(0, 12) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-64 flex-shrink-0 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0"
        role="tablist" aria-label="Learning tracks">
        {LEARN_TRACKS.map(t => {
          const on = t.key === activeKey;
          return (
            <button key={t.key} role="tab" aria-selected={on} onClick={() => setActiveKey(t.key)}
              className="flex items-center gap-2.5 text-left text-[13.5px] px-3.5 py-2.5 flex-shrink-0 transition-colors whitespace-nowrap lg:whitespace-normal"
              style={{
                background: on ? tint(t.color, 12) : "transparent",
                color: on ? t.color : CAMPUS.inkSoft,
                fontWeight: on ? 600 : 500,
                borderLeft: `3px solid ${on ? t.color : CAMPUS.line}`,
              }}>
              <t.icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-w-0">
        <CampusCard className="p-7 sm:p-9 h-full">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tint(active.color, 14), color: active.color }}>
              <active.icon size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[19px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>{active.label}</h3>
              <p className="text-[12.5px] font-mono mt-1" style={{ color: CAMPUS.inkFaint }}>
                {loading ? "loading…" : count == null ? "catalog unavailable" : `${count.toLocaleString()} ${active.unit}`}
              </p>
            </div>
          </div>

          <p className="text-[14.5px] leading-relaxed mb-6 max-w-[68ch]" style={{ color: CAMPUS.inkSoft }}>{active.blurb}</p>

          {loading ? (
            <div className="flex flex-wrap gap-2 mb-7">
              {[0, 1, 2, 3, 4].map(i => <CampusSkeleton key={i} variant="rect" width={92} height={28} />)}
            </div>
          ) : items.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-7">
              {items.map(name => (
                <span key={name} className="inline-flex items-center gap-1.5 text-[12.5px] px-2.5 py-1.5 rounded-lg"
                  style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                  {active.key === "programming" && <LanguageLogo name={name} size={13} />}
                  {name}
                </span>
              ))}
            </div>
          )}

          <Link href={active.href} className="campus-btn text-[13.5px] font-bold px-5 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
            Open {active.label} <ArrowRight size={14} />
          </Link>
        </CampusCard>
      </div>
    </div>
  );
}

// ---------------- contest teaser ----------------

function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = target ? target.getTime() - now : 0;
  if (!target || ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  const parts = [
    { v: Math.floor(total / 86400), unit: "days" },
    { v: Math.floor((total % 86400) / 3600), unit: "hrs" },
    { v: Math.floor((total % 3600) / 60), unit: "min" },
    { v: total % 60, unit: "sec" },
  ];

  return (
    <div className="flex items-center gap-2.5">
      {parts.map(p => (
        <div key={p.unit} className="px-3 py-2 text-center rounded-lg" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, minWidth: 58 }}>
          <b className="block font-mono text-[17px] leading-none" style={{ color: CAMPUS.ink }}>{String(p.v).padStart(2, "0")}</b>
          <span className="text-[9.5px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkFaint }}>{p.unit}</span>
        </div>
      ))}
    </div>
  );
}

function ContestBand({ contests }) {
  const router = useRouter();
  if (contests.length === 0) return null;
  const [featured, ...rest] = contests;
  const phase = contestPhase(featured);
  const target = toJsDate(featured.contestStart);

  return (
    <Band id="contests">
      <BandHeader eyebrow="Compete" title="Open coding contests"
        description="Public contests run on the same engine that grades a college's private ones - real submissions, real ranks, no institution required."
        action={
          <Link href="/campus/contests" className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
            All contests <ArrowUpRight size={14} />
          </Link>
        } />

      <div className="grid lg:grid-cols-3 gap-4">
        <CampusCard className="p-7 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <CampusChip color={phase === "live" ? CAMPUS.good : CAMPUS.gold} icon={Trophy}>{phase.toUpperCase()}</CampusChip>
            {featured.category && <CampusChip color={CAMPUS.inkFaint}>{featured.category}</CampusChip>}
            {featured.difficulty && <CampusChip color={CAMPUS.purple}>{featured.difficulty}</CampusChip>}
          </div>
          <h3 className="text-[22px] font-semibold mb-2 leading-tight" style={{ color: CAMPUS.ink }}>{featured.title}</h3>
          {featured.description && (
            <p className="text-[13.5px] leading-relaxed mb-6 max-w-[60ch]" style={{ color: CAMPUS.inkSoft }}>{featured.description}</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-5 flex-wrap">
            {phase === "upcoming" && target ? (
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>Starts in</p>
                <Countdown target={target} />
              </div>
            ) : <span />}
            <button onClick={() => router.push(`/campus/contests?open=${featured.id}`)}
              className="campus-btn campus-btn-glow text-[13.5px] font-bold px-5 py-3 rounded-xl"
              style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
              {phase === "live" ? "Enter contest" : "View & register"}
            </button>
          </div>
        </CampusCard>

        <div className="flex flex-col gap-3">
          {rest.slice(0, 3).map(c => (
            <button key={c.id} onClick={() => router.push(`/campus/contests?open=${c.id}`)} className="text-left">
              <CampusCard hover className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.purple, 14), color: CAMPUS.purple }}>
                  <Trophy size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{c.title}</b>
                  <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>
                    {c.category}{c.difficulty ? ` · ${c.difficulty}` : ""}
                  </span>
                </div>
                <ChevronRight size={15} style={{ color: CAMPUS.inkFaint }} />
              </CampusCard>
            </button>
          ))}
          {rest.length === 0 && (
            <CampusCard className="p-5">
              <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                This is the only contest currently open. New ones are published regularly - the Contests page lists past papers you can still solve.
              </p>
            </CampusCard>
          )}
        </div>
      </div>
    </Band>
  );
}

// ---------------- institution directory ----------------

function InstitutionCard({ inst, featured }) {
  return (
    <Link href={`/campus/${inst.id}`} className="block">
      <CampusCard hover className="p-6 h-full">
        {featured && (
          <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full mb-3" style={{ background: CAMPUS.goldTint, color: CAMPUS.gold, letterSpacing: "0.03em" }}>
            FEATURED
          </span>
        )}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[15px] mb-4 overflow-hidden"
          style={inst.logoUrl ? { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` } : { background: CAMPUS.gradientPrimary, color: "#fff" }}>
          {inst.logoUrl
            ? <img src={inst.logoUrl} alt="" className="w-full h-full object-contain" />
            : (inst.name?.slice(0, 2).toUpperCase() || "??")}
        </div>
        <h4 className="text-[16px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>{inst.name}</h4>
        {inst.location && (
          <div className="text-xs flex items-center gap-1 mb-4" style={{ color: CAMPUS.inkFaint }}>
            <MapPin size={11} /> {inst.location}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkFaint }}>Status</span>
            <span className="block font-mono text-[13px] font-bold mt-0.5" style={{ color: (inst.accessMode || "public") === "public" ? CAMPUS.good : CAMPUS.warn }}>
              {(inst.accessMode || "public") === "public" ? "OPEN" : inst.accessMode.replace("_", " ").toUpperCase()}
            </span>
          </div>
          {inst.studentCount != null && (
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkFaint }}>Students</span>
              <span className="block font-mono text-[13px] font-bold mt-0.5" style={{ color: CAMPUS.ink }}>{inst.studentCount}</span>
            </div>
          )}
        </div>
      </CampusCard>
    </Link>
  );
}

// `institutions`/`loading` are OPTIONAL: the landing page already fetches the
// list for its hero stat, so it passes what it has rather than making the page
// read the same collection twice. On its own /campus/campuses page nothing has
// fetched it, so this falls back to fetching for itself.
function DirectoryBand({ institutions: provided, loading: providedLoading }) {
  const [search, setSearch] = useState("");
  const [own, setOwn] = useState(null);

  useEffect(() => {
    if (provided) return;
    fetchInstitutions().then(setOwn).catch(() => setOwn([]));
  }, [provided]);

  // Memoized, not a bare `provided || own || []`: the `|| []` branch minted a
  // fresh array identity on every render, which defeated the `featured` memo
  // below entirely (it re-sorted the list on each render instead of when the
  // list changed).
  const institutions = useMemo(() => provided || own || [], [provided, own]);
  const loading = provided ? !!providedLoading : own === null;
  const q = search.trim().toLowerCase();

  const featured = useMemo(
    () => [...institutions].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0)).slice(0, 3),
    [institutions],
  );
  const featuredIds = new Set(featured.map(i => i.id));
  const filtered = q
    ? institutions.filter(inst => inst.name?.toLowerCase().includes(q) || inst.location?.toLowerCase().includes(q))
    : institutions.filter(i => !featuredIds.has(i.id));

  return (
    <Band id="featured-campuses">
      <BandHeader eyebrow="Campuses" title="Colleges running DeVert Campus"
        description="Find your college to request access to its Daily Learning plan, assessments, contests and leaderboard. Your Training & Placement Cell approves the request - not DeVert." />

      <div className="max-w-xl mb-10 flex items-stretch gap-2 rounded-2xl p-1.5"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
        <div className="flex items-center gap-2.5 flex-1 pl-3">
          <Search size={16} style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by college name, city, or state..."
            className="flex-1 text-[14px] py-3 outline-none bg-transparent" style={{ color: CAMPUS.ink }} />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <CampusCard key={i} className="p-6 space-y-4">
              <CampusSkeleton variant="rect" width={44} height={44} />
              <CampusSkeleton variant="text" width="70%" height={16} />
              <CampusSkeleton variant="text" width="45%" />
            </CampusCard>
          ))}
        </div>
      ) : institutions.length === 0 ? (
        <CampusEmptyState icon={Building2} title="No colleges on DeVert Campus yet"
          description="Once your institution's Training & Placement Cell signs up, it'll appear here - everything above stays open to you in the meantime." />
      ) : (
        <>
          {!q && featured.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={15} style={{ color: CAMPUS.gold }} />
                <h3 className="text-[13px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkSoft }}>Featured</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map(inst => <InstitutionCard key={inst.id} inst={inst} featured />)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} style={{ color: CAMPUS.teal }} />
            <h3 className="text-[13px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkSoft }}>
              {q ? `Results for "${search}"` : "All campuses"}
            </h3>
          </div>
          {filtered.length === 0 ? (
            <CampusEmptyState size="sm" icon={Search}
              title={q ? "No matches" : "That's every campus for now"}
              description={q ? `No college matches "${search}".` : "More colleges are onboarding."} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(inst => <InstitutionCard key={inst.id} inst={inst} />)}
            </div>
          )}
        </>
      )}
    </Band>
  );
}

// ---------------- for institutions ----------------

// Owns its own dialog state so every call site is a one-liner and no band has
// to thread `open`/`onClose` through itself. Replaces the mailto: link these
// buttons used to be - see campus-demo-request.jsx for why that link was a dead
// control on most machines.
function DemoButton({ source, className = "", style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`campus-btn text-[13px] font-bold px-5 py-3 rounded-xl ${className}`}
        style={{ background: CAMPUS.gradientPrimary, color: "#fff", ...style }}>
        Request a demo
      </button>
      <DemoRequestDialog open={open} onClose={() => setOpen(false)} source={source} />
    </>
  );
}

// `tone` is a prop because this band is rendered in two places with different
// neighbours: mid-landing (where it needs the alternate tone to separate from
// the band above) and as the whole of /campus/institutions (where it is the
// first thing under the nav and should sit on plain paper).
function InstitutionsBand({ tone }) {
  return (
    <Band id="for-institutions" tone={tone}>
      <BandHeader eyebrow="For institutions" title="The layer a college adds on top"
        description="A campus never stores its own copy of a lesson - it schedules the central content and owns the outcomes: who was assigned what, who completed it, and how a department is trending. Six roles, one workspace, gated to your own students."
        action={<DemoButton source="campus-institutions" />} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INSTITUTION_ROLES.map(r => (
          <CampusCard key={r.label} className="p-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: tint(r.color, 14), color: r.color }}>
              <r.icon size={19} />
            </div>
            <h4 className="text-[15px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>{r.label}</h4>
            <div className="flex flex-col gap-2">
              {r.points.map(p => (
                <span key={p} className="flex items-start gap-2 text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
                  <Check size={13} style={{ color: r.color, marginTop: 2, flexShrink: 0 }} /> {p}
                </span>
              ))}
            </div>
          </CampusCard>
        ))}
      </div>
    </Band>
  );
}

// ---------------- pricing + faq ----------------

// Same shape as DemoButton: owns its dialog so each of the six pricing CTAs
// stays a one-liner, and replaces the mailto: link they all used to be.
function WaitlistButton({ plan, source, className = "", style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={`campus-btn ${className}`} style={style}>
        Join the waitlist
      </button>
      {/* Mounted only while open, so each opening is a fresh mount - that is
          what lets the dialog prefill from a lazy initializer instead of a
          reset effect. */}
      {open && <WaitlistDialog open onClose={() => setOpen(false)} plan={plan} source={source} />}
    </>
  );
}

// Free vs Premium, side by side. A dash for "not included" rather than a red
// cross: the free tier is a real product here and shouldn't be drawn as a
// column of failures. Lucide only - no emoji ticks (CLAUDE.md's design system).
function ComparisonTable() {
  const cell = (value, color) => (
    value == null
      ? <span className="inline-flex items-center" style={{ color: CAMPUS.inkFaint }}><Minus size={13} /></span>
      : <span className="inline-flex items-center gap-1.5" style={{ color }}>
          <Check size={13} style={{ flexShrink: 0 }} /> {value}
        </span>
  );

  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-3 flex-wrap mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>What Premium unlocks</h3>
        <span className="text-[12.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
          free tier stays free · no card to browse
        </span>
      </div>
      <CampusCard className="px-2 py-1">
        <CampusTable
          rowKey="feature"
          columns={[
            { key: "feature", label: "Feature", render: r => <span style={{ fontWeight: 500 }}>{r.feature}</span> },
            { key: "free", label: "Free", render: r => cell(r.free, CAMPUS.inkSoft) },
            { key: "premium", label: "Premium", render: r => cell(r.premium, CAMPUS.teal) },
          ]}
          rows={COMPARISON}
        />
      </CampusCard>
    </div>
  );
}

function PricingBand({ tone = "surface" }) {
  return (
    <Band id="pricing" tone={tone}>
      <BandHeader eyebrow="Pricing" title="₹29 a month. That's the whole idea."
        description="Priced so the decision is not a decision - the point is that every student on a campus can afford it, not that a few pay a lot. Everything reachable from this page is open today; Premium is still in build, so these are the published plans rather than a checkout." />

      {/* Stated outright, because a ₹29/month figure next to a page that also
          sells to colleges reads ambiguously: this ladder is ONE learner paying
          for themselves. The institution licence below is quoted per institution
          and deliberately carries no per-seat figure. */}
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Individual Premium</h3>
        <span className="text-[12.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
          per learner · one account · billed to you, not your college
        </span>
      </div>
      <p className="text-[13px] mb-6" style={{ color: CAMPUS.inkSoft }}>
        Seven days free first, then whichever length suits you. Every plan is the same Premium -
        longer ones simply cost less per month, from ₹29 down to ₹19.1. Never a different product.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        {PLANS.map(p => {
          const m = planMath(p);
          return (
            <CampusCard key={p.key} className="p-5 flex flex-col"
              style={p.featured ? { borderColor: p.accent } : undefined}>
              <div className="flex items-start justify-between gap-2 mb-4 min-h-[24px]">
                <span className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{p.label}</span>
                {p.badge && (
                  <span className="text-[9.5px] font-bold px-2 py-1 rounded-full text-right leading-tight"
                    style={{ background: tint(p.accent, 14), color: p.accent }}>
                    {p.badge}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 flex-wrap">
                <b className="font-bold" style={{ color: CAMPUS.ink, fontSize: 30 }}>₹{p.price}</b>
                <span className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>/ {p.period}</span>
              </div>

              {/* Struck regular price sits BESIDE the discount, both derived - a
                  crossed-out number is the one element on a pricing card most
                  likely to become a lie once someone edits a price by hand. */}
              <div className="flex items-baseline gap-2 mt-1 mb-3 min-h-[18px]">
                {m.saved > 0 && (
                  <>
                    <s className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>₹{m.regular}</s>
                    <span className="text-[11px] font-bold" style={{ color: CAMPUS.good }}>{m.savePct}% off</span>
                  </>
                )}
              </div>

              <p className="text-[12px] font-mono mb-3" style={{ color: CAMPUS.ink }}>
                ₹{m.effective} a month
              </p>

              {/* Rupees saved and the free-time equivalent: a concrete number
                  lands harder than a percentage, which is why both are shown. */}
              <div className="min-h-[36px] mb-3">
                {m.saved > 0 && (
                  <>
                    <p className="text-[12px] font-semibold" style={{ color: CAMPUS.good }}>Save ₹{m.saved}</p>
                    <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{m.freeLabel}</p>
                  </>
                )}
              </div>

              <p className="text-[12px] leading-relaxed mb-5" style={{ color: CAMPUS.inkSoft }}>{p.blurb}</p>

              <WaitlistButton plan={p.label} source="campus-pricing"
                className="mt-auto w-full text-center text-[12.5px] font-bold py-2.5 rounded-xl"
                style={p.featured
                  ? { background: CAMPUS.gradientPrimary, color: "#fff" }
                  : { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </CampusCard>
          );
        })}
      </div>

      {/* Lifetime pass. The cap is a plain stated number with no live counter
          beside it - there is no purchase record to count yet, so "only N left"
          would be invented urgency rather than real scarcity. */}
      <CampusCard className="p-7 mb-4" style={{ borderColor: tint(CAMPUS.gold, 40) }}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.gold, 14), color: CAMPUS.gold }}>
            <Crown size={20} />
          </div>
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
              <h3 className="text-[16px] font-semibold" style={{ color: CAMPUS.ink }}>Lifetime Founder Pass</h3>
              <span className="text-[12px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                one payment · first {LIFETIME.cap} accounts only
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <b className="font-bold" style={{ color: CAMPUS.ink, fontSize: 30 }}>₹{LIFETIME.price}</b>
              <span className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>once, no renewal</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {LIFETIME.perks.map(perk => (
                <span key={perk} className="flex items-start gap-2 text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
                  <Check size={13} style={{ color: CAMPUS.gold, marginTop: 2, flexShrink: 0 }} /> {perk}
                </span>
              ))}
            </div>
          </div>
          <WaitlistButton plan="Lifetime Founder Pass" source="campus-pricing"
            className="campus-btn-glow text-[13.5px] font-bold px-5 py-3 rounded-xl"
            style={{ background: CAMPUS.gradientPrimary, color: "#fff" }} />
        </div>
      </CampusCard>

      <ComparisonTable />

      <CampusCard className="p-7 flex items-start gap-5 flex-wrap">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.purple, 14), color: CAMPUS.purple }}>
          <Building2 size={20} />
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
            <h3 className="text-[16px] font-semibold" style={{ color: CAMPUS.ink }}>Campus licence</h3>
            <span className="text-[12px] font-mono" style={{ color: CAMPUS.inkFaint }}>per institution · not per seat</span>
          </div>
          <p className="text-[13.5px] leading-relaxed max-w-[68ch]" style={{ color: CAMPUS.inkSoft }}>
            Quoted on student count, departments, and which modules you turn on - so a single
            department pilot is not priced like a whole campus. Includes every dashboard,
            scheduling, assessments, contests, leaderboards and reports. Students at a licensed
            college pay nothing individually.
          </p>
        </div>
        <DemoButton source="campus-pricing" className="campus-btn-glow" />
      </CampusCard>
    </Band>
  );
}

function FaqBand() {
  const [open, setOpen] = useState(0);
  return (
    <Band id="faq">
      <BandHeader eyebrow="Questions" title="What's open, what's licensed, and why" />
      <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        {FAQ.map((item, i) => {
          const on = open === i;
          return (
            <div key={item.q} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
              <button onClick={() => setOpen(on ? -1 : i)} aria-expanded={on}
                className="w-full flex items-center gap-4 text-left py-5">
                <span className="flex-1 text-[15.5px] font-medium" style={{ color: CAMPUS.ink }}>{item.q}</span>
                {on ? <Minus size={16} style={{ color: CAMPUS.teal }} /> : <Plus size={16} style={{ color: CAMPUS.inkFaint }} />}
              </button>
              {on && (
                <p className="text-[14px] leading-relaxed pb-6 max-w-[76ch]" style={{ color: CAMPUS.inkSoft }}>{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </Band>
  );
}

// ---------------- footer ----------------

function LandingFooter() {
  const COLUMNS = [
    {
      title: "Learn", links: [
        { label: "Programming", href: "/campus/learning?tab=programming" },
        { label: "CS Core", href: "/campus/learning?tab=csCore" },
        { label: "Fundamentals", href: "/campus/learning?tab=fundamentals" },
        { label: "Aptitude", href: "/campus/learning?tab=aptitude" },
      ],
    },
    {
      title: "Practice", links: [
        { label: "DSA problems", href: "/campus/practice" },
        { label: "DSA sheets", href: "/campus/practice?mode=sheets" },
        { label: "DSA concepts", href: "/campus/practice?mode=concepts" },
        { label: "Company Vault", href: "/campus/practice?mode=companyPrep" },
      ],
    },
    {
      title: "Campus", links: [
        { label: "Contests", href: "/campus/contests" },
        { label: "Find your college", href: "/campus/campuses" },
        { label: "For institutions", href: "/campus/institutions" },
        { label: "Pricing", href: "/campus/pricing" },
      ],
    },
    {
      title: "DeVert", links: [
        { label: "Main site", href: "/" },
        { label: "Arena", href: "/arena" },
        { label: "Pulse", href: "/pulse" },
        { label: "Changelog", href: "/logs" },
      ],
    },
  ];

  return (
    <footer className="px-6 sm:px-10" style={{ background: CAMPUS.surface, borderTop: `1px solid ${CAMPUS.line}` }}>
      <div className="max-w-6xl mx-auto py-14">
        <div className="flex items-center gap-2.5 font-bold text-[17px] mb-10" style={{ color: CAMPUS.ink }}>
          <CampusBadge size={30} />
          DeVert Campus
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="text-[10.5px] font-mono uppercase tracking-[0.15em] mb-4" style={{ color: CAMPUS.inkFaint }}>{col.title}</p>
              <div className="flex flex-col gap-2.5">
                {col.links.map(l => (
                  <Link key={l.label} href={l.href} className="text-[13.5px]" style={{ color: CAMPUS.inkSoft }}>{l.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap pt-7" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
            One content engine, two ways in - open learning at devert.in/campus, licensed workspaces at devert.in/campus/your-college.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[12.5px] font-medium" style={{ color: CAMPUS.teal }}>{SUPPORT_EMAIL}</a>
        </div>
      </div>
    </footer>
  );
}

// ---------------- standalone info pages ----------------

// /campus/campuses, /campus/institutions and /campus/pricing. These were
// sections of the landing page reachable only by scrolling, which meant the
// three things a visitor is most likely to be sent a link to - the directory,
// the institution pitch and the price - had no URL of their own, could not be
// shared or bookmarked, and could not be indexed separately.
//
// They render the SAME band components the landing page composes, so there is
// one copy of each. A page is nav + its band(s) + footer; the landing keeps
// showing them too, as the pitch that leads to them.
const LANDING_PAGES = {
  campuses: { bands: () => <DirectoryBand /> },
  institutions: { bands: () => <InstitutionsBand /> },
  // Pricing carries the FAQ because most of the FAQ is about what is free,
  // what is licensed and why - which is the question someone on a pricing page
  // is already asking.
  pricing: { bands: () => <><PricingBand tone="paper" /><FaqBand /></> },
};

export const CAMPUS_LANDING_PAGE_KEYS = Object.keys(LANDING_PAGES);

export function CampusInfoPage({ section }) {
  const { theme } = useCampusTheme();
  const page = LANDING_PAGES[section];
  if (!page) return null;

  return (
    // Same rounded treatment as CampusLanding below - see its own comment for
    // why campus-sharp came off the public surface.
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-square">
      <CampusPublicNav />
      {page.bands()}
      <LandingFooter />
    </main>
  );
}

// ---------------- page ----------------

export function CampusLanding() {
  const { theme } = useCampusTheme();
  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [contests, setContests] = useState([]);
  const [activeContestCount, setActiveContestCount] = useState(null);

  useEffect(() => {
    // studentCount reads straight off the institution doc - it is kept live by
    // approveStudent/suspendStudent/removeStudentFromInstitution/
    // bulkAssignByRollNumber (lib/institutions.js). The per-institution
    // subcollection count this used to attempt is denied for an anonymous
    // visitor by design, so it always read null despite looking like a feature.
    fetchInstitutions().then(setInstitutions).catch(() => setInstitutions([])).finally(() => setInstLoading(false));

    fetchPublicCatalog().then(setCatalog).catch(() => setCatalog(null)).finally(() => setCatalogLoading(false));

    fetchPublishedContests()
      .then(list => {
        const b = bucketContests(list);
        // Live first - a contest a visitor can enter right now outranks one
        // that starts next week.
        setContests([...b.live, ...b.upcoming].slice(0, 4));
        setActiveContestCount(b.live.length + b.upcoming.length);
      })
      .catch(() => { setContests([]); setActiveContestCount(null); });
  }, []);

  // DEPARTMENTS is a fixed enum every institution is seeded with identically
  // (ensureDepartments()), and the real per-institution `departments`
  // subcollection is unreadable to an anonymous visitor by design - so the
  // honest total is that catalog size times the number of institutions,
  // computed entirely from data this page can actually see.
  // CAMPUS tokens, not literal hex - these repaint with the theme toggle now
  // that the hero itself does.
  //
  // Six, matching the hero's stats bar. EVERY ONE IS A REAL COUNT of a real
  // query (lib/campusCatalog.js) or of a list this page already fetched - none
  // is a round marketing figure, and a failed fetch stays `null` so the bar
  // renders a dash rather than claiming zero.
  const heroStats = [
    { label: "DSA problems", value: catalog?.problemCount ?? null, icon: Code2, color: CAMPUS.cyan },
    { label: "Programming languages", value: catalog ? catalog.languages.length : null, icon: CodeXml, color: CAMPUS.teal },
    { label: "CS Core subjects", value: catalog ? catalog.subjects.length : null, icon: BrainCircuit, color: CAMPUS.purple },
    { label: "Registered learners", value: catalog?.learners ?? null, icon: Users, color: CAMPUS.blue },
    { label: "Open contests", value: activeContestCount, icon: Trophy, color: CAMPUS.gold },
    { label: "Partner colleges", value: instLoading ? null : institutions.length, icon: Building2, color: CAMPUS.good },
  ];

  const platformStats = [
    { label: "DSA problems, graded server-side", value: catalog?.problemCount ?? null, icon: Code2, color: CAMPUS.good },
    { label: "Programming languages", value: catalog ? catalog.languages.length : null, icon: CodeXml, color: CAMPUS.teal },
    { label: "CS Core subjects", value: catalog ? catalog.subjects.length : null, icon: BrainCircuit, color: CAMPUS.purple },
    { label: "Companies in the Vault", value: catalog?.companyCount ?? null, icon: Briefcase, color: CAMPUS.warn },
    { label: "Aptitude topics", value: catalog ? catalog.aptitudeTopics.length : null, icon: Calculator, color: CAMPUS.gold },
    { label: "Curated DSA sheets", value: catalog ? catalog.sheets.length : null, icon: ListChecks, color: CAMPUS.cyan },
    { label: "Concept roadmaps", value: catalog ? catalog.conceptTracks.length : null, icon: BookOpen, color: CAMPUS.blue },
    { label: "Departments covered", value: instLoading ? null : institutions.length * DEPARTMENTS.length, icon: GraduationCap, color: CAMPUS.inkSoft },
  ];

  const directoryJsonLd = institutions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": institutions.map((inst, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "EducationalOrganization",
        "name": inst.name,
        "url": `https://devert.in/campus/${inst.id}`,
        ...(inst.location ? { "address": inst.location } : {}),
      },
    })),
  } : null;

  return (
    // campus-square, NOT campus-sharp. Square corners are wanted here; the
    // shadow-stripping that campus-sharp bundles with them is not - it flattened
    // the hero's product shot and the nav's mega-menu panel, which is why that
    // class came off these pages in the first place. campus-square is the radius
    // half on its own (globals.css), so the cards go square and the elevation
    // stays. Applied to all three public surfaces together (here, CampusInfoPage
    // and CampusGlobalSection in campus-app.jsx) so they share one language.
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-square">
      {directoryJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }} />
      )}
      <CampusPublicNav />

      <Hero stats={heroStats} />

      <Band id="learn">
        <BandHeader eyebrow="Learn" title="Every track, open from the first lesson"
          description="One central curriculum, authored once and shared by every learner and every college - so a fix to a lesson reaches all of them at once. Pick a track and start; sign in only when you want progress saved." />
        <LearnExplorer catalog={catalog} loading={catalogLoading} />
      </Band>

      {/* Sheets are a data-only layer over the same problem set (a sheet owns
          no problems and no progress - see lib/dsaSheets.js), so this band is
          rendered from the real published sheet list rather than a curated
          hardcoded one. */}
      <Band id="sheets" tone="surface">
        <BandHeader eyebrow="Practice" title="Structured sheets over one problem set"
          description="Solving a problem counts everywhere at once - from a sheet, from DSA practice, or inside a contest. There is one copy of each problem and one progress record, so nothing needs to be re-solved to tick a second box."
          action={
            <Link href="/campus/practice" className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
              Open practice <ArrowUpRight size={14} />
            </Link>
          } />
        {catalogLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <CampusCard key={i} className="p-6"><CampusSkeleton variant="rect" height={64} /></CampusCard>)}
          </div>
        ) : (catalog?.sheets.length || 0) === 0 ? (
          <CampusEmptyState size="sm" icon={ListChecks} title="No sheets published yet"
            description="The full problem set is still open under Practice." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.sheets.slice(0, 6).map(s => (
              <Link key={s.id} href={`/campus/practice?mode=sheets`} className="block">
                <CampusCard hover className="p-6 h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>
                    <ListChecks size={19} />
                  </div>
                  <h4 className="text-[15px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>{s.name || s.title || s.id}</h4>
                  {s.description && <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{s.description}</p>}
                </CampusCard>
              </Link>
            ))}
          </div>
        )}
      </Band>

      <ContestBand contests={contests} />

      <Band id="numbers" tone="surface">
        <BandHeader eyebrow="What's inside" title="The catalog, counted"
          description="Every figure below is read live from the published content collections. Nothing here is an estimate, and an unavailable count shows as a dash rather than a zero." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {platformStats.map(s => (
            <CampusCard key={s.label} className="p-6">
              <s.icon size={19} style={{ color: s.color }} className="mb-4" />
              <b className="block font-bold tracking-tight" style={{ color: CAMPUS.ink, fontSize: 32 }}>
                <CountUp value={s.value} />
              </b>
              <span className="text-[12.5px] leading-snug block mt-1" style={{ color: CAMPUS.inkSoft }}>{s.label}</span>
            </CampusCard>
          ))}
        </div>
      </Band>

      <Band id="premium">
        <BandHeader eyebrow="Roadmap" title="What Premium will add"
          description="Stated as a roadmap on purpose: none of this is behind a paywall today, and nothing on this page is gated. When Premium ships, the free tier keeps every track you can already open." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREMIUM_ROADMAP.map(f => (
            <CampusCard key={f.label} className="p-6 relative">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: tint(CAMPUS.purple, 12), color: CAMPUS.purple }}>
                  <f.icon size={19} />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: tint(CAMPUS.inkFaint, 12), color: CAMPUS.inkFaint }}>
                  <Lock size={9} /> IN BUILD
                </span>
              </div>
              <h4 className="text-[15px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>{f.label}</h4>
              <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{f.body}</p>
            </CampusCard>
          ))}
        </div>
      </Band>

      <InstitutionsBand tone="surface" />

      <DirectoryBand institutions={institutions} loading={instLoading} />

      <PricingBand />
      <FaqBand />
      <LandingFooter />
    </main>
  );
}
