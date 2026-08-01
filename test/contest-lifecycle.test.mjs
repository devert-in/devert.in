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
