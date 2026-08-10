"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Rocket, Flame, Clock, Briefcase, TrendingUp, ChevronDown, ChevronRight, ChevronLeft,
  Check, Lock, Lightbulb, ListChecks, Target, BookOpen, Code2, Trophy,
  AlertTriangle, Sparkles, Coins, Zap, ArrowRight, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar,
} from "@/components/campus/campus-ui";
import {
  fetchLanguages, fetchLanguage, fetchTopics, fetchTopic,
  fetchLanguageProgress, fetchAllUserProgress, markTopicOpened, completeTopic,
  programmingProgressRef, programmingCompletionPayload,
} from "@/lib/programming";
import { buildQuizSeedKey } from "@/lib/quizRandom";
import { fetchAttempt, submitQuizAttempt, attemptState } from "@/lib/quizAttempts";
import { GradedQuiz } from "@/components/campus/graded-quiz";
import { policyFor } from "@/lib/rewardPolicy";
import { LessonBody, InfoListCard, CodeExampleBlock } from "@/components/campus/lesson-blocks";
import { CampusProblemView } from "@/components/campus/campus-practice";
import { LanguageLogo } from "@/components/campus/language-logo";
import { useCampusBackHandler } from "@/lib/campusNav";

const DIFF_COLOR = { Beginner: CAMPUS.good, Intermediate: CAMPUS.warn, Advanced: CAMPUS.bad };

function topicHasContent(topic) {
  return !!(topic?.concept?.trim() || topic?.keyPoints?.length || topic?.codeExample?.code?.trim());
}

// ---------------- Top-level screen router ----------------

export function CampusProgrammingTab({ sidebarSlot }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").filter(Boolean)[1];

  // Read once on mount from ?lang=/?topic= - CampusWorkspace's own URL-sync
  // effect deliberately excludes the "programming" tab (see its own comment)
  // so this self-owned effect below isn't clobbered, same precedent as
  // CampusManage owning its own deeper URL.
  const [screen, setScreen] = useState(() => {
    const langId = searchParams.get("lang");
    if (!langId) return { view: "list" };
    const topicId = searchParams.get("topic");
    return topicId ? { view: "topic", langId, topicId } : { view: "roadmap", langId };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let url = `/campus/${slug}?tab=programming`;
    if (screen.view === "roadmap") url += `&lang=${encodeURIComponent(screen.langId)}`;
    else if (screen.view === "topic") url += `&lang=${encodeURIComponent(screen.langId)}&topic=${encodeURIComponent(screen.topicId)}`;
    window.history.replaceState(null, "", url);
  }, [screen, slug]);

  // See lib/campusNav.js - registers "what does Back mean right now" so the
  // browser Back button (and the exit guard) step list<-roadmap<-topic
  // instead of immediately asking to leave Campus.
  useCampusBackHandler(2, screen.view !== "list", () => {
    if (screen.view === "topic") setScreen({ view: "roadmap", langId: screen.langId });
    else setScreen({ view: "list" });
  });

  const sidebar = sidebarSlot && createPortal(
    <ProgrammingSidebarList screen={screen}
      onSelectLanguage={(langId) => setScreen({ view: "roadmap", langId })}
      onSelectTopic={(topicId) => setScreen({ view: "topic", langId: screen.langId, topicId })}
      onBackToList={() => setScreen({ view: "list" })} />,
    sidebarSlot
  );

  if (screen.view === "roadmap") {
    return (
      <>
        {sidebar}
        <LanguageRoadmap langId={screen.langId}
          onBack={() => setScreen({ view: "list" })}
          onOpenTopic={(topicId) => setScreen({ view: "topic", langId: screen.langId, topicId })} />
      </>
    );
  }
  if (screen.view === "topic") {
    return (
      <>
        {sidebar}
        <TopicView langId={screen.langId} topicId={screen.topicId}
          onBack={() => setScreen({ view: "roadmap", langId: screen.langId })} />
      </>
    );
  }
  return (
    <>
      {sidebar}
      <ProgrammingLanding onOpenLanguage={(langId) => setScreen({ view: "roadmap", langId })} />
    </>
  );
}

