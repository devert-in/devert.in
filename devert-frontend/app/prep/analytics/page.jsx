"use client";

// /prep/analytics — student's own dashboard: streak/progress stats, category
// accuracy + attempts-over-time charts, exam history (submissions joined with
// exams, scores recomputed where the key is readable).

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Flame, Trophy, Target, TrendingUp, BarChart3, ListChecks, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireOnboarded } from "@/components/prep/guards";
import { PrepShell, TerminalCard, StatTile, NeonBadge, Tag, DataTable, EmptyState, LoadingRows } from "@/components/prep/ui";
import { CategoryBreakdown } from "@/components/prep/exams/CategoryBreakdown";
import { computeExamStatus, fmtDateTime } from "@/components/prep/exams/examStatus";
import { CATEGORIES } from "@/lib/prep/constants";
import { dateKey, getExams, getKey, getMyAttempts, getMySubmission, getPaper, getProgress } from "@/lib/prep/db";
import { scoreSubmission } from "@/lib/prep/grading";

const ChartLoading = () => (
  <div className="h-[260px] flex items-center justify-center">
    <Loader2 size={16} className="text-white/20 animate-spin" />
  </div>
);

const CategoryAccuracyChart = dynamic(
  () => import("@/components/prep/exams/ExamCharts").then((m) => m.CategoryAccuracyChart),
  { ssr: false, loading: ChartLoading }
);
const AttemptsOverTimeChart = dynamic(
  () => import("@/components/prep/exams/ExamCharts").then((m) => m.AttemptsOverTimeChart),
  { ssr: false, loading: ChartLoading }
);

