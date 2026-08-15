"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";

const SOCIAL_LINKS = [
  { label: "instagram", href: "https://www.instagram.com/devert.in" },
  { label: "linkedin",  href: "https://www.linkedin.com/company/111474265/" },
  { label: "youtube",   href: "https://youtube.com/@devert5" },
  { label: "github",    href: "https://github.com" },
];

const MANIFEST = [
  "// DeVert is not a content channel.",
  "// It's an operating system for serious developers.",
  "// Built by two friends who got tired of mediocre dev content.",
  "// Join or stay behind.",
];

export function Footer() {
  const pathname = usePathname();
  const { hasShownIntro } = useIntro();
  const { user } = useAuth();

  // "/" suppresses the footer only during the pre-auth intro splash itself -
  // it would otherwise render behind/during that animation. A logged-in
  // visitor sees HomeDashboard on "/", a real (if short) dashboard, not a
  // continuously-scrolling feed - it was previously excluded too on the
  // assumption it redirected to /pulse, which is stale: it renders inline,
  // and a finite-content dashboard with no footer at all just reads as an
  // unfinished page once you scroll past the last card. /pulse itself keeps
  // the exclusion - that IS a focused, continuously-scrolling feed.
  // Public portfolios carry their own minimal credit line instead (see app/u/page.jsx) -
  // the marketing footer's socials/manifest/CTA are DeVert chrome, not part of the portfolio.
  // Campus is a deliberately separate institutional surface with its own chrome
  // entirely (see components/campus/campus-app.jsx) - none of DeVert's own
  // chrome belongs there, same reasoning as /u/.
  if ((pathname === "/" && !hasShownIntro && !user) || pathname.startsWith("/admin") || pathname === "/pulse" || pathname.startsWith("/u/") || pathname.startsWith("/campus")) return null;

  return (
    <footer className="relative border-t border-white/5 pb-28 mt-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 pt-16">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Left - manifest */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="font-mono text-xs text-neon-green/50 mb-4 tracking-wider">
              $ cat /etc/devert/manifest.txt
            </p>
            <div className="space-y-1.5">
              {MANIFEST.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="font-mono text-sm text-white/35 leading-relaxed"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* Right - social + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-between"
          >
            <div>
              <p className="font-mono text-xs text-white/20 mb-5 tracking-wider">
                $ ls /social
              </p>
              <div className="flex flex-col gap-3">
                {SOCIAL_LINKS.map((link) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="group flex items-center gap-2 font-mono text-sm text-white/30 hover:text-neon-cyan transition-colors w-fit"
                  >
                    <span className="text-white/12 group-hover:text-neon-cyan/40 transition-colors">$</span>
                    <span>cd /{link.label}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            <motion.a
              href="/login"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 inline-block font-mono text-xs text-black bg-neon-green px-6 py-3 w-fit hover:bg-neon-cyan transition-colors"
            >
              [ JOIN_THE_SQUAD ]
            </motion.a>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-white/15">
            © 2026 DeVert.in - All systems operational.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="/about"   className="font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors">About</a>
            <a href="/privacy" className="font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors">Privacy Policy</a>
            <a href="/terms"   className="font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors">Terms of Service</a>
            <p className="font-mono text-xs text-white/15">Built by The Duo // v2.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
