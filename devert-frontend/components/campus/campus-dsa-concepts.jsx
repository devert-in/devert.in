"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen, Lock, CheckCircle2, Circle, ArrowRight, Clock, Trophy, Coins,
  ListChecks, Target, PlayCircle, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  fetchConceptTracks, fetchConcepts, fetchConcept, fetchConceptProgress,
  markConceptOpened, completeConcept, isConceptUnlocked, missingPrerequisites,
  conceptSummary, relatedProblemsForConcept,
} from "@/lib/dsaConcepts";
import { fetchPublishedProblems } from "@/lib/codelab";
import {
  CampusCard, CampusChip, CampusButton, CampusEmptyState, CampusSkeleton,
  CampusBreadcrumb, CampusProgressBar,
} from "@/components/campus/campus-ui";
import { LessonBody, CodeExampleBlock } from "@/components/campus/lesson-blocks";
import { LanguageLogo } from "@/components/campus/language-logo";
import { ConceptVisualization } from "@/components/campus/dsa-concept-viz";
import { useCampusBackHandler } from "@/lib/campusNav";

// DSA Concepts - the bridge surface between Programming (syntax) and DSA
// Practice (problems). Lives INSIDE the existing DSA module as a sub-view
// rather than as a new top-level nav entry, per CLAUDE.md: a new capability
// extends an existing route.
//
// Three screens, same shape as the Programming module's language -> roadmap ->
// topic flow (deliberately, so the two feel like one product): pick a language,
// walk a prerequisite-gated roadmap, then read one concept end to end.
//
// The lesson body renders through the SHARED lesson format (lib/lessonBlocks.js
// + lesson-blocks.jsx), which already supports story/analogy/mistake/interview/
// revision/checkpoint/flow/table fences and a runnable Monaco code block. So
// almost all of the "story-driven, interactive lesson" surface is authored
// content here, not bespoke components - the one genuinely new visual is
// ConceptVisualization.

export function CampusDsaConcepts({ onOpenProblem }) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState(null); // null = loading
  const [screen, setScreen] = useState({ view: "languages" });

  useEffect(() => {
    fetchConceptTracks().then(setTracks).catch(() => setTracks([]));
  }, []);

  useCampusBackHandler(3, screen.view !== "languages", () => {
    setScreen(s => (s.view === "concept" ? { view: "roadmap", langId: s.langId } : { view: "languages" }));
  });

  if (tracks === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;

  if (tracks.length === 0) {
    return (
      <CampusEmptyState icon={BookOpen} title="DSA Concepts is being authored"
        description="Curated, language-specific concept roadmaps land here. Practice problems are already available on the Problems tab." />
    );
  }

  if (screen.view === "concept") {
    return (
      <ConceptView key={`${screen.langId}:${screen.conceptId}`}
        langId={screen.langId} conceptId={screen.conceptId} user={user} onOpenProblem={onOpenProblem}
        onBack={() => setScreen({ view: "roadmap", langId: screen.langId })} />
    );
  }
  if (screen.view === "roadmap") {
    return (
      <ConceptRoadmap key={screen.langId} langId={screen.langId} user={user}
        track={tracks.find(t => t.id === screen.langId)}
        onOpenConcept={conceptId => setScreen({ view: "concept", langId: screen.langId, conceptId })}
        onBack={() => setScreen({ view: "languages" })} />
    );
  }

  return <LanguagePicker tracks={tracks} user={user} onPick={langId => setScreen({ view: "roadmap", langId })} />;
}

// ---------------- Language picker ----------------

