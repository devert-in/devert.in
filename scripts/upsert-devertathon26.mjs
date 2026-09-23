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
  tagline: "Don't bring a project. Bring your skills.",
  description:
    "A 12-hour national hackathon on 11 September 2026 at MRCET, Hyderabad, for builders " +
    "who want to ship something real - with one twist: you don't bring the project, we bring " +
    "the problem. At kickoff every team gets a pool of real-world problem statements across " +
    "AI/ML, GenAI, web, mobile, cloud, cybersecurity, IoT, hardware, automation, FinTech, " +
    "HealthTech, EdTech, sustainability and open innovation - pick one, then build your " +
    "solution from scratch using any AI tool you want. Open to students from any branch or " +
    "discipline - CSE, AI/ML, IT, ECE, EEE, Mechanical, Data Science, Cybersecurity and more - " +
    "multidisciplinary teams encouraged. No fluff, just building, problem-solving and teamwork " +
    "against the clock.",
  eventType: "hackathon",
  theme: "",
  accentColor: "#00FF41",
  bannerImage: "https://devert.in/devertathon26-banner.png",
  host: "",
  // Deliberately no per-place (1st/2nd/3rd) breakdown - the organizers want
  // only the aggregate "₹20,000+" figure shown (prizePool below), not a
  // specific split committed to per place. FieldValue.delete() clears the
  // stale `prizes` array (empty-reward placeholders) this doc already has
  // live in production from before that decision, not just the local source
  // - a plain removal from this object would otherwise never reach
  // Firestore, since {merge:true} only overwrites fields actually present
  // in the write, never deletes ones merely absent from it.
  prizes: admin.firestore.FieldValue.delete(),
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
  perks: ["Breakfast", "Lunch", "Snacks", "OpenAI, Vercel, n8n & Lovable credits", "Internship opportunities", "Mini challenges + instant rewards", "Certificates", "Musical evening"],
  whyParticipate: [
    "Build something real",
    "Use any AI tool you want",
    "Compete with developers",
    "Learn under pressure",
    "Network with builders",
    "Industry interaction",
    "Get noticed for internships",
    "Win exciting rewards",
  ],
  // From the Participant Guidelines PDF (04 - Hackathon Flow).
  eventFlow: ["CHECK-IN", "BRIEFING", "IDEATE", "BUILD", "MENTORING", "SUBMIT", "DEMO", "JUDGING", "AWARDS"],
  // 11 - Your 12-Hour Game Plan.
  gamePlan: [
    { time: "0-1 HR", label: "Understand + Plan" },
    { time: "1-3 HR", label: "Setup + Architecture" },
    { time: "3-8 HR", label: "Build MVP" },
    { time: "8-10 HR", label: "Test + Polish" },
    { time: "10-11 HR", label: "Prepare Demo" },
    { time: "11-12 HR", label: "Submit + Present" },
  ],
  // 10 - What to Bring.
  whatToBring: ["College ID", "Laptop + Charger", "Required Accessories", "Hardware (if needed)", "Backup Your Files", "Dev Environment Ready"],
  // 05 - Project Rules.
  rules: {
    do: [
      "Build a meaningful solution during the hackathon.",
      "Choose one problem statement from the official pool revealed at kickoff.",
      "Use open-source libraries, APIs, frameworks & AI tools (unless restricted).",
      "Understand and be able to explain your project.",
      "Clearly acknowledge significant external resources.",
    ],
    dont: [
      "Bring your own pre-selected problem statement or project idea.",
      "Submit a completely pre-built project, template or prior repo as your solution.",
      "Start development before the hackathon officially begins.",
      "Plagiarize or misrepresent someone else's work.",
      "Expose API keys, passwords or private credentials.",
    ],
  },
  // 06 - AI Usage.
  aiPolicy: {
    headline: "AI IS ALLOWED - USE IT RESPONSIBLY",
    body:
      "You're free to use any AI tool - ChatGPT, Claude, Gemini, GitHub Copilot, Cursor, Lovable " +
      "or anything else that helps you build. There's no restriction on your AI workflow, but using " +
      "AI doesn't guarantee a win - we judge the final solution, not who typed the least code. You " +
      "are responsible for everything you submit and must be able to explain your implementation.",
    quote: "AI should assist your team - not replace your team.",
  },
  // 07 - Judging.
  judgingCriteria: ["Innovation", "Technical Implementation", "Effective AI Usage", "Problem & Impact", "Functionality", "Presentation", "Future Potential"],
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
    { q: "Can I bring my own project idea?", a: "No. At kickoff you'll get a pool of official problem statements - pick one and build your solution from scratch during the hackathon. Pre-built projects and personal problem statements aren't accepted." },
    { q: "What is the registration fee?", a: "₹950 per team." },
    { q: "What is the prize pool?", a: "₹20,000+." },
    { q: "Is food provided?", a: "Breakfast, lunch and snacks are provided." },
    { q: "Can I register individually?", a: "No. Teams must have 2-3 members." },
    { q: "Which AI tools can I use?", a: "Any AI tool you want - ChatGPT, Claude, Gemini, GitHub Copilot, Cursor and more are all welcome. There's no restriction on your AI-assisted workflow, but you must be able to explain your implementation." },
    { q: "Are internships guaranteed for participants?", a: "No - but standout teams may get noticed by participating organizations for internship opportunities based on their project and skills." },
    { q: "What should I bring on the day?", a: "College ID, laptop + charger, any hardware you need, and come with your dev environment already set up." },
  ],
  registrationFormUrl: "https://app.studenttribe.in/events/devert-a-thon",
  status: "upcoming",
};

await db.doc(`hackathons/${SLUG}`).set(
  { ...doc, registrationCount: 0, submissionCount: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() },
  { merge: true }
);
console.log(`Upserted hackathons/${SLUG}.`);
