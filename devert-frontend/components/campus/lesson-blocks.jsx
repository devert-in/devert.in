"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowRight, Brain, Briefcase, CheckCircle2, ChevronDown,
  Clapperboard, Copy, Cpu, Database, FileText, Gauge, Globe, HardDrive, HelpCircle,
  Info, Keyboard, Layers, Lightbulb, Lock, MemoryStick, Microscope, Network, Play,
  Quote, RotateCcw, ScrollText, Shield, Sparkles, Target, Timer, Users, X as XIcon,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { parseLesson, parseLessonBlocks, tokenizeInline } from "@/lib/lessonBlocks";
import { CODELAB_LANGUAGES, runCode } from "@/lib/codelab";
import { CampusCard } from "@/components/campus/campus-ui";
import { LanguageLogo } from "@/components/campus/language-logo";

// The rendering half of the Campus lesson engine - lib/lessonBlocks.js parses,
// this draws. Every learning module (CS Core, Programming, Aptitude, Company
// Prep, Daily Learning) renders its lesson body through here, so a new block
// type or a typography fix lands in all of them at once instead of being
// re-implemented per module.
//
// Two entry points, deliberately different:
//   <LessonBody text={...} />        the full reading experience - sections,
//                                    a jump-to-section rail, in-view reveals.
//                                    For a lesson that IS the page.
//   <ConceptRenderer text={...} />   the same blocks with no section chrome,
//                                    for a lesson body nested inside
//                                    something else (an accordion row in
//                                    Company Prep, an Aptitude topic card).
//
// Both are safe on legacy plain-text lessons: with no `##` headings and no
// `:::` fences, LessonBody renders one untitled section and no rail, which is
// visually what the old ConceptRenderer produced.

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ---------------- theme + motion helpers ----------------

// Reads the nearest .campus-theme[data-theme] wrapper instead of importing
// campus-app.jsx's theme context - that context lives upstream of this file
// (campus-app -> campus-cscore -> lesson-blocks), so importing it here would
// be a cycle. campus-ui.jsx avoids the same cycle the same way, by styling
// off CSS vars rather than reading the context. Monaco is the one thing that
// can't be themed by a CSS var (it needs a theme *name*), hence this hook.
function useCampusIsDark() {
  const ref = useRef(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = ref.current?.closest(".campus-theme");
    if (!root) return;
    const sync = () => setDark(root.getAttribute("data-theme") === "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return [dark, ref];
}

// One place deciding whether a block animates. Everything below animates only
// on first scroll-into-view and only once; with prefers-reduced-motion set,
// `motionProps` collapses to no animation at all rather than a shorter one -
// a student who asked for no motion gets none.
function useBlockMotion() {
  const reduce = useReducedMotion();
  return useMemo(() => (reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.35, ease: "easeOut" },
  }), [reduce]);
}

// ---------------- inline formatting ----------------

// **bold**, *italic*, `code` inside any prose/list/card/callout text. Renders
// React nodes, never HTML - authored lesson text is trusted-ish (admin only)
// but there is no reason to open an injection path for typography.
export function Inline({ text }) {
  const tokens = useMemo(() => tokenizeInline(text), [text]);
  return tokens.map((t, i) => {
    if (t.type === "code") {
      return (
        <code key={i} className="font-mono text-[0.92em] px-1.5 py-[1px] rounded"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.teal }}>
          {t.text}
        </code>
      );
    }
    if (t.type === "bold") return <b key={i} style={{ color: CAMPUS.ink, fontWeight: 650 }}>{t.text}</b>;
    if (t.type === "italic") return <i key={i}>{t.text}</i>;
    return <span key={i}>{t.text}</span>;
  });
}

// ---------------- callouts ----------------

