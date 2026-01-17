"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { Copy, Check, Clock, AlertCircle } from "lucide-react";

export default function RequirementsDashboard() {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequirements = async () => {
            try {
                // Fetch all requirements
                const q = query(collection(db, "requirements"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const reqs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRequirements(reqs);
            } catch (error) {
                console.error("Error fetching requirements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequirements();
    }, []);

    const StatusBadge = ({ status }) => {
        const colors = {
            'NEW': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'IN_REVIEW': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            'ASSIGNED': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            'COMPLETED': 'bg-green-500/10 text-green-500 border-green-500/20',
            'REJECTED': 'bg-red-500/10 text-red-500 border-red-500/20',
        };
        const colorClass = colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold font-sans mb-8">REQUIREMENT_LOGS</h1>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-gray-500 font-mono animate-pulse">Scanning database...</div>
                ) : requirements.length === 0 ? (
                    <div className="text-gray-500 font-mono">No requirements found.</div>
                ) : (
                    requirements.map((req) => (
                        <div key={req.id} className="bg-black/40 border border-white/10 p-6 rounded-lg hover:border-white/20 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold font-sans">{req.name}</h3>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-sm font-mono text-gray-400">{req.email} • {req.type}</p>
                                </div>
                                <Link
                                    href={`/admin/requirements/view?id=${req.id}`}
                                    className="px-4 py-2 bg-white text-black font-bold font-mono text-xs rounded hover:bg-gray-200 transition-colors"
                                >
                                    MANAGE_OPEARTION
                                </Link>
                            </div>

                            <div className="bg-white/5 p-4 rounded text-sm text-gray-300 font-mono mb-4 whitespace-pre-wrap">
                                {req.description.length > 200 ? req.description.substring(0, 200) + "..." : req.description}
                            </div>

                            <div className="flex gap-4 text-xs font-mono text-gray-500">
                                <span>DEADLINE: {req.deadline || "N/A"}</span>
                                <span>BUDGET: {req.budget || "N/A"}</span>
                                <span>TASKS: {req.internalTasks?.length || 0}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
