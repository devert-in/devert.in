"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Users, Crosshair, Rocket, Calendar, MapPin, Edit3, Save, Eye, EyeOff, StopCircle, X, Construction } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/context/AuthContext";

const DEFAULT_FEED_CONFIG = {
    featured: { enabled: true, title: "Featured Event" },
    active_ops: { enabled: true, title: "Prompt Engineering Lab" },
    incubator: { enabled: true, title: "Agent Builder Hub" },
    squadron: { enabled: true, title: "Agent Hackathon Sprints" },
    executor: { enabled: true, title: "Agent Showcase" },
    learn_prompts: { enabled: true, title: "Learn Prompt Engineering" },
    learn_agents: { enabled: true, title: "Learn What is Agents" },
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
                    limit(2)
                );
                unsubscribeFeatured = onSnapshot(q, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const docsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setFeaturedHackathons(docsData);

                        // Temporary Autoseed for AI Genesis Hackathon if missing
                        if (docsData.length === 1 && !docsData.some(h => h.title.includes("Genesis"))) {
                            try {
                                await addDoc(collection(db, "hackathons"), {
                                    title: "Agent AI Genesis Hackathon",
                                    registrationLink: "https://hackathon.devert.in",
                                    description: "The ultimate DeVert special Hackathon. Compete to build the most advanced AI Agents and prompt logic systems globally.",
                                    startDate: "2026-05-15T09:00:00.000Z",
                                    endDate: "2026-05-17T18:00:00.000Z",
                                    registrationDeadline: "2026-05-01T23:59:00.000Z",
                                    prizes: "₹2,00,000 + Funding",
                                    tags: ["Hackathon", "Agents", "Prompting"],
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

    const getLink = (hack) => {
        if (!hack) return "/hackathons";
        if (hack.registrationLink && hack.registrationLink.startsWith("/")) return hack.registrationLink;
        return `/hackathons/${hack.id}`;
    };

    // Helper Wrapper for Cards
    const FeatureWrapper = ({ featureKey, children, className = "" }) => {
        const isEnabled = config[featureKey]?.enabled ?? true;
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
                                <p className="font-mono text-neon-cyan text-xs mb-1 tracking-widest">// AGENT_GARAGE_ONLINE</p>
                                <h1 className="text-4xl md:text-6xl font-bold font-sans text-foreground">
                                    GARAGE OF <span className="text-neon-cyan">AI AGENTS</span>
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
                        <p className="text-muted-foreground font-mono text-sm mt-2">DeVert is a focused hub for Prompt Engineering and AI Agent building. Build, experiment, and launch real AI systems.</p>
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

                    {/* Featured Operation Hero Banner */}
                    {featuredHackathons.length > 0 && (
                        <FeatureWrapper featureKey="featured" className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1 h-full min-h-[300px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full">
                                { /* DEBUG START */ console.log("CURRENT FEATURED HACKATHONS ARR", featuredHackathons)}
                                {featuredHackathons.map((featuredHackathon, idx) => (
                                    <motion.div
                                        key={featuredHackathon.id || idx}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + (idx * 0.1) }}
                                        className="relative group h-full w-full"
                                    >
                                        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/30 via-black to-blue-500/20 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                        <div className={`relative bg-black/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col ${featuredHackathons.length === 1 ? 'xl:flex-row' : 'xl:flex-col'} justify-between gap-6 overflow-hidden h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}>
                                            {/* Abstract Grid Pattern */}
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.1)_0%,transparent_70%)] pointer-events-none" />

                                            <div className={`relative z-10 flex flex-col justify-start ${featuredHackathons.length === 1 ? 'xl:w-2/3' : 'w-full'}`}>
                                                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 w-max rounded-full bg-neon-green/10 border border-neon-green/20 backdrop-blur-sm">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                                    </span>
                                                    <span className={`text-[10px] uppercase font-bold tracking-widest ${featuredHackathon.status === 'OPEN' ? 'text-neon-green' : 'text-red-500'}`}>
                                                        {featuredHackathon.status === 'OPEN' ? 'Active Mission' : 'Upcoming Event'}
                                                    </span>
                                                </div>
                                                <h2 className={`font-bold font-sans text-white mb-3 leading-tight tracking-tight ${featuredHackathons.length === 1 ? 'text-3xl md:text-5xl lg:text-5xl' : 'text-2xl md:text-3xl lg:text-4xl'}`}>
                                                    {featuredHackathon.title}
                                                </h2>
                                                <p className="text-gray-400 font-sans text-sm max-w-xl mb-0 line-clamp-3">
                                                    {featuredHackathon.description}
                                                </p>
                                            </div>

                                            <div className={`flex flex-col sm:flex-row ${featuredHackathons.length === 1 ? 'xl:flex-col items-center xl:items-end xl:w-1/3 xl:pl-8 xl:border-l' : 'flex-row items-center justify-between w-full pt-4 border-t'} border-white/10 relative z-10 shrink-0 gap-4 mt-auto`}>
                                                <div className={`flex gap-3 ${featuredHackathons.length === 1 ? 'w-full sm:w-auto xl:w-full xl:justify-end' : ''}`}>
                                                    <div className="flex flex-col justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
                                                        <div className="text-sm font-bold text-white max-w-full overflow-hidden text-ellipsis">{featuredHackathon.status}</div>
                                                    </div>
                                                    {featuredHackathon.startDate && (
                                                        <div className="flex flex-col justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center hidden sm:flex">
                                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</div>
                                                            <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                                                                {new Date(featuredHackathon.startDate).getDate()}
                                                                <span className="text-[10px] font-normal text-gray-400">
                                                                    {new Date(featuredHackathon.startDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <Link
                                                    href={getLink(featuredHackathon)}
                                                    target={featuredHackathon.registrationLink?.startsWith("http") ? "_blank" : "_self"}
                                                    className={`${featuredHackathons.length === 1 ? 'w-full sm:w-auto px-6 py-4' : 'px-6 py-3'} bg-neon-green text-black font-bold text-sm hover:bg-white transition-all rounded-xl flex items-center justify-center gap-2 group/btn shadow-[0_0_30px_rgba(0,255,136,0.15)] hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] ${!config.featured?.enabled ? 'pointer-events-none' : ''}`}
                                                >
                                                    <Rocket size={16} className="group-hover/btn:-translate-y-1 transition-transform" />
                                                    {featuredHackathon.status === 'OPEN' ? 'Register Now' : 'View Details'}
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* HARDCODED GENESIS FALLBACK IF LENGTH IS 1 to preserve half-screen alignment! */}
                                {featuredHackathons.length === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="relative group h-full w-full"
                                    >
                                        <div className="absolute -inset-px bg-gradient-to-r from-neon-green/30 via-black to-blue-500/20 rounded-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col xl:flex-col justify-between gap-6 overflow-hidden h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                                            {/* Abstract Grid Pattern */}
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.1)_0%,transparent_70%)] pointer-events-none" />

                                            <div className="relative z-10 flex flex-col justify-start w-full">
                                                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 w-max rounded-full bg-neon-green/10 border border-neon-green/20 backdrop-blur-sm">
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-neon-green"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neon-green">
                                                        Upcoming Event
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-sans text-white mb-3 leading-tight tracking-tight">
                                                    Agent AI Genesis Hackathon
                                                </h2>
                                                <p className="text-gray-400 font-sans text-sm max-w-xl mb-0 line-clamp-3">
                                                    The ultimate DeVert special Hackathon. Compete to build the most advanced AI Agents and prompt logic systems globally.
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row flex-row items-center justify-between w-full pt-4 border-t border-white/10 relative z-10 shrink-0 gap-4 mt-auto">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
                                                        <div className="text-sm font-bold text-white max-w-full overflow-hidden text-ellipsis">UPCOMING</div>
                                                    </div>
                                                    <div className="flex flex-col justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center hidden sm:flex">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</div>
                                                        <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                                                            15
                                                            <span className="text-[10px] font-normal text-gray-400">MAY</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    href="/hackathons/mock_genesis_sprint"
                                                    className="px-6 py-3 bg-neon-green text-black font-bold text-sm hover:bg-white transition-all rounded-xl flex items-center justify-center gap-2 group/btn shadow-[0_0_30px_rgba(0,255,136,0.15)] hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]"
                                                >
                                                    <Rocket size={16} className="group-hover/btn:-translate-y-1 transition-transform" />
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </FeatureWrapper>
                    )}

                    {/* Prompt Engineering Lab - Bento Small */}
                    <FeatureWrapper featureKey="active_ops" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.1 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-blue-500/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Crosshair size={20} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Prompt Engineering</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Master LLM interactions. Test, evaluate, and optimize prompts for reliability and precision.
                                </p>
                            </div>

                            <Link href="/prompt-lab" className={`mt-6 inline-flex items-center text-blue-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.active_ops?.enabled ? 'pointer-events-none' : ''}`}>
                                Open Lab <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Agent Builder Hub - Bento Small */}
                    <FeatureWrapper featureKey="incubator" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.2 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-purple-500/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Rocket size={20} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Agent Builder Hub</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Turn prompts into autonomous agents. Wire logic, tools, and actions into deployable AI.
                                </p>
                            </div>

                            <Link href="/garage" className={`mt-6 inline-flex items-center text-purple-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.incubator?.enabled ? 'pointer-events-none' : ''}`}>
                                Start Building <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Squadron Card - Bento Small */}
                    <FeatureWrapper featureKey="squadron" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.3 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-orange-500/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                        <Users size={20} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Hackathon Sprints</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Compete, collaborate, and build solutions fast. Real-world challenges solved by custom AI systems.
                                </p>
                            </div>

                            <Link href="/hackathons" className={`mt-6 inline-flex items-center text-orange-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.squadron?.enabled ? 'pointer-events-none' : ''}`}>
                                Join a Sprint <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Executor Card - Bento Medium Span */}
                    <FeatureWrapper featureKey="executor" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.4 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-cyan-400/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                                        <Play size={20} />
                                    </div>
                                    <div className="text-[10px] font-mono tracking-wider text-cyan-400/80 uppercase px-2 py-1 rounded-full border border-cyan-400/20">
                                        Gallery
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Agent Showcase</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Explore live agents developed by top operatives. Learn from the best configurations and copy them.
                                </p>
                            </div>

                            <Link href="/showcase" className={`mt-6 inline-flex items-center text-cyan-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.executor?.enabled ? 'pointer-events-none' : ''}`}>
                                View Systems <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Learn Prompt Engineering - Bento Small */}
                    <FeatureWrapper featureKey="learn_prompts" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.5 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-pink-500/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                                        <Edit3 size={20} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">Learn Prompt Engineering</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Start from the basics to advanced prompt chaining. Master the art of directing intelligence.
                                </p>
                            </div>

                            <Link href="/learn-prompts" className={`mt-6 inline-flex items-center text-pink-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.learn_prompts?.enabled ? 'pointer-events-none' : ''}`}>
                                Start Learning <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Learn What is Agents - Bento Small */}
                    <FeatureWrapper featureKey="learn_agents" className="col-span-1 row-span-1 h-full">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.6 }}
                            className="bg-black/40 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-yellow-400/50 hover:bg-black/60 transition-all group relative overflow-hidden h-full flex flex-col justify-between"
                        >
                            <div className="absolute -inset-px bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400">
                                        <Users size={20} />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 relative z-10">What are Agents?</h2>
                                <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                                    Discover how agents differ from bots. Learn the architecture of building autonomous AI entities.
                                </p>
                            </div>

                            <Link href="/learn-agents" className={`mt-6 inline-flex items-center text-yellow-400 text-sm font-semibold group/link w-fit relative z-10 ${!config.learn_agents?.enabled ? 'pointer-events-none' : ''}`}>
                                Explore Agents <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
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
                        className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-neon-cyan z-50 flex items-center justify-between"
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
