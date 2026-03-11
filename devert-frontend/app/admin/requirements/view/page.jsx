"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, User, Clock } from "lucide-react";

function RequirementDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [requirement, setRequirement] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({ title: "", description: "", executorEmail: "", deadline: "" });
    const [isAddingTask, setIsAddingTask] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Get Requirement
                const docRef = doc(db, "requirements", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setRequirement({ id: docSnap.id, ...docSnap.data() });
                }

                // Get Tasks
                const q = query(collection(db, "managed_tasks"), where("requirementId", "==", id));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTasks(tasksData);
                });

                setLoading(false);
                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            await updateDoc(doc(db, "requirements", id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            setRequirement(prev => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "managed_tasks"), {
                ...newTask,
                requirementId: id,
                status: "ASSIGNED", // Default status when created
                createdAt: serverTimestamp(),
                submissions: [] // Array to hold submission links/files
            });
            setNewTask({ title: "", description: "", executorEmail: "", deadline: "" });
            setIsAddingTask(false);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    if (loading) return <div className="text-neon-cyan font-mono animate-pulse">LOADING_DATA...</div>;
    if (!requirement) return <div className="text-red-500 font-mono">Requirement not found.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link href="/admin/requirements" className="inline-flex items-center text-gray-500 hover:text-white font-mono text-xs mb-4">
                    <ArrowLeft size={12} className="mr-1" /> BACK_TO_LOGS
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-sans text-white mb-2">{requirement.name}</h1>
                        <p className="text-gray-400 font-mono text-sm">{requirement.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="font-mono text-xs text-gray-500 uppercase tracking-widest">Current Status</div>
                        <select
                            value={requirement.status}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            className="bg-black border border-white/20 text-white text-sm font-mono p-2 rounded focus:border-neon-cyan outline-none"
                        >
                            <option value="NEW">NEW</option>
                            <option value="IN_REVIEW">IN_REVIEW</option>
                            <option value="ASSIGNED">ASSIGNED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Details Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                        <h3 className="font-bold font-sans text-lg mb-4 text-neon-cyan">REQUIREMENT_DETAILS</h3>
                        <div className="space-y-4 font-mono text-sm">
                            <p className="whitespace-pre-wrap text-gray-300">{requirement.description}</p>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Category</span>
                                    {requirement.type}
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Budget</span>
                                    {requirement.budget || "N/A"}
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Client Deadline</span>
                                    {requirement.deadline || "N/A"}
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] uppercase">Submitted</span>
                                    {requirement.createdAt?.toDate().toLocaleDateString() || "Just now"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task Management */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-bold font-sans text-lg text-white">AGENT_DEPLOYMENT_TASKS</h3>
                            <button
                                onClick={() => setIsAddingTask(!isAddingTask)}
                                className="text-xs font-mono bg-neon-cyan/10 text-neon-cyan border border-neon-cyan px-3 py-1 hover:bg-neon-cyan hover:text-black transition-colors"
                            >
                                {isAddingTask ? "CANCEL" : "+ ASSIGN_TASK"}
                            </button>
                        </div>

                        {isAddingTask && (
                            <form onSubmit={handleAddTask} className="bg-white/5 border border-white/10 p-4 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-3">
                                    <input
                                        placeholder="Task Title"
                                        className="w-full bg-black border border-white/20 p-2 text-sm font-mono text-white rounded"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        required
                                    />
                                    <textarea
                                        placeholder="Detailed Instructions for Architect..."
                                        rows={3}
                                        className="w-full bg-black border border-white/20 p-2 text-sm font-mono text-white rounded"
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="Architect Email (Must match exact)"
                                            className="w-full bg-black border border-white/20 p-2 text-sm font-mono text-white rounded"
                                            value={newTask.executorEmail}
                                            onChange={e => setNewTask({ ...newTask, executorEmail: e.target.value })}
                                            required
                                        />
                                        <input
                                            placeholder="Task Deadline"
                                            className="w-full bg-black border border-white/20 p-2 text-sm font-mono text-white rounded"
                                            value={newTask.deadline}
                                            onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-neon-cyan text-black font-bold font-mono text-sm py-2 rounded hover:bg-white hover:text-black">
                                        DEPLOY TASK
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <p className="text-gray-500 font-mono text-sm italic">No tasks assigned yet. Deployment pending.</p>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="bg-black/40 border border-white/10 p-4 rounded hover:border-white/20">
                                        <div className="flex justify-between mb-2">
                                            <h4 className="font-bold text-white">{task.title}</h4>
                                            <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                                                {task.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 font-mono text-xs mb-3">{task.description}</p>
                                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 border-t border-white/5 pt-2">
                                            <span className="flex items-center gap-1"><User size={10} /> {task.executorEmail}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {task.deadline}</span>
                                        </div>
                                        {/* Review Area - Could expand this later */}
                                        {task.status === 'SUBMITTED' && (
                                            <div className="mt-2 text-yellow-500 text-xs font-mono animate-pulse">
                                                ⚠ SUBMISSION RECEIVED. PENDING REVIEW.
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                        <h3 className="font-bold font-sans text-xs uppercase text-gray-500 mb-4 tracking-widest">Admin Notes</h3>
                        <textarea
                            className="w-full bg-black/50 border border-white/10 text-gray-300 text-sm font-mono p-3 rounded min-h-[150px]"
                            placeholder="Internal notes about this client or project..."
                            defaultValue={requirement.adminNotes || ""}
                            onBlur={async (e) => {
                                await updateDoc(doc(db, "requirements", id), {
                                    adminNotes: e.target.value
                                });
                            }}
                        />
                        <p className="text-[10px] text-gray-600 mt-2 font-mono">Autosaves on blur.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RequirementDetailPage() {
    return (
        <Suspense fallback={<div className="text-neon-cyan font-mono animate-pulse">LOADING_INTERFACE...</div>}>
            <RequirementDetailContent />
        </Suspense>
    );
}
