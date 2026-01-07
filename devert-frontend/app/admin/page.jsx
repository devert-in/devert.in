"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Trophy, BookOpen, Users, Activity, ExternalLink, Zap, Target } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        hackathons: 0,
        courses: 0,
        postmortems: 0,
        bounties: 0,
        contests: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Hackathons Count
                const hacksSnapshot = await getDocs(collection(db, "hackathons"));
                const hacksCount = hacksSnapshot.size;

                // Fetch Courses Count
                const coursesSnapshot = await getDocs(collection(db, "courses"));
                const coursesCount = coursesSnapshot.size;

                // Fetch Postmortems Count
                const pmSnapshot = await getDocs(collection(db, "postmortems"));
                const pmCount = pmSnapshot.size;

                // Fetch Bounties Count
                const bountiesSnapshot = await getDocs(collection(db, "bounties"));
                const bountiesCount = bountiesSnapshot.size;

                // Fetch Contests Count
                const contestsSnapshot = await getDocs(collection(db, "contests"));
                const contestsCount = contestsSnapshot.size;

                setStats(prev => ({
                    ...prev,
                    hackathons: hacksCount,
                    courses: coursesCount,
                    postmortems: pmCount,
                    bounties: bountiesCount,
                    contests: contestsCount
                }));

                setLoading(false);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, href }) => (
        <Link href={href}>
            <div className={`p-6 bg-black/40 border border-white/5 hover:border-${color} group transition-all duration-300 cursor-pointer relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-${color}`}>
                    <Icon size={64} />
                </div>
                <div className="relative z-10">
                    <div className={`text-${color} mb-2`}>
                        <Icon size={24} />
                    </div>
                    <div className="text-3xl font-bold font-sans mb-1">{value}</div>
                    <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">{title}</div>
                </div>
                <div className={`absolute bottom-0 left-0 h-1 bg-${color} w-0 group-hover:w-full transition-all duration-500`}></div>
            </div>
        </Link>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold font-sans text-white mb-2">COMMAND_CENTER</h2>
                    <p className="font-mono text-sm text-gray-500">Welcome back, Administrator. System status: NORMAL.</p>
                </div>
                <div className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-3 py-1 bg-neon-cyan/5">
                    Live Data
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Hackathons"
                    value={loading ? "-" : stats.hackathons}
                    icon={Trophy}
                    color="neon-green" // Ensure this class exists in tailwind or is substituted
                    href="/admin/hackathons"
                />
                <StatCard
                    title="Live Courses"
                    value={loading ? "-" : stats.courses}
                    icon={BookOpen}
                    color="neon-purple"
                    href="/admin/courses"
                />
                <StatCard
                    title="Postmortems"
                    value={loading ? "-" : stats.postmortems}
                    icon={Activity}
                    color="neon-cyan"
                    href="/admin/postmortems"
                />
                <StatCard
                    title="Active Contracts"
                    value={loading ? "-" : stats.bounties}
                    icon={Zap}
                    color="yellow-500"
                    href="/admin/bounties"
                />
                <StatCard
                    title="War Games"
                    value={loading ? "-" : stats.contests}
                    icon={Target}
                    color="red-500"
                    href="/admin/contests"
                />
            </div>

            {/* Activity Feed & Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-black/40 border border-white/10 p-6">
                    <h3 className="text-lg font-bold font-sans mb-4 flex items-center">
                        <Activity className="mr-2 text-neon-cyan" size={20} />
                        RECENT_LOGS
                    </h3>
                    <div className="space-y-4 font-mono text-sm">
                        {loading && <p className="text-gray-500 animate-pulse">Scanning logs...</p>}
                        {!loading && (
                            <>
                                <div className="flex justify-between pb-3 border-b border-white/5">
                                    <span className="text-white">Admin Login</span>
                                    <span className="text-gray-500">Just now</span>
                                </div>
                                <div className="flex justify-between pb-3 border-b border-white/5">
                                    <span className="text-white">System DB Seed Check</span>
                                    <span className="text-gray-500">2 mins ago</span>
                                </div>
                                <div className="flex justify-between pb-3 border-b border-white/5 opacity-50">
                                    <span className="text-white">Daily Backup</span>
                                    <span className="text-gray-500">03:00 AM</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-black/40 border border-white/10 p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <h3 className="text-lg font-bold font-sans text-white">QUICK ACTIONS</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/admin/hackathons" className="px-4 py-2 border border-white/20 hover:bg-neon-green hover:text-black hover:border-transparent transition-all font-mono text-sm flex items-center">
                            ADD HACKATHON
                        </Link>
                        <Link href="/admin/courses" className="px-4 py-2 border border-white/20 hover:bg-neon-purple hover:text-black hover:border-transparent transition-all font-mono text-sm flex items-center">
                            ADD COURSE
                        </Link>
                        <Link href="/admin/bounties" className="px-4 py-2 border border-white/20 hover:bg-yellow-500 hover:text-black hover:border-transparent transition-all font-mono text-sm flex items-center">
                            ADD CONTRACT
                        </Link>
                        <Link href="/admin/contests" className="px-4 py-2 border border-white/20 hover:bg-red-500 hover:text-black hover:border-transparent transition-all font-mono text-sm flex items-center">
                            ADD EVENT
                        </Link>
                        <Link href="/" target="_blank" className="px-4 py-2 border border-white/20 hover:bg-white hover:text-black transition-all font-mono text-sm flex items-center">
                            VIEW LIVE SITE <ExternalLink className="ml-2" size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
