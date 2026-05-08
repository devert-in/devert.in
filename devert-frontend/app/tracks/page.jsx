"use client";

import { motion } from "framer-motion";
import { LayoutList, ArrowRight, Code, Database, Server, Cpu, ExternalLink, Clock, Shield, CheckCircle2, Smartphone, Cloud, Workflow, Brain, BarChart, CheckSquare, Palette, Target } from "lucide-react";
import Link from "next/link";
import { StackMarquee } from "@/components/stack-marquee";

export default function TracksPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const stagger = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const categories = [
        {
            title: "🚀 Development",
            id: "development",
            tracks: [
                {
                    id: "java-backend",
                    title: "Java Backend Developer",
                    description: "Master Core Java, Spring Boot, Microservices, and System Design to crack Tier-1 product companies.",
                    icon: <Server size={24} />,
                    color: "rose",
                    difficulty: "Intermediate",
                    duration: "8 Months",
                    format: "Project-Based",
                    recommendedFor: ["Problem solvers", "Backend lovers", "Product-company aspirants"],
                    status: "Available"
                },
                {
                    id: "nodejs-backend",
                    title: "Node.js Backend Developer",
                    description: "Build high-performance, scalable APIs using Node.js, Express, MongoDB, and Redis caching.",
                    icon: <Database size={24} />,
                    color: "green",
                    difficulty: "Intermediate",
                    duration: "6 Months",
                    format: "API-Focused",
                    recommendedFor: ["JavaScript devs", "Startup builders", "Performance optimizers"],
                    status: "Coming Soon"
                },
                {
                    id: "full-stack",
                    title: "Full Stack Developer",
                    description: "Dominate the modern web with React, Next.js, TypeScript, Tailwind, and Serverless databases.",
                    icon: <LayoutList size={24} />,
                    color: "purple",
                    difficulty: "Beginner to Pro",
                    duration: "8 Months",
                    format: "Ship Fast",
                    recommendedFor: ["UI/UX enthusiasts", "Startup builders", "Freelancers"],
                    status: "Coming Soon"
                },
                {
                    id: "mobile-app",
                    title: "Mobile App Developer",
                    description: "Build cross-platform applications with React Native, Flutter, and native Android (Kotlin).",
                    icon: <Smartphone size={24} />,
                    color: "cyan",
                    difficulty: "Intermediate",
                    duration: "6 Months",
                    format: "App Building",
                    recommendedFor: ["Creative minds", "Mobile enthusiasts", "Freelancers"],
                    status: "Coming Soon"
                }
            ]
        },
        {
            title: "☁️ Cloud & Infra",
            id: "cloud-infra",
            tracks: [
                {
                    id: "devops-engineer",
                    title: "DevOps Engineer",
                    description: "Deploy scalable infrastructure using Docker, Kubernetes, Terraform, and CI/CD pipelines.",
                    icon: <Code size={24} />,
                    color: "indigo",
                    difficulty: "Advanced",
                    duration: "5 Months",
                    format: "Hands-on Deployments",
                    recommendedFor: ["System admins", "Automation fanatics", "Platform engineers"],
                    status: "Coming Soon"
                },
                {
                    id: "cloud-engineer",
                    title: "Cloud Engineer",
                    description: "Deep dive into AWS/GCP, Serverless architectures, Cloud Security, and Distributed Systems.",
                    icon: <Cloud size={24} />,
                    color: "sky",
                    difficulty: "Intermediate",
                    duration: "6 Months",
                    format: "Architecture-Focused",
                    recommendedFor: ["Scalability thinkers", "Backend developers", "Tech architects"],
                    status: "Coming Soon"
                },
                {
                    id: "mlops-engineer",
                    title: "MLOps Engineer",
                    description: "Bridge AI and DevOps. Automate model training pipelines, monitoring, and production deployments.",
                    icon: <Workflow size={24} />,
                    color: "emerald",
                    difficulty: "Expert",
                    duration: "6 Months",
                    format: "System Design",
                    recommendedFor: ["AI Engineers", "DevOps pros", "Data Engineers"],
                    status: "Coming Soon"
                }
            ]
        },
        {
            title: "🤖 AI & Data",
            id: "ai-data",
            tracks: [
                {
                    id: "ai-engineer",
                    title: "AI Engineer",
                    description: "Build production AI agents using Python, LangChain, vector databases, and RAG architectures.",
                    icon: <Cpu size={24} />,
                    color: "cyan",
                    difficulty: "Advanced",
                    duration: "6 Months",
                    format: "Research & Build",
                    recommendedFor: ["Python developers", "AI enthusiasts", "Future founders"],
                    status: "Coming Soon"
                },
                {
                    id: "data-scientist",
                    title: "Data Scientist",
                    description: "Master Machine Learning algorithms, predictive modeling, TensorFlow, and deep data analysis.",
                    icon: <Brain size={24} />,
                    color: "violet",
                    difficulty: "Advanced",
                    duration: "8 Months",
                    format: "Model Training",
                    recommendedFor: ["Math enthusiasts", "Python developers", "Research-driven"],
                    status: "Coming Soon"
                },
                {
                    id: "data-analyst",
                    title: "Data Analyst",
                    description: "Extract insights using SQL, Python, Tableau, and PowerBI to drive business decisions.",
                    icon: <BarChart size={24} />,
                    color: "yellow",
                    difficulty: "Beginner",
                    duration: "4 Months",
                    format: "Analytics",
                    recommendedFor: ["Problem solvers", "Business thinkers", "Beginners"],
                    status: "Coming Soon"
                }
            ]
        },
        {
            title: "🔐 Security & QA",
            id: "security-qa",
            tracks: [
                {
                    id: "cyber-security",
                    title: "Cyber Security",
                    description: "Master ethical hacking, penetration testing, cryptography, and secure application development.",
                    icon: <Shield size={24} />,
                    color: "orange",
                    difficulty: "Intermediate",
                    duration: "6 Months",
                    format: "Offensive Security",
                    recommendedFor: ["Security analysts", "Bug bounty hunters", "Network engineers"],
                    status: "Coming Soon"
                },
                {
                    id: "qa-automation",
                    title: "QA Automation Engineer",
                    description: "Ensure software reliability using Selenium, Cypress, Playwright, and automated testing frameworks.",
                    icon: <CheckSquare size={24} />,
                    color: "teal",
                    difficulty: "Beginner",
                    duration: "4 Months",
                    format: "Testing Labs",
                    recommendedFor: ["Detail-oriented", "Beginners", "Placement aspirants"],
                    status: "Coming Soon"
                }
            ]
        },
        {
            title: "🎨 Product & Design",
            id: "product-design",
            tracks: [
                {
                    id: "ui-ux",
                    title: "UI/UX Designer",
                    description: "Design beautiful, user-centric interfaces using Figma, Framer, and modern design systems.",
                    icon: <Palette size={24} />,
                    color: "pink",
                    difficulty: "Beginner",
                    duration: "5 Months",
                    format: "Portfolio Building",
                    recommendedFor: ["Creative minds", "Non-coders", "Frontend developers"],
                    status: "Coming Soon"
                },
                {
                    id: "product-manager",
                    title: "Product Manager",
                    description: "Lead product development, master agile methodologies, metrics, and go-to-market strategies.",
                    icon: <Target size={24} />,
                    color: "red",
                    difficulty: "Intermediate",
                    duration: "6 Months",
                    format: "Case Studies",
                    recommendedFor: ["Leaders", "Business strategists", "Startup founders"],
                    status: "Coming Soon"
                }
            ]
        }
    ];

    const getColorClasses = (color) => {
        switch (color) {
            case "rose": return "from-rose-500/10 border-rose-500/30 text-rose-400 group-hover:border-rose-500/60 group-hover:shadow-[0_0_30px_rgba(225,29,72,0.15)]";
            case "cyan": return "from-cyan-500/10 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-500/60 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]";
            case "indigo": return "from-indigo-500/10 border-indigo-500/30 text-indigo-400 group-hover:border-indigo-500/60 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]";
            case "emerald": return "from-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/60 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]";
            case "purple": return "from-purple-500/10 border-purple-500/30 text-purple-400 group-hover:border-purple-500/60 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]";
            case "orange": return "from-orange-500/10 border-orange-500/30 text-orange-400 group-hover:border-orange-500/60 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]";
            case "green": return "from-green-500/10 border-green-500/30 text-green-400 group-hover:border-green-500/60 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]";
            case "sky": return "from-sky-500/10 border-sky-500/30 text-sky-400 group-hover:border-sky-500/60 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]";
            case "violet": return "from-violet-500/10 border-violet-500/30 text-violet-400 group-hover:border-violet-500/60 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]";
            case "yellow": return "from-yellow-500/10 border-yellow-500/30 text-yellow-400 group-hover:border-yellow-500/60 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]";
            case "teal": return "from-teal-500/10 border-teal-500/30 text-teal-400 group-hover:border-teal-500/60 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]";
            case "pink": return "from-pink-500/10 border-pink-500/30 text-pink-400 group-hover:border-pink-500/60 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]";
            case "red": return "from-red-500/10 border-red-500/30 text-red-400 group-hover:border-red-500/60 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]";
            default: return "from-white/5 border-white/10 text-white group-hover:border-white/30";
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative bg-[#060A14] text-white font-sans sm:px-4">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] z-0 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_20%,#000_70%,transparent_100%)] fixed pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10 fixed mix-blend-screen"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full mb-16 text-center">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                        <LayoutList size={32} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
                        DeVert <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Tracks.</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed">
                        Choose a track. Build real skills. Become a DeVert.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 w-full min-h-[500px]">
                {categories.map((category) => (
                    <motion.div 
                        key={category.id}
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="mb-16"
                    >
                        <motion.h2 variants={fadeIn} className="text-2xl md:text-3xl font-bold text-white mb-8 tracking-tight flex items-center gap-3 border-b border-white/10 pb-4">
                            {category.title}
                        </motion.h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {category.tracks.map((track) => {
                                const CardContent = (
                                    <motion.div variants={fadeIn} className="group cursor-pointer flex h-full">
                                    <div className={`relative p-6 rounded-3xl bg-gradient-to-br to-transparent border backdrop-blur-md w-full transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white/[0.02] ${getColorClasses(track.color)}`}>
                                        <div className="absolute inset-0 bg-black/40 z-0"></div>
                                        
                                        <div className="relative z-10 flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg ${getColorClasses(track.color).split(' ')[2]}`}>
                                                    {track.icon}
                                                </div>
                                                {track.status && (
                                                    <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${track.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                        {track.status}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                                {track.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 leading-relaxed mb-5">
                                                {track.description}
                                            </p>
                                            
                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-3 gap-3 mb-6">
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Shield size={10}/> Level</span>
                                                    <span className="text-sm font-bold text-white">{track.difficulty}</span>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10}/> Duration</span>
                                                    <span className="text-sm font-bold text-white">{track.duration}</span>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Code size={10}/> Format</span>
                                                    <span className="text-sm font-bold text-white">{track.format}</span>
                                                </div>
                                            </div>

                                            {/* Recommended For */}
                                            <div className="mb-2">
                                                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Recommended For:</h4>
                                                <ul className="space-y-2">
                                                    {track.recommendedFor.map((item, idx) => (
                                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                                            <CheckCircle2 size={14} className={getColorClasses(track.color).split(' ')[2]} />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-5 relative z-10 pt-5 border-t border-white/5 flex items-center justify-between">
                                            <span className={`text-xs font-mono font-bold tracking-widest uppercase ${getColorClasses(track.color).split(' ')[2]}`}>
                                                {track.status === 'Available' ? 'Start Track' : 'Awaiting Deployment'} &gt;_
                                            </span>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/5 border border-white/10 group-hover:scale-110 ${getColorClasses(track.color).split(' ')[2]}`}>
                                                {track.status === 'Available' ? <ArrowRight size={16} /> : <ExternalLink size={16} />}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                );
                                
                                return track.status === 'Available' ? (
                                    <Link key={track.id} href={`/tracks/${track.id}`} className="block">
                                        {CardContent}
                                    </Link>
                                ) : (
                                    <div key={track.id} className="block opacity-80">
                                        {CardContent}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-20 border-t border-white/5"><StackMarquee /></div>
        </main>
    );
}
