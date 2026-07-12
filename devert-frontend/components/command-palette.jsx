"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Home, Swords, Anchor, Radio, Target, Zap, Tv2, Trophy, ScrollText, LogIn, Terminal, X, User, GraduationCap } from "lucide-react";

const COMMANDS = [
  { icon: Home,       label: "Home",      desc: "Command Center",         href: "/" },
  { icon: Swords,     label: "Arena",     desc: "Code Combat",            href: "/arena" },
  { icon: Anchor,     label: "Shipyard",  desc: "Project Launchpad",      href: "/shipyard" },
  { icon: Radio,      label: "Intel",     desc: "Dev Intelligence Feed",  href: "/intel" },
  { icon: Target,     label: "Missions",  desc: "Hackathons as Missions", href: "/missions" },
  { icon: Zap,        label: "Grind",     desc: "Daily Challenges",       href: "/grind" },
  { icon: GraduationCap, label: "Prep",   desc: "Placements Prep Portal", href: "/prep" },
  { icon: Tv2,        label: "Broadcast", desc: "DevCast Live",           href: "/broadcast" },
  { icon: Trophy,     label: "Ranks",     desc: "Tier Leaderboard",       href: "/ranks" },
  { icon: ScrollText, label: "Logs",      desc: "System Changelog",       href: "/logs" },
  { icon: User,       label: "Dev Card",  desc: "Your Profile & Stats",   href: "/profile" },
  { icon: LogIn,      label: "Login",     desc: "SSH into DeVert",        href: "/login" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const navigate = useCallback((href) => {
    router.push(href);
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, [router]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Custom event from dock button
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-command-palette", handleOpen);
    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  // Arrow key navigation inside palette
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) navigate(filtered[selected].href);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, filtered, selected, navigate]);

  // Reset selection when query changes
  useEffect(() => { setSelected(0); }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative w-full max-w-lg terminal-window"
            style={{ boxShadow: "0 0 80px rgba(0,255,255,0.08), 0 2px 40px rgba(0,0,0,0.8)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Title bar */}
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/80" />
              <div className="terminal-dot bg-yellow-500/80" />
              <div className="terminal-dot bg-green-500/80" />
              <Terminal size={11} className="ml-2 text-white/25" />
              <span className="font-mono text-[11px] text-white/25 ml-1">devert — command_palette</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
              <span className="font-mono text-neon-cyan text-sm flex-shrink-0">$</span>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="navigate to..."
                className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-white/20 outline-none"
              />
              <span className="font-mono text-[10px] text-white/18 border border-white/10 px-1.5 py-0.5 rounded flex-shrink-0">ESC</span>
            </div>

            {/* Results list */}
            <div className="py-1.5 max-h-72 overflow-y-auto">
              {filtered.length > 0 ? filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <motion.button
                    key={cmd.href}
                    onClick={() => navigate(cmd.href)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: selected === i ? "rgba(0,255,255,0.05)" : "transparent" }}
                  >
                    <Icon
                      size={13}
                      style={{ color: selected === i ? "#00FFFF" : "rgba(255,255,255,0.28)", flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`font-mono text-sm ${selected === i ? "text-neon-cyan" : "text-white/75"}`}>
                        {cmd.label}
                      </span>
                      <span className="font-mono text-xs text-white/25 ml-2 truncate">// {cmd.desc}</span>
                    </div>
                    {selected === i && (
                      <span className="font-mono text-[10px] text-neon-cyan/40 border border-neon-cyan/20 px-1.5 py-0.5 rounded flex-shrink-0">
                        ↵
                      </span>
                    )}
                  </motion.button>
                );
              }) : (
                <div className="px-4 py-8 text-center font-mono text-sm text-white/25">
                  // no results for &quot;{query}&quot;
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-white/5 px-4 py-2.5 flex items-center gap-4">
              {[["↑↓","navigate"],["↵","select"],["esc","close"]].map(([key, action]) => (
                <span key={key} className="flex items-center gap-1.5 font-mono text-[10px] text-white/20">
                  <span className="border border-white/12 px-1 rounded">{key}</span>
                  {action}
                </span>
              ))}
              <span className="ml-auto font-mono text-[10px] text-white/15">ctrl+k</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
