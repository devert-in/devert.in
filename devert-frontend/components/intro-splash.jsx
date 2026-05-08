"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function IntroSplash({ onComplete }) {
    const [text, setText] = useState("");
    const fullText = "> Initializing DeVert.in...";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) {
                clearInterval(interval);
                // Wait 1.5 seconds after typing finishes before completing
                setTimeout(() => {
                    onComplete();
                }, 1500);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [onComplete]);

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
            </div>
        </motion.section>
    );
}
