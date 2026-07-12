"use client";

import { motion } from "framer-motion";
import { Award, TrendingUp, Users } from "lucide-react";

const stats = [
  { label: "2,000+ Offers", icon: TrendingUp },
  { label: "Top CTC: 24 LPA", icon: Award },
  { label: "500+ Top Recruiters", icon: Users },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-gradient">
      <div className="bg-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-full border border-gold-500/40 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-100"
        >
          Malla Reddy College of Engineering & Technology
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
        >
          MRCET Campus — <span className="text-gold-gradient">Brand of Excellence</span> in Campus Placements
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-2xl text-base text-white/70 sm:text-lg"
        >
          Empowering engineers with data-driven placement insights, verified company profiles, and a
          community-powered interview experience archive.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {stats.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="glass flex flex-col items-center gap-2 rounded-2xl px-4 py-5 text-white"
            >
              <Icon className="text-gold-500" size={22} />
              <span className="text-sm font-bold sm:text-base">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
