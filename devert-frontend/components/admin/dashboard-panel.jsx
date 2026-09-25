"use client";

// Overview > Dashboard - the admin console's landing page.
//
// Every number is a live Firestore aggregation (count()/sum(), billed at one
// read per 1,000 documents counted, never a document download). Nothing here
// is estimated or trended from invented history: the signups chart is 14 real
// per-day counts over users.joinedAt, which IS stored.
//
// "Needs attention" jumps straight into the section that works each queue. It
// navigates through the shell's own URL contract (/admin?tab=&section=) plus a
// popstate, so this panel needs no prop plumbing from the shell.

import { useEffect, useState } from "react";
import {
  collection, getCountFromServer, getAggregateFromServer, sum, query, where, orderBy, limit, getDocs, Timestamp,
} from "firebase/firestore";
import {
  Users, Activity, Code2, Zap, Building2, Megaphone, Target, CheckCircle2, ShieldCheck, Wallet, Inbox,
  ChevronRight, Trophy,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { KIT, StatGrid, fmt } from "@/components/admin/admin-kit";

const DAY = 24 * 60 * 60 * 1000;
// Bars: #16A34A passes the dataviz lightness/contrast checks on this surface;
// the brand neon (#00FF41) is too light to read as a filled mark.
const BAR = "#16A34A";
const BAR_HOVER = "#22C55E";

function goTo(tab, section) {
  window.history.pushState(null, "", `/admin?tab=${tab}&section=${section}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const count = (q) => getCountFromServer(q).then((s) => s.data().count);
const settle = (p) => p.then((v) => v, () => null);

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function Panel({ title, subtitle, children, action }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: KIT.line }}>
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SignupsChart({ days }) {
  const [hover, setHover] = useState(null);
  if (!days) return <div className="h-48 m-5 rounded-lg bg-white/[0.03] animate-pulse" />;
  const max = Math.max(1, ...days.map((d) => d.n ?? 0));
  const total = days.reduce((a, d) => a + (d.n || 0), 0);
  return (
    <div className="px-4 sm:px-5 py-4">
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-sans text-2xl font-semibold text-white tabular-nums">{fmt(total)}</span>
        <span className="font-sans text-xs text-white/45">new accounts in the last 14 days</span>
      </div>
      <div className="relative">
        {/* Single recessive reference line at the max, labelled. */}
        <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/10" />
        <span className="absolute -top-2.5 right-0 font-sans text-[10px] text-white/35 tabular-nums bg-[#0a0e16] pl-1">{fmt(max)}</span>
        <div className="h-40 flex items-end gap-[2px]" role="img" aria-label={`Daily signups, last 14 days, ${total} total`}>
          {days.map((d, i) => {
            const h = d.n == null ? 0 : Math.max(d.n ? 3 : 1, (d.n / max) * 100);
            return (
              <div key={d.key} className="flex-1 h-full flex items-end relative"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="w-full rounded-t-[4px] transition-colors"
                  style={{ height: `${h}%`, background: d.n == null ? "rgba(255,255,255,0.06)" : hover === i ? BAR_HOVER : BAR }} />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border px-2.5 py-1.5 pointer-events-none"
                    style={{ background: "#0b0f17", borderColor: KIT.line }}>
                    <p className="font-sans text-[11px] text-white/50">{d.label}</p>
                    <p className="font-sans text-sm font-semibold text-white tabular-nums">{d.n == null ? "Unavailable" : `${fmt(d.n)} signup${d.n === 1 ? "" : "s"}`}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-px bg-white/15" />
        <div className="flex gap-[2px] mt-1.5">
          {days.map((d, i) => (
            <span key={d.key} className="flex-1 text-center font-sans text-[10px] text-white/35 tabular-nums">
              {i % 2 === (days.length - 1) % 2 ? d.short : ""}
            </span>
          ))}
        </div>
      </div>
      {/* Table view of the same numbers, for screen readers. */}
      <table className="sr-only">
        <caption>Daily signups, last 14 days</caption>
        <thead><tr><th>Day</th><th>Signups</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.key}><td>{d.label}</td><td>{d.n ?? "unavailable"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function DashboardPanel() {
  const [k, setK] = useState(null);
  const [queues, setQueues] = useState(null);
  const [days, setDays] = useState(null);
  const [top, setTop] = useState(null);

  useEffect(() => {
    let alive = true;
    const weekAgo = Timestamp.fromMillis(Date.now() - 7 * DAY);

    Promise.all([
      settle(count(collection(db, "users"))),
      settle(count(query(collection(db, "users"), where("joinedAt", ">=", weekAgo)))),
      settle(count(collection(db, "pulse_posts"))),
      settle(count(query(collection(db, "pulse_posts"), where("createdAt", ">=", weekAgo)))),
      settle(count(collection(db, "codelab_submissions"))),
      settle(getAggregateFromServer(collection(db, "users"), { xp: sum("xp") }).then((s) => s.data().xp || 0)),
      settle(count(collection(db, "institutions"))),
      settle(count(query(collection(db, "ambassadors"), where("status", "==", "active")))),
      settle(count(query(collection(db, "missions"), where("status", "==", "OPEN")))),
      settle(count(query(collection(db, "problems"), where("status", "==", "published")))),
    ]).then(([users, users7, posts, posts7, subs, xp, inst, amb, missions, problems]) => {
      if (alive) setK({ users, users7, posts, posts7, subs, xp, inst, amb, missions, problems });
    });

    Promise.all([
      settle(count(query(collection(db, "pulse_posts"), where("status", "==", "pending")))),
      settle(count(query(collection(db, "payout_requests"), where("status", "==", "pending")))),
      settle(getAggregateFromServer(query(collection(db, "payout_requests"), where("status", "==", "pending")), { inr: sum("inrAmount") }).then((s) => s.data().inr || 0)),
      settle(count(query(collection(db, "ambassadors"), where("status", "==", "pending")))),
      settle(count(query(collection(db, "demo_requests"), where("status", "==", "new")))),
      settle(count(query(collection(db, "job_applications"), where("status", "==", "new")))),
    ]).then(([pulse, payouts, payoutInr, amb, demos, jobs]) => {
      if (alive) setQueues({ pulse, payouts, payoutInr, amb, demos, jobs });
    });

    const today = startOfDay(new Date());
    const ranges = Array.from({ length: 14 }, (_, i) => {
      const from = new Date(today.getTime() - (13 - i) * DAY);
      return { from, to: new Date(from.getTime() + DAY) };
    });
    Promise.all(ranges.map(({ from, to }) => settle(count(query(collection(db, "users"),
      where("joinedAt", ">=", Timestamp.fromDate(from)), where("joinedAt", "<", Timestamp.fromDate(to)))))))
      .then((ns) => {
        if (!alive) return;
        setDays(ranges.map(({ from }, i) => ({
          key: from.toISOString(), n: ns[i],
          label: from.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
          short: from.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        })));
      });

    getDocs(query(collection(db, "users"), orderBy("xp", "desc"), limit(6)))
      .then((s) => alive && setTop(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => alive && setTop([]));

    return () => { alive = false; };
  }, []);

  const L = !k;
  const QUEUES = [
    { label: "Pulse posts awaiting review", n: queues?.pulse, icon: ShieldCheck, go: ["moderation", "pulse"] },
    { label: "Payout requests", n: queues?.payouts, icon: Wallet, go: ["economy", "payouts"],
      extra: queues?.payoutInr ? `₹${fmt(Math.round(queues.payoutInr))} owed` : null },
    { label: "Ambassador applications", n: queues?.amb, icon: Megaphone, go: ["campus", "ambassadors"] },
    { label: "Campus demo requests", n: queues?.demos, icon: Inbox, go: ["campus", "demo-requests"] },
    { label: "New job applications", n: queues?.jobs, icon: Inbox, go: ["careers", "job-applications"] },
  ];
  const attention = QUEUES.filter((q) => q.n).length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Total users", value: k?.users, sub: k?.users7 != null ? `+${fmt(k.users7)} in the last 7 days` : "", icon: Users, color: KIT.green, loading: L },
        { label: "Pulse posts", value: k?.posts, sub: k?.posts7 != null ? `+${fmt(k.posts7)} in the last 7 days` : "", icon: Activity, color: KIT.cyan, loading: L },
        { label: "CodeLab submissions", value: k?.subs, sub: `${fmt(k?.problems ?? 0)} problems live`, icon: Code2, color: KIT.orange, loading: L },
        { label: "Total XP earned", value: k?.xp, sub: "Across every account", icon: Zap, color: KIT.purple, loading: L },
      ]} />
      <StatGrid stats={[
        { label: "Campus institutions", value: k?.inst, sub: "Onboarded colleges", icon: Building2, color: KIT.cyan, loading: L },
        { label: "Active ambassadors", value: k?.amb, sub: "Approved and live", icon: Megaphone, color: KIT.green, loading: L },
        { label: "Open missions", value: k?.missions, sub: "Accepting builders", icon: Target, color: KIT.orange, loading: L },
        { label: "Needs attention", value: queues ? attention : null, sub: attention ? "Queues with items waiting" : "All queues clear", icon: CheckCircle2, color: attention ? KIT.orange : KIT.green, loading: !queues },
      ]} />

      <div className="grid xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <Panel title="Signups" subtitle="New accounts per day, from users.joinedAt">
            <SignupsChart days={days} />
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel title="Needs attention" subtitle="Work waiting in a queue">
            <div className="divide-y" style={{ borderColor: KIT.line }}>
              {QUEUES.map((q) => (
                <button key={q.label} onClick={() => goTo(...q.go)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-white/[0.03] transition-colors" style={{ borderColor: KIT.line }}>
                  <q.icon size={16} className="flex-shrink-0" style={{ color: q.n ? KIT.orange : "rgba(255,255,255,0.3)" }} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-sans text-sm text-white/85 truncate">{q.label}</span>
                    {q.extra && <span className="block font-sans text-xs text-white/40">{q.extra}</span>}
                  </span>
                  {queues == null ? <span className="w-6 h-4 rounded bg-white/5 animate-pulse" />
                    : q.n == null ? <span className="font-sans text-xs text-white/30">-</span>
                    : <span className="font-sans text-sm font-semibold tabular-nums rounded-full px-2 min-w-[28px] text-center"
                        style={q.n ? { background: KIT.orange, color: "#05080F" } : { color: "rgba(255,255,255,0.35)" }}>{fmt(q.n)}</span>}
                  <ChevronRight size={14} className="text-white/25 flex-shrink-0" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Top builders" subtitle="Highest XP on the platform"
        action={<button onClick={() => goTo("users", "users")} className="font-sans text-xs text-white/50 hover:text-white inline-flex items-center gap-1">All users <ChevronRight size={13} /></button>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
              {["#", "Builder", "Tier", "XP"].map((h, i) => (
                <th key={h} className={`font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 px-4 sm:px-5 py-2.5 ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(top || []).map((u, i) => (
                <tr key={u.id} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                  <td className="px-4 sm:px-5 py-3 font-sans text-sm text-white/40 tabular-nums">
                    {i < 3 ? <Trophy size={14} style={{ color: [KIT.gold, "#C0C0C0", "#CD7F32"][i] }} /> : i + 1}
                  </td>
                  <td className="px-4 sm:px-5 py-3">
                    <p className="font-sans text-sm font-medium text-white">{u.displayName || u.handle || u.id}</p>
                    {u.handle && <p className="font-sans text-xs text-white/40">@{u.handle}</p>}
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-sans text-xs text-white/60">{u.tier?.name || "Recruit"}</td>
                  <td className="px-4 sm:px-5 py-3 font-sans text-sm text-white/85 tabular-nums text-right">{fmt(u.xp || 0)}</td>
                </tr>
              ))}
              {top == null && <tr><td colSpan={4} className="px-5 py-4"><div className="h-4 rounded bg-white/5 animate-pulse" /></td></tr>}
              {top && !top.length && <tr><td colSpan={4} className="px-5 py-8 text-center font-sans text-sm text-white/35">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
