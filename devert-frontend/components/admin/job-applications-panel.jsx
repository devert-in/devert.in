"use client";

// Job application review, for the admin console's COMMUNITY tab.
//
// Sits with the other inboxes (campus demo requests, ambassador applications)
// rather than next to the job-posting editor in CONTENT, because it is the same
// kind of work as those two - a queue a human works through - and nothing like
// authoring a posting.
//
// Loads the whole collection once and filters client-side, so this never needs a
// status+createdAt composite index deployed. Same decision, for the same reason,
// as components/admin/demo-requests-panel.jsx - read that file's note first.

import { useEffect, useState } from "react";
import {
  Check, Eye, ExternalLink, FileText, Github, Inbox, Linkedin, Mail, Phone,
  RefreshCw, RotateCcw, Trophy, UserCheck, Users, X,
} from "lucide-react";
import {
  KIT, fmt, StatGrid, Pill, DataTable, Drawer, DrawerSection,
  PrimaryButton, SecondaryButton,
} from "@/components/admin/admin-kit";
import { logAdminActivity } from "@/lib/adminActivityLog";
import {
  APPLICATION_STATUS, GENERAL_INTEREST_JOB_ID, fetchApplications,
  setApplicationStatus,
} from "@/lib/careers";

const STATUS_META = {
  [APPLICATION_STATUS.NEW]: { label: "New", color: KIT.orange },
  [APPLICATION_STATUS.SCREENING]: { label: "Screening", color: KIT.cyan },
  [APPLICATION_STATUS.INTERVIEWING]: { label: "Interviewing", color: KIT.purple },
  [APPLICATION_STATUS.HIRED]: { label: "Hired", color: KIT.green },
  [APPLICATION_STATUS.REJECTED]: { label: "Rejected", color: KIT.red },
  [APPLICATION_STATUS.CLOSED]: { label: "Closed", color: KIT.muted },
};

// fetchApplications() default page size; the total stat says so when it is hit.
const APPLICATION_CAP = 200;

const tsMillis = (ts) => (ts?.toMillis ? ts.toMillis() : ts?.seconds ? ts.seconds * 1000 : 0);
function fmtWhen(ts) {
  const ms = tsMillis(ts);
  if (!ms) return "-";
  return new Date(ms).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const roleLabel = (r) => (r.jobId === GENERAL_INTEREST_JOB_ID
  ? "General application"
  : (r.jobTitle || "(role deleted)"));

// The workflow, unchanged from the list version: each status has one forward
// step, reject is available until a terminal state, and a terminal state can be
// reopened back to NEW.
function nextActions(r) {
  const s = r.status;
  const out = [];
  if (s === APPLICATION_STATUS.NEW) out.push({ to: APPLICATION_STATUS.SCREENING, label: "Move to screening", icon: Check });
  if (s === APPLICATION_STATUS.SCREENING) out.push({ to: APPLICATION_STATUS.INTERVIEWING, label: "Move to interviewing", icon: Check });
  if (s === APPLICATION_STATUS.INTERVIEWING) out.push({ to: APPLICATION_STATUS.HIRED, label: "Mark hired", icon: Check });
  if (s !== APPLICATION_STATUS.REJECTED && s !== APPLICATION_STATUS.HIRED) out.push({ to: APPLICATION_STATUS.REJECTED, label: "Reject", icon: X, danger: true });
  if (s === APPLICATION_STATUS.REJECTED || s === APPLICATION_STATUS.HIRED) out.push({ to: APPLICATION_STATUS.NEW, label: "Reopen", icon: RotateCcw });
  return out;
}

// Applicant-supplied URLs are rendered as links, which makes them a click away
// from the reviewer's session. noopener/noreferrer is therefore not optional
// here, and neither is refusing anything that isn't plainly http(s) - a
// javascript: or data: URL in this list would execute in the admin console.
function SafeLink({ href, icon: Icon, label }) {
  if (!href) return null;
  let safe = null;
  try {
    const u = new URL(href);
    if (u.protocol === "http:" || u.protocol === "https:") safe = u.href;
  } catch { /* not a URL at all - show it as plain text below */ }

  if (!safe) {
    return (
      <span className="inline-flex items-center gap-1.5 font-sans text-sm text-white/35" title="not a valid link">
        <Icon size={13} /> {label} <span className="text-xs">(not a valid link: {href})</span>
      </span>
    );
  }
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-sans text-sm hover:underline" style={{ color: KIT.cyan }}>
      <Icon size={13} /> {label}
    </a>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="font-sans text-[11px] text-white/40 mb-0.5">{label}</p>
      <div className="font-sans text-sm text-white/80 break-words">{children}</div>
    </div>
  );
}

