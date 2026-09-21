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
  conceptSummary, relatedProblemsForConcept, conceptLanguages, conceptVariant,
  DSA_TRACK_ID,
} from "@/lib/dsaConcepts";
import { fetchPublishedProblems } from "@/lib/codelab";
import {
  CampusCard, CampusChip, CampusButton, CampusEmptyState, CampusSkeleton,
  CampusBreadcrumb, CampusProgressBar, CampusTabBar, LessonNavFooter,
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
        description="The curated concept roadmap lands here. Practice problems are already available on the Problems tab." />
    );
  }

  // With ONE language-agnostic track (see lib/dsaConcepts.js's DSA_TRACK_ID),
  // the language picker is a screen with a single card that decides nothing, and
  // an extra tap and an extra breadcrumb level for every learner. So it is
  // skipped entirely and the roadmap IS the landing screen. The picker component
  // is still rendered when more than one track is published, which keeps the
  // archived java/python tracks (and any future parallel track) reachable
  // without a code change.
  if (tracks.length === 1 && screen.view === "languages") {
    return (
      <ConceptRoadmap key={tracks[0].id} langId={tracks[0].id} user={user} track={tracks[0]}
        onOpenConcept={conceptId => setScreen({ view: "concept", langId: tracks[0].id, conceptId })}
        onBack={null} />
    );
  }

  if (screen.view === "concept") {
    return (
      <ConceptView key={`${screen.langId}:${screen.conceptId}`}
        langId={screen.langId} conceptId={screen.conceptId} user={user} onOpenProblem={onOpenProblem}
        onOpenConcept={conceptId => setScreen({ view: "concept", langId: screen.langId, conceptId })}
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
  // userData (not the `user` prop, which is the auth record) carries the live
  // profile doc, where the admin-set fullAccess flag lives.
  const { userData } = useAuth();
  const fullAccess = !!userData?.fullAccess;
  const [concepts, setConcepts] = useState(null);
  const [progress, setProgress] = useState(null);

  const load = useCallback(() => {
    fetchConcepts(langId).then(setConcepts).catch(() => setConcepts([]));
    if (user) fetchConceptProgress(user.uid, langId).then(setProgress).catch(() => setProgress(null));
  }, [langId, user]);
  useEffect(load, [load]);

  const completedIds = progress?.completedConceptIds || [];
  // The ids that actually exist in this track, so an unknown prerequisite is
  // ignored rather than becoming a permanent lock.
  const knownIds = useMemo(() => new Set((concepts || []).map(c => c.id)), [concepts]);
  const summary = useMemo(() => conceptSummary(concepts || [], progress), [concepts, progress]);
  // The unified roadmap's id (DSA_TRACK_ID) is not a language. Any other track
  // id still is (the archived java/python ones, or a future parallel track), so
  // the language logo and "<Lang> DSA Roadmap" heading stay correct for those.
  const isLanguageTrack = langId !== DSA_TRACK_ID;

  if (concepts === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={220} /></CampusCard>;

  return (
    <div>
      {/* One crumb when this IS the landing screen (single unified track, no
          picker above it) - a "DSA Concepts > DSA Concepts" trail names the same
          place twice and the first crumb would link nowhere. CampusBreadcrumb
          drops falsy labels, so the filter is enough. */}
      <CampusBreadcrumb items={[
        onBack ? { label: "DSA Concepts", onClick: onBack } : null,
        { label: onBack ? (track?.label || langId) : "DSA Concepts" },
      ].filter(Boolean)} />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* LanguageLogo only where the track IS a language. The unified track
              is language-agnostic, so a brand mark would be actively wrong -
              Lucide, per CLAUDE.md's icon rule. */}
          {isLanguageTrack ? <LanguageLogo name={track?.label || langId} size={26} /> : <ListChecks size={22} style={{ color: CAMPUS.teal }} />}
          <div>
            <h3 className="text-[16px] font-semibold" style={{ color: CAMPUS.ink }}>
              {isLanguageTrack ? `${track?.label} DSA Roadmap` : "DSA Concepts"}
            </h3>
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
            // knownIds so a prerequisite naming an unpublished concept can't
            // dead-end the lesson, and fullAccess so a flagged account skips
            // the chain entirely - see isConceptUnlocked's own comments.
            const unlocked = isConceptUnlocked(c, completedIds, knownIds, { fullAccess });
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

const LANG_LABEL = { java: "Java", python: "Python", cpp: "C++", javascript: "JavaScript", c: "C" };

// The per-concept language switcher.
//
// The roadmap itself is language-agnostic - "Arrays" is a concept, not a Java
// concept - so there is deliberately NO global language choice any more. Instead
// each concept declares its own `languageVariants`, and this renders a switcher
// ONLY for the concepts that actually have language-specific content. A concept
// with none (Arrays) shows no language chrome at all, which is the whole point:
// the learner is never asked to pick a language to read an idea that doesn't
// depend on one.
//
// Language choice is local state per concept rather than a global preference.
// Persisting it would mean writing a preference doc for something a learner
// changes casually to compare two implementations side by side, which is a
// reason to keep it cheap, not to store it.
function ConceptLanguageSection({ concept }) {
  const languages = conceptLanguages(concept);
  const [lang, setLang] = useState(languages[0] || null);
  const active = lang && languages.includes(lang) ? lang : languages[0];
  const variant = conceptVariant(concept, active);

  if (languages.length === 0 || !variant) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
          IMPLEMENTATION &mdash; EDIT AND RUN IT
        </p>
        {/* Only rendered when there is more than one language to choose between -
            a one-tab switcher is chrome that decides nothing. */}
        {languages.length > 1 && (
          <CampusTabBar size="sm" value={active} onChange={setLang}
            tabs={languages.map(l => ({ key: l, label: LANG_LABEL[l] || l }))} />
        )}
      </div>

      {variant.code && (
        <CodeExampleBlock codeExample={{ language: variant.language, code: variant.code }} />
      )}

      {/* The "Java specifics" / "Python specifics" prose that used to be baked
          into a duplicated copy of the whole lesson body. Authored in the same
          lessonBlocks format as the shared body, so ::: tip fences render
          identically here. */}
      {variant.notes && (
        <div className="mt-3">
          <LessonBody text={variant.notes} />
        </div>
      )}
    </div>
  );
}

function ConceptView({ langId, conceptId, user, onBack, onOpenProblem, onOpenConcept }) {
  const [concept, setConcept] = useState(undefined); // undefined = loading, null = missing
  const [siblings, setSiblings] = useState([]);
  const [problems, setProblems] = useState([]);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchConcept(langId, conceptId).then(setConcept).catch(() => setConcept(null));
    // Sibling list drives the prev/next footer below. Same published +
    // audience-filtered, `order`-sorted query ConceptRoadmap renders from, so
    // the footer walks concepts in exactly the order the roadmap shows them.
    fetchConcepts(langId).then(setSiblings).catch(() => setSiblings([]));
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
  // Same Easy->Medium->Hard order RelatedProblems below visually renders in,
  // flattened once into an id order.
  const relatedOrder = useMemo(() => [...related.Easy, ...related.Medium, ...related.Hard].map(p => p.id), [related]);
  // Wraps onOpenProblem so RelatedProblems can keep calling it with just an
  // id, while campus-app.jsx's onOpenProblem gets the WHOLE related-problems
  // order as a second argument. Same fix/reasoning as campus-dsa-sheet.jsx's
  // identical openProblemWithContext (passing the whole order, not just one
  // next id, is what lets repeated "Next Problem" clicks keep following it) -
  // without this, CampusProblemView's "Next Problem" falls back to its
  // contextless global-catalog sort, which can drop a student into an
  // unrelated concept's problem instead of the next one here.
  const openProblemWithContext = useCallback((id) => {
    onOpenProblem?.(id, relatedOrder);
  }, [onOpenProblem, relatedOrder]);
  // Linear prev/next over the sibling list. DSA Concepts is a FLAT ordered
  // roadmap (no module grouping, unlike CS Core/Programming), so there is no
  // crossesModule case to handle - every step is a plain topic-to-topic move.
  // While siblings is still loading, findIndex returns -1 and both neighbours
  // stay null, so the footer renders nothing rather than flashing a wrong one.
  const neighbours = useMemo(() => {
    const i = siblings.findIndex(c => c.id === conceptId);
    if (i === -1) return { prev: null, next: null, isLast: false };
    return { prev: siblings[i - 1] || null, next: siblings[i + 1] || null, isLast: i === siblings.length - 1 };
  }, [siblings, conceptId]);

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

        <ConceptLanguageSection concept={concept} />

        <RelatedProblems related={related} onOpenProblem={openProblemWithContext} />

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

        {/* The way forward. Without this the only exit from a finished concept
            was the breadcrumb back to the roadmap - even though the Complete
            button's own copy promises it "unlocks the next concept". Shown
            regardless of alreadyDone, matching CS Core's identical footer:
            this roadmap is attempt-based, not gated, so there is no reason to
            also gate navigation on having completed anything. */}
        <LessonNavFooter
          prev={neighbours.prev ? { id: neighbours.prev.id, title: neighbours.prev.title } : null}
          next={neighbours.next ? { id: neighbours.next.id, title: neighbours.next.title } : null}
          done={neighbours.isLast}
          onOpenTopic={id => onOpenConcept?.(id)}
          onBack={onBack}
          endTitle="You've reached the end of the DSA Concepts roadmap"
          endBody="Head back to the roadmap to revisit any concept, or put these to work on the Problems tab."
        />
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
