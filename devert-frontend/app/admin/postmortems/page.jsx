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
    XCircle,
    Copy,
    Shield,
    Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function PostmortemsManager() {
    const [postmortems, setPostmortems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPm, setCurrentPm] = useState(null);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Initial Form State
    const initialFormState = {
        title: "",
        id: "", // Mission ID
        status: "LOST", // LOST or WON
        teamSize: 4,
        rank: "",
        stack: "", // Comma separated string for input
        whyLost: "", // PRIMARY_OUTCOME_FACTOR
        whyWon: "", // PRIMARY_OUTCOME_FACTOR
        winningSignals: "", // Newline separated
        criticalMistakes: "", // Newline separated
        patchIfRedeployed: "", // Newline separated
        verdict: "",
        date: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    const fetchPostmortems = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "postmortems"));
            const items = querySnapshot.docs.map(doc => ({
                docId: doc.id,
                ...doc.data()
            }));
            setPostmortems(items);
        } catch (error) {
            console.error("Error fetching postmortems:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPostmortems();
    }, []);

    // Handlers
    const openAddModal = () => {
        setCurrentPm(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (pm) => {
        setCurrentPm(pm);
        setFormData({
            title: pm.title,
            id: pm.id,
            status: pm.status,
            teamSize: pm.teamSize,
            rank: pm.rank,
            stack: pm.stack ? pm.stack.join(", ") : "",
            whyLost: pm.whyLost || "",
            whyWon: pm.whyWon || "",
            winningSignals: pm.winningSignals ? pm.winningSignals.join("\n") : "",
            criticalMistakes: pm.criticalMistakes ? pm.criticalMistakes.join("\n") : "",
            patchIfRedeployed: pm.patchIfRedeployed ? pm.patchIfRedeployed.join("\n") : "",
            verdict: pm.verdict,
            date: pm.date
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (docId) => {
        if (!confirm("Delete this performance record?")) return;
        try {
            await deleteDoc(doc(db, "postmortems", docId));
            setPostmortems(prev => prev.filter(p => p.docId !== docId));
        } catch (error) {
            setDialog({ show: true, message: "Failed to delete: " + error.message, type: "error" });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Process arrays
        const processArray = (str) => str.split('\n').map(s => s.trim()).filter(s => s);
        const processTags = (str) => str.split(',').map(s => s.trim()).filter(s => s);

        const dataToSave = {
            ...formData,
            stack: processTags(formData.stack),
            winningSignals: processArray(formData.winningSignals),
            criticalMistakes: processArray(formData.criticalMistakes),
            patchIfRedeployed: processArray(formData.patchIfRedeployed),
            teamSize: parseInt(formData.teamSize) || 0,
            updatedAt: new Date().toISOString()
        };

        // Clean up empty fields based on status
        if (dataToSave.status === "WON") {
            delete dataToSave.whyLost;
            delete dataToSave.criticalMistakes;
            // Ensure won fields exist
            if (!dataToSave.whyWon) dataToSave.whyWon = "N/A";
        } else {
            delete dataToSave.whyWon;
            delete dataToSave.winningSignals;
            // Ensure lost fields exist
            if (!dataToSave.whyLost) dataToSave.whyLost = "N/A";
        }

        try {
            if (currentPm) {
                const docRef = doc(db, "postmortems", currentPm.docId);
                await updateDoc(docRef, dataToSave);
                setPostmortems(prev => prev.map(p => p.docId === currentPm.docId ? { ...p, ...dataToSave } : p));
            } else {
                const docRef = await addDoc(collection(db, "postmortems"), {
                    ...dataToSave,
                    createdAt: new Date().toISOString()
                });
                setPostmortems(prev => [...prev, { docId: docRef.id, ...dataToSave }]);
            }
            setIsModalOpen(false);
        } catch (error) {
            setDialog({ show: true, message: "Failed to save: " + error.message, type: "error" });
        }
    };

    const handleSeed = async () => {
        if (!confirm("WARNING: This will DELETE ALL existing PERFORMANCE LOGS and replace them with REAL EXAMPLES. Proceed?")) return;

        const realPostmortems = [
            {
                title: "ETHIndia 2025",
                id: "ETH-2025-01",
                status: "WON",
                teamSize: 4,
                rank: "Top 10",
                stack: ["Solidity", "Next.js", "Hardhat"],
                whyWon: "Flawless minimal demo focused on one core feature.",
                winningSignals: ["Pitch was rehearsed 50 times", "UI was fully polished", "Contract was verified"],
                date: "2025-12-04",
                verdict: "Victory through simplicity."
            },
            {
                title: "Smart India Hackathon 2024",
                id: "SIH-2024-FN",
                status: "LOST",
                teamSize: 6,
                rank: "Finalist",
                stack: ["Django", "React", "PostgreSQL"],
                whyLost: "Backend server crashed during live demo due to unhandled exception.",
                criticalMistakes: ["No offline backup video", "Last minute merge conflict", "Spaghetti code"],
                patchIfRedeployed: ["Dockerize everything", "Record backup demo"],
                date: "2024-08-20",
                verdict: "Hard lesson in reliability."
            },
            {
                title: "HackMIT",
                id: "MIT-2025",
                status: "WON",
                teamSize: 3,
                rank: "Track Winner",
                stack: ["Python", "TensorFlow", "FastAPI"],
                whyWon: "Solved a genuine user pain point with a novel AI approach.",
                winningSignals: ["Judges loved the problem statement", "Novel algorithm"],
                date: "2025-09-15",
                verdict: "Innovation wins over complexity."
            }
        ];

        setLoading(true);
        try {
            // 1. Clear existing data
            const snapshot = await getDocs(collection(db, "postmortems"));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "postmortems", d.id)));
            await Promise.all(deletePromises);

            // 2. Add new data
            const addPromises = realPostmortems.map(pm =>
                addDoc(collection(db, "postmortems"), {
                    ...pm,
                    createdAt: new Date().toISOString()
                })
            );
            await Promise.all(addPromises);
            setDialog({ show: true, message: "Performance Archives Refreshed.", type: "success" });
            fetchPostmortems();
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
                    <h1 className="text-3xl font-bold font-sans text-white">PERFORMANCE_LOGS</h1>
                    <p className="font-mono text-xs text-gray-500">Analyze agent deployment success patterns.</p>
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
                        <Plus size={16} className="mr-2" /> NEW_ANALYSIS
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-neon-cyan font-mono animate-pulse">Retrieving archived logs...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {postmortems.map((pm) => (
                        <div
                            key={pm.docId}
                            className={`bg-black/40 border border-white/10 p-6 hover:border-white/30 transition-colors group flex justify-between items-center ${pm.status === 'WON' ? 'border-l-4 border-l-neon-green' : 'border-l-4 border-l-red-500'}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`font-mono text-xs font-bold ${pm.status === 'WON' ? 'text-neon-green' : 'text-red-500'}`}>
                                        {pm.status}
                                    </span>
                                    <span className="text-gray-600 font-mono text-xs">|</span>
                                    <span className="font-mono text-xs text-gray-400">{pm.id}</span>
                                </div>
                                <h3 className="text-lg font-bold font-sans text-white">{pm.title}</h3>
                                <div className="mt-2 text-xs font-mono text-gray-500 flex gap-4">
                                    <span>Rank: {pm.rank}</span>
                                    <span>Team: {pm.teamSize}</span>
                                    <span>Verdt: {pm.verdict && pm.verdict.substring(0, 30)}...</span>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(pm)} className="p-2 hover:bg-white/10 text-neon-cyan rounded"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(pm.docId)} className="p-2 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {postmortems.length === 0 && <div className="text-gray-500 font-mono text-center py-10">NO LOGS FOUND</div>}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                            <h2 className="text-xl font-bold font-sans text-white mb-6">PERFORMANCE_LOG_ENTRY</h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">MISSION ID</label>
                                        <input className="input" required value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="GAI-2026" />
                                    </div>
                                    <div>
                                        <label className="label">STATUS</label>
                                        <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="LOST">LOST</option>
                                            <option value="WON">WON</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">EVENT TITLE</label>
                                    <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">TEAM SIZE</label>
                                        <input type="number" className="input" required value={formData.teamSize} onChange={e => setFormData({ ...formData, teamSize: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">RANK / SCORE</label>
                                        <input className="input" required value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} placeholder="42/1200" />
                                    </div>
                                    <div>
                                        <label className="label">DATE</label>
                                        <DatePicker
                                            selected={formData.date ? new Date(formData.date) : null}
                                            onChange={(date) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : "" })}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="MISSION_DATE"
                                            className="input w-full"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">TECH STACK (Comma separated)</label>
                                    <input className="input" value={formData.stack} onChange={e => setFormData({ ...formData, stack: e.target.value })} placeholder="React, Solidity, Python" />
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <label className="label flex items-center gap-2">
                                        <Activity size={12} />
                                        {formData.status === 'WON' ? 'PRIMARY WIN FACTOR' : 'PRIMARY OUTCOME FACTOR (Why we lost)'}
                                    </label>
                                    <textarea
                                        className="input h-20 resize-none"
                                        required
                                        value={formData.status === 'WON' ? formData.whyWon : formData.whyLost}
                                        onChange={e => setFormData({
                                            ...formData,
                                            [formData.status === 'WON' ? 'whyWon' : 'whyLost']: e.target.value
                                        })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">
                                            {formData.status === 'WON' ? 'WINNING SIGNALS' : 'CRITICAL MISTAKES'} (One per line)
                                        </label>
                                        <textarea
                                            className="input h-32 resize-none font-mono text-xs"
                                            value={formData.status === 'WON' ? formData.winningSignals : formData.criticalMistakes}
                                            onChange={e => setFormData({
                                                ...formData,
                                                [formData.status === 'WON' ? 'winningSignals' : 'criticalMistakes']: e.target.value
                                            })}
                                            placeholder="- Item 1&#10;- Item 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">PATCH IF REDEPLOYED (One per line)</label>
                                        <textarea
                                            className="input h-32 resize-none font-mono text-xs"
                                            value={formData.patchIfRedeployed}
                                            onChange={e => setFormData({ ...formData, patchIfRedeployed: e.target.value })}
                                            placeholder="- Cut features&#10;- Better demo"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">FINAL VERDICT</label>
                                    <input className="input" required value={formData.verdict} onChange={e => setFormData({ ...formData, verdict: e.target.value })} />
                                </div>

                                <button type="submit" className="btn-primary w-full mt-4">SAVE RECORD</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .label { display: block; font-size: 0.65rem; font-family: monospace; color: #9ca3af; margin-bottom: 0.25rem; }
                .input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; color: white; font-family: sans-serif; outline: none; transition: border-color 0.2s; }
                .input:focus { border-color: #00FFFF; }
                .btn-primary { background: #00FFFF; color: black; font-weight: bold; font-family: monospace; padding: 0.75rem; text-transform: uppercase; transition: all 0.2s; }
                .btn-primary:hover { background: white; }
            `}</style>
        </div>
    );
}
