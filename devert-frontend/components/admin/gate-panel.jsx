"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Check, Copy, Download, Layers, Pencil,
  Plus, Sigma, Trash2, Upload, Library, Megaphone, ClipboardList, Sparkles,
} from "lucide-react";
import Dropdown from "@/components/dropdown";
import { LessonConceptField } from "@/components/admin/lesson-concept-field";
import { StringListField, McqListField } from "@/components/campus/campus-daily-learning-editor";
import { CODELAB_LANGUAGES } from "@/lib/codelab";
import { parseCSV } from "@/lib/contests";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import {
  validateLessonImport, runLessonImport, buildLessonTemplate,
  LESSON_IMPORT_FIELDS, LESSON_IMPORT_EXAMPLE,
} from "@/lib/gateLessonImport";
import {
  fetchPapers, savePaper, deletePaper, deletePaperContent,
  fetchSubjects, saveSubject, deleteSubject,
  fetchTopics, saveTopic, deleteTopic,
  GATE_DIFFICULTIES, GATE_PAPER_CATALOG,
} from "@/lib/gate";
import { GATE_SYLLABI, countSyllabusDocs, seedPaper } from "@/lib/gateSyllabus";
import {
  fetchPyqs, savePyq, deletePyq, importPyqsBatch, GATE_ORGANIZING_INSTITUTES,
} from "@/lib/gatePyq";
import {
  fetchTests, saveTest, deleteTest, fetchTestQuestions, addTestQuestion,
  updateTestQuestion, deleteTestQuestion, setTestQuestionStats,
  validateTestForPublish, fetchTestAnswerKeys, TEST_TYPES, GATE_QUESTION_TYPES,
  DEFAULT_RANK_ANCHORS,
} from "@/lib/gateTests";
import {
  fetchFormulas, saveFormula, deleteFormula, importFormulasBatch, FORMULA_KINDS,
  fetchResources, saveResource, deleteResource, RESOURCE_KINDS,
  fetchAnnouncements, saveAnnouncement, deleteAnnouncement,
} from "@/lib/gateLibrary";

// The GATE authoring surface. Mounted as sections inside /admin's existing CONTENT
// tab (see app/admin/page.jsx) rather than as a new top-level admin tab, per
// CLAUDE.md - a new admin capability belongs inside an existing tab family.
//
// Everything here is styled to match the surrounding admin panel exactly (dark
// chrome, mono labels, the same Input/Textarea/Dropdown vocabulary), because it
// lives inside those panels' own <Section> wrappers. Those primitives are
// re-declared locally rather than exported from app/admin/page.jsx: that file is
// a 6000-line page component, and importing from it would make this module depend
// on the page rather than the other way round.

// ---------------- local admin primitives (match app/admin/page.jsx) ----------------

function Input({ label, value, onChange, placeholder, type = "text", hint }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
      {hint && <p className="font-mono text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-y transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
    </div>
  );
}

function Btn({ children, onClick, disabled, color = "#00FFFF", solid = false, icon: Icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
      style={solid
        ? { background: color, color: "#000" }
        : { background: `${color}14`, color, border: `1px solid ${color}40` }}>
      {Icon && <Icon size={12} />}{children}
    </button>
  );
}

function StatusPill({ status }) {
  const published = status === "published";
  return (
    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
      style={{
        background: published ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)",
        color: published ? "#00FF41" : "rgba(255,255,255,0.4)",
      }}>
      {(status || "draft").toUpperCase()}
    </span>
  );
}

