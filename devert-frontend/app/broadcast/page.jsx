"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv2, Play, Clock, Calendar, Users, Radio, Bell, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, getDocs,
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
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

function streamSlug(title) {
  return (title || "stream").replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function extractYouTubeId(url) {
  if (!url) return null;
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const live  = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (live)  return live[1];
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  return null;
}

export default function BroadcastPage() {
  const { user }                                        = useAuth();
  const [episodes,          setEpisodes]          = useState([]);
  const [upcoming,          setUpcoming]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [reminderCopied,    setReminderCopied]    = useState(false);
  const [registeredStreams, setRegisteredStreams] = useState(new Set());
  const [registeringStream, setRegisteringStream] = useState(null);
  const [toast,             setToast]             = useState(null);
  const [isLive,            setIsLive]            = useState(false);
  const [liveUrl,           setLiveUrl]           = useState("");

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, "broadcasts"), orderBy("createdAt", "desc"), limit(10))),
      getDoc(doc(db, "system", "broadcast")),
    ])
      .then(([snap, sysSnap]) => {
        setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        const sys = sysSnap.exists() ? sysSnap.data() : {};
        setUpcoming(sys.upcoming || []);
        setIsLive(sys.isLive || false);
        setLiveUrl(sys.liveUrl || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Check which upcoming streams user has already registered for
  useEffect(() => {
    if (!user || upcoming.length === 0) return;
    Promise.all(
      upcoming.map((u, idx) =>
        getDoc(doc(db, "stream_registrations", `${streamSlug(u.title)}_${user.uid}`))
          .then(snap => (snap.exists() ? idx : null))
      )
    )
      .then(results => setRegisteredStreams(new Set(results.filter(r => r !== null))))
      .catch(console.error);
  }, [user, upcoming]);

  const nextBroadcast = upcoming[0];

  const handleReminder = () => {
    const text = nextBroadcast
      ? `DEVERT.IN LIVE: ${nextBroadcast.title} · ${nextBroadcast.date}`
      : "DEVERT.IN Live Broadcast";
    navigator.clipboard.writeText(text).then(() => {
      setReminderCopied(true);
      setTimeout(() => setReminderCopied(false), 2500);
    }).catch(() => {
      setToast({ msg: "Could not copy - try manually.", color: "#FF9500" });
    });
  };

  const handleRegister = async (u, idx) => {
    if (!user) { window.location.href = "/login?next=/broadcast"; return; }
    if (registeredStreams.has(idx)) return;
    setRegisteringStream(idx);
    try {
      await setDoc(doc(db, "stream_registrations", `${streamSlug(u.title)}_${user.uid}`), {
        uid:         user.uid,
        streamTitle: u.title,
        streamDate:  u.date || "",
        registeredAt: serverTimestamp(),
      });
      setRegisteredStreams(prev => new Set([...prev, idx]));
      setToast({ msg: `Registered for "${u.title}"`, color: "#00FF41" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error - try again.", color: "#FF5050" });
    } finally {
      setRegisteringStream(null);
    }
  };

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <AnimatePresence>
        {toast && <Toast key={toast.msg} {...toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /broadcast - devcast.live</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            BROADCAST <span className="text-neon-cyan">CENTER</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Live code. Raw takes. No tutorials.</p>
        </motion.div>

        {/* Featured / Live Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="terminal-window mb-8 overflow-hidden"
        >
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" />
            <div className="terminal-dot bg-yellow-500/70" />
            <div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">CHANNEL 01 - DEVERT_LIVE</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-red-500" : "bg-white/15"}`} />
              </span>
              <span className={`font-mono text-[10px] ${isLive ? "text-red-400" : "text-white/25"}`}>
                {isLive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
          <div className="aspect-video relative flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,255,255,0.03) 0%, rgba(0,255,65,0.02) 100%)" }}
          >
            {isLive && extractYouTubeId(liveUrl) ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${extractYouTubeId(liveUrl)}?autoplay=1&rel=0&modestbranding=1`}
                title="DeVert Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <div className="absolute inset-0 grid-bg opacity-20" />
                <div className="text-center z-10">
                  <Tv2 size={48} className="text-white/10 mx-auto mb-4" />
                  {nextBroadcast ? (
                    <>
                      <p className="font-mono text-sm text-white/28 mb-2">Next broadcast</p>
                      <p className="font-mono text-2xl font-bold text-white/50">{nextBroadcast.date}</p>
                      <p className="font-mono text-sm text-neon-cyan/60 mt-2">{nextBroadcast.title}</p>
                    </>
                  ) : (
                    <p className="font-mono text-sm text-white/28">No upcoming broadcasts scheduled</p>
                  )}
                  {nextBroadcast && (
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,65,0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReminder}
                      className="mt-6 font-mono text-sm text-black px-8 py-3 transition-all flex items-center gap-2 mx-auto"
                      style={{ background: reminderCopied ? "#00FFFF" : "#00FF41" }}
                    >
                      {reminderCopied
                        ? <><CheckCircle size={14} /> COPIED!</>
                        : <><Bell size={14} /> [ SET_REMINDER ]</>}
                    </motion.button>
                  )}
                </div>
                <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />
              </>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Past episodes */}
          <div className="lg:col-span-2">
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// past_broadcasts</p>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">episodes.archive</span>
              </div>
              {loading ? (
                <div className="divide-y divide-white/4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : episodes.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-mono text-xs text-white/20">no past broadcasts yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/4">
                  {episodes.map((ep, i) => (
                    <motion.div
                      key={ep.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
                      whileHover={{ background: "rgba(255,255,255,0.015)" }}
                      onClick={() => (ep.url || ep.youtubeUrl) && window.open(ep.url || ep.youtubeUrl, "_blank", "noopener noreferrer")}
                      className="flex items-center gap-4 p-4 transition-colors group"
                      style={{ cursor: (ep.url || ep.youtubeUrl) ? "pointer" : "default" }}
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors group-hover:border-neon-cyan/30"
                        style={{ background: "rgba(0,255,255,0.05)", border: "1px solid rgba(0,255,255,0.1)" }}>
                        <Play size={14} style={{ color: "#00FFFF" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium text-white/75 group-hover:text-white transition-colors truncate">{ep.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {ep.ep       && <span className="font-mono text-[9px] text-white/25">{ep.ep}</span>}
                          <span className="font-mono text-[9px] text-white/25">{ep.date}</span>
                          {ep.duration && <span className="font-mono text-[9px] text-white/25 flex items-center gap-0.5"><Clock size={8} /> {ep.duration}</span>}
                          {ep.views    && <span className="font-mono text-[9px] text-neon-green/50">{ep.views} views</span>}
                        </div>
                      </div>
                      {ep.tag && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/8 text-white/28 flex-shrink-0">{ep.tag}</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// upcoming_streams</p>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <Calendar size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">schedule.json</span>
              </div>
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border border-white/6 rounded-lg p-4 animate-pulse space-y-2">
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-mono text-xs text-white/20">no upcoming streams</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {upcoming.map((u, i) => {
                    const isRegistered = registeredStreams.has(i);
                    const isRegistering = registeringStream === i;
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
                        className="border border-white/6 rounded-lg p-4"
                        style={isRegistered ? { borderColor: "rgba(0,255,65,0.18)" } : {}}
                      >
                        <p className="font-sans text-sm font-medium text-white/75 mb-2 leading-snug">{u.title}</p>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-neon-cyan/70 mb-1">
                          <Radio size={9} /> {u.date}
                        </div>
                        {u.registered != null && (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/28 mb-3">
                            <Users size={9} /> {u.registered + (isRegistered ? 1 : 0)} registered
                          </div>
                        )}
                        <motion.button
                          whileHover={!isRegistered ? { scale: 1.01 } : {}}
                          whileTap={!isRegistered ? { scale: 0.98 } : {}}
                          onClick={() => !isRegistered && handleRegister(u, i)}
                          disabled={isRegistered || isRegistering}
                          className="w-full font-mono text-[11px] py-2 transition-all flex items-center justify-center gap-1.5 border rounded"
                          style={isRegistered
                            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.05)", cursor: "default" }
                            : { color: "#00FF41", borderColor: "rgba(0,255,65,0.25)" }
                          }
                        >
                          {isRegistered
                            ? <><CheckCircle size={10} /> REGISTERED</>
                            : isRegistering
                            ? "[ REGISTERING... ]"
                            : "[ REGISTER ]"}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
