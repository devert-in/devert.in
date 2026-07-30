"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2, XCircle, Bookmark, BookmarkCheck, Clock,
  ChevronRight, ChevronDown, ListChecks, Briefcase, Eye, EyeOff, AlertTriangle,
  CalendarDays, Target, ShieldAlert, TrendingUp, Users, Timer, Sparkles,
  Quote, Trophy, MessageSquareText, FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublishedCompanies, fetchCompany, fetchCompanyRounds, fetchRoundCategories,
  fetchCategoryQuestions, fetchUserCompanyPrepProgress, markCompanyQuestionSolved,
  setCompanyQuestionBookmarked, recordCompanyQuestionAttempt, companyQuestionStats,
  COMPANY_QUESTION_DIFFICULTIES, fetchCompanyInterviewExperiences, fetchCompanyMockInterviews,
  fetchMockInterviewQuestions, recordMockInterviewAttempt, setCompanySelfAssessment,
  companyReadinessScore, fetchAllCompanyQuestions,
} from "@/lib/companyPrep";
import { ConceptRenderer, InfoListCard } from "@/components/campus/lesson-blocks";
import { seededShuffle, buildQuizSeedKey } from "@/lib/quizRandom";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusBreadcrumb, CampusEmptyState, CampusSkeleton, CampusButton } from "@/components/campus/campus-ui";
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
// CampusPracticeList - Manage's Company Vault screen reuses this exact list
// so a campus admin can hide a company from THEIR institution's students
// without touching the global `companies` collection at all.
export function CampusCompanyList({ onSelect, adminMode = false, hiddenIds, onToggleHidden }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true); setError(false);
    fetchPublishedCompanies().then(setCompanies).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(load, []);

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
      ) : error ? (
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load companies"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
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

// Every company's `eligibility` doc field is one freeform prose string (no
// structured schema behind it - see lib/companyPrep.js), but every one of
// them is still just a run of complete sentences ("B.E./B.Tech... Minimum
// 60%... No standing backlogs... Maximum 2-year gap..."). Splitting on a
// period immediately followed by whitespace and a capital letter turns that
// back into its natural clauses without ever tripping on the abbreviations
// inside it (e.g. "B.E./B.Tech/M.Sc" has no space after those periods, so
// nothing there gets cut) - checked against all four companies' real text.
function splitIntoClauses(text) {
  if (!text) return [];
  return text.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
}

// The "Hiring Process" doc field used to just be dumped as one long
// whitespace-pre-wrap paragraph - unreadable, and worse, a duplicate of
// data this component already fetches: `rounds` (name/duration/description)
// is real structured content, authored once per round, not prose to
// re-parse. This renders that data as a connected step flow instead, so
// every company gets the same clear "here's the process" visual for free,
// with no per-company text-parsing hacks.
function HiringProcessFlow({ rounds }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
        <ListChecks size={12} />
        Rounds run in order below - clearing each is required to advance to the next.
      </div>
      {rounds.map((r, i) => {
        // whatTheyEvaluate/format/eliminationCriteria/prepStrategy/commonMistakes
        // are the new, optional round-depth fields - a round authored before
        // this existed just has description/duration, so the expand toggle
        // only appears once there's genuinely something deeper to show.
        const hasDepth = r.whatTheyEvaluate || r.format || r.eliminationCriteria || r.prepStrategy || r.commonMistakes;
        const expanded = expandedId === r.id;
        return (
        <div key={r.id} className="flex gap-3">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11.5px] font-semibold"
              style={{ background: CAMPUS.surface, border: `1.5px solid ${CAMPUS.teal}`, color: CAMPUS.teal }}>
              {i + 1}
            </div>
            {i < rounds.length - 1 && <div className="w-[1.5px] flex-1 my-0.5" style={{ background: CAMPUS.line }} />}
          </div>
          <div className={i < rounds.length - 1 ? "pb-4 min-w-0 flex-1" : "min-w-0 flex-1"}>
            <div className="flex items-center gap-2 flex-wrap">
              <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{r.name}</b>
              {r.duration && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2 py-0.5 rounded" style={{ background: CAMPUS.paper, color: CAMPUS.inkFaint }}>
                  <Clock size={9} /> {r.duration}
                </span>
              )}
              {hasDepth && (
                <button onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: CAMPUS.teal }}>
                  {expanded ? "less detail" : "what to expect"} <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              )}
            </div>
            {r.description && <p className="text-[12px] leading-relaxed mt-1" style={{ color: CAMPUS.inkSoft }}>{r.description}</p>}
            {expanded && hasDepth && (
              <div className="mt-3 space-y-2.5">
                {r.whatTheyEvaluate && (
                  <div className="flex items-start gap-2">
                    <Target size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.teal }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>What they evaluate: </b>{r.whatTheyEvaluate}</p>
                  </div>
                )}
                {r.format && (
                  <div className="flex items-start gap-2">
                    <ListChecks size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.blue }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Format: </b>{r.format}</p>
                  </div>
                )}
                {r.eliminationCriteria && (
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.bad }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Elimination criteria: </b>{r.eliminationCriteria}</p>
                  </div>
                )}
                {r.prepStrategy && (
                  <div className="flex items-start gap-2">
                    <TrendingUp size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.good }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>How to prepare: </b>{r.prepStrategy}</p>
                  </div>
                )}
                {r.commonMistakes && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.warn }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Common mistakes: </b>{r.commonMistakes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// Day-by-day prep roadmap (company.prepRoadmap[] - see lib/companyPrep.js's
// header comment for the schema). Purely additive - a company authored
// before this existed just has an empty/absent array, and this section
// simply doesn't render.
function PrepRoadmap({ roadmap }) {
  const [expandedDay, setExpandedDay] = useState(roadmap[0]?.day ?? null);
  return (
    <CampusCard className="p-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={14} style={{ color: CAMPUS.purple }} />
        <p className="text-[9px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>PREP ROADMAP</p>
      </div>
      <div className="space-y-2">
        {roadmap.map((d) => {
          const expanded = expandedDay === d.day;
          return (
            <div key={d.day} className="rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
              <button onClick={() => setExpandedDay(expanded ? null : d.day)} className="w-full flex items-center justify-between gap-3 p-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ background: CAMPUS.purpleTint, color: CAMPUS.purple }}>DAY {d.day}</span>
                  <span className="text-[13px] font-medium truncate" style={{ color: CAMPUS.ink }}>{d.title}</span>
                </div>
                <ChevronDown size={14} style={{ color: CAMPUS.inkFaint, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
              </button>
              {expanded && (
                <div className="px-3 pb-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  {d.focus && <p className="text-[12px] mt-2.5 mb-2" style={{ color: CAMPUS.inkSoft }}>{d.focus}</p>}
                  {d.tasks?.length > 0 && (
                    <ul className="space-y-1.5">
                      {d.tasks.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: CAMPUS.inkSoft }}>
                          <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: CAMPUS.purple }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CampusCard>
  );
}

// Interview experiences - admin-curated (see lib/companyPrep.js's header
// comment: genuine student submission is a real follow-up feature, not
// built here).
function InterviewExperiences({ experiences }) {
  if (experiences.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Quote size={13} style={{ color: CAMPUS.blue }} />
        <p className="text-[9px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>INTERVIEW EXPERIENCES</p>
      </div>
      <div className="space-y-3">
        {experiences.map(e => (
          <CampusCard key={e.id} className="p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{e.studentName || "A DeVert student"}</b>
              {e.year && <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>· {e.year}</span>}
              {e.role && <CampusChip color={CAMPUS.blue}>{e.role}</CampusChip>}
              {e.difficulty && <CampusChip color={DIFF_COLOR[e.difficulty] || CAMPUS.good}>{e.difficulty}</CampusChip>}
            </div>
            {e.roundsFaced && (
              <p className="text-[12px] mb-1.5" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Rounds faced: </b>{e.roundsFaced}</p>
            )}
            {e.questionsAsked && (
              <p className="text-[12px] mb-1.5" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Questions asked: </b>{e.questionsAsked}</p>
            )}
            {e.tips && (
              <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>Tips: </b>{e.tips}</p>
            )}
          </CampusCard>
        ))}
      </div>
    </div>
  );
}

// Mock interview configs - each references existing (round, category) pairs
// and pulls their questions live (see fetchMockInterviewQuestions).
function MockInterviews({ mockInterviews, onStart }) {
  if (mockInterviews.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users size={13} style={{ color: CAMPUS.gold }} />
        <p className="text-[9px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>MOCK INTERVIEWS</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {mockInterviews.map(m => (
          <CampusCard key={m.id} hover className="p-4 cursor-pointer" onClick={() => onStart(m)}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{m.name}</b>
              <CampusChip color={CAMPUS.gold}>{m.type}</CampusChip>
            </div>
            <p className="text-[11.5px] flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
              <Timer size={11} /> {m.timeLimitMinutes} min timed
            </p>
          </CampusCard>
        ))}
      </div>
    </div>
  );
}

// Readiness score - computed from real signals only (solved/total across
// every question this student has attempted in this vault), never blended
// with the separate, subjective self-assessment checklist below it.
function ReadinessScore({ score, selfAssessment, onToggleSelfAssessment }) {
  const SELF_ITEMS = ["Resume", "Communication", "Confidence"];
  return (
    <CampusCard className="p-4 mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Sparkles size={16} style={{ color: CAMPUS.gold }} />
          <div>
            <p className="text-[9px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>READINESS SCORE</p>
            <p className="text-lg font-bold" style={{ color: CAMPUS.ink }}>{score == null ? "—" : `${score}%`}</p>
          </div>
        </div>
        <p className="text-[11px] max-w-xs" style={{ color: CAMPUS.inkFaint }}>Based on how many of this company&apos;s practice questions you&apos;ve solved.</p>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 flex-wrap" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>SELF-CHECK:</span>
        {SELF_ITEMS.map(item => (
          <button key={item} onClick={() => onToggleSelfAssessment(item)}
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: selfAssessment?.[item] ? CAMPUS.good : CAMPUS.inkFaint }}>
            {selfAssessment?.[item] ? <CheckCircle2 size={13} /> : <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${CAMPUS.inkFaint}` }} />}
            {item}
          </button>
        ))}
      </div>
    </CampusCard>
  );
}

export function CampusCompanyOverview({ companyId, onBack, onStartPractice, onStartMockInterview }) {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [mockInterviews, setMockInterviews] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [progress, setProgress] = useState({ solved: {}, selfAssessment: {} });

  const load = () => {
    setLoading(true); setError(false);
    Promise.all([fetchCompany(companyId), fetchCompanyRounds(companyId)])
      .then(([c, r]) => { setCompany(c); setRounds(r); setActiveRoundId(r[0]?.id || null); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    fetchCompanyInterviewExperiences(companyId).then(setExperiences).catch(() => setExperiences([]));
    fetchCompanyMockInterviews(companyId).then(setMockInterviews).catch(() => setMockInterviews([]));
  };
  useEffect(load, [companyId]);

  useEffect(() => {
    if (!user) return;
    fetchUserCompanyPrepProgress(user.uid).then(p => setProgress({ solved: p.solved || {}, selfAssessment: p.selfAssessment?.[companyId] || {} })).catch(() => {});
  }, [user, companyId]);

  // Readiness score needs every question across every round/category - a
  // single upfront aggregate fetch once rounds are known, not on every
  // round switch (the round-picker below still lazily fetches per-round
  // categories for browsing, unaffected by this).
  useEffect(() => {
    if (rounds.length === 0) { setReadiness(null); return; }
    fetchAllCompanyQuestions(companyId, rounds).then(qs => setReadiness(companyReadinessScore(qs, progress.solved))).catch(() => setReadiness(null));
  }, [companyId, rounds, progress.solved]);

  const loadCategories = () => {
    setCategoriesLoading(true); setCategoriesError(false);
    setExpandedCategoryId(null);
    fetchRoundCategories(companyId, activeRoundId)
      .then(setCategories).catch(() => setCategoriesError(true)).finally(() => setCategoriesLoading(false));
  };
  useEffect(() => {
    if (!activeRoundId) { setCategories([]); return; }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeRoundId]);

  const handleToggleSelfAssessment = (item) => {
    if (!user) return;
    const next = !progress.selfAssessment?.[item];
    setCompanySelfAssessment(user.uid, companyId, item, next).catch(console.error);
    setProgress(p => ({ ...p, selfAssessment: { ...p.selfAssessment, [item]: next } }));
  };

  if (loading) return <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>;
  if (error) {
    return (
      <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load this company"
        description="Check your connection and try again."
        action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
    );
  }
  if (!company) return <CampusEmptyState icon={Briefcase} title="Company not found" description="This company prep guide may have been unpublished." />;

  const activeRound = rounds.find(r => r.id === activeRoundId);

  return (
    <div className="max-w-3xl">
      <CampusBreadcrumb items={[{ label: "Company Vault", onClick: onBack }, { label: company.name }]} />

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

      <ReadinessScore score={readiness} selfAssessment={progress.selfAssessment} onToggleSelfAssessment={handleToggleSelfAssessment} />

      {company.prepRoadmap?.length > 0 && <PrepRoadmap roadmap={company.prepRoadmap} />}

      {(company.eligibility || rounds.length > 0) && (
        <CampusCard className="p-5 mb-5 space-y-5">
          {company.eligibility && (
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>ELIGIBILITY</p>
              <div className="space-y-2">
                {splitIntoClauses(company.eligibility).map((clause, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.good }} />
                    <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{clause}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rounds.length > 0 && (
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>HIRING PROCESS</p>
              <HiringProcessFlow rounds={rounds} />
            </div>
          )}
        </CampusCard>
      )}

      {company.resources?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {company.resources.map((r, i) => {
            // Backward-compatible: older companies may still have a plain
            // array of URL strings (pre-dating the {title,url,type} shape) -
            // both render the same way, just with a generic label for the
            // legacy string form.
            const isObj = typeof r === "object" && r !== null;
            const url = isObj ? r.url : r;
            const label = isObj ? (r.title || "Resource") : `Resource ${i + 1}`;
            if (!url) return null;
            return (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="text-[11.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.teal }}>
                <FileText size={11} /> {label}{isObj && r.type ? ` (${r.type})` : ""}
              </a>
            );
          })}
        </div>
      )}

      <InterviewExperiences experiences={experiences} />
      <MockInterviews mockInterviews={mockInterviews} onStart={(m) => onStartMockInterview(m, company.name)} />

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
          ) : categoriesError ? (
            <CampusEmptyState size="sm" icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load categories"
              description="Check your connection and try again."
              action={<CampusButton variant="secondary" size="sm" onClick={loadCategories}>Retry</CampusButton>} />
          ) : categories.length === 0 ? (
            <CampusEmptyState size="sm" icon={ListChecks} title="No categories yet for this round" description="Check back soon." />
          ) : (
            <div className="space-y-3">
              {categories.map(cat => {
                // A category doubles as a lightweight "topic" once it has
                // lesson content (concept/keyPoints/etc, authored the same
                // way Programming/CS Core/Aptitude topics are) - expand in
                // place to read it before jumping into practice, rather than
                // going straight to questions as before.
                const hasLesson = cat.concept?.trim() || cat.keyPoints?.length;
                const expanded = expandedCategoryId === cat.id;
                return (
                  <CampusCard key={cat.id} className="overflow-hidden">
                    <button onClick={() => hasLesson ? setExpandedCategoryId(expanded ? null : cat.id) : onStartPractice(activeRoundId, cat.id, { companyName: company.name, roundName: activeRound?.name, categoryName: cat.name })}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left">
                      <span className="text-[13.5px] font-medium" style={{ color: CAMPUS.ink }}>{cat.name}</span>
                      {hasLesson
                        ? <ChevronDown size={15} style={{ color: CAMPUS.inkFaint, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        : <ChevronRight size={15} style={{ color: CAMPUS.teal }} />}
                    </button>
                    {expanded && hasLesson && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                        {cat.whatYoullLearn?.length > 0 && (
                          <InfoListCard icon={Target} title="What you'll learn" items={cat.whatYoullLearn} color={CAMPUS.teal} tint={CAMPUS.tealTint} />
                        )}
                        {cat.concept && (
                          <div className="pt-3"><ConceptRenderer text={cat.concept} /></div>
                        )}
                        {cat.keyPoints?.length > 0 && (
                          <InfoListCard icon={ListChecks} title="Key Points" items={cat.keyPoints} color={CAMPUS.gold} tint={CAMPUS.goldTint} checkItems />
                        )}
                        {cat.commonMistakes?.length > 0 && (
                          <InfoListCard icon={AlertTriangle} title="Common Mistakes" items={cat.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
                        )}
                        {cat.interviewTips?.length > 0 && (
                          <InfoListCard icon={MessageSquareText} title="Interview Tips" items={cat.interviewTips} color={CAMPUS.warn} tint={CAMPUS.warnTint} />
                        )}
                        <CampusButton size="sm" onClick={() => onStartPractice(activeRoundId, cat.id, { companyName: company.name, roundName: activeRound?.name, categoryName: cat.name })}>
                          Start Practice <ChevronRight size={13} />
                        </CampusButton>
                      </div>
                    )}
                  </CampusCard>
                );
              })}
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
function CompanyQuestionCard({ q, seedKey, selected, submitted, solved, bookmarked, onSelect, onSubmit, onToggleBookmark, showUser }) {
  const stats = companyQuestionStats(q);
  // Shuffled purely for display, deterministic per (student, question) - a
  // refresh reproduces the same order. onSelect/onSubmit/grading downstream
  // always deal in the ORIGINAL option index, never the shuffled position -
  // the A/B/C/D label below is the only thing that reflects display order.
  const shuffledOptions = useMemo(() => {
    const order = seededShuffle((q.options || []).map((_, i) => i), seedKey);
    return order.map(oi => ({ originalIndex: oi, text: q.options[oi] }));
  }, [q.options, seedKey]);
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
        {shuffledOptions.map((opt, pos) => {
          const isSelected = selected === opt.originalIndex;
          const isCorrectOpt = opt.originalIndex === q.correctIndex;
          let bg = CAMPUS.paper, border = CAMPUS.line, color = CAMPUS.inkSoft;
          if (submitted && isCorrectOpt) { bg = CAMPUS.goodTint; border = CAMPUS.good; color = CAMPUS.good; }
          else if (submitted && isSelected) { bg = CAMPUS.badTint; border = CAMPUS.bad; color = CAMPUS.bad; }
          else if (!submitted && isSelected) { bg = CAMPUS.tealTint; border = `${CAMPUS.teal}60`; color = CAMPUS.ink; }
          return (
            <button key={opt.originalIndex} onClick={() => !submitted && onSelect(opt.originalIndex)} disabled={submitted}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-colors disabled:cursor-default"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ border: `1.5px solid ${color}`, color }}>
                {String.fromCharCode(65 + pos)}
              </span>
              <span className="text-[13px] flex-1" style={{ color }}>{opt.text}</span>
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
  const [error, setError] = useState(false);
  const [difficulty, setDifficulty] = useState("All");
  // Keyed by question id, not a single shared index - every question is its
  // own independent mini quiz rendered in one scrollable list (see
  // CompanyQuestionCard above), so answering one never resets any other.
  const [answers, setAnswers] = useState({});
  const [submittedIds, setSubmittedIds] = useState(() => new Set());
  const [progress, setProgress] = useState({ solved: {}, bookmarked: {} });
  const startedAtRef = useRef({});

  const load = () => {
    setLoading(true); setError(false);
    fetchCategoryQuestions(companyId, roundId, categoryId).then(setQuestions).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(load, [companyId, roundId, categoryId]);

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

  // Breadcrumb renders unconditionally (loading/error/empty/list) so a bad
  // fetch or an empty category never strands the user with no way back -
  // previously the early returns below skipped past the CampusBackButton
  // entirely, leaving a genuine dead end.
  return (
    <div className="max-w-2xl">
      <CampusBreadcrumb items={[
        { label: "Company Vault", onClick: onBackToList },
        { label: companyName, onClick: onBack },
        { label: roundName },
        { label: categoryName },
      ]} />

      {loading ? (
        <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading questions...</p>
      ) : error ? (
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load questions"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
      ) : questions.length === 0 ? (
        <CampusEmptyState icon={ListChecks} title="No questions yet in this category" description="Check back soon." />
      ) : (
        <>
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
                <CompanyQuestionCard key={qq.id} q={qq} seedKey={buildQuizSeedKey({ uid: user?.uid, scope: qq.id })}
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
        </>
      )}
    </div>
  );
}

// ---------------- Mock interview runner ----------------

// A timed, sequential run through the questions pulled live from every
// (round, category) pair the config references (see
// fetchMockInterviewQuestions) - styled after Arena's timed-challenge
// pattern, reusing CompanyQuestionCard's own per-question submit/explain UI
// rather than a parallel implementation, just paged one at a time (not the
// scrollable-list-of-all-questions shape CampusCompanyQuestionRunner uses)
// to genuinely simulate a timed interview's one-question-at-a-time pressure.
export function CampusMockInterviewRunner({ companyId, mockInterview, companyName, onBack, onBackToList }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submittedIds, setSubmittedIds] = useState(() => new Set());
  const [secondsLeft, setSecondsLeft] = useState(mockInterview.timeLimitMinutes * 60);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchMockInterviewQuestions(companyId, mockInterview).then(setQuestions).catch(() => setQuestions([]));
  }, [companyId, mockInterview]);

  useEffect(() => {
    if (finished || questions === null) return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); setFinished(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, questions]);

  const score = questions?.filter(q => submittedIds.has(q.id) && answers[q.id] === q.correctIndex).length || 0;

  useEffect(() => {
    if (!finished || !user || !questions) return;
    recordMockInterviewAttempt(user.uid, companyId, mockInterview.id, { score, total: questions.length }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (questions === null) return <p className="text-[13px]" style={{ color: CAMPUS.inkFaint }}>Loading mock interview...</p>;
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl">
        <CampusBreadcrumb items={[{ label: "Company Vault", onClick: onBackToList }, { label: companyName, onClick: onBack }, { label: mockInterview.name }]} />
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="No questions configured" description="Ask your admin to attach categories to this mock interview." />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <Trophy size={40} className="mx-auto mb-4" style={{ color: CAMPUS.gold }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: CAMPUS.ink }}>Mock Interview Complete</h2>
        <p className="text-[14px] mb-6" style={{ color: CAMPUS.inkSoft }}>You scored {score} out of {questions.length}.</p>
        <div className="flex items-center justify-center gap-3">
          <CampusButton variant="secondary" onClick={onBack}>Back to {companyName}</CampusButton>
          <CampusButton onClick={onBackToList}>Company Vault</CampusButton>
        </div>
      </div>
    );
  }

  const qq = questions[index];
  const submitted = submittedIds.has(qq.id);

  return (
    <div className="max-w-2xl">
      <CampusBreadcrumb items={[{ label: "Company Vault", onClick: onBackToList }, { label: companyName, onClick: onBack }, { label: mockInterview.name }]} />
      <div className="flex items-center justify-between mb-4">
        <CampusChip color={CAMPUS.gold}>Question {index + 1} / {questions.length}</CampusChip>
        <span className="flex items-center gap-1.5 text-[13px] font-mono font-bold" style={{ color: secondsLeft < 60 ? CAMPUS.bad : CAMPUS.ink }}>
          <Timer size={13} /> {mm}:{ss}
        </span>
      </div>

      <CompanyQuestionCard q={qq} seedKey={buildQuizSeedKey({ uid: user?.uid, scope: `mock:${mockInterview.id}:${qq.id}` })}
        selected={answers[qq.id] ?? null}
        submitted={submitted}
        solved={false}
        bookmarked={false}
        showUser={false}
        onSelect={(oi) => !submitted && setAnswers(a => ({ ...a, [qq.id]: oi }))}
        onSubmit={() => setSubmittedIds(s => new Set(s).add(qq.id))}
        onToggleBookmark={() => {}} />

      <div className="flex justify-end mt-4">
        <CampusButton disabled={!submitted} onClick={() => {
          if (index + 1 < questions.length) setIndex(i => i + 1);
          else setFinished(true);
        }}>
          {index + 1 < questions.length ? "Next Question" : "Finish"} <ChevronRight size={14} />
        </CampusButton>
      </div>
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
        onStartPractice={(roundId, categoryId, names) => setScreen({ view: "practice", companyId: screen.companyId, roundId, categoryId, ...names })}
        onStartMockInterview={(mockInterview, companyName) => setScreen({ view: "mockInterview", companyId: screen.companyId, mockInterview, companyName })} />
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
  if (screen.view === "mockInterview") {
    return (
      <CampusMockInterviewRunner companyId={screen.companyId} mockInterview={screen.mockInterview} companyName={screen.companyName}
        onBack={() => setScreen({ view: "company", companyId: screen.companyId })}
        onBackToList={() => setScreen({ view: "list" })} />
    );
  }
  return <CampusCompanyList onSelect={(companyId) => setScreen({ view: "company", companyId })}
    adminMode={adminMode} hiddenIds={hiddenIds} onToggleHidden={onToggleHidden} />;
}