function Row({ children, onClick }) {
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 p-2.5 rounded flex-wrap ${onClick ? "cursor-pointer" : ""}`}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

function FormBox({ children }) {
  return (
    <div className="p-3 rounded space-y-2.5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

const STATUSES = ["draft", "published", "archived"];
const ACCENT = "#00E5A0";

function slug(text) {
  return (text || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// A paper picker every panel below shares - all of this content is
// paper-scoped, and nothing should be authorable without knowing which paper it
// belongs to.
function usePapers() {
  const [papers, setPapers] = useState(null);
  const [selected, setSelected] = useState("");
  const [nonce, setNonce] = useState(0);

  // No setState in the effect body (react-hooks/set-state-in-effect) - the
  // loading state is DERIVED from `papers` still being null rather than written
  // before every fetch. A manual reload therefore keeps the current rows on
  // screen while it refreshes, which is the right behaviour for a small admin
  // list anyway: flashing a spinner over five rows after every save is worse
  // than letting them update in place.
  useEffect(() => {
    let cancelled = false;
    fetchPapers({ includeUnpublished: true })
      .then(list => { if (!cancelled) setPapers(list); })
      .catch(() => { if (!cancelled) setPapers([]); });
    return () => { cancelled = true; };
  }, [nonce]);

  const list = papers || [];
  // The selected paper falls back to the first available one rather than being
  // written by an effect after load - so it is never briefly "" once papers exist.
  const paperId = (selected && list.some(p => p.id === selected)) ? selected : (list[0]?.id || "");

  return {
    papers: list, paperId, setPaperId: setSelected,
    loading: papers === null,
    reload: () => setNonce(n => n + 1),
  };
}

function PaperSelect({ papers, paperId, setPaperId }) {
  if (papers.length === 0) {
    return (
      <p className="font-mono text-xs" style={{ color: "#FF9500" }}>
        No GATE paper exists yet - create or seed one in GATE PAPERS first.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <p className="font-mono text-[10px] text-white/30 tracking-wider">PAPER</p>
      <Dropdown value={paperId} onChange={setPaperId} className="w-56"
        options={papers.map(p => p.id)} />
      <span className="font-mono text-[10px] text-white/25">
        {papers.find(p => p.id === paperId)?.name}
      </span>
    </div>
  );
}

// ============================================================
// 1. PAPERS
// ============================================================

function blankPaperForm() {
  return {
    code: "", name: "", fullName: "", description: "", order: 10, status: "draft",
    examDate: "", totalMarks: 100, durationMinutes: 180, questionCount: 65,
    syllabusVersion: "GATE 2027", candidateCount: "", rankAnchorsText: "",
  };
}

export function GatePapersPanel() {
  const { papers, loading, reload } = usePapers();
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankPaperForm());
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const startEdit = (p) => {
    setEditingId(p.id);
    setAdding(false);
    setForm({
      ...blankPaperForm(), ...p,
      examDate: p.examDate?.toDate
        ? p.examDate.toDate().toISOString().slice(0, 10)
        : (typeof p.examDate === "string" ? p.examDate.slice(0, 10) : ""),
      candidateCount: p.candidateCount ?? "",
      rankAnchorsText: (p.rankAnchors || []).map(a => `${a.marks},${a.air}`).join("\n"),
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = editingId || slug(form.code || form.name);
      // Anchors are entered as "marks,air" per line - a tiny format on purpose,
      // because this is a curve an admin pastes from a spreadsheet, not a form
      // to fill in eighteen times.
      const rankAnchors = form.rankAnchorsText
        .split("\n").map(l => l.split(",").map(s => s.trim()))
        .filter(parts => parts.length === 2 && Number(parts[0]) && Number(parts[1]))
        .map(([marks, air]) => ({ marks: Number(marks), air: Number(air) }));
      // rankAnchorsText is the raw textarea value, already parsed into
      // rankAnchors above - deliberately not persisted in its unparsed form.
      const rest = { ...form };
      delete rest.rankAnchorsText;
      await savePaper(id, {
        ...rest,
        order: Number(form.order) || 0,
        totalMarks: Number(form.totalMarks) || 100,
        durationMinutes: Number(form.durationMinutes) || 180,
        questionCount: Number(form.questionCount) || 65,
        candidateCount: Number(form.candidateCount) || null,
        examDate: form.examDate || null,
        ...(rankAnchors.length ? { rankAnchors } : {}),
      });
      setEditingId(null); setAdding(false); setForm(blankPaperForm());
      setFeedback({ ok: true, msg: `Saved ${id}.` });
      reload();
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async (id) => {
    const counts = countSyllabusDocs(GATE_SYLLABI[id]);
    if (!confirm(
      `Seed the official ${GATE_SYLLABI[id].name} syllabus?\n\n` +
      `This writes ${counts.total} documents (1 paper, ${counts.subjects} subjects, ${counts.topics} topics).\n\n` +
      "Safe to re-run: it merges, so it restores anything missing and refreshes syllabus fields " +
      "WITHOUT touching any lesson content you've already authored."
    )) return;
    setSeeding(id);
    setFeedback(null);
    try {
      const { written } = await seedPaper(id);
      setFeedback({ ok: true, msg: `Seeded ${GATE_SYLLABI[id].name}: ${written} documents written.` });
      reload();
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Seeding failed." });
    } finally {
      setSeeding(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(
      `Delete the paper "${id}", every subject and topic under it, and every student's progress for it?\n\n` +
      "Its question bank, tests, formulas and resources are NOT deleted - remove those separately if you want them gone."
    )) return;
    await deletePaper(id);
    reload();
  };

  const handleDeleteContent = async (id) => {
    if (!confirm(
      `Delete EVERY previous-year question, test, formula and resource tagged to "${id}"?\n\n` +
      "This cannot be undone and is not what you want unless you are deliberately clearing this paper's banks."
    )) return;
    await deletePaperContent(id);
    setFeedback({ ok: true, msg: `Cleared all content banks for ${id}.` });
  };

  const unseeded = Object.keys(GATE_SYLLABI).filter(id => !papers.some(p => p.id === id));

  return (
    <div className="space-y-4">
      {/* one-click official syllabus seeding */}
      <div className="p-3 rounded space-y-2.5"
        style={{ background: `${ACCENT}0D`, border: `1px solid ${ACCENT}30` }}>
        <div className="flex items-center gap-2">
          <Sparkles size={12} style={{ color: ACCENT }} />
          <p className="font-mono text-[11px]" style={{ color: ACCENT }}>SEED AN OFFICIAL SYLLABUS</p>
        </div>
        <p className="font-mono text-[10px] text-white/40 leading-relaxed">
          The GATE syllabus is transcribed in lib/gateSyllabus.js from the official paper documents. Seeding creates the
          paper plus its complete subject and topic tree, published and ready for lesson authoring. Re-seeding is safe and
          additive - it never overwrites content you have written.
        </p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(GATE_SYLLABI).map(([id, s]) => {
            const exists = papers.some(p => p.id === id);
            const counts = countSyllabusDocs(s);
            return (
              <Btn key={id} onClick={() => handleSeed(id)} disabled={seeding === id}
                color={exists ? "#FFD700" : ACCENT} icon={exists ? Copy : Plus}>
                {seeding === id ? "Seeding..." : `${exists ? "Re-seed" : "Seed"} ${s.name} (${counts.topics} topics)`}
              </Btn>
            );
          })}
        </div>
        {unseeded.length > 0 && (
          <p className="font-mono text-[10px] text-white/25">
            Not yet created: {unseeded.join(", ")}
          </p>
        )}
      </div>

      {feedback && (
        <p className="font-mono text-[11px]" style={{ color: feedback.ok ? "#00FF41" : "#FF5050" }}>{feedback.msg}</p>
      )}

      <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankPaperForm()); }} icon={Plus} color={ACCENT}>
        Add a paper manually
      </Btn>

      {(adding || editingId) && (
        <FormBox>
          <div className="grid grid-cols-3 gap-2.5">
            <Input label="CODE (e.g. CS, DA, EC)" value={form.code} onChange={v => setForm(p => ({ ...p, code: v }))} />
            <Input label="SHORT NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="GATE CS" />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
          </div>
          <Input label="FULL NAME" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))}
            placeholder="Computer Science and Information Technology"
            hint={`Known GATE codes: ${GATE_PAPER_CATALOG.map(p => p.code).join(", ")}`} />
          <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
          <div className="grid grid-cols-4 gap-2.5">
            <Input label="EXAM DATE" type="date" value={form.examDate} onChange={v => setForm(p => ({ ...p, examDate: v }))}
              hint="Blank = no countdown shown" />
            <Input label="TOTAL MARKS" type="number" value={form.totalMarks} onChange={v => setForm(p => ({ ...p, totalMarks: v }))} />
            <Input label="DURATION (MIN)" type="number" value={form.durationMinutes} onChange={v => setForm(p => ({ ...p, durationMinutes: v }))} />
            <Input label="QUESTION COUNT" type="number" value={form.questionCount} onChange={v => setForm(p => ({ ...p, questionCount: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="SYLLABUS VERSION" value={form.syllabusVersion} onChange={v => setForm(p => ({ ...p, syllabusVersion: v }))} />
            <Input label="CANDIDATE COUNT (for percentile)" type="number" value={form.candidateCount}
              onChange={v => setForm(p => ({ ...p, candidateCount: v }))} hint="Blank = 130,000 default" />
          </div>
          <Textarea label="RANK CURVE - one 'marks,AIR' pair per line" rows={5}
            value={form.rankAnchorsText} onChange={v => setForm(p => ({ ...p, rankAnchorsText: v }))}
            placeholder={DEFAULT_RANK_ANCHORS.slice(0, 4).map(a => `${a.marks},${a.air}`).join("\n")} />
          <p className="font-mono text-[10px] text-white/25 -mt-1.5 leading-relaxed">
            Leave blank to use the built-in generic curve (shaped like published GATE CS data). SET THIS for any paper other
            than CS - DA&apos;s candidate pool is an order of magnitude smaller, so the CS curve produces nonsense ranks for
            it. Students always see this figure labelled as an estimate, and the UI additionally flags when a paper is still
            on the default curve.
          </p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
          </div>
          <div className="flex gap-2">
            <Btn onClick={handleSave} disabled={saving || !form.name.trim()} solid color="#00FF41">
              {saving ? "Saving..." : "Save"}
            </Btn>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </FormBox>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : papers.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No papers yet - seed one above.</p>
      ) : (
        <div className="space-y-2">
          {papers.map(p => (
            <Row key={p.id}>
              <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{p.order}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="font-mono text-xs text-white/80">{p.name}</b>
                  <StatusPill status={p.status} />
                  {!p.rankAnchors?.length && (
                    <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>DEFAULT RANK CURVE</span>
                  )}
                  {!p.examDate && (
                    <span className="font-mono text-[10px] text-white/25">NO EXAM DATE</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-white/30">
                  {p.id} · {p.fullName} · {p.totalMarks || 100} marks / {p.durationMinutes || 180} min
                </span>
              </div>
              {GATE_SYLLABI[p.id] && (
                <Btn onClick={() => handleSeed(p.id)} disabled={seeding === p.id} color="#FFD700" icon={Copy}>
                  {seeding === p.id ? "..." : "Re-seed"}
                </Btn>
              )}
              <Btn onClick={() => startEdit(p)} color="#FFD700" icon={Pencil}>Edit</Btn>
              <Btn onClick={() => handleDeleteContent(p.id)} color="#FF9500" icon={AlertTriangle}>Clear banks</Btn>
              <Btn onClick={() => handleDelete(p.id)} color="#FF5050" icon={Trash2}>Delete</Btn>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 2. SUBJECTS + TOPICS (lesson authoring)
// ============================================================

function blankSubjectForm() {
  return { name: "", order: 10, status: "draft", weightageMarks: 0, estimatedHours: 0, description: "" };
}

export function GateSubjectsPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankSubjectForm());
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(null);

  const load = () => {
    if (!paperId) { setSubjects([]); return; }
    setLoading(true);
    fetchSubjects(paperId, { includeUnpublished: true }).then(setSubjects).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = editingId || slug(form.name);
      await saveSubject(paperId, id, {
        ...form,
        order: Number(form.order) || 0,
        weightageMarks: Number(form.weightageMarks) || 0,
        estimatedHours: Number(form.estimatedHours) || 0,
      });
      setEditingId(null); setAdding(false); setForm(blankSubjectForm());
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject, every topic in it, and scrub those topics from every student's completed list?")) return;
    await deleteSubject(paperId, id);
    load();
  };

  if (managing) {
    return <GateTopicsPanel paperId={paperId} subjectId={managing.id} subjectName={managing.name}
      onBack={() => { setManaging(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />
      {!paperId ? null : (
        <>
          <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankSubjectForm()); }} icon={Plus} color={ACCENT}>
            Add Subject
          </Btn>

          {(adding || editingId) && (
            <FormBox>
              <Input label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Operating System" />
              <div className="grid grid-cols-3 gap-2.5">
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
                <Input label="WEIGHTAGE (MARKS)" type="number" value={form.weightageMarks} onChange={v => setForm(p => ({ ...p, weightageMarks: v }))}
                  hint="Historical average - shown as approximate" />
                <Input label="ESTIMATED HOURS" type="number" value={form.estimatedHours} onChange={v => setForm(p => ({ ...p, estimatedHours: v }))} />
              </div>
              <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
              <div className="flex items-center gap-3">
                <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
                <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
              </div>
              <div className="flex gap-2">
                <Btn onClick={handleSave} disabled={saving || !form.name.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save"}</Btn>
                <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
              </div>
            </FormBox>
          )}

          {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
            : subjects.length === 0 ? <p className="font-mono text-xs text-white/30">No subjects - seed the official syllabus from GATE PAPERS, or add one manually.</p>
              : (
                <div className="space-y-2">
                  {subjects.map(s => (
                    <Row key={s.id}>
                      <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{s.order}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="font-mono text-xs text-white/80">{s.name}</b>
                          <StatusPill status={s.status} />
                        </div>
                        <span className="font-mono text-[10px] text-white/30">
                          {s.topicCount || 0} topics{s.weightageMarks ? ` · ~${s.weightageMarks} marks` : ""}{s.estimatedHours ? ` · ~${s.estimatedHours}h` : ""}
                        </span>
                      </div>
                      <Btn onClick={() => setManaging(s)} color={ACCENT} icon={Layers}>Topics</Btn>
                      <Btn onClick={() => { setEditingId(s.id); setAdding(false); setForm({ ...blankSubjectForm(), ...s }); }} color="#FFD700" icon={Pencil}>Edit</Btn>
                      <Btn onClick={() => handleDelete(s.id)} color="#FF5050" icon={Trash2}>Delete</Btn>
                    </Row>
                  ))}
                </div>
              )}
        </>
      )}
    </div>
  );
}

// Every field the student-facing lesson can render. The order here matches the
// order the lesson renders them in (see gate-subjects.jsx's GateTopicView), so an
// author writing top-to-bottom is building the lesson in reading order.
function blankTopicForm() {
  return {
    title: "", module: "", order: 0, status: "draft",
    difficulty: "Moderate", estimatedMinutes: 30,
    whatYoullLearn: [], prerequisites: [],
    concept: "", deepDive: "",
    codeExample: { language: "c", code: "", expectedOutput: "" },
    workedExamplesText: "", dryRun: "",
    analogies: [], commonMistakes: [], memoryTricks: [], formulas: [], shortcuts: [],
    pyqRelevance: "", interviewConnection: "", revisionSummary: "",
    shortNotes: { fiveMinute: "", oneMinute: "", nightBefore: "" },
    mcqs: [], numericalsText: "",
    xpReward: 25, coinReward: 10,
  };
}

// Worked examples and numericals are authored as delimited text rather than as
// nested repeater widgets. That is a deliberate trade: a repeater for a
// three-field-per-item list inside an already-long form is slow to use and easy
// to lose work in, whereas this format is paste-friendly and the parse is
// validated and previewed below the field.
const WORKED_EXAMPLE_HELP = 'One example per block, blocks separated by a line containing only "---". Within a block: first line = title, then "PROBLEM:" and "SOLUTION:" sections.';
const NUMERICALS_HELP = 'One per line: question | answerMin | answerMax | unit | solution. answerMax and unit may be blank (use "q | 4 | 4 | | text" for an exact answer).';

function parseWorkedExamples(text) {
  return (text || "").split(/^\s*---\s*$/m).map(block => {
    const lines = block.trim().split("\n");
    if (!lines.length || !block.trim()) return null;
    const title = lines[0].trim();
    const rest = lines.slice(1).join("\n");
    const pIdx = rest.search(/^PROBLEM:/mi);
    const sIdx = rest.search(/^SOLUTION:/mi);
    if (pIdx === -1 && sIdx === -1) return { title, problem: rest.trim(), solution: "" };
    const problem = sIdx > -1
      ? rest.slice(pIdx > -1 ? pIdx + 8 : 0, sIdx).trim()
      : rest.slice(pIdx + 8).trim();
    const solution = sIdx > -1 ? rest.slice(sIdx + 9).trim() : "";
    return { title, problem, solution };
  }).filter(Boolean);
}

function serializeWorkedExamples(items) {
  return (items || []).map(e =>
    [e.title, `PROBLEM:${e.problem ? `\n${e.problem}` : ""}`, `SOLUTION:${e.solution ? `\n${e.solution}` : ""}`].join("\n")
  ).join("\n---\n");
}

function parseNumericals(text) {
  return (text || "").split("\n").map(line => {
    if (!line.trim()) return null;
    const [question, min, max, unit, ...solution] = line.split("|").map(s => s.trim());
    if (!question || !Number.isFinite(Number(min))) return null;
    return {
      question,
      answerMin: Number(min),
      answerMax: Number.isFinite(Number(max)) && max !== "" ? Number(max) : Number(min),
      unit: unit || "",
      solution: solution.join("|").trim(),
    };
  }).filter(Boolean);
}

function serializeNumericals(items) {
  return (items || []).map(n =>
    [n.question, n.answerMin, n.answerMax, n.unit || "", n.solution || ""].join(" | ")
  ).join("\n");
}

function GateTopicsPanel({ paperId, subjectId, subjectName, onBack }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankTopicForm());
  const [saving, setSaving] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("");

  const load = () => {
    setLoading(true);
    fetchTopics(paperId, subjectId, { includeUnpublished: true }).then(setTopics).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId, subjectId]);

  const modules = useMemo(() => [...new Set(topics.map(t => t.module).filter(Boolean))], [topics]);
  const shown = moduleFilter ? topics.filter(t => t.module === moduleFilter) : topics;

  const startEdit = (t) => {
    setEditingId(t.id);
    setAdding(false);
    setForm({
      ...blankTopicForm(), ...t,
      codeExample: { ...blankTopicForm().codeExample, ...(t.codeExample || {}) },
      shortNotes: { ...blankTopicForm().shortNotes, ...(t.shortNotes || {}) },
      workedExamplesText: serializeWorkedExamples(t.workedExamples),
      numericalsText: serializeNumericals(t.numericals),
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || slug(form.title);
      const { workedExamplesText, numericalsText, ...rest } = form;
      await saveTopic(paperId, subjectId, id, {
        ...rest,
        order: Number(form.order) || 0,
        estimatedMinutes: Number(form.estimatedMinutes) || 0,
        xpReward: Number(form.xpReward) || 0,
        coinReward: Number(form.coinReward) || 0,
        workedExamples: parseWorkedExamples(workedExamplesText),
        numericals: parseNumericals(numericalsText),
      });
      // topicCount is denormalized onto the subject so the subject card can show
      // "12 topics" without reading the subcollection - refreshed from the real
      // count on every save rather than incremented, so it self-heals.
      const all = await fetchTopics(paperId, subjectId, { includeUnpublished: true });
      await saveSubject(paperId, subjectId, { topicCount: all.length });
      setEditingId(null); setAdding(false); setForm(blankTopicForm());
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic and scrub it from every student's completed list?")) return;
    await deleteTopic(paperId, subjectId, id);
    const all = await fetchTopics(paperId, subjectId, { includeUnpublished: true });
    await saveSubject(paperId, subjectId, { topicCount: all.length });
    load();
  };

  const parsedExamples = parseWorkedExamples(form.workedExamplesText);
  const parsedNumericals = parseNumericals(form.numericalsText);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40">
        <ArrowLeft size={11} /> Back to Subjects
      </button>
      <h4 className="font-mono text-sm" style={{ color: ACCENT }}>{subjectName} - Topics ({topics.length})</h4>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankTopicForm()); }} icon={Plus} color={ACCENT}>
          Add Topic
        </Btn>
        {modules.length > 0 && (
          <Dropdown value={moduleFilter} onChange={setModuleFilter} className="w-56"
            options={["", ...modules]} />
        )}
      </div>

      {(adding || editingId) && (
        <FormBox>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="CPU Scheduling" />
            <Input label="MODULE (the syllabus sub-heading this sits under)" value={form.module}
              onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="Scheduling" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={GATE_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="EST. MINUTES" type="number" value={form.estimatedMinutes} onChange={v => setForm(p => ({ ...p, estimatedMinutes: v }))} />
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">
              STATUS (published + no content = listed in the syllabus, marked &quot;not written yet&quot;)
            </p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
          </div>

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>1 - INTRODUCTION</p>
          <StringListField label="LEARNING OBJECTIVES" items={form.whatYoullLearn} onChange={v => setForm(p => ({ ...p, whatYoullLearn: v }))} />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>2 - THEORY</p>
          <LessonConceptField value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <Textarea label="GO DEEPER (exam-depth explanation, shown collapsed under the plain one)" rows={6}
            value={form.deepDive} onChange={v => setForm(p => ({ ...p, deepDive: v }))} />

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>3 - EXAMPLES &amp; WALKTHROUGH</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CODE EXAMPLE LANGUAGE</p>
              <Dropdown value={form.codeExample?.language || "c"} className="w-full"
                onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, language: v } }))}
                options={CODELAB_LANGUAGES.map(l => l.id)} />
            </div>
          </div>
          <Textarea label="CODE EXAMPLE (runnable in the lesson when execution is configured)" rows={5}
            value={form.codeExample?.code || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, code: v } }))} />
          <Textarea label="EXPECTED OUTPUT (fallback if live execution is unavailable)" rows={2}
            value={form.codeExample?.expectedOutput || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, expectedOutput: v } }))} />
          <Textarea label={`WORKED EXAMPLES - ${WORKED_EXAMPLE_HELP}`} rows={8}
            value={form.workedExamplesText} onChange={v => setForm(p => ({ ...p, workedExamplesText: v }))} />
          <p className="font-mono text-[10px] -mt-1.5" style={{ color: parsedExamples.length ? "#00FF41" : "rgba(255,255,255,0.25)" }}>
            {parsedExamples.length} example{parsedExamples.length === 1 ? "" : "s"} parsed
            {parsedExamples.length ? `: ${parsedExamples.map(e => e.title).join(", ")}` : ""}
          </p>
          <Textarea label="STEP-BY-STEP DRY RUN (supports the lesson block syntax - use a :::flow or :::timeline block for a trace)"
            rows={6} value={form.dryRun} onChange={v => setForm(p => ({ ...p, dryRun: v }))} />

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>4 - TEACHING AIDS</p>
          <StringListField label="REAL-WORLD ANALOGIES" items={form.analogies} onChange={v => setForm(p => ({ ...p, analogies: v }))} />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <StringListField label="MEMORY TRICKS" items={form.memoryTricks} onChange={v => setForm(p => ({ ...p, memoryTricks: v }))} />
          <StringListField label="FORMULA BOX (these also appear in the Formula Book automatically)" items={form.formulas} onChange={v => setForm(p => ({ ...p, formulas: v }))} />
          <StringListField label="EXAM SHORTCUTS" items={form.shortcuts} onChange={v => setForm(p => ({ ...p, shortcuts: v }))} />

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>5 - EXAM &amp; CAREER CONTEXT</p>
          <Textarea label="HOW GATE ASKS THIS (previous year relevance)" rows={3}
            value={form.pyqRelevance} onChange={v => setForm(p => ({ ...p, pyqRelevance: v }))} />
          <Textarea label="INTERVIEW CONNECTION" rows={2}
            value={form.interviewConnection} onChange={v => setForm(p => ({ ...p, interviewConnection: v }))} />

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>6 - PRACTICE</p>
          <McqListField label="PRACTICE MCQS (gate topic completion - a student must submit these to finish the topic)"
            items={form.mcqs} onChange={v => setForm(p => ({ ...p, mcqs: v }))} />
          <Textarea label={`NUMERICAL PROBLEMS - ${NUMERICALS_HELP}`} rows={5}
            value={form.numericalsText} onChange={v => setForm(p => ({ ...p, numericalsText: v }))} />
          <p className="font-mono text-[10px] -mt-1.5" style={{ color: parsedNumericals.length ? "#00FF41" : "rgba(255,255,255,0.25)" }}>
            {parsedNumericals.length} numerical{parsedNumericals.length === 1 ? "" : "s"} parsed
          </p>

          <p className="font-mono text-[10px] tracking-widest pt-2" style={{ color: ACCENT }}>7 - REVISION</p>
          <Textarea label="REVISION SUMMARY" rows={3} value={form.revisionSummary} onChange={v => setForm(p => ({ ...p, revisionSummary: v }))} />
          <Textarea label="SHORT NOTE - 5 MINUTE REVISION" rows={4}
            value={form.shortNotes?.fiveMinute || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, fiveMinute: v } }))} />
          <Textarea label="SHORT NOTE - 1 MINUTE REVISION" rows={2}
            value={form.shortNotes?.oneMinute || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, oneMinute: v } }))} />
          <Textarea label="SHORT NOTE - NIGHT BEFORE THE EXAM (the single highest-yield reminder)" rows={2}
            value={form.shortNotes?.nightBefore || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, nightBefore: v } }))} />

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: v }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: v }))} />
          </div>

          <div className="flex gap-2">
            <Btn onClick={handleSave} disabled={saving || !form.title.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save Topic"}</Btn>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </FormBox>
      )}

      {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
        : shown.length === 0 ? <p className="font-mono text-xs text-white/30">No topics.</p>
          : (
            <div className="space-y-1.5">
              {shown.map(t => {
                const hasLesson = !!(t.concept?.trim() || t.keyPoints?.length || t.formulas?.length);
                return (
                  <Row key={t.id}>
                    <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{t.order}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-white/80">{t.title}</span>
                      {t.module && <span className="font-mono text-[10px] text-white/30 ml-2">{t.module}</span>}
                    </div>
                    <StatusPill status={t.status} />
                    {!hasLesson && <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO LESSON</span>}
                    {t.shortNotes?.oneMinute && <span className="font-mono text-[10px]" style={{ color: "#00FFFF" }}>NOTES</span>}
                    {t.mcqs?.length > 0 && <span className="font-mono text-[10px] text-white/30">{t.mcqs.length} MCQ</span>}
                    <Btn onClick={() => startEdit(t)} color="#FFD700" icon={Pencil}>Edit</Btn>
                    <Btn onClick={() => handleDelete(t.id)} color="#FF5050" icon={Trash2}>Delete</Btn>
                  </Row>
                );
              })}
            </div>
          )}
    </div>
  );
}

