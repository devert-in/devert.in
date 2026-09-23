"use client";

// /prep/contests - list of published coding contests (design §2). Status
// chips (UPCOMING/LIVE/ENDED) derive purely from startsAt/endsAt vs the
// client clock; ENTER_CONTEST only routes through when a contest is live.
// Gated the same way weekend exams are (RequireOnboarded): a roll number is
// the student's test identity, so onboarding must be complete before
// browsing contests at all, not just before entering one.

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Swords } from "lucide-react";
import {
  PrepShell,
  TerminalCard,
  BracketButton,
  EmptyState,
  LoadingRows,
  Countdown,
  Tag,
} from "@/components/prep/ui";
import { RequireOnboarded } from "@/components/prep/guards";
import { getExams } from "@/lib/prep/db";
import ContestStatusChip, { contestStatus } from "@/components/prep/code/ContestStatusChip";

const STATUS_ORDER = { live: 0, upcoming: 1, ended: 2 };

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

function ContestsInner() {
  const [exams, setExams] = useState(null);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    getExams({ kind: "coding-contest", publishedOnly: true, max: 100 })
      .then((rows) => {
        if (alive) setExams(rows);
      })
      .catch((e) => {
        if (alive) setErr(e?.message || "Failed to load contests");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const rows = useMemo(() => {
    if (!exams) return [];
    return exams
      .map((ex) => {
        const startMs = toMs(ex.startsAt);
        const endMs = toMs(ex.endsAt);
        return { ...ex, startMs, endMs, status: contestStatus(startMs, endMs, now) };
      })
      .sort((a, b) => {
        if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        }
        return a.startMs - b.startMs;
      });
  }, [exams, now]);

  return (
    <PrepShell
      kicker="// /prep/contests - coding_contests.sh"
      title="CODING"
      accent="CONTESTS"
      subtitle="Timed, multi-question judge runs. Enter while LIVE - every RUN_TESTS result is auto-saved."
    >
      {exams === null && !err && <LoadingRows rows={4} />}

      {err && (
        <EmptyState
          icon={AlertTriangle}
          title="couldn't load contests"
          message={err}
          action={<BracketButton onClick={() => window.location.reload()}>RETRY</BracketButton>}
        />
      )}

      {exams !== null && !err && rows.length === 0 && (
        <EmptyState
          title="no contests scheduled"
          message="Check back later - staff schedule coding contests from the admin panel."
        />
      )}

      {rows.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {rows.map((ex, i) => (
            <TerminalCard key={ex.id} filename={`${ex.kind || "contest"}.exam`} icon={Swords} delay={i * 0.06} hover>
              <div className="flex items-center justify-between gap-3 mb-3">
                <ContestStatusChip status={ex.status} />
                <span className="font-mono text-[10px] text-white/25">
                  {ex.questionCount ?? "?"} Q · {ex.durationMins ?? "?"}m · {ex.totalMarks ?? "?"} marks
                </span>
              </div>

              <h3 className="font-sans text-lg font-bold text-white mb-2 leading-snug">{ex.title}</h3>
              {ex.description && (
                <p className="font-mono text-[11px] text-white/35 mb-4 leading-relaxed">{ex.description}</p>
              )}

              {Array.isArray(ex.categories) && ex.categories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {ex.categories.map((c) => (
                    <Tag key={c}>{c}</Tag>
                  ))}
                </div>
              )}

              <div className="mb-4">
                {ex.status === "upcoming" && <Countdown target={ex.startMs} prefix="starts in" />}
                {ex.status === "live" && (
                  <Countdown target={ex.endMs} prefix="ends in" warnUnderMs={5 * 60 * 1000} />
                )}
                {ex.status === "ended" && (
                  <p className="font-mono text-[11px] text-white/25">Window closed.</p>
                )}
              </div>

              {ex.status === "live" ? (
                <BracketButton href={`/prep/contests/run?id=${ex.id}`} variant="green">
                  ENTER_CONTEST
                </BracketButton>
              ) : (
                <BracketButton variant="ghost" disabled>
                  {ex.status === "upcoming" ? "NOT_STARTED_YET" : "CLOSED"}
                </BracketButton>
              )}
            </TerminalCard>
          ))}
        </div>
      )}
    </PrepShell>
  );
}

export default function ContestsPage() {
  return (
    <RequireOnboarded>
      <ContestsInner />
    </RequireOnboarded>
  );
}
