"use client";

import { ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { SECTION_META } from "@/lib/portfolio-sections";
import { SectionHeader } from "./editor-fields";

// Simple up/down reorder + visibility toggle - no drag-and-drop library,
// this list is short (9 items) and reordered rarely.
export default function SectionOrderEditor({ order, hidden, onChange }) {
  const move = (i, dir) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ order: next, hidden });
  };

  const toggleHidden = (key) => {
    const next = hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key];
    onChange({ order, hidden: next });
  };

  return (
    <div>
      <SectionHeader title="section order & visibility" />
      <p className="font-mono text-[10px] text-white/25 mb-3">// controls the order sections appear in on your public portfolio, and lets you hide ones you&apos;re not ready to show</p>
      <div className="space-y-1.5">
        {order.map((key, i) => {
          const meta = SECTION_META[key];
          if (!meta) return null;
          const isHidden = hidden.includes(key);
          const Icon = meta.icon;
          return (
            <div key={key} className="flex items-center gap-3 px-3 py-2 rounded"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", opacity: isHidden ? 0.4 : 1 }}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="text-white/25 hover:text-white/60 disabled:opacity-20 transition-colors"><ChevronDown size={12} /></button>
              </div>
              <Icon size={13} className="text-white/35 flex-shrink-0" />
              <span className="font-mono text-xs text-white/65 flex-1">{meta.label}</span>
              <button onClick={() => toggleHidden(key)} className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0">
                {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
