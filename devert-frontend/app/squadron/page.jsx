"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Filter, Cpu, Wifi, Shield, Zap, UserPlus, Code, Terminal, MessageSquare, ArrowLeft, X, CheckCircle, XCircle, Edit3, Save, StopCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import FeatureGuard from "@/components/feature-guard";

export default function SquadronPage() {
    return (
        <FeatureGuard feature="squadron">
            <SquadronPageContent />
        </FeatureGuard>
    );
}

function SquadronPageContent() {
    const [filter, setFilter] = useState("ALL"); // ALL, ONLINE
    const [searchTerm, setSearchTerm] = useState("");
    const [operatives, setOperatives] = useState([]);
    const [editedOperatives, setEditedOperatives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });
    const { user, userData } = useAuth();
    const isAdmin = user?.email === "admin@devert.in";

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        role: "Frontend Developer",
        stack: "",
        level: "Rank 1",
        lookingFor: "",
    });

    const fetchOperatives = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "squadron"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by recently added if timestamp exists, else shuffle or keep order
            items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setOperatives(items);
            setEditedOperatives(JSON.parse(JSON.stringify(items)));
        } catch (error) {
            console.error("Error fetching squadron:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperatives();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.squadron === false) setIsModuleEnabled(false);
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
                squadron: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
            setDialog({ show: true, message: "FAILED_TO_TOGGLE_MODULE", type: "error" });
        }
    }

    const handleEditChange = (id, field, value) => {
        setEditedOperatives(prev => prev.map(op => {
            if (op.id === id) {
                // Special handling for stack array input (comma separated)
                if (field === 'stack') {
                    return { ...op, stack: value.split(',').map(s => s.trim()) };
                }
                return { ...op, [field]: value };
            }
            return op;
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            editedOperatives.forEach(op => {
                const docRef = doc(db, "squadron", op.id);
                const { id, ...data } = op;
                batch.update(docRef, data);
            });

            await batch.commit();
            setOperatives(JSON.parse(JSON.stringify(editedOperatives)));
            setDialog({ show: true, message: "TEAM_DATABASE_UPDATED", type: "success" });
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving changes:", err);
            setDialog({ show: true, message: "UPDATE_FAILED: " + err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!user) {
            setDialog({ show: true, message: "LOGIN_REQUIRED_TO_BROADCAST", type: "error" });
            return;
        }

        try {
            await addDoc(collection(db, "squadron"), {
                name: userData?.displayName || user.email.split('@')[0],
                role: formData.role,
                stack: formData.stack.split(',').map(s => s.trim()).filter(s => s),
                level: formData.level,
                status: "ONLINE",
                lookingFor: formData.lookingFor,
                matchRate: Math.floor(Math.random() * (99 - 70 + 1) + 70), // Mock match rate for now
                createdAt: serverTimestamp(),
                userId: user.uid
            });
            setIsModalOpen(false);
            setDialog({ show: true, message: "SIGNAL_BROADCAST_SUCCESSFUL", type: "success" });
            fetchOperatives(); // Refresh list
        } catch (error) {
            console.error("Error broadcasting signal:", error);
            setDialog({ show: true, message: "BROADCAST_FAILED: " + error.message, type: "error" });
        }
    };

    // Choose data source
    const displayData = isEditing ? editedOperatives : operatives;

    const filteredOperatives = displayData.filter(op => {
        const matchesFilter = filter === "ALL" || (filter === "ONLINE" && op.status === "ONLINE");
        const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.stack?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-32 px-4 md:px-8 relative overflow-hidden">
            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${dialog.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-neon-green/10 text-neon-green'}`}>
                            {dialog.type === 'error' ? <XCircle size={32} /> : <CheckCircle size={32} />}
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

            {/* Background Grid */}
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Admin Disabled Warning */}
                {!isModuleEnabled && isAdmin && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500 flex items-center justify-between animate-pulse">
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

                <div className="mb-6">
                    <Link href="/" className="text-gray-500 hover:text-white flex items-center transition-colors w-fit font-mono text-xs group">
                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN HOME
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-neon-green font-mono text-xs animate-pulse">
                            <Wifi size={14} /> SYSTEM: ONLINE
                            {isEditing && <span className="text-red-500 ml-2 animate-none">[ADMIN_EDIT_PROTOCOL]</span>}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-sans mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                            AGENT TEAMS
                        </h1>
                        <p className="text-gray-400 font-mono text-sm max-w-xl">
                            Connect with developers. Build your agent team. Deploy systems.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-4">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={toggleModuleStatus}
                                    className={`border px-4 py-3 font-mono text-sm font-bold flex items-center gap-2 transition-colors ${isModuleEnabled
                                        ? "bg-neon-green/10 border-neon-green text-neon-green hover:bg-red-500 hover:border-red-500 hover:text-white"
                                        : "bg-red-500/10 border-red-500 text-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black"
                                        }`}
                                    title={isModuleEnabled ? "Disable Public Access" : "Enable Public Access"}
                                >
                                    {isModuleEnabled ? <><Eye size={16} /> MODULE_ACTIVE</> : <><EyeOff size={16} /> MODULE_OFFLINE</>}
                                </button>
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            setEditedOperatives(JSON.parse(JSON.stringify(operatives)));
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className={`border px-4 py-3 font-mono text-sm font-bold flex items-center gap-2 transition-colors ${isEditing
                                        ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        : "bg-white/5 border-white/10 text-white hover:bg-neon-cyan hover:text-black"
                                        }`}
                                >
                                    {isEditing ? <><X size={16} /> CANCEL</> : <><Edit3 size={16} /> ADMIN_EDIT</>}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-neon-cyan text-black px-6 py-3 font-bold font-mono text-sm flex items-center hover:bg-white transition-colors"
                        >
                            <UserPlus size={16} className="mr-2" /> CREATE PROFILE
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH_BY_CALLSIGN_OR_STACK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-white font-mono text-sm focus:border-neon-cyan outline-none transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("ALL")}
                            className={`px-4 py-2 border font-mono text-xs transition-colors ${filter === "ALL" ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan" : "bg-white/10 border-white/10 text-white hover:border-gray-500"}`}
                        >
                            Ver: ALL
                        </button>
                        <button
                            onClick={() => setFilter("ONLINE")}
                            className={`px-4 py-2 border font-mono text-xs transition-colors ${filter === "ONLINE" ? "bg-neon-green/20 border-neon-green text-neon-green" : "bg-white/10 border-white/10 text-white hover:border-gray-500"}`}
                        >
                            STATUS: ONLINE
                        </button>
                    </div>
                </div>

                {/* Operatives Grid */}
                {loading ? (
                    <div className="text-center py-20 text-neon-cyan font-mono animate-pulse">
                        LOADING PROFILES...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOperatives.length === 0 ? (
                            <div className="col-span-full text-center py-20 border border-white/10 border-dashed text-gray-500 font-mono">
                                NO PROFILES FOUND. CREATE YOUR PROFILE TO START.
                            </div>
                        ) : (
                            filteredOperatives.map((op) => (
                                <OperativeCard
                                    key={op.id}
                                    data={op}
                                    isEditing={isEditing}
                                    onUpdate={(field, value) => handleEditChange(op.id, field, value)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Admin Save Bar */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-neon-cyan z-50 flex items-center justify-between"
                    >
                        <div className="text-neon-cyan font-mono text-sm animate-pulse">
                            ADMIN_MODE_ACTIVE // UNSAVED_CHANGES
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedOperatives(JSON.parse(JSON.stringify(operatives)));
                                }}
                                className="px-6 py-2 border border-red-500 text-red-500 font-mono text-sm hover:bg-red-500/10"
                            >
                                DISCARD
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="px-6 py-2 bg-neon-cyan text-black font-bold font-mono text-sm hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <><StopCircle className="animate-spin" size={16} /> SAVING...</> : <><Save size={16} /> SAVE_CHANGES</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-neon-cyan/50 p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] z-10"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>

                            <div className="flex items-center gap-2 text-neon-cyan mb-2 font-mono text-xs">
                                <Wifi size={14} className="animate-pulse" /> UPLINK_READY
                            </div>
                            <h2 className="text-2xl font-bold font-sans text-white mb-6">BROADCAST_SIGNAL</h2>

                            <form onSubmit={handleBroadcast} className="space-y-4">
                                <div>
                                    <label className="label">AGENT BUILDER ROLE</label>
                                    <input
                                        className="input"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        placeholder="e.g. Frontend Architect"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">TECH STACK (Comma Separated)</label>
                                    <input
                                        className="input"
                                        value={formData.stack}
                                        onChange={e => setFormData({ ...formData, stack: e.target.value })}
                                        placeholder="React, Node, AWS"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">CURRENT RANK</label>
                                        <input
                                            className="input"
                                            value={formData.level}
                                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                                            placeholder="Rank 42"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">STATUS</label>
                                        <div className="input flex items-center text-neon-green font-mono text-xs">
                                            ● ONLINE
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">CURRENT OBJECTIVE (Looking For)</label>
                                    <textarea
                                        className="input h-24 resize-none"
                                        value={formData.lookingFor}
                                        onChange={e => setFormData({ ...formData, lookingFor: e.target.value })}
                                        placeholder="Searching for a backend dev for GAI-2026..."
                                        required
                                    />
                                </div>

                                <button type="submit" className="w-full bg-neon-cyan text-black font-bold py-3 font-mono hover:bg-white transition-colors mt-2">
                                    TRANSMIT_BEACON
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .label { display: block; font-size: 0.65rem; font-family: monospace; color: #9ca3af; margin-bottom: 0.25rem; }
                .input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.75rem; color: white; font-family: sans-serif; outline: none; transition: border-color 0.2s; font-size: 0.875rem; }
                .input:focus { border-color: #00FFFF; }
            `}</style>
        </div>
    );
}

function OperativeCard({ data, isEditing, onUpdate }) {
    if (isEditing) {
        return (
            <div className="bg-[#0a0a0a] border border-dashed border-neon-cyan/50 p-6 relative">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            value={data.name}
                            onChange={(e) => onUpdate("name", e.target.value)}
                            className="bg-white/5 border border-white/10 p-2 font-bold font-sans text-white w-full"
                            placeholder="Name"
                        />
                        <select
                            value={data.status}
                            onChange={(e) => onUpdate("status", e.target.value)}
                            className="bg-white/5 border border-white/10 text-xs px-2 py-1 outline-none text-white"
                        >
                            <option value="ONLINE">ONLINE</option>
                            <option value="OFFLINE">OFFLINE</option>
                            <option value="BUSY">BUSY</option>
                        </select>
                    </div>

                    <input
                        value={data.role}
                        onChange={(e) => onUpdate("role", e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-sm text-neon-cyan w-full"
                        placeholder="Role"
                    />

                    <input
                        value={data.level}
                        onChange={(e) => onUpdate("level", e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs text-gray-500 w-full"
                        placeholder="Level"
                    />

                    <textarea
                        value={data.lookingFor}
                        onChange={(e) => onUpdate("lookingFor", e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs text-gray-300 w-full h-16 resize-none"
                        placeholder="Current Objective"
                    />

                    <div className="text-xs text-gray-500">STACK (Comma Separated):</div>
                    <input
                        value={Array.isArray(data.stack) ? data.stack.join(", ") : data.stack}
                        onChange={(e) => onUpdate("stack", e.target.value)} // Handled in parent
                        className="bg-white/5 border border-white/10 p-2 text-xs text-gray-300 w-full"
                        placeholder="React, Node, etc."
                    />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="bg-[#0a0a0a] border border-white/10 hover:border-neon-cyan/50 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent group-hover:via-neon-cyan/50"></div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-neon-cyan font-bold font-mono text-lg uppercase">
                            {data.name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <h3 className="font-bold font-sans text-white text-lg">{data.name}</h3>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                                <span className={data.status === 'ONLINE' ? 'text-neon-green' : 'text-gray-600'}>● {data.status}</span>
                                <span>|</span>
                                <span>{data.level}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 mb-1">COMPATIBILITY</div>
                        <div className="text-2xl font-bold text-neon-green">{data.matchRate || 85}%</div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-xs font-mono text-gray-500 mb-2">ROLE</div>
                    <div className="text-sm text-white font-sans font-bold flex items-center gap-2">
                        <Shield size={14} className="text-neon-cyan" /> {data.role}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-xs font-mono text-gray-500 mb-2">TECH_STACK</div>
                    <div className="flex flex-wrap gap-2">
                        {data.stack && data.stack.map((tech, i) => (
                            <span key={i} className="text-[10px] font-mono px-2 py-1 bg-white/5 border border-white/10 text-gray-300">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-6">
                    <div className="text-xs font-mono text-gray-500 mb-1">CURRENT_OBJECTIVE</div>
                    <p className="text-sm text-gray-300 italic">"{data.lookingFor}"</p>
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan py-2 font-mono text-xs font-bold hover:bg-neon-cyan hover:text-black transition-all flex items-center justify-center gap-2">
                        <MessageSquare size={14} /> COMM_LINK
                    </button>
                    <button className="flex-1 bg-white/5 border border-white/10 text-white py-2 font-mono text-xs font-bold hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                        <UserPlus size={14} /> INVITE
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
