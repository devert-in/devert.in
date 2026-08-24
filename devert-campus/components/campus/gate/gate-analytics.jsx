"use client";

import { useMemo } from "react";
import {
  Activity, BarChart3, CheckCircle2, Clock, Gauge, ListChecks, Repeat, Target,
  TrendingDown, TrendingUp, Trophy,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusTable, CampusEmptyState, CampusButton,
} from "@/components/campus/campus-ui";
import { projectFromAttempts, testTypeLabel } from "@/lib/gateTests";
import { normalizeAttempt } from "@/lib/gatePyq";
import { buildRevisionPlan, buildHeatmap, revisionBuckets } from "@/lib/gateRevision";
import { computeStreak } from "@/lib/gate";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateStat, GateBarList, GateEstimateNote, GateProgressRing,
  formatDuration, formatMarks,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// Full analytics. Every figure on this screen is counted from the student's own
// stored data - progress doc, PYQ attempt rollups, graded test attempts, daily
// history - with two exceptions that are labelled as estimates wherever they
// appear: predicted marks and predicted rank.
//
// Study HOURS are the one metric this screen deliberately does not fabricate.
// A browser cannot know how long someone studied (a tab left open overnight would
// report sixteen hours), so what is shown instead is measured time inside timed
// tests plus recorded per-question time in practice, labelled as exactly that.
// Showing an invented "study hours" figure would make every other number on the
// page less trustworthy.

