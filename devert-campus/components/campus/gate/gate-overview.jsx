"use client";

import { useMemo } from "react";
import {
  ArrowRight, CalendarDays, Flame, Gauge, Rocket, Target, TrendingDown,
  TrendingUp, Trophy, AlertTriangle, CheckCircle2, ListChecks, Repeat,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusProgressBar } from "@/components/campus/campus-ui";
import { daysUntilExam, computeStreak, recommendNextTopic, isDayComplete, DAILY_STEPS } from "@/lib/gate";
import { projectFromAttempts } from "@/lib/gateTests";
import { buildRevisionPlan, computeWeeklyTarget, weeklyProgress } from "@/lib/gateRevision";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import {
  GateStat, GateBarList, GateProgressRing, GateEstimateNote, formatMarks,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// The Overview's job is to answer four questions in the first screenful, every
// day, without the student having to click: how far through the syllabus am I,
// how long have I got, what should I do right now, and is my score actually
// moving. Everything below that is supporting detail.
//
// A deliberate constraint: every number here is either counted from the
// student's own data or clearly labelled as an estimate. There is no motivational
// figure that isn't real - a fabricated "you're on track!" is the fastest way to
// make a preparation dashboard worthless to the person relying on it.

export function GateOverview() {
  const { user } = useAuth();
  const {
    paper, tree, progress, notes, pyqProgress, attempts, dailyHistory, today, completion, go,
  } = useGate();

  const daysLeft = daysUntilExam(paper);
  const streak = useMemo(() => computeStreak(dailyHistory), [dailyHistory]);
  const projection = useMemo(() => projectFromAttempts(attempts, paper), [attempts, paper]);
  const revision = useMemo(
    () => buildRevisionPlan({ tree, progress, notes, pyqProgress }),
    [tree, progress, notes, pyqProgress]);
  const nextTopic = useMemo(() => recommendNextTopic(tree, progress), [tree, progress]);
  const target = useMemo(
    () => computeWeeklyTarget({ completion, daysLeft }),
    [completion, daysLeft]);
  const week = useMemo(() => weeklyProgress(dailyHistory, target), [dailyHistory, target]);

  const { strong, weak } = useMemo(() => rankSubjects(completion, pyqProgress, attempts, tree), [completion, pyqProgress, attempts, tree]);
  const latestMock = useMemo(
    () => attempts.filter(a => a.graded && (a.testType === "full" || a.testType === "pyq"))[0]
      || attempts.filter(a => a.graded)[0] || null,
    [attempts]);

  if (!user) return <GateSignInPrompt />;

  const todayDone = isDayComplete(today);
  const todayStepsDone = DAILY_STEPS.filter(s => today?.steps?.[s.key]).length;

  return (
    <div className="space-y-5">
      {/* ---- the four headline figures ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Syllabus done" value={`${completion.pct}%`} icon={ListChecks} color={CAMPUS.teal}
          sub={`${completion.done} of ${completion.total} topics`} onClick={() => go("syllabus")} />
        <GateStat label="Days to exam" icon={CalendarDays} color={daysLeft != null && daysLeft < 60 ? CAMPUS.bad : CAMPUS.blue}
          value={daysLeft == null ? "-" : daysLeft > 0 ? daysLeft : "Today"}
          sub={daysLeft == null ? "Date not announced yet" : daysLeft > 0 ? "until the paper" : "good luck"}
          hint="Set from the paper's exam date in /admin. No date is shown until one is set - a guessed countdown would be worse than none." />
        <GateStat label="Study streak" value={streak} icon={Flame} color={streak > 0 ? CAMPUS.warn : CAMPUS.inkFaint}
          sub={streak === 1 ? "day" : "days in a row"} onClick={() => go("daily")}
          hint="A day counts once all six Daily GATE steps are done - not just for opening the app." />
        <GateStat label="Projected marks" icon={Gauge} color={CAMPUS.purple}
          value={projection ? formatMarks(projection.projectedMarks) : "-"}
          sub={projection ? `from ${projection.sampleSize} attempt${projection.sampleSize === 1 ? "" : "s"}` : "Take a mock test"}
          onClick={() => go("analytics")}
          hint="Mean of your best three recent attempts, normalised to 100 marks. An estimate, not a prediction." />
      </div>

      {/* ---- today ---- */}
      <CampusCard className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: todayDone ? CAMPUS.goodTint : CAMPUS.tealTint, color: todayDone ? CAMPUS.good : CAMPUS.teal }}>
              {todayDone ? <CheckCircle2 size={18} /> : <Rocket size={18} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>TODAY</p>
              <b className="text-[14.5px] block" style={{ color: CAMPUS.ink }}>
                {todayDone ? "Today's plan is complete." : `${todayStepsDone} of ${DAILY_STEPS.length} steps done today.`}
              </b>
              <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
                {todayDone
                  ? "Streak extended. Anything else you do today is a bonus."
                  : nextTopic
                    ? <>Next up: <b style={{ color: CAMPUS.ink }}>{nextTopic.topic.title}</b> in {nextTopic.subjectName}.</>
                    : "Pick a subject to begin - your first topic sets the plan."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CampusButton size="sm" variant="secondary" onClick={() => go("daily")}>Daily GATE</CampusButton>
            {nextTopic && (
              <CampusButton size="sm" icon={ArrowRight}
                onClick={() => go("subjects", { subjectId: nextTopic.subjectId, topicId: nextTopic.topic.id })}>
                Start studying
              </CampusButton>
            )}
          </div>
        </div>
        <div className="mt-3.5">
          <CampusProgressBar pct={Math.round((todayStepsDone / DAILY_STEPS.length) * 100)}
            color={todayDone ? CAMPUS.good : CAMPUS.teal} />
        </div>
      </CampusCard>

      {/* ---- weekly target ---- */}
      {target && (
        <CampusCard className="p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>WEEKLY TARGET</p>
              {target.syllabusDone ? (
                <b className="text-[14px]" style={{ color: CAMPUS.good }}>
                  Syllabus complete. Everything from here is revision and mocks.
                </b>
              ) : (
                <>
                  <b className="text-[14px]" style={{ color: CAMPUS.ink }}>
                    {target.topicsPerWeek} topic{target.topicsPerWeek === 1 ? "" : "s"} a week
                  </b>
                  <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
                    {target.remaining} topics left, {target.weeksAvailable} week{target.weeksAvailable === 1 ? "" : "s"} of
                    first-pass time - the last {target.revisionWeeksReserved} weeks are held back for revision and full-length mocks.
                  </p>
                  {target.aggressive && (
                    <p className="flex items-center gap-1.5 text-[11.5px] mt-1.5" style={{ color: CAMPUS.warn }}>
                      <AlertTriangle size={12} /> That pace is steep. Consider prioritising the highest-weightage subjects first.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <span className="block font-mono text-lg font-bold" style={{ color: week.daysStudied > 0 ? CAMPUS.good : CAMPUS.inkFaint }}>
                  {week.daysStudied}/{week.daysInWeek || 7}
                </span>
                <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>DAYS ACTIVE</span>
              </div>
            </div>
          </div>
        </CampusCard>
      )}

      {/* ---- score + rank ---- */}
      <div className="grid lg:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>MOCK PERFORMANCE</p>
          {!latestMock ? (
            <div>
              <p className="text-[12.5px] mb-3" style={{ color: CAMPUS.inkSoft }}>
                No graded attempt yet. A single full-length mock, taken honestly under time, tells you more than a month of
                untimed practice.
              </p>
              <CampusButton size="sm" onClick={() => go("mocks")}>Browse mock tests</CampusButton>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <GateProgressRing pct={Math.round((Math.max(0, latestMock.score) / Math.max(1, latestMock.maxScore)) * 100)}
                  label="LATEST" color={CAMPUS.purple} />
                <div className="min-w-0">
                  <b className="text-[15px] block" style={{ color: CAMPUS.ink }}>
                    {formatMarks(latestMock.score)} / {latestMock.maxScore}
                  </b>
                  <span className="text-[11.5px] block" style={{ color: CAMPUS.inkFaint }}>
                    {latestMock.correctCount} correct · {latestMock.wrongCount} wrong · {latestMock.skippedCount} skipped
                  </span>
                  {latestMock.penalty > 0 && (
                    <span className="text-[11px] block mt-0.5" style={{ color: CAMPUS.bad }}>
                      -{formatMarks(latestMock.penalty)} lost to negative marking
                    </span>
                  )}
                </div>
              </div>

              {projection?.rank && (
                <div className="pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>ESTIMATED AIR</span>
                    <b className="font-mono text-lg" style={{ color: CAMPUS.gold }}>
                      {projection.rank.belowRange ? `> ${projection.rank.air.toLocaleString("en-IN")}` : `~${projection.rank.air.toLocaleString("en-IN")}`}
                    </b>
                    <CampusChip color={CAMPUS.blue}>{projection.rank.percentile}th percentile</CampusChip>
                    {projection.trend?.improving && <CampusChip color={CAMPUS.good} icon={TrendingUp}>+{projection.trend.deltaMarks} marks</CampusChip>}
                    {projection.trend?.declining && <CampusChip color={CAMPUS.bad} icon={TrendingDown}>{projection.trend.deltaMarks} marks</CampusChip>}
                  </div>
                  <GateEstimateNote>
                    Estimated from {projection.basis} against historical marks-to-rank data
                    {projection.rank.isDefaultCurve ? " using a generic curve for this paper" : ""}, assuming
                    ~{projection.rank.candidateCount.toLocaleString("en-IN")} candidates. Not an official projection, and
                    {projection.confident ? "" : " based on too few full-length attempts to be reliable yet"}.
                  </GateEstimateNote>
                </div>
              )}
            </div>
          )}
        </CampusCard>

        <CampusCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>SUBJECT COMPLETION</p>
            <button onClick={() => go("analytics")} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>
              Full analytics
            </button>
          </div>
          <GateBarList
            rows={completion.subjects.map(s => ({
              key: s.subjectId, subjectId: s.subjectId, label: s.name, pct: s.pct,
              sub: `${s.done}/${s.total}`,
            }))}
            onRowClick={(row) => go("subjects", { subjectId: row.subjectId })}
            emptyLabel="No subjects published for this paper yet." />
        </CampusCard>
      </div>

      {/* ---- strengths, weaknesses, revision ---- */}
      <div className="grid lg:grid-cols-3 gap-4">
        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Trophy size={13} style={{ color: CAMPUS.good }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.good }}>STRONG TOPICS</p>
          </div>
          {strong.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              Attempt some questions - strengths are measured from accuracy, not from marking topics complete.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {strong.slice(0, 5).map(s => (
                <li key={s.key} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="truncate" style={{ color: CAMPUS.ink }}>{s.label}</span>
                  <span className="font-mono text-[11px] flex-shrink-0" style={{ color: CAMPUS.good }}>{s.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
        </CampusCard>

        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target size={13} style={{ color: CAMPUS.bad }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.bad }}>WEAK TOPICS</p>
          </div>
          {weak.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              Nothing flagged yet. A topic needs at least three attempts before it can be called weak.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {weak.slice(0, 5).map(s => (
                <li key={s.key} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="truncate" style={{ color: CAMPUS.ink }}>{s.label}</span>
                  <span className="font-mono text-[11px] flex-shrink-0" style={{ color: CAMPUS.bad }}>{s.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
          {weak.length > 0 && (
            <CampusButton size="sm" variant="ghost" className="mt-2 -ml-3" onClick={() => go("practice")}>
              Practice these
            </CampusButton>
          )}
        </CampusCard>

        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Repeat size={13} style={{ color: CAMPUS.purple }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.purple }}>DUE FOR REVISION</p>
          </div>
          {revision.due.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              Nothing due. Revision is scheduled once you complete topics.
            </p>
          ) : (
            <>
              <b className="font-mono text-2xl block mb-1" style={{ color: CAMPUS.purple }}>{revision.due.length}</b>
              <p className="text-[12px] mb-2" style={{ color: CAMPUS.inkSoft }}>
                {revision.critical.length > 0
                  ? `${revision.critical.length} of them are topics you also get wrong - do those first.`
                  : "Topics whose spaced-repetition interval has elapsed."}
              </p>
              <CampusButton size="sm" variant="ghost" className="-ml-3" onClick={() => go("revision")}>
                Open revision plan
              </CampusButton>
            </>
          )}
        </CampusCard>
      </div>

      {/* ---- previous year trend ---- */}
      <CampusCard className="p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
            SUBJECT WEIGHTAGE (HISTORICAL AVERAGE)
          </p>
          <button onClick={() => go("pyq")} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>
            Previous year questions
          </button>
        </div>
        <GateBarList
          rows={completion.subjects
            .filter(s => s.weightageMarks > 0)
            .sort((a, b) => b.weightageMarks - a.weightageMarks)
            .map(s => ({
              key: s.subjectId, subjectId: s.subjectId, label: s.name,
              pct: s.weightageMarks, sub: `${s.pct}% studied`,
              color: s.pct >= 80 ? CAMPUS.good : s.pct > 0 ? CAMPUS.warn : CAMPUS.inkFaint,
            }))}
          suffix=" marks"
          onRowClick={(row) => go("subjects", { subjectId: row.subjectId })}
          emptyLabel="Weightages not set for this paper yet." />
        <GateEstimateNote>
          Marks per subject are multi-year averages, not figures GATE publishes - use them to prioritise, not to predict this
          year&apos;s paper. Bar colour shows how much of each subject you have studied.
        </GateEstimateNote>
      </CampusCard>
    </div>
  );
}

// Strong and weak topics come from ACCURACY, never from completion: a student who
// has marked twenty topics complete without answering a question has no measured
// strengths, and saying otherwise would be flattery. Sources are merged - PYQ
// attempt rollups plus every graded test's per-subject breakdown - so both
// practice and tests count toward the same picture.
function rankSubjects(completion, pyqProgress, attempts, tree) {
  const nameBySubject = new Map((tree || []).map(s => [s.id, s.name]));
  const topicNames = new Map();
  for (const s of tree || []) for (const t of s.topics || []) topicNames.set(t.id, t.title);

  const acc = {};
  const add = (key, label, correct, attempted) => {
    if (!attempted) return;
    const a = acc[key] || (acc[key] = { key, label, correct: 0, attempted: 0 });
    a.correct += correct;
    a.attempted += attempted;
  };

  for (const [topicId, stat] of Object.entries(pyqProgress?.topicStats || {})) {
    add(`topic:${topicId}`, topicNames.get(topicId) || topicId, stat.correct || 0, stat.attempted || 0);
  }
  for (const attempt of attempts) {
    for (const s of attempt.subjectBreakdown || []) {
      add(`subject:${s.subjectId}`, nameBySubject.get(s.subjectId) || s.subjectId, s.correct || 0, s.attempted || 0);
    }
  }

  // Three attempts minimum before a topic is ranked either way - the same
  // threshold lib/aptitude.js's detectWeakTopics uses, and for the same reason:
  // one unlucky miss is not a weakness.
  const ranked = Object.values(acc)
    .filter(a => a.attempted >= 3)
    .map(a => ({ ...a, accuracy: Math.round((a.correct / a.attempted) * 100) }));

  return {
    strong: ranked.filter(a => a.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy),
    weak: ranked.filter(a => a.accuracy < 50).sort((a, b) => a.accuracy - b.accuracy),
  };
}
