// Seeds gate_roadmap_days - the full 139-day GATE CS roadmap - built on top
// of DeVert's own live gatePapers/cs topic catalog.
//
// AMENDMENT: the plan was originally calendar-locked (Day 1 = 15 Aug 2026,
// Day 139 = 31 Dec 2026 - the `date`/`week` fields below still reflect that
// original seeding). lib/gateRoadmap.js has since been converted to
// self-paced (every day open from Day 1, gated by each student's own
// startedAt instead of a real calendar date) - see that file's header. The
// `date` field seeded by this script is therefore historical metadata only;
// nothing reads it for gating anymore. dayNumber, topicIds, subjectId,
// topicsSummary, estimatedMinutes and difficulty are all still exactly what
// the self-paced UI consumes, so this generator did not need to change.
//
// A roadmap day never duplicates lesson content -
// it only REFERENCES real topicIds that already exist in that paper's tree,
// the same way lib/gate.js's own recommendNextTopic() points at existing
// topics rather than copying them.
//
// Two-collection split, same reasoning as every other GATE progress pair:
//   - gate_roadmap_days: the STATIC plan. Identical for every student on a
//     given paper, admin-authored/seeded, world-readable-when-published -
//     same shape as gatePapers itself (see firestore.rules).
//   - gate_roadmap_progress: the PER-STUDENT completion state, one doc per
//     (uid, paperId) - written by lib/gateRoadmap.js's completeRoadmapDay().
//
// CS ONLY. DA and CS+DA don't get a curated plan here because no official DA
// syllabus PDF was supplied to verify a day-by-day breakdown against - see
// gate-roadmap.jsx's own empty-state copy, which says so honestly instead of
// silently reusing the CS plan for a paper it was never checked against.
//
// Days 1-17 (15-31 Aug) are hand-authored below (DAYS) - the original
// curated pilot, unchanged. Days 18-139 (1 Sep - 31 Dec) are GENERATED
// (generateSepToDecDays() + generateDecemberDays()) from an ordered subject/
// topic queue, because hand-authoring 122 more day objects one at a time
// is where transcription errors creep in - a generator keeps every date,
// topicId and reward number derived from one source of truth instead of
// re-typed 122 times. Every topicId referenced anywhere below was read
// directly out of the live gatePapers/cs catalog (see the subject dispatch
// prompts this plan was built from) - none are invented.
//
// A NOTE ON "WEIGHTAGE": GATE does not publish an official per-topic marks
// breakdown, and no such document was supplied for this plan. So this
// generator does NOT assign specific weightage percentages to any topic.
// What it DOES do is give every one of the 168 real CS syllabus topics
// exactly one dedicated day-slot, sized in proportion to how many topics
// its subject actually has - i.e. day-count coverage is topic-count-
// proportionate, not officially marks-weighted. See
// scripts/seed-gate-announcements.mjs's "roadmap-coverage" doc for the
// honest, user-facing version of this same caveat.
//
// Usage:
//   node scripts/seed-gate-roadmap.mjs --dry-run
//   node scripts/seed-gate-roadmap.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const PAPER_ID = "cs";

// ---------------------------------------------------------------------------
// Date helpers. Day 1 = 2026-08-15, a confirmed Saturday (cross-checked
// against gate2027.iitm.ac.in's own dated pages earlier in this project).
// Weekday-by-dayNumber is safe as pure modular arithmetic (no calendar-length
// edge cases); real dates still go through actual Date arithmetic.
// ---------------------------------------------------------------------------
function dateForDay(dayNumber) {
  // UTC ("Z"), not +05:30 - this is pure calendar-day arithmetic on a fixed
  // start date, and toISOString() reads back the UTC calendar date. Stamping
  // the instant at IST midnight instead reads back one day EARLY on every
  // call (18:30 UTC the day before) - caught by this script's own sanity
  // checks below, and fixed the same way in lib/gateRoadmap.js's
  // roadmapDateForDay(), which shares this exact logic.
  const start = new Date(`2026-08-15T00:00:00Z`);
  const d = new Date(start.getTime() + (dayNumber - 1) * 86400000);
  return d.toISOString().slice(0, 10);
}
// 0=Sat,1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri
function weekdayOf(dayNumber) {
  return (dayNumber - 1) % 7;
}
function isSaturday(dayNumber) {
  return weekdayOf(dayNumber) === 0;
}

