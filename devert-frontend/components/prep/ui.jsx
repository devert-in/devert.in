"use client";

// Shared Devert-styled primitives for the Placements Prep module.
// Every prep page composes these so the module stays visually identical
// to the rest of the site (terminal chrome, mono bracket buttons, neon accents).

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  X,
  Loader2,
  Clock,
  Inbox,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ────────────────────────────── PrepShell ────────────────────────────── */

export function PrepShell({
  kicker,
  title,
  accent,
  subtitle,
  actions,
  maxWidth = "max-w-6xl",
  className,
  children,
}) {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className={cn("relative mx-auto", maxWidth, className)}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          {kicker && (
            <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">{kicker}</p>
          )}
          {(title || accent) && (
            <h1
              className="font-sans font-bold tracking-tighter text-white leading-none mb-3"
              style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}
            >
              {title}
              {accent && <> <span className="text-neon-cyan">{accent}</span></>}
            </h1>
          )}
          {(subtitle || actions) && (
            <div className="flex items-center gap-6 flex-wrap">
              {subtitle && <p className="font-mono text-sm text-white/35">{subtitle}</p>}
              {actions}
            </div>
          )}
        </motion.div>
        {children}
      </div>
    </main>
  );
}

/* ───────────────────────────── TerminalCard ──────────────────────────── */

export function TerminalCard({
  filename,
  icon: Icon = Terminal,
  headerRight,
  delay = 0,
  animate = true,
  hover = false,
  className,
  bodyClassName = "p-5",
  children,
}) {
  const Wrapper = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, type: "spring", stiffness: 200, damping: 22 },
        whileHover: hover ? { y: -4 } : undefined,
      }
    : {};
  return (
    <Wrapper {...motionProps} className={cn("terminal-window", className)}>
      <div className="terminal-header">
        {Icon && <Icon size={10} className="ml-2 text-white/25 flex-shrink-0" />}
        {filename && (
          <span className="font-mono text-[10px] text-white/25 ml-1 truncate">{filename}</span>
        )}
        {headerRight && <div className="ml-auto flex items-center gap-2">{headerRight}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </Wrapper>
  );
}

/* ──────────────────────────── BracketButton ──────────────────────────── */

const BUTTON_VARIANTS = {
  cyan: { base: "text-neon-cyan border-neon-cyan/30", hover: "hover:bg-neon-cyan/10" },
  green: { base: "text-neon-green border-neon-green/30", hover: "hover:bg-neon-green/10" },
  red: { base: "text-[#FF3B3B] border-[#FF3B3B]/30", hover: "hover:bg-[#FF3B3B]/10" },
  gold: { base: "text-[#FFD700] border-[#FFD700]/30", hover: "hover:bg-[#FFD700]/10" },
  ghost: { base: "text-white/45 border-white/10", hover: "hover:text-white/70 hover:bg-white/5" },
};

const BUTTON_SIZES = {
  sm: "text-[11px] px-3 py-1.5",
  md: "text-xs px-4 py-2",
  lg: "text-sm px-5 py-2.5",
};

export function BracketButton({
  children,
  onClick,
  href,
  variant = "cyan",
  size = "md",
  disabled = false,
  loading = false,
  loadingText,
  type = "button",
  className,
  title,
  "aria-label": ariaLabel,
}) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.cyan;
  const s = BUTTON_SIZES[size] || BUTTON_SIZES.md;
  const isDisabled = disabled || loading;
  const cls = cn(
    "font-mono inline-flex items-center justify-center gap-2 border rounded-none transition-colors select-none whitespace-nowrap",
    s,
    v.base,
    isDisabled ? "opacity-40 cursor-not-allowed" : cn("cursor-pointer", v.hover),
    className
  );
  const content = (
    <>
      {loading && <Loader2 size={12} className="animate-spin flex-shrink-0" />}
      <span>[ {loading && loadingText ? loadingText : children} ]</span>
    </>
  );

  if (href && !isDisabled) {
    return (
      <Link href={href} onClick={onClick} title={title} aria-label={ariaLabel} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-label={ariaLabel}
      className={cls}
    >
      {content}
    </motion.button>
  );
}

/* ────────────────────────────── NeonBadge ────────────────────────────── */

export function NeonBadge({ children, color = "#00FFFF", className }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] px-1.5 py-0.5 rounded tracking-wider inline-flex items-center gap-1 whitespace-nowrap",
        className
      )}
      // 8-digit hex: color + alpha
      style={{ color, background: `${color}14`, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────── StatTile ────────────────────────────── */

export function StatTile({ label, value, sub, icon: Icon, color = "#00FFFF", delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 22 }}
      className={cn("terminal-window p-4", className)}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-mono text-[10px] tracking-wider text-white/30 uppercase">{label}</p>
        {Icon && <Icon size={13} style={{ color }} />}
      </div>
      <p className="font-sans text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="font-mono text-[10px] text-white/35 mt-1.5">{sub}</p>}
    </motion.div>
  );
}

