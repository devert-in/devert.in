"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
    const router = useRouter();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }

            // Basic admin check simulation
            if (email.includes("admin")) {
                console.log("Admin logged in");
                router.push("/admin");
            } else {
                router.push("/");
            }
        } catch (err) {
            console.error(err);
            // Show the actual error message for better debugging
            setError(err.message.replace("Firebase: ", ""));
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <Link href="/" className="absolute top-10 left-10 text-gray-500 hover:text-white flex items-center transition-colors">
                <ArrowLeft className="mr-2" size={16} /> RETURN
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-black/50 backdrop-blur-md border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                <div className="flex justify-center mb-6 text-neon-cyan">
                    <Lock size={40} />
                </div>

                <h2 className="text-2xl font-bold font-sans text-center mb-2">
                    {isLogin ? "SYSTEM_LOGIN" : "SYSTEM_REGISTRATION"}
                </h2>
                <p className="text-center font-mono text-gray-500 text-sm mb-8">
                    {isLogin ? "Enter credentials to access mainframe." : "Create new identity credentials."}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 mb-6 font-mono text-xs text-center break-words">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block font-mono text-xs text-gray-400 mb-2">USER_ID (EMAIL)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                            placeholder="user@devert.in"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs text-gray-400 mb-2">PASSCODE</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan py-3 font-bold font-mono hover:bg-neon-cyan hover:text-black transition-all duration-300 uppercase tracking-wider"
                    >
                        {isLogin ? "AUTHENTICATE" : "INITIALIZE IDENTITY"}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-mono text-gray-500">OR CONTINUE WITH</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            const provider = new GoogleAuthProvider();
                            try {
                                await signInWithPopup(auth, provider);
                                router.push("/");
                            } catch (err) {
                                console.error(err);
                                setError(err.message.replace("Firebase: ", ""));
                            }
                        }}
                        className="w-full bg-white/5 border border-white/10 text-white py-3 font-mono hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        GOOGLE ACCESS
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs font-mono text-gray-500 hover:text-neon-cyan underline decoration-dotted underline-offset-4"
                    >
                        {isLogin ? "NO ACCESS? INITIALIZE PROTOCOL" : "ALREADY INITIALIZED? LOGIN"}
                    </button>
                </div>


            </motion.div>
        </div>
    );
}
