// Guards the contest lifecycle machine, and one bug in particular.
//
// THE BUG THIS EXISTS FOR. Firestore rejects the serverTimestamp() sentinel
// anywhere inside an array - the write throws client-side with
// "FieldValue.serverTimestamp() cannot be used inside of an array".
// lifecycleHistory is an array of audit entries, and createContest,
// transitionContestLifecycle, appendContestHistory, extendContestTime and
// duplicateContest all built their entry with `at: serverTimestamp()`.
//
// Every one of them threw. In production that meant an admin could not create
// a contest through the Studio, and could never move one from Registration
// Open to Live - the contest simply stayed upcoming forever. It went unnoticed
// because the only lifecycleHistory entries that existed were written by a
// backfill script ("_migration"), which used a concrete Date and therefore
// worked, so the data looked healthy while the app path was completely broken.
//
// A source-level test rather than an emulator one on purpose: the failure is a
// static property of how the write is constructed, so catching it needs no
// Firestore at all, and an emulator test would only catch it if someone
// remembered to exercise every one of the five call sites.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const source = readFileSync(new URL("../devert-frontend/lib/contests.js", import.meta.url), "utf8");

// Strips /* */ and // comments so the prose above (which quotes the bug) can't
// itself trip the scanner.
function stripComments(js) {
  return js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

const code = stripComments(source);

test("no serverTimestamp() sentinel is ever constructed inside an array literal", () => {
  const offenders = [];
  code.split("\n").forEach((line, i) => {
    if (!line.includes("serverTimestamp()")) return;
    // The sentinel is only illegal inside an array. Every real call site that
    // does this puts it in an object literal inside `[...]` on one line, which
    // is exactly what this matches - a bracket opened before the sentinel and
    // still unclosed by the time we reach it.
    const upTo = line.slice(0, line.indexOf("serverTimestamp()"));
    const depth = (upTo.match(/\[/g) || []).length - (upTo.match(/\]/g) || []).length;
    if (depth > 0) offenders.push(`  line ${i + 1}: ${line.trim()}`);
  });
  assert.deepEqual(offenders, [],
    `serverTimestamp() cannot be used inside an array - Firestore throws.\nUse historyStamp() (Timestamp.now()) instead:\n${offenders.join("\n")}`);
});

test("lifecycleHistory entries are built with historyStamp(), not a sentinel", () => {
  const historyLines = code.split("\n").filter(l => l.includes("lifecycleHistory: ["));
  assert.ok(historyLines.length >= 4, `expected the known lifecycleHistory write sites, found ${historyLines.length}`);
  for (const line of historyLines) {
    if (!line.includes("at:")) continue;
    assert.ok(line.includes("historyStamp()"),
      `lifecycleHistory entry must stamp with historyStamp(): ${line.trim()}`);
    assert.ok(!line.includes("serverTimestamp()"),
      `lifecycleHistory entry must not use serverTimestamp(): ${line.trim()}`);
  }
});

test("top-level timestamps still use the real server clock", () => {
  // The fix must not have been applied with a blunt find-and-replace. Fields a
  // deadline or a rule depends on have to stay server-authoritative, since a
  // wrong client clock there is a correctness bug, not a cosmetic one.
  for (const field of ["registeredAt", "submittedAt"]) {
    const line = code.split("\n").find(l => l.includes(`${field}: `));
    assert.ok(line, `${field} write site not found`);
    assert.ok(line.includes("serverTimestamp()"),
      `${field} must keep using serverTimestamp() - it is security/deadline relevant: ${line.trim()}`);
  }
});

test("historyStamp is defined and returns a Firestore Timestamp, not a raw Date", () => {
  assert.match(code, /function historyStamp\(\)\s*\{\s*return Timestamp\.now\(\);?\s*\}/,
    "historyStamp() should return Timestamp.now() so the stored type matches every other timestamp field");
  assert.match(code, /^\s*Timestamp,?\s*$/m, "Timestamp must be imported from firebase/firestore");
});

// ---------------- contestPhase: the clock bounds the state (F-01, F-02) ----------------
//
// contestPhase used to return "live" on lifecycleState alone, never reading
// contestStart. Arming a contest early - which an admin reasonably does while
// setting up - opened it to students immediately. It also never re-read
// contestEnd, so a finished contest stayed open until a human closed it.
//
// Nothing in this project runs on a schedule (the only deployed Cloud Functions
// are link-preview routers), so a state that ignores the clock is never
// corrected by anything. These pin the rule: lifecycleState arms, dates decide.
const phaseSrc = readFileSync(new URL("../devert-frontend/lib/contests.js", import.meta.url), "utf8");
const phaseHead = phaseSrc.slice(0, phaseSrc.indexOf("export function bucketContests"))
  .replace(/^import[\s\S]*?from\s+"[^"]*";$/gm, "")
  .replace(/^"use client";$/m, "");
// Only the pure date helpers and contestPhase are needed; anything touching
// Firestore is sliced off above.
const { contestPhase } = await import(
  `data:text/javascript;base64,${Buffer.from(
    phaseHead.slice(phaseHead.indexOf("function toDate"))
  ).toString("base64")}`
).catch(async () => {
  // toDate may sit above the slice point in some orderings - fall back to the
  // whole head, which is still import-free.
  return import(`data:text/javascript;base64,${Buffer.from(phaseHead).toString("base64")}`);
});

const AT = (iso) => new Date(iso);
const WINDOW = {
  registrationEnd: AT("2026-08-01T11:15:00Z"), // 16:45 IST
  contestStart: AT("2026-08-01T11:30:00Z"),    // 17:00 IST
  contestEnd: AT("2026-08-01T12:30:00Z"),      // 18:00 IST
};

test("a contest armed Live before its start time is NOT open to students", () => {
  // The exact F-01 shape: state moved to live at ~12:53 IST for a 17:00 start.
  const phase = contestPhase({ ...WINDOW, lifecycleState: "live" }, AT("2026-08-01T07:23:00Z"));
  assert.notEqual(phase, "live", "arming early must not open the contest");
  assert.equal(phase, "upcoming");
});

test("an armed contest opens exactly at its start time, not before", () => {
  const c = { ...WINDOW, lifecycleState: "live" };
  // Before registration shuts it reads as upcoming; between registrationEnd
  // (16:45) and contestStart (17:00) it reads as closed - that distinction is
  // the pre-existing clock behaviour and is deliberately preserved.
  assert.equal(contestPhase(c, AT("2026-08-01T11:00:00Z")), "upcoming");
  assert.equal(contestPhase(c, AT("2026-08-01T11:29:59Z")), "closed");
  assert.equal(contestPhase(c, AT("2026-08-01T11:30:00Z")), "live", "opens the instant contestStart is reached");
  assert.equal(contestPhase(c, AT("2026-08-01T12:00:00Z")), "live");
});

test("a Live contest closes itself once contestEnd passes, with nobody clicking", () => {
  // The other half of F-02: no scheduler exists, so if this returned "live"
  // past the end, late submissions would keep landing indefinitely.
  assert.equal(contestPhase({ ...WINDOW, lifecycleState: "live" }, AT("2026-08-01T12:30:01Z")), "past");
});

test("the clock can never open a contest that has not been armed", () => {
  // Mid-window, but the admin never moved it to Live. It must stay shut.
  const mid = AT("2026-08-01T12:00:00Z");
  for (const state of ["draft", "hidden", "registrationOpen", "registrationClosed"]) {
    assert.notEqual(contestPhase({ ...WINDOW, lifecycleState: state }, mid), "live",
      `${state} must not be openable by the clock alone`);
  }
});

test("registration closing is reflected before the contest starts", () => {
  // Between registrationEnd (16:45) and contestStart (17:00) the UI must stop
  // offering a Register button the rules would reject anyway.
  const between = AT("2026-08-01T11:20:00Z");
  assert.equal(contestPhase({ ...WINDOW, lifecycleState: "registrationOpen" }, between), "closed");
  assert.equal(contestPhase({ ...WINDOW, lifecycleState: "live" }, between), "closed");
});

test("terminal states stay past regardless of the clock", () => {
  const during = AT("2026-08-01T12:00:00Z");
  for (const state of ["submissionClosed", "evaluation", "resultsPublished", "archived"]) {
    assert.equal(contestPhase({ ...WINDOW, lifecycleState: state }, during), "past",
      `${state} must remain past even inside the contest window`);
  }
});

test("Force End closes a running contest immediately", () => {
  // forceEndContest transitions to submissionClosed rather than moving the
  // date, so this must not depend on contestEnd having passed.
  assert.equal(contestPhase({ ...WINDOW, lifecycleState: "submissionClosed" }, AT("2026-08-01T11:45:00Z")), "past");
});

test("Extend Time reopens a contest that had run out", () => {
  const justEnded = AT("2026-08-01T12:31:00Z");
  assert.equal(contestPhase({ ...WINDOW, lifecycleState: "live" }, justEnded), "past");
  const extended = { ...WINDOW, contestEnd: AT("2026-08-01T13:30:00Z"), lifecycleState: "live" };
  assert.equal(contestPhase(extended, justEnded), "live");
});

test("legacy contests with no lifecycleState still resolve purely by the clock", () => {
  // The two contests that predate lifecycleState must behave exactly as before.
  assert.equal(contestPhase(WINDOW, AT("2026-08-01T10:00:00Z")), "upcoming");
  assert.equal(contestPhase(WINDOW, AT("2026-08-01T11:20:00Z")), "closed");
  assert.equal(contestPhase(WINDOW, AT("2026-08-01T12:00:00Z")), "live");
  assert.equal(contestPhase(WINDOW, AT("2026-08-01T13:00:00Z")), "past");
});
