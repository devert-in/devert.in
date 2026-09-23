// Extracts GATE previous-year questions from the official question-paper PDFs
// in GATE/ into reviewable DRAFTS. It writes JSON to disk and touches no
// database; scripts/import-gate-pyq-drafts.mjs is what loads the result into
// Firestore, and only ever as status:"draft".
//
// Usage:
//   node scripts/extract-gate-pyqs.mjs                 # every paper
//   node scripts/extract-gate-pyqs.mjs --only 2024,2025
//   node scripts/extract-gate-pyqs.mjs --out <dir>
//
// ============================ READ THIS FIRST ============================
//
// WHAT THE SOURCE PDFs ACTUALLY CONTAIN, established by inspecting all 27 of
// them rather than assumed:
//
//   1. NO ANSWER KEYS. Not one of the 27 papers contains a correct answer,
//      a marking key or a solution - they are the question papers GATE hands
//      a candidate, nothing more. Every question this script emits therefore
//      has an EMPTY correctOptionIds (or a null natMin/natMax), and a human
//      has to supply it. That is not a limitation of the parser; the
//      information does not exist in the input.
//
//   2. MATHEMATICAL NOTATION IS LOST ON EXTRACTION. The PDFs set formulae in
//      symbol fonts with no usable ToUnicode mapping, so every variable in a
//      formula silently vanishes: GATE 2026 Q.8's "For positive real numbers
//      a and b, the function f(x)" extracts as "For positive real numbers
//      and , the function ()". Matrices collapse into unaligned digit soup.
//      Detectable, not repairable - see FLAGS.symbolLoss.
//
//   3. FIGURES ARE NOT IN THE TEXT LAYER AT ALL. Circuit diagrams, automata,
//      Karnaugh maps, plots and the option-as-image questions (GATE 2026 Q.2
//      and Q.7, where the four options ARE four pictures) extract as bare
//      "(A) (B) (C) (D)" with no content whatsoever. Flagged, never guessed.
//
//   4. ELEVEN OF THE 27 PAPERS HAVE NO TEXT LAYER (2007-2011, 2015, both 2017
//      sessions, 2019, 2020, 2021). They are page scans. This script skips
//      them with a named reason rather than emitting garbage; OCR on
//      mathematical notation is materially worse than the symbol loss above,
//      and CLAUDE.md's own rule for this bank is that a wrong question is
//      worse than a missing one.
//
// WHY THE SCRIPT STILL EARNS ITS PLACE: stems, option text, question numbers,
// marks, question type and paper provenance all extract reliably, and that is
// the bulk of the typing. A reviewer's job becomes "check this and supply the
// answer" instead of "retype 65 questions from a PDF", which is the difference
// between a bank that gets built and one that does not.
//
// NOTHING HERE IS EVER PUBLISHED AUTOMATICALLY. Every record is status:"draft"
// plus a non-empty reviewFlags array, firestore.rules makes a draft
// admin-only, and lib/campusCatalog.js's public count filters on published -
// so an unreviewed extraction is invisible to students and excluded from every
// advertised figure until a human clears it in /admin.

import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const GATE_DIR = path.join(REPO_ROOT, "GATE");

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const ONLY_YEARS = (argValue("--only") || "").split(",").map(s => s.trim()).filter(Boolean);
const OUT_DIR = argValue("--out") || path.join(__dirname, "gate-pyqs-content", "extracted");

// ---------------- paper identity ----------------

// Filenames are the only place the paper code, year and session live, and they
// follow two different conventions (CS/2024_CS1.pdf vs DA/DA2026.pdf), so both
// are parsed explicitly rather than with one over-clever regex.
function parseFilename(dir, file) {
  const base = file.replace(/\.pdf$/i, "");
  let m = base.match(/^(\d{4})_([A-Z]+?)(\d)?$/);       // 2024_CS1, 2023_CS
  if (m) return { year: Number(m[1]), code: m[2], session: m[3] ? Number(m[3]) : null };
  m = base.match(/^([A-Z]+)(\d{4})$/);                   // DA2026
  if (m) return { year: Number(m[2]), code: m[1], session: null };
  return { year: null, code: dir, session: null };
}

