"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Heart, MessageCircle, Bookmark, BookmarkCheck,
  Share2, Plus, X, Image as ImageIcon, Code2, Link2,
  Send, ChevronDown, Check, Loader2, Upload, UserPlus, UserMinus,
  MoreVertical, Pencil, Trash2, Eye, Repeat, Wallet, Users, ArrowLeft,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import {
  collection, query, orderBy, where, getDocs, getDoc,
  doc, setDoc, addDoc, deleteDoc, updateDoc, onSnapshot, startAfter,
  increment, arrayUnion, arrayRemove,
  serverTimestamp, writeBatch, limit,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { writeNotification } from "@/components/notification-bell";
import { EnterHqModal } from "@/components/enter-hq-modal";
import { useIsWindowed, useOverlayClass, usePositionClass } from "@/components/window/is-windowed";

// Konva (used by the image editor) requires browser APIs and breaks static
// prerendering if imported eagerly, so it's loaded client-only, on demand.
const ImageEditorModal = dynamic(
  () => import("@/components/image-editor-modal").then(m => m.ImageEditorModal),
  { ssr: false },
);

function dataUrlToFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

async function uploadPulseImage(file, uid) {
  const path = `pulse_images/${uid}/${crypto.randomUUID()}-${file.name}`;
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, file);
  return getDownloadURL(sRef);
}

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

// ── create post modal ──────────────────────────────────────────────────────────

export const PULSE_CATEGORIES = [
  { v: "AI",          c: "#00FFFF" },
  { v: "Backend",     c: "#00FF41" },
  { v: "Frontend",    c: "#FF9500" },
  { v: "DevOps",      c: "#FF6430" },
  { v: "Mobile",      c: "#A78BFA" },
  { v: "Web3",        c: "#FFD700" },
  { v: "Career",      c: "#00FFFF" },
  { v: "Startup",     c: "#FF5050" },
  { v: "Open Source", c: "#00FF41" },
  { v: "Learning",    c: "#00FF41" },
  { v: "Other",       c: "rgba(255,255,255,0.4)" },
];

