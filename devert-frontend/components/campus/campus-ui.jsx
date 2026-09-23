"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Sparkles } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CAMPUS, tint } from "@/lib/campus-theme";

// Shared Material-3-ish primitives for DeVert Campus - built once here so
// every screen (directory, workspace, profile) draws from the same visual
// vocabulary instead of re-inventing cards/chips/stats per file. Nothing
// here reads campus-app.jsx's theme context directly (avoids a circular
// import) - elevation/shadow is themed via the --campus-shadow* CSS vars
// instead, which already swap with the .campus-theme[data-theme] attribute
// the same way every other CAMPUS.* token does.

// `glass` opts into the blurred, translucent .campus-glass treatment (see
// globals.css) instead of a flat surface fill - reserved for chrome that's
// meant to visually float above the page (hero banners, sticky bars), not
// the default for every card (a fully-glass dashboard of a dozen cards reads
// as noisy, not premium). `hover` now lifts AND deepens the shadow together
// via a CSS transition instead of manual mouseenter/leave handlers, so the
// motion itself is GPU-friendly (transform + opacity only) and respects
// prefers-reduced-motion for free (see globals.css's campus-theme override).
// Deliberately staying on rounded-2xl, not a bigger arbitrary radius: this
// exact class name is what .campus-sharp/.campus-square (globals.css) match
// on to flatten cards for the pre-auth public pages. Swapping it for
// rounded-3xl or rounded-[22px] would silently break that - those rules list
// specific Tailwind radius class NAMES, not "whatever CampusCard emits".
// The bigger-radius look lives on the hand-styled shells instead (hero,
// sidebar, top bar, banners - raw divs, not this component).
// `glass` now DEFAULTS to true: every Campus surface sits over the
// photographic backdrop (see lib/campus-theme.js's campusPhotoBg) now, not
// just the student Dashboard this treatment started on - flipping the
// default here is what makes every existing CampusCard call site across the
// whole app (Programming, Aptitude, DSA, Manage, the public landing page...)
// pick up the same frosted look for free, instead of hand-editing `glass`
// onto hundreds of call sites one file at a time. Pass `glass={false}`
// explicitly for the rare spot that genuinely wants a flat, fully opaque
// card (there are none as of this writing, but the escape hatch stays).
export function CampusCard({ children, className = "", hover = false, glass = true, style, as: As = "div", ...rest }) {
  return (
    <As
      className={`rounded-2xl transition-all duration-200 ${hover ? "cursor-pointer campus-card-hover" : ""} ${glass ? "campus-glass" : ""} ${className}`}
      style={{
        background: glass ? undefined : CAMPUS.surface,
        border: glass ? undefined : `1px solid ${CAMPUS.line}`,
        boxShadow: CAMPUS.shadow,
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

// THE product mark - public/Logo.png, the same asset devert.in ships under.
//
// ONE image, not the two theme variants this used to swap between via the
// .campus-badge-dark/.campus-badge-light CSS pair (both now deleted from
// globals.css, along with the trimmed devert-campus-badge-dark/light.png
// assets they selected). The logo carries its own near-black plate behind the
// green/cyan chevrons, so it reads correctly on a white card and on a #0A0E17
// one alike - there is nothing left for a theme to choose between.
//
// The served file is downscaled to 192px from the 1254px, ~1.7MB original in
// the repo-root public/Logo.png: a 30px badge has no use for a megabyte, and
// `images: { unoptimized: true }` in next.config means Next will never resize
// it for us. 192 rather than 96 so it stays sharp at 2x on the largest call
// site (CampusPublicNav's 34px wordmark lockup).
//
// Each app serves its OWN public/ dir, so this file is duplicated into
// devert-frontend/public and devert-campus/public deliberately - the jsconfig
// @/* source-sharing that lets campus import this component does not extend to
// static assets.
//
// alt="", not "DeVert Campus": every call site pairs this with the visible
// wordmark text, so a real alt would make a screen reader announce the name
// twice.
// `rounded` defaults to campus-badge-round, NOT a Tailwind rounded-* class:
// .campus-square (globals.css) sets border-radius:0 !important on
// .rounded-md/lg/xl/2xl, which squared the logo off wherever that class is
// applied. Same escape hatch, and same reasoning, as .campus-overlay-shadow.
export function CampusBadge({ size = 30, className = "", rounded = "campus-badge-round" }) {
  // Radius scales with the badge so the curve reads the same at 26px and at
  // 96px. Inline rather than a utility class on purpose: .campus-square sets
  // border-radius:0 !important on every .rounded-* class, which is what
  // squared this mark off across the public surfaces.
  const radius = Math.max(4, Math.round(size * 0.26));
  const box = { width: size, height: size, borderRadius: radius };
  return (
    <span className={`relative flex-shrink-0 ${className}`} style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/devert-campus-badge.png" alt="" width={size} height={size}
        className={rounded} style={box} />
    </span>
  );
}

// color: a CAMPUS.* hex value (teal/gold/good/warn/bad/blue/purple) - tint
// background + tinted border, generalizing the pill idiom already used ad
// hoc in aptitude/contest/problem cards elsewhere in the app.
export function CampusChip({ children, color = CAMPUS.inkFaint, icon: Icon, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${className}`}
      style={{ color, background: tint(color, 14), border: `1px solid ${tint(color, 26)}` }}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

export function CampusProgressBar({ pct, color = CAMPUS.teal }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// `icon`/`trend` are additive - every pre-existing `<CampusStat label value
// color hint />` call site (dozens, across Manage/Analytics/Department
// dashboards) renders exactly as before, just picking up the new card chrome
// for free. `trend` is a plain string like "+12%" or "-3%" - the leading
// sign decides the arrow/color (up = good, down = bad), so callers don't
// need to compute a {direction,value} shape themselves.
export function CampusStat({ label, value, color, hint, icon: Icon, trend }) {
  const accent = color || CAMPUS.teal;
  const trendUp = typeof trend === "string" && trend.trim().startsWith("+");
  const trendDown = typeof trend === "string" && trend.trim().startsWith("-");
  return (
    <CampusCard hover className="p-4 relative overflow-hidden">
      {Icon && (
        <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-[0.08]" style={{ background: accent }} aria-hidden="true" />
      )}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        {Icon ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(accent, 14), color: accent }}>
            <Icon size={16} />
          </div>
        ) : (
          <span className="text-[10px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }} title={hint || undefined}>{label.toUpperCase()}</span>
        )}
        {trend && (
          <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: trendDown ? CAMPUS.bad : trendUp ? CAMPUS.good : CAMPUS.inkFaint }}>
            {trendUp ? "↑" : trendDown ? "↓" : ""} {trend.replace(/^[+-]/, "")}
          </span>
        )}
      </div>
      <span className="block text-2xl font-bold tabular-nums" style={{ color: CAMPUS.ink, fontFamily: "var(--font-inter)" }}>{value}</span>
      <span className="block text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }} title={Icon ? hint : undefined}>{Icon ? label : null}</span>
    </CampusCard>
  );
}

// Composable shimmer placeholder - token-driven (line/surface), so it's the
// one loading treatment every Campus screen reaches for instead of a plain
// "Loading..." <p>. `variant` picks the shape; width/height take any CSS
// size value ("100%", 120, "2.5rem", ...).
export function CampusSkeleton({ variant = "text", width, height, className = "" }) {
  const radius = variant === "circle" ? "9999px" : variant === "rect" ? "12px" : "4px";
  const resolvedHeight = height ?? (variant === "text" ? "0.9em" : variant === "circle" ? width : 16);
  return (
    <div
      className={className}
      style={{
        width: width ?? "100%",
        height: resolvedHeight,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${CAMPUS.line} 25%, ${CAMPUS.surface} 37%, ${CAMPUS.line} 63%)`,
        backgroundSize: "400% 100%",
        animation: "campus-shimmer 1.4s ease infinite",
        flexShrink: 0,
      }}
    />
  );
}

// icon + title + description + optional ready-made action button(s) - the
// one "nothing here yet" treatment every Campus list/table reaches for
// instead of a hand-built CampusCard block per call site. Left-aligned icon
// badge + text, matching the tinted-icon-chip idiom every other Campus card
// already uses (UpcomingContestRow, ProfileRow, CampusCourseCatalog) - NOT a
// centered icon-on-top layout, which is a different, more generic pattern
// than anything else in this app. `action`/`secondaryAction` are whole
// button elements (usually a CampusButton), not click handlers - keeps this
// component's own API tiny.
export function CampusEmptyState({ icon: Icon, title, description, action, secondaryAction, size = "md", color = CAMPUS.teal, glass = false, className = "" }) {
  const compact = size === "sm";
  return (
    // flex column throughout, so an empty state sitting in a stretched grid
    // cell (h-full) fills the height and bottom-aligns its action instead of
    // leaving the button wherever the description happened to end. `mt-auto
    // pt-3.5` on the action row is what does it: with slack above, mt-auto
    // pushes the row to the bottom; with no slack, mt-auto collapses to 0 and
    // pt-3.5 preserves exactly the spacing this had before.
    <CampusCard glass={glass} className={`${compact ? "p-5" : "p-6"} flex flex-col ${className}`}>
      <div className="flex items-start gap-3.5 flex-1">
        {Icon && (
          <div className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg flex items-center justify-center flex-shrink-0`}
            style={{ background: tint(color, 14), color }}>
            <Icon size={compact ? 15 : 18} />
          </div>
        )}
        <div className="min-w-0 flex-1 flex flex-col">
          <h3 className={`${compact ? "text-[13px]" : "text-[14.5px]"} font-semibold mb-1`} style={{ color: CAMPUS.ink }}>{title}</h3>
          {description && <p className={`${compact ? "text-[12px]" : "text-[13px]"} leading-relaxed`} style={{ color: CAMPUS.inkSoft }}>{description}</p>}
          {(action || secondaryAction) && (
            <div className="flex items-center gap-2.5 mt-auto pt-3.5 flex-wrap">{action}{secondaryAction}</div>
          )}
        </div>
      </div>
    </CampusCard>
  );
}

// primary is a gradient fill (indigo -> purple, see CAMPUS.gradientPrimary)
// rather than a flat chrome block - the one place this redesign's "gradient
// buttons" requirement lives, inherited for free by every existing
// `<CampusButton>` (no variant prop) call site across the app. `campus-btn-
// glow` (globals.css) adds the soft color-matched shadow-on-hover instead of
// a plain darken, which is what makes a gradient button read as "premium"
// instead of just colorful.
const CAMPUS_BUTTON_VARIANTS = {
  primary:   { background: CAMPUS.gradientPrimary, color: "#fff" },
  secondary: { background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` },
  ghost:     { background: "transparent", color: CAMPUS.teal },
  glass:     { background: CAMPUS.glassBg, color: CAMPUS.ink, border: `1px solid ${CAMPUS.glassBorder}` },
  success:   { background: CAMPUS.good, color: "#fff" },
  danger:    { background: CAMPUS.badTint, color: CAMPUS.bad },
};

const CAMPUS_RADIUS = { lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl", full: "rounded-full" };

// Standardizes the inline `style={{background/color/border}}` button pattern
// repeated ad hoc across every Campus file - a styling consolidation, not a
// new interaction (still a plain <button>, all native props pass through).
// `rounded` picks the corner radius as its own prop (not a className string
// to merge) - two radius utilities in one class list fight over the same
// CSS property with no reliable winner, so callers that need to match a
// CampusCard's rounded-2xl (e.g. a button sitting in the same card grid)
// pass rounded="2xl" instead of trying to override via className.
export function CampusButton({ variant = "primary", size = "md", rounded = "lg", icon: Icon, children, className = "", style, ...rest }) {
  const variantStyle = CAMPUS_BUTTON_VARIANTS[variant] || CAMPUS_BUTTON_VARIANTS.primary;
  const sizing = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const radiusClass = CAMPUS_RADIUS[rounded] || CAMPUS_RADIUS.lg;
  const glowable = variant === "primary" || variant === "success";
  return (
    <button
      className={`campus-btn inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${glowable ? "campus-btn-glow" : ""} ${radiusClass} ${sizing} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}

// Segmented control for in-page tab switching (department/classroom/admin
// dashboards, Manage sub-tabs). The idiom every Campus screen had been
// hand-rolling was a row of independently-bordered pills with a solid-fill
// active state; this instead sinks the whole row into a CAMPUS.paper track and
// LIFTS the active tab out of it with surface + shadow, which is the premium-SaaS
// treatment the rest of this design system uses (same construction as the
// range/metric switchers on the dashboard chart).
//
// `tabs`: [{ key, label, icon? }]. Renders real <button>s in a tablist, so
// keyboard focus order and screen-reader semantics come for free - the previous
// hand-rolled rows were divs of buttons with no tablist role.
// Fully-rounded pill track + solid-fill active pill (Material-style
// segmented tabs) - rounded-full on both the track and the buttons, active
// tab filled solid with CAMPUS.teal + white text instead of the previous
// surface+shadow "lifted tile" look. This one component backs tab rows
// across dozens of screens (department/classroom/admin dashboards, Manage
// sub-tabs), so this is a one-file way to make "pill tabs" the app-wide
// pattern rather than a per-screen hand-edit.
export function CampusTabBar({ tabs, value, onChange, className = "", size = "md" }) {
  const compact = size === "sm";
  return (
    <div role="tablist" aria-orientation="horizontal"
      className={`inline-flex items-center gap-1 p-1 rounded-full max-w-full overflow-x-auto ${className}`}
      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      {tabs.map(t => {
        const active = t.key === value;
        return (
          <button key={t.key} role="tab" aria-selected={active} onClick={() => onChange(t.key)}
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ${compact ? "px-3 py-1 text-[11.5px]" : "px-3.5 py-1.5 text-[12.5px]"}`}
            style={active
              ? { background: CAMPUS.teal, color: "#fff", boxShadow: CAMPUS.shadow }
              : { background: "transparent", color: CAMPUS.inkFaint }}>
            {t.icon && <t.icon size={compact ? 11 : 13} style={{ color: active ? "#fff" : "currentColor" }} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// A single "Download" button that expands into CSV/Excel/PDF choices,
// backed by lib/campusReports.js's generic exporter - used everywhere a
// report can be downloaded (Command Center, Manage > Students, contest
// dashboards) instead of each spot hand-rolling its own export button.
// `getReport` is called lazily (only once a format is actually picked), so
// opening the menu itself never fires a Firestore read - only confirming a
// format does. lib/campusReports is dynamically imported here so pages that
// never touch a Download button don't pull jspdf/xlsx into their bundle.
export function ReportDownloadButton({ label = "Download", getReport, size = "md", variant = "secondary" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handle = async (format) => {
    setOpen(false);
    setBusy(true);
    setError("");
    try {
      const [{ downloadReport }, report] = await Promise.all([import("@/lib/campusReports"), getReport()]);
      await downloadReport(report, format);
    } catch (e) {
      setError(e?.message || "Failed to generate report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block">
      <CampusButton variant={variant} size={size} icon={Download} disabled={busy} onClick={() => setOpen(o => !o)}>
        {busy ? "Preparing..." : label}
      </CampusButton>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-10" />
          <div className="absolute right-0 mt-1 z-20 rounded-lg overflow-hidden min-w-[120px]"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
            {[["csv", "CSV"], ["excel", "Excel"], ["pdf", "PDF"]].map(([fmt, fmtLabel]) => (
              <button key={fmt} onClick={() => handle(fmt)}
                className="block w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors"
                style={{ color: CAMPUS.ink }}>
                {fmtLabel}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="absolute right-0 top-full mt-1 text-[10.5px] whitespace-nowrap" style={{ color: CAMPUS.bad }}>{error}</p>}
    </div>
  );
}

// One back control for every Campus screen, instead of each sub-view
// hand-rolling its own label/icon (some had a plain-text "<-", some pointed
// at a hardcoded "return to DeVert Campus" destination). `onClick` is always
// the actual previous view for that screen - a screen-stack pop, a tab
// switch, or a route change - never a fixed default, so the button is
// always correct regardless of how the page was reached.
export function CampusBackButton({ onClick, label = "Back", className = "" }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-medium mb-5 transition-colors ${className}`}
      style={{ color: CAMPUS.inkFaint }}>
      <ArrowLeft size={12} /> {label}
    </button>
  );
}

// A "you are here" trail for screens buried more than one level deep (e.g.
// Company Prep's Company -> Round -> Category), so a single generic
// CampusBackButton isn't the only way to tell where you are or to jump back
// up more than one level at once. `items`: [{ label, onClick? }] - every
// item with an onClick is a clickable crumb; the item(s) without one render
// as the current, bolded location. Falls back to rendering nothing for a
// falsy/missing label so a caller can pass a not-yet-loaded name without an
// extra guard.
export function CampusBreadcrumb({ items, className = "" }) {
  const visible = items.filter(i => i.label);
  if (visible.length === 0) return null;
  return (
    <nav className={`flex items-center gap-1.5 text-xs font-medium mb-5 flex-wrap ${className}`}>
      {visible.map((item, i) => {
        const isLast = i === visible.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={11} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
            {item.onClick && !isLast ? (
              <button onClick={item.onClick} className="transition-colors hover:underline" style={{ color: CAMPUS.inkFaint }}>
                {item.label}
              </button>
            ) : (
              <span style={{ color: isLast ? CAMPUS.ink : CAMPUS.inkFaint, fontWeight: isLast ? 600 : 500 }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ---------------- Learn module sidebar (contextual sub-nav) ----------------
//
// Programming/CS Core/Aptitude/Roadmaps each portal their own language-or-
// subject list, then that item's topic tree, into CampusContextSidebar's
// slot (see campus-app.jsx's "Navigation Architecture 2.0" comment) - and
// until now each of the four files hand-rolled an identical `campus-btn`
// button with no hover feedback at all (`.campus-btn` only lifts 1px; the
// surface-tint hover every OTHER nav row in the app gets lives in the
// `.campus-nav-item`/`.campus-nav-item-active` globals.css rules, which
// nothing actually applied a className for). These four give every one of
// those lists the same polish in one place instead of four copies quietly
// drifting apart.

// Section caption ("PROGRAMMING", "CS CORE", "APTITUDE", "ROADMAPS") atop
// a module's own sidebar list - a bottom hairline instead of bare
// tracking-wide caps text floating with nothing to anchor it to the list
// below.
export function SidebarSectionLabel({ children }) {
  return (
    <div className="px-2.5 pb-2 mb-1.5 text-[10px] font-mono tracking-widest border-b"
      style={{ color: CAMPUS.inkFaint, borderColor: CAMPUS.line }}>
      {children}
    </div>
  );
}

// "All languages" / "All subjects" / "All roadmaps" - was a bare unstyled
// <button> with zero hover feedback; now gets the same campus-nav-item lift
// as every row below it, so going back reads as part of the same list
// rather than a stray label sitting above it.
export function SidebarBackLink({ onClick, children }) {
  return (
    <button onClick={onClick}
      className="campus-btn campus-nav-item w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-1.5 text-[11px] font-semibold text-left transition-all duration-150"
      style={{ color: CAMPUS.inkFaint }}>
      <ChevronLeft size={12} /> {children}
    </button>
  );
}

// A module's top-level list row (a language, a CS Core subject, a roadmap) -
// wraps the icon in the same tinted-chip idiom CampusStat/CampusEmptyState
// already use elsewhere (instead of a bare, same-color-as-the-text icon)
// and picks up campus-nav-item's hover lift, so these finally read as
// clickable rows instead of plain icon+text lines.
export function SidebarNavRow({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="campus-btn campus-nav-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150"
      style={{ color: CAMPUS.inkSoft }}>
      {Icon && (
        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.teal, 12) }}>
          <Icon size={14} />
        </span>
      )}
      <span className="text-[13px] font-medium leading-snug truncate">{label}</span>
    </button>
  );
}

// A collapsible module group inside a topic-tree sidebar (Programming's
// "FUNDAMENTALS", CS Core's "OPERATING SYSTEMS", Roadmaps' per-level module,
// Aptitude's category) - same collapsed-by-default-except-the-group-
// containing-the-active-topic idiom Aptitude's sidebar already used on its
// own (see campus-aptitude.jsx's activeCategory), just extracted so every
// caller shares the one toggle-header markup instead of a fourth
// hand-rolled copy. Fully controlled (`open`/`onToggle`) - callers keep
// owning the open-set state and the "is this the active topic's group"
// check, since that logic already differs slightly per caller (a Set of
// module names vs. category names).
export function SidebarModuleGroup({ label, icon: Icon, color = CAMPUS.inkFaint, open, onToggle, children }) {
  return (
    <div className="mb-1.5">
      <button onClick={onToggle}
        className="campus-btn campus-nav-item w-full flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9.5px] font-mono tracking-widest text-left transition-all duration-150"
        style={{ color }}>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        {Icon && <Icon size={11} />}
        <span className="truncate">{label}</span>
      </button>
      {/* Indented + a connecting guide line so the topics read as nested
          under the module header above them, not as a second flush-left
          list with no relation to it. */}
      {open && (
        <div className="mt-0.5 ml-4 pl-2 border-l" style={{ borderColor: CAMPUS.line }}>
          {children}
        </div>
      )}
    </div>
  );
}

// A single topic inside a module's topic tree (Programming/CS Core/Roadmaps'
// topic sidebar, Aptitude's per-category list). The active row is a soft
// tint + left accent bar, not CAMPUS.gradientPrimary's solid fill - that
// gradient is the platform's "primary button" idiom (now a bright warm
// orange, see lib/campus-theme.js's CAMPUS.teal comment), and a solid block
// of it behind plain list text read as a loud CTA button rather than "this
// is where you are," which is all a sidebar row selection needs to say.
// Every inactive row gets the campus-nav-item hover lift that was
// previously missing entirely.
//
// `done` was a filled/empty circle bubble at first - traded for a small
// arrow instead (colored to still hint completion) since the row bubbles
// read as a checklist-of-many rather than a simple nav list. A literal
// borderTop divider between rows (RoadmapTimeline's other signature) was
// also deliberately left out - that reads as a flush list of full-width
// rows in a single card, but these are individually rounded pill buttons
// with a gap between them, so a top border would just cut into a rounded
// corner rather than read as a divider.
export function SidebarTopicRow({ label, active, done, onClick }) {
  return (
    <button onClick={onClick}
      className={`campus-btn campus-nav-item w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-150 ${active ? "campus-nav-item-active" : ""}`}
      style={{
        background: active ? tint(CAMPUS.teal, 14) : "transparent",
        color: active ? CAMPUS.teal : CAMPUS.inkSoft,
        borderLeft: `2px solid ${active ? CAMPUS.teal : "transparent"}`,
      }}>
      <ChevronRight size={11} className="flex-shrink-0"
        style={{ color: done ? CAMPUS.good : active ? CAMPUS.teal : CAMPUS.inkFaint }} />
      <span className="text-[12.5px] leading-snug truncate flex-1">{label}</span>
    </button>
  );
}

// Small client-side sort helper - every Campus table today already fetches
// its full (small) dataset up front, so sorting is a pure in-memory
// re-order, never a new Firestore query/index.
function useSortableRows(rows, defaultKey = null, defaultDir = "desc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);
  const toggleSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  return { sorted, sortKey, sortDir, toggleSort };
}

// `columns`: [{ key, label, sortable?, render?(row) }]. Falls back to
// `emptyState` (a <CampusEmptyState/>) when `rows` is empty, so callers never
// need their own separate empty-state branch just to swap in a table.
// `rowStyle(row)` is an optional per-row style override (e.g. highlighting
// "your own" row in a leaderboard).
export function CampusTable({ columns, rows, rowKey = "id", emptyState, rowStyle, onRowClick }) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortableRows(rows);
  if (rows.length === 0) return emptyState || null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            {columns.map(col => (
              <th key={col.key} onClick={() => col.sortable && toggleSort(col.key)}
                className={`text-[10px] font-mono text-left px-3 py-2.5 tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer select-none" : ""}`}
                style={{ color: sortKey === col.key ? CAMPUS.teal : CAMPUS.inkFaint }}>
                {col.label.toUpperCase()}{col.sortable && sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row[rowKey]} onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : ""}
              style={{ borderBottom: `1px solid ${CAMPUS.line}`, ...(rowStyle ? rowStyle(row) : {}) }}>
              {columns.map(col => (
                <td key={col.key} className="text-[12px] px-3 py-2.5" style={{ color: CAMPUS.ink }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- roadmap timeline ----------------

// The Learn modules' "Roadmap" tab (a subject's or a language's topic tree,
// grouped by module) used to render as a flat stack of accordion cards -
// functionally fine (click a module, its topics unfold) but visually
// indistinguishable from any other list on the page. This renders the exact
// same data as a connected vertical timeline instead - a numbered/checked
// node per module on a spine - while keeping the identical click-to-expand
// interaction, so it's a drop-in replacement for the hand-rolled block
// campus-cscore.jsx and campus-programming.jsx used to duplicate byte-for-
// byte. `modules`: [{ module, topics: [{ id, title }] }]. `completedIds`/
// `openModules` are Sets the caller already owns (progress + accordion
// state) - this component renders them, it doesn't fetch or track either.
// `topicLabel`/`moduleIcon` are accessors, not a data-shape requirement -
// campus-aptitude.jsx's AptitudeRoadmap groups by category (not "module")
// and names its topics `.name` rather than `.title`, and shows a category
// icon CS Core/Programming don't have; both read through these instead of
// each caller reshaping its data to match one hardcoded field name.
// startIndex/moduleLabel added for the Roadmaps module, which stacks three
// of these (one per Beginner/Intermediate/Advanced level) as one continuous
// path - without startIndex each level's numbering restarted at 1 (reading
// as "1,2,3, 1,2,3,4, 1,2" down one spine), and without moduleLabel two
// levels legitimately both containing a same-named module (e.g. two
// "Fundamentals" modules) would collide on the `module` value doubling as
// React key, openModules Set member AND visible label all at once. Both
// default to the identity behavior every existing call site already gets,
// so CS Core/Programming/Aptitude are unaffected.
export function RoadmapTimeline({
  modules, completedIds, openModules, onToggleModule, onOpenTopic,
  topicHasContent = () => true, topicLabel = (t) => t.title,
  moduleIcon = () => null, accent = CAMPUS.teal,
  startIndex = 0, moduleLabel = (m) => m,
}) {
  return (
    <div className="relative">
      {/* The spine, centered on the 40px (w-10) nodes below (20px = their
          half-width). top-5/bottom-5 land it roughly at the first and last
          node's own center, not their card's - a few px of slack either way
          reads as normal in this genre of diagram, same as the GATE-style
          reference this is modeled on. */}
      <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: CAMPUS.line }} aria-hidden="true" />
      <div className="space-y-4">
        {modules.map(({ module, topics }, i) => {
          const total = topics.length;
          const completed = topics.filter(t => completedIds.has(t.id)).length;
          const done = total > 0 && completed === total;
          const started = completed > 0;
          const open = openModules.has(module);
          const icon = moduleIcon(module);
          return (
            <div key={module} className="relative pl-14">
              {/* A second, cosmetic control over the same module - the node
                  and the card header below both toggle the identical state,
                  same as a stepper's number bubble and its label always
                  pointing at one one step. */}
              <button onClick={() => onToggleModule(module)}
                aria-label={`${open ? "Collapse" : "Expand"} ${module}`}
                className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors"
                style={done
                  ? { background: accent, color: "#fff" }
                  : started
                    ? { background: tint(accent, 16), color: accent, border: `2px solid ${accent}` }
                    : { background: CAMPUS.surface, color: CAMPUS.inkFaint, border: `2px solid ${CAMPUS.line}` }}>
                {done ? <Check size={17} /> : <span className="text-[13px] font-bold">{startIndex + i + 1}</span>}
              </button>
              <CampusCard className="overflow-hidden">
                <button onClick={() => onToggleModule(module)} aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left">
                  <span className="flex items-center gap-2 min-w-0">
                    {icon && <icon.icon size={15} style={{ color: icon.color, flexShrink: 0 }} />}
                    <b className="text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{moduleLabel(module)}</b>
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{completed}/{total}</span>
                    <ChevronDown size={15} style={{
                      color: CAMPUS.inkFaint, flexShrink: 0,
                      transform: open ? "rotate(180deg)" : "none",
                      transition: "transform 0.18s",
                    }} />
                  </div>
                </button>
                {open && (
                  <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                    {topics.map(t => {
                      const topicDone = completedIds.has(t.id);
                      const hasContent = topicHasContent(t);
                      return (
                        <button key={t.id} onClick={() => onOpenTopic(t.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: topicDone ? CAMPUS.goodTint : CAMPUS.paper, border: `1px solid ${topicDone ? CAMPUS.good : CAMPUS.line}` }}>
                            {topicDone && <Check size={11} style={{ color: CAMPUS.good }} />}
                          </div>
                          <span className="flex-1 text-[13px]" style={{ color: CAMPUS.ink }}>{topicLabel(t)}</span>
                          {!hasContent && <CampusChip color={CAMPUS.inkFaint}>COMING SOON</CampusChip>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CampusCard>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Extracted from campus-cscore.jsx's TopicView (the "how do I get to the
// next topic" fix - a live student report that the only way forward from a
// finished lesson was the sidebar, hidden behind a menu button on mobile),
// at its second use for Roadmaps - the exact "extract on second use"
// threshold RoadmapTimeline above was itself created at.
//
// Shown regardless of completion state by every caller so far (CS Core is
// attempt-based, not gated; Roadmaps' levels are advisory-only) - there is
// no reason to also gate forward navigation on having passed anything.
// `next.groupLabel` is only rendered when `crossesModule` is true, so a
// caller whose "next" object has no such field (nothing crossed) simply
// omits it.
//
// `prev` is optional and purely additive: a caller that passes none renders
// exactly the single full-width next card this component always rendered.
// Pass both and they sit side by side above the sm: breakpoint. Both go
// through the SAME onOpenTopic callback, so a caller needs no second handler.
export function LessonNavFooter({
  next, prev, crossesModule, done, onOpenTopic, onBack,
  groupNoun = "Module", endTitle, endBody, endButtonLabel = "Back to Roadmap",
}) {
  return (
    <>
      {(prev || next) && (
        <div className={prev && next ? "grid sm:grid-cols-2 gap-3" : ""}>
          {prev && (
            <CampusCard className="p-4 flex items-center gap-3">
              <CampusButton variant="secondary" icon={ArrowLeft} onClick={() => onOpenTopic(prev.id)}>
                Previous
              </CampusButton>
              <div className="min-w-0">
                <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>
                  PREVIOUS TOPIC
                </p>
                <p className="text-[13.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{prev.title}</p>
              </div>
            </CampusCard>
          )}
          {next && (
            <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>
                  {crossesModule ? `NEXT ${groupNoun.toUpperCase()}` : "NEXT TOPIC"}
                </p>
                <p className="text-[13.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{next.title}</p>
                {crossesModule && next.groupLabel && (
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: CAMPUS.inkFaint }}>{next.groupLabel}</p>
                )}
              </div>
              <CampusButton icon={ArrowRight} onClick={() => onOpenTopic(next.id)}>
                {crossesModule ? `Next ${groupNoun}` : "Next Topic"}
              </CampusButton>
            </CampusCard>
          )}
        </div>
      )}

      {done && (
        <CampusCard className="p-5 text-center">
          <Sparkles size={18} className="mx-auto mb-2" style={{ color: CAMPUS.gold }} />
          <p className="text-[13.5px] font-semibold" style={{ color: CAMPUS.ink }}>{endTitle}</p>
          <p className="text-[11.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>{endBody}</p>
          <div className="mt-3.5">
            <CampusButton onClick={onBack}>{endButtonLabel}</CampusButton>
          </div>
        </CampusCard>
      )}
    </>
  );
}

// Google is DeVert's only auth method (see app/login/page.jsx) - signInWithPopup
// never navigates, so whoever's inside Campus stays exactly where they are
// the whole time. Lives here (not campus-app.jsx) so every Campus screen -
// including the ported Contests/Practice/Learning views, which import this
// module already for CampusCard/CampusChip - can show an inline "sign in to
// continue" prompt without ever doing `window.location.href = "/login?..."`,
// which would be a redirect out to devert.in.
export function CampusGoogleButton({ label = "Sign in with Google", style }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    console.log("[Auth Debug] CampusGoogleButton: Starting signInWithPopup");
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      console.log("[Auth Debug] CampusGoogleButton: signInWithPopup succeeded for uid:", result.user.uid);
    } catch (e) {
      console.error("[Auth Debug] CampusGoogleButton: signInWithPopup failed:", e);
      setError("Sign-in failed - try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGoogle} disabled={loading}
        className="inline-flex items-center justify-center gap-2.5 text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 w-full"
        style={style}>
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? "Signing in..." : label}
      </button>
      {error && <p className="text-[11.5px] mt-2 text-center" style={{ color: CAMPUS.bad }}>{error}</p>}
    </div>
  );
}
