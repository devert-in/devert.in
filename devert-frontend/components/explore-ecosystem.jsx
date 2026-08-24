"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap, Flame, Hammer, Anchor, Activity, Radio,
  GitFork, FlaskConical, Newspaper, Building2, ArrowUpRight,
} from "lucide-react";

// The DeVert ecosystem, one level up from core-features.jsx's individual
// tools - these are the product-level children (some real today, some
// "coming soon" shells), not modules within core DeVert. Deliberately a
// homepage SECTION, not new persistent-nav entries - CLAUDE.md's rule
// against nav bloat still applies, and half of these have no backend yet.
const ECOSYSTEM = [
  { icon: GraduationCap, color: "#00FFFF", title: "CAMPUS",        href: "https://campus.devert.in", body: "Learn, practice and prepare for placements - per-institution workspaces.", live: true },
  { icon: Flame,         color: "#FF6430", title: "EVENTS",        href: "/events",        body: "Hackathons, workshops, meetups and open mics.", live: true },
  { icon: Anchor,        color: "#00FF41", title: "SHOWCASE",      href: "/showcase",      body: "Dock your projects, get liked and commented on by the community.", live: true },
  { icon: Activity,      color: "#C77DFF", title: "COMMUNITY",     href: "/community",     body: "Dev social feed, plus topic and campus communities.", live: true },
  { icon: Radio,         color: "#FFD700", title: "OPPORTUNITIES", href: "/opportunities", body: "Internships, jobs, fellowships and open-source programs.", live: true },
  { icon: Hammer,        color: "#FF9500", title: "BUILD",         href: "/build",        body: "Guided build challenges and sprints.", live: false },
  { icon: GitFork,       color: "#00FF41", title: "OPEN SOURCE",   href: "/open-source",  body: "Find your first real, tracked contribution.", live: false },
  { icon: FlaskConical,  color: "#00FFFF", title: "LABS",          href: "/labs",         body: "A developer playground - AI, APIs, databases, cloud.", live: false },
  { icon: Newspaper,     color: "#FFD700", title: "STORIES",       href: "/stories",      body: "Real developer journeys from the community.", live: false },
  { icon: Building2,     color: "#C77DFF", title: "ORGANIZATIONS", href: "/organizations", body: "Companies and developer orgs, on the developer side of DeVert.", live: false },
];

export function ExploreEcosystem() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// explore.devert</p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            THE <span className="text-neon-cyan">DEVERT UNIVERSE</span>
          </h2>
          <p className="font-mono text-sm text-white/35 mt-3 max-w-lg">
            Learn. Build. Compete. Connect. Create. Contribute. One identity across all of it.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ staggerChildren: 0.06 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ECOSYSTEM.map(p => (
            <motion.div key={p.title} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } } }}>
              <Link href={p.href}>
                <motion.div whileHover={{ y: -4, borderColor: `${p.color}40` }}
                  className="terminal-window p-5 h-full transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <p.icon size={18} style={{ color: p.color }} />
                    {p.live
                      ? <ArrowUpRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors" />
                      : <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>SOON</span>}
                  </div>
                  <h3 className="font-sans text-sm font-bold text-white mb-2 tracking-wide">{p.title}</h3>
                  <p className="font-mono text-[11px] text-white/35 leading-relaxed">{p.body}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
