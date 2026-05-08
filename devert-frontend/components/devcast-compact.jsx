"use client";

import { Mic, Play, ArrowRight, Headphones, Radio } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PLACEHOLDER = [
    {
        id: "ep1", episode: "EP.01",
        title: "We Built a SaaS in 72 Hours — Here's What Happened",
        youtubeId: "dQw4w9WgXcQ", guest: "Arjun Mehta", guestRole: "Founder, SnapStack",
        duration: "52 min", category: "hackathon-debrief",
    },
    {
        id: "ep2", episode: "EP.02",
        title: "My Startup Failed in 6 Months — The Real Story",
        youtubeId: "dQw4w9WgXcQ", guest: "Rahul Gupta", guestRole: "Ex-Founder, Layrd",
        duration: "1h 8min", category: "postmortems",
    },
];

export function DevcastCompact() {
    const [episodes, setEpisodes] = useState(PLACEHOLDER);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "devcast_live", "current"), (snap) => {
            setIsLive(snap.exists() && snap.data()?.isLive === true);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchEps = async () => {
            try {
                const q = query(
                    collection(db, "devcast_episodes"),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc"),
                    limit(2)
                );
                const snap = await getDocs(q);
                if (!snap.empty) setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { /* use placeholder */ }
        };
        fetchEps();
    }, []);

    return (
        <div className="relative flex flex-col h-full rounded-2xl overflow-hidden border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.07] via-card-bg to-transparent hover:border-orange-500/40 transition-all duration-500 shadow-premium p-6 min-h-[300px] group">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.12)_0%,transparent_65%)] pointer-events-none" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                        <Mic size={18} className="text-orange-400" />
                    </div>
                    <div>
                        <div className="text-[9px] font-mono text-orange-400/70 uppercase tracking-[0.3em] font-black leading-none mb-0.5">DeVert Presents</div>
                        <div className="text-2xl font-black font-sans italic tracking-tighter text-foreground leading-none">
                            DEV<span className="text-orange-400">CAST</span>
                        </div>
                    </div>
                </div>
            {/* Live badge or Weekly pulse */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border flex-shrink-0 flex-col items-end gap-1">
                    {isLive ? (
                        <Link href="/devcast/live" className="flex items-center gap-1.5 px-2 py-1 bg-red-500/15 border border-red-500/40 rounded-full animate-pulse">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                            </span>
                            <span className="text-[8px] font-mono text-red-400 font-black uppercase tracking-widest">LIVE</span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
                            </span>
                            <span className="text-[8px] font-mono text-orange-400 font-black uppercase tracking-widest">Weekly</span>
                        </div>
                    )}
                </div>
            </div>

            <p className="relative z-10 text-muted-foreground text-[11px] font-mono leading-relaxed mb-5">
                Real startup stories. Hackathon chaos. Brutal postmortems. <span className="text-foreground font-black">Raw & unfiltered.</span>
            </p>

            {/* Episode List */}
            <div className="relative z-10 flex flex-col gap-3 flex-1">
                {episodes.slice(0, 2).map((ep) => (
                    <Link
                        key={ep.id}
                        href={`/devcast?ep=${ep.id}`}
                        className="flex gap-3 items-center rounded-xl p-2.5 -mx-2 hover:bg-orange-500/5 border border-transparent hover:border-orange-500/10 transition-all group/ep"
                    >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-black/50">
                            <img
                                src={`https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`}
                                alt={ep.title}
                                className="w-full h-full object-cover opacity-65 group-hover/ep:opacity-100 transition-opacity duration-300"
                                onError={(e) => { e.target.src = "https://placehold.co/160x90/131f3a/f97316?text=DC"; }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-7 h-7 bg-orange-500/90 rounded-full flex items-center justify-center shadow-lg group-hover/ep:scale-110 transition-transform">
                                    <Play size={9} className="text-black fill-black ml-0.5" />
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono text-white px-1 rounded font-bold">{ep.duration}</div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-mono text-orange-400 font-black mb-0.5">{ep.episode}</div>
                            <div className="text-[11px] font-sans font-bold text-foreground line-clamp-2 leading-snug group-hover/ep:text-orange-400 transition-colors">{ep.title}</div>
                            <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{ep.guest} · {ep.guestRole}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* CTA */}
            {isLive ? (
                <Link
                    href="/devcast/live"
                    className="relative z-10 mt-5 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 border border-red-500 text-white px-4 py-3 rounded-xl font-mono font-black text-[11px] uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse"
                >
                    <Radio size={13} /> WATCH LIVE NOW
                    <ArrowRight size={12} />
                </Link>
            ) : (
                <Link
                    href="/devcast"
                    className="relative z-10 mt-5 flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 hover:border-orange-500 text-orange-400 hover:text-black px-4 py-3 rounded-xl font-mono font-black text-[11px] uppercase tracking-widest transition-all duration-300 group/cta"
                >
                    <Headphones size={13} className="group-hover/cta:scale-110 transition-transform" />
                    ALL EPISODES
                    <ArrowRight size={12} className="group-hover/cta:translate-x-0.5 transition-transform" />
                </Link>
            )}
        </div>
    );
}
