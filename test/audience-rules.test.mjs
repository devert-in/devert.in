// Rules-level tests for the content distribution layer (Phase 1 of
// docs/CONTENT-ENGINE-ARCHITECTURE.md).
//
// The single most important test in this file is the FIRST one: a reader with no
// `aud` claim - which is every real account today - must still see all existing
// content. If that regresses, shipping these rules empties the product.
//
// The second most important: `audiences: []` must be unreachable. That is the
// "stored centrally, invisible until published" guarantee, and unlike the rest it
// does NOT depend on how list() treats rules, because no string can match an
// empty array.
//
// Run with: npm test   (or `node --test test/` against a running emulator)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-audience-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8089,
    },
  });
});

test.after(async () => { await testEnv.cleanup(); });

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // Backfilled existing content - what all 1,305 production documents look
    // like after Phase 0.
    await setDoc(doc(db, "csCoreSubjects/os"), { name: "OS", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "csCoreSubjects/os/topics/deadlocks"), { title: "Deadlocks", status: "published", audiences: ["legacy"] });
    // New content, authored but published nowhere.
    await setDoc(doc(db, "csCoreSubjects/os/topics/newtopic"), { title: "New", status: "published", audiences: [] });
    // Newly authored with NO audiences field at all - the admin-console path.
    await setDoc(doc(db, "csCoreSubjects/os/topics/nofield"), { title: "No field", status: "published" });
    // Granted to one institution, and to one section.
    await setDoc(doc(db, "csCoreSubjects/os/topics/mrcetonly"), { title: "MRCET", status: "published", audiences: ["campus:mrcet"] });
    await setDoc(doc(db, "csCoreSubjects/os/topics/sectiona"), { title: "Sec A", status: "published", audiences: ["campus:mrcet/cse/3/a"] });
    await setDoc(doc(db, "csCoreSubjects/os/topics/publicly"), { title: "Public", status: "published", audiences: ["public"] });
    await setDoc(doc(db, "csCoreSubjects/os/topics/internalonly"), { title: "Internal", status: "published", audiences: ["internal"] });
    // A draft - must stay invisible regardless of audience.
    await setDoc(doc(db, "csCoreSubjects/os/topics/draftbutpublic"), { title: "Draft", status: "draft", audiences: ["public", "legacy"] });
    // Other gated collections, one document each.
    await setDoc(doc(db, "programmingLanguages/java"), { name: "Java", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "gatePapers/cs"), { name: "GATE CS", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "seModules/http"), { name: "HTTP", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "aptitude_topics/t1"), { name: "Percentages", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "companies/tcs"), { name: "TCS", status: "published", audiences: ["legacy"] });
    await setDoc(doc(db, "courses/dsa"), { name: "DSA", audiences: ["legacy"] });
    await setDoc(doc(db, "intel_resources/r1"), { name: "Resource", audiences: ["legacy"] });
  });
});

const noClaim = () => testEnv.authenticatedContext("existinguser", {}).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();
const mrcetSectionA = () => testEnv.authenticatedContext("student1", {
  auds: ["public", "legacy", "core:learn", "core:practice", "campus:*", "campus:mrcet", "campus:mrcet/cse", "campus:mrcet/cse/3", "campus:mrcet/cse/3/a"],
}).firestore();
const mrcetSectionB = () => testEnv.authenticatedContext("student2", {
  auds: ["public", "legacy", "core:learn", "campus:*", "campus:mrcet", "campus:mrcet/cse", "campus:mrcet/cse/3", "campus:mrcet/cse/3/b"],
}).firestore();
const otherCollege = () => testEnv.authenticatedContext("student3", {
  auds: ["public", "legacy", "core:learn", "campus:*", "campus:abc"],
}).firestore();
const admin = () => testEnv.authenticatedContext("admin1", { admin: true }).firestore();

// ---------------- reserved-claim regression ----------------

test("the claim is `auds` - `aud` is a reserved JWT claim and must never be used", async () => {
  // `aud` holds the Firebase project id (a STRING). Reading it as a list made
  // token.get('aud', []) return that string, .size() return its character
  // length, and hasAny() receive a string - which threw and denied every
  // AUTHENTICATED content read while unauthenticated reads kept working. This
  // test pins the fix: a user whose claims put audiences under the wrong key
  // gets the fallback, not an error, and definitely not extra access.
  const wrongKey = testEnv.authenticatedContext("confused", {
    aud: ["campus:mrcet", "internal"],   // reserved key - must be ignored
  }).firestore();

  // Falls back to public+legacy, so legacy content still reads...
  await assertSucceeds(getDoc(doc(wrongKey, "csCoreSubjects/os/topics/deadlocks")));
  // ...but the misplaced audiences grant nothing.
  await assertFails(getDoc(doc(wrongKey, "csCoreSubjects/os/topics/mrcetonly")));
  await assertFails(getDoc(doc(wrongKey, "csCoreSubjects/os/topics/internalonly")));
});

// ---------------- the regression that matters most ----------------

