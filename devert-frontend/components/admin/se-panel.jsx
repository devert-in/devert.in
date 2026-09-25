"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Clock, FileText,
  Layers, Network, Pencil, Plus, Sparkles, Trash2, Youtube,
} from "lucide-react";
import Dropdown from "@/components/dropdown";
import { LessonConceptField } from "@/components/admin/lesson-concept-field";
import { Input as KitInput, Textarea as KitTextarea } from "@/components/admin/admin-ui";
import {
  KIT, StatGrid, Pill, Toggle, PrimaryButton, SecondaryButton, DataTable, Drawer, DrawerSection,
} from "@/components/admin/admin-kit";
import { StringListField, McqListField } from "@/components/campus/campus-daily-learning-editor";
import { CODELAB_LANGUAGES } from "@/lib/codelab";
import {
  fetchModules, saveModule, deleteModule,
  fetchLessons, saveLesson, deleteLesson,
  SE_DIFFICULTIES, LESSON_SECTIONS, authoredSections, lessonHasContent,
  VIDEO_STATUSES, blankVideo,
} from "@/lib/softwareEngineering";
import { SE_MODULES, SE_ACCENTS, countCurriculum, seedCurriculum } from "@/lib/seCurriculum";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { logAdminActivity } from "@/lib/adminActivityLog";

// The CMS for Software Engineering Fundamentals. Mounted inside /admin's existing
// CONTENT tab (see app/admin/page.jsx) rather than as a new top-level admin tab,
// per CLAUDE.md - a new admin capability belongs inside an existing tab family.
//
// Built from the shared admin kit (components/admin/admin-kit.jsx): a stat row,
// a DataTable of modules, and every create/edit form in a right-hand Drawer, so
// the table never has a form wedged underneath it. Nothing is imported from
// app/admin/page.jsx: that file is a 6000-line page component, and importing from
// it would make this module depend on the page rather than the other way round.
// Same call as components/admin/gate-panel.jsx.

// admin-ui's Input/Textarea are fully controlled and pass `value` straight
// through. A Firestore doc can carry an explicit null for any of these fields,
// which would flip the input to uncontrolled mid-edit - so coerce here, once.
function Input(props) { return <KitInput {...props} value={props.value ?? ""} />; }
function Textarea(props) { return <KitTextarea {...props} value={props.value ?? ""} />; }

const STATUS_OPTIONS = ["draft", "published", "archived"];
const STATUS_FILTER = STATUS_OPTIONS.map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

function FieldLabel({ children }) {
  return <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{children}</p>;
}

// Live / Draft / Archived beside a publish Toggle - same shape as CodingProblemsPanel.
function StatusCell({ status, title, onChange, disabled }) {
  const color = status === "published" ? KIT.green : status === "archived" ? KIT.orange : KIT.muted;
  return (
    <div className="flex items-center gap-2.5">
      <Toggle on={status === "published"} label={`Publish ${title}`} disabled={disabled}
        onChange={on => onChange(on ? "published" : "draft")} />
      <span className="font-sans text-xs" style={{ color }}>
        {status === "published" ? "Live" : status === "archived" ? "Archived" : "Draft"}
      </span>
    </div>
  );
}

// The edit form is seeded from the loaded doc, so it carries the doc's OLD
// `updatedAt`. saveModule/saveLesson write `{ updatedAt: serverTimestamp(), ...data }`,
// so passing that stale value through would overwrite the fresh stamp and the
// Updated column would never move. Drop it (and the id, which is the doc key,
// not a field) before saving.
function formPayload(form) {
  const out = { ...form };
  delete out.updatedAt;
  delete out.id;
  return out;
}

