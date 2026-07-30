"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowRight, Brain, Briefcase, CheckCircle2, ChevronDown,
  Clapperboard, Copy, Globe, HelpCircle, Info, Layers, Lightbulb, Microscope,
  Quote, RotateCcw, ScrollText, Sparkles, Target, X as XIcon,
} from "lucide-react";
import { parseLesson, parseLessonBlocks, tokenizeInline } from "@/lib/lessonBlocks";

// The DARK renderer for the shared lesson format.
//
// lib/lessonBlocks.js parses; this draws. That split already existed for a
// reason - components/campus/lesson-blocks.jsx is the other renderer - and it is
// exactly why this course could reuse the authoring format without touching it.
// The parser is pure and theme-free; only the drawing differs.
//
// Why a second renderer instead of making the Campus one theme-aware: the Campus
// renderer styles everything off CAMPUS.* CSS vars, which swap with that
// surface's light/dark toggle. The core platform is permanently dark with neon
// accents and a terminal chrome vocabulary (see app/globals.css and CLAUDE.md's
// design system). Threading a theme through the Campus renderer would mean
// touching a component five learning modules already depend on, to serve one new
// one. A separate renderer over a shared parser is the cheaper and safer seam.

const ACCENT = {
  green: "#00FF41",
  cyan: "#00FFFF",
  orange: "#FF9500",
  purple: "#C77DFF",
  gold: "#FFD700",
  red: "#FF5050",
  blue: "#3B82F6",
  violet: "#A78BFA",
};

// variant -> icon + accent + label. The label is the TEACHING frame ("REAL-LIFE
// ANALOGY", "COMMON MISTAKE") so a learner skimming can tell what kind of help
// each card offers before reading a word of it. Lucide only, no emoji - these
// labels are precisely where emoji would otherwise creep in.
const CALLOUT_STYLE = {
  story:      { icon: Clapperboard, color: ACCENT.purple, label: "STORY" },
  analogy:    { icon: Globe,        color: ACCENT.cyan,   label: "REAL-LIFE ANALOGY" },
  funfact:    { icon: Sparkles,     color: ACCENT.gold,   label: "FUN FACT" },
  didyouknow: { icon: Brain,        color: ACCENT.purple, label: "DID YOU KNOW?" },
  mistake:    { icon: AlertTriangle, color: ACCENT.red,   label: "COMMON MISTAKE" },
  remember:   { icon: Target,       color: ACCENT.green,  label: "REMEMBER THIS" },
  behind:     { icon: Microscope,   color: ACCENT.blue,   label: "BEHIND THE SCENES" },
  interview:  { icon: Briefcase,    color: ACCENT.orange, label: "IN AN INTERVIEW" },
  revision:   { icon: ScrollText,   color: ACCENT.green,  label: "QUICK RECAP" },
  tip:        { icon: Lightbulb,    color: ACCENT.gold,   label: "TIP" },
  note:       { icon: Info,         color: ACCENT.cyan,   label: "NOTE" },
};

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

// Renders React nodes, never HTML. Lesson text is admin-authored and therefore
// trusted-ish, but there is no reason to open an injection path for typography.
export function Inline({ text }) {
  const tokens = useMemo(() => tokenizeInline(text), [text]);
  return tokens.map((t, i) => {
    if (t.type === "code") {
      return (
        <code key={i} className="font-mono text-[0.9em] px-1.5 py-[1px] rounded"
          style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.18)", color: ACCENT.cyan }}>
          {t.text}
        </code>
      );
    }
    if (t.type === "bold") return <b key={i} className="text-white/95 font-semibold">{t.text}</b>;
    if (t.type === "italic") return <i key={i} className="text-white/70">{t.text}</i>;
    return <span key={i}>{t.text}</span>;
  });
}

// ---------------- callouts ----------------

