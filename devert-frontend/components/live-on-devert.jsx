"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Anchor, Flame, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

// Platform-wide activity, not "your" activity (devert-journey-card.jsx
// already covers that) - real recent Shipyard docks + real live/upcoming
// events, across every user. Gives the dashboard the "living platform" feel
// a thin personal-stats-only view doesn't, without fabricating a single
// number - empty sections just don't render rather than showing a placeholder.
function useLiveActivity() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [projectsRes, eventsRes] = await Promise.allSettled([
        getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(4))),
        getDocs(query(collection(db, "hackathons"), where("status", "in", ["active", "upcoming"]), orderBy("createdAt", "desc"), limit(3))),
      ]);
      if (cancelled) return;
      setData({
        projects: projectsRes.status === "fulfilled" ? projectsRes.value.docs.map(d => ({ id: d.id, ...d.data() })) : [],
        events:   eventsRes.status === "fulfilled" ? eventsRes.value.docs.map(d => ({ id: d.id, ...d.data() })) : [],
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return data;
}

export function LiveOnDevert() {
  const data = useLiveActivity();

  if (!data || (data.projects.length === 0 && data.events.length === 0)) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
      className="mb-5">
      <p className="font-mono text-[10px] text-white/25 tracking-widest mb-2.5">// live_on_devert</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {data.projects.length > 0 && (
          <div className="terminal-window p-4">
            <div className="flex items-center gap-2 mb-3">
              <Anchor size={13} className="text-neon-green" />
              <p className="font-mono text-[10px] text-white/40 tracking-wider">RECENTLY SHIPPED</p>
            </div>
            <div className="space-y-2.5">
              {data.projects.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <p className="font-sans text-xs text-white/70 truncate">{p.name}</p>
                  <p className="font-mono text-[10px] text-neon-green/50 flex-shrink-0">@{p.ownerHandle}</p>
                </div>
              ))}
            </div>
            <Link href="/shipyard" className="flex items-center gap-1 font-mono text-[10px] text-white/25 hover:text-white/50 transition-colors mt-3">
              explore shipyard <ArrowUpRight size={10} />
            </Link>
          </div>
        )}
        {data.events.length > 0 && (
          <div className="terminal-window p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={13} className="text-orange-400" />
              <p className="font-mono text-[10px] text-white/40 tracking-wider">LIVE &amp; UPCOMING EVENTS</p>
            </div>
            <div className="space-y-2.5">
              {data.events.slice(0, 3).map(e => (
                <Link key={e.id} href={`/h/${e.id}`} className="flex items-center justify-between gap-2 group">
                  <p className="font-sans text-xs text-white/70 truncate group-hover:text-white transition-colors">{e.title}</p>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: e.status === "active" ? "#00FF41" : "#00FFFF", background: e.status === "active" ? "rgba(0,255,65,0.08)" : "rgba(0,255,255,0.08)" }}>
                    {e.status === "active" ? "LIVE" : "SOON"}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/events" className="flex items-center gap-1 font-mono text-[10px] text-white/25 hover:text-white/50 transition-colors mt-3">
              explore events <ArrowUpRight size={10} />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
