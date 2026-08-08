"use client";

// Ambassador application review, for the admin console's COMMUNITY tab.
//
// Lives inside an existing tab rather than becoming its own top-level admin
// surface, per CLAUDE.md's rule about the admin console.
//
// Approving is the only action that grants anything, and it is the only one that
// writes `status` - which firestore.rules restricts to isAdmin(). The applicant
// can amend their own details while pending but can never move their own status,
// so this panel is the single place the decision actually happens.

import { useEffect, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, X, Loader2, Users, Building2, RefreshCw, Ban } from "lucide-react";
import { AMBASSADOR_STATUS, fetchAmbassadorApplications } from "@/lib/ambassadors";

const FILTERS = [
  { key: AMBASSADOR_STATUS.PENDING, label: "PENDING", color: "#FF9500" },
  { key: AMBASSADOR_STATUS.ACTIVE, label: "ACTIVE", color: "#00FF41" },
  { key: AMBASSADOR_STATUS.REJECTED, label: "REJECTED", color: "#FF5050" },
  { key: AMBASSADOR_STATUS.SUSPENDED, label: "SUSPENDED", color: "rgba(255,255,255,0.35)" },
];

export function AmbassadorPanel() {
  const [status, setStatus] = useState(AMBASSADOR_STATUS.PENDING);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setRows(null);
    fetchAmbassadorApplications(status)
      .then((r) => { if (alive) setRows(r); })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        // Almost always a missing composite index the first time this runs -
        // saying so beats an empty list that looks like "no applications".
        setError(e?.message || "Could not load applications.");
      });
    return () => { alive = false; };
  }, [status, nonce]);

  const decide = async (uid, next) => {
    setBusy(uid);
    setError("");
    try {
      await updateDoc(doc(db, "ambassadors", uid), {
        status: next,
        decidedAt: serverTimestamp(),
      });
      setNonce((n) => n + 1);
    } catch (e) {
      setError(e?.message || "Could not update that application.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)}
            className="font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: status === f.key ? f.color : "rgba(255,255,255,0.3)",
              background: status === f.key ? `${f.color}12` : "rgba(255,255,255,0.03)",
              border: `1px solid ${status === f.key ? `${f.color}40` : "rgba(255,255,255,0.06)"}`,
            }}>
            {f.label}
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
      ) : rows.length === 0 ? (
        <p className="font-mono text-xs text-white/25">No {status} applications.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <div key={a.id} className="p-3.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-mono text-[12px] text-white/85 flex items-center gap-2">
                    <Building2 size={11} style={{ color: "#00FFFF" }} />
                    {a.collegeName || "(no college given)"}
                  </p>
                  <p className="font-mono text-[10.5px] text-white/40 mt-0.5">
                    {a.displayName || a.uid} · {a.email || "no email"} · {a.city || "no city"}
                  </p>
                  <p className="font-mono text-[10.5px] mt-1" style={{ color: "#00FF41" }}>
                    code {a.referralCode}
                    {a.expectedReach ? ` · claims ${a.expectedReach} students` : ""}
                  </p>
                  {a.whyMe && (
                    <p className="font-mono text-[10.5px] text-white/45 mt-2 leading-relaxed">{a.whyMe}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {status === AMBASSADOR_STATUS.PENDING && (
                    <>
                      <button onClick={() => decide(a.uid, AMBASSADOR_STATUS.ACTIVE)} disabled={busy === a.uid}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }}>
                        {busy === a.uid ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} approve
                      </button>
                      <button onClick={() => decide(a.uid, AMBASSADOR_STATUS.REJECTED)} disabled={busy === a.uid}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#FF5050", border: "1px solid rgba(255,80,80,0.3)" }}>
                        <X size={10} /> reject
                      </button>
                    </>
                  )}
                  {status === AMBASSADOR_STATUS.ACTIVE && (
                    <button onClick={() => decide(a.uid, AMBASSADOR_STATUS.SUSPENDED)} disabled={busy === a.uid}
                      className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                      style={{ color: "#FF9500", border: "1px solid rgba(255,149,0,0.3)" }}>
                      <Ban size={10} /> suspend
                    </button>
                  )}
                  {(status === AMBASSADOR_STATUS.REJECTED || status === AMBASSADOR_STATUS.SUSPENDED) && (
                    <button onClick={() => decide(a.uid, AMBASSADOR_STATUS.ACTIVE)} disabled={busy === a.uid}
                      className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                      style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.3)" }}>
                      <Check size={10} /> reinstate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="font-mono text-[10px] text-white/25 mt-4 leading-relaxed">
        <Users size={10} className="inline mr-1 -mt-0.5" />
        A code only starts crediting signups once its ambassador is ACTIVE. Suspending stops future
        attribution but never rewrites past credit - referrals/{"{uid}"} is write-once by rule.
      </p>
    </div>
  );
}
