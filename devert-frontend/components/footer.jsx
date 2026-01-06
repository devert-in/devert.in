"use client";

import { motion } from "framer-motion";
import { Instagram, Linkedin, Github } from "lucide-react";
import { DuoProfile } from "@/components/duo-profile";

export function Footer() {
    return (
        <footer className="pt-20 pb-10 px-4 bg-[#0A0A0A] border-t border-white/5 relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute top-0 left-0 w-full h-full grid-bg opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 mb-20">
                {/* Left Column: CTA & Links */}
                <div className="flex flex-col justify-between">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl md:text-5xl font-bold font-sans mb-8"
                        >
                            READY TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">DEVERT?</span>
                        </motion.h2>

                        <div className="flex flex-col gap-4 font-mono text-gray-400 text-lg">
                            <a href="#" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /instagram
                            </a>
                            <a href="#" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /linkedin
                            </a>
                            <a href="#" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /github
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 hidden lg:block">
                        <div className="flex gap-6 mb-4">
                            <SocialIcon icon={<Instagram size={24} />} />
                            <SocialIcon icon={<Linkedin size={24} />} />
                            <SocialIcon icon={<Github size={24} />} />
                        </div>
                        <p className="font-mono text-xs text-gray-600">
                            © 2026 DEVERT.IN // SYSTEM_ONLINE
                        </p>
                    </div>
                </div>

                {/* Right Column: Duo Profile */}
                <div className="flex justify-end items-center">
                    <div className="w-full max-w-lg">
                        <DuoProfile />
                    </div>
                </div>

                {/* Mobile Footer Info (Visible only on mobile) */}
                <div className="lg:hidden flex flex-col items-center gap-6 mt-8">
                    <div className="flex gap-6">
                        <SocialIcon icon={<Instagram size={28} />} />
                        <SocialIcon icon={<Linkedin size={28} />} />
                        <SocialIcon icon={<Github size={28} />} />
                    </div>
                    <p className="font-mono text-xs text-gray-600">
                        © 2026 DEVERT.IN // SYSTEM_ONLINE
                    </p>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon }) {
    return (
        <a href="#" className="text-gray-400 hover:text-neon-cyan hover:scale-110 transition-all duration-300">
            {icon}
        </a>
    )
}