// Navigation Architecture 2.0 - Programming's own sub-navigation, portaled
// into CampusContextSidebar's slot. Shows the language list while on the
// landing screen, and switches to that language's own module/topic tree
// (same grouping LanguageRoadmap renders inline, just a second, independent
// fetch of the same fetchTopics(langId) data - a deliberate, cheap
// duplication rather than threading topics state through two components
// that don't otherwise share it) once a language is open.
function ProgrammingSidebarList({ screen, onSelectLanguage, onSelectTopic, onBackToList }) {
  if (screen.view === "list") {
    return <ProgrammingLanguageSidebar onSelect={onSelectLanguage} />;
  }
  // Keyed by langId so switching languages remounts this fresh (state resets
  // to loading naturally) instead of an effect manually nulling out the
  // previous language's topics - the React-recommended pattern for "reset
  // state when an identifying prop changes."
  return <ProgrammingTopicSidebar key={screen.langId} langId={screen.langId} activeTopicId={screen.topicId}
    onSelectTopic={onSelectTopic} onBackToList={onBackToList} />;
}

function ProgrammingLanguageSidebar({ onSelect }) {
  const [languages, setLanguages] = useState(null);
  useEffect(() => { fetchLanguages().then(setLanguages).catch(() => setLanguages([])); }, []);
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>PROGRAMMING</div>
      {languages === null ? <CampusSkeleton height={100} className="mx-1" /> : languages.map(lang => (
        <button key={lang.id} onClick={() => onSelect(lang.id)}
          className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
          style={{ color: CAMPUS.inkSoft }}>
          <LanguageLogo name={lang.name} size={16} />
          <span className="text-[13px] font-medium truncate">{lang.name}</span>
        </button>
      ))}
    </>
  );
}

