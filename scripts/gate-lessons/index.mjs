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

export const GATE_LESSONS = {
  "general-aptitude": GENERAL_APTITUDE,
  "digital-logic": DIGITAL_LOGIC,
  "theory-of-computation": THEORY_OF_COMPUTATION,
  "computer-organization-and-architecture": COMPUTER_ORGANIZATION_AND_ARCHITECTURE,
  "programming-and-data-structures": PROGRAMMING_AND_DATA_STRUCTURES,
};
