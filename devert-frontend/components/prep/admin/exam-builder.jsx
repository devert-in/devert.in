"use client";

// Admin - exam/contest builder (design §2). Creates weekend-test / coding-contest
// exams via lib/prep/db's createExam (which splits the paper away from the
// answer key in one write batch - see that function's docstring). Also lists
// existing exams for schedule edits, publish toggling, and deletion.

import { useState, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ClipboardList,
  Search,
  ArrowUp,
  ArrowDown,
  X,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  NeonBadge,
  Tag,
  EmptyState,
  LoadingRows,
  PrepModal,
} from "@/components/prep/ui";
import { getQuestions, getExams, createExam, updateExam, deleteExam, getClassGroups } from "@/lib/prep/db";
import { CATEGORIES, DIFFICULTIES, CATEGORY_MAP } from "@/lib/prep/constants";

const KINDS = [
  { id: "weekend-test", label: "Weekend Test" },
  { id: "coding-contest", label: "Coding Contest" },
];

function fmtDate(ts) {
  if (!ts) return "-";
  const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function QuestionPicker({ kind, selectedIds, onToggle }) {
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState(kind === "coding-contest" ? "coding" : "");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets question-type filter when contest kind changes
    setType(kind === "coding-contest" ? "coding" : "");
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getQuestions({
          category: category || undefined,
          difficulty: difficulty || undefined,
          type: type || undefined,
          max: 300,
        });
        if (!cancelled) setResults(rows);
      } catch {
        if (!cancelled) setResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, difficulty, type]);

  const filtered = useMemo(() => {
    if (!results) return [];
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => `${r.topic} ${r.prompt}`.toLowerCase().includes(q));
  }, [results, search]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search…"
            className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white outline-none cursor-pointer"
        >
          <option value="">all types</option>
          <option value="mcq">mcq</option>
          <option value="coding">coding</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white outline-none cursor-pointer"
        >
          <option value="">all categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white outline-none cursor-pointer"
        >
          <option value="">all difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-64 overflow-y-auto border border-white/8 rounded divide-y divide-white/5">
        {results === null ? (
          <div className="p-3">
            <LoadingRows rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-[11px] text-white/25 p-4 text-center">no questions match these filters</p>
        ) : (
          filtered.map((q) => {
            const checked = selectedIds.has(q.id);
            const cat = CATEGORY_MAP[q.category];
            return (
              <label
                key={q.id}
                className="flex items-start gap-2.5 px-3 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(q)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    {cat && <NeonBadge color={cat.color}>{cat.label.toUpperCase()}</NeonBadge>}
                    <Tag>{q.type}</Tag>
                    <span className="font-mono text-[10px] text-white/30">{q.topic}</span>
                  </div>
                  <p className="font-mono text-[11px] text-white/45 truncate">{q.prompt}</p>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

function SelectedPanel({ selected, setSelected }) {
  const move = (i, dir) => {
    const next = [...selected];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSelected(next);
  };
  const remove = (i) => setSelected(selected.filter((_, idx) => idx !== i));
  const setMarks = (i, marks) => {
    const next = [...selected];
    next[i] = { ...next[i], marks: Math.max(0, Number(marks) || 0) };
    setSelected(next);
  };

  if (selected.length === 0) {
    return <p className="font-mono text-[11px] text-white/25 py-6 text-center">no questions selected yet</p>;
  }

  const totalMarks = selected.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-2">
        {selected.length} question{selected.length === 1 ? "" : "s"} - {totalMarks} total marks
      </p>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {selected.map((q, i) => (
          <div
            key={q.id}
            className="flex items-center gap-2 border border-white/8 rounded px-2.5 py-2"
          >
            <span className="font-mono text-[10px] text-white/25 w-6 flex-shrink-0">{i + 1}.</span>
            <span className="flex-1 min-w-0 font-mono text-[11px] text-white/60 truncate" title={q.prompt}>
              {q.topic || q.prompt}
            </span>
            <input
              type="number"
              min={0}
              value={q.marks}
              onChange={(e) => setMarks(i, e.target.value)}
              className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-1 font-mono text-[11px] text-white text-center outline-none focus:border-neon-cyan/50"
              aria-label={`Marks for question ${i + 1}`}
            />
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Move up"
            >
              <ArrowUp size={13} />
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === selected.length - 1}
              className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Move down"
            >
              <ArrowDown size={13} />
            </button>
            <button
              onClick={() => remove(i)}
              className="text-white/30 hover:text-[#FF3B3B] cursor-pointer"
              aria-label="Remove"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditScheduleModal({ exam, onClose, onSaved }) {
  const [title, setTitle] = useState(exam.title || "");
  const [description, setDescription] = useState(exam.description || "");
  const [startsAt, setStartsAt] = useState(
    exam.startsAt && typeof exam.startsAt.toDate === "function" ? exam.startsAt.toDate() : new Date()
  );
  const [durationMins, setDurationMins] = useState(exam.durationMins || 60);
  const [groups, setGroups] = useState(null);
  const [classGroups, setClassGroups] = useState(exam.classGroups || []);
  const [published, setPublished] = useState(!!exam.published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getClassGroups({ activeOnly: false });
        if (!cancelled) setGroups(rows);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleGroup = (name) => {
    setClassGroups((prev) => (prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const endsAt = new Date(startsAt.getTime() + Number(durationMins) * 60000);
      await updateExam(exam.id, {
        title: title.trim(),
        description,
        startsAt,
        endsAt,
        durationMins: Number(durationMins),
        classGroups,
        published,
      });
      onSaved();
    } catch (e) {
      setError(e?.message || "Failed to update exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PrepModal
      open
      onClose={onClose}
      title="Edit Schedule"
      filename="edit-schedule.sh"
      maxWidth="max-w-lg"
      footer={
        <>
          <BracketButton variant="ghost" onClick={onClose}>
            CANCEL
          </BracketButton>
          <BracketButton variant="green" onClick={handleSave} loading={saving} loadingText="SAVING">
            SAVE
          </BracketButton>
        </>
      }
    >
      {error && (
        <p className="font-mono text-xs text-[#FF3B3B] mb-3 flex items-center gap-2">
          <AlertTriangle size={13} /> {error}
        </p>
      )}
      <div className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TITLE</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DESCRIPTION</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">STARTS AT</label>
            <DatePicker
              selected={startsAt}
              onChange={setStartsAt}
              showTimeSelect
              dateFormat="MMM d, yyyy h:mm aa"
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DURATION (mins)</label>
            <input
              type="number"
              min={1}
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1.5">
            CLASS GROUPS (empty = all)
          </label>
          {groups === null ? (
            <LoadingRows rows={2} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/50 border border-white/10 rounded px-2 py-1 cursor-pointer"
                >
                  <input type="checkbox" checked={classGroups.includes(g.name)} onChange={() => toggleGroup(g.name)} />
                  {g.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <label className="inline-flex items-center gap-2 font-mono text-xs text-white/50 cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible to students)
        </label>
      </div>
    </PrepModal>
  );
}

export default function ExamBuilderPanel() {
  const { user } = useAuth();

  // ── new exam form state ──
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("weekend-test");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [durationMins, setDurationMins] = useState(60);
  const [defaultMarks, setDefaultMarks] = useState(4);
  const [groups, setGroups] = useState(null);
  const [classGroups, setClassGroups] = useState([]);
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // ── existing exams list ──
  const [exams, setExams] = useState(null);
  const [listError, setListError] = useState("");
  const [editingExam, setEditingExam] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getClassGroups({ activeOnly: false });
        if (!cancelled) setGroups(rows);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadExams = useCallback(async () => {
    setListError("");
    try {
      const rows = await getExams({ publishedOnly: false, max: 200 });
      setExams(rows);
    } catch (e) {
      setListError(e?.message || "Failed to load exams");
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const selectedIds = useMemo(() => new Set(selected.map((q) => q.id)), [selected]);

  const toggleQuestion = (q) => {
    setSelected((prev) =>
      prev.some((s) => s.id === q.id) ? prev.filter((s) => s.id !== q.id) : [...prev, { ...q, marks: defaultMarks }]
    );
  };

  const toggleGroup = (name) => {
    setClassGroups((prev) => (prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelected([]);
    setClassGroups([]);
  };

  const handleCreate = async (published) => {
    setCreateError("");
    setCreateSuccess("");
    if (!title.trim()) return setCreateError("Title is required");
    if (!startsAt) return setCreateError("Pick a start date/time");
    if (selected.length === 0) return setCreateError("Pick at least one question");

    setCreating(true);
    try {
      const endsAt = new Date(startsAt.getTime() + Number(durationMins) * 60000);
      const questions = selected.map((q) => ({
        type: q.type,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        prompt: q.prompt,
        marks: q.marks,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        starterCode: q.starterCode,
        testCases: q.testCases,
      }));
      await createExam({
        title: title.trim(),
        kind,
        description,
        startsAt,
        endsAt,
        durationMins: Number(durationMins),
        classGroups,
        published,
        createdBy: user?.uid,
        questions,
      });
      setCreateSuccess(`✓ Exam ${published ? "published" : "saved as draft"} successfully.`);
      resetForm();
      await loadExams();
    } catch (e) {
      setCreateError(e?.message || "Failed to create exam");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteExam(confirmDelete.id);
      setConfirmDelete(null);
      await loadExams();
    } catch (e) {
      setListError(e?.message || "Failed to delete exam");
      setConfirmDelete(null);
    }
  };

  const togglePublish = async (row) => {
    try {
      await updateExam(row.id, { published: !row.published });
      await loadExams();
    } catch (e) {
      setListError(e?.message || "Failed to update exam");
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="new-exam.sh" icon={ClipboardList} delay={0}>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TITLE</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Weekend Aptitude Test #2"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">KIND</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
                >
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">STARTS AT</label>
                <DatePicker
                  selected={startsAt}
                  onChange={setStartsAt}
                  showTimeSelect
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DURATION (min)</label>
                <input
                  type="number"
                  min={1}
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
                />
              </div>
            </div>

            <p className="font-mono text-[10px] text-white/25">
              Ends at{" "}
              <span className="text-white/45">
                {new Date(startsAt.getTime() + Number(durationMins || 0) * 60000).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1.5">
                CLASS GROUPS (empty = all)
              </label>
              {groups === null ? (
                <LoadingRows rows={2} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/50 border border-white/10 rounded px-2 py-1 cursor-pointer"
                    >
                      <input type="checkbox" checked={classGroups.includes(g.name)} onChange={() => toggleGroup(g.name)} />
                      {g.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">
                DEFAULT MARKS PER QUESTION
              </label>
              <input
                type="number"
                min={0}
                value={defaultMarks}
                onChange={(e) => setDefaultMarks(Number(e.target.value) || 0)}
                className="w-28 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
              />
              <p className="font-mono text-[9px] text-white/20 mt-1">Applied to newly-picked questions; override per-row below.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-2">QUESTION PICKER</label>
              <QuestionPicker kind={kind} selectedIds={selectedIds} onToggle={toggleQuestion} />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-2">SELECTED</label>
              <SelectedPanel selected={selected} setSelected={setSelected} />
            </div>
          </div>
        </div>

        {createError && (
          <p className="mt-5 font-mono text-xs text-[#FF3B3B] flex items-center gap-2">
            <AlertTriangle size={13} /> {createError}
          </p>
        )}
        {createSuccess && (
          <p className="mt-5 font-mono text-xs text-neon-green flex items-center gap-2">
            <CheckCircle2 size={13} /> {createSuccess}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <BracketButton variant="ghost" onClick={() => handleCreate(false)} loading={creating} loadingText="SAVING">
            SAVE_DRAFT
          </BracketButton>
          <BracketButton variant="green" onClick={() => handleCreate(true)} loading={creating} loadingText="PUBLISHING">
            PUBLISH
          </BracketButton>
        </div>
      </TerminalCard>

      <TerminalCard filename="exams.log" icon={CalendarClock} delay={0.1}>
        {listError && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{listError}</p>}
        {exams === null ? (
          <LoadingRows rows={4} />
        ) : exams.length === 0 ? (
          <EmptyState title="no exams yet" message="Create your first weekend test or coding contest above." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "startsAt", dir: "desc" }}
            columns={[
              { key: "title", label: "TITLE" },
              { key: "kind", label: "KIND", width: "120px", render: (r) => <Tag>{r.kind}</Tag> },
              {
                key: "status",
                label: "STATUS",
                width: "90px",
                sortValue: (r) => (r.published ? 1 : 0),
                render: (r) =>
                  r.published ? <NeonBadge color="#00FF41">PUBLISHED</NeonBadge> : <NeonBadge color="#FF9500">DRAFT</NeonBadge>,
              },
              {
                key: "startsAt",
                label: "STARTS",
                sortValue: (r) => r.startsAt?.toMillis?.() || 0,
                render: (r) => fmtDate(r.startsAt),
              },
              { key: "questionCount", label: "Qs", width: "50px", align: "right" },
              { key: "totalMarks", label: "MARKS", width: "60px", align: "right" },
              {
                key: "classGroups",
                label: "GROUPS",
                sortable: false,
                render: (r) => (r.classGroups?.length ? r.classGroups.join(", ") : "all"),
              },
              {
                key: "actions",
                label: "",
                sortable: false,
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <BracketButton size="sm" variant="cyan" onClick={() => setEditingExam(r)}>
                      EDIT
                    </BracketButton>
                    <BracketButton size="sm" variant={r.published ? "ghost" : "green"} onClick={() => togglePublish(r)}>
                      {r.published ? "UNPUBLISH" : "PUBLISH"}
                    </BracketButton>
                    <BracketButton size="sm" variant="red" onClick={() => setConfirmDelete(r)}>
                      DELETE
                    </BracketButton>
                  </div>
                ),
              },
            ]}
            rows={exams}
          />
        )}
      </TerminalCard>

      {editingExam && (
        <EditScheduleModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSaved={async () => {
            setEditingExam(null);
            await loadExams();
          }}
        />
      )}

      <PrepModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete exam?"
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
          This deletes <span className="text-white">{confirmDelete?.title}</span>, its paper, and its answer key.
          Existing student submissions are kept for the record but can no longer be scored. This cannot be undone.
        </p>
      </PrepModal>
    </div>
  );
}
