// Seeds gate_announcements with real GATE 2027 exam-info content - the exam
// pattern, marking scheme, and a portal/eligibility/documents overview - so
// the GATE module's existing "Announcements" feed (gate-resources.jsx, fed by
// lib/gateLibrary.js's fetchAnnouncements) has real content instead of its
// empty state. All content below is sourced directly from the official
// gate2027.iitm.ac.in exam-pattern table and homepage feature cards supplied
// by the user - nothing here is invented. Where the source material only gave
// a card title + one-line blurb (Eligibility/Documents/Cities/Portal) rather
// than the full detail, the announcement says so explicitly and points at the
// official site, instead of inventing specifics.
//
// Usage:
//   node scripts/seed-gate-announcements.mjs --dry-run
//   node scripts/seed-gate-announcements.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// docId is deterministic (paperId + slug) so re-running this script updates
// the same docs (merge) instead of creating duplicates on every run.
const ANNOUNCEMENTS = [
  {
    slug: "exam-pattern",
    paperId: "cs",
    pinned: true,
    order: 1,
    title: "GATE 2027 Exam Pattern - What to Expect (CS)",
    body: `GATE 2027 is a 3-hour Computer Based Test (CBT), in English. Every paper has two parts: General Aptitude (GA) - common to every GATE paper - and your chosen subject.

For CS (Computer Science and Information Technology) specifically:
General Aptitude: 15 marks
Engineering Mathematics: 13 marks (paper-specific - this is Section 1 of the CS syllabus, not a separate common section)
Subject questions (Sections 2-10): 72 marks
Total: 100 marks, 180 minutes

Three question types appear: Multiple Choice Questions (MCQ - exactly one correct option), Multiple Select Questions (MSQ - one or more correct options), and Numerical Answer Type (NAT - you type in a number, no options given at all).

Each question is worth 1 or 2 marks. Negative marking applies ONLY to MCQs: a wrong 1-mark MCQ costs 1/3 mark, a wrong 2-mark MCQ costs 2/3 mark. MSQ and NAT have NO negative marking - and MSQ gives no partial credit either, so an MSQ answer has to be exactly complete to score anything.

This is why MCQ accuracy matters more than volume, and why MSQ/NAT questions are worth attempting even under uncertainty - you cannot lose marks on them.`,
  },
  {
    slug: "exam-pattern",
    paperId: "da",
    pinned: true,
    order: 1,
    title: "GATE 2027 Exam Pattern - What to Expect (DA)",
    body: `GATE 2027 is a 3-hour Computer Based Test (CBT), in English. Every paper has two parts: General Aptitude (GA) - common to every GATE paper - and your chosen subject.

For DA (Data Science and Artificial Intelligence) specifically:
General Aptitude: 15 marks
Subject questions: 85 marks (DA does not carry a separate Engineering Mathematics section the way CS does - the equivalent material is folded directly into the 85 subject marks)
Total: 100 marks, 180 minutes

Three question types appear: Multiple Choice Questions (MCQ - exactly one correct option), Multiple Select Questions (MSQ - one or more correct options), and Numerical Answer Type (NAT - you type in a number, no options given at all).

Each question is worth 1 or 2 marks. Negative marking applies ONLY to MCQs: a wrong 1-mark MCQ costs 1/3 mark, a wrong 2-mark MCQ costs 2/3 mark. MSQ and NAT have NO negative marking - and MSQ gives no partial credit either, so an MSQ answer has to be exactly complete to score anything.

This is why MCQ accuracy matters more than volume, and why MSQ/NAT questions are worth attempting even under uncertainty - you cannot lose marks on them.`,
  },
  {
    slug: "exam-pattern",
    paperId: "cs-da",
    pinned: true,
    order: 1,
    title: "GATE 2027 Exam Pattern - What to Expect (CS + DA)",
    body: `GATE 2027 is a 3-hour Computer Based Test (CBT), in English. Every paper has two parts: General Aptitude (GA) - common to every GATE paper - and your chosen subject. Since this track covers both CS and DA subjects, here is how each paper's marks actually split:

CS (Computer Science and Information Technology): GA 15 + Engineering Mathematics 13 (paper-specific) + Subject (Sections 2-10) 72 = 100 marks.
DA (Data Science and Artificial Intelligence): GA 15 + Subject 85 (no separate Engineering Mathematics section - it's folded into the 85) = 100 marks.
Both are 180 minutes.

Three question types appear on both papers: Multiple Choice Questions (MCQ - exactly one correct option), Multiple Select Questions (MSQ - one or more correct options), and Numerical Answer Type (NAT - you type in a number, no options given at all).

Each question is worth 1 or 2 marks. Negative marking applies ONLY to MCQs: a wrong 1-mark MCQ costs 1/3 mark, a wrong 2-mark MCQ costs 2/3 mark. MSQ and NAT have NO negative marking - and MSQ gives no partial credit either, so an MSQ answer has to be exactly complete to score anything.

This is why MCQ accuracy matters more than volume, and why MSQ/NAT questions are worth attempting even under uncertainty - you cannot lose marks on them.`,
  },
  ...["cs", "da", "cs-da"].map(paperId => ({
    slug: "important-dates",
    paperId,
    pinned: true,
    order: 1,
    title: "GATE 2027 Important Dates",
    body: `Straight from the official Important Dates page (gate2027.iitm.ac.in) - all of it is officially "liable to change," so treat this as the current word, not a promise:

GOAPS (application portal) opens: 14 Aug 2026 (originally announced) / 27 Aug 2026 (as currently listed)
Regular registration closes: 21 Sep 2026 / 27 Sep 2026
Extended registration closes (late fee applies): 30 Sep 2026 / 5 Oct 2026
Application rectification window: 14 Oct 2026 to 21 Oct 2026
City allotment notification: 4 Jan 2027
Admit card download: not yet announced (TBA)
Examination: spread across three weekends - 6-7 Feb 2027, 13-14 Feb 2027, 20-21 Feb 2027. You sit on ONE specific day within this window, not all three - your admit card will say which.
Results: 19 Mar 2027

The "Days to Exam" countdown on your Overview tab is set to 6 Feb 2027 (the earliest possible exam day) - your own admit card may assign you a later date within the window above.`,
  })),
  {
    slug: "roadmap-coverage",
    paperId: "cs",
    pinned: false,
    order: 3,
    title: "How the Daily Roadmap Covers the Syllabus (and a Note on \"Weightage\")",
    body: `The Daily GATE Roadmap (Prepare tab) runs 15 Aug - 31 Dec 2026 and gives every single one of the 168 topics in the CS syllabus its own dedicated day - nothing is skipped, and nothing is invented beyond what's in the official syllabus.

How days are allocated: each subject gets a number of days roughly proportional to how many topics it actually has - Computer Networks (16 topics) gets more days than Compiler Design (10 topics), for example. That's topic-COUNT proportionate, not marks-weighted.

Why not marks-weighted? GATE does not publish an official, per-topic breakdown of exam marks. Any "Computer Networks is 8% of the paper" style claim you see online is somebody's own analysis of past papers, not an official figure - and it can shift from year to year. Rather than presenting a guessed number as fact, this roadmap is honest about what it's actually doing: guaranteeing full coverage, in a sensible order, with real practice time - not promising a marks percentage nobody has verified.

The structure: September-November is new content (Engineering Mathematics through Computer Networks) plus a PYQ/practice day after every subject and a weekly consolidation day. Once the syllabus is fully covered, the plan shifts to a full-syllabus practice rotation through all 10 subjects. December has NO new topics at all - it's subject-wise revision, real past-year paper practice (2007-2026), and four full-length timed mocks, in that order.

If you want an actual, historically-informed sense of which subjects tend to carry more questions, that's a judgment call worth making from real past papers yourself (or from a source that clearly labels itself as analysis, not an official figure) - not something this roadmap will assert on your behalf.`,
  },
  ...["cs", "da", "cs-da"].map(paperId => ({
    slug: "exam-basics",
    paperId,
    pinned: false,
    order: 2,
    title: "Registration, Eligibility and Exam Cities - Where to Look",
    body: `A few practical things worth knowing early, from the official GATE 2027 site (gate2027.iitm.ac.in):

Eligibility Criteria - the official site asks you to confirm you meet every requirement before filing your application. Check the exact criteria there before assuming you qualify.

Required Documents - a full list of documents needed to complete the online application form is published on the official site. Gather these ahead of the registration window rather than at the last moment.

Examination Cities - GATE 2027 has no international centres; you choose from domestic city options during registration.

Application Portal - applications go through the official GOAPS (GATE Online Application Processing System) portal, linked from gate2027.iitm.ac.in.

This module doesn't try to restate every detail of these (they change year to year and are the official source of truth) - treat this as a pointer to check the official site directly for registration dates, fees, and the exact eligibility/document requirements before you apply.`,
  })),
];

async function run() {
  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");
  for (const a of ANNOUNCEMENTS) {
    const docId = `${a.paperId}_${a.slug}`;
    const wordCount = a.body.trim().split(/\s+/).length;
    console.log(`  gate_announcements/${docId}  (${wordCount}w)  paper=${a.paperId}  pinned=${a.pinned}`);
    if (!DRY_RUN) {
      await db.collection("gate_announcements").doc(docId).set({
        paperId: a.paperId,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        order: a.order,
        status: "published",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  console.log(`\n${ANNOUNCEMENTS.length} announcement(s) ${DRY_RUN ? "would be written" : "written"}.`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
