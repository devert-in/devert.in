"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Check, Copy, Download, Layers, Pencil,
  Plus, Sigma, Trash2, Upload, Library, Megaphone, ClipboardList, Sparkles,
  ShieldCheck, Undo2, GraduationCap, CalendarDays, TrendingUp, BookOpen,
  Clock, ListChecks, Flag, CircleCheck, Eye, KeyRound, FileText, Pin, Link2,
  Hash, FileJson,
} from "lucide-react";
import Dropdown from "@/components/dropdown";
import { useAuth } from "@/context/AuthContext";
import { LessonConceptField } from "@/components/admin/lesson-concept-field";
import { StringListField, McqListField } from "@/components/campus/campus-daily-learning-editor";
import { Input as UiInput, Textarea as UiTextarea } from "@/components/admin/admin-ui";
import {
  KIT, fmt, StatGrid, Pill, PrimaryButton, SecondaryButton,
  DataTable, Drawer, DrawerSection,
} from "@/components/admin/admin-kit";
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
  PYQ_REVIEW_FLAGS, pyqPublishBlockers, verifyAndPublishPyq, sendPyqBackToReview,
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

// The GATE authoring surface. Mounted as sections inside /admin's GATE group
// (see app/admin/page.jsx's ADMIN_NAV) rather than as a new top-level admin
// surface, per CLAUDE.md - a new admin capability belongs inside an existing
// tab family.
//
// Built from the shared enterprise kit (components/admin/admin-kit.jsx) like
// every other admin section: a StatGrid of REAL counts on top, a DataTable for
// any list of records, and create/edit forms in a right-hand Drawer. The deep
// hierarchical editors (a topic's seven-part lesson, the bulk lesson import's
// validate-then-commit flow) keep their own inner editing UI - flattening a
// lesson into table cells would lose the reading-order structure an author
// writes it in - but they sit inside the same chrome.
//
// Every stat below is counted from documents this panel has already loaded. No
// trends, no estimates: nothing here stores history to derive one from.

// ---------------- local primitives ----------------

// The shared admin-ui inputs, coerced so a Firestore `null` (year: null,
// natMin: null...) never reaches a controlled <input> as a null value.
function Input(props) {
  return <UiInput {...props} value={props.value ?? ""} />;
}

function Textarea(props) {
  return <UiTextarea {...props} value={props.value ?? ""} />;
}

function SelectField({ label, value, onChange, options, className = "w-full" }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <Dropdown value={value} onChange={onChange} options={options} className={className} />
    </div>
  );
}

const STATUSES = ["draft", "published", "archived"];
const STATUS_COLOR = { published: KIT.green, draft: KIT.muted, archived: KIT.orange };
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

function StatusPill({ status }) {
  const s = status || "draft";
  return <Pill color={STATUS_COLOR[s] || KIT.muted}>{cap(s)}</Pill>;
}

// Every table here filters by status the same way; missing status reads as
// draft, matching what StatusPill shows.
const STATUS_FILTER = {
  key: "status", label: "All statuses", get: (r) => r.status || "draft",
  options: STATUSES.map(s => ({ value: s, label: cap(s) })),
};

const DIFFICULTY_TONE = { Easy: KIT.green, Moderate: KIT.orange, Hard: KIT.red };

function TitleCell({ title, sub }) {
  return (
    <div className="min-w-0 w-[260px] xl:w-[320px]">
      <p className="font-sans text-sm font-medium text-white truncate">{title || "-"}</p>
      {sub && <p className="font-sans text-xs text-white/40 truncate">{sub}</p>}
    </div>
  );
}

function Num({ value, muted }) {
  return <span className={`font-sans text-sm tabular-nums ${muted ? "text-white/50" : "text-white/80"}`}>{fmt(value)}</span>;
}

function Muted({ children }) {
  return <span className="font-sans text-sm text-white/60">{children || "-"}</span>;
}

// A plain kit-styled card for the parts of a panel that are not a table
// (seeding, import steps, validation results).
function KitCard({ title, hint, icon: Icon, color = KIT.cyan, action, children }) {
  return (
    <section className="rounded-xl border p-4 sm:p-5 space-y-3" style={{ background: KIT.surface, borderColor: KIT.line }}>
      {(title || hint) && (
        <div className="flex items-start gap-3 flex-wrap">
          {Icon && <Icon size={18} className="flex-shrink-0 mt-0.5" style={{ color }} />}
          <div className="min-w-0 flex-1">
            {title && <h3 className="font-sans text-sm font-semibold text-white">{title}</h3>}
            {hint && <p className="font-sans text-xs text-white/45 mt-0.5 leading-relaxed max-w-3xl">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Notice({ color = KIT.orange, icon: Icon = AlertTriangle, children }) {
  return (
    <div className="rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 font-sans text-xs leading-relaxed"
      style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}>
      <Icon size={14} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

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

function PaperSelect({ papers, paperId, setPaperId, loading }) {
  if (loading) return <p className="font-sans text-xs text-white/40">Loading papers...</p>;
  if (papers.length === 0) {
    return (
      <Notice>No GATE paper exists yet - create or seed one in Papers &amp; syllabus first.</Notice>
    );
  }
  return (
    <div className="flex items-center gap-3 flex-wrap rounded-xl border px-4 py-3"
      style={{ background: KIT.surface, borderColor: KIT.line }}>
      <GraduationCap size={16} style={{ color: KIT.green }} />
      <p className="font-sans text-sm font-medium text-white/80">Paper</p>
      <Dropdown value={paperId} onChange={setPaperId} className="w-56"
        options={papers.map(p => p.id)} />
      <span className="font-sans text-xs text-white/40">
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

function paperExamDate(p) {
  return p.examDate?.toDate
    ? p.examDate.toDate().toISOString().slice(0, 10)
    : (typeof p.examDate === "string" ? p.examDate.slice(0, 10) : "");
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
      examDate: paperExamDate(p),
      candidateCount: p.candidateCount ?? "",
      rankAnchorsText: (p.rankAnchors || []).map(a => `${a.marks},${a.air}`).join("\n"),
    });
  };
  const closeForm = () => { setEditingId(null); setAdding(false); };

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

  const syllabusIds = Object.keys(GATE_SYLLABI);
  const unseeded = syllabusIds.filter(id => !papers.some(p => p.id === id));
  const published = papers.filter(p => p.status === "published").length;
  const customCurve = papers.filter(p => p.rankAnchors?.length).length;
  const withDate = papers.filter(p => p.examDate).length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Papers", value: papers.length, sub: `${published} published`, icon: GraduationCap, color: KIT.green, loading },
        { label: "Official syllabi seeded", value: `${syllabusIds.length - unseeded.length} / ${syllabusIds.length}`,
          sub: unseeded.length ? `Not yet: ${unseeded.join(", ")}` : "Every transcribed syllabus exists", icon: Sparkles, color: KIT.cyan, loading },
        { label: "Custom rank curve", value: customCurve, sub: `${papers.length - customCurve} on the default CS curve`, icon: TrendingUp, color: KIT.orange, loading },
        { label: "Exam date set", value: withDate, sub: "Drives the student countdown", icon: CalendarDays, color: KIT.purple, loading },
      ]} />

      {/* one-click official syllabus seeding */}
      <KitCard icon={Sparkles} color={KIT.green} title="Seed an official syllabus"
        hint="The GATE syllabus is transcribed in lib/gateSyllabus.js from the official paper documents. Seeding creates the paper plus its complete subject and topic tree, published and ready for lesson authoring. Re-seeding is safe and additive - it never overwrites content you have written.">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(GATE_SYLLABI).map(([id, s]) => {
            const exists = papers.some(p => p.id === id);
            const counts = countSyllabusDocs(s);
            return exists ? (
              <SecondaryButton key={id} icon={Copy} onClick={() => handleSeed(id)} disabled={seeding === id}>
                {seeding === id ? "Seeding..." : `Re-seed ${s.name} (${counts.topics} topics)`}
              </SecondaryButton>
            ) : (
              <PrimaryButton key={id} icon={Plus} busy={seeding === id} onClick={() => handleSeed(id)}>
                {seeding === id ? "Seeding..." : `Seed ${s.name} (${counts.topics} topics)`}
              </PrimaryButton>
            );
          })}
        </div>
      </KitCard>

      {feedback && (
        <Notice color={feedback.ok ? KIT.green : KIT.red} icon={feedback.ok ? Check : AlertTriangle}>{feedback.msg}</Notice>
      )}

      <DataTable
        title="All papers" icon={GraduationCap}
        subtitle="Every GATE paper, published or not. Content banks (PYQs, tests, formulas, resources) are scoped to a paper."
        rows={papers} loading={loading}
        searchKeys={["id", "name", "fullName", "code"]} searchPlaceholder="Search papers..."
        filters={[
          STATUS_FILTER,
          { key: "curve", label: "Any rank curve", get: p => (p.rankAnchors?.length ? "custom" : "default"),
            options: [{ value: "custom", label: "Custom curve" }, { value: "default", label: "Default curve" }] },
        ]}
        primaryAction={{ label: "Add paper", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm(blankPaperForm()); } }}
        onRowClick={startEdit}
        emptyText="No papers yet - seed one above."
        columns={[
          { key: "name", label: "Paper", render: p => <TitleCell title={p.name} sub={p.fullName} /> },
          { key: "id", label: "Id", render: p => <Pill color={KIT.cyan}>{p.id}</Pill> },
          { key: "totalMarks", label: "Format", sort: p => p.totalMarks || 100, render: p => (
            <span className="font-sans text-sm text-white/70 whitespace-nowrap">
              {p.totalMarks || 100} marks · {p.durationMinutes || 180} min
            </span>
          ) },
          { key: "examDate", label: "Exam date", sort: paperExamDate, render: p => <Muted>{paperExamDate(p) || "Not set"}</Muted> },
          { key: "curve", label: "Rank curve", sort: p => (p.rankAnchors?.length || 0), render: p => (
            p.rankAnchors?.length
              ? <Pill color={KIT.green}>Custom ({p.rankAnchors.length})</Pill>
              : <Pill color={KIT.orange}>Default</Pill>
          ) },
          { key: "order", label: "Order", sort: p => Number(p.order) || 0, render: p => <Num value={p.order} muted /> },
          { key: "status", label: "Status", render: p => <StatusPill status={p.status} /> },
        ]}
        rowActions={p => [
          GATE_SYLLABI[p.id] && { icon: Copy, label: "Re-seed syllabus", onClick: () => handleSeed(p.id), disabled: seeding === p.id },
          { icon: Pencil, label: "Edit", onClick: () => startEdit(p) },
          { icon: AlertTriangle, label: "Clear content banks", danger: true, onClick: () => handleDeleteContent(p.id) },
          { icon: Trash2, label: "Delete paper", danger: true, onClick: () => handleDelete(p.id) },
        ]}
      />

      <Drawer open={adding || !!editingId} onClose={closeForm}
        title={adding ? "Add a paper" : form.name || "Edit paper"}
        subtitle={adding ? "Most papers should be seeded from the official syllabus instead." : `${editingId} · ${form.fullName || ""}`}
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.name.trim()} onClick={handleSave}>Save paper</PrimaryButton>
        </>}>
        <DrawerSection title="Identity">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="CODE (e.g. CS, DA, EC)" value={form.code} onChange={v => setForm(p => ({ ...p, code: v }))} />
            <Input label="SHORT NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="GATE CS" />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
          </div>
          <Input label="FULL NAME" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))}
            placeholder="Computer Science and Information Technology"
            hint={`Known GATE codes: ${GATE_PAPER_CATALOG.map(p => p.code).join(", ")}`} />
          <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
        </DrawerSection>
        <DrawerSection title="Exam format">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
        </DrawerSection>
        <DrawerSection title="Rank curve"
          hint="Leave blank to use the built-in generic curve (shaped like published GATE CS data). SET THIS for any paper other than CS - DA's candidate pool is an order of magnitude smaller, so the CS curve produces nonsense ranks for it. Students always see this figure labelled as an estimate, and the UI additionally flags when a paper is still on the default curve.">
          <Textarea label="RANK CURVE - one 'marks,AIR' pair per line" rows={5}
            value={form.rankAnchorsText} onChange={v => setForm(p => ({ ...p, rankAnchorsText: v }))}
            placeholder={DEFAULT_RANK_ANCHORS.slice(0, 4).map(a => `${a.marks},${a.air}`).join("\n")} />
        </DrawerSection>
        <DrawerSection title="Publishing">
          <SelectField label="STATUS" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
        </DrawerSection>
      </Drawer>
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
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
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

  const closeForm = () => { setEditingId(null); setAdding(false); };

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

  const startEdit = (s) => { setEditingId(s.id); setAdding(false); setForm({ ...blankSubjectForm(), ...s }); };

  if (managing) {
    return <GateTopicsPanel paperId={paperId} subjectId={managing.id} subjectName={managing.name}
      onBack={() => { setManaging(null); load(); }} />;
  }

  const published = subjects.filter(s => s.status === "published").length;
  const topicTotal = subjects.reduce((n, s) => n + (s.topicCount || 0), 0);
  const weightage = subjects.reduce((n, s) => n + (Number(s.weightageMarks) || 0), 0);
  const hours = subjects.reduce((n, s) => n + (Number(s.estimatedHours) || 0), 0);
  const statsLoading = loading || papersLoading;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />
      {!paperId ? null : (
        <>
          <StatGrid stats={[
            { label: "Subjects", value: subjects.length, sub: `${published} published`, icon: Layers, color: KIT.green, loading: statsLoading },
            { label: "Topics", value: topicTotal, sub: "Counted from each subject's topic list", icon: ListChecks, color: KIT.cyan, loading: statsLoading },
            { label: "Weightage", value: weightage, sub: "Marks, historical average - approximate", icon: TrendingUp, color: KIT.orange, loading: statsLoading },
            { label: "Estimated hours", value: hours, sub: "Sum of per-subject estimates", icon: Clock, color: KIT.purple, loading: statsLoading },
          ]} />

          <DataTable
            title="Subjects" icon={Layers}
            subtitle="Open a subject to author its topics and lessons."
            rows={subjects} loading={loading}
            searchKeys={["name", "id", "description"]} searchPlaceholder="Search subjects..."
            filters={[STATUS_FILTER]}
            primaryAction={{ label: "Add subject", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm(blankSubjectForm()); } }}
            onRowClick={s => setManaging(s)}
            emptyText="No subjects - seed the official syllabus from Papers & syllabus, or add one manually."
            columns={[
              { key: "name", label: "Subject", render: s => <TitleCell title={s.name} sub={s.description || s.id} /> },
              { key: "topicCount", label: "Topics", sort: s => s.topicCount || 0, render: s => <Num value={s.topicCount || 0} /> },
              { key: "weightageMarks", label: "Weightage", sort: s => Number(s.weightageMarks) || 0,
                render: s => <Muted>{s.weightageMarks ? `~${s.weightageMarks} marks` : "-"}</Muted> },
              { key: "estimatedHours", label: "Hours", sort: s => Number(s.estimatedHours) || 0,
                render: s => <Muted>{s.estimatedHours ? `~${s.estimatedHours}h` : "-"}</Muted> },
              { key: "order", label: "Order", sort: s => Number(s.order) || 0, render: s => <Num value={s.order} muted /> },
              { key: "status", label: "Status", render: s => <StatusPill status={s.status} /> },
            ]}
            rowActions={s => [
              { icon: Layers, label: "Topics & lessons", onClick: () => setManaging(s) },
              { icon: Pencil, label: "Edit", onClick: () => startEdit(s) },
              { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(s.id) },
            ]}
          />

          <Drawer open={adding || !!editingId} onClose={closeForm}
            title={adding ? "Add subject" : form.name || "Edit subject"}
            subtitle={adding ? `A new subject under ${paperId}.` : `${paperId} / ${editingId}`}
            width={620}
            footer={<>
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!form.name.trim()} onClick={handleSave}>Save subject</PrimaryButton>
            </>}>
            <DrawerSection title="Subject">
              <Input label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Operating System" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
                <Input label="WEIGHTAGE (MARKS)" type="number" value={form.weightageMarks} onChange={v => setForm(p => ({ ...p, weightageMarks: v }))}
                  hint="Historical average - shown as approximate" />
                <Input label="ESTIMATED HOURS" type="number" value={form.estimatedHours} onChange={v => setForm(p => ({ ...p, estimatedHours: v }))} />
              </div>
              <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
              <SelectField label="STATUS" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
            </DrawerSection>
          </Drawer>
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

