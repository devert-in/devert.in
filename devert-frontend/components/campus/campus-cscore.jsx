"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Rocket, Clock, Briefcase, ChevronDown, ChevronRight,
  Check, Lightbulb, ListChecks, Target, BookOpen, Code2,
  AlertTriangle, Sparkles, Coins, Zap, ArrowRight, GraduationCap, Cpu,
  Database, Network, Puzzle, Ruler, CircuitBoard, Hammer, Blocks, Landmark,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar,
} from "@/components/campus/campus-ui";
import {
  fetchSubjects, fetchSubject, fetchTopics, fetchTopic,
  fetchSubjectProgress, fetchAllUserProgress, markTopicOpened, completeTopic,
} from "@/lib/csCore";
import { ConceptRenderer, InfoListCard, CodeExampleBlock } from "@/components/campus/campus-daily-learning";
import { CampusProblemView } from "@/components/campus/campus-practice";

const DIFF_COLOR = { Beginner: CAMPUS.good, Intermediate: CAMPUS.warn, Advanced: CAMPUS.bad };

// Subject badges are Lucide icons, not the free-text emoji admins can type
// into a subject's `icon` field - see the identical reasoning in
// campus-programming.jsx's LANGUAGE_ICONS. Matched by a substring of the
// subject name (lowercased) since these names are long/prose-like, not slugs
// ("System Design (Beginner)"), with a generic fallback for anything new.
const SUBJECT_ICONS = [
  ["operating system", Cpu],
  ["database", Database],
  ["network", Network],
  ["object-oriented", Puzzle],
  ["software engineering", Ruler],
  ["organization", CircuitBoard],
  ["architecture", CircuitBoard],
  ["compiler", Hammer],
  ["design pattern", Blocks],
  ["system design", Landmark],
];
export function subjectIcon(name) {
  const n = (name || "").toLowerCase();
  return (SUBJECT_ICONS.find(([key]) => n.includes(key)) || [null, BookOpen])[1];
}

function topicHasContent(topic) {
  return !!(topic?.concept?.trim() || topic?.keyPoints?.length || topic?.codeExample?.code?.trim());
}

// ---------------- Top-level screen router ----------------

export function CampusCsCoreTab() {
  const [screen, setScreen] = useState({ view: "list" });

  if (screen.view === "roadmap") {
    return (
      <SubjectRoadmap subjectId={screen.subjectId}
        onBack={() => setScreen({ view: "list" })}
        onOpenTopic={(topicId) => setScreen({ view: "topic", subjectId: screen.subjectId, topicId })} />
    );
  }
  if (screen.view === "topic") {
    return (
      <TopicView subjectId={screen.subjectId} topicId={screen.topicId}
        onBack={() => setScreen({ view: "roadmap", subjectId: screen.subjectId })} />
    );
  }
  return <CsCoreLanding onOpenSubject={(subjectId) => setScreen({ view: "roadmap", subjectId })} />;
}

// ---------------- Landing ----------------

