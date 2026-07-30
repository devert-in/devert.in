"use client";

export const EDITOR_TABS = [
  { key: "identity",       label: "Identity" },
  { key: "analytics",      label: "Analytics" },
  { key: "skills",         label: "Tech Stack" },
  { key: "experience",     label: "Experience" },
  { key: "education",      label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements",   label: "Achievements" },
  { key: "appearance",     label: "Appearance" },
];

export function EditorTabs({ active, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
      {EDITOR_TABS.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="flex-shrink-0 font-mono text-[10px] tracking-wide px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
          style={active === t.key
            ? { color: "#00FFFF", background: "rgba(0,255,255,0.1)", border: "1px solid rgba(0,255,255,0.3)" }
            : { color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
