"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Trophy,
    BookOpen,
    LogOut,
    Menu,
    X,
    Users,
    Activity,
    ArrowLeft,
    Briefcase,
    Shield,
    CreditCard,
    Database,
    Gamepad,
    Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            if (!authUser) {
                router.push("/login");
            } else if (authUser.email !== "admin@devert.in") {
                router.push("/"); // Redirect non-admins
            } else {
                setUser(authUser);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-neon-cyan font-mono animate-pulse">
            INITIALIZING_ADMIN_PROTOCOL...
        </div>
    );

    if (!user) return null;

    const navItems = [
        { name: "DASHBOARD", href: "/admin", icon: LayoutDashboard },
        { name: "FEATURES", href: "/admin/features", icon: Layers },
        { name: "CLIENT OPS", href: "/admin/requirements", icon: Briefcase },
        { name: "SQUAD OPS", href: "/admin/architects", icon: Shield },
        { name: "USER BASE", href: "/admin/users", icon: Users },
        { name: "FINANCE", href: "/admin/finance", icon: CreditCard },
        { name: "AGENT SPRINTS", href: "/admin/hackathons", icon: Trophy },
        { name: "PERFORMANCE LOGS", href: "/admin/postmortems", icon: Activity },
        { name: "PROMPT LAB", href: "/admin/courses", icon: BookOpen },
        { name: "WARGAMES", href: "/admin/contests", icon: Gamepad },
        { name: "SYSTEM", href: "/admin/settings", icon: Database },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isSidebarOpen ? 0 : "-100%",
                    width: "240px",
                    opacity: 1
                }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`
                    fixed top-0 left-0 h-[100dvh] z-40 bg-card-bg border-r border-border flex flex-col
                    lg:relative lg:translate-x-0 lg:h-screen lg:flex
                    ${!isSidebarOpen ? "hidden lg:flex lg:w-0 lg:border-none lg:opacity-0" : ""}
                `}
                style={{ width: 240 }} // Force width for motion
            >
                <div className="p-6 flex-shrink-0">
                    <Link href="/" className="block group">
                        <h1 className="text-xl font-bold font-sans tracking-widest text-neon-cyan mb-1 group-hover:opacity-80 transition-opacity">
                            DEVERT<span className="text-foreground">.IN</span>
                        </h1>
                        <p className="text-[10px] font-mono text-muted-foreground group-hover:text-neon-green transition-colors flex items-center gap-2">
                            <ArrowLeft size={10} /> RETURN_HOME
                        </p>
                    </Link>
                </div>

                <nav className="px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`flex items-center space-x-3 px-4 py-3 rounded font-mono text-sm transition-all duration-300 ${isActive
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="tracking-wide">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 bg-card-bg border-t border-border flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded font-mono text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30"
                    >
                        <LogOut size={18} />
                        <span>TERMINATE</span>
                    </button>
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground text-center truncate">
                        {user.email}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Bar (Mobile Toggle) */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/50 backdrop-blur-sm lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="font-mono text-xs text-neon-cyan animate-pulse">
                        SECURE_CONNECTION
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-10 relative">
                    {/* Background GFX */}
                    <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none fixed"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
