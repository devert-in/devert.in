"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Radio, Target, Zap, Tv2, Flame, Code2, LogIn, Command, User, LogOut, Activity, Wallet, GraduationCap, Network } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";
import { useWindowManager } from "@/context/WindowManagerContext";
import { NotificationBell } from "@/components/notification-bell";

// Shipyard, Ranks, and Logs deliberately live only in the Home dashboard's quick
// actions (components/quick-actions-grid.jsx), not here - keeps the persistent dock
// to the modules used every session. CodeLab is its own top-level route (app/codelab/),
// separate from Arena (which still hosts Solo Challenges + Contests).
// Most items carry `windowApp` - they open as a Builder's OS window (see
// context/WindowManagerContext + context/window-registry) instead of a plain
// route transition. Three deliberately do not:
//   - Home is the "desktop" the windows float above.
//   - Campus is a separate, differently themed experience (see
//     components/campus/campus-app.jsx) - a one-way door out of the dark dock,
//     which self-suppresses the moment you're on a /campus/* route.
//   - Fundamentals is a long-form reading surface. A floating window scrolls an
//     INNER container, but the lesson reader's reading-progress bar, sticky
//     section rail and jump-to-section all measure against document scroll (same
//     constraint documented in components/campus/lesson-blocks.jsx's
//     useReadingProgress). Windowing it would silently break all three, and a
//     720px-wide window is the wrong shape for a 4000-word lesson anyway.
const NAV_ITEMS = [
  { icon: Home,          label: "Home",       href: "/"           },
  { icon: Swords,        label: "Arena",      href: "/arena",      windowApp: "arena"      },
  { icon: Code2,         label: "CodeLab",    href: "/codelab",    windowApp: "codelab"    },
  { icon: Network,       label: "Fundamentals", href: "/fundamentals" },
  { icon: Zap,           label: "Grind",      href: "/grind",      windowApp: "grind"      },
  { icon: Radio,         label: "Intel",      href: "/intel",      windowApp: "intel"      },
  { icon: GraduationCap, label: "Campus",     href: "/campus"     },
  { icon: Tv2,           label: "Broadcast",  href: "/broadcast",  windowApp: "broadcast"  },
  { icon: Flame,         label: "Hackathons", href: "/hackathons", windowApp: "hackathons" },
  { icon: Target,        label: "Missions",   href: "/missions",   windowApp: "missions"   },
];

