"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Trophy, Calendar, Users, Clock, Share2, Check,
  ExternalLink, ArrowLeft, ChevronRight, Terminal, Star,
  Send, X, Github, Globe, Tag, Award, MapPin,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
  doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc,
  collection, query, where, orderBy, limit, serverTimestamp, increment,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useIsWindowed, useOverlayClass } from "@/components/window/is-windowed";
import { isHackathon, registrationPhase, teamSizeLabel } from "@/lib/eventTypes";

/* ─── helpers ─── */

// Best-effort confirmation email via devert-backend. Firestore registration
// above is already the source of truth - this is a nice-to-have side effect,
// so it silently no-ops if no backend URL is configured or the call fails.
function notifyChallengeConnected(email, leadName, teamName) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !email) return;
  // The backend now sends this only to the SIGNED-IN caller's own verified
  // email, so it needs their token.
  auth.currentUser?.getIdToken().then(idToken => fetch(`${apiUrl}/api/notify/challenge-connected`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ email, leadName, teamName }),
  })).catch(() => {});
}

function statusMeta(s) {
  switch (s) {
    case "active":   return { label: "LIVE",     color: "#00FF41", bg: "rgba(0,255,65,0.08)",   pulse: true  };
    case "judging":  return { label: "JUDGING",  color: "#FF9500", bg: "rgba(255,149,0,0.08)",  pulse: false };
    case "ended":    return { label: "ENDED",    color: "#555555", bg: "rgba(85,85,85,0.08)",   pulse: false };
    default:         return { label: "UPCOMING", color: "#00FFFF", bg: "rgba(0,255,255,0.08)",  pulse: false };
  }
}

function useCountdown(targetMs) {
  const [diff, setDiff] = useState(targetMs ? targetMs - Date.now() : null);
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setDiff(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  if (diff === null || diff <= 0) return null;
  const d  = Math.floor(diff / 86400000);
  const h  = Math.floor((diff % 86400000) / 3600000);
  const m  = Math.floor((diff % 3600000) / 60000);
  const s  = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function CountBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center min-w-[52px]">
      <span className="font-mono text-3xl font-bold leading-none text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-mono text-[9px] text-white/25 tracking-widest mt-1">{label}</span>
    </div>
  );
}

function tsToMs(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  return null;
}

function fmtDate(ts) {
  const ms = tsToMs(ts);
  if (!ms) return "TBD";
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PLACE_COLORS = { "1st": "#FFD700", "2nd": "#C0C0C0", "3rd": "#CD7F32" };
const MEDAL_PLACES = new Set(["1st", "2nd", "3rd"]);

const MODE_META = {
  in_person: { label: "In Person", Icon: MapPin },
  virtual: { label: "Virtual", Icon: Globe },
  hybrid: { label: "Hybrid", Icon: Users },
};

function registrationPhaseMeta(phase) {
  switch (phase) {
    case "open":     return { label: "REGISTRATION OPEN",      color: "#00FF41" };
    case "upcoming": return { label: "REGISTRATION OPENS SOON", color: "#00FFFF" };
    default:         return { label: "REGISTRATIONS CLOSED",    color: "#666666" };
  }
}

function StatChip({ icon: Icon, label, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded border border-white/10 bg-white/[0.03]"
      style={{ color: color || "rgba(255,255,255,0.7)" }}>
      <Icon size={12} /> {label}
    </span>
  );
}

// Highlight cards are derived from the same generic stat fields as the hero
// chips rather than a separate freeform admin field - any event that fills in
// durationLabel/prizePool/team size/perks gets this section for free.
const WHY_ICONS = [Star, Trophy, Users, Flame, Award, Terminal];
function highlightItems(h) {
  const items = [];
  if (h.durationLabel) items.push({ title: h.durationLabel, desc: `Build under a focused ${h.durationLabel.toLowerCase()} challenge.`, icon: Clock });
  if (h.prizePool) items.push({ title: `${h.prizePool} Prize Pool`, desc: "Compete for the prize pool.", icon: Trophy });
  if (h.minTeamSize || h.maxTeamSize) items.push({ title: teamSizeLabel(h), desc: "Build with a small team.", icon: Users });
  if (h.perks?.length > 0) items.push({ title: "Perks Included", desc: h.perks.join(", "), icon: Award });
  return items;
}

function FaqRow({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(o => !o)} className="w-full text-left px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-white/70">{q}</p>
        <ChevronRight size={12} className="flex-shrink-0 text-white/25 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }} />
      </div>
      {open && <p className="font-mono text-[11px] text-white/40 mt-2 leading-relaxed">{a}</p>}
    </button>
  );
}

