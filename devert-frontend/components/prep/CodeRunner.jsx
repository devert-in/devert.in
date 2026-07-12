"use client";

// Embedded code editor + judge harness shared by /prep/code, contests and
// coding practice. Runs python (pyodide worker), javascript (sandboxed
// worker) and java/c/cpp (Piston) via @/lib/prep/judge.

import { useState, useEffect, useMemo, useRef, useCallback, useId } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { CheckCircle2, XCircle, EyeOff, RotateCcw, AlertTriangle } from "lucide-react";
import { cn, BracketButton } from "@/components/prep/ui";
import { LANGUAGES, LANGUAGE_MAP } from "@/lib/prep/constants";
import { runOnce, runTests } from "@/lib/prep/judge";

const LANG_EXTENSIONS = {
  python: () => python(),
  javascript: () => javascript(),
  java: () => java(),
  c: () => cpp(),
  cpp: () => cpp(),
};

const FALLBACK_STARTER = {
  python: "# read from stdin with input(), print results with print()\n\n",
  javascript: "// read input lines with readLine(), print with console.log()\n\n",
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n    }\n}\n',
  c: "#include <stdio.h>\n\nint main(void) {\n\n    return 0;\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}\n",
};

// Override oneDark surfaces to sit on the Devert #050505 background.
const devertTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#050505", fontSize: "13px" },
    ".cm-gutters": {
      backgroundColor: "#050505",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.25)",
    },
    ".cm-content": { fontFamily: "var(--font-jetbrains-mono), monospace" },
    ".cm-activeLine": { backgroundColor: "rgba(0,255,255,0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(0,255,255,0.06)" },
    "&.cm-focused": { outline: "none" },
    ".cm-cursor": { borderLeftColor: "#00FFFF" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(0,255,255,0.15)",
    },
  },
  { dark: true }
);

function normalizeProgress(p) {
  if (p == null) return "";
  if (typeof p === "string") return p;
  if (typeof p === "object") {
    if (p.message) return String(p.message);
    if (p.status) return String(p.status);
    if (typeof p.index === "number" && typeof p.total === "number") {
      return `running test ${p.index + 1}/${p.total}…`;
    }
    if (p.phase) return String(p.phase);
  }
  return "running…";
}

function Pane({ label, value, tone, className }) {
  const toneColor =
    tone === "green" ? "text-neon-green" : tone === "red" ? "text-[#FF3B3B]" : "text-white/70";
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-[9px] tracking-wider text-white/25 uppercase mb-1">{label}</p>
      <pre
        className={cn(
          "font-mono text-[11px] whitespace-pre-wrap break-words bg-black/60 border border-white/8 rounded p-2 max-h-28 overflow-y-auto",
          toneColor
        )}
      >
        {value === undefined || value === null || value === "" ? (
          <span className="text-white/20">(empty)</span>
        ) : (
          String(value)
        )}
      </pre>
    </div>
  );
}

