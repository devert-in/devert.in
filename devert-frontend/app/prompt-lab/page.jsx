"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, Clock, BookOpen, Eye, EyeOff, AlertTriangle, Database, Cpu, BrainCircuit, Lock, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FeatureGuard from "@/components/feature-guard";
import { useAuth } from "@/context/AuthContext";

export default function IntelPage() {
    return (
        <FeatureGuard feature="courses">
            <IntelPageContent />
        </FeatureGuard>
    );
}


function IntelPageContent() {
    const { user } = useAuth();
    const isAdmin = user?.email === "admin@devert.in";
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeTree, setActiveTree] = useState("ALL");
    const [activeLevel, setActiveLevel] = useState("ALL");
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    const TREES = {
        "ALL": { label: "GLOBAL_VIEW", icon: BrainCircuit },
        "AI_CORE": { label: "AI_CORE", icon: BrainCircuit },
        "DEV_OPS": { label: "DEV_OPS", icon: Terminal },
        "DATA_SCI": { label: "DATA_NEXUS", icon: Database },
        "SEC_OPS": { label: "SEC_OPS", icon: Lock }
    };

    const LEVELS = {
        "ALL": { label: "ALL_LEVELS", color: "text-white" },
        "Very Beginner": { label: "INITIATE", color: "text-blue-400" },
        "Beginner": { label: "OPERATIVE", color: "text-green-400" },
        "Intermediate": { label: "SPECIALIST", color: "text-yellow-400" },
        "Advanced": { label: "ARCHITECT", color: "text-red-400" },
        "Ultra-Advanced": { label: "GOD_MODE", color: "text-purple-500" }
    };

    useEffect(() => {
        // 1. Fetch Module Status
        const unsubStatus = onSnapshot(doc(db, "system", "navigation"), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.items) {
                    const intelItem = data.items.find(item => item.name === "INTEL");
                    setIsModuleEnabled(intelItem ? intelItem.online !== false : true);
                }
            }
        });

        // 2. Fetch Courses
        const fetchCourses = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "courses"));
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCourses(items);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
        return () => unsubStatus();
    }, []);

    const toggleModuleStatus = async () => {
        try {
            const docRef = doc(db, "system", "navigation");
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const items = snapshot.data().items || [];
                const newItems = items.map(item => {
                    if (item.name === "INTEL") {
                        const currentStatus = item.online !== false;
                        return { ...item, online: !currentStatus };
                    }
                    return item;
                });
                await setDoc(docRef, { items: newItems }, { merge: true });
            }
        } catch (error) {
            console.error("Failed to toggle module:", error);
        }
    }

    const filteredCourses = courses.filter(course => {
        const matchTree = activeTree === "ALL" || course.tree === activeTree;
        const matchLevel = activeLevel === "ALL" || course.level === activeLevel;
        return matchTree && matchLevel;
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-neon-cyan font-mono animate-pulse">
            DECRYPTING_INTEL_DATABASE...
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground p-6 pt-28 pb-20 overflow-x-hidden">
            {/* Admin Disabled Warning */}
            {!isModuleEnabled && isAdmin && (
                <div className="mb-8 max-w-7xl mx-auto p-4 bg-red-500/10 border border-red-500 flex items-center justify-between animate-pulse rounded">
                    <div className="flex items-center gap-4 text-red-500">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold font-mono">MODULE DISABLED (PUBLIC)</h3>
                            <p className="text-xs">Regular users see 'Under Construction'. You have bypass access.</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleModuleStatus}
                        className="px-4 py-2 bg-red-500 text-white font-mono text-xs font-bold hover:bg-neon-green hover:text-black transition-colors rounded"
                    >
                        ENABLE NOW
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative z-10"
                    >
                        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-neon-cyan transition-colors mb-6 font-mono text-xs tracking-widest">
                            <ArrowLeft size={14} className="mr-2" /> RETURN_BASE
                        </Link>
                        <h1 className="text-5xl md:text-8xl font-black font-sans tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600 mb-4">
                            INTEL_<span className="text-neon-cyan">CORE</span>
                        </h1>
                        <p className="text-gray-400 font-mono max-w-xl text-sm md:text-base leading-relaxed pl-1 border-l-2 border-neon-green">
                            Access classified learning modules. Upgrade your neural connections.
                            From initiate to architect.
                        </p>
                    </motion.div>

                    {/* Admin Toggle */}
                    {isAdmin && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={toggleModuleStatus}
                            className={`mt-4 md:mt-0 px-4 py-2 font-mono text-xs border transition-all ${isModuleEnabled
                                ? "text-neon-green border-neon-green hover:bg-neon-green/10"
                                : "text-red-500 border-red-500 hover:bg-red-500/10"}`}
                        >
                            STATUS: {isModuleEnabled ? "ONLINE" : "OFFLINE"}
                        </motion.button>
                    )}
                </div>

                {/* --- FILTERS --- */}
                <div className="mb-12 space-y-6">
                    {/* Level 1: Trees */}
                    <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
                        {Object.entries(TREES).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTree(key)}
                                    className={`px-4 py-2 font-mono text-sm uppercase tracking-wider flex items-center gap-2 transition-all relative ${activeTree === key ? 'text-black bg-neon-cyan font-bold' : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {activeTree === key && (
                                        <motion.div layoutId="activeTree" className="absolute inset-0 bg-neon-cyan -z-10" />
                                    )}
                                    <Icon size={16} />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Level 2: Clearance */}
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(LEVELS).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setActiveLevel(key)}
                                className={`px-3 py-1 font-mono text-xs transition-all border ${activeLevel === key
                                    ? 'border-white text-white bg-white/10'
                                    : 'border-transparent text-gray-600 hover:text-gray-400'
                                    }`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                            <motion.div
                                key={course.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-[#050505] border border-white/10 hover:border-neon-cyan/50 transition-all duration-300 flex flex-col h-full overflow-hidden"
                            >
                                {/* Tech Decoration Lines */}
                                <div className="absolute top-0 right-0 p-2 opacity-50">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-neon-cyan/50 transition-all"></div>

                                {/* Header with Badge */}
                                <div className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <div className={`px-2 py-1 text-[10px] font-mono border ${LEVELS[course.level]?.color ? LEVELS[course.level].color.replace('text-', 'border-') + ' ' + LEVELS[course.level].color : 'border-gray-500 text-gray-500'} bg-black/50 uppercase tracking-widest`}>
                                                {LEVELS[course.level]?.label || course.level}
                                            </div>
                                            {course.tree && (
                                                <div className="px-2 py-1 text-[10px] font-mono border border-gray-600 text-gray-400 bg-black/50 uppercase tracking-widest">
                                                    {course.tree.replace('_', ' ')}
                                                </div>
                                            )}
                                        </div>
                                        {course.platform && (
                                            <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1 opacity-70">
                                                <Database size={10} /> {course.platform}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold font-sans text-white group-hover:text-neon-cyan transition-colors leading-tight">
                                        {course.title}
                                    </h3>
                                </div>

                                {/* Body Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-6 flex-1">
                                        <p className="text-gray-400 text-sm font-mono leading-relaxed line-clamp-3 mb-4">
                                            {course.description}
                                        </p>

                                        {/* Simulated Syllabus / Tags - In future, this comes from DB */}
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Foundations</span>
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Practical Ops</span>
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Advanced</span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-600 font-mono uppercase">Modules</span>
                                            <span className="text-sm text-white font-mono flex items-center gap-2">
                                                <BookOpen size={12} className="text-neon-cyan" /> {course.modules}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-600 font-mono uppercase">Est. Time</span>
                                            <span className="text-sm text-white font-mono flex items-center gap-2">
                                                <Clock size={12} className="text-neon-cyan" /> {course.duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <Link
                                    href={`/prompt-lab/${course.id}`}
                                    className="border-t border-white/10 bg-white/5 p-4 flex items-center justify-between group-hover:bg-neon-cyan group-hover:text-black transition-all cursor-pointer"
                                >
                                    <span className="font-mono text-xs font-bold uppercase tracking-widest">
                                        ACCESS_DATABASE
                                    </span>
                                    <Play size={14} className="group-hover:fill-black transition-transform group-hover:translate-x-1" />
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10">
                            <p className="text-gray-500 font-mono">NO INTEL FOUND FOR THIS CLEARANCE LEVEL.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
