"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Laptop2, Users, Compass, MessagesSquare,
  Target, MessageCircle, Handshake, Zap, ShieldCheck,
  BookOpen, Hammer, Rocket, TrendingUp,
  HelpCircle, ChevronDown, ArrowUpRight,
} from "lucide-react";

const MODEL_STATS = [
  { label: "WORKPLACE MODEL", val: "Hybrid",              icon: Compass,        color: "#00FF41" },
  { label: "FLEXIBILITY",     val: "Flexible",             icon: Zap,            color: "#00FFFF" },
  { label: "COLLABORATION",   val: "Remote + In-person",   icon: Handshake,      color: "#C77DFF" },
];

const HOW_WE_WORK = [
  { icon: Laptop2,        color: "#00FF41", title: "Remote Collaboration",   body: "Team members collaborate remotely using digital communication, project management, development, and collaboration tools." },
  { icon: Users,          color: "#00FFFF", title: "In-Person Collaboration", body: "When useful, the team comes together for meetings, events, workshops, planning sessions, and activities that benefit from being in person." },
  { icon: Compass,        color: "#FF9500", title: "Flexible Execution",      body: "We focus on outcomes, ownership, communication, and execution rather than unnecessary constraints around where work happens." },
  { icon: MessagesSquare, color: "#C77DFF", title: "Team Connection",         body: "We create opportunities for team members to connect, exchange ideas, learn together, and build meaningful working relationships." },
];

const VALUES = [
  { label: "Ownership",      icon: Target },
  { label: "Communication",  icon: MessageCircle },
  { label: "Collaboration",  icon: Handshake },
  { label: "Execution",      icon: Zap },
  { label: "Trust",          icon: ShieldCheck },
];

const TOGETHER_MOMENTS = [
  "Team meetings",
  "Project planning",
  "Workshops",
  "Hackathons",
  "Technology events",
  "Community activities",
  "Brainstorming sessions",
  "Important team discussions",
];

const CULTURE_STEPS = [
  { label: "LEARN", icon: BookOpen,   color: "#00FF41" },
  { label: "BUILD", icon: Hammer,     color: "#00FFFF" },
  { label: "SHIP",  icon: Rocket,     color: "#FF9500" },
  { label: "GROW",  icon: TrendingUp, color: "#C77DFF" },
];

