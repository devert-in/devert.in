"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ExternalLink, Play, RotateCcw, Loader2, CheckCircle2,
  Lock, Lightbulb, Clock, Cpu, AlertCircle, Share2, Target, ChevronRight, Youtube, XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsWindowed } from "@/components/window/is-windowed";
import { CODELAB_LANGUAGES, STARTER_CODE, runCode } from "@/lib/codelab";
import { starterCode, buildRun, gradeRun } from "@/lib/devert100-harness/index.mjs";
import { checkPythonSyntax } from "@/components/devert100/live-syntax-check";
import {
  DEVERT100_TOTAL_DAYS, DAY_STATE, dayState, currentDay, formatDayDate,
  fetchDay, subscribeToParticipant, completeDay, mainProblem, bonusProblems, problemLabel, problemVideo,
} from "@/lib/devert100";
import { Devert100ShareCard } from "@/components/devert100/devert100-share-card";
import { DeepDive, hasDeepDive } from "@/components/devert100/deep-dive";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const GREEN = "#00FF41";
const CYAN = "#00FFFF";
const GOLD = "#FFD700";
const DIFFICULTY_COLOR = { Easy: GREEN, Medium: "#FF9500", Hard: "#FF5050" };

// Java first, deliberately - this run is Java-oriented and the language picker
// defaulting to anything else would make most participants change it every day.
const DEFAULT_LANGUAGE = "java";

// Mirrors CodeExecutionController.MAX_CODE_LENGTH on devert-backend.
const RUN_CODE_LIMIT = 20_000;

