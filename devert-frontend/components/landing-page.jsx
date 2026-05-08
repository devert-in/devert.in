"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Code, Rocket, Target, Users, Zap, Briefcase, Terminal, Database, Network, LayoutTemplate, Github, Play, Quote } from "lucide-react";

export function LandingPage({ hasShownIntro }) {
    const fadeIn = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const stagger = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    return (
        <section className="min-h-screen pt-28 pb-32 px-4 md:px-8 relative overflow-hidden flex flex-col items-center font-sans">
            
            {/* --- PREMIUM BACKGROUND --- */}
            <div className="absolute inset-0 bg-[#060A14] z-0"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)]"></div>
            
            <div className="absolute top-[0%] right-[20%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>
            <div className="absolute top-[40%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>

            <div className="max-w-[1400px] w-full mx-auto relative z-10 flex flex-col gap-8">
                
                {/* --- MICRO HERO ENTRY --- */}
                <motion.div 
                    initial="hidden"
                    animate={hasShownIntro ? "visible" : "hidden"}
                    variants={stagger}
                    className="flex flex-col md:flex-row md:items-stretch justify-between gap-8 pb-8 pt-4 border-b border-white/5"
                >
                    <div className="space-y-4 max-w-3xl flex-1 flex flex-col justify-end pb-4">
                        <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-max">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
                            </span>
                            <span className="text-[10px] font-mono font-medium tracking-wide text-cyan-400 uppercase">System Online // Tier 2 & 3 Builders</span>
                        </motion.div>
                        <motion.h1 variants={fadeIn} className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                            DeVert is not for learners. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">It's for builders.</span>
                        </motion.h1>
                        <motion.p variants={fadeIn} className="text-sm md:text-base text-gray-400 leading-relaxed font-medium">
                            The definitive ecosystem replacing "tutorial hell" with raw execution. Master DSA, architect backend systems, dominate hackathons, and crack product-based companies.
                        </motion.p>
                    </div>
                    {/* TECH ROADMAPS (Roadmaps Card - HERO TOP RIGHT) */}
                    <Link href="/tracks" className="w-full md:w-[480px] xl:w-[550px] block md:self-stretch">
                        <motion.div variants={fadeIn} className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/30 backdrop-blur-md h-full flex flex-col justify-between overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_70%)] opacity-50"></div>
                            
                            <div className="flex flex-col relative z-10 mb-6">
                                <h3 className="text-3xl md:text-4xl font-black text-indigo-400 mb-2 tracking-tight flex items-center gap-2 uppercase italic">
                                     DeVert Tracks.
                                </h3>
                                <p className="text-sm text-indigo-100/70 font-medium leading-relaxed max-w-[300px]">
                                    Choose a track. Build real skills. Become a DeVert.
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-indigo-500/20">
                                <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">View Tracks &gt;_</span>
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex flex-shrink-0 items-center justify-center border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>

                {/* --- MEGA BENTO BOX GRID --- */}
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[220px] grid-flow-dense"
                >

                    {/* PILLAR 1: EXECUTION (Large Feature Card) */}
                    <Link href="/execution" className="md:col-span-2 lg:col-span-3 md:row-span-2 block group">
                        <motion.div variants={fadeIn} className="relative p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md h-full transition-all duration-300 hover:border-cyan-500/40 hover:bg-white/[0.06] overflow-hidden flex flex-col justify-between">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                                    <Code size={24} />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Execution Engine</h3>
                                <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                                    Weekly targeted Java DSA challenges, "Build in Public" real-world backend sprints, and AI system architecture roadmaps.
                                </p>
                            </div>
                            
                            {/* Decorative Code element inside card */}
                            <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-60 transition-opacity duration-300">
                                <pre className="text-xs font-mono text-cyan-400 select-none">
                                    <code>{`public void scale() {\n  while(true) {\n    build();\n  }\n}`}</code>
                                </pre>
                            </div>
                            
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 group-hover:gap-4 transition-all">
                                Enter Framework <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    </Link>

                    {/* CTA "JOIN MOVEMENT" (Accent Card) */}
                    <Link href="/join" className="md:col-span-2 lg:col-span-2 md:row-span-1 block group">
                        <motion.div variants={fadeIn} className="relative p-8 rounded-[2rem] bg-cyan-500 overflow-hidden h-full flex items-center justify-between shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.4)] transition-all hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-transparent"></div>
                            <div>
                                <h3 className="text-2xl font-black text-black tracking-tight mb-1">Start Initializing.</h3>
                                <p className="text-black/70 text-sm font-medium">Limited Founding Member Spots</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:rotate-45 transition-transform duration-300 shadow-xl">
                                <ArrowRight className="text-cyan-500" size={20} />
                            </div>
                        </motion.div>
                    </Link>

                    {/* BRUTAL TRUTH QUOTE (Info Card) */}
                    <motion.div variants={fadeIn} className="md:col-span-2 lg:col-span-1 md:row-span-1 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm h-full flex flex-col justify-center relative group">
                        <Quote className="absolute top-4 right-4 text-white/5" size={40} />
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">The Brutal Truth</h4>
                        <p className="text-sm text-gray-300 italic font-medium leading-relaxed">
                            "Tutorial completion certificates are worthless if you can't architect a system from scratch."
                        </p>
                    </motion.div>

                    {/* PILLAR 2: HACKATHONS (Medium Feature Card) */}
                    <Link href="/hackathons" className="md:col-span-2 lg:col-span-3 md:row-span-2 block group">
                        <motion.div variants={fadeIn} className="relative p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md h-full transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.06] overflow-hidden flex flex-col justify-between">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Hackathon Culture</h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                                    Match with specialized teammates. Execute rapid validation frameworks, get codebase boilerplates, and deploy winning startup pitches.
                                </p>
                            </div>
                            
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 group-hover:gap-4 transition-all">
                                Dominate Arena <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    </Link>

                    {/* PILLAR 3: PLACEMENT (Medium Feature Card) */}
                    <Link href="/placements" className="md:col-span-2 lg:col-span-2 md:row-span-1 block group">
                        <motion.div variants={fadeIn} className="relative p-6 px-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-md h-full transition-all duration-300 hover:border-orange-500/40 hover:bg-white/[0.06] flex items-center justify-between">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex flex-col relative z-10">
                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                                    <Briefcase size={16} className="text-orange-500"/> Placement Prep
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Roadmaps, mock interviews, & strict resume tear-downs.</p>
                            </div>
                            <ArrowRight size={18} className="text-gray-500 group-hover:text-orange-500 group-hover:translate-x-2 transition-all relative z-10"/>
                        </motion.div>
                    </Link>

                    {/* PILLAR 4: NETWORKING (Medium Feature Card) */}
                    <Link href="/networking" className="md:col-span-2 lg:col-span-2 md:row-span-1 block group">
                        <motion.div variants={fadeIn} className="relative p-6 px-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-md h-full transition-all duration-300 hover:border-blue-500/40 hover:bg-white/[0.06] flex items-center justify-between">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex flex-col relative z-10">
                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">
                                    <Users size={16} className="text-blue-500"/> Elite Networking
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">Accountability groups & direct access to industry seniors.</p>
                            </div>
                            <ArrowRight size={18} className="text-gray-500 group-hover:text-blue-500 group-hover:translate-x-2 transition-all relative z-10"/>
                        </motion.div>
                    </Link>

                    {/* STATS / IMPACT CARD (Info Box) */}
                    <motion.div variants={fadeIn} className="md:col-span-2 lg:col-span-1 md:row-span-1 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm h-full flex flex-col justify-center gap-2 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"><Rocket size={100} /></div>
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest relative z-10">End Goal</div>
                        <div className="text-3xl font-bold text-white flex items-center gap-3 relative z-10">
                            0 &rarr; 1 
                        </div>
                        <p className="text-xs text-gray-400 relative z-10">Student to Architect.</p>
                    </motion.div>

                    {/* NEW KILLER FEATURE: PROOF OF WORK PORTFOLIO */}
                    <Link href="/proof-of-work" className="md:col-span-4 lg:col-span-4 md:row-span-1 block group">
                        <motion.div variants={fadeIn} className="relative p-6 px-8 rounded-[2rem] bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-md h-full transition-all duration-300 hover:border-purple-500/50 hover:bg-white/[0.06] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(168,85,247,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="flex-1 max-w-xl relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                                    <LayoutTemplate className="text-purple-400" size={24}/> Unified Proof of Work
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Ditch the traditional resume. DeVert auto-generates a dynamic, verifiable profile showcasing your DSA rankings, deployed architectures, and hackathon victories directly to technical recruiters.
                                </p>
                            </div>
                            
                            <div className="relative z-10 flex items-center gap-2 px-5 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:bg-purple-500 group-hover:text-white transition-all whitespace-nowrap">
                                Claim Profile <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    </Link>

                </motion.div>
            </div>
        </section>
    );
}
