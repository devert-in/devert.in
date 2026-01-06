"use client";

import Link from "next/link";
import { ArrowLeft, Lock, Construction, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function LabsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center relative overflow-hidden px-4">

            {/* Background Grid */}
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="absolute top-8 left-8">
                <Link href="/" className="text-gray-500 hover:text-white flex items-center transition-colors w-fit font-mono text-xs group">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN_TO_BASE
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-sm p-12 text-center relative"
            >
                {/* Decoration corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-cyan"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-cyan"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan"></div>

                <div className="flex justify-center mb-6 text-gray-600">
                    <Construction size={48} strokeWidth={1} />
                </div>

                <h1 className="text-3xl font-bold font-sans mb-2 text-white">
                    SECTOR <span className="text-neon-cyan">LOCKED</span>
                </h1>

                <p className="font-mono text-xs text-neon-green mb-8 tracking-widest">
                    // DEVELOPMENT_IN_PROGRESS
                </p>

                <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    This module is currently being architected by the core team.
                    Experimental features and beta tools will be deployed here soon.
                </p>

                <div className="flex justify-center gap-4">
                    <Link href="/" className="px-6 py-3 bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 text-white font-mono text-xs transition-all flex items-center">
                        <ArrowLeft size={16} className="mr-2" /> RETURN_HOME
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-8 text-gray-600">
                    <Lock size={16} />
                    <span className="font-mono text-xs">ENCRYPTION: AES-256</span>
                    <Cpu size={16} />
                </div>
            </motion.div>
        </div>
    );
}
