"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Play, Send, RotateCcw, Copy, Lightbulb, CheckCircle2, CircleDot, XCircle, Monitor, Code2, Search, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublishedProblems, fetchProblem, fetchSampleTests, fetchUserCodelabProgress,
  fetchAttemptedProblemIds, runCode, submitCode, acceptanceRate, CODELAB_CATEGORIES,
  CODELAB_DIFFICULTIES, CODELAB_LANGUAGES, STARTER_CODE,
} from "@/lib/codelab";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusGoogleButton, CampusBackButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";

// Native, light-themed port of components/codelab/problem-view.jsx for
// DeVert Campus - reuses lib/codelab.js's run/submit/fetch functions verbatim
// (same backend calls, same grading) and components/dropdown.jsx as-is (it's
// already theme-agnostic via --dropdown-* CSS vars already aliased in
// .campus-theme). The one functional change Monaco itself needs: "vs-dark" ->
// "light" - nothing else couples the editor to the dark app (confirmed by
// port research). Never redirects to /login - shows the same inline
// CampusGoogleButton prompt used everywhere else in Campus.

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

// Per-language accents drawn from the same CAMPUS.* palette every other
// Campus surface already uses (never a one-off hex) - each language tab
// gets its own card color instead of a single flat active/inactive teal.
const LANGUAGE_COLOR = {
  java: CAMPUS.warn, python: CAMPUS.blue, cpp: CAMPUS.purple, javascript: CAMPUS.gold, c: CAMPUS.teal,
};

// A vertical, single-select filter list for the practice sidebar - reads
// like a nav (a label heading + a column of options, active one tinted),
// filling the wide empty gutter a plain top-of-grid dropdown row left behind
// instead of just labeling that same dropdown. Wraps into a horizontal chip
// row below `lg` where there's no side gutter to speak of.
// `horizontal` renders as a compact, bordered chip row (for a filter bar
// above content) instead of the default full-width nav-list column (for an
// actual sidebar) - same active/inactive tokens either way, just different
// shape, so switching a caller between the two is a one-prop change.
export function SidebarFilterGroup({ label, options, value, onChange, horizontal = false }) {
  return (
    <div>
      <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>{label}</p>
      <div className={`flex flex-wrap gap-1.5 ${horizontal ? "" : "lg:flex-col"}`}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className={`text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors ${horizontal ? "border" : ""}`}
              style={{
                background: active ? CAMPUS.tealTint : (horizontal ? CAMPUS.paper : "transparent"),
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                fontWeight: active ? 600 : 500,
                borderColor: horizontal ? (active ? CAMPUS.teal : CAMPUS.line) : undefined,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SignInPrompt({ message }) {
  return (
    <CampusCard className="p-7 text-center max-w-sm mx-auto">
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
      <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>{message}</p>
      <CampusGoogleButton style={{ background: CAMPUS.ink, color: "#fff" }} />
    </CampusCard>
  );
}

// ---------------- List ----------------

// `category`/`difficulty` (controlled) let a caller that already renders its
// own filter sidebar elsewhere (see CampusGlobalSection's practice section)
// drive the filtering itself, passing `hideFilters` to skip this
// component's own <aside> so the two don't render side by side. Omit both
// and this manages its own category/difficulty state + sidebar, unchanged
// for every other caller (e.g. the authenticated Workspace's Practice tab).
// `adminMode`/`hiddenIds`/`onToggleHidden`: Manage's Practice & DSA screen
// reuses this exact list (rather than a second, drift-prone rendering) to
// let a campus admin hide a problem from THEIR institution's students -
// in adminMode, hidden problems stay visible (dimmed, with an unhide
// button) instead of disappearing, so there's something to click to
// restore them. Every real student-facing call site leaves these unset,
// so hidden problems just vanish from `filtered` as if they never existed.
export function CampusPracticeList({ onSelect, initialCategory, category: controlledCategory, difficulty: controlledDifficulty, hideFilters = false, adminMode = false, hiddenIds, onToggleHidden }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryState, setCategoryState] = useState(initialCategory || "All");
  const [difficultyState, setDifficultyState] = useState("All");
  const [search, setSearch] = useState("");
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const category = controlledCategory ?? categoryState;
  const difficulty = controlledDifficulty ?? difficultyState;

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setSolvedIds(new Set()); setAttemptedIds(new Set()); return; }
    fetchUserCodelabProgress(user.uid).then(p => setSolvedIds(new Set(Object.keys(p.solvedProblems || {})))).catch(() => {});
    fetchAttemptedProblemIds(user.uid).then(setAttemptedIds).catch(() => {});
  }, [user]);

  const q = search.trim().toLowerCase();
  const filtered = problems.filter(p =>
    (adminMode || !hiddenIds?.has(p.id)) &&
    (category === "All" || p.category === category) &&
    (difficulty === "All" || p.difficulty === difficulty) &&
    (!q || p.title?.toLowerCase().includes(q) || String(p.number ?? "").includes(q)));

  return (
    <div className={hideFilters ? "" : "flex gap-6 flex-col lg:flex-row"}>
      {!hideFilters && (
        <aside className="lg:w-52 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-5 lg:gap-6 lg:sticky lg:top-6">
            <SidebarFilterGroup label="CATEGORY" options={["All", ...CODELAB_CATEGORIES]} value={category} onChange={setCategoryState} />
            <SidebarFilterGroup label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={difficulty} onChange={setDifficultyState} />
          </div>
        </aside>
      )}

      <div className={hideFilters ? "" : "flex-1 min-w-0"}>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by title or number..."
            className="w-full text-[13px] pl-9 pr-3 py-2.5 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
          />
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <CampusCard key={i} className="p-4 space-y-3">
                <CampusSkeleton variant="rect" width={70} height={18} />
                <CampusSkeleton variant="text" width="65%" height={16} />
                <CampusSkeleton variant="text" width="35%" />
              </CampusCard>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <CampusEmptyState icon={Code2} title="No problems match" description="Try a different category or difficulty." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(p => {
              const rate = acceptanceRate(p);
              const solved = solvedIds.has(p.id);
              const attempted = !solved && attemptedIds.has(p.id);
              const hidden = adminMode && hiddenIds?.has(p.id);
              return (
                <div key={p.id} className="relative">
                  <button onClick={() => onSelect(p.id)} className="text-left w-full">
                    <CampusCard hover className="p-4 h-full" style={hidden ? { opacity: 0.5 } : undefined}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CampusChip color={CAMPUS.inkFaint}>{p.category}</CampusChip>
                        <CampusChip color={DIFF_COLOR[p.difficulty] || CAMPUS.good}>{p.difficulty}</CampusChip>
                        {hidden && <CampusChip color={CAMPUS.bad} icon={EyeOff} className="ml-auto">HIDDEN</CampusChip>}
                        {!hidden && solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2} className="ml-auto">SOLVED</CampusChip>}
                        {!hidden && attempted && <CampusChip color={CAMPUS.warn} icon={CircleDot} className="ml-auto">ATTEMPTED</CampusChip>}
                      </div>
                      <b className="block text-[14px] mb-1" style={{ color: CAMPUS.ink }}>
                        {p.number != null && <span style={{ color: CAMPUS.inkFaint }}>{p.number}. </span>}
                        {p.title}
                      </b>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: CAMPUS.inkFaint }}>
                        <span>~{p.estimatedTime || 15} min</span>
                        {rate !== null && <span>{rate}% acceptance</span>}
                      </div>
                    </CampusCard>
                  </button>
                  {adminMode && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleHidden(p.id, !hidden); }}
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
    </div>
  );
}

