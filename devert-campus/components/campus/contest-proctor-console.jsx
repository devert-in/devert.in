"use client";

// The invigilator's view of a proctored contest.
//
// Design premise: an invigilator reviewing 300 attempts has minutes, not hours,
// so the console's job is to rank the cohort by "who needs a human" and get out
// of the way. That ranking deliberately treats a SILENT session as worse than a
// noisy one - a student who disables JavaScript stops sending violations and
// stops sending heartbeats, so sorting purely by violation count would float the
// honest-but-twitchy students to the top and bury the one who unplugged the
// instrumentation. See proctorRiskScore().
//
// Photos are fetched one student at a time through a callable (never a public
// URL - see functions/index.js), and only when a reviewer actually opens a row.
// Nobody needs a wall of a hundred students' faces rendered by default.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck, AlertTriangle, Camera, CameraOff, Monitor, Clock, RefreshCw,
  X, ChevronRight, Download, EyeOff, Activity,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusStat, CampusSkeleton, CampusEmptyState, CampusChip,
} from "@/components/campus/campus-ui";
import {
  fetchProctorSessions, fetchProctorEvents, fetchProctorFrame, listProctorFrames,
  heartbeatStatus, proctorRiskScore, PROCTOR_EVENT,
} from "@/lib/proctoring";

const EVENT_LABEL = {
  [PROCTOR_EVENT.SESSION_START]:    "Session started",
  [PROCTOR_EVENT.CONSENT]:          "Consent given",
  [PROCTOR_EVENT.TAB_SWITCH]:       "Left the contest window",
  [PROCTOR_EVENT.WINDOW_BLUR]:      "Window lost focus",
  [PROCTOR_EVENT.FULLSCREEN_EXIT]:  "Exited fullscreen",
  [PROCTOR_EVENT.FULLSCREEN_ENTER]: "Returned to fullscreen",
  [PROCTOR_EVENT.CAMERA_LOST]:      "Camera stopped",
  [PROCTOR_EVENT.CAMERA_RESTORED]:  "Camera restored",
  [PROCTOR_EVENT.SNAPSHOT]:         "Photo captured",
  [PROCTOR_EVENT.SNAPSHOT_FAILED]:  "Photo upload failed",
  [PROCTOR_EVENT.SESSION_END]:      "Session ended",
};

const SEVERE = new Set([
  PROCTOR_EVENT.TAB_SWITCH,
  PROCTOR_EVENT.FULLSCREEN_EXIT,
  PROCTOR_EVENT.CAMERA_LOST,
]);