function Callout({ variant, title, blocks }) {
  const motionProps = useBlockMotion();

  // A pull quote is a callout to the parser but not visually a card - the one
  // variant meant to interrupt the reading rhythm rather than sit beside it.
  if (variant === "quote") {
    return (
      <motion.blockquote {...motionProps} className="pl-4 py-1 my-1"
        style={{ borderLeft: `2px solid ${ACCENT.green}` }}>
        <Quote size={14} style={{ color: ACCENT.green }} className="mb-1.5" />
        <div className="text-[15px] leading-relaxed font-medium text-white/85">
          <LessonBlocks blocks={blocks} />
        </div>
        {title && <footer className="font-mono text-[11px] mt-2 text-white/30">{title}</footer>}
      </motion.blockquote>
    );
  }

  const style = CALLOUT_STYLE[variant] || { icon: Info, color: "rgba(255,255,255,0.35)", label: variant.toUpperCase() };
  const Icon = style.icon;

  return (
    <motion.div {...motionProps} className="rounded-xl p-4"
      style={{ background: `${style.color}0A`, border: `1px solid ${style.color}2E` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color: style.color, flexShrink: 0 }} />
        <span className="font-mono text-[9.5px] tracking-[0.15em]" style={{ color: style.color }}>{style.label}</span>
      </div>
      {title && <b className="block text-[13.5px] text-white/90 mb-1.5">{title}</b>}
      <LessonBlocks blocks={blocks} />
    </motion.div>
  );
}

// ---------------- expandable cards ----------------

