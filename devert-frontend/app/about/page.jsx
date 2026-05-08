"use client";

import { motion } from "framer-motion";
import { Terminal, Lightbulb, Rocket, GitMerge } from "lucide-react";
import Link from "next/link";
import { StackMarquee } from "@/components/stack-marquee";

export default function AboutPage() {
    const slideUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <main className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-background text-foreground">
            {/* Background Effects */}
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none z-0"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
            
            <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={slideUp}
                    className="mb-16 border-b border-white/10 pb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 rounded-full mb-6">
                        <Terminal size={14} className="text-neon-cyan" />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-neon-cyan uppercase">System_History</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-sans uppercase tracking-tighter mb-4">
                        The Origins of <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-green italic">DeVert</span>
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm max-w-2xl leading-relaxed uppercase tracking-widest">
                        A divergence from the traditional path. The genesis of a builder's revolution.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    <motion.section 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={slideUp}
                        className="relative"
                    >
                        <h2 className="text-3xl font-black font-sans uppercase mb-6 flex items-center gap-4">
                            <Lightbulb className="text-yellow-500" /> The Catalyst
                        </h2>
                        <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-gray-400 prose-p:leading-relaxed max-w-none space-y-6">
                            <p>
                                It started with a fundamental frustration. We looked around the Indian tech ecosystem, specifically across Tier 2 and Tier 3 engineering colleges, and saw a massive disconnect. Thousands of students were trapped in "tutorial hell"—accumulating certificates, memorizing syntax, but paralyzed when asked to build a real-world system from the ground up.
                            </p>
                            <p>
                                The traditional pipeline was broken. It was heavily biased towards rote learners and gate-kept by Tier 1 tags. The industry didn't need more people who simply "watched" coding tutorials; it needed engineers who could execute, ship, and deploy. We realized that if we wanted to change the trajectory of our peers, we had to build an ecosystem that worshipped execution above all else.
                            </p>
                        </div>
                    </motion.section>

                    <motion.section 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={slideUp}
                        className="relative"
                    >
                        <h2 className="text-3xl font-black font-sans uppercase mb-6 flex items-center gap-4">
                            <GitMerge className="text-neon-cyan" /> Why "DeVert"?
                        </h2>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm border-l-4 border-l-neon-cyan mb-6">
                            <p className="font-mono text-sm text-gray-300 leading-relaxed italic">
                                You know introvert. You know extrovert. Now meet the <span className="text-neon-cyan font-bold">DeVert</span>.
                            </p>
                        </div>
                        <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-gray-400 prose-p:leading-relaxed max-w-none space-y-6">
                            <p>
                                We didn't just want a brand name; we needed it to be an <strong>identity</strong>. The name "DeVert" breaks down simply:
                            </p>
                            <ul className="list-none space-y-4 font-mono text-sm text-gray-400">
                                <li className="flex gap-4 items-start">
                                    <span className="text-neon-cyan font-black">&gt; DEV:</span> 
                                    <span>Stands for <strong>Developer</strong>. The foundation of everything we do. We write code, we solve problems.</span>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <span className="text-neon-green font-black">&gt; VERT:</span> 
                                    <span>Like Introvert or Extrovert. It represents a <strong>state of being</strong> and a personality type.</span>
                                </li>
                            </ul>
                            <p>
                                For decades, the stereotype of a coder has been the quiet <em>introvert</em> locked in a dark room. 
                                But today's industry demands more. <br/><br/>
                                A <strong>DeVert</strong> is the evolution of that stereotype: A developer who transitions from being an isolated learner into a bold, confident builder. A DeVert builds in public, pitches their startups, dominates hackathon stages, communicates technical ideas clearly, and claims their rightful place at elite product-based companies.
                            </p>
                            <p>
                                DeVert isn't just a platform. It's the personality type of the modern, successful engineer.
                            </p>
                        </div>
                    </motion.section>

                    <motion.section 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={slideUp}
                        className="relative"
                    >
                        <h2 className="text-3xl font-black font-sans uppercase mb-6 flex items-center gap-4">
                            <Rocket className="text-orange-500" /> The Evolution
                        </h2>
                        <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-gray-400 prose-p:leading-relaxed max-w-none space-y-6">
                            <p>
                                What began as a scattered idea to host hackathons rapidly evolved into a comprehensive digital architecture. We realized that networking alone wasn't enough without the heavy lifting of preparation. 
                            </p>
                            <p>
                                We evolved the DeVert vision into a four-pillar powerhouse: Execution (DSA & backend architecture), Hackathon Culture, Placement Prep, and Elite Networking. We stripped away the fluff. We built a Proof-of-Work arena. 
                            </p>
                            <p>
                                Today, DeVert is the unified pipeline. It's where you come to bleed in the code editor, fail, debug, and ultimately emerge as a battle-tested builder ready to crack product-based companies or launch your own startup.
                            </p>
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="text-center sm:text-left">
                                <p className="font-mono text-xs text-neon-cyan uppercase tracking-widest font-bold mb-2">The Architecture is Live.</p>
                                <p className="font-sans font-black text-2xl uppercase tracking-tighter">Are you ready to build?</p>
                            </div>
                            <Link href="/workspace" className="px-8 py-4 bg-white text-black font-black font-mono text-xs uppercase tracking-widest hover:bg-neon-cyan transition-all rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                ENTER THE PLATFORM
                            </Link>
                        </div>
                    </motion.section>
                </div>
            </div>
            
            <div className="mt-24">
                <StackMarquee />
            </div>
        </main>
    );
}