function Section({ title, icon: Icon, color = CYAN, children, defaultOpen = true, reveal = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!children) return null;
  return (
    <div className="terminal-window overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="terminal-header w-full flex items-center gap-2 text-left cursor-pointer select-none transition-colors hover:bg-white/[0.06]">
        <Icon size={12} style={{ color }} className="ml-2" />
        <span className="font-mono text-[10px] text-white/45 tracking-wider">{title}</span>
        <ChevronRight size={13}
          className={`ml-auto mr-2 text-white/30 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="p-4 sm:p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Prose({ text }) {
  if (!text) return null;
  return (
    <p className="font-mono text-[13px] text-white/60 leading-relaxed whitespace-pre-line">{text}</p>
  );
}

// ── the completion dialog ─────────────────────────────────────────────────
// Completion is a deliberate act with a reflection attached, never a side
// effect of opening the page (see the spec's "do not accidentally complete").
// Every field is optional: forcing a confidence score to close the dialog
// would just train people to click 3.

function CompleteDialog({ day, problem, onCancel, onConfirm, busy, error }) {
  const [confidence, setConfidence] = useState(null);
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(3,5,9,0.8)" }} onClick={onCancel}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="terminal-window w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        style={{ borderColor: `${GREEN}35` }}>
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">complete_day_{day}</span>
        </div>
        <div className="p-5">
          <h3 className="font-sans text-lg font-bold text-white mb-1">Mark day {day} complete</h3>
          <p className="font-mono text-[11px] text-white/35 mb-5">{problem?.name}</p>

          <label className="block font-mono text-[10px] text-white/40 tracking-wider mb-2">CONFIDENCE (OPTIONAL)</label>
          <div className="flex gap-1.5 mb-5">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setConfidence(confidence === n ? null : n)}
                className="flex-1 py-2 rounded font-mono text-xs transition-colors"
                style={{
                  background: confidence === n ? GREEN : "rgba(255,255,255,0.05)",
                  color: confidence === n ? "#05080F" : "rgba(255,255,255,0.45)",
                  border: `1px solid ${confidence === n ? GREEN : "rgba(255,255,255,0.1)"}`,
                }}>{n}</button>
            ))}
          </div>

          <label className="block font-mono text-[10px] text-white/40 tracking-wider mb-2">TIME TAKEN, MINUTES (OPTIONAL)</label>
          <input type="number" min="1" max="600" value={minutes} onChange={e => setMinutes(e.target.value)}
            placeholder="45"
            className="w-full mb-5 px-3 py-2.5 rounded font-mono text-xs text-white outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />

          <label className="block font-mono text-[10px] text-white/40 tracking-wider mb-2">NOTES (OPTIONAL)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="What clicked? What would you miss next time?"
            className="w-full mb-5 px-3 py-2.5 rounded font-mono text-xs text-white outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />

          {error && (
            <div className="flex items-start gap-2 mb-4 font-mono text-[11px]" style={{ color: "#FF5050" }}>
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onCancel} disabled={busy}
              className="flex-1 py-2.5 rounded font-mono text-xs text-white/55"
              style={{ background: "rgba(255,255,255,0.06)" }}>Cancel</button>
            <button onClick={() => onConfirm({ confidence, minutes: minutes ? Number(minutes) : null, notes })}
              disabled={busy}
              className="flex-1 py-2.5 rounded font-mono text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ background: GREEN, color: "#05080F" }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {busy ? "SAVING" : "COMPLETE"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── test case results (LeetCode-style days) ───────────────────────────────
// One run executes every visible case; this shows them as case tabs with
// input / output / expected, plus whatever the learner printed while that
// case ran. Errors are the point of the panel as much as answers are: a
// compile error lists every message with the learner's own line number, and a
// runtime error names the exception, the line it was thrown on, and the trace.
// Every line number is a button that jumps the editor there.

const RED = "#FF5050";
const ORANGE = "#FF9500";

const STATUS_STYLE = {
  pass: { color: GREEN, label: "Passed" },
  fail: { color: RED, label: "Wrong Answer" },
  runtime: { color: ORANGE, label: "Runtime Error" },
  timeout: { color: ORANGE, label: "Time Limit Exceeded or crashed" },
  notRun: { color: "rgba(255,255,255,0.3)", label: "Not run" },
};

function CaseField({ label, value, color }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 tracking-wider mb-1">{label}</p>
      <pre className="font-mono text-[11px] px-3 py-2 rounded whitespace-pre-wrap break-all max-h-32 overflow-y-auto"
        style={{ background: "rgba(255,255,255,0.04)", color: color || "rgba(255,255,255,0.75)" }}>{value}</pre>
    </div>
  );
}

function LineLink({ line, onJump }) {
  if (!line) return null;
  return (
    <button onClick={() => onJump?.(line)} className="underline decoration-dotted underline-offset-2 hover:opacity-80"
      title="Show this line in the editor">line {line}</button>
  );
}

function ErrorBox({ title, children }) {
  return (
    <div className="rounded px-3 py-2.5 space-y-1.5" style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)" }}>
      <p className="font-mono text-[11px] font-semibold" style={{ color: RED }}>{title}</p>
      {children}
    </div>
  );
}

function TestResults({ run, onJump }) {
  const [active, setActive] = useState(0);
  if (!run) return null;
  const { results = [], compileErrors, stderr, timeMs } = run;
  const passed = results.filter(r => r.status === "pass").length;
  const allPass = results.length > 0 && passed === results.length;
  const r = results[Math.min(active, results.length - 1)];
  const headline = compileErrors ? "Compile Error"
    : results.length ? `${passed} / ${results.length} cases passed` : "Run failed";
  return (
    <div className="terminal-window overflow-hidden">
      <div className="terminal-header flex items-center gap-2">
        <span className="font-mono text-[10px] ml-2 inline-flex items-center gap-1.5"
          style={{ color: allPass ? GREEN : RED }}>
          {allPass ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {headline}
        </span>
        {timeMs > 0 && !compileErrors && <span className="font-mono text-[10px] text-white/25 ml-auto mr-2 flex items-center gap-1"><Clock size={10} />{timeMs} ms</span>}
      </div>
      <div className="p-3 space-y-3">
        {compileErrors ? (
          <ErrorBox title={`${compileErrors.length} compile error${compileErrors.length === 1 ? "" : "s"} - no case ran`}>
            {compileErrors.map((e, i) => (
              <p key={i} className="font-mono text-[11px] whitespace-pre-wrap break-words" style={{ color: "#FF9A9A" }}>
                {e.line ? <><LineLink line={e.line} onJump={onJump} />{e.col ? `:${e.col}` : ""}: </> : null}{e.message}
              </p>
            ))}
          </ErrorBox>
        ) : (stderr && !results.some(x => x.status === "pass" || x.status === "fail" || x.status === "runtime")) ? (
          <ErrorBox title="The run did not finish">
            <pre className="font-mono text-[11px] whitespace-pre-wrap break-words max-h-40 overflow-y-auto" style={{ color: "#FF9A9A" }}>{stderr}</pre>
          </ErrorBox>
        ) : null}
        {results.length > 0 && !compileErrors && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {results.map((x, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className="font-mono text-[10px] px-2.5 py-1.5 rounded inline-flex items-center gap-1.5"
                  style={{
                    background: i === active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                    color: i === active ? "#fff" : "rgba(255,255,255,0.5)",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_STYLE[x.status].color }} />
                  Case {i + 1}
                </button>
              ))}
            </div>
            {r && (
              <div className="space-y-2.5">
                <p className="font-mono text-[11px]" style={{ color: STATUS_STYLE[r.status].color }}>
                  {STATUS_STYLE[r.status].label}<span className="text-white/30"> - {r.label}</span>
                </p>
                {r.status === "runtime" && r.error && (
                  <ErrorBox title={`${r.error.type || "Error"}${r.error.message ? ": " + r.error.message : ""}`}>
                    {r.error.line ? (
                      <p className="font-mono text-[11px]" style={{ color: "#FF9A9A" }}>Thrown at <LineLink line={r.error.line} onJump={onJump} /> of your code.</p>
                    ) : null}
                    {r.error.trace ? (
                      <pre className="font-mono text-[10.5px] whitespace-pre-wrap break-words max-h-32 overflow-y-auto text-white/45">{r.error.trace}</pre>
                    ) : null}
                  </ErrorBox>
                )}
                {r.status === "timeout" && (
                  <ErrorBox title="This case never finished">
                    <p className="font-mono text-[11px]" style={{ color: "#FF9A9A" }}>
                      Usually an infinite loop or very slow solution, or a crash that stops the whole
                      program (in C/C++, often a null pointer or out-of-bounds access).
                    </p>
                  </ErrorBox>
                )}
                {r.status === "notRun" && (
                  <p className="font-mono text-[11px] text-white/35">An earlier case stopped the run before this one started.</p>
                )}
                <CaseField label="INPUT" value={r.input} />
                {(r.status === "pass" || r.status === "fail") && <CaseField label="YOUR OUTPUT" value={r.output} color={r.status === "pass" ? GREEN : "#FF8080"} />}
                <CaseField label="EXPECTED" value={r.expected} />
                {r.stdout && <CaseField label="STDOUT" value={r.stdout} color="rgba(255,255,255,0.55)" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function safeStarter(harness, language) {
  if (!harness) return STARTER_CODE[language] ?? "";
  try { return starterCode(harness, language); } catch { return STARTER_CODE[language] ?? ""; }
}

// ── page ──────────────────────────────────────────────────────────────────

export function Devert100Workspace({ day }) {
  const dayNum = Number(day);
  const windowed = useIsWindowed();
  const { user, userData, loading: authLoading } = useAuth();

  const [dayDoc, setDayDoc] = useState(undefined);
  const [participant, setParticipant] = useState(undefined);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(STARTER_CODE[DEFAULT_LANGUAGE]);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState(null);
  const [testRun, setTestRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showShare, setShowShare] = useState(false);

  // A day with a harness spec is LeetCode-style: the learner writes only the
  // function, and Run checks it against the day's visible cases. A day without
  // one keeps the plain full-program scratchpad.
  // Stored as a JSON string (scripts/import-devert100.mjs says why); memoised on
  // the string so the parsed object keeps one identity across renders - the
  // draft and live-check effects depend on it.
  const harnessJson = mainProblem(dayDoc)?.harnessJson || null;
  const harness = useMemo(() => {
    if (!harnessJson) return null;
    try { return JSON.parse(harnessJson); } catch { return null; }
  }, [harnessJson]);

  // Drafts are per day AND per language, kept in localStorage only. This is
  // scratch work on an external problem, not a graded submission, so it has no
  // business costing a Firestore write on every keystroke - and it survives a
  // refresh, which is all it needs to do. Function-only drafts use their own
  // key: a full `public class Main` draft from the scratchpad era would not
  // compile inside the harness.
  const draftKey = `devert100:draft:${harness ? "fn:" : ""}${dayNum}:${language}`;
  const loadedDraftFor = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setDayDoc(undefined);
    fetchDay(dayNum)
      .then(d => { if (!cancelled) setDayDoc(d); })
      .catch(() => { if (!cancelled) setDayDoc(null); });
    return () => { cancelled = true; };
  }, [dayNum]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) { setParticipant(null); return undefined; }
    return subscribeToParticipant(user.uid, setParticipant);
  }, [user, authLoading]);

  useEffect(() => {
    // Wait for the day doc: whether this day is function-only decides both the
    // draft key and the starter code.
    if (dayDoc === undefined) return;
    if (loadedDraftFor.current === draftKey) return;
    loadedDraftFor.current = draftKey;
    let saved = null;
    try { saved = localStorage.getItem(draftKey); } catch { /* private mode */ }
    setCode(saved ?? safeStarter(harness, language));
    setOutput(null);
    setTestRun(null);
  }, [draftKey, language, dayDoc, harness]);

  useEffect(() => {
    if (loadedDraftFor.current !== draftKey) return;
    const t = setTimeout(() => { try { localStorage.setItem(draftKey, code); } catch { /* ignore */ } }, 500);
    return () => clearTimeout(t);
  }, [code, draftKey]);

  // ── editor markers ──
  // Two owners so they never clobber each other: "dv100-run" holds what the
  // last Run reported (compile + runtime errors, in the learner's line numbers)
  // and is cleared as soon as the code changes; "dv100-live" holds the
  // while-you-type Python syntax check.
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const setMarkers = useCallback((owner, list) => {
    const monaco = monacoRef.current, model = editorRef.current?.getModel?.();
    if (!monaco || !model) return;
    const lines = model.getLineCount();
    monaco.editor.setModelMarkers(model, owner, (list || []).filter(m => m.startLine >= 1 && m.startLine <= lines).map(m => ({
      startLineNumber: m.startLine,
      startColumn: m.startCol || 1,
      endLineNumber: m.endLine || m.startLine,
      endColumn: m.endCol || model.getLineMaxColumn(m.endLine || m.startLine),
      message: m.message,
      severity: monaco.MarkerSeverity.Error,
    })));
  }, []);

  const markRunErrors = useCallback((graded) => {
    const marks = [];
    for (const e of graded.compileErrors || []) {
      if (e.line) marks.push({ startLine: e.line, startCol: e.col || 1, message: e.message });
    }
    graded.results.forEach((r, i) => {
      const e = r.status === "runtime" ? r.error : null;
      if (e?.line && !marks.some(m => m.startLine === e.line)) {
        marks.push({ startLine: e.line, message: `Runtime error in case ${i + 1}: ${e.type || "Error"}${e.message ? ": " + e.message : ""}` });
      }
    });
    setMarkers("dv100-run", marks);
    if (marks[0]) editorRef.current?.revealLineInCenterIfOutsideViewport?.(marks[0].startLine);
  }, [setMarkers]);

  const jumpToLine = useCallback((line) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.revealLineInCenter(line);
    ed.setPosition({ lineNumber: line, column: 1 });
    ed.focus();
  }, []);

  // Stale run markers would point at lines that have since moved.
  useEffect(() => { setMarkers("dv100-run", []); }, [code, language, setMarkers]);

  // Live Python syntax check - free, in the browser, never runs the code.
  useEffect(() => {
    if (language !== "python" || !harness) { setMarkers("dv100-live", []); return undefined; }
    let cancelled = false;
    const t = setTimeout(() => {
      checkPythonSyntax(code).then(list => { if (!cancelled && list) setMarkers("dv100-live", list); });
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [code, language, harness, setMarkers]);

  const handleRun = useCallback(async () => {
    setRunning(true); setOutput(null); setTestRun(null);
    if (harness) {
      try {
        const { code: program, stdin: caseInput } = buildRun(harness, language, code);
        // devert-backend caps a run at MAX_CODE_LENGTH (20,000 chars) and the
        // hidden driver counts toward it, so say how much of it is theirs.
        if (program.length > RUN_CODE_LIMIT) {
          const room = RUN_CODE_LIMIT - (program.length - code.length);
          setTestRun({ results: [], stderr: `Your code is ${code.length.toLocaleString()} characters; this problem leaves room for about ${Math.max(0, room).toLocaleString()}. Trim comments or unused helpers and run again.` });
          return;
        }
        const res = await runCode({ language, code: program, stdin: caseInput });
        const stderr = res.stderr || res.compileOutput || "";
        const graded = gradeRun(harness, res.stdout || "", harness.cases, stderr);
        setTestRun({
          ...graded,
          // The runner's own "Internal error: code execution failed" is what it
          // says for a program it had to kill; the drivers report every error
          // they can catch, so by the time this text survives it means a time
          // limit or an uncatchable crash, and the case tabs say which case.
          stderr: /^Internal error/i.test(stderr.trim()) ? "The program was stopped before it finished - a time limit or a crash. The case tabs show where." : stderr,
          timeMs: res.timeMs,
        });
        markRunErrors(graded);
      } catch (e) {
        setTestRun({ results: [], stderr: e?.message || "Execution failed." });
      } finally {
        setRunning(false);
      }
      return;
    }
    try {
      const res = await runCode({ language, code, stdin });
      setOutput({
        ok: !res.stderr && !res.compileOutput,
        text: res.stdout || res.stderr || res.compileOutput || res.message || "(no output)",
        timeMs: res.timeMs,
      });
    } catch (e) {
      setOutput({ ok: false, text: e?.message || "Execution failed." });
    } finally {
      setRunning(false);
    }
  }, [harness, language, code, stdin, markRunErrors]);

  async function handleComplete(reflection) {
    setSaving(true); setSaveError("");
    try {
      await completeDay(user.uid, dayNum, reflection);
      setDialogOpen(false);
      setShowShare(true);
    } catch (e) {
      setSaveError(e?.message || "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const live = currentDay();
  const completedDays = participant?.completedDays || {};
  const state = dayState(dayNum, completedDays);
  const isDone = state === DAY_STATE.COMPLETED;
  const isLocked = state === DAY_STATE.LOCKED;
  const joined = !!participant;

  const problem = mainProblem(dayDoc);
  const bonuses = bonusProblems(dayDoc);
  const video = problemVideo(problem);
  const deep = hasDeepDive(problem);

  const shell = (children) => (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-5 sm:px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">{children}</div>
    </main>
  );

  // Breadcrumb answers "where am I" on every one of these states, including
  // the error ones - a dead end with no way back is the worst version of this.
  const crumb = (
    <div className="flex items-center gap-2 font-mono text-[11px] text-white/30 mb-6 flex-wrap">
      <Link href="/" className="hover:text-white/60">DeVert</Link>
      <span>/</span>
      <Link href="/devert100" className="hover:text-white/60">DeVert100</Link>
      <span>/</span>
      <span className="text-white/55">Day {dayNum}</span>
    </div>
  );

  if (dayDoc === undefined || authLoading) {
    return shell(<>{crumb}
      <div className="terminal-window p-10 flex items-center justify-center gap-3">
        <Loader2 size={16} className="animate-spin text-white/30" />
        <span className="font-mono text-xs text-white/35">loading day {dayNum}...</span>
      </div></>);
  }

  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > DEVERT100_TOTAL_DAYS || !dayDoc) {
    return shell(<>{crumb}
      <div className="terminal-window p-10 text-center">
        <AlertCircle size={22} className="mx-auto mb-3 text-white/25" />
        <h1 className="font-sans text-xl font-bold text-white mb-2">Day {dayNum} is not part of this run</h1>
        <p className="font-mono text-xs text-white/35 mb-5">DeVert100 runs days 1 to {DEVERT100_TOTAL_DAYS}.</p>
        <Link href="/devert100" className="font-mono text-xs px-4 py-2.5 rounded inline-block"
          style={{ background: CYAN, color: "#05080F" }}>BACK TO THE RUN</Link>
      </div></>);
  }

  if (isLocked) {
    return shell(<>{crumb}
      <div className="terminal-window p-10 text-center">
        <Lock size={22} className="mx-auto mb-3 text-white/25" />
        <h1 className="font-sans text-xl font-bold text-white mb-2">Day {dayNum} unlocks {formatDayDate(dayNum)}</h1>
        <p className="font-mono text-xs text-white/35 mb-5">
          Everyone runs the same calendar. Today is day {live}.
        </p>
        <Link href={`/devert100/day/${live}`} className="font-mono text-xs px-4 py-2.5 rounded inline-block"
          style={{ background: CYAN, color: "#05080F" }}>GO TO TODAY</Link>
      </div></>);
  }

  return shell(
    <>
      {crumb}

      {/* ── header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="font-mono text-[10px] tracking-widest px-2 py-1 rounded inline-flex items-center gap-1.5"
            style={{ color: isDone ? GREEN : CYAN, background: `${isDone ? GREEN : CYAN}15`, border: `1px solid ${isDone ? GREEN : CYAN}35` }}>
            {isDone ? <><CheckCircle2 size={11} /> COMPLETED</> : state === DAY_STATE.TODAY ? <><Target size={11} /> TODAY</> : "AVAILABLE"}
          </span>
          <span className="font-mono text-[10px] text-white/25">{formatDayDate(dayNum)}</span>
          <span className="font-mono text-[10px] text-white/25">WEEK {dayDoc.week}</span>
        </div>

        <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// day {dayNum} / {DEVERT100_TOTAL_DAYS}</p>
        <h1 className="font-sans font-bold tracking-tight text-white leading-tight mb-3"
          style={{ fontSize: "clamp(1.75rem,4.5vw,3rem)" }}>
          {problem?.name}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {problemLabel(problem) && (
            <span className="font-mono text-[11px] px-1.5 rounded" style={{ color: CYAN, background: `${CYAN}12` }}>
              {problemLabel(problem)}
            </span>
          )}
          <span className="font-mono text-[11px] text-white/55">{dayDoc.topic}</span>
          <span className="font-mono text-[11px]" style={{ color: DIFFICULTY_COLOR[problem?.difficulty] || "#fff6" }}>
            {problem?.difficulty}
          </span>
          <span className="font-mono text-[11px] text-white/40">{problem?.pattern}</span>
          {problem?.url && (
            <a href={problem.url} target="_blank" rel="noopener noreferrer"
              className="font-mono text-[11px] inline-flex items-center gap-1 hover:opacity-80" style={{ color: CYAN }}>
              Solve on {problem.platform} <ExternalLink size={11} />
            </a>
          )}
          {video && (
            <a href={video.url} target="_blank" rel="noopener noreferrer"
              className="font-mono text-[11px] inline-flex items-center gap-1 hover:opacity-80"
              style={{ color: "#FF5050" }}
              title={video.curated ? "A video picked for this problem" : "Opens a YouTube search - no video has been picked for this problem yet"}>
              <Youtube size={12} /> {video.label}
            </a>
          )}
        </div>
      </div>

      {/* ── day nav ── */}
      <div className="flex items-center gap-2 mb-6">
        {dayNum > 1 ? (
          <Link href={`/devert100/day/${dayNum - 1}`}
            className="font-mono text-[11px] px-3 py-2 rounded inline-flex items-center gap-1.5 text-white/55"
            style={{ background: "rgba(255,255,255,0.05)" }}><ArrowLeft size={12} /> Day {dayNum - 1}</Link>
        ) : <span />}
        <Link href="/devert100" className="font-mono text-[11px] px-3 py-2 rounded text-white/40 mx-auto"
          style={{ background: "rgba(255,255,255,0.03)" }}>All days</Link>
        {dayNum < live ? (
          <Link href={`/devert100/day/${dayNum + 1}`}
            className="font-mono text-[11px] px-3 py-2 rounded inline-flex items-center gap-1.5 text-white/55"
            style={{ background: "rgba(255,255,255,0.05)" }}>Day {dayNum + 1} <ArrowRight size={12} /></Link>
        ) : (
          <span className="font-mono text-[11px] px-3 py-2 rounded inline-flex items-center gap-1.5 text-white/20"
            title={dayNum < DEVERT100_TOTAL_DAYS ? `Unlocks ${formatDayDate(dayNum + 1)}` : "End of the run"}>
            <Lock size={11} /> Day {dayNum + 1}
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* ── left: understand ── */}
        <div className="space-y-4 min-w-0">
          {/* A hand-authored deep dive REPLACES the short sheet fields rather
              than sitting beside them: it covers the same seven steps in full,
              and showing both would have the one-line "Brute Force" column
              directly above a worked version of the same thing.

              Most days have no deep dive yet. Those fall back to the short
              fields below, which is the honest default - the long-form writeup
              is authored by hand (scripts/data/devert100-deepdives/) because
              nothing in the source spreadsheet can produce it. */}
          {deep ? <DeepDive problem={problem} /> : <>
          <Section title="problem" icon={Target} color={CYAN}>
            <Prose text={problem?.statement} />
          </Section>

          {dayDoc.patternGuide && (
            <Section title={`pattern - ${problem?.pattern || dayDoc.topic}`} icon={Lightbulb} color="#C77DFF" defaultOpen={false} reveal>
              <p className="font-mono text-[10px] text-white/30 tracking-wider mb-1.5">WHEN TO RECOGNISE IT</p>
              <Prose text={dayDoc.patternGuide.whenToUse} />
              {dayDoc.patternGuide.template && (
                <>
                  <p className="font-mono text-[10px] text-white/30 tracking-wider mt-4 mb-1.5">MUST-REMEMBER</p>
                  <Prose text={dayDoc.patternGuide.template} />
                </>
              )}
            </Section>
          )}

          {/* Collapsed by default - the point of the run is to try first. */}
          <div className="terminal-window p-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <p className="font-mono text-[12px] text-white/45 leading-relaxed">
              <span style={{ color: GOLD }}>Think first.</span> Can you get to a working
              solution before opening the two sections below?
            </p>
          </div>

          <Section title="brute force" icon={RotateCcw} color="#FF9500" defaultOpen={false} reveal>
            <Prose text={problem?.bruteForce} />
          </Section>

          <Section title="optimal approach" icon={Cpu} color={GREEN} defaultOpen={false} reveal>
            <Prose text={problem?.optimal} />
            <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="font-mono text-[10px] text-white/30 tracking-wider mb-1">TIME</p>
                <p className="font-mono text-sm" style={{ color: GREEN }}>{problem?.timeComplexity || "-"}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-white/30 tracking-wider mb-1">SPACE</p>
                <p className="font-mono text-sm" style={{ color: CYAN }}>{problem?.spaceComplexity || "-"}</p>
              </div>
            </div>
          </Section>

          {problem?.keyPoints && (
            <Section title="key points" icon={AlertCircle} color="#FFD700" defaultOpen={false} reveal>
              <Prose text={problem.keyPoints} />
            </Section>
          )}

          {problem?.followUps && (
            <Section title="interview follow-ups" icon={ChevronRight} color="#A78BFA" defaultOpen={false} reveal>
              <Prose text={problem.followUps} />
            </Section>
          )}

          </>}

          {bonuses.length > 0 && (
            <Section title={`bonus (${bonuses.length})`} icon={Lightbulb} color={CYAN} defaultOpen={false}>
              <div className="space-y-3">
                {bonuses.map((b, i) => (
                  <div key={i} className="pb-3" style={{ borderBottom: i < bonuses.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="font-sans text-sm font-semibold text-white/85">{b.name}</span>
                      {problemLabel(b) && <span className="font-mono text-[10px]" style={{ color: CYAN }}>{problemLabel(b)}</span>}
                      <span className="font-mono text-[10px]" style={{ color: DIFFICULTY_COLOR[b.difficulty] || "#fff6" }}>{b.difficulty}</span>
                      <span className="ml-auto flex items-center gap-2.5">
                        {problemVideo(b) && (
                          <a href={problemVideo(b).url} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[10px] inline-flex items-center gap-1" style={{ color: "#FF5050" }}>
                            <Youtube size={11} /> video
                          </a>
                        )}
                        {b.url && (
                          <a href={b.url} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[10px] inline-flex items-center gap-1" style={{ color: CYAN }}>
                            open <ExternalLink size={10} />
                          </a>
                        )}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-white/45 leading-relaxed">{b.statement}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── right: code ── */}
        <div className="space-y-4 min-w-0 lg:sticky lg:top-[88px]">
          <div className="terminal-window overflow-hidden">
            <div className="terminal-header flex items-center gap-2">
              <span className="font-mono text-[10px] text-white/25 ml-2">{harness ? "code" : "scratchpad"}</span>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="ml-auto mr-2 font-mono text-[10px] text-white/60 rounded px-2 py-1 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {CODELAB_LANGUAGES.map(l => <option key={l.id} value={l.id} style={{ background: "#0b0f17" }}>{l.label}</option>)}
              </select>
            </div>
            {/* Height comes from the wrapper, not the prop, so it can shrink on a
                phone. A fixed 340px editor plus the run bar and the output panel
                is most of a small screen before any problem text is visible. */}
            <div className="h-[230px] sm:h-[300px] lg:h-[340px]">
            <MonacoEditor
              height="100%"
              language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v ?? "")}
              beforeMount={monaco => {
                // JavaScript gets syntax squiggles from Monaco's own worker for
                // free. Semantic checks stay off: they would flag ListNode,
                // TreeNode and other names the hidden driver provides.
                monaco.languages.typescript?.javascriptDefaults?.setDiagnosticsOptions({
                  noSemanticValidation: true, noSyntaxValidation: false,
                });
              }}
              onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }}
              options={{
                minimap: { enabled: false }, fontSize: 13, lineNumbers: "on",
                scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4,
                fontFamily: "var(--font-mono), monospace", padding: { top: 12 },
              }}
            />
            </div>
            <div className="p-3 flex items-center gap-2 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button onClick={handleRun} disabled={running}
                className="font-mono text-[11px] font-semibold px-3.5 py-2 rounded inline-flex items-center gap-1.5 disabled:opacity-60"
                style={{ background: GREEN, color: "#05080F" }}>
                {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {running ? "RUNNING" : "RUN"}
              </button>
              <button onClick={() => { setCode(safeStarter(harness, language)); setOutput(null); setTestRun(null); }}
                className="font-mono text-[11px] px-3 py-2 rounded text-white/50 inline-flex items-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <RotateCcw size={11} /> Reset
              </button>
              <span className="font-mono text-[10px] text-white/22 ml-auto">saved locally</span>
            </div>
          </div>

          {harness ? (
            <>
              <TestResults key={testRun ? "run" : "none"} run={testRun} onJump={jumpToLine} />
              {/* The visible cases are the official examples plus a few edge
                  cases - a pass here is a strong signal, not the platform's
                  full judge, and the copy says so. */}
              <p className="font-mono text-[10px] text-white/25 leading-relaxed px-1">
                Write only the {harness.kind === "design" ? "class" : "function"} - Run checks it against{" "}
                {harness.cases.length} cases (the official examples plus edge cases).
                Submit on {problem?.platform || "the platform"} for the full judge, then mark the day here.
              </p>
            </>
          ) : (
            <>
              <div className="terminal-window overflow-hidden">
                <div className="terminal-header"><span className="font-mono text-[10px] text-white/25 ml-2">stdin</span></div>
                <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={2}
                  placeholder="Input for your program, if it reads any."
                  className="w-full px-3 py-2.5 font-mono text-[11px] text-white/80 outline-none resize-none bg-transparent" />
              </div>

              {output && (
                <div className="terminal-window overflow-hidden">
                  <div className="terminal-header flex items-center gap-2">
                    <span className="font-mono text-[10px] ml-2" style={{ color: output.ok ? GREEN : "#FF5050" }}>output</span>
                    {output.timeMs > 0 && <span className="font-mono text-[10px] text-white/25 ml-auto mr-2 flex items-center gap-1"><Clock size={10} />{output.timeMs} ms</span>}
                  </div>
                  <pre className="p-3 font-mono text-[11px] text-white/70 whitespace-pre-wrap break-words max-h-52 overflow-y-auto">{output.text}</pre>
                </div>
              )}

              {/* No auto-grading here, and the copy says so rather than implying a
                  verdict the run cannot produce - this day has no harness spec. */}
              <p className="font-mono text-[10px] text-white/25 leading-relaxed px-1">
                This scratchpad runs your code and shows output. It does not judge correctness -
                submit on {problem?.platform || "the platform"} for the verdict, then mark the day here.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── completion ── */}
      <div className="mt-8">
        {!user ? (
          <Link href={`/login?next=/devert100/day/${dayNum}`}
            className="w-full py-4 rounded font-mono text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.07)", color: "#fff" }}>
            Sign in to track this day
          </Link>
        ) : !joined ? (
          <Link href="/devert100"
            className="w-full py-4 rounded font-mono text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: CYAN, color: "#05080F" }}>
            Join DeVert100 to track this day
          </Link>
        ) : isDone ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 py-4 rounded font-mono text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}35` }}>
              <CheckCircle2 size={16} /> DAY {dayNum} COMPLETE
            </div>
            <button onClick={() => setShowShare(true)}
              className="sm:w-52 py-4 rounded font-mono text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: GREEN, color: "#05080F" }}>
              <Share2 size={15} /> SHARE
            </button>
          </div>
        ) : (
          <button onClick={() => setDialogOpen(true)}
            className="w-full py-4 rounded font-mono text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: GREEN, color: "#05080F" }}>
            <CheckCircle2 size={16} /> MARK DAY {dayNum} AS COMPLETE
          </button>
        )}
      </div>

      <AnimatePresence>
        {dialogOpen && (
          <CompleteDialog day={dayNum} problem={problem} busy={saving} error={saveError}
            onCancel={() => { setDialogOpen(false); setSaveError(""); }}
            onConfirm={handleComplete} />
        )}
        {showShare && (
          <Devert100ShareCard
            day={dayNum}
            problem={problem}
            topic={dayDoc.topic}
            participant={participant}
            displayName={userData?.displayName || userData?.username || user?.displayName || ""}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

