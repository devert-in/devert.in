"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Play, RotateCcw, Copy, Monitor } from "lucide-react";
import { runCode, CODELAB_LANGUAGES } from "@/lib/codelab";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const STARTER_CODE = {
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, DeVert!\");\n    }\n}\n",
  python: "print(\"Hello, DeVert!\")\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, DeVert!\" << endl;\n    return 0;\n}\n",
  javascript: "console.log(\"Hello, DeVert!\");\n",
  c: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello, DeVert!\\n\");\n    return 0;\n}\n",
};

export default function PlaygroundPage() {
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(STARTER_CODE.java);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
    setResult(null);
  };

  const handleRun = async () => {
    setRunning(true); setError(""); setResult(null);
    try {
      const res = await runCode({ language, code, stdin });
      setResult(res);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-4xl mx-auto">
        <Link href="/codelab" className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={12} /> back to codelab
        </Link>

        <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// codelab.playground</p>
        <h1 className="font-sans font-bold text-2xl text-white mb-6">Playground</h1>

        <div className="terminal-window">
          <div className="terminal-header flex-wrap gap-2">
            <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
            <select value={language} onChange={e => handleLanguageChange(e.target.value)}
              className="ml-2 font-mono text-[10px] text-white/70 px-2 py-1 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {CODELAB_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => navigator.clipboard?.writeText(code)} title="Copy" className="text-white/25 hover:text-white/60 transition-colors"><Copy size={12} /></button>
              <button onClick={() => setCode(STARTER_CODE[language] || "")} title="Reset" className="text-white/25 hover:text-white/60 transition-colors"><RotateCcw size={12} /></button>
            </div>
          </div>

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
            <div>
              <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1.5">STDIN (optional)</p>
              <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={2}
                className="w-full font-mono text-xs text-white/70 px-3 py-2 rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <button onClick={handleRun} disabled={running}
              className="w-full font-mono text-xs py-2.5 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Play size={12} /> {running ? "running..." : "run"}
            </button>
            {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
            {result && (
              <div className="space-y-2">
                <div>
                  <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1">OUTPUT ({result.status})</p>
                  <pre className="font-mono text-xs text-white/70 whitespace-pre-wrap bg-white/3 rounded-lg p-3 border border-white/6 max-h-48 overflow-y-auto">{result.stdout || "(no output)"}</pre>
                </div>
                {(result.stderr || result.compileOutput) && (
                  <div>
                    <p className="font-mono text-[9px] text-red-400/70 tracking-widest mb-1">ERROR</p>
                    <pre className="font-mono text-xs text-red-400/70 whitespace-pre-wrap bg-red-500/5 rounded-lg p-3 border border-red-500/15 max-h-48 overflow-y-auto">{result.stderr || result.compileOutput}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
