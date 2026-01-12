"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";
import {
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    BookOpen,
    Clock,
    Play,
    CheckCircle,
    Shield,
    Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoursesManager() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Initial Form State
    const initialFormState = {
        title: "",
        level: "Beginner", // Beginner, Intermediate, Advanced
        modules: 0,
        duration: "",
        platform: "",
        description: "",
        thumbnail: "from-gray-800 to-black" // Gradient classes
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "courses"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourses(items);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Handlers
    const openAddModal = () => {
        setCurrentCourse(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (course) => {
        setCurrentCourse(course);
        setFormData({
            title: course.title,
            level: course.level,
            modules: course.modules,
            duration: course.duration,
            platform: course.platform || "",
            description: course.description,
            thumbnail: course.thumbnail || "from-gray-800 to-black"
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (docId) => {
        if (!confirm("Delete this course?")) return;
        try {
            await deleteDoc(doc(db, "courses", docId));
            setCourses(prev => prev.filter(c => c.id !== docId));
        } catch (error) {
            setDialog({ show: true, message: "Failed to delete: " + error.message, type: "error" });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const dataToSave = {
            ...formData,
            modules: parseInt(formData.modules) || 0,
            updatedAt: new Date().toISOString()
        };

        try {
            if (currentCourse) {
                const docRef = doc(db, "courses", currentCourse.id);
                await updateDoc(docRef, dataToSave);
                setCourses(prev => prev.map(c => c.id === currentCourse.id ? { ...c, ...dataToSave } : c));
            } else {
                const docRef = await addDoc(collection(db, "courses"), {
                    ...dataToSave,
                    createdAt: new Date().toISOString()
                });
                setCourses(prev => [...prev, { id: docRef.id, ...dataToSave }]);
            }
            setIsModalOpen(false);
        } catch (error) {
            setDialog({ show: true, message: "Failed to save: " + error.message, type: "error" });
        }
    };

    const handleSeed = async () => {
        if (!confirm("WARNING: This will DELETE ALL existing INTEL/Courses and replace them with REAL educational content. Proceed?")) return;

        const realCourses = [
            {
                title: "Generative AI for Everyone",
                level: "Beginner",
                modules: 8,
                duration: "6 Weeks",
                platform: "DeepLearning.AI",
                description: "Understand how Generative AI works, what it can do, and its potential risks and benefits. No coding required.",
                thumbnail: "from-blue-900 to-black"
            },
            {
                title: "Google Cloud Skills Boost: GenAI Path",
                level: "Intermediate",
                modules: 10,
                duration: "40 Hours",
                platform: "Google Cloud",
                description: "Official path to master Generative AI on Google Cloud. Covers LLMs, Palm API, and Vertex AI.",
                thumbnail: "from-blue-600 to-blue-900"
            },
            {
                title: "CS50's Introduction to AI with Python",
                level: "Intermediate",
                modules: 7,
                duration: "7 Weeks",
                platform: "Harvard edX",
                description: "Explore the concepts and algorithms at the foundation of modern artificial intelligence.",
                thumbnail: "from-red-900 to-black"
            },
            {
                title: "Machine Learning Specialization",
                level: "Advanced",
                modules: 3,
                duration: "3 Months",
                platform: "Stanford Online",
                description: "The most famous ML course, updated. Master the fundamentals of machine learning and how to use them.",
                thumbnail: "from-purple-900 to-black"
            },
            {
                title: "AWS Cloud Practitioner Essentials",
                level: "Beginner",
                modules: 12,
                duration: "6 Hours",
                platform: "AWS Training",
                description: "Learn the fundamentals of the AWS Cloud to start your cloud journey. Essential for certification.",
                thumbnail: "from-orange-600 to-black"
            },
            {
                title: "Prompt Engineering for Developers",
                level: "Intermediate",
                modules: 9,
                duration: "2 Hours",
                platform: "OpenAI x DeepLearning.AI",
                description: "Learn how to use Large Language Models (LLMs) to build powerful applications. Best for devs.",
                thumbnail: "from-green-800 to-black"
            }
        ];

        setLoading(true);
        try {
            // 1. Clear existing data
            const snapshot = await getDocs(collection(db, "courses"));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "courses", d.id)));
            await Promise.all(deletePromises);

            // 2. Add new data
            const addPromises = realCourses.map(c =>
                addDoc(collection(db, "courses"), {
                    ...c,
                    createdAt: new Date().toISOString()
                })
            );
            await Promise.all(addPromises);
            setDialog({ show: true, message: "Intel Database Refreshed with 6 Core Modules.", type: "success" });
            fetchCourses();
        } catch (error) {
            console.error("Seeding failed:", error);
            setDialog({ show: true, message: "Seeding failed: " + error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[80vh]">
            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${dialog.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-neon-green/10 text-neon-green'}`}>
                            {dialog.type === 'error' ? <Shield size={32} /> : <CheckCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold font-sans text-white mb-2">{dialog.type === 'error' ? 'SYSTEM_ERROR' : 'OPERATION_COMPLETE'}</h3>
                        <p className="font-mono text-sm text-gray-400 mb-6">{dialog.message}</p>
                        <button
                            onClick={() => setDialog({ ...dialog, show: false })}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-mono py-2 text-sm uppercase tracking-wider transition-colors"
                        >
                            CLOSE_DIALOG
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white">INTEL_DATABASE</h1>
                    <p className="font-mono text-xs text-gray-500">Manage learning modules and courseware.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeed}
                        className="bg-white/10 border border-white/20 text-white px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white hover:text-black transition-all"
                    >
                        <Database size={16} className="mr-2" /> SEED_REAL_DATA
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-neon-cyan text-black px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white transition-colors"
                    >
                        <Plus size={16} className="mr-2" /> ADD_MODULE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-neon-cyan font-mono animate-pulse">Decrypting content...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="bg-black/40 border border-white/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-white/30 transition-colors group"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${course.level === 'Beginner' ? 'border-neon-green text-neon-green' :
                                        course.level === 'Intermediate' ? 'border-yellow-500 text-yellow-500' :
                                            'border-red-500 text-red-500'
                                        }`}>
                                        {course.level}
                                    </span>
                                    <h3 className="text-xl font-bold font-sans text-white">{course.title}</h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 max-w-2xl">{course.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                                    <span className="flex items-center"><BookOpen size={12} className="mr-1" /> {course.modules} Modules</span>
                                    <span className="flex items-center"><Clock size={12} className="mr-1" /> {course.duration}</span>
                                    <span className="flex items-center"><Play size={12} className="mr-1" /> {course.platform}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(course)} className="p-2 hover:bg-white/10 text-neon-cyan rounded transition-colors"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(course.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {courses.length === 0 && <div className="text-center py-20 text-gray-500 font-mono">NO INTEL FOUND.</div>}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl z-10"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                            <h2 className="text-xl font-bold font-sans text-white mb-6">Course Module Editor</h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="label">TITLE</label>
                                    <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">LEVEL</label>
                                        <select className="input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">PLATFORM</label>
                                        <input className="input" value={formData.platform} onChange={e => setFormData({ ...formData, platform: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">MODULES (Count)</label>
                                        <input type="number" className="input" value={formData.modules} onChange={e => setFormData({ ...formData, modules: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">DURATION</label>
                                        <input className="input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">DESCRIPTION</label>
                                    <textarea className="input h-24 resize-none" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-neon-cyan text-black font-bold font-mono py-3 mt-4 hover:bg-white transition-colors">SAVE MODULE</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style jsx>{`
                .label { display: block; font-size: 0.65rem; font-family: monospace; color: #9ca3af; margin-bottom: 0.25rem; }
                .input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; color: white; font-family: sans-serif; outline: none; transition: border-color 0.2s; }
                .input:focus { border-color: #00FFFF; }
            `}</style>
        </div>
    );
}
