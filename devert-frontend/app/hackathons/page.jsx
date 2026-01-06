"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Calendar, Code } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HackathonsPage() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const querySnapshot = await getDocs(collection(db, "hackathons"));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setHackathons(data);
            } catch (error) {
                console.error("Error fetching hackathons:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 pt-28">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-neon-cyan mb-12 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
          // RETURN_HOME
                </Link>

                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-6xl font-bold font-sans mb-12"
                >
                    ACTIVE_OPERATIONS <span className="text-neon-cyan">_</span>
                </motion.h1>

                {loading ? (
                    <div className="font-mono text-neon-cyan animate-pulse">LOADING_DATA_STREAM...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {hackathons.map((hack, i) => (
                            <motion.div
                                key={hack.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 bg-white/5 border border-white/10 hover:border-neon-cyan transition-colors"
                            >
                                <div className="absolute top-0 right-0 p-2">
                                    <span className={`text-xs font-mono px-2 py-1 rounded ${hack.status === 'OPEN' ? 'bg-neon-green/20 text-neon-green' :
                                            hack.status === 'UPCOMING' ? 'bg-neon-cyan/20 text-neon-cyan' :
                                                'bg-red-500/20 text-red-500'
                                        }`}>
                                        [{hack.status}]
                                    </span>
                                </div>

                                <h3 className="text-2xl font-bold font-sans mb-4 mt-2 group-hover:text-neon-cyan transition-colors">{hack.title}</h3>
                                <p className="text-gray-400 mb-6 font-mono text-sm h-20 overflow-hidden text-ellipsis">{hack.description}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-300">
                                        <Calendar size={16} className="mr-2 text-neon-cyan" />
                                        {hack.date}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-300">
                                        <Code size={16} className="mr-2 text-neon-green" />
                                        {hack.tags ? hack.tags.join(" / ") : ""}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-neon-green font-mono text-sm">{hack.prizes}</span>
                                    <button className="bg-white/10 hover:bg-neon-cyan/20 hover:text-neon-cyan text-white px-4 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer">
                                        INITIATE -&gt;
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
