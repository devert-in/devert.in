"use client";

// Admin — question bank browser (design §2). Filter/search existing
// prepQuestions, edit in a full modal (mcq or coding fields), delete w/ confirm.

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ListChecks, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
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
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from "@/lib/prep/db";
import { CATEGORIES, DIFFICULTIES, CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";

const LANGS = ["python", "java", "cpp", "c", "javascript"];

function emptyQuestion() {
  return {
    type: "mcq",
    category: "aptitude",
    topic: "",
    difficulty: "easy",
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    starterCode: {},
    testCases: [{ input: "", expectedOutput: "", hidden: false }],
    tags: [],
  };
}

function QuestionForm({ value, onChange }) {
  const q = value;
  const set = (patch) => onChange({ ...q, ...patch });

  const setOption = (i, v) => {
    const next = [...(q.options || ["", "", "", ""])];
    next[i] = v;
    set({ options: next });
  };

  const setStarter = (lang, v) => set({ starterCode: { ...(q.starterCode || {}), [lang]: v } });

  const addTestCase = () =>
    set({ testCases: [...(q.testCases || []), { input: "", expectedOutput: "", hidden: false }] });
  const removeTestCase = (i) => set({ testCases: (q.testCases || []).filter((_, idx) => idx !== i) });
  const setTestCase = (i, patch) => {
    const next = [...(q.testCases || [])];
    next[i] = { ...next[i], ...patch };
    set({ testCases: next });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TYPE</label>
          <select
            value={q.type}
            onChange={(e) => set({ type: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            <option value="mcq">mcq</option>
            <option value="coding">coding</option>
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">CATEGORY</label>
          <select
            value={q.category}
            onChange={(e) => set({ category: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DIFFICULTY</label>
          <select
            value={q.difficulty}
            onChange={(e) => set({ difficulty: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TOPIC</label>
        <input
          value={q.topic}
          onChange={(e) => set({ topic: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">PROMPT (markdown)</label>
        <textarea
          value={q.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          rows={4}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
        />
      </div>

      {q.type === "mcq" ? (
        <div className="space-y-3">
          <label className="block font-mono text-[10px] tracking-wider text-white/35">OPTIONS + CORRECT ANSWER</label>
          {["A", "B", "C", "D"].map((letter, i) => (
            <div key={letter} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => set({ correctIndex: i })}
                title="Mark as correct"
                className={`w-7 h-7 flex-shrink-0 rounded border font-mono text-[11px] transition-colors cursor-pointer ${
                  q.correctIndex === i
                    ? "border-neon-green/60 text-neon-green bg-neon-green/10"
                    : "border-white/15 text-white/35 hover:border-white/30"
                }`}
              >
                {letter}
              </button>
              <input
                value={q.options?.[i] || ""}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${letter}`}
                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
              />
            </div>
          ))}
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">EXPLANATION</label>
            <textarea
              value={q.explanation}
              onChange={(e) => set({ explanation: e.target.value })}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-2">STARTER CODE</label>
            <div className="space-y-2">
              {LANGS.map((lang) => (
                <div key={lang}>
                  <span className="font-mono text-[10px] text-white/30">{lang}</span>
                  <textarea
                    value={q.starterCode?.[lang] || ""}
                    onChange={(e) => setStarter(lang, e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50 resize-y"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-[10px] tracking-wider text-white/35">TEST CASES</label>
              <button
                type="button"
                onClick={addTestCase}
                className="font-mono text-[10px] text-neon-cyan hover:text-white transition-colors cursor-pointer"
              >
                + add test case
              </button>
            </div>
            <div className="space-y-2">
              {(q.testCases || []).map((tc, i) => (
                <div key={i} className="border border-white/8 rounded p-2.5 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <textarea
                      value={tc.input}
                      onChange={(e) => setTestCase(i, { input: e.target.value })}
                      placeholder="input"
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50 resize-y"
                    />
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => setTestCase(i, { expectedOutput: e.target.value })}
                      placeholder="expectedOutput"
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white outline-none focus:border-neon-cyan/50 resize-y"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-white/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!tc.hidden}
                        onChange={(e) => setTestCase(i, { hidden: e.target.checked })}
                      />
                      hidden
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTestCase(i)}
                      className="font-mono text-[10px] text-[#FF3B3B]/70 hover:text-[#FF3B3B] transition-colors cursor-pointer"
                    >
                      remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">EXPLANATION</label>
            <textarea
              value={q.explanation}
              onChange={(e) => set({ explanation: e.target.value })}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TAGS (comma separated)</label>
        <input
          value={(q.tags || []).join(", ")}
          onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
        />
      </div>
    </div>
  );
}

export default function QuestionsPanel() {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null | question draft
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // question row

  const load = useCallback(async () => {
    setError("");
    try {
      const rows = await getQuestions({
        category: category || undefined,
        difficulty: difficulty || undefined,
        type: type || undefined,
        max: 300,
      });
      setQuestions(rows);
    } catch (e) {
      setError(e?.message || "Failed to load questions");
    }
  }, [category, difficulty, type]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!questions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((row) => {
      const hay = `${row.topic || ""} ${row.prompt || ""} ${(row.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [questions, search]);

  const openNew = () => {
    setEditing({ __isNew: true, ...emptyQuestion() });
    setSaveError("");
  };
  const openEdit = (row) => {
    setEditing({
      __isNew: false,
      id: row.id,
      type: row.type || "mcq",
      category: row.category || "aptitude",
      topic: row.topic || "",
      difficulty: row.difficulty || "easy",
      prompt: row.prompt || "",
      options: row.options && row.options.length === 4 ? row.options : ["", "", "", ""],
      correctIndex: typeof row.correctIndex === "number" ? row.correctIndex : 0,
      explanation: row.explanation || "",
      starterCode: row.starterCode || {},
      testCases: row.testCases && row.testCases.length ? row.testCases : [{ input: "", expectedOutput: "", hidden: false }],
      tags: row.tags || [],
    });
    setSaveError("");
  };

  const validateForSave = (q) => {
    if (!q.topic.trim()) return "Topic is required";
    if (!q.prompt.trim()) return "Prompt is required";
    if (!q.explanation.trim()) return "Explanation is required";
    if (q.type === "mcq") {
      if (!q.options || q.options.length !== 4 || q.options.some((o) => !o.trim())) {
        return "All 4 options must be filled in";
      }
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
        return "Pick the correct option";
      }
    } else {
      const hasStarter = Object.values(q.starterCode || {}).some((v) => v && v.trim());
      if (!hasStarter) return "At least one starter-code language is required";
      const cases = q.testCases || [];
      if (cases.length === 0) return "At least one test case is required";
      if (cases.some((c) => !String(c.expectedOutput || "").trim())) {
        return "Every test case needs an expectedOutput";
      }
    }
    return "";
  };

  const handleSave = async () => {
    const err = validateForSave(editing);
    if (err) {
      setSaveError(err);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const { __isNew, id, ...data } = editing;
      if (__isNew) {
        await addQuestion(data, user?.uid);
      } else {
        await updateQuestion(id, data);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setSaveError(e?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteQuestion(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete question");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="question-bank.sh" icon={ListChecks} delay={0}>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search topic / prompt / tags…"
              className="w-full bg-black/40 border border-white/10 rounded pl-9 pr-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            <option value="">all types</option>
            <option value="mcq">mcq</option>
            <option value="coding">coding</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
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
            className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            <option value="">all difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <BracketButton variant="green" size="sm" onClick={openNew}>
            <Plus size={11} className="inline mr-1 -mt-0.5" /> NEW_QUESTION
          </BracketButton>
        </div>

        {error && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{error}</p>}

        {questions === null ? (
          <LoadingRows rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="no questions found" message="Try clearing filters, or upload/add new questions." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "topic", dir: "asc" }}
            columns={[
              {
                key: "type",
                label: "TYPE",
                width: "70px",
                render: (r) => <Tag>{r.type}</Tag>,
              },
              {
                key: "category",
                label: "CATEGORY",
                width: "110px",
                render: (r) => {
                  const c = CATEGORY_MAP[r.category];
                  return c ? <NeonBadge color={c.color}>{c.label.toUpperCase()}</NeonBadge> : r.category;
                },
              },
              {
                key: "difficulty",
                label: "DIFF",
                width: "80px",
                render: (r) => {
                  const d = DIFFICULTY_MAP[r.difficulty];
                  return d ? <NeonBadge color={d.color}>{d.label}</NeonBadge> : r.difficulty;
                },
              },
              { key: "topic", label: "TOPIC" },
              {
                key: "prompt",
                label: "PROMPT",
                sortable: false,
                render: (r) => (
                  <span className="block max-w-[280px] truncate text-white/40" title={r.prompt}>
                    {r.prompt}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "",
                sortable: false,
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-white/35 hover:text-neon-cyan transition-colors cursor-pointer"
                      aria-label={`Edit ${r.topic}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(r)}
                      className="text-white/35 hover:text-[#FF3B3B] transition-colors cursor-pointer"
                      aria-label={`Delete ${r.topic}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filtered}
          />
        )}
      </TerminalCard>

      <PrepModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.__isNew ? "New Question" : "Edit Question"}
        filename="question-editor.sh"
        maxWidth="max-w-2xl"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setEditing(null)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="green" onClick={handleSave} loading={saving} loadingText="SAVING">
              SAVE
            </BracketButton>
          </>
        }
      >
        {editing && (
          <>
            {saveError && (
              <p className="font-mono text-xs text-[#FF3B3B] mb-3 flex items-center gap-2">
                <AlertTriangle size={13} /> {saveError}
              </p>
            )}
            <QuestionForm value={editing} onChange={setEditing} />
          </>
        )}
      </PrepModal>

      <PrepModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete question?"
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
          This permanently deletes <span className="text-white">{confirmDelete?.topic}</span>. Existing exam
          papers that reference it are unaffected (they carry a snapshot), but practice/learn pages will no
          longer see it. This cannot be undone.
        </p>
      </PrepModal>
    </div>
  );
}