// ============================================================
// 3. PREVIOUS YEAR QUESTIONS
// ============================================================

const PYQ_CSV_HEADER = "year,subjectid,topicid,questiontype,marks,question,optiona,optionb,optionc,optiond,correctanswer,natmin,natmax,difficulty,institute,solution,explanation,alternatesolution,timesavingtrick,whystudentserr,repeatgroup";

const PYQ_CSV_HELP = `Columns (header row required, names exact, order free):
${PYQ_CSV_HEADER}

questionType: mcq | msq | nat
marks: 1 or 2
correctAnswer: option letter(s) for mcq/msq (e.g. "B" or "A,C"); leave blank for nat
natMin / natMax: the accepted numeric range for nat (set both to the same value for an exact answer)
repeatGroup: a label shared by questions that are the same concept re-asked in different years`;

function pyqCsvTemplate() {
  const rows = [
    ["2024", "operating-system", "cpu-scheduling", "mcq", "2", "Consider three processes with burst times 4, 2 and 6 arriving at time 0. What is the average waiting time under SJF?", "3.33", "4.00", "4.67", "5.33", "A", "", "", "Moderate", "IISc Bangalore", "Order by burst: 2,4,6. Waiting times 0,2,6. Average = 8/3.", "SJF minimises average waiting time for a fixed set arriving together.", "", "Sum the prefix sums of the sorted burst times and divide by n.", "Students order by arrival instead of burst time.", ""],
    ["2023", "databases", "functional-dependencies-and-normal-forms", "nat", "2", "R(A,B,C,D) with F = {A->B, B->C}. How many candidate keys does R have?", "", "", "", "", "", "1", "1", "Hard", "IIT Kanpur", "A and D together determine everything; nothing smaller does. So AD is the only candidate key.", "Compute attribute closures.", "", "Any attribute not on the right of any FD must be in every key.", "Students forget D never appears on a right-hand side.", "candidate-keys"],
  ];
  return [PYQ_CSV_HEADER, ...rows.map(r =>
    r.map(f => (String(f).includes(",") || String(f).includes('"') ? `"${String(f).replace(/"/g, '""')}"` : f)).join(",")
  )].join("\n");
}

