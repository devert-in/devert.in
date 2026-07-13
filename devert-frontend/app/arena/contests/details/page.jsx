"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Coins, ListChecks, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchContest, fetchMyRegistration, registerForContest, contestPhase } from "@/lib/contests";

const DIFF_COLOR = { Easy: "#00FF41", Medium: "#FF9500", Hard: "#FF5050" };

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

function formatDate(v) {
  const d = toDate(v);
  if (!d) return "TBA";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, "0");
  return days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[9px] text-white/25 tracking-widest mb-0.5">{label}</p>
      <p className="font-mono text-xs text-white/65">{value}</p>
    </div>
  );
}

function ContestDetailsContent() {
  const contestId = useSearchParams().get("id");
  const router = useRouter();
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }
    fetchContest(contestId).then(setContest).catch(console.error).finally(() => setLoading(false));
  }, [contestId]);

  useEffect(() => {
    if (!user || !contestId) { setRegistered(false); return; }
    fetchMyRegistration(contestId, user.uid).then(r => setRegistered(!!r)).catch(console.error);
  }, [user, contestId]);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleRegister = async () => {
    if (!user) { router.push(`/login?next=${encodeURIComponent(`/arena/contests/details?id=${contestId}`)}`); return; }
    setRegistering(true);
    try {
      await registerForContest(contestId, user.uid);
      setRegistered(true);
    } catch (e) { console.error(e); }
    finally { setRegistering(false); }
  };

  if (loading) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 animate-pulse text-center mt-20">loading...</p></main>;
  }
  if (!contest) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 text-center mt-20">contest not found</p></main>;
  }

  const phase = contestPhase(contest, now);
  const start = toDate(contest.contestStart);
  const end = toDate(contest.contestEnd);
  const countdownTarget = phase === "upcoming" || phase === "closed" ? start : phase === "live" ? end : null;
  const countdown = countdownTarget ? formatCountdown(countdownTarget.getTime() - now.getTime()) : null;

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <Link href="/arena" className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={12} /> back to arena
        </Link>

        {contest.bannerUrl && (
          <div className="w-full h-40 rounded-xl mb-6 bg-cover bg-center border border-white/8" style={{ backgroundImage: `url(${contest.bannerUrl})` }} />
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[10px] text-white/25 border border-white/8 px-2 py-0.5 rounded">{contest.category}</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded"
            style={{ color: DIFF_COLOR[contest.difficulty] || "#00FF41", background: `${DIFF_COLOR[contest.difficulty] || "#00FF41"}15` }}>
            {contest.difficulty}
          </span>
        </div>
        <h1 className="font-sans font-bold text-3xl text-white mb-3 leading-tight">{contest.title}</h1>
        {contest.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {contest.tags.map(t => <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>)}
          </div>
        )}

        {countdown && (
          <div className="terminal-window mb-6">
            <div className="p-5 text-center">
              <p className="font-mono text-[10px] text-white/25 tracking-wider mb-2">{phase === "live" ? "TIME REMAINING" : "STARTS IN"}</p>
              <p className="font-mono text-3xl font-bold" style={{ color: phase === "live" ? "#FF9500" : "#00FFFF" }}>{countdown}</p>
            </div>
          </div>
        )}

        <div className="terminal-window mb-6">
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">contest.overview</span>
          </div>
          <div className="p-5 space-y-4">
            {contest.description && <p className="font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{contest.description}</p>}
            {contest.rules && (
              <div>
                <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1">RULES</p>
                <p className="font-mono text-xs text-white/50 leading-relaxed whitespace-pre-wrap">{contest.rules}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/6">
              <Stat label="ELIGIBILITY" value={contest.eligibility || "Open to all"} />
              <Stat label="ORGANIZER" value={contest.organizer || "DeVert"} />
              <Stat label="DURATION" value={`${contest.durationMinutes} min`} />
              <Stat label="REGISTRATION ENDS" value={formatDate(contest.registrationEnd)} />
              <Stat label="CONTEST STARTS" value={formatDate(contest.contestStart)} />
              <Stat label="CONTEST ENDS" value={formatDate(contest.contestEnd)} />
              <Stat label="PARTICIPANTS" value={contest.participantCount || 0} />
              <Stat label="QUESTIONS" value={contest.questionCount || 0} />
            </div>
            <div className="flex items-center gap-4 font-mono text-xs pt-2 border-t border-white/6">
              {contest.prizeXp > 0 && <span className="flex items-center gap-1" style={{ color: "#00FF41" }}><Zap size={12} /> {contest.prizeXp} XP</span>}
              {contest.prizeCoins > 0 && <span className="flex items-center gap-1" style={{ color: "#FFD700" }}><Coins size={12} /> {contest.prizeCoins} coins</span>}
              {contest.prizeText && <span className="text-white/40">{contest.prizeText}</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {registered ? (
            phase === "live" ? (
              <Link href={`/arena/contests/attempt?id=${contestId}`}
                className="flex-1 text-center font-mono text-sm py-3 rounded-xl text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors">
                enter contest →
              </Link>
            ) : phase === "past" ? (
              <Link href={`/arena/contests/results?id=${contestId}`}
                className="flex-1 text-center font-mono text-sm py-3 rounded-xl text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
                view results
              </Link>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-2 font-mono text-sm py-3 rounded-xl text-neon-green border border-neon-green/30">
                <CheckCircle2 size={14} /> registered — come back at start time
              </span>
            )
          ) : phase === "past" ? (
            <Link href={`/arena/contests/results?id=${contestId}`}
              className="flex-1 text-center font-mono text-sm py-3 rounded-xl text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
              view results
            </Link>
          ) : phase === "closed" ? (
            <span className="flex-1 text-center font-mono text-sm py-3 rounded-xl text-white/30 border border-white/10">registration closed</span>
          ) : (
            <button onClick={handleRegister} disabled={registering}
              className="flex-1 font-mono text-sm py-3 rounded-xl text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
              {registering ? "registering..." : "register for contest"}
            </button>
          )}
          <Link href={`/arena/contests/results?id=${contestId}`}
            className="font-mono text-sm px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/70 transition-colors flex items-center gap-2">
            <ListChecks size={14} /> leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ContestDetailsPage() {
  return (
    <Suspense fallback={null}>
      <ContestDetailsContent />
    </Suspense>
  );
}
