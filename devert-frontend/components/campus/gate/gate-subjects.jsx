"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Award, Brain, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock, Coins, FileQuestion, FileText, Layers, Lightbulb,
  ListChecks, Repeat, Rocket, Sigma, Sparkles, Target, TrendingUp, Zap, Play,
  Briefcase, Footprints,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar, CampusBreadcrumb,
} from "@/components/campus/campus-ui";
import {
  LessonBody, InfoListCard, CodeExampleBlock, LessonProgressBar, useReadingProgress,
} from "@/components/campus/lesson-blocks";
import { shuffleQuizForAttempt, buildQuizSeedKey, loadQuizDraft, saveQuizDraft } from "@/lib/quizRandom";
import {
  fetchTopic, groupTopicsByModule, topicHasContent, markTopicOpened, completeTopic,
  markTopicRevised,
} from "@/lib/gate";
import { fetchPyqs, toggleBookmark, isBookmarked, saveTopicNote } from "@/lib/gatePyq";
import { fetchTests } from "@/lib/gateTests";
import { useGate, GateNoContent } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateStat, GATE_DIFF_COLOR, GateBookmarkButton, GateQuestion, GateSolution,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// Subject grid -> subject roadmap -> topic lesson.
//
// The topic lesson is the module's most important screen and it follows the exact
// pedagogical order the product specifies: objectives, prerequisites, a plain
// explanation, then a deeper one, then examples you can run, a dry run, analogies,
// mistakes, memory tricks, formulas, shortcuts, how it has actually been asked in
// GATE, its interview relevance, a revision summary, and only then the graded
// checks. That order is not cosmetic - it is the difference between a page a
// beginner can follow and a reference only someone who already knows the topic
// can use.
//
// Every one of those blocks renders only when an admin has authored it. A lesson
// with just `concept` filled in renders as a clean single-section article, not as
// fifteen empty headings.

// ---------------- subject grid ----------------

