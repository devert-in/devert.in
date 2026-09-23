"use client";

// Admin - course/lesson editor (design §2 + §10 shape). CRUD prepCourses;
// each course has lessons: [{id, title, day, contentMarkdown, questionIds}].

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Code2,
  AlertTriangle,
} from "lucide-react";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  NeonBadge,
  EmptyState,
  LoadingRows,
  PrepModal,
  MarkdownBlock,
} from "@/components/prep/ui";
import { getCourses, upsertCourse, deleteCourse, getQuestions } from "@/lib/prep/db";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/prep/constants";

const DAY_LABELS = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri" };

function emptyCourse() {
  return { title: "", category: "aptitude", description: "", order: 1, published: false, lessons: [] };
}

function emptyLesson() {
  return { id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: "", day: 1, contentMarkdown: "", questionIds: [] };
}

function LessonEditor({ lesson, allQuestions, onChange, onRemove }) {
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState("");
  const set = (patch) => onChange({ ...lesson, ...patch });

  const filtered = useMemo(() => {
    if (!allQuestions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return allQuestions.slice(0, 60);
    return allQuestions.filter((r) => `${r.topic} ${r.prompt}`.toLowerCase().includes(q)).slice(0, 60);
  }, [allQuestions, search]);

  const toggleQuestion = (id) => {
    const ids = lesson.questionIds || [];
    set({ questionIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  };

  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={lesson.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Lesson title"
          className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
        />
        <select
          value={lesson.day}
          onChange={(e) => set({ day: Number(e.target.value) })}
          className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer"
        >
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              Day {d} ({DAY_LABELS[d]})
            </option>
          ))}
        </select>
        <button onClick={onRemove} className="text-white/30 hover:text-[#FF3B3B] cursor-pointer" aria-label="Remove lesson">
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-mono text-[10px] tracking-wider text-white/35">CONTENT (markdown)</label>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-neon-cyan hover:text-white transition-colors cursor-pointer"
          >
            {preview ? <Code2 size={11} /> : <Eye size={11} />} {preview ? "edit" : "preview"}
          </button>
        </div>
        {preview ? (
          <div className="border border-white/8 rounded p-3 min-h-[120px] bg-black/30">
            <MarkdownBlock content={lesson.contentMarkdown || "*(empty)*"} />
          </div>
        ) : (
          <textarea
            value={lesson.contentMarkdown}
            onChange={(e) => set({ contentMarkdown: e.target.value })}
            rows={8}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50 resize-y"
          />
        )}
      </div>

      <div>
        <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1.5">
          LINKED QUESTIONS ({(lesson.questionIds || []).length} picked)
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search questions to link…"
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20 mb-2"
        />
        <div className="max-h-40 overflow-y-auto border border-white/8 rounded divide-y divide-white/5">
          {filtered.length === 0 ? (
            <p className="font-mono text-[10px] text-white/25 p-3 text-center">no matches</p>
          ) : (
            filtered.map((q) => (
              <label key={q.id} className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={(lesson.questionIds || []).includes(q.id)}
                  onChange={() => toggleQuestion(q.id)}
                />
                <span className="font-mono text-[10px] text-white/45 truncate">
                  [{q.category}] {q.topic}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CourseEditorModal({ course, allQuestions, onClose, onSaved }) {
  const [draft, setDraft] = useState(course);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const addLesson = () => set({ lessons: [...(draft.lessons || []), emptyLesson()] });
  const updateLesson = (i, next) => {
    const lessons = [...draft.lessons];
    lessons[i] = next;
    set({ lessons });
  };
  const removeLesson = (i) => set({ lessons: draft.lessons.filter((_, idx) => idx !== i) });

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { id, __isNew, ...data } = draft;
      await upsertCourse(__isNew ? undefined : id, {
        title: data.title.trim(),
        category: data.category,
        description: data.description || "",
        order: Number(data.order) || 0,
        published: !!data.published,
        lessons: data.lessons || [],
      });
      onSaved();
    } catch (e) {
      setError(e?.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PrepModal
      open
      onClose={onClose}
      title={draft.__isNew ? "New Course" : "Edit Course"}
      filename="course-editor.sh"
      maxWidth="max-w-3xl"
      footer={
        <>
          <BracketButton variant="ghost" onClick={onClose}>
            CANCEL
          </BracketButton>
          <BracketButton variant="green" onClick={handleSave} loading={saving} loadingText="SAVING">
            SAVE_COURSE
          </BracketButton>
        </>
      }
    >
      {error && (
        <p className="font-mono text-xs text-[#FF3B3B] mb-3 flex items-center gap-2">
          <AlertTriangle size={13} /> {error}
        </p>
      )}
      <div className="space-y-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TITLE</label>
            <input
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">CATEGORY</label>
            <select
              value={draft.category}
              onChange={(e) => set({ category: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DESCRIPTION</label>
          <textarea
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
          />
        </div>
        <div className="flex items-center gap-6">
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">ORDER</label>
            <input
              type="number"
              value={draft.order}
              onChange={(e) => set({ order: e.target.value })}
              className="w-20 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
            />
          </div>
          <label className="inline-flex items-center gap-2 font-mono text-xs text-white/50 cursor-pointer mt-5">
            <input type="checkbox" checked={draft.published} onChange={(e) => set({ published: e.target.checked })} />
            Published
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="font-mono text-[10px] tracking-wider text-white/35">LESSONS ({(draft.lessons || []).length})</label>
        <BracketButton size="sm" variant="cyan" onClick={addLesson}>
          <Plus size={11} className="inline mr-1 -mt-0.5" /> ADD_LESSON
        </BracketButton>
      </div>
      <div className="space-y-3">
        {(draft.lessons || []).length === 0 && (
          <p className="font-mono text-[11px] text-white/25 py-4 text-center border border-dashed border-white/10 rounded">
            no lessons yet - add one above
          </p>
        )}
        {(draft.lessons || []).map((lesson, i) => (
          <LessonEditor
            key={lesson.id}
            lesson={lesson}
            allQuestions={allQuestions}
            onChange={(next) => updateLesson(i, next)}
            onRemove={() => removeLesson(i)}
          />
        ))}
      </div>
    </PrepModal>
  );
}

export default function CoursesPanel() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");
  const [allQuestions, setAllQuestions] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setCourses(await getCourses({ publishedOnly: false, max: 200 }));
    } catch (e) {
      setError(e?.message || "Failed to load courses");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
    (async () => {
      try {
        setAllQuestions(await getQuestions({ max: 300 }));
      } catch {
        setAllQuestions([]);
      }
    })();
  }, [load]);

  const openNew = () => setEditing({ __isNew: true, ...emptyCourse() });
  const openEdit = (c) => setEditing({ __isNew: false, ...c });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCourse(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete course");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="courses.sh" icon={BookOpen} delay={0}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs text-white/35">Weekday LMS courses shown on /prep/learn.</p>
          <BracketButton variant="green" size="sm" onClick={openNew}>
            <Plus size={11} className="inline mr-1 -mt-0.5" /> NEW_COURSE
          </BracketButton>
        </div>
        {error && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{error}</p>}
        {courses === null ? (
          <LoadingRows rows={4} />
        ) : courses.length === 0 ? (
          <EmptyState title="no courses yet" message="Create your first course, or install the starter pack." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "order", dir: "asc" }}
            columns={[
              { key: "title", label: "TITLE" },
              {
                key: "category",
                label: "CATEGORY",
                width: "110px",
                render: (r) => {
                  const c = CATEGORY_MAP[r.category];
                  return c ? <NeonBadge color={c.color}>{c.label.toUpperCase()}</NeonBadge> : r.category;
                },
              },
              { key: "order", label: "ORDER", width: "70px", align: "right" },
              {
                key: "lessons",
                label: "LESSONS",
                width: "80px",
                align: "right",
                sortValue: (r) => (r.lessons || []).length,
                render: (r) => (r.lessons || []).length,
              },
              {
                key: "published",
                label: "STATUS",
                width: "100px",
                sortValue: (r) => (r.published ? 1 : 0),
                render: (r) =>
                  r.published ? <NeonBadge color="#00FF41">PUBLISHED</NeonBadge> : <NeonBadge color="#FF9500">DRAFT</NeonBadge>,
              },
              {
                key: "actions",
                label: "",
                sortable: false,
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEdit(r)} className="text-white/35 hover:text-neon-cyan transition-colors cursor-pointer" aria-label={`Edit ${r.title}`}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(r)} className="text-white/35 hover:text-[#FF3B3B] transition-colors cursor-pointer" aria-label={`Delete ${r.title}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={courses}
          />
        )}
      </TerminalCard>

      {editing && (
        <CourseEditorModal
          course={editing}
          allQuestions={allQuestions}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      <PrepModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete course?"
        filename="confirm.sh"
        maxWidth="max-w-sm"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setConfirmDelete(null)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="red" onClick={handleDelete}>
              DELETE
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed">
          This permanently deletes <span className="text-white">{confirmDelete?.title}</span> and all of its lessons.
          This cannot be undone.
        </p>
      </PrepModal>
    </div>
  );
}
