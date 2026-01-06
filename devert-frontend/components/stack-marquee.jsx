"use client";

import { motion } from "framer-motion";

const STACK = [
    "React", "Next.js", "Node.js", "Docker", "Firebase",
    "PostgreSQL", "TypeScript", "TailwindCSS", "AWS", "GraphQL"
];

export function StackMarquee() {
    return (
        <section className="py-20 border-y border-white/5 bg-black/50 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10" />

            <div className="flex w-max">
                <motion.div
                    className="flex gap-20 px-10"
                    animate={{ x: "-50%" }}
                    transition={{ ease: "linear", duration: 30, repeat: Infinity }}
                >
                    {[...STACK, ...STACK, ...STACK, ...STACK].map((tech, i) => (
                        <span
                            key={i}
                            className="text-3xl md:text-5xl font-bold font-sans text-gray-800 hover:text-neon-cyan transition-colors duration-300 cursor-crosshair select-none uppercase tracking-tighter"
                        >
                            {tech}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
