"use client";

import { useMemo, useState } from "react";
import {
  BarChart3, Building2, CheckCircle2, Copy, FileQuestion, Flame, Search, XCircle,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusTable,
} from "@/components/campus/campus-ui";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import {
  fetchPyqs, availableYears, analyseByYear, analyseByTopic, frequentlyAskedTopics,
  repeatedQuestionGroups, groupByInstitute, recordPyqAttempt, isPyqCorrect,
  toggleBookmark, isBookmarked, normalizeAttempt,
} from "@/lib/gatePyq";
import { useGate, GateNoContent } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateQuestion, GateSolution, GateStat, GateFilterRow, GateBarList,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// The previous-year question bank, sliced every way a GATE candidate actually
// wants to slice it. The nine views the product asks for map onto five tabs plus
// a filter row, because "by year", "by subject", "by topic", "by difficulty" and
// "by marks" are the same list under different filters - implementing them as
// five separate screens would be five places for the question renderer and the
// attempt-recording to drift apart.
//
// Everything here is analysed from the bank itself rather than from
// admin-authored summary figures, so a "Computer Networks has averaged 9 marks"
// claim is always backed by the questions actually in the database. The one
// exception is repeated-question grouping, which is a human judgement an admin
// makes explicitly (see lib/gatePyq.js's repeatedQuestionGroups) rather than a
// string-similarity guess presented as fact.

const PYQ_VIEWS = [
  { key: "browse", label: "Browse", icon: FileQuestion },
  { key: "repeated", label: "Repeated", icon: Copy },
  { key: "frequent", label: "Frequently asked", icon: Flame },
  { key: "institute", label: "By institute", icon: Building2 },
  { key: "analysis", label: "Exam analysis", icon: BarChart3 },
];

export function GatePyqBrowser() {
  const { paper, tree, screen } = useGate();
  const [view, setView] = useState("browse");
  const [pyqs] = useKeyedFetch(paper?.id, () => fetchPyqs(paper.id), { fallback: [] });

  if (pyqs === null) return <CampusCard className="p-4"><CampusSkeleton height={240} /></CampusCard>;
  if (pyqs.length === 0) {
    return <GateNoContent what="previous year questions"
      hint="Previous year questions are authored per paper in /admin > GATE > Previous Year Questions, individually or by bulk CSV import." />;
  }

  const years = availableYears(pyqs);

  return (
    <div className="space-y-5">
      <GateSectionHeading label="PREVIOUS YEAR QUESTIONS" icon={FileQuestion} title="Previous Year Questions"
        description={`${pyqs.length} questions across ${years.length} paper${years.length === 1 ? "" : "s"} (${years[years.length - 1]}-${years[0]}), each with a full solution, the common wrong turns, and the shortcut where one exists.`} />

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {PYQ_VIEWS.map(v => {
          const active = v.key === view;
          const Icon = v.icon;
          return (
            <button key={v.key} onClick={() => setView(v.key)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? CAMPUS.tealTint : CAMPUS.paper,
                border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
              }}>
              <Icon size={12} /> {v.label}
            </button>
          );
        })}
      </div>

      {view === "browse" && <PyqBrowseView pyqs={pyqs} tree={tree} initialSubjectId={screen.subjectId} />}
      {view === "repeated" && <RepeatedView pyqs={pyqs} />}
      {view === "frequent" && <FrequentView pyqs={pyqs} tree={tree} />}
      {view === "institute" && <InstituteView pyqs={pyqs} />}
      {view === "analysis" && <AnalysisView pyqs={pyqs} tree={tree} />}
    </div>
  );
}

// ---------------- browse ----------------