/* ────────────────────────────── PrepModal ────────────────────────────── */

export function PrepModal({ open, onClose, title, filename, maxWidth = "max-w-lg", footer, children }) {
  const panelRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = document.activeElement;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey, true);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", handleKey, true);
      document.body.style.overflow = "";
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onCloseRef.current?.()}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn("relative terminal-window w-full outline-none", maxWidth)}
            style={{ background: "rgba(8,8,8,0.98)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
          >
            <div className="terminal-header">
              <span className="font-mono text-[10px] text-white/25 ml-2 truncate">
                {filename || "modal.sh"}
              </span>
              <button
                type="button"
                onClick={() => onCloseRef.current?.()}
                aria-label="Close dialog"
                className="ml-auto text-white/30 hover:text-white/80 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {title && (
                <h2 className="font-sans text-lg font-bold text-white mb-4 leading-snug">{title}</h2>
              )}
              {children}
            </div>
            {footer && (
              <div className="px-5 py-4 border-t border-white/8 flex items-center justify-end gap-3 flex-wrap">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────── DataTable ────────────────────────────── */

// columns: [{ key, label, sortable?, align?, width?, className?, render?(row), sortValue?(row) }]
export function DataTable({
  columns = [],
  rows = [],
  rowKey,
  onRowClick,
  initialSort = null,
  empty,
  dense = false,
  className,
}) {
  const [sort, setSort] = useState(initialSort);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (row) => (col.sortValue ? col.sortValue(row) : row[col.key]);
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = useCallback((key) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }, []);

  if (!rows.length) {
    return empty ?? <EmptyState title="no rows" message="Nothing to show here yet." />;
  }

  const cellPad = dense ? "px-3 py-2" : "px-3 py-2.5";
  const alignCls = (a) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full font-mono text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/8">
            {columns.map((col) => {
              const sortable = col.sortable !== false;
              const active = sort?.key === col.key;
              const SortIcon = !active ? ChevronsUpDown : sort.dir === "asc" ? ChevronUp : ChevronDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  className={cn(
                    "font-mono text-[10px] tracking-wider text-white/30 uppercase font-normal",
                    cellPad,
                    alignCls(col.align),
                    col.className
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider",
                        active ? "text-neon-cyan" : "hover:text-white/60"
                      )}
                    >
                      {col.label}
                      <SortIcon size={10} className={active ? "text-neon-cyan" : "text-white/20"} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const key = typeof rowKey === "function" ? rowKey(row) : rowKey ? row[rowKey] : i;
            const clickable = typeof onRowClick === "function";
            return (
              <tr
                key={key}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                className={cn(
                  "border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]",
                  clickable && "cursor-pointer focus:bg-white/[0.05] focus:outline-none"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("text-white/60", cellPad, alignCls(col.align), col.className)}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────── EmptyState ───────────────────────────── */

export function EmptyState({ icon: Icon = Inbox, title = "nothing here", message, action, className }) {
  return (
    <div
      className={cn(
        "border border-dashed border-white/10 rounded-lg py-14 px-6 flex flex-col items-center justify-center text-center gap-3",
        className
      )}
    >
      <Icon size={22} className="text-white/20" />
      <p className="font-mono text-xs text-white/40 tracking-wider">{title}</p>
      {message && <p className="font-mono text-[11px] text-white/25 max-w-sm leading-relaxed">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ────────────────────────────── LoadingRows ──────────────────────────── */

export function LoadingRows({ rows = 5, className }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 rounded border border-white/5 bg-white/[0.03] animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* ───────────────────────────────── Tag ───────────────────────────────── */

export function Tag({ children, color, className }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 whitespace-nowrap",
        !color && "text-white/25 border-white/8",
        className
      )}
      style={color ? { color, borderColor: `${color}40` } : undefined}
    >
      {children}
    </span>
  );
}

/* ────────────────────────────── ProgressBar ──────────────────────────── */

export function ProgressBar({ value = 0, color = "#00FF41", label, height = 6, className }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1 font-mono text-[10px] text-white/35">
          <span className="tracking-wider">{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "rgba(255,255,255,0.06)" }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : undefined}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────── Countdown ───────────────────────────── */

const pad2 = (n) => String(n).padStart(2, "0");

// target: epoch milliseconds. onExpire fires exactly once when it hits zero.
export function Countdown({ target, onExpire, prefix, warnUnderMs = 60000, showIcon = true, className }) {
  const onExpireRef = useRef(onExpire);
  useLayoutEffect(() => {
    onExpireRef.current = onExpire;
  });
  const [remaining, setRemaining] = useState(() =>
    typeof target === "number" ? Math.max(0, target - Date.now()) : null
  );

  useEffect(() => {
    if (typeof target !== "number") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the countdown when target is removed
      setRemaining(null);
      return undefined;
    }
    let expired = target - Date.now() <= 0;
    const tick = () => {
      const rem = Math.max(0, target - Date.now());
      setRemaining(rem);
      if (rem <= 0 && !expired) {
        expired = true;
        clearInterval(iv);
        onExpireRef.current?.();
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [target]);

  let text = "--:--";
  let color = "#00FFFF";
  if (remaining != null) {
    const total = Math.floor(remaining / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    text =
      d > 0
        ? `${d}d ${pad2(h)}:${pad2(m)}:${pad2(s)}`
        : h > 0
          ? `${pad2(h)}:${pad2(m)}:${pad2(s)}`
          : `${pad2(m)}:${pad2(s)}`;
    if (remaining <= warnUnderMs) color = "#FF3B3B";
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm tabular-nums", className)}>
      {showIcon && <Clock size={12} style={{ color, opacity: 0.7 }} />}
      {prefix && <span className="text-white/30 text-[10px]">{prefix}</span>}
      <span style={{ color }} className={remaining != null && remaining <= warnUnderMs ? "cursor-blink" : undefined}>
        {text}
      </span>
    </span>
  );
}

/* ───────────────────────────── MarkdownBlock ─────────────────────────── */

function makeMdComponents(inherit) {
  const bodyText = inherit
    ? "font-mono text-[13px] leading-relaxed"
    : "font-mono text-[13px] leading-relaxed text-white/70";
  return {
    h1: ({ node, ...props }) => (
      <h1 className="font-sans text-2xl font-bold text-white mt-6 mb-3 first:mt-0" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="font-sans text-xl font-bold text-white mt-5 mb-2.5 first:mt-0" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="font-sans text-lg font-semibold text-white mt-4 mb-2 first:mt-0" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="font-sans text-base font-semibold text-white/90 mt-4 mb-2 first:mt-0" {...props} />
    ),
    p: ({ node, ...props }) => <p className={cn(bodyText, "mb-3 last:mb-0")} {...props} />,
    ul: ({ node, ...props }) => (
      <ul className={cn(bodyText, "list-disc pl-5 space-y-1.5 mb-3 last:mb-0")} {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className={cn(bodyText, "list-decimal pl-5 space-y-1.5 mb-3 last:mb-0")} {...props} />
    ),
    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
    a: ({ node, ...props }) => (
      <a
        className="text-neon-cyan underline underline-offset-2 hover:text-white transition-colors"
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    ),
    strong: ({ node, ...props }) => (
      <strong className={inherit ? "font-semibold" : "text-white font-semibold"} {...props} />
    ),
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-2 border-neon-cyan/40 pl-4 my-3 text-white/50 italic"
        {...props}
      />
    ),
    hr: ({ node, ...props }) => <hr className="border-white/10 my-5" {...props} />,
    code: ({ node, ...props }) => (
      <code
        className="font-mono text-neon-green bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[0.85em]"
        {...props}
      />
    ),
    pre: ({ node, ...props }) => (
      <pre
        className="bg-black/60 border border-white/10 rounded-lg p-4 my-3 overflow-x-auto text-xs leading-relaxed text-neon-green [&_code]:bg-transparent [&_code]:border-0 [&_code]:p-0 [&_code]:text-neon-green [&_code]:text-xs"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-3">
        <table className="w-full font-mono text-xs border-collapse" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="border border-white/10 px-3 py-2 text-left text-white/60 bg-white/[0.03] font-normal tracking-wider text-[10px] uppercase"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td className="border border-white/10 px-3 py-2 text-white/70" {...props} />
    ),
  };
}

const MD_COMPONENTS = makeMdComponents(false);
const MD_COMPONENTS_INHERIT = makeMdComponents(true);

// inheritColor: body text inherits the parent color (used inside stateful
// surfaces like selected MCQ options) instead of the default white/70.
export function MarkdownBlock({ children, content, inheritColor = false, className }) {
  const source = content ?? children ?? "";
  return (
    <div className={cn("min-w-0 break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={inheritColor ? MD_COMPONENTS_INHERIT : MD_COMPONENTS}
      >
        {typeof source === "string" ? source : String(source)}
      </ReactMarkdown>
    </div>
  );
}
