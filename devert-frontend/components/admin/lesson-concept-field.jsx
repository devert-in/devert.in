"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { parseLesson, parseLessonBlocks } from "@/lib/lessonBlocks";
import { LessonBody } from "@/components/campus/lesson-blocks";

// The authoring surface for a lesson body, replacing the plain <Textarea> the
// four lesson editors (CS Core, Programming, Aptitude, Daily Learning) each
// used for their `concept` field. Three things it adds, all aimed at the same
// problem - the block format is only worth having if writing it is easier
// than writing a wall of prose:
//
//   1. an insert palette, so nobody has to memorize `::: checkpoint` syntax
//   2. a live preview rendered with the REAL student renderer, inside a
//      .campus-theme wrapper (Campus's CSS vars only resolve in that scope,
//      and the admin console is the app's permanent dark theme, not Campus's)
//   3. an unclosed-fence warning - the parser deliberately never drops
//      content on a missing `:::`, which means a typo shows up as one giant
//      callout rather than an error, so the editor has to say so out loud.
//
// Styled to match the admin console's own Input/Textarea primitives (dark
// surface, cyan focus ring) rather than importing them - they're local to
// app/admin/page.jsx.

const SNIPPETS = [
  { label: "Section", color: "#00FFFF", text: "\n## Section title\n\n" },
  { label: "Story", color: "#C77DFF", text: "\n::: story\nImagine you're standing in a packed restaurant at dinner rush...\n:::\n" },
  { label: "Analogy", color: "#00FFFF", text: "\n::: analogy Optional title\nThe everyday thing this works exactly like.\n:::\n" },
  { label: "Fun fact", color: "#FFD700", text: "\n::: funfact\nThe surprising bit of trivia.\n:::\n" },
  { label: "Did you know", color: "#C77DFF", text: "\n::: didyouknow\nThe unexpected insight.\n:::\n" },
  { label: "Mistake", color: "#FF5050", text: "\n::: mistake\nWhat students get wrong here, and what's actually true.\n:::\n" },
  { label: "Remember", color: "#00FF41", text: "\n::: remember\nThe one sentence worth keeping.\n:::\n" },
  { label: "Behind scenes", color: "#00FFFF", text: "\n::: behind\nWhat the machine is really doing underneath.\n:::\n" },
  { label: "Interview", color: "#FF9500", text: "\n::: interview\nWhy interviewers ask this, and what a strong answer sounds like.\n:::\n" },
  { label: "Revision", color: "#00FF41", text: "\n::: revision\n- First thing to recall\n- Second thing to recall\n:::\n" },
  { label: "Pull quote", color: "#FFFFFF", text: "\n::: quote\nThe line worth interrupting the page for.\n:::\n" },
  { label: "Cards", color: "#00FF41", text: "\n::: cards Optional title\nFirst thing :: What it does\nSecond thing :: What it does\n:::\n" },
  { label: "Flow", color: "#00FFFF", text: "\n::: flow\nUser -> Application -> Operating System -> Hardware\n:::\n" },
  { label: "Timeline", color: "#FF9500", text: "\n::: timeline Optional title\nStep one :: What happens here\nStep two :: What happens next\n:::\n" },
  { label: "Checkpoint", color: "#FFD700", text: "\n::: checkpoint\nThe question that makes them predict what happens next?\n- ( ) A plausible wrong answer\n- (x) The right answer\n> Why the right one is right.\n:::\n" },
  { label: "Reveal", color: "#C77DFF", text: "\n::: reveal Something they should try to answer first\nThe answer, hidden until they click.\n:::\n" },
];

const CHEATSHEET = [
  ["## Heading", "Starts a new section. Two or more make a jump-to-section rail appear for students."],
  ["### Heading", "A sub-heading inside a section - does not start a new one."],
  ["- item", "A bulleted list, exactly as before."],
  ["  two-space indent", "A pseudocode / worked-example block, exactly as before."],
  ["**bold**  *italic*  `code`", "Inline formatting. An unmatched marker stays literal, so existing backticks are safe."],
  ["Term :: Body", "The row format inside cards, timeline, and captioned flow steps."],
  ["- (x) option", "Marks the correct answer inside a checkpoint. `- ( )` marks a wrong one."],
  ["> text", "The explanation shown after a checkpoint is answered."],
];

