"use client";

import { Check } from "lucide-react";
import { ACCENT_OPTIONS } from "@/lib/portfolio-sections";
import { SectionHeader } from "./editor-fields";

export default function ThemePicker({ accent, onChange }) {
  return (
    <div>
      <SectionHeader title="accent color" />
      <p className="font-mono text-[10px] text-white/25 mb-3">// picks the highlight color used across your portfolio&apos;s headings and links</p>
      <div className="flex gap-3 flex-wrap">
        {ACCENT_OPTIONS.map(a => (
          <button key={a.value} onClick={() => onChange(a.value)}
            className="flex flex-col items-center gap-1.5">
            <span className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: a.value, outline: accent === a.value ? "2px solid white" : "none", outlineOffset: 3 }}>
              {accent === a.value && <Check size={14} color="#0a0a0a" />}
            </span>
            <span className="font-mono text-[9px] text-white/30">{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
