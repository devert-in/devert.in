"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  { q: "Is DeVert free to use?", a: "Yes. Signing up, the Daily Grind, Arena, Shipyard, and Missions are all free. Pulse coins earned from community engagement can be converted to real payouts once you cross the minimum threshold." },
  { q: "Do I need to be an expert to start?", a: "No. RECRUIT is the entry rank for anyone who joins - the Daily Grind and early missions are built to be a realistic starting point, not a gatekeeping exam." },
  { q: "How does ranking work?", a: "XP earned from Arena wins, shipped projects, and missions moves you up the tier ladder (RECRUIT → BUILDER → ARCHITECT → ELITE → LEGEND). Check /ranks for the full breakdown of requirements and perks." },
  { q: "What is Pulse?", a: "Pulse is DeVert's command center - your dashboard after logging in, plus a community feed where builders share tips, wins, and code. Likes, comments, and saves on your posts earn coins." },
  { q: "Can I use DeVert on mobile?", a: "Yes, the entire platform is responsive, including the Arena timer and Shipyard submission flow." },
  { q: "Who's behind DeVert?", a: "Two developers who got tired of mediocre dev content and built the platform they wished existed. See the Duo Terminal section above for the full story." },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-white/6 rounded-lg overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/2 transition-colors"
      >
        <span className="font-sans text-sm text-white/80">{item.q}</span>
        <ChevronDown size={14} className="text-white/25 flex-shrink-0 transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-mono text-[12px] text-white/35 leading-relaxed px-5 pb-4">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle size={14} className="text-neon-green/55" />
            <p className="font-mono text-xs text-neon-green/55 tracking-wider">// faq.log</p>
          </div>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            QUESTIONS <span className="text-neon-cyan">ANSWERED</span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map((item, i) => (
            <FaqItem key={i} item={item} isOpen={openIndex === i} onToggle={() => setOpenIndex(p => p === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
