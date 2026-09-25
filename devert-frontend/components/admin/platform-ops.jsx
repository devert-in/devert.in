"use client";

// Operations > APIs & services, and Operations > Database - the "what is
// DeVert actually running on, and is it up" view.
//
// Everything shown is measured or read live, never assumed:
// - A service is "Up" only after a request to it came back, with the
//   latency it took. Things a browser cannot safely probe (callable Cloud
//   Functions, which would EXECUTE if called) are listed as inventory, not
//   given a green light they never earned.
// - The database explorer is READ-ONLY on purpose. Deleting or editing raw
//   documents here would bypass every panel's own validation and the coin
//   economy's bounded-delta rules (CLAUDE.md) - use the owning section for
//   changes.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection, getCountFromServer, getDocs, getDoc, doc, query, limit, startAfter,
} from "firebase/firestore";
import {
  Server, Database, RefreshCw, CheckCircle2, XCircle, Loader2, Cloud, Download, Search, Braces,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { KIT, StatGrid, Pill, Drawer, SecondaryButton, fmt } from "@/components/admin/admin-kit";

// ── APIs & services ───────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "";

// Each probe resolves to { ok, ms, detail }. `no-cors` requests resolve
// (opaquely) whenever the server answered at all, which is exactly the
// reachability question - and they need no CORS allowance on the target.
async function timed(fn) {
  const t0 = performance.now();
  try {
    const detail = await fn();
    return { ok: true, ms: Math.round(performance.now() - t0), detail };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - t0), detail: e?.message || "Unreachable" };
  }
}

const PROBES = [
  {
    key: "firestore", name: "Cloud Firestore", kind: "Database", where: "Firebase",
    run: () => timed(async () => { await getDoc(doc(db, "system", "featureFlags")); return "Read OK"; }),
  },
  {
    key: "auth", name: "Firebase Auth", kind: "Identity", where: "Firebase",
    run: () => timed(async () => { await auth.currentUser?.getIdToken(true); return "Token refresh OK"; }),
  },
  {
    key: "backend", name: "devert-backend", kind: "API", where: API ? new URL(API).host : "not configured",
    run: () => API
      ? timed(async () => { await fetch(`${API}/actuator/health`, { mode: "no-cors", cache: "no-store" }); return "Responded"; })
      : Promise.resolve({ ok: false, ms: 0, detail: "NEXT_PUBLIC_API_URL is not set for this build" }),
  },
  {
    key: "campus", name: "campus.devert.in", kind: "Website", where: "Firebase Hosting",
    run: () => timed(async () => { await fetch("https://campus.devert.in/", { mode: "no-cors", cache: "no-store" }); return "Responded"; }),
  },
  {
    key: "careers", name: "careers.devert.in", kind: "Website", where: "Firebase Hosting",
    run: () => timed(async () => { await fetch("https://careers.devert.in/", { mode: "no-cors", cache: "no-store" }); return "Responded"; }),
  },
  {
    key: "main", name: "devert.in", kind: "Website", where: "Firebase Hosting",
    run: () => timed(async () => { await fetch("https://devert.in/", { mode: "no-cors", cache: "no-store" }); return "Responded"; }),
  },
];

// Mirrors functions/index.js and firebase.json. Inventory only - see header.
const FUNCTIONS = [
  { name: "uHandleRouter",                  trigger: "HTTP (Hosting /u/**)",       purpose: "Portfolio link previews" },
  { name: "contestPreviewRouter",           trigger: "HTTP (Hosting)",             purpose: "Contest link previews" },
  { name: "pulsePreviewRouter",             trigger: "HTTP (Hosting)",             purpose: "Pulse post link previews" },
  { name: "createRazorpayOrder",            trigger: "Callable",                   purpose: "Start a Pro payment" },
  { name: "verifyRazorpayPayment",          trigger: "Callable",                   purpose: "Confirm a payment, grant Pro" },
  { name: "razorpayWebhook",                trigger: "HTTP (Razorpay)",            purpose: "Payment webhook" },
  { name: "startFreeTrial",                 trigger: "Callable",                   purpose: "Grant a Pro trial" },
  { name: "getProctorFrame",                trigger: "Callable",                   purpose: "Fetch one proctoring frame" },
  { name: "listProctorFrames",              trigger: "Callable",                   purpose: "List proctoring frames" },
  { name: "gradeContestSubmissionOnCreate", trigger: "Firestore onCreate",         purpose: "Grade contest submissions" },
  { name: "grantStreakAchievementOnUpdate", trigger: "Firestore onUpdate",         purpose: "Award streak achievements" },
  { name: "aiGateway",                      trigger: "HTTP",                       purpose: "AI requests proxy" },
];

