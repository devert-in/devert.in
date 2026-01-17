"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Zap, Edit3, Save, Eye, EyeOff, StopCircle, X, AlertTriangle, Construction } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP = {
    trophy: <Trophy className="text-neon-cyan" size={32} />,
    award: <Award className="text-purple-500" size={32} />,
    zap: <Zap className="text-neon-green" size={32} />,
};

const DEFAULT_CONFIG = [
    {
        id: "hackathons",
        title: "Latest Hackathons",
        desc: "Dominate the arena. Curated list of high-value hackathons.",
        iconType: "trophy",
        border: "hover:border-neon-cyan",
        shadow: "hover:shadow-neon-cyan/20",
        href: "/hackathons",
        enabled: true
    },
    {
        id: "certifications",
        title: "Certifications",
        desc: "Badges that actually matter. Cloud, Security, AI.",
        iconType: "award",
        border: "hover:border-purple-500",
        shadow: "hover:shadow-purple-500/20",
        href: "/courses",
        enabled: true
    },
    {
        id: "hacks",
        title: "Productivity Hacks",
        desc: "Terminal velocity. Scripts & tools to code 10x faster.",
        iconType: "zap",
        border: "hover:border-neon-green",
        shadow: "hover:shadow-neon-green/20",
        href: "/resources",
        enabled: true
    }
];