// dayNumber, date, week hand-computed against Day 1 = 15 Aug 2026 (a Saturday).
const DAYS = [
  { dayNumber: 1, date: "2026-08-15", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Discrete Mathematics I",
    topicIds: ["propositional-logic", "first-order-logic", "sets", "relations", "functions"],
    topicsSummary: "Propositional Logic, First Order Logic, Sets, Relations, Functions",
    estimatedMinutes: 270, difficulty: "Beginner", xpReward: 90, coinReward: 30 },
  { dayNumber: 2, date: "2026-08-16", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Discrete Mathematics II",
    topicIds: ["partial-orders-and-lattices", "monoids", "groups", "graph-connectivity", "graph-matching", "graph-colouring"],
    topicsSummary: "Partial Orders & Lattices, Monoids, Groups, Graph Connectivity/Matching/Colouring",
    estimatedMinutes: 270, difficulty: "Beginner", xpReward: 95, coinReward: 30 },
  { dayNumber: 3, date: "2026-08-17", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Discrete Mathematics III",
    topicIds: ["combinatorics-counting", "recurrence-relations", "generating-functions"],
    topicsSummary: "Combinatorics: Counting, Recurrence Relations, Generating Functions",
    estimatedMinutes: 150, difficulty: "Beginner", xpReward: 55, coinReward: 18 },
  { dayNumber: 4, date: "2026-08-18", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Linear Algebra",
    topicIds: ["matrices", "determinants", "system-of-linear-equations", "eigenvalues-and-eigenvectors", "lu-decomposition"],
    topicsSummary: "Matrices, Determinants, System of Linear Equations, Eigenvalues & Eigenvectors, LU Decomposition",
    estimatedMinutes: 180, difficulty: "Beginner", xpReward: 65, coinReward: 22 },
  { dayNumber: 5, date: "2026-08-19", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Calculus",
    topicIds: ["limits", "continuity-and-differentiability", "maxima-and-minima", "mean-value-theorem", "integration"],
    topicsSummary: "Limits, Continuity & Differentiability, Maxima & Minima, Mean Value Theorem, Integration",
    estimatedMinutes: 180, difficulty: "Beginner", xpReward: 65, coinReward: 22 },
  { dayNumber: 6, date: "2026-08-20", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Probability & Statistics I",
    topicIds: ["random-variables", "uniform-distribution", "normal-distribution", "exponential-distribution"],
    topicsSummary: "Random Variables, Uniform, Normal, Exponential Distribution",
    estimatedMinutes: 150, difficulty: "Beginner", xpReward: 55, coinReward: 18 },
  { dayNumber: 7, date: "2026-08-21", week: 1, kind: "new", subjectId: "engineering-mathematics",
    subjectLabel: "Engineering Mathematics — Probability & Statistics II",
    topicIds: ["poisson-distribution", "binomial-distribution", "mean-median-mode-and-standard-deviation", "conditional-probability", "bayes-theorem"],
    topicsSummary: "Poisson, Binomial Distribution, Mean/Median/Mode/SD, Conditional Probability, Bayes Theorem — completes Engineering Mathematics (33/33)",
    estimatedMinutes: 180, difficulty: "Beginner", xpReward: 65, coinReward: 22 },

  { dayNumber: 8, date: "2026-08-22", week: 2, kind: "pyq", subjectId: "engineering-mathematics",
    subjectLabel: "Week 1 Consolidation",
    topicIds: [],
    topicsSummary: "Full Engineering Mathematics revision pass + General Aptitude practice (already authored, 19/19)",
    estimatedMinutes: 240, difficulty: "Beginner", xpReward: 70, coinReward: 24 },
  { dayNumber: 9, date: "2026-08-23", week: 2, kind: "new", subjectId: "digital-logic",
    subjectLabel: "Digital Logic — Boolean Algebra I",
    topicIds: ["boolean-algebra-fundamentals", "logic-gates-and-universal-gates", "algebraic-minimization-technique", "karnaugh-map", "tabular-method-quine-mccluskey"],
    topicsSummary: "Boolean Algebra Fundamentals, Logic Gates & Universal Gates, Algebraic Minimization, Karnaugh Map, Tabular Method",
    estimatedMinutes: 240, difficulty: "Beginner", xpReward: 80, coinReward: 27 },
  { dayNumber: 10, date: "2026-08-24", week: 2, kind: "new", subjectId: "digital-logic",
    subjectLabel: "Digital Logic — Combinational Circuits",
    topicIds: ["combinational-circuit-design", "multiplexers-decoders-and-encoders", "latches-and-flip-flops"],
    topicsSummary: "Combinational Circuit Design, Multiplexers/Decoders/Encoders, Latches & Flip-Flops",
    estimatedMinutes: 150, difficulty: "Beginner", xpReward: 55, coinReward: 18 },
  { dayNumber: 11, date: "2026-08-25", week: 2, kind: "new", subjectId: "digital-logic",
    subjectLabel: "Digital Logic — Sequential Circuits",
    topicIds: ["sequential-circuit-design", "counters-and-shift-registers", "finite-state-machine-design"],
    topicsSummary: "Sequential Circuit Design, Counters & Shift Registers, Finite State Machine Design",
    estimatedMinutes: 180, difficulty: "Intermediate", xpReward: 60, coinReward: 20 },
  { dayNumber: 12, date: "2026-08-26", week: 2, kind: "new", subjectId: "digital-logic",
    subjectLabel: "Digital Logic — Number Representation",
    topicIds: ["number-systems-and-base-conversion", "fixed-point-representation", "floating-point-representation-ieee-754", "binary-arithmetic"],
    topicsSummary: "Number Systems & Base Conversion, Fixed/Floating Point (IEEE 754), Binary Arithmetic — completes Digital Logic (15/15)",
    estimatedMinutes: 180, difficulty: "Intermediate", xpReward: 65, coinReward: 22 },
  { dayNumber: 13, date: "2026-08-27", week: 2, kind: "new", subjectId: "programming-and-data-structures",
    subjectLabel: "Programming & Data Structures — C Foundations",
    topicIds: ["c-basics-data-types-and-operators", "control-flow-and-functions", "pointers-and-memory", "arrays-and-strings-in-c", "structures-unions-and-storage-classes"],
    topicsSummary: "C Basics, Control Flow & Functions, Pointers & Memory, Arrays & Strings, Structures/Unions/Storage Classes",
    estimatedMinutes: 180, difficulty: "Beginner", xpReward: 65, coinReward: 22 },
  { dayNumber: 14, date: "2026-08-28", week: 2, kind: "new", subjectId: "programming-and-data-structures",
    subjectLabel: "Programming & Data Structures — Recursion & Linear DS",
    topicIds: ["recursion", "recursion-tracing-and-output-prediction", "arrays", "stacks", "queues", "linked-lists"],
    topicsSummary: "Recursion, Recursion Tracing, Arrays, Stacks, Queues, Linked Lists",
    estimatedMinutes: 210, difficulty: "Intermediate", xpReward: 70, coinReward: 24 },

  { dayNumber: 15, date: "2026-08-29", week: 3, kind: "pyq", subjectId: "digital-logic",
    subjectLabel: "Week 2 Consolidation",
    topicIds: [],
    topicsSummary: "Digital Logic + Programming & DS (C/recursion/linear structures) revision pass",
    estimatedMinutes: 240, difficulty: "Intermediate", xpReward: 70, coinReward: 24 },
  { dayNumber: 16, date: "2026-08-30", week: 3, kind: "new", subjectId: "programming-and-data-structures",
    subjectLabel: "Programming & Data Structures — Trees, Heaps & Graphs",
    topicIds: ["trees-and-tree-traversals", "binary-search-trees", "binary-heaps", "graph-representations"],
    topicsSummary: "Trees & Tree Traversals, Binary Search Trees, Binary Heaps, Graph Representations — completes Programming & DS (15/15)",
    estimatedMinutes: 240, difficulty: "Intermediate", xpReward: 80, coinReward: 27 },
  { dayNumber: 17, date: "2026-08-31", week: 3, kind: "month-close", subjectId: "engineering-mathematics",
    subjectLabel: "August Full Revision + Mini-Mock",
    topicIds: [],
    topicsSummary: "Flashcard sweep across all 63 August topics (Eng. Maths, Digital Logic, Programming & DS) + a mixed mini-mock",
    estimatedMinutes: 210, difficulty: "Intermediate", xpReward: 75, coinReward: 25 },
];

