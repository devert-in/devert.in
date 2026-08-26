"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

// Shared low-level form/panel primitives, used by both app/admin/page.jsx and
// /manage/page.jsx (the Global Super Admin control center) - kept here so the
// two surfaces share one visual language instead of drifting apart.

export function Input({ label, value, onChange, placeholder, maxLength, hint, type = "text" }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      {hint && <p className="font-mono text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3, maxLength }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows} maxLength={maxLength}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

export function Section({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="terminal-window mb-6">
      <button onClick={() => setOpen(o => !o)}
        className="terminal-header w-full flex items-center gap-2 hover:bg-white/2 transition-colors"
      >
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <Icon size={11} className="ml-2" style={{ color }} />
        <span className="font-mono text-xs ml-1" style={{ color }}>{title}</span>
        <span className="ml-auto mr-1">{open ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
