"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, X as CloseIcon } from "lucide-react";
import { fetchPublishedProblems, CODELAB_LANGUAGES } from "@/lib/codelab";
import { saveItem, dowOfDate, DOW_LABELS } from "@/lib/dailyLearning";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusBackButton } from "@/components/campus/campus-ui";

// The single create/edit form for a Daily Learning day (lesson OR test -
// same shape, "test" just usually carries more mcqs/problemIds and a
// bigger reward). Editing an existing day and creating a new one open the
// exact same form, pre-filled or blank - there is deliberately no second
// "edit UI".

function blankMcq() {
  return { id: `q${Math.random().toString(36).slice(2, 8)}`, text: "", options: ["", "", "", ""], correctIndex: 0 };
}

function blankItem(date) {
  return {
    date, dow: dowOfDate(date), type: "lesson", title: "", concept: "",
    difficulty: "", estimatedMinutes: "",
    learningObjectives: [], prerequisites: [], keyPoints: [], importantNotes: [],
    commonMistakes: [], interviewTips: [], realWorldApplications: [],
    codeExample: { language: "", code: "" },
    mcqs: [], problemIds: [], xpReward: 50, coinReward: 20, status: "draft",
  };
}

// One reusable shape for every repeatable-string field below (Learning
// Objectives, Prerequisites, Key Points, Important Notes, Common Mistakes,
// Interview Tips, Real-world Applications) - all optional, all the exact
// same add/edit/remove interaction, so one component instead of seven
// near-identical blocks.
export function StringListField({ label, items, onChange, placeholder }) {
  const list = items || [];
  const patch = (i, value) => onChange(list.map((v, idx) => (idx === i ? value : v)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, ""]);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{label} ({list.length})</label>
        <button onClick={add} className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg" style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50` }}>
          <Plus size={10} /> add
        </button>
      </div>
      <div className="space-y-1.5">
        {list.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={v} onChange={e => patch(i, e.target.value)} placeholder={placeholder}
              className="flex-1 text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            <button onClick={() => remove(i)} style={{ color: CAMPUS.bad }}><Trash2 size={13} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>None yet - optional, leave empty to skip this section on the lesson page.</p>}
      </div>
    </div>
  );
}

