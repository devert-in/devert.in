"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Timer, Users, Terminal, Lock, Trophy, Medal, X, Zap, AlertTriangle,
  Play, Send, RotateCcw, Copy, CheckCircle2, XCircle, Monitor, Unlink,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, getDocs,
  doc, getDoc, addDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ContestHub } from "@/components/contests/contest-hub";
import { useIsWindowed, useOverlayClass } from "@/components/window/is-windowed";
import {
  fetchProblem, fetchSampleTests, runCode, submitArenaCode,
  CODELAB_LANGUAGES, STARTER_CODE,
} from "@/lib/codelab";
import Dropdown from "@/components/dropdown";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const TIER_COLORS = { LEGEND: "#FFD700", ELITE: "#FF6B35", ARCHITECT: "#00FFFF", BUILDER: "#00FF41", RECRUIT: "#666" };

// Arena hosts two different kinds of competition - the heading/tagline should describe
// whichever one is active instead of always saying "Code Combat" (accurate only for
// Solo Challenges; Contests can be Aptitude/SQL/CS-fundamentals, not just code). CodeLab
// used to be a third tab here but now lives at its own top-level /codelab route.
const ARENA_TAB_META = {
  solo:     { breadcrumb: "code_combat.exe", tagline: "Head-to-head. Timed. Brutal. No mercy." },
  contests: { breadcrumb: "contests.db",     tagline: "Scheduled contests across Aptitude, Programming, and CS fundamentals." },
};

function getTierName(xp = 0) {
  if (xp >= 10000) return "LEGEND";
  if (xp >= 5000)  return "ELITE";
  if (xp >= 2000)  return "ARCHITECT";
  if (xp >= 500)   return "BUILDER";
  return "RECRUIT";
}

function parseMinutes(timeStr = "") {
  const m = timeStr.match(/(\d+)/);
  return m ? parseInt(m[1]) : 30;
}

function pad(n) { return String(n).padStart(2, "0"); }

