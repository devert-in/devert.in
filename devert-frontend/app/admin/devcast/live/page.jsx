"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Radio, Mic, Play, Square, Save, Trash2, Pin, Star,
    StarOff, Eye, EyeOff, Loader2, X, Clock, Users, Zap
} from "lucide-react";
import { doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EMPTY_SESSION = {
    isLive: false,
    title: "",
    topic: "",
    youtubeStreamId: "",
    guest: "",
    guestRole: "",
    guestBio: "",
    category: "startup-stories",
    scheduledTitle: "",
    scheduledGuest: "",
    scheduledAt: "",
};

const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\s?]+)/);
    return match ? match[1] : url.trim();
};

export default function AdminDevcastLivePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [session, setSession] = useState(EMPTY_SESSION);
    const [form, setForm] = useState(EMPTY_SESSION);
    const [questions, setQuestions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [goingLive, setGoingLive] = useState(false);

    useEffect(() => {
        if (user?.email !== "admin@devert.in") { router.replace("/"); return; }

        const unsub = onSnapshot(doc(db, "devcast_live", "current"), (snap) => {
            const data = snap.exists() ? snap.data() : EMPTY_SESSION;
            setSession(data);
            setForm(data);
            setLoading(false);
        });
        return () => unsub();
    }, [user]);

    useEffect(() => {
        const q = query(collection(db, "devcast_live", "current", "questions"), orderBy("upvotes", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const saveSession = async () => {
        setSaving(true);
        try {
            const youtubeStreamId = getYoutubeId(form.youtubeStreamId || "");
            await setDoc(doc(db, "devcast_live", "current"), {
                ...form,
                youtubeStreamId,
                updatedAt: serverTimestamp(),
            });
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const toggleLive = async () => {
        setGoingLive(true);
        try {
            const youtubeStreamId = getYoutubeId(form.youtubeStreamId || "");
            await setDoc(doc(db, "devcast_live", "current"), {
                ...form,
                youtubeStreamId,
                isLive: !session.isLive,
                ...((!session.isLive) ? { startedAt: serverTimestamp() } : { endedAt: serverTimestamp() }),
                updatedAt: serverTimestamp(),
            });
        } catch (e) { console.error(e); }
        finally { setGoingLive(false); }
    };

    const togglePin = async (q) => {
        await updateDoc(doc(db, "devcast_live", "current", "questions", q.id), { isPinned: !q.isPinned });
    };

    const toggleAnswered = async (q) => {
        await updateDoc(doc(db, "devcast_live", "current", "questions", q.id), { isAnswered: !q.isAnswered });
    };

    const deleteQuestion = async (id) => {
        await deleteDoc(doc(db, "devcast_live", "current", "questions", id));
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
            <Loader2 size={32} className="text-orange-400 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 pb-20">
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${session.isLive ? "bg-red-500/15 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "bg-orange-500/10 border-orange-500/30"}`}>
                            <Radio size={20} className={session.isLive ? "text-red-400 animate-pulse" : "text-orange-400"} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black font-sans italic tracking-tighter text-foreground uppercase">
                                Live <span className={session.isLive ? "text-red-400" : "text-orange-400"}>Broadcast</span> Control
                            </h1>
                            <div className={`text-[10px] font-mono font-black uppercase tracking-widest ${session.isLive ? "text-red-400" : "text-muted-foreground"}`}>
                                {session.isLive ? "🔴 LIVE NOW" : "⚫ OFFLINE"}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/devcast/live" target="_blank" className="flex items-center gap-2 px-4 py-2.5 border border-border text-muted-foreground hover:text-orange-400 hover:border-orange-500/30 font-mono text-[11px] uppercase tracking-widest rounded-xl transition-all font-black">
                            <Eye size={14} /> Preview
                        </Link>
                        <button
                            onClick={toggleLive}
                            disabled={goingLive}
                            className={`flex items-center gap-2 px-6 py-2.5 font-black font-mono text-[11px] uppercase tracking-widest rounded-xl transition-all ${session.isLive
                                    ? "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                    : "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                }`}
                        >
                            {goingLive ? <Loader2 size={14} className="animate-spin" /> : session.isLive ? <><Square size={14} /> END BROADCAST</> : <><Play size={14} /> GO LIVE</>}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ─ LEFT: Session Setup ─ */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-card-bg border border-border rounded-2xl p-6">
                            <div className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-5">// Session Details</div>

                            <div className="space-y-4">
                                <AdminField label="Stream Title" placeholder="Interview with Arjun Mehta" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
                                <AdminField label="YouTube Live URL or Stream ID" placeholder="https://youtube.com/live/... or stream ID" value={form.youtubeStreamId} onChange={v => setForm(f => ({ ...f, youtubeStreamId: v }))} />
                                <AdminTextarea label="Topic / Description" placeholder="What are we talking about today?" value={form.topic} onChange={v => setForm(f => ({ ...f, topic: v }))} />

                                {/* YouTube preview */}
                                {form.youtubeStreamId && (
                                    <div className="rounded-xl overflow-hidden border border-border aspect-video bg-black">
                                        <iframe
                                            src={`https://www.youtube.com/embed/${getYoutubeId(form.youtubeStreamId)}?rel=0`}
                                            className="w-full h-full"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div className="bg-card-bg border border-border rounded-2xl p-6">
                            <div className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-5">// Guest Details</div>
                            <div className="space-y-4">
                                <AdminField label="Guest Name" placeholder="Arjun Mehta" value={form.guest} onChange={v => setForm(f => ({ ...f, guest: v }))} />
                                <AdminField label="Guest Role" placeholder="Founder, SnapStack" value={form.guestRole} onChange={v => setForm(f => ({ ...f, guestRole: v }))} />
                                <AdminTextarea label="Guest Bio" placeholder="Short description about the guest..." value={form.guestBio} onChange={v => setForm(f => ({ ...f, guestBio: v }))} />
                            </div>
                        </div>

                        {/* Scheduled Session */}
                        <div className="bg-card-bg border border-border rounded-2xl p-6">
                            <div className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-5">// Schedule Next Broadcast (shows when offline)</div>
                            <div className="space-y-4">
                                <AdminField label="Upcoming Session Title" placeholder="Startup Postmortem: What went wrong?" value={form.scheduledTitle} onChange={v => setForm(f => ({ ...f, scheduledTitle: v }))} />
                                <AdminField label="Upcoming Guest" placeholder="Guest Name" value={form.scheduledGuest} onChange={v => setForm(f => ({ ...f, scheduledGuest: v }))} />
                                <div>
                                    <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Scheduled Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={form.scheduledAt}
                                        onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:border-orange-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={saveSession}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-black font-black font-mono text-[11px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            SAVE SESSION CONFIG
                        </button>
                    </div>

                    {/* ─ RIGHT: Live Q&A Moderation ─ */}
                    <div className="bg-card-bg border border-border rounded-2xl overflow-hidden flex flex-col max-h-[800px]">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest">Live Q&A Moderation</div>
                                <div className="text-foreground font-black text-sm mt-0.5">{questions.length} Questions</div>
                            </div>
                            {!session.isLive && (
                                <div className="text-[9px] font-mono text-muted-foreground bg-card-bg border border-border px-2 py-1 rounded-lg">Go live to receive questions</div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                            {questions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-40">
                                    <Mic size={24} className="text-muted-foreground" />
                                    <p className="text-muted-foreground font-mono text-xs">No questions yet</p>
                                </div>
                            ) : questions.map((q) => (
                                <div
                                    key={q.id}
                                    className={`rounded-xl p-3 border text-xs transition-all ${q.isPinned
                                            ? "border-orange-500/40 bg-orange-500/8"
                                            : q.isAnswered
                                                ? "border-neon-green/20 bg-neon-green/5 opacity-50"
                                                : "border-border bg-background/40"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-mono font-black text-[10px] text-foreground">{q.author}</span>
                                                <span className="text-[9px] font-mono text-orange-400 font-black">▲ {q.upvotes || 0}</span>
                                                {q.isPinned && <span className="text-[8px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20 uppercase font-black">📌 Pinned</span>}
                                                {q.isAnswered && <span className="text-[8px] font-mono text-neon-green bg-neon-green/10 px-1.5 py-0.5 rounded-full border border-neon-green/20 uppercase font-black">✓ Done</span>}
                                            </div>
                                            <p className="text-foreground font-sans leading-snug">{q.text}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                                        <button onClick={() => togglePin(q)} className={`flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-1 rounded-lg transition-all ${q.isPinned ? "text-orange-400 bg-orange-500/10 border border-orange-500/20" : "text-muted-foreground hover:text-orange-400 border border-border"}`}>
                                            <Pin size={9} /> {q.isPinned ? "Unpin" : "Pin"}
                                        </button>
                                        <button onClick={() => toggleAnswered(q)} className={`flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-1 rounded-lg transition-all ${q.isAnswered ? "text-neon-green bg-neon-green/10 border border-neon-green/20" : "text-muted-foreground hover:text-neon-green border border-border"}`}>
                                            <Star size={9} /> {q.isAnswered ? "Undo" : "Answered"}
                                        </button>
                                        <button onClick={() => deleteQuestion(q.id)} className="flex items-center gap-1 text-[9px] font-mono font-black uppercase px-2 py-1 rounded-lg text-muted-foreground hover:text-red-400 border border-border hover:border-red-500/30 transition-all ml-auto">
                                            <Trash2 size={9} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminField({ label, placeholder, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
            <input type="text" placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:outline-none transition-colors" />
        </div>
    );
}

function AdminTextarea({ label, placeholder, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block mb-1.5">{label}</label>
            <textarea placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-orange-500/50 focus:outline-none transition-colors resize-none" />
        </div>
    );
}
