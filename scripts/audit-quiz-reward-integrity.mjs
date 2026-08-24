// Reward integrity audit + targeted cleanup for the quiz-farming era.
//
// WHAT THIS CAN AND CANNOT DO - READ BEFORE --execute
//
// It CANNOT recompute historical XP against correctness. CS Core, GATE,
// Programming and Aptitude never stored a student's quiz answers or score
// anywhere before lib/quizAttempts.js existed - `completedTopicIds` recorded
// THAT a topic was completed, never HOW. There is no data to grade
// retrospectively, so "revoke the XP given for wrong answers" is not a
// computation anyone can run on the existing database. From the day
// quiz_attempts ships, every answer sheet is recorded and this becomes possible
// going forward.
//
// What it CAN do is find completions that could not plausibly have involved
// reading the lesson or answering its quiz, using the one signal that WAS
// recorded: the reward_grants timestamp. A student who banked seven CS Core
// topics in 23 seconds did not read seven lessons (verified in the live ledger,
// 2026-08-04). Those are reversible with confidence.
//
// It also verifies the things that SHOULD be structurally impossible, so a
// regression in the rules or the transaction shows up here rather than in a
// support ticket:
//   - duplicate (uid, activityType, activityId) ledger keys
//   - a module's ledger entry count running AHEAD of its recorded completions
//   - cross-module grants landing within seconds of each other
//
// DRY RUN BY DEFAULT. --execute reverses ONLY the fast-completion grants, and
// only those under --min-gap, writing a reversal ledger entry for each so the
// clawback is itself auditable.
//
// Usage:
//   node scripts/audit-quiz-reward-integrity.mjs
//   node scripts/audit-quiz-reward-integrity.mjs --min-gap 15
//   node scripts/audit-quiz-reward-integrity.mjs --min-gap 15 --execute
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const gapArgIdx = process.argv.indexOf("--min-gap");
// Seconds. A completion landing sooner than this after the SAME student's
// previous completion in the SAME module is treated as not-really-done. 15s is
// deliberately conservative: the quickest CS Core lesson still runs several
// hundred words plus a multi-question quiz.
const MIN_GAP_SECONDS = gapArgIdx > -1 ? Number(process.argv[gapArgIdx + 1]) : 15;

// Only these pay for reading-plus-quiz work, so only these are meaningfully
// "too fast". Daily Learning days and problem solves are excluded - their
// timing profile is genuinely different (a day is submitted once, and embedded
// problem grants legitimately land in bursts when a day is submitted).
const TOPIC_ACTIVITY_TYPES = new Set([
  "cscore_topic", "gate_topic", "programming_topic", "aptitude_topic", "se_topic", "dsa_concept",
]);

function iso(d) { return d ? d.toISOString() : null; }