function CreatePostModal({ user, userData, onClose, existing, onSaved, communityId }) {
  const isEditing = !!existing;
  const overlayClass = useOverlayClass("z-[60] flex items-end md:items-center justify-center");
  const [title,      setTitle]      = useState(existing?.title || "");
  const [category,   setCategory]   = useState(existing?.category || PULSE_CATEGORIES[0].v);
  const [caption,    setCaption]    = useState(existing?.caption || "");
  const [code,       setCode]       = useState(existing?.code || "");
  const [codeLang,   setCodeLang]   = useState(existing?.codeLang || "");
  const [linkUrl,    setLinkUrl]    = useState(existing?.linkUrl || "");
  const [tags,       setTags]       = useState((existing?.tags || []).join(", "));
  const [imageFiles,  setImageFiles]  = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showCode,   setShowCode]   = useState(!!existing?.code);
  const [showLink,   setShowLink]   = useState(!!existing?.linkUrl);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [editorSrc,  setEditorSrc]  = useState(null); // opens the image editor over this source when set
  const fileRef = useRef();

  const MAX_IMAGES = 4;

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (imageFiles.length >= MAX_IMAGES) { setError(`Up to ${MAX_IMAGES} images per post.`); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError("");
    setEditorSrc(URL.createObjectURL(file));
    e.target.value = ""; // allow re-picking the same file later
  };

  const handleEditorSave = (base64) => {
    const file = dataUrlToFile(base64, `pulse-${Date.now()}.jpg`);
    setImageFiles(prev => [...prev, file]);
    setImagePreviews(prev => [...prev, base64]);
    setEditorSrc(null);
  };

  const removeImageAt = (i) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const [submitted, setSubmitted] = useState(false);

  const hasHashtag = () => {
    const inCaption = /#\w+/.test(caption);
    const inTags    = tags.trim().length > 0;
    return inCaption || inTags;
  };

  const handlePost = async () => {
    if (!caption.trim()) { setError("Write something first."); return; }
    if (!hasHashtag())   { setError("Add at least one #hashtag or fill in the tags field."); return; }
    if (showLink && linkUrl.trim() && !/^https?:\/\//i.test(linkUrl.trim())) {
      setError("Link must start with http:// or https://");
      return;
    }
    setSaving(true); setError("");
    try {
      if (isEditing) {
        // Edits save instantly - no re-review, so a typo fix doesn't
        // vanish from the feed for hours.
        const updates = {
          title:    title.trim() || null,
          category,
          caption:  caption.trim(),
          code:     showCode && code.trim() ? code.trim() : null,
          codeLang: showCode && codeLang.trim() ? codeLang.trim() : null,
          linkUrl:  showLink && linkUrl.trim() ? linkUrl.trim() : null,
          tags:     tags.split(",").map(t => t.trim()).filter(Boolean),
        };
        await updateDoc(doc(db, "pulse_posts", existing.id), { ...updates, editedAt: serverTimestamp() });
        // Paginated ("Load More") posts aren't covered by the realtime
        // listener, so patch them locally too - the realtime page just
        // gets the same values redundantly via onSnapshot.
        onSaved?.(updates);
        onClose();
        return;
      }
      const imageUrls = imageFiles.length ? await Promise.all(imageFiles.map(f => uploadPulseImage(f, user.uid))) : [];
      await addDoc(collection(db, "pulse_posts"), {
        uid:          user.uid,
        handle:       userData?.handle || user.email,
        photoURL:     user.photoURL || "",
        title:        title.trim() || null,
        category,
        caption:      caption.trim(),
        code:         showCode && code.trim() ? code.trim() : null,
        codeLang:     showCode && codeLang.trim() ? codeLang.trim() : null,
        linkUrl:      showLink && linkUrl.trim() ? linkUrl.trim() : null,
        imageUrl:     imageUrls[0] || null,
        imageUrls,
        tags:         tags.split(",").map(t => t.trim()).filter(Boolean),
        communityId:  communityId || null,
        likeCount:    0,
        commentCount: 0,
        saveCount:    0,
        shareCount:   0,
        viewCount:    0,
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      setSubmitted(true);
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono" style={{ background: "rgba(0,255,65,0.15)", color: "#00FF41" }}>
                  {(userData?.handle || "?")[0].toUpperCase()}
                </div>
            }
            <span className="font-mono text-xs text-white/60">@{userData?.handle || "you"}</span>
            {isEditing && <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">editing</span>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Submitted state - replaces the whole body */}
        {submitted && (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,255,65,0.12)", border: "1px solid rgba(0,255,65,0.3)" }}>
              <Send size={22} style={{ color: "#00FF41" }} />
            </div>
            <p className="font-mono text-sm text-neon-green">request sent!</p>
            <p className="font-mono text-xs text-white/35 leading-relaxed max-w-xs">
              Your post is under admin review. It&apos;ll appear in the feed once approved - usually within a few hours.
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="mt-2 font-mono text-xs px-6 py-2.5 border border-white/12 text-white/40 hover:text-white/70 hover:border-white/25 transition-all">
              close
            </motion.button>
          </div>
        )}

        {/* Body - hidden after submission */}
        <div className="flex-1 overflow-y-auto" style={{ display: submitted ? "none" : undefined }}>
          {/* Category */}
          <div className="px-5 pt-4 pb-1 flex gap-1.5 flex-wrap">
            {PULSE_CATEGORIES.map(cat => (
              <button key={cat.v} onClick={() => setCategory(cat.v)}
                className="font-mono text-[9px] px-2.5 py-1 rounded-full transition-colors"
                style={{
                  color:      category === cat.v ? cat.c : "rgba(255,255,255,0.3)",
                  background: category === cat.v ? `${cat.c}15` : "rgba(255,255,255,0.03)",
                  border:     category === cat.v ? `1px solid ${cat.c}40` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{cat.v}</button>
            ))}
          </div>

          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Headline (optional) - e.g. Built a Spring Boot Auth System"
            maxLength={100}
            className="w-full font-sans text-base font-bold text-white px-5 pt-3 pb-1 outline-none bg-transparent placeholder:text-white/22 placeholder:font-normal"
          />

          {/* Caption */}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Share something with the dev world..."
            rows={4}
            maxLength={600}
            autoFocus
            className="w-full font-sans text-sm text-white/85 px-5 pt-4 pb-2 outline-none resize-none bg-transparent leading-relaxed placeholder:text-white/22"
          />
          <p className="px-5 font-mono text-[9px] text-white/18 text-right">{caption.length}/600</p>

          {/* Image preview (edit mode: existing image, read-only) */}
          {isEditing && existing?.imageUrl && (
            <div className="relative mx-5 mb-3 rounded-xl overflow-hidden">
              <img src={existing.imageUrl} alt="" className="w-full max-h-64 object-cover opacity-80" />
              <p className="absolute bottom-2 left-2 font-mono text-[9px] text-white/70 bg-black/60 px-2 py-1 rounded">image can&apos;t be changed on edit</p>
            </div>
          )}
          {!isEditing && imagePreviews.length > 0 && (
            <div className="mx-5 mb-3 flex gap-2 overflow-x-auto">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ width: imagePreviews.length === 1 ? "100%" : 120, height: imagePreviews.length === 1 ? 220 : 120 }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImageAt(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white/70 hover:text-white" title="Remove image">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Code block */}
          {showCode && (
            <div className="mx-5 mb-3">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="// paste your code here"
                rows={5}
                className="w-full font-mono text-xs text-neon-green/75 px-3 py-3 rounded-lg outline-none resize-none leading-relaxed"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,65,0.12)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,255,65,0.3)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,255,65,0.12)")}
              />
              <input
                value={codeLang}
                onChange={e => setCodeLang(e.target.value)}
                placeholder="language (e.g. javascript)"
                className="mt-1.5 w-full font-mono text-[11px] text-white/45 px-3 py-2 rounded-lg outline-none bg-transparent"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              />
            </div>
          )}

          {/* Link */}
          {showLink && (
            <div className="mx-5 mb-3">
              <input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full font-mono text-xs text-white/60 px-3 py-2.5 rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,255,255,0.12)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,255,255,0.12)")}
              />
            </div>
          )}

          {/* Tags */}
          <div className="px-5 pb-4">
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="#tags (comma-separated)"
              className="w-full font-mono text-xs text-white/45 px-3 py-2 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
          </div>
        </div>

        {/* Toolbar + Post - hidden after submission */}
        <div className="border-t border-white/6 px-4 py-3 flex-shrink-0" style={{ display: submitted ? "none" : undefined }}>
          <div className="flex items-center gap-1 mb-3">
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
            {[
              { icon: ImageIcon, label: imageFiles.length ? `Photo (${imageFiles.length}/${MAX_IMAGES})` : "Photo", color: "#00FFFF", action: () => fileRef.current.click(), hideOnEdit: true },
              { icon: Code2,     label: "Code",  color: "#FFD60A", action: () => { setShowCode(p => !p); setShowLink(false); } },
              { icon: Link2,     label: "Link",  color: "#A78BFA", action: () => { setShowLink(p => !p); setShowCode(false); } },
            ].filter(t => !(isEditing && t.hideOnEdit)).map(({ icon: Icon, label, color, action }) => (
              <motion.button key={label} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
                onClick={action}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] transition-all"
                style={{ color, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Icon size={11} /> {label}
              </motion.button>
            ))}
          </div>
          {error && <p className="font-mono text-[10px] text-red-400 mb-2">{error}</p>}
          <motion.button
            whileHover={!saving ? { scale: 1.01 } : {}} whileTap={!saving ? { scale: 0.98 } : {}}
            onClick={handlePost}
            disabled={saving || !caption.trim()}
            className="w-full font-mono text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "#00FF41", color: "#050505" }}
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> {isEditing ? "Saving..." : "Submitting..."}</>
              : isEditing ? <><Check size={14} /> Save Changes</> : <><Send size={14} /> Submit for Review</>}
          </motion.button>
        </div>
      </motion.div>

      {editorSrc && (
        <ImageEditorModal
          src={editorSrc}
          onSave={handleEditorSave}
          onClose={() => setEditorSrc(null)}
        />
      )}
    </motion.div>
  );
}

// ── comments drawer ────────────────────────────────────────────────────────────

