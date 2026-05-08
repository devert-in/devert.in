"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowLeft, Mail, Linkedin, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LoginPage() {
    const [step, setStep] = useState(1); // 1: Credentials, 2: Verification (Signup only)
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    
    const router = useRouter();

    const initiateSignUp = async (e) => {
        e.preventDefault();
        setError("");
        
        if (!isLogin && !linkedin.includes("linkedin.com")) {
            setError("Please provide a valid LinkedIn profile URL.");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                // Direct Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await handleUserRedirect(userCredential.user);
            } else {
                // Trigger OTP from Backend
                const resp = await fetch(`${API_URL}/api/auth/send-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                if (resp.ok) {
                    setStep(2);
                } else {
                    const msg = await resp.text();
                    setError(msg || "Failed to send verification code.");
                }
            }
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setLoading(false);
        }
    };

    const verifyAndCompleteSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Verify OTP with Backend
            const resp = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });

            if (!resp.ok) {
                throw new Error("Invalid or Expired Verification Code.");
            }

            // 2. Create Firebase User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Save to Firestore including LinkedIn
            const { doc, setDoc, serverTimestamp, getFirestore } = await import("firebase/firestore");
            const db = getFirestore();
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: email.split('@')[0],
                linkedin: linkedin,
                verified: true,
                lastLogin: serverTimestamp(),
                createdAt: serverTimestamp(),
                role: "user"
            }, { merge: true });

            await handleUserRedirect(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUserRedirect = async (user) => {
        if (user.email === "admin@devert.in") {
            router.push("/admin");
        } else {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>

            <Link href="/" className="absolute top-10 md:top-28 left-4 md:left-10 text-gray-500 hover:text-foreground flex items-center transition-colors font-mono text-xs">
                <ArrowLeft className="mr-2" size={14} /> RETURN_HOME
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                        {step === 1 ? <Lock size={32} /> : <ShieldCheck size={32} className="animate-pulse" />}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold font-sans uppercase tracking-tight">
                        {isLogin ? "IDENTITY_AUTH" : step === 1 ? "CREATE_BUILDER_ID" : "VERIFY_IDENTITY"}
                    </h2>
                    <p className="font-mono text-gray-500 text-[10px] mt-2">
                        {isLogin ? "RESTRICTED ACCESS // ENTER CREDENTIALS" : step === 1 ? "INITIALIZING SECURE REGISTRATION" : `CODE SENT TO ${email.toUpperCase()}`}
                    </p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 mb-6 font-mono text-[10px] flex items-center gap-3"
                    >
                        <ShieldCheck size={14} className="shrink-0" />
                        {error.toUpperCase()}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={initiateSignUp} 
                            className="space-y-5"
                        >
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                                        placeholder="GMAIL_ADDRESS"
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                                        placeholder="ENCRYPTED_PASSWORD"
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="relative">
                                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="url"
                                            required
                                            value={linkedin}
                                            onChange={(e) => setLinkedin(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                                            placeholder="LINKEDIN_PROFILE_URL"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-neon-cyan text-black py-4 rounded-xl font-bold font-mono text-sm shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>
                                        {isLogin ? "INITIATE_AUTH" : "REQUEST_VERIFICATION"}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {isLogin && (
                                <>
                                    <div className="relative flex py-4 items-center">
                                        <div className="flex-grow border-t border-white/5"></div>
                                        <span className="flex-shrink-0 mx-4 text-[10px] font-mono text-gray-600 tracking-widest uppercase">External_Auth</span>
                                        <div className="flex-grow border-t border-white/5"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const provider = new GoogleAuthProvider();
                                            try {
                                                const result = await signInWithPopup(auth, provider);
                                                await handleUserRedirect(result.user);
                                            } catch (err) {
                                                setError(err.message);
                                            }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-mono text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        GOOGLE_ID_PROTOCOL
                                    </button>
                                </>
                            )}
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={verifyAndCompleteSignUp}
                            className="space-y-6"
                        >
                            <div className="text-center space-y-4">
                                <label className="block font-mono text-xs text-gray-500 tracking-widest">ENTER_6_DIGIT_OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-transparent border-b-2 border-white/20 focus:border-neon-cyan text-center text-4xl font-bold tracking-[1rem] py-4 focus:outline-none transition-colors font-mono text-neon-cyan"
                                    placeholder="000000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full bg-neon-cyan text-black py-4 rounded-xl font-bold font-mono text-sm shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                    <>
                                        FINALIZE_REGISTRATION
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-[10px] font-mono text-gray-500 hover:text-white transition-colors"
                            >
                                WRONG EMAIL? GO BACK
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setStep(1);
                            setError("");
                        }}
                        className="text-[10px] font-mono text-gray-500 hover:text-neon-cyan underline decoration-dotted underline-offset-8 uppercase tracking-widest"
                    >
                        {isLogin ? "No builder ID? Create access" : "Already have access? Authorize"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
