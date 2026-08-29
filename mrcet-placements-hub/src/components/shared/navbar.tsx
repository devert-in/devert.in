"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/experiences", label: "Experiences" },
  { href: "/practice", label: "Practice" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-gradient text-gold-500">
            <GraduationCap size={20} />
          </span>
          <span className="text-base sm:text-lg">
            MRCET <span className="text-gold-600">Placements Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-navy-gradient text-white"
                    : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle"
                >
                  <Menu size={18} />
                </button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigate</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1" aria-label="Mobile">
                  {navLinks.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                          active ? "bg-navy-gradient text-white" : "text-foreground/70 hover:bg-surface-muted"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
