"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DoorOpen, Heart, MessageCircle, UserPlus, Bookmark, X } from "lucide-react";

const PERKS = [
  { icon: Heart,        label: "Like & comment on Pulses" },
  { icon: UserPlus,     label: "Follow innovators" },
  { icon: Bookmark,     label: "Save content for later" },
  { icon: MessageCircle,label: "Publish your own Pulses" },
];

// Shown whenever a guest attempts a protected action (like, comment, follow,
// save, post, etc.) instead of a silent no-op or a generic "login required".
export function EnterHqModal({ onClose, next = "/pulse" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="terminal-window w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">access_control.sh</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors"><X size={13} /></button>
        </div>

        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)" }}>
            <DoorOpen size={24} style={{ color: "#00FF41" }} />
          </div>
          <h2 className="font-sans text-lg font-bold text-white mb-2">Enter HQ</h2>
          <p className="font-mono text-xs text-white/40 mb-5 leading-relaxed">
            You&apos;re exploring the DeVert community. Sign in to unlock the full experience:
          </p>

          <div className="space-y-2.5 mb-6 text-left">
            {PERKS.map(p => (
              <div key={p.label} className="flex items-center gap-2.5">
                <p.icon size={13} style={{ color: "#00FF41" }} className="flex-shrink-0" />
                <span className="font-mono text-[11px] text-white/55">{p.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="flex-1">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full font-mono text-xs font-bold text-black py-2.5 rounded-lg" style={{ background: "#00FF41" }}>
                [ ENTER HQ ]
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 font-mono text-xs text-white/40 border border-white/10 py-2.5 rounded-lg hover:text-white/70 hover:border-white/20 transition-all">
              keep browsing
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
