"use client";

// Horizontally-scrolling notice ticker for the /prep hub. Content is
// duplicated once and animated by exactly one copy's width so the loop
// is seamless; falls back to a static row of items on measurement misses.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { cn } from "@/components/prep/ui";

export default function AnnouncementTicker({ items = [], loading = false, className }) {
  const trackRef = useRef(null);
  const [halfWidth, setHalfWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setHalfWidth(trackRef.current.scrollWidth / 2);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  if (loading) {
    return (
      <div className={cn("terminal-window px-4 py-3", className)}>
        <div className="h-3.5 w-2/3 max-w-md rounded bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!items.length) return null;

  const duration = Math.max(18, halfWidth / 42);

  return (
    <div className={cn("terminal-window overflow-hidden", className)}>
      <div className="flex items-stretch">
        <div className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 border-r border-white/8 bg-white/[0.03]">
          <Megaphone size={12} className="text-neon-green" />
          <span className="font-mono text-[10px] tracking-wider text-neon-green/80">NOTICES</span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden py-2.5">
          <motion.div
            ref={trackRef}
            className="flex items-center gap-10 whitespace-nowrap w-max pl-6"
            animate={halfWidth ? { x: [0, -halfWidth] } : undefined}
            transition={halfWidth ? { duration, ease: "linear", repeat: Infinity } : undefined}
          >
            {[...items, ...items].map((a, i) =>
              a.link ? (
                <a
                  key={`${a.id}-${i}`}
                  href={a.link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-white/55 hover:text-neon-cyan transition-colors"
                >
                  {a.text}
                </a>
              ) : (
                <span key={`${a.id}-${i}`} className="font-mono text-xs text-white/55">
                  {a.text}
                </span>
              )
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