// ---------------------------------------------------------------------------
// Sep-Nov: ordered subject queue, real topicIds only (verified against the
// live gatePapers/cs/subjects/{id}/topics/{id} catalog). Block sizes stay in
// the same 2-4 topic/day range August used - later subjects are conceptually
// denser, so the pace intentionally doesn't accelerate to compensate.
// ---------------------------------------------------------------------------
// Blocks stay at 1-2 topics/day here (denser 3-4/day blocks pushed the
// whole 73-topic queue to finish by early October - too fast against the
// Sep/Algorithms+COA+Compiler, Oct/OS+Databases, Nov/Computer-Networks
// spread this plan is meant to follow, and against a realistic weekday pace
// for conceptually denser subjects than August's warm-up material).
const SUBJECT_QUEUE = [
  { subjectId: "algorithms", subjectName: "Algorithms", minutesPerTopic: 70, difficulty: "Intermediate", blocks: [
    { label: "Asymptotic Notation & Complexity", topicIds: ["asymptotic-notation", "worst-case-time-and-space-complexity"] },
    { label: "Recurrence Solving & Searching", topicIds: ["recurrence-solving-for-algorithms", "searching"] },
    { label: "Sorting & Hashing", topicIds: ["sorting", "hashing"] },
    { label: "Greedy Algorithms & Dynamic Programming", topicIds: ["greedy-algorithms", "dynamic-programming"] },
    { label: "Divide & Conquer + Graph Traversals", topicIds: ["divide-and-conquer", "graph-traversals"] },
    { label: "Minimum Spanning Trees & Shortest Paths", topicIds: ["minimum-spanning-trees", "shortest-paths"] },
  ]},
  { subjectId: "computer-organization-and-architecture", subjectName: "Computer Organization & Architecture", minutesPerTopic: 60, difficulty: "Intermediate", blocks: [
    { label: "Instruction Set Architecture & Addressing Modes", topicIds: ["instruction-set-architecture", "addressing-modes"] },
    { label: "ALU Design & Hardwired Control", topicIds: ["design-of-arithmetic-and-logic-unit-alu", "hardwired-control-unit-design"] },
    { label: "Microprogrammed Control & Memory Hierarchy", topicIds: ["microprogrammed-control-unit-design", "memory-hierarchy-and-performance"] },
    { label: "Cache Performance & Memory Interfacing", topicIds: ["cache-performance-and-replacement-policies", "memory-interfacing"] },
    { label: "I/O Interface: Interrupts & DMA", topicIds: ["i-o-interface-interrupts", "i-o-interface-dma"] },
    { label: "Instruction Pipelining & Hazards", topicIds: ["instruction-pipelining", "pipeline-hazards"] },
  ]},
  { subjectId: "compiler-design", subjectName: "Compiler Design", minutesPerTopic: 65, difficulty: "Intermediate", blocks: [
    { label: "Lexical Analysis & Top-Down Parsing", topicIds: ["lexical-analysis", "parsing-top-down"] },
    { label: "Bottom-Up Parsing & Syntax-Directed Translation", topicIds: ["parsing-bottom-up", "syntax-directed-translation"] },
    { label: "Runtime Environments & Intermediate Code", topicIds: ["runtime-environments", "intermediate-code-generation"] },
    { label: "Local Optimisation & Constant Propagation", topicIds: ["local-optimisation", "constant-propagation"] },
    { label: "Liveness Analysis & Common Subexpression Elimination", topicIds: ["liveness-analysis", "common-subexpression-elimination"] },
  ]},
  { subjectId: "operating-system", subjectName: "Operating System", minutesPerTopic: 60, difficulty: "Intermediate", blocks: [
    { label: "System Calls & Processes", topicIds: ["system-calls", "processes"] },
    { label: "Threads & Inter-Process Communication", topicIds: ["threads", "inter-process-communication"] },
    { label: "Concurrency, Synchronization & Semaphores", topicIds: ["concurrency-and-synchronization", "semaphores-and-monitors"] },
    { label: "Deadlock & CPU Scheduling", topicIds: ["deadlock", "cpu-scheduling"] },
    { label: "I/O Scheduling & Memory Management", topicIds: ["i-o-scheduling", "memory-management"] },
    { label: "Virtual Memory, Paging & File Systems", topicIds: ["virtual-memory-and-paging", "file-systems"] },
  ]},
  { subjectId: "databases", subjectName: "Databases", minutesPerTopic: 58, difficulty: "Intermediate", blocks: [
    { label: "ER Model & Relational Model", topicIds: ["er-model", "relational-model"] },
    { label: "Relational Algebra & Tuple Relational Calculus", topicIds: ["relational-algebra", "tuple-relational-calculus"] },
    { label: "SQL & Integrity Constraints", topicIds: ["sql", "integrity-constraints"] },
    { label: "Functional Dependencies & Normalization", topicIds: ["functional-dependencies-and-normal-forms", "file-organization"] },
    { label: "B-Tree Indexing & Transactions", topicIds: ["indexing-b-trees", "transactions"] },
    { label: "Concurrency Control", topicIds: ["concurrency-control"] },
  ]},
  { subjectId: "computer-networks", subjectName: "Computer Networks", minutesPerTopic: 52, difficulty: "Intermediate", blocks: [
    { label: "Layering & Switching", topicIds: ["principles-of-layering", "switching-circuit-packet-and-virtual-circuit"] },
    { label: "Network Performance & Error Detection", topicIds: ["network-performance-metrics", "error-detection"] },
    { label: "Medium Access Control & Ethernet", topicIds: ["medium-access-control", "ethernet"] },
    { label: "Distance Vector & Link State Routing", topicIds: ["distance-vector-routing", "link-state-routing"] },
    { label: "IPv4 Addressing, Fragmentation & CIDR", topicIds: ["ipv4-addressing-and-fragmentation", "cidr-notation"] },
    { label: "NAT & TCP Flow Control", topicIds: ["network-address-translation", "tcp-flow-control"] },
    { label: "TCP Congestion Control & Socket API", topicIds: ["tcp-congestion-control", "socket-api"] },
    { label: "Application Layer: DNS & HTTP", topicIds: ["dns", "http"] },
  ]},
];

