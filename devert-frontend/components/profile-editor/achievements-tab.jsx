"use client";

import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { Field, TextAreaField, SectionHeader } from "./editor-fields";
import { ACCENT_OPTIONS } from "@/lib/portfolio-sections";

const blank = { title: "", org: "", date: "", description: "", color: ACCENT_OPTIONS[5].value };

export default function AchievementsTab({ achievements, onChange }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);

  const add = () => {
    if (!form.title.trim()) return;
    onChange([...achievements, { id: `ach_${Date.now()}`, ...form, title: form.title.trim(), org: form.org.trim(), description: form.description.trim() }]);
    setForm(blank); setAdding(false);
  };
  const remove = (id) => onChange(achievements.filter(a => a.id !== id));

  return (
    <div>
      <SectionHeader title="achievements" />
      <div className="space-y-2 mb-4">
        {achievements.length === 0 && <p className="font-mono text-[10px] text-white/20">// no achievements yet - add one below</p>}
        {achievements.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-white/75 font-semibold">{a.title}</p>
              <p className="font-mono text-[10px] text-white/28">{a.org}{a.date ? ` · ${a.date}` : ""}</p>
            </div>
            <button onClick={() => remove(a.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-3 p-4 rounded" style={{ background: "rgba(0,255,65,0.03)", border: "1px solid rgba(0,255,65,0.1)" }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="TITLE" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="1st Place - DevCon Hackathon" maxLength={80} />
            <Field label="ORGANIZATION" value={form.org} onChange={v => setForm(f => ({ ...f, org: v }))} placeholder="DevCon" maxLength={60} />
          </div>
          <Field label="DATE" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} placeholder="2025" maxLength={20} />
          <TextAreaField label="DESCRIPTION" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="One-liner about the win" maxLength={200} />
          <div className="flex gap-1.5">
            {ACCENT_OPTIONS.map(c => (
              <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, color: c.value }))}
                className="w-6 h-6 rounded-full" style={{ background: c.value, outline: form.color === c.value ? "2px solid white" : "none", outlineOffset: 2 }} title={c.name} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors"><Check size={11} /> add achievement</button>
            <button onClick={() => { setAdding(false); setForm(blank); }} className="font-mono text-xs text-white/25 border border-white/8 px-3 py-2 rounded hover:bg-white/4 transition-colors">cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 font-mono text-xs text-neon-cyan/60 border border-neon-cyan/15 px-3 py-2 rounded hover:bg-neon-cyan/5 transition-colors">
          <Plus size={11} /> add achievement
        </button>
      )}
    </div>
  );
}
