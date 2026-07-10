"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Star, ExternalLink, MapPin, Globe, Github, Linkedin, Twitter,
  Share2, Check, UserPlus, UserMinus, ArrowLeft, GraduationCap,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc,
  updateDoc, serverTimestamp, increment, limit, onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { writeNotification } from "@/components/notification-bell";
import { EnterHqModal } from "@/components/enter-hq-modal";
import { fetchCourseTree, flattenTasks, courseProgressPct } from "@/lib/learning";

/* ─── constants ─── */
const LEVEL_LABEL     = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const ACTIVITY_COLORS = { ship: "#00FFFF", arena: "#FF9500", grind: "#00FF41", rank: "#FFD700", mission: "#C77DFF" };

function getTierFromXP(xp = 0) {
  if (xp >= 10000) return { name: "LEGEND",    color: "#FFD700" };
  if (xp >= 5000)  return { name: "ELITE",     color: "#FF6430" };
  if (xp >= 2000)  return { name: "ARCHITECT", color: "#00FFFF" };
  if (xp >= 500)   return { name: "BUILDER",   color: "#00FF41" };
  return                  { name: "RECRUIT",   color: "#888888" };
}

function StatBox({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center text-center border border-white/6 rounded-lg p-3 min-w-0">
      <span className="font-mono text-base font-bold leading-none mb-1" style={{ color }}>{value}</span>
      <span className="font-mono text-[8px] text-white/25 tracking-wider leading-tight">{label}</span>
    </div>
  );
}

