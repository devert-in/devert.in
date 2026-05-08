"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Server, CheckCircle, Circle, ChevronRight, Briefcase, Play, Link as LinkIcon, Database, Terminal, ShieldAlert, Cpu, Box, Cloud, Rocket, Code, LayoutList, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { StackMarquee } from "@/components/stack-marquee";

export default function JavaBackendTrack() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const javaBasicsContent = (
        <div className="space-y-8 pb-4 mt-6 border-t border-white/5 pt-6 text-left">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">Why This Topic Matters</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-300 text-xs leading-relaxed">
                    <li>Every backend system starts with Java basics — this is where it all begins</li>
                    <li>You can't write APIs, services, or business logic without mastering the fundamentals</li>
                    <li>Used in every Java framework including Spring Boot and Hibernate</li>
                    <li>Forms the base for learning every advanced backend concept</li>
                    <li>Required in every Java interview — freshers to experienced</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-200 mb-3 flex items-center gap-2"><Briefcase size={16} className="text-gray-400"/> Where It Is Used in Real Projects</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-400 text-xs bg-white/5 p-5 rounded-xl border border-white/10">
                    <li>Validating incoming request data inside REST APIs</li>
                    <li>Processing and transforming order data in e-commerce backends</li>
                    <li>Iterating through database results to build API responses</li>
                    <li>Implementing conditional business rules in payment services</li>
                    <li>Parsing uploaded files and processing data in batch jobs</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-200 mb-3">Key Concepts to Learn</h4>
                <div className="flex flex-wrap gap-2">
                    {["Primitive & reference data types", "Variables and constants", "Type casting and conversion", "Arrays and multi-dimensional arrays", "For, while, do-while loops", "If-else and switch statements", "Methods and method overloading", "String and StringBuilder"].map(concept => (
                        <span key={concept} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-300 font-medium">{concept}</span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Play size={16} className="text-rose-500"/> Best YouTube Videos</h4>
                    <ul className="space-y-3">
                        <li>
                            <a href="https://www.youtube.com/watch?v=BGTx91t8q50" target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group/link">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-yellow-400 mb-1 group-hover/link:text-yellow-300">Java Tutorial for Beginners</div>
                                        <div className="text-[11px] text-gray-500">Telusko</div>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-600 group-hover/link:text-yellow-400"/>
                                </div>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.youtube.com/watch?v=rZ41y93P2Qo" target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group/link">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-yellow-400 mb-1 group-hover/link:text-yellow-300">Java Programming — Complete Basics</div>
                                        <div className="text-[11px] text-gray-500">Kunal Kushwaha</div>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-600 group-hover/link:text-yellow-400"/>
                                </div>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.youtube.com/watch?v=eIrMbAQSU34" target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group/link">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-yellow-400 mb-1 group-hover/link:text-yellow-300">Java Basics in One Video</div>
                                        <div className="text-[11px] text-gray-500">Java Brains</div>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-600 group-hover/link:text-yellow-400"/>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-emerald-500"/> Best Free Websites</h4>
                    <ul className="space-y-3">
                        <li>
                            <a href="https://docs.oracle.com/javase/tutorial/" target="_blank" rel="noreferrer" className="group/link block">
                                <div className="text-sm text-emerald-400 group-hover/link:text-emerald-300 font-bold mb-0.5 flex items-center gap-1">Oracle Java Tutorials <ExternalLink size={10}/></div>
                                <div className="text-[11px] text-gray-500">Official Java documentation</div>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.baeldung.com/java-tutorial" target="_blank" rel="noreferrer" className="group/link block">
                                <div className="text-sm text-emerald-400 group-hover/link:text-emerald-300 font-bold mb-0.5 flex items-center gap-1">Baeldung — Java Basics <ExternalLink size={10}/></div>
                                <div className="text-[11px] text-gray-500">Well-structured tutorials with real examples</div>
                            </a>
                        </li>
                        <li>
                            <a href="https://www.w3schools.com/java/" target="_blank" rel="noreferrer" className="group/link block">
                                <div className="text-sm text-emerald-400 group-hover/link:text-emerald-300 font-bold mb-0.5 flex items-center gap-1">W3Schools Java <ExternalLink size={10}/></div>
                                <div className="text-[11px] text-gray-500">Interactive tutorials</div>
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Code size={16} className="text-purple-500"/> Practice Platforms</h4>
                    <div className="flex flex-col gap-3">
                        <a href="https://www.hackerrank.com/domains/java" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group/link">
                            <div>
                                <div className="text-sm font-bold text-purple-400">HackerRank</div>
                                <div className="text-[11px] text-gray-400">Beginner-friendly challenges</div>
                            </div>
                            <div className="bg-purple-500/20 p-2 rounded-lg group-hover/link:bg-purple-500 group-hover/link:text-white transition-colors text-purple-400 flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase hidden md:block">Practice Now</span> <ChevronRight size={14}/>
                            </div>
                        </a>
                        <a href="https://exercism.org/tracks/java" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group/link">
                            <div>
                                <div className="text-sm font-bold text-purple-400">Exercism</div>
                                <div className="text-[11px] text-gray-400">Mentored exercises</div>
                            </div>
                            <div className="bg-purple-500/20 p-2 rounded-lg group-hover/link:bg-purple-500 group-hover/link:text-white transition-colors text-purple-400 flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase hidden md:block">Practice Now</span> <ChevronRight size={14}/>
                            </div>
                        </a>
                        <a href="https://www.codewars.com/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors group/link">
                            <div>
                                <div className="text-sm font-bold text-purple-400">CodeWars</div>
                                <div className="text-[11px] text-gray-400">Kata challenges</div>
                            </div>
                            <div className="bg-purple-500/20 p-2 rounded-lg group-hover/link:bg-purple-500 group-hover/link:text-white transition-colors text-purple-400 flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase hidden md:block">Practice Now</span> <ChevronRight size={14}/>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );

    const phases = [
        { title: "Java Basics", icon: <Code size={20} />, color: "text-yellow-500", tags: ["syntax", "variables", "arrays", "loops", "conditionals"], content: javaBasicsContent },
        { title: "Object Oriented Programming", icon: <Box size={20} />, color: "text-purple-400", tags: ["classes", "objects", "access specifiers", "static", "packages"] },
        { title: "Advanced Java", icon: <Cpu size={20} />, color: "text-rose-400", tags: ["inheritance", "abstraction", "interfaces", "enums", "records"] },
        { title: "Exception Handling", icon: <ShieldAlert size={20} />, color: "text-orange-400", tags: ["exceptions", "lambdas", "annotations", "optionals"] },
        { title: "Collections Framework", icon: <Database size={20} />, color: "text-emerald-400", tags: ["ArrayList", "Set", "Map", "Queue", "Stack"] },
        { title: "Concurrency & Multithreading", icon: <Server size={20} />, color: "text-cyan-400", tags: ["threads", "volatile", "virtual threads", "memory model"] },
        { title: "Functional Programming", icon: <Terminal size={20} />, color: "text-indigo-400", tags: ["Stream API", "functional interfaces", "composition"] },
        { title: "Build Tools", icon: <Box size={20} />, color: "text-teal-400", tags: ["Maven", "Gradle", "Bazel"] },
        { title: "Spring Boot & Web Frameworks", icon: <Rocket size={20} />, color: "text-green-400", tags: ["Spring Boot", "Quarkus", "REST APIs"] },
        { title: "Database Access", icon: <Database size={20} />, color: "text-blue-400", tags: ["JDBC", "Hibernate", "Spring Data JPA"] },
        { title: "File & IO", icon: <Box size={20} />, color: "text-purple-400", tags: ["input/output", "file operations"] },
        { title: "Logging", icon: <Terminal size={20} />, color: "text-rose-400", tags: ["Logback", "Log4j2", "SLF4J"] },
        { title: "Testing", icon: <CheckCircle size={20} />, color: "text-emerald-400", tags: ["JUnit", "Mockito", "REST Assured", "Cucumber"] },
        { title: "System Design", icon: <Server size={20} />, color: "text-cyan-400", tags: ["System Design Basics", "API Design", "Scalability", "Caching", "Load Balancing", "Microservices"] },
        { title: "Cloud & Deployment", icon: <Cloud size={20} />, color: "text-orange-400", tags: ["Docker", "CI/CD", "AWS Basics", "Kubernetes", "Monitoring", "Deployment"] },
        { title: "Real-World Projects", icon: <Rocket size={20} />, color: "text-rose-500", tags: ["E-Commerce Order API", "URL Shortener System", "Notification Service"] }
    ];

    // --- PROGRESS TRACKING LOGIC ---
    const [completedPhases, setCompletedPhases] = useState({});
    const [expandedPhases, setExpandedPhases] = useState({});

    useEffect(() => {
        const savedProgress = localStorage.getItem("devert_java_track_progress_v2");
        if (savedProgress) {
            setCompletedPhases(JSON.parse(savedProgress));
        }
    }, []);

    const togglePhaseComplete = (idx, e) => {
        if (e) e.stopPropagation();
        setCompletedPhases(prev => {
            const next = { ...prev, [idx]: !prev[idx] };
            localStorage.setItem("devert_java_track_progress_v2", JSON.stringify(next));
            return next;
        });
    };

    const toggleExpand = (idx) => {
        setExpandedPhases(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const totalPhases = phases.length;
    const completedCount = Object.values(completedPhases).filter(Boolean).length;
    const progressPercentage = totalPhases === 0 ? 0 : Math.round((completedCount / totalPhases) * 100);

    const getAccentClass = (phaseColor) => {
        const colorMap = {
            'text-yellow-500': 'border-yellow-500/30 bg-yellow-500/[0.02] shadow-[0_0_30px_rgba(234,179,8,0.05)]',
            'text-purple-400': 'border-purple-500/30 bg-purple-500/[0.02] shadow-[0_0_30px_rgba(168,85,247,0.05)]',
            'text-rose-400': 'border-rose-500/30 bg-rose-500/[0.02] shadow-[0_0_30px_rgba(244,63,94,0.05)]',
            'text-orange-400': 'border-orange-500/30 bg-orange-500/[0.02] shadow-[0_0_30px_rgba(249,115,22,0.05)]',
            'text-emerald-400': 'border-emerald-500/30 bg-emerald-500/[0.02] shadow-[0_0_30px_rgba(52,211,153,0.05)]',
            'text-cyan-400': 'border-cyan-500/30 bg-cyan-500/[0.02] shadow-[0_0_30px_rgba(34,211,238,0.05)]',
            'text-indigo-400': 'border-indigo-500/30 bg-indigo-500/[0.02] shadow-[0_0_30px_rgba(129,140,248,0.05)]',
            'text-teal-400': 'border-teal-500/30 bg-teal-500/[0.02] shadow-[0_0_30px_rgba(45,212,191,0.05)]',
            'text-green-400': 'border-green-500/30 bg-green-500/[0.02] shadow-[0_0_30px_rgba(74,222,128,0.05)]',
            'text-blue-400': 'border-blue-500/30 bg-blue-500/[0.02] shadow-[0_0_30px_rgba(96,165,250,0.05)]',
            'text-rose-500': 'border-rose-500/30 bg-rose-500/[0.02] shadow-[0_0_30px_rgba(244,63,94,0.05)]',
        };
        return colorMap[phaseColor] || 'border-white/20 bg-white/[0.02]';
    }

    return (
        <main className="min-h-screen pt-24 pb-20 relative bg-[#060A14] text-white font-sans sm:px-4">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)] fixed pointer-events-none"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none -z-10 fixed mix-blend-screen"></div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 w-full mb-16">
                
                {/* Back to Tracks */}
                <Link href="/tracks" className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition-colors mb-8 uppercase tracking-widest">
                    <ChevronRight className="rotate-180" size={14}/> Back to Tracks
                </Link>

                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="relative p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-rose-500/[0.05] via-white/[0.02] to-transparent border border-white/10 backdrop-blur-md mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.15),transparent_50%)] pointer-events-none"></div>
                    
                    <div className="flex-1 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md mb-6 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shadow-[0_0_10px_#f43f5e]"></span>
                            </span>
                            <span className="text-[10px] font-mono font-medium tracking-wide text-rose-400 uppercase">Track Initialized</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white leading-tight">
                            Java Backend <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]">Architect.</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-lg max-w-2xl leading-relaxed">
                            A comprehensive, step-by-step 16-component execution plan designed to take you from foundational basics to advanced system architecture, built for 2026 standards.
                        </p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col items-stretch gap-4 shrink-0 relative z-10 w-full md:w-auto">
                        <div className="flex-1 bg-white/[0.03] border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center shadow-lg group hover:border-rose-500/30 transition-colors">
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Box size={12} className="text-rose-400 group-hover:animate-spin-slow"/> Track Scope</div>
                            <div className="text-3xl font-black text-white">16 Phases</div>
                        </div>
                        <div className="flex-1 bg-white/[0.03] border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col justify-center shadow-lg group hover:border-orange-500/30 transition-colors">
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={12} className="text-orange-400"/> Duration</div>
                            <div className="text-3xl font-black text-white">8 Months</div>
                        </div>
                    </div>
                </motion.div>

                {/* PROGRESS BAR */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0f0f11] border border-white/10 p-6 rounded-3xl mb-16 backdrop-blur-sm relative overflow-hidden"
                >
                    {progressPercentage === 100 && (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.15),transparent_70%)] pointer-events-none"></div>
                    )}
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Track Progress {progressPercentage === 100 && <span className="text-green-400">| FULLY EXECUTED</span>}
                            </div>
                            <div className="text-3xl font-black text-white">{progressPercentage}%</div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                            <span className="text-white">{completedCount}</span> / {totalPhases} Components
                        </div>
                    </div>
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10 relative z-10">
                        <motion.div 
                            className={`h-full ${progressPercentage === 100 ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-gradient-to-r from-rose-500 to-orange-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </motion.div>

                {/* THE TRACK TIMELINE - MINDMAP / SCHEMATIC LAYOUT */}
                <div className="mb-24 relative max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold mb-16 flex items-center gap-3 justify-center md:justify-start">
                        <LayoutList className="text-rose-500" size={24}/> Ecosystem Blueprint
                    </h2>
                    
                    {/* Vertical central trunk */}
                    <div className="absolute top-24 bottom-12 left-6 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-white/10 z-0 overflow-hidden rounded-full">
                        <motion.div 
                            className="w-full h-48 bg-gradient-to-b from-transparent via-rose-500 to-transparent blur-[2px]"
                            animate={{ y: ["-200%", "3000%"] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                        />
                    </div>

                    <div className="space-y-6 md:space-y-12">
                        {phases.map((phase, idx) => {
                            const isCompleted = completedPhases[idx];
                            const isExpanded = expandedPhases[idx];
                            const accentClass = getAccentClass(phase.color);
                            const isLeft = idx % 2 === 0;

                            return (
                                <div key={idx} className={`relative flex w-full ${isLeft ? 'md:justify-start' : 'md:justify-end'}`}>
                                    
                                    {/* Central Dot */}
                                    <div className={`absolute left-6 md:left-1/2 -translate-x-1/2 top-[36px] w-3 h-3 md:w-4 md:h-4 rounded-full border-2 z-20 transition-all duration-500 ${isCompleted ? 'bg-green-500 border-green-400 shadow-[0_0_15px_#22c55e]' : 'bg-[#0a0a0a] border-white/30'}`}>
                                        {isCompleted && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40"></div>}
                                    </div>

                                    {/* Horizontal branch line (Desktop) */}
                                    <div className={`absolute top-[41px] md:top-[43px] h-[2px] bg-white/10 hidden md:block z-0 transition-colors duration-500 ${isCompleted ? 'bg-green-500/50' : ''} ${isLeft ? 'right-1/2 w-8' : 'left-1/2 w-8'}`}></div>

                                    {/* Horizontal branch line (Mobile) */}
                                    <div className={`absolute top-[41px] md:top-[43px] left-6 h-[2px] bg-white/10 md:hidden z-0 w-8 transition-colors duration-500 ${isCompleted ? 'bg-green-500/50' : ''}`}></div>

                                    {/* Card Container */}
                                    <div className="w-full pl-14 md:pl-0 md:w-[calc(50%-2rem)] relative z-10">
                                        <motion.div 
                                            initial={{ opacity: 0, x: isLeft ? -40 : 40, y: 20 }}
                                            whileInView={{ opacity: 1, x: 0, y: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            className={`bg-[#0a0a0a] border p-5 md:p-6 rounded-3xl hover:bg-white/[0.02] transition-all duration-500 cursor-pointer group 
                                                ${isCompleted ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.05)]' : isExpanded ? accentClass : 'border-white/10 hover:border-white/20'}`}
                                            onClick={() => toggleExpand(idx)}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                
                                                {/* Decorative Icon Box */}
                                                <div 
                                                    className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-lg ${isCompleted ? 'bg-green-500/5 border-green-500/20 text-green-400/50 shadow-green-500/10' : 'bg-[#0f0f11] border-white/10 text-gray-500 group-hover:border-white/20 group-hover:text-gray-400'}`}
                                                >
                                                    {phase.icon}
                                                </div>

                                                {/* Content Area */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className={`text-lg font-bold transition-colors ${isCompleted ? 'text-green-400 opacity-80' : phase.color}`}>{phase.title}</h3>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            {/* Explicit Checkbox / Button */}
                                                            <button 
                                                                onClick={(e) => togglePhaseComplete(idx, e)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-bold transition-all ${isCompleted ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                                                            >
                                                                {isCompleted ? <CheckCircle size={14} className="fill-green-500/20" /> : <Circle size={14} />}
                                                                <span className="hidden sm:inline">{isCompleted ? 'COMPLETED' : 'MARK DONE'}</span>
                                                            </button>

                                                            <ChevronRight size={18} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-white' : 'group-hover:translate-x-1'}`} />
                                                        </div>
                                                    </div>
                                            
                                            {/* Pills / Tags */}
                                            <div className="flex flex-wrap gap-2">
                                                {phase.tags.map((tag, tagIdx) => (
                                                    <motion.span 
                                                        key={tag} 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: tagIdx * 0.05 }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-300
                                                            ${isCompleted ? 'bg-green-500/5 border-green-500/10 text-green-200/50' : 'bg-white/5 border-white/10 text-gray-300 group-hover:bg-white/10 group-hover:text-white'}`}>
                                                        {tag}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Content Body */}
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            className="overflow-hidden"
                                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                                        >
                                            {phase.content ? phase.content : (
                                                <div className="mt-6 border-t border-white/5 pt-6 text-xs text-gray-500 italic text-center pb-2">
                                                    Mission Arsenal for {phase.title} is being deployed...
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                    </motion.div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>

                {/* ARSENAL (Learning Resources) */}
                <div>
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <Box className="text-cyan-500" size={24}/> Arsenal (Learning Resources)
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* YouTube */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-cyan-400"><Play size={18}/> YouTube Channels</h3>
                            <ul className="space-y-5">
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Telusko</div>
                                    <div className="text-xs text-gray-500">Java Full Course (12 Hrs), Spring Boot, Testing</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Java Brains</div>
                                    <div className="text-xs text-gray-500">Java Records, CompletableFuture, Microservices</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Concept & Coding</div>
                                    <div className="text-xs text-gray-500">HashMap internal working, Lambda deep dives, System Design</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Engineering Digest</div>
                                    <div className="text-xs text-gray-500">AWS for Backend and URL Shortener</div>
                                </li>
                            </ul>
                        </div>

                        {/* Websites */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-emerald-400"><LinkIcon size={18}/> Documentation</h3>
                            <ul className="space-y-5">
                                <li>
                                    <div className="font-bold text-sm text-white mb-1 flex justify-between items-center">
                                        Official Docs <ExternalLink size={12} className="text-gray-600"/>
                                    </div>
                                    <div className="text-xs text-gray-500">Oracle Java, Spring.io, Hibernate, Docker, AWS</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1 flex justify-between items-center">
                                        Baeldung <ExternalLink size={12} className="text-gray-600"/>
                                    </div>
                                    <div className="text-xs text-gray-500">Comprehensive, well-structured tutorials with real-world examples.</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1 flex justify-between items-center">
                                        TechRoadmaps <ExternalLink size={12} className="text-gray-600"/>
                                    </div>
                                    <div className="text-xs text-gray-500">Source of roadmap logic and progression.</div>
                                </li>
                            </ul>
                        </div>

                        {/* Practice */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-purple-400"><Code size={18}/> Practice Platforms</h3>
                            <ul className="space-y-5">
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">LeetCode</div>
                                    <div className="text-xs text-gray-500">Apply OOP to algorithms and solve concurrency/DB problems.</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">HackerRank</div>
                                    <div className="text-xs text-gray-500">Beginner-friendly Java challenges and specific OOP tasks.</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Exercism</div>
                                    <div className="text-xs text-gray-500">Mentored Java exercises and test-driven practice.</div>
                                </li>
                                <li>
                                    <div className="font-bold text-sm text-white mb-1">Spring Initializr</div>
                                    <div className="text-xs text-gray-500">Bootstrap your own Maven/Gradle Spring projects.</div>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

            </div>
            
            <div className="mt-20 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
