"use client";

import { motion } from "framer-motion";
import { Code, Terminal, Zap, Check, ChevronRight, Server, FileCode2 } from "lucide-react";
import Link from "next/link";
import { StackMarquee } from "@/components/stack-marquee";

export default function ExecutionPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#060A14] text-white font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>
            
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-16 border-b border-white/5 pb-12 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                        <Code size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
                        Learning + <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Execution.</span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Stop watching tutorials. Start shipping production code. Master Java DSA and build scalable backend & AI systems in public.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300">
                        <Terminal className="text-cyan-400 mb-6" size={32} />
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Weekly DSA Sprints</h2>
                        <ul className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed">
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400"><Check size={14}/></span>
                                Java-focused algorithmic challenges.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400"><Check size={14}/></span>
                                Real interview patterns, not competitive math.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400"><Check size={14}/></span>
                                Weekly leaderboards and breakdown sessions.
                            </li>
                        </ul>
                    </motion.div>
                    
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300">
                        <Server className="text-emerald-400 mb-6" size={32} />
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Build In Public</h2>
                        <ul className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed">
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400"><Check size={14}/></span>
                                Real-world Spring Boot architectures.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400"><Check size={14}/></span>
                                End-to-end AI/ML workflow integrations.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400"><Check size={14}/></span>
                                Document and push every commit publicly.
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
            <div className="mt-8 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