function MatchTimer({ totalSeconds, onExpire }) {
  const [left, setLeft] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setLeft(s => {
        if (s <= 1) {
          clearInterval(iv);
          if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const pct  = (left / totalSeconds) * 100;
  const color = pct > 50 ? "#00FF41" : pct > 20 ? "#FF9500" : "#FF5050";
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <div className="text-center">
      <div className="font-mono text-4xl font-bold mb-2" style={{ color }}>
        {h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function MatchModal({ challenge, onSolve, onForfeit }) {
  const overlayClass = useOverlayClass("z-50 flex items-center justify-center px-4");
  const totalSeconds = parseMinutes(challenge.time) * 60;
  const [expired, setExpired] = useState(false);

  const [problem, setProblem] = useState(null);
  const [sampleTests, setSampleTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(STARTER_CODE.java);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (expired) onForfeit("timeout");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  useEffect(() => {
    Promise.all([fetchProblem(challenge.problemId), fetchSampleTests(challenge.problemId)])
      .then(([p, tests]) => { setProblem(p); setSampleTests(tests); })
      .catch(() => setError("Couldn't load the problem for this challenge."))
      .finally(() => setLoading(false));
  }, [challenge.problemId]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
    setRunResults(null);
  };

  const handleRun = async () => {
    setRunning(true); setError(""); setRunResults(null);
    try {
      const results = await Promise.all(sampleTests.map(async (t) => {
        const res = await runCode({ language, code, stdin: t.input });
        const pass = (res.stdout || "").trim() === (t.expectedOutput || "").trim();
        return { test: t, pass, stdout: res.stdout };
      }));
      setRunResults(results);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(""); setVerdict(null);
    try {
      const result = await submitArenaCode({ matchId: challenge.matchId, language, code });
      setVerdict(result);
      if (result.verdict === "Accepted") {
        onSolve(challenge, result);
      } else if (result.verdict === "Expired") {
        onForfeit("timeout");
      }
      // Anything else (Wrong Answer / Error / No Test Cases): stay open, let
      // them fix the code and submit again - the session is still in_progress.
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-5xl max-h-[92vh] overflow-y-auto"
      >
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* Challenge + timer */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <Swords size={10} className="ml-2 text-white/25" />
              <span className="font-mono text-[10px] text-white/25 ml-1">arena_match.exe</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto"
                style={{ color: challenge.diffColor || "#00FF41", background: `${challenge.diffColor || "#00FF41"}18` }}>
                {challenge.difficulty}
              </span>
              <button onClick={() => onForfeit("forfeit")}
                className="ml-2 text-white/20 hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            </div>

            <div className="p-6">
              <p className="font-mono text-[10px] text-neon-cyan/50 mb-1 tracking-wider">ARENA MATCH - SOLO MODE</p>
              <h2 className="font-sans text-xl font-bold text-white mb-3">{challenge.title}</h2>

              <div className="mb-6">
                <MatchTimer totalSeconds={totalSeconds} onExpire={() => setExpired(true)} />
              </div>

              <div className="terminal-window mb-5 p-4">
                <p className="font-mono text-[10px] text-white/35 leading-relaxed whitespace-pre-wrap">
                  {problem?.statement || challenge.description || "No description."}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(challenge.tags || []).map(t => (
                    <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-y-1 font-mono text-xs text-white/30">
                <span className="flex items-center gap-1"><Timer size={10} /> {challenge.time} challenge</span>
                <span style={{ color: "#00FF41" }}>+{challenge.xp} XP on win · bonus for speed</span>
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="terminal-window">
            <div className="terminal-header flex-wrap gap-2">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <Dropdown value={language} onChange={handleLanguageChange}
                options={CODELAB_LANGUAGES.map(l => ({ value: l.id, label: l.label }))}
                className="ml-2 w-28"
                buttonClassName="font-mono text-[10px] text-white/70 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]"
                />
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(code); }} title="Copy" className="text-white/25 hover:text-white/60 transition-colors"><Copy size={12} /></button>
                <button onClick={() => setCode(STARTER_CODE[language] || "")} title="Reset" className="text-white/25 hover:text-white/60 transition-colors"><RotateCcw size={12} /></button>
              </div>
            </div>

            <div className="hidden lg:block" style={{ height: 360 }}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="font-mono text-xs text-white/25 animate-pulse">loading problem...</p>
                </div>
              ) : (
                <MonacoEditor
                  height="360px"
                  language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
                  theme="vs-dark"
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
                />
              )}
            </div>
            <div className="lg:hidden p-8 text-center">
              <Monitor size={24} className="mx-auto mb-3 text-white/20" />
              <p className="font-mono text-xs text-white/35">Switch to a larger screen to enter the match.</p>
            </div>

            <div className="p-4 border-t border-white/6 space-y-3">
              <div className="hidden lg:flex gap-2">
                <button onClick={handleRun} disabled={running || loading || sampleTests.length === 0}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Play size={12} /> {running ? "running..." : "run"}
                </button>
                <button onClick={handleSubmit} disabled={submitting || loading}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send size={12} /> {submitting ? "submitting..." : "submit"}
                </button>
              </div>

              {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

              {runResults && (
                <div className="space-y-1.5">
                  {runResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 border border-white/6 rounded-lg px-3 py-2">
                      {r.pass ? <CheckCircle2 size={12} style={{ color: "#00FF41" }} /> : <XCircle size={12} style={{ color: "#FF5050" }} />}
                      <span className="font-mono text-[10px] text-white/50">sample {i + 1}: {r.pass ? "passed" : `got "${(r.stdout || "").trim()}"`}</span>
                    </div>
                  ))}
                </div>
              )}

              {verdict && (
                <div className="border rounded-lg p-3" style={{ borderColor: verdict.verdict === "Accepted" ? "rgba(0,255,65,0.3)" : "rgba(255,80,80,0.3)" }}>
                  <p className="font-mono text-sm font-bold mb-1" style={{ color: verdict.verdict === "Accepted" ? "#00FF41" : "#FF5050" }}>{verdict.verdict}</p>
                  <p className="font-mono text-[10px] text-white/40">
                    {verdict.testsPassed}/{verdict.testsTotal} tests passed
                    {verdict.xpEarned > 0 && ` · +${verdict.xpEarned} XP`}
                  </p>
                </div>
              )}

              <button onClick={() => onForfeit("forfeit")}
                className="w-full font-mono text-[11px] py-2 text-white/25 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5">
                <AlertTriangle size={11} /> forfeit match
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChallengePicker({ challenges, onPick, onClose }) {
  const overlayClass = useOverlayClass("z-50 flex items-center justify-center px-4");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        className="terminal-window w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <Swords size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">select_challenge.sh</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors"><X size={13} /></button>
        </div>
        <div className="p-4">
          <p className="font-mono text-xs text-white/30 mb-4">Choose your challenge. Timer starts immediately.</p>
          <div className="space-y-2">
            {challenges.filter(ch => !ch.locked && ch.problemId).map((ch, i) => (
              <motion.button key={i}
                whileHover={{ borderColor: "rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.03)" }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onPick(ch)}
                className="w-full flex items-start justify-between gap-3 border border-white/8 rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-white/80 mb-1">{ch.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-white/30 flex items-center gap-1"><Timer size={9} /> {ch.time}</span>
                    {(ch.tags || []).slice(0, 2).map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/22 border border-white/8 px-1 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-[9px] block px-1.5 py-0.5 rounded mb-1"
                    style={{ color: ch.diffColor || "#00FF41", background: `${ch.diffColor || "#00FF41"}18` }}>
                    {ch.difficulty}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>+{ch.xp} XP</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultModal({ result, onClose }) {
  const overlayClass = useOverlayClass("z-50 flex items-center justify-center px-4");
  const won = result.status === "won";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.9)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="terminal-window w-full max-w-sm text-center"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-2">{won ? "match_result.win" : "match_result.loss"}</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
            <X size={12} />
          </button>
        </div>
        <div className="p-8">
          {won
            ? <Trophy size={40} className="mx-auto mb-4" style={{ color: "#FFD700" }} />
            : <X size={40} className="mx-auto mb-4 text-white/20" />
          }
          <h2 className="font-sans text-2xl font-bold mb-2" style={{ color: won ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
            {won ? "MATCH WON" : result.status === "timeout" ? "TIME'S UP" : "FORFEITED"}
          </h2>
          {won && (
            <p className="font-mono text-lg mb-1" style={{ color: "#00FF41" }}>+{result.xp} XP</p>
          )}
          <p className="font-mono text-xs text-white/30 mb-6">
            {won ? `${result.challenge} completed.` : "Better luck next time. Practice makes perfect."}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="font-mono text-sm px-8 py-2.5 border transition-all"
            style={won ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.35)" } : { color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            [ CLOSE ]
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ArenaApp({ initialTab }) {
  const windowed = useIsWindowed();
  const { user, refreshProfile } = useAuth();
  const [arenaTab, setArenaTab] = useState(["solo", "contests"].includes(initialTab) ? initialTab : "solo");
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges,  setChallenges]  = useState([]);
  const [loadingLB,   setLoadingLB]   = useState(true);
  const [loadingCH,   setLoadingCH]   = useState(true);
  const [showPicker,  setShowPicker]  = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("arenaWins", "desc"), limit(10)))
      .then(snap => setLeaderboard(
        snap.docs.map((d, i) => {
          const data = d.data();
          const tierName = getTierName(data.xp);
          return { rank: i + 1, handle: data.handle || "dev", uid: d.id, wins: data.arenaWins || 0, tierName, tierColor: TIER_COLORS[tierName] };
        }).filter(r => r.wins > 0)
      ))
      .catch(console.error)
      .finally(() => setLoadingLB(false));

    getDoc(doc(db, "system", "arena"))
      .then(snap => { if (snap.exists()) setChallenges(snap.data().challenges || []); })
      .catch(console.error)
      .finally(() => setLoadingCH(false));
  }, []);

  // Creates the match session the moment a challenge is picked - its server-
  // stamped startedAt is the authority devert-backend checks against when
  // grading a submission (see GradingService.gradeArenaSubmission), not
  // anything the client reports at submit time.
  const handlePickChallenge = async (ch) => {
    if (!user) return;
    setShowPicker(false);
    try {
      const matchRef = await addDoc(collection(db, "arena_matches"), {
        uid: user.uid,
        problemId: ch.problemId,
        challengeTitle: ch.title,
        xpBase: ch.xp || 0,
        timeLimitSeconds: parseMinutes(ch.time) * 60,
        status: "in_progress",
        startedAt: serverTimestamp(),
      });
      setActiveMatch({ ...ch, matchId: matchRef.id });
    } catch (err) {
      console.error(err);
    }
  };

  // Called only after devert-backend has already verified the submission is
  // correct and credited XP/arenaWins server-side (see MatchModal's
  // handleSubmit) - this just reflects that result, it never writes XP itself.
  const handleMatchSolve = (ch, verdict) => {
    setActiveMatch(null);
    setMatchResult({ status: "won", xp: verdict.xpEarned, challenge: ch.title });
    refreshProfile();
    getDocs(query(collection(db, "users"), orderBy("arenaWins", "desc"), limit(10)))
      .then(snap => setLeaderboard(
        snap.docs.map((d, i) => {
          const data = d.data();
          const tierName = getTierName(data.xp);
          return { rank: i + 1, handle: data.handle || "dev", uid: d.id, wins: data.arenaWins || 0, tierName, tierColor: TIER_COLORS[tierName] };
        }).filter(r => r.wins > 0)
      )).catch(console.error);
  };

  // A harmless self-report (0 XP either way, per firestore.rules' arena_matches
  // update rule) - only flips an already-in_progress match to forfeit/timeout,
  // never touches xp/arenaWins.
  const handleForfeit = async (reason) => {
    if (!user || !activeMatch) return;
    const ch = activeMatch;
    setActiveMatch(null);
    setMatchResult({ status: reason, xp: 0, challenge: ch.title });
    updateDoc(doc(db, "arena_matches", ch.matchId), {
      status: reason, finishedAt: serverTimestamp(),
    }).catch(console.error);
  };

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence>
        {showPicker && challenges.length > 0 && (
          <ChallengePicker challenges={challenges} onPick={handlePickChallenge} onClose={() => setShowPicker(false)} />
        )}
        {activeMatch && (
          <MatchModal challenge={activeMatch} onSolve={handleMatchSolve} onForfeit={handleForfeit} />
        )}
        {matchResult && (
          <ResultModal result={matchResult} onClose={() => setMatchResult(null)} />
        )}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /arena - {ARENA_TAB_META[arenaTab].breadcrumb}</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            THE <span className="text-neon-cyan">ARENA</span>
          </h1>
          <p className="font-mono text-sm text-white/35">{ARENA_TAB_META[arenaTab].tagline}</p>

          <div className="flex gap-2 mt-6">
            {[{ key: "solo", label: "Solo Challenges" }, { key: "contests", label: "Contests" }].map(t => (
              <button key={t.key} onClick={() => setArenaTab(t.key)}
                className="font-mono text-xs px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: arenaTab === t.key ? "#00FFFF" : "rgba(255,255,255,0.35)",
                  background: arenaTab === t.key ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border: arenaTab === t.key ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {arenaTab === "contests" && <ContestHub />}

        {arenaTab === "solo" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Challenges */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <Terminal size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">challenges.json</span>
              </div>
              <div className="p-4">
                {loadingCH ? (
                  <p className="font-mono text-xs text-white/25 animate-pulse py-6 text-center">loading challenges...</p>
                ) : challenges.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-mono text-xs text-white/25 mb-1">challenges coming soon</p>
                    <p className="font-mono text-[10px] text-white/15">// arena mode drops soon. stay sharp.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challenges.map((ch, i) => (
                      <motion.div key={i}
                        whileHover={{ borderColor: "rgba(0,255,255,0.2)" }}
                        className="border border-white/6 rounded-lg p-4 transition-colors hover:bg-white/2"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-sans text-sm font-medium text-white leading-snug">{ch.title}</span>
                          {ch.locked
                            ? <Lock size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                            : !ch.problemId
                            ? <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1 text-white/25 border border-white/8">
                                <Unlink size={9} /> soon
                              </span>
                            : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ color: ch.diffColor || "#00FF41", background: `${ch.diffColor || "#00FF41"}18` }}>
                                {ch.difficulty}
                              </span>
                          }
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-[10px] text-white/28 flex items-center gap-1">
                            <Timer size={9} /> {ch.time}
                          </span>
                          {(ch.tags || []).map(t => (
                            <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                          {!ch.locked && (
                            <span className="font-mono text-[10px] ml-auto" style={{ color: "#00FF41" }}>+{ch.xp} XP</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01, background: "rgba(0,255,255,0.06)" }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (!user) { window.location.href = "/login?next=/arena"; return; }
                    if (challenges.filter(c => !c.locked && c.problemId).length === 0) return;
                    setShowPicker(true);
                  }}
                  className="w-full font-mono text-sm text-neon-cyan border border-neon-cyan/30 py-3 transition-colors mt-4 flex items-center justify-center gap-2"
                >
                  <Swords size={14} />
                  {user ? "[ ENTER_MATCH ]" : "[ LOGIN_TO_COMPETE ]"}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <Trophy size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">arena.leaderboard</span>
              </div>
              {loadingLB ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-xs text-white/25 mb-1">no matches played yet</p>
                  <p className="font-mono text-[10px] text-white/15">// first match claims rank #1</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/6">
                        {["#", "HANDLE", "WINS", "TIER"].map(h => (
                          <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((p, i) => {
                        const isMe = user && p.uid === user.uid;
                        return (
                          <motion.tr key={p.uid}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 + i * 0.04 }}
                            className="border-b border-white/4 hover:bg-white/2 transition-colors"
                            style={isMe ? { background: "rgba(0,255,65,0.04)" } : {}}
                          >
                            <td className="font-mono text-xs px-4 py-3">
                              {p.rank <= 3
                                ? <span className="flex items-center gap-1 font-bold"
                                    style={{ color: p.rank === 1 ? "#FFD700" : p.rank === 2 ? "#C0C0C0" : "#CD7F32" }}>
                                    <Medal size={12} /> {p.rank}
                                  </span>
                                : <span className="text-white/30">{p.rank}</span>}
                            </td>
                            <td className="font-mono text-xs px-4 py-3" style={{ color: isMe ? "#00FF41" : "white" }}>
                              @{p.handle}{isMe && <span className="text-[9px] text-neon-green/50 ml-1.5">you</span>}
                            </td>
                            <td className="font-mono text-xs text-neon-cyan px-4 py-3">{p.wins}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                style={{ color: p.tierColor, background: `${p.tierColor}15` }}>
                                {p.tierName}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        )}
      </div>
    </main>
  );
}
