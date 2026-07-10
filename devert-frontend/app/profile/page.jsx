"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, GitCommit, Star, LogOut, Pencil, Check, X, Lock,
  Upload, MapPin, Globe, Github, Linkedin, Twitter, Plus, Trash2,
  ExternalLink, Copy, Share2, Users, UserPlus, GraduationCap,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, where, getDocs, getDoc, doc, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { fetchCourseTree, flattenTasks, courseProgressPct } from "@/lib/learning";

/* ─── constants ─── */
const HANDLE_RE      = /^[a-z0-9_]{3,20}$/;
const LEVEL_LABEL    = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const TIER_COLORS    = { LEGEND: "#FFD700", ELITE: "#FF6430", ARCHITECT: "#00FFFF", BUILDER: "#00FF41", RECRUIT: "#888888" };
const ACTIVITY_COLORS= { ship: "#00FFFF", arena: "#FF9500", grind: "#00FF41", rank: "#FFD700", mission: "#C77DFF" };

/* ─── tiny reusable pieces ─── */
function Field({ label, value, onChange, placeholder, maxLength, hint, type = "text", prefix }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{label}</p>
      <div className="flex items-center gap-0">
        {prefix && (
          <span className="font-mono text-xs text-white/30 px-3 py-2 rounded-l"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRight: "none" }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          className={`flex-1 font-mono text-xs text-white/80 px-3 py-2 outline-none transition-colors ${prefix ? "rounded-r" : "rounded"}`}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>
      {hint && <p className="font-mono text-[9px] text-white/18 mt-1">{hint}</p>}
    </div>
  );
}

