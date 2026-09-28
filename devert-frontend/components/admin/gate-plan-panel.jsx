"use client";

// GATE > Prep cohort - the GATE 2027 Plan's admin side: the request queue, the
// members, how the cohort is doing, and the switches (requests open/closed,
// the cohort notice).
//
// Every per-member number comes from lib/gatePlan.js's planSummary() - the same
// function the member's own dashboard uses - so the admin can never see a
// different streak, miss count or accuracy than the student does.
// firestore.rules gives isAdmin() read/write on every gate_plan_* collection;
// the approval itself is one batch (request -> approved + member doc created)
// in lib/gatePlan.js's approveRequest().

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Inbox, Users, CheckCircle2, XCircle, Eye, Ban, RotateCcw, Flame, AlertTriangle, CalendarDays,
  Target, BarChart3, Settings, Megaphone, Loader2, GraduationCap, ExternalLink, Database, Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAllRequests, fetchAllMembers, fetchPlanIndex, approveRequest, rejectRequest, revokeMember, restoreMember,
  subscribeToPlanSettings, updatePlanSettings, planSummary, memberStatus, weeklyTracker, subjectAccuracy, weakTopics,
  currentPlanDay, formatPlanDate, GATE_PLAN_TOTAL_DAYS, GATE_PLAN_LAST_DAY, LOG_STATUS, LOG_STATUS_LABEL,
  REQUEST_STAGES, REQUEST_PAPERS, PAPER_LABEL, pct, WEEK_KEYS,
} from "@/lib/gatePlan";
import { CHECKLIST_ITEM_COUNT, WEEKS } from "@/lib/gatePlanGuide";
import {
  KIT, StatGrid, DataTable, Drawer, DrawerSection, Pill, ProgressBar, Toggle, PrimaryButton, SecondaryButton, fmt,
} from "@/components/admin/admin-kit";

