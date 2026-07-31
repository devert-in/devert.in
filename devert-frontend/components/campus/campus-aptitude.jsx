"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Calculator, Brain, MessageSquare, Clock, ChevronDown, ChevronRight,
  Check, Lightbulb, ListChecks, Target, BookOpen, Trophy,
  AlertTriangle, Sparkles, Coins, Zap, ArrowRight, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar,
} from "@/components/campus/campus-ui";
import {
  APTITUDE_CATEGORIES, fetchAptitudeTopics, fetchAptitudeTopic, fetchTopicQuestions,
  completeAptitudeTopic,
} from "@/lib/aptitude";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { shuffleQuizForAttempt, buildQuizSeedKey, loadQuizDraft, saveQuizDraft } from "@/lib/quizRandom";
import { ConceptRenderer, InfoListCard } from "@/components/campus/lesson-blocks";
import { useCampusBackHandler } from "@/lib/campusNav";

// Every topic already has real practice questions today (the existing
// AptitudePanel/aptitude-section.jsx question bank) - this new lesson layer
// sits on top of, not instead of, that bank. This module deliberately does
// NOT reuse components/aptitude/question-workspace.jsx's <QuestionWorkspace>
// as-is: that component is dark-theme-coupled (hardcoded text-white/*
// classes) for the Grind surface, not the CAMPUS light-theme token system
// every other Campus screen uses - embedding it directly here would render
// wrong. Practice questions get a lighter-weight, CAMPUS-styled inline
// renderer instead (PracticeQuestionCard below), reusing fetchTopicQuestions
// as the shared data source.

const CATEGORY_META = {
  Quantitative: { icon: Calculator, color: CAMPUS.teal },
  Logical: { icon: Brain, color: CAMPUS.purple },
  Verbal: { icon: MessageSquare, color: CAMPUS.blue },
};

function topicHasContent(topic) {
  return !!(topic?.concept?.trim() || topic?.keyPoints?.length);
}

// ---------------- Top-level screen router ----------------

export function CampusAptitudeTab({ sidebarSlot }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").filter(Boolean)[1];

  const [screen, setScreen] = useState(() => {
    const topicId = searchParams.get("topic");
    return topicId ? { view: "topic", topicId } : { view: "roadmap" };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let url = `/campus/${slug}?tab=aptitude`;
    if (screen.view === "topic") url += `&topic=${encodeURIComponent(screen.topicId)}`;
    window.history.replaceState(null, "", url);
  }, [screen, slug]);

  useCampusBackHandler(2, screen.view !== "roadmap", () => setScreen({ view: "roadmap" }));

  const sidebar = sidebarSlot && createPortal(
    <AptitudeSidebarList activeTopicId={screen.view === "topic" ? screen.topicId : null}
      onSelectTopic={(topicId) => setScreen({ view: "topic", topicId })} />,
    sidebarSlot
  );

  if (screen.view === "topic") {
    return (
      <>
        {sidebar}
        <AptitudeTopicView topicId={screen.topicId} onBack={() => setScreen({ view: "roadmap" })} />
      </>
    );
  }
  return (
    <>
      {sidebar}
      <AptitudeRoadmap onOpenTopic={(topicId) => setScreen({ view: "topic", topicId })} />
    </>
  );
}

