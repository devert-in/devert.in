# Backlog

Deliberately not a general project-management doc - just tracked follow-ups
that came out of an audit/implementation pass and were explicitly deferred
rather than done immediately. Remove an item once it's implemented.

## Quiz Engine v2

**Priority:** Future enhancement - not required for current production.

**Context:** `devert-frontend/lib/quizRandom.js` (added 2026-07-23) gives
every quiz module (Daily Learning, CS Core, Programming, Company Vault,
Contests) a shared, deterministic, statistically-verified shuffle for
question/option order. That closed the "correct answer is always Option A"
problem and gave resume-after-refresh for free, verified against 100,000
simulated attempts.

What it does **not** address: Daily Learning, CS Core, Programming, and
Company Vault still ship each question's `correctIndex` straight to the
browser, so a student reading React state/props (not even real
reverse-engineering) can see the correct answer regardless of shuffle.
Contests already gets this right by storing questions and answer keys in two
separate Firestore paths (`contests/{id}/questions` vs
`contests/{id}/answerKeys`), with the latter never readable by a student's
security-rules role.

### Planned improvements

- Server-side grading, or trusted-backend verification where the current
  "client computes, client also writes the result" pattern isn't enough
  (ties into `devert-backend`'s existing narrow role - see the root
  `CLAUDE.md` - since the frontend has no application server in the request
  path today).
- Separate answer-key storage for the four modules above, mirroring
  Contests' `questions`/`answerKeys` split (schema migration + admin
  authoring changes + Firestore rules changes - this is the part that makes
  it a real project, not a quick patch).
- Secure assessment mode: timer, tab-visibility/focus-loss detection,
  disabled copy/paste, one-shot submission.
- Anti-cheat measures beyond the above.
- Attempt analytics and multiple-attempt management (per-attempt history,
  not just a single completion flag - `buildQuizSeedKey`'s `attemptId`
  parameter already exists for this, unused by any caller yet).
- Proctored exam support.
- Certificate-grade assessments.

### Reason

The current implementation carries no *reward-integrity* risk today: reward
amount in all four modules is flat and gated only on submission, not on
`correctCount` (verified by code read, not assumed) - so a student who reads
or forges the correct answer can't extract extra XP/coins/score beyond
honest participation. It is not "secure" in the answer-confidentiality sense
though - the correct answer is genuinely visible client-side for anyone who
looks. Migrate to the Quiz Engine v2 architecture above **before** (not
after) any of the following ship: score-gated rewards, certificates,
proctored exams, or placement/company assessments for these four modules.

## DSA Enterprise Prep Platform (Company tagging shipped; rest deferred)

**Priority:** Future enhancement - not required for current production.

