"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, ChevronRight, ArrowLeft, CheckCircle2, XCircle,
  ExternalLink, Lock, Zap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  APTITUDE_CATEGORIES, fetchAptitudeTopics, fetchTopicQuestions,
  groupTopicsByCategory, topicAccuracy,
} from "@/lib/aptitude";

const DAILY_XP_CAP = 60;
const XP_PER_CORRECT = 3;

function todayIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const DIFF_COLOR = { easy: "#00FF41", medium: "#FF9500", hard: "#FF5050" };

export function AptitudeSection() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);

  const [activeTopic, setActiveTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [xpToast, setXpToast] = useState(null);

  useEffect(() => {
    fetchAptitudeTopics().then(setTopics).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setProgress(null); return; }
    getDoc(doc(db, "user_aptitude_progress", user.uid))
      .then(snap => setProgress(snap.exists() ? snap.data() : { attempted: {}, topicStats: {}, dailyXp: {} }))
      .catch(console.error);
  }, [user]);

  const openTopic = async (topic) => {
    setActiveTopic(topic);
    setQIndex(0); setSelected(null); setAnswered(false);
    const qs = await fetchTopicQuestions(topic.id).catch(() => []);
    setQuestions(qs);
  };

  const closeTopic = () => { setActiveTopic(null); setQuestions([]); };

  const currentQ = questions[qIndex];

  const handleSubmit = async () => {
    if (selected === null || !currentQ) return;
    setAnswered(true);
    const correct = selected === currentQ.correctIndex;
    if (!user) return;

    const already = progress?.attempted?.[currentQ.id];
    const today = todayIST();
    const todaysXp = progress?.dailyXp?.[today] || 0;
    const awardXp = correct && !already && todaysXp < DAILY_XP_CAP ? XP_PER_CORRECT : 0;

    try {
      await setDoc(doc(db, "user_aptitude_progress", user.uid), {
        attempted: { [currentQ.id]: { selectedIndex: selected, correct, attemptedAt: serverTimestamp() } },
        topicStats: {
          [activeTopic.id]: {
            attempted: increment(already ? 0 : 1),
            correct: increment(already ? 0 : (correct ? 1 : 0)),
          },
        },
        ...(awardXp > 0 ? { dailyXp: { [today]: increment(awardXp) } } : {}),
      }, { merge: true });

      if (awardXp > 0) {
        // Aptitude practice is now Grind's main daily activity (the self-reported
        // DSA/SystemDesign/Build challenge that used to drive `streak` was removed as
        // redundant with Arena Solo Challenges/CodeLab) - so a first correct answer of
        // the day is what keeps the streak alive now, same day/yesterday/reset logic.
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const u = userSnap.exists() ? userSnap.data() : {};
        const lastPracticed = u.lastSolvedDate || "";
        const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
        let newStreak = u.streak || 0;
        if (lastPracticed !== today) {
          newStreak = lastPracticed === yesterday ? newStreak + 1 : 1;
        }
        await setDoc(doc(db, "users", user.uid), {
          xp: increment(awardXp), streak: newStreak, lastSolvedDate: today,
        }, { merge: true });
        setXpToast(awardXp);
        setTimeout(() => setXpToast(null), 2000);
      }

      setProgress(prev => {
        const next = {
          attempted: { ...(prev?.attempted || {}), [currentQ.id]: { selectedIndex: selected, correct } },
          topicStats: { ...(prev?.topicStats || {}) },
          dailyXp: { ...(prev?.dailyXp || {}) },
        };
        if (!already) {
          const s = next.topicStats[activeTopic.id] || { attempted: 0, correct: 0 };
          next.topicStats[activeTopic.id] = { attempted: s.attempted + 1, correct: s.correct + (correct ? 1 : 0) };
        }
        if (awardXp > 0) next.dailyXp[today] = (next.dailyXp[today] || 0) + awardXp;
        return next;
      });
    } catch (e) { console.error(e); }
  };

  const handleNext = () => {
    setSelected(null); setAnswered(false);
    setQIndex(i => Math.min(i + 1, questions.length - 1));
  };

  if (loading) return null;
  if (topics.length === 0) return null;

  const grouped = groupTopicsByCategory(topics);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mb-10">
      <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// aptitude_and_reasoning.bank</p>

      <AnimatePresence>
        {xpToast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 font-mono text-xs px-4 py-2 rounded-full flex items-center gap-1.5 pointer-events-none"
            style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)", color: "#00FF41" }}>
            <Zap size={12} /> +{xpToast} XP
          </motion.div>
        )}
      </AnimatePresence>

      <div className="terminal-window overflow-hidden">
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <ListChecks size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">
            {activeTopic ? activeTopic.name.toLowerCase().replace(/\s+/g, "_") + ".practice" : "aptitude.topics"}
          </span>
          {activeTopic && (
            <button onClick={closeTopic} className="ml-auto flex items-center gap-1 font-mono text-[10px] text-white/25 hover:text-white/55 transition-colors">
              <ArrowLeft size={10} /> topics
            </button>
          )}
        </div>

        {!activeTopic ? (
          <div className="p-4 space-y-4">
            {APTITUDE_CATEGORIES.map(cat => (grouped[cat]?.length ? (
              <div key={cat}>
                <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">{cat.toUpperCase()}</p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {grouped[cat].map(topic => {
                    const acc = topicAccuracy(progress?.topicStats, topic.id);
                    return (
                      <button key={topic.id} onClick={() => openTopic(topic)}
                        className="flex items-center gap-2.5 border border-white/8 rounded-lg px-3 py-2.5 hover:border-neon-cyan/25 hover:bg-white/2 transition-colors text-left">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-white/70 truncate">{topic.name}</p>
                          {acc !== null && (
                            <p className="font-mono text-[9px] mt-0.5" style={{ color: acc >= 70 ? "#00FF41" : acc >= 40 ? "#FF9500" : "#FF5050" }}>
                              {acc}% accuracy
                            </p>
                          )}
                        </div>
                        <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null))}
          </div>
        ) : !user ? (
          <div className="p-8 text-center">
            <Lock size={20} className="mx-auto mb-3 text-white/20" />
            <p className="font-mono text-xs text-white/32 mb-4">Login to practice and track your progress</p>
            <a href="/login" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/8 transition-colors">[ LOGIN ]</a>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs text-white/20">no questions in this topic yet</p>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] text-white/25 tracking-wider">QUESTION {qIndex + 1} / {questions.length}</p>
              {currentQ.difficulty && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: DIFF_COLOR[currentQ.difficulty] || "#00FFFF", background: "rgba(255,255,255,0.04)" }}>
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            <p className="font-mono text-[13px] text-white/80 leading-relaxed mb-4 whitespace-pre-wrap">{currentQ.question}</p>

            <div className="space-y-1.5 mb-4">
              {currentQ.options.map((opt, oi) => {
                const isCorrect = answered && oi === currentQ.correctIndex;
                const isWrongPick = answered && oi === selected && oi !== currentQ.correctIndex;
                return (
                  <button key={oi} disabled={answered} onClick={() => setSelected(oi)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors disabled:cursor-default"
                    style={{
                      background: isCorrect ? "rgba(0,255,65,0.08)" : isWrongPick ? "rgba(255,80,80,0.08)" : selected === oi ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.03)",
                      border: isCorrect ? "1px solid rgba(0,255,65,0.35)" : isWrongPick ? "1px solid rgba(255,80,80,0.35)" : selected === oi ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                      style={{ borderColor: selected === oi ? "#00FFFF" : "rgba(255,255,255,0.2)", background: selected === oi && !answered ? "#00FFFF" : "transparent" }} />
                    <span className="font-mono text-[12px] text-white/75 flex-1">{opt}</span>
                    {isCorrect && <CheckCircle2 size={13} style={{ color: "#00FF41" }} />}
                    {isWrongPick && <XCircle size={13} style={{ color: "#FF5050" }} />}
                  </button>
                );
              })}
            </div>

            {!answered ? (
              <motion.button whileHover={selected !== null ? { scale: 1.01 } : {}} whileTap={selected !== null ? { scale: 0.98 } : {}}
                onClick={handleSubmit} disabled={selected === null}
                className="w-full font-mono text-sm py-2.5 rounded-xl transition-all disabled:opacity-40"
                style={{ background: "#00FFFF", color: "#050505" }}>
                submit
              </motion.button>
            ) : (
              <>
                {currentQ.explanation && (
                  <div className="border border-white/8 rounded-lg p-3 mb-3">
                    <p className="font-mono text-[9px] text-white/25 tracking-wider mb-1.5">EXPLANATION</p>
                    <p className="font-mono text-[11px] text-white/55 leading-relaxed whitespace-pre-wrap">{currentQ.explanation}</p>
                    {currentQ.videoUrl && (
                      <a href={currentQ.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 font-mono text-[10px] text-neon-purple hover:underline">
                        <ExternalLink size={9} /> watch video explanation
                      </a>
                    )}
                  </div>
                )}
                {qIndex < questions.length - 1 ? (
                  <button onClick={handleNext}
                    className="w-full font-mono text-sm py-2.5 rounded-xl text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
                    next question →
                  </button>
                ) : (
                  <button onClick={closeTopic}
                    className="w-full font-mono text-sm py-2.5 rounded-xl text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors">
                    topic complete — back to topics
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
