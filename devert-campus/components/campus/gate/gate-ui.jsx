"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bookmark, BookmarkCheck, Check, ChevronDown, Flag, Info, Lightbulb,
  Link2, ListChecks, Minus, Sigma, Timer, TrendingUp, X as XIcon, Zap,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton } from "@/components/campus/campus-ui";
import { Inline, LessonBody } from "@/components/campus/lesson-blocks";
import { negativeMarkFor } from "@/lib/gateTests";

// Shared GATE primitives. Everything here exists because it is used by three or
// more of the module's sixteen screens - the question renderer in particular is
// the same component in topic practice, the PYQ browser, a live test attempt and
// a post-test review, which is the only way those four can be guaranteed to
// grade and display an answer identically.

export const GATE_DIFF_COLOR = { Easy: CAMPUS.good, Moderate: CAMPUS.warn, Hard: CAMPUS.bad };

const TYPE_COLOR = { mcq: CAMPUS.blue, msq: CAMPUS.purple, nat: CAMPUS.teal };

// ---------------- small chrome ----------------

export function GateSectionHeading({ label, title, description, icon: Icon, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        {label && (
          <div className="flex items-center gap-2 mb-1.5">
            {Icon && <Icon size={13} style={{ color: CAMPUS.teal }} />}
            <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{label}</span>
          </div>
        )}
        <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{title}</h1>
        {description && (
          <p className="text-[12.5px] leading-relaxed mt-1 max-w-2xl" style={{ color: CAMPUS.inkSoft }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// A compact figure tile. `hint` becomes a title attribute rather than visible
// small print, so a dashboard of twelve of these stays readable - the tiles that
// need explaining most (predicted rank, percentile) are also the ones whose
// caveat is too long to render inline.
export function GateStat({ label, value, sub, color, icon: Icon, hint, onClick }) {
  return (
    <CampusCard hover={!!onClick} onClick={onClick} className={`p-3.5 ${onClick ? "cursor-pointer" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={11} style={{ color: color || CAMPUS.inkFaint }} />}
        <span className="text-[9.5px] font-mono tracking-widest truncate" style={{ color: CAMPUS.inkFaint }} title={hint || undefined}>
          {label.toUpperCase()}
        </span>
      </div>
      <span className="block font-mono text-xl font-bold leading-none" style={{ color: color || CAMPUS.ink }}>{value}</span>
      {sub && <span className="block text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>{sub}</span>}
    </CampusCard>
  );
}

// Every estimated figure in this module renders behind one of these, never bare.
// A predicted rank shown without its caveat is the single most misleading thing
// a preparation platform can put on a screen.
export function GateEstimateNote({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed mt-2" style={{ color: CAMPUS.inkFaint }}>
      <Info size={11} className="flex-shrink-0 mt-[1px]" />
      <span>{children}</span>
    </p>
  );
}

export function GateProgressRing({ pct, size = 64, stroke = 6, color = CAMPUS.teal, label }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CAMPUS.line} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[13px] font-bold leading-none" style={{ color: CAMPUS.ink }}>{clamped}%</span>
        {label && <span className="text-[8px] font-mono tracking-wider mt-0.5" style={{ color: CAMPUS.inkFaint }}>{label}</span>}
      </div>
    </div>
  );
}

// Horizontal bars for subject-wise anything (completion, accuracy, weightage).
// Bars rather than a pie: ten subjects in a pie chart is unreadable, and the
// comparison a student actually makes is "which of these is furthest behind",
// which is a length comparison.
export function GateBarList({ rows, valueKey = "pct", color = CAMPUS.teal, suffix = "%", emptyLabel = "No data yet.", onRowClick }) {
  if (!rows?.length) return <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>{emptyLabel}</p>;
  const max = Math.max(...rows.map(r => Number(r[valueKey]) || 0), 1);
  return (
    <div className="space-y-2.5">
      {rows.map(row => {
        const v = Number(row[valueKey]) || 0;
        const rowColor = row.color || color;
        return (
          <button key={row.key || row.subjectId || row.label} disabled={!onRowClick}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className="w-full text-left block">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-[12px] truncate" style={{ color: CAMPUS.ink }}>{row.label || row.name}</span>
              <span className="text-[11px] font-mono flex-shrink-0 tabular-nums" style={{ color: rowColor }}>
                {v}{suffix}{row.sub ? <span style={{ color: CAMPUS.inkFaint }}> · {row.sub}</span> : null}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
              <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: rowColor, transition: "width 0.5s ease-out" }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- filter pills ----------------

export function GateFilterRow({ label, options, value, onChange, allLabel = "All" }) {
  const all = [{ v: null, label: allLabel }, ...options];
  return (
    <div className="min-w-0">
      {label && <p className="text-[9.5px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>{label}</p>}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {all.map(opt => {
          const active = value === opt.v;
          return (
            <button key={String(opt.v)} onClick={() => onChange(opt.v)}
              className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors"
              style={{
                background: active ? CAMPUS.tealTint : CAMPUS.paper,
                border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
              }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- question rendering ----------------

export function GateQuestionTypeChip({ questionType, marks }) {
  const color = TYPE_COLOR[questionType] || CAMPUS.inkFaint;
  return (
    <span className="inline-flex items-center gap-1.5 flex-shrink-0">
      <CampusChip color={color}>{(questionType || "").toUpperCase()}</CampusChip>
      {marks ? <CampusChip color={CAMPUS.gold}>{marks} MARK{marks === 2 ? "S" : ""}</CampusChip> : null}
    </span>
  );
}

export function GateBookmarkButton({ on, onToggle, size = 13 }) {
  const Icon = on ? BookmarkCheck : Bookmark;
  return (
    <button onClick={onToggle} title={on ? "Remove bookmark" : "Bookmark"}
      className="flex-shrink-0 p-1 rounded transition-colors"
      style={{ color: on ? CAMPUS.gold : CAMPUS.inkFaint }}>
      <Icon size={size} />
    </button>
  );
}

// One question, in every mode the module needs:
//   mode="answer"  a live attempt - inputs enabled, nothing revealed
//   mode="review"  after grading - inputs locked, correct/incorrect marked
//   mode="study"   the PYQ browser - answer freely, reveal on demand
//
// `answerKey` is only ever passed in review/study mode. In answer mode the
// caller does not HAVE the key (firestore.rules denies it until submission), so
// there is no way for this component to leak it even by accident - the absence
// is structural, not a conditional render.
export function GateQuestion({
  question, index, total, answer, onAnswer, answerKey, mode = "answer",
  reviewFlagged, onToggleReviewFlag, bookmarked, onToggleBookmark, timeSec,
}) {
  const locked = mode === "review";
  const correctIds = answerKey?.correctOptionIds || [];
  const isMsq = question.questionType === "msq";
  const isNat = question.questionType === "nat";

  const selected = useMemo(() => {
    if (isNat) return [];
    return Array.isArray(answer) ? answer : (answer ? [answer] : []);
  }, [answer, isNat]);

  const pick = (optId) => {
    if (locked) return;
    if (isMsq) {
      const next = selected.includes(optId) ? selected.filter(x => x !== optId) : [...selected, optId];
      onAnswer(next);
    } else {
      // Tapping the already-selected option clears it. Deselecting matters in
      // GATE specifically: with negative marking on MCQs, "I want to un-answer
      // this" is a real and correct decision, and a UI that forces a student to
      // keep a guess they've changed their mind about costs them a third of a
      // mark.
      onAnswer(selected[0] === optId ? null : optId);
    }
  };

  const neg = negativeMarkFor(question);

  return (
    <CampusCard className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold" style={{ color: CAMPUS.inkFaint }}>
            Q{index != null ? index + 1 : ""}{total ? ` / ${total}` : ""}
          </span>
          <GateQuestionTypeChip questionType={question.questionType} marks={question.marks} />
          {question.difficulty && (
            <CampusChip color={GATE_DIFF_COLOR[question.difficulty] || CAMPUS.inkFaint}>{question.difficulty}</CampusChip>
          )}
          {question.year && <CampusChip color={CAMPUS.inkFaint}>GATE {question.year}</CampusChip>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {Number.isFinite(timeSec) && (
            <span className="flex items-center gap-1 text-[10.5px] font-mono mr-1" style={{ color: CAMPUS.inkFaint }}>
              <Timer size={11} /> {formatDuration(timeSec)}
            </span>
          )}
          {onToggleBookmark && <GateBookmarkButton on={bookmarked} onToggle={onToggleBookmark} />}
          {onToggleReviewFlag && (
            <button onClick={onToggleReviewFlag} title={reviewFlagged ? "Unflag" : "Mark for review"}
              className="p-1 rounded" style={{ color: reviewFlagged ? CAMPUS.warn : CAMPUS.inkFaint }}>
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[13.5px] leading-[1.7] whitespace-pre-wrap mb-3" style={{ color: CAMPUS.ink }}>
        <Inline text={question.question} />
      </p>

      {question.codeSnippet?.trim() && (
        <pre className="text-[12px] font-mono p-3 rounded-lg overflow-x-auto mb-3"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
          {question.codeSnippet}
        </pre>
      )}

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.imageUrl} alt="" className="rounded-lg mb-3 max-w-full"
          style={{ border: `1px solid ${CAMPUS.line}` }} />
      )}

      {isNat ? (
        <NatInput question={question} answer={answer} onAnswer={onAnswer} locked={locked}
          answerKey={mode !== "answer" ? answerKey : null} />
      ) : (
        <div className="space-y-1.5">
          {(question.options || []).map(opt => {
            const isSelected = selected.includes(opt.id);
            const isCorrect = mode !== "answer" && correctIds.includes(opt.id);
            const isWrong = mode !== "answer" && isSelected && !correctIds.includes(opt.id);
            const accent = isCorrect ? CAMPUS.good : isWrong ? CAMPUS.bad : isSelected ? CAMPUS.teal : CAMPUS.line;
            return (
              <button key={opt.id} onClick={() => pick(opt.id)} disabled={locked}
                className="w-full flex items-start gap-2.5 text-left text-[12.5px] px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  background: isCorrect ? CAMPUS.goodTint : isWrong ? CAMPUS.badTint : isSelected ? CAMPUS.tealTint : CAMPUS.surface,
                  border: `1px solid ${accent}`, color: CAMPUS.ink,
                }}>
                <span className={`w-4 h-4 flex items-center justify-center flex-shrink-0 mt-[1px] ${isMsq ? "rounded" : "rounded-full"}`}
                  style={{ border: `1.5px solid ${isSelected || isCorrect ? accent : CAMPUS.inkFaint}`, background: isSelected || isCorrect ? accent : "transparent" }}>
                  {isCorrect && <Check size={10} style={{ color: CAMPUS.surface }} />}
                  {isWrong && <XIcon size={10} style={{ color: CAMPUS.surface }} />}
                  {isSelected && !isCorrect && !isWrong && <Check size={10} style={{ color: CAMPUS.surface }} />}
                </span>
                <span className="flex-1"><Inline text={opt.text} /></span>
              </button>
            );
          })}
        </div>
      )}

      {mode === "answer" && neg > 0 && (
        <p className="flex items-center gap-1.5 text-[10.5px] font-mono mt-2.5" style={{ color: CAMPUS.warn }}>
          <Minus size={10} /> Wrong answer costs {neg === 2 / 3 ? "2/3" : "1/3"} mark
        </p>
      )}
      {mode === "answer" && neg === 0 && question.questionType !== "mcq" && (
        <p className="text-[10.5px] font-mono mt-2.5" style={{ color: CAMPUS.inkFaint }}>
          No negative marking on {question.questionType?.toUpperCase()} questions.
        </p>
      )}
    </CampusCard>
  );
}

function NatInput({ question, answer, onAnswer, locked, answerKey }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number" step="any" inputMode="decimal" disabled={locked}
          value={answer ?? ""}
          onChange={e => onAnswer(e.target.value === "" ? null : Number(e.target.value))}
          placeholder="Type your answer"
          className="font-mono text-[13px] px-3 py-2 rounded-lg outline-none w-44"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
        />
        {question.natUnit && <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{question.natUnit}</span>}
      </div>
      {answerKey && Number.isFinite(answerKey.natMin) && (
        <p className="text-[11px] font-mono mt-2" style={{ color: CAMPUS.good }}>
          Accepted: {answerKey.natMin === answerKey.natMax
            ? answerKey.natMin
            : `${answerKey.natMin} to ${answerKey.natMax}`}
        </p>
      )}
    </div>
  );
}

// The full solution treatment the product asks for on every question: worked
// solution, explanation, an alternate approach, the time-saving trick, why
// students get it wrong, and related concepts. Each block renders only when
// authored - an unauthored "Alternate solution" heading over empty space is
// worse than its absence.
export function GateSolution({ answerKey, defaultOpen = false, relatedTopicResolver }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  if (!answerKey) return null;

  const blocks = [
    { key: "solution", label: "Solution", icon: Sigma, color: CAMPUS.teal, text: answerKey.solution, rich: true },
    { key: "explanation", label: "Explanation", icon: Info, color: CAMPUS.blue, text: answerKey.explanation, rich: true },
    { key: "alternateSolution", label: "Alternate approach", icon: TrendingUp, color: CAMPUS.purple, text: answerKey.alternateSolution, rich: true },
    { key: "timeSavingTrick", label: "Time-saving trick", icon: Zap, color: CAMPUS.gold, text: answerKey.timeSavingTrick },
    { key: "whyStudentsErr", label: "Why students get this wrong", icon: Lightbulb, color: CAMPUS.warn, text: answerKey.whyStudentsErr },
  ].filter(b => b.text?.trim());

  const related = answerKey.relatedConcepts || [];
  if (blocks.length === 0 && related.length === 0) return null;

  return (
    <CampusCard className="overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-3.5 text-left">
        <ListChecks size={14} style={{ color: CAMPUS.teal, flexShrink: 0 }} />
        <span className="flex-1 text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
          {open ? "Hide solution" : "Show solution"}
        </span>
        <ChevronDown size={14} style={{
          color: CAMPUS.inkFaint, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: reduce ? "none" : "transform 0.18s",
        }} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          {blocks.map(b => (
            <div key={b.key} className="pt-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <b.icon size={12} style={{ color: b.color }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: b.color }}>{b.label.toUpperCase()}</span>
              </div>
              {b.rich
                ? <LessonBody text={b.text} />
                : <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}><Inline text={b.text} /></p>}
            </div>
          ))}
          {related.length > 0 && (
            <div className="pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 size={12} style={{ color: CAMPUS.inkFaint }} />
                <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>RELATED CONCEPTS</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {related.map((c, i) => {
                  const target = relatedTopicResolver?.(c);
                  return target ? (
                    <button key={i} onClick={target.onClick}
                      className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.teal}`, color: CAMPUS.teal }}>
                      {target.label}
                    </button>
                  ) : (
                    <span key={i} className="text-[11.5px] px-2.5 py-1 rounded-full"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                      {c}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </CampusCard>
  );
}

// ---------------- question palette (test attempt navigator) ----------------

// The grid every serious test interface has: one cell per question, colour-coded
// by state, so a student can see at a glance what is left. Colours follow the
// real GATE interface's own semantics (answered / not answered / marked for
// review) rather than inventing a new scheme, because candidates arrive already
// fluent in that one.
export function GateQuestionPalette({ questions, answers, reviewFlags, current, onJump }) {
  return (
    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
      {questions.map((q, i) => {
        const answered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
          && !(Array.isArray(answers[q.id]) && answers[q.id].length === 0);
        const flagged = !!reviewFlags[q.id];
        const isCurrent = i === current;
        const bg = flagged ? CAMPUS.warnTint : answered ? CAMPUS.goodTint : CAMPUS.paper;
        const fg = flagged ? CAMPUS.warn : answered ? CAMPUS.good : CAMPUS.inkFaint;
        return (
          <button key={q.id} onClick={() => onJump(i)}
            title={`Q${i + 1}${flagged ? " - marked for review" : answered ? " - answered" : " - not answered"}`}
            className="aspect-square rounded-lg text-[11px] font-mono font-bold flex items-center justify-center transition-colors"
            style={{
              background: bg, color: fg,
              border: `1.5px solid ${isCurrent ? CAMPUS.teal : flagged ? CAMPUS.warn : answered ? CAMPUS.good : CAMPUS.line}`,
            }}>
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

// ---------------- formatting ----------------

export function formatDuration(totalSec) {
  const s = Math.max(0, Math.round(totalSec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export function formatClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// Marks render as "46.33", never "46.333333333333336" - GATE scores land on
// thirds because of the 1/3 and 2/3 penalties, so this is the common case, not
// an edge case.
export function formatMarks(n) {
  if (!Number.isFinite(n)) return "-";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, "");
}

export function GateInlineButton({ children, ...rest }) {
  return <CampusButton size="sm" variant="secondary" {...rest}>{children}</CampusButton>;
}
