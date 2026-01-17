"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, Clock, BookOpen, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FeatureGuard from "@/components/feature-guard";
import { useAuth } from "@/context/AuthContext";

export default function CoursesPage() {
    return (
        <FeatureGuard feature="courses">
            <CoursesPageContent />
        </FeatureGuard>
    );
}

function CoursesPageContent() {
    const { user } = useAuth();
    const isAdmin = user?.email?.includes("admin");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    useEffect(() => {
        fetchData();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.courses === false) setIsModuleEnabled(false);
            }
        } catch (error) {
            console.error("Error fetching module status:", error);
        }
    }

    const toggleModuleStatus = async () => {
        const newState = !isModuleEnabled;
        setIsModuleEnabled(newState);
        try {
            await setDoc(doc(db, "system", "feature_flags"), {
                courses: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
        }
    }

    async function fetchData() {
        try {
            const querySnapshot = await getDocs(collection(db, "courses"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourses(data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 pt-28">

            {/* Admin Disabled Warning */}
            {!isModuleEnabled && isAdmin && (
                <div className="mb-8 max-w-6xl mx-auto p-4 bg-red-500/10 border border-red-500 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4 text-red-500">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold font-mono">MODULE DISABLED (PUBLIC)</h3>
                            <p className="text-xs">Regular users see 'Under Construction'. You have bypass access.</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleModuleStatus}
                        className="px-4 py-2 bg-red-500 text-white font-mono text-xs font-bold hover:bg-neon-green hover:text-black transition-colors"
                    >
                        ENABLE NOW
                    </button>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start mb-12">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-neon-cyan transition-colors mb-4 md:mb-0">
                        <ArrowLeft size={20} className="mr-2" />
                        // RETURN HOME
                    </Link>

                    {isAdmin && (
                        <button
                            onClick={toggleModuleStatus}
                            className={`border px-4 py-3 font-mono text-xs flex items-center gap-2 transition-colors ${isModuleEnabled
                                ? "bg-neon-green/10 border-neon-green text-neon-green hover:bg-red-500 hover:border-red-500 hover:text-white"
                                : "bg-red-500/10 border-red-500 text-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black"
                                }`}
                            title={isModuleEnabled ? "Disable Public Access" : "Enable Public Access"}
                        >
                            {isModuleEnabled ? <><Eye size={16} /> MODULE_ACTIVE</> : <><EyeOff size={16} /> MODULE_OFFLINE</>}
                        </button>
                    )}
                </div>

                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-6xl font-bold font-sans mb-12"
                >
                    COURSES <span className="text-neon-green">_</span>
                </motion.h1>

                {loading ? (
                    <div className="font-mono text-neon-green animate-pulse">Loading courses...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative overflow-hidden bg-white/5 border border-white/10 hover:border-neon-green transition-all"
                            >
                                <div className={`h-40 bg-gradient-to-br ${course.thumbnail || 'from-gray-800 to-black'} relative`}>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm cursor-pointer">
                                        <div className="w-12 h-12 rounded-full border-2 border-neon-green flex items-center justify-center text-neon-green">
                                            <Play fill="currentColor" size={20} className="ml-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold font-sans group-hover:text-neon-green transition-colors">{course.title}</h3>
                                        <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded text-gray-300">{course.level}</span>
                                    </div>

                                    <p className="text-gray-400 mb-6 font-mono text-sm h-16 overflow-hidden text-ellipsis">{course.description}</p>

                                    <div className="flex justify-between text-sm text-gray-500 font-mono pt-4 border-t border-white/5">
                                        <span className="flex items-center"><BookOpen size={14} className="mr-2" /> {course.modules} Modules</span>
                                        <span className="flex items-center"><Clock size={14} className="mr-2" /> {course.duration}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