// variant -> icon + accent + label. The label is the *teaching* frame ("REAL-LIFE
// ANALOGY", "COMMON MISTAKE"), which is the point of the block: a student
// skimming a lesson can tell what kind of help each card is offering before
// reading a word of it. Lucide icons only, no emoji, per the project's design
// system - these labels are exactly where emoji would otherwise creep in.
const CALLOUT_STYLE = {
  story:      { icon: Clapperboard, color: CAMPUS.purple, label: "STORY" },
  analogy:    { icon: Globe,        color: CAMPUS.blue,   label: "REAL-LIFE ANALOGY" },
  funfact:    { icon: Sparkles,     color: CAMPUS.gold,   label: "FUN FACT" },
  didyouknow: { icon: Brain,        color: CAMPUS.purple, label: "DID YOU KNOW?" },
  mistake:    { icon: AlertTriangle, color: CAMPUS.bad,   label: "COMMON MISTAKE" },
  remember:   { icon: Target,       color: CAMPUS.teal,   label: "REMEMBER THIS" },
  behind:     { icon: Microscope,   color: CAMPUS.blue,   label: "BEHIND THE SCENES" },
  interview:  { icon: Briefcase,    color: CAMPUS.warn,   label: "INTERVIEW PERSPECTIVE" },
  revision:   { icon: ScrollText,   color: CAMPUS.good,   label: "QUICK REVISION" },
  tip:        { icon: Lightbulb,    color: CAMPUS.gold,   label: "TIP" },
  note:       { icon: Info,         color: CAMPUS.blue,   label: "NOTE" },
};

function Callout({ variant, title, blocks }) {
  const motionProps = useBlockMotion();

  // A pull quote is a callout in the parser but not visually a card - it's the
  // one variant meant to interrupt the reading rhythm rather than sit beside it.
  if (variant === "quote") {
    return (
      <motion.blockquote {...motionProps} className="pl-4 py-1 my-1" style={{ borderLeft: `3px solid ${CAMPUS.teal}` }}>
        <Quote size={14} style={{ color: CAMPUS.teal }} className="mb-1.5" />
        <div className="text-[15px] leading-relaxed font-medium" style={{ color: CAMPUS.ink }}>
          <LessonBlocks blocks={blocks} />
        </div>
        {title && <footer className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>{title}</footer>}
      </motion.blockquote>
    );
  }

  const style = CALLOUT_STYLE[variant] || { icon: Info, color: CAMPUS.inkFaint, label: variant.toUpperCase() };
  const Icon = style.icon;

  return (
    <motion.div {...motionProps}>
      <CampusCard className="p-4" style={{ border: `1px solid ${style.color}40`, background: `${style.color}0F` }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} style={{ color: style.color, flexShrink: 0 }} />
          <span className="text-[10px] font-mono tracking-widest" style={{ color: style.color }}>{style.label}</span>
        </div>
        {title && <b className="block text-[13.5px] mb-1.5" style={{ color: CAMPUS.ink }}>{title}</b>}
        <LessonBlocks blocks={blocks} />
      </CampusCard>
    </motion.div>
  );
}

// ---------------- expandable cards ----------------

// Card icons are picked by keyword, not authored - the alternative (an icon
// name in the block syntax) puts a design decision in every content writer's
// hands and drifts immediately. Same heuristic-by-substring approach as
// campus-cscore.jsx's SUBJECT_ICONS, with a neutral fallback.
const CARD_ICONS = [
  [/process|cpu|schedul|thread|task/i, Cpu],
  [/memor|ram|heap|stack|paging|segment/i, MemoryStick],
  [/file|directory|folder|document/i, FileText],
  [/disk|storage|block|i\/o|io\b/i, HardDrive],
  [/device|driver|keyboard|mouse|periph|hardware/i, Keyboard],
  [/network|socket|packet|protocol|router|dns/i, Network],
  [/database|table|query|sql|index|schema/i, Database],
  [/secur|auth|permission|encrypt|privile/i, Shield],
  [/lock|mutex|semaphore|sync|deadlock|atomic/i, Lock],
  [/time|latenc|clock|delay|interval|quantum/i, Timer],
  [/user|client|account|student|customer/i, Users],
  [/perform|throughput|speed|efficien|benchmark/i, Gauge],
];

function cardIcon(term) {
  return (CARD_ICONS.find(([re]) => re.test(term || "")) || [null, Layers])[1];
}

