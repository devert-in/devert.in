// Seeds the first job_openings docs, following the same firebase-admin +
// service-account.json convention as the other seed-*.mjs scripts here.
//
// Idempotent: each role is an upsert keyed on its slug (which IS the doc ID),
// so re-running this updates the copy in place rather than appending duplicates.
//
// Everything is seeded as a DRAFT on purpose. A draft does not appear on
// /careers and is not in the sitemap, so nothing here goes live just because
// someone ran a script - publishing is a deliberate click in
// /admin -> CONTENT -> CAREERS. Note that "draft" means unlisted, not secret:
// firestore.rules allows a direct read of job_openings/{slug} by anyone who
// knows the slug, so do not write anything confidential into one.
//
// `postedAt` is only stamped on creation (a re-run leaves an existing one
// alone), because that field feeds the JobPosting structured data's datePosted
// and quietly bumping it on every edit is exactly the kind of thing that gets
// a rich result flagged.
//
// Usage:
//   node scripts/seed-job-openings.mjs
//   node scripts/seed-job-openings.mjs --dry-run
//   node scripts/seed-job-openings.mjs --only devert-campus-leader
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const DRY_RUN = process.argv.includes("--dry-run");
// --only <slug>: touch exactly one role. Without it every role is upserted,
// which also rewrites the copy of roles someone has since edited in admin.
const onlyAt = process.argv.indexOf("--only");
const ONLY = onlyAt >= 0 ? process.argv[onlyAt + 1] : null;

// The founders' stated model for these roles: flexible compensation, agreed up
// front per person - volunteer, performance-based stipend, or paid. Said once,
// identically, in every role it applies to.
const COMP =
  "Flexible and agreed up front - volunteer, performance-based stipend or paid, depending on your commitment and the work you deliver.";

