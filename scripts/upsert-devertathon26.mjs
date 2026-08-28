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
// hackathons/devert-launch-hack (the old "DeVert Launch Hackathon / 48
// hours" placeholder this file used to retire via --retire-old-placeholder)
// has since been deleted outright - it had zero registrations/submissions,
// so there was nothing a "retire, don't delete" safety net was protecting.
//
// Usage:
//   node scripts/upsert-devertathon26.mjs
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
  title: "DeVert-A-Thon'26",
  tagline: "Code. Innovate. Elevate.",
  description:
    "A 12-hour national hackathon on 11 September 2026 at MRCET, Hyderabad, for builders " +
    "who want to ship something real. Open to students from any branch or discipline - CSE, " +
    "AI/ML, IT, ECE, EEE, Mechanical, Data Science, Cybersecurity and more - multidisciplinary " +
    "teams encouraged. Build with AI/ML, GenAI, web, mobile, cloud, cybersecurity, IoT, " +
    "hardware, automation, FinTech, HealthTech, EdTech, sustainability or open innovation. " +
    "Form a team, pick a problem worth solving, and build under pressure - no fluff, just " +
    "building, problem-solving and teamwork against the clock.",
  eventType: "hackathon",
  theme: "",
  accentColor: "#00FF41",
  bannerImage: "https://devert.in/devertathon26-banner.png",
  host: "",
  prizes: [
    { place: "1st", label: "1st Place", reward: "" },
    { place: "2nd", label: "2nd Place", reward: "" },
    { place: "3rd", label: "3rd Place", reward: "" },
  ],
  // Placeholders - fill in via /admin once finalized. Leaving these null
  // keeps the registration-phase badge at "REGISTRATION OPEN" (see
  // lib/eventTypes.js's registrationPhase) until a real close date is set.
  // The Participant Guidelines give a date (11 Sep 2026) but no clock time,
  // so it stays out of these Timestamp fields rather than guessing one -
  // it's already in `description` above as plain text.
  registrationOpen: null,
  registrationCloseAt: null,
  submissionDeadline: null,
  resultsDate: null,
  // Plain display string, not a Timestamp - the event day shown on the
  // listing card and hero stat chips, without implying a clock time the
  // Timestamp fields above deliberately don't guess at.
  eventDateLabel: "11 Sep 2026",
  venue: "Malla Reddy College of Engineering and Technology",
  mode: "in_person",
  minTeamSize: 2,
  maxTeamSize: 3,
  registrationFee: "₹950 / team",
  prizePool: "₹20,000+",
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
  // From the Participant Guidelines PDF (04 - Hackathon Flow).
  eventFlow: ["CHECK-IN", "BRIEFING", "IDEATE", "BUILD", "MENTORING", "SUBMIT", "DEMO", "JUDGING", "AWARDS"],
  // 11 - Your 12-Hour Game Plan.
  gamePlan: [
    { time: "0–1 HR", label: "Understand + Plan" },
    { time: "1–3 HR", label: "Setup + Architecture" },
    { time: "3–8 HR", label: "Build MVP" },
    { time: "8–10 HR", label: "Test + Polish" },
    { time: "10–11 HR", label: "Prepare Demo" },
    { time: "11–12 HR", label: "Submit + Present" },
  ],
  // 10 - What to Bring.
  whatToBring: ["College ID", "Laptop + Charger", "Required Accessories", "Hardware (if needed)", "Backup Your Files", "Dev Environment Ready"],
  // 05 - Project Rules.
  rules: {
    do: [
      "Build a meaningful solution during the hackathon.",
      "Use open-source libraries, APIs, frameworks & AI tools (unless restricted).",
      "Understand and be able to explain your project.",
      "Clearly acknowledge significant external resources.",
    ],
    dont: [
      "Submit a completely pre-built project.",
      "Plagiarize or misrepresent someone else's work.",
      "Expose API keys, passwords or private credentials.",
    ],
  },
  // 06 - AI Usage.
  aiPolicy: {
    headline: "AI IS ALLOWED — USE IT RESPONSIBLY",
    body:
      "You may use AI coding assistants, GenAI tools and other development tools. " +
      "You are responsible for everything you submit and must be able to explain your implementation.",
    quote: "AI should assist your team — not replace your team.",
  },
  // 07 - Judging.
  judgingCriteria: ["Innovation", "Technical Implementation", "Problem & Impact", "Functionality", "Presentation", "Future Potential"],
  // 08 - Presentation ("Keep your pitch simple").
  presentationFormat: ["PROBLEM", "SOLUTION", "TECHNOLOGY", "DEMO", "IMPACT", "FUTURE SCOPE"],
  // 09 - Code of Conduct.
  codeOfConduct: [
    "Cheating", "Plagiarism", "Harassment", "Theft / damage",
    "Unauthorized system access", "Attacking networks", "Disrupting another team", "Submission manipulation",
  ],
  // Organizer contact from the guidelines' footer. Phone numbers deliberately
  // left off this public, permanently-indexed page (unlike the PDF, which is
  // handed only to participants) - add them here if that's actually wanted.
  organizers: [
    { name: "A. Samuel Prasad", role: "" },
    { name: "P. Deekshith", role: "" },
  ],
  contactEmail: "devert.contact@gmail.com",
  socialHandle: "@devert.community",
  faq: [
    { q: "How many people can be in a team?", a: "2-3 members." },
    { q: "What is the registration fee?", a: "₹950 per team." },
    { q: "What is the prize pool?", a: "₹20,000+." },
    { q: "Is food provided?", a: "Breakfast, lunch and snacks are provided." },
    { q: "Can I register individually?", a: "No. Teams must have 2-3 members." },
    { q: "Can I use AI tools during the hackathon?", a: "Yes, responsibly - AI should assist your team, not replace it. You must still be able to explain your implementation." },
    { q: "What should I bring on the day?", a: "College ID, laptop + charger, any hardware you need, and come with your dev environment already set up." },
  ],
  registrationFormUrl: "https://docs.google.com/forms/d/1k75DVxJ9j9Obp88D8VDNQgvxFrm0NAOpD7J8GV1erZY/",
  tags: ["Hackathon"],
  status: "upcoming",
  statusColor: "#00FFFF",
};

await db.doc(`hackathons/${SLUG}`).set(
  { ...doc, registrationCount: 0, submissionCount: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { merge: true }
);
console.log(`Upserted hackathons/${SLUG}.`);
