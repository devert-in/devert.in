"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CodeLabHub } from "@/components/codelab/codelab-hub";
import { ProblemView } from "@/components/codelab/problem-view";
import { useIsWindowed } from "@/components/window/is-windowed";
import { useAuth } from "@/context/AuthContext";

export function CodeLabApp() {
  const windowed = useIsWindowed();
  const { user } = useAuth();
  // Solving a problem is an in-place view, not a route change - clicking
  // "solve" while this app is an open window tab must never navigate the
  // tab out from under itself (see problem-card.jsx's onSolve).
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  // Grading/submission already requires a signed-in uid server-side (see
  // GradingService) - gate at the "solve" click itself instead of only at
  // submit time, so an anonymous visitor is prompted to log in up front
  // rather than writing code first and hitting the wall on submit.
  const handleSolve = (problemId) => {
    if (!user) { window.location.href = "/login?next=/codelab"; return; }
    setSelectedProblemId(problemId);
  };

  if (selectedProblemId) {
    return <ProblemView problemId={selectedProblemId} onBack={() => setSelectedProblemId(null)} />;
  }

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /codelab - practice.exe</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            CODE<span className="text-neon-cyan">LAB</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Real problems. Real grading. Ship better code.</p>
        </motion.div>

        <CodeLabHub onSolve={handleSolve} />
      </div>
    </main>
  );
}