function CommentsDrawer({ post, user, userData, onClose, onCommented }) {
  const overlayClass = useOverlayClass("z-[55] flex items-end md:items-center justify-center");
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "pulse_comments"), where("postId", "==", post.id), orderBy("createdAt", "asc")))
      .then(snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [post.id]);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const batch = writeBatch(db);
      const cRef = doc(collection(db, "pulse_comments"));
      const newComment = { postId: post.id, uid: user.uid, handle: userData?.handle || user.email, photoURL: user.photoURL || "", text: text.trim(), createdAt: null };
      batch.set(cRef, { ...newComment, createdAt: serverTimestamp() });
      batch.update(doc(db, "pulse_posts", post.id), { commentCount: increment(1) });
      // No coin grant here anymore - Pulse engagement (likes/comments/saves)
      // no longer grants XP/Coins (platform policy: only Daily Learning,
      // Programming, and CS Core reward). totalCommentsReceived is still a
      // pure engagement counter, unrelated to currency.
      if (post.uid !== user.uid) {
        batch.update(doc(db, "users", post.uid), { totalCommentsReceived: increment(1) });
      }
      await batch.commit();
      if (post.uid !== user.uid) {
        writeNotification(post.uid, {
          type: "comment",
          title: `@${userData?.handle || "someone"} commented on your post`,
          body: text.trim().slice(0, 60),
          ctaHref: "/pulse",
          ctaLabel: "view pulse",
        });
      }
      setComments(prev => [...prev, { id: cRef.id, ...newComment, createdAt: { toDate: () => new Date() } }]);
      setText("");
      onCommented();
    } catch (e) {
      console.error(e);
      // Keep the typed text so the user can retry without retyping.
      setError("Couldn't post that comment. Check your connection and try again.");
    }
    finally { setSending(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full md:max-w-lg md:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden"
        style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.08)", height: "65dvh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 flex-shrink-0">
          <span className="font-mono text-xs text-white/45">{post.commentCount || 0} comments</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition-all">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading ? (
            <p className="font-mono text-xs text-white/25 animate-pulse text-center pt-8">loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="font-mono text-xs text-white/20 text-center pt-8">no comments yet - be first</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                {c.photoURL
                  ? <img src={c.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover mt-0.5" />
                  : <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41" }}>
                      {(c.handle || "?")[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-white/55">@{c.handle}</span>
                    <span className="font-mono text-[9px] text-white/22">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="font-mono text-xs text-white/75 mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user && (
          <div className="border-t border-white/6 px-5 py-3 flex-shrink-0">
            {error && <p className="font-mono text-[10px] text-red-400 mb-2">{error}</p>}
            <div className="flex gap-2.5">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
              : <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] flex-shrink-0" style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41" }}>
                  {(userData?.handle || "?")[0].toUpperCase()}
                </div>
            }
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Add a comment..."
              maxLength={300}
              className="flex-1 font-mono text-xs text-white/75 px-3 py-2 rounded-lg outline-none bg-transparent placeholder:text-white/22"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,65,0.3)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!text.trim() || sending}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-30"
              style={{ background: "rgba(0,255,65,0.12)", color: "#00FF41" }}>
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── post owner menu (edit / delete) ───────────────────────────────────────────

function PostMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(p => !p)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
        <MoreVertical size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 rounded-xl overflow-hidden z-10"
            style={{ background: "rgba(5,5,5,0.97)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 130, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
          >
            <button onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 font-mono text-xs text-white/60 hover:text-neon-cyan hover:bg-white/3 transition-colors">
              <Pencil size={12} /> edit
            </button>
            <button onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 font-mono text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              <Trash2 size={12} /> delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── post card ──────────────────────────────────────────────────────────────────

const TerminalDots = () => (
  <>
    <div className="terminal-dot bg-red-500/70" />
    <div className="terminal-dot bg-yellow-500/70" />
    <div className="terminal-dot bg-green-500/70" />
  </>
);

function CategoryBadge({ category }) {
  const cat = PULSE_CATEGORIES.find(c => c.v === category) || PULSE_CATEGORIES[PULSE_CATEGORIES.length - 1];
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ color: cat.c, background: `${cat.c}12`, border: `1px solid ${cat.c}30` }}>
      {cat.v}
    </span>
  );
}

