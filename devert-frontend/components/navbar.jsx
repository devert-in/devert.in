"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Terminal, Menu, X, User, LogOut, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useIntro } from "@/context/IntroContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function Navbar() {
    // 1. All Hooks must be called unconditionally at the top level
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, userData, logout } = useAuth();
    const pathname = usePathname();
    const { hasShownIntro } = useIntro();

    const DEFAULT_LINKS = [
        { name: "ABOUT", href: "/about" },
        { name: "HACKATHONS", href: "/hackathons" },
        { name: "CONTESTS", href: "/contests" },
        { name: "TEAMMATES", href: "/squadron" },
        { name: "EXECUTION", href: "/execution" },
        { name: "POSTMORTEMS", href: "/postmortems" },
        { name: "COURSES", href: "/courses" },
    ];

    const [links, setLinks] = useState(DEFAULT_LINKS);

    useEffect(() => {
        let unsubscribe = () => { };
        try {
            unsubscribe = onSnapshot(doc(db, "system", "navigation"), (snapshot) => {
                if (snapshot.exists() && snapshot.data().items) {
                    setLinks(snapshot.data().items);
                }
            }, (error) => {
                console.warn("Nav sync failed, using default:", error);
            });
        } catch (e) {
            console.warn("Firestore not ready:", e);
        }
        return () => unsubscribe();
    }, []);

    // 2. Conditional Logic / Returns happen AFTER all hooks
    if ((pathname === "/" && !hasShownIntro) || pathname.startsWith("/admin")) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border shadow-sm bg-background/80 backdrop-blur-md">
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
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                target={link.external ? "_blank" : "_self"}
                                className={`font-mono text-sm transition-colors relative group ${isActive ? "text-neon-cyan" : "text-gray-400 hover:text-foreground"}`}
                            >
                                <span className={`text-neon-cyan transition-opacity absolute -left-4 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>&gt;</span>
                                {link.name}
                            </Link>
                        );
                    })}

                    <ThemeToggle />

                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-3 pl-6 border-l border-border hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right hidden lg:block mr-2">
                                    <div className="text-[10px] font-mono font-bold flex gap-2 justify-end mb-0.5">
                                        <span className="text-neon-cyan">{userData?.xp || 0} XP</span>
                                        <span className="text-gray-600">|</span>
                                        <span className="text-yellow-500">₹{userData?.credits || 0}</span>
                                    </div>
                                    <div className="text-sm font-sans font-bold leading-none text-foreground">
                                        {userData?.displayName || user.email.split('@')[0]}
                                    </div>
                                </div>
                                <div className="w-9 h-9 bg-card-bg border border-border rounded-full flex items-center justify-center text-neon-cyan">
                                    <User size={16} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 top-12 w-56 bg-black border border-white/20 shadow-xl p-2 z-50 flex flex-col gap-1 rounded"
                                    >
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-2 text-sm font-mono text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2 rounded transition-colors"
                                        >
                                            <User size={14} /> MY_PROFILE
                                        </Link>
                                        <Link
                                            href="/my-projects"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-2 text-sm font-mono text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2 rounded transition-colors"
                                        >
                                            <Loader2 size={14} /> MY_PROJECTS
                                        </Link>
                                        <Link
                                            href="/workspace"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-2 text-sm font-mono text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2 rounded transition-colors"
                                        >
                                            <Terminal size={14} /> WORKSPACE
                                        </Link>
                                        {user.email.includes("admin") && (
                                            <>
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="px-4 py-2 text-sm font-mono text-neon-cyan hover:bg-neon-cyan/10 flex items-center gap-2 rounded transition-colors border-t border-white/10 mt-1"
                                                >
                                                    <Terminal size={14} /> ADMIN_PANEL
                                                </Link>
                                                <Link
                                                    href="/admin/features"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="px-4 py-2 text-sm font-mono text-neon-green hover:bg-neon-green/10 flex items-center gap-2 rounded transition-colors"
                                                >
                                                    <Plus size={14} /> ADD_FEATURE
                                                </Link>
                                            </>
                                        )}
                                        <Link
                                            href="/about"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-2 text-sm font-mono text-gray-200 hover:bg-white/10 hover:text-white flex items-center gap-2 rounded transition-colors border-t border-white/10 mt-1"
                                        >
                                            <Terminal size={14} /> ABOUT_DEVERT
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setProfileOpen(false); }}
                                            className="px-4 py-2 text-sm font-mono text-red-400 hover:bg-red-500/10 flex items-center gap-2 w-full text-left rounded transition-colors border-t border-white/10 mt-1"
                                        >
                                            <LogOut size={14} /> LOGOUT
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link href="/login" className="font-mono text-sm text-neon-cyan hover:text-foreground transition-colors relative group border border-neon-cyan/30 px-4 py-2">
                            LOGIN
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-gray-400 hover:text-foreground"
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
                    className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-6"
                >
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            target={link.external ? "_blank" : "_self"}
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
