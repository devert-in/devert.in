"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowRight, Brain, Briefcase, CheckCircle2, ChevronDown,
  Clapperboard, Copy, Globe, HelpCircle, Info, Layers, Lightbulb, Microscope,
  Quote, RotateCcw, ScrollText, Sparkles, Target, X as XIcon,
} from "lucide-react";
import { parseLesson, parseLessonBlocks, tokenizeInline } from "@/lib/lessonBlocks";
import { useSe } from "@/components/se/se-app";
import { usePalette, useCampusAccent } from "@/components/se/se-ui";
import { SE_ACCENT as ACCENT } from "@/lib/seCurriculum";

// The renderer for the shared lesson format, used both by the standalone
// /fundamentals route (permanently dark, neon accents, terminal chrome - see
// app/globals.css and CLAUDE.md's design system) and DeVert Campus's
// "Fundamentals" tab (Campus's own light-capable CAMPUS.* tokens) - see
// se-app.jsx's file header for the campusMode mechanism shared across all
// four se/ files. lib/lessonBlocks.js parses; this draws.
//
// components/campus/lesson-blocks.jsx is a SEPARATE, pre-existing Campus-
// native renderer over the same shared parser, used by Programming/CS Core's
// own lessons - not reused here because it doesn't cover this course's extra
// block types (flow diagrams, timelines, checkpoints, pseudocode), and this
// renderer already had to learn campusMode for its callouts/cards/etc
// regardless, so a second fork would only add a maintenance seam without
// saving any work.

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
  const p = usePalette();
  const cyanAccent = useCampusAccent(ACCENT.cyan);
  return tokens.map((t, i) => {
    if (t.type === "code") {
      return (
        <code key={i} className="font-mono text-[0.9em] px-1.5 py-[1px] rounded"
          style={{ background: `${cyanAccent}14`, border: `1px solid ${cyanAccent}30`, color: cyanAccent }}>
          {t.text}
        </code>
      );
    }
    if (t.type === "bold") return <b key={i} className="font-semibold" style={{ color: p.ink }}>{t.text}</b>;
    if (t.type === "italic") return <i key={i} style={{ color: p.inkSoft }}>{t.text}</i>;
    return <span key={i}>{t.text}</span>;
  });
}

// ---------------- callouts ----------------

function Callout({ variant, title, blocks }) {
  const motionProps = useBlockMotion();
  const p = usePalette();
  const greenAccent = useCampusAccent(ACCENT.green);
  const rawStyle = CALLOUT_STYLE[variant] || { icon: Info, color: null, label: variant.toUpperCase() };
  const styleColor = useCampusAccent(rawStyle.color) || p.inkFaint;

  // A pull quote is a callout to the parser but not visually a card - the one
  // variant meant to interrupt the reading rhythm rather than sit beside it.
  if (variant === "quote") {
    return (
      <motion.blockquote {...motionProps} className="pl-4 py-1 my-1" style={{ borderLeft: `2px solid ${greenAccent}` }}>
        <Quote size={14} style={{ color: greenAccent }} className="mb-1.5" />
        <div className="text-[15px] leading-relaxed font-medium" style={{ color: p.inkSoft }}>
          <LessonBlocks blocks={blocks} />
        </div>
        {title && <footer className="font-mono text-[11px] mt-2" style={{ color: p.inkFaint }}>{title}</footer>}
      </motion.blockquote>
    );
  }

  const Icon = rawStyle.icon;

  return (
    <motion.div {...motionProps} className="rounded-xl p-4"
      style={{ background: `${styleColor}0A`, border: `1px solid ${styleColor}2E` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color: styleColor, flexShrink: 0 }} />
        <span className="font-mono text-[9.5px] tracking-[0.15em]" style={{ color: styleColor }}>{rawStyle.label}</span>
      </div>
      {title && <b className="block text-[13.5px] mb-1.5" style={{ color: p.ink }}>{title}</b>}
      <LessonBlocks blocks={blocks} />
    </motion.div>
  );
}

// ---------------- expandable cards ----------------