function AnalyticsBody() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [progress, setProgress] = useState(undefined); // undefined = loading, null = none
  const [attempts, setAttempts] = useState(null);
  const [examRows, setExamRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const [prog, atts] = await Promise.all([getProgress(user.uid), getMyAttempts(user.uid, { max: 300 })]);
        if (cancelled) return;
        setProgress(prog || null);
        setAttempts(atts || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load your progress");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const exams = await getExams({ publishedOnly: true, max: 100 });
        const rows = await Promise.all(
          (exams || []).map(async (exam) => {
            const sub = await getMySubmission(exam.id, user.uid).catch(() => null);
            if (!sub) return null;
            const status = computeExamStatus(exam);
            let scoreLabel = sub.status === "submitted" ? "pending" : "in-progress";
            if (sub.status === "submitted" && status.status === "ended") {
              try {
                const [paper, key] = await Promise.all([getPaper(exam.id), getKey(exam.id)]);
                const score = scoreSubmission(sub.responses, key, paper);
                scoreLabel = `${score.total}/${score.max}`;
              } catch {
                scoreLabel = "pending";
              }
            }
            return {
              examId: exam.id,
              title: exam.title,
              kind: exam.kind,
              status: sub.status,
              scoreLabel,
              submittedAt: sub.submittedAt?.toMillis?.() ?? null,
            };
          })
        );
        if (!cancelled) setExamRows(rows.filter(Boolean));
      } catch (err) {
        if (!cancelled) setError((prev) => prev || err?.message || "Failed to load exam history");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const categoryData = useMemo(() => {
    const stats = progress?.categoryStats || {};
    return CATEGORIES.map((c) => {
      const s = stats[c.id] || { attempted: 0, correct: 0 };
      const accuracy = s.attempted > 0 ? (s.correct / s.attempted) * 100 : 0;
      return { category: c.id, label: c.label, accuracy, color: c.color, attempted: s.attempted, correct: s.correct };
    });
  }, [progress]);

  const categoryBreakdownItems = useMemo(
    () => categoryData.filter((c) => c.attempted > 0).map((c) => ({ category: c.category, attempted: c.attempted, correct: c.correct })),
    [categoryData]
  );

  const attemptsOverTime = useMemo(() => {
    const byDate = new Map();
    (attempts || []).forEach((a) => {
      const d = a.date || dateKey(a.createdAt?.toDate?.() || new Date());
      if (!byDate.has(d)) byDate.set(d, { attempts: 0, correct: 0 });
      const bucket = byDate.get(d);
      bucket.attempts++;
      if (a.correct) bucket.correct++;
    });
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = dateKey(new Date(Date.now() - i * 86400000));
      const bucket = byDate.get(d) || { attempts: 0, correct: 0 };
      days.push({ date: d.slice(5), attempts: bucket.attempts, correct: bucket.correct });
    }
    return days;
  }, [attempts]);

  const hasAnyActivity = (progress && progress.totalSolved > 0) || (attempts && attempts.length > 0);
  const loading = progress === undefined || attempts === null;

  return (
    <PrepShell
      kicker="// /prep/analytics — self_dashboard.sh"
      title="YOUR"
      accent="ANALYTICS"
      subtitle="Streak, accuracy by category, and exam history — all recomputed from immutable records."
      actions={profile?.rollNumber && <NeonBadge color="#FFD700">ROLL: {profile.rollNumber}</NeonBadge>}
    >
      {loading && !error && <LoadingRows rows={4} />}

      {error && !loading && (
        <EmptyState icon={BarChart3} title="couldn't load analytics" message={error} className="mb-8" />
      )}

      {!loading && !hasAnyActivity && (
        <EmptyState
          icon={Target}
          title="no practice activity yet"
          message="Solve a few practice questions or complete a lesson to start building your stats. Exam history (below) tracks separately."
          className="mb-8"
          action={
            <a href="/prep/practice" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/8 transition-colors">
              [ START_PRACTICING ]
            </a>
          }
        />
      )}

      {!loading && hasAnyActivity && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatTile label="streak" value={progress?.streak || 0} sub="days active" icon={Flame} color="#FF6430" delay={0} />
            <StatTile label="total solved" value={progress?.totalSolved || 0} icon={Target} color="#00FF41" delay={0.05} />
            <StatTile label="xp" value={progress?.xp || 0} icon={Trophy} color="#FFD700" delay={0.1} />
            <StatTile label="last active" value={progress?.lastActiveDate || "--"} icon={ListChecks} color="#00FFFF" delay={0.15} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-8">
            <TerminalCard filename="category_accuracy.chart" icon={BarChart3} delay={0.2}>
              {categoryBreakdownItems.length > 0 ? (
                <CategoryAccuracyChart data={categoryData} />
              ) : (
                <EmptyState icon={BarChart3} title="no category data yet" message="Practice a few questions in each category to populate this chart." />
              )}
            </TerminalCard>
            <TerminalCard filename="attempts_over_time.chart" icon={TrendingUp} delay={0.25}>
              <AttemptsOverTimeChart data={attemptsOverTime} />
            </TerminalCard>
          </div>

          {categoryBreakdownItems.length > 0 && (
            <TerminalCard filename="category_breakdown.log" className="mb-8" delay={0.3}>
              <CategoryBreakdown items={categoryBreakdownItems} />
            </TerminalCard>
          )}
        </>
      )}

      {/* Exam history is independent of practice activity — a student who
          only ever takes weekend tests (no lesson/practice attempts) still
          needs to see their submissions here. */}
      {!loading && (
        <TerminalCard filename="exam_history.log" icon={ListChecks} delay={0.35}>
          {examRows === null ? (
            <LoadingRows rows={3} />
          ) : (
            <DataTable
              rows={examRows}
              rowKey="examId"
              initialSort={{ key: "submittedAt", dir: "desc" }}
              onRowClick={(row) => {
                if (row.kind === "weekend-test") router.push(`/prep/exams/review?id=${row.examId}`);
              }}
              empty={<EmptyState icon={ListChecks} title="no exams attempted yet" message="Your weekend-test and contest submissions will show up here." />}
              columns={[
                { key: "title", label: "test", render: (r) => <span className="text-white/80">{r.title}</span> },
                {
                  key: "kind",
                  label: "kind",
                  render: (r) => <Tag color={r.kind === "coding-contest" ? "#00FF41" : "#00FFFF"}>{r.kind}</Tag>,
                },
                {
                  key: "status",
                  label: "status",
                  render: (r) => (
                    <span style={{ color: r.status === "submitted" ? "#00FF41" : "#FF9500" }}>{r.status}</span>
                  ),
                },
                { key: "scoreLabel", label: "score", render: (r) => <span className="text-white/70">{r.scoreLabel}</span> },
                {
                  key: "submittedAt",
                  label: "submitted",
                  render: (r) => <span className="text-white/35">{r.submittedAt ? fmtDateTime(r.submittedAt) : "—"}</span>,
                },
              ]}
            />
          )}
        </TerminalCard>
      )}
    </PrepShell>
  );
}

export default function AnalyticsPage() {
  return (
    <RequireOnboarded>
      <AnalyticsBody />
    </RequireOnboarded>
  );
}
