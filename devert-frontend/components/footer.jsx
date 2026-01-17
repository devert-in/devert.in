"use client";

import { motion } from "framer-motion";
import { Instagram, Linkedin, Github, Youtube } from "lucide-react";
import { DuoProfile } from "@/components/duo-profile";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useIntro } from "@/context/IntroContext";

export function Footer() {
    const pathname = usePathname();
    const { hasShownIntro } = useIntro();

    if ((pathname === "/" && !hasShownIntro) || pathname.startsWith("/admin")) return null;

    return (
        <footer className="pt-20 pb-10 px-4 bg-background border-t border-border relative overflow-hidden">
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
                            <a href="https://www.instagram.com/devert.in" target="_blank" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /instagram
                            </a>
                            <a href="https://www.linkedin.com/company/devert-in/" target="_blank" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /linkedin
                            </a>
                            <a href="https://youtube.com/@devert5" target="_blank" className="hover:text-neon-cyan transition-colors flex items-center gap-2 group">
                                <span className="text-neon-green opacity-0 group-hover:opacity-100 transition-opacity">&gt;</span> cd /youtube
                            </a>
                        </div>
                    </div>

                    <div className="mt-12 hidden lg:block">
                        <div className="flex gap-6 mb-4">
                            <SocialIcon href="https://www.instagram.com/devert.in" icon={<Instagram size={24} />} />
                            <SocialIcon href="https://www.linkedin.com/company/devert-in/" icon={<Linkedin size={24} />} />
                            <SocialIcon href="https://youtube.com/@devert5" icon={<Youtube size={24} />} />
                        </div>
                        <p className="font-mono text-xs text-gray-600">
                            © 2026 DEVERT.IN // SYSTEM_ONLINE
                        </p>
                        <Link href="/about" className="text-xs font-mono text-neon-cyan hover:text-white transition-colors mt-4 block">
                            &gt; INIT_SEQUENCE: ABOUT_DEVERT
                        </Link>
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
                        <SocialIcon href="https://www.instagram.com/devert.in" icon={<Instagram size={28} />} />
                        <SocialIcon href="https://www.linkedin.com/company/devert-in/" icon={<Linkedin size={28} />} />
                        <SocialIcon href="https://youtube.com/@devert5" icon={<Youtube size={28} />} />
                    </div>

                    <Link href="/about" className="text-sm font-mono text-neon-cyan hover:text-white transition-colors border border-neon-cyan/30 px-4 py-2 rounded bg-neon-cyan/5">
                        &gt; ABOUT DEVERT
                    </Link>

                    <p className="font-mono text-xs text-gray-600">
                        © 2026 DEVERT.IN // SYSTEM_ONLINE
                    </p>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon, href }) {
    return (
        <a href={href} target="_blank" className="text-gray-400 hover:text-neon-cyan hover:scale-110 transition-all duration-300">
            {icon}
        </a>
    )
}
