"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Loader2, ArrowRight } from "lucide-react";

export default function MyProjectsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchProjects = async () => {
            try {
                // Fetch requirements submitted by this user
                const q = query(
                    collection(db, "requirements"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );

                // Firestore requires an index for this specific compound query (userId + createdAt).
                // If it fails, we'll try without sorting first to avoid error, then sort client-side.
                try {
                    const querySnapshot = await getDocs(q);
                    setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (indexError) {
                    console.warn("Index missing, falling back to client-side sort", indexError);
                    const qSimple = query(collection(db, "requirements"), where("userId", "==", user.uid));
                    const querySnapshot = await getDocs(qSimple);
                    const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Client side sort
                    docs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
                    setProjects(docs);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-neon-cyan font-mono">
                <Link href="/login" className="underline hover:text-foreground">LOGIN_REQUIRED</Link>
            </div>
        );
    }

    const getStatusDisplay = (status) => {
        switch (status) {
            case "NEW": return { text: "SUBMITTED", color: "text-blue-400 border-blue-400/20 bg-blue-400/5" };
            case "IN_REVIEW": return { text: "WORK_IN_PROGRESS", color: "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" };
            case "ASSIGNED": return { text: "WORK_IN_PROGRESS", color: "text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5" };
            case "COMPLETED": return { text: "DELIVERED", color: "text-green-400 border-green-400/20 bg-green-400/5" };
            case "REJECTED": return { text: "CLOSED", color: "text-red-400 border-red-400/20 bg-red-400/5" };
            default: return { text: status, color: "text-gray-400 border-gray-400/20 bg-gray-400/5" };
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-neon-green selection:text-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-32 min-h-[60vh]">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold font-sans mb-2">MY_DEPLOYMENTS</h1>
                        <p className="text-gray-400 font-mono text-sm max-w-md">
                            Track the status of your DeVert agent deployment requests.
                        </p>
                    </div>
                    <Link href="/hire" className="hidden md:flex items-center gap-2 text-neon-green font-mono text-xs border border-neon-green/30 px-4 py-2 hover:bg-neon-green hover:text-black transition-all">
                        + NEW_REQUIREMENT
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 font-mono gap-4">
                        <Loader2 className="animate-spin text-neon-green" size={32} />
                        SCANNING_DATABASE...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-card-bg border border-border p-12 text-center rounded-lg">
                        <div className="inline-block p-4 rounded-full bg-background mb-6 text-gray-400">
                            <Loader2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2 font-sans">No Active Deployments</h3>
                        <p className="text-gray-500 font-mono text-sm mb-8">
                            You haven't requested any agents yet.
                        </p>
                        <Link href="/hire" className="inline-flex items-center gap-2 bg-neon-green text-black px-6 py-3 font-bold font-mono text-sm hover:bg-white transition-colors">
                            START_DEPLOYMENT <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {projects.map((project) => {
                            const status = getStatusDisplay(project.status);
                            return (
                                <div key={project.id} className="bg-card-bg border border-border p-6 rounded-lg hover:border-white/20 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 text-[10px] font-mono tracking-widest border rounded ${status.color}`}>
                                                {status.text}
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-mono">
                                                ID: {project.id.substring(0, 8).toUpperCase()}
                                            </span>
                                        </div>
                                        {project.status === 'COMPLETED' && (
                                            <span className="text-neon-green font-mono text-xs flex items-center gap-1">
                                                READY_FOR_DOWNLOAD
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold font-sans text-foreground mb-2 group-hover:text-neon-green transition-colors">
                                        {project.name}
                                    </h3>
                                    <div className="bg-background p-4 rounded text-sm text-gray-400 font-mono mb-4 line-clamp-2">
                                        {project.description}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border text-xs font-mono text-gray-500">
                                        <span>Submitted: {project.createdAt?.toDate().toLocaleDateString() || "N/A"}</span>

                                        {/* If admin left a public note or delivery link, we could show it here. For v1, basic status is enough. */}
                                        <span className="text-right">
                                            {project.status === 'IN_REVIEW' && "DeVert Team is working..."}
                                            {project.status === 'NEW' && "Awaiting Review"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
