"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, GraduationCap, Flame, Radio, Anchor, Hammer, Zap, Swords,
  Users, Tv2, GitFork, FlaskConical, Newspaper, Building2, Target,
  Command, LogIn, User, LogOut, Wallet,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIntro } from "@/context/IntroContext";
import { NotificationBell } from "@/components/notification-bell";

// Desktop-only top pill nav, mirroring the exact split Campus already proved
// (CampusTopBar for lg:, CampusBottomNav below it) - components/navbar.jsx's
// floating bottom dock stays exactly as-is but becomes lg:hidden, so mobile
// keeps its already-working nav rather than trying to cram grouped dropdowns
// into a phone-width bar. This is a deliberate, explicit exception to this
// file's own "one dock, every breakpoint" rule from before - asked for
// directly, not a default any new feature should reach for.
const GROUPS = [
  {
    key: "explore", label: "Explore",
    items: [
      { icon: GraduationCap, label: "Campus",       href: "/campus",       desc: "Learn, practice, prepare" },
      { icon: Flame,         label: "Events",       href: "/events",       desc: "Hackathons, workshops, meetups" },
      { icon: Radio,         label: "Opportunities", href: "/opportunities", desc: "Internships, jobs, programs" },
    ],
  },
  {
    key: "build", label: "Build",
    items: [
      { icon: Anchor, label: "Showcase", href: "/showcase", desc: "Dock projects, get judged" },
      { icon: Hammer, label: "Build",    href: "/build",    desc: "Challenges & sprints" },
      { icon: Zap,    label: "Grind",    href: "/grind",    desc: "Daily coding reps" },
      { icon: Swords, label: "Arena",    href: "/arena",    desc: "Timed coding battles" },
    ],
  },
  {
    key: "connect", label: "Connect",
    items: [
      { icon: Users,    label: "Community", href: "/community", desc: "Join dev communities" },
      { icon: Tv2,      label: "Broadcast", href: "/broadcast", desc: "Live build sessions" },
      { icon: Target,   label: "Missions",  href: "/missions",  desc: "Real, paid dev work" },
    ],
  },
  {
    key: "more", label: "More",
    items: [
      { icon: GitFork,      label: "Open Source",   href: "/open-source",   desc: "Coming soon" },
      { icon: FlaskConical, label: "Labs",          href: "/labs",          desc: "Coming soon" },
      { icon: Newspaper,    label: "Stories",       href: "/stories",       desc: "Coming soon" },
      { icon: Building2,    label: "Organizations", href: "/organizations", desc: "Coming soon" },
    ],
  },
];

function NavGroup({ group, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  // usePathname() never includes the query string - strip it before
  // comparing so any href that ever gains one (deep-linking to a tab)
  // still registers as "active" while on that page.
  const isActiveGroup = group.items.some(i => {
    const itemPath = i.href.split("?")[0];
    return pathname === itemPath || pathname.startsWith(itemPath + "/");
  });

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 font-mono text-xs px-3 py-2 rounded-lg transition-colors"
        style={{ color: isActiveGroup || open ? "#00FFFF" : "rgba(255,255,255,0.5)" }}>
        {group.label}
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 rounded-xl overflow-hidden"
            style={{ width: 240, background: "rgba(5,5,5,0.97)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
            {group.items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-white/5">
                <item.icon size={14} className="mt-0.5 flex-shrink-0" style={{ color: pathname === item.href.split("?")[0] ? "#00FFFF" : "rgba(255,255,255,0.4)" }} />
                <div className="min-w-0">
                  <p className="font-sans text-[12.5px] font-semibold text-white/85">{item.label}</p>
                  <p className="font-mono text-[10px] text-white/30 leading-snug">{item.desc}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu({ logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: open ? "rgba(0,255,65,0.12)" : "rgba(0,255,65,0.05)" }}>
        <User size={15} style={{ color: "rgba(0,255,65,0.75)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
            style={{ width: 170, background: "rgba(5,5,5,0.97)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-neon-green hover:bg-white/3 transition-colors">
              <User size={12} /> Dev Card
            </Link>
            <Link href="/wallet" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-neon-cyan hover:bg-white/3 transition-colors">
              <Wallet size={12} /> Wallet
            </Link>
            <div className="h-px bg-white/6 mx-3" />
            <button onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-red-400 hover:bg-red-500/5 transition-colors">
              <LogOut size={12} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNavbar() {
  const pathname = usePathname();
  const { hasShownIntro } = useIntro();
  const { user, logout } = useAuth();

  // Same gating as the bottom dock: no chrome over the pre-auth intro splash,
  // never on /admin, /u/*, or anywhere inside Campus (which has its own
  // CampusTopBar entirely).
  const hidden = (pathname === "/" && !user && !hasShownIntro)
    || pathname.startsWith("/admin")
    || pathname.startsWith("/u/")
    || pathname.startsWith("/campus");
  if (hidden) return null;

  return (
    <>
      <nav className="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-40 items-center gap-1 px-3 py-2 rounded-2xl"
        style={{
          background: "rgba(5,5,5,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,255,0.04)",
        }}>
        <Link href="/" className="flex items-center gap-2 pl-2 pr-4 mr-1 border-r border-white/8">
          <span className="font-sans font-bold text-sm tracking-tight text-white">De<span className="text-neon-green">Vert</span></span>
        </Link>

        {/* A standalone link, not a dropdown group - Pulse is one destination,
            not a set of them, and asked to sit at the same level as
            Explore/Build/Connect/More rather than buried inside Connect. */}
        <Link href="/pulse"
          className="flex items-center gap-1 font-mono text-xs px-3 py-2 rounded-lg transition-colors"
          style={{ color: pathname === "/pulse" || pathname.startsWith("/pulse/") ? "#00FFFF" : "rgba(255,255,255,0.5)" }}>
          Pulse
        </Link>

        {GROUPS.map(group => <NavGroup key={group.key} group={group} pathname={pathname} />)}

        <div className="flex items-center gap-1.5 pl-3 ml-2 border-l border-white/8">
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-2 rounded-lg text-white/35 hover:text-neon-green transition-colors">
            <Command size={13} />
          </button>
          {user ? (
            <>
              <NotificationBell anchor="down" />
              <ProfileMenu logout={logout} />
            </>
          ) : (
            <Link href="/login"
              className="flex items-center gap-1.5 font-mono text-xs font-bold text-black px-4 py-2 rounded-lg transition-opacity hover:opacity-85"
              style={{ background: "#00FF41" }}>
              <LogIn size={13} /> Enter HQ
            </Link>
          )}
        </div>
      </nav>
      {/* Reserves real document-flow space below the floating pill, on lg:
          only (mobile never renders the nav above, so needs none). Every
          page's own top padding (pt-10/pt-16, duplicated ~15+ places) predates
          this fixed nav and was never sized to clear it - it only happened to
          look fine where a page's left-aligned heading/breadcrumb was short
          enough to stay left of the centered pill (Home, Showcase). A longer
          line (Wallet's "/wallet - devert_coins") runs horizontally under the
          pill instead and gets visually clipped by its blurred background.
          One spacer here fixes every page at once, at the one place that
          already knows exactly when the nav is showing. */}
      <div className="hidden lg:block h-20" aria-hidden="true" />
    </>
  );
}
