"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { Upload, CheckCircle, AlertCircle, Loader2, Code, Shield, Zap, ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/AuthContext";
import FeatureGuard from "@/components/feature-guard";

export default function JoinExecutorPage() {
    return (
        <FeatureGuard feature="join_executor">
            <JoinExecutorPageContent />
        </FeatureGuard>
    );
}

function JoinExecutorPageContent() {
    const { user } = useAuth();
    const isAdmin = user?.email?.includes("admin");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    // Module Status State
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    const [formData, setFormData] = useState({
        name: "",
        email: user?.email || "",
        skills: "",
        availability: "",
        portfolio: "",
        motivation: "",
    });

    useEffect(() => {
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.join_executor === false) setIsModuleEnabled(false);
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
                join_executor: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (!formData.name || !formData.email || !formData.skills || !formData.motivation) {
                throw new Error("Please fill in all required fields.");
            }

            // Submit Application
            await addDoc(collection(db, "executor_applications"), {
                ...formData,
                userId: user?.uid || null, // Link to account if logged in
                status: "PENDING",
                createdAt: serverTimestamp(),
            });

            setIsSuccess(true);
        } catch (err) {
            console.error("Error submitting application:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neon-cyan selection:text-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32">

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

                <div className="flex justify-between items-start mb-8">
                    <Link href="/execution" className="inline-flex items-center text-gray-500 hover:text-foreground font-mono text-xs transition-colors group">
                        <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> RETURN_TO_BOARD
                    </Link>

                    {isAdmin && (
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
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-block px-3 py-1 border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-xs font-mono tracking-widest mb-4">
                        ELITE OPERATIVES ONLY
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Become an <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500">Executor</span>.
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-mono">
                        Stop hunting for clients. Stop chasing payments. <br />
                        DeVert assigns you work. You execute. You get paid.
                    </p>
                </motion.div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-card-bg border border-border p-6 rounded-lg text-center">
                        <Shield className="mx-auto text-neon-cyan mb-4" size={32} />
                        <h3 className="font-bold mb-2">No Client Headaches</h3>
                        <p className="text-sm text-gray-400">We handle the clients. You never talk to them. Zero friction.</p>
                    </div>
                    <div className="bg-card-bg border border-border p-6 rounded-lg text-center">
                        <Code className="mx-auto text-neon-cyan mb-4" size={32} />
                        <h3 className="font-bold mb-2">Pure Execution</h3>
                        <p className="text-sm text-gray-400">Focus on the code/deliverable. We manage the requirements and scope.</p>
                    </div>
                    <div className="bg-card-bg border border-border p-6 rounded-lg text-center">
                        <Zap className="mx-auto text-yellow-500 mb-4" size={32} />
                        <h3 className="font-bold mb-2">Guaranteed Review</h3>
                        <p className="text-sm text-gray-400">DeVert admins review your work. Fair, technical feedback. Fast approval.</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card-bg border border-border p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    {isSuccess ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-neon-cyan/10 text-neon-cyan rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-cyan/20">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Application Logged</h3>
                            <p className="text-gray-400 font-mono mb-8">
                                Your profile is under review by the High Command.<br />
                                We will contact you for a vetting challenge soon.
                            </p>
                            <a
                                href="/"
                                className="text-neon-cyan hover:underline font-mono text-sm"
                            >
                                Return to Base
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Operative Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors"
                                        placeholder="Name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Comms (Email/Phone)</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Tech Stack / Skills</label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors"
                                    placeholder="e.g. React, Node.js, Python, Java, Graphic Design..."
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Weekly Availability (Hours)</label>
                                    <input
                                        type="number"
                                        name="availability"
                                        value={formData.availability}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors"
                                        placeholder="e.g. 20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Portfolio / GitHub / LinkedIn</label>
                                    <input
                                        type="text"
                                        name="portfolio"
                                        value={formData.portfolio}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Why DeVert?</label>
                                <textarea
                                    name="motivation"
                                    value={formData.motivation}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-cyan focus:outline-none transition-colors resize-none"
                                    placeholder="Briefly tell us why you want to join the execution squad."
                                    required
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm font-mono bg-red-500/10 p-3 rounded">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="pt-4 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full px-8 py-4 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold font-mono hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : "SUBMIT_APPLICATION"}
                                </button>
                            </div>

                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
