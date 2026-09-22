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
  Check, ExternalLink, FileText, Github, Inbox, Linkedin, Loader2, Mail,
  Phone, RefreshCw, RotateCcw, UserCheck, X,
} from "lucide-react";
import {
  APPLICATION_STATUS, GENERAL_INTEREST_JOB_ID, fetchApplications,
  setApplicationStatus,
} from "@/lib/careers";

const STATUS_META = {
  [APPLICATION_STATUS.NEW]: { label: "NEW", color: "#FF9500" },
  [APPLICATION_STATUS.SCREENING]: { label: "SCREENING", color: "#00FFFF" },
  [APPLICATION_STATUS.INTERVIEWING]: { label: "INTERVIEWING", color: "#C77DFF" },
  [APPLICATION_STATUS.HIRED]: { label: "HIRED", color: "#00FF41" },
  [APPLICATION_STATUS.REJECTED]: { label: "REJECTED", color: "#FF5050" },
  [APPLICATION_STATUS.CLOSED]: { label: "CLOSED", color: "rgba(255,255,255,0.35)" },
};

const FILTERS = [
  { key: "all", label: "ALL", color: "#C77DFF" },
  ...Object.entries(STATUS_META).map(([key, m]) => ({ key, ...m })),
];

function fmtWhen(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
      <span className="flex items-center gap-1 text-white/30" title="not a valid link">
        <Icon size={10} /> {label}
      </span>
    );
  }
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 hover:underline" style={{ color: "#00FFFF" }}>
      <Icon size={10} /> {label}
    </a>
  );
}

export function JobApplicationsPanel() {
  const [filter, setFilter] = useState(APPLICATION_STATUS.NEW);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");
    fetchApplications()
      .then((r) => { if (alive) setRows(r); })
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
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    } catch (e) {
      setError(e?.message || "Could not update that application.");
    } finally {
      setBusy("");
    }
  };

  const newCount = rows?.filter((r) => r.status === APPLICATION_STATUS.NEW).length || 0;
  const visible = rows?.filter((r) => filter === "all" || r.status === filter) || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: filter === f.key ? f.color : "rgba(255,255,255,0.3)",
              background: filter === f.key ? `${f.color}12` : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === f.key ? `${f.color}40` : "rgba(255,255,255,0.06)"}`,
            }}>
            {f.label}{f.key === APPLICATION_STATUS.NEW && newCount > 0 ? ` (${newCount})` : ""}
          </button>
        ))}
        <button onClick={() => setNonce((n) => n + 1)}
          className="ml-auto font-mono text-[10px] text-white/35 flex items-center gap-1.5 px-2.5 py-1.5">
          <RefreshCw size={10} /> refresh
        </button>
      </div>

      {error && (
        <p className="font-mono text-[10.5px] mb-3 px-3 py-2 rounded-lg"
          style={{ color: "#FF9A9A", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : visible.length === 0 ? (
        <p className="font-mono text-xs text-white/25">No {filter === "all" ? "" : `${filter} `}applications.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META[APPLICATION_STATUS.NEW];
            const general = r.jobId === GENERAL_INTEREST_JOB_ID;
            return (
              <div key={r.id} className="p-3.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <p className="font-mono text-[12px] text-white/85 flex items-center gap-2 flex-wrap">
                      {r.name || "(no name)"}
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                        style={{ color: meta.color, background: `${meta.color}12` }}>
                        {meta.label}
                      </span>
                      {r.uid && (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1"
                          style={{ color: "#00FF41", background: "rgba(0,255,65,0.1)" }}
                          title="applied while signed in to DeVert">
                          <UserCheck size={9} /> MEMBER
                        </span>
                      )}
                    </p>

                    <p className="font-mono text-[10.5px] text-white/40 mt-0.5">
                      {general
                        ? "general application - no specific role"
                        : `${r.jobTitle || "(role deleted)"} · careers.devert.in/${r.jobId}`}
                      {r.devertHandle ? ` · @${r.devertHandle}` : ""}
                    </p>

                    <p className="font-mono text-[10.5px] mt-1.5 flex items-center gap-3 flex-wrap">
                      <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:underline" style={{ color: "#00FFFF" }}>
                        <Mail size={10} /> {r.email}
                      </a>
                      {r.phone && (
                        <span className="flex items-center gap-1 text-white/40">
                          <Phone size={10} /> {r.phone}
                        </span>
                      )}
                    </p>

                    <p className="font-mono text-[10.5px] mt-1.5 flex items-center gap-3 flex-wrap">
                      <SafeLink href={r.resumeUrl} icon={FileText} label="resume" />
                      <SafeLink href={r.githubUrl} icon={Github} label="github" />
                      <SafeLink href={r.linkedinUrl} icon={Linkedin} label="linkedin" />
                      <SafeLink href={r.portfolioUrl} icon={ExternalLink} label="portfolio" />
                    </p>

                    {r.coverNote && (
                      <p className="font-mono text-[10.5px] text-white/45 mt-2 leading-relaxed whitespace-pre-line">
                        {r.coverNote}
                      </p>
                    )}

                    <p className="font-mono text-[9.5px] text-white/20 mt-2">
                      {fmtWhen(r.createdAt)}{r.source ? ` · via ${r.source}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {r.status === APPLICATION_STATUS.NEW && (
                      <button onClick={() => decide(r.id, APPLICATION_STATUS.SCREENING)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} screening
                      </button>
                    )}
                    {r.status === APPLICATION_STATUS.SCREENING && (
                      <button onClick={() => decide(r.id, APPLICATION_STATUS.INTERVIEWING)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#C77DFF", border: "1px solid rgba(199,125,255,0.3)", background: "rgba(199,125,255,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} interviewing
                      </button>
                    )}
                    {r.status === APPLICATION_STATUS.INTERVIEWING && (
                      <button onClick={() => decide(r.id, APPLICATION_STATUS.HIRED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} hired
                      </button>
                    )}
                    {r.status !== APPLICATION_STATUS.REJECTED && r.status !== APPLICATION_STATUS.HIRED && (
                      <button onClick={() => decide(r.id, APPLICATION_STATUS.REJECTED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#FF5050", border: "1px solid rgba(255,80,80,0.3)" }}>
                        <X size={10} /> reject
                      </button>
                    )}
                    {(r.status === APPLICATION_STATUS.REJECTED || r.status === APPLICATION_STATUS.HIRED) && (
                      <button onClick={() => decide(r.id, APPLICATION_STATUS.NEW)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <RotateCcw size={10} /> reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="font-mono text-[10px] text-white/25 mt-4 leading-relaxed">
        <Inbox size={10} className="inline mr-1 -mt-0.5" />
        These arrive from the unauthenticated form on careers.devert.in and each role page - firestore.rules
        whitelists the fields it can write and pins status to &quot;new&quot;, so nothing here can be
        forged by the applicant. Links are applicant-supplied: they open in a new tab with no referrer,
        and anything that isn&apos;t an http(s) URL is shown as plain text rather than made clickable.
      </p>
    </div>
  );
}