function CardGrid({ title, items }) {
  const [open, setOpen] = useState(null);
  const motionProps = useBlockMotion();
  const reduce = useReducedMotion();

  return (
    <motion.div {...motionProps}>
      {title && <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>{title.toUpperCase()}</p>}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((item, i) => {
          const Icon = cardIcon(item.term);
          const isOpen = open === i;
          const expandable = !!item.body;
          return (
            <CampusCard key={i} className="overflow-hidden">
              <button
                onClick={() => expandable && setOpen(isOpen ? null : i)}
                aria-expanded={expandable ? isOpen : undefined}
                disabled={!expandable}
                className="w-full flex items-center gap-2.5 p-3.5 text-left">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                  <Icon size={15} />
                </span>
                <b className="flex-1 text-[13px]" style={{ color: CAMPUS.ink }}><Inline text={item.term} /></b>
                {expandable && (
                  <ChevronDown size={14} style={{
                    color: CAMPUS.inkFaint, flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: reduce ? "none" : "transform 0.18s",
                  }} />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={reduce ? {} : { height: "auto", opacity: 1 }}
                    exit={reduce ? {} : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}>
                    <p className="text-[12.5px] leading-relaxed px-3.5 pb-3.5 pt-0.5" style={{ color: CAMPUS.inkSoft }}>
                      <Inline text={item.body} />
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CampusCard>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------------- flow diagram ----------------

// Steps stack vertically with a down-arrow between them. When no step has a
// caption the same steps also lay out horizontally from `sm:` up, because a
// short chain (User -> App -> OS -> Hardware) reads better as one line - but
// captioned steps always stay vertical, since caption text in a horizontal
// row collapses into unreadable columns on a phone.
function FlowDiagram({ title, steps }) {
  const motionProps = useBlockMotion();
  const hasCaptions = steps.some(s => s.body);
  const horizontal = !hasCaptions && steps.length <= 5;

  const node = (step, i) => (
    <div key={i} className="rounded-xl px-3.5 py-2.5 text-center flex-1"
      style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadow }}>
      <b className="text-[12.5px] block" style={{ color: CAMPUS.ink }}><Inline text={step.term} /></b>
      {step.body && <span className="text-[11.5px] block mt-0.5" style={{ color: CAMPUS.inkSoft }}><Inline text={step.body} /></span>}
    </div>
  );

  return (
    <motion.figure {...motionProps} className="my-1">
      {title && <figcaption className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>{title.toUpperCase()}</figcaption>}

      <div className={`flex flex-col items-stretch gap-1.5 ${horizontal ? "sm:hidden" : ""}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-stretch gap-1.5">
            {node(step, i)}
            {i < steps.length - 1 && (
              <ArrowDown size={13} className="self-center" style={{ color: CAMPUS.teal }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {horizontal && (
        <div className="hidden sm:flex items-stretch gap-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              {node(step, i)}
              {i < steps.length - 1 && <ArrowRight size={13} className="flex-shrink-0" style={{ color: CAMPUS.teal }} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </motion.figure>
  );
}

// ---------------- timeline ----------------

function Timeline({ title, steps }) {
  const motionProps = useBlockMotion();
  return (
    <motion.figure {...motionProps} className="my-1">
      {title && <figcaption className="text-[11px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>{title.toUpperCase()}</figcaption>}
      <ol className="relative pl-7">
        <span className="absolute left-[11px] top-1.5 bottom-1.5 w-px" style={{ background: CAMPUS.line }} aria-hidden="true" />
        {steps.map((step, i) => (
          <li key={i} className={i === steps.length - 1 ? "relative" : "relative pb-4"}>
            <span className="absolute left-[-27px] top-0 w-[23px] h-[23px] rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
              style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.teal}`, color: CAMPUS.teal }}>
              {i + 1}
            </span>
            <b className="text-[13px] block" style={{ color: CAMPUS.ink }}><Inline text={step.term} /></b>
            {step.body && <span className="text-[12.5px] leading-relaxed block mt-0.5" style={{ color: CAMPUS.inkSoft }}><Inline text={step.body} /></span>}
          </li>
        ))}
      </ol>
    </motion.figure>
  );
}

// ---------------- reference table ----------------

// Formula/shortcut/conversion reference tables (the one genuinely new visual
// primitive this format adds - see lib/lessonBlocks.js's `table` fence).
// Deliberately reuses CampusTable's own header/row typography (components/
// campus/campus-ui.jsx) rather than a new visual language, just without that
// component's sort/row-click machinery, which a static reference table never
// needs. Cell text runs through Inline so **bold**/`code` still work inside a
// table the same as everywhere else.
function Table({ title, headers, rows }) {
  const motionProps = useBlockMotion();
  if (!headers?.length) return null;
  return (
    <motion.figure {...motionProps} className="my-1">
      {title && <figcaption className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>{title.toUpperCase()}</figcaption>}
      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${CAMPUS.line}`, background: CAMPUS.paper }}>
              {headers.map((h, i) => (
                <th key={i} className="text-[10px] font-mono text-left px-3 py-2.5 tracking-wider whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${CAMPUS.line}` : "none" }}>
                {headers.map((_, j) => (
                  <td key={j} className="text-[12px] px-3 py-2.5" style={{ color: CAMPUS.inkSoft }}>
                    <Inline text={row[j] || ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.figure>
  );
}

// ---------------- inline checkpoint ----------------

// A formative, mid-lesson "can you predict what happens next?" question.
// Deliberately NOT the graded quiz: no score is kept, no XP/coins are
// involved, answering is optional, and retrying is free - the entire purpose
// is to interrupt passive reading. The real, reward-bearing quiz stays where
// it is (the module's own TopicQuiz, gating topic completion).
function Checkpoint({ title, question, options, explanation }) {
  const [picked, setPicked] = useState(null);
  const motionProps = useBlockMotion();
  const answered = picked !== null;
  const wasRight = answered && options[picked]?.correct;

  return (
    <motion.div {...motionProps}>
      <CampusCard className="p-4" style={{ border: `1px solid ${CAMPUS.blue}40`, background: `${CAMPUS.blue}0D` }}>
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle size={14} style={{ color: CAMPUS.blue, flexShrink: 0 }} />
          <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.blue }}>CHECKPOINT</span>
        </div>
        {title && <b className="block text-[13.5px] mb-1.5" style={{ color: CAMPUS.ink }}>{title}</b>}
        {question && (
          <p className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: CAMPUS.ink }}>
            <Inline text={question} />
          </p>
        )}

        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const isPicked = picked === i;
            // Once answered, the correct option is always marked - a student
            // who guessed wrong still learns which one was right without
            // having to re-answer to find out.
            const showCorrect = answered && opt.correct;
            const showWrong = isPicked && !opt.correct;
            const accent = showCorrect ? CAMPUS.good : showWrong ? CAMPUS.bad : isPicked ? CAMPUS.teal : CAMPUS.line;
            return (
              <button key={i} onClick={() => !answered && setPicked(i)} disabled={answered}
                className="w-full flex items-center gap-2 text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: showCorrect ? CAMPUS.goodTint : showWrong ? CAMPUS.badTint : CAMPUS.surface,
                  border: `1px solid ${accent}`, color: CAMPUS.ink,
                }}>
                {showCorrect && <CheckCircle2 size={13} style={{ color: CAMPUS.good, flexShrink: 0 }} />}
                {showWrong && <XIcon size={13} style={{ color: CAMPUS.bad, flexShrink: 0 }} />}
                <span className="flex-1"><Inline text={opt.text} /></span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {answered && (
            <div className="mt-3">
              <p className="text-[12px] font-semibold mb-1" style={{ color: wasRight ? CAMPUS.good : CAMPUS.warn }}>
                {wasRight ? "Exactly right." : "Not quite - here's why."}
              </p>
              {explanation && (
                <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                  <Inline text={explanation} />
                </p>
              )}
              <button onClick={() => setPicked(null)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold mt-2" style={{ color: CAMPUS.inkFaint }}>
                <RotateCcw size={11} /> try again
              </button>
            </div>
          )}
        </div>
      </CampusCard>
    </motion.div>
  );
}