// Navigation Architecture 2.0 - Aptitude's own sub-navigation, portaled into
// CampusContextSidebar's slot. Unlike Programming/CS Core there's no
// language/subject intermediate level here - Aptitude is a single flat
// category->topic tree (APTITUDE_CATEGORIES), so the sidebar always shows
// the full tree (same grouping AptitudeRoadmap renders inline), just with
// the active topic highlighted once one is open.
function AptitudeSidebarList({ activeTopicId, onSelectTopic }) {
  const [topics, setTopics] = useState(null);
  useEffect(() => { fetchAptitudeTopics().then(setTopics).catch(() => setTopics([])); }, []);
  const byCategory = useMemo(() => {
    const grouped = {};
    for (const cat of APTITUDE_CATEGORIES) grouped[cat] = [];
    (topics || []).forEach(t => { if (grouped[t.category]) grouped[t.category].push(t); });
    return grouped;
  }, [topics]);
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>APTITUDE</div>
      {topics === null ? <CampusSkeleton height={140} className="mx-1" /> : APTITUDE_CATEGORIES.map(cat => {
        const catTopics = byCategory[cat];
        if (!catTopics.length) return null;
        const Meta = CATEGORY_META[cat] || CATEGORY_META.Quantitative;
        return (
          <div key={cat} className="mb-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1 text-[9.5px] font-mono tracking-widest" style={{ color: Meta.color }}>
              <Meta.icon size={11} /> {cat.toUpperCase()}
            </div>
            {catTopics.map(t => (
              <button key={t.id} onClick={() => onSelectTopic(t.id)}
                className="campus-btn w-full flex items-center px-3 py-1.5 rounded-lg text-left transition-all duration-150"
                style={{
                  background: activeTopicId === t.id ? CAMPUS.gradientPrimary : "transparent",
                  color: activeTopicId === t.id ? "#fff" : CAMPUS.inkSoft,
                }}>
                <span className="text-[12.5px] truncate">{t.name}</span>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}

// ---------------- Roadmap ----------------

function AptitudeRoadmap({ onOpenTopic }) {
  const { user } = useAuth();
  const [topics, setTopics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [openCategories, setOpenCategories] = useState(new Set(APTITUDE_CATEGORIES));

  useEffect(() => {
    fetchAptitudeTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "user_aptitude_progress", user.uid))
      .then(snap => setProgress(snap.exists() ? snap.data() : null))
      .catch(() => setProgress(null));
  }, [user]);

  const byCategory = useMemo(() => {
    const grouped = {};
    for (const cat of APTITUDE_CATEGORIES) grouped[cat] = [];
    (topics || []).forEach(t => { if (grouped[t.category]) grouped[t.category].push(t); });
    return grouped;
  }, [topics]);

  const completedIds = new Set(progress?.completedTopicIds || []);
  const toggleCategory = (cat) => setOpenCategories(prev => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    return next;
  });

  if (topics === null) return <CampusSkeleton height={200} />;

  const total = topics.length;
  const completed = topics.filter(t => completedIds.has(t.id)).length;

  return (
    <div>
      <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: CAMPUS.chromeBg }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: CAMPUS.gold }} />
          <span className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.goldTint }}>APTITUDE & REASONING</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Quant, Logical, Verbal - one placement-ready academy.</h1>
        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
          Real lessons before the questions - concept, worked examples, common mistakes, then practice.
          Built for the exact rounds companies actually run.
        </p>
        {total > 0 && (
          <div className="mt-4 max-w-sm">
            <CampusProgressBar pct={Math.round((completed / total) * 100)} />
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{completed} of {total} topics completed</p>
          </div>
        )}
      </div>

      {total === 0 ? (
        <CampusEmptyState icon={BookOpen} title="Curriculum coming soon" description="Check back soon - your Training & Placement Cell is setting this up." />
      ) : (
        <div className="space-y-3">
          {APTITUDE_CATEGORIES.map(cat => {
            const catTopics = byCategory[cat];
            if (catTopics.length === 0) return null;
            const open = openCategories.has(cat);
            const catCompleted = catTopics.filter(t => completedIds.has(t.id)).length;
            const Meta = CATEGORY_META[cat] || CATEGORY_META.Quantitative;
            return (
              <CampusCard key={cat} className="overflow-hidden">
                <button onClick={() => toggleCategory(cat)} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown size={15} style={{ color: CAMPUS.inkFaint }} /> : <ChevronRight size={15} style={{ color: CAMPUS.inkFaint }} />}
                    <Meta.icon size={15} style={{ color: Meta.color }} />
                    <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{cat}</b>
                  </div>
                  <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{catCompleted}/{catTopics.length}</span>
                </button>
                {open && (
                  <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                    {catTopics.map(t => {
                      const done = completedIds.has(t.id);
                      const hasContent = topicHasContent(t);
                      return (
                        <button key={t.id} onClick={() => onOpenTopic(t.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: done ? CAMPUS.goodTint : CAMPUS.paper, border: `1px solid ${done ? CAMPUS.good : CAMPUS.line}` }}>
                            {done && <Check size={11} style={{ color: CAMPUS.good }} />}
                          </div>
                          <span className="flex-1 text-[13px]" style={{ color: CAMPUS.ink }}>{t.name}</span>
                          {!hasContent && <CampusChip color={CAMPUS.inkFaint}>COMING SOON</CampusChip>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CampusCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Topic view ----------------

function TopicQuiz({ mcqs, seedKey, answers, onAnswer, submitted, onSubmit }) {
  const shuffled = useMemo(() => shuffleQuizForAttempt(mcqs, seedKey), [mcqs, seedKey]);
  const score = mcqs.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);
  return (
    <CampusCard className="p-4">
      <p className="text-[11px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.blue }}>
        <ListChecks size={12} /> QUIZ
      </p>
      <div className="space-y-4">
        {shuffled.map((q, i) => (
          <div key={q._origIndex}>
            <p className="text-[13px] font-medium mb-2" style={{ color: CAMPUS.ink }}>{i + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const isSelected = answers[q._origIndex] === opt.originalIndex;
                const isCorrect = submitted && opt.originalIndex === q.correctIndex;
                const isWrong = submitted && isSelected && opt.originalIndex !== q.correctIndex;
                return (
                  <button key={opt.originalIndex} disabled={submitted} onClick={() => onAnswer(q._origIndex, opt.originalIndex)}
                    className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg"
                    style={{
                      background: isCorrect ? CAMPUS.goodTint : isWrong ? CAMPUS.badTint : isSelected ? CAMPUS.tealTint : CAMPUS.paper,
                      border: `1px solid ${isCorrect ? CAMPUS.good : isWrong ? CAMPUS.bad : isSelected ? CAMPUS.teal : CAMPUS.line}`,
                      color: CAMPUS.ink,
                    }}>
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!submitted ? (
        <CampusButton size="sm" className="mt-4" onClick={onSubmit} disabled={Object.keys(answers).length < mcqs.length}>
          Submit Quiz
        </CampusButton>
      ) : (
        <p className="text-[12.5px] font-semibold mt-4" style={{ color: CAMPUS.teal }}>Score: {score}/{mcqs.length}</p>
      )}
    </CampusCard>
  );
}

// Lightweight, CAMPUS-themed practice card - NOT the full dark-themed
// QuestionWorkspace (see this file's header comment). Answer -> reveal
// correctness + explanation, no bookmarking/related-questions/company-
// frequency clutter here - that richer experience still lives at /grind for
// students who want it; this is a quick "practice what you just learned"
// pass embedded directly in the lesson.
function PracticeQuestionCard({ question, index }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  return (
    <CampusCard className="p-4">
      <p className="text-[13px] font-medium mb-2.5" style={{ color: CAMPUS.ink }}>{index + 1}. {question.question}</p>
      <div className="space-y-1.5">
        {question.options.map((opt, i) => {
          const isCorrect = answered && i === question.correctIndex;
          const isWrong = answered && selected === i && i !== question.correctIndex;
          return (
            <button key={i} disabled={answered} onClick={() => setSelected(i)}
              className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg"
              style={{
                background: isCorrect ? CAMPUS.goodTint : isWrong ? CAMPUS.badTint : CAMPUS.paper,
                border: `1px solid ${isCorrect ? CAMPUS.good : isWrong ? CAMPUS.bad : CAMPUS.line}`,
                color: CAMPUS.ink,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && question.explanation && (
        <p className="text-[12px] mt-2.5 px-3 py-2 rounded-lg" style={{ background: CAMPUS.tealTint, color: CAMPUS.inkSoft }}>
          {question.explanation}
        </p>
      )}
    </CampusCard>
  );
}

function AptitudeTopicView({ topicId, onBack }) {
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [showGoingDeeper, setShowGoingDeeper] = useState(false);

  const quizSeedKey = buildQuizSeedKey({ uid: user?.uid, scope: `aptitude:${topicId}` });
  const quizDraftKey = user ? `aptitude:${user.uid}:${topicId}` : null;

  useEffect(() => {
    fetchAptitudeTopic(topicId).then(setTopic).catch(() => setTopic(null));
    fetchTopicQuestions(topicId).then(setQuestions).catch(() => setQuestions([]));
    if (user) {
      getDoc(doc(db, "user_aptitude_progress", user.uid))
        .then(snap => setAlreadyDone(!!snap.data()?.completedTopicIds?.includes(topicId)))
        .catch(() => {});
    }
  }, [topicId, user]);

  useEffect(() => {
    if (!quizDraftKey) { setQuizAnswers({}); setQuizSubmitted(false); return; }
    const draft = loadQuizDraft(quizDraftKey);
    setQuizAnswers(draft?.answers || {});
    setQuizSubmitted(!!draft?.submitted);
  }, [quizDraftKey]);

  useEffect(() => {
    if (!quizDraftKey) return;
    saveQuizDraft(quizDraftKey, { answers: quizAnswers, submitted: quizSubmitted });
  }, [quizDraftKey, quizAnswers, quizSubmitted]);

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeAptitudeTopic({
        uid: user.uid, topicId,
        xpReward: topic.xpReward || 15, coinReward: topic.coinReward || 5,
      });
      setJustCompleted(isNew);
      setAlreadyDone(true);
    } finally {
      setCompleting(false);
    }
  };

  if (!topic || questions === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to roadmap" />
        <CampusSkeleton height={300} className="mt-4" />
      </div>
    );
  }

  const hasContent = topicHasContent(topic);
  const quizPending = topic.mcqs?.length > 0 && !quizSubmitted;

  return (
    <div className="max-w-3xl">
      <CampusBackButton onClick={onBack} label="Back to roadmap" />

      <div className="mt-4 mb-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CampusChip color={CAMPUS.inkFaint}>{topic.category}</CampusChip>
          {topic.difficulty && <CampusChip color={{ Beginner: CAMPUS.good, Intermediate: CAMPUS.warn, Advanced: CAMPUS.bad }[topic.difficulty] || CAMPUS.inkFaint}>{topic.difficulty}</CampusChip>}
          {topic.estimatedMinutes && <span className="text-[11px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Clock size={11} /> ~{topic.estimatedMinutes} min</span>}
        </div>
        <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{topic.name}</h1>
        {topic.description && <p className="text-[13px] mt-1" style={{ color: CAMPUS.inkSoft }}>{topic.description}</p>}
      </div>

      {!hasContent ? (
        <CampusEmptyState icon={BookOpen} title="This lesson is being written"
          description="Real content for this topic hasn't been published yet - check back soon, or ask your admin to add it via /admin." />
      ) : (
        <div className="space-y-5">
          {topic.whatYoullLearn?.length > 0 && (
            <InfoListCard icon={Target} title="What you'll learn" items={topic.whatYoullLearn} color={CAMPUS.teal} tint={CAMPUS.tealTint} />
          )}
          {topic.prerequisites?.length > 0 && (
            <InfoListCard icon={ListChecks} title="Prerequisites" items={topic.prerequisites} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
          )}

          {topic.concept && (
            <CampusCard className="p-5">
              <ConceptRenderer text={topic.concept} />
            </CampusCard>
          )}

          {topic.keyPoints?.length > 0 && (
            <InfoListCard icon={Lightbulb} title="Key Points" items={topic.keyPoints} color={CAMPUS.gold} tint={CAMPUS.goldTint} checkItems />
          )}
          {topic.commonMistakes?.length > 0 && (
            <InfoListCard icon={AlertTriangle} title="Common Mistakes" items={topic.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
          )}
          {topic.realWorldApplications?.length > 0 && (
            <InfoListCard icon={Trophy} title="Real-World Usage" items={topic.realWorldApplications} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
          )}
          {topic.interviewTips?.length > 0 && (
            <InfoListCard icon={Sparkles} title="Interview Tips" items={topic.interviewTips} color={CAMPUS.warn} tint={CAMPUS.warnTint} />
          )}

          {topic.goingDeeper?.trim() && (
            <CampusCard className="p-0 overflow-hidden">
              <button onClick={() => setShowGoingDeeper(o => !o)} className="w-full flex items-center gap-2 p-4 text-left">
                <TrendingUp size={14} style={{ color: CAMPUS.purple, flexShrink: 0 }} />
                <span className="text-[13px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>Going Deeper</span>
                <CampusChip color={CAMPUS.purple}>ADVANCED</CampusChip>
                <ChevronDown size={14} style={{ color: CAMPUS.inkFaint, transform: showGoingDeeper ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {showGoingDeeper && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap pt-3.5" style={{ color: CAMPUS.inkSoft }}>{topic.goingDeeper}</p>
                </div>
              )}
            </CampusCard>
          )}

          {topic.mcqs?.length > 0 && (
            <TopicQuiz mcqs={topic.mcqs} seedKey={quizSeedKey} answers={quizAnswers} onAnswer={(i, v) => setQuizAnswers(p => ({ ...p, [i]: v }))}
              submitted={quizSubmitted} onSubmit={() => setQuizSubmitted(true)} />
          )}

          {topic.assignment && (
            <CampusCard className="p-4">
              <p className="text-[11px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.purple }}>
                <ListChecks size={12} /> ASSIGNMENT
              </p>
              <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{topic.assignment}</p>
            </CampusCard>
          )}

          <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
                {alreadyDone ? "Topic completed" : "Mark this topic complete"}
              </p>
              {!alreadyDone && (
                <p className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                  <span className="flex items-center gap-1"><Zap size={11} /> +{topic.xpReward || 15} XP</span>
                  <span className="flex items-center gap-1"><Coins size={11} /> +{topic.coinReward || 5} coins</span>
                </p>
              )}
              {!alreadyDone && quizPending && (
                <p className="text-[11px] mt-1" style={{ color: CAMPUS.warn }}>Submit the quiz above to unlock this.</p>
              )}
            </div>
            {alreadyDone ? (
              <CampusChip color={CAMPUS.good} icon={Check}>DONE</CampusChip>
            ) : (
              <CampusButton onClick={handleComplete} disabled={completing || !user || quizPending}>
                {completing ? "Saving..." : "Complete Topic"}
              </CampusButton>
            )}
          </CampusCard>

          {justCompleted && (
            <p className="text-[12.5px] text-center px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
              Nice work! XP and coins added.
            </p>
          )}
        </div>
      )}

      {questions?.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-mono tracking-widest mb-2.5 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
            <ArrowRight size={12} /> PRACTICE QUESTIONS ({questions.length})
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => <PracticeQuestionCard key={q.id} question={q} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
