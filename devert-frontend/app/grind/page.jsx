"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Code, Cpu, Zap, Lock, Flame, Clock, CheckCircle, X, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, where,
  increment, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { TodayTaskCard } from "@/components/today-task-card";
import { AptitudeSection } from "@/components/aptitude-section";

const TYPE_ICONS = { DSA: Code, SYSTEM_DESIGN: Cpu, BUILD: Zap };

function todayIST() {
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return nowIST.toISOString().slice(0, 10);
}

function yesterdayIST() {
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  nowIST.setUTCDate(nowIST.getUTCDate() - 1);
  return nowIST.toISOString().slice(0, 10);
}

function Countdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const update = () => {
      const IST = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(Date.now() + IST);
      const midnight = new Date(nowIST);
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - IST - Date.now()) / 1000));
      setTime({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);
  const pad = n => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <Clock size={12} className="text-neon-cyan/60" />
      <span className="text-neon-cyan">{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
      <span className="text-white/30 text-[10px] ml-1">until reset IST</span>
    </div>
  );
}

function SolveModal({ challenge, onClose, onSolve, solving }) {
  const [solutionUrl, setSolutionUrl] = useState("");
  const Icon = TYPE_ICONS[challenge.type] || Code;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="terminal-window w-full max-w-md"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          <Terminal size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">solve.sh</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors"><X size={13} /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon size={13} style={{ color: challenge.typeColor || "#00FFFF" }} />
            <span className="font-mono text-[10px] tracking-wider" style={{ color: challenge.typeColor || "#00FFFF" }}>{challenge.type}</span>
            <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{ color: challenge.diffColor || "#00FF41", background: challenge.diffBg || "rgba(0,255,65,0.06)" }}>
              {challenge.difficulty}
            </span>
          </div>
          <h3 className="font-sans text-base font-semibold text-white mb-2">{challenge.title}</h3>
          <p className="font-mono text-[11px] text-white/40 mb-4 leading-relaxed">{challenge.description}</p>
          <div className="mb-4">
            <p className="font-mono text-[10px] text-white/30 mb-1.5 tracking-wider flex items-center gap-1">
              <ExternalLink size={9} /> SOLUTION URL <span className="text-white/15">(optional)</span>
            </p>
            <input
              value={solutionUrl} onChange={e => setSolutionUrl(e.target.value)}
              placeholder="https://github.com/you/solution"
              className="w-full font-mono text-xs text-white/75 px-3 py-2 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,65,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <div className="flex items-center justify-between mb-4 font-mono text-xs text-white/30">
            <span className="flex items-center gap-1"><Clock size={10} /> {challenge.time}</span>
            <span style={{ color: "#00FF41" }}>+{challenge.xp} XP on solve</span>
          </div>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => onSolve(challenge, solutionUrl)} disabled={solving}
              className="flex-1 font-mono text-sm py-2.5 border transition-all disabled:opacity-50"
              style={{ color: "#00FF41", borderColor: "rgba(0,255,65,0.35)" }}>
              {solving ? "saving..." : "[ MARK_SOLVED ]"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={onClose} disabled={solving}
              className="flex-1 font-mono text-sm py-2.5 border border-white/10 text-white/30 hover:bg-white/5 transition-all disabled:opacity-50">
              [ SKIP ]
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ msg, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-mono text-sm px-5 py-3 rounded border pointer-events-none"
      style={{ color, background: `${color}12`, borderColor: `${color}40` }}>
      {msg}
    </motion.div>
  );
}

