"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { CAMPUS, campusPhotoBg } from "@/lib/campus-theme";

// Extracted out of campus-app.jsx into its own file so OTHER top-level
// Campus screens (campus-staff-login.jsx's three dedicated login pages) can
// import it directly without a circular import back through campus-app.jsx
// (which itself imports CampusStaffLogin for its router). Every Campus
// screen still shares the exact same theme state/toggle - this is a pure
// extraction, not a behavior change.
//
// DeVert Campus is a deliberately separate "academic" surface from the rest
// of the site's permanently-dark theme - it supports BOTH light and dark,
// toggled independently and persisted to localStorage. Every CAMPUS.* color
// is a CSS var (lib/campus-theme.js), scoped under the .campus-theme class
// with light/dark values swapped via the data-theme attribute this provider
// sets - so toggling repaints every component below without threading a
// resolved-color prop through each one.
const CampusThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export function useCampusTheme() {
  return useContext(CampusThemeContext);
}

export function CampusThemeProvider({ children }) {
  // Lazy initializer, not a mount effect - localStorage (and matchMedia) are
  // already synchronously available the first time this ever renders (this
  // component only lives inside the client-only Campus workspace tree). A
  // first-time visitor with no saved preference gets whatever their OS is
  // set to, light or dark, rather than a hardcoded default - explicitly
  // toggling below is what opts them into a fixed choice of their own.
  const [theme, setTheme] = useState(() => {
    // DARK is the server fallback, not light. These apps are static exports:
    // whatever this returns during prerender is the HTML the browser paints
    // BEFORE hydration reads localStorage. Returning light meant every visitor
    // - including one whose saved preference is dark - got a white navbar for
    // a frame, then a flip. Dark is the platform default everywhere else now,
    // so it is the right thing to paint first; a visitor who has explicitly
    // chosen light still gets one frame of dark, but that is the rarer case
    // and it is the same single frame, not a regression.
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("campus-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Keeps following the OS setting live for as long as the visitor hasn't
  // made an explicit choice - toggleTheme persists to localStorage the
  // moment they do, which permanently hands control to their own pick
  // instead (this effect checks localStorage fresh each time rather than
  // once, so it stops reacting the instant that happens).
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const syncToSystem = (e) => {
      if (localStorage.getItem("campus-theme")) return;
      setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", syncToSystem);
    return () => mq.removeEventListener("change", syncToSystem);
  }, []);

  const toggleTheme = () => setTheme(t => {
    const next = t === "light" ? "dark" : "light";
    localStorage.setItem("campus-theme", next);
    return next;
  });
  return <CampusThemeContext.Provider value={{ theme, toggleTheme }}>{children}</CampusThemeContext.Provider>;
}

export function CampusThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useCampusTheme();
  return (
    <button onClick={toggleTheme} title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${className}`}
      style={{ color: CAMPUS.inkSoft }}>
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

// Every pre-workspace/pre-auth Campus screen (checking/not-found/signed-out/
// join-form/pending/rejected/suspended, and now the three staff login pages)
// renders through here - the one place a "wrong college, let me pick
// another" or "just let me back out" escape hatch needs to exist for all of
// them at once.
//
// `nav` is an OPT-IN SLOT, not an import. campus-app.jsx passes <CampusPublicNav />
// so a visitor who lands on /campus/{slug} signed out gets the same header as
// every other public page instead of one small back-link in the corner. It is a
// prop rather than something this file imports because campus-public-nav.jsx
// reads useCampusTheme from HERE - importing it back would be a cycle - and
// because the three staff login pages (campus-staff-login.jsx) deliberately
// keep the bare shell: a principal opening their own login page is not being
// sold the public learner tracks.
export function CampusShell({ children, nav = null }) {
  const { theme } = useCampusTheme();
  return (
    <main data-theme={theme} style={{ ...campusPhotoBg(theme), minHeight: "100vh", colorScheme: theme }}
      className={`campus-theme campus-photo-bg relative ${nav ? "flex flex-col" : "flex items-center justify-center px-6"}`}>
      {nav}
      {/* Without the nav, this is the ONLY way out, so it stays pinned to the
          corner. With it, the header already carries the Campus logo home, and
          a second floating back-link beside it is just clutter. */}
      {!nav && (
        <Link href="/"
          className="absolute top-5 left-5 flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: CAMPUS.inkSoft }}>
          <ArrowLeft size={14} /> Back to Campus
        </Link>
      )}
      {!nav && <div className="absolute top-5 right-5"><CampusThemeToggle /></div>}
      {nav ? (
        <div className="flex-1 flex items-center justify-center px-6 py-12">{children}</div>
      ) : children}
    </main>
  );
}
