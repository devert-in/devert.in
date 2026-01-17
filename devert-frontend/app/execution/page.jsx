"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Briefcase,
    Code,
    ArrowRight,
    Search,
    Filter,
    Zap,
    Users,
    Clock,
    CheckCircle,
    Lock,
    Eye,
    EyeOff,
    AlertTriangle
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FeatureGuard from "@/components/feature-guard";

export default function ExecutionBoard() {
    return (
        <FeatureGuard feature="execution">
            <ExecutionBoardContent />
        </FeatureGuard>
    );
}

function ExecutionBoardContent() {
    const { user, userData } = useAuth();
    const router = useRouter();
    const isAdmin = user?.email?.includes("admin");

    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, OPEN, IN_PROGRESS
    const [processingId, setProcessingId] = useState(null);

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    useEffect(() => {
        fetchRequirements();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.execution === false) setIsModuleEnabled(false);
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
                execution: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
        }
    }

    const fetchRequirements = async () => {
        try {
            // Fetch all requirements that are ACTIVE (NEW, IN_REVIEW, ASSIGNED)
            // We might exclude COMPLETED/REJECTED for the main board unless requested
            const q = query(collection(db, "requirements"));
            const querySnapshot = await getDocs(q);
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Client-side sort/filter for v1 simplicty
            const activeItems = items.filter(i => ['NEW', 'IN_REVIEW', 'ASSIGNED'].includes(i.status));
            activeItems.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setRequirements(activeItems);
        } catch (error) {
            console.error("Error fetching execution board:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowInterest = async (reqId) => {
        if (!user) {
            router.push("/login");
            return;
        }

        setProcessingId(reqId);

        try {
            // 1. Check if user is a registered executor
            // We check if they have a 'role' or if they exist in 'executor_applications'
            // For v1, let's assume if they have 'skills' in their user profile, they are somewhat ready.
            // OR we check a specific flag. 
            // Better: Check if they have ever submitted to 'executor_applications'.

            const appsQuery = query(collection(db, "executor_applications"), where("userId", "==", user.uid));
            const appsSnap = await getDocs(appsQuery);

            if (appsSnap.empty) {
                // Redirect to fill details
                router.push(`/join-executor?returnTo=/execution`);
                return;
            }

            // 2. Add to interested array
            const reqRef = doc(db, "requirements", reqId);
            await updateDoc(reqRef, {
                interestedExecutors: arrayUnion(user.uid)
            });

            // Update local state
            setRequirements(prev => prev.map(item => {
                if (item.id === reqId) {
                    return {
                        ...item,
                        interestedExecutors: [...(item.interestedExecutors || []), user.uid]
                    };
                }
                return item;
            }));

        } catch (error) {
            console.error("Error showing interest:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredItems = requirements.filter(item => {
        if (filter === 'ALL') return true;
        if (filter === 'OPEN') return item.status === 'NEW' || item.status === 'IN_REVIEW';
        if (filter === 'IN_PROGRESS') return item.status === 'ASSIGNED';
        return true;
    });

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan selection:text-black font-sans">
            <Navbar />

            <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">

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

                {/* --- HEADER ACTIONS --- */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-neon-green font-mono text-xs animate-pulse">
                            <Zap size={14} /> LIVE OPERATIONS
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-sans mb-4">
                            EXECUTION BOARD
                        </h1>
                        <p className="text-gray-400 font-mono text-sm max-w-xl">
                            Real requirements active on DeVert. <br />
                            Clients: Post work. Executors: Take initiative.
                        </p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">

                        {isAdmin && (
                            <button
                                onClick={toggleModuleStatus}
                                className={`border px-4 py-3 font-mono text-xs flex items-center gap-2 transition-colors ${isModuleEnabled
                                    ? "bg-neon-green/10 border-neon-green text-neon-green hover:bg-red-500 hover:border-red-500 hover:text-white"
                                    : "bg-red-500/10 border-red-500 text-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black"
                                    }`}
                                title={isModuleEnabled ? "Disable Public Access" : "Enable Public Access"}
                            >
                                {isModuleEnabled ? <><Eye size={16} /> MODULE_ACTIVE</> : <><EyeOff size={16} /> MODULE_OFFLINE</>}
                            </button>
                        )}
                        <Link
                            href="/hire"
                            className="flex-1 md:flex-none px-6 py-3 bg-neon-green text-black font-bold font-mono hover:bg-white transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Briefcase size={16} /> DEPLOY PROJECT
                        </Link>
                        <Link
                            href="/join-executor"
                            className="flex-1 md:flex-none px-6 py-3 border border-neon-cyan text-neon-cyan font-bold font-mono hover:bg-neon-cyan hover:text-black transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Code size={16} /> REGISTER PROFILE
                        </Link>
                    </div>
                </div>

                {/* --- FILTERS & STATS --- */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
                    <div className="flex bg-white/5 p-1 border border-white/10 rounded w-full md:w-auto overflow-x-auto">
                        {["ALL", "OPEN", "IN_PROGRESS"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 font-mono text-xs transition-colors rounded whitespace-nowrap ${filter === f
                                    ? 'bg-white/10 text-white font-bold border border-white/20'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs font-mono text-gray-500 ml-auto">
                        SHOWING {filteredItems.length} OPERATIONS
                    </div>
                </div>

                {/* --- BOARD GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-white/5 animate-pulse rounded border border-white/5"></div>
                            ))
                        ) : filteredItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded">
                                <p className="text-gray-500 font-mono">NO ACTIVE OPERATIONS DETECTED.</p>
                            </div>
                        ) : (
                            filteredItems.map((req) => (
                                <RequirementCard
                                    key={req.id}
                                    data={req}
                                    currentUserId={user?.uid}
                                    onShowInterest={handleShowInterest}
                                    processing={processingId === req.id}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>

            </main>
        </div>
    );
}

function RequirementCard({ data, currentUserId, onShowInterest, processing }) {
    const isInterested = data.interestedExecutors?.includes(currentUserId);
    const interestCount = data.interestedExecutors?.length || 0;

    // Privacy: Truncate Name/Email for public view
    // Only Admin or Assigned sees full detials usually, but for board we show summarized view

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-[#0a0a0a] border p-6 flex flex-col justify-between group relative overflow-hidden transition-all hover:border-white/30 ${data.status === 'ASSIGNED'
                ? 'border-neon-cyan/30'
                : 'border-white/10'
                }`}
        >
            {/* Status Line */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`px-2 py-0.5 text-[10px] font-mono border rounded uppercase flex items-center gap-2 ${data.status === 'ASSIGNED' ? 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/5'
                    : 'text-neon-green border-neon-green/30 bg-neon-green/5'
                    }`}>
                    {data.status === 'ASSIGNED' ? <Lock size={10} /> : <Zap size={10} />}
                    {data.status === 'NEW' ? 'OPEN_FOR_INTAKE' : data.status}
                </div>
                <div className="text-xs font-mono text-gray-500">
                    {data.type?.replace('_', ' ').toUpperCase()}
                </div>
            </div>

            {/* Content */}
            <div className="mb-6 relative z-10">
                <h3 className="text-xl font-bold font-sans text-white mb-2 line-clamp-1 group-hover:text-neon-green transition-colors">
                    {data.name}'s Request
                </h3>
                <p className="text-gray-400 text-sm font-mono line-clamp-3 mb-4 h-[60px]">
                    {data.description}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {data.deadline || "ASAP"}
                    </span>
                    <span className="flex items-center gap-1">
                        <Briefcase size={12} /> {data.budget || "TBD"}
                    </span>
                </div>
            </div>

            {/* Actions / Social Proof */}
            <div className="relative z-10">
                {data.status === 'ASSIGNED' ? (
                    <div className="w-full py-3 bg-neon-cyan/5 border border-neon-cyan/20 text-neon-cyan font-mono text-xs flex items-center justify-center gap-2">
                        <Lock size={14} /> EXECUTOR DEPLOYED
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => !isInterested && onShowInterest(data.id)}
                            disabled={isInterested || processing}
                            className={`flex-1 py-3 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all ${isInterested
                                ? 'bg-white/10 text-gray-300 cursor-default'
                                : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            {processing ? "PROCESSING..." : isInterested ? "INTEREST_RECORDED" : "TAKE INITIATIVE"}
                            {!isInterested && <ArrowRight size={14} />}
                        </button>

                        {interestCount > 0 && (
                            <div className="h-full px-3 border border-white/10 flex items-center justify-center bg-white/5 text-gray-400 font-mono text-xs gap-1" title={`${interestCount} operatives interested`}>
                                <Users size={14} /> {interestCount}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* HoverGlow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none"></div>
        </motion.div>
    );
}