const tsMillis = (t) => (t?.toMillis ? t.toMillis() : 0);
function UpdatedCell({ at }) {
  if (!at?.toDate) return <span className="font-sans text-xs text-white/30">-</span>;
  return (
    <span className="font-sans text-xs text-white/60 tabular-nums whitespace-nowrap">
      {at.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
    </span>
  );
}

// ============================================================
// MODULES + CURRICULUM SEEDING
// ============================================================

function blankModuleForm() {
  return {
    number: 0, title: "", subtitle: "", question: "", description: "",
    accent: "cyan", estimatedHours: 4, order: 10, status: "draft",
  };
}

export function SeModulesPanel() {
  const [nonce, setNonce] = useState(0);
  const [modules] = useKeyedFetch(`modules:${nonce}`, () => fetchModules({ includeUnpublished: true }), { fallback: [] });
  // { mode: "create" } | { mode: "edit", id } | null
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState(blankModuleForm());
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(null);
  const [seeding, setSeeding] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = () => setNonce(n => n + 1);
  const loading = modules === null;
  const list = modules || [];
  const counts = countCurriculum();
  const editingId = drawer?.mode === "edit" ? drawer.id : null;

  const startEdit = (m) => { setForm({ ...blankModuleForm(), ...m }); setDrawer({ mode: "edit", id: m.id }); };
  const startAdd = () => { setForm(blankModuleForm()); setDrawer({ mode: "create" }); };
  const closeDrawer = () => setDrawer(null);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveModule(id, {
        ...formPayload(form),
        number: Number(form.number) || 0,
        estimatedHours: Number(form.estimatedHours) || 0,
        order: Number(form.order) || 0,
      });
      logAdminActivity(editingId ? "updated se module" : "created se module", form.title.trim());
      setDrawer(null); setForm(blankModuleForm());
      reload();
    } finally { setSaving(false); }
  };

  const setStatus = async (m, status) => {
    setBusyId(m.id);
    try {
      await saveModule(m.id, { status });
      logAdminActivity(status === "published" ? "published se module" : "unpublished se module", m.title || m.id);
      reload();
    } finally { setBusyId(null); }
  };

  const remove = async (m) => {
    if (!confirm(`Delete "${m.title}" and every lesson in it?\n\nThis also removes those lesson ids from every learner's completed list, so nobody is left with a completion percentage above 100%. It cannot be undone.`)) return;
    await deleteModule(m.id);
    logAdminActivity("deleted se module", m.title || m.id);
    reload();
  };

  const runSeed = async () => {
    if (!confirm(`Seed the curriculum?\n\nWrites ${counts.modules} modules and ${counts.lessons} lesson shells from lib/seCurriculum.js.\n\nThis is SAFE to re-run: it restores any missing module or lesson and refreshes titles and ordering, but never touches authored lesson content.`)) return;
    setSeeding({ n: 0, total: counts.total });
    try {
      await seedCurriculum({ onProgress: (n, total) => setSeeding({ n, total }) });
      logAdminActivity("seeded se curriculum", `${counts.modules} modules, ${counts.lessons} lessons`);
      reload();
    } finally { setSeeding(null); }
  };

  if (managing) {
    const m = list.find(x => x.id === managing);
    return <SeLessonsPanel moduleId={managing} moduleTitle={m?.title} onBack={() => { setManaging(null); reload(); }} />;
  }

  const published = list.filter(m => m.status === "published").length;
  const totalLessons = list.reduce((n, m) => n + (m.lessonCount || 0), 0);
  const totalHours = list.reduce((n, m) => n + (Number(m.estimatedHours) || 0), 0);
  const manual = list.filter(m => !SE_MODULES.some(x => x.id === m.id)).length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Modules", value: list.length, sub: `${counts.modules} defined in source`, icon: Network, color: KIT.green, loading },
        { label: "Lessons", value: totalLessons, sub: `${counts.lessons} defined in source`, icon: BookOpen, color: KIT.cyan, loading },
        { label: "Published modules", value: published, sub: `${list.length - published} draft or archived`, icon: CheckCircle2, color: KIT.orange, loading },
        { label: "Estimated hours", value: totalHours, sub: manual ? `${manual} manual module${manual === 1 ? "" : "s"}` : "All modules seeded", icon: Clock, color: KIT.purple, loading },
      ]} />

      {/* seeding */}
      <div className="rounded-xl border p-4 sm:p-5 flex flex-wrap items-start gap-4" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <Sparkles size={20} className="flex-shrink-0 mt-0.5" style={{ color: KIT.cyan }} />
        <div className="min-w-[240px] flex-1">
          <h2 className="font-sans text-base font-semibold text-white">Curriculum seeder</h2>
          <p className="font-sans text-xs text-white/45 mt-1 leading-relaxed max-w-2xl">
            The course structure lives in <span className="font-mono text-white/65">lib/seCurriculum.js</span> as reviewable source,
            not as form entry - {counts.modules} modules, {counts.lessons} lessons. Seeding is additive and idempotent:
            re-running it restores missing shells and refreshes titles and ordering, and never overwrites an authored lesson
            body.
          </p>
          {!loading && list.length === 0 && (
            <p className="font-sans text-xs mt-2 inline-flex items-center gap-1.5" style={{ color: KIT.orange }}>
              <AlertTriangle size={12} />
              No modules exist yet - students see an empty course until you seed.
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <PrimaryButton icon={Sparkles} onClick={runSeed} busy={!!seeding}>
            {seeding ? `Seeding ${seeding.n}/${seeding.total}...` : `Seed / refresh curriculum (${counts.total} docs)`}
          </PrimaryButton>
        </div>
      </div>

      <DataTable
        title="Modules" icon={Layers}
        subtitle="Each module holds an ordered list of lessons. Deleting a module deletes its lessons and scrubs them from learner progress."
        rows={list} loading={loading}
        searchKeys={["title", "subtitle", "description", "question", "id"]} searchPlaceholder="Search modules..."
        filters={[
          { key: "status", label: "All statuses", options: STATUS_FILTER, get: m => m.status || "draft" },
          { key: "source", label: "All sources", options: [{ value: "seeded", label: "Seeded" }, { value: "manual", label: "Manual" }],
            get: m => (SE_MODULES.some(x => x.id === m.id) ? "seeded" : "manual") },
        ]}
        primaryAction={{ label: "Add module", icon: Plus, onClick: startAdd }}
        onRowClick={m => startEdit(m)}
        emptyText="No modules yet - seed the curriculum or add one manually."
        columns={[
          { key: "number", label: "No.", sort: m => Number(m.number) || 0, render: m => {
            const accent = SE_ACCENTS[m.accent] || KIT.cyan;
            return (
              <span className="w-8 h-8 rounded-lg flex items-center justify-center font-sans font-semibold text-[13px] tabular-nums"
                style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}30` }}>{m.number}</span>
            );
          } },
          { key: "title", label: "Title", render: m => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-sans text-sm font-medium text-white truncate">{m.title}</p>
                {!SE_MODULES.some(x => x.id === m.id) && <Pill color={KIT.purple}>Manual</Pill>}
              </div>
              <p className="font-sans text-xs text-white/40 truncate">{m.subtitle || m.description || m.question || ""}</p>
            </div>
          ) },
          { key: "lessonCount", label: "Lessons", sort: m => m.lessonCount || 0,
            render: m => <span className="font-sans text-sm text-white/80 tabular-nums">{m.lessonCount || 0}</span> },
          { key: "estimatedHours", label: "Hours", sort: m => Number(m.estimatedHours) || 0,
            render: m => <span className="font-sans text-sm text-white/70 tabular-nums">{m.estimatedHours || 0}h</span> },
          { key: "status", label: "Status", sort: m => m.status || "draft", render: m => (
            <StatusCell status={m.status} title={m.title} disabled={busyId === m.id} onChange={s => setStatus(m, s)} />
          ) },
          { key: "order", label: "Order", sort: m => Number(m.order) || 0,
            render: m => <span className="font-sans text-sm text-white/60 tabular-nums">{m.order ?? "-"}</span> },
          { key: "updatedAt", label: "Updated", sort: m => tsMillis(m.updatedAt), render: m => <UpdatedCell at={m.updatedAt} /> },
        ]}
        rowActions={m => [
          { icon: Layers, label: "Lessons", onClick: () => setManaging(m.id) },
          { icon: Pencil, label: "Edit", onClick: () => startEdit(m) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => remove(m) },
        ]}
      />

      <Drawer open={!!drawer} onClose={closeDrawer}
        title={drawer?.mode === "create" ? "Add module" : form.title || "Module"}
        subtitle={drawer?.mode === "create"
          ? "A manually added module is not in lib/seCurriculum.js - the seeder will never touch it."
          : `${form.lessonCount || 0} lessons · id ${editingId}`}
        footer={<>
          <SecondaryButton onClick={closeDrawer}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} busy={saving} disabled={!form.title.trim()}>
            {saving ? "Saving..." : "Save module"}
          </PrimaryButton>
        </>}>
        <DrawerSection title="Identity" hint="Number and order drive where the module sits on the roadmap.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="NUMBER" type="number" value={form.number} onChange={v => setForm(p => ({ ...p, number: v }))} />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <Input label="EST. HOURS" type="number" value={form.estimatedHours} onChange={v => setForm(p => ({ ...p, estimatedHours: v }))} />
          </div>
          <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="The Internet" />
          <Input label="SUBTITLE" value={form.subtitle} onChange={v => setForm(p => ({ ...p, subtitle: v }))}
            placeholder="The machine everything else runs on" />
        </DrawerSection>
        <DrawerSection title="Copy">
          <Textarea label="THE HOOK QUESTION (shown in italic on the roadmap - lead with curiosity, not a syllabus line)"
            value={form.question} onChange={v => setForm(p => ({ ...p, question: v }))} rows={2}
            placeholder="Your phone in Hyderabad talks to a computer in Oregon in 200ms. How?" />
          <Textarea label="DESCRIPTION" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} rows={2} />
        </DrawerSection>
        <DrawerSection title="Appearance & status">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FieldLabel>ACCENT (platform palette only)</FieldLabel>
              <Dropdown value={form.accent} onChange={v => setForm(p => ({ ...p, accent: v }))}
                options={Object.keys(SE_ACCENTS)} className="w-full" />
            </div>
            <div>
              <FieldLabel>STATUS</FieldLabel>
              <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))}
                options={STATUS_OPTIONS} className="w-full" />
            </div>
          </div>
        </DrawerSection>
      </Drawer>
    </div>
  );
}

// ============================================================
// LESSONS
// ============================================================

function blankLessonForm() {
  return {
    title: "", subtitle: "", order: 0, status: "draft",
    difficulty: "Beginner", estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    learningObjectives: [], prerequisites: [],
    story: "", problemStatement: "", concept: "", walkthrough: "",
    codeExample: { language: "javascript", code: "", expectedOutput: "" },
    commonMistakes: [],
    industryPerspective: "", devertCaseStudy: "",
    knowledgeChecks: [],
    lab: { title: "", brief: "", steps: [], starterCode: "" },
    assignment: { reading: "", practice: "", coding: "", reflection: "", observation: "" },
    summary: "", goingDeeper: "",
    resources: [],
    video: blankVideo(),
    tags: [],
  };
}

// One collapsible part of the lesson editor. Declared at module level (it used
// to be an inline closure inside SeLessonsPanel): a component defined during
// render is a NEW component type every render, so React remounted every field
// inside it on each keystroke and the focused input lost focus.
function Group({ id, label, hint, openGroup, setOpenGroup, children }) {
  const open = openGroup === id;
  return (
    <section className="rounded-xl border overflow-hidden mb-3" style={{ borderColor: KIT.line, background: "rgba(255,255,255,0.015)" }}>
      <button type="button" onClick={() => setOpenGroup(open ? null : id)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
        <span className="font-sans text-sm font-semibold text-white/90 flex-1">{label}</span>
        {hint && <span className="font-sans text-xs text-white/40">{hint}</span>}
        <ChevronDown size={14} className="text-white/40"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </section>
  );
}

function SeLessonsPanel({ moduleId, moduleTitle, onBack }) {
  const [nonce, setNonce] = useState(0);
  const [lessons] = useKeyedFetch(`${moduleId}:${nonce}`,
    () => fetchLessons(moduleId, { includeUnpublished: true }), { fallback: [] });
  // { mode: "create" } | { mode: "edit", id } | null
  const [drawer, setDrawer] = useState(null);
  const [form, setForm] = useState(blankLessonForm());
  const [saving, setSaving] = useState(false);
  const [openGroup, setOpenGroup] = useState("basics");
  const [busyId, setBusyId] = useState(null);

  const reload = () => setNonce(n => n + 1);
  const loading = lessons === null;
  const list = lessons || [];
  const editingId = drawer?.mode === "edit" ? drawer.id : null;

  const startEdit = (l) => {
    setForm({ ...blankLessonForm(), ...l, video: { ...blankVideo(), ...(l.video || {}) } });
    setDrawer({ mode: "edit", id: l.id });
    setOpenGroup("basics");
  };
  const startAdd = () => { setForm(blankLessonForm()); setDrawer({ mode: "create" }); setOpenGroup("basics"); };
  const closeDrawer = () => setDrawer(null);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveLesson(moduleId, id, {
        ...formPayload(form),
        order: Number(form.order) || 0,
        estimatedMinutes: Number(form.estimatedMinutes) || 0,
        xpReward: Number(form.xpReward) || 0,
        coinReward: Number(form.coinReward) || 0,
      });
      await saveModule(moduleId, {
        lessonCount: (await fetchLessons(moduleId, { includeUnpublished: true })).length,
      });
      logAdminActivity(editingId ? "updated se lesson" : "created se lesson", `${moduleTitle || moduleId}: ${form.title.trim()}`);
      setDrawer(null); setForm(blankLessonForm());
      reload();
    } finally { setSaving(false); }
  };

  const setStatus = async (l, status) => {
    setBusyId(l.id);
    try {
      await saveLesson(moduleId, l.id, { status });
      logAdminActivity(status === "published" ? "published se lesson" : "unpublished se lesson", `${moduleTitle || moduleId}: ${l.title || l.id}`);
      reload();
    } finally { setBusyId(null); }
  };

  const remove = async (l) => {
    if (!confirm(`Delete "${l.title}"?\n\nThis also removes it from every learner's completed list. It cannot be undone.`)) return;
    await deleteLesson(moduleId, l.id);
    await saveModule(moduleId, { lessonCount: Math.max(0, list.length - 1) });
    logAdminActivity("deleted se lesson", `${moduleTitle || moduleId}: ${l.title || l.id}`);
    reload();
  };

  const groupProps = { openGroup, setOpenGroup };
  const published = list.filter(l => l.status === "published").length;
  const withBody = list.filter(l => lessonHasContent(l)).length;
  const withVideo = list.filter(l => l.video?.status === "published").length;
  const minutes = list.reduce((n, l) => n + (Number(l.estimatedMinutes) || 0), 0);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 font-sans text-sm text-white/50 hover:text-white transition-colors">
        <ArrowLeft size={14} /> Back to modules
      </button>

      <StatGrid stats={[
        { label: "Lessons", value: list.length, sub: `${minutes} min estimated`, icon: BookOpen, color: KIT.green, loading },
        { label: "Published", value: published, sub: `${list.length - published} draft or archived`, icon: CheckCircle2, color: KIT.cyan, loading },
        { label: "With a lesson body", value: withBody, sub: `${list.length - withBody} still shells`, icon: FileText, color: KIT.orange, loading },
        { label: "Live videos", value: withVideo, sub: "Others show Coming Soon or hidden", icon: Youtube, color: KIT.purple, loading },
      ]} />

      <DataTable
        title={`${moduleTitle || moduleId} - Lessons`} icon={BookOpen}
        subtitle="A lesson with knowledge checks cannot be completed until they are submitted. Deleting a lesson scrubs it from learner progress."
        rows={list} loading={loading}
        searchKeys={["title", "subtitle", "summary", "id"]} searchPlaceholder="Search lessons..."
        filters={[
          { key: "status", label: "All statuses", options: STATUS_FILTER, get: l => l.status || "draft" },
          { key: "difficulty", label: "All difficulties", options: SE_DIFFICULTIES.map(d => ({ value: d, label: d })) },
          { key: "body", label: "Any content", options: [{ value: "yes", label: "Has body" }, { value: "no", label: "No body" }],
            get: l => (lessonHasContent(l) ? "yes" : "no") },
        ]}
        primaryAction={{ label: "Add lesson", icon: Plus, onClick: startAdd }}
        onRowClick={l => startEdit(l)}
        emptyText="No lessons in this module yet."
        columns={[
          { key: "title", label: "Title", render: l => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-sans text-sm font-medium text-white truncate">{l.title}</p>
                {!lessonHasContent(l) && <Pill color={KIT.orange}>No body</Pill>}
                {l.video?.status === "published" && <Youtube size={13} className="flex-shrink-0" style={{ color: KIT.red }} />}
              </div>
              <p className="font-sans text-xs text-white/40 truncate">{l.subtitle || ""}</p>
            </div>
          ) },
          // completeness at a glance: which of the 16 sections exist
          { key: "sections", label: "Sections", sort: l => authoredSections(l).length, render: l => {
            const sections = authoredSections(l);
            return (
              <div className="min-w-0 w-[160px]">
                <p className="font-sans text-sm text-white/80 tabular-nums">{sections.length}/{LESSON_SECTIONS.length}</p>
                {sections.length > 0 && (
                  <p className="font-sans text-[11px] text-white/35 truncate">
                    {sections.slice(0, 5).map(s => s.key).join(", ")}{sections.length > 5 ? "..." : ""}
                  </p>
                )}
              </div>
            );
          } },
          { key: "difficulty", label: "Level", render: l => (
            <Pill color={l.difficulty === "Advanced" ? KIT.red : l.difficulty === "Intermediate" ? KIT.orange : KIT.green}>{l.difficulty || "-"}</Pill>
          ) },
          { key: "status", label: "Status", sort: l => l.status || "draft", render: l => (
            <StatusCell status={l.status} title={l.title} disabled={busyId === l.id} onChange={s => setStatus(l, s)} />
          ) },
          { key: "order", label: "Order", sort: l => Number(l.order) || 0,
            render: l => <span className="font-sans text-sm text-white/60 tabular-nums">{l.order ?? "-"}</span> },
          { key: "updatedAt", label: "Updated", sort: l => tsMillis(l.updatedAt), render: l => <UpdatedCell at={l.updatedAt} /> },
        ]}
        rowActions={l => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(l) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => remove(l) },
        ]}
      />

      <Drawer open={!!drawer} onClose={closeDrawer} width={860}
        title={drawer?.mode === "create" ? "Add lesson" : form.title || "Lesson"}
        subtitle={drawer?.mode === "create"
          ? `New lesson in ${moduleTitle || moduleId}. Saving keeps a version snapshot of the previous text.`
          : `${moduleTitle || moduleId} · ${authoredSections(form).length}/${LESSON_SECTIONS.length} sections · id ${editingId}`}
        footer={<>
          <SecondaryButton onClick={closeDrawer}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} busy={saving} disabled={!form.title.trim()}>
            {saving ? "Saving..." : "Save lesson"}
          </PrimaryButton>
        </>}>
        {/* --- basics --- */}
        <Group id="basics" label="1. Basics" {...groupProps}>
          <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))}
            placeholder="Domain Names and DNS" />
          <Input label="SUBTITLE (one line, shown under the title)" value={form.subtitle}
            onChange={v => setForm(p => ({ ...p, subtitle: v }))}
            placeholder="How a name becomes a number" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <div>
              <FieldLabel>DIFFICULTY</FieldLabel>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
                options={SE_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="EST. MIN" type="number" value={form.estimatedMinutes}
              onChange={v => setForm(p => ({ ...p, estimatedMinutes: v }))} />
            <div>
              <FieldLabel>STATUS</FieldLabel>
              <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))}
                options={STATUS_OPTIONS} className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: v }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: v }))} />
          </div>
        </Group>

        {/* --- the teaching arc, in render order --- */}
        <Group id="arc" label="2. The teaching arc" hint="story -> problem -> theory -> walkthrough" {...groupProps}>
          <StringListField label="LEARNING OBJECTIVES" items={form.learningObjectives}
            onChange={v => setForm(p => ({ ...p, learningObjectives: v }))} />
          <StringListField label="PREREQUISITES" items={form.prerequisites}
            onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />
          <LessonConceptField label="REAL-LIFE STORY (renders FIRST, before any terminology - this is the hook)"
            value={form.story} onChange={v => setForm(p => ({ ...p, story: v }))} />
          <LessonConceptField label="THE PROBLEM (what goes wrong without this concept)"
            value={form.problemStatement} onChange={v => setForm(p => ({ ...p, problemStatement: v }))} />
          <LessonConceptField label="MAIN BODY (## sections get a jump rail; ::: flow / cards / timeline / checkpoint all work)"
            value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <LessonConceptField label="STEP-BY-STEP WALKTHROUGH (::: timeline is ideal here)"
            value={form.walkthrough} onChange={v => setForm(p => ({ ...p, walkthrough: v }))} />
        </Group>

        {/* --- demo --- */}
        <Group id="demo" label="3. Mini demo" {...groupProps}>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <FieldLabel>LANGUAGE</FieldLabel>
              <Dropdown value={form.codeExample?.language || "javascript"}
                onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, language: v } }))}
                options={CODELAB_LANGUAGES.map(l => l.id)} className="w-full" />
            </div>
          </div>
          <Textarea label="CODE" rows={7} value={form.codeExample?.code || ""}
            onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, code: v } }))} />
          <Textarea label="EXPECTED OUTPUT (shown below the snippet - these blocks are read-only, not executed)"
            rows={3} value={form.codeExample?.expectedOutput || ""}
            onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, expectedOutput: v } }))} />
        </Group>

        {/* --- context --- */}
        <Group id="context" label="4. Mistakes, industry & DeVert" {...groupProps}>
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes}
            onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <LessonConceptField label="HOW THE INDUSTRY DOES IT"
            value={form.industryPerspective} onChange={v => setForm(p => ({ ...p, industryPerspective: v }))} />
          <LessonConceptField label="INSIDE DEVERT (the real architecture of this platform - students value this most)"
            value={form.devertCaseStudy} onChange={v => setForm(p => ({ ...p, devertCaseStudy: v }))} />
        </Group>

        {/* --- assessment --- */}
        <Group id="assess" label="5. Knowledge check, lab & assignment" hint="the check gates completion" {...groupProps}>
          <McqListField label="KNOWLEDGE CHECK (graded; a lesson with checks cannot be completed until they're submitted)"
            items={form.knowledgeChecks} onChange={v => setForm(p => ({ ...p, knowledgeChecks: v }))} />
          <Input label="LAB TITLE" value={form.lab?.title || ""}
            onChange={v => setForm(p => ({ ...p, lab: { ...p.lab, title: v } }))} />
          <LessonConceptField label="LAB BRIEF"
            value={form.lab?.brief || ""} onChange={v => setForm(p => ({ ...p, lab: { ...p.lab, brief: v } }))} />
          <StringListField label="LAB STEPS" items={form.lab?.steps || []}
            onChange={v => setForm(p => ({ ...p, lab: { ...p.lab, steps: v } }))} />
          <Textarea label="LAB STARTER CODE" rows={5} value={form.lab?.starterCode || ""}
            onChange={v => setForm(p => ({ ...p, lab: { ...p.lab, starterCode: v } }))} />
          <div className="grid grid-cols-1 gap-2.5">
            {[["reading", "READ"], ["practice", "PRACTISE"], ["coding", "BUILD"], ["reflection", "REFLECT"], ["observation", "NOTICE IN THE WILD"]].map(([k, label]) => (
              <Input key={k} label={`ASSIGNMENT - ${label}`} value={form.assignment?.[k] || ""}
                onChange={v => setForm(p => ({ ...p, assignment: { ...p.assignment, [k]: v } }))} />
            ))}
          </div>
        </Group>

        {/* --- wrap up --- */}
        <Group id="wrap" label="6. Summary, going deeper & resources" {...groupProps}>
          <Textarea label="SUMMARY (plain text - the whole lesson in one paragraph. No ::: fences here)"
            rows={3} value={form.summary} onChange={v => setForm(p => ({ ...p, summary: v }))} />
          <LessonConceptField label="GOING DEEPER (collapsed by default - for the curious, never required)"
            value={form.goingDeeper} onChange={v => setForm(p => ({ ...p, goingDeeper: v }))} />
          <ResourceEditor resources={form.resources} onChange={v => setForm(p => ({ ...p, resources: v }))} />
        </Group>

        {/* --- video --- */}
        <Group id="video" label="7. Video" hint={form.video?.status === "published" ? "LIVE" : "masked"} {...groupProps}>
          <VideoEditor video={form.video} onChange={v => setForm(p => ({ ...p, video: v }))} />
        </Group>
      </Drawer>
    </div>
  );
}

