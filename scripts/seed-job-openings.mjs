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
    blurb: "Make the reels students actually watch - funny, useful, and about coding, placements and life as a developer, through DeVert.",
    description:
      "Most coding content is either boring or wrong. We want the opposite: short videos that make a student laugh, learn something in 30 seconds, and want to try it themselves on DeVert.\n\n" +
      "You would make Instagram Reels, YouTube Shorts and LinkedIn videos - placement-season humour, a DSA trick explained in one take, a DeVert 100 day in a minute, an Arena battle, GATE prep reality - and grow DeVert's audience among students. You get the platform, the content and real stories from the community; you bring the hook, the edit and the timing.",
    responsibilities: [
      "Plan, shoot and edit short-form videos for Instagram, YouTube Shorts and LinkedIn - funny, informative or both",
      "Turn DeVert features - DeVert 100, Arena, DeVert Campus, GATE prep - into content students want to share",
      "Ride trends quickly without getting cringe, and keep the facts right",
      "Track what works - views, saves, shares, follows - and do more of it",
    ],
    requirements: [
      "Reels, shorts or videos you have made - share links; views matter less than taste",
      "A sense of humour that lands with college students",
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
    blurb: "Own DeVert features end to end - Next.js, Firestore, security rules and Cloud Functions - across devert.in, Campus and Careers.",
    description:
      "DeVert is three Next.js apps (devert.in, DeVert Campus, DeVert Careers) talking directly to Firestore, with Firebase Cloud Functions and a small Spring Boot service for the few things a browser cannot do safely. There is no layer to hide behind: what you build is what students use.\n\n" +
      "You would take whole features off the founders' plates - from the data model and the security rules through the interface - rather than tickets. One of the first: moving coin and reward granting out of the browser and into Cloud Functions, where it belongs.",
    responsibilities: [
      "Build and own complete features in Next.js (App Router) and React across all three apps",
      "Model data in Firestore and write the security rules that protect it - they are the real authority boundary here",
      "Move trust-sensitive logic (rewards, coins, grading) into Cloud Functions",
      "Fix what you find, and leave every file you touch clearer than you found it",
    ],
    requirements: [
      "Real React work you can walk us through - a repo, a product, a side project",
      "Comfortable with async data, Firestore or a similar database, and reading other people's code",
      "Careful with anything that touches money, scores or user data",
      "Writes clearly - most decisions here happen in text",
    ],
    niceToHave: [
      "Firebase security rules or Cloud Functions in production",
      "Next.js static export, SEO and performance on low-end phones",
      "Some Java or Spring Boot",
    ],
    perks: [
      "Ownership of features used by students across colleges",
      "Direct work with the founders, and a real say in the architecture",
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
    blurb: "Be the reason a bug never reaches a student: test every DeVert release across three sites, real phones and five programming languages.",
    description:
      "DeVert ships often: devert.in, DeVert Campus, DeVert Careers, an admin console, contests, payouts, and a code editor that runs Java, Python, C++, JavaScript and C. Every bug a student finds before we do costs their trust.\n\n" +
      "You would own quality: a checklist for every release, testing on real phones and slow networks, bug reports a developer can act on in one read - and, as you grow into it, automated tests that catch regressions for us.",
    responsibilities: [
      "Test every release before and after it goes live, against a checklist you build and keep current",
      "Test on real devices and slow connections - most of our users are on mid-range Android phones",
      "Write clear bug reports: steps, expected, actual, screenshot or recording",
      "Grow the automated test suites - security-rule tests, end-to-end browser tests",
    ],
    requirements: [
      "Notices when something is slightly off, and cannot leave it alone",
      "Clear, precise writing",
      "Basic comfort with a browser's developer tools",
      "Reliable: a release checklist only works if it is actually run",
    ],
    niceToHave: [
      "Some coding in any language, or interest in learning test automation (Playwright)",
      "You have used DeVert, DeVert Campus or DeVert 100 yourself",
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
    blurb: "Build the problems, test cases and learning content behind DeVert - verified to the last detail, for students who are judged on it.",
    description:
      "DeVert teaches DSA, CS fundamentals and exam preparation, and grades code against hidden test cases. That content has to be right: a wrong answer key marks a correct student wrong, and a missing test case lets a wrong solution pass.\n\n" +
      "There is real work waiting - for example, previous-year exam questions imported as drafts that cannot be published until someone verifies their answers and restores their figures. You would also write coding problems with complete hidden test cases, and keep DeVert 100's writeups and test cases correct.",
    responsibilities: [
      "Verify previous-year exam questions - answer keys, missing symbols and figures - so they can be published",
      "Write DSA problems with correct, complete hidden test cases, including the edge cases",
      "Review and improve lesson and DeVert 100 content, and fix what is wrong",
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
      "Students come to DeVert to get placed. That needs more than practice problems: real interview experiences, the question patterns specific companies use, live internship and job openings, and - for DeVert Campus - the right people at each college's placement cell.\n\n" +
      "You would gather that information, check it, and put it into a shape the platform can use. Accuracy over volume: one verified interview experience beats ten copied ones.",
    responsibilities: [
      "Collect and verify interview experiences and company-wise question patterns",
      "Track internship, job and hackathon opportunities worth listing",
      "Build lists of placement cells, faculty coordinators and tech clubs for DeVert Campus outreach",
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
      "AI is where DeVert is heading. We already run an AI gateway that routes requests across providers (Groq, Gemini, OpenRouter and Claude) behind one OpenAI-compatible endpoint. What comes next is built on top of it: retrieval (RAG) over DeVert's own content - DSA deep dives, GATE questions, lessons - and agents that can explain a concept, review a learner's code, or work out why it fails a test case.\n\n" +
      "This is not prompt-pasting. Answers students act on have to be grounded in our content, measurable, and cheap enough to run for everyone.",
    responsibilities: [
      "Build retrieval pipelines over DeVert's content - chunking, embeddings, vector search, re-ranking",
      "Build agents for tutoring, code review and debugging help, on the existing AI gateway",
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
      "Experience with Firebase, Cloud Functions or a vector database",
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
      "The DeVert Campus Leader is DeVert's student lead at one college. You start the DeVert community there, build a small core team, run sessions and coding events, and become the person your juniors and batchmates come to when they want to get better at building and problem solving.\n\n" +
      "About the name: DeVert Campus (campus.devert.in) is our learning platform for colleges - DSA, CS core, aptitude, GATE prep and proctored contests. A DeVert Campus Leader is a student, not an employee of a separate company: you lead DeVert at your college, and part of that is bringing your batch and your placement cell onto DeVert Campus, DeVert 100 and DeVert Arena.\n\n" +
      "One Campus Leader per college. It is part-time and built to fit around your classes.",
    responsibilities: [
      "Start the DeVert community at your college and recruit a core team of 3 to 6 students",
      "Run at least two sessions a month - coding nights, DSA workshops, project demos, contest practice",
      "Bring your batch into DeVert 100 and DeVert Arena, and help them stay consistent",
      "Be the bridge to your college's placement cell, faculty and tech clubs for DeVert Campus",
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