/* ─── Submission Modal ─── */
function SubmitModal({ slug, uid, handle, displayName, onClose, onSubmitted, existing }) {
  const overlayClass = useOverlayClass("z-50 flex items-end sm:items-center justify-center p-4");
  const [projName, setProjName] = useState(existing?.projectName || "");
  const [repoUrl,  setRepoUrl]  = useState(existing?.repoUrl     || "");
  const [demoUrl,  setDemoUrl]  = useState(existing?.demoUrl     || "");
  const [desc,     setDesc]     = useState(existing?.description || "");
  const [stack,    setStack]    = useState(existing?.stack?.join(", ") || "");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  const handleSubmit = async () => {
    if (!projName.trim()) return setErr("Project name is required.");
    if (!repoUrl.trim())  return setErr("Repo / project URL is required.");
    setSaving(true); setErr("");
    try {
      const docId = `${slug}_${uid}`;
      const payload = {
        hackathonSlug: slug, uid, handle, displayName,
        projectName:  projName.trim(),
        repoUrl:      repoUrl.trim(),
        demoUrl:      demoUrl.trim(),
        description:  desc.trim(),
        stack:        stack.split(",").map(s => s.trim()).filter(Boolean),
        submittedAt:  serverTimestamp(),
        score:        null,
        winner:       false,
        rank:         null,
      };
      await setDoc(doc(db, "hackathon_submissions", docId), payload);
      // update count only on first submission
      if (!existing) await updateDoc(doc(db, "hackathons", slug), { submissionCount: increment(1) });
      onSubmitted();
    } catch { setErr("Save failed. Try again."); }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="terminal-window w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="terminal-header">
          <Send size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">{existing ? "update_submission.sh" : "new_submission.sh"}</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/55 transition-colors"><X size={12} /></button>
        </div>
        <div className="p-6 space-y-5">
          {[
            { label: "PROJECT NAME *", value: projName, set: setProjName, placeholder: "e.g. DevPulse", maxLen: 60 },
          ].map(f => (
            <div key={f.label}>
              <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{f.label}</p>
              <input value={f.value} onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder} maxLength={f.maxLen}
                className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
          ))}

          {/* URLs */}
          {[
            { label: "REPO / PROJECT URL *",  value: repoUrl, set: setRepoUrl, Icon: Github, placeholder: "https://github.com/..." },
            { label: "DEMO URL (optional)",    value: demoUrl, set: setDemoUrl, Icon: Globe,  placeholder: "https://yourproject.live" },
          ].map(f => (
            <div key={f.label}>
              <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{f.label}</p>
              <div className="flex items-center gap-0">
                <span className="font-mono text-xs text-white/25 px-3 py-2 rounded-l flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRight: "none" }}>
                  <f.Icon size={11} />
                </span>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder} maxLength={200}
                  className="flex-1 font-mono text-xs text-white/80 px-3 py-2 rounded-r outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                  onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            </div>
          ))}

          {/* Description */}
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">ONE-LINE PITCH</p>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What does it do and why does it matter?" maxLength={160} rows={2}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <p className="font-mono text-[9px] text-white/18 mt-0.5">{desc.length}/160</p>
          </div>

          {/* Stack */}
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">STACK</p>
            <div className="flex items-center gap-0">
              <span className="font-mono text-xs text-white/25 px-3 py-2 rounded-l flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRight: "none" }}>
                <Tag size={11} />
              </span>
              <input value={stack} onChange={e => setStack(e.target.value)}
                placeholder="React, FastAPI, Redis" maxLength={150}
                className="flex-1 font-mono text-xs text-white/80 px-3 py-2 rounded-r outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <p className="font-mono text-[9px] text-white/18 mt-0.5">comma-separated</p>
          </div>

          {err && <p className="font-mono text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-3 py-2 rounded">{err}</p>}

          <div className="flex gap-3 pt-1">
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
              className="flex-1 font-mono text-sm py-3 text-black bg-neon-green border border-neon-green flex items-center justify-center gap-2 disabled:opacity-50">
              <Send size={12} /> {saving ? "submitting..." : existing ? "[ UPDATE_SUBMISSION ]" : "[ SUBMIT_PROJECT ]"}
            </motion.button>
            <button onClick={onClose} className="font-mono text-sm py-3 px-5 text-white/30 border border-white/10 hover:text-white/50 transition-colors">
              cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════ MAIN VIEW ════════════════════ */
