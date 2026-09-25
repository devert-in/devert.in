"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

// One real thing worth knowing, every day.
//
// This replaced a "DSA Fundamentals - Day 1: The Two-Pointer Technique" card
// that sat at 0% for everyone and pointed at a course nobody was enrolled in -
// prime dashboard space spent telling you that you had not started something.
//
// The rule for what goes in here: it must be TRUE, SPECIFIC and CHECKABLE. Not
// "write clean code" - a fact with a mechanism behind it, the kind of thing
// that makes you go and look something up. Anything vague or motivational
// belongs somewhere else, or nowhere.
//
// Everyone sees the same tip on the same day (see the index maths below), so
// two people on the team can talk about "today's one" - which is the whole
// reason to rotate daily rather than randomise per visit.
const TIPS = [
  {
    tag: "NETWORKING",
    title: "WebSockets are not just faster HTTP",
    body: "An HTTP request is one round trip the client always starts. A WebSocket upgrades that connection once, then either side can send a frame at any time. That is why chat, live cursors and price tickers use them - not raw speed, but the server being able to speak first.",
  },
  {
    tag: "DATABASES",
    title: "An index on (a, b) also serves queries on a - but not on b",
    body: "A composite index is sorted by the first column, then the second. So it answers WHERE a = ? and WHERE a = ? AND b = ?, but a query on b alone has to scan. This is the leftmost-prefix rule, and it is why column order in an index matters more than which columns you picked.",
  },
  {
    tag: "JAVASCRIPT",
    title: "0.1 + 0.2 !== 0.3",
    body: "IEEE-754 doubles store binary fractions. One tenth is as unrepresentable in binary as one third is in decimal, so the sum lands on 0.30000000000000004. Never compare floats with ===, and never store money in one - use integer paise, or a decimal type.",
  },
  {
    tag: "HTTP",
    title: "A 301 is forever. Browsers cache it hard",
    body: "Send a 301 by mistake and returning visitors keep hitting the old target even after you fix the server, because their browser never asks again. Use 302 (or 307) while you are unsure, and only promote to 301 once the move is permanent.",
  },
  {
    tag: "PERFORMANCE",
    title: "The N+1 query is the most common slow endpoint",
    body: "Fetch 50 posts, then loop and fetch each author: that is 51 round trips, and it looks fine on a dev machine with 3 rows. Fetch the authors in one query keyed by id, or use a join. The symptom is an endpoint that gets slower in exact proportion to the data.",
  },
  {
    tag: "SECURITY",
    title: "bcrypt is slow on purpose",
    body: "A fast hash is a bad password hash. bcrypt, scrypt and argon2 have a tunable work factor precisely so that an attacker with a stolen table cannot try billions of guesses a second. If your password hashing is fast, that is a bug.",
  },
  {
    tag: "BROWSERS",
    title: "localStorage is synchronous and blocks the main thread",
    body: "Every read and write is blocking, and the whole store is serialised to disk. A few kilobytes is fine; putting a large cache in there stalls rendering. IndexedDB is asynchronous and is the right tool once you are past a trivial amount of data.",
  },
  {
    tag: "GIT",
    title: "git pull is just fetch + merge",
    body: "That is why it can create a merge commit you did not ask for. `git pull --rebase` replays your commits on top instead, keeping history linear. Knowing pull is two commands makes almost every confusing pull result explainable.",
  },
  {
    tag: "APIS",
    title: "Idempotency is what makes retries safe",
    body: "GET, PUT and DELETE should give the same result if called five times. POST usually does not - which is why payment APIs make you send an idempotency key. Without one, a client retrying after a timeout can charge a card twice.",
  },
  {
    tag: "CORS",
    title: "A preflight is a real extra round trip",
    body: "Any request with a custom header or a non-simple content type triggers an OPTIONS call before the real one. That doubles latency on every call until you set Access-Control-Max-Age so the browser caches the preflight result.",
  },
  {
    tag: "DNS",
    title: "TTL is why your DNS change 'has not worked yet'",
    body: "Resolvers cache a record for its TTL, and they will not ask again until it expires. Lower the TTL to a few minutes a day BEFORE you plan to move a domain, and the cutover takes minutes instead of a day.",
  },
  {
    tag: "JAVA",
    title: "String concatenation in a loop builds a new object every pass",
    body: "Strings are immutable, so s += x allocates a fresh one each iteration - quadratic work for a linear-looking loop. StringBuilder mutates one buffer. The compiler optimises simple cases, but not concatenation inside a loop.",
  },
  {
    tag: "UI",
    title: "Debounce and throttle solve different problems",
    body: "Debounce waits for the input to stop - right for a search box. Throttle runs at most once per interval - right for scroll and resize, where you want steady updates rather than one at the end. Using the wrong one makes the UI feel broken in a way that is hard to name.",
  },
  {
    tag: "CACHING",
    title: "Cache invalidation is hard because of the second writer",
    body: "One process writing and reading its own cache is easy. The difficulty starts when another process, another server or a background job changes the underlying data and your cache has no idea. Decide who is allowed to write before you decide the TTL.",
  },
  {
    tag: "DATABASES",
    title: "A UUID primary key can fragment a clustered index",
    body: "Random UUIDs insert in random positions, so pages split constantly. Sequential ids append at the end. If you need UUIDs, use a time-ordered variant (UUIDv7 or ULID) and you keep the uniqueness without the write amplification.",
  },
  {
    tag: "HTTP",
    title: "401 means 'who are you', 403 means 'not you'",
    body: "401 Unauthorized is actually unauthenticated - log in and retry. 403 Forbidden means you are authenticated and still not allowed, so retrying with the same credentials is pointless. Sending 403 for a missing token makes clients retry forever.",
  },
  {
    tag: "REGEX",
    title: "Nested quantifiers can hang your server",
    body: "A pattern like (a+)+$ takes exponential time on a non-matching string - one request can pin a CPU core. It is called catastrophic backtracking, and it is a real denial-of-service vector whenever a regex touches user input.",
  },
  {
    tag: "CONCURRENCY",
    title: "Reading then writing is not atomic",
    body: "count = count + 1 is three operations: read, add, store. Two threads interleaving there lose an increment. Use an atomic type, a transaction, or a database-side increment - and note that the bug only shows up under load, which is when you can least afford it.",
  },
  {
    tag: "CSS",
    title: "Only transform and opacity animate cheaply",
    body: "Animating width, top or margin makes the browser recalculate layout every frame. transform and opacity are handled by the compositor and skip layout and paint entirely. Same visual result, wildly different frame budget.",
  },
  {
    tag: "TIME",
    title: "Store UTC, render local",
    body: "Local time is ambiguous twice a year, and offsets change by government decision. Store an instant in UTC, keep the user's timezone separately, and convert only when displaying. Storing '14:30' with no zone loses information you cannot recover.",
  },
  {
    tag: "SECURITY",
    title: "An HttpOnly cookie is invisible to JavaScript",
    body: "That is the point: if XSS runs on your page, it cannot read the token. A JWT in localStorage can be exfiltrated by any injected script. HttpOnly plus SameSite is not old-fashioned - it is the reason session cookies survived.",
  },
  {
    tag: "ALGORITHMS",
    title: "Hash map lookups are O(1) on average, not always",
    body: "With adversarial or pathological keys everything lands in one bucket and lookups degrade toward O(n). It almost never bites in practice, but knowing the difference between average and worst case is what an interviewer is checking when they ask.",
  },
  {
    tag: "BUILD",
    title: "A lockfile is the only thing making your build reproducible",
    body: "package.json says ^1.2.0, which means 'anything under 2.0'. Without the lockfile, two installs a week apart can produce different trees. That is why npm ci exists - it installs the lockfile exactly and fails if the two disagree.",
  },
  {
    tag: "NETWORKING",
    title: "A CDN mostly buys you latency, not bandwidth",
    body: "The win is that the bytes start 20ms away instead of 200ms, and TCP slow start gets up to speed sooner. For a small asset the round trip dominates the transfer, which is why a CDN helps a 5KB file more than you would expect.",
  },
  {
    tag: "ERRORS",
    title: "An empty catch block is where outages come from",
    body: "Swallowing an exception turns a loud failure into a quiet wrong answer. If you genuinely can continue, log why and say so in a comment. `catch {}` with no note is the single most expensive line in most codebases.",
  },
  {
    tag: "JAVASCRIPT",
    title: "await in a loop makes requests serial",
    body: "Ten awaited calls at 200ms each take two seconds. Promise.all runs them together and takes 200ms. Use the loop only when each call genuinely depends on the previous result - otherwise you are paying latency ten times over.",
  },
  {
    tag: "DATABASES",
    title: "SELECT * breaks when someone adds a column",
    body: "It also ships bytes you never read and defeats covering indexes. Naming columns turns a schema change into a compile-time or query-time error instead of a silent behaviour change three deploys later.",
  },
  {
    tag: "LINUX",
    title: "Deleting a file does not free space if a process still has it open",
    body: "The directory entry goes, the inode does not, until the last file descriptor closes. That is why `rm` on a huge log leaves the disk full and `lsof +L1` finds it. Truncate it instead, or restart the writer.",
  },
  {
    tag: "INTERVIEWS",
    title: "Say the brute force out loud first",
    body: "It proves you understood the problem, it gives you a correct baseline, and the optimisation usually falls out of asking what the brute force repeats. Candidates who jump straight at the clever answer and stall have nothing to fall back on.",
  },
  {
    tag: "HTTP",
    title: "A 200 with an error in the body is a bug",
    body: "Clients, proxies and caches all read the status code. Returning 200 with {\"error\": ...} means a retry layer sees success, a cache may store the failure, and monitoring reports everything is fine. Use the status code the situation actually calls for.",
  },
];

// Deterministic, and the same for everyone on a given day.
//
// Keyed on the IST calendar date rather than a random pick per render, so the
// card does not change when you refresh, and so two people can compare notes on
// the same tip. The list length and 365 are coprime-ish enough that the cycle
// does not visibly repeat within a year.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function tipForToday(now = new Date()) {
  const dayIndex = Math.floor((now.getTime() + IST_OFFSET_MS) / 86400000);
  return TIPS[((dayIndex % TIPS.length) + TIPS.length) % TIPS.length];
}

export function DailyDevTip() {
  const tip = tipForToday();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="terminal-window overflow-hidden mb-5">
      <div className="terminal-header">
        <Lightbulb size={11} className="ml-2" style={{ color: "#FFD700" }} />
        <span className="font-mono text-[10px] text-white/25 ml-1">todays_tip.md</span>
        <span className="font-mono text-[10px] text-white/22 ml-auto mr-2">{tip.tag}</span>
      </div>
      <div className="p-5">
        <h3 className="font-sans text-base sm:text-lg font-bold text-white mb-2">{tip.title}</h3>
        <p className="font-mono text-[12.5px] text-white/55 leading-relaxed">{tip.body}</p>
      </div>
    </motion.div>
  );
}