export function DailyLearningItemEditor({ slug, item, defaultDate, onClose, onSaved }) {
  const isNew = !item;
  const [form, setForm] = useState(item ? { ...item } : blankItem(defaultDate));
  const [saving, setSaving] = useState(false);
  const [problemSearch, setProblemSearch] = useState("");
  const [allProblems, setAllProblems] = useState([]);
  const [pickedProblems, setPickedProblems] = useState([]);

  useEffect(() => {
    fetchPublishedProblems().then(setAllProblems).catch(() => setAllProblems([]));
  }, []);

  useEffect(() => {
    if (!allProblems.length) return;
    const byId = Object.fromEntries(allProblems.map(p => [p.id, p]));
    setPickedProblems((form.problemIds || []).map(id => byId[id]).filter(Boolean));
  }, [allProblems, form.problemIds]);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  const addMcq = () => set({ mcqs: [...(form.mcqs || []), blankMcq()] });
  const removeMcq = (id) => set({ mcqs: form.mcqs.filter(q => q.id !== id) });
  const patchMcq = (id, patch) => set({ mcqs: form.mcqs.map(q => q.id === id ? { ...q, ...patch } : q) });
  const patchMcqOption = (id, idx, value) => set({
    mcqs: form.mcqs.map(q => q.id === id ? { ...q, options: q.options.map((o, i) => i === idx ? value : o) } : q),
  });

  const addProblem = (p) => {
    if ((form.problemIds || []).includes(p.id)) return;
    set({ problemIds: [...(form.problemIds || []), p.id] });
  };
  const removeProblem = (id) => set({ problemIds: form.problemIds.filter(pid => pid !== id) });

  const searchResults = problemSearch.trim()
    ? allProblems.filter(p => p.title?.toLowerCase().includes(problemSearch.trim().toLowerCase()) || String(p.number ?? "").includes(problemSearch.trim())).slice(0, 8)
    : [];

  const canSave = form.date && form.title.trim() && form.dow;

  const handleSave = async (publish) => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await saveItem(slug, { ...form, status: publish ? "published" : (form.status || "draft") });
      onSaved();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl">
      <CampusBackButton onClick={onClose} label="Back to Daily Learning management" />
      <h2 className="text-lg font-bold mb-4" style={{ color: CAMPUS.ink }}>
        {isNew ? "Add Daily Learning Day" : `Edit ${DOW_LABELS[form.dow] || form.dow} - ${form.date}`}
      </h2>

      <div className="space-y-5">
        <CampusCard className="p-5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>DATE</label>
              {isNew ? (
                <input type="date" value={form.date} onChange={e => set({ date: e.target.value, dow: dowOfDate(e.target.value) })}
                  className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              ) : (
                <p className="text-[13px] px-3 py-2 rounded-lg" style={{ background: CAMPUS.paper, color: CAMPUS.inkFaint }}>{form.date} (fixed)</p>
              )}
              {isNew && !form.dow && <p className="text-[10px] mt-1" style={{ color: CAMPUS.bad }}>Pick a Monday-Saturday date (no Sunday slot).</p>}
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>TYPE</label>
              <select value={form.type} onChange={e => set({ type: e.target.value })}
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                <option value="lesson">Lesson</option>
                <option value="test">Test / Assessment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>STATUS ON SAVE</label>
              <select value={form.status || "draft"} onChange={e => set({ status: e.target.value })}
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>TITLE</label>
            <input value={form.title} onChange={e => set({ title: e.target.value })} placeholder="e.g. Day 1: What Is an Array?"
              className="w-full text-[14px] font-semibold px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>DIFFICULTY (OPTIONAL)</label>
              <select value={form.difficulty || ""} onChange={e => set({ difficulty: e.target.value })}
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                <option value="">Not set</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>ESTIMATED READING TIME (MINUTES, OPTIONAL)</label>
              <input type="number" value={form.estimatedMinutes || ""} onChange={e => set({ estimatedMinutes: e.target.value ? parseInt(e.target.value) : "" })} placeholder="e.g. 12"
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
          </div>

          <StringListField label="LEARNING OBJECTIVES" items={form.learningObjectives} onChange={v => set({ learningObjectives: v })} placeholder="e.g. Understand array traversal" />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => set({ prerequisites: v })} placeholder="e.g. Variables and loops" />

          <div>
            <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>CONCEPT / LESSON BODY</label>
            <textarea value={form.concept} onChange={e => set({ concept: e.target.value })} rows={8} placeholder="The reading material students see before the quiz..."
              className="w-full text-[13px] px-3 py-2.5 rounded-lg outline-none leading-relaxed" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>
              Indent a block by 2+ spaces to render it as pseudocode, and start a line with "- " for a real bullet list - the lesson page detects both automatically.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>CODE EXAMPLE (OPTIONAL)</label>
            <div className="grid sm:grid-cols-[140px_1fr] gap-2">
              <select value={form.codeExample?.language || ""} onChange={e => set({ codeExample: { ...form.codeExample, language: e.target.value } })}
                className="text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                <option value="">No language</option>
                {CODELAB_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <textarea value={form.codeExample?.code || ""} onChange={e => set({ codeExample: { ...form.codeExample, code: e.target.value } })}
                rows={5} placeholder="A short, focused, real code snippet illustrating the concept..."
                className="w-full text-[12.5px] font-mono px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            <textarea value={form.codeExample?.expectedOutput || ""} onChange={e => set({ codeExample: { ...form.codeExample, expectedOutput: e.target.value } })}
              rows={2} placeholder="Expected output (shown if live Run is ever unavailable - optional but recommended)"
              className="w-full text-[12.5px] font-mono px-3 py-2 rounded-lg outline-none mt-2" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>

          <StringListField label="KEY POINTS" items={form.keyPoints} onChange={v => set({ keyPoints: v })} placeholder="e.g. Arrays use contiguous memory" />
          <StringListField label="IMPORTANT NOTES" items={form.importantNotes} onChange={v => set({ importantNotes: v })} placeholder="e.g. Arrays have a fixed size in Java" />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => set({ commonMistakes: v })} placeholder="e.g. Using index n instead of n-1" />
          <StringListField label="INTERVIEW TIPS" items={form.interviewTips} onChange={v => set({ interviewTips: v })} placeholder="e.g. Interviewers often ask to reverse an array" />
          <StringListField label="REAL-WORLD APPLICATIONS" items={form.realWorldApplications} onChange={v => set({ realWorldApplications: v })} placeholder="e.g. Image processing" />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>XP REWARD</label>
              <input type="number" value={form.xpReward} onChange={e => set({ xpReward: parseInt(e.target.value) || 0 })}
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>COIN REWARD</label>
              <input type="number" value={form.coinReward} onChange={e => set({ coinReward: parseInt(e.target.value) || 0 })}
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
          </div>
        </CampusCard>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>MCQs ({(form.mcqs || []).length})</label>
            <button onClick={addMcq} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50` }}>
              <Plus size={11} /> add question
            </button>
          </div>
          <div className="space-y-3">
            {(form.mcqs || []).map((q, qi) => (
              <CampusCard key={q.id} className="p-4">
                <div className="flex items-start gap-2 mb-2.5">
                  <span className="text-[11px] font-mono mt-2" style={{ color: CAMPUS.inkFaint }}>{qi + 1}.</span>
                  <input value={q.text} onChange={e => patchMcq(q.id, { text: e.target.value })} placeholder="Question text"
                    className="flex-1 text-[13px] px-3 py-1.5 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                  <button onClick={() => removeMcq(q.id)} style={{ color: CAMPUS.bad }} className="mt-1.5"><Trash2 size={14} /></button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 pl-5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" checked={q.correctIndex === oi} onChange={() => patchMcq(q.id, { correctIndex: oi })} style={{ accentColor: CAMPUS.good }} />
                      <input value={opt} onChange={e => patchMcqOption(q.id, oi, e.target.value)} placeholder={`Option ${oi + 1}`}
                        className="flex-1 text-[12.5px] px-2.5 py-1.5 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${q.correctIndex === oi ? CAMPUS.good : CAMPUS.line}`, color: CAMPUS.ink }} />
                    </div>
                  ))}
                </div>
              </CampusCard>
            ))}
            {(form.mcqs || []).length === 0 && <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No MCQs yet - click "add question".</p>}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>PRACTICE PROBLEMS ({pickedProblems.length})</label>
          <div className="space-y-1.5 mb-3">
            {pickedProblems.map(p => (
              <div key={p.id} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
                <span style={{ color: CAMPUS.ink }}>{p.number}. {p.title} <span style={{ color: CAMPUS.inkFaint }}>({p.category}, {p.difficulty})</span></span>
                <button onClick={() => removeProblem(p.id)} style={{ color: CAMPUS.bad }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
            <input value={problemSearch} onChange={e => setProblemSearch(e.target.value)} placeholder="Search the problem bank by title or number to add..."
              className="w-full text-[13px] pl-9 pr-3 py-2 rounded-lg outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => { addProblem(p); setProblemSearch(""); }}
                  className="w-full flex items-center justify-between text-[12.5px] px-3 py-2 rounded-lg text-left" style={{ border: `1px solid ${CAMPUS.line}` }}>
                  <span style={{ color: CAMPUS.ink }}>{p.number}. {p.title}</span>
                  <CampusChip color={CAMPUS.teal}>+ add</CampusChip>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => handleSave(false)} disabled={!canSave || saving}
            className="flex-1 text-sm font-semibold py-3 rounded-xl disabled:opacity-40" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            {saving ? "saving..." : "save as draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={!canSave || saving}
            className="flex-1 text-sm font-semibold py-3 rounded-xl disabled:opacity-40" style={{ background: CAMPUS.teal, color: "#fff" }}>
            {saving ? "saving..." : "save & publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