function LanguagePicker({ tracks, user, onPick }) {
  const [summaries, setSummaries] = useState({});

  // One read per track, and only the concept LIST (not bodies) - the card just
  // needs "7/24". Fired in parallel; a failure leaves that card without a
  // figure rather than blocking the whole picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(tracks.map(async t => {
        try {
          const [concepts, progress] = await Promise.all([
            fetchConcepts(t.id),
            user ? fetchConceptProgress(user.uid, t.id) : Promise.resolve(null),
          ]);
          return [t.id, conceptSummary(concepts, progress)];
        } catch { return [t.id, null]; }
      }));
      if (!cancelled) setSummaries(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [tracks, user]);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Choose your language</h3>
        <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
          Every concept is taught with implementations, idioms and interview notes for the language you pick &mdash;
          not generic pseudocode.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tracks.map(track => {
          const s = summaries[track.id];
          return (
            <button key={track.id} onClick={() => onPick(track.id)} className="text-left">
              <CampusCard hover className="p-5 h-full flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                    <LanguageLogo name={track.label} size={22} />
                  </div>
                  <div className="min-w-0">
                    <b className="block text-[14.5px]" style={{ color: CAMPUS.ink }}>{track.label}</b>
                    <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                      {s ? `${s.completed}/${s.total} concepts` : "DSA roadmap"}
                    </span>
                  </div>
                </div>
                {s && s.total > 0 && <CampusProgressBar pct={s.percentComplete} />}
                <span className="flex items-center gap-1 text-[12px] font-semibold mt-auto" style={{ color: CAMPUS.teal }}>
                  {s?.completed ? "Continue" : "Start learning"} <ArrowRight size={13} />
                </span>
              </CampusCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Roadmap ----------------

function ConceptRoadmap({ langId, track, user, onOpenConcept, onBack }) {
  const [concepts, setConcepts] = useState(null);
  const [progress, setProgress] = useState(null);

  const load = useCallback(() => {
    fetchConcepts(langId).then(setConcepts).catch(() => setConcepts([]));
    if (user) fetchConceptProgress(user.uid, langId).then(setProgress).catch(() => setProgress(null));
  }, [langId, user]);
  useEffect(load, [load]);

  const completedIds = progress?.completedConceptIds || [];
  const summary = useMemo(() => conceptSummary(concepts || [], progress), [concepts, progress]);

  if (concepts === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={220} /></CampusCard>;

  return (
    <div>
      <CampusBreadcrumb items={[{ label: "DSA Concepts", onClick: onBack }, { label: track?.label || langId }]} />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <LanguageLogo name={track?.label || langId} size={26} />
          <div>
            <h3 className="text-[16px] font-semibold" style={{ color: CAMPUS.ink }}>{track?.label} DSA Roadmap</h3>
            <span className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              {summary.completed} of {summary.total} concepts complete
            </span>
          </div>
        </div>
        <div className="w-full sm:w-48"><CampusProgressBar pct={summary.percentComplete} /></div>
      </div>

      {concepts.length === 0 ? (
        <CampusEmptyState icon={BookOpen} title="No concepts published yet"
          description="This language's roadmap is still being authored." />
      ) : (
        <div className="space-y-2">
          {concepts.map((c, i) => {
            const done = completedIds.includes(c.id);
            const unlocked = isConceptUnlocked(c, completedIds);
            const blockers = unlocked ? [] : missingPrerequisites(c, concepts, completedIds);
            return (
              <ConceptRow key={c.id} index={i} concept={c} done={done} unlocked={unlocked}
                blockers={blockers} onOpen={() => onOpenConcept(c.id)} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConceptRow({ index, concept, done, unlocked, blockers, onOpen }) {
  const StatusIcon = done ? CheckCircle2 : unlocked ? Circle : Lock;
  const statusColor = done ? CAMPUS.good : unlocked ? CAMPUS.teal : CAMPUS.inkFaint;

  // A locked row is still a button, deliberately: tapping it explains WHY it's
  // locked (and the prerequisite is named), rather than being an inert element
  // that appears broken. It just doesn't navigate.
  return (
    <button onClick={unlocked ? onOpen : undefined} className="w-full text-left"
      aria-disabled={!unlocked}>
      <CampusCard hover={unlocked} className="p-4 flex items-center gap-3"
        style={unlocked ? undefined : { opacity: 0.72 }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] font-mono w-5 text-right" style={{ color: CAMPUS.inkFaint }}>{index + 1}</span>
          <StatusIcon size={18} style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{concept.title}</b>
            {concept.difficulty && <CampusChip color={CAMPUS.inkFaint}>{concept.difficulty}</CampusChip>}
            {concept.visualization && <CampusChip color={CAMPUS.purple} icon={PlayCircle}>Animated</CampusChip>}
          </div>
          {concept.subtitle && (
            <p className="text-[12px] mt-0.5 truncate" style={{ color: CAMPUS.inkSoft }}>{concept.subtitle}</p>
          )}
          {!unlocked && blockers.length > 0 && (
            <p className="text-[11.5px] mt-1" style={{ color: CAMPUS.warn }}>
              Finish {blockers.map(b => b.title).join(", ")} first
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {concept.estimatedMinutes && (
            <span className="hidden sm:flex items-center gap-1 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
              <Clock size={11} /> {concept.estimatedMinutes}m
            </span>
          )}
          {unlocked && <ArrowRight size={14} style={{ color: CAMPUS.teal }} />}
        </div>
      </CampusCard>
    </button>
  );
}

// ---------------- Concept view ----------------

function ConceptView({ langId, conceptId, user, onBack, onOpenProblem }) {
  const [concept, setConcept] = useState(undefined); // undefined = loading, null = missing
  const [problems, setProblems] = useState([]);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchConcept(langId, conceptId).then(setConcept).catch(() => setConcept(null));
    // Whole published problem set, once per concept screen - the related-problems
    // section derives its list from each problem's own `category`, so there is no
    // per-concept query to make (and no duplicated tag data to keep in sync).
    fetchPublishedProblems().then(setProblems).catch(() => setProblems([]));
    if (user) {
      markConceptOpened(user.uid, langId, conceptId).catch(() => {});
      fetchConceptProgress(user.uid, langId)
        .then(p => setAlreadyDone(!!p?.completedConceptIds?.includes(conceptId)))
        .catch(() => {});
    }
  }, [langId, conceptId, user]);

  const related = useMemo(() => relatedProblemsForConcept(concept, problems), [concept, problems]);
  // Memoised so the `score` useMemo below has a stable dependency - a fresh []
  // fallback identity each render would re-grade on every keystroke elsewhere.
  const quiz = useMemo(() => concept?.quiz || [], [concept]);

  const score = useMemo(() => {
    if (!graded) return null;
    const correct = quiz.filter(q => (q.correctOptionIds || []).includes(answers[q.question])).length;
    return { correct, total: quiz.length, passed: quiz.length === 0 || correct / quiz.length >= 0.6 };
  }, [graded, quiz, answers]);

  if (concept === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={320} /></CampusCard>;
  if (concept === null) {
    return <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Concept not found"
      description="It may have been unpublished." action={<CampusButton onClick={onBack}>Back to roadmap</CampusButton>} />;
  }

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true); setSaveError("");
    try {
      await completeConcept({
        uid: user.uid, langId, conceptId,
        xpReward: concept.xpReward || 0, coinReward: concept.coinReward || 0,
      });
      setAlreadyDone(true);
    } catch (e) {
      setSaveError(e?.message || "Could not save your progress. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <CampusBreadcrumb items={[{ label: "Roadmap", onClick: onBack }, { label: concept.title }]} />

      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>{concept.title}</h2>
          {concept.subtitle && <p className="text-[13px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{concept.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {alreadyDone && <CampusChip color={CAMPUS.good} icon={CheckCircle2}>Completed</CampusChip>}
          {concept.xpReward ? <CampusChip color={CAMPUS.teal} icon={Trophy}>{concept.xpReward} XP</CampusChip> : null}
          {concept.coinReward ? <CampusChip color={CAMPUS.warn} icon={Coins}>{concept.coinReward}</CampusChip> : null}
        </div>
      </div>

      {/* Watch section - rendered ONLY when a video exists, so a concept without
          one has a clean layout rather than an empty player. A future DeVert-
          hosted video replaces this URL with no layout change. */}
      {concept.videoUrl && (
        <a href={concept.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3">
          <CampusButton variant="secondary" icon={PlayCircle}>Watch explanation</CampusButton>
        </a>
      )}

      <div className="mt-4 space-y-4">
        {concept.concept && <LessonBody text={concept.concept} />}

        <ConceptVisualization visualization={concept.visualization} />

        {concept.codeExample?.code && (
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>
              IMPLEMENTATION &mdash; EDIT AND RUN IT
            </p>
            <CodeExampleBlock codeExample={concept.codeExample} />
          </div>
        )}

        <RelatedProblems related={related} onOpenProblem={onOpenProblem} />

        {quiz.length > 0 && (
          <ConceptQuiz quiz={quiz} answers={answers} graded={graded} score={score}
            onAnswer={(q, optionId) => setAnswers(a => ({ ...a, [q]: optionId }))}
            onSubmit={() => setGraded(true)}
            onRetry={() => { setGraded(false); setAnswers({}); }} />
        )}

        {/* Completion is gated on passing the assessment, per the spec - but a
            concept with no quiz authored yet stays completable, so the gate can
            never strand a learner on unfinished content. */}
        <CampusCard className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <b className="block text-[13.5px]" style={{ color: CAMPUS.ink }}>
              {alreadyDone ? "You've completed this concept" : "Mark this concept complete"}
            </b>
            <span className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              {alreadyDone
                ? "Its rewards are already banked - revisiting it is free."
                : quiz.length === 0
                  ? "Unlocks the next concept in the roadmap."
                  : score?.passed
                    ? "Assessment passed - unlocks the next concept."
                    : `Pass the assessment above (60%) to unlock the next concept.`}
            </span>
            {saveError && <span className="block text-[12px] mt-1" style={{ color: CAMPUS.bad }}>{saveError}</span>}
          </div>
          <CampusButton icon={CheckCircle2} onClick={handleComplete}
            disabled={alreadyDone || saving || !user || (quiz.length > 0 && !score?.passed)}>
            {alreadyDone ? "Completed" : saving ? "Saving..." : "Complete"}
          </CampusButton>
        </CampusCard>
      </div>
    </div>
  );
}

function RelatedProblems({ related, onOpenProblem }) {
  if (!related || related.total === 0) return null;
  return (
    <CampusCard className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Target size={14} style={{ color: CAMPUS.teal }} />
        <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Practise this concept</b>
      </div>
      <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkFaint }}>
        {related.total} problem{related.total === 1 ? "" : "s"} from DSA Practice, matched to this concept.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {["Easy", "Medium", "Hard"].map(level => (
          <div key={level}>
            <p className="text-[10px] font-mono tracking-widest mb-1.5"
              style={{ color: level === "Easy" ? CAMPUS.good : level === "Medium" ? CAMPUS.warn : CAMPUS.bad }}>
              {level.toUpperCase()} &middot; {related[level].length}
            </p>
            <div className="space-y-1">
              {related[level].length === 0 ? (
                <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>None yet</span>
              ) : related[level].map(p => (
                <button key={p.id} onClick={() => onOpenProblem?.(p.id)}
                  className="block w-full text-left text-[12px] py-1 truncate hover:underline"
                  style={{ color: CAMPUS.teal }}>
                  {p.number ? `${p.number}. ` : ""}{p.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CampusCard>
  );
}

function ConceptQuiz({ quiz, answers, graded, score, onAnswer, onSubmit, onRetry }) {
  const allAnswered = quiz.every(q => answers[q.question]);
  return (
    <CampusCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={14} style={{ color: CAMPUS.purple }} />
        <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Assessment</b>
        {graded && score && (
          <CampusChip color={score.passed ? CAMPUS.good : CAMPUS.bad}>
            {score.correct}/{score.total}
          </CampusChip>
        )}
      </div>

      <div className="space-y-4">
        {quiz.map((q, qi) => {
          const chosen = answers[q.question];
          const correctIds = q.correctOptionIds || [];
          return (
            <div key={q.question}>
              <p className="text-[13px] mb-2" style={{ color: CAMPUS.ink }}>
                <span className="font-mono text-[11px] mr-1.5" style={{ color: CAMPUS.inkFaint }}>Q{qi + 1}</span>
                {q.question}
              </p>
              <div className="space-y-1.5">
                {(q.options || []).map(opt => {
                  const isChosen = chosen === opt.id;
                  const isCorrect = correctIds.includes(opt.id);
                  // Post-grading, always reveal the right answer - a wrong pick
                  // with no correction teaches nothing.
                  const border = graded
                    ? (isCorrect ? CAMPUS.good : isChosen ? CAMPUS.bad : CAMPUS.line)
                    : (isChosen ? CAMPUS.teal : CAMPUS.line);
                  return (
                    <button key={opt.id} disabled={graded} onClick={() => onAnswer(q.question, opt.id)}
                      className="block w-full text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors disabled:cursor-default"
                      style={{ border: `1px solid ${border}`, color: CAMPUS.ink, background: "transparent" }}>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
              {graded && q.explanation && (
                <p className="text-[12px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        {!graded ? (
          <CampusButton onClick={onSubmit} disabled={!allAnswered}>
            {allAnswered ? "Submit answers" : `Answer all ${quiz.length} questions`}
          </CampusButton>
        ) : !score?.passed ? (
          <CampusButton variant="secondary" onClick={onRetry}>Try again</CampusButton>
        ) : null}
      </div>
    </CampusCard>
  );
}
