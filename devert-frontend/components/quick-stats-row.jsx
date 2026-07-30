"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Anchor, Swords, Coins, Trophy, Code2, Users, UserPlus, Radio, Heart, MessageCircle, Flame, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// The DevCard is now a public portfolio, not a stats dashboard - every
// platform/engagement counter that used to live there lives here instead.
// This is the user's operational control center.
export function QuickStatsRow() {
  const { user, userData } = useAuth();

  // `users.credits` is only ever incremented by contest rewards (see
  // lib/contests.js) - every other coin-earning path (Daily Learning,
  // Programming, CS Core, Pulse like/comment/save credits) writes to
  // user_earnings/{uid}.totalCoins instead, the same field Wallet and
  // Classroom Analytics already correctly read. Using `credits` here showed
  // 0 for any student who'd never entered a contest, even with a real
  // nonzero balance visible on their own Wallet page for the same account.
  // Live subscription (not a one-time fetch) so this repaints the instant
  // any reward-granting action credits the user, without a refresh.
  const [totalCoins, setTotalCoins] = useState(null);
  useEffect(() => {
    if (!user?.uid) { setTotalCoins(null); return; }
    return onSnapshot(doc(db, "user_earnings", user.uid), snap => {
      setTotalCoins(snap.exists() ? (snap.data().totalCoins || 0) : 0);
    }, () => setTotalCoins(0));
  }, [user?.uid]);

  if (!userData) return null;

  const stats = [
    { label: "XP",         val: (userData.xp || 0).toLocaleString(),     icon: Zap,    color: "#00FFFF" },
    { label: "COINS",      val: (totalCoins || 0).toLocaleString(), icon: Coins,  color: "#FFD700" },
    { label: "STREAK",     val: `${userData.streak || 0}d`,               icon: Flame,  color: "#FF6430" },
    { label: "SHIPS",      val: userData.ships || 0,                     icon: Anchor, color: "#00FF41" },
    { label: "ARENA WINS", val: userData.arenaWins || 0,                 icon: Swords, color: "#FF9500" },
    { label: "FOLLOWERS",  val: userData.followersCount || 0,            icon: Users,     color: "#C77DFF" },
    { label: "FOLLOWING",  val: userData.followingCount || 0,            icon: UserPlus,  color: "#C77DFF" },
    { label: "PROFILE VIEWS", val: (userData.profileViews || 0).toLocaleString(), icon: Eye, color: "#00FFFF" },
    { label: "PULSE POSTS",   val: userData.pulsePostsCount || 0,        icon: Radio,  color: "#00FF41" },
    { label: "LIKES RECEIVED",    val: (userData.totalLikesReceived || 0).toLocaleString(),    icon: Heart,         color: "#FF5050" },
    { label: "COMMENTS RECEIVED", val: (userData.totalCommentsReceived || 0).toLocaleString(), icon: MessageCircle, color: "#00FFFF" },
    ...(userData.contestsParticipated ? [
      { label: "CONTEST XP",    val: (userData.contestXp || 0).toLocaleString(),    icon: Trophy, color: "#C77DFF" },
      { label: "CONTEST COINS", val: (userData.contestCoins || 0).toLocaleString(), icon: Trophy, color: "#FFD700" },
    ] : []),
    ...(userData.problemsSolvedCount ? [
      { label: "PROBLEMS SOLVED", val: userData.problemsSolvedCount, icon: Code2, color: "#C77DFF" },
    ] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5"
    >
      {stats.map(s => (
        <div key={s.label} className="terminal-window p-4">
          <s.icon size={14} style={{ color: s.color }} className="mb-2" />
          <p className="font-mono text-lg font-bold leading-none" style={{ color: s.color }}>{s.val}</p>
          <p className="font-mono text-[9px] text-white/25 tracking-wider mt-1.5">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
