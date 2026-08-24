// Registry of CS Core SUBJECT-level introductions, keyed by subject id exactly
// as it appears in Firestore (csCoreSubjects/{id}). Same shape and rollout
// property as ./cscore-lessons/index.mjs: a subject absent from this map is
// left alone, so this can be applied subject by subject.
//
// WHY THIS EXISTS
//
// Every subject used to open directly onto an accordion of chapter names. That
// is fine if you already know what DBMS is, and useless if the reason you are
// there is that you do not. Thirteen of the twenty-six subjects did not even
// have an introductory topic - Computer Networks opened on "OSI Model", OOP on
// "Classes", Git & GitHub on "Repositories" - so a student's first contact with
// the subject was a term they had not been given a reason to care about yet.
//
// These fields render as the Overview tab on the subject screen (see
// components/campus/campus-cscore.jsx's SubjectOverview). Every one of them is
// individually optional there, so a partially authored subject renders fewer
// cards rather than empty headings.
//
// FIELD CONTRACT
//
//   overview            string, lesson-block format (lib/lessonBlocks.js) - the
//                       "what is this and why should I care" page. Story first,
//                       term second, same as the lesson bodies.
//   whyLearn            string[]  - reasons to spend the weeks. Interview
//                                   relevance is one of them, never all of them.
//   whereUsed           string[]  - named, real systems. Not "many industries".
//   skillsGained        string[]  - what the student can DO afterwards.
//   prerequisites       string[]  - [] is meaningful and common; it means none.
//   interviewImportance 1-5       - rendered as Lucide stars. Calibrated against
//                                   placementRelevance, which was already
//                                   authored per subject - see the mapping in
//                                   the seed script's own comment.
//   topCompanies        string[]  - companies that actually ask this subject,
//                                   weighted toward ones that recruit in India.
//   interviewQuestions  string[]  - questions as an interviewer would phrase
//                                   them, not as a textbook would.
//
// AUTHORING RULES - the same ones ./cscore-lessons/operating-systems.mjs sets
// out, plus two specific to this file:
//
//  - Reuse the subject's OWN running analogy where its lessons already have one
//    (the restaurant for OS, the postal system for Networks, the chain of
//    photographs for Git). The overview should lead into the lessons, not
//    compete with them by introducing a second unrelated metaphor.
//  - Do NOT restate the first lesson. The overview orients; the lesson teaches.
//    Where they touch the same story, the overview stops where the lesson
//    starts going deep.

import { CORE_INTROS } from "./core.mjs";
import { ELECTIVE_INTROS } from "./electives.mjs";

export const SUBJECT_INTROS = { ...CORE_INTROS, ...ELECTIVE_INTROS };