// paperId in Firestore is the lowercased official paper code - the document id
// lib/gate.js's GATE_PAPER_CATALOG already uses ("cs", "da").
function paperIdFor(code) { return code.toLowerCase(); }

// GATE's organizing institute rotates annually and gate_pyqs stores it per
// question (see lib/gatePyq.js's GATE_ORGANIZING_INSTITUTES). Where the PDF
// states it in a page footer we take it from there; this table is the fallback
// for the papers whose footer does not, and is deliberately incomplete rather
// than guessed - an unknown institute is "" and a reviewer fills it in.
const INSTITUTE_BY_YEAR = {
  2012: "IIT Delhi", 2013: "IIT Bombay", 2014: "IIT Kharagpur", 2015: "IIT Kanpur",
  2016: "IISc Bangalore", 2017: "IIT Roorkee", 2018: "IIT Guwahati", 2019: "IIT Madras",
  2020: "IIT Delhi", 2021: "IIT Bombay", 2022: "IIT Kharagpur", 2023: "IIT Kanpur",
  2024: "IISc Bangalore", 2025: "IIT Roorkee", 2026: "IIT Guwahati",
};

// ---------------- text extraction ----------------

function pdfToText(pdfPath) {
  // -layout preserves the column structure the option blocks rely on; without
  // it multi-column option rows interleave and become unparseable.
  return execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
}

// Page furniture repeats on every one of the 40-90 pages and would otherwise
// land in the middle of whichever question happens to straddle a page break.
// Matched against the TRIMMED line so leading indentation never defeats it.
// Matched as PREFIXES and loose shapes rather than exact whole lines, because
// the same footer is laid out differently in different years: 2026 puts
// "Organizing Institute: IIT Guwahati  Page 1 of 46" on one line, 2024 splits
// the identical information across two, and the running head gained a "Set 1"
// in 2024 that the 2023 pattern did not allow for. An over-precise pattern
// here does not fail loudly - it silently glues "Page 11 of 36" onto the end
// of whichever option happened to sit at a page break, which is exactly the
// kind of corruption that reaches a student as a real question.
const FURNITURE = [
  /^Organizing Institute:/i,
  /^GATE\s*\d{4}\b/i,
  /^Computer Science (&|and) Information Technology\b.*$/i,
  /^Data Science (&|and) Artificial Intelligence\b.*$/i,
  /^(General Aptitude|Computer Science|Data Science)\s*[---]?\s*GA\b/i,
  /^[A-Z]{2,4}\s*:?\s*Page \d+ of \d+$/i,
  /^Page \d+ of \d+$/i,
  /^\f+$/,
];

// The organizing institute is PRINTED IN THE PAPER's own footer in the newer
// years, so it is read from there in preference to the INSTITUTE_BY_YEAR table
// below - the paper is authoritative and the table is memory. It also gets the
// spelling right where the two differ: GATE 2024's footer says "IISc
// Bengaluru", and a table saying "IISc Bangalore" would quietly create a
// second, near-duplicate value in a field students filter on.
function instituteFromText(text) {
  const m = text.match(/Organizing Institute:\s*([^\n]+?)(?:\s{2,}Page \d+|\s*$)/im);
  return m ? m[1].trim() : "";
}

// Footers set in the RIGHT MARGIN are not on a line of their own once -layout
// has flattened the page: they land on the same output line as whatever sat in
// the left column, which in practice is an option. So dropping whole furniture
// lines is necessary but not sufficient - GATE 2024 Q.17 option (A) came out
// as "both () and ()                   Page 11 of 36" until this also stripped
// the tail. Anchored on two-or-more spaces so an ordinary sentence that merely
// contains the word "Page" is untouched.
const INLINE_FURNITURE = [
  /\s{2,}Page \d+ of \d+\s*$/i,
  /\s{2,}Organizing Institute:.*$/i,
  /\s{2,}GATE\s*\d{4}\s+(Computer Science|Data Science).*$/i,
];