const topicHasLesson = (t) => !!(t.concept?.trim() || t.keyPoints?.length || t.formulas?.length);

function ParseNote({ count, children }) {
  return (
    <p className="font-sans text-xs -mt-1" style={{ color: count ? KIT.green : "rgba(255,255,255,0.3)" }}>{children}</p>
  );
}

function GateTopicsPanel({ paperId, subjectId, subjectName, onBack }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankTopicForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTopics(paperId, subjectId, { includeUnpublished: true }).then(setTopics).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId, subjectId]);

  const modules = useMemo(() => [...new Set(topics.map(t => t.module).filter(Boolean))], [topics]);

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
  const closeForm = () => { setEditingId(null); setAdding(false); };

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

  const published = topics.filter(t => t.status === "published").length;
  const withLesson = topics.filter(topicHasLesson).length;
  const withNotes = topics.filter(t => t.shortNotes?.oneMinute).length;
  const mcqTotal = topics.reduce((n, t) => n + (t.mcqs?.length || 0), 0);
  const mcqTopics = topics.filter(t => t.mcqs?.length).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <SecondaryButton icon={ArrowLeft} onClick={onBack}>Back to subjects</SecondaryButton>
        <h3 className="font-sans text-base font-semibold text-white">{subjectName}</h3>
        <span className="font-sans text-xs text-white/40">{paperId} / {subjectId}</span>
      </div>

      <StatGrid stats={[
        { label: "Topics", value: topics.length, sub: `${published} published`, icon: ListChecks, color: KIT.green, loading },
        { label: "Lessons written", value: withLesson, sub: `${topics.length - withLesson} not written yet`, icon: BookOpen, color: KIT.cyan, loading },
        { label: "Short notes", value: withNotes, sub: "Topics with a 1-minute revision note", icon: FileText, color: KIT.orange, loading },
        { label: "Practice MCQs", value: mcqTotal, sub: `Across ${mcqTopics} topic${mcqTopics === 1 ? "" : "s"}`, icon: CircleCheck, color: KIT.purple, loading },
      ]} />

      <DataTable
        title="Topics" icon={ListChecks}
        subtitle='Published + no content = listed in the syllabus, marked "not written yet" for students.'
        rows={topics} loading={loading}
        searchKeys={["title", "module", "id"]} searchPlaceholder="Search topics..."
        filters={[
          ...(modules.length ? [{ key: "module", label: "All modules", options: modules.map(m => ({ value: m, label: m })) }] : []),
          STATUS_FILTER,
          { key: "lesson", label: "Any lesson state", get: t => (topicHasLesson(t) ? "yes" : "no"),
            options: [{ value: "yes", label: "Lesson written" }, { value: "no", label: "No lesson" }] },
        ]}
        primaryAction={{ label: "Add topic", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm(blankTopicForm()); } }}
        onRowClick={startEdit}
        emptyText="No topics."
        columns={[
          { key: "title", label: "Topic", render: t => <TitleCell title={t.title} sub={t.module} /> },
          { key: "difficulty", label: "Difficulty", render: t => <Pill color={DIFFICULTY_TONE[t.difficulty] || KIT.muted}>{t.difficulty || "-"}</Pill> },
          { key: "estimatedMinutes", label: "Minutes", sort: t => Number(t.estimatedMinutes) || 0, render: t => <Num value={t.estimatedMinutes || 0} muted /> },
          { key: "lesson", label: "Lesson", sort: t => (topicHasLesson(t) ? 1 : 0), render: t => (
            topicHasLesson(t) ? <Pill color={KIT.green}>Written</Pill> : <Pill color={KIT.orange}>No lesson</Pill>
          ) },
          { key: "notes", label: "Notes", sort: t => (t.shortNotes?.oneMinute ? 1 : 0), render: t => (
            t.shortNotes?.oneMinute ? <Pill color={KIT.cyan}>Notes</Pill> : <Muted>-</Muted>
          ) },
          { key: "mcqs", label: "MCQs", sort: t => t.mcqs?.length || 0, render: t => <Num value={t.mcqs?.length || 0} muted /> },
          { key: "order", label: "Order", sort: t => Number(t.order) || 0, render: t => <Num value={t.order} muted /> },
          { key: "status", label: "Status", render: t => <StatusPill status={t.status} /> },
        ]}
        rowActions={t => [
          { icon: Pencil, label: "Edit lesson", onClick: () => startEdit(t) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(t.id) },
        ]}
      />

      {/* The lesson editor keeps its seven-part, top-to-bottom structure - it is
          the lesson in reading order, not a flat record - just inside the
          drawer instead of wedged above the list. */}
      <Drawer open={adding || !!editingId} onClose={closeForm} width={880}
        title={adding ? "Add topic" : form.title || "Edit topic"}
        subtitle={`${subjectName}${form.module ? ` · ${form.module}` : ""}`}
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.title.trim()} onClick={handleSave}>Save topic</PrimaryButton>
        </>}>
        <DrawerSection title="Basics">
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="CPU Scheduling" />
            <Input label="MODULE (the syllabus sub-heading this sits under)" value={form.module}
              onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="Scheduling" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <SelectField label="DIFFICULTY" value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={GATE_DIFFICULTIES} />
            <Input label="EST. MINUTES" type="number" value={form.estimatedMinutes} onChange={v => setForm(p => ({ ...p, estimatedMinutes: v }))} />
          </div>
          <SelectField label='STATUS (published + no content = listed in the syllabus, marked "not written yet")'
            value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
        </DrawerSection>

        <DrawerSection title="1 - Introduction">
          <StringListField label="LEARNING OBJECTIVES" items={form.whatYoullLearn} onChange={v => setForm(p => ({ ...p, whatYoullLearn: v }))} />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />
        </DrawerSection>

        <DrawerSection title="2 - Theory">
          <LessonConceptField value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <Textarea label="GO DEEPER (exam-depth explanation, shown collapsed under the plain one)" rows={6}
            value={form.deepDive} onChange={v => setForm(p => ({ ...p, deepDive: v }))} />
        </DrawerSection>

        <DrawerSection title="3 - Examples & walkthrough">
          <div className="grid grid-cols-2 gap-2.5">
            <SelectField label="CODE EXAMPLE LANGUAGE" value={form.codeExample?.language || "c"}
              onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, language: v } }))}
              options={CODELAB_LANGUAGES.map(l => l.id)} />
          </div>
          <Textarea label="CODE EXAMPLE (runnable in the lesson when execution is configured)" rows={5}
            value={form.codeExample?.code || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, code: v } }))} />
          <Textarea label="EXPECTED OUTPUT (fallback if live execution is unavailable)" rows={2}
            value={form.codeExample?.expectedOutput || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, expectedOutput: v } }))} />
          <Textarea label={`WORKED EXAMPLES - ${WORKED_EXAMPLE_HELP}`} rows={8}
            value={form.workedExamplesText} onChange={v => setForm(p => ({ ...p, workedExamplesText: v }))} />
          <ParseNote count={parsedExamples.length}>
            {parsedExamples.length} example{parsedExamples.length === 1 ? "" : "s"} parsed
            {parsedExamples.length ? `: ${parsedExamples.map(e => e.title).join(", ")}` : ""}
          </ParseNote>
          <Textarea label="STEP-BY-STEP DRY RUN (supports the lesson block syntax - use a :::flow or :::timeline block for a trace)"
            rows={6} value={form.dryRun} onChange={v => setForm(p => ({ ...p, dryRun: v }))} />
        </DrawerSection>

        <DrawerSection title="4 - Teaching aids">
          <StringListField label="REAL-WORLD ANALOGIES" items={form.analogies} onChange={v => setForm(p => ({ ...p, analogies: v }))} />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <StringListField label="MEMORY TRICKS" items={form.memoryTricks} onChange={v => setForm(p => ({ ...p, memoryTricks: v }))} />
          <StringListField label="FORMULA BOX (these also appear in the Formula Book automatically)" items={form.formulas} onChange={v => setForm(p => ({ ...p, formulas: v }))} />
          <StringListField label="EXAM SHORTCUTS" items={form.shortcuts} onChange={v => setForm(p => ({ ...p, shortcuts: v }))} />
        </DrawerSection>

        <DrawerSection title="5 - Exam & career context">
          <Textarea label="HOW GATE ASKS THIS (previous year relevance)" rows={3}
            value={form.pyqRelevance} onChange={v => setForm(p => ({ ...p, pyqRelevance: v }))} />
          <Textarea label="INTERVIEW CONNECTION" rows={2}
            value={form.interviewConnection} onChange={v => setForm(p => ({ ...p, interviewConnection: v }))} />
        </DrawerSection>

        <DrawerSection title="6 - Practice" hint="A student must submit the practice MCQs to finish the topic.">
          <McqListField label="PRACTICE MCQS (gate topic completion - a student must submit these to finish the topic)"
            items={form.mcqs} onChange={v => setForm(p => ({ ...p, mcqs: v }))} />
          <Textarea label={`NUMERICAL PROBLEMS - ${NUMERICALS_HELP}`} rows={5}
            value={form.numericalsText} onChange={v => setForm(p => ({ ...p, numericalsText: v }))} />
          <ParseNote count={parsedNumericals.length}>
            {parsedNumericals.length} numerical{parsedNumericals.length === 1 ? "" : "s"} parsed
          </ParseNote>
        </DrawerSection>

        <DrawerSection title="7 - Revision">
          <Textarea label="REVISION SUMMARY" rows={3} value={form.revisionSummary} onChange={v => setForm(p => ({ ...p, revisionSummary: v }))} />
          <Textarea label="SHORT NOTE - 5 MINUTE REVISION" rows={4}
            value={form.shortNotes?.fiveMinute || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, fiveMinute: v } }))} />
          <Textarea label="SHORT NOTE - 1 MINUTE REVISION" rows={2}
            value={form.shortNotes?.oneMinute || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, oneMinute: v } }))} />
          <Textarea label="SHORT NOTE - NIGHT BEFORE THE EXAM (the single highest-yield reminder)" rows={2}
            value={form.shortNotes?.nightBefore || ""} onChange={v => setForm(p => ({ ...p, shortNotes: { ...p.shortNotes, nightBefore: v } }))} />
        </DrawerSection>

        <DrawerSection title="Rewards">
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: v }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: v }))} />
          </div>
        </DrawerSection>
      </Drawer>
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

