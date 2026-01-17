"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Filter, Zap, Briefcase, Clock, CheckCircle, Lock, AlertTriangle, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import FeatureGuard from "@/components/feature-guard";

export default function BountiesPage() {
    return (
        <FeatureGuard feature="bounties">
            <BountiesPageContent />
        </FeatureGuard>
    );
}

function BountiesPageContent() {
    const { user } = useAuth();
    const isAdmin = user?.email?.includes("admin");
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("OPEN"); // OPEN, ASSIGNED, COMPLETED

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    useEffect(() => {
        fetchBounties();
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.bounties === false) setIsModuleEnabled(false);
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
                bounties: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
        }
    }

    const fetchBounties = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "bounties"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by Open status first
            items.sort((a, b) => (a.status === 'OPEN' ? -1 : 1));
            setBounties(items);
        } catch (error) {
            console.error("Error fetching bounties:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBounties = bounties.filter(b => filter === "ALL" || b.status === filter);

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-yellow-500 font-mono animate-pulse">LOADING_CONTRACTS...</div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">

            {/* Admin Disabled Warning */}
            {!isModuleEnabled && isAdmin && (
                <div className="mb-8 max-w-6xl mx-auto p-4 bg-red-500/10 border border-red-500 flex items-center justify-between animate-pulse">
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

            {/* Background Grid */}
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-6">
                    <Link href="/" className="text-gray-500 hover:text-foreground flex items-center transition-colors w-fit font-mono text-xs group">
                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN HOME
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-border pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-yellow-500 font-mono text-xs animate-pulse">
                            <Zap size={14} /> LIVE FEED
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-sans mb-2 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-yellow-500">
                            TASK BOARD
                        </h1>
                        <p className="text-gray-400 font-mono text-sm max-w-xl">
                            Open tasks for developers. Pick a task. Complete it. Get rewarded.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={toggleModuleStatus}
                            className={`border px-4 py-3 font-mono text-xs flex items-center gap-2 transition-colors mb-4 md:mb-0 ${isModuleEnabled
                                ? "bg-neon-green/10 border-neon-green text-neon-green hover:bg-red-500 hover:border-red-500 hover:text-white"
                                : "bg-red-500/10 border-red-500 text-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black"
                                }`}
                            title={isModuleEnabled ? "Disable Public Access" : "Enable Public Access"}
                        >
                            {isModuleEnabled ? <><Eye size={16} /> MODULE_ACTIVE</> : <><EyeOff size={16} /> MODULE_OFFLINE</>}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex bg-card-bg p-1 border border-border w-fit">
                        {["OPEN", "ASSIGNED", "COMPLETED"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 font-mono text-xs transition-colors ${filter === f ? (f === 'OPEN' ? 'bg-neon-green text-black font-bold' : 'bg-border text-foreground') : 'text-gray-500 hover:text-foreground'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH TASKS..."
                            className="w-full h-full bg-card-bg border border-border py-2 pl-12 pr-4 text-foreground font-mono text-sm focus:border-yellow-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Bounties List */}
                <div className="space-y-4">
                    {filteredBounties.map((bounty) => (
                        <BountyRow key={bounty.id} data={bounty} />
                    ))}
                    {filteredBounties.length === 0 && (
                        <div className="text-center py-20 border border-border border-dashed text-gray-500 font-mono">
                            NO TASKS FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BountyRow({ data }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card-bg border border-border p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-foreground/30 transition-all cursor-pointer ${data.status === 'OPEN' ? 'border-l-4 border-l-neon-green' : data.status === 'ASSIGNED' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-gray-500'}`}
        >
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${data.difficulty === 'Veteran' ? 'border-red-500 text-red-500' :
                        data.difficulty === 'Hard' ? 'border-orange-500 text-orange-500' :
                            data.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                                'border-green-500 text-green-500'
                        }`}>
                        {data.difficulty}
                    </span>
                    <span className="text-gray-500 font-mono text-xs">{data.company}</span>
                    <span className="text-gray-600 font-mono text-xs">|</span>
                    <span className="text-gray-500 font-mono text-xs flex items-center gap-1">
                        <Clock size={12} /> 48h Remaining
                    </span>
                </div>
                <h3 className="text-xl font-bold font-sans text-foreground mb-2 group-hover:text-neon-cyan transition-colors">{data.title}</h3>
                <p className="text-gray-400 text-sm mb-3 max-w-2xl">{data.description}</p>
                <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-mono px-2 py-1 bg-border text-gray-400">
                        #{data.type}
                    </span>
                </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                <div className="text-right">
                    <div className="text-[10px] font-mono text-gray-500">REWARD</div>
                    <div className="text-2xl font-bold text-yellow-500 font-mono flex items-center gap-1 justify-end">
                        <Zap size={18} fill="currentColor" /> {data.reward}
                    </div>
                </div>

                {data.status === 'OPEN' ? (
                    <button className="bg-neon-green text-black px-6 py-2 font-bold font-mono text-xs hover:bg-white transition-colors flex items-center gap-2">
                        ACCEPT TASK <ArrowRight size={14} />
                    </button>
                ) : data.status === 'ASSIGNED' ? (
                    <div className="flex items-center gap-2 text-yellow-500 font-mono text-xs border border-yellow-500 px-3 py-1">
                        <Lock size={12} /> IN_PROGRESS
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500 font-mono text-xs border border-border px-3 py-1 bg-card-bg">
                        <CheckCircle size={12} /> EXECUTED
                    </div>
                )}

            </div>
        </motion.div>
    );
}
