"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Zap, Edit3, Save, Eye, EyeOff, StopCircle, X, AlertTriangle, Construction, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP = {
    trophy: <Trophy className="text-neon-cyan" size={32} />,
    award: <Award className="text-purple-500" size={32} />,
    zap: <Zap className="text-neon-green" size={32} />,
    dashboard: <LayoutDashboard className="text-neon-cyan" size={32} />,
};

const DEFAULT_CONFIG = [
    {
        id: "proof-card",
        title: "Proof Card",
        desc: "Your verifiable identity. Not a list of titles, but a dynamic gallery of your best work.",
        iconType: "award",
        border: "hover:border-neon-cyan",
        shadow: "hover:shadow-neon-cyan/20",
        href: "/profile",
        enabled: true
    },
    {
        id: "build-trail",
        title: "Build Trail",
        desc: "The timeline of your grit. Every project from idea to deployment, tracked and verified.",
        iconType: "zap",
        border: "hover:border-neon-green",
        shadow: "hover:shadow-neon-green/20",
        href: "/my-projects",
        enabled: true
    },
    {
        id: "skill-rank",
        title: "Skill Battles",
        desc: "Compete with the top 1%. Prove your technical superiority in real-world scenarios.",
        iconType: "trophy",
        border: "hover:border-purple-500",
        shadow: "hover:shadow-purple-500/20",
        href: "/arena",
        enabled: true
    }
];

export function LootBox() {
    const { user } = useAuth();
    const isAdmin = user?.email === "admin@devert.in";
    const [items, setItems] = useState(DEFAULT_CONFIG);
    const [editedItems, setEditedItems] = useState(DEFAULT_CONFIG);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docRef = doc(db, "system", "lootbox");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setItems(docSnap.data().items);
                    setEditedItems(docSnap.data().items);
                } else {
                    setItems(DEFAULT_CONFIG);
                    setEditedItems(DEFAULT_CONFIG);
                }
            } catch (error) {
                console.error("Error fetching lootbox config:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleEditChange = (index, field, value) => {
        if (!isAdmin) return;
        const newItems = [...editedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedItems(newItems);
    };

    const toggleItemStatus = async (index) => {
        if (!isAdmin) return;
        const newItems = [...items];
        newItems[index].enabled = !newItems[index].enabled;
        setItems(newItems);

        try {
            await setDoc(doc(db, "system", "lootbox"), {
                items: newItems,
                author: user.email,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "lootbox"), {
                items: editedItems,
                author: user.email,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setItems(editedItems);
            setIsEditing(false);
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((item, idx) => {
                    if (!item.enabled && !isAdmin) return null;
                    
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group relative p-6 bg-card-bg bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl border border-border rounded-2xl transition-all duration-500 overflow-hidden shadow-premium hover:shadow-2xl ${item.border} ${item.shadow} ${!item.enabled ? 'opacity-50 grayscale' : ''}`}
                        >
                            {!item.enabled && (
                                <div className="absolute top-4 right-4 text-gray-500 font-mono text-[10px] uppercase flex items-center gap-2">
                                    <EyeOff size={12} /> Hidden_from_public
                                </div>
                            )}

                            {isAdmin && (
                                <button
                                    onClick={(e) => { e.preventDefault(); toggleItemStatus(idx); }}
                                    className="absolute top-4 left-4 z-20 p-2 bg-background/50 border border-border rounded-full text-muted-foreground hover:text-neon-cyan transition-colors"
                                >
                                    {item.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                            )}

                            <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">
                                    {ICON_MAP[item.iconType]}
                                </div>
                                <h3 className="text-xl font-bold font-sans text-foreground mb-2 tracking-tighter uppercase">{item.title}</h3>
                                <p className="text-muted-foreground text-[13px] font-mono leading-relaxed mb-6">{item.desc}</p>
                                
                                <Link
                                    href={item.link || item.href}
                                    className="inline-flex items-center gap-3 text-[11px] font-bold font-mono tracking-widest text-foreground group-hover:text-neon-cyan transition-colors uppercase"
                                >
                                    ACCESS_MODULE <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            {/* Background decorative path */}
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                {ICON_MAP[item.iconType]}
                            </div>
                        </motion.div>
                    );
                })}

                {isAdmin && (
                    <motion.button
                        layout
                        onClick={() => setIsEditing(!isEditing)}
                        className="fixed bottom-10 right-10 z-[300] bg-neon-cyan text-black px-8 py-3 rounded-xl font-bold font-mono text-xs shadow-[0_10px_40px_rgba(34,211,238,0.3)] flex items-center gap-3 hover:scale-110 transition-all uppercase"
                    >
                        {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                        {isEditing ? "CLOSE_INTERFACE" : "EDIT_MODULES"}
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-4 md:inset-20 bg-background/95 backdrop-blur-2xl border border-neon-cyan/30 z-[300] p-8 md:p-12 overflow-y-auto rounded-3xl shadow-premium"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-3xl font-black font-sans text-neon-cyan tracking-tighter uppercase">MODULE_EDITOR</h2>
                                <p className="text-gray-500 font-mono text-xs tracking-widest mt-2 uppercase">Authorized session: {user?.email}</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white"><X size={32} /></button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-12">
                            {editedItems.map((item, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-black rounded-xl border border-white/5">{ICON_MAP[item.iconType]}</div>
                                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ST0T_{index+1}</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-mono text-gray-600 uppercase mb-1 block">Title</label>
                                            <input
                                                className="w-full bg-card-bg border border-border p-3 text-foreground font-mono text-xs rounded-xl focus:border-neon-cyan outline-none"
                                                value={item.title}
                                                onChange={(e) => handleEditChange(index, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-mono text-gray-600 uppercase mb-1 block">Description</label>
                                            <textarea
                                                className="w-full bg-black border border-white/10 p-3 text-white font-mono text-xs rounded-xl h-24 focus:border-neon-cyan outline-none"
                                                value={item.desc}
                                                onChange={(e) => handleEditChange(index, 'desc', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-mono text-gray-600 uppercase mb-1 block">URI_PATH</label>
                                            <input
                                                className="w-full bg-black border border-white/10 p-3 text-white font-mono text-xs rounded-xl focus:border-neon-cyan outline-none"
                                                value={item.href || item.link}
                                                onChange={(e) => handleEditChange(index, 'href', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-12 border-t border-white/10 gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-10 py-4 text-[11px] font-mono text-gray-400 hover:text-white"
                            >
                                ABORT_CHANGES
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="bg-neon-cyan text-black px-12 py-4 rounded-xl font-black font-mono text-xs shadow-2xl hover:scale-105 transition-all flex items-center gap-3 uppercase"
                            >
                                {saving ? "PLANET_ALIGNED..." : <><Save size={16}/> COMMMIT_TO_CORE</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