function stripFurniture(text) {
  return text.split(/\r?\n/)
    .filter(line => {
      const t = line.replace(/\f/g, "").trim();
      if (!t) return true;                     // blank lines carry paragraph structure
      return !FURNITURE.some(re => re.test(t));
    })
    .map(line => INLINE_FURNITURE.reduce((l, re) => l.replace(re, ""), line));
}

// ---------------- structure ----------------

// A mark-band header: "Q.1 - Q.5 Carry ONE mark Each", and its many variants
// across fourteen years of typesetting. Three things vary and all three are
// load-bearing:
//
//   - The dash extracts as U+FFFD (an en-dash in a font with no ToUnicode
//     entry) in most years, a literal "-" in 2016, and the word "to" in 2013.
//     Matched as "one to three non-digit characters" rather than as any
//     particular dash, because matching a literal "-" finds nothing at all in
//     eleven of the sixteen parseable papers.
//   - "Q. 1" (with a space) in 2012/2016/2018 versus "Q.1" everywhere else.
//     This one matters twice over: the QUESTION_RE below deliberately does
//     NOT allow that space, which is exactly what stops a band header being
//     mistaken for a question - the papers that space their headers never
//     space their question markers.
//   - 2022 alone states the question TYPE in the band ("Q.11 - Q.22 Multiple
//     Choice Questions (MCQ), carry ONE mark each"), which is authoritative
//     and better than any inference, so it is captured when present.
const SECTION_RE = /^Q\.\s?(\d+)\s*\D{1,3}\s*Q\.\s?(\d+)\s+(?:(Multiple Choice Questions|Multiple Select Questions|Numerical Answer Type)\s*\([A-Z]+\)\s*,?\s*)?carry\s+(ONE|TWO|1|2)\s+marks?\s+each\.?$/i;
// The optional space after "Q." is NOT cosmetic tolerance - GATE 2026 CS2
// typesets Q.4 and Q.9 as "Q. 4" and "Q. 9" while every other question on the
// same paper is "Q.4", and GATE DA 2026 does the same to Q.1. Requiring the
// tight form silently dropped exactly those questions, which the 100-mark
// invariant then reported as a 97/100 paper.
//
// Allowing the space is safe only because collectQuestionStarts() tests
// SECTION_RE first and skips anything that matches: band headers are the one
// other thing on the page that starts "Q. 1", and they are removed before this
// pattern is ever applied.
const QUESTION_RE = /^Q\.\s?(\d+)(?:[\s.)]|$)/;
const OPTION_RE = /^\((A|B|C|D)\)\s*(.*)$/;

// GATE's published exam pattern for the modern single-sequence paper. Used
// ONLY to fill a band the PDF itself omits - GATE DA 2024's paper is missing
// its "Q.36 - Q.65 Carry TWO marks Each" header entirely, which left thirty
// two-mark questions defaulting to one mark and the paper scoring 70/100.
//
// This is the published structure of the exam rather than a guess, and the
// 100-mark invariant independently confirms each application of it: a filled
// band that does not bring the paper to exactly 100 is reported, not accepted.
// Questions filled this way still carry marksReadFromPaper:false, so a
// reviewer can see which marks came from the paper and which from the pattern.
const CANONICAL_MODERN_BANDS = [
  { from: 1, to: 5, marks: 1 }, { from: 6, to: 10, marks: 2 },
  { from: 11, to: 35, marks: 1 }, { from: 36, to: 65, marks: 2 },
];

// Which physical booklet a run of questions came from. GATE printed the same
// paper in four shuffled booklets (codes A-D) in the older years, and
// genuinely DIFFERENT papers as numbered sets in others - telling those two
// apart is the difference between importing 65 questions and importing the
// same 65 questions four times over.
const BOOKLET_CODE_RE = /Question Booklet Code\s+([A-D])\b/g;
const SET_RE = /\bSET-?\s?(\d+)\b/gi;

