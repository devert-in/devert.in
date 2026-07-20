"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { LogOut, Check, X, ExternalLink, Share2, Users, Eye as EyeIcon } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, where, getDocs, getDoc, doc, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { EditorTabs } from "@/components/profile-editor/editor-tabs";
import IdentityTab from "@/components/profile-editor/identity-tab";
import SkillsTab from "@/components/profile-editor/skills-tab";
import ExperienceTab from "@/components/profile-editor/experience-tab";
import EducationTab from "@/components/profile-editor/education-tab";
import CertificationsTab from "@/components/profile-editor/certifications-tab";
import AchievementsTab from "@/components/profile-editor/achievements-tab";
import AppearanceTab from "@/components/profile-editor/appearance-tab";
import { DEFAULT_SECTION_ORDER } from "@/lib/portfolio-sections";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

function FollowersModal({ uid, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "follows"), where("followeeId", "==", uid), limit(50)));
        const uids = snap.docs.map(d => d.data().followerId);
        const profiles = await Promise.all(uids.map(u => getDoc(doc(db, "users", u))));
        setList(profiles.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [uid]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }} onClick={e => e.stopPropagation()}
        className="terminal-window w-full max-w-md max-h-[75vh] flex flex-col">
        <div className="terminal-header flex-shrink-0">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <Users size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1.5">followers.list</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors"><X size={12} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border border-white/10 border-t-neon-cyan rounded-full animate-spin" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono text-xs text-white/22 mb-1">no followers yet</p>
              <p className="font-mono text-[9px] text-white/12">// share your portfolio to get followed</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-[9px] text-white/20 mb-3 tracking-wider">// {list.length} follower{list.length !== 1 ? "s" : ""}</p>
              {list.map((f, i) => (
                <motion.a key={f.uid} href={`/u/${f.handle}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors group">
                  {f.photoURL ? (
                    <img src={f.photoURL} alt={f.displayName} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid rgba(0,255,255,0.15)" }} />
                  ) : (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm flex-shrink-0"
                      style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.15)", color: "#00FFFF" }}>
                      {(f.handle || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white/75 font-semibold leading-tight truncate group-hover:text-white transition-colors">{f.displayName || f.handle}</p>
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

const EMPTY_FORM = {
  displayName: "", handle: "", bio: "", photoURL: "", location: "",
  github: "", linkedin: "", twitter: "", website: "",
  headline: "", currentRole: "", availability: "", contactEmail: "", resumeUrl: "", coverImage: "",
  skills: [], experience: [], education: [], certifications: [], achievements: [],
  theme: { accent: "#00FF41" }, sectionOrder: DEFAULT_SECTION_ORDER, hiddenSections: [],
};

// This is DeVert's portfolio editor - NOT a stats dashboard. Every platform
// metric (XP, coins, followers, pulse engagement, streak, learning progress,
// contest rating...) lives on the Home dashboard instead
// (components/quick-stats-row.jsx) - this page only edits the public
// portfolio at /u/{handle}.
export default function ProfilePage() {
  const { user, userData, loading: authLoading, logout, updateProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?next=/profile"); return; }
  }, [user, authLoading]);

  const [activeTab, setActiveTab] = useState("identity");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [shared, setShared] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const handle = userData?.handle || user?.email?.split("@")[0] || "dev";
  const displayName = userData?.displayName || handle;
  const tier = userData?.tier || { name: "RECRUIT", color: "#888888" };
  const photoURL = userData?.photoURL || "";
  const followers = userData?.followersCount ?? 0;

  const patch = (updates) => setForm(f => ({ ...f, ...updates }));

  // Load the live profile into the edit form once, the first time it
  // arrives - after that, `form` is the source of truth until saved so
  // typing doesn't get clobbered by the live listener re-firing.
  useEffect(() => {
    if (!userData || initialized) return;
    setForm({
      displayName: userData.displayName || "", handle: userData.handle || "", bio: userData.bio || "",
      photoURL: userData.photoURL || "", location: userData.location || "",
      github: userData.github || "", linkedin: userData.linkedin || "", twitter: userData.twitter || "", website: userData.website || "",
      headline: userData.headline || "", currentRole: userData.currentRole || "", availability: userData.availability || "",
      contactEmail: userData.contactEmail || "", resumeUrl: userData.resumeUrl || "", coverImage: userData.coverImage || "",
      skills: [...(userData.skills || [])], experience: [...(userData.experience || [])], education: [...(userData.education || [])],
      certifications: [...(userData.certifications || [])], achievements: [...(userData.achievements || [])],
      theme: userData.theme || { accent: "#00FF41" },
      sectionOrder: userData.sectionOrder?.length ? userData.sectionOrder : DEFAULT_SECTION_ORDER,
      hiddenSections: userData.hiddenSections || [],
    });
    setInitialized(true);
  }, [userData, initialized]);

  const shareProfile = () => {
    navigator.clipboard.writeText(`https://devert.in/u/${handle}`);
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  const stripExifAndResize = (file, maxDim = 512) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("canvas encode failed")), "image/jpeg", 0.9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
    img.src = url;
  });

  const onPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return setSaveError("Please choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setSaveError("Image must be under 2MB.");
    setSaveError(""); setPhotoUploading(true);
    try {
      const clean = await stripExifAndResize(file);
      const sRef = storageRef(storage, `avatars/${user.uid}/avatar.jpg`);
      await uploadBytes(sRef, clean);
      patch({ photoURL: await getDownloadURL(sRef) });
    } catch (err) { console.error(err); setSaveError("Photo upload failed. Try again."); }
    finally { setPhotoUploading(false); }
  };

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return setSaveError("Please choose an image file.");
    if (file.size > 3 * 1024 * 1024) return setSaveError("Cover image must be under 3MB.");
    setSaveError(""); setCoverUploading(true);
    try {
      const sRef = storageRef(storage, `portfolio_covers/${user.uid}/cover.jpg`);
      await uploadBytes(sRef, file);
      patch({ coverImage: await getDownloadURL(sRef) });
    } catch (err) { console.error(err); setSaveError("Cover upload failed. Try again."); }
    finally { setCoverUploading(false); }
  };

  const onResumeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") return setSaveError("Resume must be a PDF.");
    if (file.size > 5 * 1024 * 1024) return setSaveError("Resume must be under 5MB.");
    setSaveError(""); setResumeUploading(true);
    try {
      const sRef = storageRef(storage, `resumes/${user.uid}/resume.pdf`);
      await uploadBytes(sRef, file);
      patch({ resumeUrl: await getDownloadURL(sRef) });
    } catch (err) { console.error(err); setSaveError("Resume upload failed. Try again."); }
    finally { setResumeUploading(false); }
  };

  const handleSave = async () => {
    const trimName = form.displayName.trim();
    const trimHandle = form.handle.trim().toLowerCase();
    if (!trimName) return setSaveError("Full name cannot be empty.");
    if (!HANDLE_RE.test(trimHandle)) return setSaveError("Username: 3–20 chars, lowercase letters, numbers, underscores only.");
    setSaving(true); setSaveError("");
    try {
      if (trimHandle !== userData?.handle) {
        const snap = await getDocs(query(collection(db, "users"), where("handle", "==", trimHandle), limit(1)));
        if (!snap.empty) { setSaveError(`@${trimHandle} is already taken.`); setSaving(false); return; }
      }
      await updateProfile({ ...form, displayName: trimName, handle: trimHandle });
      setSaveError("");
    } catch { setSaveError("Save failed. Try again."); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  if (authLoading || !initialized) {
    return <main className="min-h-screen flex items-center justify-center"><p className="font-mono text-xs text-white/25 animate-pulse">loading portfolio editor...</p></main>;
  }
  if (!user) return null;

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <AnimatePresence>
        {followersOpen && user && <FollowersModal uid={user.uid} onClose={() => setFollowersOpen(false)} />}
      </AnimatePresence>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /profile - portfolio_editor.sh</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-5" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            PORTFOLIO <span className="text-neon-cyan">EDITOR</span>
          </h1>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="w-12 h-12 rounded-xl object-cover" style={{ border: "1px solid rgba(0,255,255,0.2)" }} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg"
                  style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)", color: "#00FFFF" }}>
                  {handle[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-sans font-semibold text-white text-sm">{displayName}</p>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>{tier.name}</span>
                </div>
                <button onClick={() => setFollowersOpen(true)} className="font-mono text-[10px] text-white/30 hover:text-neon-cyan transition-colors">
                  @{handle} · {followers} follower{followers !== 1 ? "s" : ""}
                </button>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <Link href={`/u/${handle}`} target="_blank"
                className="flex items-center gap-2 font-mono text-xs text-neon-cyan border border-neon-cyan/25 py-2 px-3.5 hover:bg-neon-cyan/6 transition-all">
                <EyeIcon size={12} /> view live portfolio
              </Link>
              <button onClick={shareProfile}
                className="flex items-center gap-2 font-mono text-xs py-2 px-3.5 border transition-all"
                style={shared ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)" } : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
                <AnimatePresence mode="wait">
                  {shared
                    ? <motion.span key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check size={12} /> copied!</motion.span>
                    : <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Share2 size={12} /> share</motion.span>}
                </AnimatePresence>
              </button>
              <AnimatePresence mode="wait">
                {confirmLogout ? (
                  <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                    <button onClick={handleLogout} className="font-mono text-xs text-red-400 border border-red-500/30 py-2 px-3.5 hover:bg-red-500/8 transition-colors">yes, logout</button>
                    <button onClick={() => setConfirmLogout(false)} className="font-mono text-xs text-white/25 border border-white/8 py-2 px-3.5 hover:bg-white/4 transition-colors">cancel</button>
                  </motion.div>
                ) : (
                  <button onClick={() => setConfirmLogout(true)}
                    className="flex items-center gap-2 font-mono text-xs text-white/22 border border-white/6 py-2 px-3.5 hover:text-red-400 hover:border-red-500/25 transition-all">
                    <LogOut size={11} /> logout
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">portfolio.editor</span>
          </div>

          <div className="p-6">
            <EditorTabs active={activeTab} onChange={setActiveTab} />

            {activeTab === "identity" && (
              <IdentityTab form={form} patch={patch} handle={handle} userEmail={user?.email}
                onPhotoFile={onPhotoFile} photoUploading={photoUploading}
                onCoverFile={onCoverFile} coverUploading={coverUploading}
                onResumeFile={onResumeFile} resumeUploading={resumeUploading} />
            )}
            {activeTab === "skills" && <SkillsTab skills={form.skills} onChange={v => patch({ skills: v })} />}
            {activeTab === "experience" && <ExperienceTab experience={form.experience} onChange={v => patch({ experience: v })} />}
            {activeTab === "education" && <EducationTab education={form.education} onChange={v => patch({ education: v })} />}
            {activeTab === "certifications" && <CertificationsTab certifications={form.certifications} onChange={v => patch({ certifications: v })} uid={user.uid} />}
            {activeTab === "achievements" && <AchievementsTab achievements={form.achievements} onChange={v => patch({ achievements: v })} />}
            {activeTab === "appearance" && (
              <AppearanceTab theme={form.theme} onThemeChange={v => patch({ theme: v })}
                sectionOrder={form.sectionOrder} hiddenSections={form.hiddenSections}
                onSectionsChange={(order, hidden) => patch({ sectionOrder: order, hiddenSections: hidden })} />
            )}

            {saveError && <p className="font-mono text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3 rounded mt-8">{saveError}</p>}
            <div className="mt-8 pt-6 border-t border-white/6">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleSave} disabled={saving}
                className="w-full font-mono text-sm py-3 text-black bg-neon-green border border-neon-green disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity">
                <Check size={13} /> {saving ? "saving..." : "[ SAVE_CHANGES ]"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
