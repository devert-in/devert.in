"use client";

// Institution demo request review, for the admin console's COMMUNITY tab.
//
// Sits directly ABOVE "CAMPUS INSTITUTIONS" on purpose: a demo request is the
// step BEFORE an institution exists here at all - this is the sales inbox for
// the "Bring DeVert to your campus" pitch, and working a request is usually
// what leads to creating the institution row just below it.
//
// Loads the whole collection once (no status filter in the query) and filters
// client-side - see lib/demoRequests.js for why that avoids needing a
// composite index deployed.

import { useEffect, useState } from "react";
import { Check, Loader2, Building2, RefreshCw, X, Mail, Phone, RotateCcw, Inbox } from "lucide-react";
import { DEMO_REQUEST_STATUS, fetchDemoRequests, setDemoRequestStatus } from "@/lib/demoRequests";

const STATUS_META = {
  [DEMO_REQUEST_STATUS.NEW]: { label: "NEW", color: "#FF9500" },
  [DEMO_REQUEST_STATUS.CONTACTED]: { label: "CONTACTED", color: "#00FFFF" },
  [DEMO_REQUEST_STATUS.CONVERTED]: { label: "CONVERTED", color: "#00FF41" },
  [DEMO_REQUEST_STATUS.CLOSED]: { label: "CLOSED", color: "rgba(255,255,255,0.35)" },
};

const FILTERS = [{ key: "all", label: "ALL", color: "#C77DFF" }, ...Object.entries(STATUS_META).map(([key, m]) => ({ key, ...m }))];

function fmtWhen(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function DemoRequestsPanel() {
  const [filter, setFilter] = useState(DEMO_REQUEST_STATUS.NEW);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");
    fetchDemoRequests()
      .then((r) => { if (alive) setRows(r); })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        setError(e?.message || "Could not load demo requests.");
      });
    return () => { alive = false; };
  }, [nonce]);

  const decide = async (id, next) => {
    setBusy(id);
    setError("");
    try {
      await setDemoRequestStatus(id, next);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    } catch (e) {
      setError(e?.message || "Could not update that request.");
    } finally {
      setBusy("");
    }
  };

  const newCount = rows?.filter((r) => r.status === DEMO_REQUEST_STATUS.NEW).length || 0;
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
            {f.label}{f.key === DEMO_REQUEST_STATUS.NEW && newCount > 0 ? ` (${newCount})` : ""}
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
        <p className="font-mono text-xs text-white/25">No {filter === "all" ? "" : `${filter} `}demo requests.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META[DEMO_REQUEST_STATUS.NEW];
            return (
              <div key={r.id} className="p-3.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-mono text-[12px] text-white/85 flex items-center gap-2">
                      <Building2 size={11} style={{ color: "#0E7C86" }} />
                      {r.institution || "(no institution given)"}
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ color: meta.color, background: `${meta.color}12` }}>
                        {meta.label}
                      </span>
                    </p>
                    <p className="font-mono text-[10.5px] text-white/40 mt-0.5">
                      {r.name || "(no name)"} · {r.role || "no role"} · {r.students || "size unknown"}
                    </p>
                    <p className="font-mono text-[10.5px] mt-1 flex items-center gap-3 flex-wrap">
                      <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:underline" style={{ color: "#00FFFF" }}>
                        <Mail size={10} /> {r.email}
                      </a>
                      {r.phone && (
                        <span className="flex items-center gap-1 text-white/40">
                          <Phone size={10} /> {r.phone}
                        </span>
                      )}
                    </p>
                    {r.message && <p className="font-mono text-[10.5px] text-white/45 mt-2 leading-relaxed">{r.message}</p>}
                    <p className="font-mono text-[9.5px] text-white/20 mt-2">
                      {fmtWhen(r.createdAt)}{r.source ? ` · via ${r.source}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.status === DEMO_REQUEST_STATUS.NEW && (
                      <button onClick={() => decide(r.id, DEMO_REQUEST_STATUS.CONTACTED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} mark contacted
                      </button>
                    )}
                    {r.status === DEMO_REQUEST_STATUS.CONTACTED && (
                      <button onClick={() => decide(r.id, DEMO_REQUEST_STATUS.CONVERTED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} mark converted
                      </button>
                    )}
                    {r.status !== DEMO_REQUEST_STATUS.CLOSED && r.status !== DEMO_REQUEST_STATUS.CONVERTED && (
                      <button onClick={() => decide(r.id, DEMO_REQUEST_STATUS.CLOSED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#FF5050", border: "1px solid rgba(255,80,80,0.3)" }}>
                        <X size={10} /> close
                      </button>
                    )}
                    {(r.status === DEMO_REQUEST_STATUS.CLOSED || r.status === DEMO_REQUEST_STATUS.CONVERTED) && (
                      <button onClick={() => decide(r.id, DEMO_REQUEST_STATUS.NEW)} disabled={busy === r.id}
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
        These come from the unauthenticated &quot;Request a demo&quot; dialog on the campus marketing pages -
        firestore.rules whitelists the fields it can write and pins status to &quot;new&quot;, so nothing here can be forged by the submitter.
      </p>
    </div>
  );
}