test("a user with NO aud claim still reads all legacy content (every account today)", async () => {
  const db = noClaim();
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os")));
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/deadlocks")));
  await assertSucceeds(getDoc(doc(db, "programmingLanguages/java")));
  await assertSucceeds(getDoc(doc(db, "gatePapers/cs")));
  await assertSucceeds(getDoc(doc(db, "seModules/http")));
  await assertSucceeds(getDoc(doc(db, "aptitude_topics/t1")));
  await assertSucceeds(getDoc(doc(db, "companies/tcs")));
  await assertSucceeds(getDoc(doc(db, "courses/dsa")));
  await assertSucceeds(getDoc(doc(db, "intel_resources/r1")));
});

test("an UNAUTHENTICATED reader still reads legacy content - public reads were never gated on auth", async () => {
  const db = anon();
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/deadlocks")));
  await assertSucceeds(getDoc(doc(db, "programmingLanguages/java")));
  await assertSucceeds(getDoc(doc(db, "courses/dsa")));
});

test("a legacy-content list query still works for an unclaimed reader", async () => {
  const db = noClaim();
  const snap = await assertSucceeds(getDocs(query(
    collection(db, "csCoreSubjects/os/topics"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", ["public", "legacy"])
  )));
  const ids = snap.docs.map(d => d.id).sort();
  assert.deepEqual(ids, ["deadlocks", "publicly"], `unexpected: ${ids}`);
});

// ---------------- invisible until published ----------------

test("audiences: [] is unreachable by every reader, including admins-as-students", async () => {
  for (const [label, db] of [["unclaimed", noClaim()], ["section A", mrcetSectionA()], ["anon", anon()], ["other college", otherCollege()]]) {
    await assertFails(getDoc(doc(db, "csCoreSubjects/os/topics/newtopic")));
    assert.ok(true, label);
  }
});

test("a document with no audiences field is invisible - the default for newly authored content", async () => {
  await assertFails(getDoc(doc(noClaim(), "csCoreSubjects/os/topics/nofield")));
  await assertFails(getDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/nofield")));
});

test("unpublished content is excluded from list queries by the filter itself", async () => {
  // The guarantee that does NOT depend on how list() treats rules:
  // array-contains-any cannot match an empty array or a missing field.
  const db = mrcetSectionA();
  const snap = await assertSucceeds(getDocs(query(
    collection(db, "csCoreSubjects/os/topics"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", ["public", "legacy", "campus:mrcet", "campus:mrcet/cse/3/a"])
  )));
  const ids = snap.docs.map(d => d.id).sort();
  assert.ok(!ids.includes("newtopic"), "audiences: [] must never be returned");
  assert.ok(!ids.includes("nofield"), "missing field must never be returned");
  assert.ok(!ids.includes("internalonly"), "internal content must not be returned to a student");
  assert.ok(!ids.includes("draftbutpublic"), "a draft must not be returned");
  assert.deepEqual(ids, ["deadlocks", "mrcetonly", "publicly", "sectiona"], `unexpected: ${ids}`);
});

test("RULES ARE NOT FILTERS: a query that omits a filter the rule requires is DENIED outright", async () => {
  // This resolves doc open question 6, and corrects the Section 6a Q4 finding.
  //
  // Q4 reported list() returning documents that get() denies, which would have
  // meant rules could not be relied on to restrict list results. That probe was
  // INVALID: it put audiences under the reserved `aud` claim, so hasAny()
  // received a string and the rule was erroring rather than evaluating.
  //
  // With the claim key fixed, Firestore behaves exactly as documented: a list
  // query whose constraints do not guarantee every matching document satisfies
  // the rule fails entirely, rather than silently filtering. So the
  // mandatory-filter convention is enforced BY Firestore, not merely by
  // convention - a consumer that forgets the filter breaks loudly.
  const db = mrcetSectionA();

  // No status filter, but the rule requires status == 'published' and the
  // collection contains a draft -> whole query denied.
  await assertFails(getDocs(query(
    collection(db, "csCoreSubjects/os/topics"),
    where("audiences", "array-contains-any", ["public", "legacy", "campus:mrcet"])
  )));

  // No audience filter, but the rule requires an audience match and the
  // collection contains content for another audience -> whole query denied.
  await assertFails(getDocs(query(
    collection(db, "csCoreSubjects/os/topics"),
    where("status", "==", "published")
  )));

  // Completely unfiltered -> denied.
  await assertFails(getDocs(collection(db, "csCoreSubjects/os/topics")));
});

test("BLOCKER: a list query MUST constrain every field the rule inspects, or it is denied", async () => {
  // The question that decides whether these rules can ship before the consumers
  // are updated. Every existing consumer queries where("status","==","published")
  // with NO audience filter. Test 8 shows that is denied once a collection holds
  // mixed audiences - but production is uniformly ["legacy"] after Phase 0, and
  // every reader carries `legacy`, so the rule is satisfiable for every document
  // and the query succeeds unchanged.
  //
  // The consequence, and the deployment rule it implies: the rules are safe to
  // deploy NOW, and consumers MUST gain their audience filter BEFORE any
  // restricted content is published into a collection they read. Publishing
  // restricted content first would break that collection's listing for everyone.
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const id of ["a", "b", "c"]) {
      await setDoc(doc(db, `csCoreSubjects/os/topics/${id}`), { title: id, status: "published", audiences: ["legacy"] });
    }
    await setDoc(doc(db, "csCoreSubjects/os/topics/d"), { title: "d", status: "draft", audiences: ["legacy"] });
  });

  for (const [label, db] of [["unclaimed", noClaim()], ["anonymous", anon()], ["section A", mrcetSectionA()]]) {
    // DENIED - even though every document in range carries ["legacy"] and every
    // reader carries `legacy`, so the rule would evaluate true for all of them.
    //
    // Firestore's list authorisation is ANALYTICAL, not per-document: the query's
    // constraints must PROVE that every matching document satisfies the rule. A
    // rule that inspects `audiences` therefore requires the query to constrain
    // `audiences`, regardless of what the data happens to contain.
    await assertFails(getDocs(query(
      collection(db, "csCoreSubjects/os/topics"),
      where("status", "==", "published")
    )));
    assert.ok(true, label);
  }

  // Add the audience filter and the identical query succeeds.
  const snap = await assertSucceeds(getDocs(query(
    collection(noClaim(), "csCoreSubjects/os/topics"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", ["public", "legacy"])
  )));
  assert.deepEqual(snap.docs.map(d => d.id).sort(), ["a", "b", "c"]);
});

// ---------------- scoping ----------------

test("institution-scoped content reaches that institution and no other", async () => {
  await assertSucceeds(getDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/mrcetonly")));
  await assertSucceeds(getDoc(doc(mrcetSectionB(), "csCoreSubjects/os/topics/mrcetonly")));
  await assertFails(getDoc(doc(otherCollege(), "csCoreSubjects/os/topics/mrcetonly")));
  await assertFails(getDoc(doc(anon(), "csCoreSubjects/os/topics/mrcetonly")));
});

test("section-scoped content reaches that section and not its neighbour", async () => {
  await assertSucceeds(getDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/sectiona")));
  await assertFails(getDoc(doc(mrcetSectionB(), "csCoreSubjects/os/topics/sectiona")));
  await assertFails(getDoc(doc(otherCollege(), "csCoreSubjects/os/topics/sectiona")));
});

test("public content reaches everyone including anonymous", async () => {
  for (const db of [anon(), noClaim(), mrcetSectionA(), otherCollege()]) {
    await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/publicly")));
  }
});

test("internal content reaches no student", async () => {
  for (const db of [anon(), noClaim(), mrcetSectionA(), otherCollege()]) {
    await assertFails(getDoc(doc(db, "csCoreSubjects/os/topics/internalonly")));
  }
});

// ---------------- status still governs, independently ----------------

test("a draft stays invisible even when its audiences would allow it", async () => {
  // Audience is additive to publication, never a replacement for it.
  await assertFails(getDoc(doc(anon(), "csCoreSubjects/os/topics/draftbutpublic")));
  await assertFails(getDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/draftbutpublic")));
  await assertFails(getDoc(doc(noClaim(), "csCoreSubjects/os/topics/draftbutpublic")));
});

// ---------------- admin escape hatch ----------------

test("an admin reads everything - drafts, unpublished, and other institutions' content", async () => {
  const db = admin();
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/newtopic")));
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/nofield")));
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/draftbutpublic")));
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/internalonly")));
  await assertSucceeds(getDoc(doc(db, "csCoreSubjects/os/topics/sectiona")));
});

test("a non-admin still cannot write content", async () => {
  await assertFails(setDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/deadlocks"), { title: "hacked" }));
  await assertFails(setDoc(doc(mrcetSectionA(), "csCoreSubjects/os/topics/mine"), { title: "mine", audiences: ["public"] }));
});

test("a student cannot grant themselves an audience by writing to content", async () => {
  // The obvious attack: widen a document's audiences to include yourself.
  await assertFails(setDoc(doc(otherCollege(), "csCoreSubjects/os/topics/mrcetonly"),
    { audiences: ["campus:mrcet", "campus:abc"] }, { merge: true }));
});

// ---------------- the Daily Learning boundary ----------------

test("dailyLearning is NOT audience-gated - it stays institution-scoped by path", async () => {
  // Deliberate: Daily Learning documents are Campus-owned SCHEDULE, already
  // scoped by isApprovedStudent(institutionId). Audiences govern centrally
  // distributed content, which the schedule references rather than contains.
  // Recorded as a test so the decision is visible rather than an omission.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "institutions/mrcet/dailyLearning/2026-07-30"),
      { status: "published", audiences: ["legacy"], title: "Day 1" });
  });
  // An outsider is denied by the institution scope, not by audiences.
  await assertFails(getDoc(doc(otherCollege(), "institutions/mrcet/dailyLearning/2026-07-30")));
});