function PyqBrowseView({ pyqs, tree, initialSubjectId }) {
  const { user } = useAuth();
  const { paper, pyqProgress, notes, reload } = useGate();

  const [year, setYear] = useState(null);
  const [subjectId, setSubjectId] = useState(initialSubjectId || null);
  const [topicId, setTopicId] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [marks, setMarks] = useState(null);
  const [status, setStatus] = useState(null);
  const [search, setSearch] = useState("");

  const years = useMemo(() => availableYears(pyqs), [pyqs]);
  const subjects = useMemo(() => (tree || []).map(s => ({ v: s.id, label: s.name })), [tree]);
  const topics = useMemo(() => {
    const subject = (tree || []).find(s => s.id === subjectId);
    return (subject?.topics || []).map(t => ({ v: t.id, label: t.title }));
  }, [tree, subjectId]);

  // A topic selected under a previous subject is DERIVED away rather than reset
  // by an effect. Resetting in an effect renders one frame with an impossible
  // filter pair (subject=Algorithms, topic=B+ Trees) which shows zero results for
  // a reason the student cannot see; deriving means that state never exists.
  const effectiveTopicId = topics.some(t => t.v === topicId) ? topicId : null;

  // Memoised so the `|| {}` fallback isn't a fresh object literal on every
  // render, which would invalidate the filtered-list memo below every time.
  const attempted = useMemo(() => pyqProgress?.attempted || {}, [pyqProgress]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pyqs.filter(p => {
      if (year && p.year !== year) return false;
      if (subjectId && p.subjectId !== subjectId) return false;
      if (effectiveTopicId && p.topicId !== effectiveTopicId) return false;
      if (difficulty && p.difficulty !== difficulty) return false;
      if (marks && p.marks !== marks) return false;
      if (status) {
        const entry = attempted[p.id] ? normalizeAttempt(attempted[p.id]) : null;
        if (status === "unattempted" && entry) return false;
        if (status === "solved" && !entry?.everCorrect) return false;
        if (status === "wrong" && (!entry || entry.everCorrect)) return false;
      }
      if (q && !(p.question || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pyqs, year, subjectId, effectiveTopicId, difficulty, marks, status, search, attempted]);

  // "Show 20 more" resets when the filters change, derived from a signature of
  // the filters rather than by an effect that writes state - same reasoning as
  // effectiveTopicId above.
  const filterKey = `${year}|${subjectId}|${effectiveTopicId}|${difficulty}|${marks}|${status}|${search}`;
  const [pageState, setPageState] = useState({ key: filterKey, size: 20 });
  const limit = pageState.key === filterKey ? pageState.size : 20;

  return (
    <div className="space-y-4">
      <CampusCard className="p-4 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          <Search size={13} style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search question text..."
            className="flex-1 bg-transparent outline-none text-[12.5px]" style={{ color: CAMPUS.ink }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <GateFilterRow label="YEAR" value={year} onChange={setYear} allLabel="All years"
            options={years.map(y => ({ v: y, label: String(y) }))} />
          <GateFilterRow label="SUBJECT" value={subjectId} onChange={setSubjectId} allLabel="All subjects"
            options={subjects} />
        </div>
        {subjectId && topics.length > 0 && (
          <GateFilterRow label="TOPIC" value={effectiveTopicId} onChange={setTopicId} allLabel="Whole subject" options={topics} />
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <GateFilterRow label="DIFFICULTY" value={difficulty} onChange={setDifficulty}
            options={[{ v: "Easy", label: "Easy" }, { v: "Moderate", label: "Moderate" }, { v: "Hard", label: "Hard" }]} />
          <GateFilterRow label="MARKS" value={marks} onChange={setMarks}
            options={[{ v: 1, label: "1 mark" }, { v: 2, label: "2 marks" }]} />
          <GateFilterRow label="MY STATUS" value={status} onChange={setStatus}
            options={[
              { v: "unattempted", label: "Not attempted" },
              { v: "solved", label: "Solved" },
              { v: "wrong", label: "Got wrong" },
            ]} />
        </div>
      </CampusCard>

      <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
        {filtered.length} question{filtered.length === 1 ? "" : "s"} match.
      </p>

      <div className="space-y-4">
        {filtered.slice(0, limit).map((pyq, i) => (
          <PyqCard key={pyq.id} pyq={pyq} index={i} attempt={attempted[pyq.id]}
            bookmarked={isBookmarked(notes, "pyq", pyq.id)}
            onBookmark={user ? async () => {
              const on = !isBookmarked(notes, "pyq", pyq.id);
              await toggleBookmark({ uid: user.uid, paperId: paper.id, kind: "pyq", id: pyq.id, on }).catch(() => {});
              await reload.notes();
            } : undefined}
            onAttempt={user ? async (given, correct, timeSec) => {
              await recordPyqAttempt({ uid: user.uid, paperId: paper.id, pyq, given, correct, timeSec }).catch(() => {});
              await Promise.all([reload.pyqProgress(), reload.notes()]).catch(() => {});
            } : undefined} />
        ))}
      </div>

      {filtered.length > limit && (
        <CampusButton variant="secondary" onClick={() => setPageState({ key: filterKey, size: limit + 20 })}>
          Show 20 more ({filtered.length - limit} left)
        </CampusButton>
      )}
    </div>
  );
}

// One PYQ, attemptable in place. `attempt` is this student's stored history for
// it, so the card can show "you got this wrong twice before" - which is the
// single most useful thing to know when you meet a question again.
function PyqCard({ pyq, index, attempt, bookmarked, onBookmark, onAttempt }) {
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const history = attempt ? normalizeAttempt(attempt) : null;
  const correct = checked ? isPyqCorrect(pyq, pyq, answer) : null;

  const check = async () => {
    setChecked(true);
    const isRight = isPyqCorrect(pyq, pyq, answer);
    await onAttempt?.(answer, isRight, Math.round((Date.now() - startedAt) / 1000));
  };

  return (
    <div className="space-y-2">
      {history && (
        <div className="flex items-center gap-2 flex-wrap">
          {history.everCorrect
            ? <CampusChip color={CAMPUS.good} icon={CheckCircle2}>SOLVED BEFORE</CampusChip>
            : <CampusChip color={CAMPUS.bad} icon={XCircle}>GOT THIS WRONG</CampusChip>}
          <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
            {history.attempts} attempt{history.attempts === 1 ? "" : "s"}
            {history.bestTimeSec != null ? ` · best ${history.bestTimeSec}s` : ""}
          </span>
        </div>
      )}
      <GateQuestion question={pyq} index={index} answer={answer} onAnswer={setAnswer}
        mode={checked ? "review" : "answer"} answerKey={checked ? pyq : null}
        bookmarked={bookmarked} onToggleBookmark={onBookmark} />
      {!checked ? (
        <div className="flex items-center gap-2">
          <CampusButton size="sm" onClick={check}
            disabled={answer === null || answer === "" || (Array.isArray(answer) && !answer.length)}>
            Check answer
          </CampusButton>
          <CampusButton size="sm" variant="ghost" onClick={() => setChecked(true)}>
            Skip to solution
          </CampusButton>
        </div>
      ) : (
        <p className="text-[12.5px] font-semibold" style={{ color: correct ? CAMPUS.good : CAMPUS.bad }}>
          {answer === null ? "Solution shown - nothing recorded, since you didn't attempt it."
            : correct ? "Correct." : "Not correct."}
        </p>
      )}
      <GateSolution answerKey={pyq} defaultOpen={checked && correct === false} />
    </div>
  );
}

// ---------------- repeated ----------------

function RepeatedView({ pyqs }) {
  const groups = useMemo(() => repeatedQuestionGroups(pyqs), [pyqs]);
  const flagged = useMemo(() => pyqs.filter(p => p.isRepeated && !p.repeatGroup), [pyqs]);

  if (groups.length === 0 && flagged.length === 0) {
    return (
      <CampusCard className="p-5">
        <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>
          No repeated questions have been identified for this paper yet. Repetition is tagged deliberately by an admin
          (two questions being &quot;the same question rephrased&quot; is a judgement call, not something worth guessing at
          automatically and then showing you as fact).
        </p>
      </CampusCard>
    );
  }

  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
          <b style={{ color: CAMPUS.ink }}>{groups.length} concept{groups.length === 1 ? "" : "s"}</b> have been asked more
          than once in different years. These are the highest-confidence bets on the syllabus - a concept GATE has returned
          to three times is not going to stop being examinable.
        </p>
      </CampusCard>

      {groups.map(group => (
        <CampusCard key={group.repeatGroup} className="p-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Copy size={13} style={{ color: CAMPUS.purple }} />
            <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{group.repeatGroup}</b>
            <CampusChip color={CAMPUS.purple}>ASKED {group.items.length}×</CampusChip>
            <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{group.years.join(", ")}</span>
          </div>
          <div className="space-y-3">
            {group.items.map((pyq, i) => (
              <div key={pyq.id} className="space-y-2">
                <GateQuestion question={pyq} index={i} mode="study" answer={null} onAnswer={() => {}} />
                <GateSolution answerKey={pyq} />
              </div>
            ))}
          </div>
        </CampusCard>
      ))}

      {flagged.length > 0 && (
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>
            ALSO FLAGGED AS REPEATED ({flagged.length})
          </p>
          <div className="space-y-3">
            {flagged.map((pyq, i) => (
              <div key={pyq.id} className="space-y-2">
                <GateQuestion question={pyq} index={i} mode="study" answer={null} onAnswer={() => {}} />
                <GateSolution answerKey={pyq} />
              </div>
            ))}
          </div>
        </CampusCard>
      )}
    </div>
  );
}

// ---------------- frequently asked ----------------

function FrequentView({ pyqs, tree }) {
  const { go } = useGate();
  const frequent = useMemo(() => frequentlyAskedTopics(pyqs), [pyqs]);
  const names = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) m.set(t.id, { title: t.title, subject: s.name, subjectId: s.id });
    return m;
  }, [tree]);
  const totalYears = availableYears(pyqs).length;

  if (frequent.length === 0) {
    return (
      <CampusCard className="p-5">
        <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>
          Not enough years in the bank yet to call anything &quot;frequently asked&quot; - that needs a topic to appear in at
          least a third of the papers on record, with at least three questions.
        </p>
      </CampusCard>
    );
  }

  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
          Topics that appear in at least a third of the {totalYears} papers on record, with three or more questions.
          Sorted by total marks - the top of this list is where preparation time converts to marks fastest.
        </p>
      </CampusCard>
      <div className="space-y-2">
        {frequent.map(t => {
          const meta = names.get(t.topicId);
          return (
            <CampusCard key={t.topicId} hover={!!meta} className={`p-3.5 ${meta ? "cursor-pointer" : ""}`}
              onClick={meta ? () => go("subjects", { subjectId: meta.subjectId, topicId: t.topicId }) : undefined}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <b className="text-[13px] block" style={{ color: CAMPUS.ink }}>{meta?.title || t.topicId}</b>
                  <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{meta?.subject || "Unassigned subject"}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CampusChip color={CAMPUS.gold}>{t.marks} MARKS TOTAL</CampusChip>
                  <CampusChip color={CAMPUS.teal}>{t.yearsAsked}/{totalYears} YEARS</CampusChip>
                  <CampusChip color={CAMPUS.inkFaint}>{t.count} Qs</CampusChip>
                </div>
              </div>
              <p className="text-[10.5px] font-mono mt-1.5" style={{ color: CAMPUS.inkFaint }}>
                Asked in {t.years.join(", ")}
              </p>
            </CampusCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- by organizing institute ----------------

function InstituteView({ pyqs }) {
  const groups = useMemo(() => groupByInstitute(pyqs), [pyqs]);
  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
          GATE&apos;s organizing institute rotates each year, and a paper&apos;s flavour tends to follow the host&apos;s own
          teaching emphasis. Worth a look if you know who is setting your paper - but it is a tendency, not a rule, and no
          serious preparation plan should be built on it.
        </p>
      </CampusCard>
      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map(g => (
          <CampusCard key={g.institute} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} style={{ color: CAMPUS.blue }} />
              <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{g.institute}</b>
            </div>
            <p className="text-[11.5px] mb-2.5" style={{ color: CAMPUS.inkFaint }}>
              {g.count} questions · {g.years.length ? g.years.join(", ") : "year not tagged"}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(g.byType).map(([type, n]) => (
                <CampusChip key={type} color={CAMPUS.inkFaint}>{type.toUpperCase()} {n}</CampusChip>
              ))}
            </div>
          </CampusCard>
        ))}
      </div>
    </div>
  );
}

// ---------------- exam analysis ----------------

function AnalysisView({ pyqs, tree }) {
  const byYear = useMemo(() => analyseByYear(pyqs), [pyqs]);
  const byTopic = useMemo(() => analyseByTopic(pyqs), [pyqs]);
  const subjectNames = useMemo(() => new Map((tree || []).map(s => [s.id, s.name])), [tree]);
  const topicNames = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) m.set(t.id, t.title);
    return m;
  }, [tree]);

  // Marks per subject averaged across every year in the bank - the honest
  // version of a weightage table, since it is counted rather than asserted.
  const subjectAverages = useMemo(() => {
    const totals = {};
    for (const y of byYear) {
      for (const [sid, marks] of Object.entries(y.bySubject)) {
        totals[sid] = (totals[sid] || 0) + marks;
      }
    }
    const years = byYear.length || 1;
    return Object.entries(totals)
      .map(([sid, marks]) => ({
        key: sid, label: subjectNames.get(sid) || sid,
        pct: Math.round((marks / years) * 10) / 10,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [byYear, subjectNames]);

  const typeTotals = useMemo(() => {
    const t = { mcq: 0, msq: 0, nat: 0 };
    for (const p of pyqs) t[p.questionType] = (t[p.questionType] || 0) + 1;
    return t;
  }, [pyqs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Papers on record" value={byYear.length} color={CAMPUS.blue} />
        <GateStat label="Total questions" value={pyqs.length} color={CAMPUS.teal} />
        <GateStat label="MCQ / MSQ / NAT" value={`${typeTotals.mcq}/${typeTotals.msq}/${typeTotals.nat}`} color={CAMPUS.purple} />
        <GateStat label="Topics covered" value={byTopic.length} color={CAMPUS.gold} />
      </div>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>
          AVERAGE MARKS PER SUBJECT, COUNTED FROM {byYear.length} PAPER{byYear.length === 1 ? "" : "S"}
        </p>
        <GateBarList rows={subjectAverages} suffix=" marks" color={CAMPUS.gold} />
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>PAPER-BY-PAPER</p>
        <CampusTable
          rows={byYear.map(y => ({ id: y.year, ...y }))}
          columns={[
            { key: "year", label: "Year", sortable: true },
            { key: "institute", label: "Organizing institute", render: r => r.institute || "-" },
            { key: "count", label: "Questions", sortable: true },
            { key: "marks", label: "Marks", sortable: true },
            {
              key: "types", label: "MCQ / MSQ / NAT",
              render: r => `${r.byType.mcq || 0} / ${r.byType.msq || 0} / ${r.byType.nat || 0}`,
            },
          ]} />
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>
          MOST-EXAMINED TOPICS (BY TOTAL MARKS)
        </p>
        <GateBarList color={CAMPUS.teal} suffix=" marks"
          rows={byTopic.slice(0, 15).map(t => ({
            key: t.topicId, label: topicNames.get(t.topicId) || t.topicId,
            pct: t.marks, sub: `${t.yearsAsked} year${t.yearsAsked === 1 ? "" : "s"}`,
          }))} />
      </CampusCard>
    </div>
  );
}