const BACKEND_ROUTES = [
  { path: "/api/coding/run, /submit, /arena/submit", purpose: "CodeLab execution & grading (OnlineCompiler.io)" },
  { path: "/api/contests/{id}/questions/{q}/submit", purpose: "Contest submissions" },
  { path: "/api/auth/session, /logout",              purpose: "Cross-subdomain sign-in session" },
  { path: "/api/campus/accounts/**",                 purpose: "Staff accounts for Campus" },
  { path: "/api/notify/**",                          purpose: "Transactional email (SMTP)" },
  { path: "/api/*/preview/**",                       purpose: "Link previews (pulse, contest, portfolio, campus)" },
];

function StatusCell({ r }) {
  if (!r) return <span className="inline-flex items-center gap-1.5 font-sans text-xs text-white/40"><Loader2 size={13} className="animate-spin" /> Checking</span>;
  return r.ok
    ? <span className="inline-flex items-center gap-1.5 font-sans text-xs" style={{ color: KIT.green }}><CheckCircle2 size={14} /> Up</span>
    : <span className="inline-flex items-center gap-1.5 font-sans text-xs" style={{ color: KIT.red }}><XCircle size={14} /> Down</span>;
}

function Card({ title, subtitle, action, children }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: KIT.line }}>
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

const th = "font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left px-4 sm:px-5 py-2.5";
const td = "px-4 sm:px-5 py-3 align-middle";

