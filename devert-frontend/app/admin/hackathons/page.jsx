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
    Calendar,
    Trophy,
    Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HackathonsManager() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentHackathon, setCurrentHackathon] = useState(null); // null = new, obj = edit

    // Form Stats
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        prizes: "",
        tags: "",
        status: "UPCOMING"
    });

    // Fetch Data
    const fetchHackathons = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "hackathons"));
            const hacks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHackathons(hacks);
        } catch (error) {
            console.error("Error fetching hackathons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHackathons();
    }, []);

    // Handlers
    const openAddModal = () => {
        setCurrentHackathon(null);
        setFormData({
            title: "",
            description: "",
            date: "",
            prizes: "",
            tags: "",
            status: "UPCOMING"
        });
        setIsModalOpen(true);
    };

    const openEditModal = (hack) => {
        setCurrentHackathon(hack);
        setFormData({
            title: hack.title,
            description: hack.description,
            date: hack.date,
            prizes: hack.prizes,
            tags: hack.tags.join(", "), // Convert array to string for input
            status: hack.status
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this hackathon? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "hackathons", id));
            setHackathons(prev => prev.filter(h => h.id !== id));
        } catch (error) {
            console.error("Error deleting hackathon:", error);
            alert("Failed to delete hackathon");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const dataToSave = {
            ...formData,
            tags: formData.tags.split(",").map(t => t.trim()).filter(t => t), // Clean tags
            updatedAt: new Date().toISOString()
        };

        try {
            if (currentHackathon) {
                // Update
                const hackRef = doc(db, "hackathons", currentHackathon.id);
                await updateDoc(hackRef, dataToSave);

                // Optimistic UI update
                setHackathons(prev => prev.map(h =>
                    h.id === currentHackathon.id ? { ...h, ...dataToSave } : h
                ));
            } else {
                // Create
                const docRef = await addDoc(collection(db, "hackathons"), {
                    ...dataToSave,
                    createdAt: new Date().toISOString()
                });

                setHackathons(prev => [...prev, { id: docRef.id, ...dataToSave }]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving hackathon:", error);
            alert("Failed to save hackathon: " + error.message);
        }
    };

    return (
        <div className="relative min-h-[80vh]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white">HACKATHONS_DATABASE</h1>
                    <p className="font-mono text-xs text-gray-500">Manage global events and challenges.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-neon-green text-black px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white transition-colors"
                >
                    <Plus size={16} className="mr-2" /> ADD_ENTRY
                </button>
            </div>

            {loading ? (
                <div className="text-neon-cyan font-mono animate-pulse">Scanning database...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {hackathons.map((hack) => (
                        <div
                            key={hack.id}
                            className="bg-black/40 border border-white/10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-white/30 transition-colors group"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${hack.status === 'OPEN' ? 'border-neon-green text-neon-green' :
                                        hack.status === 'UPCOMING' ? 'border-neon-cyan text-neon-cyan' :
                                            'border-red-500 text-red-500'
                                        }`}>
                                        {hack.status}
                                    </span>
                                    <h3 className="text-xl font-bold font-sans text-white">{hack.title}</h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 max-w-2xl">{hack.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {hack.date}</span>
                                    <span className="flex items-center"><Trophy size={12} className="mr-1" /> {hack.prizes}</span>
                                    <span className="flex items-center"><Tag size={12} className="mr-1" /> {hack.tags && hack.tags.join(", ")}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(hack)}
                                    className="p-2 hover:bg-white/10 text-neon-cyan rounded transition-colors"
                                    title="Edit"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(hack.id)}
                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {hackathons.length === 0 && (
                        <div className="text-center py-20 border border-dashed border-white/10 text-gray-500 font-mono">
                            NO ENTRIES FOUND. INITIATE FIRST EVENT.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        ></motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl z-10"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold font-sans text-white mb-6 flex items-center">
                                {currentHackathon ? <Edit className="mr-2 text-neon-cyan" /> : <Plus className="mr-2 text-neon-green" />}
                                {currentHackathon ? "EDIT_PROTOCOL" : "NEW_EVENT_PROTOCOL"}
                            </h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">EVENT TITLE</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">DATE RANGE</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Feb 15 - Feb 17"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">STATUS</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                        >
                                            <option value="UPCOMING">UPCOMING</option>
                                            <option value="OPEN">OPEN</option>
                                            <option value="CLOSED">CLOSED</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">PRIZE POOL</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="$10,000 USD"
                                        value={formData.prizes}
                                        onChange={e => setFormData({ ...formData, prizes: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">TAGS (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="AI, Blockchain, Python"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">DESCRIPTION</label>
                                    <textarea
                                        rows="3"
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-white text-black font-bold font-mono py-3 mt-4 hover:bg-neon-cyan transition-colors flex justify-center items-center"
                                >
                                    <Save size={16} className="mr-2" /> SAVE_TO_DATABASE
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
