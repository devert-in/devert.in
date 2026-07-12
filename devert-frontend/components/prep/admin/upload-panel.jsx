"use client";

// Admin — question upload (design §2 + §7). Accepts .json (mcq + coding) and
// .csv (mcq only, papaparse). Every row is validated client-side before any
// Firestore write; only valid rows are imported, batched via lib/prep/db's
// importQuestions (which itself chunks into <=450-write batches).

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  NeonBadge,
  EmptyState,
  MarkdownBlock,
} from "@/components/prep/ui";
import { importQuestions } from "@/lib/prep/db";
import { CATEGORIES, DIFFICULTIES } from "@/lib/prep/constants";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
const DIFFICULTY_IDS = new Set(DIFFICULTIES.map((d) => d.id));
const LETTER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3 };

/** Normalizes one candidate question (from JSON or a mapped CSV row) into
 * { ok, errors, cleaned } — cleaned is the exact shape importQuestions expects. */
function validateQuestion(raw) {
  const errors = [];
  const rawObj = raw && typeof raw === "object" ? raw : {};

  const type = String(rawObj.type || "mcq").trim().toLowerCase();
  if (!["mcq", "coding"].includes(type)) {
    errors.push(`type must be "mcq" or "coding" (got "${rawObj.type}")`);
  }

  const category = String(rawObj.category || "").trim().toLowerCase();
  if (!CATEGORY_IDS.has(category)) {
    errors.push(`category must be one of: ${[...CATEGORY_IDS].join(", ")}`);
  }

  const difficulty = String(rawObj.difficulty || "").trim().toLowerCase();
  if (!DIFFICULTY_IDS.has(difficulty)) {
    errors.push("difficulty must be one of: easy, medium, hard");
  }

  const topic = String(rawObj.topic || "").trim();
  if (!topic) errors.push("topic is required");

  const prompt = String(rawObj.prompt || "").trim();
  if (!prompt) errors.push("prompt is required");

  const explanation = String(rawObj.explanation || "").trim();
  if (!explanation) errors.push("explanation is required");

  const tags = Array.isArray(rawObj.tags)
    ? rawObj.tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof rawObj.tags === "string"
      ? rawObj.tags.split("|").map((t) => t.trim()).filter(Boolean)
      : [];

  const cleaned = { type, category, difficulty, topic, prompt, explanation, tags };

  if (type === "mcq") {
    const options = Array.isArray(rawObj.options)
      ? rawObj.options.map((o) => String(o ?? "").trim())
      : [];
    if (options.length !== 4 || options.some((o) => !o)) {
      errors.push("mcq needs exactly 4 non-empty options");
    }
    let correctIndex = rawObj.correctIndex;
    if (typeof correctIndex === "string") {
      const letter = correctIndex.trim().toUpperCase();
      correctIndex = LETTER_TO_INDEX[letter] !== undefined ? LETTER_TO_INDEX[letter] : Number(correctIndex);
    }
    correctIndex = Number(correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      errors.push("correctIndex/correctOption must resolve to A-D (0-3)");
    } else if (options.length === 4 && !options[correctIndex]) {
      errors.push("correctIndex points at an empty option");
    }
    cleaned.options = options;
    cleaned.correctIndex = correctIndex;
  } else {
    const starterCode = rawObj.starterCode && typeof rawObj.starterCode === "object" ? rawObj.starterCode : null;
    const hasStarter = !!(
      starterCode && Object.values(starterCode).some((v) => typeof v === "string" && v.trim())
    );
    if (!hasStarter) errors.push("coding questions need starterCode for at least one language");

    const testCases = Array.isArray(rawObj.testCases) ? rawObj.testCases : [];
    if (testCases.length === 0) errors.push("coding questions need at least one test case");
    if (testCases.some((t) => t == null || String(t.expectedOutput ?? "").trim() === "")) {
      errors.push("every test case needs a non-empty expectedOutput");
    }
    cleaned.starterCode = starterCode || {};
    cleaned.testCases = testCases.map((t) => ({
      input: t && t.input != null ? String(t.input) : "",
      expectedOutput: t && t.expectedOutput != null ? String(t.expectedOutput) : "",
      hidden: !!(t && t.hidden),
    }));
  }

  return { ok: errors.length === 0, errors, cleaned };
}

function normalizeCsvHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/\(.*$/, "").trim();
}

function csvRowToCandidate(row) {
  return {
    type: row.type || "mcq",
    category: row.category,
    topic: row.topic,
    difficulty: row.difficulty,
    prompt: row.prompt,
    options: [row.optiona, row.optionb, row.optionc, row.optiond],
    correctIndex: row.correctoption,
    explanation: row.explanation,
    tags: row.tags,
  };
}

