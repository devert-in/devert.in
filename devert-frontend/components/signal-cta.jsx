"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

function GlitchJoinButton() {
  const [text, setText] = useState("[ ENTER_THE_HQ ]");
  const pool = "!@#$%01<>?";

  const scramble = () => {
    let i = 0;
    const orig = "[ ENTER_THE_HQ ]";
    const iv = setInterval(() => {
      setText(
        orig.split("").map((c, idx) =>
          idx < i ? orig[idx] : (c === " " || c === "_" || c === "[" || c === "]" ? c : pool[Math.floor(Math.random() * pool.length)])
        ).join("")
      );
      i += 0.9;
      if (i > orig.length) { clearInterval(iv); setText(orig); }
    }, 38);
  };

  return (
    <Link href="/login">
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(0,255,65,0.25)" }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={scramble}
        className="font-mono text-sm font-bold text-black px-10 py-4 transition-all"
        style={{ background: "#00FF41" }}
      >
        {text}
      </motion.button>
    </Link>
  );
}

export function SignalCta() {
  return (
    <section className="px-6 py-24 relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,255,65,0.04) 0%, transparent 70%)" }}
      />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-mono text-sm text-white/28 mb-4"
        >
          // 847 builders already inside. The door is still open.
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="font-sans font-bold text-white tracking-tighter mb-4 leading-none"
          style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
        >
          READY TO <span className="text-neon-green text-glow-green">DEVERT?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.16 }}
          className="font-mono text-sm text-white/32 mb-10 max-w-md mx-auto"
        >
          $ ssh devert.in —— your next level awaits inside.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22, type: "spring", stiffness: 200 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <GlitchJoinButton />
          <Link href="/intel">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-mono text-sm text-white/45 border border-white/10 px-10 py-4 hover:border-white/25 hover:text-white/70 transition-all"
            >
              [ EXPLORE_FIRST ]
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