function fmtTime(v) {
  const d = v?.toDate?.() || (typeof v === "string" ? new Date(v) : null);
  if (!d || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function riskTone(score) {
  if (score >= 100) return { color: CAMPUS.bad, tint: CAMPUS.badTint, label: "Review" };
  if (score >= 20) return { color: CAMPUS.warn, tint: CAMPUS.warnTint, label: "Flagged" };
  return { color: CAMPUS.good, tint: CAMPUS.goodTint, label: "Clean" };
}

// ---------------------------------------------------------------------------

function FrameViewer({ contestId, session, onClose }) {
  const [frame, setFrame] = useState(null);
  const [frames, setFrames] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seq, setSeq] = useState(null);

  const load = useCallback(async (wantSeq) => {
    setLoading(true);
    setError("");
    try {
      const got = await fetchProctorFrame(contestId, session.uid, wantSeq);
      setFrame(prev => {
        // Revoking the previous blob: URL matters here - a reviewer clicking
        // through 40 archived frames would otherwise leak 40 decoded images for
        // the lifetime of the page.
        if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        return got;
      });
    } catch (e) {
      setError(
        e?.code === "functions/not-found"
          ? "No photo was captured for this student."
          : e?.code === "functions/permission-denied"
            ? "You are not listed as an invigilator for this contest."
            : "Could not load the photo. The proctoring functions may not be deployed yet."
      );
    } finally {
      setLoading(false);
    }
  }, [contestId, session.uid]);

  useEffect(() => { load(null); }, [load]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [f, ev] = await Promise.all([
        listProctorFrames(contestId, session.uid).catch(() => []),
        fetchProctorEvents(contestId, session.uid).catch(() => []),
      ]);
      if (!alive) return;
      setFrames(f);
      setEvents(ev);
    })();
    return () => { alive = false; };
  }, [contestId, session.uid]);

  // Release the last blob URL when the viewer unmounts.
  useEffect(() => () => { if (frame?.objectUrl) URL.revokeObjectURL(frame.objectUrl); }, [frame]);

  // Reuses the status the list already computed against its read timestamp,
  // rather than recomputing it here - heartbeatStatus() defaults `now` to
  // Date.now(), and reading the clock during render is impure.
  const hb = session.hb || { state: "unknown", label: "no heartbeat" };

  return (
    <div onClick={onClose} role="presentation"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
        aria-label={`Proctoring record for ${session.rollNumber || session.uid}`}
        className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, maxHeight: "90vh", boxShadow: CAMPUS.shadowLg }}>

        <div className="flex items-center gap-2.5 px-5 py-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
          <ShieldCheck size={15} style={{ color: CAMPUS.teal }} />
          <div className="flex-1 min-w-0">
            <b className="text-[13.5px] block truncate" style={{ color: CAMPUS.ink }}>
              {session.rollNumber || "(no roll number)"}
            </b>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{session.displayName || session.uid}</span>
          </div>
          <CampusChip color={hb.state === "live" ? CAMPUS.good : CAMPUS.bad}>{hb.label}</CampusChip>
          <button onClick={onClose} aria-label="Close" style={{ color: CAMPUS.inkFaint }}><X size={16} /></button>
        </div>

        <div className="overflow-y-auto p-5 grid gap-5 md:grid-cols-[1fr_260px]">
          <div>
            <div className="rounded-xl overflow-hidden mb-3 flex items-center justify-center"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, minHeight: 260 }}>
              {loading ? (
                <CampusSkeleton variant="rect" height={260} />
              ) : error ? (
                <div className="text-center px-6 py-10">
                  <EyeOff size={22} className="mx-auto mb-2" style={{ color: CAMPUS.inkFaint }} />
                  <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{error}</p>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- blob: URL from a
                   callable response; next/image cannot optimise an in-memory object URL. */
                <img src={frame.objectUrl} alt={`Proctoring capture for ${session.rollNumber}`}
                  className="w-full object-contain" style={{ maxHeight: 380 }} />
              )}
            </div>

            {frame && !error && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>
                  {seq === null ? "Latest photo" : `Frame #${seq}`} · captured {fmtTime(frame.capturedAt)} ·{" "}
                  {Math.round((frame.sizeBytes || 0) / 1024)}KB
                </span>
                <a href={frame.objectUrl} download={`${session.rollNumber || session.uid}-${seq === null ? "latest" : `seq${seq}`}.jpg`}
                  className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.teal }}>
                  <Download size={11} /> Download
                </a>
              </div>
            )}

            {frames.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>
                  ARCHIVED FRAMES ({frames.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => { setSeq(null); load(null); }}
                    className="text-[11px] px-2 py-1 rounded-md"
                    style={{
                      background: seq === null ? CAMPUS.tealTint : CAMPUS.paper,
                      color: seq === null ? CAMPUS.teal : CAMPUS.inkSoft,
                      border: `1px solid ${CAMPUS.line}`,
                    }}>latest</button>
                  {frames.map(f => (
                    <button key={f.seq} onClick={() => { setSeq(f.seq); load(f.seq); }}
                      className="text-[11px] px-2 py-1 rounded-md"
                      style={{
                        background: seq === f.seq ? CAMPUS.tealTint : CAMPUS.paper,
                        color: seq === f.seq ? CAMPUS.teal : CAMPUS.inkSoft,
                        border: `1px solid ${CAMPUS.line}`,
                      }}>#{f.seq}</button>
                  ))}
                </div>
              </div>
            )}

            {frames.length === 0 && !loading && (
              <p className="text-[11px] mt-3 px-3 py-2 rounded-lg" style={{ color: CAMPUS.inkFaint, background: CAMPUS.paper }}>
                Only the newest photo is retained for this contest, so there is no timeline to step
                through. Turn on &ldquo;Keep every photo&rdquo; in Contest Settings before the next
                one if you expect results to be challenged.
              </p>
            )}
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <CampusStat label="Tab switches" value={session.tabSwitches || 0} color={session.tabSwitches ? CAMPUS.bad : CAMPUS.good} />
              <CampusStat label="FS exits" value={session.fullscreenExits || 0} color={session.fullscreenExits ? CAMPUS.warn : CAMPUS.good} />
              <CampusStat label="Photos" value={session.snapshotCount || 0} color={session.snapshotCount ? CAMPUS.teal : CAMPUS.bad} />
              <CampusStat label="Camera drops" value={session.cameraLosses || 0} color={session.cameraLosses ? CAMPUS.warn : CAMPUS.good} />
            </div>

            <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>EVENT LOG</p>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {events.length === 0 && (
                <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>No events recorded.</p>
              )}
              {events.map(ev => (
                <div key={ev.id} className="flex items-start gap-2 text-[11px] px-2 py-1.5 rounded-md"
                  style={{ background: SEVERE.has(ev.type) ? CAMPUS.badTint : CAMPUS.paper }}>
                  <span className="font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{fmtTime(ev.at)}</span>
                  <span style={{ color: SEVERE.has(ev.type) ? CAMPUS.bad : CAMPUS.inkSoft }}>
                    {EVENT_LABEL[ev.type] || ev.type}
                    {ev.via ? ` (${ev.via})` : ""}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[10.5px] leading-relaxed mt-3 pt-3" style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
              This log is append-only and cannot be edited by anyone, including you. Treat it as
              evidence, not as a verdict - a laptop notification and a deliberate lookup produce the
              same event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ContestProctorConsole({ contestId, proctoringEnabled }) {
  const [sessions, setSessions] = useState(null);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await fetchProctorSessions(contestId).catch(() => []);
      // The read timestamp is captured with the data, not at render: heartbeat
      // staleness is only meaningful relative to when the snapshot was taken,
      // and reading the clock during render is both impure (the lint rule is
      // right) and wrong here - it would make rows drift staler on every
      // unrelated re-render without any new information arriving.
      if (alive) { setSessions({ rows, fetchedAt: Date.now() }); setRefreshing(false); }
    })();
    return () => { alive = false; };
  }, [contestId, nonce]);

  // Sorted worst-first against the single read timestamp, so rows cannot
  // reorder mid-scan.
  const ranked = useMemo(() => {
    if (!sessions) return null;
    const { rows, fetchedAt } = sessions;
    return rows
      .map(s => ({ ...s, uid: s.uid || s.id, risk: proctorRiskScore(s, fetchedAt), hb: heartbeatStatus(s, fetchedAt) }))
      .sort((a, b) => b.risk - a.risk || String(a.rollNumber).localeCompare(String(b.rollNumber)));
  }, [sessions]);

  const totals = useMemo(() => {
    if (!ranked) return null;
    return {
      sessions: ranked.length,
      flagged: ranked.filter(s => s.violations > 0).length,
      silent: ranked.filter(s => s.hb.state !== "live").length,
      noPhoto: ranked.filter(s => !s.snapshotCount).length,
    };
  }, [ranked]);

  if (!proctoringEnabled) {
    return (
      <CampusCard className="p-4 mt-4">
        <CampusEmptyState icon={ShieldCheck} size="sm" title="Proctoring is off for this contest"
          description="Turn on Camera proctoring in Contest Settings before the contest starts. It cannot be applied retroactively - there is nothing to capture after the fact." />
      </CampusCard>
    );
  }

  return (
    <CampusCard className="p-4 mt-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-[12.5px] font-semibold flex items-center gap-1.5 flex-1" style={{ color: CAMPUS.ink }}>
          <ShieldCheck size={13} /> Invigilation
        </p>
        <button onClick={() => { setRefreshing(true); setNonce(n => n + 1); }} disabled={refreshing}
          className="text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg disabled:opacity-50"
          style={{ background: CAMPUS.paper, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
          <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <CampusStat label="Sessions" value={totals.sessions} icon={Monitor} color={CAMPUS.teal} />
          <CampusStat label="With flags" value={totals.flagged} icon={AlertTriangle}
            color={totals.flagged ? CAMPUS.warn : CAMPUS.good} />
          <CampusStat label="Not reporting" value={totals.silent} icon={Activity}
            color={totals.silent ? CAMPUS.bad : CAMPUS.good} hint="Stopped sending heartbeats" />
          <CampusStat label="No photo" value={totals.noPhoto} icon={CameraOff}
            color={totals.noPhoto ? CAMPUS.bad : CAMPUS.good} />
        </div>
      )}

      {ranked === null ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <CampusSkeleton key={i} variant="rect" height={44} />)}</div>
      ) : ranked.length === 0 ? (
        <CampusEmptyState icon={Camera} size="sm" title="No invigilated sessions yet"
          description="A row appears here the moment a student consents and their camera comes up." />
      ) : (
        <>
          <div className="space-y-1.5">
            {ranked.map(s => {
              const tone = riskTone(s.risk);
              return (
                <button key={s.uid} onClick={() => setSelected(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                  style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: tone.tint, color: tone.color }}>{tone.label}</span>

                  <span className="flex-1 min-w-0">
                    <span className="text-[12.5px] font-semibold block truncate" style={{ color: CAMPUS.ink }}>
                      {s.rollNumber || "(no roll number)"}
                    </span>
                    <span className="text-[10.5px] truncate block" style={{ color: CAMPUS.inkFaint }}>
                      {s.displayName || s.uid}
                    </span>
                  </span>

                  <span className="hidden sm:flex items-center gap-3 flex-shrink-0 text-[11px]">
                    <span title="Tab switches" style={{ color: s.tabSwitches ? CAMPUS.bad : CAMPUS.inkFaint }}>
                      {s.tabSwitches || 0} tab
                    </span>
                    <span title="Fullscreen exits" style={{ color: s.fullscreenExits ? CAMPUS.warn : CAMPUS.inkFaint }}>
                      {s.fullscreenExits || 0} fs
                    </span>
                    <span title="Photos captured" style={{ color: s.snapshotCount ? CAMPUS.inkSoft : CAMPUS.bad }}>
                      {s.snapshotCount || 0} pic
                    </span>
                    <span className="flex items-center gap-1" style={{ color: s.hb.state === "live" ? CAMPUS.good : CAMPUS.bad }}>
                      <Clock size={10} /> {s.hb.label}
                    </span>
                  </span>

                  <ChevronRight size={14} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }} />
                </button>
              );
            })}
          </div>

          <p className="text-[10.5px] leading-relaxed mt-3" style={{ color: CAMPUS.inkFaint }}>
            Sorted by what needs attention first. A session that stopped reporting ranks above a noisy
            one on purpose: no events can mean good behaviour or a disabled script, and only the
            heartbeat tells those apart.
          </p>
        </>
      )}

      {selected && (
        <FrameViewer contestId={contestId} session={selected} onClose={() => setSelected(null)} />
      )}
    </CampusCard>
  );
}
