"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, GraduationCap, Flame, Radio, Anchor, Hammer, Zap, Swords,
  Users, Tv2, GitFork, FlaskConical, Newspaper, Building2, Target,
  Command, LogIn, User, LogOut, Wallet, Globe,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIntro } from "@/context/IntroContext";
import { NotificationBell } from "@/components/notification-bell";

// This pill intentionally breaks from the site's neon-terminal design system
// (white surface, Google Material shadow/menu conventions, gray-on-white
// palette, brand-colored wordmark) - a deliberate one-off asked for
// directly, not a new direction for the rest of the main site. Type stays
// the site's existing font-sans/font-mono rather than switching to Roboto.
//
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
      { icon: Target,   label: "Missions",  href: "/missions",  desc: "Community bounties & tasks" },
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
        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
        style={{ color: isActiveGroup || open ? "#202124" : "#5F6368", background: isActiveGroup || open ? "#F1F3F4" : "transparent" }}>
        {group.label}
        <ChevronDown size={16} strokeWidth={2} style={{ color: "#5F6368", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 rounded-xl overflow-hidden p-2"
            style={{ width: 300, background: "#FFFFFF", boxShadow: "0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px rgba(60,64,67,0.3)" }}>
            {group.items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[#F1F3F4]">
                <item.icon size={18} strokeWidth={1.7} className="mt-0.5 flex-shrink-0" style={{ color: "#00FF41" }} />
                <div className="min-w-0">
                  <p className="font-sans text-[13.5px] font-medium" style={{ color: "#202124" }}>{item.label}</p>
                  <p className="font-mono text-[11px] leading-snug" style={{ color: "#5F6368" }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu({ logout, isSuperAdmin }) {
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
        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: open ? "#E8EAED" : "#F1F3F4" }}>
        <User size={16} style={{ color: "#5F6368" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden p-2"
            style={{ width: 180, background: "#FFFFFF", boxShadow: "0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px rgba(60,64,67,0.3)" }}>
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-[#F1F3F4]" style={{ color: "#202124" }}>
              <User size={13} style={{ color: "#00FF41" }} /> Dev Card
            </Link>
            <Link href="/wallet" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-[#F1F3F4]" style={{ color: "#202124" }}>
              <Wallet size={13} style={{ color: "#00FF41" }} /> Wallet
            </Link>
            {/* Global Super Admin only - the whole-ecosystem control center,
                distinct from /admin (DeVert Core's own panel, unlinked from
                any nav today, reached by URL only). */}
            {isSuperAdmin && (
              <Link href="/manage" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-[#F1F3F4]" style={{ color: "#202124" }}>
                <Globe size={13} style={{ color: "#00FF41" }} /> Manage
              </Link>
            )}
            <div className="h-px my-1 mx-1" style={{ background: "rgba(60,64,67,0.12)" }} />
            <button onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-[rgba(255,80,80,0.08)]" style={{ color: "#FF5050" }}>
              <LogOut size={13} /> Logout
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
  const { user, logout, isSuperAdmin } = useAuth();

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
      <nav className="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-40 items-center gap-0.5 px-2 py-1.5 rounded-full"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 1px 6px 0 rgba(32,33,36,0.28), 0 16px 40px rgba(0,0,0,0.4)",
        }}>
        <Link href="/" className="flex items-center pl-4 pr-4">
          <span className="font-sans font-bold text-base" style={{ color: "#202124" }}>De<span style={{ color: "#00FF41" }}>Vert</span></span>
        </Link>

        {/* A standalone link, not a dropdown group - Pulse is one destination,
            not a set of them, and asked to sit at the same level as
            Explore/Build/Connect/More rather than buried inside Connect. */}
        <Link href="/pulse"
          className="flex items-center gap-1 text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
          style={{
            color: pathname === "/pulse" || pathname.startsWith("/pulse/") ? "#202124" : "#5F6368",
            background: pathname === "/pulse" || pathname.startsWith("/pulse/") ? "#F1F3F4" : "transparent",
          }}>
          Pulse
        </Link>

        {GROUPS.map(group => <NavGroup key={group.key} group={group} pathname={pathname} />)}

        <div className="flex items-center gap-1 pl-2 ml-1" style={{ borderLeft: "1px solid rgba(60,64,67,0.16)" }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-[#F1F3F4]" style={{ color: "#5F6368" }}>
            <Command size={17} strokeWidth={1.8} />
          </button>
          {user ? (
            <>
              <NotificationBell anchor="down" />
              <ProfileMenu logout={logout} isSuperAdmin={isSuperAdmin} />
            </>
          ) : (
            <Link href="/login"
              className="flex items-center gap-2 text-sm font-bold text-black px-5 py-2.5 rounded-full transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ background: "#00FF41", boxShadow: "0 1px 2px rgba(0,255,65,0.35)" }}>
              <LogIn size={15} /> Enter HQ
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
