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
    Activity,
    CheckCircle,
    Shield,
    Database,
    Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ContestsManager() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContest, setCurrentContest] = useState(null);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Initial Form State
    const initialFormState = {
        title: "",
        contestCode: "",
        description: "",
        date: new Date().toISOString(),
        duration: "2 Hours",
        level: "MEDIUM", // EASY, MEDIUM, HARD, INSANE
        tags: "", // Comma separated
        status: "UPCOMING", // UPCOMING, LIVE, PAST
        host: "DeVert System"
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    const fetchContests = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "contests"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContests(items);
        } catch (error) {
            console.error("Error fetching contests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests();
    }, []);

    // Handlers
    const openAddModal = () => {
        setCurrentContest(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (contest) => {
        setCurrentContest(contest);
        setFormData({
            title: contest.title,
            contestCode: contest.contestCode || "",
            description: contest.description,
            date: contest.date,
            duration: contest.duration,
            level: contest.level,
            tags: Array.isArray(contest.tags) ? contest.tags.join(", ") : contest.tags,
            status: contest.status,
            host: contest.host || "DeVert System"
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (docId) => {
        if (!confirm("Delete this contest?")) return;
        try {
            await deleteDoc(doc(db, "contests", docId));
            setContests(prev => prev.filter(c => c.id !== docId));
        } catch (error) {
            setDialog({ show: true, message: "Failed to delete: " + error.message, type: "error" });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const processTags = (str) => str.split(',').map(s => s.trim()).filter(s => s);

        const dataToSave = {
            ...formData,
            tags: processTags(formData.tags),
            updatedAt: new Date().toISOString()
        };

        try {
            if (currentContest) {
                const docRef = doc(db, "contests", currentContest.id);
                await updateDoc(docRef, dataToSave);
                setContests(prev => prev.map(c => c.id === currentContest.id ? { ...c, ...dataToSave } : c));
            } else {
                const docRef = await addDoc(collection(db, "contests"), {
                    ...dataToSave,
                    createdAt: new Date().toISOString()
                });
                setContests(prev => [...prev, { id: docRef.id, ...dataToSave }]);
            }
            setIsModalOpen(false);
        } catch (error) {
            setDialog({ show: true, message: "Failed to save: " + error.message, type: "error" });
        }
    };

    const handleSeed = async () => {
        if (!confirm("WARNING: This will DELETE ALL existing CONTESTS and replace them with REAL AGENT CHALLENGES. Proceed?")) return;

        const realContests = [
            {
                title: "CodeForces Round #950 (Div. 2)",
                contestCode: "CF-950-D2",
                description: "Standard 2-hour round for Division 2 participants. Good for practice.",
                date: "2026-02-15T14:30:00.000Z",
                duration: "2 Hours",
                level: "MEDIUM",
                tags: ["Greedy", "Math", "Implementation"],
                status: "UPCOMING",
                host: "CodeForces"
            },
            {
                title: "LeetCode Weekly Contest 440",
                contestCode: "LC-WC-440",
                description: "Solve 4 algorithmic problems in 90 minutes. Global ranking.",
                date: "2026-02-18T08:00:00.000Z",
                duration: "1.5 Hours",
                level: "EASY",
                tags: ["Arrays", "DP", "Trees"],
                status: "UPCOMING",
                host: "LeetCode"
            },
            {
                title: "Google Code Jam 2026 - Qualification",
                contestCode: "GCJ-2026-Q",
                description: "The first round of GCJ. You need 30 points to advance.",
                date: "2026-04-05T00:00:00.000Z",
                duration: "27 Hours",
                level: "HARD",
                tags: ["Ad-hoc", "Interactive", "Performance"],
                status: "UPCOMING",
                host: "Google"
            },
            {
                title: "AtCoder Beginner Contest 392",
                contestCode: "ABC-392",
                description: "Perfect for beginners to start competitive programming.",
                date: "2026-02-10T20:00:00.000Z",
                duration: "100 Mins",
                level: "EASY",
                tags: ["Logic", "Basic Algo"],
                status: "UPCOMING",
                host: "AtCoder"
            },
            {
                title: "Meta Hacker Cup - Round 1",
                contestCode: "MHC-26-R1",
                description: "Advanced algorithmic challenges. Top 500 advance.",
                date: "2026-05-20T10:00:00.000Z",
                duration: "24 Hours",
                level: "INSANE",
                tags: ["Graph Theory", "Number Theory", "Flows"],
                status: "UPCOMING",
                host: "Meta"
            },
            {
                title: "DeVert Monthly Blitz",
                contestCode: "DV-BLITZ-01",
                description: "Internal squadron showdown. Winner takes all XP.",
                date: new Date().toISOString(), // TODAY/LIVE
                duration: "4 Hours",
                level: "MEDIUM",
                tags: ["Speed", "Optimization"],
                status: "LIVE",
                host: "DeVert System"
            }
        ];

        setLoading(true);
        try {
            // 1. Clear existing data
            const snapshot = await getDocs(collection(db, "contests"));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "contests", d.id)));
            await Promise.all(deletePromises);

            // 2. Add new data
            const addPromises = realContests.map(c =>
                addDoc(collection(db, "contests"), {
                    ...c,
                    createdAt: new Date().toISOString()
                })
            );
            await Promise.all(addPromises);
            setDialog({ show: true, message: "Agent War Games Refreshed.", type: "success" });
            fetchContests();
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
                    <h1 className="text-3xl font-bold font-sans text-white">AGENT_WAR_GAMES_ARENA</h1>
                    <p className="font-mono text-xs text-gray-500">Manage agent-based competitive events.</p>
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
                        <Plus size={16} className="mr-2" /> NEW_EVENT
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-neon-green font-mono animate-pulse">Scanning frequencies...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {contests.map((contest) => (
                        <div
                            key={contest.id}
                            className={`bg-black/40 border p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-neon-green/50 transition-colors group ${contest.status === 'LIVE' ? 'border-neon-green/50' : 'border-white/10'}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${contest.status === 'LIVE' ? 'bg-neon-green text-black border-neon-green animate-pulse' :
                                        contest.status === 'UPCOMING' ? 'text-neon-cyan border-neon-cyan' :
                                            'text-gray-500 border-gray-500'
                                        }`}>
                                        {contest.status}
                                    </span>
                                    <h3 className="text-xl font-bold font-sans text-white">{contest.title}</h3>
                                    {contest.contestCode && <span className="px-2 py-0.5 text-[10px] font-mono border text-white/50 border-white/20">{contest.contestCode}</span>}
                                </div>
                                <p className="text-gray-400 text-sm mb-3 max-w-2xl">{contest.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                                    <span className="flex items-center text-white"><Trophy size={12} className="mr-1 text-yellow-500" /> {contest.host}</span>
                                    <span className="flex items-center text-white"><Activity size={12} className="mr-1 text-neon-cyan" /> {contest.level}</span>
                                    <span className="flex items-center">{new Date(contest.date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(contest)} className="p-2 hover:bg-white/10 text-neon-green rounded transition-colors"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(contest.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {contests.length === 0 && <div className="text-center py-20 text-gray-500 font-mono">NO ACTIVE AGENT WAR GAMES.</div>}
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
                            <h2 className="text-xl font-bold font-sans text-white mb-6">EVENT_CONTROLLER</h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">TITLE</label>
                                        <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">HOST</label>
                                        <input className="input" required value={formData.host} onChange={e => setFormData({ ...formData, host: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">START TIME</label>
                                        <DatePicker
                                            selected={formData.date ? new Date(formData.date) : null}
                                            onChange={(date) => setFormData({ ...formData, date: date ? date.toISOString() : "" })}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="input"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">DURATION</label>
                                        <input className="input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">LEVEL</label>
                                        <select className="input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                            <option>EASY</option>
                                            <option>MEDIUM</option>
                                            <option>HARD</option>
                                            <option>INSANE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">STATUS</label>
                                        <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option>UPCOMING</option>
                                            <option>LIVE</option>
                                            <option>PAST</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">DESCRIPTION</label>
                                    <textarea className="input h-20 resize-none" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div>
                                    <label className="label">TAGS (Comma separated)</label>
                                    <input className="input" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="DP, Greedy" />
                                </div>

                                <div>
                                    <label className="label">CONTEST CODE</label>
                                    <input className="input" value={formData.contestCode} onChange={e => setFormData({ ...formData, contestCode: e.target.value })} placeholder="DV-XXXX-01" />
                                </div>

                                <button type="submit" className="w-full bg-neon-green text-black font-bold font-mono py-3 mt-4 hover:bg-white transition-colors">INITIALIZE EVENT</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style jsx>{`
                .label { display: block; font-size: 0.65rem; font-family: monospace; color: #9ca3af; margin-bottom: 0.25rem; }
                .input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; color: white; font-family: sans-serif; outline: none; transition: border-color 0.2s; }
                .input:focus { border-color: #00FF00; }
            `}</style>
        </div>
    );
}