**Context:** `problems/{id}.companies: string[]` (added 2026-07-29, alongside
`docs/BACKLOG.md`'s Study Cards v2 entry below) is the first slice of a much
bigger "transform DSA into an interview-prep platform" request. Shipped now:
admin-authored company tagging (`CodingProblemsPanel`'s new COMPANIES editor,
`admin/page.jsx`), a student-facing Companies filter with live counts
(`CompanyFilterList`, `components/campus/campus-practice.jsx`, same
self-fetching/drop-in shape as `CategoryFilterList`), and "Asked in ..."
chips on the problem card. All 441 existing problems start with zero
companies tagged - this is real, admin-entered metadata, not fabricated or
inferred, so the Companies filter row stays hidden until at least one
problem is actually tagged (see `CompanyFilterList`'s own comment).

**Deliberately not built**, and specifically not by fabricating data to make
it *look* built:

### Planned improvements

- **Interview Patterns as a separate taxonomy** (Sliding Window, Two Pointer,
  Monotonic Stack, Kadane, Union Find, etc.). Needs a real design decision
  first: `CODELAB_CATEGORIES` (`lib/codelab.js`) already blends topic and
  pattern concepts in one flat enum (Sliding Window and Two Pointer are
  already categories, sitting next to Arrays/Trees). Adding a second,
  overlapping "pattern" axis without reconciling this would confuse rather
  than clarify - decide whether patterns split out of `category` or become a
  genuinely separate field before building either.
- **Interview Sheets** (Blind 75, Grind 75, NeetCode 150, Striver A2Z, Love
  Babbar) - this is real content-curation work (matching DeVert's own 441
  problems against genuine public sheet definitions by title/pattern), not a
  schema change. Do not auto-guess which of DeVert's problems "is" a sheet's
  problem - that has to be verified per-problem.
- **Expanding the problem library itself** (1,000 / 2,500 / 5,000+ problems,
  premium-style original content) - a content-authoring initiative, not
  something to fabricate to hit a number.
- **Company-specific difficulty overrides** ("Easy at Infosys, Hard at
  Google" for the same problem) - a real, useful field, just not built in
  this pass; would live alongside `companies` as a parallel map.
- **"Interview Importance" priority labels** (Must Solve/Highly
  Recommended/Frequently Asked/Rare) - needs a real editorial judgment per
  problem, same caution as Interview Sheets above.
- **Problem relationships** (prerequisites/related/next-in-progression) -
  needs real curation; a wrong "prerequisite" is worse than none.
- **Smart Recommendations / Personalized Roadmaps** ("You want Amazon -
  here are 42 problems, 18 done, next up: X") - needs an actual
  recommendation/roadmap-generation model designed on purpose, not
  improvised as a byproduct of adding a `companies` field.
- **Company Vault <-> DSA integration** (a company's page showing "Recommended
  DSA Problems" + synced progress + a readiness score) - `companies/{id}`
  (Company Vault's own full interview-prep hubs, `lib/companyPrep.js`) and
  DSA's new lightweight `companies: string[]` tag are deliberately DIFFERENT
  things today (see the code comment on `COMPANY_TAG_SUGGESTIONS`,
  `lib/codelab.js`) - most companies requested here (Amazon, Google, Meta...)
  have no Company Vault hub at all yet, only ~6 do (Cognizant/TCS/Deloitte/
  Infosys/Accenture/Knowvation Learnings). Linking them for real is a
  cross-module design decision, not a quick join.
- **Analytics** (weak topics/companies, pattern mastery, interview readiness
  score, revision-frequency-by-company) - needs a defined scoring model,
  same reasoning as Quiz Engine v2 / Study Cards v2's analytics deferrals
  above.
- **Acceptance/popularity/"campus trending" stats scoped per company** -
  today's acceptance rate is platform-wide per problem
  (`acceptanceRate()`, `lib/codelab.js`); a per-company breakdown needs a
  real definition of what "popularity for Amazon prep" even means first.

### Reason

The distinguishing risk here isn't security or reward-integrity (this metadata
carries neither) - it's **data honesty**. Every item above either requires
real content curation (sheets, importance labels, relationships) that can't
be responsibly guessed at, or a genuine algorithmic/design decision
(recommendations, roadmaps, readiness scoring, pattern-vs-category split)
that deserves its own pass rather than being bolted on to make this look more
"done" than it is. Company tagging shipped because it needed neither -
just a field, an admin editor, and a filter, all of which are honest about
being empty until someone fills them in.

## DSA Study Cards v2

**Priority:** Future enhancement - not required for current production.

**Context:** `devert-frontend/lib/problemNotes.js` + `problem_notes/{uid}_{problemId}`
(added 2026-07-29) turned each DSA practice card into a personal study
workspace: favorite, bookmark, review-later, needs-revision, a 5-level
confidence rating, a personal difficulty override, a 5-star personal rating,
free-text notes, custom tags, and a revision scheduler (Tomorrow/3 Days/1
Week/2 Weeks/1 Month), all surfaced as on-card status chips plus a per-card
"more actions" popover (`ProblemStudyMenu` in `components/campus/campus-practice.jsx`).
Filtering (Favorites/Bookmarked/Needs Revision/Review Later/Has Notes/Due For
Revision/Solved/Unsolved) and sorting (difficulty, favorites-first, personal
rating, most attempted, recently solved) ship in the same pass, all computed
client-side from data already fetched (`problems`, `solvedIds`,
`codelab_submissions`) plus the one new lazily-created collection - no new
per-card Firestore reads.

Deliberately **not** built, and not planned as a quick follow-up without a
real design pass first:

### Planned improvements

- **AI-driven recommendation badges** ("Recommended Next", "Based on Weak
  Topics", "Frequently Missed") - needs an actual recommendation model or
  heuristic; nothing today computes a "weak topic" signal to badge against.
- **Admin/mentor visibility panel** - a per-student rollup (favorites count,
  needs-revision count, confidence distribution, review queue size) for
  institution admins, extending the existing Manage tab per this repo's own
  "admin console extends existing tabs" rule rather than a new surface. Left
  out here because it's a distinct admin-facing screen, not a card-level
  change.
- **Revision heatmap / Interview Readiness score** on the Profile Analytics
  tab (`components/profile-editor/analytics-tab.jsx`) - needs a defined
  scoring model (what makes someone "interview ready"?) designed
  deliberately, not bolted on as a byproduct of the card work.
- **Deep-linkable problem URLs.** `CampusWorkspace`'s practice screen
  (`campus-app.jsx`) tracks the open problem as local component state
  (`practiceScreen.problemId`), not a URL/query param, so there is no real
  shareable link to a single DSA problem today. A "Copy Link"/"Share
  Problem" action was deliberately left out of `ProblemStudyMenu` rather than
  copying a URL that wouldn't actually reopen that problem - needs the
  practice screen's state synced to the URL first.
- **Mobile long-press / swipe gestures** for quick actions - the study menu
  already opens on a plain tap of its trigger icon (works on both desktop
  and mobile with no gesture code), so this is a nice-to-have interaction
  layer, not a functional gap.
- **Company-tag curation** (auto-tagging a problem "Amazon"/"Google" from a
  real source of truth) - the free-text tag system already lets a student
  tag anything manually; automatic company tagging needs real curated data,
  not a heuristic guess.

### Rejected, not deferred

- **"Mark Solved/Unsolved" and "Reset Progress"** menu items were considered
  and deliberately excluded, not just postponed.
  `user_codelab_progress.solvedProblems` is a monotonic map by design (see
  `firestore.rules`' own comment on that collection) specifically so a
  student can't clear a solve client-side and re-trigger reward/streak
  logic. Exposing a control that promises to do exactly that would either
  silently no-op or require reopening that trust boundary - do not build
  this without a broader reward-integrity decision first.

### Reason

None of this blocks the core "organize your DSA prep like sticky notes"
goal, and none of it carries the reward-integrity risk that gated Quiz
Engine v2 above - `problem_notes` never touches XP/coins/score/solvedProblems.
It's scoped out because each item above is either a distinct feature needing
its own design pass (recommendations, admin panel, readiness scoring, URL
routing) or a real trust-boundary question that shouldn't be answered as a
side effect of a UI pass (solved/reset).

## DSA Library Expansion - Batch 1 shipped, Batch 2 pending

**Priority:** Follow-up needed - not blocking, but two categories are still empty.

**Context:** 2026-07-29, in response to an explicit "go straight for a larger
batch" decision: drafted ~106 new problems across 10 gap categories via
parallel content-drafting agents (each given that category's existing
titles to avoid duplicates), then verified EVERY reference solution's
test-case outputs by actually executing them against the real production
run endpoint (`https://devert-backend-.../api/coding/run`) - never
hand-computed or trusted blindly. 82 problems across 8 categories passed
verification and were migrated to Firestore as `status: "draft"` (never
auto-published - an admin must review and publish each one via the
existing `CodingProblemsPanel`): Hashing (+10), Math (+12), Two Pointer
(+12), Sliding Window (+12), Searching (+10), Bit Manipulation (+10),
Queue (+8), Binary Search (+8). Migration report:
`scripts/new-dsa-problems-migration-applied-2026-07-29.json`.

**Two categories got nothing: Recursion and Sorting.** Their drafting
agents failed mid-task when the org hit its Claude API monthly spend
limit - not a content or quality problem, a billing one. Re-run them
(same category-exclusion-list approach) once the limit is raised (`/usage-
credits`) or resets.

**Real infrastructure limit discovered along the way:** the execution
backend (`CodeExecutionService.java`, OnlineCompiler.io) hard-caps stdin at
100KB. Several drafted stress-test cases correctly targeted the stated
`10^5`-scale constraints but blew past that cap - not a bug, a genuine
platform ceiling. Fix applied per-problem (shrink oversized stress inputs
to ~8,000 elements, or drop to 2 hidden tests instead of 3 for
matrix/multi-line-shaped inputs that couldn't be cleanly truncated
mechanically) rather than silently accepting an untested "up to 10^5"
claim. Worth knowing for ANY future problem authoring, human or AI: a
stress test literally at 10^5 elements will not run here.

**SQL category (0 problems) is a structural dead-end, not a content gap**
- confirmed via `CodeExecutionService.java`: only C/C++/Java/Python/
JavaScript compilers exist. No SQL runtime. Authoring SQL-tagged problems
into the DSA bank would be pointless until a real SQL execution/grading
path exists - a separate feature, not something this pass could route
around.

### Reason

Same posture as elsewhere in this doc: verify via real execution rather
than trust generated content, keep everything in draft until a human
signs off, and be explicit about what's blocked by an external constraint
(spend limit) versus what's a genuine platform limitation (100KB payload)
versus what's simply out of scope (SQL grading).

## DSA Problem Content - Rewrite/Expansion Pass 2

**Priority:** Future enhancement - not required for current production.

**Context:** A read-only audit of the live `problems` collection (2026-07-29,
before any of this work started) found the premise "many statements are
placeholder/incomplete" was only partly true: all 441 problems already had
non-empty constraints/examplesText/hints/simpleExplanation/videoUrl/solutions
- the real gap was structure and depth, not missing content. What shipped
this pass: `inputFormat`/`outputFormat`/`edgeCases` fields on every problem
(drafted by 10 parallel passes, each grounded strictly in that problem's own
real statement/constraints/examplesText, spot-checked by hand before
migrating - see `scripts/migrate-add-problem-structure-fields.mjs` and its
`problem-structure-migration-applied-2026-07-29.json` report), rendered as
their own labeled sections on the student view, plus an "Expected
Complexity" section surfacing the `solutions.optimal` data that already
existed but was previously hidden inside a collapsed solution tab.

**Deliberately not built** in this pass (each needs either real curation
that can't be safely automated, or a judgment call that risks being wrong
at 441-problem scale):

### Planned improvements

- **Rewriting the core `statement` prose itself** for the ~138 problems
  under 200 characters. What shipped adds structure AROUND the existing
  statement (Input/Output Format, Edge Cases); it does not rewrite the
  statement's own narrative voice. A genuine prose rewrite is a separate,
  smaller-batch, more carefully-reviewed pass - the risk of drifting from
  the problem's actual intent goes up the more the core statement itself is
  touched (unlike Input/Output Format, which is close to mechanically
  derivable from the existing example).
- **Expanding the library to 600-800 problems** - deferred per an earlier
  explicit decision this session; this is real content authorship (each new
  problem needs its own correct hidden test cases, verifiable only by a
  human or a test run against Judge0), not something to batch-generate
  unsupervised.
- **Populating empty/thin categories** (Hashing: 3, Sorting: 5, Queue: 14) -
  same reasoning as library expansion above; a pilot batch with manual
  verification was the agreed approach, not yet started.
- **Difficulty recalibration** - re-judging all 441 Easy/Medium/Hard labels
  risks being arbitrary without a real signal (e.g. actual acceptance rate
  trends over time, which the platform is only just starting to accumulate
  now that real students are solving these).
- **Learning progression** (Foundation -> Core -> Intermediate -> Advanced ->
  Interview Ready) and **Related Problems** (prerequisite/similar/harder
  follow-up) - both need genuine per-problem curatorial judgment across the
  whole library; a wrong "this is a prerequisite for that" claim is worse
  than no claim, so this isn't something to assign heuristically just to
  populate a field.
- **Quality/duplicate audit** ("no duplicated problems") - the read-only
  audit this pass ran checked structural completeness, not semantic
  duplication (two differently-titled problems testing the same exact
  thing) - a real duplicate sweep needs its own pass, likely pairwise
  similarity comparison across all 441 statements.

### Reason

Same "data honesty" principle as the Enterprise Prep Platform entry above -
the difference between "safely derivable from data that's already verified
correct" (what shipped: Input/Output Format restates the real example;
Edge Cases cites the real stated bounds) and "requires either real
curation or a judgment call that could be wrong at scale" (everything
deferred here). Rewriting core problem statements, authoring new problems,
and recalibrating difficulty all fall in the second bucket.

## Exposed GitHub PAT in git remote

**Update 2026-07-29: local remote fixed, token itself still needs revoking.**
`git remote set-url origin https://github.com/devert-in/devert.in.git` was
run to strip the embedded token from `.git/config` locally. The token
(`ghp_...`) is still valid on GitHub's side and was exposed for some period
inside a OneDrive-synced folder - **revoke/regenerate it in GitHub Settings
-> Developer settings -> Personal access tokens.** No git/GitHub account
access exists here to do that part.

## Refresh/URL-state audit - 1 of ~23 fixed, rest still open

**Update 2026-07-29:** the admin panel's top-level tab (Overview/Content/
Community/Challenges/Moderation/Economy/Ops) now survives a refresh -
`app/admin/page.jsx`'s `AdminPageInner` reads `?tab=` on load and keeps the
URL in sync via `window.history.replaceState` (same pattern as
`campus-app.jsx`'s own tab-sync effect), wrapped in `<Suspense>` per
`useSearchParams()`'s static-export requirement. Picked as the single
highest-value fix (busiest internal screen) rather than attempting all ~23
from an earlier audit pass in one sitting - the original findings list
(Arena sub-tabs, DSA filters, Manage -> Students search, and the admin-panel
full-collection-scan performance issues) isn't preserved anywhere retrievable
after a context compaction; re-fixing the rest needs a fresh, dedicated
audit pass to re-locate the specific issues, not a continuation of this one.

## Unrelated build-blocking discovery, resolved

**2026-07-29:** while verifying the above, `npm run build` failed on
`campus-app.jsx` importing a `CampusStaffLogin` component
(`components/campus/campus-staff-login.jsx`) that didn't exist on disk yet,
despite a fully-built backend (`AdminAccountService`, `AdminAccountController`,
email-based password reset, login-lockout tracking), Firestore rules
(`isPrincipal()`/`isHodOfDepartment()`/`isFacultyOfClassroom()`/
`hasPermission()`), and client libraries (`lib/staffAccounts.js`,
`lib/permissions.js`, `lib/campusPermissions.js`, `CampusWorkspace`'s own
`CAMPUS_PHASE.STAFF` detection) already fully wired for it - clearly
substantial prior work, just missing this one file. The file appeared
mid-investigation via a concurrent process (not written by this pass) with a
complete, correct implementation (email+password sign-in, role verification,
already-signed-in redirect, self-service password reset) - verified
consistent with everything it depends on and left as-is rather than
overwritten.

**Still not built:** per-permission UI gating INSIDE `campus-manage.jsx`
itself. `CampusPermissionsContext`/`useHasPermission`/`useCampusRole` are
provided by `CampusWorkspace` and ready to consume, but `campus-manage.jsx`
doesn't yet call either hook anywhere - an HOD or Faculty who successfully
logs in today reaches the exact same unscoped Manage view an Institution
Admin does. Wiring the 17 permission keys in `lib/permissions.js` to their
corresponding tabs/actions across every Manage screen is a real, separate,
sizable pass.