// ---------------- progressive reveal ----------------

function Reveal({ title, blocks }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <CampusCard className="overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-3.5 text-left">
        <Lightbulb size={14} style={{ color: CAMPUS.gold, flexShrink: 0 }} />
        <span className="flex-1 text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{title || "Reveal the answer"}</span>
        <ChevronDown size={14} style={{
          color: CAMPUS.inkFaint, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: reduce ? "none" : "transform 0.18s",
        }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? {} : { height: "auto", opacity: 1 }}
            exit={reduce ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{ overflow: "hidden" }}>
            <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <div className="pt-3"><LessonBlocks blocks={blocks} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CampusCard>
  );
}

// ---------------- primitives ----------------

function Pseudocode({ text }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
        <span className="text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>PSEUDOCODE</span>
        <button onClick={() => navigator.clipboard?.writeText(text)} style={{ color: CAMPUS.inkFaint }} title="Copy"><Copy size={11} /></button>
      </div>
      <pre className="text-[12px] font-mono p-3 overflow-x-auto" style={{ color: CAMPUS.inkSoft, background: CAMPUS.surface }}>{text}</pre>
    </div>
  );
}

// ---------------- block dispatch ----------------

export function LessonBlocks({ blocks }) {
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return b.level === 2
              ? <h2 key={i} id={b.id} className="text-[17px] font-bold pt-1 scroll-mt-24" style={{ color: CAMPUS.ink }}>{b.text}</h2>
              : <h3 key={i} id={b.id} className="text-[14px] font-bold pt-0.5 scroll-mt-24" style={{ color: CAMPUS.ink }}>{b.text}</h3>;
          case "code":
            return <Pseudocode key={i} text={b.text} />;
          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                    <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: CAMPUS.teal }} />
                    <span><Inline text={it} /></span>
                  </li>
                ))}
              </ul>
            );
          case "callout":
            return <Callout key={i} variant={b.variant} title={b.title} blocks={b.blocks} />;
          case "cards":
            return <CardGrid key={i} title={b.title} items={b.items} />;
          case "flow":
            return <FlowDiagram key={i} title={b.title} steps={b.steps} />;
          case "timeline":
            return <Timeline key={i} title={b.title} steps={b.steps} />;
          case "table":
            return <Table key={i} title={b.title} headers={b.headers} rows={b.rows} />;
          case "checkpoint":
            return <Checkpoint key={i} title={b.title} question={b.question} options={b.options} explanation={b.explanation} />;
          case "reveal":
            return <Reveal key={i} title={b.title} blocks={b.blocks} />;
          default:
            return (
              <p key={i} className="text-[13.5px] leading-[1.75] whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

// Flat renderer, no section chrome - the drop-in replacement for the original
// ConceptRenderer, kept under the same name so the modules that embed a
// lesson body inside other UI (Company Prep rows, Aptitude topic cards) need
// no change beyond the import path.
export function ConceptRenderer({ text }) {
  const blocks = useMemo(() => parseLessonBlocks(text), [text]);
  return <LessonBlocks blocks={blocks} />;
}

// ---------------- the sectioned reading experience ----------------

// Tracks which section is currently being read, for the jump rail's active
// state. rootMargin biases toward the section occupying the upper-middle of
// the viewport, which is where a reader's attention actually is - a plain
// "topmost visible" test flickers between two sections at a boundary.
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || null);

  useEffect(() => {
    if (ids.length < 2 || typeof IntersectionObserver === "undefined") return;
    const nodes = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length === 0) return;
      visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      setActive(visible[0].target.id);
    }, { rootMargin: "-15% 0px -60% 0px", threshold: 0 });

    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