// The review queue's own filter. "Needs review" is the default view for a
// reason: after scripts/import-gate-pyq-drafts.mjs runs there are over a
// thousand drafts and five hand-authored published questions, so a panel that
// opened on "everything" would bury the five that are actually live under the
// import queue.
const PYQ_VIEWS = [
  { key: "needsReview", label: "Needs review" },
  { key: "flagged", label: "Flagged only" },
  { key: "published", label: "Published" },
  { key: "all", label: "All" },
];

// A flag chip. Orange rather than red throughout: a flag is "a human should
// look at this", not "this is broken" - most flagged questions turn out to be
// fine once checked against the original paper, and colouring them as errors
// would train a reviewer to dismiss them.
function FlagChip({ flag }) {
  return (
    <span title={PYQ_REVIEW_FLAGS[flag] || flag}>
      <Pill color={KIT.orange}>{flag}</Pill>
    </span>
  );
}

// Q number and session are what identify a question against the printed paper
// a reviewer has open beside them - without them, checking "is this really
// 2024 Q.17" means searching the PDF by text.
const pyqRef = (p) => (p.questionNumber ? `Q.${p.questionNumber}${p.session ? ` / S${p.session}` : ""}` : "");

export function GatePyqPanel() {
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
  const { user } = useAuth();
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankPyqForm());
  const [saving, setSaving] = useState(false);
  const [saveBlockers, setSaveBlockers] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState("needsReview");
  const [verifyError, setVerifyError] = useState(null);
  const [subjects] = useKeyedFetch(paperId, () => fetchSubjects(paperId, { includeUnpublished: true }), { fallback: [] });

  const load = () => {
    if (!paperId) { setPyqs([]); return; }
    setLoading(true);
    fetchPyqs(paperId, { includeUnpublished: true }).then(setPyqs).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const years = useMemo(() => [...new Set(pyqs.map(p => p.year).filter(Boolean))].sort((a, b) => b - a), [pyqs]);
  const subjectName = useMemo(() => new Map((subjects || []).map(s => [s.id, s.name])), [subjects]);
  const subjectIds = useMemo(() => [...new Set(pyqs.map(p => p.subjectId).filter(Boolean))].sort(), [pyqs]);

  // Blockers are computed once per load, from the SAME function
  // verifyAndPublishPyq enforces - the table's "ready" column, the stat card
  // and the publish action cannot disagree about what is publishable.
  const blockersById = useMemo(() => new Map(pyqs.map(p => [p.id, pyqPublishBlockers(p)])), [pyqs]);
  const blockersOf = (p) => blockersById.get(p.id) || pyqPublishBlockers(p);

  // `needsReview` is treated as "true unless explicitly false" only for
  // documents that carry the field at all - the hand-authored questions that
  // predate the import have no such field and are not drafts, so a bare
  // truthiness test on a missing field would be wrong in both directions.
  const counts = useMemo(() => ({
    needsReview: pyqs.filter(p => p.needsReview === true).length,
    flagged: pyqs.filter(p => (p.reviewFlags || []).length > 0).length,
    published: pyqs.filter(p => p.status === "published").length,
    all: pyqs.length,
  }), [pyqs]);
  const readyCount = useMemo(
    () => pyqs.filter(p => p.status !== "published" && (blockersById.get(p.id) || []).length === 0).length,
    [pyqs, blockersById],
  );

  const shown = useMemo(() => {
    if (view === "needsReview") return pyqs.filter(p => p.needsReview === true);
    if (view === "flagged") return pyqs.filter(p => (p.reviewFlags || []).length > 0);
    if (view === "published") return pyqs.filter(p => p.status === "published");
    return pyqs;
  }, [pyqs, view]);

  // Publishing runs the SAME check lib/gatePyq.js enforces, rather than the
  // panel keeping its own idea of what is publishable - so the button being
  // enabled and the write succeeding cannot disagree.
  const verify = async (p) => {
    setVerifyError(null);
    try {
      await verifyAndPublishPyq(p.id, p, user?.uid);
      load();
    } catch (e) {
      setVerifyError({ id: p.id, message: e.message });
    }
  };

  const reopen = async (p) => { await sendPyqBackToReview(p.id, "reopened"); load(); };
  const remove = async (p) => {
    if (!confirm("Delete this question?")) return;
    await deletePyq(p.id);
    if (editingId === p.id) setEditingId(null);
    load();
  };

  const startEdit = (p) => {
    setEditingId(p.id); setAdding(false); setSaveBlockers(null); setVerifyError(null);
    setForm({
      ...blankPyqForm(), ...p,
      optionsText: (p.options || []).map(o => o.text).join("\n"),
      correctAnswer: (p.correctOptionIds || []).join(","),
      natMin: p.natMin ?? "", natMax: p.natMax ?? "",
    });
  };
  const openCreate = () => { setAdding(true); setEditingId(null); setSaveBlockers(null); setForm(blankPyqForm()); };
  const closeForm = () => { setEditingId(null); setAdding(false); setSaveBlockers(null); };

  const handleSave = async () => {
    if (!form.question.trim()) return;
    setSaving(true);
    setSaveBlockers(null);
    try {
      const { optionsText, correctAnswer, ...rest } = form;
      const letters = ["a", "b", "c", "d", "e", "f"];
      const options = form.questionType === "nat" ? []
        : optionsText.split("\n").map(t => t.trim()).filter(Boolean).map((text, i) => ({ id: letters[i], text }));
      const correctOptionIds = form.questionType === "nat" ? []
        : correctAnswer.split(",").map(s => s.trim().toLowerCase()).filter(l => options.some(o => o.id === l));
      const payload = {
        ...rest, paperId, options, correctOptionIds,
        natMin: form.questionType === "nat" ? Number(form.natMin) : null,
        natMax: form.questionType === "nat" ? (form.natMax === "" ? Number(form.natMin) : Number(form.natMax)) : null,
        isRepeated: !!form.repeatGroup,
        order: Number(form.order) || 0,
      };
      // The status dropdown is a second road to "published", so it is held to
      // the same gate as Verify & publish. pyqPublishBlockers is the ONE rule
      // for what may reach a student (CLAUDE.md) - an unanswered question saved
      // straight to published would mark a correct student wrong and file it
      // into their mistakes notebook. Refuse, and show what is missing.
      if (payload.status === "published") {
        const blockers = pyqPublishBlockers(payload);
        if (blockers.length) { setSaveBlockers(blockers); return; }
      }
      await savePyq(editingId, payload);
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

  const editing = editingId ? pyqs.find(p => p.id === editingId) : null;
  const editingBlockers = editing ? blockersOf(editing) : [];
  const editingFlags = editing?.reviewFlags || [];
  const statsLoading = loading || papersLoading;
  const tableVerifyError = verifyError && !editingId ? pyqs.find(p => p.id === verifyError.id) : null;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />
      {!paperId ? null : (
        <>
          <StatGrid stats={[
            { label: "Questions in bank", value: counts.all, sub: `${years.length} year${years.length === 1 ? "" : "s"} covered`, icon: ListChecks, color: KIT.cyan, loading: statsLoading },
            { label: "Needs review", value: counts.needsReview, sub: `${fmt(counts.flagged)} carry review flags`, icon: Flag, color: KIT.orange, loading: statsLoading },
            { label: "Ready to publish", value: readyCount, sub: "Unpublished with zero publish blockers", icon: ShieldCheck, color: KIT.purple, loading: statsLoading },
            { label: "Published", value: counts.published, sub: "Visible to students", icon: Eye, color: KIT.green, loading: statsLoading },
          ]} />

          {/* The review queue's view switch. Counts sit on the tabs because
              "how much is left to check" is the single number an admin working
              through a PDF import actually wants, and putting it anywhere else
              means opening a tab to find out it is empty. */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PYQ_VIEWS.map(v => {
              const on = view === v.key;
              return (
                <button key={v.key} onClick={() => setView(v.key)}
                  className="font-sans text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: on ? `${KIT.green}14` : "transparent",
                    color: on ? KIT.green : "rgba(255,255,255,0.5)",
                    border: `1px solid ${on ? `${KIT.green}40` : KIT.line}`,
                  }}>
                  {v.label} <span className="tabular-nums opacity-60 ml-0.5">{fmt(counts[v.key])}</span>
                </button>
              );
            })}
          </div>

          {view === "needsReview" && counts.needsReview > 0 && (
            <Notice>
              These were extracted from the official question-paper PDFs by
              scripts/extract-gate-pyqs.mjs. The source papers contain NO answer keys, so
              every one needs its answer supplied and its text checked against the original
              before it can be published. Nothing here is visible to a student.
            </Notice>
          )}

          {tableVerifyError && (
            <Notice color={KIT.red}>
              Could not publish {pyqRef(tableVerifyError) || "the question"}{tableVerifyError.year ? ` (${tableVerifyError.year})` : ""}: {verifyError.message}
            </Notice>
          )}

          <DataTable
            title="Previous year questions" icon={ListChecks}
            subtitle="Publishing goes through Verify & publish, which refuses any question with no answer or no subject."
            rows={shown} loading={loading}
            searchKeys={["question", "subjectId", "topicId", "repeatGroup", "questionNumber"]}
            searchPlaceholder="Search question text, subject, topic..."
            filters={[
              STATUS_FILTER,
              { key: "needsReview", label: "Any review state", get: p => (p.needsReview === true ? "yes" : "no"),
                options: [{ value: "yes", label: "Needs review" }, { value: "no", label: "Reviewed / hand-authored" }] },
              { key: "subjectId", label: "All subjects", get: p => p.subjectId || "__none",
                options: [
                  ...subjectIds.map(id => ({ value: id, label: subjectName.get(id) || id })),
                  { value: "__none", label: "No subject" },
                ] },
              { key: "year", label: "All years", get: p => String(p.year || ""),
                options: years.map(y => ({ value: String(y), label: String(y) })) },
              { key: "questionType", label: "All types",
                options: GATE_QUESTION_TYPES.map(t => ({ value: t.key, label: t.label })) },
            ]}
            toolbarExtra={
              <div className="flex items-center gap-2 ml-auto">
                <SecondaryButton icon={Upload} onClick={() => setImportOpen(true)}>Bulk import</SecondaryButton>
                <SecondaryButton icon={Download} onClick={downloadTemplate}>CSV template</SecondaryButton>
              </div>
            }
            primaryAction={{ label: "Add question", icon: Plus, onClick: openCreate }}
            onRowClick={startEdit}
            pageSize={20}
            emptyText="No questions in this view."
            columns={[
              { key: "question", label: "Question", render: p => (
                <TitleCell title={p.question}
                  sub={[
                    (p.questionType || "").toUpperCase(),
                    p.repeatGroup && "Repeat",
                    !p.solution?.trim() && !p.explanation?.trim() && "No solution",
                  ].filter(Boolean).join(" · ")} />
              ) },
              { key: "year", label: "Paper / year", sort: p => p.year || 0, render: p => (
                <div className="whitespace-nowrap">
                  <p className="font-sans text-sm text-white/80 tabular-nums">{(p.paperId || paperId).toUpperCase()} {p.year || "-"}</p>
                  {pyqRef(p) && <p className="font-sans text-xs text-white/40">{pyqRef(p)}</p>}
                </div>
              ) },
              { key: "subjectId", label: "Subject", sort: p => subjectName.get(p.subjectId) || p.subjectId || "",
                render: p => (p.subjectId
                  ? <span className="font-sans text-sm text-white/70 truncate inline-block max-w-[180px] align-middle">{subjectName.get(p.subjectId) || p.subjectId}</span>
                  : <Pill color={KIT.red}>None</Pill>) },
              { key: "marks", label: "Marks", sort: p => p.marks || 1, render: p => <Num value={p.marks || 1} /> },
              { key: "status", label: "Status", render: p => <StatusPill status={p.status} /> },
              { key: "flags", label: "Flags", sort: p => (p.reviewFlags || []).length, render: p => {
                const flags = p.reviewFlags || [];
                return flags.length
                  ? <span title={flags.map(f => PYQ_REVIEW_FLAGS[f] || f).join("\n")}><Pill color={KIT.orange}>{flags.length} flag{flags.length === 1 ? "" : "s"}</Pill></span>
                  : <Muted>-</Muted>;
              } },
              // Verify is offered only where it can succeed. An always-enabled
              // button that explains afterwards why it refused is a worse
              // reviewer experience than one that shows what is still missing
              // up front - so the blocker count is a column of its own.
              { key: "ready", label: "Publish check", sort: p => (p.status === "published" ? -1 : blockersOf(p).length), render: p => {
                if (p.status === "published") return <Pill color={KIT.green}>Live</Pill>;
                const b = blockersOf(p);
                return b.length
                  ? <span title={b.join("\n")}><Pill color={KIT.red}>{b.length} to fix</Pill></span>
                  : <Pill color={KIT.cyan}>Ready</Pill>;
              } },
            ]}
            rowActions={p => [
              p.status !== "published" && {
                icon: ShieldCheck, label: "Verify & publish", onClick: () => verify(p),
                disabled: blockersOf(p).length > 0,
              },
              p.status === "published" && p.reviewedAt && { icon: Undo2, label: "Reopen for review", onClick: () => reopen(p) },
              { icon: Pencil, label: "Edit", onClick: () => startEdit(p) },
              { icon: Trash2, label: "Delete", danger: true, onClick: () => remove(p) },
            ]}
          />

          {/* ---- question editor ---- */}
          <Drawer open={adding || !!editingId} onClose={closeForm} width={820}
            title={adding ? "Add question" : `${editing?.year || ""} ${editing ? pyqRef(editing) : ""}`.trim() || "Edit question"}
            subtitle={adding ? `A new question in the ${paperId} bank.` : `${(editing?.questionType || "").toUpperCase()} · ${editing?.marks || 1} mark${editing?.marks === 2 ? "s" : ""} · ${cap(editing?.status || "draft")}`}
            footer={<>
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!form.question.trim()} onClick={handleSave}>Save question</PrimaryButton>
            </>}>
            {editing && (
              <DrawerSection title="Review"
                hint="Checks run against the SAVED question - save your edits first, then verify. Verifying marks it reviewed and publishes it in one write.">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill status={editing.status} />
                  {editing.needsReview === true && <Pill color={KIT.orange}>Needs review</Pill>}
                  {editing.reviewedAt && <Pill color={KIT.green}>Reviewed</Pill>}
                </div>
                {editingFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-sans text-xs font-medium text-white/60">Review flags</p>
                    {editingFlags.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <FlagChip flag={f} />
                        <span className="font-sans text-xs text-white/50 leading-relaxed">{PYQ_REVIEW_FLAGS[f] || "Raised on review."}</span>
                      </div>
                    ))}
                  </div>
                )}
                {editing.status !== "published" && (
                  editingBlockers.length > 0 ? (
                    <div className="space-y-1">
                      <p className="font-sans text-xs font-medium" style={{ color: KIT.red }}>
                        {editingBlockers.length} publish blocker{editingBlockers.length === 1 ? "" : "s"}
                      </p>
                      {editingBlockers.map((b, i) => (
                        <p key={i} className="font-sans text-xs text-white/60 flex items-start gap-1.5">
                          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: KIT.red }} />{b}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-sans text-xs" style={{ color: KIT.cyan }}>No blockers - this question can be published.</p>
                  )
                )}
                {verifyError?.id === editing.id && <Notice color={KIT.red}>{verifyError.message}</Notice>}
                <div className="flex gap-2 flex-wrap">
                  {editing.status !== "published" && (
                    <PrimaryButton icon={ShieldCheck} disabled={editingBlockers.length > 0} onClick={() => verify(editing)}>
                      Verify &amp; publish
                    </PrimaryButton>
                  )}
                  {editing.status === "published" && editing.reviewedAt && (
                    <SecondaryButton icon={Undo2} onClick={() => reopen(editing)}>Reopen for review</SecondaryButton>
                  )}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Classification">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Input label="YEAR" type="number" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} />
                <SelectField label="TYPE" value={form.questionType} onChange={v => setForm(p => ({ ...p, questionType: v }))}
                  options={GATE_QUESTION_TYPES.map(t => t.key)} />
                <SelectField label="MARKS" value={String(form.marks)} onChange={v => setForm(p => ({ ...p, marks: Number(v) }))}
                  options={["1", "2"]} />
                <SelectField label="DIFFICULTY" value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
                  options={GATE_DIFFICULTIES} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input label="SUBJECT ID" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))}
                  placeholder="operating-system" hint="Must match a subject id under this paper" />
                <Input label="TOPIC ID" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))}
                  placeholder="cpu-scheduling" hint="Drives topic tagging + per-topic analytics" />
                <SelectField label="ORGANIZING INSTITUTE" value={form.organizingInstitute} onChange={v => setForm(p => ({ ...p, organizingInstitute: v }))}
                  options={["", ...GATE_ORGANIZING_INSTITUTES]} />
              </div>
              {(subjects || []).length > 0 && (
                <p className="font-sans text-[11px] text-white/35 leading-relaxed">
                  Subject ids in {paperId}: {(subjects || []).map(s => s.id).join(", ")}
                </p>
              )}
            </DrawerSection>

            <DrawerSection title="Question & answer">
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
            </DrawerSection>

            <DrawerSection title="Solution">
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
            </DrawerSection>

            <DrawerSection title="Publishing"
              hint="Saving with status Published is refused while the question has any publish blocker - supply the answer and subject first.">
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="REPEAT GROUP (a shared label marks these as the same concept re-asked)"
                  value={form.repeatGroup} onChange={v => setForm(p => ({ ...p, repeatGroup: v }))} />
                <SelectField label="STATUS" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} />
              </div>
              {saveBlockers && (
                <Notice color={KIT.red}>
                  <p className="font-medium mb-1">Not saved - a question cannot be published with:</p>
                  {saveBlockers.map((b, i) => <p key={i}>{b}</p>)}
                  <p className="mt-1 text-white/50">Fix these, or save it as a draft.</p>
                </Notice>
              )}
            </DrawerSection>
          </Drawer>

          {/* ---- bulk CSV import ---- */}
          <Drawer open={importOpen} onClose={() => setImportOpen(false)} width={760}
            title="Bulk import questions"
            subtitle={`CSV rows are validated before anything is written to the ${paperId} bank.`}
            footer={<>
              <SecondaryButton icon={Download} onClick={downloadTemplate}>CSV template</SecondaryButton>
              <PrimaryButton icon={Upload} busy={importing} disabled={!importText.trim()} onClick={runImport}>
                {importing ? "Importing..." : "Validate & import"}
              </PrimaryButton>
            </>}>
            <DrawerSection title="Format">
              <pre className="font-mono text-[10.5px] text-white/45 whitespace-pre-wrap leading-relaxed">{PYQ_CSV_HELP}</pre>
            </DrawerSection>
            <DrawerSection title="Paste">
              <Textarea label="PASTE CSV (or tab-separated from a spreadsheet)" rows={10}
                value={importText} onChange={setImportText} />
            </DrawerSection>
            {importResult && (
              <DrawerSection title="Result">
                <p className="font-sans text-sm" style={{ color: importResult.done ? KIT.green : KIT.gold }}>
                  {importResult.done
                    ? `Imported ${importResult.questions.length} question(s).`
                    : `${importResult.questions.length} valid row(s) ready.`}
                </p>
                {importResult.errors.map((e, i) => (
                  <p key={i} className="font-sans text-xs" style={{ color: KIT.orange }}>{e}</p>
                ))}
              </DrawerSection>
            )}
          </Drawer>
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

