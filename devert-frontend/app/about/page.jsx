"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AboutDeVert() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-12 max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white font-mono text-xs mb-8">
                <ArrowLeft size={16} className="mr-2" /> RETURN_HOME
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
            >
                {/* Header */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neon-cyan">ABOUT_DEVERT</h1>
                    <p className="text-xl text-gray-400 font-mono">Why We Built The Execution System</p>
                </div>

                {/* Section: Why DeVert Exists */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-neon-green pl-4">Why DeVert Exists</h2>
                    <p className="text-gray-300 leading-relaxed">
                        DeVert was created from a simple frustration.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        We saw people learning endlessly but struggling to execute.
                        We saw real requirements break down midway due to poor coordination.
                        We saw capable individuals stuck between preparation and real-world work.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Across students, small businesses, NGOs, and early-stage founders, the pattern was the same:
                    </p>
                    <p className="text-white font-bold text-lg font-mono bg-white/5 p-4 rounded border-l border-neon-cyan">
                        Intent was strong. Execution was fragile.
                    </p>
                    <p className="text-gray-300 leading-relaxed">DeVert exists to address that gap.</p>
                </section>

                {/* Section: Who Built DeVert */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-neon-cyan pl-4">Who Built DeVert</h2>
                    <p className="text-gray-300 leading-relaxed">
                        DeVert is being built by <a href="https://www.linkedin.com/in/adarisamuelprasad/" target="_blank" className="text-neon-cyan font-bold hover:underline">Samuel</a> and <a href="https://www.linkedin.com/in/bhanu-prasad-vengaladas-7095a6305/" target="_blank" className="text-neon-green font-bold hover:underline">Bhanu</a>.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        Both of us have worked closely with students, developers, and organizations where execution mattered more than theory. Over time, we realized that most systems reward learning, planning, and credentials — but very few are designed around getting work finished reliably.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        DeVert is our attempt to rethink that problem from the ground up. Not as content. Not as advice. But as a system.
                    </p>
                </section>

                {/* Section: The Core Belief */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white border-l-4 border-purple-500 pl-4">The Core Belief</h2>
                    <div className="bg-white/5 p-6 rounded-lg space-y-4 border border-white/10">
                        <p className="text-lg text-white font-medium">
                            Execution fails not because people lack ability, but because systems are poorly designed.
                        </p>
                        <ul className="list-disc list-inside text-gray-400 font-mono space-y-1 ml-4">
                            <li>Motivation fades.</li>
                            <li>Tools get abandoned.</li>
                            <li>Plans stay in documents.</li>
                        </ul>
                        <p className="text-neon-green font-bold">
                            What lasts is structure, accountability, and clarity.
                        </p>
                    </div>
                </section>

                {/* Section: What DeVert Is */}
                <section className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-neon-cyan mb-2">DeVert is:</h3>
                        <ul className="space-y-2 font-mono text-sm text-gray-300">
                            <li className="flex items-center"><span className="text-neon-cyan mr-2">✓</span> Execution-first</li>
                            <li className="flex items-center"><span className="text-neon-cyan mr-2">✓</span> Problem-driven</li>
                            <li className="flex items-center"><span className="text-neon-cyan mr-2">✓</span> Grounded in real-world needs</li>
                            <li className="flex items-center"><span className="text-neon-cyan mr-2">✓</span> Built carefully, not loudly</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-red-500 mb-2">DeVert is NOT:</h3>
                        <ul className="space-y-2 font-mono text-sm text-gray-300">
                            <li className="flex items-center"><span className="text-red-500 mr-2">×</span> A freelancing platform</li>
                            <li className="flex items-center"><span className="text-red-500 mr-2">×</span> A learning or course platform</li>
                            <li className="flex items-center"><span className="text-red-500 mr-2">×</span> A motivational product</li>
                            <li className="flex items-center"><span className="text-red-500 mr-2">×</span> A job board</li>
                        </ul>
                    </div>
                </section>

                {/* Section: The Name */}
                <section className="space-y-4 bg-white/5 p-6 rounded border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-2">The Name “DeVert”</h2>
                    <p className="text-gray-300 leading-relaxed italic border-l-2 border-gray-600 pl-4">
                        "Just like IntroVert or ExtroVert... we thought to create something like Dev + Vert... so DeVert."
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                        The name DeVert comes from the idea of diverting effort toward execution.
                        It also represents a personality type: <span className="text-neon-cyan font-bold">The Developer Type.</span>
                    </p>

                    <div className="pt-4">
                        <p className="text-xs font-mono text-gray-500 uppercase mb-2">Common Search Terms / Typos</p>
                        <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
                            <span className="bg-black px-2 py-1 rounded">DeVert</span>
                            <span className="bg-black px-2 py-1 rounded">devert.in</span>
                            <span className="bg-black px-2 py-1 rounded">devvert</span>
                            <span className="bg-black px-2 py-1 rounded">de-vert</span>
                            <span className="bg-black px-2 py-1 rounded">devert execution</span>
                        </div>
                    </div>
                </section>

                {/* Section: Our Approach */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Our Approach</h2>
                    <p className="text-gray-300 leading-relaxed">
                        We are intentionally building DeVert slowly. No hype launches. No rushed features. No unnecessary complexity. We believe systems that deal with real work deserve time, care, and iteration.
                    </p>
                    <p className="text-gray-300 font-mono text-sm">
                        DeVert is still early. Still evolving. Still learning from reality.
                    </p>
                </section>

                {/* Footer Note */}
                <div className="pt-12 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">DeVert is not a platform.</h3>
                    <p className="text-xl text-neon-cyan font-mono">It’s a system.</p>
                    <p className="text-sm text-gray-500 mt-4">And it’s just getting started.</p>
                </div>
            </motion.div>
        </div>
    );
}