const ALL_CS_SUBJECTS = [
  "General Aptitude", "Engineering Mathematics", "Digital Logic",
  "Programming & Data Structures", "Algorithms",
  "Computer Organization & Architecture", "Compiler Design",
  "Operating System", "Databases", "Computer Networks",
];

function xpFor(minutes) {
  const xp = Math.round(minutes / 2.8);
  return { xp, coin: Math.round(xp / 3) };
}

// Sep 1 (Day 18) through Nov 30 (Day 108): the 6-subject queue above, with a
// PYQ/practice day auto-inserted after each subject finishes, and a "Week
// Consolidation" day auto-inserted every Saturday - exactly the rhythm
// August already established (day 8, day 15 both landed on Saturdays).
// Once the queue is empty (expected to land in November, not before), a
// "Full-Syllabus Practice Rotation" phase fills every remaining day up to
// Day 108, cycling subject-by-subject through all 10 CS subjects rather
// than repeating one generic label - there's no content-free or repetitive
// day in this plan.
function generateSepToDecDays() {
  const out = [];
  let dayNumber = 18;
  let weekNumber = 4;
  let weekTopics = [];
  let rotationIndex = 0;

  // Always fires on a Saturday, in EITHER phase - during the subject queue
  // it summarizes that week's new topics; during the practice rotation
  // (weekTopics necessarily empty by then) it's a full-syllabus sweep
  // instead of silently skipping the week, which an earlier version of
  // this generator did.
  function pushWeeklyConsolidationIfDue() {
    if (!isSaturday(dayNumber)) return;
    const { xp, coin } = xpFor(210);
    const summary = weekTopics.length > 0
      ? `Revision pass: ${weekTopics.map(t => t.label).join("; ")}`
      : "Full-syllabus mixed revision - flashcard sweep across every subject completed so far, weighted toward whatever came up wrong in this week's practice";
    out.push({
      dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind: "pyq",
      subjectId: weekTopics[0]?.subjectId ?? null,
      subjectLabel: "Week Consolidation",
      topicIds: [],
      topicsSummary: summary,
      estimatedMinutes: 210, difficulty: "Intermediate", xpReward: xp, coinReward: coin,
    });
    dayNumber += 1;
    weekNumber += 1;
    weekTopics = [];
  }

  for (const subject of SUBJECT_QUEUE) {
    for (let i = 0; i < subject.blocks.length; i += 1) {
      pushWeeklyConsolidationIfDue();
      const block = subject.blocks[i];
      const isLastBlock = i === subject.blocks.length - 1;
      const minutes = block.topicIds.length * subject.minutesPerTopic;
      const { xp, coin } = xpFor(minutes);
      out.push({
        dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind: "new",
        subjectId: subject.subjectId,
        subjectLabel: `${subject.subjectName} — ${block.label}`,
        topicIds: block.topicIds,
        topicsSummary: block.label + (isLastBlock ? ` — completes ${subject.subjectName}` : ""),
        estimatedMinutes: minutes, difficulty: subject.difficulty, xpReward: xp, coinReward: coin,
      });
      weekTopics.push({ subjectId: subject.subjectId, label: block.label });
      dayNumber += 1;

      if (isLastBlock) {
        pushWeeklyConsolidationIfDue();
        const pyqMinutes = 240;
        const { xp: xp2, coin: coin2 } = xpFor(pyqMinutes);
        out.push({
          dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind: "pyq",
          subjectId: subject.subjectId,
          subjectLabel: `${subject.subjectName} — Practice & PYQs`,
          topicIds: [],
          topicsSummary: `Solve real ${subject.subjectName} PYQs (2007-2026 papers) + revise flashcards for every ${subject.subjectName} topic covered so far`,
          estimatedMinutes: pyqMinutes, difficulty: subject.difficulty, xpReward: xp2, coinReward: coin2,
        });
        dayNumber += 1;
        weekTopics = [];
      }
    }
  }

  // Full-Syllabus Practice Rotation: once the subject queue above empties
  // (expected partway through November), cycle subject-by-subject through
  // all 10 real CS subjects - two distinct days each (deep PYQ practice,
  // then a timed mixed set) - instead of repeating one generic label for
  // however many days are left. A full-length mock lands every 12th
  // rotation day. Wraps around the subject list as many times as needed to
  // reach Day 108 (30 Nov) exactly.
  while (dayNumber <= 108) {
    pushWeeklyConsolidationIfDue();
    if (dayNumber > 108) break;

    if (rotationIndex > 0 && rotationIndex % 12 === 0) {
      const minutes = 180;
      const { xp, coin } = xpFor(minutes);
      out.push({
        dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind: "mock",
        subjectId: null, subjectLabel: "Full-Length Mock Test",
        topicIds: [],
        topicsSummary: "Simulate the real GATE CS exam end to end: 180 minutes, General Aptitude + Engineering Mathematics + full subject mix, no pausing",
        estimatedMinutes: minutes, difficulty: "Intermediate", xpReward: xp, coinReward: coin,
      });
      dayNumber += 1;
      rotationIndex += 1;
      continue;
    }

    const subject = ALL_CS_SUBJECTS[Math.floor(rotationIndex / 2) % ALL_CS_SUBJECTS.length];
    const isDeepPractice = rotationIndex % 2 === 0;
    const minutes = isDeepPractice ? 190 : 170;
    const { xp, coin } = xpFor(minutes);
    out.push({
      dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind: "pyq",
      subjectId: null,
      subjectLabel: isDeepPractice ? `${subject} — Deep PYQ Practice` : `${subject} — Timed Practice Set`,
      topicIds: [],
      topicsSummary: isDeepPractice
        ? `Solve real ${subject} PYQs (2007-2026 papers), focused on the question types and traps specific to ${subject}`
        : `A timed, exam-conditions mixed set on ${subject} only, followed by a full review of every miss`,
      estimatedMinutes: minutes, difficulty: "Intermediate", xpReward: xp, coinReward: coin,
    });
    dayNumber += 1;
    rotationIndex += 1;
  }

  return out;
}