const testTypeLabel = (key) => TEST_TYPES.find(t => t.key === key)?.label || key || "-";

export function GateTestsPanel() {
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
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

  const closeForm = () => { setEditingId(null); setAdding(false); };

  const startEdit = (t) => {
    setEditingId(t.id); setAdding(false);
    setForm({
      ...blankTestForm(), ...t,
      sourceYear: t.sourceYear ?? "",
      subjectIdsText: (t.subjectIds || []).join(", "),
      topicIdsText: (t.topicIds || []).join(", "),
    });
  };

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

  const handleDelete = async (t) => {
    if (!confirm("Delete this test, its questions and its answer keys? Student attempts are kept.")) return;
    await deleteTest(t.id); load();
  };

  if (managing) {
    return <GateTestQuestionsPanel test={managing} onBack={() => { setManaging(null); load(); }} />;
  }

  const published = tests.filter(t => t.status === "published").length;
  const questionTotal = tests.reduce((n, t) => n + (t.questionCount || 0), 0);
  const empty = tests.filter(t => !t.questionCount).length;
  const fullMocks = tests.filter(t => t.testType === "full").length;
  const statsLoading = loading || papersLoading;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />
      {!paperId ? null : (
        <>
          <StatGrid stats={[
            { label: "Tests", value: tests.length, sub: `${published} published`, icon: ClipboardList, color: KIT.green, loading: statsLoading },
            { label: "Full-length mocks", value: fullMocks, sub: `${tests.length - fullMocks} topic, subject or other tests`, icon: GraduationCap, color: KIT.cyan, loading: statsLoading },
            { label: "Questions", value: questionTotal, sub: "Across every test", icon: ListChecks, color: KIT.purple, loading: statsLoading },
            { label: "Empty tests", value: empty, sub: "No questions added yet", icon: AlertTriangle, color: KIT.orange, loading: statsLoading },
          ]} />

          <DataTable
            title="Tests & mocks" icon={ClipboardList}
            subtitle="Marking is always GATE's own scheme (MCQ: -1/3 on 1-mark, -2/3 on 2-mark; MSQ and NAT: no negative marking) and is not configurable per test."
            rows={tests} loading={loading}
            searchKeys={["title", "description", "testType"]} searchPlaceholder="Search tests..."
            filters={[
              STATUS_FILTER,
              { key: "testType", label: "All types", options: TEST_TYPES.map(t => ({ value: t.key, label: t.label })) },
            ]}
            primaryAction={{ label: "Add test", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm(blankTestForm()); } }}
            onRowClick={startEdit}
            emptyText="No tests yet."
            columns={[
              { key: "title", label: "Test", render: t => <TitleCell title={t.title} sub={t.description} /> },
              { key: "testType", label: "Type", render: t => <Pill color={KIT.cyan}>{testTypeLabel(t.testType)}</Pill> },
              { key: "questionCount", label: "Questions", sort: t => t.questionCount || 0, render: t => (
                t.questionCount ? <Num value={t.questionCount} /> : <Pill color={KIT.orange}>None</Pill>
              ) },
              { key: "totalMarks", label: "Marks", sort: t => t.totalMarks || 0, render: t => <Num value={t.totalMarks || 0} muted /> },
              { key: "durationMinutes", label: "Duration", sort: t => Number(t.durationMinutes) || 0, render: t => <Muted>{t.durationMinutes ? `${t.durationMinutes} min` : "-"}</Muted> },
              { key: "sourceYear", label: "Source year", sort: t => t.sourceYear || 0, render: t => <Muted>{t.sourceYear || "-"}</Muted> },
              { key: "status", label: "Status", render: t => <StatusPill status={t.status} /> },
            ]}
            rowActions={t => [
              { icon: ClipboardList, label: "Questions", onClick: () => setManaging(t) },
              { icon: Pencil, label: "Edit", onClick: () => startEdit(t) },
              { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(t) },
            ]}
          />

          <Drawer open={adding || !!editingId} onClose={closeForm}
            title={adding ? "Add test" : form.title || "Edit test"}
            subtitle={TEST_TYPES.find(t => t.key === form.testType)?.detail}
            footer={<>
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!form.title.trim()} onClick={handleSave}>Save test</PrimaryButton>
            </>}>
            <DrawerSection title="Test">
              <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Full Length Mock 1" />
              <Textarea label="DESCRIPTION" rows={2} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <SelectField label="TYPE" value={form.testType} onChange={v => setForm(p => ({ ...p, testType: v }))}
                  options={TEST_TYPES.map(t => t.key)} />
                <Input label="DURATION (MIN)" type="number" value={form.durationMinutes} onChange={v => setForm(p => ({ ...p, durationMinutes: v }))} />
                <Input label="SOURCE YEAR (for PYQ mocks)" type="number" value={form.sourceYear} onChange={v => setForm(p => ({ ...p, sourceYear: v }))} />
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
              </div>
              <p className="font-sans text-xs text-white/40 leading-relaxed">
                {TEST_TYPES.find(t => t.key === form.testType)?.detail} Marking is always GATE&apos;s own scheme
                (MCQ: -1/3 on 1-mark, -2/3 on 2-mark; MSQ and NAT: no negative marking) and is not configurable per test.
              </p>
            </DrawerSection>
            <DrawerSection title="Scope">
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="SUBJECT IDS (comma-separated - scopes a subject test)" value={form.subjectIdsText}
                  onChange={v => setForm(p => ({ ...p, subjectIdsText: v }))} />
                <Input label="TOPIC IDS (comma-separated - a topic test appears on those topics' lessons)"
                  value={form.topicIdsText} onChange={v => setForm(p => ({ ...p, topicIdsText: v }))} />
              </div>
            </DrawerSection>
            <DrawerSection title="Before starting">
              <Textarea label="INSTRUCTIONS SHOWN BEFORE STARTING" rows={3}
                value={form.instructions} onChange={v => setForm(p => ({ ...p, instructions: v }))} />
              <SelectField label="STATUS" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
            </DrawerSection>
          </Drawer>
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
  const [importOpen, setImportOpen] = useState(false);
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

  const closeForm = () => { setEditingId(null); setAdding(false); };

  const startEdit = (q) => {
    const key = keys[q.id];
    setEditingId(q.id); setAdding(false);
    setForm({
      ...blankTestQuestionForm(), ...q, ...(key || {}),
      optionsText: (q.options || []).map(o => o.text).join("\n"),
      correctAnswer: (key?.correctOptionIds || []).join(","),
      natMin: key?.natMin ?? "", natMax: key?.natMax ?? "",
    });
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

  const handleDelete = async (q) => {
    if (!confirm("Delete this question and its answer key?")) return;
    await deleteTestQuestion(test.id, q.id);
    const all = await fetchTestQuestions(test.id);
    await setTestQuestionStats(test.id, all);
    load();
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
  // Row shape for the table: the position in the test (Q1, Q2...) and whether
  // the answer key exists travel with the question, so they sort and filter.
  const rows = useMemo(() => questions.map((q, i) => ({ ...q, _n: i + 1, _key: keys[q.id] || null })), [questions, keys]);
  const withKey = rows.filter(r => r._key).length;
  const withSolution = rows.filter(r => r._key && (r._key.explanation?.trim() || r._key.solution?.trim())).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <SecondaryButton icon={ArrowLeft} onClick={onBack}>Back to tests</SecondaryButton>
        <h3 className="font-sans text-base font-semibold text-white">{test.title}</h3>
        <Pill color={KIT.cyan}>{testTypeLabel(test.testType)}</Pill>
      </div>

      <StatGrid stats={[
        { label: "Questions", value: questions.length, sub: `${test.durationMinutes || "-"} min test`, icon: ListChecks, color: KIT.green, loading },
        { label: "Total marks", value: totalMarks, sub: "Sum of question marks", icon: Hash, color: KIT.cyan, loading },
        { label: "Answer keys", value: `${fmt(withKey)} / ${fmt(questions.length)}`, sub: `${questions.length - withKey} missing`, icon: KeyRound, color: KIT.orange, loading },
        { label: "Solutions written", value: withSolution, sub: "Keys with a solution or explanation", icon: BookOpen, color: KIT.purple, loading },
      ]} />

      {validation && (
        <Notice color={validation.valid ? KIT.green : KIT.red} icon={validation.valid ? Check : AlertTriangle}>
          <p className="font-medium">
            {validation.valid ? "Ready to publish - every question has options, a marked answer, valid marks and a solution."
              : `${validation.errors.length} problem(s) block publishing:`}
          </p>
          {validation.errors.map((e, i) => <p key={i} className="text-white/60">{e}</p>)}
        </Notice>
      )}

      <DataTable
        title="Questions" icon={ClipboardList}
        subtitle="Answer keys live in a separate admin-only collection - a question with no key cannot be graded."
        rows={rows} loading={loading}
        searchKeys={["question", "subjectId", "topicId"]} searchPlaceholder="Search questions..."
        filters={[
          { key: "questionType", label: "All types", options: GATE_QUESTION_TYPES.map(t => ({ value: t.key, label: t.label })) },
          { key: "marks", label: "Any marks", get: q => String(q.marks || 1), options: [{ value: "1", label: "1 mark" }, { value: "2", label: "2 marks" }] },
          { key: "key", label: "Any key state", get: q => (q._key ? "yes" : "no"),
            options: [{ value: "yes", label: "Has answer key" }, { value: "no", label: "No answer key" }] },
        ]}
        toolbarExtra={
          <div className="flex items-center gap-2 ml-auto">
            <SecondaryButton icon={Check} onClick={runValidation}>Validate for publishing</SecondaryButton>
            <SecondaryButton icon={Upload} onClick={() => setImportOpen(true)}>Bulk import</SecondaryButton>
          </div>
        }
        primaryAction={{ label: "Add question", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm({ ...blankTestQuestionForm(), order: questions.length + 1 }); } }}
        onRowClick={startEdit}
        pageSize={20}
        emptyText="No questions yet."
        columns={[
          { key: "_n", label: "Q", sort: q => q._n, render: q => <span className="font-sans text-sm text-white/60 tabular-nums">Q{q._n}</span> },
          { key: "question", label: "Question", render: q => <TitleCell title={q.question} sub={[q.subjectId, q.topicId].filter(Boolean).join(" / ")} /> },
          { key: "questionType", label: "Type", render: q => <Pill color={KIT.cyan}>{(q.questionType || "").toUpperCase()}</Pill> },
          { key: "marks", label: "Marks", sort: q => q.marks || 1, render: q => <Num value={q.marks || 1} /> },
          { key: "key", label: "Answer key", sort: q => (q._key ? 1 : 0), render: q => (
            q._key ? <Pill color={KIT.green}>Set</Pill> : <Pill color={KIT.red}>No key</Pill>
          ) },
          { key: "solution", label: "Solution", sortable: false, render: q => (
            !q._key ? <Muted>-</Muted>
              : (q._key.explanation?.trim() || q._key.solution?.trim()) ? <Pill color={KIT.green}>Written</Pill>
                : <Pill color={KIT.orange}>No solution</Pill>
          ) },
        ]}
        rowActions={q => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(q) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(q) },
        ]}
      />

      <Drawer open={adding || !!editingId} onClose={closeForm} width={820}
        title={adding ? "Add question" : `Edit Q${rows.find(r => r.id === editingId)?._n || ""}`}
        subtitle={GATE_QUESTION_TYPES.find(t => t.key === form.questionType)?.detail}
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.question.trim()} onClick={handleSave}>Save question</PrimaryButton>
        </>}>
        <DrawerSection title="Classification">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <SelectField label="TYPE" value={form.questionType} onChange={v => setForm(p => ({ ...p, questionType: v }))}
              options={GATE_QUESTION_TYPES.map(t => t.key)} />
            <SelectField label="MARKS" value={String(form.marks)} onChange={v => setForm(p => ({ ...p, marks: Number(v) }))} options={["1", "2"]} />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <SelectField label="DIFFICULTY" value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={GATE_DIFFICULTIES} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="SUBJECT ID (drives subject-wise analysis)" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
            <Input label="TOPIC ID (drives weak-topic detection)" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))} />
          </div>
        </DrawerSection>
        <DrawerSection title="Question & answer">
          <Textarea label="QUESTION" rows={4} value={form.question} onChange={v => setForm(p => ({ ...p, question: v }))} />
          <Textarea label="CODE SNIPPET (optional, rendered monospaced)" rows={4} value={form.codeSnippet} onChange={v => setForm(p => ({ ...p, codeSnippet: v }))} />
          <Input label="IMAGE URL (optional - for circuit/graph figures)" value={form.imageUrl} onChange={v => setForm(p => ({ ...p, imageUrl: v }))} />
          {form.questionType === "nat" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
        </DrawerSection>
        <DrawerSection title="Solution">
          <Textarea label="SOLUTION" rows={4} value={form.solution} onChange={v => setForm(p => ({ ...p, solution: v }))} />
          <Textarea label="EXPLANATION" rows={3} value={form.explanation} onChange={v => setForm(p => ({ ...p, explanation: v }))} />
          <Textarea label="ALTERNATE APPROACH" rows={2} value={form.alternateSolution} onChange={v => setForm(p => ({ ...p, alternateSolution: v }))} />
          <Textarea label="TIME-SAVING TRICK" rows={2} value={form.timeSavingTrick} onChange={v => setForm(p => ({ ...p, timeSavingTrick: v }))} />
          <Textarea label="WHY STUDENTS GET THIS WRONG" rows={2} value={form.whyStudentsErr} onChange={v => setForm(p => ({ ...p, whyStudentsErr: v }))} />
          <StringListField label="RELATED CONCEPTS" items={form.relatedConcepts} onChange={v => setForm(p => ({ ...p, relatedConcepts: v }))} />
        </DrawerSection>
      </Drawer>

      <Drawer open={importOpen} onClose={() => setImportOpen(false)} width={760}
        title="Bulk import questions" subtitle="Same CSV format as the PYQ bank."
        footer={
          <PrimaryButton icon={Upload} busy={importing} disabled={!importText.trim()} onClick={runImport}>
            {importing ? "Importing..." : "Validate & import"}
          </PrimaryButton>
        }>
        <DrawerSection title="Format">
          <pre className="font-mono text-[10.5px] text-white/45 whitespace-pre-wrap leading-relaxed">{PYQ_CSV_HELP}</pre>
        </DrawerSection>
        <DrawerSection title="Paste">
          <Textarea label="PASTE CSV" rows={10} value={importText} onChange={setImportText} />
        </DrawerSection>
        {importResult && (
          <DrawerSection title="Result">
            <p className="font-sans text-sm" style={{ color: importResult.done ? KIT.green : KIT.gold }}>
              {importResult.done ? `Imported ${importResult.count} question(s).` : `${importResult.count} valid row(s) ready.`}
            </p>
            {importResult.errors.map((e, i) => <p key={i} className="font-sans text-xs" style={{ color: KIT.orange }}>{e}</p>)}
          </DrawerSection>
        )}
      </Drawer>
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
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankFormulaForm());
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const load = () => {
    if (!paperId) { setFormulas([]); return; }
    setLoading(true);
    fetchFormulas(paperId, { includeUnpublished: true }).then(setFormulas).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const closeForm = () => { setEditingId(null); setAdding(false); };
  const startEdit = (f) => { setEditingId(f.id); setAdding(false); setForm({ ...blankFormulaForm(), ...f }); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await saveFormula(editingId, { ...form, paperId, order: Number(form.order) || 0 });
      setEditingId(null); setAdding(false); setForm(blankFormulaForm());
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (f) => {
    if (confirm("Delete this entry?")) { await deleteFormula(f.id); load(); }
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

  const kindLabel = (k) => FORMULA_KINDS.find(x => x.key === k)?.label || k || "-";
  const published = formulas.filter(f => f.status === "published").length;
  const subjectsCovered = new Set(formulas.map(f => f.subjectId).filter(Boolean));
  const withTopic = formulas.filter(f => f.topicId).length;
  const withTrick = formulas.filter(f => f.memoryTrick?.trim()).length;
  const statsLoading = loading || papersLoading;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />
      {!paperId ? null : (
        <>
          <StatGrid stats={[
            { label: "Standalone entries", value: formulas.length, sub: `${published} published`, icon: Sigma, color: KIT.gold, loading: statsLoading },
            { label: "Subjects covered", value: subjectsCovered.size, sub: "Distinct subject ids", icon: Layers, color: KIT.cyan, loading: statsLoading },
            { label: "Tied to a topic", value: withTopic, sub: `${formulas.length - withTopic} cross-cutting`, icon: ListChecks, color: KIT.green, loading: statsLoading },
            { label: "With a memory trick", value: withTrick, sub: "Entries carrying a mnemonic", icon: Sparkles, color: KIT.purple, loading: statsLoading },
          ]} />

          <DataTable
            title="Formula book" icon={Sigma}
            subtitle="Anything typed into a topic's FORMULA BOX already appears in the student-facing Formula Book automatically - this list is for entries that do not belong to a single lesson (cross-cutting theorems, definition sheets, revision cards)."
            rows={formulas} loading={loading}
            searchKeys={["title", "expression", "statement", "subjectId", "topicId", "tags"]} searchPlaceholder="Search entries..."
            filters={[
              { key: "kind", label: "All kinds", options: FORMULA_KINDS.map(k => ({ value: k.key, label: k.label })) },
              { key: "subjectId", label: "All subjects", get: f => f.subjectId || "__none",
                options: [...[...subjectsCovered].sort().map(s => ({ value: s, label: s })), { value: "__none", label: "No subject" }] },
              STATUS_FILTER,
            ]}
            toolbarExtra={
              <div className="ml-auto">
                <SecondaryButton icon={Upload} onClick={() => setImportOpen(true)}>Bulk import</SecondaryButton>
              </div>
            }
            primaryAction={{ label: "Add entry", icon: Plus, onClick: () => { setAdding(true); setEditingId(null); setForm(blankFormulaForm()); } }}
            onRowClick={startEdit}
            emptyText="No standalone entries."
            columns={[
              { key: "title", label: "Entry", render: f => <TitleCell title={f.title} sub={f.expression || f.statement} /> },
              { key: "kind", label: "Kind", render: f => <Pill color={KIT.gold}>{kindLabel(f.kind)}</Pill> },
              { key: "subjectId", label: "Subject", render: f => <Muted>{f.subjectId}</Muted> },
              { key: "topicId", label: "Topic", render: f => <Muted>{f.topicId}</Muted> },
              { key: "order", label: "Order", sort: f => Number(f.order) || 0, render: f => <Num value={f.order} muted /> },
              { key: "status", label: "Status", render: f => <StatusPill status={f.status} /> },
            ]}
            rowActions={f => [
              { icon: Pencil, label: "Edit", onClick: () => startEdit(f) },
              { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(f) },
            ]}
          />

          <Drawer open={adding || !!editingId} onClose={closeForm}
            title={adding ? "Add entry" : form.title || "Edit entry"}
            subtitle={FORMULA_KINDS.find(k => k.key === form.kind)?.detail}
            footer={<>
              <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!form.title.trim()} onClick={handleSave}>Save entry</PrimaryButton>
            </>}>
            <DrawerSection title="Placement">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <SelectField label="KIND" value={form.kind} onChange={v => setForm(p => ({ ...p, kind: v }))} options={FORMULA_KINDS.map(k => k.key)} />
                <Input label="SUBJECT ID" value={form.subjectId} onChange={v => setForm(p => ({ ...p, subjectId: v }))} />
                <Input label="TOPIC ID (optional)" value={form.topicId} onChange={v => setForm(p => ({ ...p, topicId: v }))} />
                <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
              </div>
            </DrawerSection>
            <DrawerSection title="Content">
              <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Master Theorem" />
              <Textarea label="EXPRESSION (rendered monospaced - write it as you would on paper)" rows={3}
                value={form.expression} onChange={v => setForm(p => ({ ...p, expression: v }))} placeholder="T(n) = aT(n/b) + f(n)" />
              <Textarea label="STATEMENT" rows={3} value={form.statement} onChange={v => setForm(p => ({ ...p, statement: v }))} />
              <Textarea label="NOTES / CONDITIONS" rows={2} value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} />
              <Input label="MEMORY TRICK" value={form.memoryTrick} onChange={v => setForm(p => ({ ...p, memoryTrick: v }))} />
              <StringListField label="TAGS" items={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />
            </DrawerSection>
            <DrawerSection title="Publishing">
              <SelectField label="STATUS" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
            </DrawerSection>
          </Drawer>

          <Drawer open={importOpen} onClose={() => setImportOpen(false)} width={720}
            title="Bulk import entries" subtitle={`Imported entries are published into the ${paperId} formula book.`}
            footer={
              <PrimaryButton icon={Upload} busy={importing} disabled={!importText.trim()} onClick={runImport}>
                {importing ? "Importing..." : "Import"}
              </PrimaryButton>
            }>
            <DrawerSection title="Format" hint="Tags are separated by semicolons.">
              <p className="font-mono text-[10.5px] text-white/45 break-all">{FORMULA_CSV_HEADER}</p>
            </DrawerSection>
            <DrawerSection title="Paste">
              <Textarea label="PASTE CSV" rows={10} value={importText} onChange={setImportText} />
              {importMsg && <p className="font-sans text-sm" style={{ color: KIT.green }}>{importMsg}</p>}
            </DrawerSection>
          </Drawer>
        </>
      )}
    </div>
  );
}

