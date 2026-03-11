"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    Filter,
    Trophy,
    XCircle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Terminal,
    AlertTriangle,
    Lightbulb,
    Target,
    Activity,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import FeatureGuard from "@/components/feature-guard";

// DUMMY DATA - In production this would come from Firebase


export default function AgentShowcasePage() {
    return (
        <FeatureGuard feature="agentShowcase">
            <AgentShowcasePageContent />
        </FeatureGuard>
    );
}

function AgentShowcasePageContent() {
    const [agentShowcase, setagentShowcase] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, SUCCESS, FAILED
    const [selectedStack, setSelectedStack] = useState("ALL");
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchagentShowcase = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "agentShowcase"));
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by date desc
                items.sort((a, b) => new Date(b.date) - new Date(a.date));
                setagentShowcase(items);
            } catch (error) {
                console.error("Error fetching agentShowcase:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchagentShowcase();
    }, []);

    const filteredData = agentShowcase.filter(pm => {
        if (filter !== "ALL" && pm.status !== filter) return false;
        if (selectedStack !== "ALL" && !pm.stack.includes(selectedStack)) return false;
        return true;
    });

    const uniqueStacks = Array.from(new Set(agentShowcase.flatMap(pm => pm.stack || [])));

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-neon-cyan font-mono animate-pulse">
                Loading agent configurations...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-6xl mx-auto mb-6">
                <Link href="/" className="text-gray-500 hover:text-white flex items-center transition-colors w-fit font-mono text-xs group">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN HOME
                </Link>
            </div>

            {/* Header / Filter Bar */}
            <div className="max-w-6xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-2 py-0.5 border border-neon-cyan/50 text-neon-cyan text-[10px] font-mono">
                                ARCHIVE ACTIVE
                            </div>
                            <div className="px-2 py-0.5 border border-neon-green/50 text-neon-green text-[10px] font-mono">
                                VERIFIED
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-sans text-white mb-2">AGENT SHOWCASE</h1>
                        <p className="font-mono text-gray-500 text-sm max-w-xl">
                            Explore working AI agents built by the community.
                            Test and interact with real operational systems.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        {/* Filter SUCCESS/FAILED */}
                        <div className="bg-white/5 border border-white/10 p-1 flex font-mono text-xs">
                            <button
                                onClick={() => setFilter("ALL")}
                                className={`px-4 py-2 hover:text-white transition-colors ${filter === "ALL" ? "bg-white/10 text-white" : "text-gray-500"}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => setFilter("SUCCESS")}
                                className={`px-4 py-2 hover:text-neon-green transition-colors ${filter === "SUCCESS" ? "bg-neon-green/10 text-neon-green" : "text-gray-500"}`}
                            >
                                SUCCESS
                            </button>
                            <button
                                onClick={() => setFilter("FAILED")}
                                className={`px-4 py-2 hover:text-red-500 transition-colors ${filter === "FAILED" ? "bg-red-500/10 text-red-500" : "text-gray-500"}`}
                            >
                                FAILED
                            </button>
                        </div>

                        {/* Stack Filter */}
                        <div className="relative">
                            <select
                                value={selectedStack}
                                onChange={(e) => setSelectedStack(e.target.value)}
                                className="appearance-none bg-black border border-white/10 text-gray-300 py-2 pl-4 pr-10 font-mono text-xs focus:outline-none focus:border-neon-cyan h-full w-full"
                            >
                                <option value="ALL">ALL STACKS</option>
                                {uniqueStacks.map(stack => (
                                    <option key={stack} value={stack}>{stack.toUpperCase()}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredData.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 font-mono border border-white/10 border-dashed">
                            No agents found.
                        </div>
                    ) : (
                        filteredData.map(pm => (
                            <AgentShowcaseCard
                                key={pm.id}
                                data={pm}
                                isExpanded={expandedId === pm.id}
                                onToggle={() => setExpandedId(expandedId === pm.id ? null : pm.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function AgentShowcaseCard({ data, isExpanded, onToggle }) {
    const isWon = data.status === "SUCCESS";
    const statusColor = isWon ? "text-neon-green border-neon-green" : "text-red-500 border-red-500";
    const bgHover = isWon ? "hover:border-neon-green/30" : "hover:border-red-500/30";

    return (
        <motion.div
            layout
            className={`bg-[#0a0a0a] border border-white/10 p-0 overflow-hidden relative group transition-colors ${bgHover}`}
        >
            {/* Header Section (Always Visible) */}
            <div
                onClick={onToggle}
                className="p-6 cursor-pointer flex flex-col md:flex-row gap-6 md:items-center justify-between"
            >
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <span className={`font-mono text-xl font-bold ${isWon ? 'text-neon-green' : 'text-red-500'} flex items-center gap-2`}>
                            {data.status} {isWon ? <Trophy size={18} /> : <XCircle size={18} />}
                        </span>
                        <span className="font-mono text-xs text-gray-400 bg-white/5 px-2 py-1">PROJECT: {data.id}</span>
                        <span className="font-mono text-xs text-gray-500">{data.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold font-sans text-white mb-2">{data.title}</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.stack && data.stack.map(tech => (
                            <span key={tech} className="text-[10px] font-mono px-2 py-1 border border-white/10 text-gray-400">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 min-w-[200px]">
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Team Size</div>
                        <div className="font-mono text-white">{data.teamSize}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">Rank</div>
                        <div className="font-mono text-white">{data.rank}</div>
                    </div>
                    <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} size={20} />
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10 bg-black/30"
                    >
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

                            {/* Left Column: Analysis */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-mono text-gray-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={14} className={isWon ? "text-neon-green" : "text-red-500"} />
                                        {isWon ? "Primary Win Factor" : "Primary Outcome Factor"}
                                    </h4>
                                    <p className="text-white font-sans text-lg leading-relaxed border-l-2 pl-4 border-white/20">
                                        {isWon ? data.whyWon : data.whyLost}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-mono text-gray-400 mb-3 flex items-center gap-2">
                                        <Activity size={14} />
                                        {isWon ? "Success Signals" : "Critical Mistakes"}
                                    </h4>
                                    <ul className="space-y-2">
                                        {(isWon ? (data.winningSignals || []) : (data.criticalMistakes || [])).map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                <span className={`mt-1 ${isWon ? "text-neon-green" : "text-red-500"}`}>
                                                    {isWon ? "✓" : "✗"}
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Right Column: Remediation */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-mono text-gray-400 mb-3 flex items-center gap-2">
                                        <Lightbulb size={14} className="text-neon-cyan" />
                                        Lessons Learned
                                    </h4>
                                    <ul className="space-y-2">
                                        {(data.patchIfRedeployed || []).map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                                <span className="text-neon-cyan mt-1">&gt;</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-mono text-gray-400 mb-3 flex items-center gap-2">
                                        <Target size={14} />
                                        Final Verdict
                                    </h4>
                                    <div className="bg-white/5 p-4 border border-white/10 font-mono text-sm text-white">
                                        {data.verdict}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