function DotPicker({ level, onChange, color = "#00FF41", size = "md" }) {
  const sz = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <div className="flex gap-1 items-center">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5 hover:scale-125 transition-transform">
          <div className={`${sz} rounded-full transition-colors`}
            style={{ background: i <= level ? color : "rgba(255,255,255,0.1)" }} />
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-[9px] tracking-widest text-neon-green/60">// {title}</span>
      <span className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function StatBox({ label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center border border-white/6 rounded-lg p-3 min-w-0 transition-colors ${onClick ? "cursor-pointer hover:border-white/18 hover:bg-white/2" : ""}`}
    >
      <span className="font-mono text-base font-bold leading-none mb-1" style={{ color }}>{value}</span>
      <span className="font-mono text-[8px] text-white/25 tracking-wider leading-tight">{label}</span>
    </div>
  );
}

function FollowersModal({ uid, onClose }) {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "follows"), where("followeeId", "==", uid), limit(50))
        );
        const uids = snap.docs.map(d => d.data().followerId);
        const profiles = await Promise.all(uids.map(u => getDoc(doc(db, "users", u))));
        setList(profiles.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [uid]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="terminal-window w-full max-w-md max-h-[75vh] flex flex-col"
      >
        {/* Header */}
        <div className="terminal-header flex-shrink-0">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          <Users size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1.5">followers.list</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
            <X size={12} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border border-white/10 border-t-neon-cyan rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono text-xs text-white/22 mb-1">no followers yet</p>
              <p className="font-mono text-[9px] text-white/12">// share your profile to get followed</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-[9px] text-white/20 mb-3 tracking-wider">// {list.length} follower{list.length !== 1 ? "s" : ""}</p>
              {list.map((f, i) => (
                <motion.a
                  key={f.uid}
                  href={`/u/${f.handle}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors group"
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} alt={f.displayName}
                      className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
                      style={{ border: "1px solid rgba(0,255,255,0.15)" }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                      style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.15)", color: "#00FFFF" }}>
                      {(f.handle || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white/75 font-semibold leading-tight truncate group-hover:text-white transition-colors">
                      {f.displayName || f.handle}
                    </p>
                    <p className="font-mono text-[9px] text-white/28">@{f.handle}</p>
                  </div>
                  <ExternalLink size={10} className="text-white/15 group-hover:text-neon-cyan/50 flex-shrink-0 transition-colors" />
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── main component ─── */
export default function ProfilePage() {
  const { user, userData, logout, updateProfile } = useAuth();
  const router = useRouter();

  const [editMode,      setEditMode]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState("");
  const [shared,        setShared]        = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [photoUploading,setPhotoUploading]= useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [learning, setLearning] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) { setLearning(null); return; }
    (async () => {
      try {
        const progressSnap = await getDoc(doc(db, "user_learning", user.uid));
        if (!progressSnap.exists() || !progressSnap.data().enrolledCourseId) { setLearning(null); return; }
        const data = progressSnap.data();
        const course = await fetchCourseTree(data.enrolledCourseId);
        if (!course) { setLearning(null); return; }
        const flat = flattenTasks(course);
        setLearning({ courseTitle: course.title, color: course.color || "#00FF41", pct: courseProgressPct(flat, data.completedTaskIds || []) });
      } catch (e) { console.error(e); setLearning(null); }
    })();
  }, [user]);

  // edit fields
  const [editName,    setEditName]    = useState("");
  const [editHandle,  setEditHandle]  = useState("");
  const [editBio,     setEditBio]     = useState("");
  const [editPhoto,   setEditPhoto]   = useState("");
  const [editLoc,     setEditLoc]     = useState("");
  const [editGH,      setEditGH]      = useState("");
  const [editLI,      setEditLI]      = useState("");
  const [editTW,      setEditTW]      = useState("");
  const [editWeb,     setEditWeb]     = useState("");
  const [editSkills,  setEditSkills]  = useState([]);
  const [editProjects,setEditProjects]= useState([]);

  // new-skill row
  const [newSkillName,  setNewSkillName]  = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  // new-project row
  const [newProjName,  setNewProjName]  = useState("");
  const [newProjUrl,   setNewProjUrl]   = useState("");
  const [newProjDesc,  setNewProjDesc]  = useState("");
  const [newProjStack, setNewProjStack] = useState("");
  const [addingProj,   setAddingProj]   = useState(false);

  /* derived */
  const handle      = userData?.handle || user?.email?.split("@")[0] || "dev";
  const displayName = userData?.displayName || handle;
  const bio         = userData?.bio || "";
  const tier        = userData?.tier || { name: "RECRUIT", color: "#888888" };
  const xp          = userData?.xp ?? 0;
  const credits     = userData?.credits ?? 0;
  const ships       = userData?.ships ?? 0;
  const arenaWins   = userData?.arenaWins ?? 0;
  const streak      = userData?.streak ?? 0;
  const skills      = userData?.skills || [];
  const projects    = userData?.projects || [];
  const activity    = userData?.recentActivity || [];
  const photoURL    = userData?.photoURL || "";
  const location    = userData?.location || "";
  const github      = userData?.github || "";
  const linkedin    = userData?.linkedin || "";
  const twitter     = userData?.twitter || "";
  const website     = userData?.website || "";
  const followers   = userData?.followersCount ?? 0;
  const following   = userData?.followingCount ?? 0;
  const pulsePosts       = userData?.pulsePostsCount ?? 0;
  const likesReceived    = userData?.totalLikesReceived ?? 0;
  const commentsReceived = userData?.totalCommentsReceived ?? 0;
  const savesReceived    = userData?.totalSavesReceived ?? 0;

  const stats = [
    { label: "XP",        value: xp.toLocaleString(),     color: "#00FFFF" },
    { label: "SHIPS",     value: String(ships),            color: "#00FF41" },
    { label: "ARENA",     value: String(arenaWins),        color: "#FF9500" },
    { label: "STREAK",    value: `${streak}d`,            color: "#FF6430" },
    { label: "CREDITS",   value: credits.toLocaleString(), color: "#FFD700" },
    { label: "FOLLOWERS", value: String(followers), color: "#C77DFF", onClick: () => setFollowersOpen(true) },
    { label: "FOLLOWING", value: String(following), color: "#C77DFF" },
    { label: "PULSES",    value: String(pulsePosts),                 color: "#00FF41" },
    { label: "LIKES",     value: likesReceived.toLocaleString(),     color: "#FF5050" },
    { label: "COMMENTS",  value: commentsReceived.toLocaleString(),  color: "#00FFFF" },
    { label: "SAVES",     value: savesReceived.toLocaleString(),     color: "#A78BFA" },
  ];

  /* actions */
  const openEdit = () => {
    setEditName(userData?.displayName || "");
    setEditHandle(userData?.handle || "");
    setEditBio(userData?.bio || "");
    setEditPhoto(userData?.photoURL || "");
    setEditLoc(userData?.location || "");
    setEditGH(userData?.github || "");
    setEditLI(userData?.linkedin || "");
    setEditTW(userData?.twitter || "");
    setEditWeb(userData?.website || "");
    setEditSkills([...(userData?.skills || [])]);
    setEditProjects([...(userData?.projects || [])]);
    setSaveError("");
    setEditMode(true);
  };

  const shareProfile = () => {
    navigator.clipboard.writeText(`https://devert.in/u/${handle}`);
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    try {
      const sRef = storageRef(storage, `profile-pics/${user.uid}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setEditPhoto(url);
    } catch (err) { console.error(err); }
    finally { setPhotoUploading(false); }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setEditSkills(p => [...p, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName(""); setNewSkillLevel(3);
  };

  const addProject = () => {
    if (!newProjName.trim()) return;
    setEditProjects(p => [...p, {
      name: newProjName.trim(),
      url: newProjUrl.trim(),
      description: newProjDesc.trim(),
      stack: newProjStack.split(",").map(s => s.trim()).filter(Boolean),
    }]);
    setNewProjName(""); setNewProjUrl(""); setNewProjDesc(""); setNewProjStack(""); setAddingProj(false);
  };

  const handleSave = async () => {
    const trimName   = editName.trim();
    const trimHandle = editHandle.trim().toLowerCase();
    if (!trimName)                   return setSaveError("Full name cannot be empty.");
    if (!HANDLE_RE.test(trimHandle)) return setSaveError("Username: 3–20 chars, lowercase letters, numbers, underscores only.");
    setSaving(true); setSaveError("");
    try {
      if (trimHandle !== userData?.handle) {
        const snap = await getDocs(query(collection(db, "users"), where("handle", "==", trimHandle), limit(1)));
        if (!snap.empty) { setSaveError(`@${trimHandle} is already taken.`); setSaving(false); return; }
      }
      await updateProfile({
        displayName: trimName, handle: trimHandle, bio: editBio.trim(),
        photoURL: editPhoto.trim(), location: editLoc.trim(),
        github: editGH.trim(), linkedin: editLI.trim(), twitter: editTW.trim(), website: editWeb.trim(),
        skills: editSkills, projects: editProjects,
      });
      setEditMode(false);
    } catch { setSaveError("Save failed. Try again."); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  /* ─── render ─── */
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <AnimatePresence>
        {followersOpen && user && (
          <FollowersModal uid={user.uid} onClose={() => setFollowersOpen(false)} />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /profile - dev_card.json</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>
            DEV <span className="text-neon-cyan">CARD</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {editMode ? (

            /* ════════════════ EDIT MODE ════════════════ */
            <motion.div key="edit"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <Pencil size={9} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1.5">editing dev_card.json</span>
                  <button onClick={() => setEditMode(false)} className="ml-auto text-white/25 hover:text-white/55 transition-colors">
                    <X size={12} />
                  </button>
                </div>

                <div className="p-6 space-y-10 max-w-2xl">

                  {/* ── Profile Info ── */}
                  <div>
                    <SectionHeader title="profile_info" />

                    {/* Photo */}
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative flex-shrink-0">
                        {editPhoto ? (
                          <img src={editPhoto} alt="avatar"
                            className="w-20 h-20 rounded-2xl object-cover"
                            style={{ border: "1px solid rgba(0,255,255,0.2)" }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-bold text-3xl"
                            style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)", color: "#00FFFF" }}>
                            {handle[0]?.toUpperCase()}
                          </div>
                        )}
                        {photoUploading && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(5,5,5,0.7)" }}>
                            <span className="w-5 h-5 border border-white/20 border-t-neon-cyan rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        <button onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-2 font-mono text-xs text-white/40 border border-white/10 px-3 py-2 rounded hover:text-neon-cyan hover:border-neon-cyan/25 transition-colors"
                        >
                          <Upload size={11} /> upload photo
                        </button>
                        <p className="font-mono text-[9px] text-white/18">or paste URL below</p>
                        <input value={editPhoto} onChange={e => setEditPhoto(e.target.value)}
                          placeholder="https://..."
                          className="w-full font-mono text-[10px] text-white/60 px-2 py-1.5 rounded outline-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                          onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.3)")}
                          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="FULL NAME" value={editName} onChange={setEditName} placeholder="Your name" maxLength={40} />
                      <Field label="USERNAME" value={editHandle} onChange={v => setEditHandle(v.toLowerCase())} placeholder="your_handle" maxLength={20}
                        hint="3–20 chars · lowercase, numbers, underscores" prefix="@" />
                    </div>
                    <div className="mt-4">
                      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">BIO</p>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                        placeholder="One line. Who are you." maxLength={120} rows={2}
                        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none transition-colors"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      <p className="font-mono text-[9px] text-white/18 mt-0.5">{editBio.length}/120</p>
                    </div>
                    <div className="mt-4">
                      <Field label="LOCATION" value={editLoc} onChange={setEditLoc} placeholder="City, Country" maxLength={50} prefix={<MapPin size={12} />} />
                    </div>
                  </div>

                  {/* ── Social Links ── */}
                  <div>
                    <SectionHeader title="social_links" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="GITHUB" value={editGH} onChange={setEditGH} placeholder="github.com/username" maxLength={100} />
                      <Field label="LINKEDIN" value={editLI} onChange={setEditLI} placeholder="linkedin.com/in/username" maxLength={100} />
                      <Field label="TWITTER / X" value={editTW} onChange={setEditTW} placeholder="twitter.com/username" maxLength={100} />
                      <Field label="WEBSITE" value={editWeb} onChange={setEditWeb} placeholder="https://yoursite.com" maxLength={100} />
                    </div>
                  </div>

                  {/* ── Skills ── */}
                  <div>
                    <SectionHeader title="skills" />
                    <div className="space-y-2 mb-4">
                      {editSkills.length === 0 && (
                        <p className="font-mono text-[10px] text-white/20">// no skills yet - add your first one below</p>
                      )}
                      {editSkills.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="font-mono text-xs text-white/65 flex-1">{s.name}</span>
                          <DotPicker level={s.level} color="#00FF41" size="sm"
                            onChange={v => setEditSkills(p => p.map((x,j) => j===i ? {...x, level:v} : x))} />
                          <span className="font-mono text-[9px] text-white/25 w-20 text-right hidden sm:block">{LEVEL_LABEL[s.level]}</span>
                          <button onClick={() => setEditSkills(p => p.filter((_,j) => j!==i))}
                            className="text-white/20 hover:text-red-400 transition-colors ml-1">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add skill row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addSkill()}
                        placeholder="Skill name (e.g. Java)" maxLength={30}
                        className="flex-1 min-w-[120px] font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(0,255,65,0.3)")}
                        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                      <DotPicker level={newSkillLevel} onChange={setNewSkillLevel} color="#00FF41" />
                      <button onClick={addSkill}
                        className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors">
                        <Plus size={11} /> add
                      </button>
                    </div>
                  </div>

                  {/* ── Projects ── */}
                  <div>
                    <SectionHeader title="projects" />
                    <div className="space-y-2 mb-4">
                      {editProjects.length === 0 && (
                        <p className="font-mono text-[10px] text-white/20">// no projects yet - add your work below</p>
                      )}
                      {editProjects.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-white/75 font-semibold">{p.name}</p>
                            {p.url && <p className="font-mono text-[10px] text-neon-cyan/50 truncate">{p.url}</p>}
                            {p.description && <p className="font-mono text-[10px] text-white/28 mt-0.5">{p.description}</p>}
                            {p.stack?.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {p.stack.map(t => (
                                  <span key={t} className="font-mono text-[9px] text-white/22 border border-white/8 px-1 py-0.5 rounded">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => setEditProjects(p => p.filter((_,j) => j!==i))}
                            className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add project */}
                    {addingProj ? (
                      <div className="space-y-3 p-4 rounded" style={{ background: "rgba(0,255,65,0.03)", border: "1px solid rgba(0,255,65,0.1)" }}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="PROJECT NAME" value={newProjName} onChange={setNewProjName} placeholder="TripLy" maxLength={60} />
                          <Field label="URL" value={newProjUrl} onChange={setNewProjUrl} placeholder="https://github.com/..." maxLength={200} />
                        </div>
                        <Field label="DESCRIPTION" value={newProjDesc} onChange={setNewProjDesc} placeholder="One-liner. What does it do?" maxLength={120} />
                        <Field label="STACK" value={newProjStack} onChange={setNewProjStack} placeholder="React, Spring Boot, Redis" maxLength={150}
                          hint="comma-separated" />
                        <div className="flex gap-2">
                          <button onClick={addProject}
                            className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors">
                            <Check size={11} /> add project
                          </button>
                          <button onClick={() => setAddingProj(false)}
                            className="font-mono text-xs text-white/25 border border-white/8 px-3 py-2 rounded hover:bg-white/4 transition-colors">
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingProj(true)}
                        className="flex items-center gap-1.5 font-mono text-xs text-neon-cyan/60 border border-neon-cyan/15 px-3 py-2 rounded hover:bg-neon-cyan/5 transition-colors">
                        <Plus size={11} /> add project
                      </button>
                    )}
                  </div>

                  {/* ── Account (locked) ── */}
                  <div>
                    <SectionHeader title="account" />
                    <div className="flex items-center gap-2 mb-6">
                      <Lock size={10} className="text-white/20" />
                      <span className="font-mono text-[10px] text-white/25 tracking-widest">EMAIL (cannot change)</span>
                    </div>
                    <div className="font-mono text-xs text-white/25 px-3 py-2 rounded mb-6"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {user?.email}
                    </div>
                  </div>

                  {/* ── Save / Cancel ── */}
                  {saveError && (
                    <p className="font-mono text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3 rounded">{saveError}</p>
                  )}
                  <div className="flex gap-3 pb-2">
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={handleSave} disabled={saving}
                      className="flex-1 font-mono text-sm py-3 text-black bg-neon-green border border-neon-green disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
                    >
                      <Check size={13} /> {saving ? "saving..." : "[ SAVE_CHANGES ]"}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setEditMode(false)} disabled={saving}
                      className="font-mono text-sm py-3 px-6 text-white/35 border border-white/10 disabled:opacity-50 hover:text-white/55 transition-colors"
                    >
                      cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

          ) : (

            /* ════════════════ VIEW MODE ════════════════ */
            <motion.div key="view"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* ── Identity card ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="terminal-window"
              >
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <Terminal size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1.5">identity.json</span>
                  <button onClick={openEdit}
                    className="ml-auto flex items-center gap-1 font-mono text-[10px] text-white/25 hover:text-neon-cyan transition-colors">
                    <Pencil size={9} /> edit
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {photoURL ? (
                        <img src={photoURL} alt={displayName}
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
                        <h2 className="font-sans text-xl font-bold text-white">{displayName}</h2>
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
                        {github   && <a href={github.startsWith("http") ? github : `https://${github}`} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-green transition-colors" title="GitHub"><Github size={13} /></a>}
                        {linkedin && <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan transition-colors" title="LinkedIn"><Linkedin size={13} /></a>}
                        {twitter  && <a href={twitter.startsWith("http") ? twitter : `https://${twitter}`}   target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/65 transition-colors" title="Twitter"><Twitter size={13} /></a>}
                        {website  && <a href={website.startsWith("http") ? website : `https://${website}`}   target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan transition-colors" title="Website"><Globe size={13} /></a>}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
                    {stats.map(s => <StatBox key={s.label} label={s.label} value={s.value} color={s.color} onClick={s.onClick} />)}
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
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={shareProfile}
                      className="flex items-center gap-2 font-mono text-xs py-2.5 px-4 border transition-all"
                      style={shared
                        ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }
                        : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}
                    >
                      <AnimatePresence mode="wait">
                        {shared
                          ? <motion.span key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check size={12} /> link copied!</motion.span>
                          : <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Share2 size={12} /> share profile</motion.span>
                        }
                      </AnimatePresence>
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={openEdit}
                      className="flex items-center gap-2 font-mono text-xs text-neon-cyan border border-neon-cyan/25 py-2.5 px-4 hover:bg-neon-cyan/6 transition-all"
                    >
                      <Pencil size={11} /> edit profile
                    </motion.button>

                    <AnimatePresence mode="wait">
                      {confirmLogout ? (
                        <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex gap-2">
                          <button onClick={handleLogout}
                            className="font-mono text-xs text-red-400 border border-red-500/30 py-2.5 px-4 hover:bg-red-500/8 transition-colors">
                            yes, logout
                          </button>
                          <button onClick={() => setConfirmLogout(false)}
                            className="font-mono text-xs text-white/25 border border-white/8 py-2.5 px-4 hover:bg-white/4 transition-colors">
                            cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button key="lo" whileHover={{ scale: 1.02 }} onClick={() => setConfirmLogout(true)}
                          className="flex items-center gap-2 font-mono text-xs text-white/22 border border-white/6 py-2.5 px-4 hover:text-red-400 hover:border-red-500/25 transition-all">
                          <LogOut size={11} /> logout
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* ── Skills + Projects ── */}
              <div className="grid gap-5 lg:grid-cols-2">

                {/* Skills */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="terminal-window"
                >
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500/70" />
                    <div className="terminal-dot bg-yellow-500/70" />
                    <div className="terminal-dot bg-green-500/70" />
                    <Star size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">skills.profile</span>
                    <button onClick={openEdit}
                      className="ml-auto flex items-center gap-1 font-mono text-[10px] text-white/20 hover:text-neon-green transition-colors">
                      <Plus size={9} /> add
                    </button>
                  </div>
                  <div className="p-5">
                    {skills.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="font-mono text-xs text-white/22 mb-1">no skills listed yet</p>
                        <p className="font-mono text-[9px] text-white/12">// click edit to add your stack</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {skills.map((s, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="flex items-center gap-3"
                          >
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

                {/* Projects */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="terminal-window"
                >
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500/70" />
                    <div className="terminal-dot bg-yellow-500/70" />
                    <div className="terminal-dot bg-green-500/70" />
                    <ExternalLink size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">projects.dock</span>
                    <button onClick={openEdit}
                      className="ml-auto flex items-center gap-1 font-mono text-[10px] text-white/20 hover:text-neon-cyan transition-colors">
                      <Plus size={9} /> add
                    </button>
                  </div>
                  <div className="p-5">
                    {projects.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="font-mono text-xs text-white/22 mb-1">no projects docked yet</p>
                        <p className="font-mono text-[9px] text-white/12">// add links to your work</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.map((p, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="border border-white/6 rounded-lg p-3 hover:border-white/12 transition-colors"
                          >
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
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="terminal-window"
              >
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <GitCommit size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">activity.feed</span>
                </div>
                {activity.length > 0 ? (
                  <div className="divide-y divide-white/4">
                    {activity.map((a, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: ACTIVITY_COLORS[a.type] || "#666", boxShadow: `0 0 4px ${ACTIVITY_COLORS[a.type] || "#666"}` }} />
                        <span className="font-mono text-xs text-white/55 flex-1">{a.msg}</span>
                        <span className="font-mono text-[10px] text-white/22 flex-shrink-0">{a.time}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="font-mono text-xs text-white/22 mb-1">no activity yet</p>
                    <p className="font-mono text-[10px] text-white/12">// start grinding, shipping, or join the arena</p>
                  </div>
                )}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