export function LessonConceptField({
  label = "CONCEPT / LEARNING MATERIAL",
  value,
  onChange,
  rows = 14,
  hint,
}) {
  const textareaRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const stats = useMemo(() => {
    const blocks = parseLessonBlocks(value || "");
    const sections = parseLesson(value || "").filter(s => s.title).length;
    const counts = {};
    blocks.forEach(b => { counts[b.type] = (counts[b.type] || 0) + 1; });
    // An opening fence with no closing one swallows everything after it. The
    // parser keeps that content (by design), but silently, so warn here.
    const lines = (value || "").split("\n");
    const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
    const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
    return { sections, counts, unclosed: opens - closes };
  }, [value]);

  const insert = (snippet) => {
    const el = textareaRef.current;
    const current = value || "";
    if (!el) { onChange(current + snippet); return; }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + snippet + current.slice(end);
    onChange(next);
    // Put the caret just after the inserted snippet so the author can keep
    // typing where the placeholder text is, instead of being thrown back to
    // the top of a long lesson.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const richCount = Object.entries(stats.counts)
    .filter(([type]) => !["prose", "list", "code"].includes(type))
    .reduce((n, [, c]) => n + c, 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <p className="font-mono text-[10px] text-white/30 tracking-wider">{label}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowHelp(o => !o)}
            className="font-mono text-[10px] flex items-center gap-1" style={{ color: "rgba(0,255,255,0.7)" }}>
            block format
            <ChevronDown size={10} style={{ transform: showHelp ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>
          <button type="button" onClick={() => setShowPreview(o => !o)}
            className="font-mono text-[10px] flex items-center gap-1" style={{ color: showPreview ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
            {showPreview ? <EyeOff size={10} /> : <Eye size={10} />}
            {showPreview ? "hide preview" : "student preview"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-1.5">
        {SNIPPETS.map(s => (
          <button key={s.label} type="button" onClick={() => insert(s.text)}
            className="font-mono text-[9.5px] px-2 py-1 rounded transition-colors"
            style={{ color: s.color, background: `${s.color}14`, border: `1px solid ${s.color}30` }}
            title={`Insert a ${s.label.toLowerCase()} block at the cursor`}>
            + {s.label}
          </button>
        ))}
      </div>

      {showHelp && (
        <div className="mb-1.5 p-2.5 rounded space-y-1.5" style={{ background: "rgba(0,255,255,0.04)", border: "1px solid rgba(0,255,255,0.15)" }}>
          {CHEATSHEET.map(([syntax, meaning]) => (
            <div key={syntax} className="flex gap-2.5 items-start">
              <code className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 whitespace-pre"
                style={{ background: "rgba(0,0,0,0.4)", color: "#00FFFF" }}>{syntax}</code>
              <span className="font-mono text-[10px] text-white/45 leading-relaxed">{meaning}</span>
            </div>
          ))}
          <p className="font-mono text-[10px] text-white/30 pt-1 leading-relaxed">
            Anything that matches none of the above renders as ordinary prose, so a lesson written the old way keeps working untouched.
          </p>
        </div>
      )}

      <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder="Open with a story or an everyday analogy, then name the concept. Use the buttons above to drop in callouts, diagrams and checkpoints."
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-y transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />

      <div className="flex items-center gap-3 mt-1 flex-wrap">
        <p className="font-mono text-[10px] text-white/25">
          {stats.sections} section{stats.sections === 1 ? "" : "s"} · {richCount} rich block{richCount === 1 ? "" : "s"} · {(value || "").trim().split(/\s+/).filter(Boolean).length} words
        </p>
        {stats.unclosed > 0 && (
          <p className="font-mono text-[10px] flex items-center gap-1" style={{ color: "#FF9500" }}>
            <AlertTriangle size={10} />
            {stats.unclosed} block{stats.unclosed === 1 ? "" : "s"} never closed with a `:::` line - everything after it will render inside that block.
          </p>
        )}
        {hint && <p className="font-mono text-[10px] text-white/20">{hint}</p>}
      </div>

      {showPreview && (
        <div className="mt-2 rounded overflow-hidden" style={{ border: "1px solid rgba(0,255,65,0.25)" }}>
          <p className="font-mono text-[9.5px] tracking-widest px-3 py-1.5" style={{ background: "rgba(0,255,65,0.08)", color: "#00FF41" }}>
            EXACTLY WHAT A STUDENT SEES
          </p>
          {/* .campus-theme scopes the --campus-* vars the student renderer
              styles against; without it every CAMPUS token resolves to
              nothing and the preview renders unstyled. */}
          <div className="campus-theme p-4" style={{ background: "var(--campus-paper)" }}>
            <LessonBody text={value || ""} />
          </div>
        </div>
      )}
    </div>
  );
}