export function GateSubjects() {
  const { tree, progress, completion, go, screen } = useGate();

  if (!tree?.length) {
    return <GateNoContent what="subjects"
      hint="This paper's subject tree hasn't been seeded yet - a platform admin seeds the official syllabus from /admin." />;
  }

  if (screen.subjectId) {
    const subject = tree.find(s => s.id === screen.subjectId);
    if (subject) return <SubjectRoadmap subject={subject} />;
  }

  const started = completion.subjects.filter(s => s.done > 0);
  const lastOpened = progress?.lastOpenedSubjectId
    ? tree.find(s => s.id === progress.lastOpenedSubjectId)
    : null;

  return (
    <div className="space-y-5">
      <GateSectionHeading label="SUBJECTS" icon={Layers} title="Study by subject"
        description="Each subject follows the official syllabus order. Work through a subject end to end, or jump to whatever the Overview recommends." />

      {lastOpened && progress?.lastOpenedTopicId && (
        <CampusCard hover className="p-4 flex items-center gap-4 cursor-pointer"
          onClick={() => go("subjects", { subjectId: lastOpened.id, topicId: progress.lastOpenedTopicId })}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <Rocket size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>CONTINUE WHERE YOU LEFT OFF</p>
            <b className="text-[14px]" style={{ color: CAMPUS.ink }}>{lastOpened.name}</b>
          </div>
          <ArrowRight size={16} style={{ color: CAMPUS.inkFaint }} />
        </CampusCard>
      )}

      {started.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GateStat label="Subjects started" value={started.length} color={CAMPUS.teal} icon={Layers} />
          <GateStat label="Topics done" value={completion.done} color={CAMPUS.good} icon={CheckCircle2} />
          <GateStat label="Topics left" value={completion.total - completion.done} color={CAMPUS.warn} icon={Target} />
          <GateStat label="Overall" value={`${completion.pct}%`} color={CAMPUS.purple} icon={TrendingUp} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tree.map(subject => {
          const stat = completion.subjects.find(s => s.subjectId === subject.id);
          const authored = (subject.topics || []).filter(topicHasContent).length;
          return (
            <CampusCard key={subject.id} hover className="p-4 cursor-pointer flex flex-col"
              onClick={() => go("subjects", { subjectId: subject.id })}>
              <div className="flex items-start gap-2 mb-2 flex-wrap">
                <b className="text-[14px] flex-1 min-w-0" style={{ color: CAMPUS.ink }}>{subject.name}</b>
                {subject.weightageMarks > 0 && <CampusChip color={CAMPUS.gold}>~{subject.weightageMarks}M</CampusChip>}
              </div>
              {subject.description && (
                <p className="text-[11.5px] leading-relaxed mb-3 flex-1" style={{ color: CAMPUS.inkSoft }}>{subject.description}</p>
              )}
              <div className="flex items-center gap-3 text-[10.5px] font-mono mb-2.5" style={{ color: CAMPUS.inkFaint }}>
                <span>{subject.topics.length} topics</span>
                {subject.estimatedHours > 0 && <span className="flex items-center gap-1"><Clock size={10} /> ~{subject.estimatedHours}h</span>}
                {authored < subject.topics.length && (
                  <span style={{ color: CAMPUS.warn }}>{authored} written</span>
                )}
              </div>
              <CampusProgressBar pct={stat?.pct || 0} />
              <p className="text-[10px] mt-1" style={{ color: CAMPUS.inkFaint }}>
                {stat?.done || 0}/{stat?.total || 0} completed
              </p>
            </CampusCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- subject roadmap ----------------

function SubjectRoadmap({ subject }) {
  const { progress, go } = useGate();
  const completed = useMemo(() => new Set(progress?.completedTopicIds || []), [progress]);
  const modules = useMemo(() => groupTopicsByModule(subject.topics), [subject]);
  const [open, setOpen] = useState(() => new Set([modules[0]?.module].filter(Boolean)));

  const done = subject.topics.filter(t => completed.has(t.id)).length;
  const total = subject.topics.length;

  const toggle = (m) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(m)) next.delete(m); else next.add(m);
    return next;
  });

  return (
    <div>
      <CampusBreadcrumb items={[
        { label: "Subjects", onClick: () => go("subjects") },
        { label: subject.name },
      ]} />

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{subject.name}</h1>
          {subject.weightageMarks > 0 && <CampusChip color={CAMPUS.gold}>~{subject.weightageMarks} MARKS</CampusChip>}
          {subject.estimatedHours > 0 && <CampusChip color={CAMPUS.inkFaint}>~{subject.estimatedHours} HOURS</CampusChip>}
        </div>
        {subject.description && (
          <p className="text-[12.5px] leading-relaxed max-w-2xl mb-3" style={{ color: CAMPUS.inkSoft }}>{subject.description}</p>
        )}
        {total > 0 && (
          <>
            <CampusProgressBar pct={Math.round((done / total) * 100)} />
            <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>{done} of {total} topics completed</p>
          </>
        )}
      </div>

      {total === 0 ? (
        <CampusEmptyState icon={Layers} title="No topics published for this subject yet"
          description="Its topic list is being authored - check back soon." />
      ) : (
        <div className="space-y-3">
          {modules.map(({ module, topics }) => {
            const isOpen = open.has(module);
            const moduleDone = topics.filter(t => completed.has(t.id)).length;
            return (
              <CampusCard key={module} className="overflow-hidden">
                <button onClick={() => toggle(module)} aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen
                      ? <ChevronDown size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
                      : <ChevronRight size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                    <b className="text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{module}</b>
                  </div>
                  <span className="text-[10.5px] font-mono flex-shrink-0"
                    style={{ color: moduleDone === topics.length && topics.length > 0 ? CAMPUS.good : CAMPUS.inkFaint }}>
                    {moduleDone}/{topics.length}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                    {topics.map(topic => {
                      const isDone = completed.has(topic.id);
                      const hasContent = topicHasContent(topic);
                      return (
                        <button key={topic.id}
                          onClick={() => go("subjects", { subjectId: subject.id, topicId: topic.id })}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                          <span className="rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 20, height: 20,
                              background: isDone ? CAMPUS.goodTint : CAMPUS.paper,
                              border: `1px solid ${isDone ? CAMPUS.good : CAMPUS.line}`,
                            }}>
                            {isDone && <Check size={11} style={{ color: CAMPUS.good }} />}
                          </span>
                          <span className="flex-1 text-[13px] min-w-0" style={{ color: CAMPUS.ink }}>{topic.title}</span>
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            {topic.estimatedMinutes > 0 && (
                              <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{topic.estimatedMinutes}m</span>
                            )}
                            {topic.difficulty && (
                              <CampusChip color={GATE_DIFF_COLOR[topic.difficulty] || CAMPUS.inkFaint}>{topic.difficulty}</CampusChip>
                            )}
                            {!hasContent && <CampusChip color={CAMPUS.inkFaint}>SOON</CampusChip>}
                          </span>
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

// ---------------- the topic lesson ----------------

// The twelve-stage topic journey the product specifies, rendered as a progress
// strip at the top of the lesson. Stages a topic has no content for are shown
// dimmed rather than removed, so the shape of a complete topic is always visible
// and a student can tell that (say) this topic has no numericals rather than
// wondering whether they missed a section.
const JOURNEY = [
  { key: "intro", label: "Intro", icon: Target },
  { key: "theory", label: "Theory", icon: Brain },
  { key: "examples", label: "Examples", icon: Play },
  { key: "walkthrough", label: "Dry run", icon: Footprints },
  { key: "mcq", label: "MCQs", icon: ListChecks },
  { key: "numericals", label: "Numericals", icon: Sigma },
  { key: "pyq", label: "PYQs", icon: FileQuestion },
  { key: "test", label: "Topic test", icon: Award },
  { key: "revision", label: "Revision", icon: Repeat },
];

export function GateTopicView() {
  const { user } = useAuth();
  const { paper, tree, progress, notes, screen, go, reload } = useGate();
  const { subjectId, topicId } = screen;

  const subject = useMemo(() => tree.find(s => s.id === subjectId), [tree, subjectId]);
  const [topic, setTopic] = useState(null);
  const [pyqs, setPyqs] = useState(null);
  const [topicTest, setTopicTest] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [natAnswers, setNatAnswers] = useState({});
  const [natRevealed, setNatRevealed] = useState({});
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const articleRef = useRef(null);
  const readingPct = useReadingProgress(articleRef);
  const reduceMotion = useReducedMotion();

  const quizSeedKey = buildQuizSeedKey({ uid: user?.uid, scope: `gate:${paper?.id}:${topicId}` });
  const quizDraftKey = user ? `gate:${user.uid}:${paper?.id}:${topicId}` : null;

  useEffect(() => {
    if (!paper?.id || !subjectId || !topicId) return;
    let cancelled = false;
    setTopic(null);
    fetchTopic(paper.id, subjectId, topicId).then(t => { if (!cancelled) setTopic(t); }).catch(() => setTopic(null));
    // PYQs tagged to this exact topic - the "previous year relevance" section is
    // the real questions, not a prose claim about how often it is asked.
    fetchPyqs(paper.id, { topicId }).then(list => { if (!cancelled) setPyqs(list); }).catch(() => setPyqs([]));
    fetchTests(paper.id).then(tests => {
      if (cancelled) return;
      setTopicTest(tests.find(t => t.testType === "topic" && (t.topicIds || []).includes(topicId)) || null);
    }).catch(() => setTopicTest(null));
    return () => { cancelled = true; };
  }, [paper?.id, subjectId, topicId]);

  useEffect(() => {
    if (!user || !paper?.id) return;
    markTopicOpened(user.uid, paper.id, subjectId, topicId).catch(() => {});
  }, [user, paper?.id, subjectId, topicId]);

  useEffect(() => {
    setAlreadyDone(!!progress?.completedTopicIds?.includes(topicId));
  }, [progress, topicId]);

  useEffect(() => {
    setNoteText(notes?.topicNotes?.[topicId] || "");
  }, [notes, topicId]);

  // Restore an in-progress or already-submitted quiz for this topic - a refresh
  // must never silently reset an unsubmitted quiz to blank.
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

  const goBack = () => go("subjects", { subjectId });

  if (!topic) {
    return (
      <div>
        <CampusBackButton onClick={goBack} label={`Back to ${subject?.name || "subject"}`} />
        <CampusSkeleton height={320} className="mt-4" />
      </div>
    );
  }

  const hasContent = topicHasContent(topic);
  const mcqs = topic.mcqs || [];
  const numericals = topic.numericals || [];
  // A topic with an authored quiz must have it submitted before completion
  // unlocks - without this a student could bank the XP without ever opening the
  // check. Same gate Programming and CS Core already enforce.
  const quizPending = mcqs.length > 0 && !quizSubmitted;

  const available = {
    intro: !!(topic.whatYoullLearn?.length || topic.prerequisites?.length),
    theory: !!topic.concept?.trim(),
    examples: !!(topic.codeExample?.code?.trim() || topic.workedExamples?.length),
    walkthrough: !!topic.dryRun?.trim(),
    mcq: mcqs.length > 0,
    numericals: numericals.length > 0,
    pyq: (pyqs?.length || 0) > 0,
    test: !!topicTest,
    revision: !!(topic.revisionSummary?.trim() || topic.shortNotes?.oneMinute?.trim()),
  };

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeTopic({
        uid: user.uid, paperId: paper.id, subjectId, topicId,
        xpReward: topic.xpReward || 25, coinReward: topic.coinReward || 10,
      });
      setJustCompleted(isNew);
      setAlreadyDone(true);
      await reload.progress();
    } finally {
      setCompleting(false);
    }
  };

  const handleRevised = async () => {
    if (!user) return;
    await markTopicRevised(user.uid, paper.id, topicId).catch(() => {});
    await reload.progress();
  };

  const handleSaveNote = async () => {
    if (!user) return;
    await saveTopicNote({ uid: user.uid, paperId: paper.id, topicId, text: noteText }).catch(() => {});
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
    await reload.notes();
  };

  const bookmarked = isBookmarked(notes, "topic", topicId);

  return (
    <div className="max-w-3xl">
      <CampusBreadcrumb items={[
        { label: "Subjects", onClick: () => go("subjects") },
        { label: subject?.name, onClick: goBack },
        { label: topic.title },
      ]} />

      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {topic.module && <CampusChip color={CAMPUS.inkFaint}>{topic.module.toUpperCase()}</CampusChip>}
              {topic.difficulty && <CampusChip color={GATE_DIFF_COLOR[topic.difficulty] || CAMPUS.inkFaint}>{topic.difficulty}</CampusChip>}
              {topic.estimatedMinutes > 0 && (
                <span className="text-[11px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                  <Clock size={11} /> ~{topic.estimatedMinutes} min
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{topic.title}</h1>
          </div>
          {user && (
            <GateBookmarkButton on={bookmarked} size={16}
              onToggle={async () => {
                await toggleBookmark({ uid: user.uid, paperId: paper.id, kind: "topic", id: topicId, on: !bookmarked }).catch(() => {});
                await reload.notes();
              }} />
          )}
        </div>
      </div>

      <TopicJourney available={available} />

      {!hasContent ? (
        <CampusEmptyState icon={FileText} title="This lesson is being written" className="mt-4"
          description="The syllabus lists this topic, but its lesson hasn't been authored yet. Previous year questions tagged to it may still be available below." />
      ) : (
        <article ref={articleRef} className="space-y-5 mt-4">
          <LessonProgressBar pct={readingPct} />

          {/* --- 1. Intro --- */}
          {topic.whatYoullLearn?.length > 0 && (
            <InfoListCard icon={Target} title="Learning objectives" items={topic.whatYoullLearn}
              color={CAMPUS.teal} tint={CAMPUS.tealTint} />
          )}
          {topic.prerequisites?.length > 0 && (
            <InfoListCard icon={ListChecks} title="Prerequisites" items={topic.prerequisites}
              color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
          )}

          {/* --- 2. Theory (the plain explanation, with diagrams/flows/checkpoints
                    authored inline via the shared lesson-block syntax) --- */}
          {topic.concept?.trim() && (
            <CampusCard className="p-5">
              <LessonBody text={topic.concept} />
            </CampusCard>
          )}

          {/* --- 3. Deeper explanation, collapsed by default so the plain one is
                    what a beginner meets first --- */}
          {topic.deepDive?.trim() && (
            <CampusCard className="overflow-hidden">
              <button onClick={() => setShowDeepDive(o => !o)} aria-expanded={showDeepDive}
                className="w-full flex items-center gap-2 p-4 text-left">
                <TrendingUp size={14} style={{ color: CAMPUS.purple, flexShrink: 0 }} />
                <span className="text-[13px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>Go deeper</span>
                <CampusChip color={CAMPUS.purple}>EXAM DEPTH</CampusChip>
                <ChevronDown size={14} style={{
                  color: CAMPUS.inkFaint,
                  transform: showDeepDive ? "rotate(180deg)" : "none",
                  transition: reduceMotion ? "none" : "transform 0.15s",
                }} />
              </button>
              {showDeepDive && (
                <div className="px-5 pb-5 pt-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <LessonBody text={topic.deepDive} />
                </div>
              )}
            </CampusCard>
          )}

          {/* --- 4. Interactive example (runs for real through the CodeLab
                    execution path when a backend is configured) --- */}
          {topic.codeExample?.code?.trim() && <CodeExampleBlock codeExample={topic.codeExample} />}

          {/* --- 5. Worked examples --- */}
          {topic.workedExamples?.length > 0 && (
            <div>
              <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>WORKED EXAMPLES</p>
              <div className="space-y-2.5">
                {topic.workedExamples.map((ex, i) => <WorkedExample key={i} example={ex} index={i} />)}
              </div>
            </div>
          )}

          {/* --- 6. Dry run / visual walkthrough --- */}
          {topic.dryRun?.trim() && (
            <CampusCard className="p-5" style={{ border: `1px solid ${CAMPUS.blue}40`, background: `${CAMPUS.blue}0D` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Footprints size={14} style={{ color: CAMPUS.blue }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.blue }}>STEP-BY-STEP DRY RUN</span>
              </div>
              <LessonBody text={topic.dryRun} />
            </CampusCard>
          )}

          {/* --- 7. Teaching aids. keyPoints leads the group: it is the
                    "what to take away" summary, and lib/gate.js's
                    topicHasContent treats it as one of the three signals that a
                    topic has been authored at all, so it must render. --- */}
          {topic.keyPoints?.length > 0 && (
            <InfoListCard icon={ListChecks} title="Key points" items={topic.keyPoints}
              color={CAMPUS.good} tint={CAMPUS.goodTint} checkItems />
          )}
          {topic.analogies?.length > 0 && (
            <InfoListCard icon={Lightbulb} title="Real-world analogies" items={topic.analogies}
              color={CAMPUS.blue} tint={CAMPUS.blueTint} />
          )}
          {topic.commonMistakes?.length > 0 && (
            <InfoListCard icon={AlertTriangle} title="Common mistakes" items={topic.commonMistakes}
              color={CAMPUS.bad} tint={CAMPUS.badTint} />
          )}
          {topic.memoryTricks?.length > 0 && (
            <InfoListCard icon={Brain} title="Memory tricks" items={topic.memoryTricks}
              color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
          )}
          {topic.formulas?.length > 0 && (
            <InfoListCard icon={Sigma} title="Formula box" items={topic.formulas}
              color={CAMPUS.gold} tint={CAMPUS.goldTint} checkItems />
          )}
          {topic.shortcuts?.length > 0 && (
            <InfoListCard icon={Zap} title="Exam shortcuts" items={topic.shortcuts}
              color={CAMPUS.warn} tint={CAMPUS.warnTint} />
          )}

          {/* --- 8. Exam and career context --- */}
          {topic.pyqRelevance?.trim() && (
            <CampusCard className="p-4" style={{ border: `1px solid ${CAMPUS.gold}40`, background: CAMPUS.goldTint }}>
              <div className="flex items-center gap-2 mb-2">
                <FileQuestion size={13} style={{ color: CAMPUS.gold }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.gold }}>HOW GATE ASKS THIS</span>
              </div>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{topic.pyqRelevance}</p>
            </CampusCard>
          )}
          {topic.interviewConnection?.trim() && (
            <CampusCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={13} style={{ color: CAMPUS.warn }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.warn }}>INTERVIEW CONNECTION</span>
              </div>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{topic.interviewConnection}</p>
            </CampusCard>
          )}

          {/* --- 9. Practice MCQs --- */}
          {mcqs.length > 0 && (
            <TopicQuiz mcqs={mcqs} seedKey={quizSeedKey} answers={quizAnswers} submitted={quizSubmitted}
              onAnswer={(i, v) => setQuizAnswers(p => ({ ...p, [i]: v }))}
              onSubmit={() => setQuizSubmitted(true)} />
          )}

          {/* --- 10. Numerical problems (NAT-style, the type GATE actually uses) --- */}
          {numericals.length > 0 && (
            <TopicNumericals items={numericals} answers={natAnswers} revealed={natRevealed}
              onAnswer={(i, v) => setNatAnswers(p => ({ ...p, [i]: v }))}
              onReveal={(i) => setNatRevealed(p => ({ ...p, [i]: true }))} />
          )}

          {/* --- 11. Revision summary --- */}
          {topic.revisionSummary?.trim() && (
            <CampusCard className="p-4" style={{ border: `1px solid ${CAMPUS.good}40`, background: CAMPUS.goodTint }}>
              <div className="flex items-center gap-2 mb-2">
                <Repeat size={13} style={{ color: CAMPUS.good }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.good }}>REVISION SUMMARY</span>
              </div>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{topic.revisionSummary}</p>
            </CampusCard>
          )}

          {/* --- 12. Personal notes --- */}
          {user && (
            <CampusCard className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={13} style={{ color: CAMPUS.inkFaint }} />
                  <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>MY NOTES ON THIS TOPIC</span>
                </div>
                {noteSaved && <span className="text-[11px]" style={{ color: CAMPUS.good }}>Saved</span>}
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} maxLength={4000}
                placeholder="Anything you want to remember about this topic - your own wording beats anyone else's."
                className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none resize-y"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              <CampusButton size="sm" variant="secondary" className="mt-2" onClick={handleSaveNote}>Save note</CampusButton>
            </CampusCard>
          )}
        </article>
      )}

      {/* --- PYQs tagged to this topic --- */}
      {pyqs === null ? null : pyqs.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>
            PREVIOUS YEAR QUESTIONS ON THIS TOPIC ({pyqs.length})
          </p>
          <div className="space-y-3">
            {pyqs.slice(0, 5).map((pyq, i) => (
              <div key={pyq.id} className="space-y-2">
                <GateQuestion question={pyq} index={i} mode="study" answer={null} onAnswer={() => {}} />
                <GateSolution answerKey={pyq} />
              </div>
            ))}
          </div>
          {pyqs.length > 5 && (
            <CampusButton size="sm" variant="secondary" className="mt-3" onClick={() => go("pyq", { subjectId })}>
              See all {pyqs.length} in the PYQ browser
            </CampusButton>
          )}
        </div>
      )}

      {/* --- topic test --- */}
      {topicTest && (
        <CampusCard hover className="p-4 mt-6 flex items-center gap-4 cursor-pointer"
          onClick={() => go("subjectTests", { testId: topicTest.id })}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
            <Award size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>TOPIC TEST</p>
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{topicTest.title}</b>
            <span className="block text-[11px]" style={{ color: CAMPUS.inkFaint }}>
              {topicTest.questionCount || 0} questions · {topicTest.durationMinutes} min · timed, one attempt
            </span>
          </div>
          <ArrowRight size={16} style={{ color: CAMPUS.inkFaint }} />
        </CampusCard>
      )}

      {/* --- completion --- */}
      {hasContent && (
        <CampusCard className="p-4 mt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
              {alreadyDone ? "Topic completed" : "Mark this topic complete"}
            </p>
            {!alreadyDone && (
              <p className="text-[11px] flex items-center gap-2.5 mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                <span className="flex items-center gap-1"><Zap size={11} /> +{topic.xpReward || 25} XP</span>
                <span className="flex items-center gap-1"><Coins size={11} /> +{topic.coinReward || 10} coins</span>
              </p>
            )}
            {!alreadyDone && quizPending && (
              <p className="text-[11px] mt-1" style={{ color: CAMPUS.warn }}>Submit the practice MCQs above to unlock this.</p>
            )}
            {alreadyDone && (
              <p className="text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                {progress?.revisedAt?.[topicId]
                  ? `Last revised ${new Date(progress.revisedAt[topicId]).toLocaleDateString()}.`
                  : "Not revised yet - the revision engine has this scheduled."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {alreadyDone ? (
              <>
                <CampusChip color={CAMPUS.good} icon={Check}>DONE</CampusChip>
                <CampusButton size="sm" variant="secondary" icon={Repeat} onClick={handleRevised}>
                  Mark revised
                </CampusButton>
              </>
            ) : (
              <CampusButton onClick={handleComplete} disabled={completing || !user || quizPending}>
                {completing ? "Saving..." : "Complete topic"}
              </CampusButton>
            )}
          </div>
        </CampusCard>
      )}

      {justCompleted && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="text-[12.5px] text-center px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 mt-3"
          style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
          <Sparkles size={13} /> Topic complete. XP and coins added, and it&apos;s now in your revision schedule.
        </motion.p>
      )}
    </div>
  );
}

function TopicJourney({ available }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
      {JOURNEY.map(stage => {
        const has = available[stage.key];
        const Icon = stage.icon;
        return (
          <span key={stage.key}
            title={has ? stage.label : `${stage.label} - not authored for this topic`}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0"
            style={{
              background: has ? CAMPUS.tealTint : CAMPUS.paper,
              border: `1px solid ${has ? CAMPUS.teal : CAMPUS.line}`,
              color: has ? CAMPUS.teal : CAMPUS.inkFaint,
              opacity: has ? 1 : 0.55,
            }}>
            <Icon size={10} /> {stage.label}
          </span>
        );
      })}
    </div>
  );
}

function WorkedExample({ example, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <CampusCard className="overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-3.5 text-left">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-bold"
          style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>{index + 1}</span>
        <span className="flex-1 text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>
          {example.title || `Example ${index + 1}`}
        </span>
        <ChevronDown size={13} style={{ color: CAMPUS.inkFaint, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 pt-3 space-y-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          {example.problem && <LessonBody text={example.problem} />}
          {example.solution && (
            <div className="pt-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.teal }}>SOLUTION</p>
              <LessonBody text={example.solution} />
            </div>
          )}
        </div>
      )}
    </CampusCard>
  );
}

function TopicQuiz({ mcqs, seedKey, answers, onAnswer, submitted, onSubmit }) {
  // Shuffled purely for display, keyed on (student, topic). Grading always
  // compares against the original array index's correctIndex, never the shuffled
  // render position, so `answers` keeps its "keyed by original index" shape.
  const shuffled = useMemo(() => shuffleQuizForAttempt(mcqs, seedKey), [mcqs, seedKey]);
  const score = mcqs.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);

  return (
    <CampusCard className="p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <ListChecks size={13} style={{ color: CAMPUS.blue }} />
        <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.blue }}>PRACTICE MCQS</span>
      </div>
      <div className="space-y-4">
        {shuffled.map((q, i) => (
          <div key={q._origIndex}>
            <p className="text-[13px] font-medium mb-2" style={{ color: CAMPUS.ink }}>{i + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map(opt => {
                const isSelected = answers[q._origIndex] === opt.originalIndex;
                const isCorrect = submitted && opt.originalIndex === q.correctIndex;
                const isWrong = submitted && isSelected && opt.originalIndex !== q.correctIndex;
                return (
                  <button key={opt.originalIndex} disabled={submitted}
                    onClick={() => onAnswer(q._origIndex, opt.originalIndex)}
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
            {submitted && mcqs[q._origIndex]?.explanation && (
              <p className="text-[12px] leading-relaxed mt-2 px-3 py-2 rounded-lg"
                style={{ background: CAMPUS.paper, color: CAMPUS.inkSoft }}>
                {mcqs[q._origIndex].explanation}
              </p>
            )}
          </div>
        ))}
      </div>
      {!submitted ? (
        <CampusButton size="sm" className="mt-4" onClick={onSubmit}
          disabled={Object.keys(answers).length < mcqs.length}>
          Submit answers
        </CampusButton>
      ) : (
        <p className="text-[12.5px] font-semibold mt-4" style={{ color: score === mcqs.length ? CAMPUS.good : CAMPUS.teal }}>
          Score: {score}/{mcqs.length}
        </p>
      )}
    </CampusCard>
  );
}

// Numerical (NAT) practice. Answers are checked against an authored inclusive
// range, never float equality - see lib/gateTests.js's isCorrectAnswer for why.
// Unlike the MCQ block this is un-gated and freely retryable: numericals are
// where students most need to try, fail, and see the working.
function TopicNumericals({ items, answers, revealed, onAnswer, onReveal }) {
  return (
    <CampusCard className="p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Sigma size={13} style={{ color: CAMPUS.teal }} />
        <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.teal }}>NUMERICAL PROBLEMS</span>
      </div>
      <div className="space-y-4">
        {items.map((n, i) => {
          const given = answers[i];
          const lo = Math.min(Number(n.answerMin), Number(n.answerMax ?? n.answerMin));
          const hi = Math.max(Number(n.answerMin), Number(n.answerMax ?? n.answerMin));
          const parsed = given === "" || given == null ? null : Number(given);
          const checked = parsed != null && Number.isFinite(parsed);
          const correct = checked && parsed >= lo && parsed <= hi;
          const isRevealed = !!revealed[i];
          return (
            <div key={i}>
              <p className="text-[13px] font-medium mb-2" style={{ color: CAMPUS.ink }}>{i + 1}. {n.question}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="number" step="any" inputMode="decimal"
                  value={given ?? ""} onChange={e => onAnswer(i, e.target.value)}
                  placeholder="Your answer"
                  className="font-mono text-[13px] px-3 py-2 rounded-lg outline-none w-40"
                  style={{
                    background: CAMPUS.paper, color: CAMPUS.ink,
                    border: `1px solid ${checked ? (correct ? CAMPUS.good : CAMPUS.bad) : CAMPUS.line}`,
                  }} />
                {n.unit && <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{n.unit}</span>}
                {checked && (
                  <CampusChip color={correct ? CAMPUS.good : CAMPUS.bad}>{correct ? "CORRECT" : "NOT QUITE"}</CampusChip>
                )}
                {!isRevealed && (
                  <button onClick={() => onReveal(i)} className="text-[11.5px] font-semibold" style={{ color: CAMPUS.inkFaint }}>
                    Show solution
                  </button>
                )}
              </div>
              {(isRevealed || correct) && (
                <div className="mt-2 px-3 py-2.5 rounded-lg" style={{ background: CAMPUS.paper }}>
                  <p className="text-[11px] font-mono mb-1" style={{ color: CAMPUS.good }}>
                    Accepted answer: {lo === hi ? lo : `${lo} to ${hi}`}{n.unit ? ` ${n.unit}` : ""}
                  </p>
                  {n.solution && <LessonBody text={n.solution} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CampusCard>
  );
}
