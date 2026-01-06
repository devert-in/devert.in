"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Radio, ArrowRight, Play } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function MainFeed({ hasShownIntro }) {
    const { user, userData } = useAuth();
    const displayName = userData?.displayName || user?.email?.split('@')[0] || "OPERATIVE";

    return (
        <section className="pt-32 pb-20 px-4 min-h-[80vh] flex flex-col justify-center relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: hasShownIntro ? 0 : 0.5 }}
                    className="mb-12 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-end"
                >
                    <div>
                        <p className="font-mono text-neon-cyan text-sm mb-2 tracking-widest">// DEVERT_HQ_DASHBOARD</p>
                        <h1 className="text-4xl md:text-6xl font-bold font-sans text-white">
                            {user ? (
                                <>WELCOME BACK, <span className="text-neon-green">{displayName.toUpperCase()}</span></>
                            ) : (
                                <>SYSTEM STATUS: <span className="text-neon-green">ONLINE</span></>
                            )}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 font-mono text-xs mt-4 md:mt-0">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                        </span>
                        {user ? "OPERATIVE_ACTIVE" : "LIVE_FEED_ACTIVE"}
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Event Card */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.2 }}
                        className="bg-white/5 border border-white/10 p-8 hover:border-neon-cyan/50 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan text-xs font-mono rounded border border-neon-cyan/20">
                                UPCOMING_HACKATHON
                            </div>
                            <Calendar className="text-gray-500 group-hover:text-neon-cyan transition-colors" size={24} />
                        </div>

                        <h2 className="text-3xl font-bold font-sans mb-2">Global AI Challenge 2026</h2>
                        <p className="text-gray-400 font-mono text-sm mb-6">Build autonomous agents. $50k Prize Pool. Team formation closing soon.</p>

                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-8">
                            <span>START: FEB 15</span>
                            <span>//</span>
                            <span>REMOTE</span>
                        </div>

                        <Link href="/hackathons" className="inline-flex items-center text-neon-cyan text-sm font-bold font-mono group-hover:translate-x-2 transition-transform">
                            REGISTER_NOW <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </motion.div>

                    {/* Live/Course Card */}
                    <motion.div
                        initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: hasShownIntro ? 0 : 0.4 }}
                        className="bg-white/5 border border-white/10 p-8 hover:border-purple-500/50 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-10 -mt-10"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-mono rounded border border-purple-500/20">
                                NEW_DROP
                            </div>
                            <Radio className="text-gray-500 group-hover:text-purple-400 transition-colors" size={24} />
                        </div>

                        <h2 className="text-3xl font-bold font-sans mb-2">Rust for Systems Programming</h2>
                        <p className="text-gray-400 font-mono text-sm mb-6">Memory safety without garbage collection. The future of backend infra.</p>

                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-8">
                            <span>MODULES: 08</span>
                            <span>//</span>
                            <span>ADVANCED</span>
                        </div>

                        <Link href="/courses" className="inline-flex items-center text-purple-400 text-sm font-bold font-mono group-hover:translate-x-2 transition-transform">
                            START_LEARNING <Play size={16} className="ml-2 fill-current" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
