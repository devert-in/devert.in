"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowLeft, ChevronDown, Layers, Pencil, Plus,
  Sparkles, Trash2, Youtube,
} from "lucide-react";
import Dropdown from "@/components/dropdown";
import { LessonConceptField } from "@/components/admin/lesson-concept-field";
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

// The CMS for Software Engineering Fundamentals. Mounted inside /admin's existing
// CONTENT tab (see app/admin/page.jsx) rather than as a new top-level admin tab,
// per CLAUDE.md - a new admin capability belongs inside an existing tab family.
//
// Styled to match the surrounding admin panel exactly. The Input/Textarea/Btn
// primitives are re-declared locally rather than imported from
// app/admin/page.jsx: that file is a 6000-line page component, and importing from
// it would make this module depend on the page rather than the other way round.
// Same call as components/admin/gate-panel.jsx.

const ACCENT = "#7DD3FC";

function Input({ label, value, onChange, placeholder, type = "text", hint }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(125,211,252,0.35)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
      {hint && <p className="font-mono text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-y transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(125,211,252,0.35)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
      {hint && <p className="font-mono text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  );
}

function Btn({ children, onClick, disabled, color = ACCENT, solid = false, icon: Icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1.5 rounded disabled:opacity-40 transition-opacity"
      style={solid
        ? { background: color, color: "#000" }
        : { background: `${color}14`, color, border: `1px solid ${color}40` }}>
      {Icon && <Icon size={11} />}
      {children}
    </button>
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

function StatusPill({ status }) {
  const published = status === "published";
  return (
    <span className="font-mono text-[9.5px] px-1.5 py-0.5 rounded flex-shrink-0"
      style={{
        background: published ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.07)",
        color: published ? "#00FF41" : "rgba(255,255,255,0.4)",
      }}>
      {(status || "draft").toUpperCase()}
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
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankModuleForm());
  const [saving, setSaving] = useState(false);
  const [managing, setManaging] = useState(null);
  const [seeding, setSeeding] = useState(null);

  const reload = () => setNonce(n => n + 1);
  const list = modules || [];
  const counts = countCurriculum();

  const startEdit = (m) => { setEditingId(m.id); setForm({ ...blankModuleForm(), ...m }); setAdding(false); };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankModuleForm()); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveModule(id, {
        ...form,
        number: Number(form.number) || 0,
        estimatedHours: Number(form.estimatedHours) || 0,
        order: Number(form.order) || 0,
      });
      setEditingId(null); setAdding(false); setForm(blankModuleForm());
      reload();
    } finally { setSaving(false); }
  };

  const remove = async (m) => {
    if (!confirm(`Delete "${m.title}" and every lesson in it?\n\nThis also removes those lesson ids from every learner's completed list, so nobody is left with a completion percentage above 100%. It cannot be undone.`)) return;
    await deleteModule(m.id);
    reload();
  };

  const runSeed = async () => {
    if (!confirm(`Seed the curriculum?\n\nWrites ${counts.modules} modules and ${counts.lessons} lesson shells from lib/seCurriculum.js.\n\nThis is SAFE to re-run: it restores any missing module or lesson and refreshes titles and ordering, but never touches authored lesson content.`)) return;
    setSeeding({ n: 0, total: counts.total });
    try {
      await seedCurriculum({ onProgress: (n, total) => setSeeding({ n, total }) });
      reload();
    } finally { setSeeding(null); }
  };

  if (managing) {
    const m = list.find(x => x.id === managing);
    return <SeLessonsPanel moduleId={managing} moduleTitle={m?.title} onBack={() => { setManaging(null); reload(); }} />;
  }

  return (
    <div className="space-y-4">
      {/* seeding */}
      <FormBox>
        <p className="font-mono text-[10px] tracking-wider mb-1" style={{ color: ACCENT }}>CURRICULUM</p>
        <p className="font-mono text-[10.5px] text-white/40 leading-relaxed">
          The course structure lives in <span className="text-white/60">lib/seCurriculum.js</span> as reviewable source,
          not as form entry - {counts.modules} modules, {counts.lessons} lessons. Seeding is additive and idempotent:
          re-running it restores missing shells and refreshes titles and ordering, and never overwrites an authored lesson
          body.
        </p>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Btn solid icon={Sparkles} onClick={runSeed} disabled={!!seeding}>
            {seeding ? `Seeding ${seeding.n}/${seeding.total}...` : `Seed / refresh curriculum (${counts.total} docs)`}
          </Btn>
          <Btn icon={Plus} onClick={startAdd}>Add a module manually</Btn>
        </div>
        {list.length === 0 && (
          <p className="font-mono text-[10.5px]" style={{ color: "#FF9500" }}>
            <AlertTriangle size={10} className="inline mr-1" />
            No modules exist yet - students see an empty course until you seed.
          </p>
        )}
      </FormBox>

      {(adding || editingId) && (
        <FormBox>
          <div className="grid grid-cols-3 gap-2.5">
            <Input label="NUMBER" type="number" value={form.number} onChange={v => setForm(p => ({ ...p, number: v }))} />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
            <Input label="EST. HOURS" type="number" value={form.estimatedHours} onChange={v => setForm(p => ({ ...p, estimatedHours: v }))} />
          </div>
          <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="The Internet" />
          <Input label="SUBTITLE" value={form.subtitle} onChange={v => setForm(p => ({ ...p, subtitle: v }))}
            placeholder="The machine everything else runs on" />
          <Textarea label="THE HOOK QUESTION (shown in italic on the roadmap - lead with curiosity, not a syllabus line)"
            value={form.question} onChange={v => setForm(p => ({ ...p, question: v }))} rows={2}
            placeholder="Your phone in Hyderabad talks to a computer in Oregon in 200ms. How?" />
          <Textarea label="DESCRIPTION" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} rows={2} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">ACCENT (platform palette only)</p>
              <Dropdown value={form.accent} onChange={v => setForm(p => ({ ...p, accent: v }))}
                options={Object.keys(SE_ACCENTS)} className="w-full" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
              <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))}
                options={["draft", "published", "archived"]} className="w-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Btn solid color="#00FF41" onClick={save} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Save module"}
            </Btn>
            <Btn color="#FF5050" onClick={() => { setEditingId(null); setAdding(false); }}>Cancel</Btn>
          </div>
        </FormBox>
      )}

      {modules === null ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : list.length === 0 ? null : (
        <div className="space-y-2">
          {list.map(m => {
            const accent = SE_ACCENTS[m.accent] || ACCENT;
            const seeded = SE_MODULES.some(x => x.id === m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded flex-wrap"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[13px] flex-shrink-0"
                  style={{ background: `${accent}14`, color: accent }}>{m.number}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="font-mono text-xs text-white/80">{m.title}</b>
                    <StatusPill status={m.status} />
                    {!seeded && <span className="font-mono text-[9.5px] text-white/25">MANUAL</span>}
                  </div>
                  <span className="font-mono text-[10px] text-white/30">
                    {m.lessonCount || 0} lessons · {m.estimatedHours || 0}h · order {m.order}
                  </span>
                </div>
                <Btn icon={Layers} onClick={() => setManaging(m.id)}>Lessons</Btn>
                <Btn color="#FFD700" icon={Pencil} onClick={() => startEdit(m)}>Edit</Btn>
                <Btn color="#FF5050" icon={Trash2} onClick={() => remove(m)}>Delete</Btn>
              </div>
            );
          })}
        </div>
      )}
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