const BAR = "#16A34A";      // same pair as devert100-panel.jsx - passes the dataviz checks on this surface
const BAR_HOVER = "#22C55E";
const toMs = (t) => (t?.toMillis ? t.toMillis() : t ? Date.parse(t) || 0 : 0);
const dateStr = (ms) => (ms ? new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-");
const dateTimeStr = (ms) => (ms ? new Date(ms).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");
const labelOf = (list, v) => list.find((x) => x.value === v)?.label || v || "-";
const accColor = (p) => (p == null ? KIT.muted : p >= 75 ? KIT.green : p >= 60 ? KIT.orange : KIT.red);

const REQ_STATUS = {
  pending: { label: "Pending", color: KIT.gold },
  approved: { label: "Approved", color: KIT.green },
  rejected: { label: "Rejected", color: KIT.red },
  revoked: { label: "Revoked", color: KIT.muted },
};
const MEMBER_COLOR = {
  on_track: KIT.green, slightly_behind: KIT.orange, behind: KIT.red, inactive: KIT.red,
  not_started: KIT.muted, finished: KIT.gold, revoked: KIT.muted,
};
const MEMBER_STATUS_OPTS = ["on_track", "slightly_behind", "behind", "inactive", "not_started", "finished", "revoked"];
const MEMBER_STATUS_LABEL = {
  on_track: "On track", slightly_behind: "Slightly behind", behind: "Behind", inactive: "Inactive 7d+",
  not_started: "Not started", finished: "Finished", revoked: "Revoked",
};

const TABS = [
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "members", label: "Members", icon: Users },
  { key: "analytics", label: "Cohort analytics", icon: BarChart3 },
  { key: "settings", label: "Settings & content", icon: Settings },
];

export function GatePlanPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState(null);
  const [members, setMembers] = useState(null);
  const [index, setIndex] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, m] = await Promise.all([fetchAllRequests(), fetchAllMembers()]);
      setError(""); setRequests(r); setMembers(m);
    } catch (e) {
      setError(e?.message || "Could not load the cohort.");
      setRequests([]); setMembers([]);
    }
  }, []);

  // First load inline (setState only in the promise callbacks); `load` is for
  // re-reading after an approve/reject/revoke.
  useEffect(() => {
    let alive = true;
    Promise.all([fetchAllRequests(), fetchAllMembers()])
      .then(([r, m]) => { if (alive) { setRequests(r); setMembers(m); } })
      .catch((e) => { if (alive) { setError(e?.message || "Could not load the cohort."); setRequests([]); setMembers([]); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => { fetchPlanIndex().then(setIndex).catch(() => setIndex([])); }, []);
  useEffect(() => subscribeToPlanSettings(setSettings), []);

  const loading = requests === null || members === null;
  const live = currentPlanDay();

  const memberRows = useMemo(() => (members || []).map((m) => {
    const s = planSummary(m);
    const status = memberStatus(s, m.access);
    return {
      id: m.uid, uid: m.uid, raw: m, s, status,
      name: m.name || m.uid, email: m.email || "", college: m.college || "", papers: m.papers || "BOTH",
      lastActive: Math.max(toMs(m.updatedAt), toMs(s.lastLoggedAt)),
      approvedMs: toMs(m.approvedAt),
    };
  }), [members]);

  const requestRows = useMemo(() => (requests || []).map((r) => ({
    ...r, id: r.uid,
    createdMs: toMs(r.createdAt), updatedMs: toMs(r.updatedAt), reviewedMs: toMs(r.reviewedAt),
  })), [requests]);

  const pending = requestRows.filter((r) => r.status === "pending");
  const active = memberRows.filter((r) => r.raw.access === "active");
  const doneToday = active.filter((r) => r.raw.logs?.[String(live)]?.status === LOG_STATUS.DONE).length;
  const count = (k) => memberRows.filter((r) => r.status.key === k).length;
  const avgDone = active.length ? active.reduce((n, r) => n + r.s.done, 0) / active.length : 0;
  const cohortAcc = (() => {
    const c = active.reduce((n, r) => n + r.s.overall.correct, 0);
    const a = active.reduce((n, r) => n + r.s.overall.attempted, 0);
    return pct(c, a);
  })();

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border px-4 py-3 font-sans text-sm" style={{ borderColor: `${KIT.red}40`, color: KIT.red, background: `${KIT.red}0d` }}>{error}</div>
      )}

      <StatGrid stats={[
        { label: "Pending requests", value: pending.length, sub: pending.length ? `oldest ${dateStr(Math.min(...pending.map((r) => r.createdMs).filter(Boolean)))}` : "Queue is clear", icon: Inbox, color: pending.length ? KIT.gold : KIT.muted, loading },
        { label: "Active members", value: active.length, sub: `${fmt(requestRows.filter((r) => r.status === "rejected").length)} rejected · ${fmt(count("revoked"))} revoked`, icon: Users, color: KIT.cyan, loading },
        { label: live >= 0 ? `Done today (D${live})` : "Done today", value: doneToday, sub: active.length ? `${Math.round((100 * doneToday) / active.length)}% of members` : "", icon: CheckCircle2, color: KIT.green, loading },
        { label: "On track", value: count("on_track"), sub: `${fmt(count("slightly_behind") + count("behind"))} behind · ${fmt(count("inactive"))} inactive`, icon: Flame, color: KIT.orange, loading },
      ]} />
      <StatGrid stats={[
        { label: "Plan day", value: live < 0 ? "Not started" : `D${live} / D${GATE_PLAN_LAST_DAY}`, sub: live >= 0 ? formatPlanDate(live, { weekday: true, year: true }) : `Starts ${formatPlanDate(0, { year: true })}`, icon: CalendarDays, color: KIT.purple },
        { label: "Avg days done", value: active.length ? avgDone.toFixed(1) : "-", sub: `of ${GATE_PLAN_TOTAL_DAYS}, per active member`, icon: Target, color: KIT.cyan, loading },
        { label: "Cohort PYQ accuracy", value: cohortAcc == null ? "-" : `${cohortAcc}%`, sub: "Self-reported, all members", icon: BarChart3, color: accColor(cohortAcc), loading },
        { label: "Requests", value: settings ? (settings.requestsOpen ? "Open" : "Closed") : "-", sub: "Toggle in Settings", icon: Settings, color: settings?.requestsOpen ? KIT.green : KIT.red },
      ]} />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const on = t.key === tab;
          const badge = t.key === "requests" ? pending.length : 0;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-2 font-sans text-sm px-3.5 py-2 rounded-lg border transition-colors"
              style={{ borderColor: on ? `${KIT.green}55` : KIT.line, background: on ? `${KIT.green}12` : "transparent", color: on ? "#fff" : "rgba(255,255,255,0.6)" }}>
              <t.icon size={14} style={{ color: on ? KIT.green : undefined }} /> {t.label}
              {badge > 0 && <span className="font-sans text-[11px] font-semibold px-1.5 rounded-md" style={{ background: KIT.gold, color: "#05080F" }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {tab === "requests" && <RequestsTab rows={requestRows} loading={loading} adminUid={user?.uid} onChanged={load} />}
      {tab === "members" && <MembersTab rows={memberRows} loading={loading} index={index} adminUid={user?.uid} onChanged={load} />}
      {tab === "analytics" && <AnalyticsTab members={active} index={index} requests={requestRows} loading={loading} />}
      {tab === "settings" && <SettingsTab settings={settings} index={index} />}
    </div>
  );
}

// ── Requests ──────────────────────────────────────────────────────────────

function RequestsTab({ rows, loading, adminUid, onChanged }) {
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const sel = rows.find((r) => r.id === openId);
  const pending = rows.filter((r) => r.status === "pending");

  useEffect(() => { setNote(""); setErr(""); }, [openId]);

  async function act(kind, r, n = "") {
    setBusy(`${kind}:${r.uid}`); setErr("");
    try {
      if (kind === "approve") await approveRequest(r, adminUid);
      else await rejectRequest(r.uid, n, adminUid);
      await onChanged();
      if (openId === r.uid) setOpenId(null);
    } catch (e) {
      setErr(e?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function approveAll() {
    if (!pending.length || !window.confirm(`Approve all ${pending.length} pending request(s)? Each person gets a notification.`)) return;
    setBusy("all"); setErr("");
    try {
      for (const r of pending) await approveRequest(r, adminUid);
      await onChanged();
    } catch (e) {
      setErr(e?.message || "Some approvals failed - refresh to see where it stopped.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {err && <p className="font-sans text-sm" style={{ color: KIT.red }}>{err}</p>}
      <DataTable title="Join requests" icon={Inbox}
        subtitle="Only approved requests get access to the day cards, formula bank and tracker - firestore.rules enforces it. Approving sends the student a notification."
        rows={rows} loading={loading} pageSize={20}
        defaultFilters={{ status: "pending" }}
        searchKeys={["name", "email", "college", "uid"]} searchPlaceholder="Search name, email or college..."
        filters={[
          { key: "status", label: "All statuses", options: Object.entries(REQ_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: "papers", label: "All papers", options: REQUEST_PAPERS.map((p) => ({ value: p.value, label: p.label })) },
          { key: "stage", label: "All stages", options: REQUEST_STAGES },
        ]}
        primaryAction={pending.length > 1 ? { label: busy === "all" ? "Approving..." : `Approve all pending (${pending.length})`, icon: CheckCircle2, onClick: approveAll } : null}
        onRowClick={(r) => setOpenId(r.id)} emptyText="No requests yet."
        columns={[
          { key: "name", label: "Applicant", render: (r) => (
            <div className="min-w-0 w-[220px] xl:w-[260px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.email || r.uid}</p>
            </div>
          ) },
          { key: "papers", label: "Papers", render: (r) => <Pill color={r.papers === "DA" ? KIT.purple : r.papers === "CS" ? KIT.cyan : KIT.green}>{r.papers === "BOTH" ? "CS + DA" : r.papers}</Pill> },
          { key: "stage", label: "Stage", render: (r) => <span className="font-sans text-xs text-white/65">{labelOf(REQUEST_STAGES, r.stage)}</span> },
          { key: "college", label: "College", render: (r) => (
            <div className="max-w-[200px]">
              <p className="font-sans text-xs text-white/70 truncate">{r.college || "-"}</p>
              <p className="font-sans text-[11px] text-white/35">{r.gradYear ? `Class of ${r.gradYear}` : ""}{r.attempt === "repeat" ? `${r.gradYear ? " · " : ""}repeat` : ""}</p>
            </div>
          ) },
          { key: "createdMs", label: "Requested", sort: (r) => r.createdMs, render: (r) => (
            <span className="font-sans text-xs text-white/55">{dateStr(r.createdMs)}{Number.isInteger(r.requestedOnDay) && r.requestedOnDay >= 0 ? ` · D${r.requestedOnDay}` : ""}{r.submissions > 1 ? ` · try ${r.submissions}` : ""}</span>
          ) },
          { key: "status", label: "Status", sort: (r) => r.status, render: (r) => <Pill color={REQ_STATUS[r.status]?.color}>{REQ_STATUS[r.status]?.label || r.status}</Pill> },
        ]}
        rowActions={(r) => [
          { icon: Eye, label: "Details", onClick: () => setOpenId(r.id) },
          r.status === "pending" && { icon: busy === `approve:${r.uid}` ? Loader2 : Check, label: "Approve", onClick: () => act("approve", r), disabled: !!busy },
          r.status === "pending" && { icon: XCircle, label: "Reject", danger: true, onClick: () => setOpenId(r.id), disabled: !!busy },
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={620} title={sel?.name || ""}
        subtitle={sel ? `${sel.email || sel.uid} · ${REQ_STATUS[sel.status]?.label || sel.status}` : ""}
        footer={sel?.status === "pending" && (
          <>
            <SecondaryButton icon={XCircle} disabled={!!busy} onClick={() => act("reject", sel, note)}>Reject{note ? " with note" : ""}</SecondaryButton>
            <PrimaryButton icon={CheckCircle2} busy={busy === `approve:${sel.uid}`} onClick={() => act("approve", sel)}>Approve</PrimaryButton>
          </>
        )}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Papers", labelOf(REQUEST_PAPERS, sel.papers)], ["Stage", labelOf(REQUEST_STAGES, sel.stage)],
                ["College", sel.college || "-"], ["Graduation year", sel.gradYear || "-"],
                ["Attempt", sel.attempt === "repeat" ? "Attempted before" : "First attempt"], ["Previous score", sel.prevScore || "-"],
                ["Requested", dateTimeStr(sel.createdMs)], ["Submissions", sel.submissions || 1],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3" style={{ borderColor: KIT.line }}>
                  <p className="font-sans text-[11px] text-white/45">{k}</p>
                  <p className="font-sans text-sm text-white mt-0.5 break-words">{v}</p>
                </div>
              ))}
            </div>
            <DrawerSection title="Goal" hint="In their own words.">
              <p className="font-sans text-sm text-white/80 whitespace-pre-wrap break-words">{sel.goal || "No goal written."}</p>
            </DrawerSection>
            <DrawerSection title="Commitment">
              <p className="font-sans text-sm" style={{ color: sel.hoursOk ? KIT.green : KIT.red }}>
                {sel.hoursOk ? "Confirmed 3.5 hours every day until February 2027." : "Did not confirm the daily commitment."}
              </p>
            </DrawerSection>
            {sel.status === "pending" && (
              <DrawerSection title="Rejection note (optional)" hint="Shown to the student on their request card and in the notification. Leave empty to reject without a note.">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
                  placeholder="e.g. Seats for this cohort are full - requests reopen in January."
                  className="w-full font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 resize-none"
                  style={{ background: "rgba(255,255,255,0.03)" }} />
              </DrawerSection>
            )}
            {sel.status !== "pending" && (
              <DrawerSection title="Decision">
                <p className="font-sans text-sm text-white/75">{REQ_STATUS[sel.status]?.label} {sel.reviewedMs ? `on ${dateTimeStr(sel.reviewedMs)}` : ""}</p>
                {sel.reviewNote && <p className="font-sans text-sm text-white/60 whitespace-pre-wrap">Note: {sel.reviewNote}</p>}
                {sel.status === "rejected" && <p className="font-sans text-xs text-white/40">The student can edit and re-apply while requests are open.</p>}
                {sel.status === "rejected" && (
                  <div className="pt-1"><PrimaryButton icon={CheckCircle2} busy={busy === `approve:${sel.uid}`} onClick={() => act("approve", sel)}>Approve anyway</PrimaryButton></div>
                )}
              </DrawerSection>
            )}
            {err && <p className="font-sans text-sm" style={{ color: KIT.red }}>{err}</p>}
          </div>
        )}
      </Drawer>
    </>
  );
}

// ── Members ───────────────────────────────────────────────────────────────

function MembersTab({ rows, loading, index, adminUid, onChanged }) {
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const sel = rows.find((r) => r.id === openId);
  const live = currentPlanDay();

  useEffect(() => { setNote(""); setErr(""); }, [openId]);

  async function toggleAccess(r) {
    const revoking = r.raw.access === "active";
    if (revoking && !window.confirm(`Revoke ${r.name}'s access? Their logs are kept; you can restore them later.`)) return;
    setBusy(true); setErr("");
    try {
      if (revoking) await revokeMember(r.uid, note, adminUid); else await restoreMember(r.uid, adminUid);
      await onChanged();
    } catch (e) { setErr(e?.message || "Action failed."); }
    finally { setBusy(false); }
  }

  const weeks = sel ? weeklyTracker(index, sel.raw.logs || {}) : [];
  const weak = sel ? weakTopics(index, sel.raw.logs || {}).slice(0, 6) : [];
  const checklistDone = sel ? Object.values(sel.raw.checklist || {}).filter((c) => c?.seventy).length : 0;
  const recentLogs = sel ? Object.entries(sel.raw.logs || {}).sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, 10) : [];
  const dayMeta = (d) => index.find((x) => x.day === Number(d));

  return (
    <>
      <DataTable title="Members" icon={Users}
        subtitle="Status uses the same numbers each member sees. Missed days count only from the day they were approved."
        rows={rows} loading={loading} pageSize={20}
        searchKeys={["name", "email", "college", "uid"]} searchPlaceholder="Search name, email or college..."
        filters={[
          { key: "status", label: "All statuses", get: (r) => r.status.key, options: MEMBER_STATUS_OPTS.map((k) => ({ value: k, label: MEMBER_STATUS_LABEL[k] })) },
          { key: "papers", label: "All papers", options: REQUEST_PAPERS.map((p) => ({ value: p.value, label: p.label })) },
        ]}
        onRowClick={(r) => setOpenId(r.id)} emptyText="No members yet. Approve a request to add one."
        columns={[
          { key: "name", label: "Member", render: (r) => (
            <div className="min-w-0 w-[220px] xl:w-[260px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.email || r.uid}{r.college ? ` · ${r.college}` : ""}</p>
            </div>
          ) },
          { key: "done", label: "Done", sort: (r) => r.s.done, render: (r) => <ProgressBar value={r.s.percent} /> },
          { key: "streak", label: "Streak", sort: (r) => r.s.currentStreak,
            render: (r) => <span className="font-sans text-sm text-white/80 tabular-nums">{r.s.currentStreak} <span className="text-white/35">/ best {r.s.longestStreak}</span></span> },
          { key: "missed", label: "Missed", sort: (r) => r.s.missed,
            render: (r) => <span className="font-sans text-sm tabular-nums" style={{ color: r.s.missed ? KIT.orange : "rgba(255,255,255,0.55)" }}>{r.s.missed}{r.s.moved ? <span className="text-white/35"> · {r.s.moved} moved</span> : null}</span> },
          { key: "acc", label: "PYQ acc.", sort: (r) => r.s.overall.pct ?? -1,
            render: (r) => <span className="font-sans text-sm font-semibold tabular-nums" style={{ color: accColor(r.s.overall.pct) }}>{r.s.overall.pct == null ? "-" : `${r.s.overall.pct}%`}</span> },
          { key: "joined", label: "Approved", sort: (r) => r.approvedMs,
            render: (r) => <span className="font-sans text-xs text-white/55">D{r.s.joinedOnDay} · {dateStr(r.approvedMs)}</span> },
          { key: "lastActive", label: "Last active", sort: (r) => r.lastActive,
            render: (r) => <span className="font-sans text-xs text-white/55">{dateTimeStr(r.lastActive)}</span> },
          { key: "status", label: "Status", sort: (r) => MEMBER_STATUS_OPTS.indexOf(r.status.key),
            render: (r) => <Pill color={MEMBER_COLOR[r.status.key]}>{r.status.label}</Pill> },
        ]}
        rowActions={(r) => [
          { icon: Eye, label: "Details", onClick: () => setOpenId(r.id) },
          r.raw.access === "active"
            ? { icon: Ban, label: "Revoke access", danger: true, onClick: () => setOpenId(r.id) }
            : { icon: RotateCcw, label: "Restore access", onClick: () => toggleAccess(r), disabled: busy },
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={720} title={sel?.name || ""}
        subtitle={sel ? `${sel.email || sel.uid} · ${PAPER_LABEL[sel.papers] || sel.papers} · ${sel.status.label}` : ""}
        footer={sel && (sel.raw.access === "active"
          ? <SecondaryButton icon={Ban} disabled={busy} onClick={() => toggleAccess(sel)}>Revoke access</SecondaryButton>
          : <PrimaryButton icon={RotateCcw} busy={busy} onClick={() => toggleAccess(sel)}>Restore access</PrimaryButton>)}>
        {sel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Days done", `${sel.s.done} / ${GATE_PLAN_TOTAL_DAYS}`], ["Streak", `${sel.s.currentStreak} (best ${sel.s.longestStreak})`],
                ["Missed since joining", sel.s.missed], ["Moved to Sunday", sel.s.moved],
                ["Topic + test acc.", sel.s.topic.pct == null ? "-" : `${sel.s.topic.pct}% (${sel.s.topic.correct}/${sel.s.topic.attempted})`],
                ["Revision acc.", sel.s.evening.pct == null ? "-" : `${sel.s.evening.pct}%`],
                ["GA acc.", sel.s.ga.pct == null ? "-" : `${sel.s.ga.pct}%`],
                ["Hours logged", sel.s.hoursLogged], ["Checklist at 70%", `${checklistDone} / ${CHECKLIST_ITEM_COUNT}`],
                ["Backlog done", `${sel.s.backlogDone} / ${sel.s.backlogTotal}`], ["Approved", `D${sel.s.joinedOnDay}`],
                ["Never-miss-twice", sel.s.missedTwice ? "Broken" : "OK"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3" style={{ borderColor: KIT.line }}>
                  <p className="font-sans text-[11px] text-white/45">{k}</p>
                  <p className="font-sans text-sm font-semibold text-white tabular-nums mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            <DrawerSection title="Day map" hint="Green = done, amber = moved to Sunday, red = missed, outlined = today. Days before approval are backlog.">
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: GATE_PLAN_TOTAL_DAYS }, (_, d) => {
                  const st = sel.raw.logs?.[String(d)]?.status;
                  const bg = st === LOG_STATUS.DONE ? BAR : st === LOG_STATUS.MOVED ? `${KIT.orange}90` : st === LOG_STATUS.MISSED ? `${KIT.red}80` : st ? "rgba(0,255,255,0.18)" : d <= live ? "rgba(255,255,255,0.06)" : "transparent";
                  return (
                    <div key={d} title={`D${d} · ${formatPlanDate(d)} · ${LOG_STATUS_LABEL[st || "not-started"]}`}
                      className="aspect-square rounded-[3px] flex items-center justify-center font-sans text-[9px] tabular-nums"
                      style={{ background: bg, border: `1px solid ${d === live ? KIT.cyan : "rgba(255,255,255,0.08)"}`, color: st === LOG_STATUS.DONE ? "#05080F" : "rgba(255,255,255,0.4)" }}>{d}</div>
                  );
                })}
              </div>
            </DrawerSection>

            <DrawerSection title="Weekly tracker">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
                    {["Week", "Done", "Missed", "Moved", "Topic acc.", "GA acc.", "Weakest (Sunday)"].map((h) => (
                      <th key={h} className="font-sans text-[10px] uppercase tracking-wider text-white/40 text-left px-2 py-1.5">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {weeks.filter((w) => w.state !== "upcoming").map((w) => (
                      <tr key={w.key} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                        <td className="font-sans text-xs text-white/80 px-2 py-1.5">{w.key}</td>
                        <td className="font-sans text-xs text-white/70 px-2 py-1.5 tabular-nums">{w.done}/{w.planned}</td>
                        <td className="font-sans text-xs px-2 py-1.5 tabular-nums" style={{ color: w.missed ? KIT.red : "rgba(255,255,255,0.4)" }}>{w.missed}</td>
                        <td className="font-sans text-xs px-2 py-1.5 tabular-nums" style={{ color: w.moved ? KIT.orange : "rgba(255,255,255,0.4)" }}>{w.moved}</td>
                        <td className="font-sans text-xs font-semibold px-2 py-1.5" style={{ color: accColor(w.topic) }}>{w.topic == null ? "-" : `${w.topic}%`}</td>
                        <td className="font-sans text-xs font-semibold px-2 py-1.5" style={{ color: accColor(w.ga) }}>{w.ga == null ? "-" : `${w.ga}%`}</td>
                        <td className="font-sans text-xs text-white/60 px-2 py-1.5 max-w-[180px] truncate" title={w.signOff?.repair || ""}>{w.signOff?.weakest || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DrawerSection>

            <DrawerSection title="Weak topics (below 60%)" hint="From their own topic-PYQ scores.">
              {weak.length ? weak.map((w) => (
                <div key={w.day} className="flex items-baseline justify-between gap-3 font-sans text-sm">
                  <span className="text-white/80 truncate">D{w.day} · {w.topic} <span className="text-white/35">({w.subject})</span></span>
                  <span className="tabular-nums flex-shrink-0" style={{ color: accColor(w.pct) }}>{w.pct}% · {w.correct}/{w.attempted}</span>
                </div>
              )) : <p className="font-sans text-sm text-white/35">None - nothing logged under 60%.</p>}
            </DrawerSection>

            <DrawerSection title="Recent logs & mistakes" hint="What they wrote in the daily log.">
              {recentLogs.length ? recentLogs.map(([d, l]) => {
                const m = dayMeta(d);
                return (
                  <div key={d} className="border-b last:border-b-0 pb-2 last:pb-0" style={{ borderColor: KIT.line }}>
                    <p className="font-sans text-xs text-white/45">
                      D{d}{m ? ` · ${m.topic}` : ""} · <span style={{ color: l.status === LOG_STATUS.DONE ? KIT.green : l.status === LOG_STATUS.MISSED ? KIT.red : l.status === LOG_STATUS.MOVED ? KIT.orange : KIT.cyan }}>{LOG_STATUS_LABEL[l.status] || l.status}</span>
                      {l.topicAttempted ? ` · topic ${l.topicCorrect ?? 0}/${l.topicAttempted}` : ""}{l.gaAttempted ? ` · GA ${l.gaCorrect ?? 0}/${l.gaAttempted}` : ""}{l.hours ? ` · ${l.hours} h` : ""}
                      {l.loggedAt ? ` · ${dateTimeStr(Date.parse(l.loggedAt))}` : ""}
                    </p>
                    {l.mistake && <p className="font-sans text-sm text-white/75 mt-0.5 whitespace-pre-wrap break-words">{l.mistake}</p>}
                  </div>
                );
              }) : <p className="font-sans text-sm text-white/35">No logs yet.</p>}
            </DrawerSection>

            {sel.raw.access === "active" && (
              <DrawerSection title="Revoke note (optional)" hint="Shown to the member on the plan page if you revoke access.">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500}
                  className="w-full font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 resize-none"
                  style={{ background: "rgba(255,255,255,0.03)" }} />
              </DrawerSection>
            )}
            {sel.raw.access !== "active" && sel.raw.revokeNote && (
              <DrawerSection title="Revoked"><p className="font-sans text-sm text-white/70">{sel.raw.revokeNote}</p></DrawerSection>
            )}
            {err && <p className="font-sans text-sm" style={{ color: KIT.red }}>{err}</p>}
          </div>
        )}
      </Drawer>
    </>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────

function DayChart({ perDay, live }) {
  const [hover, setHover] = useState(null);
  const days = perDay.slice(0, Math.max(1, live + 1));
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white">Members who marked each day done</h2>
        <p className="font-sans text-xs text-white/45 mt-0.5">D0 to today. Late approvals lower the early bars - that is backlog, not drop-off.</p>
      </div>
      <div className="px-4 sm:px-5 py-4">
        <div className="relative">
          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/10" />
          <span className="absolute -top-2.5 right-0 font-sans text-[10px] text-white/35 tabular-nums bg-[#0a0e16] pl-1">{fmt(max)}</span>
          <div className="h-40 flex items-end gap-[2px]" role="img" aria-label={`Completions for D0 to D${days.length - 1}`}>
            {days.map((d, i) => (
              <div key={d.day} className="flex-1 h-full flex items-end relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="w-full rounded-t-[4px] transition-colors"
                  style={{ height: `${Math.max(d.n ? 3 : 1, (d.n / max) * 100)}%`, background: hover === i ? BAR_HOVER : BAR }} />
                {hover === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border px-2.5 py-1.5 pointer-events-none"
                    style={{ background: "#0b0f17", borderColor: KIT.line }}>
                    <p className="font-sans text-[11px] text-white/50">D{d.day} · {formatPlanDate(d.day)} · {d.topic}</p>
                    <p className="font-sans text-sm font-semibold text-white tabular-nums">{fmt(d.n)} done</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-px bg-white/15" />
          <div className="flex justify-between mt-1.5 font-sans text-[10px] text-white/35 tabular-nums">
            <span>D0</span><span>D{days.length - 1}</span>
          </div>
        </div>
        <table className="sr-only">
          <caption>Completions per day</caption>
          <tbody>{days.map((d) => <tr key={d.day}><td>D{d.day}</td><td>{d.n}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function BarRows({ title, subtitle, rows, empty }) {
  const max = Math.max(1, ...rows.map((r) => r.value || 0));
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-4 sm:px-5 py-4 space-y-2.5">
        {rows.length ? rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="font-sans text-xs text-white/75 truncate">{r.label}</span>
              <span className="font-sans text-xs tabular-nums flex-shrink-0" style={{ color: r.color || "rgba(255,255,255,0.6)" }}>{r.display ?? r.value}{r.sub ? <span className="text-white/35"> · {r.sub}</span> : null}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${((r.value || 0) / (r.max || max)) * 100}%`, background: r.color || BAR }} />
            </div>
          </div>
        )) : <p className="font-sans text-sm text-white/35">{empty}</p>}
      </div>
    </div>
  );
}

function AnalyticsTab({ members, index, requests, loading }) {
  const live = currentPlanDay();
  const perDay = useMemo(() => Array.from({ length: GATE_PLAN_TOTAL_DAYS }, (_, d) => ({
    day: d, topic: index.find((x) => x.day === d)?.topic || "",
    n: members.filter((m) => m.raw.logs?.[String(d)]?.status === LOG_STATUS.DONE).length,
  })), [members, index]);

  // Cohort accuracy per subject: pooled correct/attempted across members, so
  // one member with 40 attempts outweighs one with 2 - which is what "how hard
  // is this subject for the cohort" should mean.
  const subjects = useMemo(() => {
    const by = {};
    for (const m of members) for (const s of subjectAccuracy(index, m.raw.logs || {})) {
      const b = (by[s.subject] = by[s.subject] || { correct: 0, attempted: 0, people: 0 });
      b.correct += s.correct; b.attempted += s.attempted; if (s.attempted) b.people++;
    }
    return Object.entries(by).filter(([, b]) => b.attempted > 0)
      .map(([label, b]) => { const p = pct(b.correct, b.attempted); return { label, value: p, max: 100, display: `${p}%`, sub: `${b.people} member${b.people === 1 ? "" : "s"} · ${b.correct}/${b.attempted}`, color: accColor(p) }; })
      .sort((a, b) => a.value - b.value);
  }, [members, index]);

  // Hardest days: topic days with the lowest pooled accuracy, needing at
  // least 2 members' attempts so one bad day for one person is not "hard".
  const hardest = useMemo(() => index.filter((d) => d.type === "topic").map((d) => {
    let c = 0, a = 0, people = 0;
    for (const m of members) { const l = m.raw.logs?.[String(d.day)]; if (Number(l?.topicAttempted)) { c += Number(l.topicCorrect) || 0; a += Number(l.topicAttempted); people++; } }
    return { d, c, a, people, p: pct(c, a) };
  }).filter((x) => x.people >= 2 && x.p != null).sort((x, y) => x.p - y.p).slice(0, 8)
    .map((x) => ({ label: `D${x.d.day} · ${x.d.topic}`, value: x.p, max: 100, display: `${x.p}%`, sub: `${x.people} members`, color: accColor(x.p) })), [members, index]);

  const weekly = useMemo(() => WEEK_KEYS.map((k) => {
    const days = index.filter((d) => d.week === k);
    if (!days.length || days[0].day > live) return null;
    const trackers = members.map((m) => weeklyTracker(index, m.raw.logs || {}).find((w) => w.key === k)).filter(Boolean);
    const avgCompletion = trackers.length ? Math.round(trackers.reduce((n, w) => n + w.completion, 0) / trackers.length) : 0;
    const tC = trackers.reduce((n, w) => n + w.topicC, 0), tA = trackers.reduce((n, w) => n + w.topicA, 0);
    return { key: k, avgCompletion, acc: pct(tC, tA), signOffs: trackers.filter((w) => w.signOff).length, n: trackers.length };
  }).filter(Boolean), [members, index, live]);

  const split = (list, key, opts) => opts.map((o) => ({ label: o.label, value: list.filter((r) => r[key] === o.value).length }));
  const approvedReqs = requests.filter((r) => r.status === "approved");

  if (loading) return <div className="rounded-xl border p-8 font-sans text-sm text-white/40" style={{ borderColor: KIT.line }}>Loading...</div>;
  if (!members.length) return <div className="rounded-xl border p-8 font-sans text-sm text-white/40" style={{ borderColor: KIT.line, background: KIT.surface }}>Analytics appear once members start logging days.</div>;

  return (
    <div className="space-y-5">
      <DayChart perDay={perDay} live={Math.max(0, Math.min(live, GATE_PLAN_LAST_DAY))} />
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <BarRows title="Cohort accuracy by subject" subtitle="Pooled topic-PYQ scores, weakest first. Green 75%+, amber 60-75%, red below 60%." rows={subjects} empty="No topic scores logged yet." />
        <BarRows title="Hardest days so far" subtitle="Lowest pooled accuracy, at least 2 members attempted. Worth a cohort notice or a revision push." rows={hardest} empty="Needs at least two members' scores on the same day." />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: KIT.line }}>
          <h2 className="font-sans text-base font-semibold text-white">Week by week</h2>
          <p className="font-sans text-xs text-white/45 mt-0.5">Average completion across active members, pooled topic accuracy, and how many filled the Sunday sign-off.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
              {["Week", "Theme", "Avg completion", "Topic accuracy", "Sunday sign-offs"].map((h) => (
                <th key={h} className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left px-4 py-2.5">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {weekly.map((w) => (
                <tr key={w.key} className="border-b last:border-b-0" style={{ borderColor: KIT.line }}>
                  <td className="font-sans text-sm text-white/85 px-4 py-2.5">{w.key}</td>
                  <td className="font-sans text-xs text-white/55 px-4 py-2.5">{WEEKS[w.key]?.title}</td>
                  <td className="px-4 py-2.5"><ProgressBar value={w.avgCompletion} /></td>
                  <td className="font-sans text-sm font-semibold px-4 py-2.5" style={{ color: accColor(w.acc) }}>{w.acc == null ? "-" : `${w.acc}%`}</td>
                  <td className="font-sans text-sm text-white/70 px-4 py-2.5 tabular-nums">{w.key === "Start" || w.key === "Lock-in" ? "-" : `${w.signOffs} / ${w.n}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <BarRows title="Members by paper" rows={split(members, "papers", REQUEST_PAPERS)} empty="-" />
        <BarRows title="Approved requests by stage" rows={split(approvedReqs, "stage", REQUEST_STAGES)} empty="-" />
      </div>
    </div>
  );
}

// ── Settings & content ────────────────────────────────────────────────────

function SettingsTab({ settings, index }) {
  const [notice, setNotice] = useState("");
  const [closedMessage, setClosedMessage] = useState("");
  const [busy, setBusy] = useState(null);
  const [saved, setSaved] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!settings) return;
    setNotice(settings.notice || "");
    setClosedMessage(settings.closedMessage || "");
  }, [settings]);

  async function save(key, patch) {
    setBusy(key); setErr(""); setSaved("");
    try { await updatePlanSettings(patch); setSaved(key); }
    catch (e) { setErr(e?.message || "Could not save."); }
    finally { setBusy(null); }
  }

  const counts = index.reduce((m, d) => ({ ...m, [d.type]: (m[d.type] || 0) + 1 }), {});
  const box = "rounded-xl border p-4 sm:p-5 space-y-3";
  const input = "w-full font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 resize-none";

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      <div className={box} style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-base font-semibold text-white flex items-center gap-2"><Inbox size={16} style={{ color: KIT.gold }} /> Accept new requests</h2>
            <p className="font-sans text-xs text-white/45 mt-0.5">Enforced in firestore.rules: while closed, nobody can file or re-submit a request. Pending requests stay in the queue.</p>
          </div>
          <Toggle on={!!settings?.requestsOpen} disabled={!settings || busy === "open"} label="Requests open"
            onChange={(v) => save("open", { requestsOpen: v })} />
        </div>
        <label className="block">
          <span className="font-sans text-xs text-white/50">Message shown while closed</span>
          <textarea rows={2} maxLength={400} value={closedMessage} onChange={(e) => setClosedMessage(e.target.value)}
            placeholder="e.g. This cohort is full. The January mock cohort opens on Jan 1." className={`${input} mt-1`} style={{ background: "rgba(255,255,255,0.03)" }} />
        </label>
        <SecondaryButton icon={busy === "closed" ? Loader2 : Check} disabled={busy === "closed"} onClick={() => save("closed", { closedMessage })}>Save message</SecondaryButton>
        {saved === "open" && <p className="font-sans text-xs" style={{ color: KIT.green }}>Saved - requests are now {settings?.requestsOpen ? "open" : "closed"}.</p>}
      </div>

      <div className={box} style={{ background: KIT.surface, borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white flex items-center gap-2"><Megaphone size={16} style={{ color: KIT.cyan }} /> Cohort notice</h2>
        <p className="font-sans text-xs text-white/45">Shown at the top of every member&apos;s Today screen and on the public landing. Leave empty to hide it.</p>
        <textarea rows={4} maxLength={1000} value={notice} onChange={(e) => setNotice(e.target.value)}
          placeholder="e.g. Week 3 test moves to Monday this week because of Dussehra." className={input} style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="flex items-center gap-2">
          <PrimaryButton icon={Megaphone} busy={busy === "notice"} onClick={() => save("notice", { notice })}>Publish notice</PrimaryButton>
          {settings?.notice && <SecondaryButton onClick={() => { setNotice(""); save("notice", { notice: "" }); }}>Clear</SecondaryButton>}
        </div>
        {saved === "notice" && <p className="font-sans text-xs" style={{ color: KIT.green }}>Notice {notice ? "published" : "cleared"}.</p>}
      </div>

      <div className={`${box} lg:col-span-2`} style={{ background: KIT.surface, borderColor: KIT.line }}>
        <h2 className="font-sans text-base font-semibold text-white flex items-center gap-2"><Database size={16} style={{ color: KIT.purple }} /> Plan content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[["Days in the outline", index.length], ["Topic days", counts.topic || 0], ["Sunday tests", counts.sunday || 0], ["Lock-in days", counts.lockin || 0], ["Setup", counts.setup || 0]].map(([k, v]) => (
            <div key={k} className="rounded-lg border p-3" style={{ borderColor: KIT.line }}>
              <p className="font-sans text-[11px] text-white/45">{k}</p>
              <p className="font-sans text-lg font-semibold tabular-nums" style={{ color: k === "Days in the outline" && v !== GATE_PLAN_TOTAL_DAYS ? KIT.red : "#fff" }}>{v}</p>
            </div>
          ))}
        </div>
        {index.length !== GATE_PLAN_TOTAL_DAYS && (
          <p className="font-sans text-sm flex items-center gap-2" style={{ color: KIT.orange }}><AlertTriangle size={14} /> The plan is not fully imported - members will see empty day cards.</p>
        )}
        <p className="font-sans text-xs text-white/45 leading-relaxed">
          Content comes from <code className="text-white/70">GATE/GATE_2027_Daily_Resources_Planner.xlsx</code>. To change it, edit the workbook and run
          {" "}<code className="text-white/70">node scripts/extract-gate-plan.mjs</code> then <code className="text-white/70">node scripts/import-gate-plan.mjs --apply</code>.
          Re-importing replaces content only; it never touches requests, members or logs. The strategy text (rules, routine, tiers, ladder) lives in
          {" "}<code className="text-white/70">lib/gatePlanGuide.js</code>.
        </p>
        <a href="https://campus.devert.in/gate?section=plan" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-sans text-sm" style={{ color: KIT.cyan }}>
          <GraduationCap size={14} /> Open the plan on Campus (admin preview) <ExternalLink size={12} />
        </a>
      </div>
      {err && <p className="font-sans text-sm lg:col-span-2" style={{ color: KIT.red }}>{err}</p>}
    </div>
  );
}
