"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Anchor, Radio, Target, Zap, Tv2, Trophy, ScrollText, LogIn, Terminal, Command, User, LogOut, GraduationCap } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: Home,       label: "Home",      href: "/" },
  { icon: Swords,     label: "Arena",     href: "/arena" },
  { icon: Anchor,     label: "Shipyard",  href: "/shipyard" },
  { icon: Radio,      label: "Intel",     href: "/intel" },
  { icon: Target,     label: "Missions",  href: "/missions" },
  { icon: Zap,        label: "Grind",     href: "/grind" },
  { icon: GraduationCap, label: "Prep",   href: "/prep" },
  { icon: Tv2,        label: "Broadcast", href: "/broadcast" },
  { icon: Trophy,     label: "Ranks",     href: "/ranks" },
  { icon: ScrollText, label: "Logs",      href: "/logs" },
];

export function Navbar() {
  const pathname = usePathname();
  const { hasShownIntro } = useIntro();
  const { user, logout } = useAuth();
  const navRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { setProfileOpen(false); }, [pathname]);

  if (pathname === "/" && !hasShownIntro) return null;
  if (pathname.startsWith("/admin")) return null;

  const showTooltip = (e, label) => {
    if (profileOpen) return;
    const navRect = navRef.current?.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    const x = itemRect.left + itemRect.width / 2 - (navRect?.left ?? 0);
    setTooltip({ label, x });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <nav ref={navRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100vw-2rem)]">

      {/* Tooltip — outside overflow, never clipped */}
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

      {/* Profile dropdown — outside overflow, never clipped */}
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
            <div className="h-px bg-white/6 mx-3" />
            <button
              onClick={async () => { await logout(); setProfileOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 font-mono text-xs text-white/55 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut size={12} /> Logout
            </button>
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
          className="flex items-center gap-0.5 px-2 py-2 overflow-x-auto no-scrollbar scroll-smooth min-w-0"
          style={{
            /* Fade right edge to hint at scrollable content */
            WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
            maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          }}
        >
          {/* Logo */}
          <Link href="/">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 flex items-center justify-center rounded-xl mr-1 flex-shrink-0"
              style={{ background: "rgba(0,255,255,0.08)" }}
              onMouseEnter={(e) => showTooltip(e, "DeVert")}
              onMouseLeave={hideTooltip}
            >
              <Terminal size={15} className="text-neon-cyan" />
            </motion.div>
          </Link>

          <div className="w-px h-5 bg-white/8 mx-1 flex-shrink-0" />

          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                onMouseEnter={(e) => showTooltip(e, item.label)}
                onMouseLeave={hideTooltip}
              >
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.88 }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
                  style={{
                    background: isActive ? "rgba(0,255,255,0.1)" : "transparent",
                    boxShadow: isActive ? "0 0 14px rgba(0,255,255,0.18)" : "none",
                  }}
                >
                  <Icon size={15} style={{ color: isActive ? "#00FFFF" : "rgba(255,255,255,0.38)" }} />
                  {isActive && (
                    <motion.div layoutId="dockActive"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: "#00FFFF" }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}

          {/* Trailing padding so last icon isn't hidden under the fade */}
          <div className="w-4 flex-shrink-0" />
        </div>

        {/* ── Pinned section: always visible on mobile ── */}
        <div className="flex items-center gap-0.5 px-2 py-2 flex-shrink-0 border-l border-white/8">

          {/* Cmd+K */}
          <motion.button
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            onMouseEnter={(e) => showTooltip(e, "Search")}
            onMouseLeave={hideTooltip}
          >
            <Command size={14} style={{ color: "rgba(0,255,65,0.5)" }} />
          </motion.button>

          {/* Profile / Login */}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
              onClick={() => { setProfileOpen(p => !p); hideTooltip(); }}
              onMouseEnter={(e) => showTooltip(e, "Account")}
              onMouseLeave={hideTooltip}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
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
              <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(0,255,65,0.06)" }}
              >
                <LogIn size={15} style={{ color: "rgba(0,255,65,0.65)" }} />
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>
    </nav>
  );
}
