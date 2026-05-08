"use client";

import { motion } from "framer-motion";
import { Users, MessagesSquare, ArrowUpRight, Check, Network } from "lucide-react";
import { StackMarquee } from "@/components/stack-marquee";

export default function NetworkingPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-[#060A14] text-white font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)]"></div>
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-lighten"></div>
            
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="mb-16 border-b border-white/5 pb-12 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Network size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
                        Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Networking.</span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Surround yourself strictly with high-intent individuals. Build referability and gain direct access to industry seniors.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300">
                        <Users className="text-blue-400 mb-6" size={32} />
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Accountability Cohorts</h2>
                        <ul className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed">
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400"><Check size={14}/></span>
                                Groups of deeply motivated engineers ensuring daily progress.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400"><Check size={14}/></span>
                                Elimination of procrastination through public goal setting.
                            </li>
                        </ul>
                    </motion.div>
                    
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="p-10 rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300">
                        <ArrowUpRight className="text-indigo-400 mb-6" size={32} />
                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Senior Access</h2>
                        <ul className="space-y-4 text-gray-400 text-sm md:text-base leading-relaxed">
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400"><Check size={14}/></span>
                                Leverage the experiences of 3rd and 4th-year placed engineers.
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="mt-1 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400"><Check size={14}/></span>
                                Secure high-quality referrals simply by proving your worth within the community.
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
            <div className="mt-8 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
