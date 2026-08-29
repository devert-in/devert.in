# Placements Prep — Ops Guide

`/prep` is a self-contained placements-preparation module bolted onto the existing
Devert static-export Next.js site. It has no server component of its own: every
read/write goes straight to Firestore (`devert-me` project) from the browser, and
code execution happens client-side (Pyodide/Web Workers) or against a third-party
judge API (Piston). This doc is for whoever operates/maintains it, not for a student.

## What it is

A weekend-test / weekday-LMS / practice-bank / contest / analytics suite for exam
prep, plus admin and faculty consoles, layered on top of the existing Devert
"terminal hacker" site. Routes (all under `app/prep/`):

- `/prep` — hub (public; MRCET redirect lands here via `?src=mrcet`)
- `/prep/learn` — weekday lessons + inline quizzes (auth required)
- `/prep/practice` — question-bank drilling, MCQ + coding
- `/prep/code` — free-form code playground
- `/prep/contests` , `/prep/contests/run` — timed coding contests (onboarding required)
- `/prep/exams`, `/prep/exams/take`, `/prep/exams/review` — weekend tests (onboarding required)
- `/prep/analytics` — student's own dashboard
- `/prep/onboarding` — mandatory roll-number/branch/class-group capture
- `/prep/admin` — content + role management (admin only)
- `/prep/faculty` — cohort dashboards (faculty/tpo/admin only)

## Data model (Firestore, project `devert-me`)

| Collection | Shape (short) |
|---|---|
| `users/{uid}` | existing user doc, extended with `role`, `rollNumber?`, `branch?`, `classGroup?`, `prepOnboarded?` |
| `prepQuestions/{qid}` | MCQ or coding question bank entry |
| `prepCourses/{id}` | course → lessons (markdown + linked question ids) |
| `prepDailyTasks/{yyyy-mm-dd}` | today's LMS/quiz/coding checklist items |
| `prepExams/{examId}` | exam/contest metadata (`kind`: `weekend-test` \| `coding-contest`) |
| `prepExamPapers/{examId}` | the question paper — **no answers, no hidden tests** |
| `prepExamKeys/{examId}` | answers + explanations + hidden test cases — readable only after `endsAt` (or by staff) |
| `prepSubmissions/{examId}_{uid}` | one doc per student per exam; raw `responses` only, never a trusted score |
| `prepAttempts/{uid}/records/{id}` | one doc per practice/lesson/daily attempt |
| `prepProgress/{uid}` | streak, totals, per-category stats |
| `prepClassGroups/{id}`, `prepAnnouncements/{id}` | admin-managed reference data |
| `system/prepConfig` | `{ pistonUrl, enabledLanguages, submissionGraceSecs }` |

Full field-level shapes are documented inline in `lib/prep/db.js` and in the design
doc used to build this module; treat `lib/prep/db.js` as the canonical read/write
API — don't hand-roll Firestore calls elsewhere in the app.

## Roles & bootstrapping the first admin

Roles: `student` (default) → `faculty` / `tpo` → `admin`. `isStaff` = faculty/tpo/admin
(or the bootstrap email below). Only `admin` (or the bootstrap email) can write
`prepQuestions`, manage roles, or delete submissions.

**To create the first admin**, either:
1. Sign in once with `admin@devert.in` — this email is hardcoded as an admin
   bootstrap identity in both `firestore.rules` and `context/AuthContext.js`, no
   Firestore edit needed, **or**
2. Open the Firebase console → Firestore → `users/{uid}` for the account you want
   to promote → set the field `role` to `"admin"`. (The `/prep/admin` → Roles tab
   can promote any *other* user by email lookup once you have one admin.)

Roll number is mandatory before any exam/contest attempt (`/prep/onboarding`,
enforced both client-side and in `firestore.rules`) and is immutable once set —
staff can correct a wrong one via `/prep/admin` (`staffUpdateUser`).

## Question upload formats (`/prep/admin` → Questions tab)

Sample files live in `public/prep-samples/` and are downloadable in-app:
- `questions-sample.json` — MCQ, JSON array (preferred format, supports coding too)
- `questions-sample.csv` — MCQ only, header row:
  `type,category,topic,difficulty,prompt,optionA,optionB,optionC,optionD,correctOption(A-D),explanation,tags(pipe|separated)`
- `coding-questions-sample.json` — coding questions (JSON-only; starterCode + testCases)

