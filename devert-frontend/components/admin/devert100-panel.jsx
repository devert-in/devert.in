"use client";

// Challenges > DeVert 100 - who joined the 100-day DSA run and how each of them
// is doing.
//
// Every per-person number comes from lib/devert100.js's own progressSummary(),
// the same function the participant's dashboard and share card use - so admin
// can never show someone a different streak or "missed" count than they see.
// firestore.rules lets isAdmin() read every devert100_participants doc.

import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { Rocket, Users, Flame, CheckCircle2, AlertTriangle, Trophy, Eye, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  DEVERT100_PARTICIPANTS, DEVERT100_TOTAL_DAYS, currentDay, progressSummary, formatDayDate,
} from "@/lib/devert100";
import { KIT, StatGrid, DataTable, Drawer, DrawerSection, Pill, ProgressBar, fmt } from "@/components/admin/admin-kit";

const BAR = "#16A34A"; // passes the dataviz lightness/contrast checks on this surface
const BAR_HOVER = "#22C55E";

// One status per person, from the same summary they see.
function statusOf(s, lastActiveMs) {
  if (s.isComplete) return { key: "finished", label: "Finished", color: KIT.gold };
  const idleDays = lastActiveMs ? (Date.now() - lastActiveMs) / 86400000 : Infinity;
  if (s.completed === 0) return { key: "not_started", label: "Not started", color: KIT.muted };
  if (idleDays > 7) return { key: "inactive", label: "Inactive 7d+", color: KIT.red };
  if (s.missed === 0) return { key: "on_track", label: "On track", color: KIT.green };
  if (s.missed <= 3) return { key: "slightly_behind", label: "Slightly behind", color: KIT.orange };
  return { key: "behind", label: "Behind", color: KIT.red };
}

const toMs = (t) => (t?.toMillis ? t.toMillis() : t ? Date.parse(t) || 0 : 0);