export function LootBox() {
    const { user } = useAuth();
    const isAdmin = user?.email?.includes("admin");
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
                    // Initialize if not exists
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
        const newItems = [...editedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditedItems(newItems);
    };

    // Immediate toggle for admins
    const toggleItemStatus = async (index) => {
        const newItems = [...items]; // Operate on live items if not in edit mode, but better to use state
        newItems[index].enabled = !newItems[index].enabled;
        setItems(newItems);

        // Optimistic update to DB
        try {
            await setDoc(doc(db, "system", "lootbox"), {
                items: newItems,
                updatedAt: new Date().toISOString(),
                updatedBy: user.email
            }, { merge: true });
        } catch (err) {
            console.error("Failed to toggle status", err);
            // Revert on error
            newItems[index].enabled = !newItems[index].enabled;
            setItems(newItems);
        }
    };

    const handleEditToggleEnable = (index) => {
        const newItems = [...editedItems];
        newItems[index] = { ...newItems[index], enabled: !newItems[index].enabled };
        setEditedItems(newItems);
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "lootbox"), {
                items: editedItems,
                updatedAt: new Date().toISOString(),
                updatedBy: user.email
            });
            setItems(JSON.parse(JSON.stringify(editedItems)));
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving lootbox config:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const displayItems = isEditing ? editedItems : items;

    return (
        <section className="py-32 px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between mb-16">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold font-sans mb-2 text-foreground flex items-center gap-4">
                            LOOT_BOX
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            setEditedItems(JSON.parse(JSON.stringify(items)));
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className={`text-xs px-3 py-1 border rounded font-mono flex items-center gap-2 transition-colors ${isEditing
                                            ? "border-red-500 text-red-500 hover:bg-red-500/10"
                                            : "border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                                        }`}
                                >
                                    {isEditing ? <><X size={12} /> CANCEL</> : <><Edit3 size={12} /> ADMIN_EDIT</>}
                                </button>
                            )}
                        </h2>
                        <p className="font-mono text-gray-400">Equip yourself for the journey.</p>
                    </div>
                    <div className="hidden md:block w-1/3 h-[1px] bg-gradient-to-l from-transparent to-gray-700"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {displayItems.map((item, i) => {
                        // View Logic
                        const isLive = item.enabled;
                        const showUnderConstruction = !isLive && !isAdmin && !isEditing;

                        if (showUnderConstruction) {
                            return (
                                <div key={i} className="h-full p-8 bg-card-bg/50 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden grayscale opacity-75">
                                    <div className="absolute inset-0 stripes-bg opacity-10"></div>
                                    <Construction className="text-yellow-500 mb-4 animate-pulse" size={48} />
                                    <h3 className="text-xl font-bold font-sans text-gray-500 mb-2">UNDER CONSTRUCTION</h3>
                                    <p className="font-mono text-xs text-gray-600">This module is currently being upgraded. Check back later.</p>
                                    <div className="mt-4 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-mono border border-yellow-500/20 rounded">
                                        STATUS: 503_MAINTENANCE
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={i} className="h-full relative group">
                                {isEditing ? (
                                    // Edit Mode Card
                                    <div className={`p-6 bg-black border ${item.enabled ? 'border-neon-cyan/50' : 'border-gray-800 opacity-75'} flex flex-col h-full gap-4`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-mono text-xs text-gray-500">ITEM_{i + 1}</div>
                                            <button
                                                onClick={() => handleEditToggleEnable(i)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold font-mono ${item.enabled ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-500'}`}
                                            >
                                                {item.enabled ? <><Eye size={12} /> ENABLED</> : <><EyeOff size={12} /> DISABLED</>}
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500 block mb-1">TITLE</label>
                                            <input
                                                value={item.title}
                                                onChange={e => handleEditChange(i, 'title', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 p-2 text-white font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500 block mb-1">DESCRIPTION</label>
                                            <textarea
                                                value={item.desc}
                                                onChange={e => handleEditChange(i, 'desc', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 p-2 text-gray-300 text-sm h-20 resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-mono text-gray-500 block mb-1">LINK (HREF)</label>
                                            <input
                                                value={item.href}
                                                onChange={e => handleEditChange(i, 'href', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 p-2 text-neon-cyan font-mono text-xs"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    // Live Mode Card (Admin sees controls, user sees content)
                                    <div className="relative h-full">
                                        {/* Admin Inline Status Toggle */}
                                        {isAdmin && (
                                            <div className="absolute top-4 right-4 z-50">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleItemStatus(i);
                                                    }}
                                                    className={`p-2 rounded-full backdrop-blur-md border shadow-lg transition-all ${isLive ? 'bg-neon-green/10 text-neon-green border-neon-green hover:bg-red-500 hover:border-red-500 hover:text-white' : 'bg-red-500 text-white border-red-500 hover:bg-neon-green hover:border-neon-green hover:text-black'}`}
                                                    title={isLive ? "Click to Disable" : "Click to Enable"}
                                                >
                                                    {isLive ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </div>
                                        )}

                                        <Link href={item.href} className={`block h-full ${!isLive ? 'pointer-events-none' : ''}`}>
                                            <motion.div
                                                whileHover={isLive ? { y: -10 } : {}}
                                                className={`p-8 bg-card-bg backdrop-blur-md border border-border ${isLive ? item.border : 'border-gray-800'} ${isLive ? item.shadow : ''} transition-all duration-300 group hover:shadow-2xl flex flex-col h-full cursor-pointer relative overflow-hidden ${!isLive ? 'opacity-50 grayscale' : ''}`}
                                            >
                                                {!isLive && isAdmin && (
                                                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-mono px-2 py-1 z-50">
                                                        DISABLED (USER VIEW: HIDDEN)
                                                    </div>
                                                )}

                                                <div className="mb-6 bg-background w-16 h-16 flex items-center justify-center border border-border group-hover:border-transparent transition-colors relative z-10">
                                                    {ICON_MAP[item.iconType] || <Zap />}
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-bold font-sans mb-3 text-foreground relative z-10">{item.title}</h3>
                                                <p className="font-mono text-sm text-muted-foreground leading-relaxed flex-grow relative z-10">{item.desc}</p>

                                                <div className="mt-8 flex justify-end relative z-10">
                                                    <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">ACCESS -&gt;</span>
                                                </div>

                                                {/* Subtle hover gradient bloom */}
                                                {isLive && (
                                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${item.iconType === 'trophy' ? 'from-neon-cyan/50 to-transparent' :
                                                            item.iconType === 'award' ? 'from-purple-500/50 to-transparent' :
                                                                'from-neon-green/50 to-transparent'
                                                        }`}></div>
                                                )}
                                            </motion.div>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Admin Save Bar */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-neon-cyan z-50 flex items-center justify-between"
                    >
                        <div className="text-neon-cyan font-mono text-sm animate-pulse">
                            LOOTBOX_CONFIG // ADMIN_MODE
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedItems(JSON.parse(JSON.stringify(items)));
                                }}
                                className="px-6 py-2 border border-red-500 text-red-500 font-mono text-sm hover:bg-red-500/10"
                            >
                                DISCARD
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="px-6 py-2 bg-neon-cyan text-black font-bold font-mono text-sm hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <><StopCircle className="animate-spin" size={16} /> SAVING...</> : <><Save size={16} /> SAVE_CHANGES</>}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
