"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Loader2, Trash2, Users, Search, Download, Calendar, Briefcase, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function RegistrationsAdminPage() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "squadron"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const items = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(doc => doc.hackathonId); // Only keep hackathon registrations
            setRegistrations(items);
        } catch (error) {
            console.error("Error fetching registrations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "squadron", id));
            setRegistrations(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Delete failed.");
        }
    };

    const handleExportCSV = () => {
        if (registrations.length === 0) return;

        const headers = ["Team Name", "Hackathon", "Leader Type", "Leader Email", "Phone", "LinkedIn", "Members", "Registration Date", "Extra Details"];
        const rows = registrations.map(reg => {
            const date = reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleDateString() : 'Unknown';
            const emails = reg.members ? reg.members.join("; ") : "";
            const extra = reg.leaderType === 'student' 
                ? `College: ${reg.leaderCollege} | Course: ${reg.leaderCourse} | Grad: ${reg.leaderGradYear}`
                : `Company: ${reg.leaderCompany} | Role: ${reg.leaderRole} | Exp: ${reg.leaderExperience}`;
            
            return [
                `"${reg.name || ''}"`,
                `"${reg.stack?.[1] || reg.hackathonId || ''}"`,
                `"${reg.leaderType || ''}"`,
                `"${reg.members?.[0] || ''}"`,
                `"${reg.leaderPhone || ''}"`,
                `"${reg.leaderLinkedin || ''}"`,
                `"${emails}"`,
                `"${date}"`,
                `"${extra}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "devert_sprint_registrations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = registrations.filter(r => 
        (r.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.members || []).some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.stack?.[1] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 relative pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white mb-2">SPRINT REGISTRATIONS</h1>
                    <p className="text-gray-400 font-mono text-sm border-l-2 border-neon-cyan pl-3">
                        Total Deployments Detected: <span className="text-neon-cyan font-bold">{registrations.length}</span>
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search team, email, or sprint..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-white/20 pl-10 pr-4 py-2 font-mono text-sm text-white focus:border-neon-cyan outline-none rounded-none"
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={registrations.length === 0}
                        className="bg-neon-cyan text-black px-4 py-2 font-bold font-mono text-xs flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={14} /> EXPORT_CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-neon-cyan font-mono flex items-center justify-center flex-col gap-4">
                    <Loader2 size={32} className="animate-spin" />
                    DECRYPTING_SQUAD_RECORDS...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 text-gray-500 font-mono tracking-widest text-sm bg-black/50">
                    NO_ACTIVE_DEPLOYMENTS_FOUND.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((reg) => (
                        <motion.div
                            key={reg.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#050505] border border-white/10 hover:border-neon-cyan/50 p-6 flex flex-col md:flex-row justify-between gap-6 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-2 py-0.5 text-[10px] font-mono border border-neon-green text-neon-green flex items-center gap-1 bg-neon-green/5">
                                        <Users size={10} /> TEAM SIZE: {reg.members?.length || 1}
                                    </span>
                                    <h3 className="text-xl font-bold text-white tracking-wide">{reg.name}</h3>
                                    <span className="bg-white/10 px-2 py-1 text-xs font-mono text-gray-400">
                                        [{reg.stack?.[1] || reg.hackathonId}]
                                    </span>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-6 bg-black/40 p-4 border border-white/5">
                                    {/* Leader Core Info */}
                                    <div className="space-y-3 font-mono text-xs">
                                        <div className="text-neon-cyan mb-2 font-bold flex items-center gap-2 border-b border-white/10 pb-2">
                                            {reg.leaderType === 'professional' ? <Briefcase size={12}/> : <GraduationCap size={12}/>} 
                                            LEADER_PROFILE : {reg.leaderType?.toUpperCase() || "UNKNOWN"}
                                        </div>
                                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Email:</span> <span className="text-gray-300">{reg.members?.[0]}</span></div>
                                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Phone:</span> <span className="text-gray-300">{reg.leaderPhone}</span></div>
                                        <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">LinkedIn:</span> <a href={reg.leaderLinkedin?.startsWith('http') ? reg.leaderLinkedin : `https://${reg.leaderLinkedin}`} target="_blank" className="text-blue-400 hover:underline truncate max-w-[150px]">{reg.leaderLinkedin}</a></div>
                                        
                                        {reg.leaderType === 'student' ? (
                                            <>
                                                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">College:</span> <span className="text-gray-300 truncate max-w-[150px]">{reg.leaderCollege}</span></div>
                                                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Course:</span> <span className="text-gray-300">{reg.leaderCourse} ({reg.leaderGradYear})</span></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Company:</span> <span className="text-gray-300 truncate max-w-[150px]">{reg.leaderCompany}</span></div>
                                                <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Role:</span> <span className="text-gray-300">{reg.leaderRole} ({reg.leaderExperience})</span></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Full Roster Info */}
                                    <div className="space-y-3 font-mono text-xs">
                                        <div className="text-gray-400 mb-2 font-bold font-sans border-b border-white/10 pb-2 tracking-widest">SQUAD_ROSTER</div>
                                        <div className="bg-[#0a0a0a] border border-white/10 p-3 space-y-2 h-[120px] overflow-y-auto">
                                            {reg.members?.map((email, i) => (
                                                <div key={i} className="flex items-center gap-2 text-gray-300">
                                                    <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-neon-green' : 'bg-gray-600'}`}></span>
                                                    <span>{email}</span>
                                                    {i === 0 && <span className="text-[8px] bg-neon-green/20 text-neon-green px-1 ml-auto">LEADER</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-row md:flex-col justify-center items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                                <div className="text-center font-mono text-[10px] text-gray-500 mb-2 hidden md:block">
                                    <Calendar size={14} className="mx-auto mb-1 text-gray-600" />
                                    Registered<br/>{reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                                </div>
                                <button
                                    onClick={() => handleDelete(reg.id)}
                                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 transition-all w-full flex items-center justify-center group"
                                    title="Eradicate Registration"
                                >
                                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
