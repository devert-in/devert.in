"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, Clock, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pt-28">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-neon-cyan mb-12 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
          // RETURN_HOME
                </Link>

                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-6xl font-bold font-sans mb-12"
                >
                    KNOWLEDGE_BASE <span className="text-neon-green">_</span>
                </motion.h1>

                {loading ? (
                    <div className="font-mono text-neon-green animate-pulse">DECRYPTING_MODULES...</div>
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