export default function PublicDevCard() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Read handle from URL path: /u/somehandle → "somehandle"
  const [handle,   setHandle]   = useState("");
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following,setFollowing]= useState(false);
  const [fLoading, setFLoading] = useState(false);
  const [shared,   setShared]   = useState(false);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);
  const [learning, setLearning] = useState(null); // { courseTitle, color, pct } | null

  const isOwnProfile = user && profile && user.uid === profile.uid;

  /* ── learning progress, for the Dev Card ── */
  useEffect(() => {
    if (!profile?.uid) { setLearning(null); return; }
    (async () => {
      try {
        const progressSnap = await getDoc(doc(db, "user_learning", profile.uid));
        if (!progressSnap.exists() || !progressSnap.data().enrolledCourseId) { setLearning(null); return; }
        const data = progressSnap.data();
        const course = await fetchCourseTree(data.enrolledCourseId);
        if (!course) { setLearning(null); return; }
        const flat = flattenTasks(course);
        setLearning({
          courseTitle: course.title,
          color: course.color || "#00FF41",
          pct: courseProgressPct(flat, data.completedTaskIds || []),
        });
      } catch (e) { console.error(e); setLearning(null); }
    })();
  }, [profile?.uid]);

  /* ── resolve handle from pathname ──
     usePathname() (not window.location, read once) so navigating between
     two /u/* profiles via client-side routing (e.g. the command palette)
     re-resolves the handle instead of leaving the previous profile on screen. */
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    // /u/somehandle → parts = ["u", "somehandle"]
    const h = parts[1] || "";
    setHandle(h);
    // Clear stale profile immediately so the old profile never flashes
    // while the new one loads.
    setProfile(null);
    setFollowing(false);
  }, [pathname]);

  /* ── load profile: resolve handle -> uid once, then subscribe live so
     other users' likes/comments/follows update this view without a refresh ── */
  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setNotFound(false);
    let unsubscribeDoc = () => {};

    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("handle", "==", handle), limit(1))
        );
        if (snap.empty) { setNotFound(true); setLoading(false); return; }
        // Always use the Firestore document ID as uid - the uid field inside the doc may be missing on older accounts
        const uid = snap.docs[0].id;
        unsubscribeDoc = onSnapshot(doc(db, "users", uid), profileSnap => {
          if (!profileSnap.exists()) { setNotFound(true); setLoading(false); return; }
          const data = { ...profileSnap.data(), uid };
          setProfile({ ...data, tier: getTierFromXP(data.xp ?? 0) });
          setLoading(false);
        }, err => { console.error(err); setNotFound(true); setLoading(false); });
      } catch (e) {
        console.error(e);
        setNotFound(true);
        setLoading(false);
      }
    })();

    return () => unsubscribeDoc();
  }, [handle]);

  /* ── check follow state ── */
  useEffect(() => {
    if (!user || !profile || isOwnProfile) return;
    (async () => {
      const snap = await getDoc(doc(db, "follows", `${user.uid}_${profile.uid}`));
      setFollowing(snap.exists());
    })();
  }, [user, profile, isOwnProfile]);

  /* ── follow / unfollow ── */
  const toggleFollow = async () => {
    if (!user || !profile || isOwnProfile || fLoading) return;
    setFLoading(true);
    const followRef  = doc(db, "follows", `${user.uid}_${profile.uid}`);
    const myRef      = doc(db, "users", user.uid);
    const theirRef   = doc(db, "users", profile.uid);
    try {
      if (following) {
        await deleteDoc(followRef);
        await updateDoc(myRef,    { followingCount: increment(-1) });
        await updateDoc(theirRef, { followersCount: increment(-1) });
        setProfile(p => ({ ...p, followersCount: Math.max(0, (p.followersCount || 0) - 1) }));
        setFollowing(false);
      } else {
        await setDoc(followRef, { followerId: user.uid, followeeId: profile.uid, createdAt: serverTimestamp() });
        await updateDoc(myRef,    { followingCount: increment(1) });
        await updateDoc(theirRef, { followersCount: increment(1) });
        setProfile(p => ({ ...p, followersCount: (p.followersCount || 0) + 1 }));
        setFollowing(true);
        writeNotification(profile.uid, {
          type: "follow",
          title: `@${user.displayName || "someone"} followed you`,
          body: "You have a new follower on DeVert.",
          ctaHref: `/u/${handle}`,
          ctaLabel: "view profile",
        });
      }
    } catch (e) { console.error(e); }
    setFLoading(false);
  };

  const shareProfile = () => {
    navigator.clipboard.writeText(`https://devert.in/u/${handle}`);
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  /* ─── loading ─── */
  if (loading || !handle) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border border-white/10 border-t-neon-cyan rounded-full animate-spin" />
        <p className="font-mono text-xs text-white/20">loading dev card...</p>
      </div>
    </main>
  );

  /* ─── not found ─── */
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="font-mono text-2xl text-white/20 mb-3">404</p>
        <p className="font-mono text-sm text-white/30 mb-2">@{handle} not found</p>
        <p className="font-mono text-xs text-white/15 mb-8">// this dev hasn't shipped yet</p>
        <Link href="/"
          className="font-mono text-xs text-neon-cyan/60 border border-neon-cyan/20 px-4 py-2 rounded hover:bg-neon-cyan/6 transition-colors">
          ← back to devert.in
        </Link>
      </div>
    </main>
  );

  const {
    displayName, bio, tier, photoURL, location, github, linkedin, twitter, website,
    xp = 0, ships = 0, arenaWins = 0, streak = 0,
    skills = [], projects = [], recentActivity = [],
    followersCount = 0, followingCount = 0,
    pulsePostsCount = 0, totalLikesReceived = 0, totalCommentsReceived = 0, totalSavesReceived = 0,
    totalRepostsReceived = 0,
  } = profile;

  const stats = [
    { label: "XP",       value: xp.toLocaleString(), color: "#00FFFF" },
    { label: "SHIPS",    value: String(ships),         color: "#00FF41" },
    { label: "ARENA",    value: String(arenaWins),     color: "#FF9500" },
    { label: "STREAK",   value: `${streak}d`,         color: "#FF6430" },
    { label: "FOLLOWERS",value: String(followersCount),color: "#C77DFF"},
    { label: "FOLLOWING",value: String(followingCount),color: "#C77DFF"},
    { label: "PULSES",   value: String(pulsePostsCount),          color: "#00FF41" },
    { label: "LIKES",    value: totalLikesReceived.toLocaleString(),    color: "#FF5050" },
    { label: "COMMENTS", value: totalCommentsReceived.toLocaleString(), color: "#00FFFF" },
    { label: "SAVES",    value: totalSavesReceived.toLocaleString(),    color: "#A78BFA" },
    { label: "REPOSTS",  value: totalRepostsReceived.toLocaleString(),  color: "#00FF41" },
  ];

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/"
            className="flex items-center gap-1.5 font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors">
            <ArrowLeft size={10} /> devert.in
          </Link>
          <span className="font-mono text-[10px] text-white/10">/</span>
          <span className="font-mono text-[10px] text-white/25">u/{handle}</span>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">
          // public dev_card.json
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* ── Identity ── */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <Terminal size={10} className="ml-2 text-white/25" />
              <span className="font-mono text-[10px] text-white/25 ml-1.5">@{handle}.json</span>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName || handle}
                      className="w-20 h-20 rounded-2xl object-cover"
                      style={{ border: "1px solid rgba(0,255,255,0.2)" }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-bold text-3xl"
                      style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)", color: "#00FFFF" }}>
                      {handle[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h1 className="font-sans text-xl font-bold text-white">{displayName || handle}</h1>
                    <span className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                      {tier.name}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-white/30 mb-2">@{handle}</p>
                  {bio && <p className="font-mono text-xs text-white/45 leading-relaxed mb-3 max-w-lg">{bio}</p>}

                  <div className="flex items-center gap-4 flex-wrap">
                    {location && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-white/28">
                        <MapPin size={10} /> {location}
                      </span>
                    )}
                    {github   && <a href={github.startsWith("http")   ? github   : `https://${github}`}   target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-green transition-colors" title="GitHub"><Github   size={13}/></a>}
                    {linkedin && <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan  transition-colors" title="LinkedIn"><Linkedin size={13}/></a>}
                    {twitter  && <a href={twitter.startsWith("http")  ? twitter  : `https://${twitter}`}  target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/60  transition-colors" title="Twitter"><Twitter  size={13}/></a>}
                    {website  && <a href={website.startsWith("http")  ? website  : `https://${website}`}  target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan  transition-colors" title="Website"><Globe    size={13}/></a>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
                {stats.map(s => <StatBox key={s.label} {...s} />)}
              </div>

              {/* Learning progress */}
              {learning && (
                <div className="border border-white/6 rounded-lg p-3 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-white/40 flex items-center gap-1.5"><GraduationCap size={11} /> {learning.courseTitle}</span>
                    <span className="font-mono text-[10px] text-white/30">{learning.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${learning.pct}%`, background: learning.color }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5">
                {/* Share */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={shareProfile}
                  className="flex items-center gap-2 font-mono text-xs py-2.5 px-4 border transition-all"
                  style={shared
                    ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }
                    : { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <AnimatePresence mode="wait">
                    {shared
                      ? <motion.span key="y" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Check size={12}/> copied!</motion.span>
                      : <motion.span key="n" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Share2 size={12}/> share</motion.span>
                    }
                  </AnimatePresence>
                </motion.button>

                {/* Follow / Edit / Login */}
                {isOwnProfile ? (
                  <Link href="/profile"
                    className="flex items-center gap-2 font-mono text-xs text-neon-cyan border border-neon-cyan/25 py-2.5 px-4 hover:bg-neon-cyan/6 transition-all">
                    edit profile
                  </Link>
                ) : user ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={toggleFollow} disabled={fLoading}
                    className="flex items-center gap-2 font-mono text-xs py-2.5 px-5 border transition-all disabled:opacity-50"
                    style={following
                      ? { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)" }
                      : { color: "#00FF41",                borderColor: "rgba(0,255,65,0.35)", background: "rgba(0,255,65,0.04)" }}
                  >
                    {fLoading ? (
                      <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    ) : following ? (
                      <><UserMinus size={12}/> following</>
                    ) : (
                      <><UserPlus size={12}/> follow</>
                    )}
                  </motion.button>
                ) : (
                  <button onClick={() => setGuestPromptOpen(true)}
                    className="flex items-center gap-2 font-mono text-xs text-white/25 border border-white/8 py-2.5 px-4 hover:text-white/45 transition-colors">
                    <UserPlus size={12}/> follow
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Skills + Projects ── */}
          <div className="grid gap-5 lg:grid-cols-2">

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Star size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">skills.profile</span>
              </div>
              <div className="p-5">
                {skills.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="font-mono text-xs text-white/22">no skills listed</p>
                    <p className="font-mono text-[9px] text-white/12 mt-1">// stay tuned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {skills.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className="flex items-center gap-3">
                        <span className="font-mono text-xs text-white/60 flex-1 min-w-0 truncate">{s.name}</span>
                        <div className="flex gap-[3px]">
                          {Array.from({ length: 5 }, (_, j) => (
                            <div key={j} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: j < s.level ? "#00FF41" : "rgba(255,255,255,0.08)" }} />
                          ))}
                        </div>
                        <span className="font-mono text-[9px] w-20 text-right text-white/22 hidden sm:block">{LEVEL_LABEL[s.level]}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <ExternalLink size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">projects.dock</span>
              </div>
              <div className="p-5">
                {projects.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="font-mono text-xs text-white/22">no projects docked</p>
                    <p className="font-mono text-[9px] text-white/12 mt-1">// ships launching soon</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((p, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className="border border-white/6 rounded-lg p-3 hover:border-white/12 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-white/75 leading-snug">{p.name}</span>
                          {p.url && (
                            <a href={p.url.startsWith("http") ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer"
                              className="text-white/20 hover:text-neon-cyan transition-colors flex-shrink-0">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                        {p.description && <p className="font-mono text-[10px] text-white/30 mb-2 leading-relaxed">{p.description}</p>}
                        {p.stack?.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {p.stack.map(t => (
                              <span key={t} className="font-mono text-[9px] text-white/22 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Activity ── */}
          {recentActivity.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">activity.feed</span>
              </div>
              <div className="divide-y divide-white/4">
                {recentActivity.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: ACTIVITY_COLORS[a.type] || "#666", boxShadow: `0 0 4px ${ACTIVITY_COLORS[a.type] || "#666"}` }} />
                    <span className="font-mono text-xs text-white/55 flex-1">{a.msg}</span>
                    <span className="font-mono text-[10px] text-white/22 flex-shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer watermark */}
          <div className="text-center pt-4">
            <p className="font-mono text-[10px] text-white/12">
              // powered by{" "}
              <Link href="/" className="text-white/20 hover:text-neon-green transition-colors">devert.in</Link>
              {" "}- the developer arena
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {guestPromptOpen && (
          <EnterHqModal onClose={() => setGuestPromptOpen(false)} next={`/u/${handle}`} />
        )}
      </AnimatePresence>
    </main>
  );
}