Every row/object is validated client-side (enum fields, 4 non-empty options,
`correctIndex` in range, non-empty prompt/explanation, starter code + ≥1 test case
for coding) before any Firestore write. Only valid rows import; invalid ones are
listed with their specific errors. Writes are batched at ≤450 per `writeBatch`
(`lib/prep/db.js#importQuestions`).

## How exams stay tamper-resistant with no server

There is no backend grading service — this relies entirely on Firestore security
rules and a strict read/write time-gating scheme:

1. During the exam window, students can read the **paper** (questions, no
   answers) but the **key** (`prepExamKeys/{examId}`) is unreadable until
   `request.time > endsAt` — so there is no way to see correct answers while the
   exam is still live, even by inspecting network traffic.
2. `prepSubmissions/{examId}_{uid}` is one doc per student, creatable/updatable
   only inside `[startsAt, endsAt + grace]` (`submissionGraceSecs`, default 120s,
   hardcoded in rules to match `system/prepConfig`'s default). After
   `status: 'submitted'` or the window closes, the rules make the doc immutable.
3. **Scores are never trusted from the client.** `lib/prep/grading.js`'s
   `scoreSubmission(responses, key, paper)` is the only scoring implementation in
   the codebase, and both `/prep/exams/review` and `/prep/faculty` recompute the
   score from the raw `responses` + key at *read* time — a forged/edited score
   field would simply be ignored.
4. The countdown timer cross-checks the client clock against Firestore server
   time (round-trip midpoint sampled at `startSubmission`) to correct for clock
   skew, and auto-submits at zero.

Net effect: a student cannot know the answers during the window (key is
rules-gated) and cannot write a response after the window (rules time-gate), so
there's no client-side manipulation surface worth attacking.

## Judge architecture

`lib/prep/judge/index.js` exposes `runOnce()` / `runTests()`, dispatching per
language:

- **python** — Pyodide, loaded lazily into a Web Worker (Blob URL, so it works
  under static export) only on pages that actually run code. Zero server load.
- **javascript** — sandboxed Web Worker (Blob URL), `console.log` shadowed to
  capture stdout, `readLine()` fed from the stdin string.
- **java / c / cpp** — proxied to a Piston-compatible HTTP API
  (`POST {pistonUrl}/execute`), queued client-side (concurrency 2, backoff on
  429/5xx).

`pistonUrl` defaults to the public `https://emkc.org/api/v2/piston` but is read
from `system/prepConfig` at runtime, so it's remotely reconfigurable without a
redeploy:

```js
import { savePrepConfig } from "@/lib/prep/db";
await savePrepConfig({ pistonUrl: "https://piston.your-college-lan.internal/api/v2" });
```

(or edit `system/prepConfig` directly in the Firebase console). Point this at a
self-hosted Piston instance ([github.com/engineer-man/piston](https://github.com/engineer-man/piston))
if the public instance's rate limits become a problem during a live contest.

## Scale notes (design target: ~2000 concurrent students)

- Static export on Firebase Hosting's CDN → page delivery scales for free.
- One Firestore doc per student per submission — no shared hot documents.
- No `onSnapshot` listeners on large collections; one-shot `getDocs` + manual
  refresh everywhere except a student's own submission doc.
- Faculty/admin queries are paginated (`limit` + `LOAD_MORE`, default 200–1500
  depending on the read) rather than unbounded.
- Python/JavaScript execution is 100% client-side — the primary scale risk is
  only the Piston-backed languages (java/c/cpp), which get a visible queue and
  graceful degradation instead of hammering a shared endpoint.

## REQUIRED MANUAL DEPLOY STEP (read this before you file a bug)

**The module will not work at all until Firestore rules + indexes are deployed.**
`deploy-prod.yml` now runs this automatically on every push to `prod`, but for a
first-time/manual rollout, or if you're deploying out-of-band, run from the repo
root (where `firebase.json` lives):

```bash
firebase deploy --only firestore --project devert-me
```

This pushes both `firestore.rules` and `firestore.indexes.json`. Composite
indexes can take a few minutes to build after this command returns — queries
that need them will fail with a "requires an index" error (with a console link)
until they finish building. Until this step has run at least once, every prep
collection read/write will be rejected by the default-deny rules.

After rules are live, an admin should open `/prep/admin` and click
**"Install starter pack"** to seed ~80 real questions, 2 courses, 7 days of
daily tasks, 3 announcements, 7 class groups, and one sample weekend test +
coding contest — so the module isn't empty on day one. It's safe to re-run;
seed ids are deterministic and it overwrites rather than duplicates.
