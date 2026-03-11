"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Terminal, Plus, Trash2, Save, Edit2, Code, Cpu, Shield, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_DATA = {
    title: "THE_DEVERTS",
    profiles: [
        {
            id: 1,
            name: "SAMUEL",
            role: "THE ARCHITECT",
            sub: "Logic // Core // Systems",
            color: "cyan",
            icon: "terminal",
            href: "https://www.linkedin.com/in/adarisamuelprasad/"
        },
        {
            id: 2,
            name: "BHANU",
            role: "THE BUILDER",
            sub: "Visuals // Flow // UI",
            color: "green",
            icon: "user",
            href: "https://www.linkedin.com/in/bhanu-prasad-vengaladas-7095a6305/"
        }
    ]
};

const ICON_MAP = {
    terminal: Terminal,
    user: User,
    code: Code,
    cpu: Cpu,
    shield: Shield,
    zap: Zap
};

export function DuoProfile() {
    const { user } = useAuth();
    const isAdmin = user?.email === "admin@devert.in";

    const [data, setData] = useState(DEFAULT_DATA);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch config
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "system", "footer_config"), (doc) => {
            if (doc.exists()) {
                setData(doc.data());
            }
            // else use default (already set)
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "footer_config"), data);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving footer config:", error);
            alert("Failed to save changes: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const addProfile = () => {
        const newProfile = {
            id: Date.now(),
            name: "NEW_MEMBER",
            role: "ROLE",
            sub: "Skill // Skill",
            color: "green",
            icon: "user",
            href: "#"
        };
        setData(prev => ({ ...prev, profiles: [...prev.profiles, newProfile] }));
    };

    const removeProfile = (id) => {
        if (confirm("Are you sure you want to remove this profile?")) {
            setData(prev => ({
                ...prev,
                profiles: prev.profiles.filter(p => p.id !== id)
            }));
        }
    };

    const updateProfile = (id, field, value) => {
        setData(prev => ({
            ...prev,
            profiles: prev.profiles.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        }));
    };

    return (
        <section className="py-10 px-4 relative group/section">
            <div className="max-w-4xl mx-auto">
                {/* Admin Controls */}
                {isAdmin && (
                    <div className="absolute top-0 right-0 z-20">
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-neon-green text-black px-3 py-1 text-xs font-bold font-mono flex items-center gap-1 rounded hover:bg-white"
                            >
                                <Save size={12} /> {saving ? "SAVING..." : "SAVE_CONFIG"}
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 text-gray-400 px-3 py-1 text-xs font-bold font-mono flex items-center gap-1 rounded hover:bg-white hover:text-black transition-colors"
                            >
                                <Edit2 size={12} /> EDIT_SECTION
                            </button>
                        )}
                    </div>
                )}

                {/* Section Title */}
                <h2 className="text-xl md:text-2xl font-bold font-sans mb-6 text-center opacity-80 flex justify-center items-center gap-2">
                    {isEditing ? (
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData({ ...data, title: e.target.value })}
                            className="bg-black/50 border border-neon-green/50 text-neon-green text-center p-1 rounded outline-none w-64"
                        />
                    ) : (
                        <span className="text-neon-green">&lt; {data.title} /&gt;</span>
                    )}
                </h2>

                {/* Profiles Grid */}
                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <AnimatePresence>
                        {data.profiles.map((profile, index) => (
                            <motion.div
                                key={profile.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <PlayerCard
                                    {...profile}
                                    isEditing={isEditing}
                                    index={index}
                                    onUpdate={(field, val) => updateProfile(profile.id, field, val)}
                                    onDelete={() => removeProfile(profile.id)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Button */}
                    {isEditing && (
                        <motion.button
                            layout
                            onClick={addProfile}
                            className="h-full min-h-[150px] border-2 border-dashed border-white/10 rounded flex flex-col items-center justify-center text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors gap-2 bg-white/5"
                        >
                            <Plus size={32} />
                            <span className="font-mono text-sm">ADD_MEMBER</span>
                        </motion.button>
                    )}
                </div>
            </div>
        </section>
    );
}

function PlayerCard({ name, role, sub, color, icon, href, isEditing, onUpdate, onDelete, index }) {
    const textColor = color === 'cyan' ? 'text-neon-cyan' : 'text-neon-green';
    const glowClass = color === 'cyan' ? 'hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'hover:shadow-[0_0_15px_rgba(0,255,65,0.2)]';
    const bgHover = color === 'cyan' ? 'group-hover:bg-neon-cyan/5' : 'group-hover:bg-neon-green/5';

    const IconComponent = ICON_MAP[icon] || User;

    if (isEditing) {
        return (
            <div className="relative p-5 border border-white/20 bg-black/80 backdrop-blur-sm rounded h-full space-y-3">
                <button
                    onClick={onDelete}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded"
                >
                    <Trash2 size={14} />
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 font-mono block">NAME</label>
                        <input
                            value={name}
                            onChange={(e) => onUpdate('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white text-xs p-1 rounded font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-mono block">COLOR</label>
                        <select
                            value={color}
                            onChange={(e) => onUpdate('color', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white text-xs p-1 rounded"
                        >
                            <option value="cyan">Cyan</option>
                            <option value="green">Green</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono block">ROLE</label>
                    <input
                        value={role}
                        onChange={(e) => onUpdate('role', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-xs p-1 rounded"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono block">SUBTITLE</label>
                    <input
                        value={sub}
                        onChange={(e) => onUpdate('sub', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white text-xs p-1 rounded"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono block">LINKEDIN URL</label>
                    <input
                        value={href}
                        onChange={(e) => onUpdate('href', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-gray-400 text-xs p-1 rounded font-mono"
                    />
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 font-mono block">ICON</label>
                    <div className="flex gap-2 mt-1">
                        {Object.keys(ICON_MAP).map(k => (
                            <button
                                key={k}
                                onClick={() => onUpdate('icon', k)}
                                className={`p-1 rounded ${icon === k ? 'bg-neon-cyan text-black' : 'bg-white/5 text-gray-400'}`}
                            >
                                {k === 'terminal' && <Terminal size={12} />}
                                {k === 'user' && <User size={12} />}
                                {k === 'code' && <Code size={12} />}
                                {k === 'cpu' && <Cpu size={12} />}
                                {k === 'shield' && <Shield size={12} />}
                                {k === 'zap' && <Zap size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <a
            href={href}
            target="_blank"
            className="block h-full"
        >
            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative p-5 border border-white/10 bg-white/5 backdrop-blur-sm ${glowClass} ${bgHover} transition-all duration-300 group overflow-hidden cursor-pointer rounded h-full`}
            >
                <div className={`absolute top-0 left-0 w-full h-0.5 ${color === 'cyan' ? 'bg-neon-cyan' : 'bg-neon-green'} transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500`}></div>

                <div className="flex items-center gap-4">
                    <div className={` ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold font-sans ${textColor} uppercase tracking-tight`}>{name}</h3>
                        <div className="text-xs font-bold text-white mb-0.5">{role}</div>
                        <p className="font-mono text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">{sub}</p>
                    </div>
                </div>

                {/* Decorative Background Numbers */}
                <span className="absolute -bottom-4 -right-2 text-6xl font-bold text-white/5 select-none pointer-events-none font-sans group-hover:text-white/10 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                </span>
            </motion.div>
        </a>
    );
}
