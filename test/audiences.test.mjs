// Unit tests for the audience expansion logic (devert-frontend/lib/audiences.js).
// No emulator needed - this is pure function testing. The rules-level companion
// is test/audience-rules.test.mjs.
//
// Loaded via a base64 data: URL because devert-frontend/package.json declares no
// "type": "module", so node would resolve that .js file as CommonJS and choke on
// its `export` keywords. Same technique as test/lesson-blocks.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const source = readFileSync(new URL("../devert-frontend/lib/audiences.js", import.meta.url), "utf8");
const {
  AUDIENCE_LEGACY, AUDIENCE_PUBLIC, AUDIENCE_CAMPUS_ANY, AUDIENCE_INTERNAL,
  DEFAULT_READER_AUDIENCES, MAX_QUERY_AUDIENCES,
  campusAudience, orgAudience, expandCampusChain, expandReaderAudiences,
  readerAudiences, audienceAllows, validateReaderAudiences, validateContentAudiences,
  describeAudience, publishState,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

// ---------------- building ----------------

test("campusAudience builds the most specific path available", () => {
  assert.equal(campusAudience({ institutionId: "mrcet" }), "campus:mrcet");
  assert.equal(campusAudience({ institutionId: "mrcet", departmentId: "cse" }), "campus:mrcet/cse");
  assert.equal(campusAudience({ institutionId: "mrcet", departmentId: "cse", year: "3" }), "campus:mrcet/cse/3");
  assert.equal(campusAudience({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" }), "campus:mrcet/cse/3/a");
});

test("campusAudience stops at the first missing segment rather than emitting empties", () => {
  // No department but a year given - the year must NOT be silently promoted.
  assert.equal(campusAudience({ institutionId: "mrcet", year: "3" }), "campus:mrcet");
  assert.equal(campusAudience({ institutionId: "mrcet", departmentId: "cse", section: "A" }), "campus:mrcet/cse");
});

test("campusAudience returns null with no institution, and normalises case/punctuation", () => {
  assert.equal(campusAudience({}), null);
  assert.equal(campusAudience({ institutionId: "" }), null);
  assert.equal(campusAudience({ institutionId: "  MRCET  ", departmentId: "C.S.E" }), "campus:mrcet/cse");
});

test("orgAudience mirrors the same normalisation", () => {
  assert.equal(orgAudience("Acme Corp"), "org:acmecorp");
  assert.equal(orgAudience(""), null);
});

// ---------------- expansion ----------------

test("expandCampusChain returns the full ancestor chain, general to specific", () => {
  assert.deepEqual(
    expandCampusChain({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" }),
    ["campus:*", "campus:mrcet", "campus:mrcet/cse", "campus:mrcet/cse/3", "campus:mrcet/cse/3/a"]
  );
});

test("the chain is what makes campus:* and campus:mrcet work as grants", () => {
  // This is doc open question 2, resolved. A section-A student matches content
  // granted at ANY level of their chain, with no write-time fan-out.
  const student = expandCampusChain({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" });
  assert.ok(audienceAllows(["campus:*"], student), "content for all campuses reaches them");
  assert.ok(audienceAllows(["campus:mrcet"], student), "content for their institution reaches them");
  assert.ok(audienceAllows(["campus:mrcet/cse/3/a"], student), "content for their exact section reaches them");
});

test("campus:* separates Campus users from public learners - it is not vacuous", () => {
  const publicLearner = expandReaderAudiences({});
  assert.ok(!publicLearner.includes(AUDIENCE_CAMPUS_ANY),
    "a learner with no institution must NOT carry campus:*");
  assert.ok(!audienceAllows(["campus:*"], publicLearner),
    "campus-only content must be invisible to a public learner");
});

test("a neighbouring section does not match", () => {
  const sectionA = expandCampusChain({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" });
  assert.ok(!audienceAllows(["campus:mrcet/cse/3/b"], sectionA), "section B content must not reach section A");
  assert.ok(!audienceAllows(["campus:mrcet/ece"], sectionA), "another department must not reach CSE");
  assert.ok(!audienceAllows(["campus:abc"], sectionA), "another institution must not reach MRCET");
});

test("a year-level grant reaches every section in that year", () => {
  const a = expandCampusChain({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" });
  const b = expandCampusChain({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "B" });
  assert.ok(audienceAllows(["campus:mrcet/cse/3"], a));
  assert.ok(audienceAllows(["campus:mrcet/cse/3"], b));
});

test("expandReaderAudiences always includes legacy, so existing content stays visible", () => {
  for (const reader of [
    expandReaderAudiences({}),
    expandReaderAudiences({ institutionId: "mrcet" }),
    expandReaderAudiences({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A", isStaff: true }),
  ]) {
    assert.ok(reader.includes(AUDIENCE_LEGACY), "every reader must carry `legacy`");
    assert.ok(audienceAllows([AUDIENCE_LEGACY], reader), "backfilled content must be visible");
  }
});

test("staff and internal audiences are opt-in, never default", () => {
  const student = expandReaderAudiences({ institutionId: "mrcet", departmentId: "cse" });
  assert.ok(!student.includes("staff:mrcet"));
  assert.ok(!student.includes(AUDIENCE_INTERNAL));
  assert.ok(!audienceAllows([AUDIENCE_INTERNAL], student), "internal content must never reach a student");

  const faculty = expandReaderAudiences({ institutionId: "mrcet", departmentId: "cse", isStaff: true });
  assert.ok(faculty.includes("staff:mrcet"));
  assert.ok(!faculty.includes(AUDIENCE_INTERNAL), "staff is not internal");
});

test("expansion is deduplicated", () => {
  const r = expandReaderAudiences({ institutionId: "mrcet", orgIds: ["acme", "acme"] });
  assert.equal(new Set(r).size, r.length);
});

// ---------------- reading ----------------

test("a reader with no aud claim falls back to public+legacy - the state of every account today", () => {
  assert.deepEqual(readerAudiences(undefined), DEFAULT_READER_AUDIENCES);
  assert.deepEqual(readerAudiences({}), DEFAULT_READER_AUDIENCES);
  assert.deepEqual(readerAudiences({ auds: [] }), DEFAULT_READER_AUDIENCES);
  // The consequence that matters: existing users keep seeing existing content
  // BEFORE any claim is minted, which is what decouples Phase 1 from open
  // question 1 (who mints claims).
  assert.ok(audienceAllows([AUDIENCE_LEGACY], readerAudiences(null)));
});

test("an unclaimed reader sees legacy and public, and nothing restricted", () => {
  const r = readerAudiences(null);
  assert.ok(audienceAllows([AUDIENCE_PUBLIC], r));
  assert.ok(audienceAllows([AUDIENCE_LEGACY], r));
  assert.ok(!audienceAllows(["campus:mrcet"], r), "restricted content must stay invisible without a claim");
  assert.ok(!audienceAllows(["core:learn"], r), "core-only content needs a claim");
});

test("readerAudiences truncates to the array-contains-any limit", () => {
  const many = Array.from({ length: 50 }, (_, i) => `org:o${i}`);
  assert.equal(readerAudiences({ auds: many }).length, MAX_QUERY_AUDIENCES);
});

test("audiences: [] is unreachable by every reader - the invisible-until-published guarantee", () => {
  for (const reader of [
    readerAudiences(null),
    expandReaderAudiences({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" }),
    expandReaderAudiences({ isInternal: true, isStaff: true, institutionId: "mrcet" }),
  ]) {
    assert.equal(audienceAllows([], reader), false);
  }
});

test("missing or malformed content audiences deny rather than default open", () => {
  const reader = expandReaderAudiences({ institutionId: "mrcet" });
  assert.equal(audienceAllows(undefined, reader), false);
  assert.equal(audienceAllows(null, reader), false);
  assert.equal(audienceAllows("legacy", reader), false, "a bare string is not an array - deny");
});

// ---------------- validation ----------------

test("validateReaderAudiences rejects an empty set and an over-long one", () => {
  assert.equal(validateReaderAudiences([]).ok, false);
  const many = Array.from({ length: 40 }, (_, i) => `org:o${i}`);
  const r = validateReaderAudiences(many);
  assert.equal(r.ok, false);
  assert.match(r.errors.join(" "), /array-contains-any limit/);
});

test("validateReaderAudiences enforces the claim byte budget", () => {
  const realistic = expandReaderAudiences({ institutionId: "mrcet", departmentId: "cse", year: "3", section: "A" });
  const v = validateReaderAudiences(realistic);
  assert.equal(v.ok, true, `a normal student must fit the budget, got ${v.bytes}B`);
  assert.ok(v.bytes < 300, `expected a compact claim, got ${v.bytes}B`);

  const bloated = Array.from({ length: 25 }, (_, i) => `campus:someverylonginstitutionname${i}/department/year/section`);
  assert.equal(validateReaderAudiences(bloated).ok, false, "an oversized claim must be rejected before Firebase rejects it");
});

test("validateContentAudiences accepts [] as the deliberate unpublished state", () => {
  assert.equal(validateContentAudiences([]).ok, true);
});

test("validateContentAudiences catches malformed strings", () => {
  assert.equal(validateContentAudiences(["campus:mrcet/cse/3/a", "public", "legacy", "campus:*"]).ok, true);
  assert.equal(validateContentAudiences(["Campus:MRCET"]).ok, false, "uppercase is malformed");
  assert.equal(validateContentAudiences(["campus:"]).ok, false);
  assert.equal(validateContentAudiences(["nonsense"]).ok, false);
  assert.equal(validateContentAudiences([""]).ok, false);
  assert.equal(validateContentAudiences("legacy").ok, false, "must be an array");
});

// ---------------- admin UI helpers ----------------

test("publishState distinguishes legacy from published and unpublished", () => {
  assert.equal(publishState([]), "unpublished");
  assert.equal(publishState(["legacy"]), "legacy");
  assert.equal(publishState(["legacy", "campus:mrcet"]), "published");
  assert.equal(publishState(["public"]), "published");
  assert.equal(publishState(undefined), "unpublished");
});

test("describeAudience produces something a human can act on", () => {
  assert.equal(describeAudience("campus:mrcet/cse/3/a"), "MRCET - CSE year 3, section A");
  assert.equal(describeAudience("campus:mrcet/cse"), "MRCET - CSE");
  assert.equal(describeAudience("campus:*"), "Every Campus institution");
  assert.equal(describeAudience("legacy"), "Existing content (grandfathered)");
  assert.equal(describeAudience("staff:mrcet"), "Staff at mrcet");
});