const ROLES = [
  {
    slug: "content-creator-reels",
    title: "Content Creator - Reels & Shorts",
    team: "Growth",
    employmentType: "internship",
    employmentTypes: ["internship", "part-time"],
    locationType: "remote",
    location: "India",
    experience: "Any student or creator - your reels are your resume",
    commitment: "3-4 videos a week - roughly 8-12 hours",
    duration: "3 months, extendable to 6",
    compensation: COMP,
    order: 65,
    blurb: "Make the reels developers actually watch - funny, useful, and about coding, building and life as a developer, through DeVert.",
    description:
      "As a Content Creator you will make the short videos that bring developers to DeVert - funny, useful and true to developer life: coding humour, a clever trick explained in one take, the ups and downs of building, and the wins of a developer community.\n\nThis role exists to grow DeVert's voice and reach. Every video you make is how a new developer first meets DeVert.",
    responsibilities: [
      "Plan, shoot and edit short-form videos for Instagram, YouTube Shorts and LinkedIn - funny, informative or both",
      "Turn what happens on DeVert into content developers want to share",
      "Ride trends quickly without getting cringe, and keep the facts right",
      "Track what works - views, saves, shares, follows - and do more of it",
    ],
    requirements: [
      "Reels, shorts or videos you have made - share links; views matter less than taste",
      "A sense of humour that lands with developers and students",
      "Basic editing on your phone or laptop (CapCut, VN, Premiere or similar)",
      "Consistency: a steady posting rhythm beats one viral video",
    ],
    niceToHave: [
      "You code, or you are learning - it makes the jokes and explainers accurate",
      "Comfortable on camera, or good at faceless formats",
      "Graphic design or motion graphics",
    ],
    perks: [
      "Creative freedom, with credit on everything you make",
      "Your work in front of students across colleges",
      "Remote and flexible around classes",
      "A portfolio and a reference for real growth you drove",
    ],
  },
  {
    slug: "full-stack-engineer",
    title: "Full-Stack Engineer",
    team: "Engineering",
    employmentType: "part-time",
    employmentTypes: ["part-time", "internship"],
    locationType: "remote",
    location: "India",
    experience: "Student or early-career - shipped work matters more than years",
    commitment: "15-25 hours per week, flexible",
    duration: "Internship: 3-6 months. Part-time: ongoing, reviewed every 3 months",
    compensation: COMP,
    order: 60,
    blurb: "Own DeVert features end to end - frontend, backend, data and security - and help the platform grow fast and stay reliable.",
    description:
      "As a Full-Stack Engineer you will build the features developers use on DeVert every day, end to end - from how the data is shaped to the screen it lands on. You will work directly with the founders and own complete features rather than tickets.\n\nThis role exists to multiply what DeVert can ship, and to keep the platform fast, reliable and secure as it grows. Every feature you own is one the founders no longer carry alone.",
    responsibilities: [
      "Design, build and own complete product features across the DeVert platform",
      "Design data models and build secure, reliable backend logic",
      "Improve performance, reliability and security across the platform",
      "Fix what you find, and leave every file you touch clearer than you found it",
    ],
    requirements: [
      "Real React work you can walk us through - a repo, a product, a side project",
      "Comfortable with async data, databases, and reading other people's code",
      "Careful with anything that touches money, scores or user data",
      "Writes clearly - most decisions here happen in text",
    ],
    niceToHave: [
      "Firebase, serverless backends or database security in production",
      "Next.js, SEO, and performance on low-end phones",
      "Backend experience in any language - Node.js, Java or Python",
    ],
    perks: [
      "Ownership of features used by developers across India",
      "Direct work with the founders, and a real say in how things are built",
      "Remote and flexible around classes or another job",
      "A strong reference for work you actually shipped",
    ],
  },
  {
    slug: "qa-release-tester",
    title: "QA & Release Tester",
    team: "Engineering",
    employmentType: "internship",
    locationType: "remote",
    location: "India",
    experience: "Student (any year) - curiosity over credentials",
    commitment: "10-15 hours per week, flexible",
    duration: "3 months, extendable to 6",
    compensation: COMP,
    order: 70,
    blurb: "Be the reason a bug never reaches a user: test every DeVert release across devices, browsers and real-world conditions.",
    description:
      "As a QA & Release Tester you will make sure every DeVert release works the way it should before it reaches users - across devices, browsers and real-world network conditions. You will own the quality of each release, write bug reports a developer can act on immediately, and grow into test automation.\n\nThis role exists so that quality is never an afterthought: you are the last line between a change and the developers who depend on it.",
    responsibilities: [
      "Test every release before and after it goes live, against a checklist you build and keep current",
      "Test on real devices and slow connections - most of our users are on mid-range Android phones",
      "Write clear bug reports: steps, expected, actual, screenshot or recording",
      "Help build and grow automated test suites",
    ],
    requirements: [
      "Notices when something is slightly off, and cannot leave it alone",
      "Clear, precise writing",
      "Basic comfort with a browser's developer tools",
      "Reliable: a release checklist only works if it is actually run",
    ],
    niceToHave: [
      "Some coding in any language, or interest in learning test automation (Playwright)",
      "You have used DeVert yourself",
    ],
    perks: [
      "Learn how a real product is built and shipped, from the inside",
      "A path into automation and engineering work",
      "Remote and flexible around classes",
      "A reference that says what you caught",
    ],
  },
  {
    slug: "content-engineer",
    title: "Content Engineer",
    team: "Content",
    employmentType: "internship",
    locationType: "remote",
    location: "India",
    experience: "Strong DSA or CS fundamentals - current student or recent graduate",
    commitment: "10-20 hours per week, flexible",
    duration: "3 months, extendable to 6",
    compensation: COMP,
    order: 80,
    blurb: "Build the problems, test cases and learning content behind DeVert - verified to the last detail, for developers who are judged on it.",
    description:
      "As a Content Engineer you will create and verify the learning content developers rely on - coding problems, test cases, explanations and practice material. Accuracy is the job: a wrong answer key marks a correct developer wrong, and a missing test case lets a wrong solution pass.\n\nThis role exists to keep DeVert's content trustworthy as it grows - the foundation everything else, including our AI, is built on.",
    responsibilities: [
      "Review and verify questions, answer keys and solutions before they are published",
      "Write DSA problems with correct, complete hidden test cases, including the edge cases",
      "Review and improve existing learning content, and fix what is wrong",
      "Check that grading did what you intended after every contest",
    ],
    requirements: [
      "Strong DSA and CS fundamentals - you can solve and, more importantly, explain",
      "Writes reference solutions in C++, Java or Python",
      "Cares about correctness down to a single off-by-one",
      "Clear technical writing in plain English",
    ],
    niceToHave: [
      "A strong competitive-exam rank or competitive programming record",
      "Teaching, tutoring or mentoring experience",
    ],
    perks: [
      "Your work is used by whole college cohorts and exam aspirants",
      "Remote, flexible hours - output matters, not a clock",
      "Credit for the content you author",
      "A strong reference for work you actually shipped",
    ],
  },
  {
    slug: "content-researcher",
    title: "Content Researcher",
    team: "Content",
    employmentType: "internship",
    locationType: "remote",
    location: "India",
    experience: "Student (any year)",
    commitment: "8-12 hours per week, flexible",
    duration: "3 months, extendable to 6",
    compensation: COMP,
    order: 90,
    blurb: "Find, verify and organise the information students need - interview experiences, company question patterns, opportunities and college contacts.",
    description:
      "As a Content Researcher you will find, verify and organise the information developers need to grow and get hired - interview experiences, company question patterns, opportunities, and the right contacts in colleges and companies.\n\nThis role exists to make the information on DeVert trustworthy: one verified insight is worth more than ten copied ones.",
    responsibilities: [
      "Collect and verify interview experiences and company-wise question patterns",
      "Track internship, job and hackathon opportunities worth listing",
      "Build lists of placement cells, faculty coordinators and tech clubs for DeVert's college partnerships",
      "Keep everything sourced, current and organised",
    ],
    requirements: [
      "Thorough and organised - you check a source before trusting it",
      "Good with spreadsheets and clear notes",
      "Clear written English",
      "Reliable with weekly deliverables",
    ],
    niceToHave: [
      "Understanding of campus placements from the student side",
      "Contacts in your college's placement cell or tech clubs",
    ],
    perks: [
      "See how placements and hiring really work across companies",
      "Remote and flexible around classes",
      "A reference that reflects the work you delivered",
    ],
  },
  {
    slug: "ai-engineer-rag-agents",
    title: "AI Engineer - RAG & Agents",
    team: "AI",
    employmentType: "part-time",
    employmentTypes: ["part-time", "internship"],
    locationType: "remote",
    location: "India",
    experience: "Built at least one real LLM project - student or early-career",
    commitment: "15-25 hours per week, flexible",
    duration: "Internship: 3-6 months. Part-time: ongoing, reviewed every 3 months",
    compensation: COMP,
    order: 55,
    blurb: "Build DeVert's AI layer - retrieval over our learning content, tutoring agents that explain and debug, and the evaluation that keeps them honest.",
    description:
      "As an AI Engineer you will build the intelligence layer of DeVert - AI that helps developers learn, debug and grow, grounded in DeVert's own verified content rather than generic answers. You will design retrieval (RAG) systems and agents, and the evaluation that proves they are correct and genuinely helpful.\n\nThis role exists because AI is at the core of where DeVert is going. What you build becomes the experience that sets DeVert apart.",
    responsibilities: [
      "Build retrieval pipelines over DeVert's content - chunking, embeddings, vector search, re-ranking",
      "Build agents for tutoring, code review and debugging help",
      "Set up evaluation so we know when an answer is grounded, correct and helpful - and when it is not",
      "Keep cost and latency in check across providers",
    ],
    requirements: [
      "Shipped at least one real LLM application - RAG, an agent or a tool-using assistant - you can walk us through",
      "Solid Python or TypeScript",
      "Understand embeddings, retrieval and their failure modes",
      "Honest about what a model can and cannot do",
    ],
    niceToHave: [
      "LLM evaluation, or ML fundamentals beyond API calls",
      "Experience with vector databases or serverless backends",
      "A strong DSA background - our content is technical",
    ],
    perks: [
      "Build the core of what DeVert is becoming",
      "Real users and real data to evaluate against",
      "Remote and flexible",
      "Direct work with the founders",
    ],
  },
  {
    // Named by the owner. "DeVert Campus Leader" deliberately shares the
    // product's name: the role IS DeVert's student lead at one college,
    // including bringing that college onto the DeVert Campus platform. The
    // description still says in so many words that DeVert Campus is the
    // product and this is a student role, so nobody applies thinking it is a
    // job at a separate company. Never "Campus DeVert" - that reads as a
    // second product.
    slug: "devert-campus-leader",
    title: "DeVert Campus Leader",
    team: "Community",
    employmentType: "part-time",
    employmentTypes: ["part-time", "internship"],
    locationType: "remote",
    location: "India",
    experience: "Current college student (any year)",
    commitment: "5-8 hours per week, around your classes",
    duration: "One academic year, renewable",
    compensation: COMP,
    order: 50,
    blurb: "Lead DeVert at your college - build the student developer community there and bring your campus onto DeVert.",
    description:
      "The DeVert Campus Leader is DeVert's representative at one college. You build a developer community there, bring together a core team, run sessions and events, and become the person your peers turn to when they want to grow as developers.\n\nThis role exists so that every college has someone who makes developer culture happen on the ground - and who connects their campus with DeVert. One Campus Leader per college; part-time, and built to fit around your classes.",
    responsibilities: [
      "Start the DeVert community at your college and recruit a core team of 3 to 6 students",
      "Run at least two sessions a month - coding nights, DSA workshops, project demos, contest practice",
      "Get your peers learning, practising and building on DeVert - and help them stay consistent",
      "Be DeVert's point of contact with your college's placement cell, faculty and tech clubs",
      "Share what is working and what is not with the DeVert team every two weeks",
    ],
    requirements: [
      "Currently enrolled in a college in India, in any year and any branch",
      "You code, and you enjoy helping others get better at it",
      "Comfortable speaking in front of a room and online",
      "Reliable: you do what you said you would, without being chased",
    ],
    niceToHave: [
      "Have led or helped run a tech club, fest, hackathon or study group",
      "Active on LinkedIn, GitHub or a developer community",
      "Know your college's placement cell or faculty coordinators",
    ],
    perks: [
      "Direct line to the DeVert founding team",
      "Early access to new DeVert features, and a say in what gets built",
      "Your college community and your events featured on DeVert",
      "A letter of recommendation from the founders for Campus Leaders who deliver",
    ],
  },
  {
    slug: "community-growth-intern",
    title: "Community & Growth Intern",
    team: "Community",
    employmentType: "internship",
    locationType: "remote",
    location: "India",
    experience: "Student or fresher",
    order: 300,
    blurb: "Run the DeVert Campus Leader programme and the events that bring developers onto the platform.",
    description:
      "DeVert grows through developers who already know other developers - DeVert Campus Leaders, hackathons, and communities that were not built by a marketing team. This role runs that: the Campus Leader programme end to end, event operations, and the parts of the platform where people actually talk to each other.\n\nPaid, real ownership, and not a shadowing exercise.",
    responsibilities: [
      "Run the DeVert Campus Leader programme - recruiting, onboarding and supporting Campus Leaders",
      "Help operate hackathons and events from registration through results",
      "Keep the community surfaces alive: Pulse, communities, broadcasts",
      "Report honestly on what is working and what is not",
    ],
    requirements: [
      "Currently a student or a recent graduate",
      "Comfortable talking to strangers, on and off the internet",
      "Organised enough to run an event without being chased",
      "Writes well enough that your announcements do not need rewriting",
    ],
    niceToHave: [
      "Ran a college tech club, fest or community before",
      "A developer audience of your own, however small",
    ],
    perks: [
      "Paid internship",
      "Fully remote, flexible around classes",
      "A real reference and real ownership, not a certificate",
    ],
  },
];