export function ApiServicesPanel() {
  const [results, setResults] = useState({});
  const [checkedAt, setCheckedAt] = useState(null);
  const [running, setRunning] = useState(true);
  const [round, setRound] = useState(0);

  // State is only ever set from the probes' async callbacks here; the reset
  // for a re-check happens in the click handler below.
  useEffect(() => {
    let alive = true;
    Promise.all(PROBES.map(async (p) => {
      const r = await p.run();
      if (alive) setResults((prev) => ({ ...prev, [p.key]: r }));
    })).then(() => {
      if (!alive) return;
      setCheckedAt(new Date());
      setRunning(false);
    });
    return () => { alive = false; };
  }, [round]);

  const runAll = () => { setResults({}); setRunning(true); setRound((n) => n + 1); };

  const done = Object.values(results);
  const up = done.filter((r) => r.ok).length;
  const avg = done.filter((r) => r.ok).reduce((n, r) => n + r.ms, 0) / Math.max(1, up);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Services up", value: running ? "..." : `${up} / ${PROBES.length}`, sub: checkedAt ? `Checked ${checkedAt.toLocaleTimeString()}` : "Checking now", icon: CheckCircle2, color: up === PROBES.length ? KIT.green : KIT.orange },
        { label: "Avg response", value: up ? `${Math.round(avg)} ms` : "-", sub: "From your browser", icon: Server, color: KIT.cyan },
        { label: "Cloud Functions", value: FUNCTIONS.length, sub: "Deployed from functions/", icon: Cloud, color: KIT.purple },
        { label: "Backend routes", value: BACKEND_ROUTES.length, sub: "Route groups on Cloud Run", icon: Braces, color: KIT.orange },
      ]} />

      <Card title="Live service checks" subtitle="Each service is sent a real request from your browser; Up means it answered."
        action={<SecondaryButton icon={RefreshCw} onClick={runAll} disabled={running}>{running ? "Checking..." : "Re-check"}</SecondaryButton>}>
        <table className="w-full min-w-[640px]">
          <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
            <th className={th}>Service</th><th className={th}>Type</th><th className={th}>Where</th>
            <th className={th}>Status</th><th className={th}>Latency</th><th className={th}>Detail</th>
          </tr></thead>
          <tbody>
            {PROBES.map((p) => {
              const r = results[p.key];
              return (
                <tr key={p.key} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                  <td className={td}><span className="font-sans text-sm font-medium text-white">{p.name}</span></td>
                  <td className={td}><Pill color={KIT.cyan}>{p.kind}</Pill></td>
                  <td className={td}><span className="font-mono text-xs text-white/50">{p.where}</span></td>
                  <td className={td}><StatusCell r={r} /></td>
                  <td className={td}><span className="font-sans text-sm text-white/75 tabular-nums">{r ? `${r.ms} ms` : ""}</span></td>
                  <td className={td}><span className="font-sans text-xs text-white/45">{r?.detail}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="grid xl:grid-cols-2 gap-5">
        <Card title="Cloud Functions" subtitle="Inventory from functions/index.js. Callables aren't pinged - calling one runs it.">
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
              <th className={th}>Function</th><th className={th}>Trigger</th><th className={th}>Purpose</th>
            </tr></thead>
            <tbody>
              {FUNCTIONS.map((f) => (
                <tr key={f.name} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                  <td className={td}><span className="font-mono text-xs text-white/85">{f.name}</span></td>
                  <td className={td}><Pill color={f.trigger.startsWith("Callable") ? KIT.purple : f.trigger.startsWith("Firestore") ? KIT.orange : KIT.cyan}>{f.trigger}</Pill></td>
                  <td className={td}><span className="font-sans text-xs text-white/55">{f.purpose}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="devert-backend routes" subtitle={API ? `Spring Boot on Cloud Run - ${new URL(API).host}` : "NEXT_PUBLIC_API_URL is not set for this build"}>
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
              <th className={th}>Route</th><th className={th}>Purpose</th>
            </tr></thead>
            <tbody>
              {BACKEND_ROUTES.map((r) => (
                <tr key={r.path} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                  <td className={td}><span className="font-mono text-xs text-white/85">{r.path}</span></td>
                  <td className={td}><span className="font-sans text-xs text-white/55">{r.purpose}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ── Database explorer ─────────────────────────────────────────────────────────

// Top-level collections worth seeing, grouped by what owns them. Subcollections
// (problems/*/hiddenTests, institutions/*/students...) are deliberately absent:
// hidden tests in particular must never be listable from a browser.
const COLLECTION_GROUPS = [
  { group: "Users & social", items: ["users", "follows", "notifications", "pulse_posts", "pulse_comments", "pulse_likes", "pulse_reposts", "pulse_saves", "communities", "community_members", "projects", "project_comments", "project_likes"] },
  { group: "Challenges", items: ["problems", "codelab_submissions", "code_runs", "contests", "submissions", "arena_matches", "dailyGrind", "grind_log", "missions", "user_missions", "hackathons", "hackathon_registrations", "hackathon_submissions", "build_attempts", "events", "registrations"] },
  { group: "Learning", items: ["courses", "learningTracks", "roadmaps", "programmingLanguages", "csCoreSubjects", "seModules", "aptitude_topics", "questionBank", "companies", "dsaSheets", "dsaConceptTracks", "interviewExperiences", "mockInterviews", "prepCourses", "prepExams", "prepQuestions", "prepSubmissions"] },
  { group: "GATE", items: ["gatePapers", "gate_pyqs", "gate_tests", "gate_attempts", "gate_formulas", "gate_resources", "gate_announcements", "gate_notes"] },
  { group: "Campus & growth", items: ["institutions", "demo_requests", "ambassadors", "referral_codes", "referrals"] },
  { group: "Careers & content", items: ["job_openings", "job_applications", "opportunities", "intel_news", "intel_jobs", "intel_resources", "broadcasts", "announcements", "changelog"] },
  { group: "Money", items: ["user_earnings", "coin_transactions", "payout_requests", "reward_grants", "payments", "subscriptions", "premium_waitlist"] },
  { group: "System", items: ["system", "settings", "admin_activity_log", "logs", "leaderboard", "leaderboardSnapshots", "achievements", "user_activity_daily"] },
];
const ALL_COLLECTIONS = COLLECTION_GROUPS.flatMap((g) => g.items.map((name) => ({ name, group: g.group })));

const PAGE = 25;

function preview(data) {
  const keys = Object.keys(data || {});
  const pick = ["title", "name", "displayName", "codename", "label", "email", "status", "type"].find((k) => typeof data?.[k] === "string");
  return { title: pick ? data[pick] : "", fields: keys.length };
}

function CollectionDrawer({ name, onClose }) {
  const [docs, setDocs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [lookup, setLookup] = useState("");

  const loadPage = useCallback(async (after) => {
    setLoading(true);
    setError("");
    try {
      const q = after ? query(collection(db, name), startAfter(after), limit(PAGE)) : query(collection(db, name), limit(PAGE));
      const snap = await getDocs(q);
      setDocs((prev) => [...(after ? prev : []), ...snap.docs.map((d) => ({ id: d.id, data: d.data() }))]);
      setCursor(snap.docs[snap.docs.length - 1] || null);
      setMore(snap.docs.length === PAGE);
    } catch (e) {
      setError(e?.code === "permission-denied" ? "Your admin account can't list this collection (by design in firestore.rules)." : e?.message || "Could not load.");
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => { loadPage(null); }, [loadPage]);

  const findById = async () => {
    const id = lookup.trim();
    if (!id) return;
    try {
      const snap = await getDoc(doc(db, name, id));
      if (snap.exists()) setOpen({ id: snap.id, data: snap.data() });
      else setError(`No document with id "${id}".`);
    } catch (e) { setError(e?.message || "Lookup failed."); }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(docs.map((d) => ({ id: d.id, ...d.data })), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Drawer open onClose={onClose} title={name} width={880}
      subtitle="Read-only. Change data through the section that owns it."
      footer={<>
        <SecondaryButton icon={Download} onClick={exportJson} disabled={!docs.length}>Export loaded ({docs.length})</SecondaryButton>
        {more && <SecondaryButton onClick={() => loadPage(cursor)} disabled={loading}>{loading ? "Loading..." : `Load ${PAGE} more`}</SecondaryButton>}
      </>}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findById()}
            placeholder="Open a document by its exact ID..."
            className="w-full font-mono text-xs text-white/85 pl-9 pr-3 py-2.5 rounded-lg outline-none border border-white/10 focus:border-white/25"
            style={{ background: "rgba(255,255,255,0.03)" }} />
        </div>
        <SecondaryButton onClick={findById}>Open</SecondaryButton>
      </div>

      {error && <p className="font-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ color: "#FF9A9A", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>{error}</p>}

      {open && (
        <div className="rounded-xl border mb-4 overflow-hidden" style={{ borderColor: `${KIT.cyan}40` }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: KIT.line, background: `${KIT.cyan}08` }}>
            <span className="font-mono text-xs text-white/85 truncate flex-1">{name}/{open.id}</span>
            <button onClick={() => setOpen(null)} className="font-sans text-xs text-white/50 hover:text-white">Close</button>
          </div>
          <pre className="font-mono text-[11px] text-white/75 p-4 overflow-auto max-h-80 whitespace-pre-wrap break-words">
            {JSON.stringify(open.data, (k, v) => (v && typeof v === "object" && typeof v.toDate === "function" ? v.toDate().toISOString() : v), 2)}
          </pre>
        </div>
      )}

      <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: KIT.line }}>
        {docs.map((d) => {
          const p = preview(d.data);
          return (
            <button key={d.id} onClick={() => setOpen(d)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors" style={{ borderColor: KIT.line }}>
              <span className="font-mono text-xs text-white/80 truncate w-56 flex-shrink-0">{d.id}</span>
              <span className="font-sans text-xs text-white/50 truncate flex-1">{p.title}</span>
              <span className="font-sans text-[11px] text-white/30 flex-shrink-0">{p.fields} fields</span>
            </button>
          );
        })}
        {loading && <p className="px-4 py-4 font-sans text-sm text-white/35 animate-pulse">Loading documents...</p>}
        {!loading && !docs.length && !error && <p className="px-4 py-6 font-sans text-sm text-white/35 text-center">This collection is empty.</p>}
      </div>
    </Drawer>
  );
}

export function DatabasePanel() {
  const [counts, setCounts] = useState({});
  const [q, setQ] = useState("");
  const [browsing, setBrowsing] = useState(null);

  // Aggregation queries: one billed read per 1,000 documents counted, not per
  // document - cheap enough to run for every collection on open.
  useEffect(() => {
    let alive = true;
    ALL_COLLECTIONS.forEach(({ name }) => {
      getCountFromServer(collection(db, name))
        .then((s) => alive && setCounts((c) => ({ ...c, [name]: s.data().count })))
        .catch((e) => alive && setCounts((c) => ({ ...c, [name]: e?.code === "permission-denied" ? "locked" : "error" })));
    });
    return () => { alive = false; };
  }, []);

  const numeric = Object.values(counts).filter((v) => typeof v === "number");
  const totalDocs = numeric.reduce((a, b) => a + b, 0);
  const locked = Object.values(counts).filter((v) => v === "locked").length;
  const needle = q.trim().toLowerCase();
  const groups = useMemo(() => COLLECTION_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((n) => !needle || n.toLowerCase().includes(needle)) }))
    .filter((g) => g.items.length), [needle]);
  const loadingCounts = Object.keys(counts).length < ALL_COLLECTIONS.length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Collections tracked", value: ALL_COLLECTIONS.length, sub: `${COLLECTION_GROUPS.length} groups`, icon: Database, color: KIT.cyan },
        { label: "Documents", value: loadingCounts ? "..." : totalDocs, sub: "Across tracked collections", icon: Braces, color: KIT.green },
        { label: "Largest", value: numeric.length ? Math.max(...numeric) : "-", sub: Object.entries(counts).filter(([, v]) => typeof v === "number").sort((a, b) => b[1] - a[1])[0]?.[0] || "", icon: Server, color: KIT.orange },
        { label: "Restricted", value: loadingCounts ? "..." : locked, sub: "Not listable, by the rules", icon: XCircle, color: KIT.purple },
      ]} />

      <Card title="Firestore collections" subtitle="Live document counts. Click a collection to browse it (read-only)."
        action={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter collections..."
              className="font-sans text-sm text-white/85 pl-9 pr-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 w-48 sm:w-56"
              style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
        }>
        <div className="p-4 sm:p-5 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.group} className="rounded-lg border overflow-hidden" style={{ borderColor: KIT.line }}>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 px-3.5 py-2 border-b" style={{ borderColor: KIT.line, background: "rgba(255,255,255,0.02)" }}>{g.group}</p>
              {g.items.map((name) => {
                const c = counts[name];
                return (
                  <button key={name} onClick={() => c !== "locked" && setBrowsing(name)} disabled={c === "locked"}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left hover:bg-white/[0.03] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
                    <span className="font-mono text-xs text-white/80 truncate">{name}</span>
                    {c === undefined ? <span className="w-8 h-3 rounded bg-white/5 animate-pulse" />
                      : c === "locked" ? <Pill color={KIT.purple}>Restricted</Pill>
                      : c === "error" ? <Pill color={KIT.red}>Error</Pill>
                      : <span className="font-sans text-xs text-white/55 tabular-nums">{fmt(c)}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {browsing && <CollectionDrawer name={browsing} onClose={() => setBrowsing(null)} />}
    </div>
  );
}