// December (Day 109 - Day 139): NO new syllabus content - by the end of
// November every one of the 168 CS topics has its own day-slot. December is
// four fixed phases: (1) one rapid revision day per CS subject, (2) full PYQ
// paper practice by year, (3) full-length timed mocks, (4) weak-topic-
// focused final revision - the same "no new syllabus in the final stretch"
// structure the Blueprint artifact laid out.
function generateDecemberDays() {
  const out = [];
  let dayNumber = 109; // 2026-12-01
  let weekNumber = 20;

  function push({ kind, label, summary, minutes }) {
    const { xp, coin } = xpFor(minutes);
    out.push({
      dayNumber, date: dateForDay(dayNumber), week: weekNumber, kind,
      subjectId: null, subjectLabel: label, topicIds: [], topicsSummary: summary,
      estimatedMinutes: minutes, difficulty: "Intermediate", xpReward: xp, coinReward: coin,
    });
    dayNumber += 1;
  }

  // Phase 1 (10 days): one rapid revision day per CS subject.
  for (const subject of ALL_CS_SUBJECTS) {
    push({
      kind: "revision",
      label: `Full Revision — ${subject}`,
      summary: `Rapid re-read of every ${subject} topic's Night-Before notes, a full flashcard sweep, and a 15-question mixed MCQ/MSQ/NAT set on ${subject} only`,
      minutes: 180,
    });
    if (isSaturday(dayNumber)) weekNumber += 1;
  }

  // Phase 1b (3 days): buffer / catch-up before PYQ phase begins.
  push({ kind: "revision", label: "Buffer & Catch-Up", summary: "Catch up on anything from the subject-revision rotation that needs more time, or get ahead on the PYQ phase starting next", minutes: 150 });
  push({ kind: "revision", label: "Buffer & Catch-Up", summary: "Second buffer day - use it for whichever subject's revision felt weakest this week", minutes: 150 });
  push({ kind: "revision", label: "Buffer & Catch-Up", summary: "Third buffer day - a free slot before the PYQ phase begins, for whatever this week actually needs", minutes: 150 });
  weekNumber += 1;

  // Phase 2 (9 days): PYQ practice by year, newest-first, paired with review
  // days - recent papers reflect the current pattern most closely, so they
  // come first while attention is freshest.
  const PYQ_PAIRS = [
    { label: "Attempt 2025 & 2024 Papers", summary: "Attempt the real GATE CS 2025 and 2024 papers, full length, timed" },
    { label: "Attempt 2023 & 2022 Papers", summary: "Attempt the real GATE CS 2023 and 2022 papers, full length, timed" },
    { label: "Attempt 2021 & 2020 Papers", summary: "Attempt the real GATE CS 2021 and 2020 papers, full length, timed" },
  ];
  for (const pair of PYQ_PAIRS) {
    push({ kind: "pyq", label: pair.label, summary: pair.summary, minutes: 200 });
    push({ kind: "pyq", label: "Review & Weak-Topic Log", summary: `Review every missed question from "${pair.label}", trace each gap to its topic, and update the weak-topic log`, minutes: 150 });
  }
  push({ kind: "pyq", label: "Attempt 2019-2015 Papers", summary: "Rapid-fire attempt of GATE CS 2019 down to 2015 - older syllabus drift means faster attempts, focus on pattern recognition over full solving", minutes: 200 });
  push({ kind: "pyq", label: "Attempt 2014-2007 Papers + Final Review", summary: "Sweep through the remaining older GATE CS papers (2014 back to 2007) and close out the full weak-topic log from this whole PYQ phase", minutes: 200 });
  weekNumber += 1;

  // Phase 3 (6 days): full-length timed mocks, each followed by a review day.
  for (let m = 1; m <= 3; m += 1) {
    push({ kind: "mock", label: `Full-Length Mock Test ${m}`, summary: `Simulate the real GATE CS exam: 180 minutes, 65 questions, GA + Engineering Mathematics + full subject mix - no pausing`, minutes: 180 });
    push({ kind: "mock", label: `Mock ${m} Review`, summary: `Detailed review of Mock ${m} - every wrong and skipped question traced to its topic and added to the weak-topic log`, minutes: 150 });
    if (isSaturday(dayNumber)) weekNumber += 1;
  }

  // Phase 4 (4 days): weak-topic-focused final revision + a last mock + a
  // final recap - explicitly framed as the end of THIS curated plan, not
  // the exam itself (GATE 2027 is in Feb 2027 - see gate_announcements).
  push({ kind: "revision", label: "Weak-Topic Focused Revision", summary: "Personalized pass through your own weak-topic log built across Phases 2-3 - which topics actually need the time is yours to judge, not a fixed list", minutes: 180 });
  push({ kind: "mock", label: "Full-Length Mock Test 4 (Final)", summary: "One last full 180-minute simulated GATE CS paper before this plan's final review", minutes: 180 });
  push({ kind: "mock", label: "Mock 4 Review + Formula Sheet Sweep", summary: "Review Mock 4 in full, then a last pass over every formula/shortcut sheet collected across the whole plan", minutes: 150 });
  push({
    kind: "month-close",
    label: "139-Day Milestone: Full Syllabus Recap",
    summary: "A full flashcard sweep across all 168 CS syllabus topics from Day 1 to today. This closes the initially-curated 15 Aug-31 Dec plan - the real GATE 2027 exam is in Feb 2027 (see the Important Dates announcement), so keep the same PYQ/mock rhythm going into January rather than stopping here.",
    minutes: 210,
  });

  return out;
}

