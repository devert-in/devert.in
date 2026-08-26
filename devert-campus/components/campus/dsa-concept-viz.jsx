"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Trophy } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";

// Animated algorithm visualisers for DSA Concepts lessons.
//
// Driven entirely by a concept doc's `visualization` field (DATA, not code):
// { kind: "slidingWindow", array: [...], windowSize: 3 }. Adding a visual to a
// concept is a content edit; adding a NEW KIND of visual is one case in the
// switch at the bottom. An unknown or absent kind renders nothing at all,
// never a broken frame - so authoring a concept without a visual is a valid,
// tidy state rather than a hole in the page.
//
// Why hand-rolled rather than a charting/animation library: this has to run
// inside a statically-exported page with no external requests, match the
// Campus theme tokens exactly in both light and dark, and stay keyboard- and
// screen-reader-legible. framer-motion (already a dependency, already used by
// campus-daily-learning.jsx) covers the only real animation need - moving a
// highlight rectangle - and everything else is layout.

const STEP_MS = 1100;

function VizFrame({ title, subtitle, children, controls }) {
  return (
    <div className="rounded-xl overflow-hidden my-4" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap"
        style={{ background: CAMPUS.paper, borderBottom: `1px solid ${CAMPUS.line}` }}>
        <div className="min-w-0">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>VISUALISATION</p>
          <b className="block text-[13px] truncate" style={{ color: CAMPUS.ink }}>{title}</b>
        </div>
        {controls}
      </div>
      <div className="p-4">
        {subtitle && <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkSoft }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function VizButton({ onClick, icon: Icon, label, primary = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
      style={{
        color: primary ? "#fff" : CAMPUS.inkSoft,
        background: primary ? CAMPUS.teal : "transparent",
        border: `1px solid ${primary ? CAMPUS.teal : CAMPUS.line}`,
      }}>
      <Icon size={12} /> {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sliding Window
// ---------------------------------------------------------------------------

function SlidingWindowViz({ array, windowSize }) {
  // Guard the authoring mistakes that would otherwise render a nonsense frame:
  // a window wider than the array, or a window of zero. Memoised because it
  // feeds the `sums` useMemo below - a fresh fallback array identity on every
  // render would recompute the whole history each time.
  const nums = useMemo(
    () => (Array.isArray(array) && array.length ? array : [2, 1, 5, 1, 3, 2]),
    [array]);
  const k = Math.max(1, Math.min(windowSize || 3, nums.length));
  const lastStart = nums.length - k;

  const [start, setStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  // Every window's sum, precomputed - the visual needs the *history* (to show
  // which window is currently best), and recomputing inside the render would
  // ironically do exactly the O(n*k) work this lesson teaches you to avoid.
  const sums = useMemo(() => {
    const out = [];
    let running = nums.slice(0, k).reduce((a, b) => a + b, 0);
    out.push(running);
    for (let s = 1; s <= lastStart; s++) {
      running += nums[s + k - 1] - nums[s - 1];
      out.push(running);
    }
    return out;
  }, [nums, k, lastStart]);

  const bestSoFar = useMemo(() => Math.max(...sums.slice(0, start + 1)), [sums, start]);
  const bestIndexSoFar = useMemo(() => sums.slice(0, start + 1).indexOf(bestSoFar), [sums, start, bestSoFar]);
  const atEnd = start >= lastStart;

  const step = useCallback(() => setStart(s => (s >= lastStart ? s : s + 1)), [lastStart]);
  const reset = useCallback(() => { setPlaying(false); setStart(0); }, []);

  // No setState here when the run finishes: reaching the end simply stops
  // scheduling. `isPlaying` below is derived instead, so the button flips to
  // Replay without an effect writing state back during the same commit.
  useEffect(() => {
    if (!playing || atEnd) return;
    timer.current = setTimeout(step, STEP_MS);
    return () => clearTimeout(timer.current);
  }, [playing, atEnd, start, step]);

  const isPlaying = playing && !atEnd;

  // Respect the OS "reduce motion" setting - the window still moves between
  // positions, it just doesn't animate the transit. useSyncExternalStore rather
  // than an effect + setState: matchMedia IS an external store, and the
  // getServerSnapshot arm keeps this safe under the static export's prerender,
  // where `window` doesn't exist.
  const reduceMotion = useSyncExternalStore(
    useCallback((onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []),
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const CELL = 52;
  const GAP = 6;

  const entering = start > 0 ? nums[start + k - 1] : null;
  const leaving = start > 0 ? nums[start - 1] : null;

  return (
    <VizFrame
      title={`Fixed window of ${k} over ${nums.length} elements`}
      subtitle="The window never re-reads its middle. One element enters on the right, one leaves on the left, and the running total updates in a single step."
      controls={
        <div className="flex items-center gap-1.5 flex-wrap">
          <VizButton primary onClick={() => (atEnd ? reset() : setPlaying(p => !p))}
            icon={atEnd ? RotateCcw : isPlaying ? Pause : Play}
            label={atEnd ? "Replay" : isPlaying ? "Pause" : "Play"} />
          <VizButton onClick={step} icon={SkipForward} label="Step" disabled={atEnd} />
          <VizButton onClick={reset} icon={RotateCcw} label="Reset" disabled={start === 0 && !playing} />
        </div>
      }>

      {/* The array, with the window drawn as a moving highlight behind the cells. */}
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ height: CELL + 34, minWidth: nums.length * (CELL + GAP) }}>
          <motion.div
            className="absolute rounded-xl"
            initial={false}
            animate={{ x: start * (CELL + GAP) }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
            style={{
              width: k * CELL + (k - 1) * GAP, height: CELL,
              background: CAMPUS.tealTint, border: `2px solid ${CAMPUS.teal}`, top: 0,
            }}
          />
          {nums.map((n, i) => {
            const inWindow = i >= start && i < start + k;
            return (
              <div key={i} className="absolute flex flex-col items-center"
                style={{ left: i * (CELL + GAP), top: 0, width: CELL }}>
                <div className="flex items-center justify-center rounded-lg font-mono font-bold text-[15px]"
                  style={{
                    width: CELL, height: CELL,
                    color: inWindow ? CAMPUS.teal : CAMPUS.inkFaint,
                    background: "transparent",
                  }}>
                  {n}
                </div>
                <span className="text-[9.5px] font-mono mt-1" style={{ color: CAMPUS.inkFaint }}>{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Narration - the arithmetic actually being performed on this step. */}
      <div className="mt-3 rounded-lg p-3 font-mono text-[12px]"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
        {start === 0 ? (
          <>
            <span style={{ color: CAMPUS.inkFaint }}>build first window &rarr; </span>
            <b style={{ color: CAMPUS.ink }}>sum = {sums[0]}</b>
            <span style={{ color: CAMPUS.inkFaint }}> ({nums.slice(0, k).join(" + ")})</span>
          </>
        ) : (
          <>
            <span style={{ color: CAMPUS.good }}>+{entering}</span>
            <span style={{ color: CAMPUS.inkFaint }}> enters, </span>
            <span style={{ color: CAMPUS.bad }}>-{leaving}</span>
            <span style={{ color: CAMPUS.inkFaint }}> leaves &rarr; </span>
            <b style={{ color: CAMPUS.ink }}>sum = {sums[start]}</b>
            <span style={{ color: CAMPUS.inkFaint }}> ({sums[start - 1]} + {entering} - {leaving})</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[12px]">
          <Trophy size={13} style={{ color: CAMPUS.warn }} />
          <span style={{ color: CAMPUS.inkFaint }}>best so far</span>
          <b className="font-mono" style={{ color: CAMPUS.ink }}>{bestSoFar}</b>
          <span style={{ color: CAMPUS.inkFaint }}>
            (window starting at index {bestIndexSoFar})
          </span>
        </div>
        <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
          step {start + 1} / {lastStart + 1} &middot; {start + k} of {nums.length} reads
        </span>
      </div>

      {atEnd && (
        <p className="text-[12px] mt-3 rounded-lg p-3"
          style={{ background: CAMPUS.goodTint, color: CAMPUS.ink, border: `1px solid ${CAMPUS.good}` }}>
          Done in <b>{nums.length}</b> reads. Brute force would have taken{" "}
          <b>{(lastStart + 1) * k}</b> for this tiny array &mdash; and the gap widens with
          every extra element, which is the whole difference between O(n) and O(n&times;k).
        </p>
      )}
    </VizFrame>
  );
}

// ---------------------------------------------------------------------------

export function ConceptVisualization({ visualization }) {
  if (!visualization?.kind) return null;
  switch (visualization.kind) {
    case "slidingWindow":
      return <SlidingWindowViz array={visualization.array} windowSize={visualization.windowSize} />;
    // Future kinds (twoPointer, bfs, dfs, dpTable, binarySearch, callStack...)
    // each add one case here plus one component above. Deliberately explicit
    // rather than a registry lookup so an unknown kind is a no-op, not a crash.
    default:
      return null;
  }
}
