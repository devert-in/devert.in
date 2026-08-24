"use client";

// A connected node/branch diagram for one roadmap's Path view - explicitly
// NOT the accordion/timeline list (RoadmapTimeline in campus-ui.jsx) that
// shipped first. Reported live: an accordion with level sections read as
// three separate lists stacked together, not "a roadmap" - the reference
// point given was roadmap.sh's own visual style, where a role's whole path
// is one connected chain of nodes and difficulty is implied by POSITION in
// the flow, not by an explicit "BEGINNER" section label.
//
// Deliberately a hand-built vertical zigzag (a center spine with nodes
// alternating left/right, connected by short stub lines), not a general
// graph-layout engine - roadmap.sh's own renderer positions nodes by hand
// per-roadmap; a fully automatic branch-layout algorithm is a much larger
// build than this data model (Level -> Module -> Topic, no branch/parallel-
// path metadata yet) currently needs or can express. This gets the visual
// language right (one continuous connected path, colour implies difficulty,
// no tab/section chrome) without inventing graph data the content doesn't
// have. Real branching (e.g. "pick Vue OR React here") is a real future
// extension once a topic can declare parallel next-steps.
//
// Topics are the node granularity (not modules) - roadmap.sh's own
// roadmaps are topic-grained (dozens of small nodes), and at this catalog's
// current size (6-8 topics per roadmap) module-level nodes would read as
// far too sparse to look like "a roadmap" at all.
import { Check } from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { ROADMAP_LEVELS, topicStatus, topicHasContent } from "@/lib/roadmaps";

const LEVEL_COLOR = { beginner: CAMPUS.good, intermediate: CAMPUS.warn, advanced: CAMPUS.bad };

// Flattens the tree into one ordered sequence of flow entries - a topic
// entry for every topic, with a `boundary` marker entry inserted whenever
// the level or module changes, in the exact order the Path should read top
// to bottom (level order, then each module's own authored order, then each
// topic's own authored order - never re-sorted alphabetically).
function buildFlowSequence(tree) {
  const byLevel = ROADMAP_LEVELS.map((lv) => ({
    ...lv,
    modules: (tree || []).filter((m) => (m.level || "beginner") === lv.key),
  }));

  const flow = [];
  byLevel.forEach((level) => {
    if (level.modules.length === 0) return;
    flow.push({ kind: "level", level: level.key, label: level.label });
    level.modules.forEach((m) => {
      flow.push({ kind: "module", level: level.key, title: m.title, moduleId: m.id });
      (m.topics || []).forEach((t) => {
        flow.push({ kind: "topic", level: level.key, moduleId: m.id, moduleTitle: m.title, topic: t });
      });
    });
  });
  return flow;
}

export function RoadmapFlowchart({ tree, progress, onOpenTopic }) {
  const flow = buildFlowSequence(tree);
  let topicIndex = -1;

  return (
    <div className="relative py-2">
      {/* The spine - one continuous line behind every node, centered under sm:
          and collapsed to a left-aligned rail on mobile (see the node wrapper's
          own responsive classes below). */}
      <div className="absolute top-0 bottom-0 w-px sm:left-1/2 left-5"
        style={{ background: CAMPUS.line }} aria-hidden="true" />

      <div className="space-y-3">
        {flow.map((entry, i) => {
          if (entry.kind === "level") {
            return (
              <div key={`level-${entry.level}`} className="relative flex justify-center py-3">
                <span className="relative z-10 text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full"
                  style={{ background: tint(LEVEL_COLOR[entry.level], 16), color: LEVEL_COLOR[entry.level], border: `1px solid ${tint(LEVEL_COLOR[entry.level], 30)}` }}>
                  {entry.label.toUpperCase()}
                </span>
              </div>
            );
          }
          if (entry.kind === "module") {
            return (
              <div key={`module-${entry.moduleId}`} className="relative flex sm:justify-center justify-start pl-11 sm:pl-0 py-1.5">
                <span className="relative z-10 text-[10.5px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>
                  {entry.title}
                </span>
              </div>
            );
          }

          topicIndex += 1;
          const side = topicIndex % 2 === 0 ? "left" : "right";
          const status = topicStatus(entry.topic.id, progress);
          const color = LEVEL_COLOR[entry.level] || CAMPUS.teal;
          const hasContent = topicHasContent(entry.topic);

          return (
            <TopicNode key={entry.topic.id} topic={entry.topic} side={side} color={color}
              status={status} hasContent={hasContent} onOpen={() => onOpenTopic(entry.topic.id)} />
          );
        })}
      </div>
    </div>
  );
}

function TopicNode({ topic, side, color, status, hasContent, onOpen }) {
  const done = status === "completed";
  const started = status === "in-progress";

  return (
    <div className={`relative flex ${side === "left" ? "sm:justify-start" : "sm:justify-end"} justify-start`}>
      {/* Node marker on the spine itself - a filled dot (done), a ring
          (in-progress), or an outline (not started). Positioned absolutely so
          it sits exactly on the spine regardless of which side the card is on. */}
      <div className="absolute top-1/2 -translate-y-1/2 sm:left-1/2 left-5 sm:-translate-x-1/2 z-10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={done
          ? { background: color }
          : started
            ? { background: tint(color, 20), border: `2px solid ${color}` }
            : { background: CAMPUS.surface, border: `2px solid ${CAMPUS.line}` }}>
        {done && <Check size={10} style={{ color: "#fff" }} />}
      </div>

      <button onClick={onOpen}
        className={`campus-card-hover text-left rounded-2xl px-4 py-3 w-full sm:w-[calc(50%-2.5rem)] ml-11 sm:ml-0 ${side === "left" ? "sm:mr-auto sm:pr-6" : "sm:ml-auto sm:pl-6"}`}
        style={{
          background: CAMPUS.surface,
          border: `1px solid ${done ? tint(color, 30) : CAMPUS.line}`,
          boxShadow: CAMPUS.shadow,
        }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} aria-hidden="true" />
          <span className="text-[13px] font-semibold truncate flex-1" style={{ color: CAMPUS.ink }}>{topic.title}</span>
          {!hasContent && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
              SOON
            </span>
          )}
        </div>
        {topic.description && (
          <p className="text-[11.5px] mt-1 line-clamp-2" style={{ color: CAMPUS.inkFaint }}>{topic.description}</p>
        )}
      </button>
    </div>
  );
}