const GENERATED_DAYS = [...generateSepToDecDays(), ...generateDecemberDays()];

async function run() {
  const allDays = [...DAYS, ...GENERATED_DAYS];

  // Sanity checks - fail loudly rather than silently writing a broken plan.
  const dayNumbers = allDays.map(d => d.dayNumber);
  const expected = Array.from({ length: 139 }, (_, i) => i + 1);
  const missing = expected.filter(n => !dayNumbers.includes(n));
  const duplicated = dayNumbers.filter((n, i) => dayNumbers.indexOf(n) !== i);
  if (missing.length) throw new Error(`Missing day numbers: ${missing.join(", ")}`);
  if (duplicated.length) throw new Error(`Duplicate day numbers: ${duplicated.join(", ")}`);
  const lastDate = allDays[allDays.length - 1].date;
  if (lastDate !== "2026-12-31") throw new Error(`Plan does not end on 2026-12-31 - ends on ${lastDate} instead`);
  for (const d of allDays) {
    const expectedDate = dateForDay(d.dayNumber);
    if (d.date !== expectedDate) throw new Error(`Day ${d.dayNumber}: date ${d.date} does not match computed ${expectedDate}`);
  }

  const totalTopics = allDays.reduce((sum, d) => sum + d.topicIds.length, 0);

  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");
  for (const d of allDays) {
    const docId = `${PAPER_ID}_${d.dayNumber}`;
    console.log(`  ${docId.padEnd(10)} ${d.date}  week${String(d.week).padEnd(3)} ${d.kind.padEnd(12)} ${d.subjectLabel}`);
    if (!DRY_RUN) {
      await db.collection("gate_roadmap_days").doc(docId).set({
        paperId: PAPER_ID,
        dayNumber: d.dayNumber,
        date: d.date,
        week: d.week,
        kind: d.kind,
        subjectId: d.subjectId,
        subjectLabel: d.subjectLabel,
        topicIds: d.topicIds,
        topicsSummary: d.topicsSummary,
        estimatedMinutes: d.estimatedMinutes,
        difficulty: d.difficulty,
        xpReward: d.xpReward,
        coinReward: d.coinReward,
        status: "published",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  console.log(`\n${allDays.length} roadmap day(s) ${DRY_RUN ? "would be written" : "written"} for paper "${PAPER_ID}" (Day 1-${allDays.length}, ${totalTopics} topic-slots referenced).`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
