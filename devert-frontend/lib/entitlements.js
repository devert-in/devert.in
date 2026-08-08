// What is free and what is Pro, in one place.
//
// The strategy this encodes, so nobody "tidies" it in the wrong direction:
//
// LEARNING CONTENT IS FREE AND STAYS FREE. DSA sheets, roadmaps, CS Core and
// aptitude are commodities - Striver's A2Z, NeetCode, GFG and LeetCode's free
// tier all give the same material away, with more brand behind them. Charging
// for it would lose on price, lose the SEO that brings students in at all, and
// gain nothing defensible: a PDF of a problem list cannot be protected.
//
// WHAT IS SOLD IS PROOF AND CAPACITY - things that cannot be copied:
//   - a proctored score somebody else will believe (see components/proctor/**)
//   - execution capacity, which costs real money per run (the paid
//     compiler API behind lib/codelab.js)
//   - company-specific prep at the moment of highest intent
//   - a student's own analytics about themselves
//
// Consequence worth stating: NOTHING here gates firestore.rules'
// contentReadable(). Those 13 content reads stay unauthenticated on purpose, so
// public lesson pages keep working and no institution student can ever be locked
// out by a stale users/{uid}.institutionId mirror. This module gates FEATURES,
// not documents. Anything that must be enforced rather than merely presented
// (execution quota, proctored entry) is enforced server-side as well - a client
// constant is a UI hint, never a boundary.

import { isSubscriptionActive } from "@/lib/payments";

export const TIER = Object.freeze({ FREE: "free", PRO: "pro", CAMPUS: "campus" });

// Free CodeLab runs per day. The only quota here with a real cost behind it, so
// it is the only one a paying user is buying more of rather than unlocking.
// Generous on purpose: a student who hits this on their first evening leaves and
// does not come back, and the top of the funnel is worth more than the API cents.
export const FREE_DAILY_CODE_RUNS = 15;

export const FEATURES = Object.freeze({
  // --- free, forever, no sign-in needed to read ---
  DSA_PROBLEMS: TIER.FREE,
  DSA_SHEETS: TIER.FREE,
  DSA_CONCEPTS: TIER.FREE,
  PROGRAMMING_ROADMAPS: TIER.FREE,
  CS_CORE: TIER.FREE,
  APTITUDE: TIER.FREE,
  FUNDAMENTALS: TIER.FREE,
  PULSE: TIER.FREE,
  INTEL_JOBS: TIER.FREE,
  PUBLIC_PROFILE: TIER.FREE,
  ARENA: TIER.FREE,
  DAILY_GRIND: TIER.FREE,
  PRACTICE_CONTESTS: TIER.FREE,
  CODELAB_METERED: TIER.FREE,

  // --- Pro ---
  PROCTORED_ASSESSMENTS: TIER.PRO,
  VERIFIED_CREDENTIAL: TIER.PRO,
  CODELAB_UNLIMITED: TIER.PRO,
  COMPANY_PREP: TIER.PRO,
  GATE_TEST_SERIES: TIER.PRO,
  PERSONAL_ANALYTICS: TIER.PRO,
  INTERVIEW_SHEET: TIER.PRO,
  AMBASSADOR_ELIGIBLE: TIER.PRO,
});

/**
 * A user's effective tier.
 *
 * Institution students are CAMPUS and get everything without paying - their
 * college already paid, and charging a student twice for the same catalogue is
 * how you lose a campus contract. institutionId is trustworthy here: it sits on
 * the self-write denylist in firestore.rules, so an individual cannot award
 * themselves campus access by editing their own profile.
 */
export function resolveTier({ userData, subscription, isAdmin = false } = {}) {
  if (isAdmin) return TIER.CAMPUS;
  if ((userData?.institutionId || "").trim()) return TIER.CAMPUS;
  if (isSubscriptionActive(subscription)) return TIER.PRO;
  return TIER.FREE;
}

const RANK = { [TIER.FREE]: 0, [TIER.PRO]: 1, [TIER.CAMPUS]: 2 };

export function canUse(feature, tier) {
  const required = FEATURES[feature];
  if (!required) return true; // unknown feature is not a paywall
  return RANK[tier] >= RANK[required];
}

export function isPro(tier) {
  return tier === TIER.PRO || tier === TIER.CAMPUS;
}

// Marketing copy lives next to the gate it describes, so a feature cannot be
// paywalled without someone also writing the sentence that justifies it.
export const PRO_PITCH = Object.freeze([
  {
    key: "PROCTORED_ASSESSMENTS",
    title: "Proctored assessments",
    body: "Camera-invigilated tests with a score a recruiter or TPO will actually believe. Nobody's free problem sheet can do this.",
  },
  {
    key: "CODELAB_UNLIMITED",
    title: "Unlimited code runs",
    body: `Free accounts get ${FREE_DAILY_CODE_RUNS} runs a day. Pro removes the ceiling entirely.`,
  },
  {
    key: "COMPANY_PREP",
    title: "Company prep vaults",
    body: "TCS, Accenture, Deloitte, Infosys, Cognizant - the actual patterns each one asks, not a generic list.",
  },
  {
    key: "GATE_TEST_SERIES",
    title: "GATE test series",
    body: "Full-length papers with previous-year coverage and per-topic breakdowns.",
  },
  {
    key: "PERSONAL_ANALYTICS",
    title: "Your own analytics",
    body: "Where you actually lose marks, time per question, and how you sit against the cohort.",
  },
  {
    key: "AMBASSADOR_ELIGIBLE",
    title: "Campus Ambassador eligibility",
    body: "Bring DeVert to your college, earn from every signup, and run contests on your own campus.",
  },
]);

// What free explicitly keeps. Shown alongside the pitch on purpose: a paywall
// that hides what is still free reads as a bait-and-switch, and this list is the
// single most persuasive thing on the page.
export const FREE_FOREVER = Object.freeze([
  "Every DSA problem, sheet and concept track",
  "Every language roadmap and CS Core subject",
  "Aptitude practice and Fundamentals",
  `CodeLab with ${FREE_DAILY_CODE_RUNS} runs a day`,
  "Arena battles, Daily Grind and practice contests",
  "Pulse, Intel jobs and your public Dev Card",
]);
