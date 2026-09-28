// /founders - who built DeVert, as a real indexable page.
//
// Founder names used to exist only as a footer credit, which a search engine
// reads as a link, not as information ABOUT the people - so a search for
// either founder's name had nothing on devert.in to land on. This page gives
// each founder a heading, a factual summary, and Person structured data
// (lib/founders.js founderPersonJsonLd) linked to the Organization in
// app/layout.jsx via `founder`, plus sameAs to their LinkedIn and DeVert
// profiles - the signals Google uses to connect a person to a brand.
//
// Deliberately NOT in any navbar (see lib/founders.js and CLAUDE.md): it is
// reached from the footer and from /about. A static server component with no
// client JS, so every word is in the prerendered HTML.

import Link from "next/link";
import { ArrowUpRight, ExternalLink, User, Globe, GraduationCap, Briefcase } from "lucide-react";
import { FOUNDERS, FOUNDERS_PAGE_URL, founderPersonJsonLd, founderPath } from "@/lib/founders";
import { jsonLdHtml } from "@/lib/jsonLd";

const NAMES = FOUNDERS.map((f) => f.name).join(" and ");

export const metadata = {
  title: `Founders - ${NAMES}`,
  description: `DeVert was founded by ${NAMES}. Meet the two founders behind devert.in, DeVert Campus and DeVert Careers - what each of them builds, and where to find them.`,
  alternates: { canonical: FOUNDERS_PAGE_URL },
  openGraph: {
    title: `The founders of DeVert - ${NAMES}`,
    description: `Meet ${NAMES}, the founders of DeVert.`,
    url: FOUNDERS_PAGE_URL,
    type: "profile",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${FOUNDERS_PAGE_URL}#page`,
      url: FOUNDERS_PAGE_URL,
      name: `The founders of DeVert - ${NAMES}`,
      about: { "@id": "https://devert.in/#organization" },
      mainEntity: FOUNDERS.map((f) => ({ "@id": `${FOUNDERS_PAGE_URL}#${f.key}` })),
    },
    ...FOUNDERS.map(founderPersonJsonLd),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "DeVert", item: "https://devert.in/" },
        { "@type": "ListItem", position: 2, name: "About", item: "https://devert.in/about" },
        { "@type": "ListItem", position: 3, name: "Founders", item: FOUNDERS_PAGE_URL },
      ],
    },
  ],
};

const BUILT = [
  { icon: Globe, name: "devert.in", body: "The developer OS - Arena, Shipyard, Grind, Pulse, Events and DeVert 100.", href: "/" },
  { icon: GraduationCap, name: "DeVert Campus", body: "Structured learning, GATE prep and placement preparation for colleges.", href: "https://campus.devert.in" },
  { icon: Briefcase, name: "DeVert Careers", body: "Open roles at DeVert, for people who want to build it with them.", href: "https://careers.devert.in" },
];

export default function FoundersPage() {
  return (
    <main className="min-h-screen pt-16 pb-32 px-4 sm:px-6 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <div className="relative max-w-4xl mx-auto">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-white/35 mb-6">
          <Link href="/about" className="hover:text-white/70">about</Link>
          <span className="mx-2">/</span>
          <span className="text-white/60">founders</span>
        </nav>

        <p className="font-mono text-xs text-neon-green/55 mb-4 tracking-wider">// founders.devert</p>
        <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-6" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}>
          THE FOUNDERS<br /><span className="text-neon-cyan">OF DEVERT.</span>
        </h1>
        <p className="font-sans text-base text-white/60 leading-relaxed max-w-2xl mb-14">
          DeVert was founded in 2026 by {FOUNDERS[0].name} and {FOUNDERS[1].name} - two friends who got tired of
          mediocre developer content and decided to build the platform they wanted to learn on: a place where
          developers practise, ship, compete and get placed.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {FOUNDERS.map((f) => (
            <article key={f.key} id={f.key} className="terminal-window scroll-mt-24">
              <div className="terminal-header">
                <span className="font-mono text-[10px] text-white/30 ml-2">founder/{f.key}</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div aria-hidden="true" className="w-14 h-14 rounded-full flex items-center justify-center font-sans text-lg font-bold flex-shrink-0"
                    style={{ color: f.accent, background: `${f.accent}14`, border: `1px solid ${f.accent}40` }}>
                    {f.initials}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-sans text-xl font-bold text-white leading-tight">{f.name}</h2>
                    <p className="font-mono text-xs mt-1" style={{ color: f.accent }}>Founder, DeVert</p>
                  </div>
                </div>
                <p className="font-sans text-sm text-white/65 leading-relaxed mb-5">{f.summary}</p>
                <p className="font-mono text-[10px] tracking-widest text-white/35 mb-2">FOCUS</p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {f.focus.split("·").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="font-mono text-[11px] px-2 py-1 rounded border border-white/10 text-white/60">{t}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={f.linkedin} target="_blank" rel="noopener noreferrer me"
                    className="inline-flex items-center gap-2 font-mono text-xs px-3 py-2 border transition-colors hover:bg-white/5"
                    style={{ borderColor: `${f.accent}55`, color: f.accent }}>
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                  <Link href={founderPath(f)} className="inline-flex items-center gap-2 font-mono text-xs px-3 py-2 border border-white/15 text-white/65 transition-colors hover:bg-white/5 hover:text-white">
                    <User size={13} /> DeVert profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section aria-labelledby="built" className="mb-16">
          <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// what_they_built.md</p>
          <h2 id="built" className="font-sans font-bold text-white tracking-tighter mb-6" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
            WHAT THEY BUILT
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {BUILT.map((b) => (
              <a key={b.name} href={b.href} className="terminal-window p-5 block hover:border-white/20 transition-colors">
                <b.icon size={18} className="text-neon-green/80 mb-3" />
                <p className="font-sans text-sm font-semibold text-white mb-1">{b.name}</p>
                <p className="font-mono text-[11px] text-white/40 leading-relaxed">{b.body}</p>
              </a>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/about" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border border-white/20 text-white/70 hover:text-white transition-colors">
            About DeVert
          </Link>
          <a href="https://careers.devert.in" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-colors"
            style={{ borderColor: "#00FF41", color: "#00FF41" }}>
            [ WORK_WITH_THEM ] <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </main>
  );
}
