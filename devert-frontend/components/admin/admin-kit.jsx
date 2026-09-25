"use client";

// The admin console's enterprise building blocks: stat cards, a data table
// (search, filters, sort, pagination, row actions), status toggles, pills and
// a side drawer for create/edit forms. Every section is meant to be built from
// these, so the whole console reads as one product rather than 48 panels that
// each invented their own list.
//
// Numbers shown in StatGrid must be REAL - counted from Firestore. No invented
// trend arrows ("+12%"): nothing in this codebase stores history to compute a
// trend from, and an admin console that decorates itself with fake deltas is
// one the admin stops trusting.

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, Loader2 } from "lucide-react";

export const KIT = {
  green: "#00FF41", cyan: "#00FFFF", orange: "#FF9500", red: "#FF5050",
  purple: "#A78BFA", gold: "#FFD700", muted: "rgba(255,255,255,0.45)",
  surface: "rgba(10,14,22,0.85)", line: "rgba(255,255,255,0.08)",
};

const DIFFICULTY_COLORS = { easy: KIT.green, medium: KIT.orange, hard: KIT.red, extreme: KIT.red, open: KIT.cyan };
export const difficultyColor = (d) => DIFFICULTY_COLORS[String(d || "").toLowerCase()] || KIT.muted;

export const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n ?? "-");

// ── Stat cards ────────────────────────────────────────────────────────────────

