"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Medal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchContest, fetchContestQuestions, fetchContestAnswerKeys, fetchMySubmission,
  gradeSubmission, computeRewards, persistGrading, fetchLeaderboard, fetchMyRank, contestPhase,
} from "@/lib/contests";

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

function formatDate(v) {
  const d = toDate(v);
  return d ? d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBA";
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="font-mono text-lg font-bold" style={{ color: color || "#00FFFF" }}>{value}</p>
      <p className="font-mono text-[9px] text-white/25 tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function ContestResultsContent() {
  const contestId = useSearchParams().get("id");
  const { user, loading: authLoading, refreshProfile } = useAuth();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySubmission, setMySubmission] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!contestId) { setLoading(false); return; }

    (async () => {
      const c = await fetchContest(contestId);
      setContest(c);
      if (!c || contestPhase(c) !== "past") { setLoading(false); return; }

      const lb = await fetchLeaderboard(contestId).catch(() => []);
      setLeaderboard(lb);

      if (user) {
        let sub = await fetchMySubmission(contestId, user.uid).catch(() => null);
        if (sub && !sub.graded) {
          setGrading(true);
          try {
            const [questions, answerKeys] = await Promise.all([
              fetchContestQuestions(contestId), fetchContestAnswerKeys(contestId),
            ]);
            const result = gradeSubmission(questions, answerKeys, sub.answers);
            const rewards = computeRewards(c, result.accuracyRatio);
            await persistGrading(contestId, user.uid, result, rewards);
            sub = { ...sub, graded: true, ...result, ...rewards };
            refreshProfile?.();
            setLeaderboard(await fetchLeaderboard(contestId).catch(() => []));
          } catch (e) { console.error(e); }
          finally { setGrading(false); }
        }
        setMySubmission(sub);
        if (sub?.graded) {
          setMyRank(await fetchMyRank(contestId, sub.score).catch(() => null));
        }
      }
      setLoading(false);
    })();
  }, [contestId, user, authLoading]);

  if (loading) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 animate-pulse text-center mt-20">loading...</p></main>;
  }
  if (!contest) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 text-center mt-20">contest not found</p></main>;
  }

  const phase = contestPhase(contest);

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <Link href={`/arena/contests/details?id=${contestId}`} className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={12} /> back to contest
        </Link>

        <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// {contest.title}</p>
        <h1 className="font-sans font-bold text-2xl text-white mb-6">Leaderboard &amp; Results</h1>

        {phase !== "past" ? (
          <div className="terminal-window p-6 text-center">
            <p className="font-mono text-xs text-white/40">
              Results unlock once the contest ends — {formatDate(contest.contestEnd)}.
            </p>
          </div>
        ) : (
          <>
            {user && grading && (
              <p className="font-mono text-xs text-white/30 animate-pulse mb-4 text-center">grading your submission...</p>
            )}
            {user && mySubmission?.graded && (
              <div className="terminal-window mb-6">
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <Stat label="RANK" value={myRank ? `#${myRank}` : "-"} color="#FFD700" />
                  <Stat label="SCORE" value={`${mySubmission.score}/${mySubmission.maxScore}`} />
                  <Stat label="ACCURACY" value={`${mySubmission.accuracy}%`} color="#00FF41" />
                  <Stat label="XP / COINS" value={`+${mySubmission.xpEarned} / +${mySubmission.coinsEarned}`} color="#FFD700" />
                </div>
              </div>
            )}
            {user && !mySubmission && !grading && (
              <p className="font-mono text-xs text-white/25 text-center mb-6">You didn't submit an attempt for this contest.</p>
            )}
            {!user && (
              <p className="font-mono text-xs text-white/25 text-center mb-6">
                <Link href={`/login?next=${encodeURIComponent(`/arena/contests/results?id=${contestId}`)}`} className="text-neon-cyan hover:underline">login</Link> to see your personal result
              </p>
            )}

            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">contest.leaderboard</span>
              </div>
              {leaderboard.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-xs text-white/25">no graded submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/6">
                        {["#", "PARTICIPANT", "SCORE", "ACCURACY", "TIME"].map(h => (
                          <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(row => {
                        const isMe = user && row.uid === user.uid;
                        return (
                          <tr key={row.uid} className="border-b border-white/4" style={isMe ? { background: "rgba(0,255,65,0.04)" } : {}}>
                            <td className="font-mono text-xs px-4 py-3">
                              {row.rank <= 3
                                ? <span className="flex items-center gap-1 font-bold" style={{ color: row.rank === 1 ? "#FFD700" : row.rank === 2 ? "#C0C0C0" : "#CD7F32" }}><Medal size={12} /> {row.rank}</span>
                                : <span className="text-white/30">{row.rank}</span>}
                            </td>
                            <td className="font-mono text-xs px-4 py-3" style={{ color: isMe ? "#00FF41" : "white" }}>
                              {row.handle ? `@${row.handle}` : row.uid.slice(0, 10)}{isMe && <span className="text-[9px] text-neon-green/50 ml-1.5">you</span>}
                            </td>
                            <td className="font-mono text-xs text-neon-cyan px-4 py-3">{row.score}/{row.maxScore}</td>
                            <td className="font-mono text-xs text-white/50 px-4 py-3">{row.accuracy}%</td>
                            <td className="font-mono text-xs text-white/35 px-4 py-3">{row.timeTakenSeconds}s</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ContestResultsPage() {
  return (
    <Suspense fallback={null}>
      <ContestResultsContent />
    </Suspense>
  );
}
