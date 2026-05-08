"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, FileSearch, Mic, LayoutList, Check, Calculator, Database, ShieldAlert, BadgeDollarSign, Swords, Server, BookOpen, Terminal, ChevronRight, BrainCircuit, Cpu, Building2, Factory } from "lucide-react";
import { StackMarquee } from "@/components/stack-marquee";
import { useState } from "react";
import Link from "next/link";

export default function PlacementsPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const [activeTab, setActiveTab] = useState("tracks");

    const tabs = [
        { id: "tracks", name: "DeVert Tracks", icon: <LayoutList size={16} /> },
        { id: "company-prep", name: "Company Prep", icon: <Building2 size={16} /> },
        { id: "ai-simulator", name: "AI Simulator", icon: <BrainCircuit size={16} /> },
        { id: "oa", name: "OA Strategies", icon: <Calculator size={16} /> },
        { id: "system-design", name: "System Design", icon: <Database size={16} /> },
        { id: "negotiation", name: "Negotiation", icon: <BadgeDollarSign size={16} /> },
    ];

    return (
        <main className="min-h-screen pt-24 pb-20 relative bg-[#060A14] text-white font-sans sm:px-4">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)] fixed pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none -z-10 fixed mix-blend-screen"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full mb-12">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(225,29,72,0.15)]">
                        <Briefcase size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
                        Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">Placements.</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed">
                        We don't do basic aptitude test training. DeVert provides aggressive AI interviewing, company-specific roadmaps, and system design deep-dives to crack Tier-1 companies.
                    </p>
                </motion.div>
            </div>

            {/* INTERNAL STICKY NAVBAR */}
            <div className="sticky top-20 z-50 py-4 backdrop-blur-xl bg-[#060A14]/80 border-y border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-12 w-full">
                <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
                                    activeTab === tab.id 
                                    ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]" 
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {tab.icon} {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DYNAMIC CONTENT AREA */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full min-h-[500px]">
                <AnimatePresence mode="wait">
                    
                    {/* -- TRACKS -- */}
                    {activeTab === "tracks" && (
                        <motion.div
                            key="roadmaps"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12 overflow-hidden relative"
                        >
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><LayoutList size={24}/></div>
                                <span>DeVert Tracks</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-black/40 border border-white/5 p-8 rounded-[2xl] hover:border-rose-500/30 transition-all group">
                                    <h3 className="text-2xl font-bold text-rose-400 mb-4 flex items-center gap-3"><Server size={24}/> Java Backend Engineer</h3>
                                    <ul className="space-y-3 text-sm text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={16} className="text-rose-500"/> Core Java & Multithreading deep-dive</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-rose-500"/> Spring Boot & Microservices architecture</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-rose-500"/> Hibernate & PostgreSQL querying</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-rose-500"/> Kafka event-driven programming</li>
                                    </ul>
                                </div>
                                
                                <div className="bg-black/40 border border-white/5 p-8 rounded-[2xl] hover:border-yellow-500/30 transition-all group">
                                    <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-3"><Terminal size={24}/> Python Developer</h3>
                                    <ul className="space-y-3 text-sm text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={16} className="text-yellow-500"/> Advanced Python concepts (Generators, Decorators)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-yellow-500"/> Django & FastAPI backend systems</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-yellow-500"/> Web Scraping (BeautifulSoup, Selenium)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-yellow-500"/> NumPy/Pandas data processing pipelines</li>
                                    </ul>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-8 rounded-[2xl] hover:border-cyan-500/30 transition-all group">
                                    <h3 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3"><Cpu size={24}/> AI Engineer</h3>
                                    <ul className="space-y-3 text-sm text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500"/> LangChain & LlamaIndex for RAG</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500"/> Vector Databases (Pinecone, FAISS)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500"/> Fine-tuning LLMs (HuggingFace, LoRA)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-cyan-500"/> Deploying models via FastAPI</li>
                                    </ul>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-8 rounded-[2xl] hover:border-purple-500/30 transition-all group">
                                    <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3"><BrainCircuit size={24}/> ML Engineer</h3>
                                    <ul className="space-y-3 text-sm text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500"/> Core Math (Linear Algebra, Probability)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500"/> Supervised & Unsupervised Learning (Scikit-Learn)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500"/> Deep Learning (PyTorch, TensorFlow)</li>
                                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500"/> MLOps (Model tracking, Docker, AWS SageMaker)</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* -- COMPANY PREP -- */}
                    {activeTab === "company-prep" && (
                        <motion.div
                            key="company-prep"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12"
                        >
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><Building2 size={24}/></div>
                                <span>Company-Wise Classification Prep</span>
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                <div className="p-8 border border-emerald-500/30 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_70%)] rounded-3xl">
                                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Factory size={24} className="text-emerald-400"/> Product-Based Companies
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                        Google, Amazon, Microsoft, Uber, Atlassian. These companies require severe algorithmic efficiency and deep architecture knowledge.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                            <span className="text-emerald-400 font-bold text-sm block mb-1">Focus Areas:</span>
                                            <span className="text-xs text-gray-400">Hard DSA (Graphs/DP), Low Level Design, High Level Design, Core OS/DBMS details.</span>
                                        </div>
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                            <span className="text-emerald-400 font-bold text-sm block mb-1">Target Strategy:</span>
                                            <span className="text-xs text-gray-400">Build 2 massive end-to-end deployed projects. Master 250+ LeetCode mediums.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border border-blue-500/30 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_70%)] rounded-3xl">
                                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Building2 size={24} className="text-blue-400"/> Service-Based Companies
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                        TCS, Infosys, Wipro, Cognizant, Accenture. These companies heavily test your foundational aptitude, speed, and communication skills.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                            <span className="text-blue-400 font-bold text-sm block mb-1">Focus Areas:</span>
                                            <span className="text-xs text-gray-400">Quantitative Aptitude, Logical Reasoning, Easy/Medium DSA (Strings/Arrays).</span>
                                        </div>
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                            <span className="text-blue-400 font-bold text-sm block mb-1">Target Strategy:</span>
                                            <span className="text-xs text-gray-400">Clear pseudo-code rounds instantly. Practice rapid MCQ clearing. Practice HR communication.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* -- AI SIMULATOR (CRACK THE OFFER) -- */}
                    {activeTab === "ai-simulator" && (
                        <motion.div
                            key="ai-simulator"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4 }}
                            className="bg-[radial-gradient(ellipse_at_center,rgba(225,29,72,0.15),transparent_70%)] border border-rose-500/40 rounded-[2rem] p-8 md:p-16 text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(225,29,72,0.3)]">
                                <BrainCircuit size={48} />
                            </div>
                            <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">AI Mock Interviews</h2>
                            <p className="text-xl text-rose-200 mb-8 max-w-2xl mx-auto">
                                The ultimate AI Mock Interview Simulator. Practice live algorithmic cross-questioning with a relentlessly strict AI recruiter.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto text-left">
                                <div className="bg-black/40 p-6 rounded-2xl border border-rose-500/20">
                                    <Mic className="text-rose-400 mb-3" size={24}/>
                                    <h4 className="font-bold mb-2">Voice / Text Interactive</h4>
                                    <p className="text-xs text-gray-400">The AI speaks directly to you, simulating actual interview pressure and requiring real-time verbal answers.</p>
                                </div>
                                <div className="bg-black/40 p-6 rounded-2xl border border-rose-500/20">
                                    <Code className="text-rose-400 mb-3" size={24}/>
                                    <h4 className="font-bold mb-2">Live Code Execution</h4>
                                    <p className="text-xs text-gray-400">Write your logic directly in the dashboard while the AI evaluates your time and space complexity instantly.</p>
                                </div>
                                <div className="bg-black/40 p-6 rounded-2xl border border-rose-500/20">
                                    <FileSearch className="text-rose-400 mb-3" size={24}/>
                                    <h4 className="font-bold mb-2">Deep History Post-Mortem</h4>
                                    <p className="text-xs text-gray-400">After the interview, the AI generates a brutal tear-down of your performance, showing exactly where you failed.</p>
                                </div>
                            </div>

                            <Link href="/simulator" className="inline-flex items-center gap-3 px-12 py-5 bg-rose-600 text-white font-black tracking-widest uppercase text-sm rounded-full shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:bg-rose-500 hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] transition-all">
                                Launch Simulator <Swords size={20} />
                            </Link>
                        </motion.div>
                    )}

                    {/* -- OA STRATEGIES -- */}
                    {activeTab === "oa" && (
                        <motion.div
                            key="oa"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12"
                        >
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><Calculator size={24}/></div>
                                <span>Online Assessment (OA) Domination</span>
                            </h2>
                            <p className="text-gray-400 text-lg mb-10 max-w-3xl leading-relaxed">
                                You cannot reach the interview if you fail the initial screening. We drill speed mechanics and hidden edge-case recognition explicitly tailored for HackerRank, Codility, and typical corporate portals.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-black/50 p-6 rounded-2xl border border-white/10 hover:border-rose-500/30 transition-colors">
                                    <Terminal className="text-rose-400 mb-4" size={24} />
                                    <h3 className="font-bold text-lg mb-2">Speed Execution</h3>
                                    <p className="text-sm text-gray-400">Target goal: Solve the initial easy/medium array or string parser question in under 12 minutes to save time for DP/Graphs.</p>
                                </div>
                                <div className="bg-black/50 p-6 rounded-2xl border border-white/10 hover:border-rose-500/30 transition-colors">
                                    <ShieldAlert className="text-rose-400 mb-4" size={24} />
                                    <h3 className="font-bold text-lg mb-2">Edge-Case Immunity</h3>
                                    <p className="text-sm text-gray-400">Hidden test cases failing? We teach strict boundary testing (null inputs, max limits, negative overflow) before submitting.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* -- SYSTEM DESIGN -- */}
                    {activeTab === "system-design" && (
                        <motion.div
                            key="system-design"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12"
                        >
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><Database size={24}/></div>
                                <span>System Design</span>
                            </h2>
                            <p className="text-gray-400 mb-6">Learn scaling, CDNs, load balancers, caching, sharding, and LLD patterns.</p>
                        </motion.div>
                    )}

                    {/* -- NEGOTIATION -- */}
                    {activeTab === "negotiation" && (
                        <motion.div
                            key="negotiation"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden"
                        >
                            <div className="relative z-10 w-full md:w-2/3">
                                <h2 className="text-3xl font-bold mb-6 flex items-center gap-4">
                                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><BadgeDollarSign size={24}/></div>
                                    <span>Offer Negotiation</span>
                                </h2>
                                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                    Never blindly accept the first offer. You are leaving money on the table.
                                </p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <div className="mt-20 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