function TestResultRow({ result, testCase, index }) {
  const hidden = !!testCase?.hidden;
  const pass = !!result?.pass;
  return (
    <div
      className={cn(
        "rounded border px-3 py-2",
        pass ? "border-neon-green/20 bg-neon-green/[0.04]" : "border-[#FF3B3B]/25 bg-[#FF3B3B]/[0.04]"
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[11px]">
        {pass ? (
          <CheckCircle2 size={13} className="text-neon-green flex-shrink-0" />
        ) : (
          <XCircle size={13} className="text-[#FF3B3B] flex-shrink-0" />
        )}
        <span className="text-white/60">TC_{String(index + 1).padStart(2, "0")}</span>
        {hidden && (
          <span className="inline-flex items-center gap-1 text-white/30">
            <EyeOff size={10} /> hidden
          </span>
        )}
        <span className={cn("ml-auto", pass ? "text-neon-green" : "text-[#FF3B3B]")}>
          {pass ? "PASS" : "FAIL"}
        </span>
        {!hidden && typeof result?.timeMs === "number" && (
          <span className="text-white/25">{Math.round(result.timeMs)}ms</span>
        )}
        {!hidden && result?.timedOut && <span className="text-[#FF9500]">TIMEOUT</span>}
      </div>

      {!hidden && (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
          <Pane label="input" value={testCase?.input} />
          <Pane label="expected" value={result?.expected ?? testCase?.expectedOutput} />
          <Pane label="got" value={result?.stdout} tone={pass ? "green" : "red"} />
        </div>
      )}

      {!hidden && !pass && result?.stderr && (
        <div className="mt-1.5">
          <Pane label="stderr" value={result.stderr} tone="red" />
        </div>
      )}
      {!hidden && result?.error && (
        <p className="mt-1.5 font-mono text-[11px] text-[#FF3B3B] break-words">{String(result.error)}</p>
      )}
    </div>
  );
}

function CodeRunner({
  question,
  starterCode,
  testCases,
  allowedLanguages,
  onResult,
  heightClass = "h-80",
}) {
  const uid = useId();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const starters = useMemo(
    () => starterCode ?? question?.starterCode ?? {},
    [starterCode, question]
  );
  const cases = useMemo(
    () => (Array.isArray(testCases) ? testCases : question?.testCases ?? []),
    [testCases, question]
  );

  const langList = useMemo(() => {
    const list =
      Array.isArray(allowedLanguages) && allowedLanguages.length
        ? LANGUAGES.filter((l) => allowedLanguages.includes(l.id))
        : LANGUAGES;
    return list.length ? list : LANGUAGES;
  }, [allowedLanguages]);

  const questionKey =
    question?.id ??
    question?.qid ??
    (question?.idx !== undefined && question?.idx !== null ? `idx-${question.idx}` : "playground");
  const storageKey = useCallback((l) => `devert-prep-code:${questionKey}:${l}`, [questionKey]);

  const loadCode = useCallback(
    (l) => {
      if (typeof window !== "undefined") {
        try {
          const saved = window.localStorage.getItem(storageKey(l));
          if (saved !== null && saved !== "") return saved;
        } catch {
          // storage unavailable (private mode) — fall through to starter
        }
      }
      return starters[l] || FALLBACK_STARTER[l] || "";
    },
    [storageKey, starters]
  );

  const [lang, setLang] = useState(() =>
    langList.some((l) => l.id === "python") ? "python" : langList[0].id
  );
  const [code, setCode] = useState(() => loadCode(lang));
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(null); // null | 'run' | 'tests'
  const [progressText, setProgressText] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Keep the selected language valid if allowedLanguages changes.
  useEffect(() => {
    if (!langList.some((l) => l.id === lang)) {
      const next = langList.some((l) => l.id === "python") ? "python" : langList[0].id;
      setLang(next);
      setCode(loadCode(next));
    }
  }, [langList]); // eslint-disable-line react-hooks/exhaustive-deps

  const langMeta = LANGUAGE_MAP[lang] || langList[0];

  const switchLang = (next) => {
    // current code is already persisted on every keystroke, so nothing is lost
    setLang(next);
    setCode(loadCode(next));
    setRunResult(null);
    setTestResult(null);
    setErrorMsg("");
  };

  const handleCodeChange = useCallback(
    (val) => {
      setCode(val);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey(lang), val);
        } catch {
          // storage full/unavailable — editing still works, just no persistence
        }
      }
    },
    [lang, storageKey]
  );

  const resetCode = () => {
    const starter = starters[lang] || FALLBACK_STARTER[lang] || "";
    setCode(starter);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey(lang));
      } catch {
        // ignore
      }
    }
  };

  const initialStatus = () =>
    langMeta.judge === "pyodide"
      ? "booting python runtime…"
      : langMeta.judge === "piston"
        ? "queued…"
        : "running…";

  const handleRun = async () => {
    setRunning("run");
    setRunResult(null);
    setTestResult(null);
    setErrorMsg("");
    setProgressText(initialStatus());
    try {
      const res = await runOnce({ language: lang, code, stdin });
      if (!mountedRef.current) return;
      setRunResult(res || {});
    } catch (e) {
      if (mountedRef.current) setErrorMsg(e?.message || "execution failed");
    } finally {
      if (mountedRef.current) {
        setRunning(null);
        setProgressText("");
      }
    }
  };

  const handleRunTests = async () => {
    setRunning("tests");
    setRunResult(null);
    setTestResult(null);
    setErrorMsg("");
    setProgressText(initialStatus());
    try {
      const res = await runTests({
        language: lang,
        code,
        testCases: cases,
        onProgress: (p) => {
          if (mountedRef.current) setProgressText(normalizeProgress(p));
        },
      });
      if (!mountedRef.current) return;
      setTestResult(res || { results: [], passed: 0, total: 0 });
      onResult?.(lang, code, {
        passed: res?.passed ?? 0,
        total: res?.total ?? 0,
        results: res?.results ?? [],
      });
    } catch (e) {
      if (mountedRef.current) setErrorMsg(e?.message || "execution failed");
    } finally {
      if (mountedRef.current) {
        setRunning(null);
        setProgressText("");
      }
    }
  };

  const extensions = useMemo(() => {
    const makeExt = LANG_EXTENSIONS[lang];
    return [devertTheme, ...(makeExt ? [makeExt()] : [])];
  }, [lang]);

  const pct = testResult?.total ? Math.round((testResult.passed / testResult.total) * 100) : 0;
  const accuracyColor =
    testResult && testResult.passed === testResult.total && testResult.total > 0
      ? "text-neon-green"
      : testResult?.passed > 0
        ? "text-[#FF9500]"
        : "text-[#FF3B3B]";

  return (
    <div className="min-w-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <label htmlFor={`${uid}-lang`} className="font-mono text-[10px] tracking-wider text-white/30 uppercase">
            lang
          </label>
          <select
            id={`${uid}-lang`}
            value={lang}
            onChange={(e) => switchLang(e.target.value)}
            disabled={!!running}
            className="bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-white/80 focus:border-neon-cyan/50 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {langList.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={resetCode}
          disabled={!!running}
          title="Reset to starter code"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={10} /> reset
        </button>

        <span className="ml-auto font-mono text-[9px] text-white/25">
          {langMeta.judge === "pyodide" && "runs in your browser — first run boots python (~5-10s)"}
          {langMeta.judge === "worker" && "runs sandboxed in your browser"}
          {langMeta.judge === "piston" && "runs on the remote judge — may queue under load"}
        </span>
      </div>

      {/* Editor */}
      <div className={cn("rounded-lg overflow-hidden border border-white/10", heightClass)}>
        <CodeMirror
          value={code}
          onChange={handleCodeChange}
          theme={oneDark}
          extensions={extensions}
          height="100%"
          className="h-full text-[13px]"
          aria-label="Code editor"
        />
      </div>

      {/* stdin + actions */}
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${uid}-stdin`} className="font-mono text-[10px] tracking-wider text-white/30 uppercase block mb-1">
            stdin
          </label>
          <textarea
            id={`${uid}-stdin`}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            spellCheck={false}
            placeholder="input for [ RUN ] — one value per line"
            className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 focus:border-neon-cyan/50 outline-none resize-y"
          />
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <BracketButton
            variant="cyan"
            onClick={handleRun}
            disabled={running === "tests"}
            loading={running === "run"}
            loadingText="RUNNING"
          >
            RUN
          </BracketButton>
          {cases.length > 0 && (
            <BracketButton
              variant="green"
              onClick={handleRunTests}
              disabled={running === "run"}
              loading={running === "tests"}
              loadingText="TESTING"
            >
              RUN_TESTS
            </BracketButton>
          )}
        </div>
      </div>

      {/* live status while running */}
      {running && progressText && (
        <p className="mt-2 font-mono text-[11px] text-neon-cyan/70">
          <span className="cursor-blink">▍</span> {progressText}
        </p>
      )}

      {/* errors from the judge itself */}
      {errorMsg && (
        <div className="mt-3 flex items-start gap-2 rounded border border-[#FF3B3B]/30 bg-[#FF3B3B]/[0.05] px-3 py-2.5">
          <AlertTriangle size={13} className="text-[#FF3B3B] flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[11px] text-[#FF3B3B] break-words">{errorMsg}</p>
        </div>
      )}

      {/* runOnce output */}
      {runResult && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 font-mono text-[10px] text-white/30">
            <span className="tracking-wider uppercase">output</span>
            {typeof runResult.timeMs === "number" && <span>{Math.round(runResult.timeMs)}ms</span>}
            {runResult.timedOut && <span className="text-[#FF9500]">TIMED OUT</span>}
          </div>
          <Pane label="stdout" value={runResult.stdout} tone="green" />
          {runResult.stderr && <Pane label="stderr" value={runResult.stderr} tone="red" />}
          {runResult.error && (
            <p className="font-mono text-[11px] text-[#FF3B3B] break-words">{String(runResult.error)}</p>
          )}
        </div>
      )}

      {/* runTests output */}
      {testResult && (
        <div className="mt-3 space-y-2">
          <p className={cn("font-mono text-xs tracking-wider", accuracyColor)}>
            PASSED {testResult.passed}/{testResult.total} — {pct}%
          </p>
          {(testResult.results || []).map((r, i) => (
            <TestResultRow key={i} result={r} testCase={cases[i]} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CodeRunner;
export { CodeRunner };
