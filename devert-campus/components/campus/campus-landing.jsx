"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Bricolage_Grotesque, Inter as InterFont } from "next/font/google";
import {
  MapPin, Search, BookOpen, ClipboardCheck, Trophy, ShieldCheck,
  ArrowRight, ArrowUpRight, ArrowDown, GraduationCap, Building2,
  Users, ChevronRight, TrendingUp, Code2, Briefcase,
  CodeXml, BrainCircuit, Calculator, Layers, Sparkles,
  Lock, Check, ListChecks, Mic, LineChart, Flame, Plus, Minus, Crown,
  CalendarClock, BarChart3, CheckCircle2, Target, Radar,
  FileQuestion, ClipboardList, AlertTriangle,
} from "lucide-react";
import { fetchInstitutions, DEPARTMENTS } from "@/lib/institutions";
import { fetchPublishedContests, bucketContests, contestPhase } from "@/lib/contests";
import { fetchPublicCatalog } from "@/lib/campusCatalog";
import { CAMPUS, tint, campusPhotoBg } from "@/lib/campus-theme";
import { LanguageLogo } from "@/components/campus/language-logo";
import { useCampusTheme } from "@/components/campus/campus-theme-provider";
import { CampusPublicNav, SUPPORT_EMAIL } from "@/components/campus/campus-public-nav";
import { DemoRequestDialog } from "@/components/campus/campus-demo-request";
import { WaitlistDialog } from "@/components/campus/campus-waitlist";
import { PAYMENTS_LIVE } from "@/lib/payments";
// Shared with devert-frontend and devert-careers through this app jsconfig
// @/* fallback - see lib/founders.js. Footer only, never the nav bar.
import { FOUNDERS } from "@/lib/founders";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";
import { FreeTrialButton } from "@/components/payments/free-trial-button";
import {
  CampusCard, CampusChip, CampusSkeleton, CampusEmptyState,
  CampusTable, CampusBadge, CampusGoogleButton, CampusProgressBar,
} from "@/components/campus/campus-ui";

