"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Home, Swords, Anchor, Radio, Target, Zap, Tv2, Trophy,
  ScrollText, LogIn, X, User, Activity, Flame, Users,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query as fsQuery, where, getDocs, limit } from "firebase/firestore";

const NAV_COMMANDS = [
  { icon: Home,       label: "Home",       desc: "Command Center",         href: "/" },
  { icon: Swords,     label: "Arena",      desc: "Code Combat",            href: "/arena" },
  { icon: Anchor,     label: "Shipyard",   desc: "Project Launchpad",      href: "/shipyard" },
  { icon: Radio,      label: "Intel",      desc: "Dev Intelligence Feed",  href: "/intel" },
  { icon: Target,     label: "Missions",   desc: "Hackathons as Missions", href: "/missions" },
  { icon: Zap,        label: "Grind",      desc: "Daily Challenges",       href: "/grind" },
  { icon: Activity,   label: "Pulse",      desc: "Dev Social Feed",        href: "/pulse" },
  { icon: Tv2,        label: "Broadcast",  desc: "DevCast Live",           href: "/broadcast" },
  { icon: Trophy,     label: "Ranks",      desc: "Tier Leaderboard",       href: "/ranks" },
  { icon: Flame,      label: "Hackathons", desc: "Active Hackathons",      href: "/hackathons" },
  { icon: ScrollText, label: "Logs",       desc: "System Changelog",       href: "/logs" },
  { icon: User,       label: "Dev Card",   desc: "Your Profile & Stats",   href: "/profile" },
  { icon: LogIn,      label: "Login",      desc: "SSH into DeVert",        href: "/login" },
];

// Unicode high surrogate - Firestore prefix-range upper bound
const RANGE_END = "";

function getTier(xp = 0) {
  if (xp >= 10000) return { name: "LEGEND",    color: "#FFD700" };
  if (xp >= 5000)  return { name: "ELITE",     color: "#FF6430" };
  if (xp >= 2000)  return { name: "ARCHITECT", color: "#00FFFF" };
  if (xp >= 500)   return { name: "BUILDER",   color: "#00FF41" };
  return                  { name: "RECRUIT",   color: "#888888" };
}