export function GateAnalytics() {
  const { user } = useAuth();
  const {
    paper, tree, progress, notes, pyqProgress, attempts, dailyHistory, completion, go,
  } = useGate();

  const graded = useMemo(() => attempts.filter(a => a.graded), [attempts]);
  const projection = useMemo(() => projectFromAttempts(attempts, paper), [attempts, paper]);
  const revisionPlan = useMemo(
    () => buildRevisionPlan({ tree, progress, notes, pyqProgress }),
    [tree, progress, notes, pyqProgress]);
  const buckets = useMemo(() => revisionBuckets(revisionPlan, notes), [revisionPlan, notes]);
  const heatmap = useMemo(() => buildHeatmap(dailyHistory), [dailyHistory]);
  const streak = useMemo(() => computeStreak(dailyHistory), [dailyHistory]);

  const subjectNames = useMemo(() => new Map((tree || []).map(s => [s.id, s.name])), [tree]);
  const topicNames = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) m.set(t.id, { title: t.title, subjectId: s.id });
    return m;
  }, [tree]);

  // Practice volume and accuracy, from the PYQ attempt rollups.
  const practice = useMemo(() => {
    const attempted = pyqProgress?.attempted || {};
    const entries = Object.values(attempted).map(normalizeAttempt);
    const totalAttempts = entries.reduce((n, e) => n + (e.attempts || 0), 0);
    const solved = entries.filter(e => e.everCorrect).length;
    const firstTryCorrect = entries.filter(e => e.history?.[0]?.correct).length;
    const timed = entries.flatMap(e => e.history || []).filter(h => Number.isFinite(h.timeSec));
    return {
      uniqueQuestions: entries.length,
      totalAttempts,
      solved,
      firstTryAccuracy: entries.length ? Math.round((firstTryCorrect / entries.length) * 100) : null,
      avgTimeSec: timed.length ? Math.round(timed.reduce((n, h) => n + h.timeSec, 0) / timed.length) : null,
      measuredSec: timed.reduce((n, h) => n + h.timeSec, 0),
    };
  }, [pyqProgress]);

  const testTimeSec = useMemo(
    () => graded.reduce((n, a) => n + (a.timeTakenSeconds || 0), 0), [graded]);

  // Accuracy per subject, merging test breakdowns with PYQ rollups so both
  // sources feed one number instead of two that disagree.
  const subjectAccuracy = useMemo(() => {
    const acc = {};
    const bump = (sid, correct, attempted) => {
      if (!attempted) return;
      const a = acc[sid] || (acc[sid] = { subjectId: sid, correct: 0, attempted: 0 });
      a.correct += correct; a.attempted += attempted;
    };
    for (const [sid, s] of Object.entries(pyqProgress?.subjectStats || {})) {
      bump(sid, s.correct || 0, s.attempted || 0);
    }
    for (const a of graded) {
      for (const s of a.subjectBreakdown || []) bump(s.subjectId, s.correct || 0, s.attempted || 0);
    }
    return Object.values(acc)
      .map(a => ({
        key: a.subjectId, label: subjectNames.get(a.subjectId) || a.subjectId,
        pct: Math.round((a.correct / a.attempted) * 100),
        sub: `${a.correct}/${a.attempted}`,
        color: a.correct / a.attempted >= 0.7 ? CAMPUS.good : a.correct / a.attempted >= 0.4 ? CAMPUS.warn : CAMPUS.bad,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [pyqProgress, graded, subjectNames]);

  const topicAccuracy = useMemo(() => {
    return Object.entries(pyqProgress?.topicStats || {})
      .filter(([, s]) => (s.attempted || 0) >= 3)
      .map(([tid, s]) => ({
        key: tid, label: topicNames.get(tid)?.title || tid,
        pct: Math.round(((s.correct || 0) / s.attempted) * 100),
        sub: `${s.correct || 0}/${s.attempted}`,
      }))
      .sort((a, b) => a.pct - b.pct);
  }, [pyqProgress, topicNames]);

  if (!user) return <GateSignInPrompt what="your analytics" />;

  const nothingYet = completion.done === 0 && graded.length === 0 && practice.uniqueQuestions === 0;
  if (nothingYet) {
    return (
      <div className="space-y-5">
        <GateSectionHeading label="ANALYTICS" icon={BarChart3} title="Analytics"
          description="Everything measured from what you actually do - no self-reported hours, no invented figures." />
        <CampusEmptyState icon={BarChart3} title="Nothing to analyse yet"
          description="Complete a topic, attempt some questions or take a test and this page fills in. It only ever shows numbers it can count."
          action={<CampusButton size="sm" onClick={() => go("subjects")}>Start studying</CampusButton>} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GateSectionHeading label="ANALYTICS" icon={BarChart3} title="Analytics"
        description="Counted from your own progress, attempts and tests. The two estimated figures - projected marks and rank - say so wherever they appear." />

      {/* ---- completion ---- */}
      <div className="grid lg:grid-cols-3 gap-4">
        <CampusCard className="p-4 flex items-center gap-4">
          <GateProgressRing pct={completion.pct} size={72} label="SYLLABUS" />
          <div>
            <b className="text-[15px] block" style={{ color: CAMPUS.ink }}>{completion.done} / {completion.total}</b>
            <span className="text-[11.5px] block" style={{ color: CAMPUS.inkFaint }}>topics completed</span>
            <span className="text-[11px] block mt-1" style={{ color: CAMPUS.inkFaint }}>
              {completion.subjects.filter(s => s.done > 0).length} of {completion.subjects.length} subjects started
            </span>
          </div>
        </CampusCard>
        <CampusCard className="p-4 flex items-center gap-4">
          <GateProgressRing pct={practice.firstTryAccuracy ?? 0} size={72} label="ACCURACY" color={CAMPUS.blue} />
          <div>
            <b className="text-[15px] block" style={{ color: CAMPUS.ink }}>
              {practice.firstTryAccuracy == null ? "-" : `${practice.firstTryAccuracy}%`}
            </b>
            <span className="text-[11.5px] block" style={{ color: CAMPUS.inkFaint }}>first-attempt accuracy</span>
            <span className="text-[11px] block mt-1" style={{ color: CAMPUS.inkFaint }}>
              across {practice.uniqueQuestions} practice questions
            </span>
          </div>
        </CampusCard>
        <CampusCard className="p-4 flex items-center gap-4">
          <GateProgressRing pct={heatmap.totalDays ? Math.round((heatmap.activeDays / heatmap.totalDays) * 100) : 0}
            size={72} label="ACTIVE" color={CAMPUS.warn} />
          <div>
            <b className="text-[15px] block" style={{ color: CAMPUS.ink }}>{streak} day streak</b>
            <span className="text-[11.5px] block" style={{ color: CAMPUS.inkFaint }}>
              {heatmap.activeDays} active days of {heatmap.totalDays}
            </span>
          </div>
        </CampusCard>
      </div>

      {/* ---- volume ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Questions attempted" value={practice.uniqueQuestions} icon={ListChecks} color={CAMPUS.teal}
          sub={`${practice.totalAttempts} total attempts`} />
        <GateStat label="Ever solved" value={practice.solved} icon={CheckCircle2} color={CAMPUS.good} />
        <GateStat label="Tests taken" value={graded.length} icon={Trophy} color={CAMPUS.gold} onClick={() => go("mocks")} />
        <GateStat label="Average time / question" value={practice.avgTimeSec == null ? "-" : `${practice.avgTimeSec}s`}
          icon={Clock} color={CAMPUS.blue} />
      </div>

      {/* ---- measured time, honestly labelled ---- */}
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>MEASURED TIME</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <GateStat label="In timed tests" value={formatDuration(testTimeSec)} color={CAMPUS.purple} />
          <GateStat label="On practice questions" value={formatDuration(practice.measuredSec)} color={CAMPUS.teal} />
          <GateStat label="Total measured" value={formatDuration(testTimeSec + practice.measuredSec)} color={CAMPUS.ink} />
        </div>
        <GateEstimateNote>
          This is time actually spent inside timed tests and on individual practice questions - not total study hours. A
          browser has no honest way to measure reading time (a tab left open overnight would claim sixteen hours), so no
          such figure is shown. Consistency is tracked by days active instead, which is measurable.
        </GateEstimateNote>
      </CampusCard>

      {/* ---- projection ---- */}
      {projection && (
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>PROJECTION</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GateStat label="Projected marks" value={formatMarks(projection.projectedMarks)} icon={Gauge} color={CAMPUS.purple} />
            <GateStat label="Estimated AIR" icon={Trophy} color={CAMPUS.gold}
              value={projection.rank ? `~${projection.rank.air.toLocaleString("en-IN")}` : "-"} />
            <GateStat label="Percentile" value={projection.rank ? projection.rank.percentile : "-"} icon={BarChart3} color={CAMPUS.blue} />
            <GateStat label="Trend" icon={projection.trend?.declining ? TrendingDown : TrendingUp}
              color={projection.trend?.declining ? CAMPUS.bad : projection.trend?.improving ? CAMPUS.good : CAMPUS.inkFaint}
              value={projection.trend ? `${projection.trend.deltaMarks > 0 ? "+" : ""}${projection.trend.deltaMarks}` : "-"}
              sub={projection.trend ? "marks vs early attempts" : "need 4+ attempts"} />
          </div>
          <GateEstimateNote>
            Projected from the mean of your best three recent {projection.basis} ({projection.sampleSize} attempt
            {projection.sampleSize === 1 ? "" : "s"} in the sample), then mapped onto historical marks-to-rank data.
            {projection.confident
              ? " Based on at least two full-length attempts."
              : " Based on too few full-length attempts to be reliable - take a full mock for a meaningful figure."}
            {" "}An estimate, not a prediction with any official standing.
          </GateEstimateNote>
        </CampusCard>
      )}

      {/* ---- mock score history ---- */}
      {graded.length > 0 && (
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>TEST HISTORY</p>
          <CampusTable
            rows={graded.map(a => ({
              id: a.id,
              type: testTypeLabel(a.testType),
              score: `${formatMarks(a.score)}/${a.maxScore}`,
              normalized: a.maxScore ? Math.round((a.score / a.maxScore) * 1000) / 10 : 0,
              accuracy: `${a.accuracy ?? 0}%`,
              attempted: `${a.attemptedCount ?? 0}/${(a.attemptedCount ?? 0) + (a.skippedCount ?? 0)}`,
              penalty: a.penalty ? `-${formatMarks(a.penalty)}` : "-",
              air: a.estimatedAir ? `~${a.estimatedAir.toLocaleString("en-IN")}` : "-",
              when: a.submittedAt?.toDate?.()?.toLocaleDateString() || "-",
            }))}
            columns={[
              { key: "when", label: "Date" },
              { key: "type", label: "Type" },
              { key: "score", label: "Score" },
              { key: "normalized", label: "Out of 100", sortable: true },
              { key: "accuracy", label: "Accuracy" },
              { key: "attempted", label: "Attempted" },
              { key: "penalty", label: "Negative" },
              { key: "air", label: "Est. AIR" },
            ]} />
          <GateEstimateNote>
            &quot;Out of 100&quot; normalises every test to a common scale so a 30-mark subject test is comparable with a
            100-mark mock. Estimated AIR was computed at submission time from that normalised figure.
          </GateEstimateNote>
        </CampusCard>
      )}

      {/* ---- subject / topic accuracy ---- */}
      <div className="grid lg:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>ACCURACY BY SUBJECT</p>
          <GateBarList rows={subjectAccuracy} onRowClick={(row) => go("subjects", { subjectId: row.key })}
            emptyLabel="Attempt some questions to see this." />
        </CampusCard>
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>
            COMPLETION BY SUBJECT
          </p>
          <GateBarList
            rows={completion.subjects.map(s => ({
              key: s.subjectId, label: s.name, pct: s.pct, sub: `${s.done}/${s.total}`,
            }))}
            onRowClick={(row) => go("subjects", { subjectId: row.key })} />
        </CampusCard>
      </div>

      {topicAccuracy.length > 0 && (
        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Target size={13} style={{ color: CAMPUS.bad }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
              WEAKEST TOPICS (3+ ATTEMPTS, LOWEST ACCURACY FIRST)
            </p>
          </div>
          <GateBarList rows={topicAccuracy.slice(0, 12)} color={CAMPUS.bad}
            onRowClick={(row) => {
              const meta = topicNames.get(row.key);
              if (meta) go("subjects", { subjectId: meta.subjectId, topicId: row.key });
            }} />
        </CampusCard>
      )}

      {/* ---- revision health ---- */}
      <CampusCard className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Repeat size={13} style={{ color: CAMPUS.purple }} />
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>REVISION HEALTH</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GateStat label="Due now" value={revisionPlan.due.length} color={CAMPUS.purple} />
          <GateStat label="Never revised" value={buckets.neverRevised.length} color={CAMPUS.warn} />
          <GateStat label="Not seen in a month" value={buckets.forgotten.length} color={CAMPUS.bad} />
          <GateStat label="On schedule" value={revisionPlan.upcoming.length} color={CAMPUS.good} />
        </div>
        {revisionPlan.due.length > 0 && (
          <CampusButton size="sm" variant="secondary" className="mt-3" onClick={() => go("revision")}>
            Open the revision plan
          </CampusButton>
        )}
      </CampusCard>

      {/* ---- activity ---- */}
      <CampusCard className="p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity size={13} style={{ color: CAMPUS.teal }} />
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
            WEEKLY ACTIVITY, LAST 90 DAYS
          </p>
        </div>
        <WeeklyBars heatmap={heatmap} />
      </CampusCard>
    </div>
  );
}

// Days-active per week, as bars. A week with four active days is genuinely
// better preparation than a week with one twelve-hour session, and this is the
// chart that makes that visible.
function WeeklyBars({ heatmap }) {
  const weeks = heatmap.weeks.map((week, i) => ({
    key: `w${i}`,
    label: (week.find(Boolean)?.date || "").slice(5) || `Week ${i + 1}`,
    pct: week.filter(c => c && c.level > 0).length,
    sub: `${week.filter(c => c?.completed).length} full`,
  }));
  if (weeks.length === 0) return <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No activity recorded yet.</p>;
  return <GateBarList rows={weeks.slice(-12)} suffix=" days" color={CAMPUS.teal} />;
}