// GATE's own marking scheme, not a DeVert policy: a wrong MCQ costs 1/3 of its
// marks, and MSQ and NAT carry no negative marking at all. Derived from
// (type, marks) rather than stored per question so it cannot drift.
function negativeMarkFor(questionType, marks) {
  if (questionType !== "mcq") return 0;
  return marks === 2 ? -2 / 3 : -1 / 3;
}

// ---------------- quality flags ----------------

// Every flag is a REASON A HUMAN MUST LOOK, expressed as a precise detector
// rather than a guess at confidence. A question with no flags is still a
// draft - it has no answer either way - but the flagged ones are where a
// reviewer's attention is worth most.
const FLAGS = {
  // The strongest available signal of dropped symbol-font glyphs: "()" with
  // nothing inside is what "f(x)" becomes when both f and x are set in the
  // symbol font, and it occurs in no correctly-extracted GATE sentence.
  // The second form catches a dropped variable between two words
  // ("numbers  and ,"), where the giveaway is the doubled spacing left behind.
  symbolLoss: (t) => /\(\s*\)/.test(t) || /�/.test(t) || /\s{2,}(and|or)\s{2,}/i.test(t),
  // A question whose content is in an image. These are not recoverable from
  // the text layer at all and need the diagram attaching by hand before the
  // question means anything.
  figureReference: (t) => /\b(figure|diagram|circuit|Karnaugh|automat|the graph below|shown below|shown in the|following graph|plot of|Panel [I1V]|the table below)\b/i.test(t),
  // A stem this short is almost always a question whose body was a figure.
  truncatedStem: (t) => t.replace(/\s+/g, " ").trim().length < 40,
};

function flagsFor(stem, options, questionType) {
  const flags = [];
  const whole = [stem, ...options.map(o => o.text)].join("\n");

  // Present on EVERY extracted question, because it is true of every one of
  // them: the source PDFs contain no answer key (see the header). It is a
  // flag rather than an implicit state so the admin queue can show, at a
  // glance, that answer entry is the outstanding work on the whole batch.
  flags.push("no-answer-key");

  if (FLAGS.symbolLoss(whole)) flags.push("symbol-loss");
  if (FLAGS.figureReference(whole)) flags.push("figure-reference");
  if (FLAGS.truncatedStem(stem)) flags.push("truncated-stem");
  if (questionType !== "nat" && options.length !== 4) flags.push("option-count");
  // An option that extracted to nothing is the image-as-option case (GATE
  // 2026 Q.2/Q.7): four bare "(A)(B)(C)(D)" markers and no text anywhere.
  if (options.some(o => !o.text.trim())) flags.push("empty-option");
  return flags;
}

// ---------------- parsing ----------------