function csvRowsToPyqs(rows, paperId) {
  if (rows.length < 2) return { questions: [], errors: ["No data rows (need a header plus at least one question)."] };
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const col = (name) => header.indexOf(name);
  const missing = ["question", "questiontype"].filter(n => col(n) === -1);
  if (missing.length) return { questions: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };

  const letters = ["a", "b", "c", "d"];
  const questions = [];
  const errors = [];

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (name) => (col(name) !== -1 ? (r[col(name)] || "").trim() : "");
    const question = get("question");
    const questionType = get("questiontype").toLowerCase();
    if (!question) { errors.push(`Row ${line}: skipped - empty question.`); return; }
    if (!["mcq", "msq", "nat"].includes(questionType)) {
      errors.push(`Row ${line}: skipped - questionType must be mcq, msq or nat (got "${questionType}").`);
      return;
    }

    const base = {
      paperId,
      year: Number(get("year")) || null,
      subjectId: get("subjectid"),
      topicId: get("topicid"),
      questionType,
      marks: Number(get("marks")) === 2 ? 2 : 1,
      question,
      difficulty: get("difficulty") || "Moderate",
      organizingInstitute: get("institute"),
      solution: get("solution"),
      explanation: get("explanation"),
      alternateSolution: get("alternatesolution"),
      timeSavingTrick: get("timesavingtrick"),
      whyStudentsErr: get("whystudentserr"),
      repeatGroup: get("repeatgroup"),
      isRepeated: !!get("repeatgroup"),
      status: "published",
      order: line,
    };

    if (questionType === "nat") {
      const min = Number(get("natmin"));
      const max = get("natmax") === "" ? min : Number(get("natmax"));
      if (!Number.isFinite(min)) { errors.push(`Row ${line}: skipped - nat needs a numeric natMin.`); return; }
      questions.push({ ...base, options: [], correctOptionIds: [], natMin: min, natMax: Number.isFinite(max) ? max : min });
      return;
    }

    const options = letters
      .map(l => ({ id: l, text: get(`option${l}`) }))
      .filter(o => o.text);
    if (options.length < 2) { errors.push(`Row ${line}: skipped - needs at least 2 options.`); return; }
    const correctOptionIds = get("correctanswer").split(",").map(s => s.trim().toLowerCase())
      .filter(l => options.some(o => o.id === l));
    if (!correctOptionIds.length) { errors.push(`Row ${line}: skipped - correctAnswer must reference option letters A-D.`); return; }
    if (questionType === "mcq" && correctOptionIds.length !== 1) {
      errors.push(`Row ${line}: skipped - mcq needs exactly one correct option (use msq for several).`);
      return;
    }
    questions.push({ ...base, options, correctOptionIds, natMin: null, natMax: null });
  });

  return { questions, errors };
}

function blankPyqForm() {
  return {
    year: "", subjectId: "", topicId: "", questionType: "mcq", marks: 1,
    question: "", optionsText: "", correctAnswer: "", natMin: "", natMax: "",
    difficulty: "Moderate", organizingInstitute: "", status: "published",
    solution: "", explanation: "", alternateSolution: "", timeSavingTrick: "",
    whyStudentsErr: "", relatedConcepts: [], repeatGroup: "", order: 0,
  };
}