function SectionRail({ sections, active }) {
  const reduce = useReducedMotion();
  const jump = (id) => document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth", block: "start",
  });

  return (
    <nav aria-label="Lesson sections" className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {sections.map(s => {
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => jump(s.id)}
            aria-current={isActive ? "true" : undefined}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors"
            style={{
              background: isActive ? CAMPUS.tealTint : CAMPUS.paper,
              border: `1px solid ${isActive ? CAMPUS.teal : CAMPUS.line}`,
              color: isActive ? CAMPUS.teal : CAMPUS.inkSoft,
            }}>
            {s.title}
          </button>
        );
      })}
    </nav>
  );
}

// The full lesson body: sections, a jump rail once there are at least two
// named ones, and per-section in-view reveal. A legacy lesson (no headings)
// renders as a single untitled section with no rail - identical output to the
// old flat renderer, which is what makes this safe to switch on everywhere
// before any content has been converted.
export function LessonBody({ text }) {
  const sections = useMemo(() => parseLesson(text), [text]);
  const titled = sections.filter(s => s.title);
  const ids = useMemo(() => titled.map(s => s.id), [titled]);
  const active = useActiveSection(ids);

  if (sections.length === 0) return null;

  return (
    <div>
      {titled.length >= 2 && (
        <div className="mb-4">
          <SectionRail sections={titled} active={active} />
        </div>
      )}
      <div className="space-y-6">
        {sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3.5">
            {section.title && (
              <h2 className="text-[17px] font-bold" style={{ color: CAMPUS.ink }}>{section.title}</h2>
            )}
            <LessonBlocks blocks={section.blocks} />
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------------- reading progress ----------------

// Scroll-driven "how far through this lesson am I" percentage for the element
// `ref` points at. Window-scroll based on purpose: the Campus workspace
// scrolls the page (its sidebar is the sticky element, not the content), so
// there is no inner scroll container to attach to. Returns 0-100.
export function useReadingProgress(ref) {
  const [pct, setPct] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    // A lesson shorter than the viewport is "read" the moment it's on screen -
    // otherwise its bar would sit at 0% forever with nothing left to scroll.
    if (total <= 0) { setPct(rect.top <= window.innerHeight * 0.5 ? 100 : 0); return; }
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    setPct(Math.round((scrolled / total) * 100));
  }, [ref]);

  useEffect(() => {
    // The first measurement is deferred a frame rather than taken inline:
    // measuring in the effect body would both set state synchronously during
    // the commit (a cascading render) and read a layout that hasn't settled -
    // the lesson's images/editors are still sizing at that point.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return pct;
}

// Slim sticky bar showing lesson progress. Sits under the workspace's own
// chrome rather than at viewport top, so it never covers the back button.
export function LessonProgressBar({ pct, label = "LESSON PROGRESS" }) {
  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 backdrop-blur"
      style={{ background: `color-mix(in srgb, ${CAMPUS.paper} 88%, transparent)` }}>
      <div className="flex items-center gap-2.5">
        <span className="text-[9.5px] font-mono tracking-widest flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{label}</span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CAMPUS.teal, transition: "width 0.1s linear" }} />
        </div>
        <span className="text-[10px] font-mono font-bold flex-shrink-0 tabular-nums" style={{ color: CAMPUS.teal }}>{pct}%</span>
      </div>
    </div>
  );
}

// ---------------- shared lesson primitives (moved here from campus-daily-learning) ----------------

// One shape for every optional callout list (Learning Objectives,
// Prerequisites, Key Points, Important Notes, Common Mistakes, Interview
// Tips, Real-world Applications) - renders nothing at all when the admin
// hasn't authored that section for this lesson, rather than an empty card.
export function InfoListCard({ icon: Icon, title, items, color, tint, checkItems = false }) {
  if (!items || items.length === 0) return null;
  return (
    <CampusCard className="p-4" style={{ border: `1px solid ${color}40`, background: tint }}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={14} style={{ color }} />
        <span className="text-[12.5px] font-bold" style={{ color: CAMPUS.ink }}>{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
            {checkItems
              ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color }} />
              : <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />}
            <span><Inline text={it} /></span>
          </li>
        ))}
      </ul>
    </CampusCard>
  );
}

