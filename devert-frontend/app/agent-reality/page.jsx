"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    ArrowRight,
    Loader2,
    LayoutGrid,
    Terminal,
    ChevronRight
} from "lucide-react";

export default function AgentRealityPage() {
    const [mode, setMode] = useState("archetype"); // 'archetype' or 'custom'
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const LEARNER_TYPES = [
        {
            id: "tutorial_hell",
            label: "Tutorial Hell Walker",
            desc: "Stuck watching videos. Never building.",
            prompt: "I am stuck in tutorial hell, watching endless videos but never building. Evaluate my agent building reality.",
            icon: <Activity className="text-blue-400" />
        },
        {
            id: "perfectionist",
            label: "The Perfectionist",
            desc: "Endless refactoring. Fear of shipping.",
            prompt: "I never ship because I want my code to be perfect. I endlessly refactor. Evaluate my agent building reality.",
            icon: <CheckCircle className="text-purple-400" />
        },
        {
            id: "dreamer",
            label: "The Dreamer",
            desc: "Big ideas. Zero code written.",
            prompt: "I have a billion-dollar idea but haven't written a line of code. Evaluate my agent building reality.",
            icon: <Brain className="text-pink-400" />
        },
        {
            id: "procrastinator",
            label: "The Procrastinator",
            desc: "I'll start tomorrow. Always.",
            prompt: "I keep planning to start 'tomorrow'. Evaluate my agent building reality.",
            icon: <Clock className="text-yellow-400" />
        },
        {
            id: "stack_switcher",
            label: "Technology Hopper",
            desc: "React -> Vue -> Svelte -> Repeat.",
            prompt: "I switch stacks every week (React to Vue to Svelte). Evaluate my agent building reality.",
            icon: <LayoutGrid className="text-green-400" />
        }
    ];

    const FALLBACK_RESPONSES = {
        tutorial_hell: {
            ideaSummary: { summary: "ARCHETYPE: TUTORIAL HELL WALKER", category: "Behavioral Paralysis" },
            realityScore: { technicalFeasibility: 85, marketDemand: 0, buildComplexity: 90, timeReality: 10, riskLevel: 95 },
            verdict: { decision: "STOP WATCHING", reason: "You are addicted to passive consumption. You feel productive, but you have produced nothing." },
            buildBreakdown: { mve: "A generic To-Do App (No Tutorial)", dependencies: ["Zero YouTube", "Official Docs Only"] },
            marketReality: { targetUser: "You (The Builder)", friction: "Your own fear of being stuck without a guide." },
            failurePoints: { modes: ["Watching another 4-hour course", "Abandoning when error occurs"] },
            actionPlan: ["Close YouTube/Udemy immediately.", "Open your IDE.", "Build a To-Do App without looking at a tutorial.", "If you get stuck, read Documentation, not a video."]
        },
        perfectionist: {
            ideaSummary: { summary: "ARCHETYPE: THE PERFECTIONIST", category: "Ego Protection" },
            realityScore: { technicalFeasibility: 95, marketDemand: 20, buildComplexity: 100, timeReality: 5, riskLevel: 80 },
            verdict: { decision: "SHIP TRASH", reason: "Your 'high standards' are just a mask for fear of failure. No one cares about your code quality if the product doesn't exist." },
            buildBreakdown: { mve: "A broken, ugly MVP", dependencies: ["Accepting bugs", "Public release"] },
            marketReality: { targetUser: "Real users who don't care about clean code", friction: "Your ego." },
            failurePoints: { modes: ["Refactoring before launch", "Adding 'one more feature'"] },
            actionPlan: ["Set a timer for 1 hour.", "Ship whatever you have at the end of that hour.", "Do not write tests yet.", "Get one user to use your broken app."]
        },
        dreamer: {
            ideaSummary: { summary: "ARCHETYPE: THE DREAMER", category: "Delusion" },
            realityScore: { technicalFeasibility: 0, marketDemand: 50, buildComplexity: 100, timeReality: 0, riskLevel: 100 },
            verdict: { decision: "WAKE UP", reason: "Ideas are worthless. Agent deployment is the only currency that matters. You are currently bankrupt." },
            buildBreakdown: { mve: "One button that does one thing", dependencies: ["Learning to code", "Hiring a dev"] },
            marketReality: { targetUser: "Unknown", friction: "You have nothing to sell." },
            failurePoints: { modes: ["Talking instead of building", "NDAs for zero-value ideas"] },
            actionPlan: ["Write down the Smallest Viable Feature.", "Code it in 2 days.", "If you can't code it, learn to code or pay someone.", "Stop talking about your idea."]
        },
        procrastinator: {
            ideaSummary: { summary: "ARCHETYPE: THE PROCRASTINATOR", category: "Time Waste" },
            realityScore: { technicalFeasibility: 50, marketDemand: 50, buildComplexity: 10, timeReality: 0, riskLevel: 90 },
            verdict: { decision: "DO IT NOW", reason: "Tomorrow is a fantasy. You are wasting the only asset you cannot recover: Time." },
            buildBreakdown: { mve: "Hello World", dependencies: ["Discipline", "Starting"] },
            marketReality: { targetUser: "N/A", friction: "Inertia" },
            failurePoints: { modes: ["Doomscrolling", "Planning fallacy"] },
            actionPlan: ["Count backwards: 5, 4, 3, 2, 1.", "Open your laptop.", "Write 'Hello World'.", "Do not stand up until you have a function running."]
        },
        stack_switcher: {
            ideaSummary: { summary: "ARCHETYPE: TECHNOLOGY HOPPER", category: "Distraction" },
            realityScore: { technicalFeasibility: 70, marketDemand: 10, buildComplexity: 80, timeReality: 20, riskLevel: 70 },
            verdict: { decision: "PICK ONE", reason: "You are avoiding the hard work of mastery by chasing the dopamine of novelty." },
            buildBreakdown: { mve: "Complete App in ONE Stack", dependencies: ["Commitment", "Boredom tolerance"] },
            marketReality: { targetUser: "Users don't care about your stack", friction: "You never finish anything." },
            failurePoints: { modes: ["Starting over with new framework", "Tutorial hell v2"] },
            actionPlan: ["Uninstall all frameworks except one.", "Build 3 complete apps with that one framework.", "Ban yourself from reading 'Best Framework 2024' articles."]
        }
    };

    const handleAnalysis = async (inputText, typeId = null) => {
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/execution-ai/evaluate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userInput: inputText }),
            });

            if (!response.ok) throw new Error("Deployment Protocol Failed");

            let data = await response.json();

            // FALLBACK LOGIC
            // If backend sends generic NGO mock or if we are forcing a known type fallback for demo consistency
            if (typeId && FALLBACK_RESPONSES[typeId]) {
                // Check if data is the generic mock
                if (data.ideaSummary && data.ideaSummary.summary && data.ideaSummary.summary.includes("Connects students")) {
                    console.log("Using Strict Fallback for", typeId);
                    data = FALLBACK_RESPONSES[typeId];
                }
            }

            setReport(data);
        } catch (err) {
            console.warn("Backend Error, using fallback if available", err);
            if (typeId && FALLBACK_RESPONSES[typeId]) {
                setReport(FALLBACK_RESPONSES[typeId]);
            } else {
                setError("CONNECTION_ERROR: REALITY ENGINE OFFLINE.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-28 pb-12 px-4 md:px-8 font-mono relative overflow-x-hidden">
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan text-xs mb-4"
                    >
                        <Brain size={14} />
                        <span>DEVERT_AI // PERFORMANCE_ANALYSIS</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-bold font-sans mb-4 tracking-tight">
                        AGENTS <span className="text-neon-cyan">&gt;</span> PROMPTS
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
                        Select your current archetype. We will provide the strict reality check you need to break the cycle.
                    </p>
                </div>

                {/* Input Mode Tabs */}
                {/* <div className="flex justify-center mb-10">
                    <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex gap-1">
                        <button 
                            onClick={() => { setMode("archetype"); setReport(null); }}
                            className={`px-4 py-2 text-xs font-bold rounded transition-all ${mode === "archetype" ? "bg-neon-cyan text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
                        >
                            ARCHETYPE SELECTOR
                        </button>
                        <button 
                            onClick={() => { setMode("custom"); setReport(null); }}
                            className={`px-4 py-2 text-xs font-bold rounded transition-all ${mode === "custom" ? "bg-neon-cyan text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
                        >
                            CUSTOM INPUT
                        </button>
                    </div>
                </div> */}

                <AnimatePresence mode="wait">
                    {!report ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full"
                        >
                            {mode === "archetype" ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {LEARNER_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => handleAnalysis(type.prompt, type.id)}
                                            disabled={loading}
                                            className="group relative bg-[#0a0a0a] border border-white/10 hover:border-neon-cyan p-6 rounded-xl text-left transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)] hover:-translate-y-1"
                                        >
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan">
                                                <ArrowRight size={20} />
                                            </div>
                                            <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit group-hover:bg-neon-cyan/20 transition-colors">
                                                {type.icon}
                                            </div>
                                            <h3 className="text-lg font-bold font-sans text-white mb-2 group-hover:text-neon-cyan transition-colors">{type.label}</h3>
                                            <p className="text-gray-500 text-xs leading-relaxed">{type.desc}</p>
                                        </button>
                                    ))}

                                    {/* Custom Input Card */}
                                    <button
                                        onClick={() => setMode("custom")}
                                        className="group relative bg-[#0a0a0a] border border-dashed border-white/20 hover:border-white/50 p-6 rounded-xl text-left transition-all flex flex-col items-center justify-center text-center gap-4 py-12"
                                    >
                                        <Terminal className="text-gray-600 group-hover:text-white transition-colors" size={32} />
                                        <div>
                                            <h3 className="text-lg font-bold font-sans text-gray-400 group-hover:text-white transition-colors">Custom Scenario</h3>
                                            <p className="text-gray-600 text-xs">Analyze a specific project idea</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto">
                                    <form onSubmit={(e) => { e.preventDefault(); handleAnalysis(prompt); }} className="relative">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Describe your situation or idea..."
                                            className="w-full bg-[#0a0a0a] border border-white/20 rounded-xl p-6 min-h-[150px] text-white placeholder:text-gray-700 focus:border-neon-cyan outline-none transition-colors font-sans"
                                        />
                                        <div className="flex justify-between items-center mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setMode("archetype")}
                                                className="text-xs text-gray-500 hover:text-white underline"
                                            >
                                                Back to Archetypes
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || loading}
                                                className="bg-neon-cyan text-black px-8 py-3 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} />} ANALYZE
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto"
                        >
                            <button
                                onClick={() => setReport(null)}
                                className="mb-6 text-xs text-gray-500 hover:text-white flex items-center gap-2"
                            >
                                <ArrowRight className="rotate-180" size={12} /> BACK TO SELECTION
                            </button>

                            {/* Report UI Reuse */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-2 bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">SUBJECT</h3>
                                    <p className="text-2xl font-bold text-white mb-2 font-sans">{report.ideaSummary?.summary || "Analyzing..."}</p>
                                    <span className="inline-block px-2 py-1 bg-neon-cyan/10 text-neon-cyan text-xs rounded border border-neon-cyan/20">
                                        {report.ideaSummary?.category || "Unknown"}
                                    </span>
                                </div>
                                <div className={`p-6 rounded-xl border flex flex-col items-center justify-center text-center ${report.verdict?.decision?.toLowerCase().includes("kill") || report.verdict?.decision?.includes("STOP")
                                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                                    : "bg-green-500/10 border-green-500/30 text-green-500"
                                    }`}>
                                    <h3 className="text-xs opacity-70 uppercase tracking-widest mb-2">VERDICT</h3>
                                    <div className="text-2xl font-bold mb-1 font-sans">{report.verdict?.decision}</div>
                                    <p className="text-[10px] opacity-80 leading-tight">{report.verdict?.reason}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Action Plan - Promoted to top visibility */}
                                <div className="md:col-span-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-8">
                                    <h3 className="font-bold text-sm text-purple-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle size={16} /> MANDATORY ACTION PROTOCOL
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {report.actionPlan?.map((action, i) => (
                                            <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-lg relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 font-bold text-4xl text-purple-500 group-hover:opacity-20 transition-opacity">0{i + 1}</div>
                                                <p className="text-sm text-gray-200 relative z-10">{action}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="font-bold text-sm text-blue-400 mb-4 flex items-center gap-2">
                                        <Zap size={16} /> DEPLOYMENT REQ
                                    </h3>
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 text-xs block mb-1">MVE</span>
                                            <p className="text-gray-300">{report.buildBreakdown?.mve}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="font-bold text-sm text-red-400 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={16} /> FAILURE MODES
                                    </h3>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        {report.failurePoints?.modes?.map((mode, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-red-500">x</span> {mode}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="font-bold text-sm text-yellow-400 mb-4 flex items-center gap-2">
                                        <Clock size={16} /> REALITY SCORES
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Review Risk</span>
                                            <span className="text-white font-bold">{report.realityScore?.riskLevel}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                            <div className="bg-red-500 h-full" style={{ width: `${report.realityScore?.riskLevel}%` }}></div>
                                        </div>

                                        <div className="flex justify-between text-xs mt-2">
                                            <span className="text-gray-400">Complexity</span>
                                            <span className="text-white font-bold">{report.realityScore?.buildComplexity}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                            <div className="bg-yellow-500 h-full" style={{ width: `${report.realityScore?.buildComplexity}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
