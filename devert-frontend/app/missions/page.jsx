"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Trophy, Target, Lock, CheckCircle, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

function Toast({ msg, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 font-mono text-sm px-5 py-3 rounded border pointer-events-none"
      style={{ color, background: `${color}12`, borderColor: `${color}40` }}>
      {msg}
    </motion.div>
  );
}

function MissionCard({ m, i, accepted, accepting, onAccept }) {
  const isLocked   = m.status === "LOCKED";
  const isAccepted = accepted;
  const isWorking  = accepting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={!isLocked ? { y: -4, borderColor: isAccepted ? "rgba(0,255,65,0.3)" : "rgba(0,255,255,0.2)" } : {}}
      className="terminal-window transition-colors"
      style={isAccepted ? { borderColor: "rgba(0,255,65,0.18)" } : {}}
    >
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <span className="font-mono text-[9px] text-white/22 ml-2">{m.classification || "UNCLASSIFIED"}</span>
        <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded border"
          style={isAccepted
            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.08)" }
            : { color: m.statusColor, borderColor: `${m.statusColor}40`, background: `${m.statusColor}0D` }}>
          {isLocked ? <Lock size={9} /> : isAccepted ? "BRIEFED" : m.status}
        </span>
      </div>

      <div className="p-5">
        <p className="font-mono text-[9px] text-white/28 mb-1 tracking-wider">CODENAME</p>
        <h3 className="font-sans text-sm font-bold text-white mb-3 leading-snug">{m.codename}</h3>
        <p className="font-mono text-[11px] text-white/38 mb-4 leading-relaxed">{m.objective}</p>

        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-white/32">
            <Trophy size={10} style={{ color: "#00FFFF" }} />
            <span className="text-neon-cyan font-bold">{m.prize}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Clock size={10} />{m.deadline}
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Users size={10} />{m.team} devs/team
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Target size={10} />{m.filled}/{m.slots} slots
          </div>
        </div>

        <div className="h-1 w-full rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((m.filled / Math.max(m.slots, 1)) * 100, 100)}%` }}
            transition={{ delay: i * 0.07 + 0.3, duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: isAccepted ? "#00FF41" : m.statusColor }}
          />
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {(m.tags || []).map(t => (
            <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
          ))}
          {m.difficulty && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto"
              style={{ color: m.diffColor || "#00FF41", background: `${m.diffColor || "#00FF41"}12` }}>
              {m.difficulty}
            </span>
          )}
        </div>

        <motion.button
          whileHover={!isLocked && !isAccepted ? { scale: 1.01, background: "rgba(0,255,255,0.08)" } : {}}
          whileTap={!isLocked && !isAccepted ? { scale: 0.99 } : {}}
          onClick={() => !isLocked && !isAccepted && onAccept(m)}
          disabled={isLocked || isAccepted || isWorking}
          className="w-full font-mono text-sm py-2.5 border transition-all flex items-center justify-center gap-2"
          style={
            isLocked   ? { color: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.06)", cursor: "not-allowed" }
            : isAccepted ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.04)", cursor: "default" }
            : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
          }
        >
          {isLocked    ? "[ LOCKED ]"
           : isWorking ? "[ ACCEPTING... ]"
           : isAccepted ? <><CheckCircle size={13} /> MISSION ACCEPTED</>
           : "[ ACCEPT_MISSION ]"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions,     setMissions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [acceptedIds,  setAcceptedIds]  = useState(new Set());
  const [accepting,    setAccepting]    = useState(null);
  const [toast,        setToast]        = useState(null);

  useEffect(() => {
    getDocs(query(collection(db, "missions"), orderBy("createdAt", "desc")))
      .then(snap => setMissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "user_missions", user.uid))
      .then(snap => {
        if (snap.exists()) setAcceptedIds(new Set(snap.data().accepted || []));
      })
      .catch(console.error);
  }, [user]);

  const handleAccept = async (m) => {
    if (!user) { window.location.href = "/login?next=/missions"; return; }
    setAccepting(m.id);
    try {
      await setDoc(doc(db, "user_missions", user.uid), {
        accepted: arrayUnion(m.id),
      }, { merge: true });
      setAcceptedIds(prev => new Set([...prev, m.id]));
      setToast({ msg: `Mission "${m.codename}" accepted. Good luck.`, color: "#00FF41" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error - try again.", color: "#FF5050" });
    } finally {
      setAccepting(null);
    }
  };

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence>
        {toast && <Toast key={toast.msg} {...toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /missions - classified.db</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            MISSION <span className="text-neon-cyan">BRIEFING</span>
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-mono text-sm text-white/35">Choose your mission. Accept the risk. Ship or die.</p>
            {user && acceptedIds.size > 0 && (
              <span className="font-mono text-xs text-neon-green/60 border border-neon-green/20 px-3 py-1 rounded">
                {acceptedIds.size} mission{acceptedIds.size > 1 ? "s" : ""} accepted
              </span>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : missions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="terminal-window max-w-lg mx-auto">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">classified.db</span>
            </div>
            <div className="p-10 text-center">
              <p className="font-mono text-xs text-white/25 mb-2">no active missions</p>
              <p className="font-mono text-[10px] text-white/15 leading-relaxed">
                // mission briefings drop soon.<br />// stay ready. stay sharp.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {missions.map((m, i) => (
              <MissionCard
                key={m.id} m={m} i={i}
                accepted={acceptedIds.has(m.id)}
                accepting={accepting === m.id}
                onAccept={handleAccept}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
