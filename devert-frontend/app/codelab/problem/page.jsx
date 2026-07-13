"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Play, Send, RotateCcw, Copy, Lightbulb, CheckCircle2, XCircle, Monitor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchProblem, fetchSampleTests, fetchUserCodelabProgress,
  runCode, submitCode, acceptanceRate, CODELAB_LANGUAGES,
} from "@/lib/codelab";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const DIFF_COLOR = { Easy: "#00FF41", Medium: "#FF9500", Hard: "#FF5050" };

const STARTER_CODE = {
  java: "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  python: "def solve():\n    pass\n\nsolve()\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  javascript: "function solve() {\n  \n}\n\nsolve();\n",
  c: "#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n",
};

function ProblemContent() {
  const problemId = useSearchParams().get("id");
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
    if (!user) { window.location.href = `/login?next=${encodeURIComponent(`/codelab/problem?id=${problemId}`)}`; return; }
    setSubmitting(true); setError(""); setVerdict(null);
    try {
      const result = await submitCode({ uid: user.uid, problemId, language, code });
      setVerdict(result);
      if (result.verdict === "Accepted") setSolved(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 animate-pulse text-center mt-20">loading...</p></main>;
  }
  if (!problem) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 text-center mt-20">problem not found</p></main>;
  }

  const rate = acceptanceRate(problem);

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <Link href="/codelab" className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={12} /> back to codelab
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Statement */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">problem.statement</span>
              {solved && <span className="ml-auto flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#00FF41", background: "rgba(0,255,65,0.1)" }}><CheckCircle2 size={9} /> SOLVED</span>}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{problem.category}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: DIFF_COLOR[problem.difficulty] || "#00FF41", background: `${DIFF_COLOR[problem.difficulty] || "#00FF41"}15` }}>{problem.difficulty}</span>
                {rate !== null && <span className="font-mono text-[9px] text-white/25">{rate}% acceptance</span>}
              </div>
              <h1 className="font-sans text-2xl font-bold text-white mb-4">{problem.title}</h1>
              <p className="font-mono text-xs text-white/60 leading-relaxed whitespace-pre-wrap mb-4">{problem.statement}</p>

              {problem.constraints && (
                <div className="mb-4">
                  <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1">CONSTRAINTS</p>
                  <p className="font-mono text-xs text-white/45 whitespace-pre-wrap">{problem.constraints}</p>
                </div>
              )}
              {problem.examplesText && (
                <div className="mb-4">
                  <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1">EXAMPLES</p>
                  <pre className="font-mono text-xs text-white/45 whitespace-pre-wrap bg-white/3 rounded-lg p-3 border border-white/6">{problem.examplesText}</pre>
                </div>
              )}
              {problem.hints?.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1.5 flex items-center gap-1"><Lightbulb size={10} /> HINTS</p>
                  <div className="space-y-1.5">
                    {problem.hints.slice(0, revealedHints).map((h, i) => (
                      <p key={i} className="font-mono text-xs text-white/45 border border-white/6 rounded-lg p-2.5">{h}</p>
                    ))}
                  </div>
                  {revealedHints < problem.hints.length && (
                    <button onClick={() => setRevealedHints(n => n + 1)} className="mt-1.5 font-mono text-[10px] text-neon-purple hover:underline">
                      reveal hint {revealedHints + 1} of {problem.hints.length} →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="terminal-window">
            <div className="terminal-header flex-wrap gap-2">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <select value={language} onChange={e => handleLanguageChange(e.target.value)}
                className="ml-2 font-mono text-[10px] text-white/70 px-2 py-1 rounded outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {CODELAB_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(code); }} title="Copy" className="text-white/25 hover:text-white/60 transition-colors"><Copy size={12} /></button>
                <button onClick={() => setCode(STARTER_CODE[language] || "")} title="Reset" className="text-white/25 hover:text-white/60 transition-colors"><RotateCcw size={12} /></button>
              </div>
            </div>

            {/* Monaco is desktop/tablet only - matches "mobile shouldn't write huge programs" */}
            <div className="hidden lg:block" style={{ height: 420 }}>
              <MonacoEditor
                height="420px"
                language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
              />
            </div>
            <div className="lg:hidden p-8 text-center">
              <Monitor size={24} className="mx-auto mb-3 text-white/20" />
              <p className="font-mono text-xs text-white/35">Switch to a larger screen to use the code editor.</p>
            </div>

            <div className="p-4 border-t border-white/6 space-y-3">
              <div className="flex gap-2">
                <button onClick={handleRun} disabled={running || sampleTests.length === 0}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Play size={12} /> {running ? "running..." : "run"}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send size={12} /> {submitting ? "submitting..." : "submit"}
                </button>
              </div>

              {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

              {runResults && (
                <div className="space-y-1.5">
                  {runResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 border border-white/6 rounded-lg px-3 py-2">
                      {r.pass ? <CheckCircle2 size={12} style={{ color: "#00FF41" }} /> : <XCircle size={12} style={{ color: "#FF5050" }} />}
                      <span className="font-mono text-[10px] text-white/50">sample {i + 1}: {r.pass ? "passed" : `got "${(r.stdout || "").trim()}"`}</span>
                    </div>
                  ))}
                </div>
              )}

              {verdict && (
                <div className="border rounded-lg p-3" style={{ borderColor: verdict.verdict === "Accepted" ? "rgba(0,255,65,0.3)" : "rgba(255,80,80,0.3)" }}>
                  <p className="font-mono text-sm font-bold mb-1" style={{ color: verdict.verdict === "Accepted" ? "#00FF41" : "#FF5050" }}>{verdict.verdict}</p>
                  <p className="font-mono text-[10px] text-white/40">
                    {verdict.testsPassed}/{verdict.testsTotal} tests passed
                    {verdict.xpEarned > 0 && ` · +${verdict.xpEarned} XP · +${verdict.coinsEarned} coins`}
                    {verdict.alreadySolved && verdict.verdict === "Accepted" && " (already solved - no additional XP)"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProblemPage() {
  return (
    <Suspense fallback={null}>
      <ProblemContent />
    </Suspense>
  );
}
