"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";

const HACKATHONS = [
    {
        title: "Global AI Challenge 2026",
        description: "Build the next generation of AI agents. Focus on autonomous systems and ethical AI.",
        date: "Feb 15 - Feb 17, 2026",
        prizes: "$50,000 Prize Pool",
        tags: ["AI/ML", "Python", "Agents"],
        status: "OPEN"
    },
    {
        title: "DeFi Spring Hack",
        description: "Revolutionize finance with Web3. Build on Ethereum, Solana, or Polygon.",
        date: "Mar 10 - Mar 12, 2026",
        prizes: "$100,000 Prize Pool",
        tags: ["Blockchain", "Solidity", "Rust"],
        status: "UPCOMING"
    },
    {
        title: "Green Tech Summit",
        description: "Sustainable solutions for a better planet. IoT and Data Science focus.",
        date: "Jan 20 - Jan 22, 2026",
        prizes: "$25,000 Prize Pool",
        tags: ["IoT", "Data Science", "Hardware"],
        status: "CLOSED"
    }
];

const COURSES = [
    {
        title: "Full Stack Matrix",
        description: "Master the MERN stack with a focus on scalable architecture and deployment.",
        modules: 12,
        duration: "24h 15m",
        level: "Intermediate",
        thumbnail: "from-gray-900 to-black"
    },
    {
        title: "Rust for Systems",
        description: "Low-level programming simply explained. Memory safety without garbage collection.",
        modules: 8,
        duration: "16h 30m",
        level: "Advanced",
        thumbnail: "from-orange-900 to-black"
    },
    {
        title: "Docker & K8s Zero to Hero",
        description: "Containerization and orchestration for modern devops workflows.",
        modules: 15,
        duration: "18h 45m",
        level: "Beginner",
        thumbnail: "from-blue-900 to-black"
    }
];

const POSTMORTEMS = [
    {
        id: "GAI-2026",
        title: "Global AI Challenge 2026",
        status: "LOST",
        teamSize: 4,
        stack: ["React", "FastAPI", "OpenAI"],
        rank: "42/1200",
        whyLost: "Poor problem scoping. Overbuilt features instead of focusing on the core narrative.",
        winningSignals: [],
        criticalMistakes: ["Feature creep", "No backup plan", "Ignored judging rubric"],
        patchIfRedeployed: ["Cut features by 50%", "Improve demo flow", "Focus on one metric"],
        verdict: "Execution failed, not the idea.",
        date: "2026-02-15"
    },
    {
        id: "DEFI-ETH-2025",
        title: "ETH Global - DeFi Track",
        status: "WON",
        teamSize: 3,
        stack: ["Solidity", "Next.js", "Foundry"],
        rank: "1/500",
        whyWon: "Clear problem framing. MVP-first execution. Strong demo storytelling.",
        winningSignals: ["Simple architecture", "One strong use-case", "Clean UI", "Judge-friendly demo"],
        criticalMistakes: [],
        patchIfRedeployed: ["Add better test coverage", "Optimize gas costs"],
        verdict: "Perfect execution of a simple idea.",
        date: "2025-11-20"
    },
    {
        id: "SOL-HACK-2025",
        title: "Solana Summer Hack",
        status: "LOST",
        teamSize: 2,
        stack: ["Rust", "React", "Anchor"],
        rank: "150/800",
        whyLost: "Demo failed live. The RPC node went down and we had no fallback mock data.",
        winningSignals: [],
        criticalMistakes: ["Demo failed live", "Relied on mainnet"],
        patchIfRedeployed: ["Mock all external APIs for demo", "Record a backup video"],
        verdict: "Technical risk management failure.",
        date: "2025-08-10"
    }
];

export default function AdminSeedPage() {
    const [status, setStatus] = useState("");

    const handleSeed = async () => {
        setStatus("Seeding...");
        try {
            const batch = writeBatch(db);

            // Hackathons
            HACKATHONS.forEach(hack => {
                const ref = doc(collection(db, "hackathons"));
                batch.set(ref, hack);
            });

            // Courses
            COURSES.forEach(course => {
                const ref = doc(collection(db, "courses"));
                batch.set(ref, course);
            });

            // Postmortems
            POSTMORTEMS.forEach(pm => {
                const ref = doc(collection(db, "postmortems"));
                batch.set(ref, pm);
            });

            await batch.commit();
            setStatus("SUCCESS: Database populated!");
        } catch (e) {
            console.error(e);
            setStatus("ERROR: " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-20 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8">Admin Database Seeder</h1>
            <p className="mb-8 text-gray-400 max-w-md text-center">
                Clicking this will write dummy data (Hackathons & Courses) to your Firestore database.
                Ensure you are logged in if rules require it.
            </p>
            <button
                onClick={handleSeed}
                className="bg-neon-green text-black px-8 py-4 font-bold font-mono hover:opacity-90"
            >
                SEED DATABASE
            </button>
            {status && (
                <div className="mt-8 font-mono text-neon-cyan border border-neon-cyan p-4">
                    {status}
                </div>
            )}
        </div>
    );
}