// A GATE paper's internal layout changed twice in the years covered here, and
// the parser has to survive all three eras rather than assume the newest:
//
//   2012-2013  ONE continuous 1..65 sequence, General Aptitude LAST (Q.56-65).
//   2014-2018  TWO independent sequences - General Aptitude numbered 1..10,
//              then the subject paper restarting at 1..55. Question numbers
//              therefore COLLIDE, and "Q.3" is ambiguous without knowing which
//              section it sat in.
//   2022-2026  ONE continuous 1..65 sequence, General Aptitude FIRST (Q.1-10).
//
// So neither "GA is questions 1-10" nor "question numbers are unique within a
// paper" holds generally, and coding either assumption in silently mislabels
// whole years. Sections are detected from the numbering itself instead.
function parsePaper(lines, meta, rawText) {
  const bands = collectBands(lines);
  const starts = collectQuestionStarts(lines);
  if (!starts.length) return { questions: [], booklets: 0, duplicateBooklets: 0 };

  // Split the question stream wherever the number goes BACKWARDS. Each run is
  // one contiguously-numbered section - a GA section, a subject section, or a
  // whole unified paper.
  const runs = [];
  let run = [starts[0]];
  for (let i = 1; i < starts.length; i++) {
    if (starts[i].qno <= run[run.length - 1].qno) { runs.push(run); run = []; }
    run.push(starts[i]);
  }
  runs.push(run);

  // Group runs back into whole papers. A GA section (1..~10) followed by a
  // subject section restarting at 1 is ONE paper in two parts; a section
  // restarting at 1 after a section that ran well past 10 is a new paper.
  const booklets = [];
  let booklet = [];
  for (const r of runs) {
    const prev = booklet[booklet.length - 1];
    if (prev && prev[prev.length - 1].qno > 10) { booklets.push(booklet); booklet = []; }
    booklet.push(r);
  }
  if (booklet.length) booklets.push(booklet);

  // Is this several PRINTINGS of one paper, or several DIFFERENT papers?
  // The document says so itself, and the answer changes the import completely:
  //   - Distinct "Question Booklet Code A/B/C/D" markers mean GATE printed the
  //     identical paper with its questions shuffled (2013 carries all four).
  //     Importing every booklet would put each question in the bank four
  //     times, so only the first is kept.
  //   - Distinct "SET-1/SET-2" markers mean genuinely different papers sat by
  //     different candidates (2014 has three, 2016 two). Those are all real
  //     and all imported, distinguished by session.
  const bookletCodes = new Set([...rawText.matchAll(BOOKLET_CODE_RE)].map(m => m[1]));
  const isReprint = bookletCodes.size > 1;
  const keep = isReprint ? booklets.slice(0, 1) : booklets;

  const out = [];
  let order = 1;
  keep.forEach((parts, bookletIndex) => {
    // A paper split into GA + subject sections needs those labelled, because
    // the question numbers alone no longer identify a question. Where there is
    // only one section the label comes from the band ranges instead.
    const multiSection = parts.length > 1;
    parts.forEach((section, sectionIndex) => {
      const isGaSection = multiSection && sectionIndex === 0;
      for (let s = 0; s < section.length; s++) {
        const { index, qno } = section[s];
        const isLastOfSection = s + 1 === section.length;
        const nextIndex = !isLastOfSection ? section[s + 1].index
          : nextBoundaryAfter(runs, index, lines.length);
        const block = lines.slice(index, nextIndex);

        // Strip the "Q.17" marker off the first line, keeping whatever
        // followed it on the same line (where the stem usually begins).
        block[0] = block[0].replace(/^\s*Q\.\s?\d+[\s.)]*/, "");

        const { stem, options } = splitStemAndOptions(block);
        const band = bandFor(bands, index, qno);
        // Fall back to the published exam pattern only for a modern
        // single-sequence paper whose PDF omitted the band, never for the
        // 2014-2018 split-numbering papers where question numbers repeat and
        // the pattern would not apply.
        const canonical = (!band && !multiSection && qno <= 65)
          ? CANONICAL_MODERN_BANDS.find(b => qno >= b.from && qno <= b.to) : null;
        const marks = band?.marks ?? canonical?.marks ?? null;
        // 2022 states the type in the band header; every other year is
        // inferred from the paper's own wording and option count.
        const questionType = band?.type || classify(stem, options);

        // GA is the ONE subject assignable with certainty, because it is
        // positional rather than a judgement about content. Everything else is
        // left unassigned: guessing "Operating Systems" vs "Computer
        // Organisation" from keywords produces confident wrong answers, and a
        // misfiled question is worse than an unfiled one - it silently
        // corrupts the per-subject accuracy the analytics screen reports.
        const inGaSection = isGaSection
          || (!multiSection && band?.section === "ga");

        out.push({
          // ---- provenance, all of it certain ----
          year: meta.year,
          paperId: paperIdFor(meta.code),
          paperCode: meta.code,
          // A file that holds several real sets numbers them from 1; a file
          // holding one paper keeps whatever the filename said (2024_CS1 -> 1).
          session: keep.length > 1 ? bookletIndex + 1 : meta.session,
          questionNumber: qno,
          paperSection: multiSection ? (isGaSection ? "general-aptitude" : "subject") : null,
          order: order++,
          sourceFile: meta.file,
          organizingInstitute: meta.institute || "",

          // ---- read from the paper ----
          marks: marks ?? 1,
          questionType,
          negativeMark: negativeMarkFor(questionType, marks ?? 1),
          question: stem,
          options,

          // ---- NOT in the source; a reviewer supplies every one of these ----
          correctOptionIds: [],
          natMin: null,
          natMax: null,
          solution: "",
          explanation: "",
          subjectId: inGaSection ? "general-aptitude" : "",
          topicId: "",
          difficulty: "",

          // ---- review state ----
          status: "draft",
          reviewFlags: flagsFor(stem, options, questionType),
          marksReadFromPaper: marks != null,
          typeReadFromPaper: !!band?.type,
          extractedAt: new Date().toISOString(),
        });
      }
    });
  });

  return { questions: out, booklets: booklets.length, duplicateBooklets: isReprint ? booklets.length - 1 : 0 };
}

