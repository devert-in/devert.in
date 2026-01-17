"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Rocket, Zap, Plus, X, Shield, CheckCircle, Lightbulb, ThumbsUp, Users, Target, Edit3, Save, StopCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FeatureGuard from "@/components/feature-guard";

export default function IncubatorPage() {
    return (
        <FeatureGuard feature="incubator">
            <IncubatorPageContent />
        </FeatureGuard>
    );
}

function IncubatorPageContent() {
    const { user } = useAuth();
    const router = useRouter();
    const isAdmin = user?.email?.includes("admin");

    const [ideas, setIdeas] = useState([]);
    const [editedIdeas, setEditedIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, TRENDING, NEW, MY_IDEAS
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Submit Idea Modal
    const [isIdaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [ideaForm, setIdeaForm] = useState({
        title: "",
        problem: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchIdeas();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.incubator === false) setIsModuleEnabled(false);
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
                incubator: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
            setDialog({ show: true, message: "FAILED_TO_TOGGLE_MODULE", type: "error" });
        }
    }

    const fetchIdeas = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "incubator_ideas"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            data.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

            if (data.length === 0) {
                setIdeas(MOCK_IDEAS);
                setEditedIdeas(JSON.parse(JSON.stringify(MOCK_IDEAS)));
            } else {
                setIdeas(data);
                setEditedIdeas(JSON.parse(JSON.stringify(data)));
            }
        } catch (error) {
            console.error("Error fetching ideas:", error);
            if (ideas.length === 0) {
                setIdeas(MOCK_IDEAS);
                setEditedIdeas(JSON.parse(JSON.stringify(MOCK_IDEAS)));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (id, field, value) => {
        setEditedIdeas(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);

            editedIdeas.forEach(idea => {
                // Skip mocks if they have numeric IDs and we are using real DB (usually mocks handle separately but let's try)
                // In this app structure, ideally we only edit real data.
                if (idea.id && idea.id.length > 5) { // Simple check for non-mock ID if mocks are "1", "2"
                    const docRef = doc(db, "incubator_ideas", idea.id);
                    const { id, ...data } = idea;
                    batch.update(docRef, data);
                }
            });

            await batch.commit();
            setIdeas(JSON.parse(JSON.stringify(editedIdeas)));
            setDialog({ show: true, message: "ALL_SYSTEMS_UPDATED", type: "success" });
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving changes:", err);
            // If it fails (e.g. mock data), just show success for UI demo if needed, but better to error.
            setDialog({ show: true, message: "SAVE_FAILED (Are these mock items?): " + err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleVote = async (ideaId, currentVotes) => {
        if (!user) {
            setDialog({ show: true, message: "AUTH_REQUIRED: LOG_IN_TO_VOTE", type: "error" });
            return;
        }

        const hasVoted = currentVotes?.includes(user.email);
        const ref = doc(db, "incubator_ideas", ideaId);

        try {
            if (hasVoted) {
                await updateDoc(ref, { votes: arrayRemove(user.email) });
            } else {
                await updateDoc(ref, { votes: arrayUnion(user.email) });
            }
            // Optimistic update
            setIdeas(prev => prev.map(idea => {
                if (idea.id === ideaId) {
                    const newVotes = hasVoted
                        ? idea.votes.filter(v => v !== user.email)
                        : [...(idea.votes || []), user.email];
                    return { ...idea, votes: newVotes };
                }
                return idea;
            }));
            // Also update edited state so if we toggle edit mode it has latest votes
            setEditedIdeas(prev => prev.map(idea => {
                if (idea.id === ideaId) {
                    const newVotes = hasVoted
                        ? idea.votes.filter(v => v !== user.email)
                        : [...(idea.votes || []), user.email];
                    return { ...idea, votes: newVotes };
                }
                return idea;
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmitIdea = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, "incubator_ideas"), {
                ...ideaForm,
                // Default values for fields we removed
                solution: "",
                tags: [],
                votes: [],
                author: user.email,
                authorName: user.displayName || user.email.split('@')[0],
                status: "CONCEPT", // CONCEPT, IN_DEV, LAUNCHED
                createdAt: new Date().toISOString()
            });
            setDialog({ show: true, message: "BLUEPRINT_UPLOADED: AWAITING_COMMUNITY_FEEDBACK", type: "success" });
            setIsIdeaModalOpen(false);
            setIdeaForm({ title: "", problem: "" });
            fetchIdeas();
        } catch (err) {
            console.error(err);
            setDialog({ show: true, message: "UPLOAD_FAILED: " + err.message, type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Logic
    const displayData = isEditing ? editedIdeas : ideas;

    const filteredIdeas = displayData.filter(idea => {
        if (filter === "ALL") return true;
        if (filter === "TRENDING") return (idea.votes?.length || 0) > 5;
        if (filter === "MY_IDEAS") return user && idea.author === user.email;
        return true;
    });

    return (
        <div className="min-h-screen bg-background text-foreground p-6 pt-28 pb-32">
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-purple-400 transition-colors mb-4">
                            <ArrowLeft size={16} className="mr-2" />
                            // RETURN HOME
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-bold font-sans mb-2">
                            IDEAS <span className="text-purple-500">_</span>
                            {isEditing && <span className="text-red-500 text-sm align-middle ml-4 animate-pulse">[ADMIN_EDIT]</span>}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm max-w-2xl">
                            Share your moonshot ideas. Community votes. Builders build.
                        </p>
                    </div>

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
                                            setEditedIdeas(JSON.parse(JSON.stringify(ideas)));
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className={`border px-4 py-2 font-mono text-xs flex items-center gap-2 transition-colors ${isEditing
                                        ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        : "bg-purple-500/10 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-black"
                                        }`}
                                >
                                    {isEditing ? <><X size={16} /> CANCEL</> : <><Edit3 size={16} /> ADMIN_EDIT</>}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                if (!user) {
                                    router.push("/login");
                                    return;
                                }
                                setIsIdeaModalOpen(true);
                            }}
                            className="bg-purple-500/10 border border-purple-500 text-purple-400 px-6 py-3 font-mono text-xs font-bold flex items-center gap-2 hover:bg-purple-500 hover:text-black transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        >
                            <Lightbulb size={18} /> SUBMIT IDEA
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Filters & Stats (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-card-bg border border-border p-6">
                            <h3 className="text-sm font-bold font-sans text-muted-foreground mb-4 flex items-center gap-2">
                                <Target size={16} className="text-purple-500" /> FILTERS
                            </h3>
                            <div className="flex flex-col gap-2">
                                {["ALL", "TRENDING", "NEW", ...(user ? ["MY_IDEAS"] : [])].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`text-left px-4 py-2 font-mono text-xs transition-colors border-l-2 ${filter === f ? "border-purple-500 text-foreground bg-purple-500/10" : "border-transparent text-muted-foreground hover:text-gray-300"}`}
                                    >
                                        // {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card-bg border border-border p-6">
                            <h3 className="text-sm font-bold font-sans text-muted-foreground mb-4">INCUBATOR_STATS</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold text-foreground mb-1">84</div>
                                    <div className="text-[10px] font-mono text-muted-foreground">TOTAL_SUBMISSIONS</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-neon-green mb-1">12</div>
                                    <div className="text-[10px] font-mono text-muted-foreground">PROJECTS_LAUNCHED</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-500 mb-1">$42k</div>
                                    <div className="text-[10px] font-mono text-muted-foreground">VALUE_CREATED</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Idea Feed (9 cols) */}
                    <div className="lg:col-span-9">
                        {loading ? (
                            <div className="font-mono text-purple-500 animate-pulse">Loading ideas...</div>
                        ) : (
                            <div className="space-y-4">
                                {filteredIdeas.length === 0 ? (
                                    <div className="py-20 text-center border border-border border-dashed text-muted-foreground font-mono">
                                        No ideas yet. Be the first to submit one.
                                    </div>
                                ) : (
                                    filteredIdeas.map((idea, i) => (
                                        <motion.div
                                            key={idea.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`bg-card-bg border border-border p-6 transition-colors group relative overflow-hidden ${isEditing ? 'border-dashed border-purple-500/50' : 'hover:border-purple-500/50'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    value={idea.title}
                                                                    onChange={(e) => handleEditChange(idea.id, "title", e.target.value)}
                                                                    className="flex-1 bg-background border border-border p-2 font-bold font-sans text-lg text-foreground"
                                                                    placeholder="Title"
                                                                />
                                                                <select
                                                                    value={idea.status || 'CONCEPT'}
                                                                    onChange={(e) => handleEditChange(idea.id, "status", e.target.value)}
                                                                    className="bg-background border border-border text-xs px-2 py-1 outline-none text-foreground"
                                                                >
                                                                    <option value="CONCEPT">CONCEPT</option>
                                                                    <option value="IN_DEV">IN_DEV</option>
                                                                    <option value="LAUNCHED">LAUNCHED</option>
                                                                </select>
                                                            </div>
                                                            <textarea
                                                                value={idea.problem}
                                                                onChange={(e) => handleEditChange(idea.id, "problem", e.target.value)}
                                                                className="bg-background border border-border p-2 font-mono text-xs text-muted-foreground w-full resize-none"
                                                                placeholder="Problem"
                                                            />
                                                            <textarea
                                                                value={idea.solution || ""}
                                                                onChange={(e) => handleEditChange(idea.id, "solution", e.target.value)}
                                                                className="bg-background border border-border p-2 font-mono text-xs text-muted-foreground w-full resize-none"
                                                                placeholder="Solution"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${idea.status === 'LAUNCHED' ? 'border-neon-green text-neon-green' :
                                                                    idea.status === 'IN_DEV' ? 'border-purple-500 text-purple-500' :
                                                                        'border-gray-500 text-gray-500'
                                                                    }`}>
                                                                    {idea.status || 'CONCEPT'}
                                                                </span>
                                                                <span className="text-xs font-mono text-muted-foreground">by {idea.authorName}</span>
                                                            </div>
                                                            <h3 className="text-xl md:text-2xl font-bold font-sans text-foreground mb-3 group-hover:text-purple-400 transition-colors">{idea.title}</h3>

                                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                                <div className="bg-background/20 p-3 rounded border border-border">
                                                                    <div className="text-[10px] font-mono text-red-400 mb-1">THE PROBLEM</div>
                                                                    <p className="text-sm text-muted-foreground">{idea.problem}</p>
                                                                </div>
                                                                <div className="bg-background/20 p-3 rounded border border-border relative">
                                                                    <div className="text-[10px] font-mono text-neon-green mb-1">THE SOLUTION</div>
                                                                    {idea.solution ? (
                                                                        <p className="text-sm text-muted-foreground">{idea.solution}</p>
                                                                    ) : (
                                                                        <div className="text-muted-foreground text-xs font-mono italic flex flex-col items-center justify-center py-4 border border-dashed border-border rounded">
                                                                            <span>Awaiting Solution</span>
                                                                            <button className="mt-2 text-neon-green hover:underline">
                                                                                [Propose Solution]
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                {idea.tags && (Array.isArray(idea.tags) ? idea.tags : idea.tags.split(',')).map((tag, idx) => (
                                                                    <span key={idx} className="text-[10px] font-mono px-2 py-1 bg-border rounded text-muted-foreground">#{tag}</span>
                                                                ))}
                                                                {(!idea.tags || idea.tags.length === 0) && (
                                                                    <span className="text-[10px] font-mono px-2 py-1 bg-border rounded text-muted-foreground">NO_TAGS_ASSIGNED</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={() => handleVote(idea.id, idea.votes)}
                                                        className={`flex flex-col items-center justify-center w-16 h-16 rounded border transition-all ${idea.votes?.includes(user?.email)
                                                            ? "bg-purple-500 text-black border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                                            : "bg-card-bg border-border text-muted-foreground hover:border-purple-400 hover:text-purple-400"
                                                            }`}
                                                    >
                                                        <ThumbsUp size={20} className={idea.votes?.includes(user?.email) ? "fill-current" : ""} />
                                                        <span className="text-xs font-bold font-mono mt-1">{idea.votes?.length || 0}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Save Bar */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-purple-500 z-50 flex items-center justify-between"
                    >
                        <div className="text-purple-500 font-mono text-sm animate-pulse">
                            ADMIN_MODE_ACTIVE // UNSAVED_changes
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedIdeas(JSON.parse(JSON.stringify(ideas))); // Revert
                                }}
                                className="px-6 py-2 border border-red-500 text-red-500 font-mono text-sm hover:bg-red-500/10"
                            >
                                DISCARD
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="px-6 py-2 bg-purple-500 text-black font-bold font-mono text-sm hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <><StopCircle className="animate-spin" size={16} /> SAVING...</> : <><Save size={16} /> SAVE_CHANGES</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Idea Modal */}
            <AnimatePresence>
                {isIdaModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-start justify-center pt-28 px-4 pb-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card-bg border border-border w-full max-w-2xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                        >
                            <button
                                onClick={() => setIsIdeaModalOpen(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold font-sans mb-2 text-foreground">SUBMIT IDEA</h2>
                            <p className="text-muted-foreground font-mono text-xs mb-6">Describe your idea. The community will vote to build it.</p>

                            <form onSubmit={handleSubmitIdea} className="space-y-6">
                                <div>
                                    <label className="block text-muted-foreground font-mono text-xs mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={ideaForm.title}
                                        onChange={e => setIdeaForm({ ...ideaForm, title: e.target.value })}
                                        className="w-full bg-background border border-border p-3 text-foreground focus:border-purple-500 outline-none"
                                        placeholder="e.g. Project Lazarus"
                                    />
                                </div>

                                <div>
                                    <label className="block text-red-400 font-mono text-xs mb-1">The Problem</label>
                                    <textarea
                                        required
                                        value={ideaForm.problem}
                                        onChange={e => setIdeaForm({ ...ideaForm, problem: e.target.value })}
                                        className="w-full bg-background border border-border p-3 text-foreground focus:border-red-500 outline-none h-48 resize-none"
                                        placeholder="What is broken?"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-purple-500 text-black font-bold font-mono py-4 mt-2 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? "UPLOADING..." : <><Rocket size={18} /> SUBMIT IDEA</>}
                                </button>
                            </form>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
// Mock Data for specific Demo
const MOCK_IDEAS = [
    {
        id: "1",
        title: "Project: Local Hero",
        problem: "Small businesses can't afford inventory management software.",
        solution: "A free, open-source PWA that uses camera for barcode scanning and local storage.",
        tags: ["React", "PWA", "Firebase"],
        authorName: "Sarah_Dev",
        votes: ["a", "b", "c", "d", "e", "f", "g"], // Mock votes
        status: "IN_DEV"
    },
    {
        id: "2",
        title: "Rent-A-Senior",
        problem: "Junior devs are stuck on bugs for days.",
        solution: "Uber for debugging. Juniors pay micro-bounties for 15 mins of a Senior's time.",
        tags: ["WebRTC", "Payments", "Node"],
        authorName: "Neo_The_One",
        votes: ["a", "b", "c"],
        status: "CONCEPT"
    }
];
