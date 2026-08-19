// One-off upsert for the DeVert-A-thon'26 hackathon doc, following the same
// firebase-admin + service-account.json convention as set-admin-claim.mjs.
// Safe to re-run - it's an idempotent setDoc(..., {merge:true}) keyed on the
// slug below, not an append.
//
// The doc's slug has moved twice, both times as a one-off copy+delete done
// directly (Firestore can't rename a doc ID in place), not via this script's
// re-run logic: hackathons/devolt-26 ("DevOlt" was this event's internal
// working name before it was renamed to DeVert-A-thon'26) -> devert-a-thon-26
// (fixed a wrong breadcrumb/URL surfaced on the live event page) ->
// devertathon26 (final, no-hyphen slug).
//
// Usage:
//   node scripts/upsert-devertathon26.mjs
//   node scripts/upsert-devertathon26.mjs --retire-old-placeholder
//     (also flips hackathons/devert-launch-hack's status to "ended" so the
//     old "DeVert Launch Hackathon / 48 hours" copy stops being the
//     featured/listed event - it is NOT deleted, since deletion also removes
//     its registration/submission docs; retiring is the reversible choice)
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const SLUG = "devertathon26";

const doc = {
  title: "DeVert-A-thon'26",
  tagline: "Think. Build. Electrify.",
  description:
    "A 12-hour hackathon for builders who want to ship something real. " +
    "Form a team, pick a problem worth solving, and build under pressure - " +
    "no fluff, just building, problem-solving and teamwork against the clock.",
  eventType: "hackathon",
  theme: "",
  accentColor: "#00FF41",
  host: "",
  prizes: [
    { place: "1st", label: "1st Place", reward: "" },
    { place: "2nd", label: "2nd Place", reward: "" },
    { place: "3rd", label: "3rd Place", reward: "" },
  ],
  // Placeholders - fill in via /admin once finalized. Leaving these null
  // keeps the registration-phase badge at "REGISTRATION OPEN" (see
  // lib/eventTypes.js's registrationPhase) until a real close date is set.
  registrationOpen: null,
  registrationCloseAt: null,
  submissionDeadline: null,
  resultsDate: null,
  venue: "TBA",
  minTeamSize: 2,
  maxTeamSize: 3,
  registrationFee: "₹950 / team",
  prizePool: "₹20,000",
  durationLabel: "12 Hours",
  perks: ["Breakfast", "Lunch", "Snacks", "Exciting rewards", "Certificates"],
  whyParticipate: [
    "Build something real",
    "Compete with developers",
    "Learn under pressure",
    "Network with builders",
    "Win exciting rewards",
    "Get recognized",
  ],
  faq: [
    { q: "How many people can be in a team?", a: "2-3 members." },
    { q: "What is the registration fee?", a: "₹950 per team." },
    { q: "What is the prize pool?", a: "₹20,000." },
    { q: "Is food provided?", a: "Breakfast, lunch and snacks are provided." },
    { q: "Can I register individually?", a: "No. Teams must have 2-3 members." },
  ],
  // Placeholder until the real Google Form link is provided - update via
  // /admin's Challenges tab, no code change needed.
  registrationFormUrl: "",
  tags: ["Hackathon"],
  status: "upcoming",
  statusColor: "#00FFFF",
};

await db.doc(`hackathons/${SLUG}`).set(
  { ...doc, registrationCount: 0, submissionCount: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { merge: true }
);
console.log(`Upserted hackathons/${SLUG}.`);

if (process.argv.includes("--retire-old-placeholder")) {
  const oldRef = db.doc("hackathons/devert-launch-hack");
  const oldSnap = await oldRef.get();
  if (oldSnap.exists) {
    await oldRef.update({ status: "ended", statusColor: "#555555" });
    console.log("Retired hackathons/devert-launch-hack (status -> ended).");
  } else {
    console.log("hackathons/devert-launch-hack does not exist - nothing to retire.");
  }
}
