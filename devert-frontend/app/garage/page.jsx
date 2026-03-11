"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Upload, FileText, Send } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function WorkspacePage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submissionInput, setSubmissionInput] = useState({}); // Map task ID to input

    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            try {
                // Fetch tasks assigned to current user's email
                const q = query(collection(db, "managed_tasks"), where("executorEmail", "==", user.email));
                const querySnapshot = await getDocs(q);
                const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTasks(tasksData);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user]);

    const handleSubmission = async (taskId) => {
        const input = submissionInput[taskId];
        if (!input) return;

        try {
            const taskRef = doc(db, "managed_tasks", taskId);
            // Append submission to array (or just set text if simple)
            // For v1, we just update status to SUBMITTED and add a note
            await updateDoc(taskRef, {
                status: "SUBMITTED",
                submissionLink: input,
                updatedAt: serverTimestamp()
            });

            // Update local state
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "SUBMITTED", submissionLink: input } : t));
            setSubmissionInput(prev => ({ ...prev, [taskId]: "" }));
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-neon-cyan font-mono">
                <Link href="/login" className="underline hover:text-foreground">LOGIN_REQUIRED_FOR_ACCESS</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan selection:text-black">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 py-32 min-h-[60vh]">
                <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
                    <div>
                        <h1 className="text-3xl font-bold font-sans">AGENT_GARAGE</h1>
                        <p className="text-gray-400 font-mono text-sm">Architect: {user.email}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold font-mono text-neon-cyan">{tasks.filter(t => t.status === 'ASSIGNED').length}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Active Tasks</div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-gray-500 font-mono animate-pulse">Scanning assignments...</div>
                ) : tasks.length === 0 ? (
                    <div className="bg-card-bg border border-border p-12 text-center rounded-lg">
                        <h3 className="text-xl font-bold text-gray-600 mb-2">NO_ACTIVE_ASSIGNMENTS</h3>
                        <p className="text-gray-500 font-mono text-sm mb-6">You are currently on standby.</p>
                        <Link href="/join-architect" className="text-neon-cyan hover:underline font-mono text-sm">
                            Apply for more roles
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-card-bg border border-border p-6 rounded-lg hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold font-sans">{task.title}</h3>
                                    <span className={`px-2 py-1 text-[10px] font-mono rounded border ${task.status === 'ASSIGNED' ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20' :
                                        task.status === 'SUBMITTED' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>

                                <div className="bg-background p-4 rounded text-sm font-mono text-gray-400 mb-6 whitespace-pre-wrap">
                                    {task.description}
                                </div>

                                <div className="flex items-center gap-4 text-xs font-mono text-gray-500 mb-6">
                                    <span className="flex items-center gap-1"><Clock size={12} /> Deadline: {task.deadline || "TBD"}</span>
                                    <span className="flex items-center gap-1"><FileText size={12} /> Assigned: {task.createdAt?.toDate().toLocaleDateString()}</span>
                                </div>

                                {task.status === 'ASSIGNED' && (
                                    <div className="bg-background p-4 rounded border border-border">
                                        <label className="text-xs font-mono text-gray-400 mb-2 block">SUBMISSION_LINK (Github / Drive / Deployment)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-card-bg border border-border p-2 text-sm font-mono text-foreground rounded focus:border-neon-cyan outline-none"
                                                placeholder="https://..."
                                                value={submissionInput[task.id] || ""}
                                                onChange={(e) => setSubmissionInput({ ...submissionInput, [task.id]: e.target.value })}
                                            />
                                            <button
                                                onClick={() => handleSubmission(task.id)}
                                                className="bg-neon-cyan text-black px-4 py-2 font-bold font-mono text-sm rounded hover:bg-white transition-colors flex items-center gap-2"
                                            >
                                                <Send size={14} /> SUBMIT
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {task.status === 'SUBMITTED' && (
                                    <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded text-center">
                                        <p className="text-yellow-500 font-mono text-sm">Work submitted. Pending Admin Review.</p>
                                        <a href={task.submissionLink} target="_blank" className="text-xs text-gray-400 hover:text-foreground underline mt-1 block">
                                            View Submission
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
