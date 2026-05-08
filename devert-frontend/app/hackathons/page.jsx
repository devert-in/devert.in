"use client";

import { motion } from "framer-motion";
import { Zap, Target, Rocket, Check, Trophy } from "lucide-react";
import { StackMarquee } from "@/components/stack-marquee";

export default function HackathonsPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#060A14] text-white font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>
            
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-16 border-b border-white/5 pb-12 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Zap size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
                        Hackathon <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Culture.</span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Find highly skilled teammates, build products that actually work, and learn how to present like founders. 
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 h-full">
                        <Target className="text-emerald-400 mb-6" size={28} />
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">Team Matching</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Stop scrambling for teams. We actively match backend devs with frontend specialists and UI designers from the community network.</p>
                    </motion.div>
                    
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 h-full">
                        <Rocket className="text-emerald-400 mb-6" size={28} />
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">Rapid Architectures</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Access proven Spring Boot & AI codebase boilerplates explicitly built to rapidly deploy MVPs within 24-48 hours.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 h-full">
                        <Trophy className="text-emerald-400 mb-6" size={28} />
                        <h2 className="text-2xl font-bold mb-4 tracking-tight">Winning Pitches</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Building the product is only 50%. We train you on exactly how to pitch your solution to judges to guarantee podium finishes.</p>
                    </motion.div>
                </div>
            </div>
            <div className="mt-8 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