export function GatePyqPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankPyqForm());
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [yearFilter, setYearFilter] = useState("");

  const load = () => {
    if (!paperId) { setPyqs([]); return; }
    setLoading(true);
    fetchPyqs(paperId, { includeUnpublished: true }).then(setPyqs).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const years = useMemo(() => [...new Set(pyqs.map(p => p.year).filter(Boolean))].sort((a, b) => b - a), [pyqs]);
  const shown = yearFilter ? pyqs.filter(p => String(p.year) === yearFilter) : pyqs;

  const startEdit = (p) => {
    setEditingId(p.id); setAdding(false);
    setForm({
      ...blankPyqForm(), ...p,
      optionsText: (p.options || []).map(o => o.text).join("\n"),
      correctAnswer: (p.correctOptionIds || []).join(","),
      natMin: p.natMin ?? "", natMax: p.natMax ?? "",
    });
  };

  const handleSave = async () => {
    if (!form.question.trim()) return;
    setSaving(true);
    try {
      const { optionsText, correctAnswer, ...rest } = form;
      const letters = ["a", "b", "c", "d", "e", "f"];
      const options = form.questionType === "nat" ? []
        : optionsText.split("\n").map(t => t.trim()).filter(Boolean).map((text, i) => ({ id: letters[i], text }));
      const correctOptionIds = form.questionType === "nat" ? []
        : correctAnswer.split(",").map(s => s.trim().toLowerCase()).filter(l => options.some(o => o.id === l));
      await savePyq(editingId, {
        ...rest, paperId, options, correctOptionIds,
        natMin: form.questionType === "nat" ? Number(form.natMin) : null,
        natMax: form.questionType === "nat" ? (form.natMax === "" ? Number(form.natMin) : Number(form.natMax)) : null,
        isRepeated: !!form.repeatGroup,
        order: Number(form.order) || 0,
      });
      setEditingId(null); setAdding(false); setForm(blankPyqForm());
      load();
    } finally { setSaving(false); }
  };

  const runImport = async () => {
    const { questions, errors } = csvRowsToPyqs(parseCSV(importText), paperId);
    setImportResult({ questions, errors });
    if (!questions.length) return;
    setImporting(true);
    try {
      await importPyqsBatch(questions);
      setImportResult({ questions, errors, done: true });
      setImportText("");
      load();
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([pyqCsvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gate-pyq-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />
      {!paperId ? null : (
        <>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankPyqForm()); }} icon={Plus} color={ACCENT}>
              Add Question
            </Btn>
            <Btn onClick={downloadTemplate} icon={Download} color="#00FFFF">CSV template</Btn>
            {years.length > 0 && <Dropdown value={yearFilter} onChange={setYearFilter} className="w-32" options={["", ...years.map(String)]} />}
            <span className="font-mono text-[10px] text-white/30">{pyqs.length} in the bank</span>
          </div>

          {/* bulk import */}
          <FormBox>
            <div className="flex items-center gap-2">
              <Upload size={12} style={{ color: "#00FFFF" }} />
              <p className="font-mono text-[11px]" style={{ color: "#00FFFF" }}>BULK IMPORT</p>
            </div>
            <pre className="font-mono text-[9.5px] text-white/30 whitespace-pre-wrap leading-relaxed">{PYQ_CSV_HELP}</pre>
            <Textarea label="PASTE CSV (or tab-separated from a spreadsheet)" rows={6}
              value={importText} onChange={setImportText} />
            <div className="flex gap-2">
              <Btn onClick={runImport} disabled={importing || !importText.trim()} solid color="#00FFFF">
                {importing ? "Importing..." : "Validate & import"}
              </Btn>
            </div>
            {importResult && (
              <div className="space-y-1">
                <p className="font-mono text-[10.5px]" style={{ color: importResult.done ? "#00FF41" : "#FFD700" }}>
                  {importResult.done
                    ? `Imported ${importResult.questions.length} question(s).`
                    : `${importResult.questions.length} valid row(s) ready.`}
                </p>
                {importResult.errors.map((e, i) => (
                  <p key={i} className="font-mono text-[10px]" style={{ color: "#FF9500" }}>{e}</p>
                ))}
              </div>
            )}
          </FormBox>

          {(adding || editingId) && (
            <FormBox>
              <div className="grid grid-cols-4 gap-2.5">
                <Input label="YEAR" type="number" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} />
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">TYPE</p>
                  <Dropdown value={form.questionType} onChange={v => setForm(p => ({ ...p, questionType: v }))}
                    options={GATE_QUESTION_TYPES.map(t => t.key)} className="w-full" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">MARKS</p>
                  <Dropdown value={String(form.marks)} onChange={v => setForm(p => ({ ...p, marks: Number(v) }))}
                    options={["1", "2"]} className="w-full" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
                  <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
                    options={GATE_DIFFICULTIES} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Input label="SUBJECT ID" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))}
                  placeholder="operating-system" hint="Must match a subject id under this paper" />
                <Input label="TOPIC ID" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))}
                  placeholder="cpu-scheduling" hint="Drives topic tagging + per-topic analytics" />
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">ORGANIZING INSTITUTE</p>
                  <Dropdown value={form.organizingInstitute} onChange={v => setForm(p => ({ ...p, organizingInstitute: v }))}
                    options={["", ...GATE_ORGANIZING_INSTITUTES]} className="w-full" />
                </div>
              </div>
              <Textarea label="QUESTION" rows={4} value={form.question} onChange={v => setForm(p => ({ ...p, question: v }))} />
              {form.questionType === "nat" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <Input label="ACCEPTED MIN" type="number" value={form.natMin} onChange={v => setForm(p => ({ ...p, natMin: v }))} />
                  <Input label="ACCEPTED MAX (blank = same as min)" type="number" value={form.natMax} onChange={v => setForm(p => ({ ...p, natMax: v }))} />
                </div>
              ) : (
                <>
                  <Textarea label="OPTIONS - one per line (become A, B, C, D...)" rows={4}
                    value={form.optionsText} onChange={v => setForm(p => ({ ...p, optionsText: v }))} />
                  <Input label="CORRECT OPTION LETTER(S), comma-separated" value={form.correctAnswer}
                    onChange={v => setForm(p => ({ ...p, correctAnswer: v }))} placeholder="b   or   a,c for MSQ" />
                </>
              )}
              <Textarea label="SOLUTION (the working - supports lesson block syntax)" rows={4}
                value={form.solution} onChange={v => setForm(p => ({ ...p, solution: v }))} />
              <Textarea label="EXPLANATION (why the answer is what it is)" rows={3}
                value={form.explanation} onChange={v => setForm(p => ({ ...p, explanation: v }))} />
              <Textarea label="ALTERNATE APPROACH" rows={2}
                value={form.alternateSolution} onChange={v => setForm(p => ({ ...p, alternateSolution: v }))} />
              <Textarea label="TIME-SAVING TRICK" rows={2}
                value={form.timeSavingTrick} onChange={v => setForm(p => ({ ...p, timeSavingTrick: v }))} />
              <Textarea label="WHY STUDENTS GET THIS WRONG" rows={2}
                value={form.whyStudentsErr} onChange={v => setForm(p => ({ ...p, whyStudentsErr: v }))} />
              <StringListField label="RELATED CONCEPTS" items={form.relatedConcepts} onChange={v => setForm(p => ({ ...p, relatedConcepts: v }))} />
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="REPEAT GROUP (a shared label marks these as the same concept re-asked)"
                  value={form.repeatGroup} onChange={v => setForm(p => ({ ...p, repeatGroup: v }))} />
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
                  <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Btn onClick={handleSave} disabled={saving || !form.question.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save"}</Btn>
                <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
              </div>
            </FormBox>
          )}

          {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
            : shown.length === 0 ? <p className="font-mono text-xs text-white/30">No questions yet.</p>
              : (
                <div className="space-y-1.5">
                  {shown.slice(0, 200).map(p => (
                    <Row key={p.id}>
                      <span className="font-mono text-[10px] text-white/25 w-10 flex-shrink-0">{p.year || "-"}</span>
                      <span className="font-mono text-[10px] w-10 flex-shrink-0" style={{ color: "#00FFFF" }}>
                        {(p.questionType || "").toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-white/25 w-6 flex-shrink-0">{p.marks}M</span>
                      <span className="font-mono text-xs text-white/70 flex-1 min-w-0 truncate">{p.question}</span>
                      {p.repeatGroup && <span className="font-mono text-[10px]" style={{ color: "#C77DFF" }}>REPEAT</span>}
                      {!p.solution?.trim() && !p.explanation?.trim() && (
                        <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO SOLUTION</span>
                      )}
                      <StatusPill status={p.status} />
                      <Btn onClick={() => startEdit(p)} color="#FFD700" icon={Pencil}>Edit</Btn>
                      <Btn onClick={async () => { if (confirm("Delete this question?")) { await deletePyq(p.id); load(); } }} color="#FF5050" icon={Trash2}>Del</Btn>
                    </Row>
                  ))}
                  {shown.length > 200 && (
                    <p className="font-mono text-[10px] text-white/25">
                      Showing the first 200 of {shown.length} - filter by year to narrow.
                    </p>
                  )}
                </div>
              )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 4. TESTS
// ============================================================

function blankTestForm() {
  return {
    title: "", description: "", testType: "full", durationMinutes: 180,
    status: "draft", order: 0, sourceYear: "", instructions: "",
    subjectIdsText: "", topicIdsText: "",
  };
}

export function GateTestsPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankTestForm());
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(null);

  const load = () => {
    if (!paperId) { setTests([]); return; }
    setLoading(true);
    fetchTests(paperId, { includeUnpublished: true }).then(setTests).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { subjectIdsText, topicIdsText, ...rest } = form;
      await saveTest(editingId, {
        ...rest, paperId,
        durationMinutes: Number(form.durationMinutes) || 60,
        order: Number(form.order) || 0,
        sourceYear: Number(form.sourceYear) || null,
        subjectIds: subjectIdsText.split(",").map(s => s.trim()).filter(Boolean),
        topicIds: topicIdsText.split(",").map(s => s.trim()).filter(Boolean),
      });
      setEditingId(null); setAdding(false); setForm(blankTestForm());
      load();
    } finally { setSaving(false); }
  };

  if (managing) {
    return <GateTestQuestionsPanel test={managing} onBack={() => { setManaging(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />
      {!paperId ? null : (
        <>
          <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankTestForm()); }} icon={Plus} color={ACCENT}>
            Add Test
          </Btn>

          {(adding || editingId) && (
            <FormBox>
              <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Full Length Mock 1" />
              <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">TYPE</p>
                  <Dropdown value={form.testType} onChange={v => setForm(p => ({ ...p, testType: v }))}
                    options={TEST_TYPES.map(t => t.key)} className="w-full" />
                </div>
                <Input label="DURATION (MIN)" type="number" value={form.durationMinutes} onChange={v => setForm(p => ({ ...p, durationMinutes: v }))} />
                <Input label="SOURCE YEAR (for PYQ mocks)" type="number" value={form.sourceYear} onChange={v => setForm(p => ({ ...p, sourceYear: v }))} />
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
              </div>
              <p className="font-mono text-[10px] text-white/25 leading-relaxed">
                {TEST_TYPES.find(t => t.key === form.testType)?.detail} Marking is always GATE&apos;s own scheme
                (MCQ: -1/3 on 1-mark, -2/3 on 2-mark; MSQ and NAT: no negative marking) and is not configurable per test.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="SUBJECT IDS (comma-separated - scopes a subject test)" value={form.subjectIdsText}
                  onChange={v => setForm(p => ({ ...p, subjectIdsText: v }))} />
                <Input label="TOPIC IDS (comma-separated - a topic test appears on those topics' lessons)"
                  value={form.topicIdsText} onChange={v => setForm(p => ({ ...p, topicIdsText: v }))} />
              </div>
              <Textarea label="INSTRUCTIONS SHOWN BEFORE STARTING" rows={3}
                value={form.instructions} onChange={v => setForm(p => ({ ...p, instructions: v }))} />
              <div className="flex items-center gap-3">
                <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
                <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
              </div>
              <div className="flex gap-2">
                <Btn onClick={handleSave} disabled={saving || !form.title.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save"}</Btn>
                <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
              </div>
            </FormBox>
          )}

          {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
            : tests.length === 0 ? <p className="font-mono text-xs text-white/30">No tests yet.</p>
              : (
                <div className="space-y-2">
                  {tests.map(t => (
                    <Row key={t.id}>
                      <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{t.order}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="font-mono text-xs text-white/80">{t.title}</b>
                          <StatusPill status={t.status} />
                          <span className="font-mono text-[10px]" style={{ color: "#00FFFF" }}>{t.testType?.toUpperCase()}</span>
                          {!t.questionCount && <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO QUESTIONS</span>}
                        </div>
                        <span className="font-mono text-[10px] text-white/30">
                          {t.questionCount || 0} questions · {t.totalMarks || 0} marks · {t.durationMinutes} min
                        </span>
                      </div>
                      <Btn onClick={() => setManaging(t)} color={ACCENT} icon={ClipboardList}>Questions</Btn>
                      <Btn color="#FFD700" icon={Pencil}
                        onClick={() => {
                          setEditingId(t.id); setAdding(false);
                          setForm({
                            ...blankTestForm(), ...t,
                            sourceYear: t.sourceYear ?? "",
                            subjectIdsText: (t.subjectIds || []).join(", "),
                            topicIdsText: (t.topicIds || []).join(", "),
                          });
                        }}>Edit</Btn>
                      <Btn color="#FF5050" icon={Trash2}
                        onClick={async () => {
                          if (!confirm("Delete this test, its questions and its answer keys? Student attempts are kept.")) return;
                          await deleteTest(t.id); load();
                        }}>Delete</Btn>
                    </Row>
                  ))}
                </div>
              )}
        </>
      )}
    </div>
  );
}

function blankTestQuestionForm() {
  return {
    questionType: "mcq", marks: 1, question: "", optionsText: "", correctAnswer: "",
    natMin: "", natMax: "", natUnit: "", subjectId: "", topicId: "",
    difficulty: "Moderate", codeSnippet: "", imageUrl: "", order: 0,
    solution: "", explanation: "", alternateSolution: "", timeSavingTrick: "",
    whyStudentsErr: "", relatedConcepts: [],
  };
}