// Where a section's last question ends: at the start of the next section, not
// at the end of the file, or the final question of the GA section would
// swallow the entire subject paper.
function nextBoundaryAfter(runs, index, fallback) {
  for (const r of runs) {
    if (r[0].index > index) return r[0].index;
  }
  return fallback;
}

function collectBands(lines) {
  const bands = [];
  lines.forEach((line, i) => {
    const m = line.trim().match(SECTION_RE);
    if (!m) return;
    const typeWord = (m[3] || "").toLowerCase();
    const from = Number(m[1]);
    const to = Number(m[2]);
    bands.push({
      index: i, from, to,
      marks: /two|^2$/i.test(m[4]) ? 2 : 1,
      type: typeWord.startsWith("multiple choice") ? "mcq"
        : typeWord.startsWith("multiple select") ? "msq"
          : typeWord.startsWith("numerical") ? "nat" : null,
      // A band covering only 1..10 in a paper that also numbers a subject
      // section is the General Aptitude band.
      section: to <= 10 ? "ga" : null,
    });
  });
  return bands;
}

// The band that applies to a question: of the bands that PRECEDE it and cover
// its number, the LAST one declared wins. That ordering is the whole rule, and
// both of the ways it can go wrong are real papers, not hypotheticals:
//
//   - The 2014-2018 papers number General Aptitude 1..10 and then restart the
//     subject paper at 1..55, so subject Q.6 is covered by the GA band
//     "Q.6 - Q.10 carry two marks" AND by "Q.1 - Q.25 carry one mark". Picking
//     the narrowest match takes the GA band and makes five one-mark questions
//     two-mark ones - GATE 2018 then totals 105 marks instead of 100, which is
//     how this was caught. Taking the most recently declared band is correct,
//     because a paper's bands apply forwards from where they are printed.
//
//   - GATE 2022's PDF contains the typo "Q.46 - Q.555" where it means Q.55.
//     That band swallows every later question, and a FIRST-match rule would
//     hand Q.56-65 the MSQ band's type and marks. The last-declared rule picks
//     the correctly-typed "Q.56 - Q.65" band that follows it, so the typo
//     damages nothing.
//
// Width is kept only as a tie-break between two bands declared on the same
// line, which no real paper does but which costs nothing to be safe about.
function bandFor(bands, lineIndex, qno) {
  const applicable = bands.filter(b => b.index < lineIndex && qno >= b.from && qno <= b.to);
  if (!applicable.length) return null;
  return applicable.sort((a, b) => b.index - a.index || (a.to - a.from) - (b.to - b.from))[0];
}

function collectQuestionStarts(lines) {
  const starts = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (SECTION_RE.test(t)) return;               // a band header, not a question
    const m = t.match(QUESTION_RE);
    if (m) starts.push({ index: i, qno: Number(m[1]) });
  });
  return starts;
}

