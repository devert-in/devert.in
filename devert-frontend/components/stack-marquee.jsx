"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const LINKS = [
    { label: "JAVA BACKEND", href: "/tracks/java-backend" },
    { label: "FULL STACK", href: "/tracks/full-stack" },
    { label: "PROOF OF WORK", href: "/proof-of-work" },
    { label: "DEVOPS & CLOUD", href: "/tracks/cloud-devops" },
    { label: "HACKATHONS", href: "/hackathons" },
    { label: "SYSTEM ARCHITECT", href: "/tracks/system-architect" },
    { label: "AI ENGINEER", href: "/tracks/ai-engineer" },
    { label: "CYBER SECURITY", href: "/tracks/cyber-security" }
];

export function StackMarquee() {
    return (
        <section className="py-20 border-y border-white/5 bg-transparent overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#060A14] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#060A14] to-transparent z-10 pointer-events-none" />

            <div className="flex w-max group">
                <motion.div
                    className="flex gap-20 px-10"
                    animate={{ x: "-50%" }}
                    transition={{ ease: "linear", duration: 40, repeat: Infinity }}
                >
                    {[...LINKS, ...LINKS, ...LINKS, ...LINKS].map((item, i) => (
                        <Link
                            href={item.href}
                            key={i}
                            className="text-3xl md:text-5xl font-bold font-sans text-gray-700 hover:text-cyan-400 hover:-translate-y-1 transition-all duration-300 select-none uppercase tracking-tighter cursor-pointer whitespace-nowrap block"
                        >
                            {item.label}
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
