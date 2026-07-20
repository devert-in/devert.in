"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2, XCircle, Bookmark, BookmarkCheck, ExternalLink, Clock,
  ChevronRight, ListChecks, Briefcase, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublishedCompanies, fetchCompany, fetchCompanyRounds, fetchRoundCategories,
  fetchCategoryQuestions, fetchUserCompanyPrepProgress, markCompanyQuestionSolved,
  setCompanyQuestionBookmarked, recordCompanyQuestionAttempt, companyQuestionStats,
  COMPANY_QUESTION_DIFFICULTIES,
} from "@/lib/companyPrep";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusBreadcrumb, CampusEmptyState, CampusSkeleton } from "@/components/campus/campus-ui";
import Dropdown from "@/components/dropdown";

// Native port of the "Company Learning Tree" - Company -> Round -> Category
// -> Question, browsed and practiced entirely inside Campus. No sign-in wall
// (unlike Contests/CodeLab elsewhere in Campus) - anonymous practicing works
// end to end, since checking an answer is a pure client-side comparison
// against correctIndex; only progress persistence (solved/bookmarked) and the
// global attempt-stat bump need a signed-in uid, both gated behind `if
// (user)` rather than blocking the whole flow. Rounded vs sharp comes
// entirely from the .campus-sharp ancestor class (see globals.css) already
// established for CampusContestFlow/CampusPracticeList - nothing here needs
// its own sharp-awareness.

const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

// ---------------- List ----------------

