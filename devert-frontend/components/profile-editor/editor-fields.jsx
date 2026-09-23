"use client";

import Dropdown from "@/components/dropdown";

// Shared small form pieces used across every editor tab - extracted from the
// old single-form app/profile/page.jsx so each tab can reuse them.

export function Field({ label, value, onChange, placeholder, maxLength, hint, type = "text", prefix }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{label}</p>
      <div className="flex items-center gap-0">
        {prefix && (
          <span className="font-mono text-xs text-white/30 px-3 py-2 rounded-l"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRight: "none" }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          className={`flex-1 font-mono text-xs text-white/80 px-3 py-2 outline-none transition-colors ${prefix ? "rounded-r" : "rounded"}`}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>
      {hint && <p className="font-mono text-[9px] text-white/18 mt-1">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, maxLength, rows = 2 }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} rows={rows}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
      {maxLength && <p className="font-mono text-[9px] text-white/18 mt-0.5">{value.length}/{maxLength}</p>}
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{label}</p>
      <Dropdown value={value} onChange={onChange}
        options={[{ value: "", label: "- not set -" }, ...options]}
        className="w-full"
        buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
        />
    </div>
  );
}

export function DotPicker({ level, onChange, color = "#00FF41", size = "md" }) {
  const sz = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <div className="flex gap-1 items-center">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5 hover:scale-125 transition-transform">
          <div className={`${sz} rounded-full transition-colors`}
            style={{ background: i <= level ? color : "rgba(255,255,255,0.1)" }} />
        </button>
      ))}
    </div>
  );
}

export function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-[9px] tracking-widest text-neon-green/60">// {title}</span>
      <span className="flex-1 h-px bg-white/5" />
    </div>
  );
}
