"use client";

// Admin - daily task scheduler (design §2). Editor for prepDailyTasks/{yyyy-mm-dd}
// items referencing course lessons or standalone questions.

import { useState, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import { CalendarDays, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  TerminalCard,
  BracketButton,
  NeonBadge,
  Tag,
  EmptyState,
  LoadingRows,
} from "@/components/prep/ui";
import { getDailyTasks, setDailyTasks, getCourses, getQuestions, dateKey } from "@/lib/prep/db";
import { CATEGORY_MAP } from "@/lib/prep/constants";

const TYPE_OPTIONS = [
  { id: "lesson", label: "Lesson" },
  { id: "quiz", label: "Quiz (MCQ)" },
  { id: "coding", label: "Coding" },
  { id: "course", label: "Course overview" },
];

export default function DailyPanel() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [courses, setCourses] = useState(null);
  const [questions, setQuestions] = useState(null);

  const [newType, setNewType] = useState("lesson");
  const [newCourseId, setNewCourseId] = useState("");
  const [newLessonId, setNewLessonId] = useState("");
  const [newQuestionId, setNewQuestionId] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  const dateStr = useMemo(() => dateKey(selectedDate), [selectedDate]);

  const load = useCallback(async () => {
    setError("");
    setSaveMsg("");
    try {
      setItems(await getDailyTasks(dateStr));
    } catch (e) {
      setError(e?.message || "Failed to load daily tasks");
    }
  }, [dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        setCourses(await getCourses({ publishedOnly: false, max: 200 }));
      } catch {
        setCourses([]);
      }
      try {
        setQuestions(await getQuestions({ max: 300 }));
      } catch {
        setQuestions([]);
      }
    })();
  }, []);

  const selectedCourse = useMemo(() => (courses || []).find((c) => c.id === newCourseId), [courses, newCourseId]);
  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    const wantedType = newType === "coding" ? "coding" : newType === "quiz" ? "mcq" : null;
    const q = questionSearch.trim().toLowerCase();
    return questions
      .filter((r) => !wantedType || r.type === wantedType)
      .filter((r) => !q || `${r.topic} ${r.prompt}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [questions, newType, questionSearch]);

  const addItem = () => {
    let item = null;
    if (newType === "lesson") {
      const lesson = (selectedCourse?.lessons || []).find((l) => l.id === newLessonId);
      if (!selectedCourse || !lesson) return setError("Pick a course and lesson");
      item = { type: "lesson", refId: lesson.id, courseId: selectedCourse.id, title: lesson.title, category: selectedCourse.category };
    } else if (newType === "course") {
      if (!selectedCourse) return setError("Pick a course");
      item = { type: "course", refId: selectedCourse.id, title: selectedCourse.title, category: selectedCourse.category };
    } else {
      const question = (questions || []).find((r) => r.id === newQuestionId);
      if (!question) return setError("Pick a question");
      item = { type: newType, refId: question.id, title: question.topic || question.prompt.slice(0, 60), category: question.category };
    }
    setError("");
    setItems((prev) => [...(prev || []), item]);
    setNewLessonId("");
    setNewQuestionId("");
  };

  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      await setDailyTasks(dateStr, items || []);
      setSaveMsg(`✓ Saved ${items?.length || 0} item(s) for ${dateStr}.`);
    } catch (e) {
      setError(e?.message || "Failed to save daily tasks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="daily-tasks.sh" icon={CalendarDays} delay={0}>
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DATE</label>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              dateFormat="EEE, MMM d, yyyy"
              className="bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
            />
          </div>
          <NeonBadge color="#00FFFF">{dateStr}</NeonBadge>
        </div>

        {error && (
          <p className="font-mono text-xs text-[#FF3B3B] mb-4 flex items-center gap-2">
            <AlertTriangle size={13} /> {error}
          </p>
        )}
        {saveMsg && (
          <p className="font-mono text-xs text-neon-green mb-4 flex items-center gap-2">
            <CheckCircle2 size={13} /> {saveMsg}
          </p>
        )}

        {items === null ? (
          <LoadingRows rows={3} />
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {items.length === 0 ? (
                <EmptyState title="no tasks scheduled" message="Add lessons, quizzes, or coding problems for this day below." />
              ) : (
                items.map((it, i) => {
                  const cat = CATEGORY_MAP[it.category];
                  return (
                    <div key={i} className="flex items-center gap-3 border border-white/8 rounded px-3 py-2.5">
                      <Tag>{it.type}</Tag>
                      {cat && <NeonBadge color={cat.color}>{cat.label.toUpperCase()}</NeonBadge>}
                      <span className="flex-1 font-mono text-xs text-white/60 truncate">{it.title}</span>
                      <button
                        onClick={() => removeItem(i)}
                        className="text-white/30 hover:text-[#FF3B3B] cursor-pointer"
                        aria-label={`Remove ${it.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/8 pt-5">
              <p className="font-mono text-[10px] tracking-wider text-white/35 mb-3">ADD ITEM</p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <select
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value);
                    setNewLessonId("");
                    setNewQuestionId("");
                  }}
                  className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {(newType === "lesson" || newType === "course") && (
                  <select
                    value={newCourseId}
                    onChange={(e) => {
                      setNewCourseId(e.target.value);
                      setNewLessonId("");
                    }}
                    className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">select course…</option>
                    {(courses || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}

                {newType === "lesson" && (
                  <select
                    value={newLessonId}
                    onChange={(e) => setNewLessonId(e.target.value)}
                    disabled={!selectedCourse}
                    className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer disabled:opacity-40"
                  >
                    <option value="">select lesson…</option>
                    {(selectedCourse?.lessons || []).map((l) => (
                      <option key={l.id} value={l.id}>
                        Day {l.day}: {l.title}
                      </option>
                    ))}
                  </select>
                )}

                {(newType === "quiz" || newType === "coding") && (
                  <>
                    <input
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="search questions…"
                      className="bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20 w-48"
                    />
                    <select
                      value={newQuestionId}
                      onChange={(e) => setNewQuestionId(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer max-w-[280px]"
                    >
                      <option value="">select question…</option>
                      {filteredQuestions.map((q) => (
                        <option key={q.id} value={q.id}>
                          [{q.category}] {q.topic}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <BracketButton size="sm" variant="cyan" onClick={addItem}>
                  <Plus size={11} className="inline mr-1 -mt-0.5" /> ADD
                </BracketButton>
              </div>
            </div>

            <div className="mt-5">
              <BracketButton variant="green" onClick={handleSave} loading={saving} loadingText="SAVING">
                SAVE_DAY
              </BracketButton>
            </div>
          </>
        )}
      </TerminalCard>
    </div>
  );
}