// ---------------- video editor ----------------

// The whole video model is editable now even though playback is masked, so
// switching the series on later is a data edit rather than a schema change. See
// lib/softwareEngineering.js's videoState: "coming-soon" renders the placeholder,
// "published" WITH an id renders the player, and "published" with nothing to play
// falls back to the placeholder rather than a broken embed.
function VideoEditor({ video, onChange }) {
  const v = { ...blankVideo(), ...(video || {}) };
  const set = (patch) => onChange({ ...v, ...patch });
  const willPlay = v.status === "published" && (v.youtubeId || v.url);
  const tone = willPlay ? KIT.green : KIT.orange;

  return (
    <div className="space-y-2.5">
      <div className="p-3 rounded-lg font-sans text-xs leading-relaxed"
        style={{ background: `${tone}10`, border: `1px solid ${tone}40`, color: tone }}>
        {willPlay
          ? "This lesson will render a real player."
          : v.status === "published"
            ? "Marked published but there is no YouTube id or URL - the reader falls back to the Coming Soon card rather than an empty embed."
            : v.status === "hidden"
              ? "The video section is hidden entirely on this lesson."
              : "Renders the Coming Soon placeholder. This is the intended state until the series is recorded."}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <FieldLabel>STATUS</FieldLabel>
          <Dropdown value={v.status} onChange={s => set({ status: s })} options={VIDEO_STATUSES} className="w-full" />
        </div>
        <div>
          <FieldLabel>PROVIDER</FieldLabel>
          <Dropdown value={v.provider} onChange={s => set({ provider: s })} options={["youtube", "self-hosted"]} className="w-full" />
        </div>
      </div>
      {v.provider === "youtube" ? (
        <Input label="YOUTUBE VIDEO ID (just the id, not the full URL)" value={v.youtubeId}
          onChange={s => set({ youtubeId: s.trim() })} placeholder="dQw4w9WgXcQ"
          hint="Embedded via youtube-nocookie.com so no tracking cookie is set before a learner presses play." />
      ) : (
        <Input label="VIDEO URL" value={v.url} onChange={s => set({ url: s.trim() })} />
      )}
      <Input label="DURATION (SECONDS)" type="number" value={v.durationSeconds ?? ""}
        onChange={s => set({ durationSeconds: s === "" ? null : Number(s) })} />
      <ChapterEditor chapters={v.chapters} onChange={c => set({ chapters: c })} />
      <Textarea label="TRANSCRIPT (optional)" rows={4} value={v.transcript} onChange={s => set({ transcript: s })} />
      <Input label="NOTES URL (optional)" value={v.notesUrl} onChange={s => set({ notesUrl: s.trim() })} />
    </div>
  );
}

