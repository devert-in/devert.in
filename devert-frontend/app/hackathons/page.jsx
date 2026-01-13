"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Code, Plus, X, Lock, Shield, CheckCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Copy } from "lucide-react";

export default function HackathonsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, OPEN, UPCOMING, CLOSED
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });
    const [shareMenuOpen, setShareMenuOpen] = useState(null); // ID of the hackathon with open share menu

    // Hosting Modal State
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [contestForm, setContestForm] = useState({
        title: "",
        description: "",
        date: "",
        prizes: "",
        tags: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const querySnapshot = await getDocs(collection(db, "hackathons"));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by creation or date if needed, but for now just raw data. 
                // Admin can control order via dates or we Sort by date descending
                setHackathons(data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
            } catch (error) {
                console.error("Error fetching hackathons:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const filteredData = hackathons.filter(h => {
        if (filter === "ALL") return true;
        return h.status === filter;
    });

    const handleHostSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, "hackathons"), {
                ...contestForm,
                tags: contestForm.tags.split(",").map(t => t.trim()),
                status: "PENDING", // Requires admin approval
                host: user.email,
                type: "COMMUNITY_CONTEST",
                createdAt: new Date().toISOString()
            });
            setDialog({ show: true, message: "Contest Proposal Submitted! Awaiting Admin Approval.", type: "success" });
            setIsHostModalOpen(false);
            setContestForm({ title: "", description: "", date: "", prizes: "", tags: "" });
        } catch (err) {
            console.error(err);
            setDialog({ show: true, message: "Error submitting proposal.", type: "error" });
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
                            onClick={() => setIsHostModalOpen(true)}
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
                        ACTIVE HACKATHONS <span className="text-neon-cyan">_</span>
                    </h1>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-4 border-b border-white/10 pb-4">
                        {["ALL", "OPEN", "UPCOMING", "CLOSED"].map((f) => (
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
                    <div className="font-mono text-neon-cyan animate-pulse">LOADING_DATA_STREAM...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredData.length === 0 ? (
                            <div className="col-span-full py-20 text-center border border-white/10 border-dashed text-gray-500 font-mono">
                                NO OPERATIONS FOUND FOR FILTER '{filter}'
                            </div>
                        ) : (
                            filteredData.map((hack, i) => (
                                <motion.div
                                    key={hack.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}

                                    onClick={() => {
                                        if (hack.isSpecialEvent) {
                                            router.push("/challenge");
                                        } else {
                                            router.push(`/hackathons/${hack.id}`);
                                        }
                                    }}
                                    className="group relative p-6 bg-white/5 border border-white/10 hover:border-neon-cyan transition-colors cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className={`text-xs font-mono px-2 py-1 rounded ${hack.status === 'OPEN' ? 'bg-neon-green/20 text-neon-green' :
                                            hack.status === 'UPCOMING' ? 'bg-neon-cyan/20 text-neon-cyan' :
                                                hack.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-red-500/20 text-red-500'
                                            }`}>
                                            [{hack.status}]
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold font-sans mb-4 mt-2 group-hover:text-neon-cyan transition-colors">{hack.title}</h3>
                                    <p className="text-gray-400 mb-6 font-mono text-sm h-20 overflow-hidden text-ellipsis">{hack.description}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-300">
                                            <Calendar size={16} className="mr-2 text-neon-cyan" />
                                            {hack.date}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-300">
                                            <Code size={16} className="mr-2 text-neon-green" />
                                            {hack.tags ? (Array.isArray(hack.tags) ? hack.tags.join(" / ") : hack.tags) : ""}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-neon-green font-mono text-sm">{hack.prizes}</span>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShareMenuOpen(shareMenuOpen === hack.id ? null : hack.id);
                                                    }}
                                                    className={`bg-white/5 hover:bg-white/10 text-gray-400 p-2 transition-all relative z-10 ${shareMenuOpen === hack.id ? 'bg-white/20 text-white' : ''}`}
                                                    title="Share Operation"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                {shareMenuOpen === hack.id && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#0a0a0a] border border-white/20 shadow-xl z-20 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const link = hack.isSpecialEvent
                                                                    ? `${window.location.origin}/challenge`
                                                                    : `${window.location.origin}/hackathons/${hack.id}`;
                                                                navigator.clipboard.writeText(link);
                                                                setDialog({ show: true, message: "LINK_COPIED", type: "success" });
                                                                setShareMenuOpen(null);
                                                            }}
                                                            className="px-4 py-2 text-xs font-mono text-gray-300 hover:text-white hover:bg-white/10 text-left flex items-center gap-2"
                                                        >
                                                            <Copy size={12} /> COPY_LINK
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (hack.status === 'UPCOMING') return;
                                                    if (hack.isSpecialEvent) router.push("/challenge");
                                                    else router.push(`/hackathons/${hack.id}`);
                                                }}
                                                disabled={hack.status === 'UPCOMING'}
                                                className={`px-4 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer inline-block ${hack.status === 'UPCOMING'
                                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                                    : 'bg-white/10 hover:bg-neon-cyan/20 hover:text-neon-cyan text-white'
                                                    }`}
                                            >
                                                {hack.status === 'UPCOMING' ? 'COMING SOON' : 'VIEW DETAILS ->'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
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

                            <h2 className="text-2xl font-bold font-sans mb-2 text-white">PROPOSE_NEW_OPERATION</h2>
                            <p className="text-gray-500 font-mono text-xs mb-6">Submitted proposals require admin approval before launch.</p>

                            <form onSubmit={handleHostSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">OPERATION_TITLE</label>
                                    <input
                                        type="text"
                                        required
                                        value={contestForm.title}
                                        onChange={e => setContestForm({ ...contestForm, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">MISSION_BRIEF (Description)</label>
                                    <textarea
                                        required
                                        value={contestForm.description}
                                        onChange={e => setContestForm({ ...contestForm, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none h-24 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">TIMELINE</label>
                                        <DatePicker
                                            selected={contestForm.date ? new Date(contestForm.date) : null}
                                            onChange={(date) => setContestForm({ ...contestForm, date: date ? date.toISOString() : "" })}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            placeholderText="Timeline..."
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none font-mono text-sm"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 font-mono text-xs mb-1">BOUNTY (Prizes)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. $10,000"
                                            value={contestForm.prizes}
                                            onChange={e => setContestForm({ ...contestForm, prizes: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">TECH_STACK (Comma separated)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="React, Solidity, Python..."
                                        value={contestForm.tags}
                                        onChange={e => setContestForm({ ...contestForm, tags: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-2 text-white focus:border-neon-green outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-neon-green text-black font-bold font-mono py-3 mt-4 hover:opacity-90 disabled:opacity-50"
                                >
                                    {submitting ? "TRANSMITTING..." : "SUBMIT_PROPOSAL"}
                                </button>
                            </form>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