function UserRow({ u, selected, onClick, onHover }) {
  const tier = getTier(u.xp);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
      style={{ background: selected ? "rgba(0,255,65,0.05)" : "transparent" }}
    >
      {u.photoURL ? (
        <img src={u.photoURL} alt={u.displayName || u.handle}
          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          style={{ border: "1px solid rgba(0,255,65,0.25)" }}
        />
      ) : (
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0"
          style={{ background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.2)", color: "#00FF41" }}>
          {(u.handle?.[0] || "?").toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className={`font-mono text-sm ${selected ? "text-neon-green" : "text-white/75"}`}>
          {u.displayName || u.handle}
        </span>
        <span className="font-mono text-[10px] text-white/30 ml-2">@{u.handle}</span>
      </div>
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ color: tier.color, background: `${tier.color}18`, border: `1px solid ${tier.color}28` }}>
        {tier.name}
      </span>
      {selected && (
        <span className="font-mono text-[10px] text-neon-green/40 border border-neon-green/20 px-1.5 py-0.5 rounded flex-shrink-0">
          ↵
        </span>
      )}
    </motion.button>
  );
}

export function CommandPalette() {
  const [open,     setOpen]     = useState(false);
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState(0);
  const [users,    setUsers]    = useState([]);
  const [uLoading, setULoading] = useState(false);
  const debounceRef = useRef(null);
  const router = useRouter();

  const isUserSearch = query.trimStart().startsWith("@");
  const rawTerm = isUserSearch ? query.trimStart().slice(1).trim() : query.trim();

  const filteredNav = isUserSearch
    ? []
    : query.trim()
      ? NAV_COMMANDS.filter(c =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.desc.toLowerCase().includes(query.toLowerCase())
        )
      : NAV_COMMANDS;

  const allItems = [
    ...filteredNav.map(c => ({ type: "nav",  data: c })),
    ...users.map(u =>       ({ type: "user", data: u })),
  ];

  const navigate = useCallback((href) => {
    router.push(href);
    setOpen(false);
    setQuery("");
    setSelected(0);
    setUsers([]);
  }, [router]);

  /* ── user search with debounce ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = rawTerm.toLowerCase();
    if (term.length < 2) { setUsers([]); return; }

    debounceRef.current = setTimeout(async () => {
      setULoading(true);
      try {
        const col = collection(db, "users");
        const ub  = term + RANGE_END;

        // Try handle + displayNameLower prefix search simultaneously
        const [byHandle, byName] = await Promise.all([
          getDocs(fsQuery(col, where("handle",           ">=", term), where("handle",           "<=", ub), limit(6))),
          getDocs(fsQuery(col, where("displayNameLower", ">=", term), where("displayNameLower", "<=", ub), limit(6))),
        ]);

        const seen = new Set();
        const results = [];
        [...byHandle.docs, ...byName.docs].forEach(d => {
          if (!seen.has(d.id)) { seen.add(d.id); results.push({ uid: d.id, ...d.data() }); }
        });
        setUsers(results.slice(0, 8));
      } catch {
        // displayNameLower field may not exist on older docs - fall back to handle-only
        try {
          const term2 = rawTerm.toLowerCase();
          const col2  = collection(db, "users");
          const snap  = await getDocs(
            fsQuery(col2, where("handle", ">=", term2), where("handle", "<=", term2 + RANGE_END), limit(8))
          );
          setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
        } catch { setUsers([]); }
      }
      setULoading(false);
    }, 280);

    return () => clearTimeout(debounceRef.current);
  }, [rawTerm]);

  /* ── global keyboard shortcut ── */
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(p => !p); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ── dock button event ── */
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-command-palette", h);
    return () => window.removeEventListener("open-command-palette", h);
  }, []);

  /* ── arrow key navigation ── */
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && allItems[selected]) {
        const item = allItems[selected];
        if (item.type === "nav")  navigate(item.data.href);
        if (item.type === "user") navigate(`/u/${item.data.handle}`);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, allItems, selected, navigate]);

  useEffect(() => { setSelected(0); }, [query]);

  const placeholder = isUserSearch ? "search deverts by @handle..." : "navigate or search deverts...";

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
              <img src="/logo.png" alt="" className="ml-2 w-3.5 h-3.5 object-contain rounded opacity-70" />
              <span className="font-mono text-[11px] text-white/25 ml-1">devert - command_palette</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-white/25 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
              <span className="font-mono text-sm flex-shrink-0"
                style={{ color: isUserSearch ? "#00FF41" : "#00FFFF" }}>
                {isUserSearch ? "@" : "$"}
              </span>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-white/20 outline-none"
              />
              {uLoading && (
                <span className="w-3.5 h-3.5 border border-white/15 border-t-neon-green/60 rounded-full animate-spin flex-shrink-0" />
              )}
              <span className="font-mono text-[10px] text-white/18 border border-white/10 px-1.5 py-0.5 rounded flex-shrink-0">ESC</span>
            </div>

            {/* Results */}
            <div className="py-1.5 max-h-80 overflow-y-auto">

              {/* Pages section */}
              {filteredNav.length > 0 && (
                <>
                  {users.length > 0 && (
                    <p className="font-mono text-[9px] text-white/18 tracking-widest px-4 pt-2 pb-1">PAGES</p>
                  )}
                  {filteredNav.map((cmd, i) => {
                    const Icon = cmd.icon;
                    const sel  = selected === i;
                    return (
                      <motion.button
                        key={cmd.href}
                        onClick={() => navigate(cmd.href)}
                        onMouseEnter={() => setSelected(i)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{ background: sel ? "rgba(0,255,255,0.05)" : "transparent" }}
                      >
                        <Icon size={13} style={{ color: sel ? "#00FFFF" : "rgba(255,255,255,0.28)", flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <span className={`font-mono text-sm ${sel ? "text-neon-cyan" : "text-white/75"}`}>{cmd.label}</span>
                          <span className="font-mono text-xs text-white/25 ml-2 truncate">// {cmd.desc}</span>
                        </div>
                        {sel && (
                          <span className="font-mono text-[10px] text-neon-cyan/40 border border-neon-cyan/20 px-1.5 py-0.5 rounded flex-shrink-0">
                            ↵
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </>
              )}

              {/* Users section */}
              {users.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                    <p className="font-mono text-[9px] text-white/18 tracking-widest">DEVERTS</p>
                    <Users size={9} className="text-white/15" />
                  </div>
                  {users.map((u, i) => {
                    const globalIdx = filteredNav.length + i;
                    return (
                      <UserRow
                        key={u.uid}
                        u={u}
                        selected={selected === globalIdx}
                        onClick={() => navigate(`/u/${u.handle}`)}
                        onHover={() => setSelected(globalIdx)}
                      />
                    );
                  })}
                </>
              )}

              {/* Empty state */}
              {filteredNav.length === 0 && users.length === 0 && !uLoading && query.length > 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-sm text-white/25">
                    {rawTerm.length >= 2
                      ? `// no deverts found for "${rawTerm}"`
                      : `// no results for "${query}"`}
                  </p>
                  {rawTerm.length < 2 && !isUserSearch && (
                    <p className="font-mono text-[10px] text-white/15 mt-2">type @ to search deverts by handle</p>
                  )}
                </div>
              )}

              {/* First-open hint */}
              {!query && (
                <div className="px-4 pb-2">
                  <p className="font-mono text-[9px] text-white/15 mt-1">
                    type <span className="text-neon-green/40">@</span> to find deverts &nbsp;·&nbsp; type a page name to navigate
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
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
