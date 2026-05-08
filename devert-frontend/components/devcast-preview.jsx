"use client";

import { motion } from "framer-motion";
import { Mic, Play, ArrowRight, Headphones, Radio, Zap } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORY_CONFIG = {
    "startup-stories":   { label: "Startup Stories",    color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
    "hackathon-debrief": { label: "Hackathon Debrief",  color: "text-neon-cyan",   bg: "bg-neon-cyan/10",   border: "border-neon-cyan/20" },
    "postmortems":       { label: "Postmortem",         color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
    "builder-journeys":  { label: "Builder Journey",    color: "text-neon-green",  bg: "bg-neon-green/10",  border: "border-neon-green/20" },
};

const PLACEHOLDER_EPISODES = [
    {
        id: "ep1",
        title: "We Built a SaaS in 72 Hours — Here's What Happened",
        description: "Three founders, one weekend, zero sleep. The behind-the-scenes of launching under brutal hackathon pressure.",
        youtubeId: "dQw4w9WgXcQ",
        category: "hackathon-debrief",
        guest: "Arjun Mehta",
        guestRole: "Founder, SnapStack",
        duration: "52 min",
        episode: "EP.01",
    },
    {
        id: "ep2",
        title: "My Startup Failed in 6 Months — The Real Story",
        description: "We raised ₹40L, had 1000 users, and still shut down. Every mistake in brutal, honest detail.",
        youtubeId: "dQw4w9WgXcQ",
        category: "postmortems",
        guest: "Rahul Gupta",
        guestRole: "Ex-Founder",
        duration: "1h 8min",
        episode: "EP.02",
    },
    {
        id: "ep3",
        title: "Solo Dev to ₹8L MRR — No VC, No Team, No Excuses",
        description: "Built alone, no funding, full-time job on the side. This is how she made it work.",
        youtubeId: "dQw4w9WgXcQ",
        category: "builder-journeys",
        guest: "Priya Sharma",
        guestRole: "Indie Hacker",
        duration: "44 min",
        episode: "EP.03",
    },
];

export function DevcastPreview() {
    const [episodes, setEpisodes] = useState(PLACEHOLDER_EPISODES);

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                const q = query(
                    collection(db, "devcast_episodes"),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc"),
                    limit(3)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (e) {
                // fall back to placeholder
            }
        };
        fetchEpisodes();
    }, []);

    return (
        <section className="py-16 px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-orange-500/6 rounded-full blur-[140px]" />
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6"
                >
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                                <Mic size={22} className="text-orange-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-mono text-orange-400 uppercase tracking-[0.3em] font-black mb-0.5">DeVert Presents</div>
                                <h2 className="text-4xl md:text-6xl font-black font-sans uppercase italic tracking-tighter leading-none text-foreground">
                                    DEV<span className="text-orange-400">CAST</span>
                                </h2>
                            </div>
                        </div>
                        <p className="text-muted-foreground font-mono text-sm max-w-xl leading-relaxed">
                            Raw, unfiltered builder stories. Startup wins, hackathon chaos, brutal postmortems — real people, real code, real results.
                        </p>

                        {/* Live badge */}
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
                                </span>
                                <span className="text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest">New Episode Weekly</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                                <Zap size={10} className="text-orange-400" />
                                YouTube · Free · No Fluff
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/devcast"
                        className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-widest text-orange-400 hover:text-black border border-orange-500/40 hover:border-orange-400 hover:bg-orange-400 px-6 py-3 rounded-xl transition-all whitespace-nowrap bg-orange-500/5 self-start md:self-auto"
                    >
                        ALL EPISODES <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Episode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {episodes.map((ep, idx) => {
                        const cat = CATEGORY_CONFIG[ep.category] || CATEGORY_CONFIG["builder-journeys"];
                        return (
                            <motion.div
                                key={ep.id}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group"
                            >
                                <Link href={`/devcast?ep=${ep.id}`}>
                                    <div className="relative bg-card-bg border border-border rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all duration-300 shadow-premium hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)]">
                                        {/* YouTube Thumbnail */}
                                        <div className="relative aspect-video bg-black/60 overflow-hidden">
                                            <img
                                                src={`https://img.youtube.com/vi/${ep.youtubeId}/maxresdefault.jpg`}
                                                alt={ep.title}
                                                className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                                onError={(e) => { e.target.src = "https://placehold.co/640x360/0d1830/22d3ee?text=DEVCAST"; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] group-hover:scale-110 transition-transform duration-300">
                                                    <Play size={22} className="text-black fill-black ml-1" />
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white font-bold">
                                                {ep.duration}
                                            </div>
                                            {/* Episode number */}
                                            <div className="absolute top-2 left-2 bg-orange-500 px-2 py-0.5 rounded text-[10px] font-mono text-black font-black">
                                                {ep.episode}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest mb-3 ${cat.bg} ${cat.border} border ${cat.color}`}>
                                                {cat.label}
                                            </div>
                                            <h3 className="font-sans font-bold text-foreground text-sm leading-snug mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors duration-200">
                                                {ep.title}
                                            </h3>
                                            <p className="text-muted-foreground text-[11px] font-mono leading-relaxed line-clamp-2 mb-4">
                                                {ep.description}
                                            </p>
                                            <div className="flex items-center gap-2 pt-3 border-t border-border">
                                                <div className="w-7 h-7 bg-orange-500/15 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Mic size={11} className="text-orange-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-sans font-bold text-foreground leading-none">{ep.guest}</div>
                                                    <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{ep.guestRole}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-8 flex items-center justify-center gap-4 pt-6 border-t border-border"
                >
                    <Radio size={14} className="text-orange-400 animate-pulse" />
                    <span className="text-muted-foreground text-[10px] font-mono tracking-[0.2em] uppercase">
                        New episodes every week · Watch free on YouTube · No sign-up required
                    </span>
                    <Headphones size={14} className="text-orange-400 animate-pulse" />
                </motion.div>
            </div>
        </section>
    );
}
