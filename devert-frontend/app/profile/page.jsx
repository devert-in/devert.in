"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Terminal, Star, Copy, GitCommit, LogOut, User } from "lucide-react";

const DEMO_SKILLS = [
  { name: "JavaScript", level: 70 },
  { name: "React",      level: 65 },
  { name: "Node.js",    level: 55 },
  { name: "Git",        level: 75 },
];

const ACTIVITY_COLORS = {
  ship:    "#00FFFF",
  arena:   "#FF9500",
  grind:   "#00FF41",
  rank:    "#FFD700",
  mission: "#C77DFF",
};

function StatBox({ label, value, color }) {
  return (
    <div className="border border-white/6 rounded-lg p-2.5 text-center">
      <div className="font-mono text-base font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="font-mono text-[9px] text-white/25 tracking-wider">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => { await logout(); router.push("/"); };

  const isLoggedIn  = !!user;
  const handle      = userData?.handle || user?.email?.split("@")[0] || "guest";
  const displayName = userData?.displayName || handle;
  const bio         = userData?.bio || "Builder. Ships things.";
  const tier        = userData?.tier || { name: "RECRUIT", color: "#888888" };
  const xp          = userData?.xp ?? 0;
  const credits     = userData?.credits ?? 0;
  const ships       = userData?.ships ?? 0;
  const arenaWins   = userData?.arenaWins ?? 0;
  const streak      = userData?.streak ?? 0;
  const skills      = userData?.skills?.length ? userData.skills : DEMO_SKILLS;
  const activity    = userData?.recentActivity || [];

  const stats = [
    { label: "XP_TOTAL",   value: xp.toLocaleString(), color: "#00FFFF" },
    { label: "SHIPS",      value: String(ships),        color: "#00FF41" },
    { label: "ARENA_WINS", value: String(arenaWins),    color: "#FF9500" },
    { label: "STREAK",     value: `${streak}d`,         color: "#FF6430" },
  ];

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /profile — dev_card.json</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>
            DEV <span className="text-neon-cyan">CARD</span>
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Identity */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Terminal size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">identity.json</span>
              </div>
              <div className="p-5">
                {/* Avatar */}
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt={displayName}
                    className="w-16 h-16 rounded-2xl object-cover mb-4"
                    style={{ border: "1px solid rgba(0,255,255,0.2)" }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 font-mono font-bold text-2xl"
                    style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)", color: "#00FFFF" }}
                  >
                    {isLoggedIn ? handle[0]?.toUpperCase() : <User size={24} />}
                  </div>
                )}

                <h2 className="font-sans text-xl font-bold text-white mb-1">{displayName}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                    {tier.name}
                  </span>
                  <span className="font-mono text-xs text-white/30">· devert.in</span>
                </div>

                <p className="font-mono text-xs text-white/38 mb-5 leading-relaxed">{bio}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {stats.map(s => <StatBox key={s.label} {...s} />)}
                </div>

                {/* Credits */}
                <div className="border border-white/6 rounded-lg px-3 py-2 flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] text-white/30">CREDITS</span>
                  <span className="font-mono text-sm font-bold" style={{ color: "#FFD700" }}>{credits.toLocaleString()}</span>
                </div>

                <motion.button whileHover={{ scale: 1.01 }}
                  className="w-full font-mono text-xs text-white/35 border border-white/8 py-2.5 hover:border-neon-cyan/25 hover:text-neon-cyan transition-all flex items-center justify-center gap-2 mb-2"
                >
                  <Copy size={11} /> copy profile link
                </motion.button>

                {isLoggedIn && (
                  <motion.button onClick={handleLogout}
                    whileHover={{ scale: 1.01, borderColor: "rgba(255,80,80,0.3)", color: "#FF5050" }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full font-mono text-xs text-white/25 border border-white/6 py-2.5 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={11} /> logout
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Skills + Activity */}
          <div className="lg:col-span-2 space-y-5">
            {/* Skills */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <Star size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">skills.profile</span>
                </div>
                <div className="p-5 space-y-3">
                  {skills.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-4">
                      <span className="font-mono text-xs text-white/45 w-28 flex-shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.level}%` }}
                          transition={{ delay: 0.3 + i * 0.06, duration: 0.7 }}
                          className="h-full rounded-full"
                          style={{ background: s.level > 75 ? "#00FFFF" : s.level > 60 ? "#00FF41" : "rgba(255,255,255,0.3)" }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-white/25 w-8 text-right">{s.level}%</span>
                    </div>
                  ))}
                  {!userData?.skills?.length && (
                    <p className="font-mono text-[10px] text-white/20 pt-1">// skills will update as you complete missions</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Activity */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <GitCommit size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">activity.feed</span>
                </div>
                {activity.length > 0 ? (
                  <div className="divide-y divide-white/4">
                    {activity.map((a, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + i * 0.06 }}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: ACTIVITY_COLORS[a.type] || "#666", boxShadow: `0 0 4px ${ACTIVITY_COLORS[a.type]}` }}
                        />
                        <span className="font-mono text-xs text-white/55 flex-1">{a.msg}</span>
                        <span className="font-mono text-[10px] text-white/22 flex-shrink-0">{a.time}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="font-mono text-xs text-white/25 mb-1">no activity yet</p>
                    <p className="font-mono text-[10px] text-white/15">// start grinding, shipping, or join the arena</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
