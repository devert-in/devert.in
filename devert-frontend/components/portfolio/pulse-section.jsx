"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radio, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

function PostRow({ p, badge }) {
  const date = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {badge && <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ color: "#FFD700", background: "rgba(255,215,0,0.1)" }}>{badge}</span>}
          <span className="font-mono text-[9px] text-white/20">{date}</span>
        </div>
        <p className="font-mono text-xs text-white/55 leading-snug line-clamp-2">{p.caption}</p>
        {p.linkUrl && (
          <a href={p.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 font-mono text-[10px] text-neon-cyan hover:underline">
            linked article <ExternalLink size={9} />
          </a>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[10px] text-white/25">
        <span className="flex items-center gap-1"><Heart size={11} /> {p.likeCount || 0}</span>
        <span className="flex items-center gap-1"><MessageCircle size={11} /> {p.commentCount || 0}</span>
      </div>
    </div>
  );
}

export default function PulseSection({ posts = [] }) {
  const mostLiked = posts.length > 0 ? [...posts].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))[0] : null;

  return (
    <PortfolioSection id="pulse">
      <SectionHeading comment="pulse.feed" title="Recent Activity" lastWordColor="#00FF41" subtitle="What I'm building and sharing on Pulse" />
      <div className="terminal-window">
        <div className="terminal-header">
          <Radio size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1.5">pulse_feed.log</span>
          <Link href="/pulse" className="ml-auto font-mono text-[10px] text-white/25 hover:text-neon-green transition-colors">view on pulse →</Link>
        </div>
        {posts.length === 0 ? (
          <EmptyState line1="no pulse posts yet" line2="check back soon" />
        ) : (
          <div className="divide-y divide-white/4">
            {posts.slice(0, 5).map(p => (
              <PostRow key={p.id} p={p} badge={mostLiked && p.id === mostLiked.id ? "MOST LIKED" : null} />
            ))}
          </div>
        )}
      </div>
    </PortfolioSection>
  );
}
