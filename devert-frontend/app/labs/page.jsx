"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Construction, Cpu, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import FeatureGuard from "@/components/feature-guard";

export default function LabsPage() {
    return (
        <FeatureGuard feature="labs">
            <LabsPageContent />
        </FeatureGuard>
    );
}

function LabsPageContent() {
    const { user } = useAuth();
    const isAdmin = user?.email === "admin@devert.in";
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);

    useEffect(() => {
        fetchModuleStatus();
    }, []);

    async function fetchModuleStatus() {
        try {
            const docRef = doc(db, "system", "feature_flags");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.labs === false) setIsModuleEnabled(false);
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
                labs: newState
            }, { merge: true });
        } catch (error) {
            console.error("Error toggling module:", error);
            setIsModuleEnabled(!newState); // Revert
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center relative overflow-hidden px-4">

            {/* Admin Disabled Warning */}
            {!isModuleEnabled && isAdmin && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/10 border border-red-500 flex items-center gap-4 animate-pulse w-full max-w-lg">
                    <div className="flex items-center gap-4 text-red-500 flex-1">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold font-mono">MODULE DISABLED (PUBLIC)</h3>
                            <p className="text-xs">Regular users see 'Under Construction'.</p>
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
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="absolute top-28 left-8 flex gap-4">
                <Link href="/" className="text-gray-500 hover:text-foreground flex items-center transition-colors w-fit font-mono text-xs group">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN_TO_BASE
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full border border-border bg-card-bg/50 backdrop-blur-sm p-12 text-center relative"
            >
                {/* decoration corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-cyan"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-cyan"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan"></div>

                <div className="flex justify-center mb-6 text-gray-600">
                    <Construction size={48} strokeWidth={1} />
                </div>

                <h1 className="text-3xl font-bold font-sans mb-2 text-foreground">
                    SECTOR <span className="text-neon-cyan">LOCKED</span>
                </h1>

                <p className="font-mono text-xs text-neon-green mb-8 tracking-widest">
                    // DEVELOPMENT_IN_PROGRESS
                </p>

                <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">
                    This module is currently being architected by the core team.
                    Experimental features and beta tools will be deployed here soon.
                </p>

                <div className="flex justify-center gap-4">
                    <Link href="/" className="px-6 py-3 bg-card-bg border border-border hover:border-neon-cyan/50 hover:bg-neon-cyan/10 text-foreground font-mono text-xs transition-all flex items-center">
                        <ArrowLeft size={16} className="mr-2" /> RETURN_HOME
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-8 text-gray-600">
                    <Lock size={16} />
                    <span className="font-mono text-xs">ENCRYPTION: AES-256</span>
                    <Cpu size={16} />
                </div>
            </motion.div>
        </div>
    );
}
