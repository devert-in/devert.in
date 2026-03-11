"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Upload, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HirePage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: user?.email || "",
        type: "fresher_academic", // default
        description: "",
        deadline: "",
        budget: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Validation
            if (!formData.name || !formData.email || !formData.description) {
                throw new Error("Please fill in all required fields.");
            }

            // Submit to Firebase
            await addDoc(collection(db, "requirements"), {
                ...formData,
                status: "NEW", // Initial status
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Fields for Admin process
                adminNotes: "",
                internalTasks: [],
                userId: user?.uid || null, // Link to auth
            });

            setIsSuccess(true);
            setFormData({
                name: "",
                email: "",
                type: "fresher_academic",
                description: "",
                deadline: "",
                budget: "",
            });
        } catch (err) {
            console.error("Error submitting requirement:", err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neon-green selection:text-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32">
                <div className="mb-8">
                    <Link href="/deployments" className="inline-flex items-center text-gray-500 hover:text-foreground font-mono text-xs transition-colors group">
                        <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> RETURN_TO_BOARD
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-block px-3 py-1 border border-neon-green/30 bg-neon-green/5 text-neon-green text-xs font-mono tracking-widest mb-4">
                        MANAGED DEPLOYMENT
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-emerald-500">Reality</span>.
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-mono">
                        DeVert is not a marketplace. We are your deployment partner. <br />
                        Submit your requirement. We manage the architects. You get the result.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card-bg border border-border p-8 md:p-12 rounded-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    {isSuccess ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-neon-green/10 text-neon-green rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-green/20">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Requirement Received</h3>
                            <p className="text-gray-400 font-mono mb-8">
                                DeVert admins are reviewing your request.<br />
                                You will receive a confirmation email shortly.
                            </p>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="text-neon-green hover:underline font-mono text-sm"
                            >
                                Submit another requirement
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                            {/* Contact Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Your Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-green focus:outline-none transition-colors"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Email / Phone</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-green focus:outline-none transition-colors"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Project Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Type of Work</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { id: 'fresher_academic', label: 'Academic / Guided' },
                                        { id: 'website_app', label: 'Website / App' },
                                        { id: 'content_research', label: 'Content / Research' },
                                        { id: 'other', label: 'Other' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                                            className={`px-4 py-3 rounded-lg border text-sm font-mono transition-all ${formData.type === type.id
                                                ? 'bg-neon-green/10 border-neon-green text-neon-green'
                                                : 'bg-background border-border text-gray-400 hover:bg-card-bg'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Requirement Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-green focus:outline-none transition-colors resize-none"
                                    placeholder="Describe your project, goals, and any specific constraints..."
                                    required
                                />
                            </div>

                            {/* Details */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Deadline (Optional)</label>
                                    <input
                                        type="text"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-green focus:outline-none transition-colors"
                                        placeholder="e.g. 2 weeks, Dec 31st"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">Budget Range (Optional)</label>
                                    <input
                                        type="text"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-neon-green focus:outline-none transition-colors"
                                        placeholder="e.g. $500 - $1000"
                                    />
                                </div>
                            </div>

                            {/* File Upload Placeholder - To be implemented with Storage */}
                            <div className="p-4 border border-dashed border-border rounded-lg bg-card-bg text-center">
                                <p className="text-gray-500 text-sm font-mono flex items-center justify-center gap-2">
                                    <Upload size={16} /> File upload disabled in v1. Please include links in description.
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm font-mono bg-red-500/10 p-3 rounded">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="pt-4 border-t border-border flex flex-col items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full md:w-auto px-8 py-4 bg-foreground text-background font-bold font-mono hover:bg-neon-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : "INITIATE_DEPLOYMENT"}
                                </button>
                                <p className="text-xs text-gray-500 font-mono">
                                    By submitting, you agree that DeVert manages the deployment process.
                                </p>
                            </div>

                        </form>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
