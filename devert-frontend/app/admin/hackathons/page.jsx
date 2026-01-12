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
    Tag,
    CheckCircle,
    Shield,
    Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function HackathonsManager() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentHackathon, setCurrentHackathon] = useState(null); // null = new, obj = edit
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Form Stats
    const [formData, setFormData] = useState({
        title: "",
        registrationLink: "",
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
            registrationLink: "",
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
            registrationLink: hack.registrationLink || "",
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
            setDialog({ show: true, message: "Failed to delete hackathon", type: "error" });
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
            setDialog({ show: true, message: "Failed to save hackathon: " + error.message, type: "error" });
        }
    };

    const handleSeed = async () => {
        if (!confirm("WARNING: This will DELETE ALL existing hackathons and replace them with 9 REAL entries. Proceed?")) return;

        const realHackathons = [
            { title: "The DeVert Cup 2026", registrationLink: "https://cup.devert.in", description: "The World Cup of Coding. Compete globally to claim the ultimate trophy and the title of #1 Developer.", date: "2026-06-15T09:00:00.000Z", prizes: "₹10,00,000 + Trophy", tags: ["Competitive Coding", "Global", "Flagship"], status: "UPCOMING" },
            { title: "DeVert Innovation Challenge", registrationLink: "https://innovation.devert.in", description: "Innovate Today. Define Tomorrow. Solve real-world problems using tech.", date: "2026-04-10T09:00:00.000Z", prizes: "Exclusive Swag + Certs", tags: ["Innovation", "Startup", "Social Impact"], status: "OPEN" },
            { title: "Hack For Tomorrow 2025", registrationLink: "https://hack2skill.com", description: "An offline hackathon with no restrictions on themes. Build for the future.", date: "2025-05-15T09:00:00.000Z", prizes: "₹2,00,000", tags: ["Open Innovation", "Offline"], status: "UPCOMING" },
            { title: "CodeZen Hackathon 2025", registrationLink: "https://devfolio.co", description: "36-hour event focusing on innovation, collaboration, and learning in New Delhi.", date: "2025-02-28T09:00:00.000Z", prizes: "₹50,00,000", tags: ["Innovation", "Collaboration"], status: "UPCOMING" },
            { title: "Mumbai Hacks 2025", registrationLink: "https://mumbaihacks.in", description: "India's premier hackathon with Nvidia, Meta, and Google. Huge prize pool.", date: "2025-08-13T09:00:00.000Z", prizes: "₹50,00,000", tags: ["GenAI", "Nvidia", "Meta"], status: "UPCOMING" },
            { title: "DUHacks 5.0", registrationLink: "https://duhacks.tech", description: "A major online hackathon connecting developers globally.", date: "2026-01-23T09:00:00.000Z", prizes: "Swag & Cash", tags: ["Web3", "AI", "Open Source"], status: "UPCOMING" },
            { title: "Hack-O-Knight", registrationLink: "https://hackoknight.dev", description: "14-hour hackathon at SYTRON'24, organized by IEEE IEM Kolkata.", date: "2026-02-18T09:00:00.000Z", prizes: "₹1,00,000", tags: ["Blockchain", "AI/ML", "IoT"], status: "UPCOMING" },
            { title: "Juspay Hiring Challenge 2025", registrationLink: "https://juspay.in/careers", description: "Exclusive hiring challenge for 2026 grads. Solve hard problems, get hired.", date: "2025-07-01T09:00:00.000Z", prizes: "CTC 27 LPA", tags: ["Hiring", "Algorithmic", "Backend"], status: "OPEN" },
            { title: "Adobe India Hackathon 2025", registrationLink: "https://adobe.com/careers", description: "Innovate with Adobe tools. Open to B.Tech/M.Tech students.", date: "2025-07-11T09:00:00.000Z", prizes: "₹1L/mo Internships", tags: ["GenAI", "Creative Cloud"], status: "OPEN" },
            { title: "Smart India Hackathon 2026", registrationLink: "https://sih.gov.in", description: "World's biggest open innovation model. Solve national problems.", date: "2026-06-01T09:00:00.000Z", prizes: "₹1 L per problem", tags: ["GovTech", "Smart City", "Hardware"], status: "UPCOMING" },
            { title: "L'Oréal Brandstorm 2026", registrationLink: "https://brandstorm.loreal.com", description: "Disrupt beauty tech. Global innovation competition.", date: "2025-11-07T09:00:00.000Z", prizes: "Intrapreneurship in Paris", tags: ["Innovation", "Sustainability", "Business"], status: "UPCOMING" }
        ];

        setLoading(true);
        try {
            // 1. Clear existing data
            const snapshot = await getDocs(collection(db, "hackathons"));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "hackathons", d.id)));
            await Promise.all(deletePromises);

            // 2. Add new data
            const addPromises = realHackathons.map(hack =>
                addDoc(collection(db, "hackathons"), {
                    ...hack,
                    createdAt: new Date().toISOString()
                })
            );
            await Promise.all(addPromises);
            setDialog({ show: true, message: "Use 'Refreshed'", type: "success" });
            fetchHackathons();
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
                    <h1 className="text-3xl font-bold font-sans text-white">HACKATHONS_DATABASE</h1>
                    <p className="font-mono text-xs text-gray-500">Manage global events and challenges.</p>
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
                        className="bg-neon-green text-black px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white transition-colors"
                    >
                        <Plus size={16} className="mr-2" /> ADD_ENTRY
                    </button>
                </div>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">DATE / TIME</label>
                                        <DatePicker
                                            selected={formData.date ? new Date(formData.date) : null}
                                            onChange={(date) => setFormData({ ...formData, date: date ? date.toISOString() : "" })}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            placeholderText="Timeline..."
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-cyan outline-none font-sans"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
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
                                {/* ... rest of form ... */}

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
                                    <label className="block text-xs font-mono text-gray-400 mb-1">REGISTRATION LINK</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={formData.registrationLink}
                                        onChange={e => setFormData({ ...formData, registrationLink: e.target.value })}
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
