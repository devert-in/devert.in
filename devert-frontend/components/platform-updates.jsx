"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitCommit } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const TYPE_COLORS = { feat: "#00FFFF", fix: "#FF5050", deploy: "#00FF41", perf: "#FF9500", drop: "#FF6430", chore: "rgba(255,255,255,0.4)" };

export function PlatformUpdates() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "changelog"), orderBy("createdAt", "desc"), limit(3)))
      .then(snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="terminal-window mb-6"
    >
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <GitCommit size={10} className="ml-2 text-white/25" />
        <span className="font-mono text-[10px] text-white/25 ml-1">platform_updates.log</span>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="font-mono text-[10px] text-white/20 animate-pulse text-center py-3">loading...</p>
        ) : logs.length === 0 ? (
          <p className="font-mono text-[10px] text-white/20 text-center py-3">no updates logged yet</p>
        ) : (
          <div className="space-y-2.5">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-2.5">
                <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{log.hash}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: TYPE_COLORS[log.type] || "#00FFFF", background: "rgba(255,255,255,0.04)" }}>
                  {log.type}
                </span>
                <span className="font-mono text-[11px] text-white/55 flex-1 truncate">{log.msg}</span>
                <span className="font-mono text-[9px] text-white/18 flex-shrink-0">{log.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
