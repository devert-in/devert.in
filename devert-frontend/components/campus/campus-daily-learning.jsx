"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Lock, BookOpen, Code2, Zap, Coins, ClipboardCheck,
  ChevronRight, X as CloseIcon, Trophy, Medal, Target, AlertTriangle, Info,
  Briefcase, ArrowRight, Lightbulb, Copy, ListChecks, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchProblem, fetchUserCodelabProgress, CODELAB_LANGUAGES } from "@/lib/codelab";
import {
  DOW_LABELS, DOW_ORDER, mondayOf, todayISO, fetchWeekItems, fetchLog,
  fetchUserWeekLogs, submitDayCompletion, fetchDayLeaderboard, fetchWeekTests,
  fetchModuleConfig,
} from "@/lib/dailyLearning";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusTable, CampusSkeleton, CampusEmptyState, CampusBackButton,
} from "@/components/campus/campus-ui";
import { CampusProblemView } from "@/components/campus/campus-practice";
import { CampusLearningSection } from "@/components/campus/campus-learning";

// Institution-scoped Mon-Sat structured learning, backed by
// institutions/{slug}/dailyLearning (see lib/dailyLearning.js for the
// schema rationale). Entirely separate from the generic global `courses`
// collection campus-learning.jsx reads - so an institution with no weekly
// program configured still falls back to that generic catalog unchanged,
// while one that has real weekly content (MRCET) never shows the generic
// catalog at all.

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

function dayStatus(item, log) {
  if (item.date > todayISO()) return "locked";
  if (log) return "done";
  return "open";
}

// The lesson body (`item.concept`) is one freeform string, authored as
// plain text in the editor's textarea - no markdown, no structured fields.
// Splitting it back into prose/bullet-list/pseudocode blocks by indentation
// and leading "- " turns it back into something readable without requiring
// every existing lesson to be re-authored into a new schema first. Any
// block that doesn't match cleanly just falls through to prose, exactly
// like today - this never hides or loses content, only reformats it.
function parseConceptBlocks(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (/^\s{2,}\S/.test(line)) {
      const codeLines = [];
      while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
        codeLines.push(lines[i].replace(/^ {2}/, ""));
        i++;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const proseLines = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
      proseLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "prose", text: proseLines.join("\n") });
  }
  return blocks;
}

function ConceptRenderer({ text }) {
  const blocks = useMemo(() => parseConceptBlocks(text), [text]);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.type === "code") {
          return (
            <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
                <span className="text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>PSEUDOCODE</span>
                <button onClick={() => navigator.clipboard?.writeText(b.text)} style={{ color: CAMPUS.inkFaint }} title="Copy"><Copy size={11} /></button>
              </div>
              <pre className="text-[12px] font-mono p-3 overflow-x-auto" style={{ color: CAMPUS.inkSoft, background: CAMPUS.surface }}>{b.text}</pre>
            </div>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {b.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                  <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: CAMPUS.teal }} />
                  {it}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{b.text}</p>;
      })}
    </div>
  );
}

// One shape for every optional callout list (Learning Objectives,
// Prerequisites, Key Points, Important Notes, Common Mistakes, Interview
// Tips, Real-world Applications) - renders nothing at all when the admin
// hasn't authored that section for this lesson, rather than an empty card.
function InfoListCard({ icon: Icon, title, items, color, tint, checkItems = false }) {
  if (!items || items.length === 0) return null;
  return (
    <CampusCard className="p-4" style={{ border: `1px solid ${color}40`, background: tint }}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={14} style={{ color }} />
        <span className="text-[12.5px] font-bold" style={{ color: CAMPUS.ink }}>{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
            {checkItems
              ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color }} />
              : <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />}
            {it}
          </li>
        ))}
      </ul>
    </CampusCard>
  );
}