function CsCoreLanding({ onOpenSubject }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState(null);
  const [allProgress, setAllProgress] = useState([]);

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAllUserProgress(user.uid).then(setAllProgress).catch(() => setAllProgress([]));
  }, [user]);

  const progressBySubject = useMemo(() => {
    const map = {};
    allProgress.forEach(p => { map[p.subjectId] = p; });
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
  const subjectsStarted = allProgress.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: CAMPUS.ink }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: CAMPUS.gold }} />
          <span className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.goldTint }}>CS CORE</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Core Computer Science, interview-ready.</h1>
        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
          Operating Systems, DBMS, Networks, and every other core CS subject asked in technical interviews -
          explained practically, not as textbook chapters, with real interview questions and mock tests built in.
        </p>
      </div>

      {continueEntry && (
        <CampusCard hover className="p-4 flex items-center gap-4 cursor-pointer"
          onClick={() => onOpenSubject(continueEntry.subjectId)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <Rocket size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>CONTINUE LEARNING</p>
            <b className="text-[14px]" style={{ color: CAMPUS.ink }}>Pick up where you left off in {continueEntry.subjectId}</b>
          </div>
          <ArrowRight size={16} style={{ color: CAMPUS.inkFaint }} />
        </CampusCard>
      )}

      {recentlyOpened.length > 0 && (
        <div>
          <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>RECENTLY VIEWED</p>
          <div className="flex gap-2.5 flex-wrap">
            {recentlyOpened.map(p => (
              <button key={p.id} onClick={() => onOpenSubject(p.subjectId)}
                className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                {p.subjectId}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenSubject("operating-systems")}>
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap size={16} style={{ color: CAMPUS.blue }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Fundamentals Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>New to core CS? Start with Operating Systems - it underpins almost every other subject here.</p>
        </CampusCard>
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenSubject("dbms")}>
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase size={16} style={{ color: CAMPUS.warn }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Interview Readiness Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>OS, DBMS, Networks and OOP are the four subjects asked in almost every technical interview.</p>
        </CampusCard>
      </div>

      {user && allProgress.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>TOPICS COMPLETED</p>
            <b className="text-2xl" style={{ color: CAMPUS.teal }}>{totalCompleted}</b>
          </CampusCard>
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>SUBJECTS STARTED</p>
            <b className="text-2xl" style={{ color: CAMPUS.purple }}>{subjectsStarted}</b>
          </CampusCard>
        </div>
      )}

      <div>
        <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>CORE SUBJECTS</p>
        {subjects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton height={90} /></CampusCard>)}
          </div>
        ) : subjects.length === 0 ? (
          <CampusEmptyState icon={Cpu} title="No subjects published yet" description="Check back soon - your Training & Placement Cell is setting this up." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <SubjectCard key={subject.id} subject={subject} progress={progressBySubject[subject.id]} onClick={() => onOpenSubject(subject.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, progress, onClick }) {
  const completed = progress?.completedTopicIds?.length || 0;
  const total = subject.topicCount || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const Icon = subjectIcon(subject.name);

  return (
    <CampusCard hover className="p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.line}` }}>
          <Icon size={18} style={{ color: CAMPUS.teal }} />
        </div>
        <div className="min-w-0">
          <b className="text-[14px] block truncate" style={{ color: CAMPUS.ink }}>{subject.name}</b>
          <CampusChip color={DIFF_COLOR[subject.difficulty] || CAMPUS.inkFaint}>{subject.difficulty}</CampusChip>
        </div>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>{subject.placementRelevance}</p>
      <div className="flex items-center gap-3 text-[10.5px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>
        <span className="flex items-center gap-1"><Clock size={11} /> {subject.estimatedDuration}</span>
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

// ---------------- Roadmap ----------------

function SubjectRoadmap({ subjectId, onBack, onOpenTopic }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [openModules, setOpenModules] = useState(new Set());

  useEffect(() => {
    fetchSubject(subjectId).then(setSubject).catch(() => setSubject(null));
    fetchTopics(subjectId).then(list => {
      setTopics(list);
      setOpenModules(new Set([list[0]?.module].filter(Boolean)));
    }).catch(() => setTopics([]));
  }, [subjectId]);

  useEffect(() => {
    if (!user) return;
    fetchSubjectProgress(user.uid, subjectId).then(setProgress).catch(() => setProgress(null));
  }, [user, subjectId]);

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

  if (!subject || topics === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to CS Core" />
        <CampusSkeleton height={200} className="mt-4" />
      </div>
    );
  }

  const completed = completedIds.size;
  const total = topics.length;
  const SubjIcon = subjectIcon(subject.name);

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to CS Core" />
      <div className="mt-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.line}` }}>
            <SubjIcon size={20} style={{ color: CAMPUS.teal }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{subject.name} Roadmap</h1>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{subject.industryUsage}</span>
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
        <CampusEmptyState icon={Cpu} title="Roadmap coming soon" description={`${subject.name}'s topic list is being written - check back soon.`} />
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

function TopicView({ subjectId, topicId, onBack }) {
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [practiceScreen, setPracticeScreen] = useState({ view: "list" });
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    fetchTopic(subjectId, topicId).then(setTopic).catch(() => setTopic(null));
    if (user) {
      markTopicOpened(user.uid, subjectId, topicId).catch(() => {});
      fetchSubjectProgress(user.uid, subjectId).then(p => setAlreadyDone(!!p?.completedTopicIds?.includes(topicId))).catch(() => {});
    }
  }, [subjectId, topicId, user]);

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeTopic({
        uid: user.uid, subjectId, topicId,
        xpReward: topic.xpReward || 25, coinReward: topic.coinReward || 10,
      });
      setJustCompleted(isNew);
      setAlreadyDone(true);
    } finally {
      setCompleting(false);
    }
  };

  if (practiceScreen.view === "problem") {
    return <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })} />;
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
              <ConceptRenderer text={topic.concept} />
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

          {topic.mcqs?.length > 0 && (
            <TopicQuiz mcqs={topic.mcqs} answers={quizAnswers} onAnswer={(i, v) => setQuizAnswers(p => ({ ...p, [i]: v }))}
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

function TopicQuiz({ mcqs, answers, onAnswer, submitted, onSubmit }) {
  const score = mcqs.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);
  return (
    <CampusCard className="p-4">
      <p className="text-[11px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.blue }}>
        <ListChecks size={12} /> QUIZ
      </p>
      <div className="space-y-4">
        {mcqs.map((q, i) => (
          <div key={i}>
            <p className="text-[13px] font-medium mb-2" style={{ color: CAMPUS.ink }}>{i + 1}. {q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const isSelected = answers[i] === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && isSelected && oi !== q.correctIndex;
                return (
                  <button key={oi} disabled={submitted} onClick={() => onAnswer(i, oi)}
                    className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg"
                    style={{
                      background: isCorrect ? CAMPUS.goodTint : isWrong ? CAMPUS.badTint : isSelected ? CAMPUS.tealTint : CAMPUS.paper,
                      border: `1px solid ${isCorrect ? CAMPUS.good : isWrong ? CAMPUS.bad : isSelected ? CAMPUS.teal : CAMPUS.line}`,
                      color: CAMPUS.ink,
                    }}>
                    {opt}
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
