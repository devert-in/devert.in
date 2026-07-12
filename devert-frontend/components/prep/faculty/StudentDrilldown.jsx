"use client";

// Row-click drill-down: one student's per-question responses for the
// selected exam, plus their overall prepProgress (streak + category
// accuracy) fetched fresh by uid — never derived from the exam alone.

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, Flame, Loader2 } from "lucide-react";
import { PrepModal, Tag, ProgressBar } from "@/components/prep/ui";
import { getProgress } from "@/lib/prep/db";
import { CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";
import { pctColor } from "./facultyUtils";

const OPTION_LETTERS = ["A", "B", "C", "D"];

function QuestionRow({ q, response }) {
  const attempted = q.type === "coding" ? response !== undefined && response !== null : q.chosen !== null;
  const Icon = !attempted ? MinusCircle : q.correct ? CheckCircle2 : XCircle;
  const color = !attempted ? "rgba(255,255,255,0.3)" : q.correct ? "#00FF41" : "#FF3B3B";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <Icon size={15} style={{ color }} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-mono text-xs text-white/50">Q{q.idx + 1}</span>
          <Tag color={DIFFICULTY_MAP[q.difficulty]?.color}>{(q.difficulty || "").toUpperCase()}</Tag>
          <span className="font-mono text-[10px] text-white/25">{q.marksAwarded}/{q.marks} marks</span>
        </div>
        {q.type === "mcq" ? (
          <div className="font-mono text-[11px] space-y-0.5">
            <p className="text-white/45">
              Their answer:{" "}
              <span style={{ color }}>{attempted ? OPTION_LETTERS[q.chosen] : "— blank —"}</span>
            </p>
            <p className="text-white/45">
              Correct answer:{" "}
              <span className="text-neon-green">{q.correctIndex != null ? OPTION_LETTERS[q.correctIndex] : "—"}</span>
            </p>
          </div>
        ) : (
          <div className="font-mono text-[11px] text-white/45">
            {attempted ? (
              <>
                Coding — public tests {response?.publicPassed ?? 0}/{response?.publicTotal ?? 0} passed
                {response?.lang && <span className="text-white/25"> · {response.lang}</span>}
              </>
            ) : (
              "Not attempted"
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentDrilldown({ open, onClose, student, record }) {
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");

  useEffect(() => {
    if (!open || !student?.uid) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open
    setLoadingProgress(true);
    setProgressError("");
    setProgress(null);
    getProgress(student.uid)
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch((err) => {
        if (!cancelled) setProgressError(err?.message || "Failed to load progress");
      })
      .finally(() => {
        if (!cancelled) setLoadingProgress(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, student?.uid]);

  if (!student) return null;

  const responses = (record?.sub?.responses) || {};
  const categoryStats = progress?.categoryStats || {};

  return (
    <PrepModal
      open={open}
      onClose={onClose}
      filename={`${student.rollNumber || student.uid}.log`}
      title={
        <span>
          {student.displayName || "Unnamed student"}{" "}
          <span className="text-neon-cyan font-mono text-sm">{student.rollNumber || "NO_ROLL"}</span>
        </span>
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 font-mono text-[11px] text-white/40">
          <span>BRANCH: <span className="text-white/70">{student.branch || "—"}</span></span>
          <span>GROUP: <span className="text-white/70">{student.classGroup || "—"}</span></span>
          <span>STATUS: <span className="text-white/70">{student.status || "absent"}</span></span>
        </div>

        {/* Overall progress */}
        <div className="border border-white/8 rounded-lg p-4">
          <p className="font-mono text-[10px] text-white/30 tracking-wider mb-3">OVERALL_PROGRESS</p>
          {loadingProgress ? (
            <div className="flex items-center gap-2 font-mono text-xs text-white/35">
              <Loader2 size={13} className="animate-spin" /> loading…
            </div>
          ) : progressError ? (
            <p className="font-mono text-xs text-[#FF3B3B]">{progressError}</p>
          ) : !progress ? (
            <p className="font-mono text-xs text-white/30">No practice activity recorded yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame size={16} style={{ color: "#FF6430" }} />
                  <span className="font-sans text-lg font-bold text-white">{progress.streak || 0}</span>
                  <span className="font-mono text-[10px] text-white/30">day streak</span>
                </div>
                <div className="font-mono text-[11px] text-white/35">
                  {progress.totalSolved || 0} solved total · {progress.xp || 0} XP
                </div>
              </div>
              <div className="space-y-2">
                {Object.keys(categoryStats).length === 0 ? (
                  <p className="font-mono text-[11px] text-white/25">No category data yet.</p>
                ) : (
                  Object.entries(categoryStats).map(([cat, stat]) => {
                    const attempted = stat?.attempted || 0;
                    const correct = stat?.correct || 0;
                    const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                    return (
                      <ProgressBar
                        key={cat}
                        value={pct}
                        color={pctColor(pct)}
                        label={`${CATEGORY_MAP[cat]?.label || cat} (${correct}/${attempted})`}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Per-question responses */}
        <div>
          <p className="font-mono text-[10px] text-white/30 tracking-wider mb-1">EXAM_RESPONSES</p>
          {!record ? (
            <p className="font-mono text-xs text-white/30 py-4">
              This student has no submission for this exam.
            </p>
          ) : (
            <div>
              {record.score.perQuestion.map((q) => (
                <QuestionRow key={q.idx} q={q} response={responses[q.idx]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PrepModal>
  );
}