// An option's text runs from its "(A)" marker to the next marker, so options
// spanning several lines survive. Only the FIRST ascending A->D run counts:
// a stray "(A)" inside a stem (an enumerated list, a formula) would otherwise
// swallow the real options.
function splitStemAndOptions(block) {
  let firstOptionLine = -1;
  let expecting = "A";
  const markers = [];

  for (let i = 0; i < block.length; i++) {
    const m = block[i].trim().match(OPTION_RE);
    if (!m) continue;
    if (m[1] !== expecting) continue;
    markers.push({ line: i, id: m[1], head: m[2] });
    if (firstOptionLine === -1) firstOptionLine = i;
    expecting = String.fromCharCode(expecting.charCodeAt(0) + 1);
    if (expecting > "D") break;
  }

  const stemLines = firstOptionLine === -1 ? block : block.slice(0, firstOptionLine);
  const options = markers.map((mk, i) => {
    const end = i + 1 < markers.length ? markers[i + 1].line : block.length;
    const rest = block.slice(mk.line + 1, end).map(l => l.trim()).filter(Boolean);
    return {
      id: mk.id.toLowerCase(),
      text: [mk.head.trim(), ...rest].filter(Boolean).join(" ").trim(),
    };
  });

  return { stem: tidy(stemLines), options };
}

// Collapses the indentation -layout adds while keeping real paragraph breaks,
// because a code snippet's or a table's line structure is often the only thing
// that still makes the question readable after the symbols are gone.
function tidy(lines) {
  return lines.map(l => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "");
}

// MSQ and NAT announce themselves in the paper's own wording - GATE is
// explicit about both, precisely because the marking differs - so this reads
// those phrases rather than inferring type from option count alone.
function classify(stem, options) {
  const s = stem.toLowerCase();
  if (/\bone or more\b|\bmultiple\b.*\bcorrect\b|\bmsq\b/.test(s)) return "msq";
  if (options.length === 0) return "nat";
  if (/answer in integer|rounded off to|\(in .*\) is ______|specified to \d+ decimal/.test(s) && options.length === 0) return "nat";
  return "mcq";
}

// ---------------- driver ----------------

