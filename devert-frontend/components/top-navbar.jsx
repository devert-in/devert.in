"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Command, LogIn, User, LogOut, Wallet, Globe, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIntro } from "@/context/IntroContext";
import { NotificationBell } from "@/components/notification-bell";
import { NAV_ROUTES, DESKTOP_GROUPS } from "@/lib/navConfig";

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
//
// GROUPS/PULSE_ITEM are derived from the shared lib/navConfig.js rather than
// each holding its own copy - see that file's header for why this and
// navbar.jsx's dock intentionally show different SCOPES (this pill's fuller
// sitemap vs. the dock's curated subset), not the same list twice.
const GROUPS = DESKTOP_GROUPS.map(g => ({ ...g, items: NAV_ROUTES.filter(r => r.desktop === g.key) }));
const PULSE_ITEM = NAV_ROUTES.find(r => r.desktop === "standalone");

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
        style={{ color: isActiveGroup || open ? "#F2F6FA" : "rgba(255,255,255,0.58)", background: isActiveGroup || open ? "rgba(255,255,255,0.10)" : "transparent" }}>
        {group.label}
        <ChevronDown size={16} strokeWidth={2} style={{ color: "rgba(255,255,255,0.58)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="devert-surface absolute left-0 top-full mt-2 rounded-xl overflow-hidden p-2"
            style={{ width: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)" }}>
            {group.items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10">
                <item.icon size={18} strokeWidth={1.7} className="mt-0.5 flex-shrink-0" style={{ color: "#00FF41" }} />
                <div className="min-w-0">
                  <p className="font-sans text-[13.5px] font-medium" style={{ color: "#F2F6FA" }}>{item.label}</p>
                  <p className="font-mono text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.58)" }}>{item.desc}</p>
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
        style={{ background: open ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)" }}>
        <User size={16} style={{ color: "rgba(255,255,255,0.58)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="devert-surface absolute right-0 top-full mt-2 rounded-xl overflow-hidden p-2"
            style={{ width: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)" }}>
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-white/10" style={{ color: "#F2F6FA" }}>
              <User size={13} style={{ color: "#00FF41" }} /> Dev Card
            </Link>
            <Link href="/wallet" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-white/10" style={{ color: "#F2F6FA" }}>
              <Wallet size={13} style={{ color: "#00FF41" }} /> Wallet
            </Link>
            {/* Global Super Admin only - the whole-ecosystem control center,
                distinct from /admin (DeVert Core's own panel, unlinked from
                any nav today, reached by URL only). */}
            {isSuperAdmin && (
              <Link href="/manage" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors hover:bg-white/10" style={{ color: "#F2F6FA" }}>
                <Globe size={13} style={{ color: "#00FF41" }} /> Manage
              </Link>
            )}
            <div className="h-px my-1 mx-1" style={{ background: "rgba(255,255,255,0.12)" }} />
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
  // never on /admin or /u/*.
  const hidden = (pathname === "/" && !user && !hasShownIntro)
    || pathname.startsWith("/admin")
    || pathname.startsWith("/u/");
  if (hidden) return null;

  return (
    <>
      <nav className="devert-surface hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-40 items-center gap-0.5 px-2 py-1.5 rounded-full"
        style={{
          boxShadow: "0 1px 6px 0 rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.55)",
        }}>
        <Link href="/" className="flex items-center pl-4 pr-4">
          <span className="font-sans font-bold text-base" style={{ color: "#F2F6FA" }}>De<span style={{ color: "#00FF41" }}>Vert</span></span>
        </Link>

        {/* A standalone link, not a dropdown group - Pulse is one destination,
            not a set of them, and asked to sit at the same level as
            Explore/Build/Connect/More rather than buried inside Connect. */}
        <Link href={PULSE_ITEM.href}
          className="flex items-center gap-1 text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
          style={{
            color: pathname === PULSE_ITEM.href || pathname.startsWith(PULSE_ITEM.href + "/") ? "#F2F6FA" : "rgba(255,255,255,0.58)",
            background: pathname === PULSE_ITEM.href || pathname.startsWith(PULSE_ITEM.href + "/") ? "rgba(255,255,255,0.10)" : "transparent",
          }}>
          {PULSE_ITEM.label}
        </Link>

        {GROUPS.map(group => <NavGroup key={group.key} group={group} pathname={pathname} />)}

        <div className="flex items-center gap-1 pl-2 ml-1" style={{ borderLeft: "1px solid rgba(255,255,255,0.14)" }}>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-white/10" style={{ color: "rgba(255,255,255,0.58)" }}>
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