// Shared by the standalone /h/{slug} route (a genuinely public, shareable
// URL - see app/h/page.jsx) and HackathonsApp's in-place view, which renders
// this without ever navigating the Hackathons window tab away from itself.
export function HackathonDetailView({ slug, onBack }) {
  const windowed = useIsWindowed();
  const { user, userData } = useAuth();
  const router = useRouter();
  // onBack is only ever passed by HackathonsApp's in-place view (clears
  // selectedSlug without navigating). The standalone /h/[slug] route
  // (app/h/[slug]/page.jsx, a real server component now - see hackathon-seo.js)
  // renders this with no onBack at all, so it needs a real navigation instead.
  const handleBack = onBack || (() => router.push("/events"));

  const [hackathon,  setHackathon]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const [submission,    setSubmission]    = useState(null);
  const [submissions,   setSubmissions]   = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [shared, setShared] = useState(false);

  // Reset per-hackathon state whenever the slug changes (switching between
  // two hackathons without unmounting this view, e.g. via in-app navigation).
  useEffect(() => {
    setHackathon(null);
    setNotFound(false);
    setRegistered(false);
    setSubmission(null);
    setSubmissions([]);
  }, [slug]);

  /* ── load hackathon ── */
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "hackathons", slug));
        if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
        setHackathon({ id: snap.id, ...snap.data() });
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [slug]);

  /* ── check registration ── */
  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      const snap = await getDoc(doc(db, "hackathon_registrations", `${slug}_${user.uid}`));
      setRegistered(snap.exists());
    })();
  }, [user, slug]);

  /* ── load my submission ── */
  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      const snap = await getDoc(doc(db, "hackathon_submissions", `${slug}_${user.uid}`));
      setSubmission(snap.exists() ? snap.data() : null);
    })();
  }, [user, slug]);

  /* ── load all submissions (judging/ended, hackathons only) ── */
  useEffect(() => {
    if (!hackathon || !isHackathon(hackathon) || !["judging", "ended"].includes(hackathon.status)) return;
    (async () => {
      const snap = await getDocs(
        query(collection(db, "hackathon_submissions"), where("hackathonSlug", "==", slug), orderBy("score", "desc"), limit(20))
      );
      setSubmissions(snap.docs.map(d => d.data()));
    })();
  }, [hackathon, slug]);

  /* ── register ── */
  const toggleRegister = async () => {
    if (!user || !hackathon || regLoading) return;
    setRegLoading(true);
    const regRef    = doc(db, "hackathon_registrations", `${slug}_${user.uid}`);
    const hackRef   = doc(db, "hackathons", slug);
    try {
      if (registered) {
        await deleteDoc(regRef);
        await updateDoc(hackRef, { registrationCount: increment(-1) });
        setHackathon(h => ({ ...h, registrationCount: Math.max(0, (h.registrationCount || 0) - 1) }));
        setRegistered(false);
      } else {
        await setDoc(regRef, {
          hackathonSlug: slug, uid: user.uid,
          handle: userData?.handle || "", displayName: userData?.displayName || "",
          registeredAt: serverTimestamp(),
        });
        await updateDoc(hackRef, { registrationCount: increment(1) });
        setHackathon(h => ({ ...h, registrationCount: (h.registrationCount || 0) + 1 }));
        setRegistered(true);
        notifyChallengeConnected(user.email, userData?.displayName || userData?.handle || "builder", hackathon.title || slug);
      }
    } catch (e) { console.error(e); }
    setRegLoading(false);
  };

  const shareUrl = `https://devert.in/h/${slug}`;
  const shareHackathon = () => {
    navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  /* ── countdown target ── */
  const countdownMs = (() => {
    if (!hackathon) return null;
    const now = Date.now();
    const start    = tsToMs(hackathon.registrationOpen);
    const deadline = tsToMs(hackathon.submissionDeadline);
    if (hackathon.status === "upcoming" && start && start > now)   return start;
    if (hackathon.status === "active"   && deadline && deadline > now) return deadline;
    return null;
  })();

  const countdown  = useCountdown(countdownMs);
  const sm         = hackathon ? statusMeta(hackathon.status) : null;
  const isHack      = hackathon ? isHackathon(hackathon) : true;
  const canRegister = hackathon && ["upcoming", "active"].includes(hackathon.status);
  // Externally-registered events (registrationFormUrl set) have no
  // hackathon_registrations doc for anyone - the organizer's form is the
  // real registration record, not Firestore - so `registered` can never be
  // true for them. Gate on the internal flag only when DeVert's own
  // registration flow is the one in use; otherwise the organizer already
  // gatekept who's "in" and our job is just to host the submission.
  const canSubmit   = hackathon && isHack && hackathon.status === "active" && (registered || !!hackathon.registrationFormUrl);
  const phase       = hackathon ? registrationPhase(hackathon) : "closed";
  const phaseMeta   = registrationPhaseMeta(phase);

  const rootClass = `${windowed ? "min-h-full" : "min-h-screen"}`;

  /* ─── loading / not-found ─── */
  if (loading || !slug) return (
    <main className={`${rootClass} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border border-white/10 border-t-neon-cyan rounded-full animate-spin" />
        <p className="font-mono text-xs text-white/20">loading event...</p>
      </div>
    </main>
  );

  if (notFound) return (
    <main className={`${rootClass} flex items-center justify-center px-6`}>
      <div className="text-center">
        <p className="font-mono text-2xl text-white/20 mb-3">404</p>
        <p className="font-mono text-sm text-white/30 mb-2">Event not found</p>
        <p className="font-mono text-xs text-white/15 mb-8">// check the URL or wait for announcements</p>
        <button onClick={handleBack}
          className="font-mono text-xs text-neon-cyan/60 border border-neon-cyan/20 px-4 py-2 rounded hover:bg-neon-cyan/6 transition-colors">
          ← all events
        </button>
      </div>
    </main>
  );

  const ac = hackathon.accentColor || "#00FF41";

  return (
    <>
      <AnimatePresence>
        {showSubmitModal && user && (
          <SubmitModal
            slug={slug} uid={user.uid}
            handle={userData?.handle || ""} displayName={userData?.displayName || ""}
            existing={submission}
            onClose={() => setShowSubmitModal(false)}
            onSubmitted={() => {
              setShowSubmitModal(false);
              // refresh submission
              getDoc(doc(db, "hackathon_submissions", `${slug}_${user.uid}`))
                .then(s => setSubmission(s.exists() ? s.data() : null));
            }}
          />
        )}
      </AnimatePresence>

      <main className={`${rootClass} pt-4 pb-32 px-6 relative`}>
        {/* Ambient glow from accent color */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ac}08 0%, transparent 70%)` }} />
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">

          {/* Banner image (optional - most events keep the plain accent-bar hero below).
              A compact strip, not a full hero block - most banners supplied for this
              (event-poster/wordmark style graphics with a lot of their own empty margin)
              looked oversized and mostly blank stretched across a 21:9 box. object-contain,
              not object-cover: a banner's real aspect ratio rarely matches this box's 3:1
              exactly (e.g. devertathon26-banner.png is 2.25:1), and object-cover crops
              whatever doesn't fit - for a wordmark-style banner that chops real content
              (the top/bottom of the artwork) rather than empty margin. contain letterboxes
              instead, which reads fine against the page's own dark background. */}
          {hackathon.bannerImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full aspect-[3/1] max-h-[220px] rounded-lg overflow-hidden mb-6 border border-white/8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hackathon.bannerImage} alt="" className="w-full h-full object-contain" />
            </motion.div>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={handleBack}
              className="flex items-center gap-1.5 font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors">
              <ArrowLeft size={10} /> events
            </button>
            <span className="font-mono text-[10px] text-white/10">/</span>
            <span className="font-mono text-[10px] text-white/25 truncate max-w-[160px]">{slug}</span>
          </div>

          {/* ── Hero ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            {/* Accent bar */}
            <div className="h-0.5 w-24 mb-4 rounded" style={{ background: `linear-gradient(90deg, ${ac}, transparent)` }} />

            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                {sm.pulse && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: sm.color, boxShadow: `0 0 8px ${sm.color}` }} />}
                <span className="font-mono text-xs px-3 py-1 rounded"
                  style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.color}30` }}>
                  {sm.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Register Now - top-of-page CTA, same rules as the sidebar's
                    version below: an external form (e.g. Google Form) is a
                    plain link open to anyone, no DeVert login required - the
                    form itself is the real registration record. Only the
                    internal (no external form) flow gates on being signed in. */}
                {hackathon.registrationFormUrl ? (
                  phase === "open" && (
                    <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      href={hackathon.registrationFormUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 font-mono text-xs py-2 px-4 transition-all"
                      style={{ color: "#000", background: ac, border: `1px solid ${ac}` }}
                    >
                      <ChevronRight size={11} /> Register now
                    </motion.a>
                  )
                ) : (
                  <>
                    {user && canRegister && !registered && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={toggleRegister} disabled={regLoading}
                        className="flex items-center gap-2 font-mono text-xs py-2 px-4 transition-all disabled:opacity-50"
                        style={{ color: "#000", background: ac, border: `1px solid ${ac}` }}
                      >
                        {regLoading
                          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : <><ChevronRight size={11} /> Register now</>}
                      </motion.button>
                    )}
                    {!user && canRegister && (
                      <Link href="/login"
                        className="flex items-center gap-2 font-mono text-xs py-2 px-4 border transition-colors"
                        style={{ color: ac, borderColor: `${ac}45` }}>
                        <ChevronRight size={11} /> Register now
                      </Link>
                    )}
                  </>
                )}

                {/* Share */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={shareHackathon}
                  className="flex items-center gap-2 font-mono text-xs py-2 px-4 border transition-all"
                  style={shared
                    ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }
                    : { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <AnimatePresence mode="wait">
                    {shared
                      ? <motion.span key="y" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Check size={11}/> link copied!</motion.span>
                      : <motion.span key="n" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Share2 size={11}/> share</motion.span>
                    }
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            <h1 className="font-sans font-bold tracking-tight text-white mb-2"
              style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", lineHeight: 1.1 }}>
              {hackathon.title}
            </h1>
            <p className="font-mono text-sm text-white/35 mb-3">{hackathon.tagline}</p>

            {hackathon.theme && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/30 border border-white/8 px-2.5 py-1 rounded">
                <Tag size={9} /> {hackathon.theme}
              </span>
            )}

            {/* Stat chips - only shown for whichever of these fields the event configures */}
            {(hackathon.eventDateLabel || hackathon.durationLabel || hackathon.prizePool || hackathon.minTeamSize || hackathon.maxTeamSize || hackathon.registrationFee || hackathon.mode) && (
              <div className="flex flex-wrap gap-2.5 mt-5">
                {hackathon.eventDateLabel && <StatChip icon={Calendar} label={hackathon.eventDateLabel} color={ac} />}
                {hackathon.durationLabel && <StatChip icon={Clock} label={hackathon.durationLabel} />}
                {hackathon.prizePool && <StatChip icon={Trophy} label={`${hackathon.prizePool} Prize Pool`} color="#FFD700" />}
                {(hackathon.minTeamSize || hackathon.maxTeamSize) && <StatChip icon={Users} label={teamSizeLabel(hackathon)} />}
                {hackathon.registrationFee && <StatChip icon={Tag} label={hackathon.registrationFee} />}
                {hackathon.mode && MODE_META[hackathon.mode] && <StatChip icon={MODE_META[hackathon.mode].Icon} label={MODE_META[hackathon.mode].label} />}
              </div>
            )}
          </motion.div>

          {/* ── Countdown ── */}
          {countdown && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="terminal-window mb-6">
              <div className="terminal-header">
                <Clock size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">
                  {hackathon.status === "upcoming" ? "starts_in.timer" : "deadline.timer"}
                </span>
              </div>
              <div className="p-5">
                <p className="font-mono text-[9px] text-white/25 tracking-widest mb-4">
                  {hackathon.status === "upcoming"
                    ? "// EVENT STARTS IN"
                    : isHack ? "// SUBMISSION DEADLINE IN" : "// EVENT ENDS IN"}
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                  <CountBlock value={countdown.d} label="DAYS" />
                  <span className="font-mono text-2xl text-white/20 mb-2">:</span>
                  <CountBlock value={countdown.h} label="HRS" />
                  <span className="font-mono text-2xl text-white/20 mb-2">:</span>
                  <CountBlock value={countdown.m} label="MIN" />
                  <span className="font-mono text-2xl text-white/20 mb-2">:</span>
                  <CountBlock value={countdown.s} label="SEC" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Main grid ── */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Left (2/3): description + submissions ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* About */}
              {hackathon.description && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Terminal size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">brief.md</span>
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-xs text-white/45 leading-relaxed whitespace-pre-line">
                      {hackathon.description}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Highlights - auto-built from duration/prizePool/team size/perks, so this is inert unless the event sets at least one of them */}
              {highlightItems(hackathon).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Flame size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">highlights.json</span>
                  </div>
                  <div className="p-5 grid sm:grid-cols-2 gap-4">
                    {highlightItems(hackathon).map(item => (
                      <div key={item.title} className="border border-white/6 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <item.icon size={14} style={{ color: ac }} />
                          <p className="font-mono text-sm font-bold text-white">{item.title}</p>
                        </div>
                        <p className="font-mono text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Schedule - event flow, hour-by-hour game plan, what to bring.
                  All optional/independent so a hackathon can set any subset. */}
              {(hackathon.eventFlow?.length > 0 || hackathon.gamePlan?.length > 0 || hackathon.whatToBring?.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Clock size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">schedule.json</span>
                  </div>
                  <div className="p-5 space-y-5">
                    {hackathon.eventFlow?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {hackathon.eventFlow.map((step, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-2.5 py-1 rounded border border-white/10 text-white/55">{step}</span>
                            {i < hackathon.eventFlow.length - 1 && <ChevronRight size={10} className="text-white/15" />}
                          </div>
                        ))}
                      </div>
                    )}
                    {hackathon.gamePlan?.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-white/5">
                        {hackathon.gamePlan.map((g, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="font-mono text-[10px] flex-shrink-0 w-[76px]" style={{ color: ac }}>{g.time}</span>
                            <span className="font-mono text-[11px] text-white/45">{g.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {hackathon.whatToBring?.length > 0 && (
                      <div className="pt-1 border-t border-white/5">
                        <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2.5">// WHAT TO BRING</p>
                        <div className="flex flex-wrap gap-2">
                          {hackathon.whatToBring.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded border border-white/10 text-white/50">
                              <Check size={10} className="text-neon-green/60" /> {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Project rules - DO / DON'T */}
              {hackathon.rules && (hackathon.rules.do?.length > 0 || hackathon.rules.dont?.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Terminal size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">rules.json</span>
                  </div>
                  <div className="p-5 grid sm:grid-cols-2 gap-5">
                    {hackathon.rules.do?.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-neon-green/70 tracking-widest mb-2.5">DO</p>
                        <div className="space-y-2">
                          {hackathon.rules.do.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Check size={12} className="flex-shrink-0 mt-0.5 text-neon-green/70" />
                              <p className="font-mono text-[11px] text-white/50 leading-relaxed">{r}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {hackathon.rules.dont?.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] text-red-400/70 tracking-widest mb-2.5">DON'T</p>
                        <div className="space-y-2">
                          {hackathon.rules.dont.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <X size={12} className="flex-shrink-0 mt-0.5 text-red-400/70" />
                              <p className="font-mono text-[11px] text-white/50 leading-relaxed">{r}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* AI usage policy */}
              {hackathon.aiPolicy && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                  className="terminal-window" style={{ borderColor: `${ac}25` }}>
                  <div className="terminal-header" style={{ borderColor: `${ac}18` }}>
                    <Star size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">ai_policy.json</span>
                  </div>
                  <div className="p-5">
                    {hackathon.aiPolicy.headline && (
                      <p className="font-mono text-xs font-bold mb-2" style={{ color: ac }}>{hackathon.aiPolicy.headline}</p>
                    )}
                    {hackathon.aiPolicy.body && (
                      <p className="font-mono text-[11px] text-white/45 leading-relaxed mb-3">{hackathon.aiPolicy.body}</p>
                    )}
                    {hackathon.aiPolicy.quote && (
                      <p className="font-mono text-[11px] text-white/70 italic border-l-2 pl-3" style={{ borderColor: ac }}>
                        "{hackathon.aiPolicy.quote}"
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Judging criteria + presentation format */}
              {(hackathon.judgingCriteria?.length > 0 || hackathon.presentationFormat?.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Award size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">judging.json</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {hackathon.judgingCriteria?.length > 0 && (
                      <div>
                        <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">// JUDGED ON</p>
                        <div className="flex flex-wrap gap-2">
                          {hackathon.judgingCriteria.map((c, i) => (
                            <span key={i} className="font-mono text-[11px] px-3 py-1.5 rounded border border-white/10 text-white/55">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hackathon.presentationFormat?.length > 0 && (
                      <div>
                        <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">// PITCH FORMAT</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {hackathon.presentationFormat.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-white/55">{step}</span>
                              {i < hackathon.presentationFormat.length - 1 && <ChevronRight size={10} className="text-white/15" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Code of conduct */}
              {hackathon.codeOfConduct?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Users size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">conduct.json</span>
                  </div>
                  <div className="p-5 grid sm:grid-cols-2 gap-2.5">
                    {hackathon.codeOfConduct.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <X size={11} className="flex-shrink-0 text-red-400/60" />
                        <p className="font-mono text-[11px] text-white/45">{c}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Why participate */}
              {hackathon.whyParticipate?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Star size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">why_participate.json</span>
                  </div>
                  <div className="p-5 grid sm:grid-cols-2 gap-3">
                    {hackathon.whyParticipate.map((reason, i) => {
                      const Icon = WHY_ICONS[i % WHY_ICONS.length];
                      return (
                        <div key={i} className="flex items-start gap-2.5">
                          <Icon size={14} className="flex-shrink-0 mt-0.5" style={{ color: ac }} />
                          <p className="font-mono text-xs text-white/50 leading-relaxed">{reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Host / speaker (non-hackathon event types) */}
              {!isHack && hackathon.host && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Users size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">host.json</span>
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-xs text-white/45 leading-relaxed">{hackathon.host}</p>
                  </div>
                </motion.div>
              )}

              {/* My submission (hackathons only) */}
              {isHack && submission && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="terminal-window"
                  style={{ borderColor: `${ac}30` }}>
                  <div className="terminal-header" style={{ borderColor: `${ac}20` }}>
                    <Send size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">my_submission.json</span>
                    {hackathon.status === "active" && (
                      <button onClick={() => setShowSubmitModal(true)}
                        className="ml-auto font-mono text-[10px] text-white/25 hover:text-neon-cyan transition-colors">
                        edit
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-mono text-sm font-bold text-white">{submission.projectName}</p>
                        {submission.description && <p className="font-mono text-[11px] text-white/35 mt-1">{submission.description}</p>}
                      </div>
                      <span className="font-mono text-[9px] text-neon-green border border-neon-green/25 px-2 py-0.5 rounded flex-shrink-0">
                        SUBMITTED
                      </span>
                    </div>
                    <div className="flex gap-3 mt-3 flex-wrap">
                      {submission.repoUrl && (
                        <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-mono text-[10px] text-white/30 hover:text-neon-cyan transition-colors">
                          <Github size={11} /> repo <ExternalLink size={9} />
                        </a>
                      )}
                      {submission.demoUrl && (
                        <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-mono text-[10px] text-white/30 hover:text-neon-green transition-colors">
                          <Globe size={11} /> demo <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                    {submission.stack?.length > 0 && (
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {submission.stack.map(t => (
                          <span key={t} className="font-mono text-[9px] text-white/22 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Submissions leaderboard (judging / ended, hackathons only) */}
              {isHack && ["judging", "ended"].includes(hackathon.status) && submissions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Trophy size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">
                      {hackathon.status === "ended" ? "winners.json" : "submissions.json"}
                    </span>
                  </div>
                  <div className="divide-y divide-white/4">
                    {submissions.map((s, i) => (
                      <div key={s.uid} className="flex items-center gap-4 px-5 py-3.5">
                        <span className="w-6 flex items-center justify-center flex-shrink-0 font-mono text-sm"
                          style={{ color: PLACE_COLORS[s.rank] || "rgba(255,255,255,0.2)" }}>
                          {MEDAL_PLACES.has(s.rank) ? <Award size={15} /> : `${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-white/70 font-semibold">{s.projectName}</p>
                          <p className="font-mono text-[10px] text-white/28">@{s.handle}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {s.repoUrl && (
                            <a href={s.repoUrl} target="_blank" rel="noopener noreferrer"
                              className="text-white/20 hover:text-neon-cyan transition-colors">
                              <ExternalLink size={11} />
                            </a>
                          )}
                          {s.score !== null && (
                            <span className="font-mono text-xs text-neon-cyan">{s.score}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* FAQ */}
              {hackathon.faq?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Terminal size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">faq.json</span>
                  </div>
                  <div className="divide-y divide-white/4">
                    {hackathon.faq.map((item, i) => <FaqRow key={i} q={item.q} a={item.a} />)}
                  </div>
                </motion.div>
              )}

              {/* Bottom CTA - only for events that register via an external form and are currently taking signups */}
              {hackathon.registrationFormUrl && phase === "open" && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="terminal-window text-center p-8" style={{ borderColor: `${ac}30` }}>
                  <p className="font-mono text-[10px] text-white/25 tracking-widest mb-2">// ready to build?</p>
                  <p className="font-sans text-xl font-bold text-white mb-5">{hackathon.tagline || hackathon.title}</p>
                  <a href={hackathon.registrationFormUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-mono text-sm py-3 px-6"
                    style={{ color: "#000", background: ac, border: `1px solid ${ac}` }}>
                    <ChevronRight size={13} /> [ REGISTER_YOUR_TEAM ]
                  </a>
                </motion.div>
              )}
            </div>

            {/* ── Right (1/3): prizes + dates + actions ── */}
            <div className="space-y-5">

              {/* Prizes (hackathons only) - gated on at least one prize
                  actually having a reward filled in, not just the array
                  being non-empty. A seed script can create the three
                  1st/2nd/3rd placeholder rows before amounts are finalized
                  (reward: ""), and rendering those unconditionally showed a
                  Prizes panel with visibly blank amounts instead of staying
                  hidden until real data exists. */}
              {isHack && hackathon.prizes?.some(p => p.reward?.trim()) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Trophy size={10} className="ml-2" style={{ color: "#FFD700" }} />
                    <span className="font-mono text-[10px] text-white/25 ml-1">prizes.json</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {hackathon.prizes.filter(p => p.reward?.trim()).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <Award size={16} className="flex-shrink-0" style={{ color: PLACE_COLORS[p.place] || "rgba(255,255,255,0.3)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[10px] text-white/25 tracking-widest">{p.label || p.place}</p>
                          <p className="font-mono text-xs font-semibold"
                            style={{ color: PLACE_COLORS[p.place] || "#fff" }}>{p.reward}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Timeline */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="terminal-window">
                <div className="terminal-header">
                  <Calendar size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">timeline.json</span>
                  <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded"
                    style={{ color: phaseMeta.color, background: `${phaseMeta.color}12`, border: `1px solid ${phaseMeta.color}30` }}>
                    {phaseMeta.label}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: "REGISTRATIONS OPEN", ts: hackathon.registrationOpen },
                    ...(hackathon.registrationCloseAt ? [{ label: "REGISTRATIONS CLOSE", ts: hackathon.registrationCloseAt }] : []),
                    { label: isHack ? "SUBMISSION DEADLINE" : "EVENT DATE", ts: hackathon.submissionDeadline },
                    ...(isHack ? [{ label: "RESULTS", ts: hackathon.resultsDate }] : []),
                    ...(hackathon.venue ? [{ label: "VENUE", text: hackathon.venue }] : []),
                  ].map(({ label, ts, text }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] text-white/25 tracking-wider">{label}</span>
                      <span className="font-mono text-[10px] text-white/55">{text ?? fmtDate(ts)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="terminal-window">
                <div className="terminal-header">
                  <span className="font-mono text-[10px] text-white/25 ml-2">stats.json</span>
                </div>
                <div className={`p-5 grid gap-3 ${isHack ? "grid-cols-2" : "grid-cols-1"}`}>
                  {[
                    { label: "REGISTERED", value: hackathon.registrationCount ?? 0, color: "#00FFFF" },
                    ...(isHack ? [{ label: "SUBMITTED", value: hackathon.submissionCount ?? 0, color: "#00FF41" }] : []),
                  ].map(s => (
                    <div key={s.label} className="flex flex-col items-center border border-white/6 rounded-lg p-3">
                      <span className="font-mono text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                      <span className="font-mono text-[8px] text-white/22 tracking-wider mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Organizers / contact */}
              {(hackathon.organizers?.length > 0 || hackathon.contactEmail || hackathon.socialHandle) && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
                  className="terminal-window">
                  <div className="terminal-header">
                    <Users size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">contact.json</span>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {hackathon.organizers?.map((o, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-white/55">{o.name}</span>
                        {o.role && <span className="font-mono text-[10px] text-white/25">{o.role}</span>}
                      </div>
                    ))}
                    {(hackathon.contactEmail || hackathon.socialHandle) && (
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                        {hackathon.contactEmail && (
                          <a href={`mailto:${hackathon.contactEmail}`}
                            className="font-mono text-[10px] text-white/30 hover:text-neon-cyan transition-colors">
                            {hackathon.contactEmail}
                          </a>
                        )}
                        {hackathon.socialHandle && (
                          <span className="font-mono text-[10px] text-white/25">{hackathon.socialHandle}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="space-y-2.5">

                {/* Events with an external registration form (e.g. a Google Form) link out instead of writing a hackathon_registrations doc - the registration data lives there, not in Firestore */}
                {hackathon.registrationFormUrl ? (
                  phase === "open" ? (
                    <motion.a whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      href={hackathon.registrationFormUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full font-mono text-sm py-3.5 flex items-center justify-center gap-2 transition-all"
                      style={{ color: "#000", background: ac, border: `1px solid ${ac}` }}
                    >
                      <ChevronRight size={13}/> [ REGISTER_YOUR_TEAM ]
                    </motion.a>
                  ) : (
                    <div className="w-full font-mono text-sm py-3.5 flex items-center justify-center gap-2 text-white/25 border border-white/10">
                      {phaseMeta.label}
                    </div>
                  )
                ) : (
                  <>
                    {/* Register / Unregister */}
                    {user && canRegister && (
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={toggleRegister} disabled={regLoading}
                        className="w-full font-mono text-sm py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={registered
                          ? { color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.12)" }
                          : { color: "#000", background: ac, border: `1px solid ${ac}` }}
                      >
                        {regLoading
                          ? <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                          : registered
                            ? <><Check size={13}/> registered - click to leave</>
                            : <><ChevronRight size={13}/> [ REGISTER_NOW ]</>
                        }
                      </motion.button>
                    )}

                    {!user && canRegister && (
                      <Link href="/login"
                        className="w-full font-mono text-sm py-3.5 flex items-center justify-center gap-2 text-white/35 border border-white/12 hover:text-white/60 hover:border-white/20 transition-colors">
                        <ChevronRight size={13}/> login to register
                      </Link>
                    )}
                  </>
                )}

                {/* Submit Project */}
                {canSubmit && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full font-mono text-sm py-3.5 flex items-center justify-center gap-2 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/6 transition-all">
                    <Send size={13}/> {submission ? "[ UPDATE_SUBMISSION ]" : "[ SUBMIT_PROJECT ]"}
                  </motion.button>
                )}

                {/* Share */}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={shareHackathon}
                  className="w-full font-mono text-xs py-2.5 flex items-center justify-center gap-2 border transition-all"
                  style={shared
                    ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.05)" }
                    : { color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <AnimatePresence mode="wait">
                    {shared
                      ? <motion.span key="y" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Check size={11}/> link copied!</motion.span>
                      : <motion.span key="n" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-2"><Share2 size={11}/> share this event</motion.span>
                    }
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* Footer watermark */}
              <p className="font-mono text-[9px] text-white/10 text-center pt-2">
                // hosted on{" "}
                <Link href="/" className="text-white/18 hover:text-neon-green transition-colors">devert.in</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
