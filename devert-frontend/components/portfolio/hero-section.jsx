"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Globe, Github, Linkedin, Twitter, Share2, Check, UserPlus, UserMinus,
  FileDown, Mail, Circle, Code2, Award, Briefcase, Trophy,
} from "lucide-react";
import { TypeWriter } from "./typewriter";
import { AVAILABILITY_OPTIONS } from "@/lib/portfolio-sections";

const AVAILABILITY_COLOR = {
  open_to_work: "#00FF41",
  open_to_freelance: "#00FFFF",
  open_to_internships: "#FF9500",
  unavailable: "#666",
};

const STAT_ICON = { PROJECTS: Code2, CERTS: Award, ROLES: Briefcase, AWARDS: Trophy };

function socialHref(v) {
  if (!v) return null;
  return v.startsWith("http") ? v : `https://${v}`;
}

// Bracket-style CTA button - "[ LABEL ]" - matches the reference design's
// signature button treatment.
function BracketButton({ children, onClick, href, solid, color = "#00FF41" }) {
  const cls = "inline-flex items-center gap-2 font-mono text-xs font-semibold py-3 px-5 border transition-all tracking-wide";
  const style = solid
    ? { color: "#0a0a0a", background: color, borderColor: color }
    : { color, borderColor: `${color}55`, background: `${color}0a` };
  const content = <>[&nbsp;{children}&nbsp;]</>;
  return href
    ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls} style={style}>{content}</a>
    : <button onClick={onClick} className={cls} style={style}>{content}</button>;
}

export default function HeroSection({
  profile, handle, tier, isOwnProfile, user,
  following, fLoading, onToggleFollow, onGuestFollow,
  shared, onShare, narrativeStats,
}) {
  const {
    displayName, headline, currentRole, availability, bio, photoURL,
    location, github, linkedin, twitter, website, resumeUrl,
  } = profile;

  const flashwords = [headline, currentRole].filter(Boolean);
  const availMeta = AVAILABILITY_OPTIONS.find(a => a.value === availability);

  const name = displayName || handle;
  const nameParts = name.split(" ");
  const firstLine = nameParts[0];
  const secondLine = nameParts.slice(1).join(" ");

  return (
    <section className="relative pt-16 pb-20 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

        <div className="order-2 lg:order-1">
          {availMeta && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-5 font-mono text-[11px] px-3 py-1.5 rounded-full"
              style={{ color: AVAILABILITY_COLOR[availability], background: `${AVAILABILITY_COLOR[availability]}12`, border: `1px solid ${AVAILABILITY_COLOR[availability]}30` }}>
              <Circle size={6} fill={AVAILABILITY_COLOR[availability]} className="animate-pulse" />
              {availMeta.label}
            </motion.div>
          )}

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="font-mono text-xs text-neon-green/55 mb-1 tracking-wider">
            // portfolio - {handle}.sh
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="font-mono text-sm text-neon-green mb-3">
            $ whoami
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans font-black tracking-tight text-white leading-[0.92] mb-3"
            style={{ fontSize: "clamp(2.8rem,7vw,5.2rem)" }}>
            {firstLine}
            {secondLine && <><br /><span className="text-white/45">{secondLine}</span></>}
          </motion.h1>

          {flashwords.length > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="font-mono text-lg sm:text-xl mb-5 min-h-[1.6em]">
              <TypeWriter words={flashwords} />
            </motion.p>
          )}

          {bio && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="font-mono text-sm text-white/45 leading-relaxed mb-6 max-w-lg">
              {bio}
            </motion.p>
          )}

          {location && (
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-white/30 mb-6">
              <MapPin size={11} /> {location}
            </p>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-wrap items-center gap-3 mb-7">
            <BracketButton href="#contact" color="#00FF41" solid>CONTACT_ME</BracketButton>
            {resumeUrl && <BracketButton href={resumeUrl} color="#00FFFF">RESUME</BracketButton>}

            {isOwnProfile ? null : user ? (
              <button onClick={onToggleFollow} disabled={fLoading}
                className="flex items-center gap-2 font-mono text-xs py-3 px-4 border transition-all disabled:opacity-50"
                style={following
                  ? { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.12)" }
                  : { color: "#C77DFF", borderColor: "rgba(199,125,255,0.35)", background: "rgba(199,125,255,0.05)" }}>
                {fLoading ? <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                  : following ? <><UserMinus size={12} /> following</> : <><UserPlus size={12} /> follow</>}
              </button>
            ) : (
              <button onClick={onGuestFollow}
                className="flex items-center gap-2 font-mono text-xs text-white/25 border border-white/8 py-3 px-4 hover:text-white/45 transition-colors">
                <UserPlus size={12} /> follow
              </button>
            )}

            <button onClick={onShare}
              className="flex items-center gap-2 font-mono text-xs py-3 px-4 border transition-all"
              style={shared
                ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }
                : { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.1)" }}>
              <AnimatePresence mode="wait">
                {shared
                  ? <motion.span key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check size={12} /> copied!</motion.span>
                  : <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Share2 size={12} /> share</motion.span>}
              </AnimatePresence>
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="flex items-center gap-4 mb-7">
            {github && <a href={socialHref(github)} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-green transition-colors"><Github size={17} /></a>}
            {linkedin && <a href={socialHref(linkedin)} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan transition-colors"><Linkedin size={17} /></a>}
            {twitter && <a href={socialHref(twitter)} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-white/60 transition-colors"><Twitter size={17} /></a>}
            {website && <a href={socialHref(website)} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-neon-cyan transition-colors"><Globe size={17} /></a>}
          </motion.div>

          {narrativeStats?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-md">
              {narrativeStats.map(s => {
                const Icon = STAT_ICON[s.label];
                return (
                  <div key={s.label} className="border border-white/8 rounded-lg p-3 text-center">
                    {Icon && <Icon size={13} className="mx-auto mb-1.5" style={{ color: s.color }} />}
                    <p className="font-mono text-lg font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="font-mono text-[8px] text-white/25 tracking-wide mt-1">{s.label}</p>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.6 }}
          className="order-1 lg:order-2 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-10 rounded-full blur-3xl opacity-25" style={{ background: tier?.color || "#00FFFF" }} />
            {photoURL ? (
              <img src={photoURL} alt={name}
                className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full object-cover"
                style={{ border: "1px solid rgba(0,255,255,0.25)" }} />
            ) : (
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center font-mono font-bold"
                style={{ fontSize: "4rem", background: "rgba(0,255,255,0.06)", border: "1px solid rgba(0,255,255,0.25)", color: "#00FFFF" }}>
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {tier && (
              <span className="absolute bottom-3 right-3 font-mono text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5"
                style={{ color: tier.color, background: "#0a0a0aee", border: `1px solid ${tier.color}50` }}>
                <Circle size={6} fill={tier.color} /> {tier.name}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