function CardGrid({ title, items }) {
  const [open, setOpen] = useState(null);
  const motionProps = useBlockMotion();
  const reduce = useReducedMotion();

  return (
    <motion.div {...motionProps}>
      {title && (
        <p className="font-mono text-[10px] tracking-[0.15em] text-white/30 mb-2.5">{title.toUpperCase()}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((item, i) => {
          const isOpen = open === i;
          const expandable = !!item.body;
          return (
            <div key={i} className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <button onClick={() => expandable && setOpen(isOpen ? null : i)}
                aria-expanded={expandable ? isOpen : undefined} disabled={!expandable}
                className="w-full flex items-center gap-2.5 p-3.5 text-left">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,255,65,0.08)", color: ACCENT.green }}>
                  <Layers size={14} />
                </span>
                <b className="flex-1 text-[12.5px] text-white/85"><Inline text={item.term} /></b>
                {expandable && (
                  <ChevronDown size={13} className="text-white/25 flex-shrink-0"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: reduce ? "none" : "transform 0.18s" }} />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={reduce ? {} : { height: "auto", opacity: 1 }}
                    exit={reduce ? {} : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }} style={{ overflow: "hidden" }}>
                    <p className="text-[12.5px] leading-relaxed px-3.5 pb-3.5 pt-0.5 text-white/55">
                      <Inline text={item.body} />
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------------- flow diagram ----------------

// This is the workhorse of the whole course: nearly every lesson explains a
// chain (browser -> DNS -> server -> database -> response). Steps stack
// vertically with a down-arrow, and lay out horizontally from `sm:` up when no
// step has a caption, because a short chain reads better as one line - captioned
// steps stay vertical, since caption text in a horizontal row collapses into
// unreadable columns on a phone.
function FlowDiagram({ title, steps }) {
  const motionProps = useBlockMotion();
  const hasCaptions = steps.some(s => s.body);
  const horizontal = !hasCaptions && steps.length <= 5;

  const node = (step, i) => (
    <div key={i} className="rounded-xl px-3.5 py-2.5 text-center flex-1"
      style={{ background: "rgba(0,255,65,0.04)", border: "1px solid rgba(0,255,65,0.2)" }}>
      <b className="text-[12.5px] block text-white/90"><Inline text={step.term} /></b>
      {step.body && (
        <span className="text-[11.5px] block mt-0.5 text-white/45"><Inline text={step.body} /></span>
      )}
    </div>
  );

  return (
    <motion.figure {...motionProps} className="my-1">
      {title && (
        <figcaption className="font-mono text-[10px] tracking-[0.15em] text-white/30 mb-2.5">
          {title.toUpperCase()}
        </figcaption>
      )}

      <div className={`flex flex-col items-stretch gap-1.5 ${horizontal ? "sm:hidden" : ""}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-stretch gap-1.5">
            {node(step, i)}
            {i < steps.length - 1 && (
              <ArrowDown size={13} className="self-center" style={{ color: ACCENT.green }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {horizontal && (
        <div className="hidden sm:flex items-stretch gap-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              {node(step, i)}
              {i < steps.length - 1 && (
                <ArrowRight size={13} className="flex-shrink-0" style={{ color: ACCENT.green }} aria-hidden="true" />
              )}
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
      {title && (
        <figcaption className="font-mono text-[10px] tracking-[0.15em] text-white/30 mb-3">
          {title.toUpperCase()}
        </figcaption>
      )}
      <ol className="relative pl-7">
        <span className="absolute left-[11px] top-1.5 bottom-1.5 w-px" style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden="true" />
        {steps.map((step, i) => (
          <li key={i} className={i === steps.length - 1 ? "relative" : "relative pb-4"}>
            <span className="absolute left-[-27px] top-0 w-[23px] h-[23px] rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
              style={{ background: "rgba(0,255,255,0.08)", border: `1px solid ${ACCENT.cyan}55`, color: ACCENT.cyan }}>
              {i + 1}
            </span>
            <b className="text-[13px] block text-white/90"><Inline text={step.term} /></b>
            {step.body && (
              <span className="text-[12.5px] leading-relaxed block mt-0.5 text-white/55">
                <Inline text={step.body} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </motion.figure>
  );
}

// ---------------- inline checkpoint ----------------

// A formative, mid-lesson "can you predict what happens next?" question.
// Deliberately NOT the graded knowledge check: no score is kept, answering is
// optional, retrying is free. The entire purpose is to interrupt passive
// reading. The reward-bearing check lives in the lesson's own Knowledge Check
// section.
function Checkpoint({ title, question, options, explanation }) {
  const [picked, setPicked] = useState(null);
  const motionProps = useBlockMotion();
  const answered = picked !== null;
  const wasRight = answered && options[picked]?.correct;

  return (
    <motion.div {...motionProps} className="rounded-xl p-4"
      style={{ background: "rgba(0,255,255,0.04)", border: `1px solid ${ACCENT.cyan}2E` }}>
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={13} style={{ color: ACCENT.cyan, flexShrink: 0 }} />
        <span className="font-mono text-[9.5px] tracking-[0.15em]" style={{ color: ACCENT.cyan }}>QUICK CHECK</span>
      </div>
      {title && <b className="block text-[13.5px] text-white/90 mb-1.5">{title}</b>}
      {question && (
        <p className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap text-white/80">
          <Inline text={question} />
        </p>
      )}

      <div className="space-y-1.5">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          // Once answered, the correct option is always marked - a learner who
          // guessed wrong still learns which one was right without re-answering.
          const showCorrect = answered && opt.correct;
          const showWrong = isPicked && !opt.correct;
          const accent = showCorrect ? ACCENT.green : showWrong ? ACCENT.red : "rgba(255,255,255,0.12)";
          return (
            <button key={i} onClick={() => !answered && setPicked(i)} disabled={answered}
              className="w-full flex items-center gap-2 text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors"
              style={{
                background: showCorrect ? "rgba(0,255,65,0.08)" : showWrong ? "rgba(255,80,80,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${accent}`,
                color: "rgba(255,255,255,0.85)",
              }}>
              {showCorrect && <CheckCircle2 size={13} style={{ color: ACCENT.green, flexShrink: 0 }} />}
              {showWrong && <XIcon size={13} style={{ color: ACCENT.red, flexShrink: 0 }} />}
              <span className="flex-1"><Inline text={opt.text} /></span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className="mt-3">
            <p className="text-[12px] font-semibold mb-1" style={{ color: wasRight ? ACCENT.green : ACCENT.orange }}>
              {wasRight ? "Exactly right." : "Not quite - here's why."}
            </p>
            {explanation && (
              <p className="text-[12.5px] leading-relaxed text-white/55"><Inline text={explanation} /></p>
            )}
            <button onClick={() => setPicked(null)}
              className="inline-flex items-center gap-1 font-mono text-[10.5px] mt-2 text-white/30 hover:text-white/60 transition-colors">
              <RotateCcw size={11} /> try again
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------- progressive reveal ----------------

function Reveal({ title, blocks }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-3.5 text-left">
        <Lightbulb size={14} style={{ color: ACCENT.gold, flexShrink: 0 }} />
        <span className="flex-1 text-[13px] font-semibold text-white/85">{title || "Reveal the answer"}</span>
        <ChevronDown size={14} className="text-white/25 flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: reduce ? "none" : "transform 0.18s" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? {} : { height: "auto", opacity: 1 }}
            exit={reduce ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }} style={{ overflow: "hidden" }}>
            <div className="px-3.5 pb-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="pt-3"><LessonBlocks blocks={blocks} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- pseudocode ----------------

function Pseudocode({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[9px] tracking-[0.15em] text-white/25">PSEUDOCODE</span>
        <button onClick={copy} className="flex items-center gap-1 font-mono text-[9.5px] text-white/30 hover:text-white/60 transition-colors">
          <Copy size={10} /> {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="font-mono text-[12px] p-3 overflow-x-auto text-white/70"
        style={{ background: "rgba(0,0,0,0.3)" }}>{text}</pre>
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
              ? <h2 key={i} id={b.id} className="text-[17px] font-bold text-white/95 pt-1 scroll-mt-28">{b.text}</h2>
              : <h3 key={i} id={b.id} className="text-[14px] font-bold text-white/85 pt-0.5 scroll-mt-28">{b.text}</h3>;
          case "code":
            return <Pseudocode key={i} text={b.text} />;
          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-white/60">
                    <span className="mt-[8px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: ACCENT.green }} />
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
          case "checkpoint":
            return <Checkpoint key={i} title={b.title} question={b.question} options={b.options} explanation={b.explanation} />;
          case "reveal":
            return <Reveal key={i} title={b.title} blocks={b.blocks} />;
          default:
            return (
              <p key={i} className="text-[14px] leading-[1.8] whitespace-pre-wrap text-white/65">
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

// Flat renderer, no section chrome - for a lesson body nested inside other UI.
export function SeConcept({ text }) {
  const blocks = useMemo(() => parseLessonBlocks(text), [text]);
  return <LessonBlocks blocks={blocks} />;
}

// ---------------- the sectioned reading experience ----------------

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] || null);
  useEffect(() => {
    if (ids.length < 2 || typeof IntersectionObserver === "undefined") return;
    const nodes = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (nodes.length === 0) return;
    // rootMargin biases toward the section in the upper-middle of the viewport,
    // where a reader's attention actually is - a plain "topmost visible" test
    // flickers between two sections at a boundary.
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
    <nav aria-label="Lesson sections" className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {sections.map(s => {
        const isActive = s.id === active;
        return (
          <button key={s.id} onClick={() => jump(s.id)} aria-current={isActive ? "true" : undefined}
            className="font-mono text-[10.5px] px-2.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors"
            style={{
              background: isActive ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isActive ? `${ACCENT.green}55` : "rgba(255,255,255,0.08)"}`,
              color: isActive ? ACCENT.green : "rgba(255,255,255,0.4)",
            }}>
            {s.title}
          </button>
        );
      })}
    </nav>
  );
}

// A legacy body with no `##` headings renders as one untitled section with no
// rail - identical output to the flat renderer, which is what makes this safe to
// use everywhere before any content has been converted.
export function SeLessonBody({ text }) {
  const sections = useMemo(() => parseLesson(text), [text]);
  const titled = sections.filter(s => s.title);
  const ids = useMemo(() => titled.map(s => s.id), [titled]);
  const active = useActiveSection(ids);

  if (sections.length === 0) return null;

  return (
    <div>
      {titled.length >= 2 && (
        <div className="mb-4 sticky top-0 z-10 py-2 -mx-1 px-1 backdrop-blur"
          style={{ background: "rgba(5,5,5,0.85)" }}>
          <SectionRail sections={titled} active={active} />
        </div>
      )}
      <div className="space-y-7">
        {sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-3.5">
            {section.title && (
              <h2 className="text-[18px] font-bold text-white/95">{section.title}</h2>
            )}
            <LessonBlocks blocks={section.blocks} />
          </section>
        ))}
      </div>
    </div>
  );
}

export { ACCENT as SE_ACCENT };
