"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, ExternalLink, Plus, Filter, Flame, Wrench, X, Check } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const TAG_META = {
  Fire:         { Icon: Flame,  color: "#FF6430", bg: "rgba(255,100,48,0.1)"  },
  Shipped:      { Icon: Anchor, color: "#00FFFF", bg: "rgba(0,255,255,0.08)"  },
  "Needs Work": { Icon: Wrench, color: "#FF5050", bg: "rgba(255,80,80,0.08)"  },
};

const REACTIONS  = ["Fire", "Shipped", "Needs Work"];
const FILTER_ALL = ["all", "fire", "shipped", "needs work"];

function DockModal({ onClose, onSubmit, submitting }) {
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [stackRaw, setStackRaw] = useState("");
  const [url,      setUrl]      = useState("");
  const [reaction, setReaction] = useState("Shipped");
  const [error,    setError]    = useState("");

  const handleSubmit = () => {
    if (!name.trim())  return setError("Project name is required.");
    if (!desc.trim())  return setError("Description is required.");
    setError("");
    const stack = stackRaw.split(",").map(s => s.trim()).filter(Boolean);
    onSubmit({ name: name.trim(), description: desc.trim(), stack, url: url.trim(), reaction });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        className="terminal-window w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-2">dock_ship.sh</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">PROJECT NAME</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="What did you build?" maxLength={60}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DESCRIPTION</p>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="One line. What does it do?" maxLength={120} rows={2}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STACK <span className="text-white/15">(comma separated)</span></p>
            <input value={stackRaw} onChange={e => setStackRaw(e.target.value)} placeholder="React, Node.js, PostgreSQL" maxLength={100}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">URL <span className="text-white/15">(optional)</span></p>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." maxLength={200}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">STATUS</p>
            <div className="flex gap-2">
              {REACTIONS.map(r => {
                const m = TAG_META[r];
                const active = reaction === r;
                return (
                  <button key={r} onClick={() => setReaction(r)}
                    className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                    style={{
                      color: active ? m.color : "rgba(255,255,255,0.3)",
                      background: active ? m.bg : "rgba(255,255,255,0.03)",
                      border: active ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <m.Icon size={9} /> {r}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={submitting}
              className="flex-1 font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check size={11} /> {submitting ? "docking..." : "dock ship"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onClose} disabled={submitting}
              className="flex-1 font-mono text-xs py-2.5 text-white/35 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ShipyardPage() {
  const { user, userData, refreshProfile } = useAuth();
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")))
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDock = async (data) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...data,
        ownerId:     user.uid,
        ownerHandle: userData?.handle || user.email?.split("@")[0] || "dev",
        createdAt:   serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { ships: increment(1) });
      refreshProfile();
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = projects.filter(p => {
    if (filter === "all")         return true;
    if (filter === "fire")        return p.reaction === "Fire";
    if (filter === "shipped")     return p.reaction === "Shipped";
    if (filter === "needs work")  return p.reaction === "Needs Work";
    return true;
  });

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <AnimatePresence>
        {showModal && (
          <DockModal
            onClose={() => setShowModal(false)}
            onSubmit={handleDock}
            submitting={submitting}
          />
        )}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-4 mb-10"
        >
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /shipyard - projects.feed</p>
            <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
              THE <span className="text-neon-cyan">SHIPYARD</span>
            </h1>
            <p className="font-mono text-sm text-white/35">Builders ship here. Community judges.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,255,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => user ? setShowModal(true) : window.location.href = "/login"}
            className="flex items-center gap-2 font-mono text-sm text-neon-cyan border border-neon-cyan/30 px-5 py-2.5 mt-2 transition-all hover:bg-neon-cyan/5"
          >
            <Plus size={14} /> [ DOCK_YOUR_SHIP ]
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-2 flex-wrap mb-8"
        >
          <Filter size={12} className="text-white/25" />
          {FILTER_ALL.map(f => {
            const keyMap  = { fire: "Fire", shipped: "Shipped", "needs work": "Needs Work" };
            const m = TAG_META[keyMap[f]];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="font-mono text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                style={{
                  color:      filter === f ? (m ? m.color : "#00FFFF") : "rgba(255,255,255,0.3)",
                  background: filter === f ? (m ? m.bg    : "rgba(0,255,255,0.08)") : "rgba(255,255,255,0.03)",
                  border:     filter === f ? `1px solid ${m ? m.color + "40" : "rgba(0,255,255,0.25)"}` : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {m && <m.Icon size={9} />} {f}
              </button>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="terminal-window max-w-md mx-auto"
          >
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">projects.feed</span>
            </div>
            <div className="p-10 text-center">
              <p className="font-mono text-xs text-white/25 mb-2">
                {filter === "all" ? "no ships docked yet" : `no ${filter} projects yet`}
              </p>
              <p className="font-mono text-[10px] text-white/15 mb-4">// be the first to ship</p>
              {user && (
                <button onClick={() => setShowModal(true)}
                  className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/5 transition-colors"
                >
                  [ DOCK_YOUR_SHIP ]
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((p, i) => {
              const m = TAG_META[p.reaction] || TAG_META["Shipped"];
              return (
                <motion.div key={p.id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileHover={p.url ? { y: -4, borderColor: "rgba(0,255,255,0.2)" } : {}}
                  onClick={() => p.url && window.open(p.url.startsWith("http") ? p.url : `https://${p.url}`, "_blank", "noopener,noreferrer")}
                  className={`terminal-window transition-colors ${p.url ? "group cursor-pointer" : ""}`}
                >
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500/70" />
                    <div className="terminal-dot bg-yellow-500/70" />
                    <div className="terminal-dot bg-green-500/70" />
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="ml-auto text-white/18 group-hover:text-neon-cyan/55 transition-colors"
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-sans text-sm font-semibold text-white leading-snug">{p.name}</h3>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1"
                        style={{ color: m.color, background: m.bg }}>
                        <m.Icon size={8} /> {p.reaction}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-white/32 mb-4 leading-relaxed">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neon-green/60">@{p.ownerHandle}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {(p.stack || []).slice(0, 2).map(t => (
                          <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}
