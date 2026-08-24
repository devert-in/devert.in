"use client";

import { useMemo, useState } from "react";
import {
  Check, ChevronDown, ChevronRight, FileText, ListChecks, Search, Sigma,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton } from "@/components/campus/campus-ui";
import { groupTopicsByModule, topicHasContent } from "@/lib/gate";
import { useGate, GateNoContent } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateEstimateNote } from "@/components/campus/gate/gate-ui";

// The official syllabus, rendered as the document it is: paper -> section ->
// sub-heading -> topic, in the published order, with the student's own progress
// overlaid.
//
// This screen is deliberately reference-shaped rather than dashboard-shaped. Its
// job is "show me exactly what is examinable, and mark off what I've done" -
// which means nothing is hidden behind a filter by default, the ordering is the
// syllabus's own (never alphabetical), and a topic with no lesson written yet is
// still listed, marked honestly, because it is still on the syllabus.

export function GateSyllabus() {
  const { paper, tree, progress, completion, go } = useGate();
  const [open, setOpen] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const completed = useMemo(() => new Set(progress?.completedTopicIds || []), [progress]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tree || []).map(subject => {
      const topics = (subject.topics || []).filter(t => {
        if (onlyIncomplete && completed.has(t.id)) return false;
        if (!q) return true;
        return [t.title, t.module, subject.name].some(v => (v || "").toLowerCase().includes(q));
      });
      return { ...subject, topics };
    }).filter(s => s.topics.length > 0);
  }, [tree, search, onlyIncomplete, completed]);

  // A search or filter that hides everything but one subject should not also
  // require expanding it by hand - expanding on a narrowed result is what the
  // user was asking for by typing.
  const expanded = useMemo(() => {
    if (search.trim() || onlyIncomplete) return new Set(filtered.map(s => s.id));
    return open;
  }, [search, onlyIncomplete, filtered, open]);

  const toggle = (id) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (!tree?.length) {
    return <GateNoContent what="syllabus"
      hint="This paper's subject tree hasn't been seeded yet. A platform admin seeds the official syllabus in one click from /admin > GATE > Papers." />;
  }

  const totalWeightage = tree.reduce((n, s) => n + (s.weightageMarks || 0), 0);

  return (
    <div className="space-y-4">
      <GateSectionHeading label="OFFICIAL SYLLABUS" icon={ListChecks}
        title={`${paper.name} Syllabus`}
        description={`Every examinable section, sub-heading and topic for ${paper.fullName}${paper.syllabusVersion ? ` (${paper.syllabusVersion})` : ""}. Tick marks are your own completed topics.`} />

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
          <Search size={13} style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search the whole syllabus..."
            className="flex-1 bg-transparent outline-none text-[12.5px]" style={{ color: CAMPUS.ink }} />
        </div>
        <button onClick={() => setOnlyIncomplete(v => !v)}
          className="text-[12px] font-semibold px-3 py-2 rounded-lg flex-shrink-0"
          style={{
            background: onlyIncomplete ? CAMPUS.tealTint : CAMPUS.surface,
            border: `1px solid ${onlyIncomplete ? CAMPUS.teal : CAMPUS.line}`,
            color: onlyIncomplete ? CAMPUS.teal : CAMPUS.inkSoft,
          }}>
          Not done yet
        </button>
        <button onClick={() => setOpen(new Set(open.size ? [] : tree.map(s => s.id)))}
          className="text-[12px] font-semibold px-3 py-2 rounded-lg flex-shrink-0"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
          {open.size ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {filtered.length === 0 && (
        <CampusCard className="p-5">
          <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>
            Nothing matches {search.trim() ? `"${search.trim()}"` : "that filter"}.
          </p>
        </CampusCard>
      )}

      <div className="space-y-3">
        {filtered.map(subject => {
          const isOpen = expanded.has(subject.id);
          // Counted over the FILTERED topic list, not taken from the shared
          // completion figures - with a search or "not done yet" filter active,
          // "3/5" has to describe the five rows actually on screen.
          const done = (subject.topics || []).filter(t => completed.has(t.id)).length;
          return (
            <CampusCard key={subject.id} className="overflow-hidden">
              <button onClick={() => toggle(subject.id)} aria-expanded={isOpen}
                className="w-full flex items-center gap-3 p-4 text-left">
                {isOpen
                  ? <ChevronDown size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
                  : <ChevronRight size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-[14px]" style={{ color: CAMPUS.ink }}>{subject.name}</b>
                    {subject.weightageMarks > 0 && (
                      <CampusChip color={CAMPUS.gold}>~{subject.weightageMarks} MARKS</CampusChip>
                    )}
                    {subject.daOnly && <CampusChip color={CAMPUS.purple}>DA ONLY</CampusChip>}
                  </div>
                  {subject.description && (
                    <p className="text-[11.5px] mt-0.5 truncate" style={{ color: CAMPUS.inkFaint }}>{subject.description}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono flex-shrink-0" style={{ color: done > 0 ? CAMPUS.teal : CAMPUS.inkFaint }}>
                  {done}/{subject.topics.length}
                </span>
              </button>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  {groupTopicsByModule(subject.topics).map(group => (
                    <div key={group.module}>
                      <div className="px-4 py-2 flex items-center justify-between gap-2"
                        style={{ background: CAMPUS.paper, borderTop: `1px solid ${CAMPUS.line}` }}>
                        <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
                          {group.module.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                          {group.topics.filter(t => completed.has(t.id)).length}/{group.topics.length}
                        </span>
                      </div>
                      {group.topics.map(topic => {
                        const isDone = completed.has(topic.id);
                        const hasContent = topicHasContent(topic);
                        return (
                          <button key={topic.id}
                            onClick={() => go("subjects", { subjectId: subject.id, topicId: topic.id })}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                            style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                width: 18, height: 18,
                                background: isDone ? CAMPUS.goodTint : "transparent",
                                border: `1px solid ${isDone ? CAMPUS.good : CAMPUS.line}`,
                              }}>
                              {isDone && <Check size={10} style={{ color: CAMPUS.good }} />}
                            </span>
                            <span className="flex-1 text-[12.5px]" style={{ color: CAMPUS.ink }}>{topic.title}</span>
                            <span className="flex items-center gap-1.5 flex-shrink-0">
                              {topic.formulas?.length > 0 && <Sigma size={11} style={{ color: CAMPUS.gold }} title="Has formulas" />}
                              {topic.shortNotes?.oneMinute && <FileText size={11} style={{ color: CAMPUS.blue }} title="Has short notes" />}
                              {!hasContent && <CampusChip color={CAMPUS.inkFaint}>NOT WRITTEN YET</CampusChip>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CampusCard>
          );
        })}
      </div>

      <CampusCard className="p-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>PAPER STRUCTURE</p>
            <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
              {paper.questionCount || 65} questions · {paper.totalMarks || 100} marks · {paper.durationMinutes || 180} minutes ·
              {" "}{tree.length} sections · {completion.total} topics
            </p>
          </div>
          <CampusButton size="sm" variant="secondary" onClick={() => go("subjects")}>Start studying</CampusButton>
        </div>
        {totalWeightage > 0 && (
          <GateEstimateNote>
            Section weightages shown above total ~{totalWeightage} marks. They are historical averages, not a published
            breakdown - GATE does not commit to a per-section mark split in advance.
          </GateEstimateNote>
        )}
      </CampusCard>
    </div>
  );
}
