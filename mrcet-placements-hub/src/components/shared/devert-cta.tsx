"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function DevertCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl bg-navy-gradient px-6 py-14 text-center sm:px-12"
    >
      <div className="bg-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-100">
          <Sparkles size={14} className="text-gold-500" />
          Official Practice Partner
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Level Up Your Placement Prep with Devert
        </h2>
        <p className="max-w-xl text-sm text-white/70 sm:text-base">
          The official skill development, mock test, and interactive coding practice ecosystem for MRCET engineers.
        </p>
        <a
          href="https://devert.in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-bold text-navy-950 shadow-[0_0_30px_-6px_rgba(255,176,0,0.8)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_44px_-4px_rgba(255,176,0,0.95)]"
        >
          Launch Practice Portal on Devert
          <ArrowRight size={16} />
        </a>
      </div>
    </motion.section>
  );
}