// Fixed-height media region so every card's photo/code preview occupies a
// predictable slot regardless of the source image's own dimensions.
function ImageGallery({ urls, height }) {
  const [index, setIndex] = useState(0);
  if (urls.length === 1) {
    return (
      <div className="rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ height, background: "rgba(0,0,0,0.4)" }}>
        <img src={urls[0]} alt="" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  return (
    <div className="relative rounded-lg overflow-hidden flex-shrink-0" style={{ height, background: "rgba(0,0,0,0.4)" }}>
      <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        onScroll={e => setIndex(Math.round(e.target.scrollLeft / e.target.clientWidth))}>
        {urls.map((url, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
            <img src={url} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
        {urls.map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === index ? "#00FF41" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <span className="absolute top-1.5 right-1.5 font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white/70">{index + 1}/{urls.length}</span>
    </div>
  );
}

function MediaPreview({ post }) {
  const images = post.imageUrls?.length ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
  if (images.length > 0) {
    return <ImageGallery urls={images} height={168} />;
  }
  if (post.code) {
    const lines = post.code.split("\n");
    return (
      <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ height: 110, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5">
          <TerminalDots />
          {post.codeLang && <span className="ml-2 font-mono text-[9px] text-white/25">{post.codeLang}</span>}
        </div>
        <pre className="px-3 py-2 font-mono text-[11px] leading-relaxed overflow-hidden" style={{ color: "rgba(0,255,65,0.82)" }}>
          {lines.slice(0, 4).join("\n")}{lines.length > 4 ? "\n…" : ""}
        </pre>
      </div>
    );
  }
  if (post.linkUrl) {
    return (
      <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-mono text-xs transition-all hover:bg-white/3 flex-shrink-0"
        style={{ border: "1px solid rgba(0,255,255,0.12)", color: "#00FFFF" }}>
        <Link2 size={12} />
        <span className="truncate">{post.linkUrl.replace(/^https?:\/\//, "")}</span>
      </a>
    );
  }
  return null;
}

function PostCard({ post, user, userData, liked, likeBusy, saved, saveBusy, isFollowing, followBusy, isReposted, repostBusy, onLike, onSave, onComment, onToggleFollow, onToggleRepost, onEdit, onDelete, onGuestAction, autoOpenDetail, communityName }) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [localLiked,   setLocalLiked]   = useState(liked);
  const [localLikes,   setLocalLikes]   = useState(post.likeCount || 0);
  const [localComments, setLocalComments] = useState(post.commentCount || 0);
  const [copied,       setCopied]       = useState(false);
  const cardRef = useRef(null);
  const viewedRef = useRef(false);

  const openDetail = () => { setShowDetail(true); router.push(`/pulse/${post.id}`); };
  const closeDetail = () => { setShowDetail(false); router.push("/pulse"); };

  // Deep link (shared /pulse/{id} URL, or the crawler-preview route's human
  // fallback) - opens straight to this post's detail view without the user
  // needing to find it in the feed first. Syncs both ways, not just true -
  // if the URL moves on to a different post's deep link, this card's own
  // modal must close instead of staying stuck open (openDetail/closeDetail
  // already set showDetail directly for normal in-app clicks; this only
  // matters when the URL itself changes out from under an already-open card).
  useEffect(() => { setShowDetail(!!autoOpenDetail); }, [autoOpenDetail]);

  useEffect(() => { setLocalLiked(liked); }, [liked]);

  // Count a view once per card per page load, when >=60% visible for 1s -
  // guards against counting a post that just flickers past while scrolling.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let timer = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        timer = setTimeout(() => {
          if (viewedRef.current) return;
          viewedRef.current = true;
          if (user) {
            updateDoc(doc(db, "pulse_posts", post.id), { viewCount: increment(1) }).catch(() => {});
            if (post.uid !== user.uid) {
              updateDoc(doc(db, "users", post.uid), { totalViewsReceived: increment(1) }).catch(() => {});
            }
          }
        }, 1000);
      } else if (timer) {
        clearTimeout(timer);
      }
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [post.id]);

  // Only prompt for auth when there truly is no user - must not fire for
  // an already-authenticated user performing a normal action.
  const requireAuth = () => {
    if (user) return false;
    onGuestAction?.();
    return true;
  };

  const handleLike = async () => {
    if (requireAuth() || likeBusy) return;
    const next = !localLiked;
    setLocalLiked(next);
    setLocalLikes(c => c + (next ? 1 : -1));
    try {
      await onLike(post);
    } catch (e) {
      console.error(e);
      // Roll back the optimistic update - the write didn't actually land.
      setLocalLiked(!next);
      setLocalLikes(c => c + (next ? -1 : 1));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/pulse/${post.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    // Counts link-copy clicks as a lightweight "share" signal - there's no
    // repost/re-share feature that puts the post into other feeds.
    if (user) {
      updateDoc(doc(db, "pulse_posts", post.id), { shareCount: increment(1) }).catch(() => {});
      if (post.uid !== user.uid) {
        updateDoc(doc(db, "users", post.uid), { totalSharesReceived: increment(1) }).catch(() => {});
      }
    }
  };

  const handleComment = () => {
    if (requireAuth()) return;
    setShowComments(true);
  };

  const title = post.title?.trim();
  const isLongCaption = (post.caption?.length || 0) > 220;
  const hasExtra = isLongCaption || (post.code && post.code.split("\n").length > 4);

  const actionsBar = (
    <div className="px-4 pb-4 pt-1 flex items-center gap-5 border-t border-white/4 flex-shrink-0">
      <motion.button whileTap={{ scale: 0.85 }} onClick={handleLike} disabled={likeBusy}
        className="flex items-center gap-1.5 transition-all disabled:opacity-50"
        style={{ color: localLiked ? "#FF5050" : "rgba(255,255,255,0.35)" }}>
        <Heart size={17} fill={localLiked ? "#FF5050" : "none"} />
        <span className="font-mono text-[11px]">{localLikes}</span>
      </motion.button>

      <motion.button whileTap={{ scale: 0.88 }} onClick={handleComment}
        className="flex items-center gap-1.5 text-white/35 hover:text-white/60 transition-all">
        <MessageCircle size={17} />
        <span className="font-mono text-[11px]">{localComments}</span>
      </motion.button>

      {post.uid !== user?.uid && (
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => { if (!requireAuth()) onToggleRepost(post); }}
          disabled={repostBusy}
          className="flex items-center gap-1.5 transition-all disabled:opacity-50"
          style={{ color: isReposted ? "#00FF41" : "rgba(255,255,255,0.35)" }}>
          <Repeat size={16} />
          {post.repostCount > 0 && <span className="font-mono text-[11px]">{post.repostCount}</span>}
        </motion.button>
      )}

      <motion.button whileTap={{ scale: 0.88 }} onClick={handleShare}
        className="flex items-center gap-1.5 transition-all"
        style={{ color: copied ? "#00FF41" : "rgba(255,255,255,0.35)" }}>
        {copied ? <Check size={15} /> : <Share2 size={15} />}
        <span className="font-mono text-[10px]">{copied ? "copied!" : "share"}</span>
      </motion.button>

      <motion.button whileTap={{ scale: 0.85 }} onClick={() => { if (!requireAuth() && !saveBusy) onSave(post); }} disabled={saveBusy}
        className="ml-auto transition-all disabled:opacity-50"
        style={{ color: saved ? "#00FFFF" : "rgba(255,255,255,0.35)" }}>
        {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </motion.button>
    </div>
  );

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-window overflow-hidden flex flex-col"
        style={{ maxHeight: "min(78dvh, 640px)" }}
      >
        {/* Terminal title bar */}
        <div className="terminal-header flex-shrink-0">
          <TerminalDots />
          <span className="font-mono text-[10px] text-white/25 ml-2 truncate">pulse://@{post.handle}</span>
        </div>

        {/* Author row */}
        <div className="px-4 pt-3 pb-2.5 flex items-center gap-3 flex-shrink-0">
          {post.photoURL
            ? <img src={post.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm flex-shrink-0"
                style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41" }}>
                {(post.handle || "?")[0].toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-white/80">@{post.handle}</p>
            <p className="font-mono text-[9px] text-white/22 flex items-center gap-2">
              {timeAgo(post.createdAt)}
              {post.viewCount > 0 && <span className="flex items-center gap-0.5"><Eye size={9} /> {post.viewCount}</span>}
            </p>
          </div>
          {user && post.uid !== user.uid && (
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => onToggleFollow(post)}
              disabled={followBusy}
              className="flex-shrink-0 flex items-center gap-1 font-mono text-[10px] px-2.5 py-1 rounded-full border transition-all disabled:opacity-50"
              style={isFollowing
                ? { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)" }
                : { color: "#00FF41", borderColor: "rgba(0,255,65,0.35)", background: "rgba(0,255,65,0.04)" }}
            >
              {isFollowing ? <><UserMinus size={10} /> following</> : <><UserPlus size={10} /> follow</>}
            </motion.button>
          )}
          {!user && <button onClick={onGuestAction} className="flex-shrink-0 font-mono text-[10px] px-2.5 py-1 rounded-full border text-neon-green border-neon-green/30">follow</button>}
          {user && post.uid === user.uid && (
            <PostMenu onEdit={() => onEdit(post)} onDelete={() => onDelete(post)} />
          )}
        </div>

        {/* Category (+ community badge, if this post belongs to one) */}
        <div className="px-4 pb-2 flex-shrink-0 flex items-center gap-2">
          <CategoryBadge category={post.category} />
          {communityName && (
            <span className="font-mono text-[9px] text-neon-cyan/70 border border-neon-cyan/25 px-2 py-0.5 rounded">
              {communityName}
            </span>
          )}
        </div>

        {/* Content - bounded, never grows the card past its max-height */}
        <div className="px-4 pb-3 space-y-2.5 overflow-hidden">
          {title && <h3 className="font-sans text-[15px] font-bold text-white leading-snug line-clamp-2">{title}</h3>}
          <p className="font-sans text-sm text-white/75 leading-relaxed whitespace-pre-wrap line-clamp-3">{post.caption}</p>
          {hasExtra && (
            <button onClick={openDetail} className="font-mono text-[11px] text-neon-cyan/70 hover:text-neon-cyan transition-colors">
              Read more...
            </button>
          )}
          <MediaPreview post={post} />
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 5).map(t => (
                <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />
        {actionsBar}
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <PostDetailModal post={post} onClose={closeDetail} actionsBar={actionsBar} />
        )}
        {showComments && (
          <CommentsDrawer
            post={{ ...post, commentCount: localComments }}
            user={user}
            userData={userData}
            onClose={() => setShowComments(false)}
            onCommented={() => setLocalComments(c => c + 1)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── post detail modal ("Read more" expansion) ─────────────────────────────────

function PostDetailModal({ post, onClose, actionsBar }) {
  const overlayClass = useOverlayClass("z-[65] flex items-end md:items-center justify-center");
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={overlayClass}
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="terminal-window w-full md:max-w-lg flex flex-col"
        style={{ maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="terminal-header flex-shrink-0">
          <TerminalDots />
          <span className="font-mono text-[10px] text-white/25 ml-2">pulse://@{post.handle}</span>
          <button onClick={onClose} className="ml-auto text-white/25 hover:text-white/60 transition-colors"><X size={13} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            {post.photoURL
              ? <img src={post.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm flex-shrink-0" style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41" }}>
                  {(post.handle || "?")[0].toUpperCase()}
                </div>
            }
            <div>
              <p className="font-mono text-xs text-white/80">@{post.handle}</p>
              <p className="font-mono text-[9px] text-white/22">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          <CategoryBadge category={post.category} />
          {post.title?.trim() && <h3 className="font-sans text-lg font-bold text-white leading-snug">{post.title}</h3>}
          <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{post.caption}</p>

          {(post.imageUrls?.length > 0 || post.imageUrl) && (
            <ImageGallery urls={post.imageUrls?.length ? post.imageUrls : [post.imageUrl]} height={360} />
          )}

          {post.code && (
            <div className="rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <TerminalDots />
                {post.codeLang && <span className="ml-2 font-mono text-[9px] text-white/25">{post.codeLang}</span>}
              </div>
              <div className="overflow-x-auto">
                <pre className="p-4 font-mono text-xs leading-relaxed whitespace-pre" style={{ color: "rgba(0,255,65,0.82)", minWidth: "max-content" }}>{post.code}</pre>
              </div>
            </div>
          )}

          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-mono text-xs transition-all hover:bg-white/3"
              style={{ border: "1px solid rgba(0,255,255,0.12)", color: "#00FFFF" }}>
              <Link2 size={12} />
              <span className="truncate">{post.linkUrl.replace(/^https?:\/\//, "")}</span>
            </a>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map(t => (
                <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-2 py-0.5 rounded">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {actionsBar}
      </motion.div>
    </motion.div>
  );
}

// ── app ──────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── communities directory ──────────────────────────────────────────────────────
// Admin-created content (same pattern as missions/hackathons) - this surface
// only discovers/joins, it never creates. Reuses the exact join/leave batch
// shape handleToggleFollow already uses below (join-doc + bounded ±1 counter).
function CommunityDirectory({ communities, myCommunityIds, busyId, onToggleMembership, onOpen, onGuestAction, user, loading }) {
  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading communities...</p>;
  if (communities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Users size={40} className="text-white/10" />
        <p className="font-mono text-sm text-white/20">no communities yet</p>
        <p className="font-mono text-[10px] text-white/12">// first one is brewing - stay tuned</p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {communities.map(c => {
        const joined = myCommunityIds.has(c.id);
        return (
          <button key={c.id} onClick={() => onOpen(c)} className="terminal-window p-4 text-left transition-colors hover:border-white/15">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-sans text-sm font-bold text-white truncate">{c.name}</p>
                {c.topic && <p className="font-mono text-[9px] text-neon-cyan/60 mt-0.5">#{c.topic}</p>}
              </div>
              <span
                onClick={e => { e.stopPropagation(); user ? onToggleMembership(c) : onGuestAction(); }}
                className="flex-shrink-0 font-mono text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer"
                style={{
                  opacity: busyId === c.id ? 0.5 : 1,
                  ...(joined
                    ? { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)" }
                    : { color: "#00FF41", borderColor: "rgba(0,255,65,0.35)", background: "rgba(0,255,65,0.04)" }),
                }}
              >
                {joined ? "joined" : "join"}
              </span>
            </div>
            <p className="font-mono text-[10px] text-white/35 leading-relaxed line-clamp-2 mb-3">{c.description}</p>
            <p className="font-mono text-[9px] text-white/22 flex items-center gap-1"><Users size={10} /> {c.memberCount ?? 0} members</p>
          </button>
        );
      })}
    </div>
  );
}

export function PulseApp() {
  const { user, userData }          = useAuth();
  const windowed = useIsWindowed();
  const fabPositionClass = usePositionClass();
  const pathname = usePathname();
  // /pulse/{id} - the shared/deep-linked post, if any. Bare /pulse (the feed
  // itself) yields null, same "second path segment" trick as /u, /campus, /contest.
  const deepLinkId = pathname.split("/").filter(Boolean)[1] || null;
  const [deepLinkPost, setDeepLinkPost] = useState(null);
  const [posts,      setPosts]      = useState([]);       // live top page (realtime)
  const [olderPosts, setOlderPosts] = useState([]);        // paginated older pages
  const [lastRealtimeDoc, setLastRealtimeDoc] = useState(null);
  const [paginationCursor, setPaginationCursor] = useState(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [likedIds,   setLikedIds]   = useState(new Set());
  const [likeBusyId, setLikeBusyId] = useState(null);
  const [savedIds,   setSavedIds]   = useState(new Set());
  const [saveBusyId, setSaveBusyId] = useState(null);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followBusyId, setFollowBusyId] = useState(null);
  const [repostedIds, setRepostedIds] = useState(new Set());
  const [repostBusyId, setRepostBusyId] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingId,  setDeletingId]  = useState(null);
  const [guestPromptOpen, setGuestPromptOpen] = useState(false);

  const [view, setView] = useState("feed"); // "feed" | "communities"
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [myCommunityIds, setMyCommunityIds] = useState(new Set());
  const [communityBusyId, setCommunityBusyId] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityPostsLoading, setCommunityPostsLoading] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, "communities"), orderBy("memberCount", "desc")))
      .then(snap => setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setCommunities([]))
      .finally(() => setCommunitiesLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setMyCommunityIds(new Set()); return; }
    getDocs(query(collection(db, "community_members"), where("uid", "==", user.uid)))
      .then(snap => setMyCommunityIds(new Set(snap.docs.map(d => d.data().communityId))))
      .catch(() => setMyCommunityIds(new Set()));
  }, [user]);

  const communitiesById = Object.fromEntries(communities.map(c => [c.id, c]));

  const handleToggleCommunityMembership = async (community) => {
    if (!user || communityBusyId) return;
    const joined = myCommunityIds.has(community.id);
    setCommunityBusyId(community.id);
    setMyCommunityIds(prev => { const n = new Set(prev); joined ? n.delete(community.id) : n.add(community.id); return n; });
    setCommunities(prev => prev.map(c => c.id === community.id ? { ...c, memberCount: Math.max(0, (c.memberCount || 0) + (joined ? -1 : 1)) } : c));
    const memberRef = doc(db, "community_members", `${community.id}_${user.uid}`);
    try {
      const batch = writeBatch(db);
      if (joined) {
        batch.delete(memberRef);
        batch.update(doc(db, "communities", community.id), { memberCount: increment(-1) });
      } else {
        batch.set(memberRef, { communityId: community.id, uid: user.uid, joinedAt: serverTimestamp() });
        batch.update(doc(db, "communities", community.id), { memberCount: increment(1) });
      }
      await batch.commit();
    } catch (e) {
      console.error(e);
      setMyCommunityIds(prev => { const n = new Set(prev); joined ? n.add(community.id) : n.delete(community.id); return n; });
      setCommunities(prev => prev.map(c => c.id === community.id ? { ...c, memberCount: Math.max(0, (c.memberCount || 0) + (joined ? 1 : -1)) } : c));
    } finally {
      setCommunityBusyId(null);
    }
  };

  const openCommunity = (community) => {
    setActiveCommunity(community);
    setCommunityPostsLoading(true);
    getDocs(query(
      collection(db, "pulse_posts"),
      where("communityId", "==", community.id), where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
    ))
      .then(snap => setCommunityPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setCommunityPosts([]))
      .finally(() => setCommunityPostsLoading(false));
  };
  const closeCommunity = () => { setActiveCommunity(null); setCommunityPosts([]); };

  // Realtime feed - only approved posts, newest first. New posts (or admin
  // approvals) reflect for every connected user without a manual refresh.
  useEffect(() => {
    const q = query(collection(db, "pulse_posts"), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLastRealtimeDoc(snap.docs[snap.docs.length - 1] || null);
      if (snap.docs.length < PAGE_SIZE) setHasMore(false);
      setLoading(false);
    }, err => { console.error(err); setLoading(false); });
    return unsub;
  }, []);

  const loadMore = async () => {
    const cursor = paginationCursor || lastRealtimeDoc;
    if (!cursor || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const snap = await getDocs(query(
        collection(db, "pulse_posts"), where("status", "==", "approved"),
        orderBy("createdAt", "desc"), startAfter(cursor), limit(PAGE_SIZE),
      ));
      setOlderPosts(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
      setPaginationCursor(snap.docs[snap.docs.length - 1] || cursor);
      if (snap.docs.length < PAGE_SIZE) setHasMore(false);
    } catch (e) { console.error(e); }
    finally { setLoadingMore(false); }
  };

  const feedPosts = [...posts, ...olderPosts];
  // A shared link's post may be older than the first loaded page - fetch it
  // directly rather than requiring the whole feed to paginate that far back.
  useEffect(() => {
    if (!deepLinkId || loading) return;
    if (feedPosts.some(p => p.id === deepLinkId)) { setDeepLinkPost(null); return; }
    getDoc(doc(db, "pulse_posts", deepLinkId))
      .then(snap => setDeepLinkPost(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId, loading]);
  const allPosts = deepLinkPost && !feedPosts.some(p => p.id === deepLinkPost.id)
    ? [deepLinkPost, ...feedPosts]
    : feedPosts;

  useEffect(() => {
    if (!user) {
      // Cleared on logout, not just left stale - PulseApp isn't remounted
      // across a same-tab logout/login (no `key` prop, no redirect), so
      // without this a signed-out-then-different-account session kept
      // rendering the PREVIOUS account's liked/saved/following/reposted
      // state over the same shared feed, until this Promise.all below
      // happened to resolve for the new account (or forever, if it failed
      // and only logged to console).
      setLikedIds(new Set()); setSavedIds(new Set());
      setFollowingIds(new Set()); setRepostedIds(new Set());
      return;
    }
    // Load liked + saved + following + reposted
    Promise.all([
      getDocs(query(collection(db, "pulse_likes"), where("uid", "==", user.uid))),
      getDoc(doc(db, "pulse_saves", user.uid)),
      getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid))),
      getDocs(query(collection(db, "pulse_reposts"), where("uid", "==", user.uid))),
    ]).then(([likeSnap, saveSnap, followSnap, repostSnap]) => {
      setLikedIds(new Set(likeSnap.docs.map(d => d.data().postId)));
      if (saveSnap.exists()) setSavedIds(new Set(saveSnap.data().saved || []));
      setFollowingIds(new Set(followSnap.docs.map(d => d.data().followeeId)));
      setRepostedIds(new Set(repostSnap.docs.map(d => d.data().postId)));
    }).catch(console.error);
  }, [user]);

  const handleToggleFollow = async (post) => {
    if (!user || followBusyId) return;
    const authorUid = post.uid;
    const isFollowing = followingIds.has(authorUid);
    setFollowBusyId(authorUid);
    // Optimistic UI
    setFollowingIds(prev => {
      const n = new Set(prev);
      isFollowing ? n.delete(authorUid) : n.add(authorUid);
      return n;
    });
    const followRef = doc(db, "follows", `${user.uid}_${authorUid}`);
    const myRef      = doc(db, "users", user.uid);
    const theirRef   = doc(db, "users", authorUid);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        await updateDoc(myRef,    { followingCount: increment(-1) });
        await updateDoc(theirRef, { followersCount: increment(-1) });
      } else {
        await setDoc(followRef, { followerId: user.uid, followeeId: authorUid, createdAt: serverTimestamp() });
        await updateDoc(myRef,    { followingCount: increment(1) });
        await updateDoc(theirRef, { followersCount: increment(1) });
        // Link to the FOLLOWER's own profile, not post.handle (that's the post
        // author - the person receiving this notification, not who sent it).
        writeNotification(authorUid, {
          type: "follow",
          title: `@${userData?.handle || "someone"} followed you`,
          body: "You have a new follower on DeVert.",
          ...(userData?.handle ? { ctaHref: `/u/${userData.handle}`, ctaLabel: "view profile" } : {}),
        });
      }
    } catch (e) {
      console.error(e);
      // Roll back optimistic update on failure
      setFollowingIds(prev => {
        const n = new Set(prev);
        isFollowing ? n.add(authorUid) : n.delete(authorUid);
        return n;
      });
    } finally {
      setFollowBusyId(null);
    }
  };

  // Reposting persists a real record and counts on both sides, but doesn't
  // inject a new entry into the global feed - that would need the realtime
  // feed query to merge a second collection, a bigger change than this pass.
  const handleToggleRepost = async (post) => {
    if (!user || repostBusyId || post.uid === user.uid) return;
    const isReposted = repostedIds.has(post.id);
    setRepostBusyId(post.id);
    setRepostedIds(prev => {
      const n = new Set(prev);
      isReposted ? n.delete(post.id) : n.add(post.id);
      return n;
    });
    const repostRef = doc(db, "pulse_reposts", `${post.id}_${user.uid}`);
    try {
      if (isReposted) {
        await deleteDoc(repostRef);
        await updateDoc(doc(db, "pulse_posts", post.id), { repostCount: increment(-1) });
        await updateDoc(doc(db, "users", user.uid), { totalRepostsMade: increment(-1) });
        await updateDoc(doc(db, "users", post.uid), { totalRepostsReceived: increment(-1) });
      } else {
        await setDoc(repostRef, { postId: post.id, uid: user.uid, handle: userData?.handle || "", createdAt: serverTimestamp() });
        await updateDoc(doc(db, "pulse_posts", post.id), { repostCount: increment(1) });
        await updateDoc(doc(db, "users", user.uid), { totalRepostsMade: increment(1) });
        await updateDoc(doc(db, "users", post.uid), { totalRepostsReceived: increment(1) });
        writeNotification(post.uid, {
          type: "repost",
          title: `@${userData?.handle || "someone"} reposted your Pulse`,
          body: post.caption?.slice(0, 60) || "Your post was reposted.",
          ctaHref: "/pulse",
          ctaLabel: "view pulse",
        });
      }
    } catch (e) {
      console.error(e);
      setRepostedIds(prev => {
        const n = new Set(prev);
        isReposted ? n.add(post.id) : n.delete(post.id);
        return n;
      });
    } finally {
      setRepostBusyId(null);
    }
  };

  const handleDeletePost = async (post) => {
    if (!user || post.uid !== user.uid || deletingId) return;
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeletingId(post.id);
    try {
      const [commentsSnap, likesSnap, repostsSnap] = await Promise.all([
        getDocs(query(collection(db, "pulse_comments"), where("postId", "==", post.id))),
        getDocs(query(collection(db, "pulse_likes"), where("postId", "==", post.id))),
        getDocs(query(collection(db, "pulse_reposts"), where("postId", "==", post.id))),
      ]);
      const batch = writeBatch(db);
      commentsSnap.docs.forEach(d => batch.delete(d.ref));
      likesSnap.docs.forEach(d => batch.delete(d.ref));
      repostsSnap.docs.forEach(d => {
        batch.delete(d.ref);
        batch.update(doc(db, "users", d.data().uid), { totalRepostsMade: increment(-1) });
      });
      batch.delete(doc(db, "pulse_posts", post.id));

      // This post was in the (approved-only) feed, so it was counted -
      // roll back the author's aggregate stats to match.
      batch.update(doc(db, "users", user.uid), {
        pulsePostsCount:       increment(-1),
        totalLikesReceived:    increment(-(post.likeCount || 0)),
        totalCommentsReceived: increment(-(post.commentCount || 0)),
        totalSavesReceived:    increment(-(post.saveCount || 0)),
        totalViewsReceived:    increment(-(post.viewCount || 0)),
        totalSharesReceived:   increment(-(post.shareCount || 0)),
        totalRepostsReceived:  increment(-(post.repostCount || 0)),
      });

      // No coin clawback here anymore - Pulse engagement no longer grants
      // coins at all (see handleLike/handleSave/handleSend), so there's
      // nothing to claw back on delete regardless of this post's engagement
      // counts. Any already-granted historical coins from before this
      // change are reconciled once by the separate reward-cleanup migration,
      // not by this ongoing per-delete code path.

      await batch.commit();
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setOlderPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // Guarded the same way handleToggleFollow/handleToggleRepost already are
  // below (a per-post busy id checked at entry and cleared in finally) - a
  // rapid double-tap used to be able to fire two independent batch.commit()s
  // before the first one's likedIds/savedIds update landed, each applying
  // its own increment and (before Pulse stopped granting rewards) each
  // crediting the author's coin balance a second time.
  const handleLike = async (post) => {
    if (!user || likeBusyId) return;
    const likeId = `${post.id}_${user.uid}`;
    const isLiked = likedIds.has(post.id);
    setLikeBusyId(post.id);
    try {
      const batch = writeBatch(db);
      // No coin grant here anymore - Pulse engagement no longer grants
      // XP/Coins (platform policy: only Daily Learning, Programming, and CS
      // Core reward). totalLikesReceived is still a pure engagement counter.
      if (isLiked) {
        batch.delete(doc(db, "pulse_likes", likeId));
        batch.update(doc(db, "pulse_posts", post.id), { likeCount: increment(-1) });
        if (post.uid !== user.uid) batch.update(doc(db, "users", post.uid), { totalLikesReceived: increment(-1) });
      } else {
        batch.set(doc(db, "pulse_likes", likeId), { postId: post.id, uid: user.uid, likedAt: serverTimestamp() });
        batch.update(doc(db, "pulse_posts", post.id), { likeCount: increment(1) });
        if (post.uid !== user.uid) batch.update(doc(db, "users", post.uid), { totalLikesReceived: increment(1) });
      }
      await batch.commit();
      if (!isLiked && post.uid !== user.uid) {
        writeNotification(post.uid, {
          type: "like",
          title: `@${userData?.handle || "someone"} liked your post`,
          body: post.caption?.slice(0, 60) || "Your Pulse post got a like.",
          ctaHref: "/pulse",
          ctaLabel: "view pulse",
        });
      }
      setLikedIds(prev => { const n = new Set(prev); isLiked ? n.delete(post.id) : n.add(post.id); return n; });
    } finally {
      setLikeBusyId(null);
    }
  };

  const handleSave = async (post) => {
    if (!user) { window.location.href = "/login?next=/pulse"; return; }
    if (saveBusyId) return;
    const isSaved = savedIds.has(post.id);
    setSaveBusyId(post.id);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "pulse_saves", user.uid), { saved: isSaved ? arrayRemove(post.id) : arrayUnion(post.id) }, { merge: true });
      batch.update(doc(db, "pulse_posts", post.id), { saveCount: increment(isSaved ? -1 : 1) });
      // No coin grant here anymore - see handleLike's comment above.
      if (post.uid !== user.uid) batch.update(doc(db, "users", post.uid), { totalSavesReceived: increment(isSaved ? -1 : 1) });
      await batch.commit();
      setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(post.id) : n.add(post.id); return n; });
    } finally {
      setSaveBusyId(null);
    }
  };

  return (
    <>
      <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-4 relative`}>
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="relative max-w-xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// /pulse - community_feed.live</p>
                <h1 className="font-sans font-bold tracking-tighter text-white leading-none"
                  style={{ fontSize: "clamp(2.2rem,7vw,4rem)" }}>
                  TECH <span className="text-neon-green">PULSE</span>
                </h1>
              </div>
              {user && (
                <div className="flex gap-2">
                  <a href="/wallet" className="font-mono text-[10px] px-3 py-1.5 rounded-full border border-white/12 text-white/40 hover:text-neon-green hover:border-neon-green/30 transition-all inline-flex items-center gap-1.5">
                    <Wallet size={11} /> Wallet
                  </a>
                </div>
              )}
            </div>
            <p className="font-mono text-sm text-white/35 mt-2">Dev content. Real conversations. Community-built.</p>

            {/* Feed / Communities toggle */}
            <div className="flex gap-2 mt-5">
              {[{ v: "feed", label: "FEED" }, { v: "communities", label: "COMMUNITIES" }].map(t => (
                <button key={t.v}
                  onClick={() => { setView(t.v); if (t.v === "feed") closeCommunity(); }}
                  className="font-mono text-[10px] tracking-widest px-3 py-1.5 rounded transition-all"
                  style={view === t.v
                    ? { color: "#00FF41", borderBottom: "1px solid #00FF41", background: "rgba(0,255,65,0.06)" }
                    : { color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}
                >{t.label}</button>
              ))}
            </div>
          </motion.div>

          {view === "communities" && !activeCommunity && (
            <CommunityDirectory
              communities={communities}
              myCommunityIds={myCommunityIds}
              busyId={communityBusyId}
              onToggleMembership={handleToggleCommunityMembership}
              onOpen={openCommunity}
              onGuestAction={() => setGuestPromptOpen(true)}
              user={user}
              loading={communitiesLoading}
            />
          )}

          {view === "communities" && activeCommunity && (
            <div>
              <button onClick={closeCommunity} className="flex items-center gap-1.5 font-mono text-[10px] text-white/25 hover:text-white/45 transition-colors mb-4">
                <ArrowLeft size={11} /> communities
              </button>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-sans text-lg font-bold text-white">{activeCommunity.name}</p>
                  {activeCommunity.topic && <p className="font-mono text-[10px] text-neon-cyan/60">#{activeCommunity.topic}</p>}
                </div>
              </div>
              {communityPostsLoading ? (
                <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
              ) : communityPosts.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <p className="font-mono text-sm text-white/20">no posts in this community yet</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => user ? setCreateOpen(true) : setGuestPromptOpen(true)}
                    className="font-mono text-xs px-6 py-2.5 border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-all">
                    [ POST HERE ]
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map(post => (
                    <PostCard key={post.id}
                      post={post} user={user} userData={userData}
                      communityName={communitiesById[post.communityId]?.name}
                      liked={likedIds.has(post.id)} likeBusy={likeBusyId === post.id}
                      saved={savedIds.has(post.id)} saveBusy={saveBusyId === post.id}
                      isFollowing={followingIds.has(post.uid)} followBusy={followBusyId === post.uid}
                      isReposted={repostedIds.has(post.id)} repostBusy={repostBusyId === post.id}
                      onLike={handleLike} onSave={handleSave} onComment={() => {}}
                      onToggleFollow={handleToggleFollow} onToggleRepost={handleToggleRepost}
                      onEdit={setEditingPost} onDelete={handleDeletePost}
                      onGuestAction={() => setGuestPromptOpen(true)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feed */}
          {view === "feed" && (loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="terminal-window p-5 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/5" />
                    <div className="h-3 bg-white/5 rounded w-24" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : allPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24">
              <Activity size={48} className="text-white/8" />
              <p className="font-mono text-sm text-white/20">no posts yet - be the first to post</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => user ? setCreateOpen(true) : setGuestPromptOpen(true)}
                className="font-mono text-xs px-6 py-2.5 border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-all">
                [ POST NOW ]
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {allPosts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i < 5 ? i * 0.05 : 0 }}>
                  <PostCard
                    post={post}
                    autoOpenDetail={post.id === deepLinkId}
                    user={user}
                    userData={userData}
                    liked={likedIds.has(post.id)}
                    likeBusy={likeBusyId === post.id}
                    saved={savedIds.has(post.id)}
                    saveBusy={saveBusyId === post.id}
                    isFollowing={followingIds.has(post.uid)}
                    followBusy={followBusyId === post.uid}
                    isReposted={repostedIds.has(post.id)}
                    repostBusy={repostBusyId === post.id}
                    onLike={handleLike}
                    onSave={handleSave}
                    onComment={() => {}}
                    onToggleFollow={handleToggleFollow}
                    onToggleRepost={handleToggleRepost}
                    onEdit={setEditingPost}
                    onDelete={handleDeletePost}
                    onGuestAction={() => setGuestPromptOpen(true)}
                  />
                </motion.div>
              ))}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={loadMore} disabled={loadingMore}
                    className="font-mono text-xs px-6 py-2.5 border border-white/12 text-white/40 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all disabled:opacity-50"
                  >
                    {loadingMore ? "loading..." : "[ LOAD MORE ]"}
                  </motion.button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Floating + button - visible to guests too; prompts sign-in instead of hiding.
          Hidden in the communities directory (no post target yet) - still shown
          inside an open community (posts there) and in the main feed. */}
      {view !== "communities" || activeCommunity ? (
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.12, boxShadow: "0 0 30px rgba(0,255,65,0.45)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => user ? setCreateOpen(true) : setGuestPromptOpen(true)}
        className={`${fabPositionClass} z-50 right-5 md:right-10 w-14 h-14 rounded-full flex items-center justify-center`}
        style={{
          bottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))",
          background: "#00FF41",
          boxShadow: "0 0 20px rgba(0,255,65,0.3), 0 4px 20px rgba(0,0,0,0.6)",
        }}
      >
        <Plus size={22} color="#050505" strokeWidth={2.5} />
      </motion.button>
      ) : null}

      {/* Modals */}
      <AnimatePresence>
        {createOpen && (
          <CreatePostModal
            user={user}
            userData={userData}
            communityId={activeCommunity?.id}
            onClose={() => setCreateOpen(false)}
            onSaved={() => activeCommunity && openCommunity(activeCommunity)}
          />
        )}
        {editingPost && (
          <CreatePostModal
            user={user}
            userData={userData}
            existing={editingPost}
            onClose={() => setEditingPost(null)}
            onSaved={(updates) => {
              const patch = p => p.id === editingPost.id ? { ...p, ...updates } : p;
              setPosts(prev => prev.map(patch));
              setOlderPosts(prev => prev.map(patch));
            }}
          />
        )}
        {guestPromptOpen && (
          <EnterHqModal onClose={() => setGuestPromptOpen(false)} next="/pulse" />
        )}
      </AnimatePresence>
    </>
  );
}
