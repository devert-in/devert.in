// Collapses the per-language DSA concept tracks (dsaConceptTracks/java,
// dsaConceptTracks/python, ...) into ONE language-agnostic track
// (dsaConceptTracks/dsa), moving the genuinely language-specific bits onto a
// per-concept `languageVariants` map.
//
// WHY
// ---
// The tracks are the same syllabus twice. seed-dsa-concepts.mjs's
// conceptsFor(langId) returns one shared concept list and varies only two
// things: a `codeExample` and some injected language notes. Concretely, 10 of
// the 11 concepts have `codeExample: null` and are byte-identical across tracks
// - so an entire duplicate roadmap exists to serve one concept's snippet.
// "Arrays" is not a Java concept or a Python concept; it is a concept.
//
// TARGET SHAPE
// ------------
//   dsaConceptTracks/dsa/concepts/{conceptId}
//     ...all existing language-agnostic fields, unchanged...
//     concept:          <the shared body>
//     languageVariants: { java: { code, notes }, python: { code, notes } }
//
// The UI then shows a language switcher ONLY on concepts whose
// languageVariants is non-empty - which is the point: no language chrome on
// Arrays, a Java/Python toggle on Sliding Window.
//
// DIVERGENT BODIES
// ----------------
// Where a concept's `concept` body differs between tracks (sliding-window
// injects per-language notes), this does NOT pick one arbitrarily - that would
// silently leak Java prose into a shared lesson. It computes the common prefix
// and suffix, keeps that as the shared body, and moves each track's divergent
// middle into languageVariants[lang].notes. Every such extraction is PRINTED in
// full so it can be eyeballed before --apply.
//
// PROGRESS
// --------
// dsa_concept_progress doc ids are `${uid}_${langId}` - a convention
// firestore.rules depends on to prove ownership from the id alone - so the
// merged doc is `${uid}_dsa` and the rule keeps working unchanged. Per learner,
// completedConceptIds is UNIONED across tracks: concept ids are identical across
// tracks, and having learned Arrays in the Java roadmap means having learned
// Arrays. Nothing is re-granted; this writes progress only, never reward_grants.
//
// Old tracks are UNPUBLISHED, not deleted, so this is reversible and no learner
// history is destroyed.
//
// Usage:
//   node scripts/migrate-unify-dsa-concept-tracks.mjs           (dry run)
//   node scripts/migrate-unify-dsa-concept-tracks.mjs --apply
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");

const NEW_TRACK_ID = "dsa";
const AUDIENCES = ["public", "legacy"];

