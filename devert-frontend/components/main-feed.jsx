"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Users, Crosshair } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function MainFeed({ hasShownIntro }) {
    const { user, userData } = useAuth();
    const displayName = userData?.displayName || user?.email?.split('@')[0] || "OPERATIVE";

    return (
        <section className="pt-24 pb-12 px-4 min-h-[60vh] flex flex-col justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <div className="max-w-5xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: hasShownIntro ? 0 : 0.5 }}
                    className="mb-8 border-b border-white/10 pb-4 flex flex-col md:flex-row justify-between items-end"
                >
                    <div>
                        <p className="font-mono text-neon-cyan text-xs mb-1 tracking-widest">// DEVERT_HQ_DASHBOARD</p>
                        <h1 className="text-3xl md:text-5xl font-bold font-sans text-white">
                            {user ? (
                                <>WELCOME BACK, <span className="text-neon-green">{displayName.toUpperCase()}</span></>
                            ) : (
                                <>SYSTEM STATUS: <span className="text-neon-green">ONLINE</span></>
                            )}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-mono text-[10px] mt-2 md:mt-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                        </span>
                        {user ? "OPERATIVE_ACTIVE" : "LIVE_FEED_ACTIVE"}
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Squadron Card */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.2 }}
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
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.4 }}
                        className="bg-white/5 border border-white/10 p-6 hover:border-yellow-500/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full -mr-8 -mt-8"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-mono rounded border border-yellow-500/20">
                                ACTIVE_CONTRACTS
                            </div>
                            <Crosshair className="text-gray-500 group-hover:text-yellow-500 transition-colors" size={20} />
                        </div>

                        <h2 className="text-2xl font-bold font-sans mb-1">Mercenary Board</h2>
                        <p className="text-gray-400 font-mono text-xs mb-4">Complete micro-tasks and earn instant rewards. Your skills, monetized.</p>

                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 mb-6">
                            <span>POOL: ₹1.2L+</span>
                            <span>//</span>
                            <span>OPEN TASKS: 42</span>
                        </div>

                        <Link href="/bounties" className="inline-flex items-center text-yellow-500 text-xs font-bold font-mono group-hover:translate-x-2 transition-transform">
                            VIEW_CONTRACTS <Play size={14} className="ml-2 fill-current" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
