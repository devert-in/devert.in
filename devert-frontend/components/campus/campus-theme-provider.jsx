"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";

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
  // Lazy initializer, not a mount effect - localStorage is already
  // synchronously available the first time this ever renders (this
  // component only lives inside the client-only Campus workspace tree).
  // Dark is the default identity now (premium-SaaS redesign) - light stays
  // fully supported, just no longer the fallback for a first-time visitor.
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("campus-theme") : null;
    return saved === "dark" || saved === "light" ? saved : "dark";
  });
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
      style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}

// Every pre-workspace/pre-auth Campus screen (checking/not-found/signed-out/
// join-form/pending/rejected/suspended, and now the three staff login pages)
// renders through here - the one place a "wrong college, let me pick
// another" or "just let me back out" escape hatch needs to exist for all of
// them at once.
export function CampusShell({ children }) {
  const { theme } = useCampusTheme();
  return (
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }}
      className="campus-theme relative flex items-center justify-center px-6">
      <Link href="/campus"
        className="absolute top-5 left-5 flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ color: CAMPUS.inkSoft }}>
        <ArrowLeft size={14} /> Back to Campus
      </Link>
      <div className="absolute top-5 right-5"><CampusThemeToggle /></div>
      {children}
    </main>
  );
}