// ============================================================
// 6. RESOURCES + ANNOUNCEMENTS
// ============================================================

function blankResourceForm() {
  return { kind: "book", subjectId: "", title: "", author: "", url: "", description: "", order: 0, status: "published" };
}

function blankAnnouncementForm() {
  return { title: "", body: "", pinned: false, status: "published" };
}

export function GateResourcesPanel() {
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rForm, setRForm] = useState(blankResourceForm());
  const [aForm, setAForm] = useState(blankAnnouncementForm());
  // Drawer state: null = closed, "new" = create, otherwise the id being edited.
  const [editingR, setEditingR] = useState(null);
  const [editingA, setEditingA] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!paperId) { setResources([]); setAnnouncements([]); return; }
    setLoading(true);
    Promise.all([
      fetchResources(paperId, { includeUnpublished: true }).then(setResources).catch(console.error),
      fetchAnnouncements(paperId, { includeUnpublished: true }).then(setAnnouncements).catch(console.error),
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { load();   }, [paperId]);

  const saveR = async () => {
    if (!rForm.title.trim()) return;
    setSaving(true);
    try {
      await saveResource(editingR === "new" ? null : editingR, { ...rForm, paperId, order: Number(rForm.order) || 0 });
      setEditingR(null);
      setRForm(blankResourceForm());
      load();
    } finally { setSaving(false); }
  };

  const saveA = async () => {
    if (!aForm.title.trim()) return;
    setSaving(true);
    try {
      await saveAnnouncement(editingA === "new" ? null : editingA, { ...aForm, paperId });
      setEditingA(null);
      setAForm(blankAnnouncementForm());
      load();
    } finally { setSaving(false); }
  };

  const kindLabel = (k) => RESOURCE_KINDS.find(x => x.key === k)?.label || k || "-";
  const rPublished = resources.filter(r => r.status === "published").length;
  const aPublished = announcements.filter(a => a.status === "published").length;
  const pinned = announcements.filter(a => a.pinned).length;
  const linked = resources.filter(r => r.url?.trim()).length;
  const statsLoading = loading || papersLoading;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />
      {!paperId ? null : (
        <>
          <StatGrid stats={[
            { label: "Resources", value: resources.length, sub: `${rPublished} published`, icon: Library, color: KIT.green, loading: statsLoading },
            { label: "With a link", value: linked, sub: `${resources.length - linked} without a URL`, icon: Link2, color: KIT.cyan, loading: statsLoading },
            { label: "Announcements", value: announcements.length, sub: `${aPublished} published`, icon: Megaphone, color: KIT.purple, loading: statsLoading },
            { label: "Pinned", value: pinned, sub: "Shown at the top for students", icon: Pin, color: KIT.gold, loading: statsLoading },
          ]} />

          <DataTable
            title="Resources" icon={Library}
            subtitle="Books, lecture series and notes recommended to students of this paper."
            rows={resources} loading={loading}
            searchKeys={["title", "author", "url", "description", "subjectId"]} searchPlaceholder="Search resources..."
            filters={[
              { key: "kind", label: "All kinds", options: RESOURCE_KINDS.map(k => ({ value: k.key, label: k.label })) },
              STATUS_FILTER,
            ]}
            primaryAction={{ label: "Add resource", icon: Plus, onClick: () => { setRForm(blankResourceForm()); setEditingR("new"); } }}
            onRowClick={r => { setEditingR(r.id); setRForm({ ...blankResourceForm(), ...r }); }}
            emptyText="No resources yet."
            columns={[
              { key: "title", label: "Resource", render: r => <TitleCell title={r.title} sub={r.author || r.description} /> },
              { key: "kind", label: "Kind", render: r => <Pill color={KIT.cyan}>{kindLabel(r.kind)}</Pill> },
              { key: "subjectId", label: "Subject", render: r => <Muted>{r.subjectId}</Muted> },
              { key: "url", label: "Link", sortable: false, render: r => (
                r.url
                  ? <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="font-sans text-xs truncate inline-block max-w-[200px] align-middle hover:underline" style={{ color: KIT.cyan }}>{r.url}</a>
                  : <Muted>-</Muted>
              ) },
              { key: "status", label: "Status", render: r => <StatusPill status={r.status} /> },
            ]}
            rowActions={r => [
              { icon: Pencil, label: "Edit", onClick: () => { setEditingR(r.id); setRForm({ ...blankResourceForm(), ...r }); } },
              { icon: Trash2, label: "Delete", danger: true, onClick: async () => { if (confirm("Delete?")) { await deleteResource(r.id); load(); } } },
            ]}
          />

          <DataTable
            title="Announcements" icon={Megaphone}
            subtitle="Notices shown on this paper's GATE home. Pinned ones sit at the top."
            rows={announcements} loading={loading}
            searchKeys={["title", "body"]} searchPlaceholder="Search announcements..."
            filters={[
              { key: "pinned", label: "Pinned or not", get: a => (a.pinned ? "yes" : "no"),
                options: [{ value: "yes", label: "Pinned" }, { value: "no", label: "Not pinned" }] },
              STATUS_FILTER,
            ]}
            primaryAction={{ label: "Post announcement", icon: Plus, onClick: () => { setAForm(blankAnnouncementForm()); setEditingA("new"); } }}
            onRowClick={a => { setEditingA(a.id); setAForm({ ...blankAnnouncementForm(), ...a }); }}
            emptyText="No announcements yet."
            columns={[
              { key: "title", label: "Announcement", render: a => <TitleCell title={a.title} sub={a.body} /> },
              { key: "pinned", label: "Pinned", sort: a => (a.pinned ? 1 : 0), render: a => (a.pinned ? <Pill color={KIT.gold}>Pinned</Pill> : <Muted>-</Muted>) },
              { key: "status", label: "Status", render: a => <StatusPill status={a.status} /> },
            ]}
            rowActions={a => [
              { icon: Pencil, label: "Edit", onClick: () => { setEditingA(a.id); setAForm({ ...blankAnnouncementForm(), ...a }); } },
              { icon: Trash2, label: "Delete", danger: true, onClick: async () => { if (confirm("Delete?")) { await deleteAnnouncement(a.id); load(); } } },
            ]}
          />

          <Drawer open={!!editingR} onClose={() => setEditingR(null)} width={640}
            title={editingR === "new" ? "Add resource" : rForm.title || "Edit resource"}
            subtitle="The WHY THIS ONE text is shown to students beside the link."
            footer={<>
              <SecondaryButton onClick={() => setEditingR(null)}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!rForm.title.trim()} onClick={saveR}>{editingR === "new" ? "Add resource" : "Update"}</PrimaryButton>
            </>}>
            <DrawerSection title="Resource">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <SelectField label="KIND" value={rForm.kind} onChange={v => setRForm(p => ({ ...p, kind: v }))} options={RESOURCE_KINDS.map(k => k.key)} />
                <Input label="SUBJECT ID (optional)" value={rForm.subjectId} onChange={v => setRForm(p => ({ ...p, subjectId: v }))} />
                <Input label="ORDER" type="number" value={rForm.order} onChange={v => setRForm(p => ({ ...p, order: v }))} />
                <SelectField label="STATUS" value={rForm.status} onChange={v => setRForm(p => ({ ...p, status: v }))} options={STATUSES} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label="TITLE" value={rForm.title} onChange={v => setRForm(p => ({ ...p, title: v }))} />
                <Input label="AUTHOR / CHANNEL" value={rForm.author} onChange={v => setRForm(p => ({ ...p, author: v }))} />
              </div>
              <Input label="URL" value={rForm.url} onChange={v => setRForm(p => ({ ...p, url: v }))} placeholder="https://..." />
              <Textarea label="WHY THIS ONE (shown to students)" rows={2} value={rForm.description} onChange={v => setRForm(p => ({ ...p, description: v }))} />
            </DrawerSection>
          </Drawer>

          <Drawer open={!!editingA} onClose={() => setEditingA(null)} width={620}
            title={editingA === "new" ? "Post announcement" : aForm.title || "Edit announcement"}
            footer={<>
              <SecondaryButton onClick={() => setEditingA(null)}>Cancel</SecondaryButton>
              <PrimaryButton icon={Check} busy={saving} disabled={!aForm.title.trim()} onClick={saveA}>{editingA === "new" ? "Post" : "Update"}</PrimaryButton>
            </>}>
            <DrawerSection title="Announcement">
              <Input label="TITLE" value={aForm.title} onChange={v => setAForm(p => ({ ...p, title: v }))} />
              <Textarea label="BODY" rows={4} value={aForm.body} onChange={v => setAForm(p => ({ ...p, body: v }))} />
              <div className="flex items-end gap-4 flex-wrap">
                <label className="flex items-center gap-2 font-sans text-sm text-white/60 pb-2">
                  <input type="checkbox" checked={!!aForm.pinned} onChange={e => setAForm(p => ({ ...p, pinned: e.target.checked }))} />
                  Pin to the top
                </label>
                <SelectField label="STATUS" value={aForm.status} onChange={v => setAForm(p => ({ ...p, status: v }))} options={STATUSES} className="w-40" />
              </div>
            </DrawerSection>
          </Drawer>
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
  create: { color: KIT.green, label: "Will add content" },
  update: { color: KIT.gold, label: "Will overwrite" },
  unknown: { color: KIT.orange, label: "No such topic" },
  invalid: { color: KIT.red, label: "Invalid" },
};

export function GateLessonImportPanel() {
  const { papers, paperId, setPaperId, loading: papersLoading } = usePapers();
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

  if (papers.length === 0) return <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />;

  const subjectList = subjects || [];
  const topicTotal = subjectList.reduce((n, s) => n + (s.topicCount || 0), 0);
  const counts = report?.counts;

  return (
    <div className="space-y-5">
      <PaperSelect papers={papers} paperId={paperId} setPaperId={setPaperId} loading={papersLoading} />

      <StatGrid stats={[
        { label: "Subjects in paper", value: subjectList.length, sub: "Available as template scope", icon: Layers, color: KIT.green, loading: subjects === null },
        { label: "Topics in paper", value: topicTotal, sub: "Valid import targets", icon: ListChecks, color: KIT.cyan, loading: subjects === null },
        { label: "Rows validated", value: report?.rows ? report.rows.length : "-",
          sub: counts ? `${counts.create} add · ${counts.update} overwrite · ${counts.unknown + counts.invalid} skipped` : "Validate to see the diff",
          icon: FileJson, color: KIT.orange },
        { label: "Will be written", value: report?.writable ? report.writable.length : "-",
          sub: done !== null ? `Last import wrote ${done} topic${done === 1 ? "" : "s"}` : "Rows that pass validation",
          icon: Sparkles, color: KIT.purple },
      ]} />

      <KitCard icon={Download} color={KIT.cyan} title="Step 1 - Get a template"
        hint="Export the paper's real topic ids so nothing has to be typed by hand. Edit the prose in a proper editor, then bring the file back. Only the fields left in the file are written - a file containing nothing but shortNotes updates only short notes and leaves every authored lesson intact.">
        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="w-64">
            <SelectField label="SUBJECT (BLANK = WHOLE PAPER)" value={templateSubject} onChange={setTemplateSubject}
              options={["", ...subjectList.map(s => s.id)]} />
          </div>
          <SecondaryButton icon={Download} onClick={() => exportTemplate(true)} disabled={busy}>
            Export with existing content
          </SecondaryButton>
          <SecondaryButton icon={Download} onClick={() => exportTemplate(false)} disabled={busy}>
            Export ids only
          </SecondaryButton>
          <SecondaryButton icon={Copy} onClick={() => setText(LESSON_IMPORT_EXAMPLE)}>
            Load a filled example
          </SecondaryButton>
        </div>
      </KitCard>

      <KitCard icon={Upload} color={KIT.cyan} title="Step 2 - Paste or upload, then validate"
        hint="Validation compares every row against this paper's real topic ids before anything is written.">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="inline-flex items-center justify-center gap-2 font-sans text-sm px-3.5 py-2 rounded-lg border border-white/12 text-white/70 hover:text-white hover:border-white/25 transition-colors cursor-pointer">
            <Upload size={14} /> Choose a .json file
            <input type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
          </label>
          <span className="font-sans text-xs text-white/40">
            {text ? `${text.length.toLocaleString()} characters loaded` : "Nothing loaded yet"}
          </span>
        </div>
        <Textarea label="LESSON JSON" value={text} rows={12}
          onChange={v => { setText(v); setReport(null); setDone(null); }}
          placeholder={'{ "paperId": "cs", "topics": [ { "subjectId": "digital-logic", "topicId": "karnaugh-map", "concept": "..." } ] }'} />
        <div className="flex items-center gap-2.5">
          <PrimaryButton icon={Check} onClick={validate} busy={busy && !progress} disabled={busy || !text.trim()}>
            {busy && !progress ? "Validating..." : "Validate (writes nothing)"}
          </PrimaryButton>
        </div>
      </KitCard>

      {report?.fatal && <Notice color={KIT.red}>{report.fatal}</Notice>}

      {report?.rows && (
        <>
          <KitCard icon={ShieldCheck} color={KIT.green} title="Step 3 - Review the diff, then commit"
            hint="Rows marked No such topic or Invalid are skipped, not written. Fix them and re-validate to include them.">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(report.counts).map(([k, n]) => (n > 0 ? (
                <Pill key={k} color={VERDICT_STYLE[k].color}>{n} {VERDICT_STYLE[k].label.toLowerCase()}</Pill>
              ) : null))}
            </div>

            {report.counts.update > 0 && (
              <Notice color={KIT.gold}>
                {report.counts.update} topic{report.counts.update === 1 ? "" : "s"} already have authored content that will be
                overwritten. The previous version of each is snapshotted first (last 5 kept), so a bad import is recoverable
                from that topic&apos;s version history - but check the list below rather than relying on it.
              </Notice>
            )}

            <div className="flex items-center gap-2.5">
              <PrimaryButton icon={Sparkles} onClick={commit} busy={!!progress}
                disabled={busy || report.writable.length === 0}>
                {progress
                  ? `Importing ${progress.n}/${progress.total}...`
                  : `Import ${report.writable.length} topic${report.writable.length === 1 ? "" : "s"}`}
              </PrimaryButton>
              <SecondaryButton onClick={() => setReport(null)} disabled={busy}>Cancel</SecondaryButton>
            </div>
          </KitCard>

          <DataTable
            title="Validation diff" icon={FileJson}
            subtitle="One row per topic in the file, checked against this paper's real ids."
            rows={report.rows} rowKey={r => r.index}
            searchKeys={["label"]} searchPlaceholder="Search topics..."
            filters={[
              { key: "verdict", label: "All verdicts",
                options: Object.entries(VERDICT_STYLE).map(([k, v]) => ({ value: k, label: v.label })) },
            ]}
            pageSize={20}
            columns={[
              { key: "verdict", label: "Verdict", render: r => <Pill color={VERDICT_STYLE[r.verdict]?.color}>{VERDICT_STYLE[r.verdict]?.label || r.verdict}</Pill> },
              { key: "label", label: "Topic", render: r => <TitleCell title={r.label} sub={r.fields?.length ? `Sets: ${r.fields.join(", ")}` : ""} /> },
              { key: "errors", label: "Problems", sort: r => r.errors?.length || 0, render: r => (
                r.errors?.length
                  ? <div className="space-y-0.5 max-w-md">{r.errors.map((e, i) => (
                      <p key={i} className="font-sans text-xs" style={{ color: VERDICT_STYLE[r.verdict]?.color }}>{e}</p>
                    ))}</div>
                  : <Muted>-</Muted>
              ) },
            ]}
          />
        </>
      )}

      {done !== null && (
        <Notice color={KIT.green} icon={Check}>
          Imported {done} topic{done === 1 ? "" : "s"}. Published lessons are live for students immediately.
        </Notice>
      )}

      <KitCard title="Supported fields" icon={FileText} color={KIT.muted}>
        <p className="font-mono text-[11px] text-white/45 leading-relaxed">
          {LESSON_IMPORT_FIELDS.join(" · ")}
        </p>
        <p className="font-sans text-xs text-white/40 leading-relaxed">
          Any other key is rejected rather than ignored, so a misspelled field name fails validation instead of silently
          writing nothing. <span className="text-white/60">concept</span>, <span className="text-white/60">deepDive</span>,
          {" "}<span className="text-white/60">dryRun</span> and the short-note depths accept the same
          {" "}<span className="text-white/60">##</span> heading and <span className="text-white/60">:::</span> block syntax
          as the single-topic editor.
        </p>
      </KitCard>
    </div>
  );
}
