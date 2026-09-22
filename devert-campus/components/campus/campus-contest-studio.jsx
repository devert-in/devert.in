"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check, Trash2, Upload, Download, Search, X, AlertTriangle, CheckCircle2, BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusStat, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import Dropdown from "@/components/dropdown";
import {
  CONTEST_CATEGORIES, CONTEST_DIFFICULTIES, QUESTION_TYPES, CONTEST_TYPES,
  blankContestForm, blankTargetScope, blankContestQuestionForm, CONTEST_CSV_HELP,
  downloadContestCsvTemplate, csvRowsToContestQuestions, parseCSV, xlsxToCsvText,
  createContest, updateContest, fetchContest, validateContestForPublish, transitionContestLifecycle,
  addContestQuestion, updateContestQuestion, deleteContestQuestion, importContestQuestionsBatch,
  setContestQuestionCount, fetchContestQuestions, fetchContestAnswerKeys,
  fetchQuestionBank, saveToQuestionBank,
  saveContestCodingTests, fetchContestQuestionSampleTests, fetchContestQuestionHiddenTests,
} from "@/lib/contests";
import { DEPARTMENTS, YEARS, fetchClassrooms, fetchRosterStudents } from "@/lib/institutions";

function toDatetimeLocal(v) {
  if (!v) return "";
  const d = typeof v.toDate === "function" ? v.toDate() : new Date(v);
  if (isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// The one genuinely new linear-progress UI pattern in Campus - every other
// multi-section surface here (EditorTabs, campus-manage's MANAGE_TABS) is a
// non-linear pill strip where every tab is always clickable. This wizard is
// deliberately linear: a step only becomes clickable once you've actually
// reached it, so an admin can't jump to "Publish" before there's anything to
// publish.
const STEPS = [
  { key: "basic",     label: "Basic Info" },
  { key: "type",      label: "Contest Type" },
  { key: "audience",  label: "Target Audience" },
  { key: "schedule",  label: "Schedule" },
  { key: "questions", label: "Questions" },
  { key: "preview",   label: "Preview" },
  { key: "publish",   label: "Publish" },
];

const LETTERS = ["a", "b", "c", "d"];

export function questionFormToPayload(qForm) {
  let options = [], correctOptionIds = [], correctText = "";
  if (qForm.type === "fillblank") {
    correctText = qForm.correctText.trim();
  } else if (qForm.type === "truefalse") {
    options = [{ id: "true", text: "True" }, { id: "false", text: "False" }];
    correctOptionIds = [qForm.correctIndices[0] === 1 ? "false" : "true"];
  } else if (qForm.type === "coding") {
    // No answerKey at all - see gradeSubmission's dedicated coding branch in
    // lib/contests.js. sampleTests/hiddenTests are saved separately via
    // saveContestCodingTests, not part of this payload.
  } else {
    const texts = qForm.options.map(o => o.trim());
    options = LETTERS.map((id, idx) => ({ id, text: texts[idx] })).filter(o => o.text);
    correctOptionIds = qForm.correctIndices.map(i => LETTERS[i]).filter(id => options.some(o => o.id === id));
  }
  return {
    type: qForm.type, question: qForm.question.trim(), options, correctOptionIds, correctText,
    marks: parseFloat(qForm.marks) || 1, negativeMarks: parseFloat(qForm.negativeMarks) || 0,
    explanation: qForm.explanation.trim(), topic: qForm.topic.trim(),
    category: (qForm.category || "").trim(), difficulty: qForm.difficulty,
    tags: (qForm.tags || "").split(",").map(t => t.trim()).filter(Boolean),
    estimatedTimeSec: qForm.estimatedTimeSec ? parseInt(qForm.estimatedTimeSec) || null : null,
    hintText: (qForm.hintText || "").trim(),
  };
}

function questionFormValid(qForm) {
  if (!qForm.question.trim()) return false;
  if (qForm.type === "fillblank") return !!qForm.correctText.trim();
  if (qForm.type === "truefalse") return true;
  if (qForm.type === "coding") return (qForm.hiddenTests || []).some(t => t.input.trim() && t.expectedOutput.trim());
  const texts = qForm.options.map(o => o.trim()).filter(Boolean);
  return texts.length >= 2 && qForm.correctIndices.length > 0;
}

// Reconstructs a blankContestQuestionForm()-shaped editor state from an
// already-persisted question+answerKey doc pair (merged shape returned by
// reloadQuestions below) - lets the Preview step's inline "edit" reopen the
// exact same form the question was originally authored in.
export function questionToForm(q) {
  const letters = LETTERS;
  let correctIndices = [0];
  const optionTexts = ["", "", "", ""];
  if (q.type === "mcq" || q.type === "multiselect") {
    (q.options || []).forEach(o => {
      const idx = letters.indexOf(o.id);
      if (idx !== -1) optionTexts[idx] = o.text;
    });
    correctIndices = (q.correctOptionIds || []).map(id => letters.indexOf(id)).filter(i => i !== -1);
    if (correctIndices.length === 0) correctIndices = [0];
  } else if (q.type === "truefalse") {
    correctIndices = [(q.correctOptionIds || [])[0] === "false" ? 1 : 0];
  }
  return {
    type: q.type, question: q.question || "", options: optionTexts, correctIndices,
    correctText: q.correctText || "", marks: String(q.marks ?? 1), negativeMarks: String(q.negativeMarks ?? 0),
    explanation: q.explanation || "", topic: q.topic || "", difficulty: q.difficulty || "medium",
    category: q.category || "", tags: (q.tags || []).join(", "),
    estimatedTimeSec: q.estimatedTimeSec ? String(q.estimatedTimeSec) : "", hintText: q.hintText || "",
    // Populated separately (fetchContestQuestionSampleTests/HiddenTests are
    // async, this function isn't) - callers editing an existing coding
    // question fetch and merge these in right after calling this.
    sampleTests: q.sampleTests || (q.type === "coding" ? [{ input: "", expectedOutput: "", explanation: "" }] : []),
    hiddenTests: q.hiddenTests || (q.type === "coding" ? [{ input: "", expectedOutput: "" }] : []),
  };
}

async function reloadContestQuestions(contestId) {
  const [qs, keys] = await Promise.all([fetchContestQuestions(contestId), fetchContestAnswerKeys(contestId)]);
  return qs.map(q => ({ id: q.id, ...q, ...keys[q.id] }));
}

function normText(s) { return (s || "").trim().toLowerCase().replace(/\s+/g, " "); }

// ---------------- Small shared inputs ----------------

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }) {
  return (
    <div>
      <label className="block text-[10px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none resize-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</label>
      <Dropdown value={value} onChange={onChange} options={options} className="w-full"
        buttonClassName="text-[12.5px] px-3 py-2 rounded-lg bg-[var(--campus-paper)] border border-[var(--campus-line)] text-[var(--campus-ink)]" />
    </div>
  );
}

