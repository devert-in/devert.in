"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Users, Crosshair, Rocket, Calendar, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/context/AuthContext";

export function MainFeed({ hasShownIntro }) {
    const { user, userData } = useAuth();
    const displayName = userData?.displayName || user?.email?.split('@')[0] || "OPERATIVE";
    const [featuredHackathon, setFeaturedHackathon] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const q = query(
                    collection(db, "hackathons"),
                    where("isFeatured", "==", true),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setFeaturedHackathon({ id: querySnapshot.docs[0].id, ...docData });
                } else {
                    setFeaturedHackathon(null);
                }
            } catch (error) {
                console.error("Error fetching featured hackathon:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeatured();
    }, []);

    const getLink = (hack) => {
        if (!hack) return "/hackathons";
        // If it looks like an internal route, use it. Otherwise assume generic detail page or external link.
        // For 'DeVert Innovation Challenge', we likely want '/challenge' or '/hackathons/id'
        // But since we want to give admin control, let's use the ID for detail page unless it's a known special case.
        // Actually, the seed data uses external links for some.
        // Let's prefer the internal detail page for all "COMMUNITY_CONTEST" types fetched from DB, 
        // unless registrationLink is explicitly an internal path like '/challenge'.

        if (hack.registrationLink && hack.registrationLink.startsWith("/")) return hack.registrationLink;
        return `/hackathons/${hack.id}`;
    };

    return (
        <section className="pt-24 pb-12 px-4 min-h-[60vh] flex flex-col justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: hasShownIntro ? 0 : 0.5 }}
                    className="mb-8 border-b border-white/10 pb-4 flex flex-col md:flex-row justify-between items-end"
                >
                    <div>
                        <p className="font-mono text-neon-cyan text-xs mb-1 tracking-widest">// IMPACT_ENGINE_ONLINE</p>
                        <h1 className="text-3xl md:text-5xl font-bold font-sans text-white">
                            {user ? (
                                <>WELCOME BACK, <span className="text-neon-green">{displayName.toUpperCase()}</span></>
                            ) : (
                                <>SYSTEM STATUS: <span className="text-neon-green">ONLINE</span></>
                            )}
                        </h1>
                        <p className="text-gray-400 font-mono text-sm mt-2">Don't just code. Solve real-world problems.</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-mono text-[10px] mt-2 md:mt-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                        </span>
                        {user ? "OPERATIVE_ACTIVE" : "LIVE_FEED_ACTIVE"}
                    </div>
                </motion.div>

                {/* Featured Operation Hero Banner */}
                {featuredHackathon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-12 relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">

                            {/* Background Effect */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

                            <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex h-2 w-2 relative">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold tracking-widest ${featuredHackathon.status === 'OPEN' ? 'text-neon-green' : 'text-red-500'}`}>
                                        {featuredHackathon.status === 'OPEN' ? 'SQUAD_REGISTRATION_OPEN' : 'PRIORITY_BROADCAST'}
                                    </span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold font-sans text-white mb-2 max-w-lg">
                                    {featuredHackathon.title}
                                </h2>
                                <p className="text-gray-400 font-mono text-xs md:text-sm max-w-xl h-20 overflow-hidden text-ellipsis">
                                    {featuredHackathon.description}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-4 relative z-10 w-full md:w-auto">
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="text-center px-4 py-2 bg-white/5 border border-white/10 rounded min-w-[100px]">
                                        <div className="text-lg font-bold text-white font-sans">{featuredHackathon.status}</div>
                                        <div className="text-[9px] text-gray-500 font-mono">STATUS</div>
                                    </div>
                                    {featuredHackathon.startDate && (
                                        <div className="text-center px-4 py-2 bg-white/5 border border-white/10 rounded min-w-[100px] hidden md:block">
                                            <div className="text-lg font-bold text-white font-sans">{new Date(featuredHackathon.startDate).getDate()}</div>
                                            <div className="text-[9px] text-gray-500 font-mono">
                                                {new Date(featuredHackathon.startDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Link
                                    href={getLink(featuredHackathon)}
                                    // Handle external links vs internal routes
                                    target={featuredHackathon.registrationLink?.startsWith("http") ? "_blank" : "_self"}
                                    className="w-full md:w-auto px-8 py-3 bg-white text-black font-bold font-mono text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] text-center"
                                >
                                    <Rocket size={16} /> {featuredHackathon.status === 'OPEN' ? 'INITIATE_PROTOCOL' : 'VIEW_DOSSIER'}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Operations Card (Vision 1) */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.1 }}
                        className="bg-white/5 border border-white/10 p-6 hover:border-neon-green/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 rounded-bl-full -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="px-2 py-0.5 bg-neon-green/10 text-neon-green text-[10px] font-mono rounded border border-neon-green/20">
                                PRIORITY: HIGH
                            </div>
                            <Crosshair className="text-gray-500 group-hover:text-neon-green transition-colors" size={24} />
                        </div>

                        <h2 className="text-2xl font-bold font-sans mb-1 text-white">Active Operations</h2>
                        <p className="text-gray-400 font-mono text-xs mb-4">Solve real problems for local businesses & NGOs. Build a portfolio that actually matters.</p>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span>LIVE QUESTS: 12</span>
                            <span>//</span>
                            <span>IMPACT: CERTIFIED</span>
                        </div>

                        <Link href="/hackathons" className="inline-flex items-center text-neon-green text-xs font-bold font-mono group-hover:translate-x-2 transition-transform">
                            BROWSE_QUESTS <ArrowRight size={14} className="ml-2" />
                        </Link>
                    </motion.div>

                    {/* Incubator Card (Vision 2) */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.2 }}
                        className="bg-white/5 border border-white/10 p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono rounded border border-purple-500/20">
                                INNOVATION_LAB
                            </div>
                            <Rocket className="text-gray-500 group-hover:text-purple-400 transition-colors" size={24} />
                        </div>

                        <h2 className="text-2xl font-bold font-sans mb-1 text-white">Idea Incubator</h2>
                        <p className="text-gray-400 font-mono text-xs mb-4">Have a moonshot idea? Submit it. We build it together. Equity for everyone.</p>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span>SUBMISSIONS: 84</span>
                            <span>//</span>
                            <span>LAUNCHES: 3</span>
                        </div>

                        <Link href="/contests" className="inline-flex items-center text-purple-400 text-xs font-bold font-mono group-hover:translate-x-2 transition-transform">
                            SUBMIT_BLUEPRINT <ArrowRight size={14} className="ml-2" />
                        </Link>
                    </motion.div>

                    {/* Squadron Card */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.3 }}
                        className="bg-white/5 border border-white/10 p-6 hover:border-neon-cyan/50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-mono rounded border border-neon-cyan/20">
                                TEAM_MATCHMAKING
                            </div>
                            <Users className="text-gray-500 group-hover:text-neon-cyan transition-colors" size={20} />
                        </div>

                        <h2 className="text-2xl font-bold font-sans mb-1">Squadron Uplink</h2>
                        <p className="text-gray-400 font-mono text-xs mb-4">Find your perfect teammate based on Tech Stack compatibility. Stop solo-queuing hackathons.</p>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span>OPERATIVES: 1,204</span>
                            <span>//</span>
                            <span>STATUS: LIVE</span>
                        </div>

                        <Link href="/squadron" className="inline-flex items-center text-neon-cyan text-xs font-bold font-mono group-hover:translate-x-2 transition-transform">
                            FIND_TEAM <ArrowRight size={14} className="ml-2" />
                        </Link>
                    </motion.div>

                    {/* Mercenary Board Card */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.4 }}
                        className="bg-white/5 border border-white/10 p-6 hover:border-yellow-500/50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-mono rounded border border-yellow-500/20">
                                ACTIVE_CONTRACTS
                            </div>
                            <Play className="text-gray-500 group-hover:text-yellow-500 transition-colors" size={20} />
                        </div>

                        <h2 className="text-2xl font-bold font-sans mb-1">Mercenary Board</h2>
                        <p className="text-gray-400 font-mono text-xs mb-4">Complete micro-tasks and earn instant rewards. Your skills, monetized.</p>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span>POOL: ₹1.2L+</span>
                            <span>//</span>
                            <span>OPEN TASKS: 42</span>
                        </div>

                        <Link href="/bounties" className="inline-flex items-center text-yellow-500 text-xs font-bold font-mono group-hover:translate-x-2 transition-transform">
                            VIEW_CONTRACTS <ArrowRight size={14} className="ml-2" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