export function Navbar() {
  const pathname = usePathname();
  const { hasShownIntro } = useIntro();
  const { user, logout } = useAuth();
  const { launch, isOpen, isFocused, focusedId, registerDockIcon } = useWindowManager();
  const navRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => { setProfileOpen(false); setConfirmLogout(false); }, [pathname]);

  // The intro splash only ever plays for a logged-out visitor (app/page.jsx
  // sends a logged-in user straight to HomeDashboard, bypassing it entirely),
  // so gate on !user too - otherwise a signed-in user whose browser never
  // recorded "intro seen" (fresh profile, private window, cleared storage)
  // gets the navbar permanently hidden on "/" even though no intro ever plays.
  if (pathname === "/" && !user && !hasShownIntro) return null;
  if (pathname.startsWith("/admin")) return null;
  // Public portfolios are a standalone "give this to a recruiter" page - no DeVert chrome.
  if (pathname.startsWith("/u/")) return null;
  // Campus is a deliberately separate, light "academic" surface (see
  // components/campus/campus-app.jsx) with its own nav - the dark Builder's OS
  // dock would clash with it and doesn't belong on an institutional workspace.
  if (pathname.startsWith("/campus")) return null;

  const showTooltip = (e, label) => {
    if (profileOpen) return;
    const navRect = navRef.current?.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    const x = itemRect.left + itemRect.width / 2 - (navRect?.left ?? 0);
    setTooltip({ label, x });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <nav ref={navRef} className="fixed left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100vw-2rem)]"
      style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
    >

      {/* Tooltip - outside overflow, never clipped */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key={tooltip.label}
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full mb-3 font-mono text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
            style={{
              left: tooltip.x,
              transform: "translateX(-50%)",
              background: "rgba(5,5,5,0.96)",
              border: "1px solid rgba(0,255,255,0.22)",
              color: "#00FFFF",
              boxShadow: "0 0 12px rgba(0,255,255,0.08)",
              zIndex: 50,
            }}
          >
            {tooltip.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile dropdown - outside overflow, never clipped */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full mb-3 right-0 rounded-xl overflow-hidden"
            style={{
              background: "rgba(5,5,5,0.97)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              minWidth: 148,
              zIndex: 50,
            }}
          >
            <Link href="/profile" onClick={() => setProfileOpen(false)}>
              <div className="flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-neon-green hover:bg-white/3 transition-colors cursor-pointer">
                <User size={12} /> Dev Card
              </div>
            </Link>
            <Link href="/wallet" onClick={() => setProfileOpen(false)}>
              <div className="flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-neon-cyan hover:bg-white/3 transition-colors cursor-pointer">
                <Wallet size={12} /> Wallet
              </div>
            </Link>
            <div className="h-px bg-white/6 mx-3" />
            {confirmLogout ? (
              <div className="px-4 py-3">
                <p className="font-mono text-[10px] text-white/40 mb-2">confirm logout?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => { await logout(); setProfileOpen(false); setConfirmLogout(false); }}
                    className="flex-1 font-mono text-[11px] py-1.5 text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                  >
                    yes
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 font-mono text-[11px] py-1.5 text-white/40 border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={12} /> Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dock shell ── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 22 }}
        className="flex items-center rounded-2xl border border-white/8 backdrop-blur-2xl overflow-hidden"
        style={{
          background: "rgba(5,5,5,0.85)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,255,0.04)",
        }}
      >
        {/* ── Scrollable section: logo + nav items ── */}
        <div
          className="flex items-center gap-0.5 lg:gap-1 px-2 py-2 lg:px-2.5 lg:py-2.5 overflow-x-auto no-scrollbar scroll-smooth min-w-0"
          style={{
            /* Fade right edge to hint at scrollable content */
            WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
            maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          }}
        >
          {/* Pinned Pulse shortcut - opens as a Builder's OS window, not a route transition */}
          <button type="button" className="contents focus:outline-none focus-visible:outline-none"
            onClick={() => launch("pulse")}
            onMouseEnter={(e) => showTooltip(e, "Pulse")}
            onMouseLeave={hideTooltip}
          >
            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
              className="relative flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-10 lg:px-3.5 rounded-xl transition-colors flex-shrink-0 mr-1"
              style={{
                background: isFocused("pulse") ? "rgba(0,255,65,0.12)" : "rgba(0,255,65,0.06)",
                boxShadow:  isFocused("pulse") ? "0 0 14px rgba(0,255,65,0.2)" : "none",
              }}
            >
              <Activity size={15} style={{ color: isFocused("pulse") ? "#00FF41" : "rgba(0,255,65,0.55)" }} />
              <span className="hidden lg:inline font-mono text-xs whitespace-nowrap"
                style={{ color: isFocused("pulse") ? "#00FF41" : "rgba(0,255,65,0.55)" }}>
                Pulse
              </span>
              {isFocused("pulse") && (
                <motion.div layoutId="dockActive"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: "#00FF41" }}
                />
              )}
              {isOpen("pulse") && !isFocused("pulse") && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#00FF41", boxShadow: "0 0 6px rgba(0,255,65,0.6)" }} />
              )}
            </motion.div>
          </button>

          <div className="w-px h-5 bg-white/8 mx-1 flex-shrink-0" />

          {NAV_ITEMS.map((item) => {
            // Home sits "underneath" any floating window - usePathname() stays "/"
            // the whole time under shell-over-routes, so it must also check that
            // no window is focused on top before showing itself as active.
            const isActive = item.windowApp
              ? isFocused(item.windowApp)
              : item.href === "/" ? pathname === "/" && !focusedId : (pathname === item.href || pathname.startsWith(item.href + "/"));
            const running  = item.windowApp && isOpen(item.windowApp) && !isActive;
            const Icon = item.icon;
            const inner = (
              <motion.div
                ref={item.windowApp ? (el) => registerDockIcon(item.windowApp, el) : undefined}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="relative flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-10 lg:px-3.5 rounded-xl transition-colors flex-shrink-0"
                style={{
                  background: isActive ? "rgba(0,255,255,0.1)" : "transparent",
                  boxShadow: isActive ? "0 0 14px rgba(0,255,255,0.18)" : "none",
                }}
              >
                <Icon size={15} style={{ color: isActive ? "#00FFFF" : "rgba(255,255,255,0.38)" }} />
                <span className="hidden lg:inline font-mono text-xs whitespace-nowrap"
                  style={{ color: isActive ? "#00FFFF" : "rgba(255,255,255,0.38)" }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div layoutId="dockActive"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                    style={{ background: "#00FFFF" }}
                  />
                )}
                {running && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#00FFFF", boxShadow: "0 0 6px rgba(0,255,255,0.6)" }} />
                )}
              </motion.div>
            );
            // Arena (and future windowed modules) open in-place instead of navigating.
            if (item.windowApp) {
              return (
                <button key={item.href} type="button" className="contents focus:outline-none focus-visible:outline-none"
                  onClick={() => launch(item.windowApp)}
                  onMouseEnter={(e) => showTooltip(e, item.label)}
                  onMouseLeave={hideTooltip}
                >
                  {inner}
                </button>
              );
            }
            return (
              <Link key={item.href} href={item.href}
                onMouseEnter={(e) => showTooltip(e, item.label)}
                onMouseLeave={hideTooltip}
              >
                {inner}
              </Link>
            );
          })}

          {/* Trailing padding so last icon isn't hidden under the fade */}
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* ── Pinned section: always visible on mobile ── */}
        <div className="flex items-center gap-0.5 lg:gap-1 px-2 py-2 lg:px-2.5 flex-shrink-0 border-l border-white/8">

          {/* Cmd+K */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
            className="flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-10 lg:px-3 rounded-xl"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            onMouseEnter={(e) => showTooltip(e, "Search")}
            onMouseLeave={hideTooltip}
          >
            <Command size={14} style={{ color: "rgba(0,255,65,0.5)" }} />
            <span className="hidden lg:inline font-mono text-xs whitespace-nowrap" style={{ color: "rgba(0,255,65,0.5)" }}>
              Search
            </span>
          </motion.button>

          {/* Notification Bell */}
          <NotificationBell showTooltip={showTooltip} hideTooltip={hideTooltip} />

          {/* Profile / Login */}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
              onClick={() => { setProfileOpen(p => !p); hideTooltip(); }}
              onMouseEnter={(e) => showTooltip(e, "Account")}
              onMouseLeave={hideTooltip}
              className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl transition-colors"
              style={{
                background: profileOpen || pathname === "/profile" ? "rgba(0,255,65,0.12)" : "rgba(0,255,65,0.05)",
                boxShadow: profileOpen ? "0 0 14px rgba(0,255,65,0.22)" : "none",
              }}
            >
              <User size={15} style={{ color: "rgba(0,255,65,0.75)" }} />
            </motion.button>
          ) : (
            <Link href="/login"
              onMouseEnter={(e) => showTooltip(e, "Login")}
              onMouseLeave={hideTooltip}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                className="flex items-center justify-center gap-2 w-9 h-9 lg:w-auto lg:h-10 lg:px-3.5 rounded-xl"
                style={{ background: "rgba(0,255,65,0.06)" }}
              >
                <LogIn size={15} style={{ color: "rgba(0,255,65,0.65)" }} />
                <span className="hidden lg:inline font-mono text-xs whitespace-nowrap" style={{ color: "rgba(0,255,65,0.65)" }}>
                  Login
                </span>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
