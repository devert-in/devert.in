"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { Loader2, Database, CheckCircle, Trash2 } from "lucide-react";

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const SAMPLE_REQUIREMENTS = [
        {
            name: "TechNova Corp",
            email: "contact@technova.example.com",
            type: "website_app",
            description: "We need a React Native mobile application for our logistics tracking system. It should include real-time maps, driver status, and push notifications.",
            deadline: "3 weeks",
            budget: "$2,500 - $4,000",
            status: "NEW", // Open on board
            interestedExecutors: [],
            createdAt: new Date(),
        },
        {
            name: "Sarah Jenkins (Student)",
            email: "sarah.j@university.edu",
            type: "fresher_academic",
            description: "Need help with a Final Year Project on 'AI-based Traffic Management'. Need python code for vehicle detection using OpenCV and a thorough documentation report.",
            deadline: "1 week",
            budget: "$200",
            status: "NEW", // Open
            interestedExecutors: [],
            createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        },
        {
            name: "GreenEarth NGO",
            email: "ops@greenearth.org",
            type: "content_research",
            description: "Research report needed on 'Impact of Urbanization on localized water bodies in Bangalore'. Data collection and visualization required.",
            deadline: "1 month",
            budget: "$500",
            status: "ASSIGNED", // In Progress
            interestedExecutors: ["dummy_uid_1", "dummy_uid_2"],
            createdAt: new Date(Date.now() - 86400000 * 5),
        },
        {
            name: "CryptoVibe Startup",
            email: "founder@cryptovibe.io",
            type: "website_app",
            description: "Smart Contract audit and frontend integration for our specialized NFT marketplace. Vue.js + Solidity expertise needed.",
            deadline: "ASAP",
            budget: "$5,000",
            status: "COMPLETED", // Done
            interestedExecutors: [],
            createdAt: new Date(Date.now() - 86400000 * 15),
        },
        {
            name: "Dr. Arinze",
            email: "arinze@hospital.com",
            type: "other",
            description: "Statistical analysis of patient data using R studio. I have the dataset in CSV, need specific correlation graphs.",
            deadline: "4 days",
            budget: "$300",
            status: "NEW",
            interestedExecutors: ["dummy_uid_3"],
            createdAt: new Date(),
        }
    ];

    const SAMPLE_EXECUTORS = [
        {
            name: "Alex 'C0der' Mercer",
            email: "alex.mercer@dev.io",
            skills: "React, Node.js, AWS, Python",
            availability: "30",
            motivation: "I love building scalable backends. Looking for steady side-income.",
            status: "APPROVED",
            createdAt: new Date(Date.now() - 86400000 * 10),
        },
        {
            name: "Elena Fisher",
            email: "elena.f@design.co",
            skills: "Figma, UI/UX, Blender, CSS",
            availability: "15",
            motivation: "Want to work on challenging UI designs for startups.",
            status: "PENDING",
            createdAt: new Date(Date.now() - 86400000 * 1),
        },
        {
            name: "Marcus Holloway",
            email: "dedsec@ctos.com",
            skills: "Cybersecurity, Penetration Testing, Python scripting",
            availability: "40",
            motivation: "Searching for bounties and security audit tasks.",
            status: "APPROVED",
            createdAt: new Date(Date.now() - 86400000 * 20),
        },
        {
            name: "Lara Croft",
            email: "lara@archaeo.org",
            skills: "Research, Documentation, History, Data Analysis",
            availability: "10",
            motivation: "Academic writing is my forte.",
            status: "REJECTED",
            createdAt: new Date(Date.now() - 86400000 * 30),
        }
    ];

    const generateData = async () => {
        setLoading(true);
        setStatus("Starting injection sequence...");

        try {
            // Seed Requirements
            // Seed Requirements (Check for duplicates by 'email' + 'name')
            setStatus("Injecting Requirements...");
            for (const req of SAMPLE_REQUIREMENTS) {
                const q = query(collection(db, "requirements"),
                    where("email", "==", req.email),
                    where("name", "==", req.name)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Update existing
                    const docId = querySnapshot.docs[0].id;
                    await setDoc(doc(db, "requirements", docId), {
                        ...req,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                    console.log(`Updated Requirement: ${req.name}`);
                } else {
                    // Create new
                    await addDoc(collection(db, "requirements"), {
                        ...req,
                        updatedAt: serverTimestamp()
                    });
                    console.log(`Created Requirement: ${req.name}`);
                }
            }

            // Seed Executors (Check by email)
            setStatus("Injecting Executor Profiles...");
            for (const exec of SAMPLE_EXECUTORS) {
                const q = query(collection(db, "executor_applications"), where("email", "==", exec.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docId = querySnapshot.docs[0].id;
                    await setDoc(doc(db, "executor_applications", docId), {
                        ...exec,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                } else {
                    await addDoc(collection(db, "executor_applications"), {
                        ...exec,
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Seed Users (Check by email)
            setStatus("Creating Dummy Users...");
            const ROLES = ['USER', 'EXECUTOR', 'ADMIN', 'USER'];
            for (let i = 1; i <= 10; i++) {
                const email = `user${i}@example.com`;
                const q = query(collection(db, "users"), where("email", "==", email));
                const querySnapshot = await getDocs(q);

                const userData = {
                    displayName: `User_00${i}`,
                    email: email,
                    role: ROLES[i % ROLES.length],
                    xp: Math.floor(Math.random() * 5000),
                    credits: Math.floor(Math.random() * 1000),
                    lastLogin: serverTimestamp(), // Important for analytics
                    createdAt: serverTimestamp()
                };

                if (!querySnapshot.empty) {
                    const docId = querySnapshot.docs[0].id;
                    await setDoc(doc(db, "users", docId), userData, { merge: true });
                } else {
                    await addDoc(collection(db, "users"), userData);
                }
            }


            setStatus("Additional Mission Data Injected Successfully.");
        } catch (error) {
            console.error(error);
            setStatus("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-12 flex flex-col items-center justify-center font-mono">
            <h1 className="text-4xl font-bold text-neon-green mb-8 flex items-center gap-4">
                <Database size={40} /> SYSTEM_SEEDER
            </h1>

            <div className="bg-[#111] border border-white/10 p-8 rounded-xl max-w-lg w-full text-center">
                <p className="text-gray-400 mb-8">
                    Inject sample mission data, operative profiles, and requirement logs into the Firestore Matrix.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={generateData}
                        disabled={loading}
                        className="w-full bg-neon-green text-black font-bold py-4 rounded hover:bg-white transition-colors flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Database size={18} />}
                        {loading ? "INJECTING..." : "GENERATE_SAMPLE_DATA"}
                    </button>

                    {status && (
                        <div className={`p-4 rounded border ${status.includes("Error") ? "border-red-500 bg-red-500/10 text-red-500" : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan"}`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
