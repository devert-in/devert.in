"use client";

import { motion } from "framer-motion";
import { LayoutTemplate, Github, ShieldCheck, Trophy, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";
import { StackMarquee } from "@/components/stack-marquee";

export default function ProofOfWorkPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#060A14] text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>
            
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-16 border-b border-white/5 pb-12 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <LayoutTemplate size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold font-sans tracking-tighter mb-4 text-white">
                        Proof of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Work.</span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        A resume is just text. DeVert auto-generates a dynamic, verifiable profile showcasing your DSA rankings, deployed architectures, and hackathon victories directly to technical recruiters.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
                        <Github className="text-purple-400 mb-4" size={28} />
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Codebase Verified</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Your profile automatically links and parses your GitHub commits on verified DeVert tier systems.</p>
                    </motion.div>
                    
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
                        <Trophy className="text-purple-400 mb-4" size={28} />
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">DSA & Ranking</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Display your weekly contest ratings alongside execution timings. Recruiters see your raw logical strength.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
                        <ShieldCheck className="text-purple-400 mb-4" size={28} />
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Technical Seal</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">No faked projects. Every architecture hosted is verified by the DeVert network before being labeled "Deployed".</p>
                    </motion.div>
                </div>

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center">
                    <Link href="/join" className="inline-flex items-center gap-3 px-10 py-5 bg-purple-500 text-white font-bold text-sm tracking-wide hover:bg-purple-400 transition-all rounded-full shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]">
                        CLAIM YOUR PROFILE <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>
            <div className="mt-24 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
