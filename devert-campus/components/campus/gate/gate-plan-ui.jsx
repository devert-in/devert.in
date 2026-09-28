"use client";

import { ExternalLink, Search, PlayCircle, FileQuestion } from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip } from "@/components/campus/campus-ui";
import { accuracyBand, PAPER_LABEL, DAY_TYPE_LABEL } from "@/lib/gatePlan";

// Shared pieces for the GATE 2027 Plan screens (gate-plan*.jsx). Kept in their
// own file so the landing, member workspace and day view can all import them
// without importing each other.

export const PAPER_COLOR = { BOTH: CAMPUS.teal, CS: CAMPUS.blue, DA: CAMPUS.purple };
export const TYPE_COLOR = { setup: CAMPUS.cyan, topic: CAMPUS.inkSoft, sunday: CAMPUS.gold, lockin: CAMPUS.orange };
export const BAND_COLOR = { good: CAMPUS.good, warn: CAMPUS.warn, bad: CAMPUS.bad, none: CAMPUS.inkFaint };
export const STATUS_COLOR = {
  done: CAMPUS.good, "in-progress": CAMPUS.cyan, missed: CAMPUS.bad, moved: CAMPUS.warn, "not-started": CAMPUS.inkFaint,
};

export const bandColor = (pct) => BAND_COLOR[accuracyBand(pct)];
export const fmtPct = (pct) => (pct == null ? "-" : `${pct}%`);

export function PaperChip({ paper }) {
  if (!paper) return null;
  return <CampusChip color={PAPER_COLOR[paper] || CAMPUS.inkFaint}>{PAPER_LABEL[paper] || paper}</CampusChip>;
}

export function TypeChip({ type }) {
  if (!type || type === "topic") return null;
  return <CampusChip color={TYPE_COLOR[type]}>{DAY_TYPE_LABEL[type]}</CampusChip>;
}

// Small mono kicker above a card's title - the Campus equivalent of the
// terminal-header strip, without the terminal chrome (CLAUDE.md: no
// terminal-window chrome on Campus).
export function Kicker({ icon: Icon, children, color = CAMPUS.inkFaint }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon size={12} style={{ color }} />}
      <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{children}</span>
    </div>
  );
}

export function Panel({ title, icon, action, children, className = "", color }) {
  return (
    <CampusCard className={`p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-1">
          {title ? <Kicker icon={icon} color={color || CAMPUS.teal}>{title}</Kicker> : <span />}
          {action}
        </div>
      )}
      {children}
    </CampusCard>
  );
}

// An outbound resource link, labelled for what it REALLY is. The workbook's
// lecture links are YouTube searches and its PYQ links are site searches (the
// extractor records `kind` from the URL) - so this says "Search YouTube" and
// "Search GATE Overflow", never "Watch lecture" or "Solve PYQs". See
// scripts/extract-gate-plan.mjs, note 3.
const KIND_META = {
  "youtube-search": { icon: PlayCircle, verb: "Search YouTube", color: CAMPUS.bad },
  "gateoverflow-search": { icon: FileQuestion, verb: "Search GATE Overflow", color: CAMPUS.teal },
  "google-search": { icon: Search, verb: "Google search", color: CAMPUS.blue },
  link: { icon: ExternalLink, verb: "Open", color: CAMPUS.cyan },
};

export function PlanLink({ link, label, compact = false }) {
  if (!link?.url) return null;
  const meta = KIND_META[link.kind] || KIND_META.link;
  const Icon = meta.icon;
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer"
      className={`group flex items-start gap-2.5 rounded-xl transition-colors ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}
      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}
      title={`${meta.verb} - opens in a new tab`}>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-[1px]"
        style={{ background: tint(meta.color, 14), color: meta.color }}>
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-mono tracking-wider" style={{ color: CAMPUS.inkFaint }}>
          {(label || meta.verb).toUpperCase()}{link.source ? ` · ${link.source}` : ""}
        </span>
        <span className="block text-[12.5px] leading-snug mt-0.5" style={{ color: CAMPUS.ink }}>{link.label}</span>
      </span>
      <ExternalLink size={12} className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-80" style={{ color: CAMPUS.inkSoft }} />
    </a>
  );
}

// Accuracy with the workbook's own colour bands (>= 75 green, 60-75 amber,
// < 60 red), plus the raw count so a 100% on 1 question never reads like a
// 100% on 40.
export function AccuracyFigure({ label, correct, attempted, pct: p }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      <span className="block text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</span>
      <span className="block font-mono text-lg font-bold leading-tight mt-0.5" style={{ color: bandColor(p) }}>{fmtPct(p)}</span>
      <span className="block text-[10.5px] tabular-nums" style={{ color: CAMPUS.inkFaint }}>{attempted ? `${correct} / ${attempted}` : "not logged"}</span>
    </div>
  );
}

export function BulletList({ items, color = CAMPUS.teal }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]" style={{ background: color }} />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}
