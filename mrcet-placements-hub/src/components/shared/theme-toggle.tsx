"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-muted text-navy-900 transition-colors hover:bg-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 dark:text-gold-100"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