export default function GrindPage() {
  const { user, userData, refreshProfile } = useAuth();
  const [challenges,  setChallenges]  = useState([]);
  const [history,     setHistory]     = useState([]);
  const [solvedToday, setSolvedToday] = useState(new Set());
  const [loadingCH,   setLoadingCH]   = useState(true);
  const [loadingHist, setLoadingHist] = useState(false);
  const [solveTarget, setSolveTarget] = useState(null);
  const [solving,     setSolving]     = useState(false);
  const [toast,       setToast]       = useState(null);

  const streak = userData?.streak ?? 0;

  useEffect(() => {
    getDoc(doc(db, "dailyGrind", todayIST()))
      .then(snap => { if (snap.exists()) setChallenges(snap.data().challenges || []); })
      .catch(console.error)
      .finally(() => setLoadingCH(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingHist(true);
    const today = todayIST();
    Promise.all([
      getDocs(query(collection(db, "grind_log", user.uid, "entries"), orderBy("date", "desc"), limit(7))),
      getDocs(query(collection(db, "grind_log", user.uid, "entries"), where("date", "==", today))),
    ])
      .then(([histSnap, todaySnap]) => {
        setHistory(histSnap.docs.map(d => d.data()));
        setSolvedToday(new Set(todaySnap.docs.map(d => d.data().type)));
      })
      .catch(console.error)
      .finally(() => setLoadingHist(false));
  }, [user]);

  const showToast = (msg, color = "#00FF41") => setToast({ msg, color });

  const handleSolve = async (ch, solutionUrl) => {
    if (!user || !userData) return;
    setSolving(true);
    try {
      const today     = todayIST();
      const yesterday = yesterdayIST();
      const lastSolved = userData.lastSolvedDate || "";

      let newStreak = userData.streak || 0;
      if (lastSolved === today) {
        // already counted today - preserve streak as-is
      } else if (lastSolved === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      await setDoc(doc(db, "grind_log", user.uid, "entries", `${today}_${ch.type}`), {
        date:        today,
        challenge:   ch.title,
        type:        ch.type,
        status:      "solved",
        xp:          ch.xp || 0,
        solutionUrl: solutionUrl || "",
        solvedAt:    serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        xp:             increment(ch.xp || 0),
        streak:         newStreak,
        lastSolvedDate: today,
      });

      setSolvedToday(prev => new Set([...prev, ch.type]));
      setHistory(prev => [
        { date: today, challenge: ch.title, type: ch.type, status: "solved", xp: ch.xp || 0 },
        ...prev.filter(h => !(h.date === today && h.type === ch.type)),
      ].slice(0, 7));
      refreshProfile();
      setSolveTarget(null);
      showToast(`+${ch.xp} XP! "${ch.title}" solved.`);
    } catch (err) {
      console.error(err);
      showToast("Error saving solve - try again.", "#FF5050");
    } finally {
      setSolving(false);
    }
  };

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence>
        {solveTarget && (
          <SolveModal challenge={solveTarget} onClose={() => setSolveTarget(null)}
            onSolve={handleSolve} solving={solving} />
        )}
        {toast && <Toast key={toast.msg} {...toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /grind - daily_challenges.sh</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            DAILY <span className="text-neon-cyan">GRIND</span>
          </h1>
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-mono text-sm text-white/35">3 challenges. Resets at midnight IST.</p>
            <Countdown />
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          className="terminal-window p-5 mb-10 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <Flame size={24} style={{ color: streak > 0 ? "#FF6430" : "rgba(255,255,255,0.2)" }} />
            <span className="font-sans text-3xl font-bold text-white">{streak}</span>
          </div>
          <div>
            <p className="font-mono text-xs text-white/30 mb-0.5 tracking-wider">CURRENT_STREAK</p>
            <p className="font-mono text-sm text-white/55">
              {streak > 0 ? "Keep going. Don't break the chain." : "Start today. Build the habit."}
            </p>
          </div>
          {streak > 0 && (
            <div className="ml-auto flex gap-1">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-sm"
                  style={{ background: "#FF6430", boxShadow: "0 0 6px rgba(255,100,48,0.4)" }} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Today's learning task */}
        <TodayTaskCard />

        {/* Challenges */}
        {loadingCH ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            {[1,2,3].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="terminal-window max-w-lg mb-10">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">daily_challenges.sh</span>
            </div>
            <div className="p-8 text-center">
              <p className="font-mono text-xs text-white/25 mb-2">today&apos;s challenges haven&apos;t dropped yet</p>
              <p className="font-mono text-[10px] text-white/15">// check back soon · resets at midnight IST</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
            {challenges.map((ch, i) => {
              const Icon     = TYPE_ICONS[ch.type] || Code;
              const isLocked = !user;
              const isSolved = solvedToday.has(ch.type);
              return (
                <motion.div key={ch.type || i}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                  whileHover={!isLocked ? { y: -4, borderColor: isSolved ? "rgba(0,255,65,0.3)" : "rgba(0,255,255,0.22)" } : {}}
                  className="terminal-window transition-colors"
                  style={isSolved ? { borderColor: "rgba(0,255,65,0.2)" } : {}}
                >
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                    <Terminal size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">{(ch.type || "challenge").toLowerCase()}.sh</span>
                    {isSolved    && <CheckCircle size={12} className="ml-auto" style={{ color: "#00FF41" }} />}
                    {isLocked && !isSolved && <Lock size={10} className="ml-auto text-white/20" />}
                  </div>
                  <div className="p-5 relative">
                    {isLocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-lg backdrop-blur-[2px]"
                        style={{ background: "rgba(5,5,5,0.72)" }}>
                        <Lock size={20} className="text-white/22" />
                        <p className="font-mono text-xs text-white/32 text-center px-4">Login to unlock this challenge</p>
                        <a href="/login" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/8 transition-colors">[ LOGIN ]</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={13} style={{ color: ch.typeColor || "#00FFFF" }} />
                      <span className="font-mono text-[10px] tracking-wider" style={{ color: ch.typeColor || "#00FFFF" }}>{ch.type}</span>
                      <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{ color: ch.diffColor || "#00FF41", background: ch.diffBg || "rgba(0,255,65,0.06)" }}>
                        {ch.difficulty}
                      </span>
                    </div>
                    <h3 className="font-sans text-sm font-semibold text-white mb-2 leading-snug">{ch.title}</h3>
                    <p className="font-mono text-[10px] text-white/32 mb-4 leading-relaxed">{ch.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(ch.tags || []).map(t => (
                        <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/28 flex items-center gap-1"><Clock size={9} /> {ch.time}</span>
                      <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>+{ch.xp} XP</span>
                    </div>
                    {!isLocked && (
                      isSolved ? (
                        <div className="w-full font-mono text-sm py-2.5 mt-4 flex items-center justify-center gap-2 border rounded"
                          style={{ color: "#00FF41", borderColor: "rgba(0,255,65,0.25)", background: "rgba(0,255,65,0.04)" }}>
                          <CheckCircle size={13} /> SOLVED
                        </div>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.01, background: "rgba(0,255,255,0.08)" }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSolveTarget(ch)}
                          className="w-full font-mono text-sm text-neon-cyan border border-neon-cyan/30 py-2.5 mt-4 transition-all">
                          $ ./solve.sh
                        </motion.button>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Aptitude & Reasoning */}
        <AptitudeSection />

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// grind.history</p>
          <div className="terminal-window overflow-hidden">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">grind.history</span>
            </div>
            <div className="p-4">
              {!user ? (
                <p className="font-mono text-xs text-white/20 text-center py-4">// login to see your grind history</p>
              ) : loadingHist ? (
                <p className="font-mono text-xs text-white/20 text-center py-4 animate-pulse">loading...</p>
              ) : history.length === 0 ? (
                <p className="font-mono text-xs text-white/20 text-center py-4">// no history yet - start grinding today</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 font-mono text-xs py-2 border-b border-white/4 last:border-0">
                      <CheckCircle size={12} style={{ color: h.status === "solved" ? "#00FF41" : "rgba(255,255,255,0.2)" }} />
                      <span className="text-white/28 flex-shrink-0">{h.date}</span>
                      <span className="text-white/55 flex-1 truncate">{h.challenge}</span>
                      <span style={{ color: h.status === "solved" ? "#00FF41" : "rgba(255,255,255,0.2)" }}>
                        {h.status === "solved" ? `+${h.xp || 0} XP` : "skipped"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
