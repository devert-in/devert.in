"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Users, Crosshair, Rocket, Calendar, MapPin, Edit3, Save, Eye, EyeOff, StopCircle, X, Construction } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/context/AuthContext";

const DEFAULT_FEED_CONFIG = {
    featured: { enabled: true, title: "Featured Event" },
    active_ops: { enabled: true, title: "Active Operations" },
    incubator: { enabled: true, title: "Idea Incubator" },
    squadron: { enabled: true, title: "Squadron Uplink" },
    executor: { enabled: true, title: "Become Executor" },
};

export function MainFeed({ hasShownIntro }) {
    const { user, userData } = useAuth();
    const displayName = userData?.displayName || user?.email?.split('@')[0] || "OPERATIVE";
    const isAdmin = user?.email?.includes("admin");

    const [featuredHackathon, setFeaturedHackathon] = useState(null);
    const [loading, setLoading] = useState(true);

    // Admin Edit States
    const [config, setConfig] = useState(DEFAULT_FEED_CONFIG);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                // Fetch Featured Hackathon
                const q = query(
                    collection(db, "hackathons"),
                    where("isFeatured", "==", true),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setFeaturedHackathon({ id: querySnapshot.docs[0].id, ...docData });
                }

                // Fetch Config
                const configRef = doc(db, "system", "main_feed_config");
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) {
                    setConfig(configSnap.data());
                }
            } catch (error) {
                console.error("Error initializing MainFeed:", error);
            } finally {
                setLoading(false);
            }
        };

        initData();
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
                                <p className="font-mono text-neon-cyan text-xs mb-1 tracking-widest">// IMPACT_ENGINE_ONLINE</p>
                                <h1 className="text-3xl md:text-5xl font-bold font-sans text-foreground">
                                    {user ? (
                                        <>WELCOME BACK, <span className="text-neon-green">{displayName.toUpperCase()}</span></>
                                    ) : (
                                        <>SYSTEM STATUS: <span className="text-neon-green">ONLINE</span></>
                                    )}
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
                        <p className="text-muted-foreground font-mono text-sm mt-2">Don't just code. Solve real-world problems.</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] mt-2 md:mt-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                        </span>
                        {user ? "OPERATIVE_ACTIVE" : "LIVE_FEED_ACTIVE"}
                    </div>
                </motion.div>

                {/* Featured Operation Hero Banner */}
                {featuredHackathon && (
                    <FeatureWrapper featureKey="featured">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-12 relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-background border border-border p-8 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                                {/* Background Effect */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

                                <div className="flex-1 relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-2 w-2 relative">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${featuredHackathon.status === 'OPEN' ? 'bg-neon-green' : 'bg-red-500'}`}></span>
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold tracking-widest ${featuredHackathon.status === 'OPEN' ? 'text-neon-green' : 'text-red-500'}`}>
                                            {featuredHackathon.status === 'OPEN' ? 'SQUAD_REGISTRATION_OPEN' : 'PRIORITY_BROADCAST'}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold font-sans text-foreground mb-2 max-w-lg">
                                        {featuredHackathon.title}
                                    </h2>
                                    <p className="text-muted-foreground font-mono text-xs md:text-sm max-w-xl h-20 overflow-hidden text-ellipsis">
                                        {featuredHackathon.description}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-4 relative z-10 w-full md:w-auto">
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <div className="text-center px-4 py-2 bg-card-bg border border-border rounded min-w-[100px]">
                                            <div className="text-lg font-bold text-foreground font-sans">{featuredHackathon.status}</div>
                                            <div className="text-[9px] text-muted-foreground font-mono">STATUS</div>
                                        </div>
                                        {featuredHackathon.startDate && (
                                            <div className="text-center px-4 py-2 bg-card-bg border border-border rounded min-w-[100px] hidden md:block">
                                                <div className="text-lg font-bold text-foreground font-sans">{new Date(featuredHackathon.startDate).getDate()}</div>
                                                <div className="text-[9px] text-muted-foreground font-mono">
                                                    {new Date(featuredHackathon.startDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href={getLink(featuredHackathon)}
                                        target={featuredHackathon.registrationLink?.startsWith("http") ? "_blank" : "_self"}
                                        className={`w-full md:w-auto px-8 py-3 bg-foreground text-background font-bold font-mono text-sm hover:opacity-80 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] text-center ${!config.featured?.enabled ? 'pointer-events-none' : ''}`}
                                    >
                                        <Rocket size={16} /> {featuredHackathon.status === 'OPEN' ? 'INITIATE_PROTOCOL' : 'VIEW_DOSSIER'}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </FeatureWrapper>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Operations Card */}
                    <FeatureWrapper featureKey="active_ops">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.1 }}
                            className="bg-card-bg border border-border p-6 hover:border-neon-green/50 transition-all group relative overflow-hidden h-full"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 rounded-bl-full -mr-8 -mt-8"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2 py-0.5 bg-neon-green/10 text-neon-green text-[10px] font-mono rounded border border-neon-green/20">
                                    PRIORITY: HIGH
                                </div>
                                <Crosshair className="text-muted-foreground group-hover:text-neon-green transition-colors" size={24} />
                            </div>

                            <h2 className="text-2xl font-bold font-sans mb-1 text-foreground">Active Operations</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-4">Solve real problems for local businesses & NGOs. Build a portfolio that actually matters.</p>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-6">
                                <span>LIVE QUESTS: 12</span>
                                <span>//</span>
                                <span>IMPACT: CERTIFIED</span>
                            </div>

                            <Link href="/hackathons" className={`inline-flex items-center text-neon-green text-xs font-bold font-mono group-hover:translate-x-2 transition-transform ${!config.active_ops?.enabled ? 'pointer-events-none' : ''}`}>
                                BROWSE_QUESTS <ArrowRight size={14} className="ml-2" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Incubator Card */}
                    <FeatureWrapper featureKey="incubator">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, x: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.2 }}
                            className="bg-card-bg border border-border p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden h-full"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-mono rounded border border-purple-500/20">
                                    INNOVATION_LAB
                                </div>
                                <Rocket className="text-muted-foreground group-hover:text-purple-400 transition-colors" size={24} />
                            </div>

                            <h2 className="text-2xl font-bold font-sans mb-1 text-foreground">Idea Incubator</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-4">Have a moonshot idea? Submit it. We build it together. Equity for everyone.</p>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-6">
                                <span>SUBMISSIONS: 84</span>
                                <span>//</span>
                                <span>LAUNCHES: 3</span>
                            </div>

                            <Link href="/contests" className={`inline-flex items-center text-purple-400 text-xs font-bold font-mono group-hover:translate-x-2 transition-transform ${!config.incubator?.enabled ? 'pointer-events-none' : ''}`}>
                                SUBMIT_BLUEPRINT <ArrowRight size={14} className="ml-2" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Squadron Card */}
                    <FeatureWrapper featureKey="squadron">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.3 }}
                            className="bg-card-bg border border-border p-6 hover:border-neon-cyan/50 transition-all group h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-mono rounded border border-neon-cyan/20">
                                    TEAM_MATCHMAKING
                                </div>
                                <Users className="text-muted-foreground group-hover:text-neon-cyan transition-colors" size={20} />
                            </div>

                            <h2 className="text-2xl font-bold font-sans mb-1 text-foreground">Squadron Uplink</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-4">Find your perfect teammate based on Tech Stack compatibility. Stop solo-queuing hackathons.</p>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-6">
                                <span>OPERATIVES: 1,204</span>
                                <span>//</span>
                                <span>STATUS: LIVE</span>
                            </div>

                            <Link href="/squadron" className={`inline-flex items-center text-neon-cyan text-xs font-bold font-mono group-hover:translate-x-2 transition-transform ${!config.squadron?.enabled ? 'pointer-events-none' : ''}`}>
                                FIND_TEAM <ArrowRight size={14} className="ml-2" />
                            </Link>
                        </motion.div>
                    </FeatureWrapper>

                    {/* Executor Card */}
                    <FeatureWrapper featureKey="executor">
                        <motion.div
                            initial={{ opacity: hasShownIntro ? 1 : 0, y: hasShownIntro ? 0 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: hasShownIntro ? 0 : 0.4 }}
                            className="bg-card-bg border border-border p-6 hover:border-neon-cyan/50 transition-all group h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-mono rounded border border-neon-cyan/20">
                                    CAREER_MODE
                                </div>
                                <Play className="text-muted-foreground group-hover:text-neon-cyan transition-colors" size={20} />
                            </div>

                            <h2 className="text-2xl font-bold font-sans mb-1 text-foreground">Become Executor</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-4">Stop bidding. Get assigned high-value tasks based on your skills. Guaranteed payment.</p>

                            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-6">
                                <span>AVG PAYOUT: ₹5k+</span>
                                <span>//</span>
                                <span>VETTING: REQUIRED</span>
                            </div>

                            <Link href="/join-executor" className={`inline-flex items-center text-neon-cyan text-xs font-bold font-mono group-hover:translate-x-2 transition-transform ${!config.executor?.enabled ? 'pointer-events-none' : ''}`}>
                                APPLY_NOW <ArrowRight size={14} className="ml-2" />
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