// Scoped to the homepage hero/features/practice bands only (via the vs-*
// classes below) - not a site-wide type swap. PricingBand/FaqBand/
// LandingFooter/CampusPublicNav below keep the real CAMPUS.* Indigo/Violet
// system untouched, same as every authenticated workspace screen - this is
// a look transplant on the marketing pitch alone, not the brand pivot
// CLAUDE.md's design-system section explicitly warns against.
const vistaDisplay = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--vs-display" });
const vistaBody = InterFont({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--vs-body" });

// The public front door at campus.devert.in.
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
    href: "/learning?tab=programming",
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
    href: "/learning?tab=csCore",
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
    href: "/learning?tab=fundamentals",
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
    href: "/learning?tab=aptitude",
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
    href: "/practice?mode=concepts",
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
    href: "/practice",
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
    href: "/practice?mode=companyPrep",
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

// `id` lets a link (the "For institutions" nav dropdown's Daily Learning /
// Assessments & contests entries) jump straight to, and highlight, the
// specific role card whose own bullet text is that link's actual subject -
// see InstitutionsBand below - instead of every role-related link landing
// on the same untargeted page top.
const INSTITUTION_ROLES = [
  {
    id: "principal", icon: ShieldCheck, label: "Principal", color: CAMPUS.teal,
    points: ["Institution-wide readiness view", "Department comparisons", "Downloadable reports"],
  },
  {
    id: "hod", icon: Building2, label: "HOD", color: CAMPUS.purple,
    points: ["Department dashboard", "Scoped content management", "Classroom-level progress"],
  },
  {
    id: "faculty", icon: Users, label: "Faculty & class teachers", color: CAMPUS.cyan,
    points: ["Own classroom roster", "Per-module enable/disable", "Assessment results"],
  },
  {
    id: "students", icon: GraduationCap, label: "Students", color: CAMPUS.good,
    points: ["Daily Learning with streaks", "Assessments and contests", "Live leaderboard rank"],
  },
  {
    id: "placement-cell", icon: TrendingUp, label: "Placement cell", color: CAMPUS.gold,
    points: ["Company-wise preparation", "Readiness by batch", "Contest-based shortlisting"],
  },
  {
    id: "training-cell", icon: ClipboardCheck, label: "Training cell", color: CAMPUS.warn,
    points: ["Schedule the weekly plan", "Bulk roster onboarding", "Approve join requests"],
  },
];

// Daily Learning and Assessments & Contests each get their own dedicated
// /daily-learning and /assessments institution pages (see LANDING_PAGES
// below) instead of anchoring into InstitutionsBand's six role cards -
// "what does Daily Learning mean" deserves its own PLAN/CREATE-stage flow,
// not a repeat of Principal/HOD/Faculty/Students/Placement/Training. Both
// pages share the exact same visual system (FlowSteps, feature-card grid,
// dashboard preview) so they read as two modules of one platform rather
// than two independently hand-rolled pitches.
const DAILY_LEARNING_FLOW = [
  {
    stage: "Plan", who: "Training Cell / Institution", icon: CalendarClock, color: CAMPUS.warn,
    points: ["Creates the weekly learning plan", "Assigns learning to batches", "Manages the schedule"],
  },
  {
    stage: "Assign", who: "Faculty / HOD", icon: ClipboardCheck, color: CAMPUS.purple,
    points: ["Manages classroom learning", "Tracks module completion", "Identifies learning gaps"],
  },
  {
    stage: "Learn", who: "Students", icon: Flame, color: CAMPUS.good,
    points: ["Complete daily learning", "Maintain learning streaks", "Progress through modules"],
  },
  {
    stage: "Track", who: "Institution", icon: BarChart3, color: CAMPUS.teal,
    points: ["Gets department/batch-level progress", "Sees completion trends", "Identifies students who need support"],
  },
];

const DAILY_LEARNING_FEATURES = [
  { icon: CalendarClock, title: "Weekly Learning Plans", body: "Schedule structured learning for every batch.", color: CAMPUS.warn },
  { icon: ListChecks, title: "Classroom Progress", body: "See what students have completed and where they are falling behind.", color: CAMPUS.purple },
  { icon: Flame, title: "Learning Streaks", body: "Help students build consistent daily learning habits.", color: CAMPUS.good },
  { icon: BarChart3, title: "Institution-wide Visibility", body: "Track learning progress across departments, batches, and classrooms.", color: CAMPUS.teal },
];

const ASSESSMENTS_FLOW = [
  {
    stage: "Create", who: "Training Cell / Faculty", icon: ClipboardCheck, color: CAMPUS.warn,
    points: ["Create assessments and contests", "Schedule for a batch or department", "Set difficulty and duration"],
  },
  {
    stage: "Attempt", who: "Students", icon: Users, color: CAMPUS.cyan,
    points: ["Attempt under real time pressure", "Solve coding problems and questions", "Compete campus-wide"],
  },
  {
    stage: "Evaluate", who: "DeVert", icon: CheckCircle2, color: CAMPUS.good,
    points: ["Auto-evaluates every submission", "Grades against real test cases", "Surfaces performance instantly"],
  },
  {
    stage: "Rank", who: "Institution", icon: Crown, color: CAMPUS.gold,
    points: ["Ranks students on performance", "Builds contest leaderboards", "Flags top performers"],
  },
  {
    stage: "Improve", who: "Faculty / Students", icon: TrendingUp, color: CAMPUS.purple,
    points: ["Understand skill gaps", "Target weak topics next", "Track improvement over time"],
  },
];

const ASSESSMENT_FEATURES = [
  { icon: ClipboardCheck, title: "Assessments", body: "Create and schedule assessments for batches, classrooms, or departments.", color: CAMPUS.warn },
  { icon: Trophy, title: "Coding Contests", body: "Run competitive coding challenges and campus-wide contests.", color: CAMPUS.gold },
  { icon: CheckCircle2, title: "Automated Evaluation", body: "Evaluate submissions and surface performance instantly.", color: CAMPUS.good },
  { icon: Crown, title: "Rankings & Readiness", body: "Understand student performance, identify top performers, and discover readiness for placements.", color: CAMPUS.purple },
  { icon: Radar, title: "Performance Insights", body: "Identify skill gaps and understand where students need more learning.", color: CAMPUS.cyan },
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
    a: "Not to buy, no. The plans are published intent so nobody is surprised by pricing later, and there is no checkout behind them yet. You can start a real seven-day free trial right now though - nothing else on this page is behind a paywall, so everything you can already reach stays free while Premium is in build.",
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

  if (typeof value !== "number") return <span ref={ref}>-</span>;
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
  { label: "Programming", icon: CodeXml, color: CAMPUS.teal, href: "/learning?tab=programming", at: "top-[2%] left-[1%]" },
  { label: "DSA", icon: Code2, color: CAMPUS.blue, href: "/practice", at: "top-[34%] left-[-1%]" },
  { label: "CS Core", icon: BrainCircuit, color: CAMPUS.purple, href: "/learning?tab=csCore", at: "bottom-[16%] left-[4%]" },
  { label: "Contests", icon: Trophy, color: CAMPUS.good, href: "/contests", at: "bottom-[4%] right-[2%]" },
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
              {/* Favicon-style DeVert mark in the mock tab, same idea as a real
                  browser tab icon - the illustration is already a faithful
                  recreation of this exact page (down to the "campus.devert.in"
                  label), so it should read as a genuine DeVert product at a
                  glance, not a generic dashboard screenshot. */}
              <CampusBadge size={10} rounded="rounded-[3px]" className="ml-1" />
              <span className="text-[8.5px] font-mono tracking-wide" style={{ color: SCREEN.inkFaint }}>campus.devert.in</span>
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
              <Sparkles size={11} /> YOUR JOURNEY. YOUR SKILLS. YOUR FUTURE.
            </div>
            {/* The accent lands on "Become ready for them" - the page's actual
                promise (readiness, not just cramming for one interview). */}
            <h1 className="font-bold leading-[1.05] mb-6 tracking-tight" style={{ color: CAMPUS.ink, fontSize: "clamp(2.1rem,4.6vw,3.4rem)" }}>
              Don&apos;t just prepare for placements.<br />
              <span style={{ color: CAMPUS.teal }}>Become ready for them.</span>
            </h1>
            <p className="text-[15.5px] mb-8 max-w-[52ch] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
              Learn the skills companies look for - from programming and DSA to CS fundamentals,
              aptitude and interview preparation.{" "}
              <b style={{ color: CAMPUS.ink }}>Practice every day, track your progress, compete
              with your peers, and build the confidence to crack what comes next.</b>
            </p>
            {/* Real routes, not scrollIntoView. Campuses and For-institutions are
                their own pages now (LANDING_PAGES), so scrolling this page to a
                band instead of going there left the two CTAs unable to be
                bookmarked, shared or opened in a new tab. */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/learning"
                className="campus-btn campus-btn-glow text-[14px] font-bold px-6 py-3.5 rounded-xl inline-flex items-center gap-2"
                style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                Start learning <ArrowRight size={15} />
              </Link>
              <Link href="/campuses"
                className="campus-btn text-[14px] font-bold px-6 py-3.5 rounded-xl inline-flex items-center gap-2"
                style={{ background: CAMPUS.surface, color: CAMPUS.ink, border: `1px solid ${CAMPUS.line}` }}>
                Explore campuses <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <HeroPreview />
        </div>
      </div>

      {/* One bar, not four floating cards: these six are the page's factual
          claims about the platform and belong together as a single row of
          evidence under the pitch. Every value is a real count or a dash -
          `null` renders as "-", never as 0 (lib/campusCatalog.js's policy). */}
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
                    {typeof s.value === "number" ? <CountUp value={s.value} /> : "-"}
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

// The one full-bleed gradient CTA on the public landing page - the same
// CAMPUS.gradientPrimary treatment ContestCtaBanner already uses on the
// dashboard (campus-dashboard-widgets.jsx), not CAMPUS.gradientHero: that
// one was tried as a REPEATING admin-header fill and got reported as too
// bold for something seen every day (see StaffDashboardHero's own comment).
// A homepage banner seen once per visit is exactly the case gradientHero
// would still suit, but reusing gradientPrimary keeps every saturated-fill
// element on this app meaning the same thing - "act now" - instead of
// splitting that language into two different gradients that both claim it.
//
// Replaces the plain-text "Bring DeVert to your campus" link Hero used to
// bury in its CTA row, same weight as a legal footer link and easy to never
// notice next to two real buttons. InstitutionsBand further down still
// carries the actual pitch (roles, what a campus adds) - this is the stop
// sign that gets a T&P-cell visitor to open the same demo form rather than
// keep scrolling past it.
// Wrapped in the same .vs-scope tan canvas as VistaHero/VistaPlanPanel/
// VistaFeaturesPanel/PricingBand around it - this banner used to render
// straight onto whatever campus-theme's own background happened to be
// (light OR dark, depending on the visitor's toggle), which under dark mode
// left a big plain-dark gap around the orange card with no relation to the
// warm Vista aesthetic every neighbouring section commits to.
function BringToCampusBanner() {
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section tight">
        <div className="vs-shell">
          <div className="relative overflow-hidden rounded-2xl p-7 sm:p-9"
            style={{ background: CAMPUS.gradientPrimary, boxShadow: CAMPUS.shadowLg }}>
            <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.12)" }} aria-hidden="true" />
            <div className="absolute right-24 -bottom-16 w-36 h-36 rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden="true" />

            <div className="relative flex items-center justify-between gap-6 flex-wrap">
              <div className="min-w-0 max-w-[52ch]">
                <p className="text-[11px] font-mono tracking-[0.16em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.82)" }}>
                  For training &amp; placement cells
                </p>
                <h3 className="text-[21px] sm:text-[24px] font-bold text-white leading-tight">
                  Bring DeVert to your campus
                </h3>
                <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                  Schedule the same central curriculum for your own students, track who&apos;s
                  completed what, and see a department-wide leaderboard - gated to your college,
                  approved by your T&amp;P cell.
                </p>
              </div>
              <div className="flex items-center gap-5 flex-shrink-0">
                <DemoButton source="campus-home-banner"
                  style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.32)" }} />
                <Building2 size={48} className="hidden sm:block flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.9)" }} strokeWidth={1.4} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------- GATE band ----------------

