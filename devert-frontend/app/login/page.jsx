"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Terminal, Wifi, AlertCircle } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

const BOOT_LINES = [
  "Connecting to devert.in...",
  "Handshake: TLS 1.3 [OK]",
  "Loading auth protocols...",
  "Ready. Awaiting credentials.",
];

export default function LoginPage() {
  const [bootDone, setBootDone] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(() => setBootDone(true), 400);
      }
    }, 320);
    return () => clearInterval(iv);
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (e) {
      setError("Authentication failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,255,65,0.03) 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          className="terminal-window"
          style={{ boxShadow: "0 0 80px rgba(0,255,65,0.06), 0 2px 40px rgba(0,0,0,0.8)" }}
        >
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" />
            <div className="terminal-dot bg-yellow-500/70" />
            <div className="terminal-dot bg-green-500/70" />
            <Terminal size={11} className="ml-2 text-white/25" />
            <span className="font-mono text-[11px] text-white/25 ml-1">ssh devert.in</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Wifi size={10} className="text-neon-green/60" />
              <span className="font-mono text-[10px] text-neon-green/60">CONNECTED</span>
            </div>
          </div>

          <div className="p-6">
            {/* Boot sequence */}
            <div className="mb-6 space-y-1.5 font-mono text-xs">
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span style={{ color: "#00FF41" }}>$</span>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{line}</span>
                  {i === visibleLines - 1 && !bootDone && (
                    <span className="cursor-blink text-neon-cyan">_</span>
                  )}
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {bootDone && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="border-t border-white/5 mb-6" />

                  <div className="mb-6">
                    <h2 className="font-sans text-2xl font-bold text-white mb-1">Access DeVert</h2>
                    <p className="font-mono text-xs text-white/35">
                      <span style={{ color: "rgba(0,255,65,0.6)" }}>$</span> Authenticate to claim your rank.
                    </p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 font-mono text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3 mb-4"
                    >
                      <AlertCircle size={12} />
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    onClick={handleGoogle}
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.01, boxShadow: "0 0 25px rgba(0,255,65,0.2)" } : {}}
                    whileTap={!loading ? { scale: 0.99 } : {}}
                    className="w-full flex items-center justify-center gap-3 font-mono text-sm py-4 border transition-all mb-4"
                    style={loading ? {
                      color: "rgba(255,255,255,0.25)",
                      borderColor: "rgba(255,255,255,0.06)",
                      cursor: "not-allowed",
                    } : {
                      color: "#00FF41",
                      borderColor: "rgba(0,255,65,0.3)",
                      background: "rgba(0,255,65,0.04)",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        authenticating...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        [ auth --provider=google ]
                      </>
                    )}
                  </motion.button>

                  <p className="font-mono text-[10px] text-white/20 text-center">
                    By authenticating, you accept the DeVert manifesto.<br />
                    // Build. Ship. Repeat.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="font-mono text-[10px] text-white/18 text-center mt-4"
        >
          devert.in · Builder&apos;s OS · v2.0
        </motion.p>
      </div>
    </main>
  );
}
