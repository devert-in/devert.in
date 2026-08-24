"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wifi, Cpu } from "lucide-react";
import { HackathonSpotlight } from "@/components/hackathon-spotlight";

function GlitchButton({ children, href, primary }) {
  const [text, setText] = useState(children);
  const pool = "!@#$%01<>?";

  const scramble = () => {
    let i = 0;
    const orig = children;
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
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={scramble}
        className="font-mono text-sm px-6 py-3 border transition-all duration-200"
        style={primary ? {
          borderColor: "#00FFFF",
          color: "#00FFFF",
          boxShadow: "0 0 20px rgba(0,255,255,0.15)",
        } : {
          borderColor: "rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.5)",
        }}
        onMouseOver={e => {
          if (primary) {
            e.currentTarget.style.background = "rgba(0,255,255,0.08)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(0,255,255,0.25)";
          } else {
            e.currentTarget.style.borderColor = "rgba(0,255,65,0.4)";
            e.currentTarget.style.color = "#00FF41";
          }
        }}
        onMouseOut={e => {
          if (primary) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0,255,255,0.15)";
          } else {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }
        }}
      >
        {text}
      </motion.button>
    </Link>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 22 } },
};

export function Hero() {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={container}
      className="relative min-h-screen lg:min-h-[calc(100vh-5rem)] flex flex-col justify-center pt-8 pb-20 px-6 overflow-hidden"
    >
      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      {/* Synthwave horizon - animated sun + scrolling perspective grid,
          see .synth-scene in globals.css */}
      <div className="synth-scene opacity-70">
        <div className="synth-sun" />
        <div className="synth-horizon-line" />
        <div className="synth-grid-floor" />
      </div>
      {/* Radial glow, ties the scene into the rest of the section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,255,255,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto w-full">
        {/* Status bar */}
        <motion.div variants={item} className="flex items-center gap-3 font-mono text-xs text-white/25 border-b border-white/5 pb-4 mb-12 flex-wrap gap-y-2">
          <span className="flex items-center gap-1.5">
            <Wifi size={10} className="text-neon-green" style={{ animation: "pulse 2s infinite" }} />
            <span className="text-neon-green">SYSTEM: ONLINE</span>
          </span>
          <span className="text-white/10">|</span>
          <span className="flex items-center gap-1.5">
            <Cpu size={10} />
            DeVert OS v2.0
          </span>
          <span className="text-white/10">|</span>
          <span>Mumbai, IN - asia-south1</span>
          <Link href="/login" className="ml-auto font-mono text-xs font-bold text-black px-3 py-1 transition-all hover:opacity-85"
            style={{ background: "#00FF41" }}>
            [ ENTER_HQ ]
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.p variants={item} className="font-mono text-xs mb-4 tracking-widest" style={{ color: "rgba(0,255,65,0.55)" }}>
          // ACCESS GRANTED. WELCOME TO THE HEADQUARTERS.
        </motion.p>

        <motion.h1
          variants={item}
          className="font-sans font-bold tracking-tighter text-white leading-none mb-10"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6.5rem)" }}
        >
          YOU ARE NOW<br />
          <span className="text-neon-cyan text-glow-cyan">INSIDE DEVERT.</span>
        </motion.h1>

        <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
          <GlitchButton href="/build" primary>[ START_BUILDING ]</GlitchButton>
          <GlitchButton href="/intel" primary={false}>[ EXPLORE_INTEL ]</GlitchButton>
        </motion.div>

        {/* Renders nothing if there's no active/upcoming hackathon - same
            component and "one loud spotlight" rule as the signed-in HQ
            dashboard, so a signed-out visitor sees it too instead of it
            being buried behind a login. */}
        <motion.div variants={item} className="max-w-2xl mb-6 md:mb-0">
          <HackathonSpotlight />
        </motion.div>
      </div>

      {/* Scroll indicator - hidden on mobile to avoid overlap with buttons */}
      <motion.div
        variants={item}
        className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] text-white/18">scroll to explore</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, rgba(0,255,255,0.3), transparent)" }}
        />
      </motion.div>
    </motion.section>
  );
}
