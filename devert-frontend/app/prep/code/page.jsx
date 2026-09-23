"use client";

// /prep/code - the free code playground (design §2). No auth required to
// play: full-height CodeRunner across all enabled languages, a custom
// test-case editor, a runtime status line, and a snippets dropdown.
//
// CodeRunner owns its own editor state and persists code per (question,
// language) to localStorage. To offer "insert snippet" without touching the
// foundation-owned component, we write the snippet straight into the exact
// localStorage slot CodeRunner will read on mount, then force a remount via
// `key`. Restricting `allowedLanguages` to the single language picked here
// keeps CodeRunner's own selector in lockstep with ours, so we always know
// which (language, storage-slot) pair we're writing into.

import { useCallback, useState } from "react";
import { FlaskConical, Terminal } from "lucide-react";
import { PrepShell, TerminalCard } from "@/components/prep/ui";
import CodeRunner from "@/components/prep/CodeRunner";
import RuntimeStatus from "@/components/prep/code/RuntimeStatus";
import SnippetMenu from "@/components/prep/code/SnippetMenu";
import TestCaseEditor from "@/components/prep/code/TestCaseEditor";
import { LANGUAGES } from "@/lib/prep/constants";

const PLAYGROUND_STORAGE_PREFIX = "devert-prep-code:playground:";

export default function CodePlaygroundPage() {
  const [lang, setLang] = useState("python");
  const [testCases, setTestCases] = useState([]);
  const [remountSeed, setRemountSeed] = useState(0);

  const handleLangChange = useCallback((next) => {
    setLang(next);
  }, []);

  const handleInsertSnippet = useCallback(
    (code) => {
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(`${PLAYGROUND_STORAGE_PREFIX}${lang}`, code);
        } catch {
          // storage unavailable - the remount will just fall back to the
          // CodeRunner default starter for this language instead of the snippet
        }
      }
      setRemountSeed((s) => s + 1);
    },
    [lang]
  );

  return (
    <PrepShell
      kicker="// /prep/code - playground.sh"
      title="CODE"
      accent="PLAYGROUND"
      subtitle="Write, run, and test code in 5 languages. Nothing here is graded - just you and the compiler."
    >
      <TerminalCard filename="playground.run" icon={Terminal} headerRight={<RuntimeStatus />}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="playground-lang"
              className="font-mono text-[10px] tracking-wider text-white/30 uppercase"
            >
              language
            </label>
            <select
              id="playground-lang"
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 font-mono text-xs text-white/80 focus:border-neon-cyan/50 outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <SnippetMenu lang={lang} onInsert={handleInsertSnippet} />
        </div>

        <CodeRunner
          key={`${lang}-${remountSeed}`}
          allowedLanguages={[lang]}
          testCases={testCases}
          heightClass="h-[55vh] min-h-[380px]"
        />
      </TerminalCard>

      <TerminalCard filename="test_cases.json" icon={FlaskConical} delay={0.1} className="mt-6">
        <p className="font-mono text-xs text-white/35 mb-4 leading-relaxed">
          Add custom input / expected-output pairs, then hit{" "}
          <span className="text-neon-green">RUN_TESTS</span> in the panel above to check your code
          against all of them at once.
        </p>
        <TestCaseEditor cases={testCases} onChange={setTestCases} />
      </TerminalCard>
    </PrepShell>
  );
}
