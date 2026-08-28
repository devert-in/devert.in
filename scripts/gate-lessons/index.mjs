// Registry of authored GATE lesson bodies, keyed by subject id exactly as it
// appears under gatePapers/{paperId}/subjects/{subjectId}. Add a subject file,
// import it here, and scripts/write-gate-lessons.mjs picks it up - a subject
// absent from this map is left alone, which is what lets authoring roll out
// subject by subject instead of all at once.
//
// IMPORTANT - keyed by SUBJECT, not by paper. lib/gateSyllabus.js gives the same
// subject tree the same subject/topic ids in every paper that contains it
// (general-aptitude is identical under cs, da and cs-da; algorithms is identical
// under cs and cs-da), so one authored lesson fans out to every paper that has
// that path. The write script does that fan-out and reports it. Authoring
// per-paper instead would mean maintaining three copies of the same lesson and
// letting them drift.

import { GENERAL_APTITUDE } from "./general-aptitude.mjs";
import { DIGITAL_LOGIC } from "./digital-logic.mjs";
import { THEORY_OF_COMPUTATION } from "./theory-of-computation.mjs";
import { COMPUTER_ORGANIZATION_AND_ARCHITECTURE } from "./computer-organization-and-architecture.mjs";
import { PROGRAMMING_AND_DATA_STRUCTURES } from "./programming-and-data-structures.mjs";
import { PROGRAMMING_AND_DATA_STRUCTURES_B } from "./programming-and-data-structures-b.mjs";
import { OPERATING_SYSTEM } from "./operating-system.mjs";
import { ENGINEERING_MATHEMATICS_A } from "./engineering-mathematics-a.mjs";
import { ENGINEERING_MATHEMATICS_B } from "./engineering-mathematics-b.mjs";
import { ENGINEERING_MATHEMATICS_C } from "./engineering-mathematics-c.mjs";
import { ALGORITHMS } from "./algorithms.mjs";
import { COMPILER_DESIGN } from "./compiler-design.mjs";

// digital-logic.mjs was re-authored from scratch (14 topics covering Boolean
// Algebra/Minimization, Combinational/Sequential Circuits, and Number
// Representation/Arithmetic; "karnaugh-map" was already authored separately
// and is deliberately left out of that file, not missing) and is registered
// here again now that it's a real module rather than the earlier broken stub.
//
// operating-system.mjs is complete (all 12 topics: Processes and Threads,
// Concurrency and Synchronization, Deadlock, Scheduling, Memory Management,
// File Systems).
//
// programming-and-data-structures is COMPLETE (15/15) as of -b.mjs's
// authoring: the original file covers C Basics through Structures/Unions/
// Storage Classes (5), -b.mjs covers Recursion through Graph Representations
// (10: recursion, recursion tracing, arrays, stacks, queues, linked lists,
// tree traversals, BSTs, binary heaps, graph representations).
//
// engineering-mathematics is split across three files purely because it's
// the syllabus's biggest subject (33 topics: Discrete Math + Linear Algebra +
// Calculus + Probability & Statistics) - -a.mjs covers Discrete Math I/II
// (11 topics: propositional/first-order logic through graph colouring),
// -b.mjs covers Calculus in full (5) plus one Probability topic
// (random-variables), -c.mjs completes it: Discrete Math III (3), all of
// Linear Algebra (5), and the remaining 8 Probability & Statistics topics.
// COMPLETE (33/33) as of -c.mjs's authoring. -a.mjs and -b.mjs were authored
// but never registered here for a while, so none of it had reached
// Firestore until that was fixed.
export const GATE_LESSONS = {
  "general-aptitude": GENERAL_APTITUDE,
  "digital-logic": DIGITAL_LOGIC,
  "theory-of-computation": THEORY_OF_COMPUTATION,
  "computer-organization-and-architecture": COMPUTER_ORGANIZATION_AND_ARCHITECTURE,
  "programming-and-data-structures": { ...PROGRAMMING_AND_DATA_STRUCTURES, ...PROGRAMMING_AND_DATA_STRUCTURES_B },
  "operating-system": OPERATING_SYSTEM,
  "engineering-mathematics": { ...ENGINEERING_MATHEMATICS_A, ...ENGINEERING_MATHEMATICS_B, ...ENGINEERING_MATHEMATICS_C },
  "algorithms": ALGORITHMS,
  "compiler-design": COMPILER_DESIGN,
};
