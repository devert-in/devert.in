"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Target } from "lucide-react";

export function ExecutionModeSection() {
    return (
        <div className="relative group h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-green via-black to-neon-cyan rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-background border border-border p-8 rounded-lg flex flex-col justify-between gap-6 overflow-hidden h-full">

                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target size={120} className="text-neon-cyan" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-red-500 tracking-widest">REALITY_CHECK_PROTOCOL</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold font-sans text-foreground mb-2">
                        EXECUTION <span className="text-neon-cyan">&gt;</span> LEARNING
                    </h2>

                    <p className="text-muted-foreground font-mono text-xs md:text-sm h-20 overflow-hidden line-clamp-3">
                        Stop consuming. Start building. Select your weakness, and DeVert will give you the strict guidance you need to break the cycle.
                    </p>
                </div>

                <div className="relative z-10 w-full">
                    <Link
                        href="/execution-ai"
                        className="w-full px-8 py-3 bg-neon-cyan text-black font-bold font-mono text-sm hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all flex items-center justify-center gap-2 text-center rounded-lg"
                    >
                        INITIATE GUIDANCE <Zap size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
