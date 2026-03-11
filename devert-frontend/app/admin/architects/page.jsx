"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, updateDoc, doc, where, writeBatch } from "firebase/firestore";
import { Loader2, CheckCircle, XCircle, Shield, User, Search, Edit, Save, X, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchitectsAdminPage() {
    const [applications, setApplications] = useState([]);
    const [editedApplications, setEditedApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("PENDING"); // PENDING, APPROVED, REJECTED

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "executor_applications"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApplications(items);
            setEditedApplications(JSON.parse(JSON.stringify(items)));
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "executor_applications", id), {
                status: newStatus
            });
            // If approving, we might also want to update the core User document to have 'role: executor'
            // For now, we just track the application status.
            fetchApplications();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleEditChange = (id, field, value) => {
        setEditedApplications(prev => prev.map(app => {
            if (app.id === id) {
                return { ...app, [field]: value };
            }
            return app;
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            editedApplications.forEach(app => {
                // Only update if changed (optimization optional, but good practice)
                // For now, simpler to just update the ones in the current view or all
                // Since we have the whole list, let's just update all edited ones.
                // To be safe, we update only the fields we allow editing for.
                const docRef = doc(db, "executor_applications", app.id);
                const { id, createdAt, ...data } = app; // Exclude ID and createdAt from overwrite if needed, or just allow them
                batch.update(docRef, {
                    name: app.name,
                    email: app.email,
                    skills: app.skills,
                    availability: app.availability,
                    motivation: app.motivation,
                    portfolio: app.portfolio
                });
            });

            await batch.commit();
            setApplications(JSON.parse(JSON.stringify(editedApplications)));
            setIsEditing(false);
            alert("Changes saved successfully!");
        } catch (err) {
            console.error("Error saving changes:", err);
            alert("Failed to save changes: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const displayData = isEditing ? editedApplications : applications;
    const filteredApps = displayData.filter(app => app.status === filter);

    return (
        <div className="space-y-8 relative pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white mb-2">SQUAD OPS</h1>
                    <p className="text-gray-400 font-mono text-sm">Recruit, Vet, and Manage Architects.</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <button
                        onClick={() => {
                            if (isEditing) {
                                setEditedApplications(JSON.parse(JSON.stringify(applications)));
                                setIsEditing(false);
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        className={`border px-4 py-2 font-mono text-xs font-bold flex items-center gap-2 transition-colors ${isEditing
                            ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            : "bg-white/5 border-white/10 text-white hover:bg-neon-cyan hover:text-black"
                            }`}
                    >
                        {isEditing ? <><X size={14} /> CANCEL_EDIT</> : <><Edit size={14} /> EDIT_DETAILS</>}
                    </button>

                    <div className="flex gap-2 bg-white/5 p-1 rounded border border-white/10">
                        {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 text-xs font-mono rounded transition-colors ${filter === status
                                    ? 'bg-neon-cyan text-black font-bold'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-neon-cyan animate-pulse font-mono">
                    ACCESSING_PERSONNEL_FILES...
                </div>
            ) : filteredApps.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg text-gray-500 font-mono">
                    NO_RECORDS_FOUND_FOR_STATUS: {filter}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredApps.map((app) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-[#050505] border p-6 rounded-lg flex flex-col md:flex-row justify-between gap-6 transition-colors ${isEditing ? 'border-neon-cyan/50 border-dashed' : 'border-white/10 hover:border-white/20'}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <input
                                                value={app.name}
                                                onChange={(e) => handleEditChange(app.id, 'name', e.target.value)}
                                                className="bg-white/5 border border-white/10 p-2 font-bold text-white text-lg w-full"
                                                placeholder="Name"
                                            />
                                            <input
                                                value={app.email}
                                                onChange={(e) => handleEditChange(app.id, 'email', e.target.value)}
                                                className="bg-white/5 border border-white/10 p-2 text-xs font-mono text-gray-400 w-full"
                                                placeholder="Email"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-bold text-white">{app.name}</h3>
                                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/10">
                                                {app.email}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-mono mb-1">SKILLS</div>
                                        {isEditing ? (
                                            <input
                                                value={app.skills}
                                                onChange={(e) => handleEditChange(app.id, 'skills', e.target.value)}
                                                className="bg-white/5 border border-white/10 p-2 text-sm text-neon-cyan font-mono w-full"
                                            />
                                        ) : (
                                            <div className="text-sm text-neon-cyan font-mono">{app.skills}</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-mono mb-1">AVAILABILITY</div>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={app.availability}
                                                onChange={(e) => handleEditChange(app.id, 'availability', e.target.value)}
                                                className="bg-white/5 border border-white/10 p-2 text-sm text-white font-mono w-full"
                                            />
                                        ) : (
                                            <div className="text-sm text-white font-mono">{app.availability || "N/A"} Hrs/Wk</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase text-gray-500 font-mono mb-1">Motivation</div>
                                    {isEditing ? (
                                        <textarea
                                            value={app.motivation}
                                            onChange={(e) => handleEditChange(app.id, 'motivation', e.target.value)}
                                            className="bg-white/5 border border-white/10 p-2 text-sm text-gray-400 font-mono italic w-full h-20 resize-none"
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-400 font-mono italic">"{app.motivation}"</p>
                                    )}
                                </div>
                                <div className="mt-4">
                                    {isEditing ? (
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-mono">Portfolio Link</label>
                                            <input
                                                value={app.portfolio || ""}
                                                onChange={(e) => handleEditChange(app.id, 'portfolio', e.target.value)}
                                                className="bg-white/5 border border-white/10 p-2 text-xs text-blue-400 font-mono w-full"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    ) : (
                                        app.portfolio && (
                                            <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline font-mono">
                                                VIEW_PORTFOLIO_LINK
                                            </a>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[150px]">
                                {app.status === 'PENDING' && !isEditing && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                                            className="flex-1 bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green hover:text-black py-2 px-4 rounded font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} /> RECRUIT
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                            className="flex-1 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white py-2 px-4 rounded font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={14} /> REJECT
                                        </button>
                                    </>
                                )}
                                {app.status === 'APPROVED' && (
                                    <div className="text-neon-green font-mono text-sm font-bold flex items-center gap-2 justify-center h-full">
                                        <Shield size={16} /> OPERATIVE_ACTIVE
                                    </div>
                                )}
                                {app.status === 'REJECTED' && (
                                    <div className="text-red-500 font-mono text-sm font-bold flex items-center gap-2 justify-center h-full">
                                        <XCircle size={16} /> REJECTED
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="text-gray-500 text-xs font-mono text-center">
                                        Status Editing Disabled <br />(Use Buttons)
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
                                    setEditedApplications(JSON.parse(JSON.stringify(applications)));
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
        </div>
    );
}
