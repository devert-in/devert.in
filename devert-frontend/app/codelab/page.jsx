"use client";

import { motion } from "framer-motion";
import { CodeLabHub } from "@/components/codelab/codelab-hub";

export default function CodeLabPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /codelab - practice.exe</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            CODE<span className="text-neon-cyan">LAB</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Real problems. Real grading. Ship better code.</p>
        </motion.div>

        <CodeLabHub />
      </div>
    </main>
  );
}
