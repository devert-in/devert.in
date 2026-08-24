"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, X, Anchor, AlertTriangle, Filter, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { DockModal } from "@/components/shipyard/shipyard-app";
import { dockProject } from "@/lib/shipyard";
import { TIMEBOX_OPTIONS, CATEGORY_META, daysRemaining } from "@/lib/build";

const CATEGORY_FILTERS = ["all", "web", "backend", "mobile", "ai"];
const BUILD_ORANGE = "#FF9500";

function ChallengeDetailModal({ challenge, loggedIn, onClose, onStart, starting }) {
  const [timeboxDays, setTimeboxDays] = useState(TIMEBOX_OPTIONS[1]);
  const CategoryIcon = CATEGORY_META[challenge.category]?.Icon;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="terminal-window w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          {CategoryIcon && <CategoryIcon size={10} className="ml-2 text-white/25" />}
          <span className="font-mono text-[10px] text-white/25 ml-1">challenge_brief.md</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-sans text-lg font-bold text-white leading-snug">{challenge.title}</h2>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ color: challenge.diffColor || BUILD_ORANGE, background: `${challenge.diffColor || BUILD_ORANGE}18` }}>
              {challenge.difficulty}
            </span>
          </div>

          <p className="font-mono text-xs text-white/40 leading-relaxed whitespace-pre-wrap">
            {challenge.description || challenge.brief}
          </p>

          {(challenge.stack || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {challenge.stack.map(t => (
                <span key={t} className="font-mono text-[9px] text-white/30 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          )}

          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TIMEBOX</p>
            <div className="flex gap-2">
              {TIMEBOX_OPTIONS.map(d => (
                <button key={d} onClick={() => setTimeboxDays(d)}
                  className="flex-1 font-mono text-xs py-2 rounded transition-colors"
                  style={{
                    color:      timeboxDays === d ? BUILD_ORANGE : "rgba(255,255,255,0.3)",
                    background: timeboxDays === d ? `${BUILD_ORANGE}18` : "rgba(255,255,255,0.03)",
                    border:     timeboxDays === d ? `1px solid ${BUILD_ORANGE}55` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{d} days</button>
              ))}
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => onStart(challenge, timeboxDays)} disabled={starting}
            className="w-full font-mono text-sm py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ color: BUILD_ORANGE, border: `1px solid ${BUILD_ORANGE}55` }}
          >
            <Hammer size={13} /> {starting ? "starting..." : loggedIn ? "[ START_BUILD ]" : "[ LOGIN_TO_BUILD ]"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActiveAttemptCard({ attempt, onDock, onAbandon }) {
  const remaining = daysRemaining(attempt.startedAt, attempt.timeboxDays);
  const pct = Math.max(0, Math.min(100, (remaining / attempt.timeboxDays) * 100));
  const color = pct > 50 ? "#00FF41" : pct > 20 ? BUILD_ORANGE : "#FF5050";
  const CategoryIcon = CATEGORY_META[attempt.challengeCategory]?.Icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="terminal-window mb-8">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        {CategoryIcon && <CategoryIcon size={10} className="ml-2 text-white/25" />}
        <span className="font-mono text-[10px] text-white/25 ml-1">active_build.log</span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto"
          style={{ color: attempt.challengeDiffColor || BUILD_ORANGE, background: `${attempt.challengeDiffColor || BUILD_ORANGE}18` }}>
          {attempt.challengeDifficulty}
        </span>
      </div>
      <div className="p-5">
        <p className="font-mono text-[10px] mb-1 tracking-wider" style={{ color: `${BUILD_ORANGE}99` }}>IN PROGRESS</p>
        <h3 className="font-sans text-lg font-bold text-white mb-4">{attempt.challengeTitle}</h3>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs" style={{ color }}>
              {remaining} day{remaining === 1 ? "" : "s"} left
            </span>
            <span className="font-mono text-[10px] text-white/25">{attempt.timeboxDays}-day sprint</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onDock}
            className="flex-1 font-mono text-xs py-2.5 flex items-center justify-center gap-2 transition-colors"
            style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)" }}
          >
            <Anchor size={12} /> [ DOCK & SUBMIT ]
          </motion.button>
          <button onClick={onAbandon}
            className="font-mono text-[11px] px-3 text-white/25 hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle size={11} /> abandon
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function BuildApp() {
  const { user, userData, refreshProfile } = useAuth();
  const [challenges,      setChallenges]      = useState([]);
  const [loadingCatalog,  setLoadingCatalog]  = useState(true);
  const [activeAttempt,   setActiveAttempt]   = useState(null);
  const [loadingAttempt,  setLoadingAttempt]  = useState(true);
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [starting,        setStarting]        = useState(false);
  const [showDockModal,   setShowDockModal]   = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [justDocked,      setJustDocked]      = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "build"))
      .then(snap => { if (snap.exists()) setChallenges(snap.data().challenges || []); })
      .catch(console.error)
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    if (!user) { setActiveAttempt(null); setLoadingAttempt(false); return; }
    setLoadingAttempt(true);
    getDocs(query(collection(db, "build_attempts"), where("uid", "==", user.uid)))
      .then(snap => {
        const mine = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setActiveAttempt(mine.find(a => a.status === "in_progress") || null);
      })
      .catch(console.error)
      .finally(() => setLoadingAttempt(false));
  }, [user]);

  const handleStart = async (challenge, timeboxDays) => {
    if (!user) { window.location.href = "/login?next=/build"; return; }
    setStarting(true);
    try {
      const ref = await addDoc(collection(db, "build_attempts"), {
        uid: user.uid,
        challengeId:         challenge.id,
        challengeTitle:      challenge.title,
        challengeDifficulty: challenge.difficulty,
        challengeDiffColor:  challenge.diffColor,
        challengeCategory:   challenge.category,
        challengeStack:      challenge.stack || [],
        timeboxDays,
        status: "in_progress",
        startedAt: serverTimestamp(),
      });
      setActiveAttempt({
        id: ref.id, uid: user.uid,
        challengeId: challenge.id, challengeTitle: challenge.title,
        challengeDifficulty: challenge.difficulty, challengeDiffColor: challenge.diffColor,
        challengeCategory: challenge.category, challengeStack: challenge.stack || [],
        timeboxDays, status: "in_progress", startedAt: new Date(),
      });
      setSelectedChallenge(null);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleAbandon = () => {
    if (!user || !activeAttempt) return;
    const id = activeAttempt.id;
    setActiveAttempt(null);
    updateDoc(doc(db, "build_attempts", id), { status: "abandoned", abandonedAt: serverTimestamp() })
      .catch(console.error);
  };

  const handleSubmit = async (dockData) => {
    if (!user || !activeAttempt) return;
    setSubmitting(true);
    try {
      const ref = await dockProject({
        user, userData,
        data: {
          ...dockData,
          source:              "build",
          buildAttemptId:      activeAttempt.id,
          buildChallengeId:    activeAttempt.challengeId,
          buildChallengeTitle: activeAttempt.challengeTitle,
        },
      });
      await updateDoc(doc(db, "build_attempts", activeAttempt.id), {
        status: "submitted", projectId: ref.id, submittedAt: serverTimestamp(),
      });
      refreshProfile();
      setShowDockModal(false);
      setActiveAttempt(null);
      setJustDocked(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const visible  = challenges.filter(c => !c.locked);
  const filtered = visible.filter(c => categoryFilter === "all" || c.category === categoryFilter);

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence>
        {selectedChallenge && (
          <ChallengeDetailModal
            challenge={selectedChallenge}
            loggedIn={!!user}
            onClose={() => setSelectedChallenge(null)}
            onStart={handleStart}
            starting={starting}
          />
        )}
        {showDockModal && (
          <DockModal
            onClose={() => setShowDockModal(false)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /build - challenges.db</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            START <span style={{ color: BUILD_ORANGE }}>BUILDING</span>.
          </h1>
          <p className="font-mono text-sm text-white/35">Pick a challenge. Pick a timebox. Ship something real.</p>
        </motion.div>

        <AnimatePresence>
          {justDocked && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="terminal-window mb-8 p-4 flex items-center gap-3"
            >
              <Anchor size={14} style={{ color: "#00FFFF" }} />
              <p className="font-mono text-xs text-white/60 flex-1">Docked to Shipyard - nice work.</p>
              <a href="/shipyard" className="font-mono text-xs text-neon-cyan hover:underline flex items-center gap-1">
                view it <ExternalLink size={11} />
              </a>
              <button onClick={() => setJustDocked(false)} className="text-white/25 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!loadingAttempt && activeAttempt && (
          <ActiveAttemptCard
            attempt={activeAttempt}
            onDock={() => setShowDockModal(true)}
            onAbandon={handleAbandon}
          />
        )}

        {(!activeAttempt || loadingAttempt) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex items-center gap-2 flex-wrap mb-8"
            >
              <Filter size={12} className="text-white/25" />
              {CATEGORY_FILTERS.map(f => {
                const meta = CATEGORY_META[f];
                return (
                  <button key={f} onClick={() => setCategoryFilter(f)}
                    className="font-mono text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                    style={{
                      color:      categoryFilter === f ? BUILD_ORANGE : "rgba(255,255,255,0.3)",
                      background: categoryFilter === f ? `${BUILD_ORANGE}18` : "rgba(255,255,255,0.03)",
                      border:     categoryFilter === f ? `1px solid ${BUILD_ORANGE}55` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {meta && <meta.Icon size={9} />} {f}
                  </button>
                );
              })}
            </motion.div>

            {loadingCatalog ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="terminal-window animate-pulse">
                    <div className="terminal-header" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="terminal-window max-w-md mx-auto">
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <span className="font-mono text-[10px] text-white/25 ml-2">challenges.db</span>
                </div>
                <div className="p-10 text-center">
                  <p className="font-mono text-xs text-white/25 mb-1">
                    {categoryFilter === "all" ? "no challenges yet" : `no ${categoryFilter} challenges yet`}
                  </p>
                  <p className="font-mono text-[10px] text-white/15">// more drop soon</p>
                </div>
              </div>
            ) : (
              <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((ch) => {
                  const CategoryIcon = CATEGORY_META[ch.category]?.Icon;
                  return (
                    <motion.button key={ch.id} layout
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4, borderColor: `${BUILD_ORANGE}40` }}
                      onClick={() => setSelectedChallenge(ch)}
                      className="terminal-window text-left transition-colors"
                    >
                      <div className="terminal-header">
                        <div className="terminal-dot bg-red-500/70" />
                        <div className="terminal-dot bg-yellow-500/70" />
                        <div className="terminal-dot bg-green-500/70" />
                        {CategoryIcon && <CategoryIcon size={10} className="ml-2 text-white/25" />}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-sans text-sm font-semibold text-white leading-snug">{ch.title}</h3>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: ch.diffColor || BUILD_ORANGE, background: `${ch.diffColor || BUILD_ORANGE}18` }}>
                            {ch.difficulty}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-white/32 leading-relaxed">{ch.brief}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
