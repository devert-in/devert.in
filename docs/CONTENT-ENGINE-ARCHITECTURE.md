# DeVert Content Engine & Distribution Architecture

**Status:** Proposal, awaiting review. No code written against this yet.
**Author:** drafted 2026-07-30, from an audit of the live Firestore database
and the existing rules/consumer code.

This document proposes how educational content is stored, referenced and made
visible across DeVert Core, DeVert Campus, and any future product. It exists
to be argued with before anything is built.

Read [Section 3](#3-the-constraint-that-decides-the-design) first if you read
nothing else. It is the constraint everything else follows from, and it rules
out the most obvious version of this design.

---

## 1. Current state, as audited

The intended split is "Core owns content, Campus consumes it". A live audit of
Firestore on 2026-07-30 shows this is **already true at the data layer** for
almost everything.

### Content that is already global and centralized

Top-level collections, no institution in the path, already `status`-gated:

| Collection | Docs | Notes |
| --- | --- | --- |
| `problems` | 545 | DSA / CodeLab problems |
| `aptitude_topics` | 30 | |
| `csCoreSubjects` | 26 | 246 topics beneath, 117,651 words |
| `programmingLanguages` | 12 | |
| `companies` | 6 | Company Vault, plus rounds/categories subcollections |
| `gatePapers` | 3 | 565 topic docs beneath |
| `courses`, `intel_resources`, `hackathons`, `missions`, `opportunities` | small | |

### Content that is genuinely institution-owned

| Path | Docs |
| --- | --- |
| `institutions/{slug}/dailyLearning` | 13 (MRCET) |

Everything else under `institutions/{slug}` is operational, not content:
`students` (274), `rollNumberRegistry` (274), `classrooms` (15),
`departments` (10), `admins` (5), `dailyLearningLog` (372), `roleAssignments`,
`settings`, `adminActivityLog`.

### The one existing visibility mechanism

`institutions/mrcet/contentVisibility/config` contains exactly:

```json
{ "hiddenCompanyIds": [] }
```

A per-institution denylist for Company Vault, and nothing else. It is a narrow
precedent rather than a system, but it establishes the shape this proposal
generalises: **per-institution overrides stored under the institution, applied
over global content.**

### What this means

The migration implied by "move content out of Campus" is **13 documents**, not
thousands. The content engine largely exists. What does not exist is:

1. **A second consumer.** Exactly one surface renders any of this content:
   `/campus/[slug]`. There is no `devert.in/learn`.
2. **A distribution layer.** Content is either globally published or draft.
   There is no way to say "this lesson is for MRCET CSE third year only".
3. **A reference model.** Daily Learning embeds content. GATE physically
   duplicates it (see [Section 8](#8-gate-the-duplication-problem-already-in-production)).

So the real work is *build the second consumer and the distribution layer*,
not *extract the content*. That is a materially smaller and differently-shaped
job than the original framing assumed, and it is good news.

---

## 2. Product split

No change proposed to the intent here, only to where the boundary actually
falls.

### DeVert Core owns

- The content engine: every lesson, problem, topic, question bank
- The practice engine
- Identity, profile, DevCard, portfolio
- Feed, community, jobs, internships, hackathons, events
- The public learning surface (`devert.in/learn`) — **to be built**

### DeVert Campus owns

- Institution, department, classroom, student and staff management
- Principal / HOD / Faculty dashboards and permissions
- **Scheduling** of content (Daily Learning plans, weekly/semester plans)
- Assignments, deadlines, approvals
- XP, coins, leaderboards, rewards
- Assessments and contests
- Placement analytics, institution reports, certificates
- Attendance (future)

Campus authors **schedules and outcomes**. It does not author lessons.

### The rule

> Campus consumes content by reference. It never stores a copy.

---

## 3. The constraint that decides the design

The original spec describes this request path:

```
Request → Learning API → Check Content Access Rules → Render
```

**That API tier does not exist, and CLAUDE.md says it deliberately should not.**
DeVert is a Next.js static export on Firebase Hosting; the browser talks to
Firestore directly through the client SDK, mostly via live `onSnapshot`
listeners. The Spring service on Render exists only for SMTP and Judge0 — it is
on the free plan, in Singapore, and is explicitly designed to fail soft because
nothing critical depends on it.

That leaves two enforcement strategies.

### Option A — build a real API tier (rejected)

Route every content read through a server that evaluates access rules.

- Every lesson open becomes a network round trip to a free-tier Render box,
  with cold starts measured in seconds
- It becomes a hard dependency between students and their content, where today
  there is none
- It throws away the live-listener model the whole app is built on
- It costs money that scales with reads

Rejected. The cure is worse than the disease.

### Option B — enforce in `firestore.rules` (proposed)

`firestore.rules` is already the sole authority boundary for this project;
nothing server-side double-checks it. Access control belongs there.

But Firestore rules have hard limits that shape the design:

- **No joins.** A rule cannot walk a hierarchy.
- **`get()` is capped at 10 document reads per request** and each one is
  billed and adds latency.
- **List queries must be statically provable.** A rule that inspects a field
  the query does not filter on will deny the entire query. This codebase has
  been bitten by this repeatedly — see `lib/programming.js`'s
  `fetchAllUserProgress` comment, where an unprovable query silently rendered
  every card as 0/X for months.

### The consequence

The eight-level hierarchy in the original spec —

```
Platform → DeVert → Campus → Institution → Department → Program → Year → Section → Group
```

— **cannot be evaluated as a hierarchy at read time.** There is no mechanism to
walk it inside a rule.

It must be **flattened at write time** into a small, indexable set of strings
stored on the content document itself. The hierarchy does not disappear — it
moves into the authoring UI, which expands a tree selection into flat audience
strings on save.

This is not a compromise invented here. It is the same denormalization the
codebase already depends on: every content list carries
`where("status", "==", "published")` because rules cannot compute publication
state any other way.

---

## 4. The audience model

### Format

An audience is a colon-and-slash delimited string, most general to most
specific:

```
public                          anyone, signed in or not
core:learn                      devert.in/learn
core:practice                   devert.in/practice
campus:*                        every Campus institution
campus:mrcet                    one institution
campus:mrcet/cse                one department
campus:mrcet/cse/3              one year within a department
campus:mrcet/cse/3/A            one section
org:acme                        a future company training portal
internal                        staff and authors only
```

Every content document carries a flat array:

```js
{
  audiences: ["core:learn", "campus:mrcet/cse/3/A"],
}
```

### Enforcement

```js
// firestore.rules
function readerAud() {
  // No existing user has an `aud` claim, so the fallback is not hypothetical -
  // it is the state of every account until claims are minted.
  return request.auth != null && "aud" in request.auth.token
    ? request.auth.token.aud
    : ["public"];
}

function audienceAllows() {
  return resource.data.audiences.hasAny(readerAud());
}
```

`hasAny` is O(size of the smaller set), performs no reads, and adds no
latency.

### Querying

```js
where("audiences", "array-contains-any", myAudiences)
```

**This filter is mandatory on every consumer query, not an optimisation.** Per
[Section 6a](#6a-evidence-why-absence-of-field-does-not-work), exclusion is
delivered by the query; the rule is defence in depth. A consumer that omits the
filter is a bug, and one that a rule may not catch.

`array-contains-any` accepts up to 30 values, which bounds how many audiences
a single reader can present in one query. This is the real ceiling on the
model and it is discussed in [Section 5](#5-claims-budget-and-refresh-semantics).

### Why not a separate ACL collection

A `contentAccess/{lessonId}` document per lesson, joined at read time, would
express the hierarchy directly. It is rejected because the join is exactly what
rules cannot do: reading it requires a `get()` per lesson, which blows the
10-read cap on any list of more than ten lessons and cannot back a list query
at all.

---

## 5. Claims budget and refresh semantics

A reader's audience set comes from their Firebase custom claims, following the
existing `admin: true` precedent.

```js
// custom claims on a student at MRCET
{ aud: ["public", "core:learn", "campus:mrcet", "campus:mrcet/cse", "campus:mrcet/cse/3", "campus:mrcet/cse/3/A"] }
```

Two hard limits, both of which must be designed around rather than discovered
later:

### 1000-byte claims cap

Firebase caps the entire custom claims payload at 1000 bytes. The example above
is roughly 150 bytes, so a student in one institution is comfortable. The cap
becomes real for:

- a user belonging to many institutions (an external mentor, a multi-campus
  admin)
- deep or verbose audience strings

**Mitigation:** audience strings stay short; a user's claim stores only the
*most specific* path per institution, and rules/queries expand it. If a user
genuinely needs more than ~30 audiences, they get a role-based audience
(`staff:mrcet`) rather than an enumeration.

### Claims only refresh on token refresh

This is the same footgun already documented for the admin claim in CLAUDE.md:
granting a claim does not take effect until the user signs out and back in, or
their ID token refreshes (roughly hourly).

**Consequence:** moving a student from section A to section B does not change
what they can see until their token refreshes. This must be stated in the admin
UI at the point of the change, not buried. Anything needing instant effect
cannot use claims and must use a different mechanism.

### What this rules out

Per-student audience grants ("publish this lesson to these 4 students") do not
fit the claims model and should not be offered in the UI. The smallest
practical unit is a section.

---

## 6. Backward compatibility: how MRCET stays untouched

> **REVISED 2026-07-30 after emulator testing.** The first version of this
> section proposed *absence of the field* as the legacy marker, and claimed no
> backfill was needed. **That was wrong**, and the emulator proved it. The
> corrected design is below; the evidence is in
> [Section 6a](#6a-evidence-why-absence-of-field-does-not-work).

The hard requirement is unchanged: everything currently visible under
`/campus/mrcet` keeps working exactly as it does today, with no regression.

### The corrected mechanism: an always-present field

Every content document carries `audiences`. There is no absent state.

| `audiences` value | Meaning |
| --- | --- |
| `["legacy"]` | **Existing content.** Every reader carries `legacy`, so visibility is unchanged from today. |
| `[]` | **New default.** Stored centrally, returned by no query, visible nowhere. |
| `["campus:mrcet", ...]` | Visible only where granted. |

Every reader's claim includes `legacy`, so `["legacy"]` content behaves exactly
as it does now. Revoking the audience later is a deliberate, per-collection
decision, not a side effect of this phase.

In rules — the check is now unconditional, which is also simpler:

```js
function audienceAllows() {
  return resource.data.audiences.hasAny(readerAud());
}
```

### Why the backfill is mandatory, and why it is safe

A backfill of ~1,400 documents is now **required before the rules change can
ship**, because a document without the field is invisible to the audience-filtered
queries every consumer must use (Section 6a, Q1).

It is nonetheless a low-risk operation, and materially different from a content
migration:

- It is **purely additive** — one new field, no existing field touched
- The value is **uniform** (`["legacy"]`), not derived per document, so there is
  no judgement to get wrong
- It is **behaviour-preserving by construction**: every reader carries `legacy`
- It runs through the established pattern — dry run, timestamped backup,
  `previousVersions`, refuses on anomaly — as in
  `scripts/rewrite-cscore-lessons.mjs`

**Ordering matters and is not negotiable:** backfill first, verify, and only then
deploy the rules. Deploying the rules against un-backfilled documents would make
every lesson in the product disappear at once.

### The new workflow, from the next document created

```
Create → stored centrally with audiences: [] → returned by no query
       → Manage Access grants audiences → visible where granted
```

### The cost of this choice, stated plainly

The Manage Access UI must distinguish three states — *legacy*, *unpublished*,
*published* — and should mark legacy content visibly, so it is obvious that
~1,400 documents are grandfathered rather than deliberately published.

---

## 6a. Evidence: why "absence of field" does not work

Four probes run against the Firestore emulator on 2026-07-30, with a rule using
the original `!("audiences" in resource.data) || ...hasAny(...)` formulation.
Reader claim: `aud: ["public", "campus:mrcet"]`.

Fixture: `legacy` (no field), `granted` (`["campus:mrcet"]`), `unpublished`
(`[]`), `othercollege` (`["campus:abc"]`).

### Q1 — `array-contains-any` excludes documents missing the field

```
where("audiences","array-contains-any",["campus:mrcet","public"])
  -> ["granted"]          legacy NOT returned
```

This is the finding that kills the original design. Consumers must filter on
`audiences` to avoid returning restricted content, but that filter cannot see
legacy documents. There is no Firestore query for "field is absent", so the two
requirements are irreconcilable. **Hence the mandatory backfill.**

### Q2/Q3 — the rule logic itself is correct

Single-document reads behave exactly as designed:

```
get(probe/unpublished)  -> DENIED   (audiences: [])
get(probe/othercollege) -> DENIED   (granted to another institution)
get(probe/legacy)       -> ALLOWED  (no field, escape hatch)
```

So the rule expresses the intent correctly.

### Q4 — but `list()` returned documents that `get()` denies

```
getDocs(probe)                            -> ["granted","legacy","othercollege","unpublished"]
getDocs(probe, where status == published) -> ["granted","legacy","othercollege","unpublished"]
```

**`othercollege` and `unpublished` were returned by a list query even though a
direct `get()` on each is denied.**

This contradicts the documented "rules are not filters — a query that could
return an unreadable document fails entirely" model. It may be an
emulator/production divergence, or the documented model may be narrower than
remembered. **It has not been resolved, and this proposal deliberately does not
depend on the answer.**

### The design consequence

Exclusion must come from the **query**, with the rule as defence in depth —
never from the rule alone. This is precisely how `status == "published"` already
works throughout the codebase: every consumer filters, and the rule
independently enforces.

Concretely:

- `audiences` present on every document, always (Section 6)
- every consumer query carries `array-contains-any` on it
- the rule enforces the same predicate, so a hand-crafted `get()` is still denied
- `audiences: []` is unreachable by construction — no audience string can match
  an empty array, so no query can return it, regardless of how `list()` treats
  rules

That last property is what makes "invisible until published" structurally true
rather than dependent on unresolved semantics.

### Q4 RESOLVED — the probe was invalid, and the news is better and worse

**The Q4 probe was wrong.** It placed audiences under the claim key `aud`, which
is a **reserved JWT claim** holding the Firebase project id — a string. So
`token.get('aud', [])` returned that string, `.size()` returned its character
length, and `hasAny()` received a string instead of a list. The rule was
*erroring*, not evaluating, which is why `list()` appeared to return documents
`get()` denied.

The claim is now `auds`, and `test/audience-rules.test.mjs` pins the collision as
a regression test. Firebase's Admin SDK also refuses to set reserved claims, so
this would have failed at claim-minting time too.

**Good news:** rules *are* enforced on list queries. Nothing is leaking.

**Bad news, and it is a rollout blocker:** Firestore's list authorisation is
**analytical, not per-document**. The query's constraints must *prove* that every
matching document satisfies the rule. A rule that inspects `audiences` therefore
requires the query to constrain `audiences` — **regardless of what the data
actually contains.**

Demonstrated: a collection where every document carries `["legacy"]`, read by a
reader carrying `legacy`, queried with `where("status","==","published")` and no
audience filter, is **denied** — even though the rule would evaluate true for
every document in range. Adding the audience filter makes the identical query
succeed.

### The consequence for deployment

The rules **cannot ship independently of the consumers.** Every list query over a
gated collection must gain its `array-contains-any` filter in the *same* deploy
as the rules, or that collection's listing breaks for everyone.

This supersedes the phasing in Section 10: Phase 1 is not "schema + rules", it is
**schema + rules + every consumer + fixtures, shipped atomically.** Affected
consumers: `lib/csCore.js`, `lib/programming.js`, `lib/gate.js`, the aptitude and
company-vault readers, `courses`, `intel_resources`, and `seModules`.

On the plus side, the failure mode is loud rather than silent — a forgotten filter
produces `permission-denied` immediately, not quietly missing content.

---

## 7. Reference model for Campus scheduling

Daily Learning is the only module that genuinely owns content, and it is the
model for how Campus should consume everything.

### Today

A day document embeds the lesson body:

```js
// institutions/mrcet/dailyLearning/2026-07-30
{ weekId, date, dow, status, type: "lesson", title, concept, mcqs, ... }
```

### Proposed

A day document references a centrally-stored lesson:

```js
// institutions/mrcet/dailyLearning/2026-07-30
{
  weekId, date, dow, status,
  contentRef: { collection: "csCoreSubjects", subject: "operating-systems", topic: "deadlock" },
  // Campus-owned, institution-specific, stays here:
  dueAt, xpReward, coinReward, facultyNote, assignmentOverride,
}
```

Campus owns the *schedule*, the *deadline*, the *reward* and the *analytics*.
Core owns the *lesson*. Updating a lesson improves it for every institution and
every product at once.

### Migration path

The 13 existing MRCET day documents keep their embedded content. The renderer
resolves `contentRef` when present and falls back to embedded fields when
absent — the same absence-means-legacy pattern as audiences. New days use
references. Nothing is rewritten.

---

## 8. GATE: the duplication problem already in production

Worth recording because it is the clearest existing evidence for this whole
proposal.

`gatePapers` holds three papers — `cs`, `da`, `cs-da` — and `cs-da` is by
construction the union of the other two. Because content lives on the topic
document, the same lesson must be **physically copied into every paper that
contains it**:

- 27 GATE lessons authored on 2026-07-30 produced **71 documents**
- `general-aptitude` exists three times (cs, da, cs-da), identical
- `theory-of-computation` exists twice

`scripts/write-gate-lessons.mjs` manages the fan-out and documents why, but it
is mitigation, not a fix. Every future edit must be re-fanned, and any edit
applied to one paper and not the others silently diverges.

**Under the reference model:** the lesson lives once, and a paper's topic
document holds a `contentRef` plus paper-specific metadata (weightage, order,
module). 71 documents become 27 lessons plus 71 thin pointers, and drift becomes
structurally impossible.

This is the best first candidate for the reference model, because the duplication
is real, recent, and entirely mine.

---

## 9. Content metadata

The original spec's metadata list is largely right. Reconciled against what
already exists on a topic document today:

**Already present** (`csCoreSubjects`, `gatePapers` topics): title, module,
difficulty, estimatedMinutes, order, status, xpReward, coinReward,
prerequisites, whatYoullLearn, `previousVersions` (via
`lib/contentVersioning.js`), updatedAt.

**To add:**

| Field | Purpose |
| --- | --- |
| `audiences` | distribution, per Section 4 |
| `contentId` | stable identity independent of collection path |
| `video` | `{ status, provider, id }` — optional; the Video tab hides when absent |
| `authorUid`, `reviewerUid` | provenance |
| `releaseAt`, `retireAt` | scheduled publication |
| `tags` | cross-cutting discovery |

**Deliberately not added:** `nextLesson` / `previousLesson`. Ordering is already
derived from `order` within a subject, and storing explicit links creates two
sources of truth that will disagree the first time a topic is inserted.

---

## 10. Phasing

Each phase is independently shippable and leaves the system working.

### Phase 0 — backfill (new; prerequisite for Phase 1)

Added after the Section 6a finding. **Must land and be verified before the
Phase 1 rules deploy**, or every lesson in the product disappears at once.

- `scripts/backfill-content-audiences.mjs`, following the established pattern:
  `--dry-run` default, timestamped backup, `previousVersions`, refuses on anomaly
- Sets `audiences: ["legacy"]` on every existing content document across
  `csCoreSubjects`, `programmingLanguages`, `gatePapers`, `aptitude_topics`,
  `companies`, `courses`, and `institutions/*/dailyLearning`
- Purely additive; touches no other field
- Idempotent: a document that already has `audiences` is skipped, never
  overwritten
- Acceptance: audit reports 100% coverage, and a diff of one sampled document
  per collection shows exactly one field added

### Phase 1 — audience schema, rules, tests

- Audience string format and the canonical expansion function (one place,
  shared by the claim minter, the consumers and the admin UI)
- `firestore.rules` enforcement — now unconditional, no escape hatch, since
  Phase 0 guarantees the field exists
- `firestore.indexes.json` entries for the `array-contains-any` queries
- Consumers updated to carry the mandatory audience filter
- Emulator tests proving: `["legacy"]` content still visible to a reader
  carrying `legacy`; `audiences: []` returned by no query and denied on `get()`;
  a granted audience visible; a neighbouring section denied; a reader with no
  `aud` claim falls back to `public` and is not locked out of legacy content;
  and every affected list query still succeeds

**Nothing changes visually.** Acceptance: the full existing suite plus the new
audience tests pass, and a manual pass over `/campus/mrcet` shows no difference.

**Rollback:** the rules are the only irreversible-feeling part, and they are not
— redeploying the previous `firestore.rules` restores prior behaviour in
seconds, and Phase 0's field is inert without them.

### Phase 2 — Manage Access UI

- Per-item Manage Access panel inside the existing admin console. Per CLAUDE.md
  this extends the current tab family; it does not become a new top-level admin
  surface.
- Hierarchy tree selector that writes flat audience strings
- Three-state display: unmanaged / unpublished / published
- Audit log entry per change, reusing `admin_activity_log`

### Phase 3 — `devert.in/learn`

- Public consumer over the already-global collections
- Reuses the `LessonBody` engine (`components/campus/lesson-blocks.jsx`), which
  is already product-agnostic
- Narrow reading width per the design system; this is a reading surface

### Phase 4 — Daily Learning by reference

- `contentRef` resolution with embedded fallback
- Scheduling UI picks a central lesson instead of authoring prose
- The 13 MRCET documents are not touched

### Phase 5 — GATE de-duplication

- Topic documents become pointers
- `write-gate-lessons.mjs` fan-out is retired

---

## 11. Open questions

These need a decision and are not resolved by this document.

1. **Who mints audience claims?** Custom claims can only be set with the Admin
   SDK. Today that is `scripts/set-admin-claim.mjs`, run by hand. Section-level
   audiences change whenever a student is approved or moved, which is a routine
   Campus operation — so this needs either a Cloud Function (blocked on Firebase
   billing reactivation, per CLAUDE.md) or an endpoint on the Spring service
   (which then becomes load-bearing for access control, contradicting its
   fail-soft design). **This is the largest unresolved dependency in the
   proposal.**

2. ~~**Does `campus:*` mean "every institution" at read time?**~~
   **RESOLVED 2026-07-30 — the original worry was mistaken.** A reader's claim
   carries its full ancestor chain, `campus:*` included. Content granted
   `campus:*` is then visible to every Campus user, which is exactly the intent.
   The concern that it "stops distinguishing anything" was wrong: a public
   learner with no institution does **not** carry `campus:*`, so `campus:*`
   correctly separates Campus users from public ones, while `campus:mrcet`
   separates institutions. No write-time fanning is needed, and a new
   institution requires no re-publishing.

3. **Do rewards stay Campus-owned?** Section 7 puts `xpReward` on the schedule
   rather than the lesson. Coins convert to real INR payouts, so this touches
   the trust boundary CLAUDE.md flags — a lesson reachable from two products
   must not be completable twice for reward. The existing `grantRewards()`
   idempotency key (`activityType` + `activityId`) probably handles this, but it
   needs deliberate verification, not assumption.

4. **Should `problems` (545 DSA) be in scope?** They are already global and
   already work. Adding audiences to them buys per-institution problem sets, and
   costs a rules change on the most-read collection in the app.

5. **Public means public.** Anything granted `public` is world-readable with no
   authentication. That is a one-way door for content — it can be indexed and
   scraped the moment it ships. Worth an explicit editorial policy before Phase
   3.

6. **Do list queries enforce document rules in production?** New, from
   Section 6a Q4. The emulator returned documents that a direct `get()` denies.
   Until this is answered against production, no audience may be used to
   *restrict* access to content that a reader could otherwise see — only to
   *widen* it. Restriction currently has one proven mechanism in this codebase:
   separate collection paths, as used for contest answer keys.

---

## 12. What this proposal does not do

- It does not build an API tier. See Section 3.
- It does not migrate or rewrite existing content. Phase 0 adds one field and
  changes nothing else. See Section 6.
- It does not offer per-student publishing. See Section 5.
- It does not rely on rules alone to hide anything. Exclusion comes from the
  query; the rule is defence in depth. See Section 6a.
- It does not touch `/campus/mrcet`'s content. The `["legacy"]` audience, held by
  every reader, is what guarantees that structurally rather than by careful
  implementation.

---

## 13. Revision history

| Date | Change |
| --- | --- |
| 2026-07-30 | Initial proposal. |
| 2026-07-30 | **Section 6 rewritten.** Emulator testing disproved the "absence of field means legacy" mechanism: `array-contains-any` cannot return documents missing the field, so a mandatory additive backfill (new Phase 0) replaces the no-migration claim. Added Section 6a with the evidence, including the unresolved Q4 finding that `list()` returned documents `get()` denies. Resolved open question 2 (`campus:*` — the original objection was mistaken). Made the audience filter mandatory on consumers rather than optional. |