async function parseFile(file) {
  const name = file.name.toLowerCase();
  const text = await file.text();
  if (name.endsWith(".json")) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
    if (!Array.isArray(data)) throw new Error("JSON file must contain an array of question objects");
    return data.map((row, i) => ({ rowNumber: i + 1, candidate: row }));
  }
  if (name.endsWith(".csv")) {
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeCsvHeader,
    });
    if (parsed.errors && parsed.errors.length) {
      const fatal = parsed.errors.filter((e) => e.type !== "FieldMismatch");
      if (fatal.length) throw new Error(`CSV parse error: ${fatal[0].message}`);
    }
    return parsed.data.map((row, i) => ({ rowNumber: i + 2, candidate: csvRowToCandidate(row) }));
  }
  throw new Error("Only .json and .csv files are supported");
}

const FORMAT_HELP = `### JSON format (preferred — supports MCQ + coding)
An array of question objects. Do **not** include \`qid\`, \`createdAt\`, or \`createdBy\` — those are added at import time.

\`\`\`json
{
  "type": "mcq",                 // "mcq" | "coding"
  "category": "aptitude",        // aptitude | reasoning | verbal | dsa | python | java | cs-core
  "topic": "Percentages",
  "difficulty": "easy",          // easy | medium | hard
  "prompt": "markdown text...",
  "options": ["A", "B", "C", "D"],   // mcq only — exactly 4
  "correctIndex": 1,                  // mcq only — 0-3
  "explanation": "why the answer is correct",
  "starterCode": { "python": "...", "java": "..." },   // coding only
  "testCases": [{ "input": "...", "expectedOutput": "...", "hidden": false }], // coding only
  "tags": ["percentages", "arithmetic"]
}
\`\`\`

### CSV format (MCQ only, papaparse with a header row)
\`\`\`
type,category,topic,difficulty,prompt,optionA,optionB,optionC,optionD,correctOption(A-D),explanation,tags(pipe|separated)
\`\`\`
- \`correctOption\` is a letter **A-D**.
- \`tags\` are pipe-separated, e.g. \`ratios|arithmetic\`.
- Coding questions are **not** supported via CSV — use JSON.

Every row is validated before import: enum fields, 4 non-empty options, \`correctIndex\` in bounds, non-empty prompt/explanation, and (for coding) at least one starter-code language plus at least one test case. Only valid rows get imported; invalid rows are listed with their exact errors below.`;

function StatusBadge({ ok }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-neon-green font-mono text-[10px]">
      <CheckCircle2 size={12} /> VALID
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[#FF3B3B] font-mono text-[10px]">
      <XCircle size={12} /> INVALID
    </span>
  );
}

