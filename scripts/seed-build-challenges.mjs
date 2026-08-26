// Seeds starter content into system/build.challenges[] so /build isn't an
// empty catalog at launch. Run once: node scripts/seed-build-challenges.mjs
// (requires scripts/service-account.json, gitignored). Re-running overwrites
// the whole array - fine pre-launch, but check the admin BUILD CHALLENGES
// panel first if real challenges have already been added by hand.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const challenges = [
  {
    id: "url-shortener",
    title: "Build a URL Shortener",
    category: "web",
    difficulty: "BEGINNER",
    diffColor: "#00FF41",
    brief: "Turn long URLs into short, shareable ones.",
    description: "Build a service that takes a long URL and returns a short code that redirects back to it. Cover collision-safe code generation, a redirect endpoint, and basic click tracking.",
    stack: ["Any backend language", "A database", "Redis (optional, for caching)"],
    locked: false,
  },
  {
    id: "personal-finance-tracker",
    title: "Personal Finance Tracker",
    category: "mobile",
    difficulty: "BEGINNER",
    diffColor: "#00FF41",
    brief: "Track income, expenses, and spending trends.",
    description: "A mobile app for logging transactions, categorizing spend, and visualizing where money goes each month. Local storage is fine to start - sync is a stretch goal.",
    stack: ["React Native or Flutter", "SQLite or local storage", "A charting library"],
    locked: false,
  },
  {
    id: "realtime-chatbot",
    title: "Real-Time Chatbot",
    category: "ai",
    difficulty: "INTERMEDIATE",
    diffColor: "#FF9500",
    brief: "A conversational bot with real context handling.",
    description: "Build a chatbot that holds a real conversation - handles context across turns, streams responses, and has at least one grounded skill (answering from a doc set, calling a tool, etc), not just a single prompt-response loop.",
    stack: ["An LLM API", "WebSockets or SSE for streaming", "A vector store (optional)"],
    locked: false,
  },
  {
    id: "rate-limiter-job-queue",
    title: "Rate Limiter / Job Queue Service",
    category: "backend",
    difficulty: "INTERMEDIATE",
    diffColor: "#FF9500",
    brief: "Throttle requests and process background jobs reliably.",
    description: "Build a standalone service that either rate-limits incoming requests (token bucket or sliding window) or queues and processes background jobs with retries and backoff. Pick one and make it correct under concurrent load.",
    stack: ["Any backend language", "Redis or an in-memory store", "A worker process"],
    locked: false,
  },
  {
    id: "collaborative-markdown-editor",
    title: "Collaborative Markdown Editor",
    category: "web",
    difficulty: "ADVANCED",
    diffColor: "#FF3B3B",
    brief: "Real-time multi-user editing, no conflicts.",
    description: "A markdown editor where multiple users can type in the same document at once without stomping each other's changes. Requires real conflict resolution (OT or CRDT), not just last-write-wins.",
    stack: ["WebSockets", "A CRDT library (e.g. Yjs) or hand-rolled OT", "A frontend framework"],
    locked: false,
  },
  {
    id: "distributed-cache",
    title: "Distributed Cache (from scratch)",
    category: "backend",
    difficulty: "ADVANCED",
    diffColor: "#FF3B3B",
    brief: "A Redis-alike, built from first principles.",
    description: "Build an in-memory key-value cache with TTL eviction, an LRU/LFU policy, and a simple wire protocol - bonus points for supporting more than one node with basic replication or sharding.",
    stack: ["Any systems-capable language", "TCP sockets", "A serialization format"],
    locked: false,
  },
  {
    id: "ai-resume-reviewer",
    title: "AI-Powered Resume Reviewer",
    category: "ai",
    difficulty: "INTERMEDIATE",
    diffColor: "#FF9500",
    brief: "Upload a resume, get structured, actionable feedback.",
    description: "Parse an uploaded resume (PDF/DOCX), extract structured sections, and use an LLM to score it against a target role with specific, actionable feedback - not just a generic summary.",
    stack: ["An LLM API", "A PDF/DOCX parser", "A simple upload UI"],
    locked: false,
  },
  {
    id: "offline-habit-tracker",
    title: "Offline-First Habit Tracker",
    category: "mobile",
    difficulty: "INTERMEDIATE",
    diffColor: "#FF9500",
    brief: "Track daily habits, fully usable with no connection.",
    description: "A habit tracker that works completely offline and syncs cleanly once a connection returns - handle streaks, reminders, and conflict-free sync if the same habit was logged on two devices.",
    stack: ["React Native or Flutter", "A local-first database", "A sync strategy (last-write-wins or CRDT)"],
    locked: false,
  },
];

await db.doc("system/build").set({
  challenges,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

console.log(`system/build seeded with ${challenges.length} challenges.`);