function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}
function commonSuffix(a, b, floor) {
  let i = 0;
  while (i < a.length - floor && i < b.length - floor && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i === 0 ? "" : a.slice(a.length - i);
}

const trackSnap = await db.collection("dsaConceptTracks").get();
const tracks = trackSnap.docs
  .filter(d => d.id !== NEW_TRACK_ID)
  .map(d => ({ id: d.id, label: d.get("label") || d.id, order: d.get("order") || 0 }))
  .sort((a, b) => a.order - b.order);

if (tracks.length === 0) {
  console.log("No per-language tracks found - nothing to unify.");
  process.exit(0);
}
console.log(`Source tracks: ${tracks.map(t => `${t.id} (${t.label})`).join(", ")}\n`);

// conceptId -> { langId -> data }
const byConcept = new Map();
for (const t of tracks) {
  const snap = await db.collection("dsaConceptTracks").doc(t.id).collection("concepts").get();
  for (const d of snap.docs) {
    if (!byConcept.has(d.id)) byConcept.set(d.id, {});
    byConcept.get(d.id)[t.id] = d.data();
  }
}

const unified = [];
const extractions = [];

for (const [conceptId, perLang] of byConcept) {
  const langIds = Object.keys(perLang);
  // The base carries every language-agnostic field. Any track works since those
  // fields are identical; first by track order for determinism.
  const baseLang = tracks.find(t => perLang[t.id])?.id || langIds[0];
  const base = { ...perLang[baseLang] };

  const bodies = langIds.map(l => String(perLang[l].concept || ""));
  const bodiesDiffer = new Set(bodies).size > 1;

  let sharedBody = base.concept || "";
  const notesByLang = {};

  if (bodiesDiffer && langIds.length >= 2) {
    // Common prefix/suffix across ALL tracks, not just a pair.
    let prefix = bodies[0], suffix = bodies[0];
    for (const b of bodies.slice(1)) prefix = commonPrefix(prefix, b);
    for (const b of bodies.slice(1)) suffix = commonSuffix(suffix, b, prefix.length);
    sharedBody = `${prefix}${suffix}`;
    for (const l of langIds) {
      const body = String(perLang[l].concept || "");
      notesByLang[l] = body.slice(prefix.length, body.length - suffix.length).trim();
    }
    extractions.push({ conceptId, prefixLen: prefix.length, suffixLen: suffix.length, notesByLang });
  }

  const languageVariants = {};
  for (const l of langIds) {
    const code = perLang[l].codeExample?.code || null;
    const notes = notesByLang[l] || null;
    // Only record a variant when there is something language-specific to show.
    if (code || notes) languageVariants[l] = { language: l, code: code || null, notes: notes || null };
  }

  delete base.codeExample; // superseded by languageVariants
  unified.push({
    conceptId,
    data: {
      ...base,
      concept: sharedBody,
      languageVariants,
      status: "published",
      audiences: AUDIENCES,
    },
    variantLangs: Object.keys(languageVariants),
  });
}

unified.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

console.log("CONCEPT".padEnd(20), "ORDER".padStart(6), " LANGUAGE-SPECIFIC?");
console.log("-".repeat(70));
for (const u of unified) {
  const tag = u.variantLangs.length ? `variants: ${u.variantLangs.join(", ")}` : "none - fully shared";
  console.log(u.conceptId.padEnd(20), String(u.data.order || 0).padStart(6), ` ${tag}`);
}

if (extractions.length) {
  console.log(`\nBodies differed on ${extractions.length} concept(s); divergent prose moved to per-language notes:`);
  for (const e of extractions) {
    console.log(`\n  ${e.conceptId}  (shared prefix ${e.prefixLen} chars + suffix ${e.suffixLen} chars)`);
    for (const [l, n] of Object.entries(e.notesByLang)) {
      console.log(`    ${l}: ${n ? JSON.stringify(n.slice(0, 300)) : "(empty)"}`);
    }
  }
}

// ---- progress union --------------------------------------------------------
const progressSnap = await db.collection("dsa_concept_progress").get();
const merged = new Map(); // uid -> { completedConceptIds:Set, lastOpenedConceptId, startedAt }
for (const d of progressSnap.docs) {
  const uid = d.get("uid") || d.id.split("_")[0];
  if (!merged.has(uid)) merged.set(uid, { ids: new Set(), lastOpenedConceptId: null });
  const m = merged.get(uid);
  (d.get("completedConceptIds") || []).forEach(id => m.ids.add(id));
  if (d.get("lastOpenedConceptId")) m.lastOpenedConceptId = d.get("lastOpenedConceptId");
}
console.log(`\nProgress: ${progressSnap.size} doc(s) -> ${merged.size} merged doc(s) at {uid}_${NEW_TRACK_ID}`);
for (const [uid, m] of merged) {
  console.log(`   ${uid}  ${m.ids.size} completed concept(s)`);
}

if (!apply) {
  console.log(`\nDRY RUN - nothing written. Re-run with --apply.`);
  process.exit(0);
}

await db.collection("dsaConceptTracks").doc(NEW_TRACK_ID).set({
  id: NEW_TRACK_ID,
  label: "DSA Concepts",
  title: "DSA Concepts",
  description: "One concept roadmap. Language-specific code appears only where it matters.",
  order: 10,
  status: "published",
  audiences: AUDIENCES,
  conceptCount: unified.length,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });

for (const u of unified) {
  await db.collection("dsaConceptTracks").doc(NEW_TRACK_ID).collection("concepts").doc(u.conceptId)
    .set({ ...u.data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

for (const [uid, m] of merged) {
  await db.collection("dsa_concept_progress").doc(`${uid}_${NEW_TRACK_ID}`).set({
    uid, langId: NEW_TRACK_ID,
    completedConceptIds: [...m.ids],
    ...(m.lastOpenedConceptId ? { lastOpenedConceptId: m.lastOpenedConceptId } : {}),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

// Unpublished, not deleted - reversible, and no learner history is destroyed.
for (const t of tracks) {
  await db.collection("dsaConceptTracks").doc(t.id).set({ status: "archived" }, { merge: true });
  console.log(`   archived dsaConceptTracks/${t.id}`);
}

console.log(`\nUnified into dsaConceptTracks/${NEW_TRACK_ID}: ${unified.length} concepts, ${merged.size} progress doc(s).`);
process.exit(0);
