"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, Database, BrainCircuit, Terminal, CheckCircle2, Lock, AlertTriangle, PlayCircle, FileText, ChevronDown } from "lucide-react";

export default function CourseDetailContent({ id }) {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const docRef = doc(db, "courses", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCourse({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCourse();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-neon-cyan font-mono animate-pulse">
            ACCESSING_SECURE_ARCHIVE...
        </div>
    );

    if (!course) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 font-mono">
            <AlertTriangle size={48} className="mb-4 text-red-500" />
            <p>DATA_CORRUPTED // COURSE_NOT_FOUND</p>
            <Link href="/prompt-lab" className="mt-8 text-neon-cyan hover:underline">RETURN_TO_BASE</Link>
        </div>
    );

    // Simulated "Full Syllabus" content generator based on difficulty
    const generateSyllabus = (level, totalModules) => {
        const syllabus = [];
        const moduleCount = totalModules || 8;

        for (let i = 1; i <= moduleCount; i++) {
            let title = `Module ${i}: `;
            let content = "Initializing learning sequence...";
            let resources = ["Reading Material", "Quiz", "Code Lab"];

            if (i === 1) {
                title += "Orientation & Setup";
                content = "System configuration, tool installation, and foundational concepts.";
            } else if (i === moduleCount) {
                title += "Final Project & Deployment";
                content = "Capstone project agent deployment, testing, and production build.";
            } else {
                if (level === "Very Beginner") {
                    title += ["Basic Syntax", "Control Flow", "Data Types", "Functions", "Simple Algorithms", "Debugging"][i % 6];
                    content = "Core programming concepts explained simply with hands-on examples.";
                } else if (level === "Beginner") {
                    title += ["Core Concepts", "API Integration", "Database Basics", "User Interfaces", "State Management", "Testing"][i % 6];
                    content = "Building blocks of modern development.";
                } else if (level === "Intermediate") {
                    title += ["Advanced Patterns", "Performance Optimization", "Security Best Practices", "Scalability", "Architecture", "Cloud Ops"][i % 6];
                    content = "Deep dive into professional grade software engineering.";
                } else {
                    title += ["Distributed Systems", "Microservices", "System Design", "High Availability", "AI Integration", "Leadership"][i % 6];
                    content = "Expert level topics for architecting large scale solutions.";
                }
            }

            syllabus.push({
                id: i,
                title,
                content,
                // First 2 modules unlocked for everyone, others locked
                isLocked: i > 2,
                duration: `${Math.floor(Math.random() * 45) + 15} min`,
                resources
            });
        }
        return syllabus;
    };

    const syllabusData = generateSyllabus(course.level, course.modules);

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24 pb-20 overflow-x-hidden">
            <div className="max-w-6xl mx-auto">
                {/* Nav */}
                <Link href="/prompt-lab" className="inline-flex items-center text-gray-500 hover:text-neon-cyan transition-colors mb-8 font-mono text-xs tracking-widest group">
                    <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    ABORT_MISSION // RETURN_TO_LAB
                </Link>

                {/* Hero */}
                <div className="grid md:grid-cols-3 gap-12 mb-16">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 text-xs font-mono rounded-full uppercase tracking-wider">
                                {course.level}
                            </span>
                            <span className="px-3 py-1 bg-white/5 text-gray-400 border border-white/10 text-xs font-mono rounded-full flex items-center gap-2">
                                <Database size={10} /> {course.platform}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold font-sans tracking-tight text-white leading-tight">
                            {course.title}
                        </h1>

                        <p className="text-xl text-gray-400 font-mono leading-relaxed max-w-2xl border-l-2 border-white/10 pl-4">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap gap-8 pt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Duration</span>
                                <span className="text-lg font-mono flex items-center gap-2"><Clock size={16} className="text-neon-green" /> {course.duration}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Modules</span>
                                <span className="text-lg font-mono flex items-center gap-2"><BookOpen size={16} className="text-neon-cyan" /> {course.modules}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">XP Reward</span>
                                <span className="text-lg font-mono flex items-center gap-2 text-yellow-500">+{course.modules * 100} XP</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className={`absolute -inset-4 bg-gradient-to-br ${course.thumbnail || 'from-gray-800 to-black'} opacity-30 blur-2xl rounded-full`}></div>
                        <div className="relative bg-[#050505] border border-white/10 p-6 rounded-lg text-center space-y-6">
                            <BrainCircuit size={48} className="mx-auto text-neon-cyan opacity-80" />
                            <div>
                                <h3 className="text-white font-bold font-sans">STATUS: READY</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">Clearance {course.level} Required</p>
                            </div>
                            <button className="w-full py-4 bg-neon-cyan hover:bg-white text-black font-bold font-mono uppercase tracking-widest transition-all">
                                BEGIN_TRAINING
                            </button>
                            <div className="text-[10px] text-gray-600 font-mono">
                                * Access grants lifetime updates to this module.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Syllabus */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-sans flex items-center gap-3">
                        <Terminal size={24} className="text-neon-cyan" />
                        MISSION_PROTOCOL // SYLLABUS
                    </h2>
                    <span className="text-xs font-mono text-gray-500">{course.modules} STEPS TO MASTERY</span>
                </div>


                <div className="space-y-4">
                    {syllabusData.map((module, index) => {
                        const isExpanded = expandedModule === module.id;
                        return (
                            <motion.div
                                key={module.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className={`group border ${module.isLocked ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-[#080808] hover:border-neon-cyan/30'} transition-all overflow-hidden`}
                            >
                                {/* Header (Always Visible) */}
                                <button
                                    onClick={() => !module.isLocked && setExpandedModule(isExpanded ? null : module.id)}
                                    className={`w-full p-6 flex items-start gap-4 text-left ${module.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border shrink-0 ${module.isLocked ? 'border-gray-700 text-gray-700' : 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'}`}>
                                        {module.id}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-lg font-bold font-sans ${module.isLocked ? 'text-gray-500' : 'text-white group-hover:text-neon-cyan transition-colors'}`}>
                                                {module.title}
                                            </h3>
                                            {!module.isLocked && (
                                                <ChevronDown size={20} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {module.duration}</span>
                                            <span className="flex items-center gap-1"><FileText size={12} /> {module.resources.length} Resources</span>
                                        </div>
                                    </div>
                                    <div className="self-center">
                                        {module.isLocked ? <Lock size={16} className="text-gray-700" /> : <div className={`w-4 h-4 rounded-full border ${isExpanded ? 'bg-neon-green border-neon-green' : 'border-gray-500'}`}></div>}
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && !module.isLocked && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-6 pb-6 pt-0 border-t border-white/5">
                                                <p className="text-sm font-mono text-gray-400 mb-6 mt-4 leading-relaxed">
                                                    {module.content}
                                                </p>

                                                <div className="bg-black/50 border border-white/10 rounded overflow-hidden aspect-video flex items-center justify-center group/video cursor-pointer hover:border-neon-cyan/50 transition-all mb-6">
                                                    <PlayCircle size={48} className="text-gray-600 group-hover/video:text-neon-cyan transition-all" />
                                                </div>

                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold font-mono text-gray-500 uppercase tracking-widest mb-3">Module Resources</h4>
                                                    {module.resources.map((res, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded border border-transparent hover:border-white/10 transition-all cursor-pointer">
                                                            <div className="flex items-center gap-3">
                                                                <FileText size={14} className="text-neon-cyan" />
                                                                <span className="text-sm text-gray-300 font-mono">{res}</span>
                                                            </div>
                                                            <span className="text-[10px] text-neon-green font-mono">DOWNLOAD</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-8 text-center">
                                                    <button className="px-8 py-3 bg-neon-green/10 text-neon-green border border-neon-green hover:bg-neon-green hover:text-black font-mono text-xs font-bold uppercase tracking-widest transition-all w-full">
                                                        COMPLETE_MODULE
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