function SeLessonsPanel({ moduleId, moduleTitle, onBack }) {
  const [nonce, setNonce] = useState(0);
  const [lessons] = useKeyedFetch(`${moduleId}:${nonce}`,
    () => fetchLessons(moduleId, { includeUnpublished: true }), { fallback: [] });
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankLessonForm());
  const [saving, setSaving] = useState(false);
  const [openGroup, setOpenGroup] = useState("basics");

  const reload = () => setNonce(n => n + 1);
  const list = lessons || [];

  const startEdit = (l) => {
    setEditingId(l.id);
    setForm({ ...blankLessonForm(), ...l, video: { ...blankVideo(), ...(l.video || {}) } });
    setAdding(false);
    setOpenGroup("basics");
  };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankLessonForm()); setOpenGroup("basics"); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveLesson(moduleId, id, {
        ...form,
        order: Number(form.order) || 0,
        estimatedMinutes: Number(form.estimatedMinutes) || 0,
        xpReward: Number(form.xpReward) || 0,
        coinReward: Number(form.coinReward) || 0,
      });
      await saveModule(moduleId, {
        lessonCount: (await fetchLessons(moduleId, { includeUnpublished: true })).length,
      });
      setEditingId(null); setAdding(false); setForm(blankLessonForm());
      reload();
    } finally { setSaving(false); }
  };

  const remove = async (l) => {
    if (!confirm(`Delete "${l.title}"?\n\nThis also removes it from every learner's completed list. It cannot be undone.`)) return;
    await deleteLesson(moduleId, l.id);
    await saveModule(moduleId, { lessonCount: Math.max(0, list.length - 1) });
    reload();
  };

  const Group = ({ id, label, children, hint }) => (
    <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <button onClick={() => setOpenGroup(openGroup === id ? null : id)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        style={{ background: "rgba(255,255,255,0.03)" }}>
        <span className="font-mono text-[10.5px] flex-1" style={{ color: ACCENT }}>{label}</span>
        {hint && <span className="font-mono text-[9.5px] text-white/25">{hint}</span>}
        <ChevronDown size={12} className="text-white/25"
          style={{ transform: openGroup === id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {openGroup === id && <div className="p-3 space-y-2.5">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft size={12} /> Back to modules
      </button>
      <h4 className="font-mono text-sm" style={{ color: ACCENT }}>{moduleTitle} - Lessons ({list.length})</h4>

      <Btn icon={Plus} onClick={startAdd}>Add lesson</Btn>

      {(adding || editingId) && (
        <FormBox>
          {/* --- basics --- */}
          <Group id="basics" label="1. BASICS">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))}
              placeholder="Domain Names and DNS" />
            <Input label="SUBTITLE (one line, shown under the title)" value={form.subtitle}
              onChange={v => setForm(p => ({ ...p, subtitle: v }))}
              placeholder="How a name becomes a number" />
            <div className="grid grid-cols-4 gap-2.5">
              <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: v }))} />
              <div>
                <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
                <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
                  options={SE_DIFFICULTIES} className="w-full" />
              </div>
              <Input label="EST. MIN" type="number" value={form.estimatedMinutes}
                onChange={v => setForm(p => ({ ...p, estimatedMinutes: v }))} />
              <div>
                <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
                <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))}
                  options={["draft", "published", "archived"]} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: v }))} />
              <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: v }))} />
            </div>
          </Group>

          {/* --- the teaching arc, in render order --- */}
          <Group id="arc" label="2. THE TEACHING ARC" hint="story -> problem -> theory -> walkthrough">
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
          <Group id="demo" label="3. MINI DEMO">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">LANGUAGE</p>
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
          <Group id="context" label="4. MISTAKES, INDUSTRY & DEVERT">
            <StringListField label="COMMON MISTAKES" items={form.commonMistakes}
              onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
            <LessonConceptField label="HOW THE INDUSTRY DOES IT"
              value={form.industryPerspective} onChange={v => setForm(p => ({ ...p, industryPerspective: v }))} />
            <LessonConceptField label="INSIDE DEVERT (the real architecture of this platform - students value this most)"
              value={form.devertCaseStudy} onChange={v => setForm(p => ({ ...p, devertCaseStudy: v }))} />
          </Group>

          {/* --- assessment --- */}
          <Group id="assess" label="5. KNOWLEDGE CHECK, LAB & ASSIGNMENT" hint="the check gates completion">
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
          <Group id="wrap" label="6. SUMMARY, GOING DEEPER & RESOURCES">
            <Textarea label="SUMMARY (plain text - the whole lesson in one paragraph. No ::: fences here)"
              rows={3} value={form.summary} onChange={v => setForm(p => ({ ...p, summary: v }))} />
            <LessonConceptField label="GOING DEEPER (collapsed by default - for the curious, never required)"
              value={form.goingDeeper} onChange={v => setForm(p => ({ ...p, goingDeeper: v }))} />
            <ResourceEditor resources={form.resources} onChange={v => setForm(p => ({ ...p, resources: v }))} />
          </Group>

          {/* --- video --- */}
          <Group id="video" label="7. VIDEO" hint={form.video?.status === "published" ? "LIVE" : "masked"}>
            <VideoEditor video={form.video} onChange={v => setForm(p => ({ ...p, video: v }))} />
          </Group>

          <div className="flex gap-2 pt-1">
            <Btn solid color="#00FF41" onClick={save} disabled={saving || !form.title.trim()}>
              {saving ? "Saving..." : "Save lesson"}
            </Btn>
            <Btn color="#FF5050" onClick={() => { setEditingId(null); setAdding(false); }}>Cancel</Btn>
          </div>
        </FormBox>
      )}

      {lessons === null ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : list.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No lessons in this module yet.</p>
      ) : (
        <div className="space-y-1.5">
          {list.map(l => {
            const sections = authoredSections(l);
            const hasBody = lessonHasContent(l);
            return (
              <div key={l.id} className="flex items-center gap-3 p-2.5 rounded flex-wrap"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{l.order}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-white/80">{l.title}</span>
                    <StatusPill status={l.status} />
                    {!hasBody && <span className="font-mono text-[9.5px]" style={{ color: "#FF9500" }}>NO BODY</span>}
                    {l.video?.status === "published" && <Youtube size={11} style={{ color: "#FF5050" }} />}
                  </div>
                  {/* completeness at a glance: which of the 16 sections exist */}
                  <span className="font-mono text-[10px] text-white/25">
                    {sections.length}/{LESSON_SECTIONS.length} sections
                    {sections.length > 0 && ` · ${sections.slice(0, 5).map(s => s.key).join(", ")}${sections.length > 5 ? "..." : ""}`}
                  </span>
                </div>
                <Btn color="#FFD700" icon={Pencil} onClick={() => startEdit(l)}>Edit</Btn>
                <Btn color="#FF5050" icon={Trash2} onClick={() => remove(l)}>Delete</Btn>
              </div>
            );
          })}
        </div>
      )}
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

  return (
    <div className="space-y-2.5">
      <div className="p-2.5 rounded font-mono text-[10.5px] leading-relaxed"
        style={{
          background: willPlay ? "rgba(0,255,65,0.06)" : "rgba(255,149,0,0.06)",
          border: `1px solid ${willPlay ? "rgba(0,255,65,0.25)" : "rgba(255,149,0,0.25)"}`,
          color: willPlay ? "#00FF41" : "#FF9500",
        }}>
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
          <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
          <Dropdown value={v.status} onChange={s => set({ status: s })} options={VIDEO_STATUSES} className="w-full" />
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">PROVIDER</p>
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

function ChapterEditor({ chapters, onChange }) {
  const list = chapters || [];
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CHAPTERS</p>
      <div className="space-y-1.5">
        {list.map((ch, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="number" value={ch.atSeconds ?? ""} placeholder="sec"
              onChange={e => onChange(list.map((c, j) => j === i ? { ...c, atSeconds: Number(e.target.value) || 0 } : c))}
              className="w-20 font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <input value={ch.label ?? ""} placeholder="Chapter label"
              onChange={e => onChange(list.map((c, j) => j === i ? { ...c, label: e.target.value } : c))}
              className="flex-1 font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <Btn icon={Plus} onClick={() => onChange([...list, { atSeconds: 0, label: "" }])}>Add chapter</Btn>
    </div>
  );
}

const RESOURCE_KINDS = ["link", "pdf", "cheatsheet", "notes", "video", "code"];

function ResourceEditor({ resources, onChange }) {
  const list = resources || [];
  const patch = (i, p) => onChange(list.map((r, j) => (j === i ? { ...r, ...p } : r)));
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">RESOURCES</p>
      <div className="space-y-2">
        {list.map((r, i) => (
          <div key={i} className="p-2.5 rounded space-y-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <Dropdown value={r.kind || "link"} onChange={v => patch(i, { kind: v })} options={RESOURCE_KINDS} className="w-32" />
              <input value={r.title ?? ""} placeholder="Title"
                onChange={e => patch(i, { title: e.target.value })}
                className="flex-1 font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            <input value={r.url ?? ""} placeholder="https://..."
              onChange={e => patch(i, { url: e.target.value })}
              className="w-full font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <input value={r.description ?? ""} placeholder="One-line description"
              onChange={e => patch(i, { description: e.target.value })}
              className="w-full font-mono text-xs text-white/80 px-2 py-1.5 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        ))}
      </div>
      <Btn icon={Plus} onClick={() => onChange([...list, { kind: "link", title: "", url: "", description: "" }])}>
        Add resource
      </Btn>
    </div>
  );
}
