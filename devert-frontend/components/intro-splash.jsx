"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Boot lines revealed one at a time once the typed line above finishes -
// ties this splash to the "DeVert OS v2.0" identity already in the hero's
// status bar, without replacing the original typed-line moment.
const BOOT_LINES = [
    "mounting /learn /build /connect /campus",
    "linking developer network",
    "DeVert OS v2.0 — ready",
];

export function IntroSplash({ onComplete }) {
    const [text, setText] = useState("");
    const [bootStep, setBootStep] = useState(0);
    const fullText = "> Initializing DeVert.in...";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (text !== fullText) return;
        if (bootStep >= BOOT_LINES.length) {
            const done = setTimeout(onComplete, 900);
            return () => clearTimeout(done);
        }
        const step = setTimeout(() => setBootStep((n) => n + 1), 220);
        return () => clearTimeout(step);
    }, [text, bootStep, onComplete]);

    return (
        <motion.section
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="absolute inset-0 grid-bg opacity-30 z-0 pointer-events-none"></div>

            <div className="z-10 text-center px-4 max-w-5xl mx-auto">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-sans mb-8 h-auto min-h-[5rem] md:min-h-[8rem] leading-tight">
                    <span className="text-white">{text}</span>
                    <span className="animate-pulse text-neon-cyan">_</span>
                </h1>
                <div className="font-mono text-xs md:text-sm text-white/30 space-y-1.5 min-h-[4.5rem]">
                    {BOOT_LINES.slice(0, bootStep).map((line, idx) => {
                        const isLast = idx === BOOT_LINES.length - 1;
                        return (
                            <motion.p
                                key={line}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={isLast ? "text-neon-green pt-1" : ""}
                            >
                                {isLast ? line : `[ok] ${line}`}
                            </motion.p>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
}