function CodeExampleBlock({ codeExample }) {
  if (!codeExample?.code) return null;
  const lang = CODELAB_LANGUAGES.find(l => l.id === codeExample.language);
  const lineCount = codeExample.code.split("\n").length;
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
        <span className="text-[10px] font-mono font-semibold tracking-wide" style={{ color: CAMPUS.teal }}>{lang?.label || "CODE"}</span>
        <button onClick={() => navigator.clipboard?.writeText(codeExample.code)} className="flex items-center gap-1 text-[10px]" style={{ color: CAMPUS.inkFaint }} title="Copy">
          <Copy size={11} /> copy
        </button>
      </div>
      <div style={{ height: Math.max(80, Math.min(320, 40 + lineCount * 19)) }}>
        <MonacoEditor
          language={lang?.monacoId || "plaintext"}
          theme="light"
          value={codeExample.code}
          options={{ readOnly: true, domReadOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
        />
      </div>
    </div>
  );
}

function NextLessonCard({ dayCompleted, nextItem, onGoToNext }) {
  if (!nextItem) return null;
  return (
    <button onClick={onGoToNext} className="w-full text-left mt-2">
      <CampusCard hover className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          {nextItem.type === "test" ? <ClipboardCheck size={16} /> : <BookOpen size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>{dayCompleted ? "COMPLETED · UP NEXT" : "UP NEXT"}</p>
          <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{nextItem.title}</b>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: CAMPUS.teal }}>Continue <ArrowRight size={13} /></span>
      </CampusCard>
    </button>
  );
}

// ---------------- Tab entry point (Daily Learning) ----------------

