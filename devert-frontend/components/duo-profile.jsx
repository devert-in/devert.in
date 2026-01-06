"use client";

import { motion } from "framer-motion";
import { User, Terminal } from "lucide-react";

export function DuoProfile() {
    return (
        <section className="py-10 px-4 relative">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold font-sans mb-6 text-center opacity-80">
                    <span className="text-neon-green">&lt; WHO_WE_ARE /&gt;</span>
                </h2>

                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <PlayerCard
                        role="THE ARCHITECT"
                        sub="Logic / Backend / Systems"
                        color="cyan"
                        icon={<Terminal size={24} />}
                    />
                    <PlayerCard
                        role="THE BUILDER"
                        sub="UI / Frontend / Deploy"
                        color="green"
                        icon={<User size={24} />}
                    />
                </div>
            </div>
        </section>
    );
}

function PlayerCard({ role, sub, color, icon }) {
    const textColor = color === 'cyan' ? 'text-neon-cyan' : 'text-neon-green';
    const glowClass = color === 'cyan' ? 'hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'hover:shadow-[0_0_15px_rgba(0,255,65,0.2)]';
    const bgHover = color === 'cyan' ? 'group-hover:bg-neon-cyan/5' : 'group-hover:bg-neon-green/5';

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative p-5 border border-white/10 bg-white/5 backdrop-blur-sm ${glowClass} ${bgHover} transition-all duration-300 group overflow-hidden cursor-pointer rounded`}
        >
            <div className={`absolute top-0 left-0 w-full h-0.5 ${color === 'cyan' ? 'bg-neon-cyan' : 'bg-neon-green'} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500`}></div>

            <div className="flex items-center gap-4">
                <div className={` ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-bold font-sans ${textColor} uppercase tracking-tight`}>{role}</h3>
                    <p className="font-mono text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{sub}</p>
                </div>
            </div>

            {/* Decorative Background Numbers */}
            <span className="absolute -bottom-4 -right-2 text-6xl font-bold text-white/5 select-none pointer-events-none font-sans group-hover:text-white/10 transition-colors">
                {color === 'cyan' ? '01' : '02'}
            </span>
        </motion.div>
    );
}
