"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Terminal, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useIntro } from "@/context/IntroContext";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, userData, logout } = useAuth();
    const pathname = usePathname();
    const { hasShownIntro } = useIntro();

    if ((pathname === "/" && !hasShownIntro) || pathname.startsWith("/admin")) return null;

    const navLinks = [
        { name: "HACKATHONS", href: "/hackathons" },
        { name: "IDEAS", href: "/contests" },
        { name: "TEAMMATES", href: "/squadron" },
        { name: "TASKS", href: "/bounties" },
        { name: "CASE STUDIES", href: "/postmortems" },
        { name: "COURSES", href: "/courses" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo Area */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center group-hover:border-neon-cyan transition-colors">
                        <Terminal size={20} className="text-neon-cyan" />
                    </div>
                    <span className="font-sans font-bold text-xl tracking-tight">
                        DEVERT<span className="text-neon-green">.IN</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="font-mono text-sm text-gray-400 hover:text-white transition-colors relative group"
                        >
                            <span className="text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity absolute -left-4">&gt;</span>
                            {link.name}
                        </Link>
                    ))}

                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-3 pl-6 border-l border-white/10 hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right hidden lg:block mr-2">
                                    <div className="text-[10px] font-mono font-bold flex gap-2 justify-end mb-0.5">
                                        <span className="text-neon-cyan">{userData?.xp || 0} XP</span>
                                        <span className="text-gray-600">|</span>
                                        <span className="text-yellow-500">₹{userData?.credits || 0}</span>
                                    </div>
                                    <div className="text-sm font-sans font-bold leading-none text-white">
                                        {userData?.displayName || user.email.split('@')[0]}
                                    </div>
                                </div>
                                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-neon-cyan">
                                    <User size={16} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-12 w-48 bg-[#0a0a0a] border border-white/10 shadow-xl p-2 z-50 flex flex-col gap-1"
                                    >
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-2 text-sm font-mono text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                        >
                                            <User size={14} /> MY_PROFILE
                                        </Link>
                                        {user.email.includes("admin") && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setProfileOpen(false)}
                                                className="px-4 py-2 text-sm font-mono text-neon-cyan hover:bg-white/5 flex items-center gap-2"
                                            >
                                                <Terminal size={14} /> ADMIN_PANEL
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => { logout(); setProfileOpen(false); }}
                                            className="px-4 py-2 text-sm font-mono text-red-400 hover:bg-red-500/10 flex items-center gap-2 w-full text-left"
                                        >
                                            <LogOut size={14} /> LOGOUT
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link href="/login" className="font-mono text-sm text-neon-cyan hover:text-white transition-colors relative group border border-neon-cyan/30 px-4 py-2">
                            LOGIN
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-gray-400 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden absolute top-20 left-0 right-0 bg-[#050505] border-b border-white/10 p-6 flex flex-col gap-6"
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="font-mono text-lg text-gray-300 hover:text-neon-cyan flex items-center gap-3"
                        >
                            <span className="text-neon-green">&gt;</span>
                            {link.name}
                        </Link>
                    ))}
                    {user ? (
                        <>
                            <Link href="/profile" onClick={() => setIsOpen(false)} className="font-mono text-lg text-white font-bold flex items-center gap-3 pt-4 border-t border-white/10">
                                <User size={18} /> MY PROFILE
                            </Link>
                            <button onClick={logout} className="font-mono text-lg text-red-500 font-bold flex items-center gap-3 text-left">
                                <LogOut size={18} /> LOGOUT
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setIsOpen(false)} className="font-mono text-lg text-neon-cyan font-bold flex items-center gap-3 pt-4 border-t border-white/10">
                            &gt; LOGIN / JOIN
                        </Link>
                    )}
                </motion.div>
            )}
        </nav>
    );
}
