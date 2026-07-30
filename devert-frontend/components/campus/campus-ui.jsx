"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Download } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CAMPUS } from "@/lib/campus-theme";

// Shared Material-3-ish primitives for DeVert Campus - built once here so
// every screen (directory, workspace, profile) draws from the same visual
// vocabulary instead of re-inventing cards/chips/stats per file. Nothing
// here reads campus-app.jsx's theme context directly (avoids a circular
// import) - elevation/shadow is themed via the --campus-shadow* CSS vars
// instead, which already swap with the .campus-theme[data-theme] attribute
// the same way every other CAMPUS.* token does.

export function CampusCard({ children, className = "", hover = false, style, as: As = "div", ...rest }) {
  return (
    <As
      className={`rounded-2xl transition-shadow ${hover ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: CAMPUS.surface,
        border: `1px solid ${CAMPUS.line}`,
        boxShadow: CAMPUS.shadow,
        ...style,
      }}
      onMouseEnter={hover ? (e) => { e.currentTarget.style.boxShadow = CAMPUS.shadowHover; e.currentTarget.style.transform = "translateY(-2px)"; } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.boxShadow = CAMPUS.shadow; e.currentTarget.style.transform = "translateY(0)"; } : undefined}
      {...rest}
    >
      {children}
    </As>
  );
}

// color: a CAMPUS.* hex value (teal/gold/good/warn/bad/blue/purple) - tint
// background + tinted border, generalizing the pill idiom already used ad
// hoc in aptitude/contest/problem cards elsewhere in the app.
export function CampusChip({ children, color = CAMPUS.inkFaint, icon: Icon, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${className}`}
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
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

export function CampusStat({ label, value, color, hint }) {
  return (
    <CampusCard className="p-3.5">
      <span className="block text-[10px] font-mono tracking-wide mb-1.5" style={{ color: CAMPUS.inkFaint }} title={hint || undefined}>{label.toUpperCase()}</span>
      <span className="block font-mono text-xl font-bold" style={{ color: color || CAMPUS.ink }}>{value}</span>
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
export function CampusEmptyState({ icon: Icon, title, description, action, secondaryAction, size = "md", color = CAMPUS.teal, className = "" }) {
  const compact = size === "sm";
  return (
    <CampusCard className={`${compact ? "p-5" : "p-6"} ${className}`}>
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-lg flex items-center justify-center flex-shrink-0`}
            style={{ background: `${color}18`, color }}>
            <Icon size={compact ? 15 : 18} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={`${compact ? "text-[13px]" : "text-[14.5px]"} font-semibold mb-1`} style={{ color: CAMPUS.ink }}>{title}</h3>
          {description && <p className={`${compact ? "text-[12px]" : "text-[13px]"} leading-relaxed`} style={{ color: CAMPUS.inkSoft }}>{description}</p>}
          {(action || secondaryAction) && (
            <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">{action}{secondaryAction}</div>
          )}
        </div>
      </div>
    </CampusCard>
  );
}

const CAMPUS_BUTTON_VARIANTS = {
  primary:   { background: CAMPUS.chromeBg, color: CAMPUS.chromeFg },
  secondary: { background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` },
  ghost:     { background: "transparent", color: CAMPUS.teal },
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
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold transition-colors disabled:opacity-50 ${radiusClass} ${sizing} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
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
