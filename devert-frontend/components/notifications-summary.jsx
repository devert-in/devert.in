"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, UserPlus, Repeat2, Heart, MessageCircle, CheckCircle2, XCircle, Coins, Settings, Info, AlertTriangle, Gift } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const TYPE_META = {
  follow:    { icon: UserPlus,      color: "#C77DFF" },
  repost:    { icon: Repeat2,       color: "#00FF41" },
  like:      { icon: Heart,         color: "#FF6B8A" },
  comment:   { icon: MessageCircle, color: "#00FFFF" },
  approval:  { icon: CheckCircle2,  color: "#00FF41" },
  rejection: { icon: XCircle,       color: "#FF5050" },
  payout:    { icon: Coins,         color: "#FFD700" },
  system:    { icon: Settings,      color: "#FF9500" },
  info:      { icon: Info,          color: "#00FFFF" },
  success:   { icon: CheckCircle2,  color: "#00FF41" },
  warning:   { icon: AlertTriangle, color: "#FF9500" },
  promo:     { icon: Gift,          color: "#FFD700" },
};
const DEFAULT_META = { icon: Bell, color: "#00FFFF" };

function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - (ts.seconds || 0);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationsSummary() {
  const { user } = useAuth();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      getDocs(query(collection(db, "notifications"), where("targetUid", "==", "all"), orderBy("createdAt", "desc"), limit(10))),
      getDocs(query(collection(db, "notifications"), where("targetUid", "==", user.uid), orderBy("createdAt", "desc"), limit(10))),
    ]).then(([broadSnap, personalSnap]) => {
      const all = [
        ...broadSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ...personalSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 4);
      setNotifs(all);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="terminal-window mb-5"
    >
      <div className="terminal-header">
        <Bell size={10} className="ml-2 text-white/25" />
        <span className="font-mono text-[10px] text-white/25 ml-1">notifications</span>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="font-mono text-[10px] text-white/20 animate-pulse text-center py-3">loading...</p>
        ) : notifs.length === 0 ? (
          <p className="font-mono text-[10px] text-white/20 text-center py-3">no notifications yet</p>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => {
              const meta = TYPE_META[n.type] || DEFAULT_META;
              const Icon = meta.icon;
              return (
                <div key={n.id} className="flex items-start gap-2.5">
                  <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[11px] leading-snug" style={{ color: meta.color }}>{n.title}</p>
                    <p className="font-mono text-[10px] text-white/30 leading-snug mt-0.5 truncate">{n.body}</p>
                  </div>
                  <span className="font-mono text-[9px] text-white/18 flex-shrink-0 mt-0.5">{relTime(n.createdAt)}</span>
                </div>
              );
            })}
            <p className="font-mono text-[9px] text-white/15 pt-1">// full history in the bell, bottom dock</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
