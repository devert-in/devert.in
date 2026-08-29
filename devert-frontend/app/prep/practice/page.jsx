"use client";

// /prep/practice — question-bank grinder (design doc §2).
// Filters (category/difficulty/type) hit Firestore via getQuestions; topic +
// search are client-side over the loaded batch. MCQs open in a modal with
// instant reveal; coding questions open a full-width modal wired to
// CodeRunner. Every answer/test-run logs a prepAttempts record and bumps
// prepProgress. The list itself is public — only attempting requires login.

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PrepShell, TerminalCard, BracketButton, LoadingRows } from "@/components/prep/ui";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES } from "@/lib/prep/constants";
import { getQuestions, getMyAttempts, getProgress, logAttempt, bumpProgress } from "@/lib/prep/db";
import FilterBar from "@/components/prep/practice/FilterBar";
import StatsStrip from "@/components/prep/practice/StatsStrip";
import QuestionList from "@/components/prep/practice/QuestionList";
import McqPracticeModal from "@/components/prep/practice/McqPracticeModal";
import CodingPracticeModal from "@/components/prep/practice/CodingPracticeModal";

const PAGE_SIZE = 30;
const KICKER = "// /prep/practice — question_bank.sh";

function PracticePageInner() {
  const searchParams = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const initialCategory = CATEGORIES.some((c) => c.id === requestedCategory) ? requestedCategory : "all";

  const { user, profile } = useAuth();

  // ── server-side filters ───────────────────────────────────────────────
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState("all");
  const [type, setType] = useState("all");
  const [max, setMax] = useState(PAGE_SIZE);

  // ── client-side filters (over the loaded batch) ───────────────────────
  const [topic, setTopic] = useState("all");
  const [search, setSearch] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const [attemptsMap, setAttemptsMap] = useState({});
  const [progress, setProgress] = useState(null);

  const [activeQuestion, setActiveQuestion] = useState(null);
  const [modalKind, setModalKind] = useState(null); // 'mcq' | 'coding' | null
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);

  // Fetch questions whenever a server-side filter or the page size changes.
  useEffect(() => {
    let cancelled = false;
    // Fetch-on-mount/filter-change: loading flags must flip synchronously
    // before the async Firestore read kicks off.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(max === PAGE_SIZE);
    setLoadingMore(max > PAGE_SIZE);
    setError("");
    getQuestions({
      category: category !== "all" ? category : undefined,
      difficulty: difficulty !== "all" ? difficulty : undefined,
      type: type !== "all" ? type : undefined,
      max,
    })
      .then((rows) => {
        if (cancelled) return;
        setQuestions(rows || []);
        setHasMore((rows || []).length >= max);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load questions");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [category, difficulty, type, max]);

  // Attempt history + progress — fetched once per signed-in user.
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived state on sign-out
      setAttemptsMap({});
      setProgress(null);
      return undefined;
    }
    let cancelled = false;
    getMyAttempts(user.uid, { max: 500 })
      .then((records) => {
        if (cancelled) return;
        const map = {};
        for (const r of records || []) {
          const cur = map[r.qid] || { attempted: false, correct: false };
          cur.attempted = true;
          if (r.correct) cur.correct = true;
          map[r.qid] = cur;
        }
        setAttemptsMap(map);
      })
      .catch(() => {});
    getProgress(user.uid)
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Topic set is only meaningful for the currently-loaded batch, so reset the
  // topic filter whenever a server-side filter changes the batch underneath it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets a filter derived from a previous batch
    setTopic("all");
  }, [category, difficulty, type]);

  const topics = useMemo(() => {
    const set = new Set();
    for (const q of questions) if (q.topic) set.add(q.topic);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (topic !== "all" && q.topic !== topic) return false;
      if (term) {
        const hay = `${q.prompt || ""} ${q.topic || ""} ${(q.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [questions, topic, search]);

  const handleCategoryChange = useCallback((id) => {
    setCategory(id);
    setMax(PAGE_SIZE);
  }, []);
  const handleDifficultyChange = useCallback((id) => {
    setDifficulty(id);
    setMax(PAGE_SIZE);
  }, []);
  const handleTypeChange = useCallback((id) => {
    setType(id);
    setMax(PAGE_SIZE);
  }, []);

  const handleAttemptLogged = useCallback(({ qid, correct, category: cat }) => {
    setAttemptsMap((prev) => ({
      ...prev,
      [qid]: { attempted: true, correct: prev[qid]?.correct || correct },
    }));
    setProgress((prev) => {
      const prevStats = (prev && prev.categoryStats && prev.categoryStats[cat]) || { attempted: 0, correct: 0 };
      return {
        ...(prev || {}),
        totalSolved: (prev?.totalSolved || 0) + (correct ? 1 : 0),
        categoryStats: {
          ...(prev?.categoryStats || {}),
          [cat]: {
            attempted: (prevStats.attempted || 0) + 1,
            correct: (prevStats.correct || 0) + (correct ? 1 : 0),
          },
        },
      };
    });
  }, []);

  const recordAttempt = useCallback(
    async (q, correct, extra = {}) => {
      if (!user || !q) return;
      try {
        await logAttempt(user.uid, {
          qid: q.id,
          category: q.category,
          topic: q.topic || "",
          difficulty: q.difficulty,
          correct,
          source: "practice",
          ...(extra.lang ? { lang: extra.lang } : {}),
        });
        await bumpProgress(user.uid, {
          category: q.category,
          correct,
          rollNumber: profile?.rollNumber,
          classGroup: profile?.classGroup,
        });
        handleAttemptLogged({ qid: q.id, correct, category: q.category });
      } catch {
        // Non-fatal: the reveal / test results already happened locally, so
        // practice still works even if the background logging call fails.
      }
    },
    [user, profile, handleAttemptLogged]
  );

  const openQuestion = useCallback((q) => {
    if (!q) return;
    setActiveQuestion(q);
    setModalKind(q.type === "coding" ? "coding" : "mcq");
    setChosen(null);
    setRevealed(false);
  }, []);

  const closeModal = useCallback(() => {
    setActiveQuestion(null);
    setModalKind(null);
  }, []);

  const handleChoose = useCallback(
    (i) => {
      if (revealed || !activeQuestion) return;
      setChosen(i);
      setRevealed(true);
      recordAttempt(activeQuestion, i === activeQuestion.correctIndex);
    },
    [revealed, activeQuestion, recordAttempt]
  );

  const handleCodeResult = useCallback(
    (languageId, _code, summary) => {
      if (!activeQuestion) return;
      const total = summary?.total || 0;
      const passed = summary?.passed || 0;
      recordAttempt(activeQuestion, total > 0 && passed === total, { lang: languageId });
    },
    [activeQuestion, recordAttempt]
  );

  const handleNextRandom = useCallback(() => {
    if (!activeQuestion) return;
    const pool = filteredQuestions.filter((q) => q.id !== activeQuestion.id);
    const unanswered = pool.filter((q) => !attemptsMap[q.id]?.attempted);
    const candidates = unanswered.length ? unanswered : pool;
    if (!candidates.length) {
      closeModal();
      return;
    }
    openQuestion(candidates[Math.floor(Math.random() * candidates.length)]);
  }, [activeQuestion, filteredQuestions, attemptsMap, openQuestion, closeModal]);

  return (
    <>
      <PrepShell
        kicker={KICKER}
        title="QUESTION"
        accent="BANK"
        subtitle="Filter, drill, and track every attempt across aptitude, reasoning, DSA, and code."
      >
        <StatsStrip progress={progress} category={category} loggedIn={!!user} />

        <div className="mt-8">
          <FilterBar
            category={category}
            onCategoryChange={handleCategoryChange}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            type={type}
            onTypeChange={handleTypeChange}
            topic={topic}
            onTopicChange={setTopic}
            topics={topics}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        <div className="mt-6">
          <TerminalCard filename="questions.list" delay={0.1}>
            {error && (
              <div className="mb-4 rounded border border-[#FF3B3B]/30 bg-[#FF3B3B]/5 px-4 py-3 font-mono text-xs text-[#FF3B3B]">
                {error}
              </div>
            )}
            {loading ? (
              <LoadingRows rows={8} />
            ) : (
              <>
                <QuestionList questions={filteredQuestions} attemptsMap={attemptsMap} onSelect={openQuestion} />
                {filteredQuestions.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 flex-wrap gap-3">
                    <p className="font-mono text-[10px] text-white/25 tracking-wider">
                      SHOWING {filteredQuestions.length} OF {questions.length} LOADED
                    </p>
                    {hasMore && (
                      <BracketButton
                        variant="ghost"
                        size="sm"
                        loading={loadingMore}
                        loadingText="LOADING"
                        onClick={() => setMax((m) => m + PAGE_SIZE)}
                      >
                        LOAD_MORE
                      </BracketButton>
                    )}
                  </div>
                )}
              </>
            )}
          </TerminalCard>
        </div>
      </PrepShell>

      <McqPracticeModal
        open={modalKind === "mcq"}
        question={activeQuestion}
        user={user}
        chosen={chosen}
        revealed={revealed}
        onChoose={handleChoose}
        onNext={handleNextRandom}
        onClose={closeModal}
      />
      <CodingPracticeModal
        open={modalKind === "coding"}
        question={activeQuestion}
        user={user}
        onResult={handleCodeResult}
        onNext={handleNextRandom}
        onClose={closeModal}
      />
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <PrepShell kicker={KICKER} title="QUESTION" accent="BANK">
          <LoadingRows rows={6} />
        </PrepShell>
      }
    >
      <PracticePageInner />
    </Suspense>
  );
}
