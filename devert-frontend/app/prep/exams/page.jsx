"use client";

// /prep/exams — weekend test list. Published prepExams(kind='weekend-test'),
// status chips (upcoming/live/ended) + countdowns; cards outside the
// student's classGroup are disabled with a NOT_YOUR_COHORT badge.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Users, ListChecks, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireOnboarded } from "@/components/prep/guards";
import {
  PrepShell,
  TerminalCard,
  BracketButton,
  NeonBadge,
  Tag,
  EmptyState,
  LoadingRows,
  Countdown,
} from "@/components/prep/ui";
import { getExams } from "@/lib/prep/db";
import { CATEGORY_MAP } from "@/lib/prep/constants";
import { computeExamStatus, cohortAllowed, fmtDateTime } from "@/components/prep/exams/examStatus";

function ExamCard({ exam, classGroup, index }) {
  const status = computeExamStatus(exam);
  const allowed = cohortAllowed(exam, classGroup);
  const locked = !allowed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={!locked ? { y: -4 } : undefined}
    >
      <TerminalCard
        animate={false}
        filename={`${(exam.title || "test").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.test`}
        icon={FileText}
        headerRight={
          <NeonBadge color={status.color}>{status.label}</NeonBadge>
        }
        className="h-full"
      >
        <div className="relative">
          {locked && (
            <div
              className="absolute inset-0 z-10 -m-5 flex flex-col items-center justify-center gap-2 rounded-b-lg backdrop-blur-[2px]"
              style={{ background: "rgba(5,5,5,0.78)" }}
            >
              <Lock size={18} className="text-white/25" />
              <NeonBadge color="#FF3B3B">NOT_YOUR_COHORT</NeonBadge>
              <p className="font-mono text-[10px] text-white/30 text-center px-6 max-w-[220px]">
                This test targets: {(exam.classGroups || []).join(", ") || "specific groups"}
              </p>
            </div>
          )}

          <h3 className="font-sans text-base font-semibold text-white mb-1.5 leading-snug">
            {exam.title || "Untitled test"}
          </h3>
          {exam.description && (
            <p className="font-mono text-[11px] text-white/35 mb-3 leading-relaxed line-clamp-2">
              {exam.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(exam.categories || []).map((c) => (
              <Tag key={c} color={CATEGORY_MAP[c]?.color}>
                {(CATEGORY_MAP[c]?.label || c).toUpperCase()}
              </Tag>
            ))}
          </div>

          <div className="flex items-center gap-4 font-mono text-[10px] text-white/30 mb-4 flex-wrap">
            <span className="flex items-center gap-1">
              <ListChecks size={11} /> {exam.questionCount ?? "?"} Q · {exam.totalMarks ?? "?"} marks
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} /> {exam.durationMins ?? "?"} min
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-mono text-[10px] text-white/25">
              {status.status === "upcoming" && <span>starts {fmtDateTime(status.startsAt)}</span>}
              {status.status === "live" && <Countdown target={status.endsAt} prefix="closes in" />}
              {status.status === "ended" && <span>ended {fmtDateTime(status.endsAt)}</span>}
            </div>

            {!locked && status.status === "live" && (
              <BracketButton variant="green" href={`/prep/exams/take?id=${exam.id}`}>
                START_TEST
              </BracketButton>
            )}
            {!locked && status.status === "upcoming" && (
              <BracketButton variant="ghost" disabled>
                NOT_LIVE_YET
              </BracketButton>
            )}
            {!locked && status.status === "ended" && (
              <BracketButton variant="cyan" href={`/prep/exams/review?id=${exam.id}`}>
                VIEW_RESULTS
              </BracketButton>
            )}
            {locked && (
              <BracketButton variant="ghost" disabled>
                LOCKED
              </BracketButton>
            )}
          </div>
        </div>
      </TerminalCard>
    </motion.div>
  );
}

function ExamsList() {
  const { profile } = useAuth();
  const [exams, setExams] = useState(null); // null = loading
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getExams({ kind: "weekend-test", publishedOnly: true, max: 100 });
        if (!cancelled) setExams(rows || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load weekend tests");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = (exams || []).slice().sort((a, b) => {
    // live first, then upcoming, then ended — most relevant to a student first
    const rank = { live: 0, upcoming: 1, unknown: 2, ended: 3 };
    const sa = computeExamStatus(a).status;
    const sb = computeExamStatus(b).status;
    if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
    return (b.startsAt?.toMillis?.() || 0) - (a.startsAt?.toMillis?.() || 0);
  });

  return (
    <PrepShell
      kicker="// /prep/exams — weekend_test_runner.sh"
      title="WEEKEND"
      accent="TESTS"
      subtitle="Timed MCQ + coding tests. Your roll number is your test identity — everything is logged against it."
    >
      {exams === null && !error && <LoadingRows rows={4} />}
      {error && (
        <EmptyState
          icon={FileText}
          title="couldn't load tests"
          message={error}
        />
      )}
      {exams !== null && !error && sorted.length === 0 && (
        <EmptyState
          icon={FileText}
          title="no weekend tests scheduled"
          message="Your TPO/faculty hasn't published a weekend test yet. Check back later."
        />
      )}
      {exams !== null && !error && sorted.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} classGroup={profile?.classGroup} index={i} />
          ))}
        </div>
      )}
    </PrepShell>
  );
}

export default function ExamsPage() {
  return (
    <RequireOnboarded>
      <ExamsList />
    </RequireOnboarded>
  );
}