// ---------------- Problem view ----------------

export function CampusProblemView({ problemId, onBack }) {
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [sampleTests, setSampleTests] = useState([]);
  const [solved, setSolved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(STARTER_CODE.java);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);

  useEffect(() => {
    if (!problemId) { setLoading(false); return; }
    Promise.all([fetchProblem(problemId), fetchSampleTests(problemId)])
      .then(([p, tests]) => { setProblem(p); setSampleTests(tests); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [problemId]);

  useEffect(() => {
    if (!user || !problemId) return;
    fetchUserCodelabProgress(user.uid).then(p => setSolved(!!p.solvedProblems?.[problemId])).catch(() => {});
  }, [user, problemId]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
    setRunResults(null);
  };

  const handleRun = async () => {
    setRunning(true); setError(""); setRunResults(null);
    try {
      const results = await Promise.all(sampleTests.map(async (t) => {
        const res = await runCode({ language, code, stdin: t.input });
        const pass = (res.stdout || "").trim() === (t.expectedOutput || "").trim();
        return { test: t, pass, stdout: res.stdout, stderr: res.stderr, status: res.status };
      }));
      setRunResults(results);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(""); setVerdict(null);
    try {
      const result = await submitCode({ problemId, language, code });
      setVerdict(result);
      if (result.verdict === "Accepted") setSolved(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <CampusCard className="p-5 space-y-3">
          <CampusSkeleton variant="rect" width={90} height={16} />
          <CampusSkeleton variant="text" width="80%" height={22} />
          <CampusSkeleton variant="text" />
          <CampusSkeleton variant="text" width="60%" />
        </CampusCard>
        <CampusCard style={{ height: 420 }} className="p-5">
          <CampusSkeleton variant="rect" height="100%" />
        </CampusCard>
      </div>
    );
  }
  if (!problem) return <CampusEmptyState icon={Code2} title="Problem not found" description="This problem may have been unpublished or removed." />;

  const rate = acceptanceRate(problem);

  return (
    <div>
      <CampusBackButton onClick={onBack} />

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Statement */}
        <CampusCard>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CampusChip color={CAMPUS.inkFaint}>{problem.category}</CampusChip>
              <CampusChip color={DIFF_COLOR[problem.difficulty] || CAMPUS.good}>{problem.difficulty}</CampusChip>
              {rate !== null && <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{rate}% acceptance</span>}
              {solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2} className="ml-auto">SOLVED</CampusChip>}
            </div>
            <h1 className="text-xl font-bold mb-4" style={{ color: CAMPUS.ink }}>
              {problem.number != null && <span style={{ color: CAMPUS.inkFaint }}>{problem.number}. </span>}
              {problem.title}
            </h1>
            <p className="text-xs leading-relaxed whitespace-pre-wrap mb-4" style={{ color: CAMPUS.inkSoft }}>{problem.statement}</p>

            {problem.constraints && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>CONSTRAINTS</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: CAMPUS.inkFaint }}>{problem.constraints}</p>
              </div>
            )}
            {problem.examplesText && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EXAMPLES</p>
                <pre className="text-xs whitespace-pre-wrap rounded-lg p-3" style={{ color: CAMPUS.inkFaint, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>{problem.examplesText}</pre>
              </div>
            )}
            {problem.hints?.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-mono tracking-widest mb-1.5 flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Lightbulb size={10} /> HINTS</p>
                <div className="space-y-1.5">
                  {problem.hints.slice(0, revealedHints).map((h, i) => (
                    <p key={i} className="text-xs rounded-lg p-2.5" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>{h}</p>
                  ))}
                </div>
                {revealedHints < problem.hints.length && (
                  <button onClick={() => setRevealedHints(n => n + 1)} className="mt-1.5 text-[10px] hover:underline" style={{ color: CAMPUS.purple }}>
                    reveal hint {revealedHints + 1} of {problem.hints.length} →
                  </button>
                )}
              </div>
            )}
          </div>
        </CampusCard>

        {/* Editor */}
        <CampusCard>
          <div className="flex items-center gap-2 p-3 flex-wrap" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CODELAB_LANGUAGES.map(l => {
                const color = LANGUAGE_COLOR[l.id] || CAMPUS.teal;
                const active = language === l.id;
                return (
                  <button key={l.id} onClick={() => handleLanguageChange(l.id)}
                    className="text-[11.5px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: active ? `${color}20` : `${color}0d`,
                      color,
                      border: `1.5px solid ${active ? color : `${color}35`}`,
                      boxShadow: active ? CAMPUS.shadow : "none",
                    }}>
                    {l.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { navigator.clipboard?.writeText(code); }} title="Copy" style={{ color: CAMPUS.inkFaint }}><Copy size={13} /></button>
              <button onClick={() => setCode(STARTER_CODE[language] || "")} title="Reset" style={{ color: CAMPUS.inkFaint }}><RotateCcw size={13} /></button>
            </div>
          </div>

          {/* Monaco is desktop/tablet only - same graceful degradation as the
              main app's CodeLab (mobile isn't meant for writing full programs) */}
          <div className="hidden lg:block" style={{ height: 420 }}>
            <MonacoEditor
              height="420px"
              language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
              theme="light"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
            />
          </div>
          <div className="lg:hidden p-8 text-center">
            <Monitor size={24} className="mx-auto mb-3" style={{ color: CAMPUS.inkFaint }} />
            <p className="text-xs" style={{ color: CAMPUS.inkSoft }}>Switch to a larger screen to use the code editor.</p>
          </div>

          <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            {!user ? (
              <SignInPrompt message="You'll need a DeVert account to submit for grading." />
            ) : (
              <div className="hidden lg:flex gap-2">
                <button onClick={handleRun} disabled={running || sampleTests.length === 0}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
                  <Play size={12} /> {running ? "running..." : "run"}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
                  <Send size={12} /> {submitting ? "submitting..." : "submit"}
                </button>
              </div>
            )}

            {error && <p className="text-[10px]" style={{ color: CAMPUS.bad }}>{error}</p>}

            {runResults && (
              <div className="space-y-1.5">
                {runResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: `1px solid ${CAMPUS.line}` }}>
                    {r.pass ? <CheckCircle2 size={12} style={{ color: CAMPUS.good }} /> : <XCircle size={12} style={{ color: CAMPUS.bad }} />}
                    <span className="text-[10px]" style={{ color: CAMPUS.inkSoft }}>sample {i + 1}: {r.pass ? "passed" : `got "${(r.stdout || "").trim()}"`}</span>
                  </div>
                ))}
              </div>
            )}

            {verdict && (
              <div className="rounded-lg p-3" style={{ border: `1px solid ${verdict.verdict === "Accepted" ? CAMPUS.good + "50" : CAMPUS.bad + "50"}` }}>
                <p className="text-sm font-bold mb-1" style={{ color: verdict.verdict === "Accepted" ? CAMPUS.good : CAMPUS.bad }}>{verdict.verdict}</p>
                <p className="text-[10px]" style={{ color: CAMPUS.inkFaint }}>
                  {verdict.testsPassed}/{verdict.testsTotal} tests passed
                  {verdict.xpEarned > 0 && ` · +${verdict.xpEarned} XP · +${verdict.coinsEarned} coins`}
                  {verdict.alreadySolved && verdict.verdict === "Accepted" && " (already solved - no additional XP)"}
                </p>
              </div>
            )}
          </div>
        </CampusCard>
      </div>
    </div>
  );
}