function GateTestQuestionsPanel({ test, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankTestQuestionForm());
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [qs, ks] = await Promise.all([
        fetchTestQuestions(test.id),
        // An admin can always read answer keys (firestore.rules' isAdmin()
        // branch) - the submitted-attempt gate applies to students only.
        fetchTestAnswerKeys(test.id).catch(() => ({})),
      ]);
      setQuestions(qs);
      setKeys(ks);
    } finally { setLoading(false); }
  };
  useEffect(() => { load();   }, [test.id]);

  const buildPayload = () => {
    const letters = ["a", "b", "c", "d", "e", "f"];
    const options = form.questionType === "nat" ? []
      : form.optionsText.split("\n").map(t => t.trim()).filter(Boolean).map((text, i) => ({ id: letters[i], text }));
    const correctOptionIds = form.questionType === "nat" ? []
      : form.correctAnswer.split(",").map(s => s.trim().toLowerCase()).filter(l => options.some(o => o.id === l));
    return { ...form, options, correctOptionIds, marks: Number(form.marks) === 2 ? 2 : 1 };
  };

  const handleSave = async () => {
    if (!form.question.trim()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const order = Number(form.order) || (questions.length + 1);
      if (editingId) await updateTestQuestion(test.id, editingId, payload, order);
      else await addTestQuestion(test.id, payload, order);
      const all = await fetchTestQuestions(test.id);
      await setTestQuestionStats(test.id, all);
      setEditingId(null); setAdding(false); setForm(blankTestQuestionForm());
      load();
    } finally { setSaving(false); }
  };

  const runValidation = () => setValidation(validateTestForPublish(test, questions, keys));

  const runImport = async () => {
    const { questions: rows, errors } = csvRowsToPyqs(parseCSV(importText), test.paperId);
    setImportResult({ count: rows.length, errors });
    if (!rows.length) return;
    setImporting(true);
    try {
      // The PYQ CSV shape is reused verbatim so an admin learns ONE import
      // format for the whole module. Rows are mapped onto the question/answerKey
      // split a test needs, which the flat PYQ collection doesn't have.
      let order = questions.length;
      for (const r of rows) {
        order++;
        await addTestQuestion(test.id, {
          questionType: r.questionType, marks: r.marks, question: r.question,
          options: r.options, correctOptionIds: r.correctOptionIds,
          natMin: r.natMin, natMax: r.natMax,
          subjectId: r.subjectId, topicId: r.topicId, difficulty: r.difficulty,
          solution: r.solution, explanation: r.explanation,
          alternateSolution: r.alternateSolution, timeSavingTrick: r.timeSavingTrick,
          whyStudentsErr: r.whyStudentsErr,
        }, order);
      }
      const all = await fetchTestQuestions(test.id);
      await setTestQuestionStats(test.id, all);
      setImportResult({ count: rows.length, errors, done: true });
      setImportText("");
      load();
    } finally { setImporting(false); }
  };

  const totalMarks = questions.reduce((n, q) => n + (q.marks || 1), 0);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40">
        <ArrowLeft size={11} /> Back to Tests
      </button>
      <h4 className="font-mono text-sm" style={{ color: ACCENT }}>
        {test.title} - {questions.length} questions, {totalMarks} marks
      </h4>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Btn onClick={() => { setAdding(true); setEditingId(null); setForm({ ...blankTestQuestionForm(), order: questions.length + 1 }); }} icon={Plus} color={ACCENT}>
          Add Question
        </Btn>
        <Btn onClick={runValidation} icon={Check} color="#FFD700">Validate for publishing</Btn>
      </div>

      {validation && (
        <div className="p-3 rounded space-y-1"
          style={{
            background: validation.valid ? "rgba(0,255,65,0.06)" : "rgba(255,80,80,0.06)",
            border: `1px solid ${validation.valid ? "rgba(0,255,65,0.3)" : "rgba(255,80,80,0.3)"}`,
          }}>
          <p className="font-mono text-[11px]" style={{ color: validation.valid ? "#00FF41" : "#FF5050" }}>
            {validation.valid ? "Ready to publish - every question has options, a marked answer, valid marks and a solution."
              : `${validation.errors.length} problem(s) block publishing:`}
          </p>
          {validation.errors.map((e, i) => (
            <p key={i} className="font-mono text-[10px] text-white/50">{e}</p>
          ))}
        </div>
      )}

      <FormBox>
        <div className="flex items-center gap-2">
          <Upload size={12} style={{ color: "#00FFFF" }} />
          <p className="font-mono text-[11px]" style={{ color: "#00FFFF" }}>BULK IMPORT (same CSV format as the PYQ bank)</p>
        </div>
        <Textarea label="PASTE CSV" rows={5} value={importText} onChange={setImportText} />
        <Btn onClick={runImport} disabled={importing || !importText.trim()} solid color="#00FFFF">
          {importing ? "Importing..." : "Validate & import"}
        </Btn>
        {importResult && (
          <div className="space-y-1">
            <p className="font-mono text-[10.5px]" style={{ color: importResult.done ? "#00FF41" : "#FFD700" }}>
              {importResult.done ? `Imported ${importResult.count} question(s).` : `${importResult.count} valid row(s) ready.`}
            </p>
            {importResult.errors.map((e, i) => <p key={i} className="font-mono text-[10px]" style={{ color: "#FF9500" }}>{e}</p>)}
          </div>
        )}
      </FormBox>

      {(adding || editingId) && (
        <FormBox>
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">TYPE</p>
              <Dropdown value={form.questionType} onChange={v => setForm(p => ({ ...p, questionType: v }))}
                options={GATE_QUESTION_TYPES.map(t => t.key)} className="w-full" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">MARKS</p>
              <Dropdown value={String(form.marks)} onChange={v => setForm(p => ({ ...p, marks: Number(v) }))} options={["1", "2"]} className="w-full" />
            </div>
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={GATE_DIFFICULTIES} className="w-full" />
            </div>
          </div>
          <p className="font-mono text-[10px] text-white/25">
            {GATE_QUESTION_TYPES.find(t => t.key === form.questionType)?.detail}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="SUBJECT ID (drives subject-wise analysis)" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
            <Input label="TOPIC ID (drives weak-topic detection)" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))} />
          </div>
          <Textarea label="QUESTION" rows={4} value={form.question} onChange={v => setForm(p => ({ ...p, question: v }))} />
          <Textarea label="CODE SNIPPET (optional, rendered monospaced)" rows={4} value={form.codeSnippet} onChange={v => setForm(p => ({ ...p, codeSnippet: v }))} />
          <Input label="IMAGE URL (optional - for circuit/graph figures)" value={form.imageUrl} onChange={v => setForm(p => ({ ...p, imageUrl: v }))} />
          {form.questionType === "nat" ? (
            <div className="grid grid-cols-3 gap-2.5">
              <Input label="ACCEPTED MIN" type="number" value={form.natMin} onChange={v => setForm(p => ({ ...p, natMin: v }))} />
              <Input label="ACCEPTED MAX" type="number" value={form.natMax} onChange={v => setForm(p => ({ ...p, natMax: v }))} />
              <Input label="UNIT (optional)" value={form.natUnit} onChange={v => setForm(p => ({ ...p, natUnit: v }))} />
            </div>
          ) : (
            <>
              <Textarea label="OPTIONS - one per line" rows={4} value={form.optionsText} onChange={v => setForm(p => ({ ...p, optionsText: v }))} />
              <Input label="CORRECT LETTER(S)" value={form.correctAnswer} onChange={v => setForm(p => ({ ...p, correctAnswer: v }))} placeholder="b   or   a,c" />
            </>
          )}
          <Textarea label="SOLUTION" rows={4} value={form.solution} onChange={v => setForm(p => ({ ...p, solution: v }))} />
          <Textarea label="EXPLANATION" rows={3} value={form.explanation} onChange={v => setForm(p => ({ ...p, explanation: v }))} />
          <Textarea label="ALTERNATE APPROACH" rows={2} value={form.alternateSolution} onChange={v => setForm(p => ({ ...p, alternateSolution: v }))} />
          <Textarea label="TIME-SAVING TRICK" rows={2} value={form.timeSavingTrick} onChange={v => setForm(p => ({ ...p, timeSavingTrick: v }))} />
          <Textarea label="WHY STUDENTS GET THIS WRONG" rows={2} value={form.whyStudentsErr} onChange={v => setForm(p => ({ ...p, whyStudentsErr: v }))} />
          <StringListField label="RELATED CONCEPTS" items={form.relatedConcepts} onChange={v => setForm(p => ({ ...p, relatedConcepts: v }))} />
          <div className="flex gap-2">
            <Btn onClick={handleSave} disabled={saving || !form.question.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save"}</Btn>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </FormBox>
      )}

      {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
        : questions.length === 0 ? <p className="font-mono text-xs text-white/30">No questions yet.</p>
          : (
            <div className="space-y-1.5">
              {questions.map((q, i) => {
                const key = keys[q.id];
                return (
                  <Row key={q.id}>
                    <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">Q{i + 1}</span>
                    <span className="font-mono text-[10px] w-10 flex-shrink-0" style={{ color: "#00FFFF" }}>{q.questionType?.toUpperCase()}</span>
                    <span className="font-mono text-[10px] text-white/25 w-6 flex-shrink-0">{q.marks}M</span>
                    <span className="font-mono text-xs text-white/70 flex-1 min-w-0 truncate">{q.question}</span>
                    {!key && <span className="font-mono text-[10px]" style={{ color: "#FF5050" }}>NO KEY</span>}
                    {key && !key.explanation?.trim() && !key.solution?.trim() && (
                      <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO SOLUTION</span>
                    )}
                    <Btn color="#FFD700" icon={Pencil}
                      onClick={() => {
                        setEditingId(q.id); setAdding(false);
                        setForm({
                          ...blankTestQuestionForm(), ...q, ...(key || {}),
                          optionsText: (q.options || []).map(o => o.text).join("\n"),
                          correctAnswer: (key?.correctOptionIds || []).join(","),
                          natMin: key?.natMin ?? "", natMax: key?.natMax ?? "",
                        });
                      }}>Edit</Btn>
                    <Btn color="#FF5050" icon={Trash2}
                      onClick={async () => {
                        if (!confirm("Delete this question and its answer key?")) return;
                        await deleteTestQuestion(test.id, q.id);
                        const all = await fetchTestQuestions(test.id);
                        await setTestQuestionStats(test.id, all);
                        load();
                      }}>Del</Btn>
                  </Row>
                );
              })}
            </div>
          )}
    </div>
  );
}

// ============================================================
// 5. FORMULA BOOK
// ============================================================

const FORMULA_CSV_HEADER = "kind,subjectid,topicid,title,expression,statement,notes,memorytrick,tags";

function blankFormulaForm() {
  return {
    kind: "formula", subjectId: "", topicId: "", title: "", expression: "",
    statement: "", notes: "", memoryTrick: "", tags: [], order: 0, status: "published",
  };
}