async function main() {
  console.log(`Seeding ${ROLES.length} job openings${DRY_RUN ? " (DRY RUN - nothing will be written)" : ""}...\n`);

  let created = 0;
  let updated = 0;

  for (const role of ROLES) {
    if (ONLY && role.slug !== ONLY) continue;
    const ref = db.doc(`job_openings/${role.slug}`);
    const snap = await ref.get();
    const exists = snap.exists;

    const payload = {
      ...role,
      status: exists ? snap.data().status : "draft",
      validThrough: exists ? (snap.data().validThrough ?? null) : null,
      // Stamped once. A re-run must never move datePosted - see the header.
      ...(exists ? {} : { postedAt: admin.firestore.FieldValue.serverTimestamp() }),
    };

    if (!DRY_RUN) await ref.set(payload, { merge: true });

    console.log(`  ${exists ? "updated" : "created"}  ${role.slug.padEnd(26)} ${exists ? `(status kept: ${snap.data().status})` : "(status: draft)"}`);
    if (exists) updated++; else created++;
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  if (!DRY_RUN) {
    console.log("\nNothing is live yet - every new role is a DRAFT.");
    console.log("Publish from /admin -> CONTENT -> CAREERS - JOB OPENINGS.");
    console.log("Its /careers/{slug} page appears on the next deploy (output: export builds those at build time).");
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
