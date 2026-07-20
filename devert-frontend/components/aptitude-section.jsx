"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, ChevronRight, ArrowLeft, Lock, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  APTITUDE_CATEGORIES, fetchAptitudeTopics, fetchTopicQuestions,
  groupTopicsByCategory, topicAccuracy, normalizeAttemptEntry, appendAttempt,
  detectWeakTopics,
} from "@/lib/aptitude";
import { QuestionWorkspace } from "@/components/aptitude/question-workspace";

const DAILY_XP_CAP = 60;
const XP_PER_CORRECT = 3;

// Named wrapper so the (legitimate, event-driven) impure Date.now() reads
// below don't trip the "impure call during render" lint rule, which can't
// tell a ref set from an onClick handler apart from one read during render.
function nowMs() { return Date.now(); }

function todayIST() {
  return new Date(nowMs() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

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
  const [lastAttemptTimeSec, setLastAttemptTimeSec] = useState(null);
  const questionShownAt = useRef(null);

  useEffect(() => {
    fetchAptitudeTopics().then(setTopics).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setProgress(null); return; }
    getDoc(doc(db, "user_aptitude_progress", user.uid))
      .then(snap => setProgress(snap.exists() ? snap.data() : { attempted: {}, topicStats: {}, dailyXp: {}, bookmarks: [] }))
      .catch(console.error);
  }, [user]);

  const openTopic = async (topic) => {
    setActiveTopic(topic);
    setQIndex(0); setSelected(null); setAnswered(false); setLastAttemptTimeSec(null);
    questionShownAt.current = nowMs();
    const qs = await fetchTopicQuestions(topic.id).catch(() => []);
    setQuestions(qs);
  };

  const closeTopic = () => { setActiveTopic(null); setQuestions([]); };

  const currentQ = questions[qIndex];

  const handleSubmit = async () => {
    if (selected === null || !currentQ) return;
    setAnswered(true);
    const correct = selected === currentQ.correctIndex;
    const timeSec = Math.round((nowMs() - questionShownAt.current) / 1000);
    setLastAttemptTimeSec(timeSec);
    if (!user) return;

    const already = progress?.attempted?.[currentQ.id];
    const today = todayIST();
    const todaysXp = progress?.dailyXp?.[today] || 0;
    const awardXp = correct && !already && todaysXp < DAILY_XP_CAP ? XP_PER_CORRECT : 0;
    const nextEntry = appendAttempt(already, { selectedIndex: selected, correct, timeSec, attemptedAt: Timestamp.now() });

    try {
      await setDoc(doc(db, "user_aptitude_progress", user.uid), {
        attempted: { [currentQ.id]: nextEntry },
        topicStats: {
          [activeTopic.id]: {
            attempted: increment(already ? 0 : 1),
            correct: increment(already ? 0 : (correct ? 1 : 0)),
          },
        },
        ...(awardXp > 0 ? { dailyXp: { [today]: increment(awardXp) } } : {}),
      }, { merge: true });

      // Global stat counters (solved-by / accuracy / avg-time), bounded by
      // firestore.rules to exactly one attempt's worth per write - only on
      // this user's FIRST-ever attempt at the question, so the counters
      // approximate unique solvers rather than counting every retry.
      if (!already) {
        updateDoc(doc(db, "aptitude_topics", activeTopic.id, "questions", currentQ.id), {
          attemptCount: increment(1),
          correctCount: increment(correct ? 1 : 0),
          totalTimeSec: increment(timeSec),
        }).catch(() => {});
      }

      if (awardXp > 0) {
        // Aptitude practice is now Grind's main daily activity (the self-reported
        // DSA/SystemDesign/Build daily challenge that used to drive `streak` was removed
        // as redundant with Arena Solo Challenges/CodeLab) - so a first correct answer of
        // the day is what keeps the streak alive now, same day/yesterday/reset logic.
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const u = userSnap.exists() ? userSnap.data() : {};
        const lastPracticed = u.lastSolvedDate || "";
        const yesterday = new Date(nowMs() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
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
          attempted: { ...(prev?.attempted || {}), [currentQ.id]: nextEntry },
          topicStats: { ...(prev?.topicStats || {}) },
          dailyXp: { ...(prev?.dailyXp || {}) },
          bookmarks: prev?.bookmarks || [],
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

  const goToIndex = (i) => {
    setSelected(null); setAnswered(false); setLastAttemptTimeSec(null);
    questionShownAt.current = nowMs();
    setQIndex(i);
  };

  const handleNext = () => goToIndex(Math.min(qIndex + 1, questions.length - 1));
  const handleJumpToQuestion = (questionId) => {
    const i = questions.findIndex(q => q.id === questionId);
    if (i !== -1) goToIndex(i);
  };

  const handleToggleBookmark = async () => {
    if (!user || !currentQ) return;
    const isBookmarked = (progress?.bookmarks || []).includes(currentQ.id);
    setProgress(prev => ({
      ...prev,
      bookmarks: isBookmarked ? (prev.bookmarks || []).filter(id => id !== currentQ.id) : [...(prev?.bookmarks || []), currentQ.id],
    }));
    try {
      await setDoc(doc(db, "user_aptitude_progress", user.uid), {
        bookmarks: isBookmarked ? arrayRemove(currentQ.id) : arrayUnion(currentQ.id),
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  if (loading) return null;
  if (topics.length === 0) return null;

  const grouped = groupTopicsByCategory(topics);
  const weakTopics = user ? detectWeakTopics(topics, progress?.topicStats) : [];

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
            {weakTopics.length > 0 && (
              <p className="font-mono text-[10px] text-orange-400/80 leading-relaxed border border-orange-400/20 rounded-lg px-3 py-2" style={{ background: "rgba(255,149,0,0.05)" }}>
                You frequently struggle with: {weakTopics.map(t => t.topic.name).join(", ")}. Practice these next.
              </p>
            )}
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
            <QuestionWorkspace
              topic={activeTopic}
              question={currentQ}
              questionIndex={qIndex}
              totalQuestions={questions.length}
              topicQuestions={questions}
              selected={selected}
              onSelect={setSelected}
              answered={answered}
              onSubmit={handleSubmit}
              onNext={handleNext}
              onClose={closeTopic}
              onJumpToQuestion={handleJumpToQuestion}
              attemptEntry={normalizeAttemptEntry(progress?.attempted?.[currentQ.id])}
              topicStats={progress?.topicStats}
              weakTopics={weakTopics}
              bookmarked={(progress?.bookmarks || []).includes(currentQ.id)}
              onToggleBookmark={handleToggleBookmark}
              lastAttemptTimeSec={answered ? lastAttemptTimeSec : null}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
