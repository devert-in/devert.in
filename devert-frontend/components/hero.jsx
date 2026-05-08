"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero({ hasShownIntro }) {
    const fullText = "> Initializing DeVert.in...";
    const [text, setText] = useState(hasShownIntro ? fullText : "");

    useEffect(() => {
        if (hasShownIntro) return;

        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, [hasShownIntro]);

    return (
        <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20">
            <div className="absolute inset-0 grid-bg opacity-30 z-0 pointer-events-none"></div>

            <div className="z-10 text-center px-4 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-mono text-neon-green text-sm mb-6 tracking-[0.2em] uppercase"
                >
          // SYSTEM_READY
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-sans mb-8 h-auto min-h-[5rem] md:min-h-[8rem] leading-tight">
                    <span className="text-white">{text}</span>
                    <span className="animate-pulse text-neon-cyan">_</span>
                </h1>

                <motion.p
                    initial={{ opacity: hasShownIntro ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: hasShownIntro ? 0 : 2.5 }}
                    className="text-gray-400 text-lg md:text-2xl font-mono mb-12 max-w-2xl mx-auto"
                >
                    &quot;From Logic to Hosting. The 1% Dev Roadmap.&quot;
                </motion.p>

                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, scale: hasShownIntro ? 1 : 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: hasShownIntro ? 0 : 3 }}
                >
                    <GlitchButton />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: hasShownIntro ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: hasShownIntro ? 0 : 4 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 text-xs font-mono animate-bounce"
            >
                SCROLL_TO_INITIATE
            </motion.div>
        </section>
    );
}

function GlitchButton() {
    const [label, setLabel] = useState("[ JOIN_THE_SQUAD ]");

    return (
        <Link href="/login">
            <button
                className="group relative px-8 py-4 bg-transparent border border-neon-cyan text-neon-cyan font-mono font-bold uppercase tracking-wider overflow-hidden hover:bg-neon-cyan/5 transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] cursor-pointer"
                onMouseEnter={() => setLabel("J01N_SQU4D")}
                onMouseLeave={() => setLabel("[ JOIN_THE_SQUAD ]")}
            >
                <span className="relative z-10 glitch-text" data-text={label}>
                    {label}
                </span>
                <div className="absolute inset-0 bg-neon-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
        </Link>
    );
}