export function JobApplicationsPanel() {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchApplications(APPLICATION_CAP)
      .then((r) => { if (alive) { setRows(r); setError(""); } })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        setError(e?.message || "Could not load job applications.");
      });
    return () => { alive = false; };
  }, [nonce]);

  const decide = async (id, next) => {
    setBusy(id);
    setError("");
    try {
      await setApplicationStatus(id, next);
      const row = rows?.find((r) => r.id === id);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
      logAdminActivity(`set job application ${next}`, `${row?.name || id} - ${row ? roleLabel(row) : ""}`, "careers");
    } catch (e) {
      setError(e?.message || "Could not update that application.");
    } finally {
      setBusy("");
    }
  };

  const loading = rows === null;
  const list = rows || [];
  const count = (s) => list.filter((r) => r.status === s).length;
  const inPipeline = count(APPLICATION_STATUS.SCREENING) + count(APPLICATION_STATUS.INTERVIEWING);
  const roleOptions = [...new Map(list.map((r) => [r.jobId, roleLabel(r)])).entries()]
    .map(([value, label]) => ({ value: value || "", label }))
    .filter((o) => o.value)
    .sort((a, b) => a.label.localeCompare(b.label));
  // Derived from rows, so a status change made from the drawer shows in it at once.
  const open = openId ? list.find((r) => r.id === openId) : null;
  const openMeta = open ? (STATUS_META[open.status] || STATUS_META[APPLICATION_STATUS.NEW]) : null;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Applications", value: list.length, sub: list.length >= APPLICATION_CAP ? `latest ${APPLICATION_CAP} loaded` : `${roleOptions.length} roles`, icon: Inbox, color: KIT.cyan, loading },
        { label: "New", value: count(APPLICATION_STATUS.NEW), sub: "Awaiting first review", icon: FileText, color: KIT.orange, loading },
        { label: "In pipeline", value: inPipeline, sub: `${count(APPLICATION_STATUS.INTERVIEWING)} interviewing`, icon: Users, color: KIT.purple, loading },
        { label: "Hired", value: count(APPLICATION_STATUS.HIRED), sub: `${count(APPLICATION_STATUS.REJECTED)} rejected`, icon: Trophy, color: KIT.green, loading },
      ]} />

      {error && (
        <p className="font-sans text-sm px-3 py-2 rounded-lg"
          style={{ color: KIT.red, background: `${KIT.red}0F`, border: `1px solid ${KIT.red}33` }}>
          {error}
        </p>
      )}

      <DataTable title="Job applications" icon={Inbox} defaultFilters={{ status: "new" }}
        subtitle="Candidates from careers.devert.in. Open a row for the full application and status actions."
        rows={list} loading={loading}
        searchKeys={["name", "email", "jobTitle", "jobId", "devertHandle", "phone"]} searchPlaceholder="Search candidates..."
        filters={[
          { key: "status", label: "All statuses", options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
          ...(roleOptions.length ? [{ key: "jobId", label: "All roles", options: roleOptions }] : []),
        ]}
        toolbarExtra={(
          <button onClick={() => setNonce((n) => n + 1)}
            className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs text-white/50 hover:text-white px-2 py-2">
            <RefreshCw size={12} /> Refresh
          </button>
        )}
        onRowClick={(r) => setOpenId(r.id)}
        emptyText="No applications yet."
        columns={[
          { key: "name", label: "Candidate", render: (r) => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate flex items-center gap-1.5">
                {r.name || "(no name)"}
                {r.uid && <UserCheck size={12} className="flex-shrink-0" style={{ color: KIT.green }} aria-label="applied while signed in to DeVert" />}
              </p>
              <p className="font-sans text-xs text-white/40 truncate">{r.email}</p>
            </div>
          ) },
          { key: "jobTitle", label: "Role", sort: roleLabel, render: (r) => (
            <div className="min-w-0 max-w-[240px]">
              <p className="font-sans text-sm text-white/75 truncate">{roleLabel(r)}</p>
              {r.jobId !== GENERAL_INTEREST_JOB_ID && <p className="font-sans text-xs text-white/40 truncate">/{r.jobId}</p>}
            </div>
          ) },
          { key: "status", label: "Status", render: (r) => {
            const meta = STATUS_META[r.status] || STATUS_META[APPLICATION_STATUS.NEW];
            return <Pill color={meta.color}>{meta.label}</Pill>;
          } },
          { key: "createdAt", label: "Applied", sort: (r) => tsMillis(r.createdAt), render: (r) => (
            <span className="font-sans text-xs text-white/55">{fmtWhen(r.createdAt)}</span>
          ) },
        ]}
        rowActions={(r) => [
          { icon: Eye, label: "View application", onClick: () => setOpenId(r.id) },
          ...nextActions(r).map((a) => ({
            icon: a.icon, label: a.label, danger: a.danger, disabled: busy === r.id,
            onClick: () => decide(r.id, a.to),
          })),
        ]}
      />

      <p className="font-sans text-xs text-white/35 leading-relaxed">
        <Inbox size={12} className="inline mr-1 -mt-0.5" />
        These arrive from the unauthenticated form on careers.devert.in and each role page - firestore.rules
        whitelists the fields it can write and pins status to &quot;new&quot;, so nothing here can be
        forged by the applicant. Links are applicant-supplied: they open in a new tab with no referrer,
        and anything that isn&apos;t an http(s) URL is shown as plain text rather than made clickable.
      </p>

      <Drawer open={!!open} onClose={() => setOpenId(null)} width={640}
        title={open ? (open.name || "(no name)") : ""}
        subtitle={open ? `${roleLabel(open)} - applied ${fmtWhen(open.createdAt)}${open.source ? ` via ${open.source}` : ""}` : ""}
        footer={open && <>
          <div className="mr-auto"><Pill color={openMeta.color}>{openMeta.label}</Pill></div>
          <SecondaryButton onClick={() => setOpenId(null)}>Close</SecondaryButton>
          {nextActions(open).map((a) => (a.to === APPLICATION_STATUS.REJECTED || a.to === APPLICATION_STATUS.NEW ? (
            <SecondaryButton key={a.to} icon={a.icon} disabled={busy === open.id} onClick={() => decide(open.id, a.to)}>{a.label}</SecondaryButton>
          ) : (
            <PrimaryButton key={a.to} icon={a.icon} busy={busy === open.id} onClick={() => decide(open.id, a.to)}>{a.label}</PrimaryButton>
          )))}
        </>}>
        {open && (
          <>
            <DrawerSection title="Candidate">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Email">
                  <a href={`mailto:${open.email}`} className="inline-flex items-center gap-1.5 hover:underline" style={{ color: KIT.cyan }}>
                    <Mail size={13} /> {open.email}
                  </a>
                </Field>
                <Field label="Phone">
                  {open.phone ? <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {open.phone}</span> : "-"}
                </Field>
                <Field label="DeVert account">
                  {open.uid
                    ? <span className="inline-flex items-center gap-1.5" style={{ color: KIT.green }}><UserCheck size={13} /> Member{open.devertHandle ? ` - @${open.devertHandle}` : ""}</span>
                    : open.devertHandle ? `@${open.devertHandle} (not signed in)` : "Not signed in"}
                </Field>
                <Field label="Role">
                  {open.jobId === GENERAL_INTEREST_JOB_ID
                    ? "General application - no specific role"
                    : `${open.jobTitle || "(role deleted)"} - careers.devert.in/${open.jobId}`}
                </Field>
              </div>
            </DrawerSection>

            <DrawerSection title="Links" hint="Applicant-supplied. Opened in a new tab with no referrer.">
              {open.resumeUrl || open.githubUrl || open.linkedinUrl || open.portfolioUrl ? (
                <div className="flex flex-col gap-2">
                  <SafeLink href={open.resumeUrl} icon={FileText} label="Resume" />
                  <SafeLink href={open.githubUrl} icon={Github} label="GitHub" />
                  <SafeLink href={open.linkedinUrl} icon={Linkedin} label="LinkedIn" />
                  <SafeLink href={open.portfolioUrl} icon={ExternalLink} label="Portfolio" />
                </div>
              ) : (
                <p className="font-sans text-sm text-white/35">No links provided.</p>
              )}
            </DrawerSection>

            <DrawerSection title="Cover note">
              {open.coverNote
                ? <p className="font-sans text-sm text-white/75 leading-relaxed whitespace-pre-line break-words">{open.coverNote}</p>
                : <p className="font-sans text-sm text-white/35">No cover note.</p>}
            </DrawerSection>

            <p className="font-sans text-xs text-white/30">Application ID {open.id} - {fmt(list.filter((r) => r.email && r.email === open.email).length)} application(s) from this email in the loaded set.</p>
          </>
        )}
      </Drawer>
    </div>
  );
}
