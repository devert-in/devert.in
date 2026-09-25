"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Lightbulb, RotateCcw, Zap, Gauge, Code2, ShieldAlert, Target,
  Eye, EyeOff, ChevronRight, Share2,
} from "lucide-react";

const GREEN = "#00FF41";
const CYAN = "#00FFFF";

// The seven teaching steps, in the order they are taught, plus the takeaway.
//
// ORDER IS THE PEDAGOGY, not a layout choice: understand the problem, name the
// pattern, write the obvious slow thing, find what it repeats, price both, then
// write the real implementation, then break it. Rendering these in any other
// order would teach a different (worse) habit, so the order lives here in code
// rather than being whatever order an author happened to type sections in.
//
// `reveal: true` means the section starts CLOSED. Everything from the brute
// force onward is a spoiler - the run's whole premise is that you try first.
export const DEEP_DIVE_SECTIONS = [
  { key: "problem",        title: "1. Problem",         icon: FileText,    color: CYAN,      reveal: false },
  { key: "pattern",        title: "2. Pattern",         icon: Lightbulb,   color: "#C77DFF", reveal: false },
  { key: "bruteForce",     title: "3. Brute Force",     icon: RotateCcw,   color: "#FF9500", reveal: true  },
  { key: "optimization",   title: "4. Optimization",    icon: Zap,         color: GREEN,     reveal: true  },
  { key: "complexity",     title: "5. Complexity",      icon: Gauge,       color: CYAN,      reveal: true  },
  { key: "implementation", title: "6. Implementation",  icon: Code2,       color: GREEN,     reveal: true  },
  { key: "edgeCases",      title: "7. Edge Cases",      icon: ShieldAlert, color: "#FFD700", reveal: true  },
  { key: "takeaway",       title: "Interview Takeaway", icon: Target,      color: "#A78BFA", reveal: true  },
  { key: "linkedin",       title: "Share It",           icon: Share2,      color: "#0A66C2", reveal: true  },
];

// Markdown styling. The content uses fenced code, GFM tables, blockquotes and
// nested lists heavily, so every one of those needs a deliberate treatment -
// unstyled `prose` would inherit the page's mono chrome and make code blocks
// indistinguishable from body copy.
const MD = {
  h1: ({ children }) => <h3 className="font-sans text-lg font-bold text-white mt-5 mb-2 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="font-sans text-base font-bold text-white mt-5 mb-2 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="font-mono text-[12px] text-white/70 tracking-wide mt-4 mb-1.5 first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="font-mono text-[12.5px] text-white/60 leading-relaxed mb-3 break-words">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="font-mono text-[12.5px] text-white/60 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white/90 font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-white/75 not-italic underline decoration-white/20 underline-offset-2">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: CYAN }}>{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="pl-3.5 my-3.5" style={{ borderLeft: `2px solid ${GREEN}55` }}>
      <div className="font-mono text-[12.5px] text-white/75 leading-relaxed [&>p]:mb-0">{children}</div>
    </blockquote>
  ),
  hr: () => <hr className="my-5" style={{ borderColor: "rgba(255,255,255,0.08)" }} />,
  code: ({ inline, className, children }) => {
    // react-markdown v10 stops passing `inline`, so fall back to the language
    // class a fenced block always carries and to the absence of a newline.
    const text = String(children ?? "");
    const fenced = /language-/.test(className || "") || text.includes("\n");
    if (!fenced) {
      return (
        <code className="font-mono text-[11.5px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,255,255,0.09)", color: "#9ff" }}>{text}</code>
      );
    }
    return (
      <pre className="rounded p-3.5 my-3 overflow-x-auto max-w-full"
        style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <code className="font-mono text-[11.5px] text-white/80 leading-relaxed whitespace-pre">{text.replace(/\n$/, "")}</code>
      </pre>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3.5">
      <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th className="font-mono text-[10px] text-white/40 tracking-wider px-2.5 py-1.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>{children}</th>
  ),
  td: ({ children }) => (
    <td className="font-mono text-[11.5px] text-white/65 px-2.5 py-1.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</td>
  ),
};

function DeepSection({ section, body }) {
  const [open, setOpen] = useState(!section.reveal);
  const Icon = section.icon;
  return (
    <div className="terminal-window overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="terminal-header w-full flex items-center gap-2 text-left">
        <Icon size={12} style={{ color: section.color }} className="ml-2" />
        <span className="font-mono text-[10px] text-white/50 tracking-wider">{section.title}</span>
        <span className="ml-auto mr-2 font-mono text-[10px] text-white/25 flex items-center gap-1">
          {section.reveal && !open ? <><Eye size={11} /> reveal</>
            : section.reveal ? <><EyeOff size={11} /> hide</>
            : <ChevronRight size={12} className={open ? "rotate-90 transition-transform" : "transition-transform"} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="p-4 sm:p-5 min-w-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{body}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function hasDeepDive(problem) {
  const d = problem?.deepDive;
  return !!d && DEEP_DIVE_SECTIONS.some(s => String(d[s.key] || "").trim());
}

export function DeepDive({ problem }) {
  const d = problem?.deepDive;
  if (!d) return null;
  const intro = String(d.intro || "").trim();
  return (
    <div className="space-y-4 min-w-0">
      {intro && (
        <div className="terminal-window p-4 sm:p-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{intro}</ReactMarkdown>
        </div>
      )}
      {DEEP_DIVE_SECTIONS.map(s => {
        const body = String(d[s.key] || "").trim();
        if (!body) return null;
        return <DeepSection key={s.key} section={s} body={body} />;
      })}
    </div>
  );
}
