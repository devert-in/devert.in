"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Code, Plus, X, Shield, CheckCircle, Share2, Edit3, Save, Trash2, StopCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, writeBatch, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Copy } from "lucide-react";
import FeatureGuard from "@/components/feature-guard";

export default function HackathonsPage() {
    return (
        <FeatureGuard feature="hackathons">
            <HackathonsPageContent />
        </FeatureGuard>
    );
}

function HackathonsPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const isAdmin = user?.email?.includes("admin");

    const [hackathons, setHackathons] = useState([]);
    const [editedHackathons, setEditedHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, OPEN, UPCOMING, CLOSED
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });
    const [shareMenuOpen, setShareMenuOpen] = useState(null);

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

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
        fetchData();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.hackathons === false) setIsModuleEnabled(false);
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
                hackathons: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
            setDialog({ show: true, message: "FAILED_TO_TOGGLE_MODULE", type: "error" });
        }
    }

    async function fetchData() {
        try {
            const querySnapshot = await getDocs(collection(db, "hackathons"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const sorted = data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
            setHackathons(sorted);
            setEditedHackathons(JSON.parse(JSON.stringify(sorted))); // Deep copy for editing
        } catch (error) {
            console.error("Error fetching hackathons:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleEditChange = (id, field, value) => {
        setEditedHackathons(prev => prev.map(h => {
            if (h.id === id) {
                return { ...h, [field]: value };
            }
            return h;
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            editedHackathons.forEach(hack => {
                const docRef = doc(db, "hackathons", hack.id);
                // Compare with original to only update changed? For now just update all for simplicity in this turn
                // Remove id from data
                const { id, ...data } = hack;
                batch.update(docRef, data);
            });

            await batch.commit();
            setHackathons(JSON.parse(JSON.stringify(editedHackathons)));
            setDialog({ show: true, message: "ALL_SYSTEMS_UPDATED", type: "success" });
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving changes:", err);
            setDialog({ show: true, message: "SAVE_FAILED: " + err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    // Use editedHackathons for rendering if editing, otherwise original hackathons (to prevent UI jump before save)
    // Actually, always render from 'hackathons' when not editing, and 'editedHackathons' when editing
    const displayData = isEditing ? editedHackathons : hackathons;

    const filteredData = displayData.filter(h => {
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
            fetchData(); // Refresh list
        } catch (err) {
            console.error(err);
            setDialog({ show: true, message: "Error submitting proposal.", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 pt-28 pb-32">
            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card-bg border border-border p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${dialog.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-neon-green/10 text-neon-green'}`}>
                            {dialog.type === 'error' ? <Shield size={32} /> : <CheckCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold font-sans text-foreground mb-2">{dialog.type === 'error' ? 'SYSTEM_ERROR' : 'OPERATION_COMPLETE'}</h3>
                        <p className="font-mono text-sm text-muted-foreground mb-6">{dialog.message}</p>
                        <button
                            onClick={() => setDialog({ ...dialog, show: false })}
                            className="w-full bg-border hover:bg-neon-cyan/20 text-foreground font-mono py-2 text-sm uppercase tracking-wider transition-colors"
                        >
                            CLOSE_DIALOG
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
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

                <div className="flex justify-between items-start mb-12">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-neon-cyan transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        // RETURN_HOME
                    </Link>

                    <div className="flex gap-4">
                        {isAdmin && (
                            <>
                                <button
                                    onClick={toggleModuleStatus}
                                    className={`border px-4 py-2 font-mono text-xs flex items-center gap-2 transition-colors ${isModuleEnabled
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
                                            // Cancel edits
                                            setEditedHackathons(JSON.parse(JSON.stringify(hackathons)));
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className={`border px-4 py-2 font-mono text-xs flex items-center gap-2 transition-colors ${isEditing
                                        ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        : "bg-neon-cyan/10 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black"
                                        }`}
                                >
                                    {isEditing ? <><X size={16} /> CANCEL_EDIT</> : <><Edit3 size={16} /> ADMIN_EDIT</>}
                                </button>
                            </>
                        )}

                        {user && (
                            <button
                                onClick={() => setIsHostModalOpen(true)}
                                className="bg-neon-green/10 border border-neon-green text-neon-green px-4 py-2 font-mono text-xs flex items-center gap-2 hover:bg-neon-green hover:text-black transition-colors"
                            >
                                <Plus size={16} /> HOST_CONTEST
                            </button>
                        )}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-bold font-sans mb-6">
                        ACTIVE HACKATHONS <span className="text-neon-cyan">_</span>
                        {isEditing && <span className="text-red-500 text-sm align-middle ml-4 animate-pulse">[ADMIN_OVERRIDE_ACTIVE]</span>}
                    </h1>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-4 border-b border-border pb-4">
                        {["ALL", "OPEN", "UPCOMING", "CLOSED"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1 font-mono text-sm transition-colors relative ${filter === f ? "text-neon-cyan" : "text-muted-foreground hover:text-foreground"
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
                            <div className="col-span-full py-20 text-center border border-border border-dashed text-muted-foreground font-mono">
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
                                        if (isEditing) return; // Disable click nav when editing
                                        if (hack.isSpecialEvent) {
                                            router.push("/challenge");
                                        } else {
                                            router.push(`/hackathons/${hack.id}`);
                                        }
                                    }}
                                    className={`group relative p-6 bg-card-bg border transition-colors ${isEditing ? 'border-dashed border-neon-cyan/50 cursor-default' : 'border-border hover:border-neon-cyan cursor-pointer'}`}
                                >
                                    {isEditing ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-mono text-gray-500">ID: {hack.id}</span>
                                                <select
                                                    value={hack.status}
                                                    onChange={(e) => handleEditChange(hack.id, "status", e.target.value)}
                                                    className="bg-background border border-border text-xs px-2 py-1 outline-none text-foreground"
                                                >
                                                    <option value="OPEN">OPEN</option>
                                                    <option value="UPCOMING">UPCOMING</option>
                                                    <option value="CLOSED">CLOSED</option>
                                                    <option value="PENDING">PENDING</option>
                                                </select>
                                            </div>

                                            <input
                                                value={hack.title}
                                                onChange={(e) => handleEditChange(hack.id, "title", e.target.value)}
                                                className="bg-background border border-border p-2 font-bold font-sans text-lg text-foreground w-full"
                                                placeholder="Title"
                                            />

                                            <textarea
                                                value={hack.description}
                                                onChange={(e) => handleEditChange(hack.id, "description", e.target.value)}
                                                className="bg-background border border-border p-2 font-mono text-xs text-muted-foreground w-full h-20 resize-none"
                                                placeholder="Description"
                                            />

                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    value={hack.date}
                                                    onChange={(e) => handleEditChange(hack.id, "date", e.target.value)}
                                                    className="bg-background border border-border p-1 font-mono text-xs text-foreground w-full"
                                                    placeholder="Date"
                                                />
                                                <input
                                                    value={hack.prizes}
                                                    onChange={(e) => handleEditChange(hack.id, "prizes", e.target.value)}
                                                    className="bg-background border border-border p-1 font-mono text-xs text-foreground w-full"
                                                    placeholder="Prize"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                            <p className="text-muted-foreground mb-6 font-mono text-sm h-20 overflow-hidden text-ellipsis">{hack.description}</p>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Calendar size={16} className="mr-2 text-neon-cyan" />
                                                    {hack.date}
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Code size={16} className="mr-2 text-neon-green" />
                                                    {hack.tags ? (Array.isArray(hack.tags) ? hack.tags.join(" / ") : hack.tags) : ""}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-border flex justify-between items-center">
                                                <span className="text-neon-green font-mono text-sm">{hack.prizes}</span>
                                                <div className="flex gap-2">
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShareMenuOpen(shareMenuOpen === hack.id ? null : hack.id);
                                                            }}
                                                            className={`bg-background hover:bg-border text-muted-foreground p-2 transition-all relative z-10 ${shareMenuOpen === hack.id ? 'bg-border text-foreground' : ''}`}
                                                            title="Share Operation"
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                        {shareMenuOpen === hack.id && (
                                                            <div className="absolute bottom-full right-0 mb-2 w-32 bg-card-bg border border-border shadow-xl z-20 flex flex-col animate-in fade-in zoom-in-95 duration-100">
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
                                                                    className="px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-border text-left flex items-center gap-2"
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
                                                            ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                                            : 'bg-border hover:bg-neon-cyan/20 hover:text-neon-cyan text-foreground'
                                                            }`}
                                                    >
                                                        {hack.status === 'UPCOMING' ? 'COMING SOON' : 'VIEW DETAILS ->'}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
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
                        className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-neon-cyan z-50 flex items-center justify-between"
                    >
                        <div className="text-neon-cyan font-mono text-sm animate-pulse">
                            ADMIN_MODE_ACTIVE // UNSAVED_CHANGES_PENDING
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedHackathons(JSON.parse(JSON.stringify(hackathons))); // Revert
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
                                {saving ? <><StopCircle className="animate-spin" size={16} /> SAVING...</> : <><Save size={16} /> SAVE_ALL_CHANGES</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            className="bg-card-bg border border-border w-full max-w-lg p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setIsHostModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold font-sans mb-2 text-foreground">PROPOSE_NEW_OPERATION</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-6">Submitted proposals require admin approval before launch.</p>

                            <form onSubmit={handleHostSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-muted-foreground font-mono text-xs mb-1">OPERATION_TITLE</label>
                                    <input
                                        type="text"
                                        required
                                        value={contestForm.title}
                                        onChange={e => setContestForm({ ...contestForm, title: e.target.value })}
                                        className="w-full bg-background border border-border p-2 text-foreground focus:border-neon-green outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-muted-foreground font-mono text-xs mb-1">MISSION_BRIEF (Description)</label>
                                    <textarea
                                        required
                                        value={contestForm.description}
                                        onChange={e => setContestForm({ ...contestForm, description: e.target.value })}
                                        className="w-full bg-background border border-border p-2 text-foreground focus:border-neon-green outline-none h-24 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-muted-foreground font-mono text-xs mb-1">TIMELINE</label>
                                        <DatePicker
                                            selected={contestForm.date ? new Date(contestForm.date) : null}
                                            onChange={(date) => setContestForm({ ...contestForm, date: date ? date.toISOString() : "" })}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            placeholderText="Timeline..."
                                            className="w-full bg-background border border-border p-2 text-foreground focus:border-neon-green outline-none font-mono text-sm"
                                            calendarClassName="cyberpunk-datepicker shadow-2xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-muted-foreground font-mono text-xs mb-1">BOUNTY (Prizes)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. $10,000"
                                            value={contestForm.prizes}
                                            onChange={e => setContestForm({ ...contestForm, prizes: e.target.value })}
                                            className="w-full bg-background border border-border p-2 text-foreground focus:border-neon-green outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-muted-foreground font-mono text-xs mb-1">TECH_STACK (Comma separated)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="React, Solidity, Python..."
                                        value={contestForm.tags}
                                        onChange={e => setContestForm({ ...contestForm, tags: e.target.value })}
                                        className="w-full bg-background border border-border p-2 text-foreground focus:border-neon-green outline-none"
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
