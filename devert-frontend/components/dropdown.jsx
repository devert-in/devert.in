"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// Native <select> popups render with the OS/browser default theme in enough contexts
// (mobile Chrome, DevTools device emulation, Safari) that a `select option { ... }`
// CSS rule isn't reliable - this renders the closed box and open list ourselves so the
// dropdown always matches the app's palette everywhere.
//
// The popup's colors are CSS vars with Builder's OS's dark defaults baked in as
// fallbacks (var(--x, fallback)) - every existing dark-theme call site is
// unaffected since those vars are simply undefined there. Campus
// (app/globals.css's .campus-theme block) defines --dropdown-* to its own
// light/dark tokens, so the SAME component adapts automatically wherever it's
// nested, with no theme prop to thread through.
//
// buttonClassName should carry everything the old <select> className did (font, text
// size, color, padding, rounded) - only pass className on the wrapper for layout
// (e.g. "w-full"), since the wrapper is a bare relative div otherwise (sizes to content
// like the native <select> did when used inline).
export default function Dropdown({ value, options, onChange, className = "", buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const normalized = options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = normalized.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 outline-none transition-colors hover:text-[var(--dropdown-hover-text,rgba(255,255,255,0.9))] ${buttonClassName}`}>
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown size={12} className={`flex-shrink-0 text-[var(--dropdown-chevron,rgba(255,255,255,0.4))] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-lg py-1"
          style={{
            background: "var(--dropdown-surface, #0a0a0a)",
            border: "1px solid var(--dropdown-border, rgba(255,255,255,0.1))",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}>
          {normalized.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left font-mono text-xs px-3 py-2 transition-colors whitespace-nowrap"
              style={{
                color: o.value === value ? "var(--dropdown-accent, #00FFFF)" : "var(--dropdown-text, rgba(255,255,255,0.75))",
                background: o.value === value ? "var(--dropdown-accent-tint, rgba(0,255,255,0.08))" : "transparent",
              }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "var(--dropdown-hover, rgba(255,255,255,0.06))"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