function DayChart({ perDay, live }) {
  const [hover, setHover] = useState(null);
  const days = perDay.slice(0, Math.max(1, live));
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white">Completions per day</h2>
        <p className="font-sans text-xs text-white/45 mt-0.5">How many participants have completed each unlocked day so far</p>
      </div>
      <div className="px-4 sm:px-5 py-4">
        <div className="relative">
          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/10" />
          <span className="absolute -top-2.5 right-0 font-sans text-[10px] text-white/35 tabular-nums bg-[#0a0e16] pl-1">{fmt(max)}</span>
          <div className="h-40 flex items-end gap-[2px]" role="img" aria-label={`Completions for days 1 to ${days.length}`}>
            {days.map((d, i) => (
              <div key={d.day} className="flex-1 h-full flex items-end relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="w-full rounded-t-[4px] transition-colors"
                  style={{ height: `${Math.max(d.n ? 3 : 1, (d.n / max) * 100)}%`, background: hover === i ? BAR_HOVER : BAR }} />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border px-2.5 py-1.5 pointer-events-none"
                    style={{ background: "#0b0f17", borderColor: KIT.line }}>
                    <p className="font-sans text-[11px] text-white/50">Day {d.day} · {formatDayDate(d.day)}</p>
                    <p className="font-sans text-sm font-semibold text-white tabular-nums">{fmt(d.n)} completed</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-px bg-white/15" />
          <div className="flex justify-between mt-1.5 font-sans text-[10px] text-white/35 tabular-nums">
            <span>Day 1</span><span>Day {days.length}</span>
          </div>
        </div>
        <table className="sr-only">
          <caption>Completions per day</caption>
          <tbody>{days.map((d) => <tr key={d.day}><td>Day {d.day}</td><td>{d.n}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Devert100Panel() {
  const [rows, setRows] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const snap = await getDocs(collection(db, DEVERT100_PARTICIPANTS));
      const parts = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      // Names/handles live on users/{uid}; one read each, in parallel.
      const profiles = await Promise.all(parts.map((p) => getDoc(doc(db, "users", p.uid)).then((s) => (s.exists() ? s.data() : {})).catch(() => ({}))));
      const weekAgo = Date.now() - 7 * 86400000;
      const out = parts.map((p, i) => {
        const s = progressSummary(p);
        const lastActive = Math.max(toMs(p.updatedAt), ...Object.values(p.completedDays || {}).map((c) => toMs(c?.completedAt)));
        const u = profiles[i];
        return {
          id: p.uid, uid: p.uid, raw: p, s,
          name: u.displayName || u.handle || p.uid, handle: u.handle || "", email: u.email || "",
          institution: u.institutionId || "",
          joinedMs: toMs(p.joinedAt), joinedThisWeek: toMs(p.joinedAt) > weekAgo, lastActive, status: statusOf(s, lastActive),
        };
      });
      if (alive) setRows(out);
    })().catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, []);

  const loading = rows === null;
  const list = rows || [];
  const live = currentDay();
  const todayDone = list.filter((r) => r.raw.completedDays?.[String(live)]).length;
  const count = (k) => list.filter((r) => r.status.key === k).length;
  const avgDone = list.length ? list.reduce((n, r) => n + r.s.completed, 0) / list.length : 0;
  const bestStreak = list.reduce((m, r) => Math.max(m, r.s.longestStreak), 0);
  const perDay = Array.from({ length: DEVERT100_TOTAL_DAYS }, (_, i) => ({
    day: i + 1, n: list.filter((r) => r.raw.completedDays?.[String(i + 1)]).length,
  }));
  const sel = list.find((r) => r.id === openId);
  const STATUS_OPTS = ["on_track", "slightly_behind", "behind", "inactive", "not_started", "finished"];
  const STATUS_LABEL = { on_track: "On track", slightly_behind: "Slightly behind", behind: "Behind", inactive: "Inactive 7d+", not_started: "Not started", finished: "Finished" };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Joined", value: list.length, sub: `${fmt(list.filter((r) => r.joinedThisWeek).length)} in the last 7 days`, icon: Users, color: KIT.cyan, loading },
        { label: `Did today (day ${live})`, value: todayDone, sub: list.length ? `${Math.round((100 * todayDone) / list.length)}% of participants` : "", icon: CheckCircle2, color: KIT.green, loading },
        { label: "On track", value: count("on_track"), sub: `${fmt(count("slightly_behind") + count("behind"))} behind`, icon: Flame, color: KIT.orange, loading },
        { label: "Inactive 7d+", value: count("inactive"), sub: `${fmt(count("not_started"))} never started`, icon: AlertTriangle, color: count("inactive") ? KIT.red : KIT.muted, loading },
      ]} />
      <StatGrid stats={[
        { label: "Run day", value: `${live} / ${DEVERT100_TOTAL_DAYS}`, sub: live ? formatDayDate(live) : "Not started yet", icon: Rocket, color: KIT.purple },
        { label: "Avg days completed", value: list.length ? avgDone.toFixed(1) : "-", sub: "Per participant", icon: CheckCircle2, color: KIT.cyan, loading },
        { label: "Longest streak", value: bestStreak, sub: "Best in the cohort", icon: Trophy, color: KIT.gold, loading },
        { label: "Finished", value: count("finished"), sub: "All 100 days", icon: Trophy, color: KIT.green, loading },
      ]} />

      {!loading && list.length > 0 && <DayChart perDay={perDay} live={live} />}

      <DataTable title="Participants" icon={Rocket}
        subtitle="Status uses the same numbers each participant sees. Missed days count only from the day they joined."
        rows={list} loading={loading} pageSize={20}
        searchKeys={["name", "handle", "email", "institution"]} searchPlaceholder="Search name, handle, email or college..."
        filters={[
          { key: "status", label: "All statuses", get: (r) => r.status.key, options: STATUS_OPTS.map((k) => ({ value: k, label: STATUS_LABEL[k] })) },
          { key: "institution", label: "All colleges", get: (r) => r.institution || "none",
            options: [...new Set(list.map((r) => r.institution || "none"))].map((v) => ({ value: v, label: v === "none" ? "No college" : v })) },
        ]}
        onRowClick={(r) => setOpenId(r.id)} emptyText="Nobody has joined yet."
        columns={[
          { key: "name", label: "Participant", render: (r) => (
            <div className="min-w-0 w-[240px] xl:w-[280px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.handle ? `@${r.handle}` : r.uid}{r.institution ? ` · ${r.institution}` : ""}</p>
            </div>
          ) },
          { key: "completed", label: "Done", sort: (r) => r.s.completed, render: (r) => <ProgressBar value={r.s.percent} /> },
          { key: "streak", label: "Streak", sort: (r) => r.s.currentStreak,
            render: (r) => <span className="font-sans text-sm text-white/80 tabular-nums">{r.s.currentStreak} <span className="text-white/35">/ best {r.s.longestStreak}</span></span> },
          { key: "missed", label: "Missed", sort: (r) => r.s.missed,
            render: (r) => <span className="font-sans text-sm tabular-nums" style={{ color: r.s.missed ? KIT.orange : "rgba(255,255,255,0.55)" }}>{r.s.missed}</span> },
          { key: "joined", label: "Joined", sort: (r) => r.joinedMs,
            render: (r) => <span className="font-sans text-xs text-white/55">Day {r.s.joinedOnDay}{r.joinedMs ? ` · ${new Date(r.joinedMs).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span> },
          { key: "lastActive", label: "Last active", sort: (r) => r.lastActive,
            render: (r) => <span className="font-sans text-xs text-white/55">{r.lastActive ? new Date(r.lastActive).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span> },
          { key: "status", label: "Status", sort: (r) => STATUS_OPTS.indexOf(r.status.key), render: (r) => <Pill color={r.status.color}>{r.status.label}</Pill> },
        ]}
        rowActions={(r) => [
          { icon: Eye, label: "Details", onClick: () => setOpenId(r.id) },
          r.handle && { icon: ExternalLink, label: "Open profile", onClick: () => window.open(`/u/${r.handle}`, "_blank", "noopener") },
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={640} title={sel?.name || ""}
        subtitle={sel ? `${sel.handle ? `@${sel.handle} · ` : ""}${sel.email || sel.uid}` : ""}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ["Completed", `${sel.s.completed} / ${DEVERT100_TOTAL_DAYS}`], ["Current streak", sel.s.currentStreak], ["Longest streak", sel.s.longestStreak],
                ["Missed since joining", sel.s.missed], ["Backlog done", `${sel.s.backlogDone} / ${sel.s.backlogTotal}`], ["Status", sel.status.label],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3" style={{ borderColor: KIT.line }}>
                  <p className="font-sans text-[11px] text-white/45">{k}</p>
                  <p className="font-sans text-base font-semibold text-white tabular-nums mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <DrawerSection title="Day map" hint="Filled = completed. Days before they joined are backlog, not misses.">
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: DEVERT100_TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
                  const done = !!sel.raw.completedDays?.[String(d)];
                  const unlocked = d <= live;
                  return (
                    <div key={d} title={`Day ${d}${done ? " - done" : unlocked ? (d < sel.s.joinedOnDay ? " - backlog" : " - not done") : " - locked"}`}
                      className="aspect-square rounded-[3px] flex items-center justify-center font-sans text-[9px] tabular-nums"
                      style={{
                        background: done ? BAR : unlocked ? "rgba(255,255,255,0.06)" : "transparent",
                        border: `1px solid ${done ? BAR : d === live ? KIT.cyan : "rgba(255,255,255,0.08)"}`,
                        color: done ? "#05080F" : "rgba(255,255,255,0.35)",
                      }}>{d}</div>
                  );
                })}
              </div>
            </DrawerSection>
            <DrawerSection title="Recent reflections" hint="What they logged when completing a day.">
              {Object.entries(sel.raw.completedDays || {}).sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, 8).map(([d, c]) => (
                <div key={d} className="border-b last:border-b-0 pb-2 last:pb-0" style={{ borderColor: KIT.line }}>
                  <p className="font-sans text-xs text-white/45">Day {d} · {c?.completedAt ? new Date(c.completedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    {c?.confidence != null ? ` · confidence ${c.confidence}/5` : ""}{c?.minutes != null ? ` · ${c.minutes} min` : ""}</p>
                  {c?.notes && <p className="font-sans text-sm text-white/75 mt-0.5 whitespace-pre-wrap break-words">{c.notes}</p>}
                </div>
              ))}
              {!Object.keys(sel.raw.completedDays || {}).length && <p className="font-sans text-sm text-white/35">No days completed yet.</p>}
            </DrawerSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}
