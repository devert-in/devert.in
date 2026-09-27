"use client";

// Overview > Engagement - who is actually using DeVert, for how long, and where.
//
// Source: user_activity_daily/{uid}_{YYYY-MM-DD} (lib/activity.js). Each doc
// is one user's IST day; pingCount goes up once per minute while a signed-in
// user has a VISIBLE tab open, so minutes = pings * PING_INTERVAL_MIN. That
// is an engaged-time ESTIMATE (the same heuristic analytics tools use), shown
// as such. sites{} / sections{} / hours{} break those minutes down; they only
// exist on pings sent after the heartbeat started tagging them, so older days
// show totals without a breakdown. Campus has pinged for months; devert.in
// only since components/activity-heartbeat.jsx shipped.
//
// Reads: 14 days of count()+sum() aggregations (no documents downloaded) for
// the trend charts, and the raw docs for today and the last 7 days for the
// breakdowns and tables. Read-only.

import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, getDoc, doc, getCountFromServer, getAggregateFromServer, sum,
} from "firebase/firestore";
import { Activity, Clock, Users, Repeat, Globe, GraduationCap, Eye, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { PING_INTERVAL_MIN, lastNDatesIST, todayIST } from "@/lib/activity";
import { KIT, StatGrid, DataTable, fmt } from "@/components/admin/admin-kit";

const BAR = "#16A34A";      // dataviz-validated fill on this surface
const BAR_HOVER = "#22C55E";

const minutes = (pings) => (pings || 0) * PING_INTERVAL_MIN;
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`);

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

// Single-series vertical bars with a hover tooltip and an sr-only table.
function Bars({ data, format = fmt, height = "h-36", labelEvery = 2, ariaLabel }) {
  const [hover, setHover] = useState(null);
  if (!data) return <div className={`${height} rounded-lg bg-white/[0.03] animate-pulse`} />;
  const max = Math.max(1, ...data.map((d) => d.v || 0));
  return (
    <div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/10" />
        <span className="absolute -top-2.5 right-0 font-sans text-[10px] text-white/35 tabular-nums bg-[#0a0e16] pl-1">{format(max)}</span>
        <div className={`${height} flex items-end gap-[2px]`} role="img" aria-label={ariaLabel}>
          {data.map((d, i) => (
            <div key={d.key} className="flex-1 h-full flex items-end relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="w-full rounded-t-[4px] transition-colors"
                style={{ height: `${d.v ? Math.max(3, (d.v / max) * 100) : 1}%`, background: hover === i ? BAR_HOVER : BAR, opacity: d.v ? 1 : 0.25 }} />
              {hover === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border px-2.5 py-1.5 pointer-events-none"
                  style={{ background: "#0b0f17", borderColor: KIT.line }}>
                  <p className="font-sans text-[11px] text-white/50">{d.label}</p>
                  <p className="font-sans text-sm font-semibold text-white tabular-nums">{format(d.v || 0)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="h-px bg-white/15" />
        <div className="flex gap-[2px] mt-1.5">
          {data.map((d, i) => (
            <span key={d.key} className="flex-1 text-center font-sans text-[10px] text-white/35 tabular-nums">
              {i % labelEvery === (data.length - 1) % labelEvery ? d.short : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only"><caption>{ariaLabel}</caption><tbody>{data.map((d) => <tr key={d.key}><td>{d.label}</td><td>{format(d.v || 0)}</td></tr>)}</tbody></table>
    </div>
  );
}

// Horizontal ranked bars for categorical breakdowns (sections).
function RankBars({ items, format }) {
  if (!items) return <div className="h-40 rounded-lg bg-white/[0.03] animate-pulse" />;
  if (!items.length) return <p className="font-sans text-sm text-white/35">No section data yet - it fills in as tagged pings arrive.</p>;
  const max = Math.max(1, ...items.map((i) => i.v));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key} className="grid grid-cols-[120px_1fr_64px] items-center gap-3">
          <span className="font-sans text-sm text-white/75 truncate" title={it.label}>{it.label}</span>
          <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(it.v / max) * 100}%`, background: BAR }} />
          </div>
          <span className="font-sans text-xs text-white/60 tabular-nums text-right">{format(it.v)}</span>
        </div>
      ))}
    </div>
  );
}