export function GateFormulaPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankFormulaForm());
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const load = () => {
    if (!paperId) { setFormulas([]); return; }
    setLoading(true);
    fetchFormulas(paperId, { includeUnpublished: true }).then(setFormulas).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await saveFormula(editingId, { ...form, paperId, order: Number(form.order) || 0 });
      setEditingId(null); setAdding(false); setForm(blankFormulaForm());
      load();
    } finally { setSaving(false); }
  };

  const runImport = async () => {
    const rows = parseCSV(importText);
    if (rows.length < 2) { setImportMsg("Need a header row plus at least one data row."); return; }
    const header = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
    const col = (n) => header.indexOf(n);
    if (col("title") === -1) { setImportMsg('Missing required column "title".'); return; }
    const parsed = rows.slice(1).map((r, i) => {
      const get = (n) => (col(n) !== -1 ? (r[col(n)] || "").trim() : "");
      if (!get("title")) return null;
      return {
        paperId, status: "published", order: i + 1,
        kind: FORMULA_KINDS.some(k => k.key === get("kind")) ? get("kind") : "formula",
        subjectId: get("subjectid"), topicId: get("topicid"),
        title: get("title"), expression: get("expression"), statement: get("statement"),
        notes: get("notes"), memoryTrick: get("memorytrick"),
        tags: get("tags").split(";").map(s => s.trim()).filter(Boolean),
      };
    }).filter(Boolean);
    if (!parsed.length) { setImportMsg("No valid rows found."); return; }
    setImporting(true);
    try {
      await importFormulasBatch(parsed);
      setImportMsg(`Imported ${parsed.length} entries.`);
      setImportText("");
      load();
    } finally { setImporting(false); }
  };

  return (
    <div className="space-y-4">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />
      {!paperId ? null : (
        <>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Btn onClick={() => { setAdding(true); setEditingId(null); setForm(blankFormulaForm()); }} icon={Plus} color={ACCENT}>Add Entry</Btn>
            <span className="font-mono text-[10px] text-white/30">{formulas.length} standalone entries</span>
          </div>
          <p className="font-mono text-[10px] text-white/25 leading-relaxed">
            Anything typed into a topic&apos;s FORMULA BOX already appears in the student-facing Formula Book automatically -
            this panel is for entries that do not belong to a single lesson (cross-cutting theorems, definition sheets,
            revision cards).
          </p>

          <FormBox>
            <div className="flex items-center gap-2">
              <Upload size={12} style={{ color: "#00FFFF" }} />
              <p className="font-mono text-[11px]" style={{ color: "#00FFFF" }}>BULK IMPORT</p>
            </div>
            <p className="font-mono text-[10px] text-white/30">Columns: {FORMULA_CSV_HEADER} (tags separated by semicolons)</p>
            <Textarea label="PASTE CSV" rows={4} value={importText} onChange={setImportText} />
            <Btn onClick={runImport} disabled={importing || !importText.trim()} solid color="#00FFFF">
              {importing ? "Importing..." : "Import"}
            </Btn>
            {importMsg && <p className="font-mono text-[10.5px]" style={{ color: "#00FF41" }}>{importMsg}</p>}
          </FormBox>

          {(adding || editingId) && (
            <FormBox>
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">KIND</p>
                  <Dropdown value={form.kind} onChange={v => setForm(p => ({ ...p, kind: v }))} options={FORMULA_KINDS.map(k => k.key)} className="w-full" />
                </div>
                <Input label="SUBJECT ID" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
                <Input label="TOPIC ID (optional)" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))} />
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
              </div>
              <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Master Theorem" />
              <Textarea label="EXPRESSION (rendered monospaced - write it as you would on paper)" rows={3}
                value={form.expression} onChange={v => setForm(p => ({ ...p, expression: v }))} placeholder="T(n) = aT(n/b) + f(n)" />
              <Textarea label="STATEMENT" rows={3} value={form.statement} onChange={v => setForm(p => ({ ...p, statement: v }))} />
              <Textarea label="NOTES / CONDITIONS" rows={2} value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} />
              <Input label="MEMORY TRICK" value={form.memoryTrick} onChange={v => setForm(p => ({ ...p, memoryTrick: v }))} />
              <StringListField label="TAGS" items={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />
              <div className="flex items-center gap-3">
                <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
                <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
              </div>
              <div className="flex gap-2">
                <Btn onClick={handleSave} disabled={saving || !form.title.trim()} solid color="#00FF41">{saving ? "Saving..." : "Save"}</Btn>
                <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
              </div>
            </FormBox>
          )}

          {loading ? <p className="font-mono text-xs text-white/30">Loading...</p>
            : formulas.length === 0 ? <p className="font-mono text-xs text-white/30">No standalone entries.</p>
              : (
                <div className="space-y-1.5">
                  {formulas.map(f => (
                    <Row key={f.id}>
                      <Sigma size={12} className="flex-shrink-0" style={{ color: "#FFD700" }} />
                      <span className="font-mono text-[10px] w-16 flex-shrink-0 text-white/30">{f.kind?.toUpperCase()}</span>
                      <span className="font-mono text-xs text-white/70 flex-1 min-w-0 truncate">{f.title}</span>
                      <span className="font-mono text-[10px] text-white/25">{f.subjectId}</span>
                      <StatusPill status={f.status} />
                      <Btn color="#FFD700" icon={Pencil} onClick={() => { setEditingId(f.id); setAdding(false); setForm({ ...blankFormulaForm(), ...f }); }}>Edit</Btn>
                      <Btn color="#FF5050" icon={Trash2}
                        onClick={async () => { if (confirm("Delete this entry?")) { await deleteFormula(f.id); load(); } }}>Del</Btn>
                    </Row>
                  ))}
                </div>
              )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 6. RESOURCES + ANNOUNCEMENTS
// ============================================================

export function GateResourcesPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [rForm, setRForm] = useState({ kind: "book", subjectId: "", title: "", author: "", url: "", description: "", order: 0, status: "published" });
  const [aForm, setAForm] = useState({ title: "", body: "", pinned: false, status: "published" });
  const [editingR, setEditingR] = useState(null);
  const [editingA, setEditingA] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!paperId) { setResources([]); setAnnouncements([]); return; }
    fetchResources(paperId, { includeUnpublished: true }).then(setResources).catch(console.error);
    fetchAnnouncements(paperId, { includeUnpublished: true }).then(setAnnouncements).catch(console.error);
  };
  useEffect(() => { load();   }, [paperId]);

  const saveR = async () => {
    if (!rForm.title.trim()) return;
    setSaving(true);
    try {
      await saveResource(editingR, { ...rForm, paperId, order: Number(rForm.order) || 0 });
      setEditingR(null);
      setRForm({ kind: "book", subjectId: "", title: "", author: "", url: "", description: "", order: 0, status: "published" });
      load();
    } finally { setSaving(false); }
  };

  const saveA = async () => {
    if (!aForm.title.trim()) return;
    setSaving(true);
    try {
      await saveAnnouncement(editingA, { ...aForm, paperId });
      setEditingA(null);
      setAForm({ title: "", body: "", pinned: false, status: "published" });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />
      {!paperId ? null : (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Library size={12} style={{ color: ACCENT }} />
              <p className="font-mono text-[11px]" style={{ color: ACCENT }}>RESOURCES ({resources.length})</p>
            </div>
            <FormBox>
              <div className="grid grid-cols-4 gap-2.5">
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">KIND</p>
                  <Dropdown value={rForm.kind} onChange={v => setRForm(p => ({ ...p, kind: v }))} options={RESOURCE_KINDS.map(k => k.key)} className="w-full" />
                </div>
                <Input label="SUBJECT ID (optional)" value={rForm.subjectId} onChange={v => setRForm(p => ({ ...p, subjectId: v }))} />
                <Input label="ORDER" type="number" value={rForm.order} onChange={v => setRForm(p => ({ ...p, order: v }))} />
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
                  <Dropdown value={rForm.status} onChange={v => setRForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="TITLE" value={rForm.title} onChange={v => setRForm(p => ({ ...p, title: v }))} />
                <Input label="AUTHOR / CHANNEL" value={rForm.author} onChange={v => setRForm(p => ({ ...p, author: v }))} />
              </div>
              <Input label="URL" value={rForm.url} onChange={v => setRForm(p => ({ ...p, url: v }))} placeholder="https://..." />
              <Textarea label="WHY THIS ONE (shown to students)" rows={2} value={rForm.description} onChange={v => setRForm(p => ({ ...p, description: v }))} />
              <div className="flex gap-2">
                <Btn onClick={saveR} disabled={saving || !rForm.title.trim()} solid color="#00FF41">{editingR ? "Update" : "Add"}</Btn>
                {editingR && <button onClick={() => setEditingR(null)} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>}
              </div>
            </FormBox>
            <div className="space-y-1.5">
              {resources.map(r => (
                <Row key={r.id}>
                  <span className="font-mono text-[10px] w-14 flex-shrink-0 text-white/30">{r.kind?.toUpperCase()}</span>
                  <span className="font-mono text-xs text-white/70 flex-1 min-w-0 truncate">{r.title}</span>
                  <span className="font-mono text-[10px] text-white/25 truncate max-w-[180px]">{r.url}</span>
                  <StatusPill status={r.status} />
                  <Btn color="#FFD700" icon={Pencil} onClick={() => { setEditingR(r.id); setRForm({ ...rForm, ...r }); }}>Edit</Btn>
                  <Btn color="#FF5050" icon={Trash2} onClick={async () => { if (confirm("Delete?")) { await deleteResource(r.id); load(); } }}>Del</Btn>
                </Row>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone size={12} style={{ color: "#C77DFF" }} />
              <p className="font-mono text-[11px]" style={{ color: "#C77DFF" }}>ANNOUNCEMENTS ({announcements.length})</p>
            </div>
            <FormBox>
              <Input label="TITLE" value={aForm.title} onChange={v => setAForm(p => ({ ...p, title: v }))} />
              <Textarea label="BODY" rows={3} value={aForm.body} onChange={v => setAForm(p => ({ ...p, body: v }))} />
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 font-mono text-[11px] text-white/50">
                  <input type="checkbox" checked={aForm.pinned} onChange={e => setAForm(p => ({ ...p, pinned: e.target.checked }))} />
                  Pin to the top
                </label>
                <Dropdown value={aForm.status} onChange={v => setAForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
              </div>
              <div className="flex gap-2">
                <Btn onClick={saveA} disabled={saving || !aForm.title.trim()} solid color="#00FF41">{editingA ? "Update" : "Post"}</Btn>
                {editingA && <button onClick={() => setEditingA(null)} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>}
              </div>
            </FormBox>
            <div className="space-y-1.5">
              {announcements.map(a => (
                <Row key={a.id}>
                  {a.pinned && <span className="font-mono text-[10px]" style={{ color: "#FFD700" }}>PINNED</span>}
                  <span className="font-mono text-xs text-white/70 flex-1 min-w-0 truncate">{a.title}</span>
                  <StatusPill status={a.status} />
                  <Btn color="#FFD700" icon={Pencil} onClick={() => { setEditingA(a.id); setAForm({ ...aForm, ...a }); }}>Edit</Btn>
                  <Btn color="#FF5050" icon={Trash2} onClick={async () => { if (confirm("Delete?")) { await deleteAnnouncement(a.id); load(); } }}>Del</Btn>
                </Row>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// 7. BULK LESSON IMPORT
// ============================================================

// Bulk authoring for topic lesson content. The other banks (PYQs, formulas) take
// CSV; lessons take JSON, for the reasons documented at the top of
// lib/gateLessonImport.js - multi-line prose with `:::` fences, string arrays and
// nested MCQ/numerical objects are exactly what CSV silently mangles.
//
// The panel is deliberately three explicit steps rather than one "Import" button:
// paste, then VALIDATE (which writes nothing and shows a per-topic diff against
// the paper's real topic ids), then commit. A bulk writer that reports after the
// fact is how a single typo'd subjectId turns into forty wrong documents.

const VERDICT_STYLE = {
  create: { color: "#00FF41", label: "WILL ADD CONTENT" },
  update: { color: "#FFD700", label: "WILL OVERWRITE" },
  unknown: { color: "#FF9500", label: "NO SUCH TOPIC" },
  invalid: { color: "#FF5050", label: "INVALID" },
};

export function GateLessonImportPanel() {
  const { papers, paperId, setPaperId } = usePapers();
  const [text, setText] = useState("");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(null);
  const [templateSubject, setTemplateSubject] = useState("");
  const [subjects] = useKeyedFetch(paperId, () => fetchSubjects(paperId, { includeUnpublished: true }), { fallback: [] });

  const validate = async () => {
    setBusy(true); setDone(null);
    try {
      setReport(await validateLessonImport({ paperId, text }));
    } catch (e) {
      setReport({ fatal: e?.message || "Validation failed." });
    } finally { setBusy(false); }
  };

  const commit = async () => {
    if (!report?.writable?.length) return;
    setBusy(true); setProgress({ n: 0, total: report.writable.length });
    try {
      const { written } = await runLessonImport({
        paperId, writable: report.writable,
        onProgress: (n, total) => setProgress({ n, total }),
      });
      setDone(written);
      setReport(null);
      setText("");
    } catch (e) {
      setReport(r => ({ ...r, fatal: e?.message || "Import failed partway through - re-validate before retrying." }));
    } finally { setBusy(false); setProgress(null); }
  };

  const download = (content, filename) => {
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportTemplate = async (includeAuthored) => {
    setBusy(true);
    try {
      const json = await buildLessonTemplate({
        paperId, subjectId: templateSubject || null, includeAuthored,
      });
      download(json, `gate-${paperId}${templateSubject ? `-${templateSubject}` : ""}-lessons.json`);
    } finally { setBusy(false); }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setReport(null); setDone(null);
    e.target.value = "";
  };

  if (papers.length === 0) return <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />;

  const subjectList = subjects || [];

  return (
    <div className="space-y-4">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} />

      <FormBox>
        <p className="font-mono text-[10px] tracking-wider mb-2" style={{ color: "#00E5A0" }}>
          STEP 1 - GET A TEMPLATE
        </p>
        <p className="font-mono text-[10.5px] text-white/40 leading-relaxed mb-2.5">
          Export the paper&apos;s real topic ids so nothing has to be typed by hand. Edit the prose in a proper editor,
          then bring the file back. Only the fields left in the file are written - a file containing nothing but
          <span className="text-white/60"> shortNotes</span> updates only short notes and leaves every authored lesson intact.
        </p>
        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="w-64">
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">SUBJECT (BLANK = WHOLE PAPER)</p>
            <Dropdown value={templateSubject} onChange={setTemplateSubject} className="w-full"
              options={["", ...subjectList.map(s => s.id)]} />
          </div>
          <Btn icon={Download} onClick={() => exportTemplate(true)} disabled={busy}>
            Export with existing content
          </Btn>
          <Btn icon={Download} color="#A78BFA" onClick={() => exportTemplate(false)} disabled={busy}>
            Export ids only
          </Btn>
          <Btn icon={Copy} color="#FFD700" onClick={() => setText(LESSON_IMPORT_EXAMPLE)}>
            Load a filled example
          </Btn>
        </div>
      </FormBox>

      <FormBox>
        <p className="font-mono text-[10px] tracking-wider mb-2" style={{ color: "#00E5A0" }}>
          STEP 2 - PASTE OR UPLOAD, THEN VALIDATE
        </p>
        <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
          <label className="font-mono text-[11px] px-2.5 py-1.5 rounded cursor-pointer inline-flex items-center gap-1.5"
            style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF", border: "1px solid rgba(0,255,255,0.25)" }}>
            <Upload size={11} /> Choose a .json file
            <input type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
          </label>
          <span className="font-mono text-[10px] text-white/25">
            {text ? `${text.length.toLocaleString()} characters loaded` : "nothing loaded yet"}
          </span>
        </div>
        <Textarea label="LESSON JSON" value={text} rows={12}
          onChange={v => { setText(v); setReport(null); setDone(null); }}
          placeholder={'{ "paperId": "cs", "topics": [ { "subjectId": "digital-logic", "topicId": "karnaugh-map", "concept": "..." } ] }'} />
        <div className="flex items-center gap-2.5 mt-2.5">
          <Btn icon={Check} onClick={validate} disabled={busy || !text.trim()}>
            {busy && !progress ? "Validating..." : "Validate (writes nothing)"}
          </Btn>
          <p className="font-mono text-[10px] text-white/25">
            Compares every row against this paper&apos;s real topic ids before anything is written.
          </p>
        </div>
      </FormBox>

      {report?.fatal && (
        <div className="p-3 rounded font-mono text-[11px] leading-relaxed"
          style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.3)", color: "#FF5050" }}>
          <AlertTriangle size={12} className="inline mr-1.5" />{report.fatal}
        </div>
      )}

      {report?.rows && (
        <FormBox>
          <p className="font-mono text-[10px] tracking-wider mb-2.5" style={{ color: "#00E5A0" }}>
            STEP 3 - REVIEW THE DIFF, THEN COMMIT
          </p>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            {Object.entries(report.counts).map(([k, n]) => (n > 0 ? (
              <span key={k} className="font-mono text-[10.5px] px-2 py-1 rounded"
                style={{
                  background: `${VERDICT_STYLE[k].color}14`,
                  border: `1px solid ${VERDICT_STYLE[k].color}40`,
                  color: VERDICT_STYLE[k].color,
                }}>
                {n} {VERDICT_STYLE[k].label}
              </span>
            ) : null))}
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {report.rows.map(r => {
              const style = VERDICT_STYLE[r.verdict];
              return (
                <div key={r.index} className="p-2.5 rounded"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${style.color}26` }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${style.color}18`, color: style.color }}>
                      {style.label}
                    </span>
                    <span className="font-mono text-[11px] text-white/70">{r.label}</span>
                  </div>
                  {r.fields?.length > 0 && (
                    <p className="font-mono text-[10px] text-white/30 mt-1">sets: {r.fields.join(", ")}</p>
                  )}
                  {r.errors?.map((e, i) => (
                    <p key={i} className="font-mono text-[10px] mt-1" style={{ color: style.color }}>{e}</p>
                  ))}
                </div>
              );
            })}
          </div>

          {report.counts.update > 0 && (
            <p className="font-mono text-[10.5px] mt-3 leading-relaxed" style={{ color: "#FFD700" }}>
              {report.counts.update} topic{report.counts.update === 1 ? "" : "s"} already have authored content that will be
              overwritten. The previous version of each is snapshotted first (last 5 kept), so a bad import is recoverable
              from that topic&apos;s version history - but check the list above rather than relying on it.
            </p>
          )}

          <div className="flex items-center gap-2.5 mt-3">
            <Btn solid color="#00FF41" icon={Sparkles} onClick={commit}
              disabled={busy || report.writable.length === 0}>
              {progress
                ? `Importing ${progress.n}/${progress.total}...`
                : `Import ${report.writable.length} topic${report.writable.length === 1 ? "" : "s"}`}
            </Btn>
            <Btn color="#FF5050" onClick={() => setReport(null)} disabled={busy}>Cancel</Btn>
          </div>
          {(report.counts.unknown > 0 || report.counts.invalid > 0) && (
            <p className="font-mono text-[10px] text-white/30 mt-2">
              Rows marked NO SUCH TOPIC or INVALID are skipped, not written. Fix them and re-validate to include them.
            </p>
          )}
        </FormBox>
      )}

      {done !== null && (
        <div className="p-3 rounded font-mono text-[11px]"
          style={{ background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.3)", color: "#00FF41" }}>
          <Check size={12} className="inline mr-1.5" />
          Imported {done} topic{done === 1 ? "" : "s"}. Published lessons are live for students immediately.
        </div>
      )}

      <FormBox>
        <p className="font-mono text-[10px] tracking-wider mb-2 text-white/40">SUPPORTED FIELDS</p>
        <p className="font-mono text-[10px] text-white/30 leading-relaxed">
          {LESSON_IMPORT_FIELDS.join(" · ")}
        </p>
        <p className="font-mono text-[10px] text-white/25 mt-2 leading-relaxed">
          Any other key is rejected rather than ignored, so a misspelled field name fails validation instead of silently
          writing nothing. <span className="text-white/40">concept</span>, <span className="text-white/40">deepDive</span>,
          {" "}<span className="text-white/40">dryRun</span> and the short-note depths accept the same
          {" "}<span className="text-white/40">##</span> heading and <span className="text-white/40">:::</span> block syntax
          as the single-topic editor.
        </p>
      </FormBox>
    </div>
  );
}