// GATE gets a band of its own rather than an eighth row in LearnExplorer,
// because it is not another subject track - it is a separate national exam
// with its own syllabus, its own marking scheme and its own two-year clock,
// and a candidate preparing for it is doing something categorically different
// from a student working through the placement curriculum. Sharing the Learn
// explorer would have meant describing it in the one sentence a rail row
// affords, next to "Aptitude".
//
// Gold, matching GateHeader's own GRADUATION CAP + gold treatment inside the
// module (gate-app.jsx) - so the card a visitor clicks and the screen they
// land on are visibly the same product. No new accent was invented for it;
// `gold` is already in the CAMPUS token set.
const GATE_ENTRY_POINTS = [
  { label: "Syllabus", hint: "Official, subject by subject", href: "/gate?section=syllabus", icon: ListChecks },
  { label: "Previous Year Questions", hint: "Year, subject and topic", href: "/gate?section=pyq", icon: FileQuestion },
  { label: "Mock Tests", hint: "Real timing and marking", href: "/gate?section=mocks", icon: ClipboardList },
  { label: "Mistakes Notebook", hint: "Every wrong answer, filed", href: "/gate?section=mistakes", icon: AlertTriangle },
];

// A count of null is "we could not read it", NOT zero - same policy
// lib/campusCatalog.js's header sets out. It renders as a dash, because
// "0 previous year questions" is a factual claim about the product and an
// unknown count is not. Loading renders the dash too rather than a skeleton
// that reflows the row the instant it resolves.
function GateStat({ label, value }) {
  return (
    <div className="min-w-0">
      <b className="block text-[22px] sm:text-[26px] font-bold leading-none tabular-nums" style={{ color: CAMPUS.ink }}>
        {value == null ? "-" : value.toLocaleString("en-IN")}
      </b>
      <span className="block text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>{label}</span>
    </div>
  );
}

