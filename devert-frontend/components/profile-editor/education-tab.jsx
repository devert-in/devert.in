"use client";

import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { Field, TextAreaField, SectionHeader } from "./editor-fields";

const blank = { institution: "", degree: "", field: "", startDate: "", endDate: "", current: false, grade: "", description: "" };

export default function EducationTab({ education, onChange }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);

  const add = () => {
    if (!form.institution.trim() || !form.degree.trim()) return;
    onChange([...education, {
      id: `edu_${Date.now()}`,
      institution: form.institution.trim(), degree: form.degree.trim(), field: form.field.trim(),
      startDate: form.startDate, endDate: form.current ? null : form.endDate, current: form.current,
      grade: form.grade.trim(), description: form.description.trim(),
    }]);
    setForm(blank); setAdding(false);
  };
  const remove = (id) => onChange(education.filter(e => e.id !== id));

  return (
    <div>
      <SectionHeader title="education" />
      <div className="space-y-2 mb-4">
        {education.length === 0 && <p className="font-mono text-[10px] text-white/20">// no education yet - add it below</p>}
        {education.map(e => (
          <div key={e.id} className="flex items-start gap-3 px-3 py-2.5 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-white/75 font-semibold">{e.degree}{e.field ? ` in ${e.field}` : ""}</p>
              <p className="font-mono text-[10px] text-white/28 mt-0.5">{e.institution} · {e.startDate} - {e.current ? "Present" : e.endDate}</p>
            </div>
            <button onClick={() => remove(e.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-3 p-4 rounded" style={{ background: "rgba(0,255,65,0.03)", border: "1px solid rgba(0,255,65,0.1)" }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="INSTITUTION" value={form.institution} onChange={v => setForm(f => ({ ...f, institution: v }))} placeholder="XYZ University" maxLength={80} />
            <Field label="DEGREE" value={form.degree} onChange={v => setForm(f => ({ ...f, degree: v }))} placeholder="B.Tech" maxLength={60} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="FIELD" value={form.field} onChange={v => setForm(f => ({ ...f, field: v }))} placeholder="AI & ML" maxLength={60} />
            <Field label="START (YYYY-MM)" value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} placeholder="2022-08" maxLength={7} />
            <Field label="END (YYYY-MM)" value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} placeholder="2026-05" maxLength={7} />
          </div>
          <label className="flex items-center gap-2 font-mono text-[11px] text-white/45">
            <input type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked }))} /> currently enrolled
          </label>
          <Field label="GRADE (optional)" value={form.grade} onChange={v => setForm(f => ({ ...f, grade: v }))} placeholder="8.7 CGPA" maxLength={30} />
          <TextAreaField label="RELEVANT COURSEWORK / NOTES" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Data Structures, ML, Distributed Systems" maxLength={200} />
          <div className="flex gap-2">
            <button onClick={add} className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors"><Check size={11} /> add education</button>
            <button onClick={() => { setAdding(false); setForm(blank); }} className="font-mono text-xs text-white/25 border border-white/8 px-3 py-2 rounded hover:bg-white/4 transition-colors">cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 font-mono text-xs text-neon-cyan/60 border border-neon-cyan/15 px-3 py-2 rounded hover:bg-neon-cyan/5 transition-colors">
          <Plus size={11} /> add education
        </button>
      )}
    </div>
  );
}
