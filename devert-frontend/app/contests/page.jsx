"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Rocket, Zap, Plus, X, Shield, CheckCircle, Lightbulb, ThumbsUp, Users, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

export default function IncubatorPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, TRENDING, NEW, MY_IDEAS
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Submit Idea Modal
    const [isIdaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [ideaForm, setIdeaForm] = useState({
        title: "",
        problem: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchIdeas();
    }, []);

    const fetchIdeas = async () => {
        try {
            // In a real app, you might use a separate 'incubator_ideas' collection
            // For now, let's assume we use 'incubator_ideas'
            const querySnapshot = await getDocs(collection(db, "incubator_ideas"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by votes default?
            data.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

            if (data.length === 0) {
                setIdeas(MOCK_IDEAS);
            } else {
                setIdeas(data);
            }
        } catch (error) {
            console.error("Error fetching ideas:", error);
            // Fallback mock data if DB empty
            if (ideas.length === 0) setIdeas(MOCK_IDEAS);
        } finally {
            setLoading(false);
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
    const filteredIdeas = ideas.filter(idea => {
        if (filter === "ALL") return true;
        if (filter === "TRENDING") return (idea.votes?.length || 0) > 5;
        if (filter === "MY_IDEAS") return user && idea.author === user.email;
        // Simple 'NEW' logic: created in last 7 days? Or just default sort.
        // Let's keep it simple for now.
        return true;
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pt-28">
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-purple-400 transition-colors mb-4">
                            <ArrowLeft size={16} className="mr-2" />
                            // RETURN HOME
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-bold font-sans mb-2">
                            IDEAS <span className="text-purple-500">_</span>
                        </h1>
                        <p className="text-gray-400 font-mono text-sm max-w-2xl">
                            Share your moonshot ideas. Community votes. Builders build.
                        </p>
                    </div>

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

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Filters & Stats (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white/5 border border-white/10 p-6">
                            <h3 className="text-sm font-bold font-sans text-gray-400 mb-4 flex items-center gap-2">
                                <Target size={16} className="text-purple-500" /> FILTERS
                            </h3>
                            <div className="flex flex-col gap-2">
                                {["ALL", "TRENDING", "NEW", ...(user ? ["MY_IDEAS"] : [])].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`text-left px-4 py-2 font-mono text-xs transition-colors border-l-2 ${filter === f ? "border-purple-500 text-white bg-purple-500/10" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                                    >
                                        // {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 p-6">
                            <h3 className="text-sm font-bold font-sans text-gray-400 mb-4">INCUBATOR_STATS</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-bold text-white mb-1">84</div>
                                    <div className="text-[10px] font-mono text-gray-500">TOTAL_SUBMISSIONS</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-neon-green mb-1">12</div>
                                    <div className="text-[10px] font-mono text-gray-500">PROJECTS_LAUNCHED</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-500 mb-1">$42k</div>
                                    <div className="text-[10px] font-mono text-gray-500">VALUE_CREATED</div>
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
                                    <div className="py-20 text-center border border-white/10 border-dashed text-gray-500 font-mono">
                                        No ideas yet. Be the first to submit one.
                                    </div>
                                ) : (
                                    filteredIdeas.map((idea, i) => (
                                        <motion.div
                                            key={idea.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white/5 border border-white/10 p-6 hover:border-purple-500/50 transition-colors group relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${idea.status === 'LAUNCHED' ? 'border-neon-green text-neon-green' :
                                                            idea.status === 'IN_DEV' ? 'border-purple-500 text-purple-500' :
                                                                'border-gray-500 text-gray-500'
                                                            }`}>
                                                            {idea.status || 'CONCEPT'}
                                                        </span>
                                                        <span className="text-xs font-mono text-gray-500">by {idea.authorName}</span>
                                                    </div>
                                                    <h3 className="text-xl md:text-2xl font-bold font-sans text-white mb-3 group-hover:text-purple-400 transition-colors">{idea.title}</h3>

                                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-black/20 p-3 rounded border border-white/5">
                                                            <div className="text-[10px] font-mono text-red-400 mb-1">THE PROBLEM</div>
                                                            <p className="text-sm text-gray-300">{idea.problem}</p>
                                                        </div>
                                                        <div className="bg-black/20 p-3 rounded border border-white/5 relative">
                                                            <div className="text-[10px] font-mono text-neon-green mb-1">THE SOLUTION</div>
                                                            {idea.solution ? (
                                                                <p className="text-sm text-gray-300">{idea.solution}</p>
                                                            ) : (
                                                                <div className="text-gray-500 text-xs font-mono italic flex flex-col items-center justify-center py-4 border border-dashed border-white/10 rounded">
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
                                                            <span key={idx} className="text-[10px] font-mono px-2 py-1 bg-white/5 rounded text-gray-400">#{tag}</span>
                                                        ))}
                                                        {(!idea.tags || idea.tags.length === 0) && (
                                                            <span className="text-[10px] font-mono px-2 py-1 bg-white/5 rounded text-gray-600">NO_TAGS_ASSIGNED</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={() => handleVote(idea.id, idea.votes)}
                                                        className={`flex flex-col items-center justify-center w-16 h-16 rounded border transition-all ${idea.votes?.includes(user?.email)
                                                            ? "bg-purple-500 text-black border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                                            : "bg-white/5 border-white/10 text-gray-400 hover:border-purple-400 hover:text-purple-400"
                                                            }`}
                                                    >
                                                        <ThumbsUp size={20} className={idea.votes?.includes(user?.email) ? "fill-current" : ""} />
                                                        <span className="text-xs font-bold font-mono mt-1">{idea.votes?.length || 0}</span>
                                                    </button>

                                                    {idea.status === 'CONCEPT' && (
                                                        <button
                                                            className="w-16 py-2 bg-white/5 hover:bg-neon-green/10 text-gray-400 hover:text-neon-green border border-white/10 hover:border-neon-green rounded flex justify-center transition-all"
                                                            title="Join Squad"
                                                        >
                                                            <Users size={16} />
                                                        </button>
                                                    )}
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
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                        >
                            <button
                                onClick={() => setIsIdeaModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold font-sans mb-2 text-white">SUBMIT IDEA</h2>
                            <p className="text-gray-500 font-mono text-xs mb-6">Describe your idea. The community will vote to build it.</p>

                            <form onSubmit={handleSubmitIdea} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 font-mono text-xs mb-1">Project Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={ideaForm.title}
                                        onChange={e => setIdeaForm({ ...ideaForm, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-purple-500 outline-none"
                                        placeholder="e.g. Project Lazarus"
                                    />
                                </div>

                                <div>
                                    <label className="block text-red-400 font-mono text-xs mb-1">The Problem</label>
                                    <textarea
                                        required
                                        value={ideaForm.problem}
                                        onChange={e => setIdeaForm({ ...ideaForm, problem: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-red-500 outline-none h-48 resize-none"
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