// Interactive when live execution is available (proxied through
// devert-backend -> Judge0, same runCode() CodeLab's problem view uses), so a
// lesson's example isn't just something to read - a student can edit it, run
// it, and see real output without leaving the lesson. Falls back to the
// original read-only view (+ the admin's own pre-authored expectedOutput, if
// any) the moment a run actually fails - never a fabricated output, and
// never a dead Run button left behind. `NEXT_PUBLIC_API_URL` unset (execution
// not configured at all, e.g. local dev) skips straight to that fallback
// instead of waiting for a doomed first click.
export function CodeExampleBlock({ codeExample }) {
  const [code, setCode] = useState(codeExample?.code || "");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [unavailable, setUnavailable] = useState(!process.env.NEXT_PUBLIC_API_URL);
  // Monaco needs a theme *name*, so unlike every other Campus surface it
  // can't just reference a --campus-* var - it has to be told which one.
  const [isDark, themeProbe] = useCampusIsDark();

  useEffect(() => {
    setCode(codeExample?.code || "");
    setOutput(null);
    setUnavailable(!process.env.NEXT_PUBLIC_API_URL);
  }, [codeExample?.code]);

  if (!codeExample?.code) return null;
  const lang = CODELAB_LANGUAGES.find(l => l.id === codeExample.language);
  const dirty = code !== codeExample.code;
  const monacoTheme = isDark ? "vs-dark" : "light";

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runCode({ language: codeExample.language, code, stdin: "" });
      setOutput(result);
    } catch {
      setUnavailable(true);
    } finally {
      setRunning(false);
    }
  };
  const handleReset = () => { setCode(codeExample.code); setOutput(null); };
  const handleCopy = () => navigator.clipboard?.writeText(code);

  if (unavailable) {
    const lineCount = codeExample.code.split("\n").length;
    return (
      <div ref={themeProbe} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
        <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wide" style={{ color: CAMPUS.teal }}>
            <LanguageLogo name={codeExample.language} size={12} />
            {lang?.label || "CODE"}
          </span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-[10px]" style={{ color: CAMPUS.inkFaint }} title="Copy">
            <Copy size={11} /> copy
          </button>
        </div>
        <div style={{ height: Math.max(80, Math.min(320, 40 + lineCount * 19)) }}>
          <MonacoEditor
            language={lang?.monacoId || "plaintext"}
            theme={monacoTheme}
            value={codeExample.code}
            options={{ readOnly: true, domReadOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
          />
        </div>
        {codeExample.expectedOutput && (
          <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface }}>
            <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>EXPECTED OUTPUT</p>
            <pre className="text-[12px] font-mono whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{codeExample.expectedOutput}</pre>
          </div>
        )}
      </div>
    );
  }

  const lineCount = code.split("\n").length;
  return (
    <div ref={themeProbe} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wide" style={{ color: CAMPUS.teal }}>
          <LanguageLogo name={codeExample.language} size={12} />
          {lang?.label || "CODE"}
        </span>
        <div className="flex items-center gap-3">
          {dirty && (
            <button onClick={handleReset} className="flex items-center gap-1 text-[10px]" style={{ color: CAMPUS.inkFaint }} title="Reset to original">
              <RotateCcw size={11} /> reset
            </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1 text-[10px]" style={{ color: CAMPUS.inkFaint }} title="Copy">
            <Copy size={11} /> copy
          </button>
          <button onClick={handleRun} disabled={running} className="flex items-center gap-1 text-[10px] font-semibold disabled:opacity-50" style={{ color: CAMPUS.good }} title="Run">
            <Play size={11} /> {running ? "running..." : "run"}
          </button>
        </div>
      </div>
      <div style={{ height: Math.max(80, Math.min(320, 40 + lineCount * 19)) }}>
        <MonacoEditor
          language={lang?.monacoId || "plaintext"}
          theme={monacoTheme}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
        />
      </div>
      {output && (
        <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface }}>
          <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: output.stderr ? CAMPUS.bad : CAMPUS.good }}>OUTPUT</p>
          <pre className="text-[12px] font-mono whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{output.stdout || output.stderr || "(no output)"}</pre>
        </div>
      )}
    </div>
  );
}