export default function UploadPanel() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null); // [{ rowNumber, ok, errors, cleaned }]
  const [parseError, setParseError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setParseError("");
    setImportResult(null);
    setRows(null);
    setFileName(file.name);
    try {
      const parsed = await parseFile(file);
      const validated = parsed.map(({ rowNumber, candidate }) => {
        const { ok, errors, cleaned } = validateQuestion(candidate);
        return { rowNumber, ok, errors, cleaned };
      });
      setRows(validated);
    } catch (e) {
      setParseError(e?.message || "Failed to parse file");
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const validRows = (rows || []).filter((r) => r.ok);
  const invalidCount = (rows || []).length - validRows.length;

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importQuestions(validRows.map((r) => r.cleaned), user?.uid);
      setImportResult({ ok: true, count: result.count });
    } catch (e) {
      setImportResult({ ok: false, message: e?.message || "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  const clearAll = () => {
    setRows(null);
    setFileName("");
    setParseError("");
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Sample files + format help */}
      <TerminalCard filename="upload-format.md" icon={HelpCircle} delay={0}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <a
              href="/prep-samples/questions-sample.json"
              download
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neon-cyan border border-neon-cyan/30 px-3 py-1.5 hover:bg-neon-cyan/10 transition-colors"
            >
              <FileJson size={11} /> questions-sample.json
            </a>
            <a
              href="/prep-samples/questions-sample.csv"
              download
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neon-cyan border border-neon-cyan/30 px-3 py-1.5 hover:bg-neon-cyan/10 transition-colors"
            >
              <FileSpreadsheet size={11} /> questions-sample.csv
            </a>
            <a
              href="/prep-samples/coding-questions-sample.json"
              download
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neon-cyan border border-neon-cyan/30 px-3 py-1.5 hover:bg-neon-cyan/10 transition-colors"
            >
              <Download size={11} /> coding-questions-sample.json
            </a>
          </div>
          <BracketButton variant="ghost" size="sm" onClick={() => setShowHelp((s) => !s)}>
            {showHelp ? "HIDE_FORMAT" : "SHOW_FORMAT"}
          </BracketButton>
        </div>
        {showHelp && (
          <div className="border-t border-white/8 pt-4">
            <MarkdownBlock content={FORMAT_HELP} />
          </div>
        )}
      </TerminalCard>

      {/* Drop zone */}
      <TerminalCard filename="upload.sh" icon={UploadCloud} delay={0.05}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className="border border-dashed rounded-lg py-12 px-6 flex flex-col items-center justify-center text-center gap-3 transition-colors"
          style={{
            borderColor: dragOver ? "rgba(0,255,255,0.5)" : "rgba(255,255,255,0.12)",
            background: dragOver ? "rgba(0,255,255,0.04)" : "transparent",
          }}
        >
          <UploadCloud size={26} className={dragOver ? "text-neon-cyan" : "text-white/25"} />
          <p className="font-mono text-xs text-white/45">
            Drag &amp; drop a <span className="text-neon-cyan">.json</span> or{" "}
            <span className="text-neon-cyan">.csv</span> file, or
          </p>
          <BracketButton variant="cyan" size="sm" onClick={() => inputRef.current?.click()}>
            CHOOSE_FILE
          </BracketButton>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv"
            onChange={onPick}
            className="hidden"
            aria-label="Choose a question file to upload"
          />
          {fileName && <p className="font-mono text-[10px] text-white/30 mt-1">loaded: {fileName}</p>}
        </div>
        {parseError && (
          <p className="mt-3 font-mono text-xs text-[#FF3B3B] flex items-center gap-2">
            <XCircle size={13} /> {parseError}
          </p>
        )}
      </TerminalCard>

      {/* Validation results */}
      {rows && (
        <TerminalCard filename="validation-report.log" icon={CheckCircle2} delay={0.1}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <NeonBadge color="#00FF41">{validRows.length} VALID</NeonBadge>
              {invalidCount > 0 && <NeonBadge color="#FF3B3B">{invalidCount} INVALID</NeonBadge>}
              <span className="font-mono text-[10px] text-white/25">{rows.length} rows total</span>
            </div>
            <div className="flex items-center gap-2">
              <BracketButton variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 size={11} className="inline mr-1 -mt-0.5" /> CLEAR
              </BracketButton>
              <BracketButton
                variant="green"
                size="sm"
                onClick={handleImport}
                disabled={validRows.length === 0}
                loading={importing}
                loadingText="IMPORTING"
              >
                {`IMPORT_${validRows.length}_VALID`}
              </BracketButton>
            </div>
          </div>

          {importResult && (
            <div
              className={`mb-4 font-mono text-xs px-3 py-2.5 rounded border ${
                importResult.ok
                  ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
                  : "border-[#FF3B3B]/30 bg-[#FF3B3B]/5 text-[#FF3B3B]"
              }`}
            >
              {importResult.ok
                ? `✓ Imported ${importResult.count} question${importResult.count === 1 ? "" : "s"} successfully.`
                : `✗ ${importResult.message}`}
            </div>
          )}

          <DataTable
            dense
            rowKey="rowNumber"
            initialSort={{ key: "rowNumber", dir: "asc" }}
            columns={[
              { key: "rowNumber", label: "ROW", width: "60px", sortValue: (r) => r.rowNumber },
              {
                key: "status",
                label: "STATUS",
                width: "90px",
                sortValue: (r) => (r.ok ? 0 : 1),
                render: (r) => <StatusBadge ok={r.ok} />,
              },
              { key: "type", label: "TYPE", width: "70px", render: (r) => r.cleaned?.type || "—" },
              {
                key: "category",
                label: "CATEGORY",
                width: "100px",
                render: (r) => r.cleaned?.category || "—",
              },
              {
                key: "topic",
                label: "TOPIC",
                render: (r) => (
                  <span className="truncate block max-w-[180px]" title={r.cleaned?.topic}>
                    {r.cleaned?.topic || "—"}
                  </span>
                ),
              },
              {
                key: "errors",
                label: "ERRORS",
                sortable: false,
                render: (r) =>
                  r.errors.length ? (
                    <ul className="space-y-0.5">
                      {r.errors.map((e, i) => (
                        <li key={i} className="text-[#FF3B3B] text-[11px] leading-snug">
                          • {e}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-white/20">—</span>
                  ),
              },
            ]}
            rows={rows}
          />
        </TerminalCard>
      )}

      {!rows && !parseError && (
        <EmptyState
          icon={FileJson}
          title="no file loaded"
          message="Upload a .json or .csv question file to see the validation report here."
        />
      )}
    </div>
  );
}
