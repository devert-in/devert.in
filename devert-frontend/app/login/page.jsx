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
            let userCredential;
            if (isLogin) {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            }

            const user = userCredential.user;

            // Save/Update user in Firestore
            try {
                const { doc, setDoc, serverTimestamp, getFirestore } = await import("firebase/firestore");
                const db = getFirestore();
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || email.split('@')[0],
                    lastLogin: serverTimestamp(),
                    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp(),
                    role: email.includes("admin") ? "admin" : "user", // Simple role assignment for demo
                    photoURL: user.photoURL || null
                }, { merge: true });
            } catch (dbError) {
                console.error("Error saving user to DB:", dbError);
                // Don't block login if DB fails, but log it
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
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

            <Link href="/" className="absolute top-28 left-10 text-gray-500 hover:text-foreground flex items-center transition-colors">
                <ArrowLeft className="mr-2" size={16} /> RETURN HOME
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-card-bg backdrop-blur-md border border-border p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                <div className="flex justify-center mb-6 text-neon-cyan">
                    <Lock size={40} />
                </div>

                <h2 className="text-2xl font-bold font-sans text-center mb-2">
                    {isLogin ? "LOGIN" : "SIGN UP"}
                </h2>
                <p className="text-center font-mono text-gray-500 text-sm mb-8">
                    {isLogin ? "Enter your credentials to continue." : "Create a new account."}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 mb-6 font-mono text-xs text-center break-words">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block font-mono text-xs text-gray-400 mb-2">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border p-3 text-foreground focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                            placeholder="user@devert.in"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs text-gray-400 mb-2">PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border p-3 text-foreground focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan py-3 font-bold font-mono hover:bg-neon-cyan hover:text-black transition-all duration-300 uppercase tracking-wider"
                    >
                        {isLogin ? "LOGIN" : "SIGN UP"}
                    </button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-mono text-gray-500">OR CONTINUE WITH</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            const provider = new GoogleAuthProvider();
                            try {
                                const result = await signInWithPopup(auth, provider);
                                const user = result.user;

                                // Save/Update user in Firestore
                                try {
                                    const { doc, setDoc, serverTimestamp, getFirestore } = await import("firebase/firestore");
                                    const db = getFirestore();
                                    await setDoc(doc(db, "users", user.uid), {
                                        uid: user.uid,
                                        email: user.email,
                                        displayName: user.displayName,
                                        lastLogin: serverTimestamp(),
                                        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp(),
                                        role: "user", // Default
                                        photoURL: user.photoURL
                                    }, { merge: true });
                                } catch (dbError) {
                                    console.error("Error saving user to DB:", dbError);
                                }

                                router.push("/");
                            } catch (err) {
                                console.error(err);
                                setError(err.message.replace("Firebase: ", ""));
                            }
                        }}
                        className="w-full bg-background border border-border text-foreground py-3 font-mono hover:bg-border transition-all flex items-center justify-center gap-3"
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
                        CONTINUE WITH GOOGLE
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs font-mono text-gray-500 hover:text-neon-cyan underline decoration-dotted underline-offset-4"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>


            </motion.div>
        </div>
    );
}
