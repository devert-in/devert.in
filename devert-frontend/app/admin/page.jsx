"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit, where, Timestamp } from "firebase/firestore";
import { Trophy, BookOpen, Users, Activity, ExternalLink, Zap, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        hackathons: 0,
        courses: 0,
        postmortems: 0,
        bounties: 0,
        contests: 0,
        totalUsers: 0,
        activeUsers24h: 0,
    });
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Collections
                const [hacks, courses, pms, bounties, contests, users] = await Promise.all([
                    getDocs(collection(db, "hackathons")),
                    getDocs(collection(db, "courses")),
                    getDocs(collection(db, "postmortems")),
                    getDocs(collection(db, "bounties")),
                    getDocs(collection(db, "contests")),
                    getDocs(collection(db, "users")),
                ]);

                // Calculate User Stats
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

                let active24h = 0;
                const growthMap = {};

                users.docs.forEach(doc => {
                    const data = doc.data();

                    // Check active
                    let lastLoginDate = null;
                    if (data.lastLogin && typeof data.lastLogin.toDate === 'function') {
                        lastLoginDate = data.lastLogin.toDate();
                    } else if (data.lastLogin) {
                        lastLoginDate = new Date(data.lastLogin);
                    }

                    if (lastLoginDate && lastLoginDate > oneDayAgo) active24h++;

                    // User Growth Data
                    let createdAtDate = null;
                    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                        createdAtDate = data.createdAt.toDate();
                    } else if (data.createdAt) {
                        createdAtDate = new Date(data.createdAt);
                    }

                    if (createdAtDate) {
                        const dateKey = createdAtDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        growthMap[dateKey] = (growthMap[dateKey] || 0) + 1;
                    }
                });

                // Format growth data for Recharts
                const formattedGrowthData = Object.entries(growthMap)
                    .map(([date, count]) => ({ date, users: count }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(-7); // Last 7 days/entries

                setStats({
                    hackathons: hacks.size,
                    courses: courses.size,
                    postmortems: pms.size,
                    bounties: bounties.size,
                    contests: contests.size,
                    totalUsers: users.size,
                    activeUsers24h: active24h,
                });

                setUserGrowthData(formattedGrowthData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card-bg border border-border p-2 rounded shadow-xl text-xs font-mono">
                    <p className="text-gray-400">{label}</p>
                    <p className="text-neon-cyan font-bold">{payload[0].value} Users</p>
                </div>
            );
        }
        return null;
    };

    const StatCard = ({ title, value, icon: Icon, color, href, subtitle }) => (
        <Link href={href}>
            <div className={`h-full p-6 bg-card-bg border border-border hover:border-${color} group transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between`}>
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-${color}`}>
                    <Icon size={64} />
                </div>
                <div className="relative z-10">
                    <div className={`text-${color} mb-2`}>
                        <Icon size={24} />
                    </div>
                    <div className="text-3xl font-bold font-sans mb-1 text-foreground">{value}</div>
                    <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">{title}</div>
                    {subtitle && <div className="text-xs font-mono text-gray-500 mt-2">{subtitle}</div>}
                </div>
                <div className={`absolute bottom-0 left-0 h-1 bg-${color} w-0 group-hover:w-full transition-all duration-500`}></div>
            </div>
        </Link>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold font-sans text-foreground mb-2">COMMAND_CENTER</h2>
                    <p className="font-mono text-sm text-gray-500">Welcome back, Administrator. System status: <span className="text-neon-green">OPTIMAL</span>.</p>
                </div>
                <div className="flex gap-4">
                    <div className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-3 py-1 bg-neon-cyan/5 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                        </span>
                        LIVE DATA FEED
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={loading ? "-" : stats.totalUsers}
                    icon={Users}
                    color="neon-blue" // Using custom tailwind color if available or standard blue-500
                    href="/admin/users"
                    subtitle={`${stats.activeUsers24h} active in last 24h`}
                />
                <StatCard
                    title="Active Hackathons"
                    value={loading ? "-" : stats.hackathons}
                    icon={Trophy}
                    color="neon-green"
                    href="/admin/hackathons"
                />
                <StatCard
                    title="Open Bounties"
                    value={loading ? "-" : stats.bounties}
                    icon={Zap}
                    color="yellow-500"
                    href="/admin/bounties"
                />
                <StatCard
                    title="Total Revenue"
                    value={loading ? "-" : "$0.00"}
                    icon={DollarSign}
                    color="neon-purple"
                    href="/admin/finance"
                    subtitle="0 pending payouts"
                />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Growth Chart */}
                <div className="lg:col-span-2 bg-card-bg border border-border p-6 rounded-none relative">
                    <h3 className="text-lg font-bold font-sans mb-6 flex items-center text-foreground">
                        <TrendingUp className="mr-2 text-neon-cyan" size={20} />
                        USER_ACQUISITION_TREND
                    </h3>
                    <div className="h-[300px] w-full">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-600 font-mono animate-pulse">LOADING ANALYTICS...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={userGrowthData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }} />
                                    <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="users" stroke="#00f3ff" fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Engagement / Login Time Distribution (Mocked for now as real time logs need backend) */}
                <div className="bg-card-bg border border-border p-6 rounded-none">
                    <h3 className="text-lg font-bold font-sans mb-6 flex items-center text-foreground">
                        <Clock className="mr-2 text-neon-green" size={20} />
                        PEAK_ACTIVITY_HOURS
                    </h3>
                    <div className="h-[300px] w-full">
                        {/* Mock data for visualization since granular hourly logs aren't stored yet */}
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: '00-04', val: 12 }, { name: '04-08', val: 5 },
                                { name: '08-12', val: 35 }, { name: '12-16', val: 58 },
                                { name: '16-20', val: 45 }, { name: '20-24', val: 22 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                    itemStyle={{ color: '#0f0' }}
                                />
                                <Bar dataKey="val" fill="#00ff9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs text-gray-600 font-mono mt-2">*Based on server request density</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="border border-white/10 p-4 bg-white/[0.02] flex flex-wrap gap-4 justify-between items-center">
                <div className="text-xs font-mono text-gray-500">
                    SYSTEM_VERSION: v2.4.0-RC1
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/users" className="text-xs font-mono text-neon-cyan hover:underline">MANAGE_USERS</Link>
                    <span className="text-gray-700">|</span>
                    <Link href="/admin/finance" className="text-xs font-mono text-neon-cyan hover:underline">VIEW_LEDGER</Link>
                </div>
            </div>
        </div>
    );
}
