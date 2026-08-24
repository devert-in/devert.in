"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, BookOpen, ClipboardCheck, Trophy, Users, ArrowUpRight, Building2 } from "lucide-react";
import { fetchPublishedContests, bucketContests } from "@/lib/contests";
import { fetchInstitutions } from "@/lib/institutions";

// Real numbers only - same convention as platform-stats.jsx (institutions +
// active contests, not a fabricated "10,000+ students" line). Two cheap
// reads, not the N-institution fan-out the actual Campus directory does for
// its own per-college student counts. fetchInstitutions() (not a raw
// getDocs(collection(db,"institutions"))) is required here, not just
// tidier - a bare unfiltered institutions query was emulator-confirmed to
// actually return a private institution's full document (name,
// contactEmail, etc.) to an anonymous visitor despite firestore.rules'
// per-document accessMode check, for reasons specific to an unconstrained
// list() with no where() clause at all. fetchInstitutions() already
// structurally excludes private/inactive institutions via its own
// where("accessMode","in",[...]) filter, which is safe under list mode
// (verified elsewhere this session) - reuse it rather than re-deriving a
// second, differently-shaped query for the same collection.
function useCampusStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.allSettled([
      fetchInstitutions(),
      fetchPublishedContests(),
    ]).then(([instRes, contestsRes]) => {
      const institutions = instRes.status === "fulfilled" ? instRes.value.length : 0;
      const contests = contestsRes.status === "fulfilled" ? contestsRes.value : [];
      const bucketed = bucketContests(contests);
      setStats({ institutions, activeContests: bucketed.live.length + bucketed.upcoming.length });
    }).catch(() => setStats({ institutions: 0, activeContests: 0 }));
  }, []);
  return stats;
}

const FEATURES = [
  { icon: BookOpen,       label: "Daily Learning",   body: "Notes & practice, published by your own faculty." },
  { icon: ClipboardCheck, label: "Weekly Assessments", body: "Scheduled, negative-marked tests with real analytics." },
  { icon: Trophy,         label: "Coding Contests",  body: "Your own contests, on the same engine as Arena." },
  { icon: Users,          label: "Bulk Onboarding",  body: "CSV roster import - your students, approved in minutes." },
];

export function CampusPreview() {
  const stats = useCampusStats();

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy side */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider"
            >
              // campus.network --for institutions
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-sans font-bold text-white tracking-tighter mb-5"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              NOT JUST A PLATFORM. <span className="text-neon-cyan">YOUR CAMPUS.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-mono text-sm text-white/40 mb-8 leading-relaxed max-w-lg"
            >
              DeVert Campus turns your college&apos;s Training &amp; Placement Cell into a real
              LMS, contest engine, and leaderboard - gated to your own students, run by your own
              faculty. Students get structured placement prep. Institutions get a portal they
              actually own, not a login page bolted onto someone else&apos;s product.
            </motion.p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ staggerChildren: 0.07 }}
              className="grid sm:grid-cols-2 gap-3 mb-9"
            >
              {FEATURES.map(f => (
                <motion.div
                  key={f.label}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  className="flex items-start gap-2.5"
                >
                  <f.icon size={15} className="text-neon-cyan/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-[12.5px] font-semibold text-white/85">{f.label}</p>
                    <p className="font-mono text-[10.5px] text-white/30 leading-relaxed">{f.body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link href="https://campus.devert.in">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200 cursor-pointer"
                  style={{ borderColor: "#00FFFF", color: "#00FFFF" }}
                >
                  [ ENTER_CAMPUS ] <ArrowUpRight size={14} />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Preview side - a "look inside" terminal card, real numbers only */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="terminal-window"
          >
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">campus.devert.in</span>
            </div>
            {/* Real product screenshot, not a mock - an approved student's
                actual dashboard. Cropped to its top band (sidebar + welcome
                header + stat pills) and faded into the dark card below since
                Campus itself runs a light, orange-accented theme (see
                lib/campus-theme.js) that would otherwise hard-cut against
                this card's near-black chrome. */}
            <div className="relative h-52 overflow-hidden">
              <img
                src="/campus-dashboard-preview.png"
                alt="A student's DeVert Campus dashboard, showing Daily Learning, Contests and Leaderboard navigation with weekly XP and coins progress"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(5,5,5,0.95) 100%)" }} />
            </div>
            <div className="p-6 pt-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,255,0.1)" }}>
                  <GraduationCap size={19} className="text-neon-cyan" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-white">DeVert Campus</p>
                  <p className="font-mono text-[10px] text-white/30">structured learning &amp; placement prep</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="border border-white/8 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-white/25">
                    <Building2 size={11} /> <span className="font-mono text-[9px] tracking-wider">INSTITUTIONS</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-neon-cyan">
                    {stats ? stats.institutions.toLocaleString() : "…"}
                  </p>
                </div>
                <div className="border border-white/8 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-white/25">
                    <Trophy size={11} /> <span className="font-mono text-[9px] tracking-wider">ACTIVE CONTESTS</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-neon-green">
                    {stats ? stats.activeContests.toLocaleString() : "…"}
                  </p>
                </div>
              </div>

              <p className="font-mono text-[10.5px] text-white/25 leading-relaxed">
                <span className="text-neon-green/60">$</span> Run by your own Training &amp; Placement Cell.<br />
                <span className="text-neon-green/60">$</span> Every college gets its own gated workspace.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
