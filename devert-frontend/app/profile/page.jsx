"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import Link from "next/link";
import { ArrowLeft, User, Github, Linkedin, Save, Terminal, Code } from "lucide-react";

export default function ProfilePage() {
    const { user, userData, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    // Form State
    const [displayName, setDisplayName] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [role, setRole] = useState("CADET"); // CADET, ARCHITECT, BUILDER
    const [bio, setBio] = useState("");
    const [skills, setSkills] = useState("");

    // Load data when userData changes
    useEffect(() => {
        if (userData) {
            setDisplayName(userData.displayName || "");
            setGithub(userData.github || "");
            setLinkedin(userData.linkedin || "");
            setRole(userData.role || "CADET");
            setBio(userData.bio || "");
            setSkills(userData.skills || "");
        } else if (user) {
            // Fallback to auth data if firestore is empty
            setDisplayName(user.email.split('@')[0]);
        }
    }, [userData, user]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMsg("");

        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                displayName,
                email: user.email,
                github,
                linkedin,
                role,
                bio,
                skills,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setMsg("PROFILE_UPDATED");
            refreshProfile(); // Refresh global context
        } catch (error) {
            console.error(error);
            setMsg("ERROR_SAVING");
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4 text-neon-cyan font-mono">
                <div>ACCESS_DENIED</div>
                <Link href="/login" className="underline">LOGIN_REQUIRED</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-500 hover:text-foreground flex items-center transition-colors w-fit font-mono text-xs group mb-8">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> RETURN_TO_BASE
                </Link>

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Left: Card Preview */}
                    <div className="w-full md:w-1/3">
                        <div className="sticky top-24">
                            <h2 className="font-mono text-gray-400 text-xs mb-4">PUBLIC_ID_CARD</h2>
                            <div className="bg-card-bg border border-border p-6 relative group overflow-hidden">
                                {/* Holographic effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-neon-cyan/5 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full border-2 border-neon-cyan bg-background flex items-center justify-center mb-4 text-neon-cyan">
                                        <User size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold font-sans text-foreground">{displayName || "UNKNOWN_USER"}</h3>
                                    <div className="font-mono text-xs text-neon-green mb-4">{role}</div>

                                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                                        {bio || "No bio data. Update your profile."}
                                    </p>

                                    <div className="flex gap-4">
                                        {github && <Github size={18} className="text-gray-500 hover:text-foreground cursor-pointer" />}
                                        {linkedin && <Linkedin size={18} className="text-gray-500 hover:text-foreground cursor-pointer" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Edit Form */}
                    <div className="w-full md:w-2/3">
                        <h1 className="text-3xl font-bold font-sans mb-2">OPERATIVE_PROFILE</h1>
                        <p className="text-gray-500 font-mono text-sm mb-8">Update your designated credentials.</p>

                        <form onSubmit={handleSave} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400">DISPLAY_NAME</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full bg-card-bg border border-border p-3 text-foreground focus:border-neon-cyan outline-none font-sans"
                                        placeholder="John Wick"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400">ROLE_DESIGNATION (LOCKED)</label>
                                    <div className="w-full bg-card-bg border border-border p-3 text-gray-500 font-mono cursor-not-allowed">
                                        {role}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-400">BIO_DATA</label>
                                <textarea
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="w-full bg-card-bg border border-border p-3 text-foreground focus:border-neon-cyan outline-none font-sans h-32 resize-none"
                                    placeholder="Brief description of your skills and mission..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono text-gray-400">SKILLS (Comma Separated)</label>
                                <div className="relative">
                                    <Code className="absolute left-3 top-3.5 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        value={skills}
                                        onChange={e => setSkills(e.target.value)}
                                        className="w-full bg-card-bg border border-border p-3 pl-10 text-foreground focus:border-neon-cyan outline-none font-sans"
                                        placeholder="React, Node.js, Python..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400 flex items-center gap-2"><Github size={12} /> GITHUB_URL</label>
                                    <input
                                        type="text"
                                        value={github}
                                        onChange={e => setGithub(e.target.value)}
                                        className="w-full bg-card-bg border border-border p-3 text-foreground focus:border-neon-cyan outline-none font-sans"
                                        placeholder="github.com/username"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-400 flex items-center gap-2"><Linkedin size={12} /> LINKEDIN_URL</label>
                                    <input
                                        type="text"
                                        value={linkedin}
                                        onChange={e => setLinkedin(e.target.value)}
                                        className="w-full bg-card-bg border border-border p-3 text-foreground focus:border-neon-cyan outline-none font-sans"
                                        placeholder="linkedin.com/in/username"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-neon-cyan/10 border border-neon-cyan text-neon-cyan px-8 py-3 font-mono hover:bg-neon-cyan hover:text-black transition-colors flex items-center gap-2"
                            >
                                {loading ? "SAVING..." : <><Save size={16} /> UPDATE_RECORDS</>}
                            </button>

                            {msg && (
                                <div className="font-mono text-xs text-neon-green pt-2">
                                    &gt; {msg}
                                </div>
                            )}

                        </form>

                        {/* Password Management Section */}
                        <PasswordManager user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PasswordManager({ user }) {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!newPass || !confirmPass || !currentPass) {
            setMsg("ALL_FIELDS_REQUIRED");
            return;
        }
        if (newPass !== confirmPass) {
            setMsg("PASSWORDS_DO_NOT_MATCH");
            return;
        }
        if (newPass.length < 6) {
            setMsg("PASSWORD_TOO_SHORT");
            return;
        }

        setLoading(true);
        setMsg("");

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPass);
            setMsg("SUCCESS: PASSWORD_UPDATED");
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                setMsg("ERROR: INCORRECT_CURRENT_PASSWORD");
            } else {
                setMsg("ERROR: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-12 pt-12 border-t border-white/10">
            <h2 className="text-xl font-bold font-sans mb-4 text-white">SECURITY_SETTINGS</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md bg-white/5 border border-white/10 p-6 rounded-lg">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-400">CURRENT_PASSWORD</label>
                    <input
                        type="password"
                        value={currentPass}
                        onChange={e => setCurrentPass(e.target.value)}
                        className="w-full bg-black border border-white/20 p-2 text-white outline-none focus:border-neon-cyan font-mono text-sm"
                        placeholder="••••••••"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-gray-400">NEW_PASSWORD</label>
                        <input
                            type="password"
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full bg-black border border-white/20 p-2 text-white outline-none focus:border-neon-cyan font-mono text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-gray-400">CONFIRM_PASSWORD</label>
                        <input
                            type="password"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            className="w-full bg-black border border-white/20 p-2 text-white outline-none focus:border-neon-cyan font-mono text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan py-2 font-mono text-sm hover:bg-neon-cyan hover:text-black transition-colors font-bold mt-2"
                >
                    {loading ? "UPDATING_SECURITY_TOKENS..." : "UPDATE_PASSWORD"}
                </button>

                {msg && (
                    <div className={`mt-2 font-mono text-xs ${msg.includes("SUCCESS") ? "text-neon-green" : "text-red-500"}`}>
                        &gt; {msg}
                    </div>
                )}
            </form>
        </div>
    );
}
