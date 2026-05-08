"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Users, Crosshair, Rocket, Calendar, MapPin, Edit3, Save, Eye, EyeOff, StopCircle, X, Construction, GalleryHorizontal, History } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/context/AuthContext";
import { DevcastCompact } from "@/components/devcast-compact";

const DEFAULT_FEED_CONFIG = {
    featured: { enabled: true, title: "Featured Challenges" },
    waroom: { enabled: true, title: "War Room Missions" },
    elevate: { enabled: true, title: "DeVert Elevate" },
    incubator: { enabled: false, title: "Build Trails" },
    squadron: { enabled: false, title: "Skill Arena" },
    executor: { enabled: false, title: "Proof Showcase" },
};

export function MainFeed({ hasShownIntro }) {
    const { user, userData } = useAuth();
    const displayName = userData?.displayName || user?.email?.split('@')[0] || "OPERATIVE";
    const isAdmin = user?.email === "admin@devert.in";

    const [featuredHackathons, setFeaturedHackathons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin Edit States
    const [config, setConfig] = useState(DEFAULT_FEED_CONFIG);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let unsubscribeFeatured;
        let unsubscribeConfig;

        const initData = () => {
            try {
                // Real-time Fetch Featured Hackathon (from 'hackathons' collection)
                const q = query(
                    collection(db, "hackathons"),
                    where("isFeatured", "==", true),
                    limit(4) // fetch a bit more so we can filter
                );
                unsubscribeFeatured = onSnapshot(q, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const docsData = querySnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(h => !h.title.toLowerCase().includes("masterclass") && !h.title.toLowerCase().includes("learn") && !h.title.toLowerCase().includes("agent"));
                        setFeaturedHackathons(docsData.slice(0, 2)); // keep max 2 on display

                        // Temporary Autoseed for AI Genesis Hackathon if missing
                        if (docsData.length === 1 && !docsData.some(h => h.title.includes("Genesis"))) {
                            try {
                                await addDoc(collection(db, "hackathons"), {
                                    title: "DeVert: Proof of Genesis",
                                    registrationLink: "https://arena.devert.in",
                                    description: "The Genesis Arena. Compete to build the most advanced production systems. Zero fluff. Pure proof. Dominance defined by the code you ship.",
                                    startDate: "2026-03-27T09:00:00.000Z",
                                    endDate: "2026-03-29T18:00:00.000Z",
                                    registrationDeadline: "2026-03-26T23:59:00.000Z",
                                    prizes: "₹2,00,000 + Funding",
                                    tags: ["PoW", "Builds", "Systems"],
                                    status: "UPCOMING",
                                    isFeatured: true,
                                    isSpecialEvent: true
                                });
                            } catch (e) {
                                console.log("Failed to auto-seed", e);
                            }
                        }
                    } else {
                        setFeaturedHackathons([]);
                    }
                    setLoading(false);
                });

                // Real-time Fetch Config
                const configRef = doc(db, "system", "main_feed_config");
                unsubscribeConfig = onSnapshot(configRef, (configSnap) => {
                    if (configSnap.exists()) {
                        setConfig(configSnap.data());
                    }
                });
            } catch (error) {
                console.error("Error initializing MainFeed:", error);
                setLoading(false);
            }
        };

        initData();

        return () => {
            if (unsubscribeFeatured) unsubscribeFeatured();
            if (unsubscribeConfig) unsubscribeConfig();
        };
    }, []);

    const toggleFeature = async (key) => {
        const newConfig = { ...config, [key]: { ...config[key], enabled: !config[key].enabled } };
        setConfig(newConfig);

        // Optimistic Save
        try {
            await setDoc(doc(db, "system", "main_feed_config"), newConfig);
        } catch (error) {
            console.error("Failed to toggle feature:", error);
            // Revert
            setConfig(config);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "main_feed_config"), config);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save config:", error);
        } finally {
            setSaving(false);
        }
    };

    const WeeklyTimer = () => {
        const [time, setTime] = useState("00:00:00:00");
        useEffect(() => {
            const update = () => {
                const now = new Date();
                let daysInput = (7 - now.getDay()) % 7;
                const target = new Date(now);
                target.setDate(now.getDate() + daysInput);
                target.setHours(23, 59, 59, 999);
                const diff = target - now;
                if (diff > 0) {
                    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                    const m = Math.floor((diff / 1000 / 60) % 60);
                    const s = Math.floor((diff / 1000) % 60);
                    setTime(`${d.toString().padStart(2, "0")}:${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
                }
            };
            const t = setInterval(update, 1000);
            update();
            return () => clearInterval(t);
        }, []);
        return <span className="text-neon-cyan text-xl md:text-2xl font-black font-mono tracking-tighter tabular-nums">{time}</span>;
    };

    const getLink = (hack) => {
        if (!hack) return "/sprints";
        return `/sprints/${hack.id}`;
    };

    // Helper Wrapper for Cards
    const FeatureWrapper = ({ featureKey, children, className = "" }) => {
        const isEnabled = (config[featureKey]?.enabled !== undefined) 
            ? config[featureKey].enabled 
            : (DEFAULT_FEED_CONFIG[featureKey]?.enabled ?? true);
        const showContent = isEnabled || isAdmin || isEditing;

        if (!showContent) return null; // Or return simplified placeholder if layout breaks? Prefer keeping grid intact.

        // If Disabled for User -> Show Under Construction
        if (!isEnabled && !isAdmin && !isEditing) {
            return (
                <div className={`bg-card-bg/50 border border-white/5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden grayscale opacity-75 min-h-[250px] ${className}`}>
                    <div className="absolute inset-0 stripes-bg opacity-10"></div>
                    <Construction className="text-yellow-500 mb-4 animate-pulse" size={32} />
                    <h3 className="text-lg font-bold font-sans text-gray-500 mb-2">UNDER CONSTRUCTION</h3>
                    <p className="font-mono text-xs text-gray-600">Module offline for upgrades.</p>
                    <div className="mt-4 px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[9px] font-mono border border-yellow-500/20 rounded">
                        STATUS: 503
                    </div>
                </div>
            );
        }

        return (
            <div className={`relative ${className} ${!isEnabled ? 'opacity-60 grayscale' : ''}`}>
                {/* Admin Toggle Overlay */}
                {isAdmin && !isEditing && (
                    <div className="absolute top-2 right-2 z-50">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFeature(featureKey);
                            }}
                            className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all ${isEnabled ? 'bg-neon-green/10 text-neon-green border-neon-green hover:bg-black hover:text-white' : 'bg-red-500 text-white border-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black'}`}
                            title={isEnabled ? "Click to Disable" : "Click to Enable"}
                        >
                            {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                    </div>
                )}

                {/* Admin Disabled Badge */}
                {!isEnabled && isAdmin && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-mono px-2 py-1 z-40 pointer-events-none">
                        DISABLED (USER VIEW HIDDEN)
                    </div>
                )}

                {children}
            </div>
        );
    };

    return (
        <section className="pt-24 pb-12 px-4 min-h-[60vh] flex flex-col justify-center relative shadow-2xl z-10">
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: hasShownIntro ? 0 : 0.5 }}
                    className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row justify-between items-end"
                >
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-mono text-neon-cyan text-xs mb-1 tracking-widest">// DEVERT_SYSTEM_ONLINE // SKILL_PROTOCOL_v2</p>
                                <h1 className="text-4xl md:text-6xl font-bold font-sans text-foreground uppercase">
                                    <span className="text-neon-cyan">Proofs</span> of Work
                                </h1>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        if (isEditing) saveConfig(); // Quick save
                                        else setIsEditing(true);
                                    }}
                                    className={`ml-4 text-xs px-3 py-1 border rounded font-mono flex items-center gap-2 transition-colors ${isEditing
                                        ? "border-neon-green text-neon-green bg-neon-green/10"
                                        : "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                                        }`}
                                >
                                    {isEditing ? <><Save size={12} /> DONE</> : <><Edit3 size={12} /> MANAGE_WIDGETS</>}
                                </button>
                            )}
                        </div>
                        <p className="text-muted-foreground font-mono text-sm mt-4 max-w-2xl">
                            Certificates prove you watched. DeVert proves you built. Turn your actions into verifiable, visible credibility.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] hidden md:flex">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                            </span>
                            {user ? "OPERATIVE_ACTIVE" : "LIVE_FEED_ONLINE"}
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">

                    <FeatureWrapper featureKey="featured" className="col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT: DevCast Compact */}
                            <DevcastCompact />

                            {/* RIGHT: Featured Hackathon or Fallback */}
                            {(() => {
                                const hack = featuredHackathons[0];
                                if (hack) return (
                                    <motion.div
                                        key={hack.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative group min-h-[300px]"
                                    >
                                        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/20 via-black to-blue-500/10 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative bg-gradient-to-br from-neon-green/[0.08] via-black/80 to-blue-500/[0.05] backdrop-blur-2xl border border-white/10 hover:border-neon-green/30 transition-colors duration-300 p-8 rounded-2xl flex flex-col justify-between gap-6 overflow-hidden h-full shadow-premium">
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.15)_0%,transparent_80%)] pointer-events-none" />
                                            <div className="relative z-10 flex-1">
                                                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-full">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hack.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${hack.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${hack.status === 'OPEN' ? 'text-neon-green' : 'text-red-500'}`}>
                                                        {hack.status === 'OPEN' ? 'MISSION_ACTIVE' : 'UPCOMING_PROTOCOL'}
                                                    </span>
                                                </div>
                                                <h2 className="text-3xl md:text-4xl font-black font-sans text-white mb-3 uppercase italic tracking-tighter leading-none">{hack.title}</h2>
                                                <p className="text-gray-400 font-mono text-xs max-w-xl line-clamp-3 leading-relaxed">{hack.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-white/10 relative z-10 mt-auto">
                                                <div className="text-left">
                                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 opacity-50">Operational_Status</div>
                                                    <div className="text-xs font-black text-white uppercase font-mono tracking-widest">{hack.status}</div>
                                                </div>
                                                <Link href={getLink(hack)} className="px-6 py-3 bg-neon-green text-black font-black font-mono text-[10px] uppercase tracking-widest hover:bg-white transition-all rounded-lg flex items-center gap-2 shadow-xl">
                                                    {hack.status === 'OPEN' ? 'JOIN_ARENA' : 'VIEW_INTEL'} <Rocket size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                                // Fallback genesis card
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative group min-h-[300px]"
                                    >
                                        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/20 via-black to-blue-500/10 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative bg-gradient-to-br from-neon-green/[0.08] via-black/80 to-blue-500/[0.05] backdrop-blur-2xl border border-white/10 hover:border-neon-green/30 transition-colors duration-300 p-8 rounded-2xl flex flex-col justify-between gap-6 overflow-hidden h-full shadow-premium">
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.15)_0%,transparent_80%)] pointer-events-none" />
                                            <div className="relative z-10 flex-1">
                                                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-full">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-neon-green"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                                                    </span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-neon-green">UPCOMING_PROTOCOL</span>
                                                </div>
                                                <h2 className="text-3xl md:text-4xl font-black font-sans text-white mb-3 uppercase italic tracking-tighter leading-none">DeVert: Proof of Genesis</h2>
                                                <p className="text-gray-400 font-mono text-xs max-w-xl line-clamp-3 leading-relaxed">Ship the impossible. Upload the proof. Let the absolute best builders decide who truly dominates the arena.</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-white/10 relative z-10 mt-auto">
                                                <div className="text-left">
                                                    <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 opacity-50">Operational_Status</div>
                                                    <div className="text-xs font-black text-white uppercase font-mono tracking-widest">SOON</div>
                                                </div>
                                                <Link href="/arena" className="px-6 py-3 bg-neon-green text-black font-black font-mono text-[10px] uppercase tracking-widest hover:bg-white transition-all rounded-lg flex items-center gap-2 shadow-xl">
                                                    JOIN_THE_WAITLIST <Rocket size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })()}
                        </div>
                    </FeatureWrapper>

                    <FeatureWrapper featureKey="waroom" className="col-span-1 md:col-span-2 lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative overflow-hidden rounded-3xl border border-neon-cyan/20 bg-black/40 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_50px_rgba(34,211,238,0.05)] hover:border-neon-cyan/50 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-neon-cyan/20 transition-all duration-1000"></div>

                            <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan"></span>
                                        </div>
                                        <span className="text-[11px] font-black font-mono text-neon-cyan uppercase tracking-[0.4em] bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/20 animate-pulse">WEEKLY_CONTEST_ACTIVE</span>
                                    </div>

                                    <h2 className="text-4xl md:text-6xl font-black font-sans text-white mb-6 uppercase italic tracking-tighter leading-none group-hover:text-neon-cyan transition-colors duration-500">
                                        Build a <span className="text-neon-cyan italic">Terminal</span> Dashboard
                                    </h2>

                                    <p className="text-gray-400 font-mono text-sm max-w-2xl leading-relaxed uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity mb-8">
                                        WEEKLY CHALLENGE: INDUSTRIAL AESTHETICS. <span className="text-white font-black underline decoration-neon-cyan underline-offset-4">TOP 3 RANKINGS WIN PRIZES AND ELITE XP.</span> PROVE YOUR GRIT NOW.
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="px-4 py-2 border border-white/5 bg-white/5 rounded-lg text-[10px] font-mono text-gray-500 font-black uppercase tracking-widest">Theme: #INDUSTRIAL_UI</div>
                                        <div className="px-4 py-2 border border-white/5 bg-white/5 rounded-lg text-[10px] font-mono text-neon-cyan font-black uppercase tracking-widest">+ 500 XP</div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 text-center md:text-right min-w-[240px]">
                                    <div className="text-[10px] font-black font-mono text-gray-500 uppercase tracking-[0.2em] mb-2 px-6 py-4 border-2 border-neon-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-black/60 rounded-xl relative overflow-hidden group/timer">
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-cyan/50"></div>
                                        <div className="text-gray-400 mb-1 text-[8px] font-black">MISSION_STREAK_ENDS_IN:</div>
                                        <WeeklyTimer />
                                    </div>
                                    <Link 
                                        href="/contests"
                                        className="px-10 py-6 bg-neon-cyan text-black font-black font-mono text-sm uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] rounded-xl transform group-hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <span className="relative z-10">ENTER_WEEKLY_ARENA &gt;</span>
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                                    </Link>
                                    <div className="text-[9px] font-black font-mono text-gray-600 uppercase tracking-[0.3em] mt-2 underline cursor-pointer hover:text-white transition-colors">RULES_OF_ENGAGEMENT // 1000+ REGISTERED</div>
                                </div>
                            </div>
                        </motion.div>
                    </FeatureWrapper>

                    <FeatureWrapper featureKey="elevate" className="col-span-1 md:col-span-2 lg:col-span-3 mt-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,255,255,0.05)] hover:border-white/50 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                        </div>
                                        <span className="text-[11px] font-black font-mono text-blue-400 uppercase tracking-[0.4em] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">NEW_LAUNCH</span>
                                    </div>

                                    <h2 className="text-4xl md:text-5xl font-black font-sans text-white mb-4 uppercase tracking-tighter leading-none group-hover:text-blue-400 transition-colors duration-500">
                                        DeVert <span className="text-blue-400">Elevate</span>
                                    </h2>

                                    <p className="text-gray-300 font-sans text-lg max-w-2xl leading-relaxed mb-8">
                                        The ultimate AI-powered career SaaS platform. Analyze your resume, practice mock interviews, and land your dream role with real-time feedback.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 text-center md:text-right min-w-[240px]">
                                    <a 
                                        href="http://localhost:3001"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-10 py-6 bg-white text-black font-black font-mono text-sm uppercase tracking-[0.3em] hover:bg-blue-400 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] rounded-xl transform group-hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <span className="relative z-10">TRY_ELEVATE &gt;</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </FeatureWrapper>

                </div>
            </div>

            {/* Admin Save Bar (Only visible if we add more complex editing later, but good to have) */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-neon-cyan z-50 flex items-center justify-between shadow- premium overflow-hidden"
                    >
                        <div className="text-neon-cyan font-mono text-sm animate-pulse">
                            DASHBOARD_WIDGETS // ADMIN_MODE
                        </div>
                        <div className="flex gap-4">
                            <div className="text-xs text-gray-400 font-mono self-center">
                                Use the <Eye size={12} className="inline" /> toggle on each card to enable/disable.
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 bg-neon-cyan text-black font-bold font-mono text-sm hover:opacity-80 flex items-center gap-2"
                            >
                                <Save size={16} /> DONE
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