export function CampusDailyLearningTab({ slug }) {
  const [items, setItems] = useState(undefined); // undefined = loading
  const [moduleEnabled, setModuleEnabled] = useState(true);
  const weekId = mondayOf();

  useEffect(() => {
    Promise.all([fetchWeekItems(slug, weekId), fetchModuleConfig(slug)])
      .then(([rows, cfg]) => { setItems(rows); setModuleEnabled(cfg.enabled !== false); })
      .catch(() => setItems([]));
  }, [slug, weekId]);

  if (items === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;
  if (!moduleEnabled || items.length === 0) return <CampusLearningSection />;

  return <CampusDailyLearningWeek slug={slug} items={items} />;
}

// ---------------- Admin preview (Manage tab) ----------------

// Institution admins never enroll as students, so they had no way to see
// the week's content at all before this - this reuses the exact same item
// viewer students get (in readOnly mode: MCQ correct answers pre-revealed,
// no mark-as-read gate, no save/XP/coin writes) rather than a second,
// drift-prone rendering of the same data. Every day is openable regardless
// of date - an admin previewing content needs to see Thursday's lesson on
// a Monday, unlike the calendar-locked student view.
export function CampusDailyLearningAdminPreview({ slug, weekId: weekIdProp }) {
  const [items, setItems] = useState(undefined);
  const [selected, setSelected] = useState(null);
  const [openProblemId, setOpenProblemId] = useState(null);
  const weekId = weekIdProp || mondayOf();

  useEffect(() => {
    fetchWeekItems(slug, weekId, { includeUnpublished: true }).then(rows => { setItems(rows); setSelected(rows[0]?.date || null); }).catch(() => setItems([]));
  }, [slug, weekId]);

  if (items === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;
  if (items.length === 0) {
    return <CampusEmptyState icon={BookOpen} title="No Daily Learning content yet"
      description="Nothing has been authored for this institution's current week yet." />;
  }

  if (openProblemId) return <CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} />;
  const item = items.find(it => it.date === selected) || items[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {items.map(it => {
          const active = it.date === selected;
          const Icon = it.type === "test" ? ClipboardCheck : BookOpen;
          return (
            <button key={it.date} onClick={() => setSelected(it.date)}
              className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-colors"
              style={{ background: active ? CAMPUS.tealTint : "transparent", border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}` }}>
              <Icon size={14} style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }} />
              <span className="text-[10.5px] font-mono font-semibold" style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }}>
                {DOW_LABELS[it.dow].slice(0, 3).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
      {/* No Next Lesson nav here - the day-picker tabs above already cover
          jumping between days in admin preview, unlike the student flow
          where future days are locked and not directly clickable. */}
      <CampusDailyLearningItemView slug={slug} item={item} readOnly onOpenProblem={setOpenProblemId} />
    </div>
  );
}

function CampusDailyLearningWeek({ slug, items }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState({});
  const [openProblemId, setOpenProblemId] = useState(null);
  const weekId = items[0]?.weekId;

  useEffect(() => {
    if (!user) return;
    fetchUserWeekLogs(slug, user.uid, weekId).then(setLogs).catch(() => {});
  }, [slug, user, weekId]);

  const today = todayISO();
  const defaultItem = items.find(it => it.date === today && it.date <= today)
    || [...items].reverse().find(it => it.date <= today)
    || items[0];
  const [selected, setSelected] = useState(defaultItem.date);
  const item = items.find(it => it.date === selected) || defaultItem;

  if (openProblemId) {
    return <CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} />;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {items.map(it => {
          const log = logs[it.date];
          const status = dayStatus(it, log);
          const active = it.date === selected;
          const Icon = status === "locked" ? Lock : status === "done" ? CheckCircle2 : Circle;
          return (
            <button key={it.date} onClick={() => status !== "locked" && setSelected(it.date)} disabled={status === "locked"}
              className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-colors disabled:cursor-not-allowed"
              style={{
                background: active ? CAMPUS.tealTint : "transparent",
                border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              <Icon size={14} style={{ color: status === "locked" ? CAMPUS.inkFaint : status === "done" ? CAMPUS.good : (active ? CAMPUS.teal : CAMPUS.inkSoft) }} />
              <span className="text-[10.5px] font-mono font-semibold" style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }}>
                {DOW_LABELS[it.dow].slice(0, 3).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {item.date > today ? (
        <CampusEmptyState icon={Lock} title={`${DOW_LABELS[item.dow]}'s lesson opens on ${item.date}`}
          description="This program is paced day by day - come back once it unlocks." />
      ) : (
        <CampusDailyLearningItemView slug={slug} item={item} log={logs[item.date]}
          onLogged={(log) => setLogs(prev => ({ ...prev, [item.date]: log }))}
          onOpenProblem={setOpenProblemId}
          nextItem={(() => {
            const next = items[items.findIndex(it => it.date === item.date) + 1];
            return next && next.date <= today ? next : null;
          })()}
          onGoToNext={() => {
            const next = items[items.findIndex(it => it.date === item.date) + 1];
            if (next) setSelected(next.date);
          }} />
      )}
    </div>
  );
}

// ---------------- Assessments tab (Saturday master tests) ----------------

export function CampusDailyAssessmentsTab({ slug }) {
  const { user } = useAuth();
  const [tests, setTests] = useState(undefined);
  const [logs, setLogs] = useState({});
  const [openTest, setOpenTest] = useState(null);
  const [openProblemId, setOpenProblemId] = useState(null);

  useEffect(() => {
    fetchWeekTests(slug).then(setTests).catch(() => setTests([]));
  }, [slug]);

  useEffect(() => {
    if (!user || !tests?.length) return;
    Promise.all(tests.map(t => fetchLog(slug, user.uid, t.date))).then(results => {
      const byDate = {};
      tests.forEach((t, i) => { if (results[i]) byDate[t.date] = results[i]; });
      setLogs(byDate);
    }).catch(() => {});
  }, [slug, user, tests]);

  if (tests === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;

  if (openProblemId) return <CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} />;
  if (openTest) {
    return (
      <div>
        <CampusBackButton onClick={() => setOpenTest(null)} label="Back to assessments" />
        <CampusDailyLearningItemView slug={slug} item={openTest} log={logs[openTest.date]}
          onLogged={(log) => setLogs(prev => ({ ...prev, [openTest.date]: log }))}
          onOpenProblem={setOpenProblemId} />
      </div>
    );
  }

  if (tests.length === 0) {
    return <CampusEmptyState icon={ClipboardCheck} title="No assessments scheduled yet" description="Your institution hasn't published a weekly test yet - check back soon." />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {tests.map(t => {
        const log = logs[t.date];
        const locked = t.date > todayISO();
        return (
          <button key={t.date} disabled={locked} onClick={() => setOpenTest(t)} className="text-left disabled:cursor-not-allowed">
            <CampusCard hover={!locked} className="p-5 h-full" style={locked ? { opacity: 0.55 } : undefined}>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck size={14} style={{ color: CAMPUS.purple }} />
                <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{t.date}</span>
                {log && <CampusChip color={CAMPUS.good} icon={CheckCircle2} className="ml-auto">DONE</CampusChip>}
                {locked && !log && <CampusChip color={CAMPUS.inkFaint} icon={Lock} className="ml-auto">LOCKED</CampusChip>}
              </div>
              <b className="block text-[14.5px] mb-1.5" style={{ color: CAMPUS.ink }}>{t.title}</b>
              <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                {(t.problemIds || []).length} coding problems · {(t.mcqs || []).length} MCQs
                {log && ` · scored ${log.mcqScore}/${log.mcqTotal}`}
              </p>
            </CampusCard>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Shared day/test content viewer ----------------

function CampusDailyLearningItemView({ slug, item, log, onLogged, onOpenProblem, readOnly = false, nextItem, onGoToNext }) {
  const { user, userData } = useAuth();
  const [markedRead, setMarkedRead] = useState(!!log);
  const [answers, setAnswers] = useState(log?.mcqAnswers || {});
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(log ? { score: log.mcqScore, total: log.mcqTotal } : null);

  useEffect(() => {
    setMarkedRead(!!log);
    setAnswers(log?.mcqAnswers || {});
    setResult(log ? { score: log.mcqScore, total: log.mcqTotal } : null);
  }, [item.date, log]);

  useEffect(() => {
    Promise.all((item.problemIds || []).map(id => fetchProblem(id))).then(rows => setProblems(rows.filter(Boolean))).catch(() => setProblems([]));
  }, [item.problemIds]);

  useEffect(() => {
    if (!user || readOnly) return;
    fetchUserCodelabProgress(user.uid).then(p => setSolvedIds(new Set(Object.keys(p.solvedProblems || {})))).catch(() => {});
  }, [user, readOnly]);

  const mcqs = item.mcqs || [];
  const allAnswered = mcqs.every(q => answers[q.id] !== undefined);
  const answeredCount = mcqs.filter(q => answers[q.id] !== undefined).length;
  const solvedCount = problems.filter(p => solvedIds.has(p.id)).length;

  // A real, non-fabricated completion percentage - built only from state that
  // already exists (read/answered/solved), weighted equally across whichever
  // of the three actually apply to this day (a lesson with no problems
  // attached isn't penalized for having nothing to solve).
  const progressPct = useMemo(() => {
    const steps = [markedRead || !!result ? 1 : 0];
    if (mcqs.length > 0) steps.push(answeredCount / mcqs.length);
    if (problems.length > 0) steps.push(problems.length ? solvedCount / problems.length : 0);
    return Math.round((steps.reduce((a, b) => a + b, 0) / steps.length) * 100);
  }, [markedRead, result, mcqs.length, answeredCount, problems.length, solvedCount]);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      let correct = 0;
      mcqs.forEach(q => { if (answers[q.id] === q.correctIndex) correct++; });
      setResult({ score: correct, total: mcqs.length });
      const solvedNow = problems.filter(p => solvedIds.has(p.id)).map(p => p.id);
      await submitDayCompletion({ slug, uid: user.uid, profile: userData, item, mcqAnswers: answers, correctCount: correct, problemsSolved: solvedNow });
      onLogged?.({ mcqAnswers: answers, mcqScore: correct, mcqTotal: mcqs.length, problemsSolved: solvedNow, problemsTotal: problems.length });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const canSave = markedRead && allAnswered;
  const reveal = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div className="max-w-2xl" initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {/* ---------------- Header ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="flex items-center gap-2 mb-1">
        {item.type === "test" ? <ClipboardCheck size={13} style={{ color: CAMPUS.purple }} /> : <BookOpen size={13} style={{ color: CAMPUS.teal }} />}
        <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{DOW_LABELS[item.dow]} · {item.date}</p>
      </motion.div>
      <motion.h1 variants={reveal} initial="hidden" animate="visible" className="text-xl font-bold mb-3" style={{ color: CAMPUS.ink }}>{item.title}</motion.h1>

      <motion.div variants={reveal} initial="hidden" animate="visible" className="flex items-center gap-2 mb-4 flex-wrap">
        {item.difficulty && <CampusChip color={DIFF_COLOR[item.difficulty] || CAMPUS.good}>{item.difficulty}</CampusChip>}
        {item.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: CAMPUS.inkFaint }}><Clock size={11} /> {item.estimatedMinutes} min</span>
        )}
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.teal }}><Zap size={11} /> +{item.xpReward} XP</span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.good }}><Coins size={11} /> +{item.coinReward} coins</span>
        {!readOnly && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
              <motion.div className="h-full rounded-full" style={{ background: CAMPUS.teal }}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
            <span className="text-[10.5px] font-mono font-semibold" style={{ color: CAMPUS.inkFaint }}>{progressPct}%</span>
          </div>
        )}
      </motion.div>

      {readOnly && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mb-4 px-3.5 py-2.5 rounded-lg text-[11.5px] font-medium" style={{ color: CAMPUS.purple, background: CAMPUS.purpleTint, border: `1px solid ${CAMPUS.purple}40` }}>
          Admin preview - this is exactly what students see. Correct MCQ answers are highlighted below; nothing here is saved.
        </motion.div>
      )}

      {/* ---------------- What you'll learn / Prerequisites ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="space-y-3 mb-3">
        <InfoListCard icon={Target} title="WHAT YOU'LL LEARN" items={item.learningObjectives} color={CAMPUS.teal} tint={CAMPUS.tealTint} checkItems />
        <InfoListCard icon={BookOpen} title="PREREQUISITES" items={item.prerequisites} color={CAMPUS.blue} tint={CAMPUS.blueTint} checkItems />
      </motion.div>

      {/* ---------------- Concept ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible">
        <CampusCard className="p-5">
          <p className="text-[9px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>CONCEPT</p>
          <ConceptRenderer text={item.concept} />
          {item.codeExample?.code && <div className="mt-4"><CodeExampleBlock codeExample={item.codeExample} /></div>}
          <div className="flex items-center justify-between gap-4 mt-5 pt-4 flex-wrap" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>Read through the concept above before continuing.</span>
            {readOnly ? null : !markedRead ? (
              <button onClick={() => setMarkedRead(true)} className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
                mark as read
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-medium flex-shrink-0" style={{ color: CAMPUS.good }}><CheckCircle2 size={12} /> read</span>
            )}
          </div>
        </CampusCard>
      </motion.div>

      {/* ---------------- Key points / notes / mistakes / tips / applications ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="space-y-3 mt-3">
        <InfoListCard icon={ListChecks} title="KEY TAKEAWAYS" items={item.keyPoints} color={CAMPUS.good} tint={CAMPUS.goodTint} checkItems />
        <InfoListCard icon={Info} title="IMPORTANT" items={item.importantNotes} color={CAMPUS.warn} tint={CAMPUS.warnTint} />
        <InfoListCard icon={AlertTriangle} title="COMMON MISTAKES TO AVOID" items={item.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
        <InfoListCard icon={Lightbulb} title="INTERVIEW TIP" items={item.interviewTips} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
        <InfoListCard icon={Briefcase} title="REAL-WORLD APPLICATIONS" items={item.realWorldApplications} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
      </motion.div>

      {problems.length > 0 && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>
            PRACTICE PROBLEMS {readOnly ? `(${problems.length})` : `(${solvedCount}/${problems.length} solved)`}
          </p>
          <div className="space-y-2">
            {problems.map(p => {
              const solved = solvedIds.has(p.id);
              return (
                <button key={p.id} onClick={() => onOpenProblem(p.id)} className="w-full text-left">
                  <CampusCard hover className="p-3.5 flex items-center gap-3">
                    <Code2 size={14} style={{ color: solved ? CAMPUS.good : CAMPUS.inkFaint }} className="flex-shrink-0" />
                    <span className="flex-1 text-[13px] font-medium truncate" style={{ color: CAMPUS.ink }}>
                      {p.number != null && <span style={{ color: CAMPUS.inkFaint }}>{p.number}. </span>}{p.title}
                    </span>
                    <CampusChip color={{ Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad }[p.difficulty] || CAMPUS.good}>{p.difficulty}</CampusChip>
                    {solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2}>SOLVED</CampusChip>}
                    <ChevronRight size={13} style={{ color: CAMPUS.inkFaint }} />
                  </CampusCard>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {mcqs.length > 0 && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>
            {item.type === "test" ? "TEST MCQs" : "KNOWLEDGE CHECK"} ({mcqs.length})
          </p>
          <CampusCard className="p-5 space-y-5">
            {mcqs.map((q, qi) => {
              const chosen = answers[q.id];
              const graded = !!result || readOnly;
              return (
                <div key={q.id}>
                  <p className="text-xs mb-2" style={{ color: CAMPUS.inkSoft }}>{qi + 1}. {q.text}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isChosen = chosen === oi;
                      const isCorrect = oi === q.correctIndex;
                      let border = CAMPUS.line, bg = CAMPUS.paper;
                      if (graded && isChosen && isCorrect) { border = CAMPUS.good + "60"; bg = CAMPUS.goodTint; }
                      else if (graded && isChosen && !isCorrect) { border = CAMPUS.bad + "60"; bg = CAMPUS.badTint; }
                      else if (graded && isCorrect) { border = CAMPUS.good + "60"; bg = "transparent"; }
                      else if (isChosen) { border = CAMPUS.teal + "60"; bg = CAMPUS.tealTint; }
                      return (
                        <button key={oi} disabled={readOnly || !markedRead || saving} onClick={() => !graded && setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors disabled:cursor-not-allowed"
                          style={{ background: bg, border: `1px solid ${border}` }}>
                          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${isChosen ? CAMPUS.teal : CAMPUS.inkFaint}`, background: isChosen ? CAMPUS.teal : "transparent" }} />
                          <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CampusCard>
        </motion.div>
      )}

      <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
        {readOnly ? null : !user ? (
          <p className="text-xs" style={{ color: CAMPUS.inkFaint }}>Sign in to save your progress.</p>
        ) : (
          <motion.button whileHover={canSave ? { scale: 1.01 } : {}} whileTap={canSave ? { scale: 0.98 } : {}}
            onClick={handleSave} disabled={!canSave || saving}
            className="w-full text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-40"
            style={{ background: CAMPUS.teal, color: "#fff" }}>
            {saving ? "saving..." : log ? "update today's progress" : "mark today's learning as done"}
          </motion.button>
        )}
        <AnimatePresence>
          {result && !readOnly && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-center text-[12px] mt-3" style={{ color: CAMPUS.inkSoft }}>
              MCQs: {result.score}/{result.total} correct · Problems: {solvedCount}/{problems.length} solved
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {!readOnly && onGoToNext && (
        <motion.div variants={reveal} initial="hidden" animate="visible">
          <NextLessonCard dayCompleted={!!log} nextItem={nextItem} onGoToNext={onGoToNext} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------- Day-filtered leaderboard + click-through analysis ----------------

// Reused by both the Leaderboard tab (full day-picker) and the Overview
// "noticeboard" snapshot (a fixed date, no picker) - one table+drawer
// implementation instead of two.
export function CampusDayLeaderboard({ slug, date, dayLabel, myUid, compact = false }) {
  const [rows, setRows] = useState(undefined);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    setRows(undefined);
    fetchDayLeaderboard(slug, date).then(setRows).catch(() => setRows([]));
  }, [slug, date]);

  if (rows === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={compact ? 90 : 160} /></CampusCard>;

  const shown = compact ? rows.slice(0, 5) : rows;

  const columns = [
    { key: "rank", label: "#", render: r => (
      r.rank <= 3 ? <span className="flex items-center gap-1 font-mono font-bold" style={{ color: CAMPUS.gold }}><Medal size={12} /> {r.rank}</span>
        : <span className="font-mono" style={{ color: CAMPUS.inkFaint }}>{r.rank}</span>
    ) },
    { key: "displayName", label: "Student", render: r => (
      <span className="font-medium" style={{ color: r.uid === myUid ? CAMPUS.teal : CAMPUS.ink }}>
        {r.displayName}{r.rollNumber ? ` · ${r.rollNumber}` : ""}{r.uid === myUid && " (you)"}
      </span>
    ) },
    { key: "mcqScore", label: "MCQs", render: r => <span className="font-mono" style={{ color: CAMPUS.teal }}>{r.mcqScore}/{r.mcqTotal}</span> },
    { key: "problemsSolved", label: "Problems", render: r => <span className="font-mono" style={{ color: CAMPUS.good }}>{(r.problemsSolved || []).length}/{r.problemsTotal}</span> },
  ];

  return (
    <>
      <CampusCard className="overflow-hidden">
        <CampusTable columns={columns} rows={shown} rowKey="uid" onRowClick={setAnalysis}
          rowStyle={r => ({ background: r.uid === myUid ? CAMPUS.tealTint : "transparent" })}
          emptyState={<CampusEmptyState icon={Trophy} title="No one's completed this day yet" description={dayLabel ? `Be the first to finish ${dayLabel}'s learning.` : "Check back once students start completing it."} />} />
      </CampusCard>
      {analysis && <CampusDayAnalysisDrawer row={analysis} onClose={() => setAnalysis(null)} />}
    </>
  );
}

function CampusDayAnalysisDrawer({ row, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
        style={{ width: 420, maxWidth: "90vw", background: CAMPUS.surface, borderLeft: `1px solid ${CAMPUS.line}`, padding: "30px 34px" }}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>{row.displayName}</p>
            <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{row.dayLabel} · {row.date}{row.rollNumber ? ` · ${row.rollNumber}` : ""}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}><CloseIcon size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <CampusCard className="p-4 text-center">
            <p className="text-lg font-bold" style={{ color: CAMPUS.teal }}>{row.mcqScore}/{row.mcqTotal}</p>
            <p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>MCQ SCORE</p>
          </CampusCard>
          <CampusCard className="p-4 text-center">
            <p className="text-lg font-bold" style={{ color: CAMPUS.good }}>{(row.problemsSolved || []).length}/{row.problemsTotal}</p>
            <p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>PROBLEMS SOLVED</p>
          </CampusCard>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.teal }}><Zap size={12} /> +{row.xpEarned || 0} XP earned</span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.good }}><Coins size={12} /> +{row.coinEarned || 0} coins earned</span>
        </div>

        <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>MCQ ANSWERS (BY SELECTED OPTION INDEX)</p>
        <div className="space-y-1.5">
          {Object.entries(row.mcqAnswers || {}).map(([qId, idx]) => (
            <div key={qId} className="flex items-center justify-between text-[12px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
              <span style={{ color: CAMPUS.inkSoft }}>{qId}</span>
              <span className="font-mono" style={{ color: CAMPUS.ink }}>option {idx + 1}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
