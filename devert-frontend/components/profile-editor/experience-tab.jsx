"use client";

import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { Field, TextAreaField, SectionHeader } from "./editor-fields";
import { ACCENT_OPTIONS } from "@/lib/portfolio-sections";

const TYPES = ["Internship", "Full-time", "Part-time", "Freelance", "Contract"];
const blank = { role: "", company: "", location: "", type: "Internship", startDate: "", endDate: "", current: false, description: "", points: "", tech: "", color: ACCENT_OPTIONS[0].value };

export default function ExperienceTab({ experience, onChange }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);

  const add = () => {
    if (!form.role.trim() || !form.company.trim()) return;
    onChange([...experience, {
      id: `exp_${Date.now()}`,
      role: form.role.trim(), company: form.company.trim(), location: form.location.trim(),
      type: form.type, startDate: form.startDate, endDate: form.current ? null : form.endDate, current: form.current,
      description: form.description.trim(),
      points: form.points.split("\n").map(s => s.trim()).filter(Boolean),
      tech: form.tech.split(",").map(s => s.trim()).filter(Boolean),
      color: form.color,
    }]);
    setForm(blank); setAdding(false);
  };
  const remove = (id) => onChange(experience.filter(e => e.id !== id));

  return (
    <div>
      <SectionHeader title="experience" />
      <div className="space-y-2 mb-4">
        {experience.length === 0 && <p className="font-mono text-[10px] text-white/20">// no experience yet - add your first role below</p>}
        {experience.map(e => (
          <div key={e.id} className="flex items-start gap-3 px-3 py-2.5 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-white/75 font-semibold">{e.role} <span className="text-white/30">@ {e.company}</span></p>
              <p className="font-mono text-[10px] text-white/28 mt-0.5">{e.type} · {e.startDate} – {e.current ? "Present" : e.endDate}</p>
            </div>
            <button onClick={() => remove(e.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-3 p-4 rounded" style={{ background: "rgba(0,255,65,0.03)", border: "1px solid rgba(0,255,65,0.1)" }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ROLE" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} placeholder="ML Intern" maxLength={60} />
            <Field label="COMPANY" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} placeholder="SWECHA" maxLength={60} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="LOCATION" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="Remote" maxLength={40} />
            <Field label="START (YYYY-MM)" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} placeholder="2024-06" maxLength={7} />
            <Field label="END (YYYY-MM)" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} placeholder="2024-12" maxLength={7} />
          </div>
          <label className="flex items-center gap-2 font-mono text-[11px] text-white/45">
            <input type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked }))} /> currently working here
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className="font-mono text-[10px] px-2.5 py-1 rounded-full"
                style={form.type === t ? { color: "#00FF41", background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)" } : { color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {t}
              </button>
            ))}
          </div>
          <TextAreaField label="DESCRIPTION" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="One-liner about the role" maxLength={200} />
          <TextAreaField label="HIGHLIGHTS (one per line)" value={form.points} onChange={v => setForm(f => ({ ...f, points: v }))} placeholder={"Built X\nShipped Y"} rows={3} />
          <Field label="TECH (comma-separated)" value={form.tech} onChange={v => setForm(f => ({ ...f, tech: v }))} placeholder="Python, NLP, Git" maxLength={150} />
          <div className="flex gap-1.5">
            {ACCENT_OPTIONS.map(a => (
              <button key={a.value} type="button" onClick={() => setForm(f => ({ ...f, color: a.value }))}
                className="w-6 h-6 rounded-full" style={{ background: a.value, outline: form.color === a.value ? "2px solid white" : "none", outlineOffset: 2 }} title={a.name} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors"><Check size={11} /> add experience</button>
            <button onClick={() => { setAdding(false); setForm(blank); }} className="font-mono text-xs text-white/25 border border-white/8 px-3 py-2 rounded hover:bg-white/4 transition-colors">cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 font-mono text-xs text-neon-cyan/60 border border-neon-cyan/15 px-3 py-2 rounded hover:bg-neon-cyan/5 transition-colors">
          <Plus size={11} /> add experience
        </button>
      )}
    </div>
  );
}