// `adminMode`/`hiddenIds`/`onToggleHidden`: same pattern as
// CampusPracticeList - Manage's Company Prep screen reuses this exact list
// so a campus admin can hide a company from THEIR institution's students
// without touching the global `companies` collection at all.
export function CampusCompanyList({ onSelect, adminMode = false, hiddenIds, onToggleHidden }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublishedCompanies().then(setCompanies).catch(console.error).finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const visible = adminMode ? companies : companies.filter(c => !hiddenIds?.has(c.id));
  const filtered = q ? visible.filter(c => c.name?.toLowerCase().includes(q)) : visible;

  return (
    <div>
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
          className="w-full text-[13px] px-4 py-2.5 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <CampusCard key={i} className="p-4 space-y-2">
              <CampusSkeleton variant="rect" width={36} height={36} />
              <CampusSkeleton variant="text" width="60%" />
            </CampusCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <CampusEmptyState icon={Briefcase} title={q ? "No company matches" : "No companies published yet"}
          description={q ? "Try a different search." : "Check back soon."} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(c => {
            const hidden = adminMode && hiddenIds?.has(c.id);
            return (
            <div key={c.id} className="relative">
            <button onClick={() => onSelect(c.id)} className="text-left w-full">
              <CampusCard hover className="p-4 h-full" style={hidden ? { opacity: 0.5 } : undefined}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[13px] flex-shrink-0" style={{ background: CAMPUS.teal, color: "#fff" }}>
                    {c.name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="block text-[14px] truncate" style={{ color: CAMPUS.ink }}>{c.name}</b>
                    {c.ctc && <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{c.ctc}</span>}
                  </div>
                  {hidden && <CampusChip color={CAMPUS.bad} icon={EyeOff}>HIDDEN</CampusChip>}
                  {!hidden && c.difficulty && <CampusChip color={DIFF_COLOR[c.difficulty] || CAMPUS.good}>{c.difficulty}</CampusChip>}
                </div>
                {c.description && <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: CAMPUS.inkSoft }}>{c.description}</p>}
              </CampusCard>
            </button>
            {adminMode && (
              <button onClick={(e) => { e.stopPropagation(); onToggleHidden(c.id, !hidden); }}
                className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
                style={{ color: hidden ? CAMPUS.good : CAMPUS.bad, background: hidden ? CAMPUS.goodTint : CAMPUS.badTint }}>
                {hidden ? <><Eye size={10} /> unhide</> : <><EyeOff size={10} /> hide</>}
              </button>
            )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Company overview -> round -> category picker ----------------

export function CampusCompanyOverview({ companyId, onBack, onStartPractice }) {
  const [company, setCompany] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCompany(companyId), fetchCompanyRounds(companyId)])
      .then(([c, r]) => { setCompany(c); setRounds(r); setActiveRoundId(r[0]?.id || null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    if (!activeRoundId) { setCategories([]); return; }
    setCategoriesLoading(true);
    fetchRoundCategories(companyId, activeRoundId)
      .then(setCategories).catch(console.error).finally(() => setCategoriesLoading(false));
  }, [companyId, activeRoundId]);

  if (loading) return <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>;
  if (!company) return <CampusEmptyState icon={Briefcase} title="Company not found" description="This company prep guide may have been unpublished." />;

  const activeRound = rounds.find(r => r.id === activeRoundId);

  return (
    <div className="max-w-3xl">
      <CampusBreadcrumb items={[{ label: "Company Prep", onClick: onBack }, { label: company.name }]} />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-[16px] flex-shrink-0" style={{ background: CAMPUS.teal, color: "#fff" }}>
          {company.name?.slice(0, 2).toUpperCase() || "??"}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{company.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {company.ctc && <CampusChip color={CAMPUS.gold}>{company.ctc}</CampusChip>}
            {company.difficulty && <CampusChip color={DIFF_COLOR[company.difficulty] || CAMPUS.good}>{company.difficulty}</CampusChip>}
          </div>
        </div>
      </div>

      {company.description && <p className="text-[13px] mb-5 leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{company.description}</p>}

      {(company.eligibility || company.hiringOverview) && (
        <CampusCard className="p-5 mb-5 space-y-4">
          {company.eligibility && (
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>ELIGIBILITY</p>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{company.eligibility}</p>
            </div>
          )}
          {company.hiringOverview && (
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>HIRING PROCESS</p>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{company.hiringOverview}</p>
            </div>
          )}
        </CampusCard>
      )}

      {company.resources?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {company.resources.map((r, i) => (
            <a key={i} href={r} target="_blank" rel="noreferrer"
              className="text-[11.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.teal }}>
              <ExternalLink size={11} /> Resource {i + 1}
            </a>
          ))}
        </div>
      )}

      {rounds.length === 0 ? (
        <CampusEmptyState icon={ListChecks} title="No rounds published yet" description="Check back soon." />
      ) : (
        <>
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>ROUND</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {rounds.map(r => (
              <button key={r.id} onClick={() => setActiveRoundId(r.id)}
                className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg transition-colors"
                style={{
                  background: activeRoundId === r.id ? CAMPUS.teal : CAMPUS.surface,
                  color: activeRoundId === r.id ? "#fff" : CAMPUS.inkSoft,
                  border: `1px solid ${activeRoundId === r.id ? CAMPUS.teal : CAMPUS.line}`,
                }}>
                {r.name}
              </button>
            ))}
          </div>

          {activeRound?.description && <p className="text-[12.5px] mb-3 leading-relaxed" style={{ color: CAMPUS.inkFaint }}>{activeRound.description}</p>}
          {activeRound?.duration && (
            <div className="flex items-center gap-1.5 text-[11.5px] mb-4" style={{ color: CAMPUS.inkFaint }}>
              <Clock size={12} /> {activeRound.duration}
            </div>
          )}

          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>CATEGORY</p>
          {categoriesLoading ? (
            <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <CampusEmptyState size="sm" icon={ListChecks} title="No categories yet for this round" description="Check back soon." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => onStartPractice(activeRoundId, cat.id, { companyName: company.name, roundName: activeRound?.name, categoryName: cat.name })} className="text-left">
                  <CampusCard hover className="p-4 flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-medium" style={{ color: CAMPUS.ink }}>{cat.name}</span>
                    <ChevronRight size={15} style={{ color: CAMPUS.teal }} />
                  </CampusCard>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------- Question runner ----------------

// One question's own card - a self-contained mini quiz (options, submit,
// explanation) with no dependency on any other question's state, so the
// runner below can render every question in the category as a plain
// scrollable list instead of paging through them one at a time.
function CompanyQuestionCard({ q, selected, submitted, solved, bookmarked, onSelect, onSubmit, onToggleBookmark, showUser }) {
  const stats = companyQuestionStats(q);
  return (
    <CampusCard className="p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <CampusChip color={DIFF_COLOR[q.difficulty] || CAMPUS.good}>{q.difficulty}</CampusChip>
          {solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2}>SOLVED</CampusChip>}
        </div>
        {showUser && (
          <button onClick={onToggleBookmark} title="Bookmark this question">
            {bookmarked
              ? <BookmarkCheck size={16} style={{ color: CAMPUS.gold }} />
              : <Bookmark size={16} style={{ color: CAMPUS.inkFaint }} />}
          </button>
        )}
      </div>

      <p className="text-[14px] leading-relaxed mb-5 whitespace-pre-wrap" style={{ color: CAMPUS.ink }}>{q.question}</p>

      <div className="space-y-2 mb-5">
        {q.options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrectOpt = oi === q.correctIndex;
          let bg = CAMPUS.paper, border = CAMPUS.line, color = CAMPUS.inkSoft;
          if (submitted && isCorrectOpt) { bg = CAMPUS.goodTint; border = CAMPUS.good; color = CAMPUS.good; }
          else if (submitted && isSelected) { bg = CAMPUS.badTint; border = CAMPUS.bad; color = CAMPUS.bad; }
          else if (!submitted && isSelected) { bg = CAMPUS.tealTint; border = `${CAMPUS.teal}60`; color = CAMPUS.ink; }
          return (
            <button key={oi} onClick={() => !submitted && onSelect(oi)} disabled={submitted}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-colors disabled:cursor-default"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ border: `1.5px solid ${color}`, color }}>
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="text-[13px] flex-1" style={{ color }}>{opt}</span>
              {submitted && isCorrectOpt && <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: CAMPUS.good }} />}
              {submitted && isSelected && !isCorrectOpt && <XCircle size={14} className="flex-shrink-0" style={{ color: CAMPUS.bad }} />}
            </button>
          );
        })}
      </div>

      {submitted && q.explanation && (
        <div className="rounded-lg p-3 mb-4" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.teal}30` }}>
          <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.teal }}>EXPLANATION</p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{q.explanation}</p>
        </div>
      )}

      {submitted && stats?.attemptCount > 0 && (
        <p className="text-[11px] mb-4" style={{ color: CAMPUS.inkFaint }}>
          {stats.accuracy}% of {stats.attemptCount} attempt{stats.attemptCount === 1 ? "" : "s"} got this right.
        </p>
      )}

      {!submitted && (
        <button onClick={onSubmit} disabled={selected == null}
          className="w-full text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40 transition-colors"
          style={{ color: "#fff", background: CAMPUS.teal }}>
          Submit
        </button>
      )}
    </CampusCard>
  );
}

export function CampusCompanyQuestionRunner({ companyId, roundId, categoryId, companyName, roundName, categoryName, onBack, onBackToList }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("All");
  // Keyed by question id, not a single shared index - every question is its
  // own independent mini quiz rendered in one scrollable list (see
  // CompanyQuestionCard above), so answering one never resets any other.
  const [answers, setAnswers] = useState({});
  const [submittedIds, setSubmittedIds] = useState(() => new Set());
  const [progress, setProgress] = useState({ solved: {}, bookmarked: {} });
  const startedAtRef = useRef({});

  useEffect(() => {
    fetchCategoryQuestions(companyId, roundId, categoryId).then(setQuestions).catch(console.error).finally(() => setLoading(false));
  }, [companyId, roundId, categoryId]);

  useEffect(() => {
    if (!user) { setProgress({ solved: {}, bookmarked: {} }); return; }
    fetchUserCompanyPrepProgress(user.uid).then(setProgress).catch(() => {});
  }, [user]);

  const filtered = difficulty === "All" ? questions : questions.filter(q => q.difficulty === difficulty);
  const diffCounts = filtered.reduce((acc, q) => { acc[q.difficulty] = (acc[q.difficulty] || 0) + 1; return acc; }, {});
  const answeredCount = filtered.filter(q => submittedIds.has(q.id)).length;
  const correctCount = filtered.filter(q => submittedIds.has(q.id) && answers[q.id] === q.correctIndex).length;

  const handleSelect = (qid, oi) => {
    if (submittedIds.has(qid)) return;
    if (!(qid in startedAtRef.current)) startedAtRef.current[qid] = Date.now();
    setAnswers(a => ({ ...a, [qid]: oi }));
  };

  const handleSubmit = (qq) => {
    if (submittedIds.has(qq.id) || answers[qq.id] == null) return;
    setSubmittedIds(s => new Set(s).add(qq.id));
    const correct = answers[qq.id] === qq.correctIndex;
    const timeSec = Math.round((Date.now() - (startedAtRef.current[qq.id] || Date.now())) / 1000);
    if (user) {
      recordCompanyQuestionAttempt(companyId, roundId, categoryId, qq.id, { correct, timeSec }).catch(console.error);
      if (correct) {
        markCompanyQuestionSolved(user.uid, qq.id).catch(console.error);
        setProgress(p => ({ ...p, solved: { ...p.solved, [qq.id]: true } }));
      }
    }
  };

  const toggleBookmark = (qq) => {
    if (!user) return;
    const next = !progress.bookmarked?.[qq.id];
    setCompanyQuestionBookmarked(user.uid, qq.id, next).catch(console.error);
    setProgress(p => ({ ...p, bookmarked: { ...p.bookmarked, [qq.id]: next } }));
  };

  if (loading) return <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading questions...</p>;
  if (questions.length === 0) {
    return <CampusEmptyState icon={ListChecks} title="No questions yet in this category" description="Check back soon." />;
  }

  return (
    <div className="max-w-2xl">
      <CampusBreadcrumb items={[
        { label: "Company Prep", onClick: onBackToList },
        { label: companyName, onClick: onBack },
        { label: roundName, onClick: onBack },
        { label: categoryName },
      ]} />

      {/* The "brief" for this topic - no hand-written blurb to keep in sync,
          just what's actually true about what you're about to practice. */}
      <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft }}>
        {questions.length} question{questions.length === 1 ? "" : "s"} in {categoryName}
        {Object.keys(diffCounts).length > 0 && (
          <> &middot; {Object.entries(diffCounts).map(([d, c]) => `${c} ${d}`).join(", ")}</>
        )}
        . Work through them at your own pace - each one checks and explains itself as you go.
      </p>

      <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
        <div>
          <label className="block text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>DIFFICULTY</label>
          <Dropdown value={difficulty} onChange={setDifficulty} options={["All", ...COMPANY_QUESTION_DIFFICULTIES]}
            className="w-36" buttonClassName="text-[12.5px] px-3 py-2 rounded-lg bg-[var(--campus-paper)] border border-[var(--campus-line)] text-[var(--campus-ink)]" />
        </div>

        {/* Live scorecard - the "how am I doing so far" analysis for this
            category, updating as each question is submitted below, instead
            of only ever showing feedback one question at a time. */}
        {answeredCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <CampusChip color={CAMPUS.teal}>{answeredCount}/{filtered.length} answered</CampusChip>
            <CampusChip color={CAMPUS.good} icon={CheckCircle2}>{correctCount} correct</CampusChip>
            <CampusChip color={CAMPUS.bad} icon={XCircle}>{answeredCount - correctCount} wrong</CampusChip>
            <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
              {Math.round((correctCount / answeredCount) * 100)}% accuracy
            </span>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <CampusEmptyState icon={ListChecks} title="No questions at this difficulty" description="Try a different difficulty filter." />
      ) : (
        <div className="space-y-4">
          {filtered.map(qq => (
            <CompanyQuestionCard key={qq.id} q={qq}
              selected={answers[qq.id] ?? null}
              submitted={submittedIds.has(qq.id)}
              solved={!!progress.solved?.[qq.id]}
              bookmarked={!!progress.bookmarked?.[qq.id]}
              showUser={!!user}
              onSelect={(oi) => handleSelect(qq.id, oi)}
              onSubmit={() => handleSubmit(qq)}
              onToggleBookmark={() => toggleBookmark(qq)} />
          ))}
        </div>
      )}

      {!user && (
        <p className="text-[11px] text-center mt-5" style={{ color: CAMPUS.inkFaint }}>
          Sign in to save your progress and bookmarks - practicing still works fully without it.
        </p>
      )}
    </div>
  );
}

// ---------------- Orchestrator ----------------

// Owns the list/company/practice screen transitions - same lifted
// screen/setScreen pattern as CampusContestFlow, so a caller can either keep
// it local (Directory's own useState) or lift it (a Workspace tab that wants
// to jump straight into a specific company from elsewhere).
export function CampusCompanyPrepFlow({ screen, setScreen, adminMode = false, hiddenIds, onToggleHidden }) {
  if (screen.view === "company") {
    return (
      <CampusCompanyOverview companyId={screen.companyId}
        onBack={() => setScreen({ view: "list" })}
        onStartPractice={(roundId, categoryId, names) => setScreen({ view: "practice", companyId: screen.companyId, roundId, categoryId, ...names })} />
    );
  }
  if (screen.view === "practice") {
    return (
      <CampusCompanyQuestionRunner companyId={screen.companyId} roundId={screen.roundId} categoryId={screen.categoryId}
        companyName={screen.companyName} roundName={screen.roundName} categoryName={screen.categoryName}
        onBack={() => setScreen({ view: "company", companyId: screen.companyId })}
        onBackToList={() => setScreen({ view: "list" })} />
    );
  }
  return <CampusCompanyList onSelect={(companyId) => setScreen({ view: "company", companyId })}
    adminMode={adminMode} hiddenIds={hiddenIds} onToggleHidden={onToggleHidden} />;
}
