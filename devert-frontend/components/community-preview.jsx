"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, Users2, MessageCircle, Hash, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

// Real numbers only, same convention as campus-preview.jsx/events-preview.jsx.
function useCommunityStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.allSettled([
      getCountFromServer(collection(db, "communities")),
      getCountFromServer(query(collection(db, "pulse_posts"), where("status", "==", "approved"))),
    ]).then(([communitiesRes, postsRes]) => {
      setStats({
        communities: communitiesRes.status === "fulfilled" ? communitiesRes.value.data().count : 0,
        posts:       postsRes.status === "fulfilled" ? postsRes.value.data().count : 0,
      });
    }).catch(() => setStats({ communities: 0, posts: 0 }));
  }, []);
  return stats;
}

const FEATURES = [
  { icon: Activity,      label: "Dev Feed",     body: "Posts, code snippets, links - real conversations." },
  { icon: Users2,        label: "Communities",  body: "Topic and campus chapters you can join." },
  { icon: MessageCircle, label: "Comments",     body: "Threaded replies, not a comment-free void." },
  { icon: Hash,          label: "Follow",       body: "Follow builders whose work you want to see." },
];

export function CommunityPreview() {
  const stats = useCommunityStats();

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
              // pulse.feed --dev community
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-sans font-bold text-white tracking-tighter mb-5"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              WHERE DEVELOPERS <span className="text-neon-cyan">MEET DEVELOPERS.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-mono text-sm text-white/40 mb-8 leading-relaxed max-w-lg"
            >
              Pulse is DeVert&apos;s dev social feed - and now, topic and campus communities
              where you can find your people instead of scrolling a global timeline.
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
              <Link href="/pulse">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200 cursor-pointer"
                  style={{ borderColor: "#00FFFF", color: "#00FFFF" }}
                >
                  [ EXPLORE_PULSE ] <ArrowUpRight size={14} />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Preview side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="terminal-window"
          >
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">devert.in/pulse</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,255,0.1)" }}>
                  <Activity size={19} className="text-neon-cyan" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-white">DeVert Pulse</p>
                  <p className="font-mono text-[10px] text-white/30">the dev social feed &amp; communities</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="border border-white/8 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-white/25">
                    <Users2 size={11} /> <span className="font-mono text-[9px] tracking-wider">COMMUNITIES</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-neon-cyan">
                    {stats ? stats.communities.toLocaleString() : "…"}
                  </p>
                </div>
                <div className="border border-white/8 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-2 text-white/25">
                    <MessageCircle size={11} /> <span className="font-mono text-[9px] tracking-wider">POSTS</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-neon-green">
                    {stats ? stats.posts.toLocaleString() : "…"}
                  </p>
                </div>
              </div>

              <p className="font-mono text-[10.5px] text-white/25 leading-relaxed">
                <span className="text-neon-green/60">$</span> Real conversations, not vanity metrics.<br />
                <span className="text-neon-green/60">$</span> Follow builders. Join a community. Post your own.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
