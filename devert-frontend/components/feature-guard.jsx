"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function FeatureGuard({ feature, children }) {
    const { user } = useAuth();
    const isAdmin = user?.email?.includes("admin");

    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkFeature = async () => {
            try {
                const docRef = doc(db, "system", "feature_flags");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const flags = docSnap.data();
                    if (flags[feature] === false) {
                        setEnabled(false);
                    }
                }
            } catch (err) {
                console.error("Feature flag check failed:", err);
            } finally {
                setLoading(false);
            }
        };

        checkFeature();
    }, [feature]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-neon-cyan" /></div>;
    }

    if (!enabled && !isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-center p-8">
                <div className="relative">
                    <div className="absolute inset-0 stripes-bg opacity-10"></div>
                    <ShieldAlert className="text-yellow-500 mb-4 mx-auto" size={64} />
                    <h1 className="text-4xl font-bold font-sans text-white mb-2">MODULE_OFFLINE</h1>
                    <p className="text-gray-400 font-mono mb-8 max-w-md mx-auto">
                        The <strong>{feature.toUpperCase()}</strong> module is currently <strong>under active development</strong>. Check back soon for deployment.
                    </p>
                    <div className="flex justify-center">
                        <Link href="/" className="px-6 py-3 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all font-mono font-bold">
                            RETURN TO BASE
                        </Link>
                    </div>
                </div>
            </div >
        );
    }

    return <>{children}</>;
}
