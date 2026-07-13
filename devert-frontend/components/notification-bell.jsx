"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ExternalLink, RefreshCw, UserPlus, Repeat2, Heart, MessageCircle, CheckCircle2, XCircle, Coins, Settings, Info, AlertTriangle, Gift } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

// ── read-state stored in localStorage ────────────────────────────────────────

const STORAGE_KEY = "devert_read_notifs_v1";

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}

function persistRead(ids) {
  try {
    const merged = [...getReadIds(), ...ids].slice(-300);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(merged)]));
  } catch {}
}

// ── type → visual mapping ─────────────────────────────────────────────────────

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

// ── helper: relative time ─────────────────────────────────────────────────────

function relTime(ts) {
  if (!ts) return "";
  const diff = Date.now() / 1000 - (ts.seconds || 0);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── exported helper: write a notification ────────────────────────────────────
// Call this from other pages when events happen

export async function writeNotification(targetUid, { type, title, body, ctaHref = null, ctaLabel = null }) {
  if (!targetUid) return;
  try {
    await addDoc(collection(db, "notifications"), {
      targetUid, type, title, body, ctaHref, ctaLabel,
      createdAt: serverTimestamp(),
    });
  } catch {}
}

// ── component ─────────────────────────────────────────────────────────────────

export function NotificationBell({ showTooltip, hideTooltip }) {
  const { user } = useAuth();
  const [notifs,   setNotifs]   = useState([]);
  const [unread,   setUnread]   = useState(0);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [coords,   setCoords]   = useState(null);
  const [mounted,  setMounted]  = useState(false);
  const buttonRef = useRef(null);
  const panelRef  = useRef(null);

  // The navbar's dock shell has overflow-hidden (see components/navbar.jsx) - an
  // absolutely-positioned dropdown here would render clipped/invisible, same reason
  // the Tooltip/Profile dropdown there are rendered outside it. Portalling to
  // document.body with viewport-fixed coordinates sidesteps that entirely.
  useEffect(() => { setMounted(true); }, []);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [broadSnap, personalSnap] = await Promise.all([
        getDocs(query(collection(db, "notifications"),
          where("targetUid", "==", "all"),
          orderBy("createdAt", "desc"), limit(20))),
        getDocs(query(collection(db, "notifications"),
          where("targetUid", "==", user.uid),
          orderBy("createdAt", "desc"), limit(30))),
      ]);
      const all = [
        ...broadSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ...personalSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 40);
      setNotifs(all);
      const read = getReadIds();
      setUnread(all.filter(n => !read.has(n.id)).length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const handleOpen = () => {
    const next = !open;
    if (next && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ bottom: window.innerHeight - rect.top + 12, right: window.innerWidth - rect.right });
    }
    setOpen(next);
    if (next) {
      persistRead(notifs.map(n => n.id));
      setUnread(0);
    }
  };

  // close on outside click - checks the button AND the portalled panel, since the
  // panel no longer lives inside this component's own DOM subtree.
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (buttonRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
        onClick={handleOpen}
        onMouseEnter={showTooltip ? (e) => showTooltip(e, "Notifications") : undefined}
        onMouseLeave={hideTooltip}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{
          background: open ? "rgba(199,125,255,0.14)" : "rgba(199,125,255,0.06)",
          boxShadow: open ? "0 0 14px rgba(199,125,255,0.18)" : "none",
        }}
      >
        <Bell size={14} style={{ color: open ? "#C77DFF" : "rgba(199,125,255,0.65)" }} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-black leading-none"
              style={{ background: "#FF5050", padding: "0 3px" }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.94 }}
              transition={{ duration: 0.14 }}
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{
                position: "fixed",
                bottom: coords.bottom,
                right: coords.right,
                width: 310,
                maxHeight: 440,
                background: "rgba(5,5,5,0.97)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
                zIndex: 200,
              }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={11} style={{ color: "#C77DFF" }} />
                <span className="font-mono text-[11px] text-white/50">notifications</span>
                {notifs.length > 0 && (
                  <span className="font-mono text-[9px] text-white/20 border border-white/8 px-1.5 py-0.5 rounded">
                    {notifs.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchNotifs} disabled={loading}
                  className="text-white/20 hover:text-white/50 transition-colors disabled:opacity-40">
                  <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                </button>
                <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/60 transition-colors">
                  <X size={11} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifs.length === 0 ? (
                <p className="font-mono text-[10px] text-white/20 text-center py-8 animate-pulse">loading...</p>
              ) : notifs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-mono text-[11px] text-white/20">no notifications yet</p>
                  <p className="font-mono text-[9px] text-white/12 mt-1">// activity will appear here</p>
                </div>
              ) : (
                notifs.map((n, i) => {
                  const meta = TYPE_META[n.type] || DEFAULT_META;
                  const Icon = meta.icon;
                  return (
                    <div key={n.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/2"
                      style={{ borderBottom: i < notifs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                    >
                      <Icon size={15} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[11px] font-medium leading-snug" style={{ color: meta.color }}>
                          {n.title}
                        </p>
                        <p className="font-mono text-[10px] text-white/35 leading-snug mt-0.5">{n.body}</p>
                        {n.ctaHref && n.ctaLabel && (
                          <Link href={n.ctaHref} onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 mt-1 font-mono text-[9px] transition-colors"
                            style={{ color: meta.color }}
                          >
                            {n.ctaLabel} <ExternalLink size={7} />
                          </Link>
                        )}
                      </div>
                      <span className="font-mono text-[9px] text-white/18 flex-shrink-0 mt-0.5 leading-none">
                        {relTime(n.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/5 flex-shrink-0">
                <p className="font-mono text-[9px] text-white/15 text-center">
                  // likes · comments · follows · admin alerts
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
