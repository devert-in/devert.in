"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Terminal, Menu, X, User, LogOut, Loader2, Plus, LayoutDashboard, History, Trophy, Rocket, ShieldCheck, Search, Code, Zap, Briefcase, Users, Swords, LayoutList, Building2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useIntro } from "@/context/IntroContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, userData, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { hasShownIntro } = useIntro();

    // SEARCH STATE
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef(null);

    const DEFAULT_LINKS = [
        { name: "HOME", href: "/" },
        { name: "ABOUT", href: "/about" },
        { name: "TRACKS", href: "/tracks" },
        { name: "EXECUTION", href: "/execution" },
        { name: "HACKATHONS", href: "/hackathons" },
        { name: "PLACEMENTS", href: "/placements" },
        { name: "LINKEDIN", href: "https://www.linkedin.com/company/111474265/", external: true },
    ];

    const SEARCH_MAP = [
        { title: "Home System", desc: "Main entry point & dashboard", href: "/", icon: <LayoutDashboard size={14}/> },
        { title: "About DeVert", desc: "Our history, mission, & origin", href: "/about", icon: <Terminal size={14}/> },
        { title: "Execution Engine", desc: "Build in public & Java DSA", href: "/execution", icon: <Code size={14}/> },
        { title: "Hackathon Culture", desc: "Form squads & win pitches", href: "/hackathons", icon: <Zap size={14}/> },
        { title: "Placement Prep", desc: "Mock interviews & tear-downs", href: "/placements", icon: <Briefcase size={14}/> },
        { title: "Tracks", desc: "Java, Python, AI, ML Engineering", href: "/tracks", icon: <LayoutList size={14}/> },
        { title: "Company Prep", desc: "Product-based vs Service-based", href: "/placements", icon: <Building2 size={14}/> },
        { title: "Elite Networking", desc: "Accountability groups", href: "/networking", icon: <Users size={14}/> },
        { title: "Proof of Work", desc: "Verified GitHub Identity", href: "/proof-of-work", icon: <ShieldCheck size={14}/> },
        { title: "Founding Member", desc: "System Initialization Access", href: "/join", icon: <Rocket size={14}/> },
        { title: "Authorize System", desc: "Log in or register", href: "/login", icon: <User size={14}/> },
        { title: "Admin Portal", desc: "Command & Operations Center", href: "/admin", icon: <Trophy size={14}/> },
    ];

    const [links, setLinks] = useState(DEFAULT_LINKS);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "devcast_live", "current"), (snap) => {
            setIsLive(snap.exists() && snap.data()?.isLive === true);
        });
        return () => unsub();
    }, []);

    // Close search dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredSearch = SEARCH_MAP.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if ((pathname === "/" && !hasShownIntro) || pathname.startsWith("/admin")) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border shadow-premium bg-card-glass backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                {/* Logo Area */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center group-hover:border-neon-cyan transition-all rounded-lg rotate-3 group-hover:rotate-0">
                        <Terminal size={20} className="text-neon-cyan" />
                    </div>
                    <span className="font-sans font-extrabold text-2xl tracking-tighter italic">
                        <span className="text-white">De</span><span className="text-neon-cyan">Vert</span><span className="text-neon-cyan/50 text-sm align-super font-mono ml-0.5">.in</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-4">
                    {links.filter(link => {
                        if (link.visible === false) return false;
                        if (pathname === "/" && link.hideOnHome) return false;
                        return true;
                    }).map((link) => {
                        const displayHref = link.href;
                        const isActive = pathname === displayHref;
                        const isPro = link.name === "PRO";
                        
                        return (
                            <Link
                                key={link.name}
                                href={displayHref}
                                target={link.external ? "_blank" : undefined}
                                className={`font-mono text-[11px] font-bold tracking-widest transition-all relative group ${isPro ? "text-orange-500 hover:text-orange-400" : isActive ? "text-neon-cyan" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <span className={`text-neon-cyan transition-opacity absolute -left-3 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>&gt;</span>
                                {link.name}
                                {link.name === "DEVCAST" && isLive && (
                                    <span className="absolute -top-2 -right-5 flex items-center">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                        </span>
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div 
                                        layoutId="nav-underline" 
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                                    />
                                )}
                            </Link>
                        );
                    })}

                    <div className="h-6 w-px bg-border mx-2"></div>
                    
                    {/* Desktop Search Bar */}
                    <div className="relative group/search hidden xl:flex items-center mr-2" ref={searchRef}>
                        <Search size={14} className="absolute left-3 text-muted-foreground group-hover/search:text-neon-cyan transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            className="w-32 bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs font-mono text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 focus:w-48 transition-all duration-300 placeholder:text-muted-foreground"
                        />
                        <div className="absolute right-2.5 px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-muted-foreground border border-white/10 hidden group-focus-within/search:hidden lg:block">⌘K</div>

                        {/* DESKTOP SEARCH DROPDOWN */}
                        <AnimatePresence>
                            {isSearchFocused && searchQuery.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-3 right-0 w-[300px] bg-card-glass backdrop-blur-2xl border border-border shadow-2xl rounded-2xl z-[200] overflow-hidden"
                                >
                                    <div className="p-2">
                                        <div className="text-[10px] font-mono text-muted-foreground uppercase px-3 py-2 font-bold tracking-widest border-b border-border/50 mb-2">Search Results</div>
                                        {filteredSearch.length > 0 ? (
                                            filteredSearch.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        router.push(item.href);
                                                        setSearchQuery("");
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="w-full flex items-center gap-4 px-3 py-3 hover:bg-neon-cyan/10 rounded-xl transition-all text-left group/item"
                                                >
                                                    <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-muted-foreground group-hover/item:text-neon-cyan group-hover/item:border-neon-cyan/30 transition-all">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-foreground group-hover/item:text-neon-cyan">{item.title}</div>
                                                        <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-6 text-center text-xs text-muted-foreground font-mono">No matching features found.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <ThemeToggle />

                    {user ? (
                        <div className="relative ml-4">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-4 pl-6 border-l border-border hover:opacity-80 transition-all"
                            >
                                <div className="text-right hidden lg:block mr-1">
                                    <div className="text-[9px] font-mono font-bold flex gap-2 justify-end mb-0.5 tracking-widest text-gray-400">
                                        <span className="text-neon-cyan">{userData?.xp || 0} XP</span>
                                        <span className="text-gray-800">|</span>
                                        <span className="text-orange-500">RANK: #42</span>
                                    </div>
                                    <div className="text-sm font-sans font-black leading-none text-foreground uppercase tracking-tight">
                                        {userData?.displayName || user.email.split('@')[0]}
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-card-bg border border-border rounded-xl flex items-center justify-center text-neon-cyan group-hover:border-neon-cyan transition-all overflow-hidden bg-gradient-to-br from-neon-cyan/5 to-transparent">
                                    <User size={18} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-[110%] w-64 bg-card-glass backdrop-blur-2xl border border-border shadow-premium p-2 z-[200] rounded-2xl flex flex-col gap-1 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-border mb-1">
                                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 font-bold">BUILDER_IDENTITY</div>
                                            <div className="text-xs text-foreground font-mono truncate">{user.email}</div>
                                        </div>

                                        <Link
                                            href="/proof-of-work"
                                            onClick={() => setProfileOpen(false)}
                                            className="px-4 py-3 text-[11px] font-mono font-bold tracking-widest text-muted-foreground hover:text-neon-cyan hover:bg-card-bg flex items-center gap-3 rounded-xl transition-all"
                                        >
                                            <ShieldCheck size={16} /> [01] MY_PROOF_CARD
                                        </Link>

                                        {user.email === "admin@devert.in" && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setProfileOpen(false)}
                                                className="mx-2 mt-2 px-4 py-3 text-[11px] font-mono font-black text-black bg-neon-cyan hover:bg-white flex items-center gap-3 rounded-xl transition-all uppercase"
                                            >
                                                <Terminal size={14} /> ADMIN_ACCESS
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => { logout(); setProfileOpen(false); }}
                                            className="px-4 py-3 text-[11px] font-mono font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-3 rounded-xl transition-all border-t border-border mt-1 tracking-widest"
                                        >
                                            <LogOut size={16} /> TERMINATE_SESSION
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link href="/login" className="ml-4 font-mono text-[11px] font-black text-neon-cyan hover:text-black border border-neon-cyan/50 hover:bg-neon-cyan px-8 py-3 rounded-xl transition-all tracking-widest uppercase">
                            AUTHORIZE
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden absolute top-20 left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 z-50 overflow-hidden"
                        style={{ height: "calc(100vh - 80px)", overflowY: "auto" }}
                    >
                        {/* Mobile Search Bar */}
                        <div className="relative mb-4 mt-2">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                            <input 
                                type="text" 
                                placeholder="Search feature..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan/50 transition-all placeholder:text-muted-foreground relative z-0"
                            />
                            
                            {/* MOBILE SEARCH DROPDOWN (Inline) */}
                            {searchQuery.length > 0 && (
                                <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col gap-1">
                                    {filteredSearch.length > 0 ? (
                                        filteredSearch.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    router.push(item.href);
                                                    setSearchQuery("");
                                                    setIsOpen(false);
                                                }}
                                                className="w-full flex items-center gap-4 px-3 py-3 hover:bg-neon-cyan/10 rounded-xl transition-all text-left group"
                                            >
                                                <div className="text-neon-cyan">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white group-hover:text-neon-cyan">{item.title}</div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-4 text-xs font-mono text-gray-500 text-center">No results found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="font-mono text-sm text-muted-foreground hover:text-neon-cyan flex items-center gap-4 py-2 uppercase tracking-[0.2em]"
                            >
                                <span className="opacity-20">&gt;</span> {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="pt-6 mt-2 border-t border-border flex flex-col gap-4">
                                <Link href="/proof-of-work" onClick={() => setIsOpen(false)} className="font-mono text-sm text-foreground font-black flex items-center gap-4 py-1 uppercase tracking-widest">
                                    <ShieldCheck size={18} className="text-neon-cyan" /> PROFILE_CARD
                                </Link>
                                <button onClick={logout} className="font-mono text-sm text-red-500 font-black flex items-center gap-4 py-1 uppercase tracking-widest text-left">
                                    <LogOut size={18} /> LOGOUT
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)} className="mt-4 bg-neon-cyan text-black px-6 py-4 rounded-xl font-black font-mono text-center text-xs tracking-widest uppercase">
                                AUTHORIZE_PROTOCOL
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

