import Link from "next/link";
import { GraduationCap } from "lucide-react";

const footerLinks = [
  { href: "/dashboard", label: "Placements Dashboard" },
  { href: "/companies", label: "Company Directory" },
  { href: "/experiences", label: "Interview Experiences" },
  { href: "/practice", label: "Practice Bank" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-gradient text-gold-500">
              <GraduationCap size={20} />
            </span>
            <span>
              MRCET <span className="text-gold-600">Placements Hub</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-foreground/60">
            The definitive campus placements resource for Malla Reddy College of Engineering & Technology —
            records, company insights, and peer interview experiences in one place.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/50">Explore</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-foreground/70 hover:text-gold-600">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/50">Powered By</h3>
          <p className="mt-3 text-sm text-foreground/70">
            Practice ecosystem by{" "}
            <a
              href="https://devert.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold-600 hover:underline"
            >
              Devert.in
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-border-subtle px-4 py-5 text-center text-xs text-foreground/50 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} MRCET Training & Placement Cell. All rights reserved.
      </div>
    </footer>
  );
}