export function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {stats.map((s) => <StatCard key={s.label} {...s} />)}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, color = KIT.cyan, loading }) {
  return (
    <div className="rounded-xl border p-4 flex items-start gap-3.5 min-w-0" style={{ background: KIT.surface, borderColor: KIT.line }}>
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}33` }}>
          <Icon size={18} style={{ color }} />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-sans text-xs text-white/50 truncate">{label}</p>
        <p className="font-sans text-2xl font-semibold text-white leading-tight mt-0.5 tabular-nums">
          {loading ? <span className="inline-block w-12 h-6 rounded bg-white/5 animate-pulse align-middle" /> : fmt(value)}
        </p>
        {sub && <p className="font-sans text-[11px] text-white/35 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

export function Pill({ children, color = KIT.muted, className = "" }) {
  return (
    <span className={`inline-flex items-center font-sans text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap ${className}`}
      style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

export function Toggle({ on, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-40"
      style={{ background: on ? KIT.green : "rgba(255,255,255,0.14)" }}>
      <span className="absolute top-[3px] w-3.5 h-3.5 rounded-full transition-all"
        style={{ left: on ? 19 : 3, background: on ? "#05080F" : "rgba(255,255,255,0.75)" }} />
    </button>
  );
}

export function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color = v >= 65 ? KIT.green : v >= 40 ? KIT.orange : KIT.red;
  return (
    <div className="min-w-[88px]">
      <p className="font-sans text-xs text-white/80 tabular-nums mb-1">{Math.round(v)}%</p>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}

export function IconButton({ icon: Icon, label, onClick, danger, disabled }) {
  const color = danger ? KIT.red : KIT.cyan;
  return (
    <button type="button" title={label} aria-label={label} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 hover:brightness-150"
      style={{ color, background: `${color}10`, border: `1px solid ${color}28` }}>
      <Icon size={14} />
    </button>
  );
}

export function PrimaryButton({ icon: Icon, children, onClick, disabled, busy, type = "button" }) {
  // Green fill carries dark text - CLAUDE.md: white on neon green is ~1.5:1.
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy}
      className="inline-flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
      style={{ background: KIT.green, color: "#05080F" }}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

export function SecondaryButton({ icon: Icon, children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex items-center justify-center gap-2 font-sans text-sm px-3.5 py-2 rounded-lg border border-white/12 text-white/70 hover:text-white hover:border-white/25 transition-colors disabled:opacity-50 whitespace-nowrap">
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

const selectClass = "font-sans text-sm text-white/80 pl-3 pr-8 py-2 rounded-lg outline-none appearance-none cursor-pointer border border-white/10 hover:border-white/20 transition-colors";
const selectStyle = {
  background: "rgba(255,255,255,0.03) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff80' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\") no-repeat right 10px center",
};

// ── Data table ────────────────────────────────────────────────────────────────
//
// columns: [{ key, label, render?(row, i), sort?(row) => comparable, align?, width? }]
// filters: [{ key, label, options: [{ value, label }], get?(row) }]  (value "" = all)
// defaultFilters: { [filterKey]: value } applied on first render
// rowActions(row) => [{ icon, label, onClick, danger? }]

export function DataTable({
  title, subtitle, icon: Icon, rows, columns, loading,
  searchKeys = [], searchPlaceholder = "Search...", filters = [],
  primaryAction, toolbarExtra, rowActions, onRowClick,
  pageSize = 12, emptyText = "Nothing here yet.", rowKey = (r) => r.id,
  // Filters applied on first render, e.g. { status: "pending" } so an inbox
  // opens on the work still to do. Clearable like any other filter.
  defaultFilters,
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(() => defaultFilters || {});
  const [sort, setSort] = useState(null); // { key, dir }
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = (rows || []).filter((r) => {
      if (needle && !searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle))) return false;
      return filters.every((f) => {
        const want = active[f.key];
        if (!want) return true;
        const got = f.get ? f.get(r) : r[f.key];
        return String(got ?? "") === want;
      });
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sort || ((r) => r[sort.key]);
      out = [...out].sort((a, b) => {
        const x = val(a), y = val(b);
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, q, active, sort, columns, filters, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const filtering = q.trim() || Object.values(active).some(Boolean);

  const toggleSort = (key) => setSort((s) => (s?.key !== key ? { key, dir: "desc" } : s.dir === "desc" ? { key, dir: "asc" } : null));

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      {/* Header: title on the left, primary action on the right. Search and
          filters get their own row below - sharing one row squeezed the title
          into a single-word column as soon as the filters wrapped. */}
      <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-wrap items-start gap-3">
        <div className="flex items-start gap-3 min-w-[220px] flex-1">
          {Icon && <Icon size={20} className="flex-shrink-0 mt-0.5" style={{ color: KIT.orange }} />}
          <div className="min-w-0">
            <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
            {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {primaryAction && (
          <div className="flex-shrink-0">
            <PrimaryButton icon={primaryAction.icon} onClick={primaryAction.onClick}>{primaryAction.label}</PrimaryButton>
          </div>
        )}
      </div>
      {(searchKeys.length > 0 || filters.length > 0 || toolbarExtra) && (
        <div className="px-4 sm:px-5 pb-4 border-b flex flex-wrap items-center gap-2" style={{ borderColor: KIT.line }}>
          {searchKeys.length > 0 && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={searchPlaceholder}
                className="font-sans text-sm text-white/85 pl-9 pr-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 w-full placeholder:text-white/30"
                style={{ background: "rgba(255,255,255,0.03)" }} />
            </div>
          )}
          {filters.map((f) => (
            <select key={f.key} value={active[f.key] || ""} aria-label={f.label}
              onChange={(e) => { setActive((a) => ({ ...a, [f.key]: e.target.value })); setPage(0); }}
              className={selectClass} style={selectStyle}>
              <option value="" style={{ background: "#0b0f17" }}>{f.label}</option>
              {f.options.map((o) => <option key={o.value} value={o.value} style={{ background: "#0b0f17" }}>{o.label}</option>)}
            </select>
          ))}
          {filtering && (
            <button onClick={() => { setQ(""); setActive({}); setPage(0); }}
              className="inline-flex items-center gap-1.5 font-sans text-xs text-white/50 hover:text-white px-2 py-2">
              <Filter size={12} /> Clear
            </button>
          )}
          {toolbarExtra}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b" style={{ borderColor: KIT.line }}>
              <th className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left px-4 sm:px-5 py-2.5 w-10">#</th>
              {columns.map((c) => {
                const sorted = sort?.key === c.key;
                const sortable = c.sortable !== false;
                return (
                  <th key={c.key} style={{ width: c.width }}
                    className={`font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 px-3 py-2.5 ${c.align === "right" ? "text-right" : "text-left"}`}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-white/70 uppercase tracking-wider">
                        {c.label}
                        {sorted && (sort.dir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
              {rowActions && <th className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-right px-4 sm:px-5 py-2.5">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk${i}`} className="border-b" style={{ borderColor: KIT.line }}>
                <td colSpan={columns.length + 2} className="px-5 py-4"><div className="h-4 rounded bg-white/5 animate-pulse" /></td>
              </tr>
            ))}
            {!loading && visible.map((r, i) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={`border-b last:border-b-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-white/[0.025]" : ""}`}
                style={{ borderColor: KIT.line }}>
                <td className="font-sans text-sm text-white/40 px-4 sm:px-5 py-3 tabular-nums align-middle">{safePage * pageSize + i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-3 align-middle ${c.align === "right" ? "text-right" : ""}`}>
                    {c.render ? c.render(r, i) : <span className="font-sans text-sm text-white/75">{fmt(r[c.key])}</span>}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 sm:px-5 py-3 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      {rowActions(r).filter(Boolean).map((a) => <IconButton key={a.label} {...a} />)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="px-5 py-12 text-center font-sans text-sm text-white/35">
                {filtering ? "No rows match these filters." : emptyText}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-t flex items-center justify-between gap-3" style={{ borderColor: KIT.line }}>
          <p className="font-sans text-xs text-white/40 tabular-nums">
            {safePage * pageSize + 1}-{Math.min(filtered.length, (safePage + 1) * pageSize)} of {fmt(filtered.length)}
            {filtering && rows ? ` (filtered from ${fmt(rows.length)})` : ""}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(safePage - 1)} disabled={safePage === 0} aria-label="Previous page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={15} /></button>
              <span className="font-sans text-xs text-white/50 tabular-nums px-1">{safePage + 1} / {pages}</span>
              <button onClick={() => setPage(safePage + 1)} disabled={safePage >= pages - 1} aria-label="Next page"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/5 disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────
//
// Right-hand panel for create/edit forms, so a table never has a form wedged
// underneath it. Esc or the scrim closes it.

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 720 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/60" onClick={onClose} />
          <motion.aside key="panel" role="dialog" aria-modal="true" aria-label={title}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.2 }}
            className="fixed inset-y-0 right-0 z-[86] w-full flex flex-col border-l"
            style={{ maxWidth: width, background: "#0a0e16", borderColor: KIT.line }}>
            <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b flex-shrink-0" style={{ borderColor: KIT.line }}>
              <div className="min-w-0 flex-1">
                <h2 className="font-sans text-lg font-semibold text-white truncate">{title}</h2>
                {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
            {footer && <div className="px-5 sm:px-6 py-3.5 border-t flex items-center justify-end gap-2 flex-shrink-0" style={{ borderColor: KIT.line }}>{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// A titled block inside a drawer, for editors with several independent parts.
export function DrawerSection({ title, hint, children }) {
  return (
    <section className="rounded-xl border p-4 space-y-3 mb-4" style={{ borderColor: KIT.line, background: "rgba(255,255,255,0.015)" }}>
      <div>
        <h3 className="font-sans text-sm font-semibold text-white/90">{title}</h3>
        {hint && <p className="font-sans text-xs text-white/40 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
