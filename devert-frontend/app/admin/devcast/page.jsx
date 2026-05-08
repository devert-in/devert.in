"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Plus, X, Save, Eye, EyeOff, Edit3, Trash2, ExternalLink, Loader2, Star, StarOff } from "lucide-react";
import { collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    { id: "startup-stories",   label: "🚀 Startup Stories" },
    { id: "hackathon-debrief", label: "💥 Hackathon Debrief" },
    { id: "postmortems",       label: "📉 Postmortems" },
    { id: "builder-journeys",  label: "🏗️ Builder Journeys" },
];

const EMPTY_FORM = {
    title: "", description: "", youtubeUrl: "", category: "startup-stories",
    guest: "", guestRole: "", duration: "", episode: "", tags: "", published: true, featured: false,
};

const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    return match ? match[1] : url.trim();
};

export default function AdminDevcastPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (user?.email !== "admin@devert.in") { router.replace("/"); return; }
        fetchEpisodes();
    }, [user]);

    const fetchEpisodes = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "devcast_episodes"), orderBy("publishedAt", "desc"));
            const snap = await getDocs(q);
            setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title || !form.youtubeUrl) return;
        setSaving(true);
        try {
            const youtubeId = getYoutubeId(form.youtubeUrl);
            const data = {
                ...form,
                youtubeId,
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                publishedAt: editingId ? form.publishedAt : serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            delete data.youtubeUrl;

            if (editingId) {
                await updateDoc(doc(db, "devcast_episodes", editingId), data);
            } else {
                await addDoc(collection(db, "devcast_episodes"), data);
            }
            setShowForm(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
            fetchEpisodes();
        } catch (e) { console.error("Save failed:", e); }
        finally { setSaving(false); }
    };

    const handleEdit = (ep) => {
        setForm({ ...ep, youtubeUrl: ep.youtubeId, tags: Array.isArray(ep.tags) ? ep.tags.join(", ") : "" });
        setEditingId(ep.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "devcast_episodes", id));
            setDeleteConfirm(null);
            fetchEpisodes();
        } catch (e) { console.error(e); }
    };

    const toggleField = async (ep, field) => {
        try {
            await updateDoc(doc(db, "devcast_episodes", ep.id), { [field]: !ep[field] });
            setEpisodes(prev => prev.map(e => e.id === ep.id ? { ...e, [field]: !e[field] } : e));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 pb-20">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pt-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center justify-center">
                                <Mic size={18} className="text-orange-400" />
                            </div>
                            <h1 className="text-3xl font-black font-sans uppercase italic tracking-tighter text-foreground">
                                DEV<span className="text-orange-400">CAST</span> Admin
                            </h1>
                        </div>
                        <p className="text-muted-foreground font-mono text-xs ml-13">Manage podcast episodes · {episodes.length} total</p>
                    </div>
                    <button
                        onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-black font-mono text-[11px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    >
                        <Plus size={16} /> ADD EPISODE
                    </button>
                </div>

                {/* Episode List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="text-orange-400 animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {episodes.map((ep) => (
                            <motion.div
                                key={ep.id}
                                layout
                                className={`flex gap-4 bg-card-bg border rounded-2xl p-4 items-center transition-all ${ep.published ? "border-border" : "border-dashed border-white/10 opacity-60"}`}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-28 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-black/50">
                                    <img
                                        src={`https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`}
                                        alt={ep.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = "https://placehold.co/320x180/0d1830/f97316?text=DEV"; }}
                                    />
                                    <div className="absolute top-1 left-1 bg-orange-500 text-black text-[9px] font-mono font-black px-1.5 py-0.5 rounded">{ep.episode}</div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-sans font-bold text-foreground text-sm line-clamp-1 mb-0.5">{ep.title}</div>
                                    <div className="text-[10px] font-mono text-muted-foreground">{ep.guest} · {ep.guestRole} · {ep.duration}</div>
                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                        <span className="text-[9px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">{ep.category}</span>
                                        {ep.featured && <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full uppercase">Featured</span>}
                                        {!ep.published && <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">Hidden</span>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => toggleField(ep, "published")} title={ep.published ? "Hide" : "Publish"} className="p-2 rounded-lg border border-border hover:border-neon-cyan/50 hover:text-neon-cyan text-muted-foreground transition-all">
                                        {ep.published ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                    <button onClick={() => toggleField(ep, "featured")} title={ep.featured ? "Unfeature" : "Feature"} className="p-2 rounded-lg border border-border hover:border-yellow-500/50 hover:text-yellow-400 text-muted-foreground transition-all">
                                        {ep.featured ? <Star size={14} className="fill-yellow-400 text-yellow-400" /> : <StarOff size={14} />}
                                    </button>
                                    <a href={`https://youtube.com/watch?v=${ep.youtubeId}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-border hover:border-orange-500/50 hover:text-orange-400 text-muted-foreground transition-all">
                                        <ExternalLink size={14} />
                                    </a>
                                    <button onClick={() => handleEdit(ep)} className="p-2 rounded-lg border border-border hover:border-neon-cyan/50 hover:text-neon-cyan text-muted-foreground transition-all">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(ep.id)} className="p-2 rounded-lg border border-border hover:border-red-500/50 hover:text-red-400 text-muted-foreground transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {episodes.length === 0 && (
                            <div className="text-center py-20 border border-dashed border-border rounded-2xl">
                                <Mic size={40} className="text-muted-foreground mx-auto mb-4 opacity-30" />
                                <p className="font-mono text-muted-foreground text-sm">No episodes yet. Add your first one!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── ADD/EDIT FORM MODAL ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-card-bg border border-orange-500/20 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.1)] max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <h2 className="font-black font-sans text-xl text-orange-400 uppercase italic">{editingId ? "EDIT EPISODE" : "ADD EPISODE"}</h2>
                                <button onClick={() => setShowForm(false)} className="p-2 text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                <Field label="Episode Number" placeholder="EP.01" value={form.episode} onChange={v => setForm(f => ({ ...f, episode: v }))} />
                                <Field label="Title *" placeholder="How we built X in 48 hours..." value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
                                <Field label="YouTube URL or ID *" placeholder="https://youtube.com/watch?v=... or just the ID" value={form.youtubeUrl} onChange={v => setForm(f => ({ ...f, youtubeUrl: v }))} />
                                <TextareaField label="Description" placeholder="What's this episode about?" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />

                                <div>
                                    <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-2">Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                                                className={`px-3 py-2 rounded-lg text-[10px] font-mono font-black text-left transition-all ${form.category === cat.id ? "bg-orange-500 text-black" : "bg-card-bg border border-border text-muted-foreground"}`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Guest Name" placeholder="Arjun Mehta" value={form.guest} onChange={v => setForm(f => ({ ...f, guest: v }))} />
                                    <Field label="Guest Role" placeholder="Founder, SnapStack" value={form.guestRole} onChange={v => setForm(f => ({ ...f, guestRole: v }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Duration" placeholder="52 min" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} />
                                    <Field label="Tags (comma-separated)" placeholder="saas, hackathon, startup" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} />
                                </div>

                                {/* YouTube Preview */}
                                {form.youtubeUrl && (
                                    <div>
                                        <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-2">Thumbnail Preview</label>
                                        <img
                                            src={`https://img.youtube.com/vi/${getYoutubeId(form.youtubeUrl)}/mqdefault.jpg`}
                                            alt="preview"
                                            className="w-48 h-27 object-cover rounded-xl border border-border"
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <Toggle label="Published" checked={form.published} onChange={v => setForm(f => ({ ...f, published: v }))} />
                                    <Toggle label="Featured" checked={form.featured} onChange={v => setForm(f => ({ ...f, featured: v }))} />
                                </div>
                            </div>

                            <div className="p-6 border-t border-border flex justify-end gap-3">
                                <button onClick={() => setShowForm(false)} className="px-6 py-3 font-mono text-[11px] text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.title || !form.youtubeUrl}
                                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black font-mono text-[11px] uppercase tracking-widest px-8 py-3 rounded-xl transition-all"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {editingId ? "SAVE CHANGES" : "PUBLISH EPISODE"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── DELETE CONFIRM ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card-bg border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center">
                            <Trash2 size={32} className="text-red-400 mx-auto mb-4" />
                            <h3 className="font-black font-sans text-foreground text-xl mb-2">Delete Episode?</h3>
                            <p className="font-mono text-muted-foreground text-sm mb-6">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-border text-muted-foreground font-mono text-xs rounded-xl hover:text-white transition-colors">Cancel</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-500 text-white font-black font-mono text-xs rounded-xl hover:bg-red-400 transition-colors">DELETE</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Field({ label, placeholder, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:outline-none transition-colors"
            />
        </div>
    );
}

function TextareaField({ label, placeholder, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:outline-none transition-colors resize-none"
            />
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-all ${checked ? "bg-orange-500" : "bg-border"}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-[11px] font-mono font-black text-foreground uppercase tracking-widest">{label}</span>
        </label>
    );
}
