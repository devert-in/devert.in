"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Trophy, Code, Plus, X, Edit2, Activity, Zap, Check, Shield, CheckCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ContestsPage() {
    const { user } = useAuth();
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, LIVE, UPCOMING, PAST, HOSTED
    const dateInputRef = useRef(null);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Hosting Modal State
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [editingContestId, setEditingContestId] = useState(null);
    const [contestForm, setContestForm] = useState({
        title: "",
        description: "",
        date: "",
        duration: "",
        level: "EASY", // EASY, MEDIUM, HARD, INSANE
        tags: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch from new 'contests' collection
            const querySnapshot = await getDocs(collection(db, "contests"));
            const now = new Date();
            const data = querySnapshot.docs.map(doc => {
                const d = doc.data();
                let status = d.status;

                // Only dynamically update status if it's approved (not PENDING)
                if (status !== 'PENDING') {
                    const startDate = new Date(d.date);
                    // Parse duration simple heuristic (e.g. "2", "2 Hours", "120 Mins")
                    let durationMs = 2 * 60 * 60 * 1000; // Default 2 hours if parsing fails

                    if (d.duration) {
                        const str = d.duration.toLowerCase();
                        const val = parseFloat(str) || 0;
                        if (str.includes('min')) {
                            durationMs = val * 60 * 1000;
                        } else {
                            // Default to hours if no unit or 'hour' specified
                            durationMs = val * 3600 * 1000;
                        }
                    }

                    const endDate = new Date(startDate.getTime() + durationMs);

                    if (now < startDate) {
                        status = "UPCOMING";
                    } else if (now >= startDate && now <= endDate) {
                        status = "LIVE";
                    } else {
                        status = "PAST";
                    }
                }

                return {
                    id: doc.id,
                    ...d,
                    status
                };
            });
            setContests(data);
        } catch (error) {
            console.error("Error fetching contests:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = contests.filter(c => {
        if (filter === "ALL") return true;
        if (filter === "HOSTED") return user && c.host === user.email;
        return c.status === filter;
    });

    const openHostModal = (contestToEdit = null) => {
        if (contestToEdit) {
            setEditingContestId(contestToEdit.id);
            setContestForm({
                title: contestToEdit.title,
                description: contestToEdit.description,
                date: contestToEdit.date, // Assuming date is already in correct format or handled
                duration: contestToEdit.duration,
                level: contestToEdit.level,
                tags: Array.isArray(contestToEdit.tags) ? contestToEdit.tags.join(", ") : contestToEdit.tags
            });
        } else {
            setEditingContestId(null);
            setContestForm({ title: "", description: "", date: "", duration: "", level: "EASY", tags: "" });
        }
        setIsHostModalOpen(true);
    };

    const handleHostSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...contestForm,
                tags: contestForm.tags.split(",").map(t => t.trim()),
            };

            if (editingContestId) {
                // Update
                const ref = doc(db, "contests", editingContestId);
                await updateDoc(ref, payload);
                setDialog({ show: true, message: "Contest Updated successfully!", type: "success" });
            } else {
                // Create
                await addDoc(collection(db, "contests"), {
                    ...payload,
                    status: "PENDING", // Requires admin approval
                    host: user.email,
                    type: "CODING_CONTEST",
                    createdAt: new Date().toISOString()
                });
                setDialog({ show: true, message: "Contest Proposal Submitted! Awaiting Admin Approval.", type: "success" });
            }

            setIsHostModalOpen(false);
            setContestForm({ title: "", description: "", date: "", duration: "", level: "EASY", tags: "" });
            fetchData(); // Refresh list to see changes
        } catch (err) {
            console.error(err);
            setDialog({ show: true, message: "Error submitting proposal: " + err.message, type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pt-28">
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

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-12">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-neon-cyan transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        // RETURN_HOME
                    </Link>

                    {user && (
                        <button
                            onClick={() => openHostModal(null)}
                            className="bg-neon-green/10 border border-neon-green text-neon-green px-4 py-2 font-mono text-xs flex items-center gap-2 hover:bg-neon-green hover:text-black transition-colors"
                        >
                            <Plus size={16} /> HOST_CONTEST
                        </button>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-bold font-sans mb-6">
                        COMPETITIVE_ARENA <span className="text-neon-cyan">_</span>
                    </h1>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
                        {["ALL", "LIVE", "UPCOMING", "PAST", ...(user ? ["HOSTED"] : [])].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1 font-mono text-sm transition-colors relative ${filter === f ? "text-neon-cyan" : "text-gray-500 hover:text-white"
                                    }`}
                            >
                                {f}
                                {filter === f && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {loading ? (
                    <div className="font-mono text-neon-cyan animate-pulse">LOADING_ARENA_DATA...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Contest Cards */}
                        <div className="lg:col-span-2 space-y-4">
                            {filteredData.length === 0 ? (
                                <div className="py-20 text-center border border-white/10 border-dashed text-gray-500 font-mono">
                                    NO CONTESTS FOUND IN THIS SECTOR. START ONE?
                                </div>
                            ) : (
                                filteredData.map((contest, i) => (
                                    <motion.div
                                        key={contest.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative p-6 bg-white/5 border border-white/10 hover:border-neon-cyan transition-colors flex flex-col justify-between gap-4"
                                    >
                                        <div className="absolute top-0 right-0 p-2 md:hidden">
                                            <span className="text-xs font-mono text-gray-500">[{contest.status}]</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-bold font-sans group-hover:text-neon-cyan transition-colors">{contest.title}</h3>
                                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${contest.level === 'HARD' ? 'border-red-500 text-red-500' :
                                                        contest.level === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                                                            'border-green-500 text-green-500'
                                                        }`}>
                                                        {contest.level}
                                                    </span>
                                                </div>
                                                <div className="hidden md:block">
                                                    <span className={`text-xs font-mono px-2 py-1 rounded ${contest.status === 'LIVE' ? 'bg-neon-green/20 text-neon-green animate-pulse' :
                                                        contest.status === 'UPCOMING' ? 'bg-neon-cyan/20 text-neon-cyan' :
                                                            'bg-white/10 text-gray-500'
                                                        }`}>
                                                        {contest.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-gray-400 font-mono text-xs mb-4 line-clamp-2">{contest.description}</p>

                                            <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500 items-center justify-between">
                                                <div className="flex gap-4">
                                                    <span className="flex items-center gap-1"><Trophy size={12} className="text-yellow-500" /> {contest.host === user?.email ? "HOSTED_BY_YOU" : "COMMUNITY"}</span>
                                                    <span>//</span>
                                                    <span>DUR: {contest.duration || "2H"}</span>
                                                    <span>//</span>
                                                    <span>{contest.date ? new Date(contest.date).toLocaleDateString() : "TBA"}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    {user && contest.host === user.email && (
                                                        <button
                                                            onClick={() => openHostModal(contest)}
                                                            className="bg-white/5 hover:bg-neon-cyan/20 hover:text-neon-cyan text-gray-400 p-2 rounded transition-all"
                                                            title="Edit Contest"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    <Link href={`/contest-lobby?id=${contest.id}`}>
                                                        <button className="bg-white/10 hover:bg-neon-cyan hover:text-black text-white px-4 py-2 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer">
                                                            ENTER_LOBBY
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* RIGHT COLUMN: Interactive Feed */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Activity Feed */}
                            <div className="bg-[#0a0a0a] border border-white/10 p-6 sticky top-24">
                                <h3 className="text-sm font-bold font-sans text-gray-400 mb-4 flex items-center gap-2">
                                    <Activity size={16} className="text-neon-green" /> LIVE_NET_ACTIVITY
                                </h3>
                                <div className="space-y-4 font-mono text-xs max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {[
                                        { user: "ghost_rider", action: "solved", target: "Binary Bomb", time: "2m ago", color: "text-green-400" },
                                        { user: "system", action: "deployed", target: "Contest #42", time: "10m ago", color: "text-neon-cyan" },
                                        { user: "neo_1", action: "failed", target: "Matrix Matrix", time: "15m ago", color: "text-red-400" },
                                        { user: "trinity", action: "joined", target: "Lobby Alpha", time: "22m ago", color: "text-gray-400" },
                                        { user: "cipher", action: "solved", target: "RSA Keygen", time: "45m ago", color: "text-green-400" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-2 items-start border-l border-white/5 pl-3">
                                            <span className="text-gray-600 whitespace-nowrap">{item.time}</span>
                                            <div>
                                                <span className="text-white font-bold">{item.user}</span>
                                                <span className={`mx-1 ${item.color}`}>{item.action}</span>
                                                <span className="text-gray-400">{item.target}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mini Leaderboard */}
                            <div className="bg-[#0a0a0a] border border-white/10 p-6 sticky top-[400px]">
                                <h3 className="text-sm font-bold font-sans text-gray-400 mb-4 flex items-center gap-2">
                                    <Trophy size={16} className="text-yellow-500" /> TOP_OPERATIVES
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { rank: 1, name: "ZeroCool", score: 9850 },
                                        { rank: 2, name: "AcidBurn", score: 9200 },
                                        { rank: 3, name: "CerealK", score: 8950 },
                                    ].map((p) => (
                                        <div key={p.rank} className="flex justify-between items-center text-sm font-mono bg-white/5 p-2 px-3 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold ${p.rank === 1 ? 'text-yellow-500' : p.rank === 2 ? 'text-gray-300' : 'text-orange-400'}`}>#{p.rank}</span>
                                                <span className="text-gray-300">{p.name}</span>
                                            </div>
                                            <span className="text-neon-cyan">{p.score}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                    <button className="text-xs text-gray-500 hover:text-white font-mono flex items-center justify-center gap-2 w-full transition-colors">
                                        VIEW_GLOBAL_RANKINGS <Zap size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Host Contest Modal */}
            <AnimatePresence>
                {isHostModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setIsHostModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold font-sans mb-2 text-white">{editingContestId ? "EDIT_OPERATION" : "INITIALIZE_CONTEST"}</h2>
                            <p className="text-gray-500 font-mono text-xs mb-6">
                                {editingContestId ? "Modify your operational parameters." : "Create a coding arena. Admins must approve before it goes LIVE."}
                            </p>

                            <form onSubmit={handleHostSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">ARENA_TITLE</label>
                                    <input
                                        type="text"
                                        required
                                        value={contestForm.title}
                                        onChange={e => setContestForm({ ...contestForm, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                        placeholder="Weekly Code Sprint #42"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">RULES_OF_ENGAGEMENT (Description)</label>
                                    <textarea
                                        required
                                        value={contestForm.description}
                                        onChange={e => setContestForm({ ...contestForm, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none h-24 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">START_TIME</label>
                                        <DatePicker
                                            selected={contestForm.date ? new Date(contestForm.date) : null}
                                            onChange={(date) => setContestForm({ ...contestForm, date: date ? date.toISOString() : "" })}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            placeholderText="Select Launch Time..."
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none font-mono text-sm"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
                                        >
                                            <div className="text-center p-2 border-t border-white/10">
                                                <span className="text-xs text-neon-cyan font-mono animate-pulse">SYSTEM_TIME_SYNC...</span>
                                            </div>
                                        </DatePicker>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">DURATION</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 2 Hours"
                                            value={contestForm.duration}
                                            onChange={e => setContestForm({ ...contestForm, duration: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">DIFFICULTY_LEVEL</label>
                                        <select
                                            value={contestForm.level}
                                            onChange={e => setContestForm({ ...contestForm, level: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                        >
                                            <option value="EASY">EASY</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HARD">HARD</option>
                                            <option value="INSANE">INSANE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">TAGS</label>
                                        <input
                                            type="text"
                                            placeholder="DP, Graphs, Strings"
                                            value={contestForm.tags}
                                            onChange={e => setContestForm({ ...contestForm, tags: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                        />
                                    </div>
                                </div>


                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-neon-green text-black font-bold font-mono py-3 mt-4 hover:opacity-90 disabled:opacity-50"
                                >
                                    {submitting ? "INITIALIZING..." : (editingContestId ? "UPDATE_OPERATION" : "CREATE_LOBBY")}
                                </button>
                            </form>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
