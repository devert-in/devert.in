"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Zap, Target, Users, Calendar, Trophy, Gift, Award, Briefcase, GraduationCap, CheckCircle, Plus, X, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, addDoc, query, where, getDocs, doc, setDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ChallengePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview"); // overview, timeline, register
    const [registrationStep, setRegistrationStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    const [existingRegistration, setExistingRegistration] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [challengeEvent, setChallengeEvent] = useState(null);

    // Registration Form State
    const [formData, setFormData] = useState({
        teamName: "",
        members: [
            { name: "", email: "", phone: "", type: "STUDENT", details: { college: "", course: "", year: "" } }
        ]
    });

    useEffect(() => {
        if (user) {
            fetchRegistration();
        }
        fetchEventStatus();
    }, [user]);

    const fetchEventStatus = async () => {
        try {
            const q = query(collection(db, "hackathons"), where("isSpecialEvent", "==", true), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setChallengeEvent(querySnapshot.docs[0].data());
            }
        } catch (error) {
            console.error("Error fetching event status:", error);
        }
    };

    const fetchRegistration = async () => {
        try {
            const q = query(collection(db, "challenge_registrations"), where("registeredBy", "==", user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setExistingRegistration({ id: querySnapshot.docs[0].id, ...docData });
                setFormData({
                    teamName: docData.teamName,
                    members: docData.members
                });
            }
        } catch (error) {
            console.error("Error fetching registration:", error);
        }
    };

    const handleAddMember = () => {
        if (formData.members.length < 4) {
            setFormData({
                ...formData,
                members: [...formData.members, { name: "", email: "", phone: "", type: "STUDENT", details: { college: "", course: "", year: "" } }]
            });
        }
    };

    const handleRemoveMember = (index) => {
        if (formData.members.length > 2) { // Min 2 members
            const updated = [...formData.members];
            updated.splice(index, 1);
            setFormData({ ...formData, members: updated });
        }
    };

    const updateMember = (index, field, value) => {
        const updated = [...formData.members];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, members: updated });
    };

    const updateMemberDetail = (index, field, value) => {
        const updated = [...formData.members];
        updated[index].details = { ...updated[index].details, [field]: value };
        setFormData({ ...formData, members: updated });
    };

    const notifyBackend = async () => {
        try {
            const leadMember = formData.members[0];
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            await fetch(`${apiUrl}/api/notify/challenge-connected`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: leadMember.email,
                    teamName: formData.teamName,
                    leadName: leadMember.name
                }),
            });
        } catch (error) {
            console.error("Failed to signal backend:", error);
            // Non-blocking error, we don't stop the user flow
        }
    };

    const handleSubmitRegistration = async () => {
        setIsSubmitting(true);
        try {
            if (existingRegistration) {
                // Update existing
                await setDoc(doc(db, "challenge_registrations", existingRegistration.id), {
                    ...formData,
                    registeredBy: user.uid,
                    updatedAt: new Date().toISOString(),
                    status: existingRegistration.status || "PENDING"
                }, { merge: true });
                setDialog({ show: true, message: "SQUAD_DETAILS_UPDATED", type: "success" });
                setIsEditing(false);
                fetchRegistration(); // Refresh
                // Optional: Send email on update? Probably not necessary for now.
            } else {
                // Create new
                await addDoc(collection(db, "challenge_registrations"), {
                    ...formData,
                    registeredBy: user.uid,
                    registeredAt: new Date().toISOString(),
                    status: "PENDING"
                });

                // Trigger Email Notification
                await notifyBackend();

                setDialog({ show: true, message: "SQUAD_REGISTERED: Prepare for deployment.", type: "success" });
                setRegistrationStep(3); // Success Screen
                fetchRegistration();
            }
        } catch (error) {
            setDialog({ show: true, message: "REGISTRATION_FAILED: " + error.message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pt-28 relative overflow-hidden">
            <div className="fixed inset-0 grid-bg opacity-10 pointer-events-none"></div>

            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 max-w-md w-full relative shadow-2xl flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${dialog.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-neon-green/10 text-neon-green'}`}>
                            {dialog.type === 'error' ? <Zap size={32} /> : <Award size={32} />}
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

            <div className="max-w-6xl mx-auto relative z-10">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-purple-400 transition-colors mb-8">
                    <ArrowLeft size={16} className="mr-2" />
                    // RETURN_HQ
                </Link>

                {/* Hero Header */}
                <div className="mb-12 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-[10px] font-mono rounded border animate-pulse ${challengeEvent?.status === 'UPCOMING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {challengeEvent?.status === 'UPCOMING' ? '/// COMING_SOON' : '/// LIVE_EVENT'}
                        </span>
                        <span className="text-gray-500 font-mono text-xs">GLOBAL_BROADCAST_ID: #DVC-2026</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold font-sans mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-gray-500">
                        DEVERT <span className="text-purple-500">INNOVATION</span> CHALLENGE
                    </h1>
                    <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl">
                        A localized innovation operation. Identify failures. Architect solutions.
                        No cash handouts—only high-value assets: Exclusive Gear, Swag, and Direct Industry Access.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/5">
                    {["overview", "timeline", "register"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-2 font-mono text-sm uppercase tracking-wider transition-all relative ${activeTab === tab ? "text-purple-400" : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 gap-12"
                        >
                            <div className="space-y-8">
                                <div className="bg-white/5 border border-white/10 p-8 hover:border-purple-500/30 transition-colors group">
                                    <Trophy className="text-yellow-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                                    <h3 className="text-2xl font-bold font-sans mb-2">The Rewards</h3>
                                    <ul className="space-y-3 font-mono text-sm text-gray-400">
                                        <li className="flex items-center gap-2"><Gift size={14} className="text-purple-400" /> Exclusive DeVert Operative Swag Kits</li>
                                        <li className="flex items-center gap-2"><Briefcase size={14} className="text-purple-400" /> Gadgets</li>
                                        <li className="flex items-center gap-2"><Award size={14} className="text-purple-400" /> Verified Merit Certificates</li>
                                        <li className="flex items-center gap-2"><Target size={14} className="text-purple-400" /> Fast-Track Interviews with Partner NGOs/Tech Corps</li>
                                    </ul>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-8">
                                    <Users className="text-neon-cyan mb-4" size={32} />
                                    <h3 className="text-2xl font-bold font-sans mb-2">Squad Requirements</h3>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                                            <div className="text-3xl font-bold text-white mb-1">2</div>
                                            <div className="text-[10px] font-mono text-gray-500">MIN_MEMBERS</div>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                                            <div className="text-3xl font-bold text-white mb-1">4</div>
                                            <div className="text-[10px] font-mono text-gray-500">MAX_MEMBERS</div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs font-mono text-gray-500">
                                        *Squads can be mixed (Students + Professionals).
                                    </p>
                                </div>
                            </div>

                            <div className="relative h-full min-h-[400px] bg-purple-900/10 border border-purple-500/20 p-8 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <Zap size={120} className="text-purple-500/20" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold font-sans mb-4">Mission Briefing</h3>
                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        Your objective is to identify a critical failure in current societal or business systems and architect a technological solution.
                                        This is not about flashy UI. It is about functionality, scalability, and genuine impact.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 bg-black/40 border border-white/5 rounded">
                                            <span className="text-purple-500 font-bold font-mono">01</span>
                                            <p className="text-sm text-gray-400">Identify a Problem Statement (or choose from our bounty board).</p>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-black/40 border border-white/5 rounded">
                                            <span className="text-purple-500 font-bold font-mono">02</span>
                                            <p className="text-sm text-gray-400">Form a Squad (2-4 Members). Register before the deadline.</p>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 bg-black/40 border border-white/5 rounded">
                                            <span className="text-purple-500 font-bold font-mono">03</span>
                                            <p className="text-sm text-gray-400">Submit Blueprint (PPT/PDF) proposing the solution architecture.</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (challengeEvent?.status !== 'UPCOMING') setActiveTab("register");
                                    }}
                                    disabled={challengeEvent?.status === 'UPCOMING'}
                                    className={`mt-8 w-full py-4 font-bold font-mono transition-colors ${challengeEvent?.status === 'UPCOMING' ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                                >
                                    {challengeEvent?.status === 'UPCOMING' ? 'REGISTRATION_LOCKED // COMING_SOON' : 'INITIATE_REGISTRATION'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "timeline" && (
                        <motion.div
                            key="timeline"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto"
                        >
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-purple-500 before:to-transparent">
                                {[
                                    { date: "Jan 12, 2026", title: "Registrations Open", desc: "Squad formation protocols active.", status: "LIVE" },
                                    { date: "TBA", title: "Registration Deadline", desc: "Last date to register your squad.", status: "UPCOMING" },
                                    { date: "TBA", title: "Idea Submission (PPT)", desc: "Submit your solution blueprint via the dashboard.", status: "LOCKED" },
                                    { date: "TBA", title: "Shortlisting", desc: "Top 20 teams moved to Deployment Phase.", status: "LOCKED" },
                                    { date: "TBA", title: "Evaluation & Screening", desc: "Detailed review of deployed solutions.", status: "LOCKED" },
                                    { date: "TBA", title: "Final Results", desc: "Winners declared. Swag packs dispatched.", status: "LOCKED" }
                                ].map((item, index) => (
                                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-purple-500 bg-[#0a0a0a] group-hover:bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.3)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                                            <Calendar size={16} className="text-purple-400" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 p-6 rounded hover:border-purple-500/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <time className="font-mono text-xs text-purple-400 font-bold">{item.date}</time>
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${item.status === 'LIVE' ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-700 text-gray-500'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold font-sans text-white mb-1">{item.title}</h3>
                                            <p className="text-gray-400 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "register" && (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-3xl mx-auto bg-[#0a0a0a] border border-white/10 p-8 relative shadow-2xl"
                        >
                            {!user ? (
                                <div className="text-center py-20">
                                    <Shield size={48} className="mx-auto text-red-500 mb-4" />
                                    <h3 className="text-2xl font-bold font-sans mb-2">ACCESS_DENIED</h3>
                                    <p className="text-gray-400 mb-6 font-mono">Authentication required to access registration protocols.</p>
                                    <Link href="/login" className="px-8 py-3 bg-white text-black font-bold font-mono text-sm hover:bg-gray-200">
                                        LOGIN_TO_PROCEED
                                    </Link>
                                </div>
                            ) : existingRegistration && !isEditing ? (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} className="text-neon-green" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-sans mb-2">SQUAD_REGISTERED</h3>
                                    <p className="text-gray-400 mb-6 font-mono">You are already deployed for this mission.</p>

                                    <div className="bg-white/5 border border-white/10 p-6 rounded text-left mb-6 max-w-lg mx-auto">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-gray-500 font-mono text-xs">CODENAME</span>
                                            <span className="text-white font-bold">{existingRegistration.teamName}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-gray-500 font-mono text-xs block mb-2">OPERATIVES</span>
                                            {existingRegistration.members.map((m, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-300">{m.name}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{m.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setIsEditing(true); setRegistrationStep(1); }}
                                        className="text-purple-400 hover:text-white font-mono text-sm underline"
                                    >
                                        [EDIT_SQUAD_DETAILS]
                                    </button>
                                </div>
                            ) : registrationStep === 3 ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} className="text-neon-green" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-sans mb-2">REGISTRATION_CONFIRMED</h3>
                                    <p className="text-gray-400 mb-6 font-mono max-w-md mx-auto">
                                        Your squad has been entered into the database. Check your email for the mission dossier.
                                    </p>
                                    <button onClick={() => { setRegistrationStep(1); setActiveTab("overview"); fetchRegistration(); }} className="text-purple-400 hover:text-white font-mono text-sm underline">
                                        RETURN_TO_BASE
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-2xl font-bold font-sans mb-6 flex items-center justify-between">
                                        {isEditing ? "Update Squad Details" : "Squad Registration"}
                                        <span className="text-xs font-mono font-normal text-gray-500">STEP {registrationStep}/2</span>
                                    </h3>

                                    {registrationStep === 1 && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-gray-400 font-mono text-xs mb-1">SQUAD_CODENAME (Team Name)</label>
                                                <input
                                                    type="text"
                                                    value={formData.teamName}
                                                    onChange={e => setFormData({ ...formData, teamName: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-purple-500 outline-none"
                                                    placeholder="e.g. The Null Pointers"
                                                />
                                            </div>

                                            <div className="flex justify-between">
                                                {isEditing ? (
                                                    <button
                                                        onClick={() => setIsEditing(false)}
                                                        className="text-gray-500 hover:text-white font-mono text-xs"
                                                    >
                                                        CANCEL_EDIT
                                                    </button>
                                                ) : <div></div>}
                                                <button
                                                    onClick={() => setRegistrationStep(2)}
                                                    disabled={!formData.teamName}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-mono text-sm disabled:opacity-50"
                                                >
                                                    NEXT_STEP: MEMBERS
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {registrationStep === 2 && (
                                        <div className="space-y-8">
                                            {formData.members.map((member, index) => (
                                                <div key={index} className="p-6 bg-white/5 border border-white/10 relative group">
                                                    <div className="absolute top-0 left-0 bg-purple-500 text-black text-[10px] font-bold px-2 py-0.5 font-mono">
                                                        OPERATIVE_0{index + 1}
                                                    </div>
                                                    {index > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveMember(index)}
                                                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}

                                                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Full Name"
                                                            value={member.name}
                                                            onChange={e => updateMember(index, "name", e.target.value)}
                                                            className="w-full bg-black/20 border border-white/10 p-2 text-sm text-white focus:border-purple-500 outline-none"
                                                        />
                                                        <input
                                                            type="email"
                                                            placeholder="Email Address"
                                                            value={member.email}
                                                            onChange={e => updateMember(index, "email", e.target.value)}
                                                            className="w-full bg-black/20 border border-white/10 p-2 text-sm text-white focus:border-purple-500 outline-none"
                                                        />
                                                        <input
                                                            type="tel"
                                                            placeholder="Phone Number"
                                                            value={member.phone}
                                                            onChange={e => updateMember(index, "phone", e.target.value)}
                                                            className="w-full bg-black/20 border border-white/10 p-2 text-sm text-white focus:border-purple-500 outline-none"
                                                        />
                                                        <select
                                                            value={member.type}
                                                            onChange={e => updateMember(index, "type", e.target.value)}
                                                            className="w-full bg-black/20 border border-white/10 p-2 text-sm text-white focus:border-purple-500 outline-none"
                                                        >
                                                            <option value="STUDENT">Student</option>
                                                            <option value="PROFESSIONAL">Working Professional</option>
                                                        </select>
                                                    </div>

                                                    <div className="mt-4 pt-4 border-t border-white/5 grid md:grid-cols-3 gap-4">
                                                        {member.type === "STUDENT" ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    placeholder="College Name"
                                                                    value={member.details.college}
                                                                    onChange={e => updateMemberDetail(index, "college", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Course/Degree"
                                                                    value={member.details.course}
                                                                    onChange={e => updateMemberDetail(index, "course", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="current Year"
                                                                    value={member.details.year}
                                                                    onChange={e => updateMemberDetail(index, "year", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Company Name"
                                                                    value={member.details.company}
                                                                    onChange={e => updateMemberDetail(index, "company", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Role/Designation"
                                                                    value={member.details.role}
                                                                    onChange={e => updateMemberDetail(index, "role", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Years of Exp"
                                                                    value={member.details.experience}
                                                                    onChange={e => updateMemberDetail(index, "experience", e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 p-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {formData.members.length < 4 && (
                                                <button
                                                    onClick={handleAddMember}
                                                    className="w-full py-3 border border-dashed border-white/20 text-gray-500 font-mono text-xs hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={16} /> ADD_OPERATIVE
                                                </button>
                                            )}

                                            <div className="flex justify-between pt-6 border-t border-white/10">
                                                <button
                                                    onClick={() => setRegistrationStep(1)}
                                                    className="text-gray-500 hover:text-white font-mono text-xs"
                                                >
                                                    BACK
                                                </button>
                                                <button
                                                    onClick={handleSubmitRegistration}
                                                    disabled={isSubmitting}
                                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
                                                >
                                                    {isSubmitting ? "ENCRYPTING_DATA..." : isEditing ? "UPDATE_RECORDS" : "CONFIRM_REGISTRATION"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Icons needed that might not be imported yet

