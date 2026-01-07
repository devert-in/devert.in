"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";
import {
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Target,
    Zap,
    Briefcase,
    Shield,
    CheckCircle,
    Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BountiesManager() {
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBounty, setCurrentBounty] = useState(null);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    // Initial Form State
    const initialFormState = {
        title: "",
        company: "",
        reward: "", // Stored as string e.g. "5000 XP"
        type: "Frontend", // Frontend, Backend, Design, Contract
        difficulty: "Easy", // Easy, Medium, Hard, Veteran
        status: "OPEN",
        description: "",
        requirements: "" // Newline separated
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Data
    const fetchBounties = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "bounties"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBounties(items);
        } catch (error) {
            console.error("Error fetching bounties:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBounties();
    }, []);

    // Handlers
    const openAddModal = () => {
        setCurrentBounty(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const openEditModal = (bounty) => {
        setCurrentBounty(bounty);
        setFormData({
            title: bounty.title,
            company: bounty.company,
            reward: bounty.reward,
            type: bounty.type,
            difficulty: bounty.difficulty,
            status: bounty.status,
            description: bounty.description,
            requirements: bounty.requirements ? bounty.requirements.join("\n") : ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (docId) => {
        if (!confirm("Delete this bounty contract?")) return;
        try {
            await deleteDoc(doc(db, "bounties", docId));
            setBounties(prev => prev.filter(b => b.id !== docId));
        } catch (error) {
            setDialog({ show: true, message: "Failed to delete: " + error.message, type: "error" });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const processArray = (str) => str.split('\n').map(s => s.trim()).filter(s => s);

        const dataToSave = {
            ...formData,
            requirements: processArray(formData.requirements),
            updatedAt: new Date().toISOString()
        };

        try {
            if (currentBounty) {
                const docRef = doc(db, "bounties", currentBounty.id);
                await updateDoc(docRef, dataToSave);
                setBounties(prev => prev.map(b => b.id === currentBounty.id ? { ...b, ...dataToSave } : b));
            } else {
                const docRef = await addDoc(collection(db, "bounties"), {
                    ...dataToSave,
                    createdAt: new Date().toISOString()
                });
                setBounties(prev => [...prev, { id: docRef.id, ...dataToSave }]);
            }
            setIsModalOpen(false);
        } catch (error) {
            setDialog({ show: true, message: "Failed to save: " + error.message, type: "error" });
        }
    };

    const handleSeed = async () => {
        if (!confirm("WARNING: This will DELETE ALL existing BOUNTIES and replace them with REAL XP TASKS. Proceed?")) return;

        const realBounties = [
            {
                title: "Optimise React Re-renders",
                company: "OpenSource",
                reward: "2500 XP",
                type: "Frontend",
                difficulty: "Medium",
                status: "OPEN",
                description: "Fix excessive re-renders in the ChatComponent. Performance is degrading on mobile.",
                requirements: ["Profile with React DevTools", "Implement React.memo / useMemo", "Verify <16ms render time"]
            },
            {
                title: "Dark Mode Contrast Fix",
                company: "DeVert Internal",
                reward: "1000 XP",
                type: "Design",
                difficulty: "Easy",
                status: "OPEN",
                description: "Audit the new dark mode palette. Some text inputs have low contrast ratios.",
                requirements: ["Check WCAG AA compliance", "Update Tailwind config", "Test on OLED screens"]
            },
            {
                title: "Secure API Endpoints",
                company: "DeFi Protocol",
                reward: "15000 XP",
                type: "Backend",
                difficulty: "Hard",
                status: "OPEN",
                description: "Implement Rate Limiting and JWT validation for the user_profile routes.",
                requirements: ["Redis based rate limiting", "Verify JWT signature", "Write integration tests"]
            },
            {
                title: "Smart Contract Audit",
                company: "Web3 Foundation",
                reward: "50000 XP",
                type: "Contract",
                difficulty: "Veteran",
                status: "OPEN",
                description: "Find re-entrancy vulnerabilities in the Vault contract before mainnet launch.",
                requirements: ["Analyze Solidity code", "Write PoC exploit", "Suggest fix"]
            },
            {
                title: "Migrate to Next.js 15",
                company: "Legacy App",
                reward: "8000 XP",
                type: "Frontend",
                difficulty: "Hard",
                status: "OPEN",
                description: "Upgrade the codebase from Pages router to App router.",
                requirements: ["Refactor routing logic", "Implement Server Components", "Ensure SEO parity"]
            },
            {
                title: "Write Documentation",
                company: "Community",
                reward: "500 XP",
                type: "Design",
                difficulty: "Easy",
                status: "OPEN",
                description: "Create a clear 'Getting Started' guide for new contributors.",
                requirements: ["Markdown format", "Include setup screenshots", "Explain directory structure"]
            }
        ];

        setLoading(true);
        try {
            // 1. Clear existing data
            const snapshot = await getDocs(collection(db, "bounties"));
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "bounties", d.id)));
            await Promise.all(deletePromises);

            // 2. Add new data
            const addPromises = realBounties.map(b =>
                addDoc(collection(db, "bounties"), {
                    ...b,
                    createdAt: new Date().toISOString()
                })
            );
            await Promise.all(addPromises);
            setDialog({ show: true, message: "Mercenary Board Refreshed with XP Tasks.", type: "success" });
            fetchBounties();
        } catch (error) {
            console.error("Seeding failed:", error);
            setDialog({ show: true, message: "Seeding failed: " + error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[80vh]">
            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${dialog.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-neon-green/10 text-neon-green'}`}>
                            {dialog.type === 'error' ? <Shield size={32} /> : <CheckCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold font-sans text-white mb-2">{dialog.type === 'error' ? 'SYSTEM_ERROR' : 'OPERATION_COMPLETE'}</h3>
                        <p className="font-mono text-sm text-gray-400 mb-6">{dialog.message}</p>
                        <button
                            onClick={() => setDialog({ ...dialog, show: false })}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-mono py-2 text-sm uppercase tracking-wider transition-colors"
                        >
                            CLOSE_DIALOG
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white">MERCENARY_BOARD</h1>
                    <p className="font-mono text-xs text-gray-500">Manage active contracts and rewards.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeed}
                        className="bg-white/10 border border-white/20 text-white px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white hover:text-black transition-all"
                    >
                        <Database size={16} className="mr-2" /> SEED_XP_TASKS
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-yellow-500 text-black px-4 py-2 font-bold font-mono text-sm flex items-center hover:bg-white transition-colors"
                    >
                        <Plus size={16} className="mr-2" /> CREATE_CONTRACT
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-yellow-500 font-mono animate-pulse">Scanning contracts...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {bounties.map((bounty) => (
                        <div
                            key={bounty.id}
                            className={`bg-black/40 border p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-yellow-500/50 transition-colors group ${bounty.status === 'OPEN' ? 'border-white/10' : 'border-red-900/30 opacity-50'}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono border ${bounty.difficulty === 'Easy' ? 'border-neon-green text-neon-green' :
                                            bounty.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-500' :
                                                'border-red-500 text-red-500'
                                        }`}>
                                        {bounty.difficulty}
                                    </span>
                                    <h3 className="text-xl font-bold font-sans text-white">{bounty.title}</h3>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 max-w-2xl">{bounty.description}</p>
                                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500">
                                    <span className="flex items-center text-neon-cyan"><Briefcase size={12} className="mr-1" /> {bounty.company}</span>
                                    <span className="flex items-center text-yellow-500 font-bold"><Zap size={12} className="mr-1" /> {bounty.reward}</span>
                                    <span className="flex items-center"><Target size={12} className="mr-1" /> {bounty.type}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(bounty)} className="p-2 hover:bg-white/10 text-yellow-500 rounded transition-colors"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(bounty.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {bounties.length === 0 && <div className="text-center py-20 text-gray-500 font-mono">NO CONTRACTS FOUND.</div>}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 p-8 shadow-2xl z-10"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
                            <h2 className="text-xl font-bold font-sans text-white mb-6">CONTRACT_EDITOR</h2>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">TITLE</label>
                                        <input className="input" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">COMPANY / CLIENT</label>
                                        <input className="input" required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">REWARD (XP)</label>
                                        <input className="input" required value={formData.reward} onChange={e => setFormData({ ...formData, reward: e.target.value })} placeholder="5000 XP" />
                                    </div>
                                    <div>
                                        <label className="label">TYPE</label>
                                        <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option>Frontend</option>
                                            <option>Backend</option>
                                            <option>Design</option>
                                            <option>Contract</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">DIFFICULTY</label>
                                        <select className="input" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                            <option>Veteran</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">DESCRIPTION</label>
                                    <textarea className="input h-20 resize-none" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div>
                                    <label className="label">REQUIREMENTS (One per line)</label>
                                    <textarea className="input h-32 resize-none font-mono text-xs" required value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} placeholder="- Node.js v18+&#10;- Must include tests" />
                                </div>

                                <button type="submit" className="w-full bg-yellow-500 text-black font-bold font-mono py-3 mt-4 hover:bg-white transition-colors">PUBLISH CONTRACT</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <style jsx>{`
                .label { display: block; font-size: 0.65rem; font-family: monospace; color: #9ca3af; margin-bottom: 0.25rem; }
                .input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.5rem; color: white; font-family: sans-serif; outline: none; transition: border-color 0.2s; }
                .input:focus { border-color: #EAB308; }
            `}</style>
        </div>
    );
}
