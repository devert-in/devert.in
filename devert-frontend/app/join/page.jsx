"use client";

import { motion } from "framer-motion";
import { Terminal, Fingerprint, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function JoinPage() {
    const fadeIn = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[#060A14] text-white flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen"></div>

            <div className="w-full max-w-lg px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="p-8 md:p-10 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                            <Fingerprint size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Initialize Profile</h1>
                        <p className="text-sm text-gray-400 font-mono">Founding Member Registration</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-black/50 border border-cyan-500/30 p-4 rounded-xl flex items-start gap-4">
                            <Lock className="text-cyan-400 mt-1" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-cyan-400 mb-1">Closed Ecosystem</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    DeVert is currently enforcing strict entry for the first 500 founding members.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">Email Override</label>
                                <input type="email" placeholder="builder@institute.edu.in" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm" />
                            </div>
                            
                            <button className="w-full bg-cyan-500 text-black font-bold text-sm tracking-wide rounded-xl px-4 py-4 hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 mt-4">
                                REQUEST ACCESS <Terminal size={16} />
                            </button>
                        </div>

                        <div className="text-center mt-6">
                            <Link href="/" className="text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors">
                                &lt; ABORT INITIALIZATION
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
