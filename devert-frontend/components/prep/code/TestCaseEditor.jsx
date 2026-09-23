"use client";

// Custom test-case rows for the code playground: add/remove input/expected
// pairs, fed straight into CodeRunner's `testCases` prop - its own
// RUN_TESTS button is the "run all" action against whatever is listed here.

import { Plus, Trash2 } from "lucide-react";
import { cn, BracketButton } from "@/components/prep/ui";

export default function TestCaseEditor({ cases, onChange, className }) {
  const rows = Array.isArray(cases) ? cases : [];

  const update = (i, field, value) => {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };
  const addRow = () => onChange([...rows, { input: "", expectedOutput: "" }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className={cn("space-y-2.5", className)}>
      {rows.length === 0 && (
        <p className="font-mono text-[11px] text-white/25 leading-relaxed">
          No custom test cases yet - add one below, then hit{" "}
          <span className="text-neon-green">RUN_TESTS</span> above the editor to check your code
          against all of them at once.
        </p>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-start rounded border border-white/8 bg-white/[0.02] p-2.5"
        >
          <div>
            <label
              htmlFor={`tc-in-${i}`}
              className="font-mono text-[9px] tracking-wider text-white/25 uppercase block mb-1"
            >
              input {i + 1}
            </label>
            <textarea
              id={`tc-in-${i}`}
              value={row.input}
              onChange={(e) => update(i, "input", e.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white/80 focus:border-neon-cyan/50 outline-none resize-y"
            />
          </div>
          <div>
            <label
              htmlFor={`tc-out-${i}`}
              className="font-mono text-[9px] tracking-wider text-white/25 uppercase block mb-1"
            >
              expected output {i + 1}
            </label>
            <textarea
              id={`tc-out-${i}`}
              value={row.expectedOutput}
              onChange={(e) => update(i, "expectedOutput", e.target.value)}
              rows={2}
              spellCheck={false}
              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white/80 focus:border-neon-cyan/50 outline-none resize-y"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            title="Remove test case"
            aria-label={`Remove test case ${i + 1}`}
            className="justify-self-end sm:justify-self-auto sm:mt-4 text-white/25 hover:text-[#FF3B3B] transition-colors cursor-pointer p-1.5"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <BracketButton variant="ghost" size="sm" onClick={addRow}>
        <Plus size={11} className="inline -mt-0.5 mr-1" />
        ADD_CASE
      </BracketButton>
    </div>
  );
}