// ---------------- Step indicator ----------------

function StepIndicator({ step, maxStep, onJump }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((s, i) => {
        const done = i < maxStep;
        const active = i === step;
        const clickable = i <= maxStep;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <button disabled={!clickable} onClick={() => clickable && onJump(i)}
              className="flex items-center gap-2 flex-shrink-0 disabled:cursor-default">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11.5px] font-bold flex-shrink-0 transition-colors"
                style={{
                  background: done ? CAMPUS.good : active ? CAMPUS.teal : CAMPUS.paper,
                  color: done || active ? "#fff" : CAMPUS.inkFaint,
                  border: `1.5px solid ${done ? CAMPUS.good : active ? CAMPUS.teal : CAMPUS.line}`,
                }}>
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span className="text-[12px] font-semibold hidden sm:inline" style={{ color: active ? CAMPUS.ink : CAMPUS.inkFaint }}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[1.5px] mx-2" style={{ background: done ? CAMPUS.good : CAMPUS.line }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Step 1: Basic Info ----------------

function BasicInfoStep({ form, setForm, onNext }) {
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.title.trim().length > 0;
  return (
    <CampusCard className="p-5 space-y-4">
      <Field label="Title" value={form.title} onChange={set("title")} placeholder="Weekly Aptitude Challenge #1" />
      <Field label="Description" value={form.description} onChange={set("description")} textarea placeholder="What is this contest about?" />
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Category" value={form.category} onChange={set("category")} options={CONTEST_CATEGORIES} />
        <Select label="Difficulty" value={form.difficulty} onChange={set("difficulty")} options={CONTEST_DIFFICULTIES} />
      </div>
      <Field label="Rules" value={form.rules} onChange={set("rules")} textarea placeholder="One question at a time, no external help..." />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Eligibility" value={form.eligibility} onChange={set("eligibility")} placeholder="Open to all / Final years only" />
        <Field label="Organizer" value={form.organizer} onChange={set("organizer")} placeholder="Placement Cell" />
      </div>
      <Field label="Banner image URL" value={form.bannerUrl} onChange={set("bannerUrl")} placeholder="https://..." />
      <Field label="Tags (comma separated)" value={form.tags} onChange={set("tags")} placeholder="placement, aptitude" />
      <p className="text-[11px] -mb-1" style={{ color: CAMPUS.inkFaint }}>
        Contests no longer grant platform XP/Coins (only Daily Learning, Programming, and CS Core do) - describe any real prize below instead.
      </p>
      <Field label="Prize details (optional)" value={form.prizeText} onChange={set("prizeText")} placeholder="Top 3 get certificates" />

      <div className="flex justify-end pt-2">
        <button onClick={onNext} disabled={!valid}
          className="text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
          style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          Next: Contest Type →
        </button>
      </div>
    </CampusCard>
  );
}

// ---------------- Step 2: Contest Type ----------------
// Purely descriptive/filtering metadata (see CONTEST_TYPES in lib/contests.js)
// - doesn't gate which question types Step 5 lets an admin add.

function ContestTypeStep({ contestType, setContestType, onNext, onBack }) {
  return (
    <div className="space-y-4">
      <CampusCard className="p-5">
        <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkSoft }}>
          What kind of contest is this? This only affects how it&apos;s labeled and filtered on the Contests list.
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {CONTEST_TYPES.map(t => (
            <button key={t.v} onClick={() => setContestType(t.v)}
              className="text-left text-[13px] font-semibold px-4 py-3 rounded-xl transition-colors"
              style={{
                background: contestType === t.v ? CAMPUS.gradientPrimary : CAMPUS.surface,
                color: contestType === t.v ? "#fff" : CAMPUS.ink,
                border: `1px solid ${contestType === t.v ? "transparent" : CAMPUS.line}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </CampusCard>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          ← Back
        </button>
        <button onClick={onNext} className="text-[13px] font-semibold px-5 py-2.5 rounded-lg" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          Next: Target Audience →
        </button>
      </div>
    </div>
  );
}

// ---------------- Step 3: Target Audience ----------------
// "All Students" (default) keeps every existing contest's only-ever behavior
// unchanged. "Specific Audience" narrows with AND-hierarchy / OR-uids
// semantics, defined and enforced in exactly one place: matchesContestScope()
// / isInContestAudience() in firestore.rules, which gate isApprovedForContest().
// The wizard can never merely LOOK like it narrowed access - the rule is what
// grants or refuses the read. There is deliberately no client-side copy of
// this matcher to drift out of sync.

function TargetAudienceStep({ institutionId, scope, setScope, onNext, onBack }) {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    Promise.all([fetchClassrooms(institutionId), fetchRosterStudents(institutionId)])
      .then(([cls, stu]) => { setClassrooms(cls); setStudents(stu); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [institutionId]);

  const toggleMode = (mode) => setScope(p => ({ ...p, mode }));
  const toggleInArray = (key, value) => setScope(p => {
    const arr = p[key] || [];
    return { ...p, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
  });

  // Cascading: Section options narrow to what Department/Year picked so far
  // actually have; Classroom options narrow further still - never a fixed
  // enum, since sections/classrooms are per-institution real data
  // (classrooms are one doc per Department x Year x Section combo that
  // actually exists, see ensureClassroom in lib/institutions.js).
  const availableSections = useMemo(() => [...new Set(
    classrooms
      .filter(c => (scope.departments.length === 0 || scope.departments.includes(c.department))
        && (scope.years.length === 0 || scope.years.includes(c.year)))
      .map(c => c.section)
  )].sort(), [classrooms, scope.departments, scope.years]);

  const availableClassrooms = useMemo(() => classrooms.filter(c =>
    (scope.departments.length === 0 || scope.departments.includes(c.department))
    && (scope.years.length === 0 || scope.years.includes(c.year))
    && (scope.sections.length === 0 || scope.sections.includes(c.section))
  ), [classrooms, scope.departments, scope.years, scope.sections]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return [];
    return students.filter(s => s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const pickerBtn = (active) => ({
    className: "text-[11.5px] font-mono px-2.5 py-1.5 rounded-lg",
    style: { color: active ? CAMPUS.teal : CAMPUS.inkSoft, background: active ? CAMPUS.tealTint : CAMPUS.surface, border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}` },
  });

  return (
    <div className="space-y-4">
      <CampusCard className="p-5 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => toggleMode("all")} className="flex-1 text-[12.5px] font-semibold px-4 py-3 rounded-lg transition-colors"
            style={{ background: scope.mode === "all" ? CAMPUS.gradientPrimary : "transparent", color: scope.mode === "all" ? "#fff" : CAMPUS.inkSoft, border: `1px solid ${scope.mode === "all" ? "transparent" : CAMPUS.line}` }}>
            All Students
          </button>
          <button onClick={() => toggleMode("scoped")} className="flex-1 text-[12.5px] font-semibold px-4 py-3 rounded-lg transition-colors"
            style={{ background: scope.mode === "scoped" ? CAMPUS.gradientPrimary : "transparent", color: scope.mode === "scoped" ? "#fff" : CAMPUS.inkSoft, border: `1px solid ${scope.mode === "scoped" ? "transparent" : CAMPUS.line}` }}>
            Specific Audience
          </button>
        </div>
        <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
          {scope.mode === "all"
            ? "Every approved student at your institution can see and register for this contest."
            : "Only students matching the filters below (or individually added) can see and register. Leaving every filter empty still matches everyone - pick at least one to actually narrow it down."}
        </p>
      </CampusCard>

      {scope.mode === "scoped" && (loading ? (
        <CampusCard className="p-5"><CampusSkeleton variant="rect" height={120} /></CampusCard>
      ) : (
        <>
          <CampusCard className="p-5 space-y-4">
            <div>
              <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>DEPARTMENT</p>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(d => (
                  <button key={d} onClick={() => toggleInArray("departments", d)} {...pickerBtn(scope.departments.includes(d))}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>YEAR</p>
              <div className="flex flex-wrap gap-1.5">
                {YEARS.map(y => (
                  <button key={y} onClick={() => toggleInArray("years", y)} {...pickerBtn(scope.years.includes(y))}>{y}</button>
                ))}
              </div>
            </div>
            {availableSections.length > 0 && (
              <div>
                <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>SECTION</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSections.map(s => (
                    <button key={s} onClick={() => toggleInArray("sections", s)} {...pickerBtn(scope.sections.includes(s))}>Section {s}</button>
                  ))}
                </div>
              </div>
            )}
            {availableClassrooms.length > 0 && (
              <div>
                <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>SPECIFIC CLASSROOM (optional, narrows further)</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableClassrooms.map(c => (
                    <button key={c.id} onClick={() => toggleInArray("classroomIds", c.id)} {...pickerBtn(scope.classroomIds.includes(c.id))}>
                      {c.department} · {c.year} · {c.section}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CampusCard>

          <CampusCard className="p-5 space-y-3">
            <p className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>
              Add specific students {scope.uids.length > 0 && `(${scope.uids.length} added)`}
            </p>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search by name or roll number..."
                className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            {studentSearch.trim() && (
              <div className="rounded-lg overflow-hidden max-h-56 overflow-y-auto" style={{ border: `1px solid ${CAMPUS.line}` }}>
                {filteredStudents.length === 0 ? (
                  <p className="text-[12px] px-3 py-3" style={{ color: CAMPUS.inkFaint }}>No matching students.</p>
                ) : filteredStudents.slice(0, 30).map((s, i) => (
                  <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                    style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                    <input type="checkbox" checked={scope.uids.includes(s.id)} onChange={() => toggleInArray("uids", s.id)} />
                    <span className="text-[12.5px] flex-1 truncate" style={{ color: CAMPUS.ink }}>{s.name}</span>
                    <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span>
                  </label>
                ))}
              </div>
            )}
            {scope.uids.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {scope.uids.map(uid => {
                  const s = students.find(st => st.id === uid);
                  return (
                    <CampusChip key={uid} color={CAMPUS.teal}>
                      {s?.name || uid}
                      <button onClick={() => toggleInArray("uids", uid)}><X size={10} /></button>
                    </CampusChip>
                  );
                })}
              </div>
            )}
          </CampusCard>
        </>
      ))}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          ← Back
        </button>
        <button onClick={onNext} className="text-[13px] font-semibold px-5 py-2.5 rounded-lg" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          Next: Schedule →
        </button>
      </div>
    </div>
  );
}

// ---------------- Step 4: Schedule ----------------
// The one step that actually persists the contest (create on first visit,
// update on every subsequent one) - by now every required field (title,
// contestType, targetScope, and the dates collected right here) is known,
// so there's no half-configured draft written earlier in the flow.

function ContestScheduleStep({ form, setForm, error, saving, onNext, onBack }) {
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <CampusCard className="p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Registration start" type="datetime-local" value={form.registrationStart} onChange={set("registrationStart")} />
        <Field label="Registration end" type="datetime-local" value={form.registrationEnd} onChange={set("registrationEnd")} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Contest start" type="datetime-local" value={form.contestStart} onChange={set("contestStart")} />
        <Field label="Contest end" type="datetime-local" value={form.contestEnd} onChange={set("contestEnd")} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={set("durationMinutes")} />
        <Field label="Grace period (minutes)" type="number" value={form.graceMinutes} onChange={set("graceMinutes")} placeholder="0" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Publish results at (optional)" type="datetime-local" value={form.resultPublishAt} onChange={set("resultPublishAt")} />
        <Field label="Publish leaderboard at (optional)" type="datetime-local" value={form.leaderboardPublishAt} onChange={set("leaderboardPublishAt")} />
      </div>
      <p className="text-[11px] -mb-1" style={{ color: CAMPUS.inkFaint }}>
        Leave the two publish fields empty to release results/leaderboard immediately once evaluation finishes.
      </p>

      {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          ← Back
        </button>
        <button onClick={onNext} disabled={saving}
          className="text-[13px] font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
          style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          {saving ? "Saving..." : "Next: Add Questions →"}
        </button>
      </div>
    </CampusCard>
  );
}

// ---------------- Step 5: Questions ----------------

const ADD_MODES = [
  { key: "manual", label: "Add Manually" },
  { key: "bank",   label: "From Question Bank" },
  { key: "bulk",   label: "Bulk Upload" },
];

// Shared by a coding question's sample (client-visible) and hidden
// (grading-only, never shown to a student) test case lists - same
// input/expectedOutput shape saveContestCodingTests writes to Firestore,
// edited as a plain in-memory array until the question itself is saved.
function CodingTestCaseList({ label, hint, tests, setTests, includeExplanation = false }) {
  const update = (idx, field, value) => setTests(tests.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  const addRow = () => setTests([...tests, includeExplanation ? { input: "", expectedOutput: "", explanation: "" } : { input: "", expectedOutput: "" }]);
  const removeRow = (idx) => setTests(tests.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>{label}</p>
        <button onClick={addRow} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>+ add test case</button>
      </div>
      {hint && <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{hint}</p>}
      {tests.map((t, i) => (
        <div key={i} className="rounded-lg p-3 space-y-2" style={{ border: `1px solid ${CAMPUS.line}` }}>
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>Test {i + 1}</span>
            {tests.length > 1 && (
              <button onClick={() => removeRow(i)} style={{ color: CAMPUS.bad }}><Trash2 size={12} /></button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <Field label="Input (stdin)" value={t.input} onChange={v => update(i, "input", v)} textarea />
            <Field label="Expected output" value={t.expectedOutput} onChange={v => update(i, "expectedOutput", v)} textarea />
          </div>
          {includeExplanation && (
            <Field label="Explanation (optional, shown to student)" value={t.explanation || ""} onChange={v => update(i, "explanation", v)} />
          )}
        </div>
      ))}
    </div>
  );
}

export function QuestionEditorForm({ qForm, setQForm, onSave, saving, submitLabel = "Add question" }) {
  const valid = questionFormValid(qForm);
  return (
    <div className="space-y-2.5">
      <div className="flex gap-1.5 flex-wrap">
        {QUESTION_TYPES.map(t => (
          <button key={t} onClick={() => setQForm(blankContestQuestionForm(t))}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg"
            style={{ color: qForm.type === t ? CAMPUS.teal : CAMPUS.inkSoft, background: qForm.type === t ? CAMPUS.tealTint : CAMPUS.surface, border: `1px solid ${qForm.type === t ? CAMPUS.teal : CAMPUS.line}` }}>
            {t}
          </button>
        ))}
      </div>
      <Field label="Question" value={qForm.question} onChange={v => setQForm(p => ({ ...p, question: v }))} placeholder="What does the JVM do?" textarea />
      {qForm.type === "fillblank" ? (
        <Field label="Accepted answer(s) - use | for alternatives" value={qForm.correctText} onChange={v => setQForm(p => ({ ...p, correctText: v }))} placeholder="extends|inherits" />
      ) : qForm.type === "truefalse" ? (
        <div className="flex gap-2">
          {["True", "False"].map((label, idx) => (
            <button key={label} onClick={() => setQForm(p => ({ ...p, correctIndices: [idx] }))}
              className="flex-1 text-[12.5px] py-2 rounded-lg"
              style={{ color: qForm.correctIndices[0] === idx ? CAMPUS.good : CAMPUS.inkSoft, border: `1px solid ${qForm.correctIndices[0] === idx ? CAMPUS.good : CAMPUS.line}`, background: qForm.correctIndices[0] === idx ? CAMPUS.goodTint : "transparent" }}>
              {label}
            </button>
          ))}
        </div>
      ) : qForm.type === "coding" ? (
        <div className="space-y-4">
          <CodingTestCaseList label="SAMPLE TEST CASES (visible to students)" tests={qForm.sampleTests || []}
            setTests={arr => setQForm(p => ({ ...p, sampleTests: arr }))} includeExplanation
            hint="Shown alongside the problem statement so a student can sanity-check their code before submitting." />
          <CodingTestCaseList label="HIDDEN TEST CASES (used for grading only)" tests={qForm.hiddenTests || []}
            setTests={arr => setQForm(p => ({ ...p, hiddenTests: arr }))}
            hint="Never shown to students - these are what actually determine the score." />
        </div>
      ) : (
        qForm.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <button onClick={() => setQForm(p => {
              const already = p.correctIndices.includes(oi);
              if (p.type === "multiselect") {
                return { ...p, correctIndices: already ? p.correctIndices.filter(i => i !== oi) : [...p.correctIndices, oi] };
              }
              return { ...p, correctIndices: [oi] };
            })}
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{
                background: qForm.correctIndices.includes(oi) ? CAMPUS.good : CAMPUS.paper,
                color: qForm.correctIndices.includes(oi) ? "#fff" : CAMPUS.inkFaint,
                border: `1px solid ${qForm.correctIndices.includes(oi) ? CAMPUS.good : CAMPUS.line}`,
              }}>
              {String.fromCharCode(65 + oi)}
            </button>
            <input value={opt} onChange={e => setQForm(p => ({ ...p, options: p.options.map((o, i) => i === oi ? e.target.value : o) }))}
              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
              className="flex-1 text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
              style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>
        ))
      )}
      {qForm.type !== "coding" && (
        <Field label="Explanation" value={qForm.explanation} onChange={v => setQForm(p => ({ ...p, explanation: v }))} placeholder="Why is this the correct answer?" textarea />
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Marks" type="number" value={qForm.marks} onChange={v => setQForm(p => ({ ...p, marks: v }))} />
        {qForm.type !== "coding" && (
          <Field label="Negative marks" type="number" value={qForm.negativeMarks} onChange={v => setQForm(p => ({ ...p, negativeMarks: v }))} />
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Topic" value={qForm.topic} onChange={v => setQForm(p => ({ ...p, topic: v }))} placeholder="Binary Search" />
        <Select label="Difficulty" value={qForm.difficulty} onChange={v => setQForm(p => ({ ...p, difficulty: v }))} options={["easy", "medium", "hard"]} />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Category (optional)" value={qForm.category} onChange={v => setQForm(p => ({ ...p, category: v }))} />
        <Field label="Tags (comma separated, optional)" value={qForm.tags} onChange={v => setQForm(p => ({ ...p, tags: v }))} />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Field label="Estimated time (seconds, optional)" type="number" value={qForm.estimatedTimeSec} onChange={v => setQForm(p => ({ ...p, estimatedTimeSec: v }))} />
        <Field label="Hint (optional)" value={qForm.hintText} onChange={v => setQForm(p => ({ ...p, hintText: v }))} />
      </div>
      {!valid && qForm.question.trim() && (
        <p className="text-[11.5px]" style={{ color: CAMPUS.warn }}>
          {qForm.type === "fillblank" ? "Add at least one accepted answer."
            : qForm.type === "truefalse" ? ""
            : qForm.type === "coding" ? "Add at least one hidden test case with both an input and expected output."
            : "Add at least 2 options and mark a correct one."}
        </p>
      )}
      <button onClick={onSave} disabled={saving || !valid}
        className="text-[12.5px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function QuestionBankPickerPanel({ institutionId, existingTexts, onAdd }) {
  const [bank, setBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});

  useEffect(() => {
    fetchQuestionBank(institutionId).then(setBank).catch(console.error).finally(() => setLoading(false));
  }, [institutionId]);

  const filtered = bank.filter(q => !search.trim() || normText(q.question).includes(normText(search)) || normText(q.topic).includes(normText(search)));
  const selectedIds = Object.keys(selected).filter(id => selected[id]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
            <CampusSkeleton variant="rect" width={14} height={14} />
            <CampusSkeleton variant="text" width={`${60 - i * 10}%`} />
          </div>
        ))}
      </div>
    );
  }
  if (bank.length === 0) {
    return <CampusEmptyState size="sm" icon={BookOpen} title="Question bank is empty"
      description="Add questions manually or via bulk upload - every question you add there is automatically saved here for reuse." />;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bank by question or topic..."
          className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>
      <div className="rounded-lg overflow-hidden max-h-80 overflow-y-auto" style={{ border: `1px solid ${CAMPUS.line}` }}>
        {filtered.map((q, i) => {
          const dup = existingTexts.has(normText(q.question));
          return (
            <label key={q.id} className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer"
              style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none", opacity: dup ? 0.5 : 1 }}>
              <input type="checkbox" disabled={dup} checked={!!selected[q.id]}
                onChange={e => setSelected(p => ({ ...p, [q.id]: e.target.checked }))} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{q.question}</p>
                <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                  {q.type} · {q.difficulty} {q.topic && `· ${q.topic}`} {dup && "· already in this contest"}
                </span>
              </div>
            </label>
          );
        })}
      </div>
      <button onClick={() => { onAdd(bank.filter(q => selected[q.id])); setSelected({}); }} disabled={selectedIds.length === 0}
        className="text-[12.5px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
        Add {selectedIds.length || ""} selected question{selectedIds.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}

function BulkUploadPanel({ existingTexts, bankTexts, onImport }) {
  const [rows, setRows] = useState(null); // { valid, invalid, duplicates } | null
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setRows(null);
    try {
      const isXlsx = /\.xlsx$/i.test(file.name);
      const text = isXlsx ? await xlsxToCsvText(file) : await file.text();
      const { questions, errors } = csvRowsToContestQuestions(parseCSV(text));
      const seen = new Set();
      const valid = [], duplicates = [];
      questions.forEach(q => {
        const n = normText(q.question);
        if (existingTexts.has(n) || bankTexts.has(n) || seen.has(n)) duplicates.push(q);
        else { seen.add(n); valid.push(q); }
      });
      setRows({ valid, invalid: errors, duplicates });
    } catch (err) {
      setRows({ valid: [], invalid: [err.message || "Could not read this file."], duplicates: [] });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleCommit = async () => {
    if (!rows || rows.valid.length === 0) return;
    setImporting(true);
    try {
      await onImport(rows.valid);
      setRows(null);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>Upload a .csv or .xlsx file. Every row is validated before anything is imported.</p>
        <button onClick={downloadContestCsvTemplate} className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: CAMPUS.teal }}>
          <Download size={12} /> download template
        </button>
      </div>
      <pre className="text-[10px] whitespace-pre-wrap leading-relaxed rounded-lg p-3" style={{ color: CAMPUS.inkFaint, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>{CONTEST_CSV_HELP}</pre>

      <label className="flex items-center justify-center gap-2 text-[12.5px] font-semibold px-4 py-3 rounded-lg cursor-pointer"
        style={{ border: `1.5px dashed ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
        <Upload size={14} /> {busy ? "Reading file..." : "Choose .csv or .xlsx file"}
        <input type="file" accept=".csv,.xlsx,text/csv" className="hidden" onChange={handleFile} disabled={busy} />
      </label>

      {rows && (
        <div className="space-y-2">
          <div className="flex gap-4 text-[12.5px]">
            <span style={{ color: CAMPUS.good }}>{rows.valid.length} ready to import</span>
            {rows.invalid.length > 0 && <span style={{ color: CAMPUS.bad }}>{rows.invalid.length} invalid</span>}
            {rows.duplicates.length > 0 && <span style={{ color: CAMPUS.warn }}>{rows.duplicates.length} duplicate{rows.duplicates.length === 1 ? "" : "s"} skipped</span>}
          </div>
          {rows.invalid.length > 0 && (
            <div className="rounded-lg p-3 space-y-1" style={{ background: CAMPUS.badTint, border: `1px solid ${tint(CAMPUS.bad, 26)}` }}>
              {rows.invalid.map((e, i) => (
                <p key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: CAMPUS.bad }}>
                  <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" /> {e}
                </p>
              ))}
              <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>Fix these rows in your file and re-upload - only valid rows import.</p>
            </div>
          )}
          {rows.duplicates.length > 0 && (
            <div className="rounded-lg p-3 space-y-1" style={{ background: CAMPUS.warnTint, border: `1px solid ${tint(CAMPUS.warn, 26)}` }}>
              {rows.duplicates.slice(0, 5).map((q, i) => (
                <p key={i} className="text-[11px] truncate" style={{ color: CAMPUS.warn }}>Duplicate: {q.question}</p>
              ))}
              {rows.duplicates.length > 5 && <p className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>+{rows.duplicates.length - 5} more</p>}
            </div>
          )}
          {rows.valid.length > 0 && (
            <div className="rounded-lg overflow-hidden max-h-56 overflow-y-auto" style={{ border: `1px solid ${CAMPUS.line}` }}>
              {rows.valid.map((q, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                  <CheckCircle2 size={12} style={{ color: CAMPUS.good }} className="flex-shrink-0" />
                  <span className="text-[12px] truncate flex-1" style={{ color: CAMPUS.ink }}>{q.question}</span>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{q.type}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleCommit} disabled={importing || rows.valid.length === 0}
            className="text-[12.5px] font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
            {importing ? "Importing..." : `Import ${rows.valid.length} question${rows.valid.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}

function ContestQuestionsStep({ institutionId, contestId, questions, setQuestions, onNext, onBack }) {
  const { user } = useAuth();
  const [addMode, setAddMode] = useState("manual");
  const [qForm, setQForm] = useState(blankContestQuestionForm());
  const [saving, setSaving] = useState(false);
  const [saveToBank, setSaveToBank] = useState(true);
  const [error, setError] = useState("");

  const existingTexts = new Set(questions.map(q => normText(q.question)));

  const refresh = async () => {
    const qs = await reloadContestQuestions(contestId);
    setQuestions(qs);
    await setContestQuestionCount(contestId, qs.length);
    return qs;
  };

  const handleAddManual = async () => {
    setSaving(true); setError("");
    try {
      const payload = questionFormToPayload(qForm);
      const newQuestionId = await addContestQuestion(contestId, payload, questions.length);
      if (payload.type === "coding") {
        await saveContestCodingTests(contestId, newQuestionId, qForm.sampleTests, qForm.hiddenTests);
        // Not saved to the question bank - the bank only stores the plain
        // MCQ-shaped payload (no sampleTests/hiddenTests subcollections), so
        // reusing a coding question from it would silently come back with no
        // test cases at all.
      } else if (saveToBank) {
        await saveToQuestionBank(institutionId, payload, user?.uid).catch(() => {});
      }
      await refresh();
      setQForm(blankContestQuestionForm(qForm.type));
    } catch (e) {
      setError(e.message || "Failed to add question.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromBank = async (bankQuestions) => {
    let order = questions.length;
    for (const q of bankQuestions) {
      await addContestQuestion(contestId, q, order++);
    }
    await refresh();
  };

  const handleBulkImport = async (parsed) => {
    await importContestQuestionsBatch(contestId, parsed, questions.length);
    if (saveToBank) {
      for (const q of parsed) { await saveToQuestionBank(institutionId, q, user?.uid).catch(() => {}); }
    }
    await refresh();
  };

  const handleDelete = async (questionId) => {
    await deleteContestQuestion(contestId, questionId);
    await refresh();
  };

  const bankTexts = existingTexts; // bank duplicate-check reuses the same normalized set helper inside BulkUploadPanel via existingTexts; bank-specific texts fetched inside picker/upload panel as needed

  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>
            Questions in this contest ({questions.length})
          </p>
        </div>
        {questions.length === 0 ? (
          <p className="text-[12.5px] py-3" style={{ color: CAMPUS.inkFaint }}>No questions added yet.</p>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-2 px-3 py-2" style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                <span className="text-[10px] font-mono w-5 flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{i + 1}</span>
                <span className="text-[12.5px] flex-1 truncate" style={{ color: CAMPUS.ink }}>{q.question}</span>
                <CampusChip color={CAMPUS.inkFaint}>{q.type}</CampusChip>
                <span className="text-[10px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{q.marks}m</span>
                <button onClick={() => handleDelete(q.id)} style={{ color: CAMPUS.inkFaint }} className="flex-shrink-0"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </CampusCard>

      <CampusCard className="p-4">
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {ADD_MODES.map(m => (
            <button key={m.key} onClick={() => setAddMode(m.key)}
              className="campus-btn text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-150"
              style={{
                background: addMode === m.key ? CAMPUS.gradientPrimary : "transparent",
                color: addMode === m.key ? "#fff" : CAMPUS.inkSoft,
                boxShadow: addMode === m.key ? CAMPUS.shadow : "none",
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {addMode === "manual" && (
          <div className="space-y-3">
            <QuestionEditorForm qForm={qForm} setQForm={setQForm} onSave={handleAddManual} saving={saving} submitLabel="Add question" />
            {qForm.type !== "coding" && (
              <label className="flex items-center gap-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                <input type="checkbox" checked={saveToBank} onChange={e => setSaveToBank(e.target.checked)} />
                Also save to this institution&apos;s question bank for reuse
              </label>
            )}
            {error && <p className="text-[12px]" style={{ color: CAMPUS.bad }}>{error}</p>}
          </div>
        )}

        {addMode === "bank" && (
          <QuestionBankPickerPanel institutionId={institutionId} existingTexts={existingTexts} onAdd={handleAddFromBank} />
        )}

        {addMode === "bulk" && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
              <input type="checkbox" checked={saveToBank} onChange={e => setSaveToBank(e.target.checked)} />
              Also save imported questions to the question bank for reuse
            </label>
            <BulkUploadPanel existingTexts={existingTexts} bankTexts={bankTexts} onImport={handleBulkImport} />
          </div>
        )}
      </CampusCard>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          ← Back
        </button>
        <button onClick={onNext} className="text-[13px] font-semibold px-5 py-2.5 rounded-lg" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          Next: Preview →
        </button>
      </div>
    </div>
  );
}

// ---------------- Step 6: Preview ----------------

const DEFAULT_TIME_SEC = { easy: 45, medium: 75, hard: 120 };

function ContestPreviewStep({ contestId, questions, setQuestions, onNext, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const qs = await reloadContestQuestions(contestId);
    setQuestions(qs);
  };

  const totalMarks = questions.reduce((s, q) => s + (parseFloat(q.marks) || 0), 0);
  const totalTimeSec = questions.reduce((s, q) => s + (q.estimatedTimeSec || DEFAULT_TIME_SEC[q.difficulty] || 60), 0);
  const diffCounts = questions.reduce((acc, q) => { acc[q.difficulty] = (acc[q.difficulty] || 0) + 1; return acc; }, {});
  const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))];
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  const negCount = questions.filter(q => (q.negativeMarks || 0) > 0).length;

  const handleEdit = async (q) => {
    setExpanded(q.id);
    const form = questionToForm(q);
    if (q.type === "coding") {
      const [sampleTests, hiddenTests] = await Promise.all([
        fetchContestQuestionSampleTests(contestId, q.id), fetchContestQuestionHiddenTests(contestId, q.id),
      ]);
      form.sampleTests = sampleTests.length ? sampleTests : form.sampleTests;
      form.hiddenTests = hiddenTests.length ? hiddenTests : form.hiddenTests;
    }
    setEditForm(form);
  };

  const handleSaveEdit = async (questionId) => {
    setSaving(true);
    try {
      const payload = questionFormToPayload(editForm);
      await updateContestQuestion(contestId, questionId, {
        type: payload.type, question: payload.question, options: payload.options, marks: payload.marks,
        negativeMarks: payload.negativeMarks, topic: payload.topic, category: payload.category,
        tags: payload.tags, difficulty: payload.difficulty, estimatedTimeSec: payload.estimatedTimeSec,
        hintText: payload.hintText,
      }, {
        correctOptionIds: payload.correctOptionIds, correctText: payload.correctText, explanation: payload.explanation,
      });
      if (payload.type === "coding") {
        await saveContestCodingTests(contestId, questionId, editForm.sampleTests, editForm.hiddenTests);
      }
      await refresh();
      setEditForm(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId) => {
    await deleteContestQuestion(contestId, questionId);
    await setContestQuestionCount(contestId, questions.length - 1);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CampusStat label="Total Questions" value={questions.length} color={CAMPUS.teal} />
        <CampusStat label="Total Marks" value={totalMarks} color={CAMPUS.gold} />
        <CampusStat label="Est. Time" value={`${Math.round(totalTimeSec / 60)} min`} color={CAMPUS.blue} />
        <CampusStat label="Negative Marking" value={negCount > 0 ? `${negCount} question${negCount === 1 ? "" : "s"}` : "None"} color={negCount > 0 ? CAMPUS.warn : CAMPUS.good} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(diffCounts).map(([d, c]) => (
          <CampusChip key={d} color={d === "hard" ? CAMPUS.bad : d === "medium" ? CAMPUS.warn : CAMPUS.good}>{d}: {c}</CampusChip>
        ))}
        {topics.map(t => <CampusChip key={t} color={CAMPUS.purple}>{t}</CampusChip>)}
        {categories.map(c => <CampusChip key={c} color={CAMPUS.blue}>{c}</CampusChip>)}
      </div>

      {questions.length === 0 ? (
        <CampusCard className="p-8 text-center">
          <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>No questions yet - go back and add at least one.</p>
        </CampusCard>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <button onClick={() => { if (expanded === q.id) { setExpanded(null); setEditForm(null); } else handleEdit(q); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left">
                <span className="text-[10px] font-mono w-5 flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{i + 1}</span>
                <span className="text-[12.5px] flex-1 truncate" style={{ color: CAMPUS.ink }}>{q.question}</span>
                <CampusChip color={CAMPUS.inkFaint}>{q.marks}m</CampusChip>
              </button>
              {expanded === q.id && editForm && (
                <div className="px-4 pb-4 space-y-3" style={{ background: CAMPUS.paper, borderTop: `1px solid ${CAMPUS.line}` }}>
                  <QuestionEditorForm qForm={editForm} setQForm={setEditForm} onSave={() => handleSaveEdit(q.id)} saving={saving} submitLabel="Save changes" />
                  <button onClick={() => handleDelete(q.id)} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
                    <Trash2 size={12} /> Delete question
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          ← Back
        </button>
        <button onClick={onNext} className="text-[13px] font-semibold px-5 py-2.5 rounded-lg" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          Next: Publish →
        </button>
      </div>
    </div>
  );
}

// ---------------- Step 7: Publish ----------------

function ContestPublishStep({ form, questions, publishing, onPublish, onBack }) {
  const { valid, errors } = validateContestForPublish(form, questions);
  return (
    <div className="space-y-4">
      <CampusCard className="p-5">
        <p className="text-[13px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Contest validation</p>
        {valid ? (
          <p className="flex items-center gap-2 text-[13px]" style={{ color: CAMPUS.good }}>
            <CheckCircle2 size={15} /> Everything checks out - this contest is ready to publish.
          </p>
        ) : (
          <div className="space-y-1.5">
            {errors.map((e, i) => (
              <p key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: CAMPUS.bad }}>
                <X size={13} className="mt-0.5 flex-shrink-0" /> {e}
              </p>
            ))}
          </div>
        )}
      </CampusCard>

      <CampusCard className="p-5 text-center">
        <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkSoft }}>
          Publishing goes live immediately - students at your institution will see this contest right away. No further approval needed.
        </p>
        <button onClick={onPublish} disabled={!valid || publishing}
          className="text-[14px] font-semibold px-6 py-3 rounded-xl disabled:opacity-40"
          style={{ background: CAMPUS.good, color: "#fff" }}>
          {publishing ? "Publishing..." : "Publish Contest"}
        </button>
      </CampusCard>

      <button onClick={onBack} className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
        ← Back
      </button>
    </div>
  );
}

// ---------------- Orchestrator ----------------

export function CampusContestStudio({ institutionId, contestId: initialContestId, onDone, onCancel }) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialContestId ? 4 : 0);
  const [maxStep, setMaxStep] = useState(initialContestId ? 6 : 0);
  const [form, setForm] = useState(blankContestForm());
  const [contestId, setContestId] = useState(initialContestId || null);
  const [questions, setQuestions] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(!!initialContestId);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const setContestType = (v) => setForm(p => ({ ...p, contestType: v }));
  const setTargetScope = (updater) => setForm(p => ({
    ...p, targetScope: typeof updater === "function" ? updater(p.targetScope || blankTargetScope()) : updater,
  }));

  useEffect(() => {
    if (!initialContestId) return;
    (async () => {
      const c = await fetchContest(initialContestId);
      if (c) {
        setForm({
          title: c.title || "", category: c.category || CONTEST_CATEGORIES[0], difficulty: c.difficulty || "Easy",
          bannerUrl: c.bannerUrl || "", description: c.description || "", rules: c.rules || "",
          eligibility: c.eligibility || "", organizer: c.organizer || "", tags: (c.tags || []).join(", "),
          contestType: c.contestType || "mixed", targetScope: c.targetScope || blankTargetScope(),
          registrationStart: toDatetimeLocal(c.registrationStart), registrationEnd: toDatetimeLocal(c.registrationEnd),
          contestStart: toDatetimeLocal(c.contestStart), contestEnd: toDatetimeLocal(c.contestEnd),
          graceMinutes: String(c.graceMinutes ?? 0),
          resultPublishAt: toDatetimeLocal(c.resultPublishAt), leaderboardPublishAt: toDatetimeLocal(c.leaderboardPublishAt),
          durationMinutes: String(c.durationMinutes || 60), prizeXp: String(c.prizeXp || 0), prizeCoins: String(c.prizeCoins || 0),
          prizeText: c.prizeText || "", status: c.status || "draft",
        });
      }
      const qs = await reloadContestQuestions(initialContestId);
      setQuestions(qs);
      setLoadingExisting(false);
    })();
  }, [initialContestId]);

  const goTo = (i) => { if (i <= maxStep) setStep(i); };
  const advance = (i) => { setStep(i); setMaxStep(m => Math.max(m, i)); };

  if (loadingExisting) {
    return (
      <CampusCard className="p-5 space-y-3">
        <CampusSkeleton variant="text" width="40%" height={20} />
        <CampusSkeleton variant="rect" height={44} />
        <CampusSkeleton variant="rect" height={44} />
      </CampusCard>
    );
  }

  // The one save point in the whole wizard - by Step 4 (Schedule), Basic
  // Info/Contest Type/Target Audience have all only ever touched local
  // `form` state, so this is the first moment every field createContest()
  // needs (title, contestStart/End) is actually known. Editing an existing
  // contest re-saves the full accumulated form here too, not just the
  // schedule fields, since earlier steps could have changed any of them.
  const handleScheduleNext = async () => {
    if (!form.title.trim() || !form.contestStart || !form.contestEnd) {
      setError("Title, contest start, and contest end are required.");
      return;
    }
    if ((parseInt(form.prizeXp) || 0) > 2000 || (parseInt(form.prizeCoins) || 0) > 2000) {
      setError("Prize XP and prize coins cannot exceed 2000.");
      return;
    }
    setSaving(true); setError("");
    try {
      if (contestId) {
        await updateContest(contestId, {
          title: form.title.trim(), category: form.category, difficulty: form.difficulty,
          bannerUrl: form.bannerUrl.trim(), description: form.description.trim(), rules: form.rules.trim(),
          eligibility: form.eligibility.trim(), organizer: form.organizer.trim(),
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          contestType: form.contestType || "mixed", targetScope: form.targetScope || blankTargetScope(),
          registrationStart: form.registrationStart ? new Date(form.registrationStart) : new Date(),
          registrationEnd: form.registrationEnd ? new Date(form.registrationEnd) : new Date(form.contestStart),
          contestStart: new Date(form.contestStart), contestEnd: new Date(form.contestEnd),
          graceMinutes: parseInt(form.graceMinutes) || 0,
          resultPublishAt: form.resultPublishAt ? new Date(form.resultPublishAt) : null,
          leaderboardPublishAt: form.leaderboardPublishAt ? new Date(form.leaderboardPublishAt) : null,
          durationMinutes: parseInt(form.durationMinutes) || 60,
          prizeXp: parseInt(form.prizeXp) || 0, prizeCoins: parseInt(form.prizeCoins) || 0,
          prizeText: form.prizeText.trim(),
        });
      } else {
        const id = await createContest(form, institutionId, user?.uid);
        setContestId(id);
      }
      advance(4);
    } catch (e) {
      setError(e.message || "Failed to save contest schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Goes through transitionContestLifecycle, not a raw status write - it
      // keeps lifecycleState in lockstep with status atomically (draft ->
      // registrationOpen), so a freshly-published contest never gets stuck
      // reporting lifecycleState "draft" while status already says
      // "published" - the dashboard's Lifecycle panel reads lifecycleState
      // as the source of truth for which transitions to offer next.
      await transitionContestLifecycle(contestId, "registrationOpen", user?.uid);
      onDone?.(contestId);
    } catch (e) {
      setError(e.message || "Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>
          {contestId ? "Edit Contest" : "Create Contest"}
        </h2>
        <button onClick={onCancel} className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
      </div>
      <p className="text-[12.5px] mb-5" style={{ color: CAMPUS.inkSoft }}>
        Fill in every step, then publish - it goes live for your institution instantly.
      </p>

      <StepIndicator step={step} maxStep={maxStep} onJump={goTo} />

      {step === 0 && (
        <BasicInfoStep form={form} setForm={setForm} onNext={() => advance(1)} />
      )}
      {step === 1 && (
        <ContestTypeStep contestType={form.contestType} setContestType={setContestType}
          onNext={() => advance(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && (
        <TargetAudienceStep institutionId={institutionId} scope={form.targetScope || blankTargetScope()} setScope={setTargetScope}
          onNext={() => advance(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <ContestScheduleStep form={form} setForm={setForm} error={error} saving={saving} onNext={handleScheduleNext} onBack={() => setStep(2)} />
      )}
      {step === 4 && contestId && (
        <ContestQuestionsStep institutionId={institutionId} contestId={contestId} questions={questions} setQuestions={setQuestions}
          onNext={() => advance(5)} onBack={() => setStep(3)} />
      )}
      {step === 5 && (
        <ContestPreviewStep contestId={contestId} questions={questions} setQuestions={setQuestions}
          onNext={() => advance(6)} onBack={() => setStep(4)} />
      )}
      {step === 6 && (
        <>
          <ContestPublishStep form={form} questions={questions} publishing={publishing} onPublish={handlePublish} onBack={() => setStep(5)} />
          {error && <p className="text-[12.5px] mt-3 text-center" style={{ color: CAMPUS.bad }}>{error}</p>}
        </>
      )}
    </div>
  );
}
