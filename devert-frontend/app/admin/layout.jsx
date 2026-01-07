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
    Activity
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
            } else if (!authUser.email.includes("admin")) {
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
        { name: "HACKATHONS", href: "/admin/hackathons", icon: Trophy },
        { name: "POSTMORTEMS", href: "/admin/postmortems", icon: Activity },
        { name: "COURSES", href: "/admin/courses", icon: BookOpen },
        { name: "WARGAMES", href: "/admin/contests", icon: Users }, // Using Users icon temporarily or Swords if imported
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 240 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                className="bg-black/80 backdrop-blur-md border-r border-white/10 flex-shrink-0 relative h-screen z-20 overflow-hidden"
            >
                <div className="p-6">
                    <h1 className="text-xl font-bold font-sans tracking-widest text-neon-cyan mb-1">DEVERT<span className="text-white">.ADMIN</span></h1>
                    <p className="text-[10px] font-mono text-gray-500">SYSTEM_OVERRIDE_ACTIVE</p>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded font-mono text-sm transition-all duration-300 ${isActive
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="tracking-wide">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-0 w-full px-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded font-mono text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/30"
                    >
                        <LogOut size={18} />
                        <span>TERMINATE_SESSION</span>
                    </button>
                    <div className="mt-4 text-[10px] font-mono text-gray-600 text-center">
                        ID: {user.email}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Bar (Mobile Toggle) */}
                <header className={`h-16 flex items-center justify-between px-6 border-b border-white/10 ${!isSidebarOpen ? 'bg-black/50' : 'bg-transparent'}`}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="font-mono text-xs text-neon-cyan animate-pulse">
                        CONNECTION_SECURE
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6 md:p-10 relative">
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
