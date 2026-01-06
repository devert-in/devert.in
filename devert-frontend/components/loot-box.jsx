"use client";

import { motion } from "framer-motion";
import { Trophy, Award, Zap } from "lucide-react";
import Link from "next/link";

const RESOURCES = [
    {
        title: "Latest Hackathons",
        desc: "Dominate the arena. Curated list of high-value hackathons.",
        icon: <Trophy className="text-neon-cyan" size={32} />,
        border: "hover:border-neon-cyan",
        shadow: "hover:shadow-neon-cyan/20",
        href: "/hackathons"
    },
    {
        title: "Certifications", // Keeping this as a placeholder or redirect to courses for now
        desc: "Badges that actually matter. Cloud, Security, AI.",
        icon: <Award className="text-purple-500" size={32} />,
        border: "hover:border-purple-500",
        shadow: "hover:shadow-purple-500/20",
        href: "/courses"
    },
    {
        title: "Productivity Hacks",
        desc: "Terminal velocity. Scripts & tools to code 10x faster.",
        icon: <Zap className="text-neon-green" size={32} />,
        border: "hover:border-neon-green",
        shadow: "hover:shadow-neon-green/20",
        href: "/courses" // Re-using courses for now or could be a blog
    }
];

export function LootBox() {
    return (
        <section className="py-32 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-16">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold font-sans mb-2 text-white">LOOT_BOX</h2>
                        <p className="font-mono text-gray-400">Equip yourself for the journey.</p>
                    </div>
                    <div className="hidden md:block w-1/3 h-[1px] bg-gradient-to-l from-transparent to-gray-700"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {RESOURCES.map((item, i) => (
                        <Link key={i} href={item.href} className="block h-full">
                            <motion.div
                                whileHover={{ y: -10 }}
                                className={`p-8 bg-white/5 backdrop-blur-md border border-white/5 ${item.border} ${item.shadow} transition-all duration-300 group hover:shadow-2xl flex flex-col h-full cursor-pointer`}
                            >
                                <div className="mb-6 bg-black/50 w-16 h-16 flex items-center justify-center border border-white/10 group-hover:border-transparent transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold font-sans mb-3">{item.title}</h3>
                                <p className="font-mono text-sm text-gray-400 leading-relaxed flex-grow">{item.desc}</p>

                                <div className="mt-8 flex justify-end">
                                    <span className="text-xs font-mono text-gray-500 group-hover:text-white transition-colors cursor-pointer">ACCESS -&gt;</span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