export function EngagementPanel() {
  const [trend, setTrend] = useState(null);   // [{date, dau, pings}]
  const [today, setToday] = useState(null);   // raw docs
  const [week, setWeek] = useState(null);     // raw docs, last 7 days
  const [names, setNames] = useState({});

  useEffect(() => {
    let alive = true;
    const dates14 = lastNDatesIST(14);
    Promise.all(dates14.map(async (date) => {
      const q = query(collection(db, "user_activity_daily"), where("date", "==", date));
      const [c, s] = await Promise.all([
        getCountFromServer(q).then((r) => r.data().count).catch(() => 0),
        getAggregateFromServer(q, { p: sum("pingCount") }).then((r) => r.data().p || 0).catch(() => 0),
      ]);
      return { date, dau: c, pings: s };
    })).then((rows) => alive && setTrend(rows));

    const dates7 = lastNDatesIST(7);
    getDocs(query(collection(db, "user_activity_daily"), where("date", ">=", dates7[0])))
      .then(async (snap) => {
        const docs = snap.docs.map((d) => d.data());
        if (!alive) return;
        setWeek(docs);
        setToday(docs.filter((d) => d.date === todayIST()));
        // Names for the tables: the week's distinct users, one read each.
        const uids = [...new Set(docs.map((d) => d.uid))].slice(0, 400);
        const profiles = await Promise.all(uids.map((u) => getDoc(doc(db, "users", u)).then((s) => [u, s.exists() ? s.data() : {}]).catch(() => [u, {}])));
        if (alive) setNames(Object.fromEntries(profiles));
      })
      .catch(() => { if (alive) { setWeek([]); setToday([]); } });
    return () => { alive = false; };
  }, []);

  const loading = !today || !trend;
  const t = today || [];
  const w = week || [];
  const dauToday = t.length;
  const minsToday = t.reduce((n, d) => n + minutes(d.pingCount), 0);
  const avgToday = dauToday ? minsToday / dauToday : 0;
  const siteMins = (docs, site) => docs.reduce((n, d) => n + minutes(d.sites?.[site]), 0);
  const wau = new Set(w.map((d) => d.uid)).size;
  const avgDau7 = trend ? trend.slice(-7).reduce((n, r) => n + r.dau, 0) / 7 : 0;
  const stickiness = wau ? Math.round((100 * avgDau7) / wau) : 0;

  const dayLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const dayShort = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const dauSeries = trend && trend.map((r) => ({ key: r.date, v: r.dau, label: dayLabel(r.date), short: dayShort(r.date) }));
  const avgSeries = trend && trend.map((r) => ({ key: r.date, v: r.dau ? minutes(r.pings) / r.dau : 0, label: dayLabel(r.date), short: dayShort(r.date) }));

  const hours = week && Array.from({ length: 24 }, (_, h) => ({
    key: String(h), v: w.reduce((n, d) => n + minutes(d.hours?.[String(h)]), 0),
    label: `${String(h).padStart(2, "0")}:00-${String(h + 1).padStart(2, "0")}:00 IST`, short: String(h).padStart(2, "0"),
  }));
  const sectionTotals = {};
  for (const d of w) for (const [k, v] of Object.entries(d.sections || {})) {
    sectionTotals[k] = (sectionTotals[k] || 0) + minutes(v);
  }
  const topSections = week && Object.entries(sectionTotals).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([k, v]) => ({ key: k, label: k.replace(/-/g, " "), v }));

  const person = (uid) => names[uid] || {};
  const todayRows = t.map((d) => ({
    id: d.uid, uid: d.uid, name: person(d.uid).displayName || person(d.uid).handle || d.uid, handle: person(d.uid).handle || "",
    institution: person(d.uid).institutionId || "", mins: minutes(d.pingCount),
    main: minutes(d.sites?.main), campus: minutes(d.sites?.campus),
    first: d.firstSeenAt?.toDate?.(), last: d.lastSeenAt?.toDate?.(),
    top: Object.entries(d.sections || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || "",
  }));
  const weekByUser = {};
  for (const d of w) {
    const r = weekByUser[d.uid] ||= { mins: 0, days: 0, last: null };
    r.mins += minutes(d.pingCount); r.days += 1;
    const ls = d.lastSeenAt?.toDate?.(); if (ls && (!r.last || ls > r.last)) r.last = ls;
  }
  const weekRows = Object.entries(weekByUser).map(([uid, r]) => ({
    id: uid, uid, name: person(uid).displayName || person(uid).handle || uid, handle: person(uid).handle || "",
    institution: person(uid).institutionId || "", ...r, avg: r.mins / r.days,
  }));
  const ts = (d) => (d ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "-");

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Active today", value: dauToday, sub: "Signed-in users with a visible tab", icon: Activity, color: KIT.green, loading },
        { label: "Avg time today", value: loading ? null : fmtMin(avgToday), sub: `${fmtMin(minsToday)} in total`, icon: Clock, color: KIT.cyan, loading },
        { label: "Weekly active", value: wau, sub: "Distinct users, last 7 days", icon: Users, color: KIT.purple, loading: !week },
        { label: "Stickiness", value: loading ? null : `${stickiness}%`, sub: "Avg daily active / weekly active", icon: Repeat, color: KIT.orange, loading },
      ]} />
      <StatGrid stats={[
        { label: "devert.in today", value: loading ? null : fmtMin(siteMins(t, "main")), sub: `${fmt(t.filter((d) => d.sites?.main).length)} users`, icon: Globe, color: KIT.green, loading },
        { label: "Campus today", value: loading ? null : fmtMin(siteMins(t, "campus")), sub: `${fmt(t.filter((d) => d.sites?.campus).length)} users`, icon: GraduationCap, color: KIT.cyan, loading },
        { label: "Avg time / user (7d)", value: week ? fmtMin(wau ? w.reduce((n, d) => n + minutes(d.pingCount), 0) / wau : 0) : null, sub: "Per weekly active user", icon: Clock, color: KIT.purple, loading: !week },
        { label: "Peak day (14d)", value: trend ? Math.max(0, ...trend.map((r) => r.dau)) : null, sub: trend ? dayLabel(trend.reduce((a, b) => (b.dau > a.dau ? b : a), trend[0]).date) : "", icon: Activity, color: KIT.gold, loading: !trend },
      ]} />

      <div className="grid xl:grid-cols-2 gap-5">
        <Card title="Daily active users" subtitle="Distinct signed-in users per IST day, last 14 days">
          <Bars data={dauSeries} ariaLabel="Daily active users, last 14 days" />
        </Card>
        <Card title="Average time per active user" subtitle="Engaged minutes per active user, per day">
          <Bars data={avgSeries} format={(v) => fmtMin(v)} ariaLabel="Average engaged minutes per active user, last 14 days" />
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        <Card title="When people are on" subtitle="Engaged minutes by hour of day (IST), last 7 days">
          <Bars data={hours} format={(v) => fmtMin(v)} labelEvery={3} ariaLabel="Engaged minutes by hour of day" />
        </Card>
        <Card title="Where time goes" subtitle="Top sections by engaged minutes, last 7 days">
          <RankBars items={topSections} format={(v) => fmtMin(v)} />
        </Card>
      </div>

      <DataTable title="Active today" icon={Activity} subtitle="Everyone who used DeVert today, most engaged first."
        rows={todayRows} loading={!today} pageSize={15}
        searchKeys={["name", "handle", "institution"]} searchPlaceholder="Search people..."
        filters={[{ key: "site", label: "Both sites", get: (r) => (r.main && r.campus ? "both" : r.campus ? "campus" : r.main ? "main" : "untagged"),
          options: [{ value: "main", label: "devert.in only" }, { value: "campus", label: "Campus only" }, { value: "both", label: "Both" }, { value: "untagged", label: "Untagged" }] }]}
        emptyText="Nobody active yet today."
        columns={[
          { key: "name", label: "User", render: (r) => (
            <div className="min-w-0 w-[220px] xl:w-[260px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.handle ? `@${r.handle}` : r.uid}{r.institution ? ` · ${r.institution}` : ""}</p>
            </div>
          ) },
          { key: "mins", label: "Time today", sort: (r) => r.mins, render: (r) => <span className="font-sans text-sm font-semibold text-white tabular-nums">{fmtMin(r.mins)}</span> },
          { key: "split", label: "devert.in / Campus", sortable: false, render: (r) => <span className="font-sans text-xs text-white/60 tabular-nums">{fmtMin(r.main)} / {fmtMin(r.campus)}</span> },
          { key: "top", label: "Mostly on", render: (r) => <span className="font-sans text-xs text-white/60">{r.top ? r.top.replace(/-/g, " ") : "-"}</span> },
          { key: "first", label: "First seen", sort: (r) => r.first?.getTime() || 0, render: (r) => <span className="font-sans text-xs text-white/55">{ts(r.first)}</span> },
          { key: "last", label: "Last seen", sort: (r) => r.last?.getTime() || 0, render: (r) => <span className="font-sans text-xs text-white/55">{ts(r.last)}</span> },
        ]}
        rowActions={(r) => [r.handle && { icon: ExternalLink, label: "Open profile", onClick: () => window.open(`/u/${r.handle}`, "_blank", "noopener") }]}
      />

      <DataTable title="Most engaged this week" icon={Eye} subtitle="Total engaged time over the last 7 days."
        rows={weekRows} loading={!week} pageSize={15}
        searchKeys={["name", "handle", "institution"]} searchPlaceholder="Search people..."
        emptyText="No activity in the last 7 days."
        columns={[
          { key: "name", label: "User", render: (r) => (
            <div className="min-w-0 w-[220px] xl:w-[260px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.handle ? `@${r.handle}` : r.uid}{r.institution ? ` · ${r.institution}` : ""}</p>
            </div>
          ) },
          { key: "mins", label: "Time (7d)", sort: (r) => r.mins, render: (r) => <span className="font-sans text-sm font-semibold text-white tabular-nums">{fmtMin(r.mins)}</span> },
          { key: "days", label: "Days active", sort: (r) => r.days, render: (r) => <span className="font-sans text-sm text-white/75 tabular-nums">{r.days} / 7</span> },
          { key: "avg", label: "Avg per day", sort: (r) => r.avg, render: (r) => <span className="font-sans text-sm text-white/75 tabular-nums">{fmtMin(r.avg)}</span> },
          { key: "last", label: "Last seen", sort: (r) => r.last?.getTime() || 0, render: (r) => <span className="font-sans text-xs text-white/55">{r.last ? r.last.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span> },
        ]}
      />
      <p className="font-sans text-xs text-white/35">
        Time is an estimate: one minute is counted for each minute a signed-in user has a DeVert tab visible. Section and hour breakdowns cover activity from today onward on devert.in; Campus totals go back further.
      </p>
    </div>
  );
}
