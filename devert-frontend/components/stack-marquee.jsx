"use client";

import { motion } from "framer-motion";

const STACK = [
    "OpenAI", "Anthropic", "Langchain", "LlamaIndex", "Pinecone",
    "Python", "Vercel AI SDK", "Supabase", "Hugging Face", "Vector DBs"
];

export function StackMarquee() {
    return (
        <section className="py-20 border-y border-border bg-background overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="flex w-max">
                <motion.div
                    className="flex gap-20 px-10"
                    animate={{ x: "-50%" }}
                    transition={{ ease: "linear", duration: 30, repeat: Infinity }}
                >
                    {[...STACK, ...STACK, ...STACK, ...STACK].map((tech, i) => (
                        <span
                            key={i}
                            className="text-3xl md:text-5xl font-bold font-sans text-muted-foreground hover:text-neon-cyan transition-colors duration-300 cursor-crosshair select-none uppercase tracking-tighter"
                        >
                            {tech}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