function ProgrammingTopicSidebar({ langId, activeTopicId, onSelectTopic, onBackToList }) {
  const [topics, setTopics] = useState(null);
  useEffect(() => { fetchTopics(langId).then(setTopics).catch(() => setTopics([])); }, [langId]);
  const modules = useMemo(() => {
    if (!topics) return [];
    const byModule = []; const seen = new Map();
    topics.forEach(t => {
      const key = t.module || "General";
      if (!seen.has(key)) { seen.set(key, { module: key, topics: [] }); byModule.push(seen.get(key)); }
      seen.get(key).topics.push(t);
    });
    return byModule;
  }, [topics]);
  return (
    <>
      <button onClick={onBackToList} className="flex items-center gap-1 px-1 pb-2 mb-1 text-[11px] font-semibold" style={{ color: CAMPUS.inkFaint }}>
        <ChevronLeft size={12} /> All languages
      </button>
      {topics === null ? <CampusSkeleton height={120} className="mx-1" /> : modules.map(({ module, topics: moduleTopics }) => (
        <div key={module} className="mb-1.5">
          <div className="px-3 py-1 text-[9.5px] font-mono tracking-widest truncate" style={{ color: CAMPUS.inkFaint }}>{module.toUpperCase()}</div>
          {moduleTopics.map(t => (
            <button key={t.id} onClick={() => onSelectTopic(t.id)}
              className="campus-btn w-full flex items-center px-3 py-1.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: activeTopicId === t.id ? CAMPUS.gradientPrimary : "transparent",
                color: activeTopicId === t.id ? "#fff" : CAMPUS.inkSoft,
              }}>
              <span className="text-[12.5px] truncate">{t.title}</span>
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------- Landing ----------------

function ProgrammingLanding({ onOpenLanguage }) {
  const { user } = useAuth();
  const [languages, setLanguages] = useState(null);
  const [allProgress, setAllProgress] = useState([]);

  useEffect(() => {
    fetchLanguages().then(setLanguages).catch(() => setLanguages([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAllUserProgress(user.uid).then(setAllProgress).catch(() => setAllProgress([]));
  }, [user]);

  const progressByLang = useMemo(() => {
    const map = {};
    allProgress.forEach(p => { map[p.langId] = p; });
    return map;
  }, [allProgress]);

  const continueEntry = useMemo(() => {
    const withOpen = allProgress.filter(p => p.lastOpenedTopicId && p.lastOpenedAt);
    withOpen.sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0));
    return withOpen[0] || null;
  }, [allProgress]);

  const recentlyOpened = useMemo(() => {
    const withOpen = allProgress.filter(p => p.lastOpenedAt);
    withOpen.sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0));
    return withOpen.slice(0, 4);
  }, [allProgress]);

  const totalCompleted = allProgress.reduce((sum, p) => sum + (p.completedTopicIds?.length || 0), 0);
  const languagesStarted = allProgress.length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: CAMPUS.chromeBg }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: CAMPUS.gold }} />
          <span className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.goldTint }}>PROGRAMMING</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Beginner to industry-ready.</h1>
        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
          Structured language roadmaps built for placement prep - real explanations, runnable examples, quizzes,
          mini-projects, and interview-focused revision. Not college notes - a path to being job-ready.
        </p>
      </div>

      {continueEntry && (
        <CampusCard hover className="p-4 flex items-center gap-4 cursor-pointer"
          onClick={() => onOpenLanguage(continueEntry.langId)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <Rocket size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>CONTINUE LEARNING</p>
            <b className="text-[14px]" style={{ color: CAMPUS.ink }}>Pick up where you left off in {continueEntry.langId}</b>
          </div>
          <ArrowRight size={16} style={{ color: CAMPUS.inkFaint }} />
        </CampusCard>
      )}

      {recentlyOpened.length > 0 && (
        <div>
          <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>RECENTLY OPENED</p>
          <div className="flex gap-2.5 flex-wrap">
            {recentlyOpened.map(p => (
              <button key={p.id} onClick={() => onOpenLanguage(p.langId)}
                className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                {p.langId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beginner / Placement paths */}
      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenLanguage("python")}>
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap size={16} style={{ color: CAMPUS.blue }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Beginner Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>New to programming? Start with Python - the most beginner-friendly language with a huge industry footprint.</p>
        </CampusCard>
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenLanguage("java")}>
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase size={16} style={{ color: CAMPUS.warn }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Placement Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>Preparing for service/product company interviews? Java + DSA is the most commonly asked combination.</p>
        </CampusCard>
      </div>

      {/* Progress analytics */}
      {user && allProgress.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>TOPICS COMPLETED</p>
            <b className="text-2xl" style={{ color: CAMPUS.teal }}>{totalCompleted}</b>
          </CampusCard>
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>LANGUAGES STARTED</p>
            <b className="text-2xl" style={{ color: CAMPUS.purple }}>{languagesStarted}</b>
          </CampusCard>
        </div>
      )}

      {/* Language grid */}
      <div>
        <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>PROGRAMMING LANGUAGES</p>
        {languages === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton height={90} /></CampusCard>)}
          </div>
        ) : languages.length === 0 ? (
          <CampusEmptyState icon={Code2} title="No languages published yet" description="Check back soon - your Training & Placement Cell is setting this up." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages.map(lang => (
              <LanguageCard key={lang.id} lang={lang} progress={progressByLang[lang.id]} onClick={() => onOpenLanguage(lang.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LanguageCard({ lang, progress, onClick }) {
  const completed = progress?.completedTopicIds?.length || 0;
  const total = lang.topicCount || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <CampusCard hover className="p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          <LanguageLogo name={lang.name} size={20} />
        </div>
        <div className="min-w-0">
          <b className="text-[14px] block truncate" style={{ color: CAMPUS.ink }}>{lang.name}</b>
          <CampusChip color={DIFF_COLOR[lang.difficulty] || CAMPUS.inkFaint}>{lang.difficulty}</CampusChip>
        </div>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>{lang.placementRelevance}</p>
      <div className="flex items-center gap-3 text-[10.5px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>
        <span className="flex items-center gap-1"><Clock size={11} /> {lang.estimatedDuration}</span>
        {total > 0 && <span>{total} topics</span>}
      </div>
      {total > 0 && (
        <>
          <CampusProgressBar pct={pct} />
          <p className="text-[10px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completed}/{total} completed</p>
        </>
      )}
    </CampusCard>
  );
}

// ---------------- Roadmap (expandable topic tree) ----------------

function LanguageRoadmap({ langId, onBack, onOpenTopic }) {
  const { user } = useAuth();
  const [lang, setLang] = useState(null);
  const [topics, setTopics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [openModules, setOpenModules] = useState(new Set());

  useEffect(() => {
    fetchLanguage(langId).then(setLang).catch(() => setLang(null));
    fetchTopics(langId).then(list => {
      setTopics(list);
      setOpenModules(new Set([list[0]?.module].filter(Boolean)));
    }).catch(() => setTopics([]));
  }, [langId]);

  useEffect(() => {
    if (!user) return;
    fetchLanguageProgress(user.uid, langId).then(setProgress).catch(() => setProgress(null));
  }, [user, langId]);

  const modules = useMemo(() => {
    if (!topics) return [];
    const byModule = [];
    const seen = new Map();
    topics.forEach(t => {
      const key = t.module || "General";
      if (!seen.has(key)) { seen.set(key, { module: key, topics: [] }); byModule.push(seen.get(key)); }
      seen.get(key).topics.push(t);
    });
    return byModule;
  }, [topics]);

  const completedIds = new Set(progress?.completedTopicIds || []);
  const toggleModule = (m) => setOpenModules(prev => {
    const next = new Set(prev);
    if (next.has(m)) next.delete(m); else next.add(m);
    return next;
  });

  if (!lang || topics === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to Programming" />
        <CampusSkeleton height={200} className="mt-4" />
      </div>
    );
  }

  const completed = completedIds.size;
  const total = topics.length;

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to Programming" />
      <div className="mt-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
            <LanguageLogo name={lang.name} size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{lang.name} Roadmap</h1>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{lang.industryUsage}</span>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-3">
            <CampusProgressBar pct={Math.round((completed / total) * 100)} />
            <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completed} of {total} topics completed</p>
          </div>
        )}
      </div>

      {total === 0 ? (
        <CampusEmptyState icon={Code2} title="Roadmap coming soon" description={`${lang.name}'s topic list is being written - check back soon.`} />
      ) : (
        <div className="space-y-3">
          {modules.map(({ module, topics: moduleTopics }) => {
            const open = openModules.has(module);
            const moduleCompleted = moduleTopics.filter(t => completedIds.has(t.id)).length;
            return (
              <CampusCard key={module} className="overflow-hidden">
                <button onClick={() => toggleModule(module)} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    {open ? <ChevronDown size={15} style={{ color: CAMPUS.inkFaint }} /> : <ChevronRight size={15} style={{ color: CAMPUS.inkFaint }} />}
                    <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{module}</b>
                  </div>
                  <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{moduleCompleted}/{moduleTopics.length}</span>
                </button>
                {open && (
                  <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                    {moduleTopics.map(t => {
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
                          <span className="flex-1 text-[13px]" style={{ color: CAMPUS.ink }}>{t.title}</span>
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

function TopicView({ langId, topicId, onBack }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  // Server-side attempt record - see lib/quizAttempts.js's header for what the
  // old localStorage flag cost.
  const [attempt, setAttempt] = useState(null);
  const [attemptLoaded, setAttemptLoaded] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Surfaces a failed quiz write instead of silently re-enabling the button.
  const [quizError, setQuizError] = useState("");
  const [practiceScreen, setPracticeScreen] = useState(() => {
    const problemId = searchParams.get("practiceProblem");
    return problemId ? { view: "problem", problemId } : { view: "list" };
  });
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  // Defaults closed - unlike the beginner content above it, this is
  // optional denser material for a student who already has the basics and
  // wants to go further, not something to compete with the main lesson.
  const [showGoingDeeper, setShowGoingDeeper] = useState(false);

  // Same seed every render for this (student, topic) - shuffleQuizForAttempt
  // reproduces the identical question/option order on every refresh with
  // nothing to persist.
  const quizSeedKey = buildQuizSeedKey({ uid: user?.uid, scope: `${langId}:${topicId}` });
  const quizScopeId = `${langId}_${topicId}`;

  // State resets synchronously on topic change and stale async results are
  // dropped - the previous version kept the PREVIOUS topic's content, DONE chip
  // and quiz flag on screen until each fetch resolved.
  useEffect(() => {
    let cancelled = false;
    setTopic(null);
    setQuizAnswers({});
    setAttempt(null);
    setAttemptLoaded(false);
    setLastResult(null);
    setJustCompleted(false);
    setAlreadyDone(false);

    fetchTopic(langId, topicId)
      .then(t => { if (!cancelled) setTopic(t); })
      .catch(() => { if (!cancelled) setTopic(null); });

    if (user) {
      markTopicOpened(user.uid, langId, topicId).catch(() => {});
      fetchLanguageProgress(user.uid, langId)
        .then(p => { if (!cancelled) setAlreadyDone(!!p?.completedTopicIds?.includes(topicId)); })
        .catch(() => {});
      fetchAttempt(user.uid, "programming", quizScopeId)
        .then(a => { if (!cancelled) { setAttempt(a); setAttemptLoaded(true); } })
        .catch(() => { if (!cancelled) setAttemptLoaded(true); });
    } else {
      setAttemptLoaded(true);
    }

    return () => { cancelled = true; };
  }, [langId, topicId, user, quizScopeId]);

  const handleSubmitQuiz = async () => {
    if (!user || !topic) return;
    setSubmitting(true);
    setQuizError("");
    try {
      const res = await submitQuizAttempt({
        uid: user.uid,
        moduleKey: "programming",
        scopeId: quizScopeId,
        mcqs: topic.mcqs || [],
        answers: quizAnswers,
        item: topic,
        progressRef: programmingProgressRef(user.uid, langId),
        progressPayload: {
          completedIdField: "completedTopicIds",
          completedId: topicId,
          data: programmingCompletionPayload(user.uid, langId, topicId),
        },
        activityId: quizScopeId,
        transactionType: "programming_topic_completed",
        sourceModule: "programming",
      });
      setLastResult(res);
      if (res.status === "graded") {
        setJustCompleted(res.passed);
        if (res.passed) setAlreadyDone(true);
      }
      const fresh = await fetchAttempt(user.uid, "programming", quizScopeId).catch(() => null);
      setAttempt(fresh);
    } catch (e) {
      console.error("programming quiz submit failed", e);
      setQuizError(e?.code === "permission-denied"
        ? "Your account is not allowed to record this attempt."
        : "Could not submit - " + (e?.message || "unknown error") + ".");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeTopic({
        uid: user.uid, langId, topicId,
        xpReward: topic.xpReward || 25, coinReward: topic.coinReward || 10,
      });
      setJustCompleted(isNew);
      setAlreadyDone(true);
    } finally {
      setCompleting(false);
    }
  };

  // Depth 3 - one level deeper than the roadmap/topic screen-stack (depth 2)
  // this TopicView itself lives inside; see lib/campusNav.js.
  useCampusBackHandler(3, practiceScreen.view === "problem", () => setPracticeScreen({ view: "list" }));

  // Appends onto whatever the parent CampusProgrammingTab's own effect
  // already wrote (?tab=programming&lang=&topic=) instead of rebuilding it here too.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (practiceScreen.view === "problem") url.searchParams.set("practiceProblem", practiceScreen.problemId);
    else url.searchParams.delete("practiceProblem");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [practiceScreen]);

  if (practiceScreen.view === "problem") {
    return <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })} backLabel="Programming" />;
  }

  if (!topic) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to roadmap" />
        <CampusSkeleton height={300} className="mt-4" />
      </div>
    );
  }

  const hasContent = topicHasContent(topic);
  const mcqs = topic.mcqs || [];
  const hasQuiz = mcqs.length > 0;
  const policy = policyFor("programming", topic);
  const quizState = attemptState(attempt, policy);

  return (
    <div className="max-w-3xl">
      <CampusBackButton onClick={onBack} label="Back to roadmap" />

      <div className="mt-4 mb-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {topic.difficulty && <CampusChip color={DIFF_COLOR[topic.difficulty] || CAMPUS.inkFaint}>{topic.difficulty}</CampusChip>}
          {topic.estimatedMinutes && <span className="text-[11px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Clock size={11} /> ~{topic.estimatedMinutes} min</span>}
        </div>
        <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{topic.title}</h1>
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
              <LessonBody text={topic.concept} />
            </CampusCard>
          )}

          {topic.codeExample?.code && <CodeExampleBlock codeExample={topic.codeExample} />}

          {topic.keyPoints?.length > 0 && (
            <InfoListCard icon={Lightbulb} title="Key Points" items={topic.keyPoints} color={CAMPUS.gold} tint={CAMPUS.goldTint} checkItems />
          )}
          {topic.commonMistakes?.length > 0 && (
            <InfoListCard icon={AlertTriangle} title="Common Mistakes" items={topic.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
          )}
          {topic.realWorldApplications?.length > 0 && (
            <InfoListCard icon={Briefcase} title="Real-World Usage" items={topic.realWorldApplications} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
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

          {topic.practiceProblemIds?.length > 0 && (
            <div>
              <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>PRACTICE EXERCISES</p>
              <div className="space-y-2">
                {topic.practiceProblemIds.map(pid => (
                  <CampusCard key={pid} hover className="p-3.5 flex items-center justify-between cursor-pointer"
                    onClick={() => setPracticeScreen({ view: "problem", problemId: pid })}>
                    <span className="text-[13px] font-medium flex items-center gap-2" style={{ color: CAMPUS.ink }}>
                      <Code2 size={14} style={{ color: CAMPUS.teal }} /> Solve on CodeLab
                    </span>
                    <ArrowRight size={14} style={{ color: CAMPUS.inkFaint }} />
                  </CampusCard>
                ))}
              </div>
            </div>
          )}

          {hasQuiz && (
            <GradedQuiz
              mcqs={mcqs}
              seedKey={quizSeedKey}
              answers={quizState.locked && quizState.lastAnswers ? quizState.lastAnswers : quizAnswers}
              onAnswer={(i, v) => setQuizAnswers(p => ({ ...p, [i]: v }))}
              state={quizState}
              policy={policy}
              result={lastResult}
              error={quizError}
              loading={!attemptLoaded}
              submitting={submitting}
              onSubmit={handleSubmitQuiz} />
          )}

          {topic.assignment && (
            <CampusCard className="p-4">
              <p className="text-[11px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.purple }}>
                <ListChecks size={12} /> ASSIGNMENT
              </p>
              <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{topic.assignment}</p>
            </CampusCard>
          )}

          {/* A topic with a quiz is completed BY the quiz - see campus-cscore.jsx
              for the same change and why a second button here was the leak. */}
          {(!hasQuiz || alreadyDone) && (
            <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
                  {alreadyDone ? "Topic completed" : "Mark this topic complete"}
                </p>
                {!alreadyDone && (
                  <p className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                    <span className="flex items-center gap-1"><Zap size={11} /> +{topic.xpReward || 25} XP</span>
                    <span className="flex items-center gap-1"><Coins size={11} /> +{topic.coinReward || 10} coins</span>
                  </p>
                )}
              </div>
              {alreadyDone ? (
                <CampusChip color={CAMPUS.good} icon={Check}>DONE</CampusChip>
              ) : (
                <CampusButton onClick={handleComplete} disabled={completing || !user}>
                  {completing ? "Saving..." : "Complete Topic"}
                </CampusButton>
              )}
            </CampusCard>
          )}

          {justCompleted && (
            <p className="text-[12.5px] text-center px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
              Nice work! XP and coins added.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
