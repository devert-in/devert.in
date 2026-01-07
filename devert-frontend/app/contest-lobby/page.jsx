"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
// import { motion } from "framer-motion"; // Removed unused import if not used, but likely used for layout if added back
import { ArrowLeft, Clock, Users, Trophy, Terminal, Timer, UserPlus, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";

function LobbyContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { user } = useAuth();
    const router = useRouter();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    useEffect(() => {
        if (!id) return;

        const fetchContest = async () => {
            // For newly created contests via admin seed that might not have 'participants' field yet
            try {
                const docRef = doc(db, "contests", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const d = docSnap.data();
                    let status = d.status;
                    const now = new Date();

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

                        if (now < startDate) status = "UPCOMING";
                        else if (now >= startDate && now <= endDate) status = "LIVE";
                        else status = "PAST";
                    }

                    setContest({ id: docSnap.id, ...d, status });
                } else {
                    console.log("No such contest!");
                }
            } catch (error) {
                console.error("Error getting contest:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContest();
    }, [id]);

    const isRegistered = contest?.participants?.includes(user?.email);

    const handleRegister = async () => {
        if (!user) {
            router.push("/login");
            return;
        }
        setRegistering(true);
        try {
            const contestRef = doc(db, "contests", id);
            await updateDoc(contestRef, {
                participants: arrayUnion(user.email)
            });
            // Update local state to reflect change immediately
            setContest(prev => ({
                ...prev,
                participants: [...(prev.participants || []), user.email]
            }));
            setDialog({ show: true, message: "REGISTRATION_SUCCESSFUL // WELCOME_TO_THE_ARENA", type: "success" });
        } catch (error) {
            console.error("Error registering:", error);
            setDialog({ show: true, message: "REGISTRATION_FAILED: " + error.message, type: "error" });
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neon-cyan font-mono animate-pulse">
            CONNECTING_TO_LOBBY_SERVER...
        </div>
    );

    if (!contest) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-mono">
            <h1 className="text-4xl text-red-500 mb-4">404 // LOBBY_NOT_FOUND</h1>
            <Link href="/contests" className="text-gray-400 hover:text-white flex items-center">
                <ArrowLeft size={16} className="mr-2" /> RETURN_TO_BASE
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

            <div className="max-w-5xl mx-auto relative z-10">
                <Link href="/contests" className="inline-flex items-center text-gray-500 hover:text-white mb-8 transition-colors font-mono text-sm">
                    <ArrowLeft size={16} className="mr-2" /> BACK_TO_WARGAMES
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`text-xs font-mono px-3 py-1 rounded border ${contest.status === 'LIVE' ? 'bg-neon-green/10 text-neon-green border-neon-green/20 animate-pulse' :
                                    contest.status === 'UPCOMING' ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20' :
                                        'bg-white/5 text-gray-500 border-white/10'
                                    }`}>
                                    {contest.status}
                                </span>
                                <span className="text-xs font-mono text-gray-500 border border-white/10 px-2 py-1 rounded">
                                    {contest.type}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-sans mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                {contest.title}
                            </h1>
                            <p className="text-lg text-gray-400 font-mono leading-relaxed border-l-2 border-neon-cyan pl-4">
                                {contest.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-6">
                                <div className="text-gray-500 text-xs font-mono mb-2 flex items-center">
                                    <Clock size={14} className="mr-2" /> START_TIME
                                </div>
                                <div className="text-xl font-bold font-sans">
                                    {new Date(contest.date).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6">
                                <div className="text-gray-500 text-xs font-mono mb-2 flex items-center">
                                    <Timer size={14} className="mr-2" /> DURATION
                                </div>
                                <div className="text-xl font-bold font-sans">
                                    {contest.duration}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold font-sans flex items-center">
                                <Terminal size={20} className="mr-2 text-neon-green" />
                                MISSION_PARAMETERS
                            </h3>
                            <div className="bg-black/40 border border-white/10 p-6 font-mono text-sm text-gray-300 space-y-2">
                                <p>&gt; Difficulty: <span className={
                                    contest.level === 'HARD' ? 'text-red-400' :
                                        contest.level === 'INSANE' ? 'text-purple-400' :
                                            contest.level === 'MEDIUM' ? 'text-yellow-400' :
                                                'text-green-400'
                                }>{contest.level}</span></p>
                                <p>&gt; Tags: [{Array.isArray(contest.tags) ? contest.tags.join(", ") : contest.tags}]</p>
                                <p>&gt; Host: {contest.host}</p>
                                <p>&gt; Max_Participants: UNLIMITED</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#0a0a0a] border border-white/10 p-8 sticky top-32">
                            <div className="text-center mb-8">
                                <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                                    <Trophy size={32} className="text-neon-cyan" />
                                </div>
                                <div className="text-sm font-mono text-gray-400 mb-1">CURRENT_PARTICIPANTS</div>
                                <div className="text-4xl font-bold text-white">
                                    {contest.participants ? contest.participants.length : 0}
                                </div>
                            </div>

                            {!isRegistered ? (
                                <button
                                    onClick={handleRegister}
                                    disabled={registering || contest.status === "PAST"}
                                    className="w-full bg-neon-green text-black py-4 font-bold font-mono hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                                >
                                    {registering ? "PROCESSING..." : (
                                        <>
                                            <UserPlus size={18} /> REGISTER_NOW
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-full bg-neon-green/10 border border-neon-green text-neon-green py-4 font-bold font-mono flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> REGISTERED
                                    </div>

                                    {contest.status === 'LIVE' ? (
                                        <button className="w-full bg-neon-cyan text-black py-4 font-bold font-mono hover:opacity-90 flex items-center justify-center gap-2 animate-pulse">
                                            ENTER_ARENA <ArrowLeft size={18} className="rotate-180" />
                                        </button>
                                    ) : (
                                        <div className="text-center font-mono text-xs text-gray-500 py-2">
                                            &gt; WAITING_FOR_HOST_SIGNAL...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Participant List (Mini) */}
                            {contest.participants && contest.participants.length > 0 && (
                                <div className="mt-8 border-t border-white/10 pt-6">
                                    <h4 className="text-xs font-mono text-gray-500 mb-4 flex items-center">
                                        <Users size={12} className="mr-2" /> SQUADRON_MEMBERS
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {contest.participants.slice(0, 10).map((p, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                {p.split('@')[0]}
                                            </div>
                                        ))}
                                        {contest.participants.length > 10 && (
                                            <div className="text-xs text-gray-600 italic">
                                                + {contest.participants.length - 10} others
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContestLobbyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-neon-cyan font-mono">LOADING_INTERFACE...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