function CardGrid({ title, items }) {
  const [open, setOpen] = useState(null);
  const motionProps = useBlockMotion();
  const reduce = useReducedMotion();
  const p = usePalette();
  const greenAccent = useCampusAccent(ACCENT.green);

  return (
    <motion.div {...motionProps}>
      {title && (
        <p className="font-mono text-[10px] tracking-[0.15em] mb-2.5" style={{ color: p.inkFaint }}>{title.toUpperCase()}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((item, i) => {
          const isOpen = open === i;
          const expandable = !!item.body;
          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: p.cardBg, border: `1px solid ${p.cardBorder}` }}>
              <button onClick={() => expandable && setOpen(isOpen ? null : i)}
                aria-expanded={expandable ? isOpen : undefined} disabled={!expandable}
                className="w-full flex items-center gap-2.5 p-3.5 text-left">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${greenAccent}14`, color: greenAccent }}>
                  <Layers size={14} />
                </span>
                <b className="flex-1 text-[12.5px]" style={{ color: p.inkSoft }}><Inline text={item.term} /></b>
                {expandable && (
                  <ChevronDown size={13} className="flex-shrink-0" style={{ color: p.inkFainter,
                    transform: isOpen ? "rotate(180deg)" : "none", transition: reduce ? "none" : "transform 0.18s" }} />
                )}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={reduce ? {} : { height: "auto", opacity: 1 }}
                    exit={reduce ? {} : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }} style={{ overflow: "hidden" }}>
                    <p className="text-[12.5px] leading-relaxed px-3.5 pb-3.5 pt-0.5" style={{ color: p.inkFaint }}>
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
  const p = usePalette();
  const greenAccent = useCampusAccent(ACCENT.green);

  const node = (step, i) => (
    <div key={i} className="rounded-xl px-3.5 py-2.5 text-center flex-1"
      style={{ background: `${greenAccent}0A`, border: `1px solid ${greenAccent}33` }}>
      <b className="text-[12.5px] block" style={{ color: p.ink }}><Inline text={step.term} /></b>
      {step.body && (
        <span className="text-[11.5px] block mt-0.5" style={{ color: p.inkFaint }}><Inline text={step.body} /></span>
      )}
    </div>
  );

  return (
    <motion.figure {...motionProps} className="my-1">
      {title && (
        <figcaption className="font-mono text-[10px] tracking-[0.15em] mb-2.5" style={{ color: p.inkFaint }}>
          {title.toUpperCase()}
        </figcaption>
      )}

      <div className={`flex flex-col items-stretch gap-1.5 ${horizontal ? "sm:hidden" : ""}`}>
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-stretch gap-1.5">
            {node(step, i)}
            {i < steps.length - 1 && (
              <ArrowDown size={13} className="self-center" style={{ color: greenAccent }} aria-hidden="true" />
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
                <ArrowRight size={13} className="flex-shrink-0" style={{ color: greenAccent }} aria-hidden="true" />
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
  const p = usePalette();
  const cyanAccent = useCampusAccent(ACCENT.cyan);
  return (
    <motion.figure {...motionProps} className="my-1">
      {title && (
        <figcaption className="font-mono text-[10px] tracking-[0.15em] mb-3" style={{ color: p.inkFaint }}>
          {title.toUpperCase()}
        </figcaption>
      )}
      <ol className="relative pl-7">
        <span className="absolute left-[11px] top-1.5 bottom-1.5 w-px" style={{ background: p.track }} aria-hidden="true" />
        {steps.map((step, i) => (
          <li key={i} className={i === steps.length - 1 ? "relative" : "relative pb-4"}>
            <span className="absolute left-[-27px] top-0 w-[23px] h-[23px] rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
              style={{ background: `${cyanAccent}14`, border: `1px solid ${cyanAccent}55`, color: cyanAccent }}>
              {i + 1}
            </span>
            <b className="text-[13px] block" style={{ color: p.ink }}><Inline text={step.term} /></b>
            {step.body && (
              <span className="text-[12.5px] leading-relaxed block mt-0.5" style={{ color: p.inkSoft }}>
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
  const p = usePalette();
  const cyanAccent = useCampusAccent(ACCENT.cyan);
  const greenAccent = useCampusAccent(ACCENT.green);
  const redAccent = useCampusAccent(ACCENT.red);
  const orangeAccent = useCampusAccent(ACCENT.orange);

  return (
    <motion.div {...motionProps} className="rounded-xl p-4" style={{ background: `${cyanAccent}0A`, border: `1px solid ${cyanAccent}2E` }}>
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle size={13} style={{ color: cyanAccent, flexShrink: 0 }} />
        <span className="font-mono text-[9.5px] tracking-[0.15em]" style={{ color: cyanAccent }}>QUICK CHECK</span>
      </div>
      {title && <b className="block text-[13.5px] mb-1.5" style={{ color: p.ink }}>{title}</b>}
      {question && (
        <p className="text-[13px] leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: p.inkSoft }}>
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
          const accent = showCorrect ? greenAccent : showWrong ? redAccent : p.cardBorder;
          return (
            <button key={i} onClick={() => !answered && setPicked(i)} disabled={answered}
              className="w-full flex items-center gap-2 text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors"
              style={{
                background: showCorrect ? `${greenAccent}14` : showWrong ? `${redAccent}14` : p.cardBg,
                border: `1px solid ${accent}`,
                color: p.inkSoft,
              }}>
              {showCorrect && <CheckCircle2 size={13} style={{ color: greenAccent, flexShrink: 0 }} />}
              {showWrong && <XIcon size={13} style={{ color: redAccent, flexShrink: 0 }} />}
              <span className="flex-1"><Inline text={opt.text} /></span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className="mt-3">
            <p className="text-[12px] font-semibold mb-1" style={{ color: wasRight ? greenAccent : orangeAccent }}>
              {wasRight ? "Exactly right." : "Not quite - here's why."}
            </p>
            {explanation && (
              <p className="text-[12.5px] leading-relaxed" style={{ color: p.inkFaint }}><Inline text={explanation} /></p>
            )}
            <button onClick={() => setPicked(null)}
              className="inline-flex items-center gap-1 font-mono text-[10.5px] mt-2 transition-colors" style={{ color: p.inkFainter }}>
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
  const p = usePalette();
  const goldAccent = useCampusAccent(ACCENT.gold);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: p.cardBg, border: `1px solid ${p.cardBorder}` }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-3.5 text-left">
        <Lightbulb size={14} style={{ color: goldAccent, flexShrink: 0 }} />
        <span className="flex-1 text-[13px] font-semibold" style={{ color: p.inkSoft }}>{title || "Reveal the answer"}</span>
        <ChevronDown size={14} className="flex-shrink-0" style={{ color: p.inkFainter,
          transform: open ? "rotate(180deg)" : "none", transition: reduce ? "none" : "transform 0.18s" }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? {} : { height: "auto", opacity: 1 }}
            exit={reduce ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }} style={{ overflow: "hidden" }}>
            <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${p.rowBorder}` }}>
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
  const p = usePalette();
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${p.cardBorder}` }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: p.cardBg, borderBottom: `1px solid ${p.rowBorder}` }}>
        <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: p.inkFainter }}>PSEUDOCODE</span>
        <button onClick={copy} className="flex items-center gap-1 font-mono text-[9.5px] transition-colors" style={{ color: p.inkFaint }}>
          <Copy size={10} /> {copied ? "copied" : "copy"}
        </button>
      </div>
      {/* Fixed dark code surface regardless of page theme - see CodeBlock's
          identical convention in se-lesson.jsx. */}
      <pre className="font-mono text-[12px] p-3 overflow-x-auto text-white/70"
        style={{ background: "rgba(0,0,0,0.3)" }}>{text}</pre>
    </div>
  );
}

// ---------------- block dispatch ----------------

export function LessonBlocks({ blocks }) {
  const p = usePalette();
  const greenAccent = useCampusAccent(ACCENT.green);
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return b.level === 2
              ? <h2 key={i} id={b.id} className="text-[17px] font-bold pt-1 scroll-mt-28" style={{ color: p.ink }}>{b.text}</h2>
              : <h3 key={i} id={b.id} className="text-[14px] font-bold pt-0.5 scroll-mt-28" style={{ color: p.inkSoft }}>{b.text}</h3>;
          case "code":
            return <Pseudocode key={i} text={b.text} />;
          case "list":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13.5px] leading-relaxed" style={{ color: p.inkSoft }}>
                    <span className="mt-[8px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: greenAccent }} />
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
              <p key={i} className="text-[14px] leading-[1.8] whitespace-pre-wrap" style={{ color: p.inkSoft }}>
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
  const p = usePalette();
  const greenAccent = useCampusAccent(ACCENT.green);
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
              background: isActive ? `${greenAccent}18` : p.cardBg,
              border: `1px solid ${isActive ? `${greenAccent}55` : p.cardBorder}`,
              color: isActive ? greenAccent : p.inkFainter,
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
  const { campusMode } = useSe();
  const p = usePalette();

  if (sections.length === 0) return null;

  return (
    <div>
      {titled.length >= 2 && (
        // Sticks directly under the workspace's own chrome (CampusTopBar -
        // top-3/lg:top-4 plus its own padded height). SeReadingBar (se-ui.jsx)
        // is static now, not sticky, so this is the only bar stacking here -
        // no second offset to account for.
        <div className={`mb-4 sticky z-10 py-2 -mx-1 px-1 ${campusMode ? "top-[88px] lg:top-[82px] campus-glass-nav" : "top-0 backdrop-blur"}`}
          style={campusMode ? undefined : { background: "rgba(5,5,5,0.85)" }}>
          <SectionRail sections={titled} active={active} />
        </div>
      )}
      <div className="space-y-7">
        {sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-28 space-y-3.5">
            {section.title && (
              <h2 className="text-[18px] font-bold" style={{ color: p.ink }}>{section.title}</h2>
            )}
            <LessonBlocks blocks={section.blocks} />
          </section>
        ))}
      </div>
    </div>
  );
}

export { ACCENT as SE_ACCENT };