const rawInputClass = "font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none";
const rawInputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" };

function ChapterEditor({ chapters, onChange }) {
  const list = chapters || [];
  return (
    <div className="space-y-2">
      <FieldLabel>CHAPTERS</FieldLabel>
      <div className="space-y-1.5">
        {list.map((ch, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="number" value={ch.atSeconds ?? ""} placeholder="sec"
              onChange={e => onChange(list.map((c, j) => j === i ? { ...c, atSeconds: Number(e.target.value) || 0 } : c))}
              className={`w-20 ${rawInputClass}`} style={rawInputStyle} />
            <input value={ch.label ?? ""} placeholder="Chapter label"
              onChange={e => onChange(list.map((c, j) => j === i ? { ...c, label: e.target.value } : c))}
              className={`flex-1 ${rawInputClass}`} style={rawInputStyle} />
            <button onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove chapter"
              className="text-white/30 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <SecondaryButton icon={Plus} onClick={() => onChange([...list, { atSeconds: 0, label: "" }])}>Add chapter</SecondaryButton>
    </div>
  );
}

const RESOURCE_KINDS = ["link", "pdf", "cheatsheet", "notes", "video", "code"];

function ResourceEditor({ resources, onChange }) {
  const list = resources || [];
  const patch = (i, p) => onChange(list.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div className="space-y-2">
      <FieldLabel>RESOURCES</FieldLabel>
      <div className="space-y-2">
        {list.map((r, i) => (
          <div key={i} className="p-2.5 rounded-lg space-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${KIT.line}` }}>
            <div className="flex items-center gap-2">
              <Dropdown value={r.kind || "link"} onChange={v => patch(i, { kind: v })} options={RESOURCE_KINDS} className="w-32" />
              <input value={r.title ?? ""} placeholder="Title"
                onChange={e => patch(i, { title: e.target.value })}
                className={`flex-1 ${rawInputClass}`} style={rawInputStyle} />
              <button onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove resource"
                className="text-white/30 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            <input value={r.url ?? ""} placeholder="https://..."
              onChange={e => patch(i, { url: e.target.value })}
              className={`w-full ${rawInputClass}`} style={rawInputStyle} />
            <input value={r.description ?? ""} placeholder="One-line description"
              onChange={e => patch(i, { description: e.target.value })}
              className={`w-full ${rawInputClass}`} style={rawInputStyle} />
          </div>
        ))}
      </div>
      <SecondaryButton icon={Plus} onClick={() => onChange([...list, { kind: "link", title: "", url: "", description: "" }])}>
        Add resource
      </SecondaryButton>
    </div>
  );
}