const FAQS = [
  { q: "Is DeVert fully remote?", a: "DeVert follows a flexible hybrid workplace model. Remote collaboration is an important part of how we work, while in-person collaboration takes place when useful or necessary." },
  { q: "Does DeVert have fixed office days?", a: "No fixed weekly office schedule is defined by this policy. In-person work depends on team needs, projects, meetings, events, and other activities." },
  { q: "Where does DeVert work from?", a: "DeVert supports flexible collaboration across remote and in-person environments. Specific locations may vary depending on the team, activity, event, or project." },
  { q: "How does DeVert maintain collaboration remotely?", a: "We rely on clear communication, digital collaboration tools, project coordination, regular updates, and shared ownership of work." },
  { q: "Will the workplace policy change as DeVert grows?", a: "The workplace model may evolve as DeVert grows. Any future changes will be made with the needs of the team, projects, and organization in mind." },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-white/6 rounded-lg overflow-hidden">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/2 transition-colors"
        aria-expanded={isOpen}
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

export default function WorkplacePage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen pt-16 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <p className="font-mono text-xs text-neon-green/55 mb-4 tracking-wider">// workplace.policy</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-6"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
            BUILT FOR FLEXIBILITY.<br /><span className="text-neon-cyan">DESIGNED FOR COLLABORATION.</span>
          </h1>
          <p className="font-mono text-sm text-white/45 leading-relaxed max-w-xl mb-8">
            DeVert operates with a flexible hybrid work model that combines remote collaboration
            with in-person work, meetings, events, and team activities when needed.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200 w-fit"
            style={{ borderColor: "#00FF41", color: "#00FF41" }}>
            [ EXPLORE_DEVERT ] <ArrowUpRight size={14} />
          </Link>
        </motion.div>

        {/* Workplace Model */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// workplace_model.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-5" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            OUR WORKPLACE <span className="text-neon-cyan">MODEL</span>
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed mb-6">
            Our team collaborates remotely while also coming together in person for meetings, planning
            sessions, events, workshops, team activities, and other situations where physical collaboration
            adds value. We believe flexibility lets people work effectively while still creating opportunities
            for meaningful collaboration and connection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MODEL_STATS.map(s => (
              <div key={s.label} className="terminal-window p-5">
                <s.icon size={16} style={{ color: s.color }} className="mb-3" />
                <p className="font-mono text-lg font-bold leading-none" style={{ color: s.color }}>{s.val}</p>
                <p className="font-mono text-[9px] text-white/25 tracking-wider mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* How We Work */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// how_we_work.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-6" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            HOW WE <span className="text-neon-cyan">WORK</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {HOW_WE_WORK.map(c => (
              <div key={c.title} className="terminal-window p-5">
                <c.icon size={16} style={{ color: c.color }} className="mb-3" />
                <p className="font-sans text-sm font-semibold text-white/85 mb-1.5">{c.title}</p>
                <p className="font-mono text-[11.5px] text-white/40 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Flexibility with Accountability */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// accountability.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-5" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            FLEXIBILITY WITH <span className="text-neon-cyan">ACCOUNTABILITY</span>
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed mb-6">
            Flexibility works best when it is supported by responsibility. We value clear communication,
            ownership of work, collaboration, reliability, and delivering on commitments - giving team
            members flexibility while maintaining the coordination required to build and ship meaningful work.
          </p>

          <div className="flex flex-wrap gap-3">
            {VALUES.map(v => (
              <div key={v.label} className="flex items-center gap-2 border border-white/8 rounded-full px-4 py-2">
                <v.icon size={13} className="text-neon-green/70" />
                <span className="font-mono text-xs text-white/60">{v.label}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* When We Come Together */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// in_person.log</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-5" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            WHEN WE COME <span className="text-neon-cyan">TOGETHER</span>
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed mb-6">
            Remote work is an important part of how DeVert operates, but some moments are better
            experienced together. In-person collaboration may happen when needed, when useful, or
            as appropriate for the activity - for things like:
          </p>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {TOGETHER_MOMENTS.map(m => (
              <div key={m} className="border-l-2 border-neon-green/20 pl-3">
                <p className="font-mono text-xs text-white/65">{m}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Culture */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// culture.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-5" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            A CULTURE BUILT AROUND <span className="text-neon-cyan">BUILDERS</span>
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed mb-8">
            DeVert brings together developers, creators, innovators, and builders who enjoy turning
            ideas into real-world outcomes. Our culture encourages people to learn continuously, build
            practically, share knowledge, take ownership, experiment with ideas, collaborate openly,
            and ship meaningful work.
          </p>

          <div className="terminal-window p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {CULTURE_STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <s.icon size={18} style={{ color: s.color }} />
                    <span className="font-mono text-xs tracking-widest" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  {i < CULTURE_STEPS.length - 1 && <ArrowUpRight size={14} className="text-white/15 rotate-45 sm:rotate-0" />}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Who This Model Is For */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// who_its_for.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-5" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            BUILT FOR MODERN <span className="text-neon-cyan">BUILDERS</span>
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed">
            Our flexible workplace approach supports the way modern technology teams work -
            combining focused remote work with intentional moments of in-person collaboration. Whether
            someone is writing code, designing a product, organizing a developer event, building a
            community initiative, or working on a new idea, we aim to provide the flexibility and
            collaboration needed to do meaningful work.
          </p>
        </motion.section>

        {/* A Simple Principle */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="font-mono text-[10px] text-white/25 ml-2">principle.md</span>
            </div>
            <div className="p-6">
              <p className="font-mono text-xs text-neon-cyan/60 tracking-wider mb-3">// a_simple_principle</p>
              <p className="font-mono text-sm text-white/60 leading-relaxed mb-3">
                <span className="text-neon-green/60">$</span> We care about what we build, how we work
                together, and the impact we create - not unnecessary boundaries around where productive
                work happens.
              </p>
              <p className="font-mono text-xs text-white/35 leading-relaxed">
                Our workplace model may evolve as DeVert grows, and we will continue adapting our
                approach to support our team, our projects, and our community.
              </p>
            </div>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={14} className="text-neon-green/55" />
            <p className="font-mono text-xs text-neon-green/55 tracking-wider">// faq.log</p>
          </div>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-6" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            QUESTIONS <span className="text-neon-cyan">ANSWERED</span>
          </h2>

          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <FaqItem key={i} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(p => p === i ? -1 : i)} />
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="terminal-window p-8 text-center">
          <h2 className="font-sans font-bold text-white tracking-tighter mb-3" style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)" }}>
            Build with DeVert.
          </h2>
          <p className="font-mono text-xs text-white/45 leading-relaxed mb-6 max-w-md mx-auto">
            Explore what we&apos;re building for the next generation of developers and digital builders.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200"
            style={{ borderColor: "#00FF41", color: "#00FF41" }}>
            [ EXPLORE_DEVERT ] <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