function GateBand({ catalog }) {
  const papers = catalog?.gatePapers ?? [];

  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section tight">
        <div className="vs-shell">
          <VistaReveal>
            <CampusCard className="p-7 sm:p-9 relative overflow-hidden">
              {/* Purely decorative wash, behind everything and inert to the
                  pointer - aria-hidden so it is never announced. */}
              <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: tint(CAMPUS.gold, 14) }} aria-hidden="true" />

              <div className="relative flex gap-8 flex-col lg:flex-row lg:items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap size={15} style={{ color: CAMPUS.gold }} aria-hidden="true" />
                    <span className="text-[10px] font-mono tracking-[0.18em] uppercase" style={{ color: CAMPUS.gold }}>
                      GATE preparation
                    </span>
                  </div>

                  <h2 className="text-[24px] sm:text-[30px] font-bold leading-[1.15] mb-3" style={{ color: CAMPUS.ink }}>
                    Previous year questions,<br className="hidden sm:block" /> sliced the way you actually revise.
                  </h2>
                  <p className="text-[13.5px] leading-relaxed max-w-[56ch] mb-6" style={{ color: CAMPUS.inkSoft }}>
                    The whole syllabus subject by subject, the previous-year bank filtered by year,
                    subject or topic, and mock tests marked the way GATE marks them - negative
                    marking, NAT ranges and all. Every wrong answer files itself into a mistakes
                    notebook you can practise from later.
                  </p>

                  <div className="flex items-center gap-7 sm:gap-10 mb-7 flex-wrap">
                    <GateStat label="Verified PYQs in the bank" value={catalog?.gatePyqCount ?? null} />
                    {/* Papers are NAMED, not counted - "2 papers" tells a
                        candidate nothing about whether theirs is one of them. */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {papers.length === 0 ? (
                          <b className="block text-[22px] sm:text-[26px] font-bold leading-none" style={{ color: CAMPUS.ink }}>-</b>
                        ) : papers.map(p => (
                          <span key={p.id} className="text-[12px] font-mono font-semibold px-2.5 py-1 rounded-md"
                            style={{ background: tint(CAMPUS.gold, 16), color: CAMPUS.ink }}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                      <span className="block text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>Papers covered</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <Link href="/gate"
                      className="campus-btn campus-btn-glow text-[13.5px] font-semibold px-5 py-2.5 rounded-lg inline-flex items-center gap-2"
                      style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                      Start practising <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                    <span className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
                      Free, and open without a college account.
                    </span>
                  </div>
                </div>

                {/* The four destinations a candidate is actually looking for,
                    linked directly - the module has sixteen sections and
                    dropping someone on Overview to find these themselves is
                    the discoverability problem this band exists to solve. */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:w-[290px] flex-shrink-0">
                  {GATE_ENTRY_POINTS.map(e => {
                    const Icon = e.icon;
                    return (
                      <Link key={e.label} href={e.href}
                        className="flex items-start gap-3 p-3.5 rounded-xl transition-colors"
                        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                        <Icon size={16} style={{ color: CAMPUS.gold, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>{e.label}</span>
                          <span className="block text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{e.hint}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </CampusCard>
          </VistaReveal>
        </div>
      </section>
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
          <Link href="/contests" className="text-[13px] font-semibold inline-flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
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
            <button onClick={() => router.push(`/contests?open=${featured.id}`)}
              className="campus-btn campus-btn-glow text-[13.5px] font-bold px-5 py-3 rounded-xl"
              style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
              {phase === "live" ? "Enter contest" : "View & register"}
            </button>
          </div>
        </CampusCard>

        <div className="flex flex-col gap-3">
          {rest.slice(0, 3).map(c => (
            <button key={c.id} onClick={() => router.push(`/contests?open=${c.id}`)} className="text-left">
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
    <Link href={`/${inst.id}`} className="block">
      <CampusCard hover className="p-6 h-full">
        {featured && (
          <span className="inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full mb-3" style={{ background: CAMPUS.goldTint, color: CAMPUS.gold, letterSpacing: "0.03em" }}>
            FEATURED
          </span>
        )}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[15px] mb-4 overflow-hidden"
          style={inst.logoUrl ? { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` } : { background: CAMPUS.gradientPrimary, color: "#fff" }}>
          {inst.logoUrl
            ? <img src={inst.logoUrl} alt="" className="w-full h-full object-cover" />
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
          <CampusCard key={r.label} id={`role-${r.id}`} className="p-6 campus-role-card">
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

// ---------------- Daily Learning / Assessments & Contests (institutions) ----------------

// One numbered stage flow, shared by both pages below - "how does Daily
// Learning actually work" (Plan -> Assign -> Learn -> Track) and "how does
// Assessments & Contests actually work" (Create -> Attempt -> Evaluate ->
// Rank -> Improve) are the same shape of question, so they get the same
// answer: a connected row of who-does-what, not a hand-rolled diagram each.
// Horizontal with connecting arrows on desktop, stacked with a down-arrow on
// mobile. `steps`: [{ stage, who, icon, color, points }].
function FlowSteps({ steps }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 mb-12">
      {steps.map((s, i) => (
        // display:contents - the card and its following arrow are direct
        // children of the outer flex row (so they wrap/reflow together),
        // this div exists only to pair a key with a React.Fragment-shaped
        // pair of siblings.
        <div key={s.stage} className="contents">
          <CampusCard className="p-5 flex-1 lg:basis-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(s.color, 14), color: s.color }}>
                <s.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[9.5px] font-mono tracking-widest" style={{ color: s.color }}>STEP {i + 1} &middot; {s.stage.toUpperCase()}</p>
                <p className="text-[13px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{s.who}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {s.points.map(p => (
                <span key={p} className="flex items-start gap-2 text-[11.5px]" style={{ color: CAMPUS.inkSoft }}>
                  <Check size={11} style={{ color: s.color, marginTop: 2, flexShrink: 0 }} /> {p}
                </span>
              ))}
            </div>
          </CampusCard>
          {i < steps.length - 1 && (
            <div className="flex items-center justify-center flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
              <ArrowDown size={16} className="lg:hidden" />
              <ArrowRight size={16} className="hidden lg:block" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// A small stat tile shared by both dashboard previews below - illustrative
// sample data (a worked example of what the dashboard looks like), same
// convention VistaPlanPanel's "Java + DSA" example plan already uses
// elsewhere on this page - never a claimed live platform-wide number the
// way heroStats/DirectoryBand's counts are.
function PreviewTile({ label, value, color, icon: Icon, className = "" }) {
  return (
    <div className={`p-3.5 rounded-xl ${className}`} style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>{label}</p>
      <p className="text-xl font-bold flex items-center gap-1.5" style={{ color }}>
        {Icon && <Icon size={16} />} {value}
      </p>
    </div>
  );
}

function PreviewBarRow({ label, pct, color }) {
  return (
    <div className="flex items-center gap-3 mb-2 last:mb-0">
      <span className="text-[11px] w-20 flex-shrink-0 truncate" style={{ color: CAMPUS.inkSoft }}>{label}</span>
      <CampusProgressBar pct={pct} color={color} />
      <span className="text-[10.5px] font-mono w-8 text-right flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{pct}%</span>
    </div>
  );
}

function DailyLearningPreview() {
  const WEEK_PLAN = [
    { day: "Mon", topic: "Arrays & Strings", done: true },
    { day: "Tue", topic: "OOP Fundamentals", done: true },
    { day: "Wed", topic: "DBMS - Normalization", done: false },
    { day: "Thu", topic: "Operating Systems", done: false },
    { day: "Fri", topic: "Mock Assessment", done: false },
  ];
  const DEPARTMENTS_PROGRESS = [
    { label: "Computer Science", pct: 82 },
    { label: "Electronics", pct: 65 },
    { label: "Mechanical", pct: 58 },
  ];
  return (
    <CampusCard className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>PREVIEW &middot; WEEKLY LEARNING</p>
          <p className="text-[15px] font-bold" style={{ color: CAMPUS.ink }}>CS &middot; Batch 2026</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CAMPUS.good }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAMPUS.good }} /> Scheduled for this week
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>THIS WEEK&apos;S PLAN</p>
          <div className="flex flex-col gap-2">
            {WEEK_PLAN.map(d => (
              <div key={d.day} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                <span className="text-[10px] font-mono w-7 flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{d.day}</span>
                <span className="text-[12.5px] flex-1" style={{ color: CAMPUS.ink }}>{d.topic}</span>
                {d.done
                  ? <Check size={13} style={{ color: CAMPUS.good, flexShrink: 0 }} />
                  : <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${CAMPUS.line}` }} />}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <PreviewTile label="COMPLETION" value="78%" color={CAMPUS.good} />
            <PreviewTile label="AVG STREAK" value="9 days" color={CAMPUS.warn} icon={Flame} />
          </div>
          <div className="p-4 rounded-xl" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
            <p className="text-[9.5px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>DEPARTMENT PROGRESS</p>
            {DEPARTMENTS_PROGRESS.map(d => <PreviewBarRow key={d.label} label={d.label} pct={d.pct} color={CAMPUS.teal} />)}
          </div>
        </div>
      </div>
    </CampusCard>
  );
}

function AssessmentsPreview() {
  const LEADERBOARD = [
    { rank: 1, name: "A. Sharma", score: 96 },
    { rank: 2, name: "R. Iyer", score: 91 },
    { rank: 3, name: "M. Fatima", score: 88 },
  ];
  const SKILLS = [
    { label: "DSA", pct: 74 },
    { label: "DBMS", pct: 58 },
    { label: "Aptitude", pct: 82 },
  ];
  return (
    <CampusCard className="p-6">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>PREVIEW &middot; WEEKLY ASSESSMENT</p>
          <p className="text-[15px] font-bold" style={{ color: CAMPUS.ink }}>DSA Contest &middot; Round 3</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CAMPUS.gold }}>
          <Crown size={13} /> Live leaderboard
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>TOP PERFORMERS</p>
          <div className="flex flex-col gap-2">
            {LEADERBOARD.map(row => (
              <div key={row.rank} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold flex-shrink-0"
                  style={row.rank === 1
                    ? { background: tint(CAMPUS.gold, 20), color: CAMPUS.gold }
                    : { background: CAMPUS.surface2, color: CAMPUS.inkFaint }}>
                  {row.rank}
                </span>
                <span className="text-[12.5px] flex-1" style={{ color: CAMPUS.ink }}>{row.name}</span>
                <span className="text-[12px] font-mono font-bold" style={{ color: CAMPUS.good }}>{row.score}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <PreviewTile label="AVG SCORE" value="71%" color={CAMPUS.teal} />
            <PreviewTile label="COMPLETION" value="94%" color={CAMPUS.good} />
            <PreviewTile label="PLACEMENT READY" value="62%" color={CAMPUS.purple} />
          </div>
          <div className="p-4 rounded-xl" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
            <p className="text-[9.5px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>SKILL-WISE PERFORMANCE</p>
            {SKILLS.map(s => <PreviewBarRow key={s.label} label={s.label} pct={s.pct} color={CAMPUS.purple} />)}
          </div>
        </div>
      </div>
    </CampusCard>
  );
}

function DailyLearningInstitutionsBand({ tone }) {
  return (
    <Band id="daily-learning-institutions" tone={tone}>
      <BandHeader eyebrow="For institutions &middot; Daily Learning" title="Turn daily learning into a campus-wide habit"
        description="Give every student a structured learning plan, schedule the right content for each batch, and see how learning progresses across classrooms and departments."
        action={<DemoButton source="campus-daily-learning-institutions" />} />

      <FlowSteps steps={DAILY_LEARNING_FLOW} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {DAILY_LEARNING_FEATURES.map(f => (
          <CampusCard key={f.title} className="p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: tint(f.color, 14), color: f.color }}>
              <f.icon size={17} />
            </div>
            <h4 className="text-[13.5px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>{f.title}</h4>
            <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{f.body}</p>
          </CampusCard>
        ))}
      </div>

      <DailyLearningPreview />
    </Band>
  );
}

function AssessmentsInstitutionsBand({ tone }) {
  return (
    <Band id="assessments-institutions" tone={tone}>
      <BandHeader eyebrow="For institutions &middot; Assessments &amp; Contests" title="Turn learning into measurable outcomes"
        description="Assess what students know, run coding challenges and contests, identify skill gaps, and turn performance into meaningful insights."
        action={<DemoButton source="campus-assessments-institutions" />} />

      <FlowSteps steps={ASSESSMENTS_FLOW} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ASSESSMENT_FEATURES.map(f => (
          <CampusCard key={f.title} className="p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: tint(f.color, 14), color: f.color }}>
              <f.icon size={17} />
            </div>
            <h4 className="text-[13.5px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>{f.title}</h4>
            <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{f.body}</p>
          </CampusCard>
        ))}
      </div>

      <div className="mb-8">
        <AssessmentsPreview />
      </div>

      {/* Placement Cell gets a callout, not a section - assessment/contest
          performance feeds placement readiness, but this page's core is
          measuring and challenging learning, not running placements. */}
      <CampusCard className="p-5 flex items-center gap-4 flex-wrap" style={{ borderColor: tint(CAMPUS.gold, 30) }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TrendingUp size={16} style={{ color: CAMPUS.gold }} />
          <span className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>For the Placement Cell</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] flex-wrap" style={{ color: CAMPUS.inkSoft }}>
          <span>Company-wise preparation</span> <ArrowRight size={12} style={{ flexShrink: 0 }} />
          <span>Performance</span> <ArrowRight size={12} style={{ flexShrink: 0 }} />
          <span>Shortlisting</span>
        </div>
      </CampusCard>
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

// One CTA for every pricing card, resolving to whichever thing is actually true
// right now: a waitlist signup while Premium is unreleased, a real Razorpay
// checkout once PAYMENTS_LIVE is switched on (see lib/payments.js for the two
// out-of-codebase preconditions that switch depends on).
//
// planKey is the SERVER plan id, not the display label. It has to match
// functions/index.js's PLANS exactly - the browser sends only this key and the
// server owns the amount, which is what stops the published ladder being shopped
// from devtools.
function PlanCta({ planKey, plan, source, className = "", style }) {
  if (!PAYMENTS_LIVE) {
    return <WaitlistButton plan={plan} source={source} className={className} style={style} />;
  }
  return (
    <RazorpayCheckoutButton
      planId={planKey}
      label={`Get Premium`}
      className={className}
    />
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

function PricingBand() {
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section">
        <div className="vs-shell">
          <VistaReveal className="vs-panel">
            <div className="vs-pricing-head">
              <span className="eyebrow">Pricing</span>
              <h2>₹29 a month. That&rsquo;s the whole idea.</h2>
              <p>Priced so the decision is not a decision - the point is that every student on a campus can afford it, not that a few pay a lot. Everything reachable from this page is open today; Premium is still in build, so these are the published plans rather than a checkout.</p>
            </div>

            {/* Stated outright, because a ₹29/month figure next to a page that also
                sells to colleges reads ambiguously: this ladder is ONE learner paying
                for themselves. The institution licence below is quoted per institution
                and deliberately carries no per-seat figure. */}
            <div className="vs-pricing-sub">
              <h3>Individual Premium</h3>
              <span>per learner · one account · billed to you, not your college</span>
            </div>
            <p className="vs-pricing-note">
              Seven days free first, then whichever length suits you. Every plan is the same
              Premium - longer ones simply cost less per month, from ₹29 down to ₹19.1. Never a different product.
            </p>

            {/* The "seven days free" above was a promise with nothing behind it until
                startFreeTrial existed. Rendered only when payments are live, so the
                page does not offer a trial of an unreleased product - and the button
                hides itself for campus students, active subscribers and anyone who has
                already had their week. */}
            {PAYMENTS_LIVE && (
              <div className="max-w-xs mb-6">
                <FreeTrialButton />
              </div>
            )}

            <div className="vs-plan-tiles">
              {PLANS.map(p => {
                const m = planMath(p);
                return (
                  <div key={p.key} className={`vs-plan-tile${p.featured ? " featured" : ""}`}>
                    <div className="vs-plan-tile-top">
                      <span>{p.label}</span>
                      {p.badge && <span className="vs-plan-tile-badge">{p.badge}</span>}
                    </div>
                    <div className="vs-plan-tile-price">
                      <b>₹{p.price}</b>
                      <span>/ {p.period}</span>
                    </div>
                    {/* Struck regular price sits BESIDE the discount, both derived - a
                        crossed-out number is the one element on a pricing card most
                        likely to become a lie once someone edits a price by hand. */}
                    <div className="vs-plan-tile-save">
                      {m.saved > 0 && <>Save ₹{m.saved} &middot; {m.savePct}% off &middot; ₹{m.effective}/mo</>}
                    </div>
                    <p className="vs-plan-tile-blurb">{p.blurb}</p>
                    {/* p.key is the server plan id (monthly/quarterly/halfyear/
                        ninemonth/yearly) - the same string functions/index.js's PLANS
                        is keyed by, so the advertised price and the charged price
                        cannot drift apart. */}
                    <PlanCta planKey={p.key} plan={p.label} source="campus-pricing"
                      className="vs-btn small"
                      style={p.featured
                        ? { background: "var(--vs-cream)", color: "var(--vs-panel)", border: "1px solid var(--vs-cream)" }
                        : { background: "transparent", color: "var(--vs-cream)", border: "1px solid var(--vs-line-dark)" }} />
                  </div>
                );
              })}
            </div>

            {/* Lifetime pass. The cap is a plain stated number with no live counter
                beside it - there is no purchase record to count yet, so "only N left"
                would be invented urgency rather than real scarcity. */}
            <div className="vs-lifetime-card">
              <div className="vs-lifetime-icon"><Crown size={20} /></div>
              <div className="flex-1 min-w-[280px]">
                <h3>Lifetime Founder Pass</h3>
                <p className="vs-lifetime-meta">one payment · first {LIFETIME.cap} accounts only</p>
                <div className="vs-lifetime-price">
                  <b>₹{LIFETIME.price}</b>
                  <span style={{ color: "rgba(244,239,227,0.5)", fontSize: 12.5 }}>once, no renewal</span>
                </div>
                <div className="vs-lifetime-perks">
                  {LIFETIME.perks.map(perk => (
                    <span key={perk}><Check size={13} style={{ color: "#ffd700", flexShrink: 0, marginTop: 2 }} /> {perk}</span>
                  ))}
                </div>
              </div>
              <PlanCta planKey="lifetime" plan="Lifetime Founder Pass" source="campus-pricing"
                className="vs-btn"
                style={{ background: "var(--vs-cream)", color: "var(--vs-panel)", border: "1px solid var(--vs-cream)" }} />
            </div>

            <div className="vs-compare-wrap">
              <table className="vs-compare">
                <thead>
                  <tr><th>Feature</th><th>Free</th><th>Premium</th></tr>
                </thead>
                <tbody>
                  {COMPARISON.map(row => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td className={row.free ? "" : "dash"}>{row.free || "-"}</td>
                      <td>{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="vs-licence-card">
              <div className="vs-licence-icon"><Building2 size={20} /></div>
              <div className="flex-1 min-w-[260px]">
                <h3>Campus licence</h3>
                <p className="vs-licence-meta">per institution · not per seat</p>
                <p>
                  Quoted on student count, departments, and which modules you turn on - so a single
                  department pilot is not priced like a whole campus. Includes every dashboard,
                  scheduling, assessments, contests, leaderboards and reports. Students at a licensed
                  college pay nothing individually.
                </p>
              </div>
              <DemoButton source="campus-pricing" className="vs-btn"
                style={{ background: "var(--vs-cream)", color: "var(--vs-panel)", border: "1px solid var(--vs-cream)" }} />
            </div>
          </VistaReveal>
        </div>
      </section>
    </div>
  );
}

function FaqBand() {
  const [open, setOpen] = useState(0);
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section tight">
        <div className="vs-shell">
          <VistaReveal className="vs-panel">
            <div className="vs-pricing-head">
              <span className="eyebrow">Questions</span>
              <h2>What&rsquo;s open, what&rsquo;s licensed, and why</h2>
            </div>
            <div className="vs-faq-list">
              {FAQ.map((item, i) => {
                const on = open === i;
                return (
                  <div key={item.q} className="vs-faq-row">
                    <button onClick={() => setOpen(on ? -1 : i)} aria-expanded={on} className="vs-faq-q">
                      {item.q}
                      <span className="ico">{on ? <Minus size={16} /> : <Plus size={16} />}</span>
                    </button>
                    {on && <p className="vs-faq-a">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </VistaReveal>
        </div>
      </section>
    </div>
  );
}

// ---------------- footer ----------------

function LandingFooter() {
  const COLUMNS = [
    {
      title: "Learn", links: [
        { label: "Programming", href: "/learning?tab=programming" },
        { label: "CS Core", href: "/learning?tab=csCore" },
        { label: "Fundamentals", href: "/learning?tab=fundamentals" },
        { label: "Aptitude", href: "/learning?tab=aptitude" },
      ],
    },
    {
      title: "Practice", links: [
        { label: "DSA problems", href: "/practice" },
        { label: "DSA sheets", href: "/practice?mode=sheets" },
        { label: "DSA concepts", href: "/practice?mode=concepts" },
        { label: "Company Vault", href: "/practice?mode=companyPrep" },
      ],
    },
    {
      title: "Campus", links: [
        { label: "Contests", href: "/contests" },
        { label: "Find your college", href: "/campuses" },
        { label: "For institutions", href: "/institutions" },
        { label: "Pricing", href: "/pricing" },
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
            One content engine, two ways in - open learning at campus.devert.in, licensed workspaces at campus.devert.in/your-college.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[12.5px] font-medium" style={{ color: CAMPUS.teal }}>{SUPPORT_EMAIL}</a>
        </div>

        {/* Founder credit. Footer, not the nav - a Founders dropdown briefly
            shipped in CampusPublicNav and was reverted; see lib/founders.js.
            Absolute LinkedIn URLs, so none of the cross-origin /u/{handle}
            trap that founderUrl() exists to solve applies here. */}
        <p className="text-[12px] mt-5" style={{ color: CAMPUS.inkFaint }}>
          Built by{" "}
          {FOUNDERS.map((f, i) => (
            <span key={f.key}>
              {i > 0 && " & "}
              <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                className="font-medium hover:underline" style={{ color: CAMPUS.inkSoft }}>
                {f.name}
              </a>
            </span>
          ))}
        </p>
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
  "daily-learning": { bands: () => <DailyLearningInstitutionsBand /> },
  assessments: { bands: () => <AssessmentsInstitutionsBand /> },
  // Pricing carries the FAQ because most of the FAQ is about what is free,
  // what is licensed and why - which is the question someone on a pricing page
  // is already asking.
  pricing: { bands: () => <><PricingBand /><FaqBand /></> },
};

export const CAMPUS_LANDING_PAGE_KEYS = Object.keys(LANDING_PAGES);

export function CampusInfoPage({ section }) {
  const { theme } = useCampusTheme();
  const page = LANDING_PAGES[section];
  if (!page) return null;

  return (
    // Same rounded treatment as CampusLanding below - see its own comment for
    // why campus-sharp came off the public surface.
    // campusPhotoBg("dark"), not (theme) - these info pages render the same
    // .vs-scope bands as the landing, which are hardcoded dark. See
    // CampusLanding below for the full reasoning.
    <main data-theme={theme} style={{ ...campusPhotoBg("dark"), minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-square campus-photo-bg">
      <CampusPublicNav />
      {page.bands()}
      <LandingFooter />
    </main>
  );
}

// ---------------- homepage hero/plan/features (Vista-styled) ----------------
//
// Scoped restyle of ONLY the pitch bands (hero, prep-plan panel, features
// panel) via the vs-* classes below - PricingBand/FaqBand/
// BringToCampusBanner/LandingFooter/CampusPublicNav right after this block
// keep the real CAMPUS.* system untouched, same tradeoff as before: a look
// transplant on the marketing pitch alone, not a site-wide brand pivot.
// Second visual direction on this same homepage (replaced an earlier
// "Cirrus"-styled pass wholesale, not layered on top of it) - only one
// design lives here at a time.

const VS_TRACKS = [
  { label: "Programming", tag: "live" },
  { label: "CS Core", tag: "live" },
  { label: "DSA", tag: "live" },
];

// Framer Motion is already a devert-frontend dependency this app reuses (see
// jsconfig.json's @/* fallback), so a native scroll-reveal costs nothing new
// to ship - unlike the "Portfolio-white-theme-main" template evaluated
// alongside this: that one leans on GSAP ScrollTrigger pinning, which only
// renders correctly during live scroll interaction (a full-page capture of
// it came back almost entirely blank) - a materially more fragile pattern
// for a statically-exported site than a plain whileInView fade-up.
// prefers-reduced-motion skips the animation outright, not just shortens
// it - the content is never gated behind motion either way, since
// `initial` only affects opacity/position, not whether it's in the DOM.
function VistaReveal({ children, delay = 0, className }) {
  // prefers-reduced-motion asks to drop LARGE motion (the 22px slide, which
  // reads as parallax) - it is not a request for zero feedback. Dropping the
  // whole animation to a static div was the stricter, wrong reading: every
  // panel would just be born at opacity 1 with nothing to see, which is
  // indistinguishable from "the animation doesn't work" to whoever's testing
  // it on a machine with Windows' "Show animations" switched off - as
  // reported directly. A quick opacity-only fade keeps the vestibular-safe
  // part (no movement) while still being visibly an animation.
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduceMotion ? 0.3 : 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function VistaHero({ stats }) {
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <div className="vs-canvas">
        <div className="vs-shell">
          <VistaReveal className="vs-hero-copy">
            <h1>Don&rsquo;t just prepare for placements. Become <span className="vs-pill">ready</span> for them.</h1>
            <p>Learn the skills companies look for - from programming and DSA to CS fundamentals, aptitude and interview preparation.</p>
            <div className="vs-hero-actions">
              <Link href="/learning" className="vs-btn">✦ Start learning</Link>
              <Link href="/pricing" className="vs-btn outline">▷ See what&rsquo;s free forever</Link>
            </div>
          </VistaReveal>

          <VistaReveal className="vs-dash-wrap" delay={0.15}>
            <div className="vs-dash">
              <div className="vs-dash-head">
                <span className="vs-dash-star">✦</span>
                <span className="vs-dash-title">The catalog, live</span>
              </div>
              <div className="vs-stat-list">
                {stats.map(s => (
                  <div className="vs-stat-row" key={s.label}>
                    <span>{s.label}</span>
                    <b><CountUp value={s.value} /></b>
                  </div>
                ))}
              </div>
            </div>
          </VistaReveal>
        </div>
      </div>
    </div>
  );
}

function VistaPlanPanel() {
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section">
        <div className="vs-shell">
          <VistaReveal className="vs-panel">
            <div className="vs-panel-head">
              <div>
                <h2>Build a focused route from where you are to placement season.</h2>
                <p>Pick a starting point, set the pace, and DeVert threads lessons, practice and mock rounds into one plan.</p>
              </div>
              <span className="vs-live-tag"><span className="dot" />Free to build &middot; no card required</span>
            </div>

            <div className="vs-plan-grid">
              <div className="vs-plan-card">
                <div className="vs-plan-route">
                  <span><b>Fundamentals</b><small>Where you start</small></span>
                  <span className="arrow">→</span>
                  <span><b>Placement Ready</b><small>DSA &middot; CS Core &middot; Aptitude</small></span>
                </div>

                <div className="vs-plan-fields">
                  <label>START DATE<span>Today</span></label>
                  <label>TARGET<span>Placement season</span></label>
                  <label>TRACK<span>DSA + Programming</span></label>
                  <label>PACE<span>Steady - 1hr/day</span></label>
                </div>

                <div className="vs-plan-checks">
                  <span className="on">✓ Daily challenges</span>
                  <span className="on">✓ Mock interviews</span>
                  <span>Company-specific prep</span>
                </div>

                <div className="vs-plan-foot">
                  <span>12 weeks &middot; 3 modules &middot; graded on real test cases</span>
                  <Link href="/learning" className="vs-btn small">Start my plan ↗</Link>
                </div>
              </div>

              <div className="vs-pick-card">
                <span className="vs-pick-tag">✦ Most started</span>
                <h3>Java + DSA</h3>
                <p>The most commonly asked combination for service and product company interviews - one language, one problem set, graded end to end.</p>
                <div className="vs-pick-stats">
                  <span>Auto-graded</span>
                  <span>Hidden test cases</span>
                  <span>Free to start</span>
                </div>
              </div>
            </div>
          </VistaReveal>
        </div>
      </section>
    </div>
  );
}

function VistaFeaturesPanel() {
  return (
    <div className={`vs-scope ${vistaDisplay.variable} ${vistaBody.variable}`}>
      <section className="vs-section tight">
        <div className="vs-shell">
          <VistaReveal className="vs-panel dark">
            <div className="vs-panel-head">
              <div>
                <h2>Built for the parts placement prep skips.</h2>
                <p>The bits that don&rsquo;t fit a syllabus: the track you almost skipped, the streak you kept anyway, the profile that remembers all of it.</p>
              </div>
              <Link href="/practice" className="vs-btn outline light">Open practice ↗</Link>
            </div>
            <div className="vs-feature-grid">
              <div className="vs-feature-card">
                <span className="vs-feature-icon">◇</span>
                <h4>One curriculum, everywhere</h4>
                <p>Authored once and shared by every learner and every college - a fix to a lesson reaches all of them at once.</p>
                <div className="vs-track-list">
                  {VS_TRACKS.map(t => <span key={t.label}>{t.label}<i /></span>)}
                </div>
              </div>
              <div className="vs-feature-card">
                <span className="vs-feature-icon">▤</span>
                <h4>Progress that carries over</h4>
                <p>Coins and XP follow your one DeVert account, not the module you happened to open today.</p>
              </div>
              <div className="vs-feature-card">
                <span className="vs-feature-icon">◈</span>
                <h4>Honest leaderboards</h4>
                <p>Real ranks from real submissions - no vanity streaks, nothing purchasable.</p>
              </div>
            </div>
          </VistaReveal>
        </div>
      </section>
    </div>
  );
}

// ---------------- page ----------------

export function CampusLanding() {
  const { theme } = useCampusTheme();
  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [activeContestCount, setActiveContestCount] = useState(null);

  useEffect(() => {
    // studentCount reads straight off the institution doc - it is kept live by
    // approveStudent/suspendStudent/removeStudentFromInstitution/
    // bulkAssignByRollNumber (lib/institutions.js). The per-institution
    // subcollection count this used to attempt is denied for an anonymous
    // visitor by design, so it always read null despite looking like a feature.
    fetchInstitutions().then(setInstitutions).catch(() => setInstitutions([])).finally(() => setInstLoading(false));

    fetchPublicCatalog().then(setCatalog).catch(() => setCatalog(null));

    fetchPublishedContests()
      .then(list => {
        const b = bucketContests(list);
        setActiveContestCount(b.live.length + b.upcoming.length);
      })
      .catch(() => setActiveContestCount(null));
  }, []);

  // DEPARTMENTS is a fixed enum every institution is seeded with identically
  // (ensureDepartments()), and the real per-institution `departments`
  // subcollection is unreadable to an anonymous visitor by design - so the
  // honest total is that catalog size times the number of institutions,
  // computed entirely from data this page can actually see.
  // CAMPUS tokens, not literal hex - these repaint with the theme toggle now
  // that the hero itself does.
  //
  // EVERY ONE IS A REAL COUNT of a real query (lib/campusCatalog.js) or of a
  // list this page already fetched - none is a round marketing figure, and a
  // failed fetch stays `null` so the bar renders a dash rather than claiming
  // zero.
  //
  // "GATE PYQs" counts only PUBLISHED questions, which is the point: a
  // PDF-extracted draft awaiting human review is status:"draft" and cannot
  // reach this number (see countPublishedPyqs). So the figure a visitor reads
  // here is always the verified bank, never the import queue - it will climb
  // as review lands rather than starting at the raw extraction total and
  // quietly including questions nobody has checked.
  const heroStats = [
    { label: "DSA problems", value: catalog?.problemCount ?? null, icon: Code2, color: CAMPUS.cyan },
    { label: "Programming languages", value: catalog ? catalog.languages.length : null, icon: CodeXml, color: CAMPUS.teal },
    { label: "CS Core subjects", value: catalog ? catalog.subjects.length : null, icon: BrainCircuit, color: CAMPUS.purple },
    { label: "GATE PYQs", value: catalog?.gatePyqCount ?? null, icon: GraduationCap, color: CAMPUS.gold },
    { label: "Registered learners", value: catalog?.learners ?? null, icon: Users, color: CAMPUS.blue },
    { label: "Open contests", value: activeContestCount, icon: Trophy, color: CAMPUS.gold },
    { label: "Partner colleges", value: instLoading ? null : institutions.length, icon: Building2, color: CAMPUS.good },
  ];

  return (
    // campus-square, NOT campus-sharp - see PricingBand/FaqBand/LandingFooter's
    // own comments on why.
    //
    // campus-photo-bg IS here now. It was not before: the Vista bands carried
    // their own plate on .vs-canvas::before, so this element never needed one.
    // That plate was position:absolute and scrolled while the rest of the
    // platform's is fixed, so it was removed - which left this page with no
    // backdrop at all, because nothing else on it ever painted one.
    //
    // FORCED "dark", not `theme`. Every band below is wrapped in .vs-scope,
    // which hardcodes its own dark tokens (--vs-bg: #0a0e17) regardless of the
    // light/dark toggle. So this page renders dark even when the toggle says
    // light, and passing `theme` handed it the flat LIGHT canvas - a light
    // backdrop nobody could see behind a hardcoded-dark scope. The surface is
    // dark by construction, so it takes the dark plate by construction.
    <main data-theme={theme} style={{ ...campusPhotoBg("dark"), colorScheme: theme }}
      className="campus-theme campus-photo-bg">
      <CampusPublicNav />

      <VistaHero stats={heroStats} />
      <VistaPlanPanel />
      <VistaFeaturesPanel />
      {/* Above BringToCampusBanner deliberately: everything from that banner
          down addresses COLLEGES (bring us to your campus, licence pricing),
          and GATE is aimed at the individual candidate, who may well have no
          college on the platform at all. */}
      <GateBand catalog={catalog} />
      <BringToCampusBanner />

      <PricingBand />
      <FaqBand />
      <LandingFooter />
    </main>
  );
}

