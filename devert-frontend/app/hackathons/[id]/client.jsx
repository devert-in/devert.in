"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Clock, Calendar, Users, Shield, Zap, CheckCircle, Upload, X } from "lucide-react";
import Link from "next/link";

export default function HackathonDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    // Registration Form State
    const [regForm, setRegForm] = useState({
        teamName: "",
        leaderName: user?.displayName || "",
        leaderEmail: user?.email || "",
        phone: "",
        linkedin: "",
        type: "student", // student | professional

        // Student Fields
        course: "",
        college: "",
        gradYear: "",

        // Professional Fields
        company: "",
        jobRole: "",
        experience: "",

        members: ["", ""] // Start with 2 slots minimum
    });
    const [submitting, setSubmitting] = useState(false);
    const [dialog, setDialog] = useState({ show: false, message: "", type: "info" });

    useEffect(() => {
        if (user) {
            setRegForm(prev => ({
                ...prev,
                leaderName: user.displayName || prev.leaderName,
                leaderEmail: user.email || prev.leaderEmail
            }));
        }
    }, [user]);

    useEffect(() => {
        const fetchHackathon = async () => {
            try {
                const docRef = doc(db, "hackathons", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setHackathon({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such hackathon!");
                }
            } catch (error) {
                console.error("Error getting document:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHackathon();
    }, [id]);

    const handleRegister = async (e) => {
        e.preventDefault();

        // Basic Validation
        const validMembers = regForm.members.filter(m => m.trim().includes('@'));
        if (validMembers.length + 1 < 2) { // Leader + members
            setDialog({ show: true, message: "MINIMUM_SQUAD_SIZE: 2 OPERATIVES", type: "error" });
            return;
        }

        setSubmitting(true);
        try {
            // 1. Register Team in 'teams' collection (for Squadron visibility)
            const teamSize = validMembers.length + 1;
            const needsMembers = teamSize < 4;

            const registrationData = {
                name: regForm.teamName,
                role: `Squad Leader`, // For the card context
                stack: ["Hackathon Team", hackathon.title],
                level: "Recruiting",
                status: needsMembers ? "ONLINE" : "FULL",
                lookingFor: needsMembers ? `Looking for ${4 - teamSize} operative(s) for ${hackathon.title}.` : "Squad deployed.",
                matchRate: 99,
                createdAt: serverTimestamp(),
                userId: user.uid,
                hackathonId: id, // Link to hackathon
                members: [regForm.leaderEmail, ...validMembers],

                // Detailed Info
                leaderPhone: regForm.phone,
                leaderLinkedin: regForm.linkedin,
                leaderType: regForm.type,
                ...(regForm.type === 'student' ? {
                    leaderCourse: regForm.course,
                    leaderCollege: regForm.college,
                    leaderGradYear: regForm.gradYear
                } : {
                    leaderCompany: regForm.company,
                    leaderRole: regForm.jobRole,
                    leaderExperience: regForm.experience
                })
            };

            await addDoc(collection(db, "squadron"), registrationData);

            // 2. Update Hackathon Participants (just tracking count/emails roughly for now in this doc, or separate collection)
            const hackRef = doc(db, "hackathons", id);
            await updateDoc(hackRef, {
                participants: arrayUnion(regForm.leaderEmail, ...validMembers) // Simple tracking
            });

            setDialog({ show: true, message: "REGISTRATION_COMPLETE. SQUAD_DEPLOYED.", type: "success" });
            setIsRegisterOpen(false);

        } catch (error) {
            console.error(error);
            setDialog({ show: true, message: "REGISTRATION_FAILED: " + error.message, type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const addMemberSlot = () => {
        if (regForm.members.length < 3) { // Max 4 total (1 leader + 3 members)
            setRegForm(prev => ({ ...prev, members: [...prev.members, ""] }));
        }
    };

    const updateMember = (index, value) => {
        const newMembers = [...regForm.members];
        newMembers[index] = value;
        setRegForm(prev => ({ ...prev, members: newMembers }));
    };

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neon-cyan font-mono animate-pulse">DECRYPTING_MISSION_FILES...</div>;

    if (!hackathon) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500 font-mono">MISSION_NOT_FOUND_404</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8 relative">
            {/* Dialog Modal */}
            {dialog.show && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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

            <div className="max-w-5xl mx-auto">
                <Link href="/hackathons" className="text-gray-500 hover:text-white flex items-center transition-colors w-fit font-mono text-xs mb-8 group">
                    <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={16} /> BACK TO HACKATHONS
                </Link>

                {/* Hero Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-xs font-mono border rounded ${hackathon.status === 'OPEN' ? 'border-neon-green text-neon-green' : 'border-neon-cyan text-neon-cyan'}`}>
                            {hackathon.status}
                        </span>
                        <span className="text-gray-500 text-xs font-mono flex items-center gap-1">
                            <Users size={12} /> TEAM: 2-4
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold font-sans mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        {hackathon.title}
                    </h1>
                    <p className="text-xl text-gray-300 font-mono leading-relaxed border-l-4 border-neon-cyan pl-6 max-w-3xl">
                        {hackathon.description}
                    </p>
                </div>

                {/* Grid Info */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 border border-white/10">
                            <h3 className="text-gray-500 font-mono text-xs mb-2 flex items-center"><Clock size={14} className="mr-2" /> TIMELINE</h3>
                            <Timeline steps={[
                                { title: "Phase 1: Registration", date: "Now Open", status: "active" },
                                { title: "Phase 2: Idea Submission", date: "TBA", status: "upcoming" },
                                { title: "Phase 3: Prototype Dev", date: "TBA", status: "upcoming" },
                                { title: "Grand Finale (Online)", date: "Date to be Announced", status: "upcoming" }
                            ]} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 border border-white/10 h-full flex flex-col justify-center items-center text-center">
                            <div className="mb-4">
                                <Zap size={48} className="text-neon-cyan mx-auto mb-2" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Ready to Deploy?</h3>
                            <p className="text-gray-400 text-sm mb-6">Gather your squad. Build the future.</p>
                            <button
                                onClick={() => {
                                    if (hackathon.status === 'UPCOMING') return;

                                    // External Registration Logic
                                    if (hackathon.registrationUrl && !['Devert Cup', 'Devert Innovation Challenge'].includes(hackathon.title)) {
                                        window.open(hackathon.registrationUrl, '_blank');
                                    } else {
                                        setIsRegisterOpen(true);
                                    }
                                }}
                                disabled={hackathon.status === 'UPCOMING'}
                                className={`w-full font-bold font-mono py-4 transition-all ${hackathon.status === 'UPCOMING'
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                    : 'bg-neon-green text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]'
                                    }`}
                            >
                                {hackathon.status === 'UPCOMING' ? 'REGISTRATION CLOSED // COMING SOON' : 'REGISTER NOW'}
                            </button>
                            <p className="mt-4 text-xs text-gray-500 font-mono">MODE: ONLINE // GLOBAL</p>
                        </div>
                    </div>
                </div>

                {/* Registration Modal */}
                <AnimatePresence>
                    {isRegisterOpen && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
                            <div className="min-h-full flex items-center justify-center w-full py-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-[#0a0a0a] border border-white/20 p-8 w-full max-w-2xl relative shadow-2xl"
                                >
                                    <button
                                        onClick={() => setIsRegisterOpen(false)}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-white"
                                    >
                                        <X size={24} />
                                    </button>

                                    <h2 className="text-2xl font-bold font-sans text-white mb-6 border-b border-white/10 pb-4">
                                        SQUAD_REGISTRATION_FORM
                                    </h2>

                                    <form onSubmit={handleRegister} className="space-y-6">
                                        {/* Basic Team Info */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">TEAM_NAME</label>
                                                <input
                                                    required
                                                    value={regForm.teamName}
                                                    onChange={e => setRegForm({ ...regForm, teamName: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none transition-colors"
                                                    placeholder="e.g. Code_Breakers"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">PHONE_NUMBER</label>
                                                <input
                                                    required
                                                    value={regForm.phone}
                                                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none transition-colors"
                                                    placeholder="+91..."
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">LINKEDIN_PROFILE</label>
                                                <input
                                                    required
                                                    value={regForm.linkedin}
                                                    onChange={e => setRegForm({ ...regForm, linkedin: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none transition-colors"
                                                    placeholder="linkedin.com/in/..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">PROFESSION_TYPE</label>
                                                <div className="grid grid-cols-2 gap-2 h-[48px]"> {/* Fixed height to match inputs */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setRegForm({ ...regForm, type: "student" })}
                                                        className={`border font-mono text-xs uppercase transition-colors ${regForm.type === 'student' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                                                    >
                                                        STUDENT
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRegForm({ ...regForm, type: "professional" })}
                                                        className={`border font-mono text-xs uppercase transition-colors ${regForm.type === 'professional' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                                                    >
                                                        PROFESSIONAL
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conditional Fields */}
                                        <AnimatePresence mode="wait">
                                            {regForm.type === 'student' ? (
                                                <motion.div
                                                    key="student-fields"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="grid md:grid-cols-3 gap-6 overflow-hidden"
                                                >
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">COURSE_TYPE</label>
                                                        <select
                                                            required
                                                            value={regForm.course}
                                                            onChange={e => setRegForm({ ...regForm, course: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none appearance-none"
                                                        >
                                                            <option value="" className="bg-black text-gray-500">Select Course</option>
                                                            <option value="B.Tech" className="bg-black">B.Tech</option>
                                                            <option value="B.E." className="bg-black">B.E.</option>
                                                            <option value="B.Sc" className="bg-black">B.Sc</option>
                                                            <option value="Degree" className="bg-black">Degree</option>
                                                            <option value="M.Tech" className="bg-black">M.Tech</option>
                                                            <option value="Other" className="bg-black">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">COLLEGE_NAME</label>
                                                        <input
                                                            required
                                                            value={regForm.college}
                                                            onChange={e => setRegForm({ ...regForm, college: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none"
                                                            placeholder="University Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">YEAR</label>
                                                        <input
                                                            required
                                                            value={regForm.gradYear}
                                                            onChange={e => setRegForm({ ...regForm, gradYear: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none"
                                                            placeholder="e.g. 3rd Year"
                                                        />
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="prof-fields"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="grid md:grid-cols-3 gap-6 overflow-hidden"
                                                >
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">COMPANY</label>
                                                        <input
                                                            required
                                                            value={regForm.company}
                                                            onChange={e => setRegForm({ ...regForm, company: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none"
                                                            placeholder="Company Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">ROLE</label>
                                                        <input
                                                            required
                                                            value={regForm.jobRole}
                                                            onChange={e => setRegForm({ ...regForm, jobRole: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none"
                                                            placeholder="Job Title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-mono text-gray-400 mb-2">EXPERIENCE</label>
                                                        <input
                                                            required
                                                            value={regForm.experience}
                                                            onChange={e => setRegForm({ ...regForm, experience: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-neon-cyan outline-none rounded-none"
                                                            placeholder="e.g. 2 Years"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Squad Roster */}
                                        <div className="border-t border-white/10 pt-6">
                                            <h3 className="text-sm font-bold text-neon-green mb-4 font-mono tracking-wider">SQUAD_ROSTER</h3>

                                            <div className="space-y-3">
                                                {/* Leader (Fixed) */}
                                                <div className="flex flex-col md:flex-row gap-3">
                                                    <div className="w-full md:w-1/3 bg-white/5 border border-white/10 p-3 text-gray-500 text-xs font-mono flex items-center">
                                                        {regForm.leaderName} <span className="ml-2 text-neon-green/50">(YOU)</span>
                                                    </div>
                                                    <div className="flex-1 bg-white/5 border border-white/10 p-3 text-gray-500 text-xs font-mono flex items-center justify-between">
                                                        {regForm.leaderEmail}
                                                        <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-0.5 border border-neon-green/30">LEADER</span>
                                                    </div>
                                                </div>

                                                {/* Members */}
                                                {regForm.members.map((member, idx) => (
                                                    <div key={idx} className="flex flex-col md:flex-row gap-3">
                                                        <div className="w-full md:w-1/3 bg-white/5 border border-white/10 p-3 text-gray-500 text-xs font-mono flex items-center justify-center bg-stripes-white opacity-50">
                                                            OPERATIVE_{idx + 2}
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={member}
                                                            onChange={(e) => updateMember(idx, e.target.value)}
                                                            placeholder="Enter Operative Email ID"
                                                            className="flex-1 bg-white/5 border border-white/10 p-3 text-white text-xs font-mono focus:border-neon-cyan outline-none rounded-none placeholder:text-gray-700 hover:bg-white/[0.07] transition-colors"
                                                            required={idx === 0} // Second member required for min 2
                                                        />
                                                    </div>
                                                ))}

                                                {regForm.members.length < 3 && (
                                                    <button type="button" onClick={addMemberSlot} className="text-xs text-neon-cyan hover:text-white font-mono mt-2 flex items-center gap-1 transition-colors">
                                                        + ADD_OPERATIVE_SLOT
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-neon-green text-black font-bold font-mono py-4 hover:shadow-[0_0_20px_rgba(0,255,0,0.4)] disabled:opacity-50 disabled:shadow-none mt-6 transition-all border border-neon-green"
                                        >
                                            {submitting ? "PROCESSING_DEPLOYMENT..." : "CONFIRM_DEPLOYMENT"}
                                        </button>
                                    </form>
                                </motion.div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

function Timeline({ steps }) {
    return (
        <div className="relative border-l-2 border-white/10 ml-3 space-y-8 py-2">
            {steps.map((step, i) => (
                <div key={i} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${step.status === 'active' ? 'bg-neon-cyan border-neon-cyan shadow-[0_0_10px_#00ffff]' : 'bg-[#050505] border-gray-600'}`}></div>
                    <h4 className={`text-sm font-bold ${step.status === 'active' ? 'text-white' : 'text-gray-500'}`}>{step.title}</h4>
                    <p className="text-xs font-mono text-gray-600 mt-1">{step.date}</p>
                </div>
            ))}
        </div>
    );
}
