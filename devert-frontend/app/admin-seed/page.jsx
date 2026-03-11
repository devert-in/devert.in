"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, writeBatch, doc, getDocs } from "firebase/firestore";

const HACKATHONS = [
    {
        title: "Global AI Hackathon 2025",
        description: "Build AI applications for a cause. Winners will go to the MIT AI & Education Summit in Cambridge, MA.",
        date: "Mar 03 - Apr 14, 2025",
        prizes: "Trip to MIT AI Summit",
        tags: ["AI", "Social Good", "MIT"],
        status: "OPEN",
        registrationUrl: "https://appinventor.mit.edu/"
    },
    {
        title: "Open Hackathon 2025",
        description: "Optimize applications across data center architectures. Focus on HPC and GPUs.",
        date: "Jun 24 - Jul 03, 2025",
        prizes: "Sponsorship & Cloud Credits",
        tags: ["HPC", "GPU", "Optimization"],
        status: "UPCOMING",
        registrationUrl: "https://www.openhackathons.org/"
    },
    {
        title: "Raise Your Hack 2025",
        description: "Solve real-world challenges in AI and Entrepreneurship. Finale in Paris.",
        date: "Jul 04 - Jul 09, 2025",
        prizes: "Paris Finale Invitation",
        tags: ["AI", "Startup", "Paris"],
        status: "UPCOMING",
        registrationUrl: "https://lablab.ai/"
    },
    {
        title: "ETHGlobal New Delhi 2026",
        description: "The biggest Web3 hackathon in India. Build the decentralized future.",
        date: "Feb 10 - Feb 12, 2026",
        prizes: "$100,000+ Prize Pool",
        tags: ["Web3", "Ethereum", "Crypto"],
        status: "UPCOMING",
        registrationUrl: "https://ethglobal.com/"
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
        verdict: "Deployment failed, not the idea.",
        date: "2026-02-15"
    },
    {
        id: "DEFI-ETH-2025",
        title: "ETH Global - DeFi Track",
        status: "WON",
        teamSize: 3,
        stack: ["Solidity", "Next.js", "Foundry"],
        rank: "1/500",
        whyWon: "Clear problem framing. MVP-first deployment. Strong demo storytelling.",
        winningSignals: ["Simple architecture", "One strong use-case", "Clean UI", "Judge-friendly demo"],
        criticalMistakes: [],
        patchIfRedeployed: ["Add better test coverage", "Optimize gas costs"],
        verdict: "Perfect deployment of a simple idea.",
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

const CONTESTS = [
    {
        title: "Weekly Code Sprint #42",
        description: "Speed contest. 4 algorithmic problems. 2 hours. Prove your optimization skills.",
        date: "Feb 10, 18:00 UTC",
        duration: "2 Hours",
        level: "MEDIUM",
        tags: ["DP", "Graphs", "Optimization"],
        status: "UPCOMING",
        host: "SYSTEM",
        type: "CODING_CONTEST"
    },
    {
        title: "Midnight Oil Capture The Flag",
        description: "Security-focused CTF event. Find vulnerabilities in the deployed contracts.",
        date: "Feb 12, 20:00 UTC",
        duration: "4 Hours",
        level: "HARD",
        tags: ["Security", "Smart Contracts", "CTF"],
        status: "UPCOMING",
        host: "SYSTEM",
        type: "CTF"
    },
    {
        title: "Beginner's Arena: Loops & Logic",
        description: "Perfect for cadets. Basic data structures and logic puzzles.",
        date: "LIVE NOW",
        duration: "Unlimited",
        level: "EASY",
        tags: ["Basics", "Arrays", "Logic"],
        status: "LIVE",
        host: "SYSTEM",
        type: "CODING_CONTEST"
    },
    {
        title: "Graph Theory Mastery",
        description: "Advanced pathfinding and network flow problems.",
        date: "Jan 15, 2026",
        duration: "3 Hours",
        level: "INSANE",
        tags: ["Graphs", "MaxFlow", "Trees"],
        status: "PAST",
        host: "SYSTEM",
        type: "CODING_CONTEST"
    }
];

export default function AdminSeedPage() {
    const [status, setStatus] = useState("");

    const handleCleanup = async () => {
        setStatus("Cleaning external hackathons...");
        try {
            const batch = writeBatch(db);
            const snapshot = await getDocs(collection(db, "hackathons"));
            let deletedCount = 0;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Preserve DeVert events
                if (!data.title.toLowerCase().includes('devert')) {
                    batch.delete(doc.ref);
                    deletedCount++;
                }
            });

            if (deletedCount > 0) {
                await batch.commit();
                setStatus(`SUCCESS: Deleted ${deletedCount} external/duplicate hackathons. Now click SEED.`);
            } else {
                setStatus("No external hackathons found to delete.");
            }
        } catch (e) {
            console.error(e);
            setStatus("ERROR: " + e.message);
        }
    };

    const handleSeed = async () => {
        setStatus("Seeding...");
        try {
            const batch = writeBatch(db);

            // Helper to generate deterministic IDs from titles
            // e.g. "Global AI Hackathon 2025" -> "global-ai-hackathon-2025"
            // This prevents duplicates if you click seed multiple times.
            const createId = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            // Hackathons
            HACKATHONS.forEach(hack => {
                const ref = doc(db, "hackathons", createId(hack.title));
                batch.set(ref, hack);
            });

            // Courses
            COURSES.forEach(course => {
                const ref = doc(db, "courses", createId(course.title));
                batch.set(ref, course);
            });

            // Postmortems (Use existing explicit ID)
            POSTMORTEMS.forEach(pm => {
                const ref = doc(db, "postmortems", pm.id);
                batch.set(ref, pm);
            });

            // Contests (Wargames)
            CONTESTS.forEach(contest => {
                const ref = doc(db, "contests", createId(contest.title));
                batch.set(ref, contest);
            });

            await batch.commit();
            setStatus("SUCCESS: Database populated! (Idempotent: No duplicates will be created)");
        } catch (e) {
            console.error(e);
            setStatus("ERROR: " + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-20 pt-28 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8">Admin Database Seeder</h1>
            <p className="mb-8 text-gray-400 max-w-md text-center">
                Clicking this will write dummy data (Hackathons & Courses) to your Firestore database.
                Ensure you are logged in if rules require it.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={handleCleanup}
                    className="bg-red-500/10 border border-red-500 text-red-500 px-8 py-4 font-bold font-mono hover:bg-red-500 hover:text-black transition-colors"
                >
                    1. CLEAN OLD DATA
                </button>
                <button
                    onClick={handleSeed}
                    className="bg-neon-green text-black px-8 py-4 font-bold font-mono hover:opacity-90 transition-colors"
                >
                    2. SEED DATABASE
                </button>
            </div>
            {status && (
                <div className="mt-8 font-mono text-neon-cyan border border-neon-cyan p-4">
                    {status}
                </div>
            )}
        </div>
    );
}