function main() {
  if (!existsSync(GATE_DIR)) {
    console.error(`No GATE/ directory at ${GATE_DIR}`);
    process.exit(1);
  }
  // `pdftotext -v` prints its version and exits 99 - that is success, not a
  // failure, so only a genuine ENOENT means the binary is missing. Treating
  // any non-zero exit as "not installed" reports a missing dependency on a
  // machine that has it.
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
  } catch (e) {
    if (e.code === "ENOENT") {
      console.error("pdftotext not found on PATH. It ships with poppler-utils (and with Git for Windows).");
      process.exit(1);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const report = { parsed: [], skipped: [], totals: { questions: 0, flagged: 0, byFlag: {} } };

  for (const dir of readdirSync(GATE_DIR)) {
    const dirPath = path.join(GATE_DIR, dir);
    for (const file of readdirSync(dirPath).filter(f => /\.pdf$/i.test(f))) {
      const meta = parseFilename(dir, file);
      if (ONLY_YEARS.length && !ONLY_YEARS.includes(String(meta.year))) continue;

      const text = pdfToText(path.join(dirPath, file));

      // The scanned papers land here: a PDF with no text layer yields a few
      // bytes of whitespace, not an error, so "did pdftotext succeed" is not
      // the check - "is there enough text to be a 65-question paper" is.
      if (text.trim().length < 2000) {
        report.skipped.push({ file: `${dir}/${file}`, reason: "no text layer (scanned) - needs OCR, not attempted", bytes: text.trim().length });
        continue;
      }

      const lines = stripFurniture(text);
      const { questions, booklets, duplicateBooklets } = parsePaper(lines, {
        ...meta, file: `${dir}/${file}`,
        institute: instituteFromText(text) || INSTITUTE_BY_YEAR[meta.year] || "",
      }, text);

      if (!questions.length) {
        report.skipped.push({ file: `${dir}/${file}`, reason: "text layer present but no Q.n markers matched", bytes: text.trim().length });
        continue;
      }

      const name = `${paperIdFor(meta.code)}-${meta.year}${meta.session ? `-s${meta.session}` : ""}`;
      writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(questions, null, 2));

      const flagged = questions.filter(q => q.reviewFlags.length > 1).length;   // >1 = beyond the universal no-answer-key
      for (const q of questions) {
        for (const f of q.reviewFlags) report.totals.byFlag[f] = (report.totals.byFlag[f] || 0) + 1;
      }
      report.totals.questions += questions.length;
      report.totals.flagged += flagged;
      // A GATE paper is 65 questions. Anything materially short of that (times
      // the number of real sets in the file) means the PDF's text layer is
      // partial - several of these PDFs have a text layer over only some
      // pages - and the reviewer needs to know the extraction is INCOMPLETE,
      // not just flagged. Silently importing 6 of 65 questions and calling the
      // year done is the failure mode this guards against.
      const sets = Math.max(1, booklets - duplicateBooklets);
      const expected = 65 * sets;

      // EVERY GATE paper is exactly 100 marks - 65 questions, 30 of them worth
      // one mark and 35 worth two. That invariant is the single best check
      // available on this extraction, because it independently verifies the
      // question splitting AND the mark-band resolution at once: miscount the
      // questions and the total drops, resolve one band wrong and it moves by
      // exactly the marks involved. It is what caught the 2014-2018 papers
      // being scored 105 (see bandFor). Reported per set, and only meaningful
      // where the extraction is complete.
      const totalMarks = questions.reduce((a, q) => a + q.marks, 0);
      const marksPerSet = totalMarks / sets;
      report.parsed.push({
        file: `${dir}/${file}`, output: `${name}.json`,
        questions: questions.length, flagged, sets, duplicateBooklets,
        byType: questions.reduce((a, q) => ({ ...a, [q.questionType]: (a[q.questionType] || 0) + 1 }), {}),
        marksUnread: questions.filter(q => !q.marksReadFromPaper).length,
        incomplete: questions.length < expected * 0.9 ? `${questions.length} of ~${expected} expected` : null,
        totalMarks, marksPerSet,
        marksOk: questions.length >= expected * 0.9 ? marksPerSet === 100 : null,
      });
    }
  }

  writeFileSync(path.join(OUT_DIR, "_report.json"), JSON.stringify(report, null, 2));

  console.log("\nGATE PYQ extraction\n" + "=".repeat(64));
  for (const p of report.parsed.sort((a, b) => a.file.localeCompare(b.file))) {
    const types = Object.entries(p.byType).map(([k, v]) => `${k}:${v}`).join(" ");
    const notes = [
      p.sets > 1 ? `${p.sets} sets` : null,
      p.duplicateBooklets ? `${p.duplicateBooklets} reprint booklet(s) dropped` : null,
      p.marksUnread ? `${p.marksUnread} with no mark band` : null,
      p.marksOk === false ? `MARKS ${p.marksPerSet}/100 per set` : null,
      p.incomplete ? `INCOMPLETE: ${p.incomplete}` : null,
    ].filter(Boolean);
    console.log(`  ${p.file.padEnd(18)} ${String(p.questions).padStart(3)} questions  ${String(p.flagged).padStart(3)} flagged   ${types.padEnd(24)}${notes.length ? `  ${notes.join("; ")}` : ""}`);
  }
  if (report.skipped.length) {
    console.log("\n  SKIPPED");
    for (const s of report.skipped.sort((a, b) => a.file.localeCompare(b.file))) {
      console.log(`  ${s.file.padEnd(18)} ${s.reason}`);
    }
  }
  console.log("\n  " + "-".repeat(62));
  console.log(`  ${report.totals.questions} draft questions from ${report.parsed.length} papers, ${report.skipped.length} papers skipped`);
  console.log("\n  Review flags raised:");
  for (const [flag, n] of Object.entries(report.totals.byFlag).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${flag.padEnd(20)} ${n}`);
  }
  console.log(`\n  Written to ${path.relative(REPO_ROOT, OUT_DIR)}`);
  console.log("  NO database writes. Load these with:  node scripts/import-gate-pyq-drafts.mjs --dry-run\n");
}

main();
