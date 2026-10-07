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

const ROLES = [
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
    locationType: "remote",
    location: "India",
    experience: "Current college student (any year)",
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
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    team: "Engineering",
    employmentType: "full-time",
    locationType: "hybrid",
    location: "Hyderabad",
    experience: "1-3 years",
    order: 100,
    blurb: "Own whole surfaces of the product - Arena, Pulse, Shipyard - end to end, in Next.js and Firestore.",
    description:
      "DeVert runs as a static Next.js export talking straight to Firestore from the browser, with no application server in the request path. That makes the frontend the product: what you build is what users get, and there is no backend team to hide a bad interaction behind.\n\nYou would own entire surfaces rather than tickets - a module like Arena or Shipyard, from the data model through the interaction design to the thing that ships.",
    responsibilities: [
      "Build and own complete product surfaces in Next.js (App Router) and React",
      "Model and query Firestore directly, including live onSnapshot listeners",
      "Hold the line on the neon-terminal design system rather than reinventing it per screen",
      "Write the Firestore security rules for whatever you build - they are the real authority boundary here",
      "Keep the static export fast on a mid-range Android phone on Indian mobile data",
    ],
    requirements: [
      "Real, shipped React work you can walk us through - a repo, a product, a side project",
      "Comfortable with async data, caching and the parts of state management that actually bite",
      "Can read a design and improve it, rather than only implementing it pixel for pixel",
      "Writes clearly - most decisions here get made in text, not meetings",
    ],
    niceToHave: [
      "Firebase or another BaaS in production, especially security rules",
      "Next.js static export, SEO and structured data",
      "An eye for motion and micro-interaction",
    ],
    perks: [
      "Full ownership of a product surface used by real developers",
      "Flexible hybrid working - see the Workplace Policy",
      "Direct say in the roadmap, not a backlog handed down",
      "Hardware you need to do the work",
    ],
  },
  {
    slug: "content-engineer-dsa",
    title: "Content Engineer - DSA & CS Core",
    team: "Content",
    employmentType: "full-time",
    locationType: "remote",
    location: "India",
    experience: "0-2 years",
    order: 200,
    blurb: "Write the problems, lessons and test cases behind DeVert Campus - for students who will be judged on them.",
    description:
      "DeVert Campus teaches DSA, CS core subjects, aptitude and GATE prep to college students, and runs proctored contests their placement cells actually use. Someone has to author that: the problems, the hidden test cases they are graded against, the lesson content, and the explanations that make a wrong answer make sense.\n\nThis is an engineering job that outputs content. If a hidden test case is wrong, a student's score is wrong.",
    responsibilities: [
      "Author DSA problems with correct, complete hidden test cases including the edge cases",
      "Write lesson content for CS core subjects and programming languages",
      "Build and verify contest question sets, then check the grading did what you intended",
      "Audit existing content for errors - a wrong explanation is worse than a missing one",
    ],
    requirements: [
      "Strong DSA fundamentals - you can solve and, more importantly, explain",
      "Can write code in at least one of C++, Java or Python well enough to build reference solutions",
      "Genuinely good technical writing, in plain English",
      "Care about correctness at the level of a single off-by-one in a test case",
    ],
    niceToHave: [
      "Competitive programming background",
      "Taught, tutored or mentored before",
      "GATE or placement-prep experience from the student side",
    ],
    perks: [
      "Fully remote",
      "Your work is used by entire college cohorts, not an anonymous audience",
      "Flexible hours - output matters, not a clock",
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
    blurb: "Run the campus ambassador programme and the events that bring developers onto the platform.",
    description:
      "DeVert grows through developers who already know other developers - campus ambassadors, hackathons, and communities that were not built by a marketing team. This role runs that: the ambassador programme end to end, event operations, and the parts of the platform where people actually talk to each other.\n\nPaid, real ownership, and not a shadowing exercise.",
    responsibilities: [
      "Run the campus ambassador programme - recruiting, onboarding and supporting ambassadors",
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
