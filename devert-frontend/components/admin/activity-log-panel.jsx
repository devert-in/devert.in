"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// Shared by app/admin/page.jsx's Overview tab and /manage's Audit Log section -
// same collection, same live query, no product filter (a global control
// center's whole point is seeing everything, not a scoped subset - and
// avoids needing a new composite index for a where("product",...) query).
export function ActivityLogPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "admin_activity_log"), orderBy("createdAt", "desc"), limit(50)),
      snap => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const timeLabel = (ts) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {logs.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no admin activity logged yet</p>}
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-3 border border-white/6 rounded-lg px-4 py-2.5">
          <span className="font-mono text-[9px] text-white/25 flex-shrink-0 mt-0.5 w-28">{timeLabel(log.createdAt)}</span>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded mr-2" style={{ color: "#00FF41", background: "rgba(0,255,65,0.06)" }}>{log.action}</span>
            {log.product && log.product !== "core" && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded mr-2" style={{ color: "#00FFFF", background: "rgba(0,255,255,0.06)" }}>{log.product}</span>
            )}
            <span className="font-mono text-xs text-white/60">{log.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