async function main() {
  console.log(EXECUTE
    ? `EXECUTE MODE - will reverse topic grants completed <${MIN_GAP_SECONDS}s after the previous one.`
    : `DRY RUN - no writes. Threshold: <${MIN_GAP_SECONDS}s between same-module completions.`);
  console.log("");

  const ledgerSnap = await db.collection("reward_grants").get();
  console.log(`reward_grants entries: ${ledgerSnap.size}`);

  const rows = [];
  const byKey = new Map();
  ledgerSnap.forEach(d => {
    const x = d.data();
    const at = x.grantedAt?.toDate?.() || null;
    const key = `${x.uid}|${x.activityType}|${x.activityId}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(d.id);
    rows.push({
      id: d.id, uid: x.uid, type: x.activityType, aid: x.activityId,
      xp: x.xp || 0, coins: x.coins || 0, score: x.score || 0,
      status: x.status, module: x.sourceModule, at,
    });
  });

  // ---- structural checks (these should all come back clean) ----
  const dupKeys = [...byKey.entries()].filter(([, ids]) => ids.length > 1);
  console.log(`\n[1] duplicate (uid, activityType, activityId) keys: ${dupKeys.length}`);
  if (dupKeys.length) {
    console.log("    !! Should be impossible - deterministic doc ids + create-only rules. Investigate.");
    dupKeys.slice(0, 10).forEach(([k, ids]) => console.log(`      ${k} -> ${ids.join(", ")}`));
  }

  // ---- ledger vs recorded completions, per module ----
  const [cscoreProg, progProg, gateProg, aptProg, dsaProg, seProg] = await Promise.all([
    db.collection("cscore_progress").get(),
    db.collection("programming_progress").get(),
    db.collection("gate_progress").get(),
    db.collection("user_aptitude_progress").get(),
    db.collection("dsa_concept_progress").get(),
    db.collection("se_progress").get().catch(() => ({ forEach: () => {} })),
  ]);
  const completionsByUid = new Map(); // uid -> {type -> count}
  function addCompletions(snap, type, field = "completedTopicIds") {
    snap.forEach(d => {
      const x = d.data();
      const uid = x.uid || d.id;
      const n = (x[field] || []).length;
      if (!completionsByUid.has(uid)) completionsByUid.set(uid, {});
      completionsByUid.get(uid)[type] = (completionsByUid.get(uid)[type] || 0) + n;
    });
  }
  addCompletions(cscoreProg, "cscore_topic");
  addCompletions(progProg, "programming_topic");
  addCompletions(gateProg, "gate_topic");
  addCompletions(aptProg, "aptitude_topic");
  // DSA Concepts keys its completions off a DIFFERENT field name - comparing it
  // against completedTopicIds reports every learner as "ledger ahead", which is
  // an artefact of this script rather than a data problem.
  addCompletions(dsaProg, "dsa_concept", "completedConceptIds");
  addCompletions(seProg, "se_topic");

  const grantsByUidType = new Map();
  rows.forEach(r => {
    if (r.status !== "granted") return;
    const k = `${r.uid}|${r.type}`;
    grantsByUidType.set(k, (grantsByUidType.get(k) || 0) + 1);
  });

  const ledgerAhead = [];
  for (const [k, n] of grantsByUidType) {
    const [uid, type] = k.split("|");
    if (!TOPIC_ACTIVITY_TYPES.has(type)) continue;
    const done = completionsByUid.get(uid)?.[type] || 0;
    if (n > done) ledgerAhead.push({ uid, type, grants: n, completions: done, excess: n - done });
  }
  console.log(`\n[2] users whose ledger runs AHEAD of recorded completions: ${ledgerAhead.length}`);
  ledgerAhead.slice(0, 20).forEach(r => console.log(`      ${r.uid.slice(0, 10)} ${r.type}: ${r.grants} grants vs ${r.completions} completions`));

  // ---- fast completions ----
  const byUidModule = new Map();
  rows.filter(r => r.status === "granted" && TOPIC_ACTIVITY_TYPES.has(r.type) && r.at).forEach(r => {
    const k = `${r.uid}|${r.type}`;
    if (!byUidModule.has(k)) byUidModule.set(k, []);
    byUidModule.get(k).push(r);
  });

  const suspect = [];
  for (const [, list] of byUidModule) {
    list.sort((a, b) => a.at - b.at);
    for (let i = 1; i < list.length; i++) {
      const gap = (list[i].at - list[i - 1].at) / 1000;
      if (gap < MIN_GAP_SECONDS) suspect.push({ ...list[i], gapSeconds: Math.round(gap * 10) / 10 });
    }
  }

  const byUidSuspect = new Map();
  suspect.forEach(s => {
    if (!byUidSuspect.has(s.uid)) byUidSuspect.set(s.uid, { uid: s.uid, xp: 0, coins: 0, score: 0, grants: [] });
    const e = byUidSuspect.get(s.uid);
    e.xp += s.xp; e.coins += s.coins; e.score += s.score;
    e.grants.push({ id: s.id, type: s.type, aid: s.aid, xp: s.xp, coins: s.coins, score: s.score, gapSeconds: s.gapSeconds, at: iso(s.at) });
  });

  const totalXp = suspect.reduce((n, s) => n + s.xp, 0);
  const totalCoins = suspect.reduce((n, s) => n + s.coins, 0);
  console.log(`\n[3] topic grants completed <${MIN_GAP_SECONDS}s after the previous one: ${suspect.length}`);
  console.log(`      across ${byUidSuspect.size} students, totalling ${totalXp} XP and ${totalCoins} coins`);
  [...byUidSuspect.values()].sort((a, b) => b.xp - a.xp).slice(0, 20)
    .forEach(u => console.log(`      ${u.uid.slice(0, 12)}  ${u.grants.length} grants  ${u.xp} XP  ${u.coins} coins`));

  // Resolve handles for the report so a human can actually act on it.
  const uids = [...byUidSuspect.keys()];
  for (let i = 0; i < uids.length; i += 300) {
    const refs = uids.slice(i, i + 300).map(u => db.collection("users").doc(u));
    const snaps = refs.length ? await db.getAll(...refs) : [];
    snaps.forEach(s => {
      if (!s.exists) return;
      const e = byUidSuspect.get(s.id);
      e.handle = s.data().handle || s.data().displayName || null;
      e.currentXp = s.data().xp || 0;
      e.currentScore = s.data().score || 0;
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: EXECUTE ? "execute" : "dry-run",
    minGapSeconds: MIN_GAP_SECONDS,
    note: "Score is NEVER reversed - firestore.rules' selfScoreWriteSane forbids any decrease and every leaderboard sorts on it. Coins are never reversed either (already convertible to real INR). Only XP is clawed back.",
    structural: { duplicateLedgerKeys: dupKeys.length, ledgerAheadOfCompletions: ledgerAhead },
    fastCompletions: {
      grantCount: suspect.length,
      studentCount: byUidSuspect.size,
      totalXp, totalCoins,
      perStudent: [...byUidSuspect.values()].sort((a, b) => b.xp - a.xp),
    },
  };
  const reportPath = join(__dirname, `quiz-reward-audit-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nreport -> ${reportPath}`);

  if (!EXECUTE) {
    console.log("\nDry run complete. Review the report, then re-run with --execute to reverse the XP listed above.");
    return;
  }

  // ---- reversal ----
  // XP only. Score cannot decrease (rules + every leaderboard depends on it),
  // and coins are withdrawable for real money, so neither is clawed back here -
  // reversing those is a policy decision that needs a human, not a script.
  console.log("\nReversing XP for fast completions...");
  let done = 0;
  for (const [uid, e] of byUidSuspect) {
    if (!e.xp) continue;
    await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      const snap = await tx.get(userRef);
      if (!snap.exists) return;
      const currentXp = snap.data().xp || 0;
      // Floored at zero - XP converts to real INR through the Wallet and a
      // negative balance there cannot mean anything.
      const delta = -Math.min(e.xp, currentXp);
      tx.update(userRef, { xp: admin.firestore.FieldValue.increment(delta) });
      tx.set(db.collection("reward_grants").doc(`${uid}_xp_reversal_fastcompletion_${Date.now()}`), {
        uid,
        activityType: "xp_reversal",
        activityId: `fast_completion_under_${MIN_GAP_SECONDS}s`,
        xp: delta, coins: 0, score: 0,
        sourceModule: "migration",
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedBy: "migration:audit-quiz-reward-integrity",
        status: "granted",
        reversedGrantIds: e.grants.map(g => g.id).slice(0, 200),
      });
    });
    done++;
  }
  console.log(`Reversed XP for ${done} students.`);
}

main().catch(e => { console.error(e); process.exit(1); });
