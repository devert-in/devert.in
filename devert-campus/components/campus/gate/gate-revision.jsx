"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, Brain, CalendarClock, Check, Clock, FileText,
  Moon, Printer, Repeat, ScrollText, Timer, Zap,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusEmptyState,
} from "@/components/campus/campus-ui";
import { LessonBody } from "@/components/campus/lesson-blocks";
import { markTopicRevised } from "@/lib/gate";
import {
  buildRevisionPlan, revisionBuckets, buildSessionPlan, estimateSessionMinutes,
  REVISION_PRIORITY, REVISION_INTERVALS_DAYS,
} from "@/lib/gateRevision";
import { SHORT_NOTE_DEPTHS, collectShortNotes } from "@/lib/gateLibrary";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateStat } from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// ---------------- the revision engine's UI ----------------

// Every row here shows WHY it is being recommended, in the engine's own words.
// A revision list that just says "revise these 14 topics" gets ignored; one that
// says "23 days since you last looked at this, and your accuracy on it is 38%"
// gets acted on. See lib/gateRevision.js - the `reason` string is produced there
// precisely so this screen never has to invent an explanation.

const BUCKET_TABS = [
  { key: "due", label: "Due now" },
  { key: "critical", label: "Weak & overdue" },
  { key: "neverRevised", label: "Never revised" },
  { key: "forgotten", label: "Not seen in a month" },
  { key: "upcoming", label: "Coming up" },
];

export function GateRevision() {
  const { user } = useAuth();
  const { paper, tree, progress, notes, pyqProgress, go, reload } = useGate();
  const [tab, setTab] = useState("due");
  const [marking, setMarking] = useState(null);

  const plan = useMemo(
    () => buildRevisionPlan({ tree, progress, notes, pyqProgress }),
    [tree, progress, notes, pyqProgress]);
  const buckets = useMemo(() => revisionBuckets(plan, notes), [plan, notes]);
  const session = useMemo(() => buildSessionPlan(plan, { size: 5 }), [plan]);

  if (!user) return <GateSignInPrompt what="your revision schedule" />;

  const lists = {
    due: plan.due,
    critical: plan.critical,
    neverRevised: buckets.neverRevised,
    forgotten: buckets.forgotten,
    upcoming: plan.upcoming,
  };
  const list = lists[tab] || [];

  const markRevised = async (item) => {
    setMarking(item.topicId);
    try {
      await markTopicRevised(user.uid, paper.id, item.topicId).catch(() => {});
      await reload.progress();
    } finally {
      setMarking(null);
    }
  };

  if (plan.all.length === 0) {
    return (
      <div className="space-y-5">
        <GateSectionHeading label="REVISION" icon={Repeat} title="Smart revision"
          description="Spaced repetition over the topics you have completed, weighted by where you actually lose marks." />
        <CampusEmptyState icon={Repeat} title="Nothing to revise yet"
          description="Revision is scheduled from topics you have marked complete. Finish your first topic and it appears here the next day." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GateSectionHeading label="REVISION" icon={Repeat} title="Smart revision"
        description={`Spaced repetition over your ${plan.all.length} completed topics, re-ordered by how long it has been and how often you get each one wrong.`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Due now" value={plan.due.length} color={CAMPUS.purple} icon={CalendarClock} />
        <GateStat label="Weak & overdue" value={plan.critical.length} color={CAMPUS.bad} icon={AlertTriangle}
          hint="Overdue for revision AND a topic you get wrong - the highest-value hour you can spend." />
        <GateStat label="Never revised" value={buckets.neverRevised.length} color={CAMPUS.warn} icon={Clock} />
        <GateStat label="Scheduled ahead" value={plan.upcoming.length} color={CAMPUS.teal} icon={Repeat} />
      </div>

      {/* today's session */}
      <CampusCard className="p-4" style={{ border: `1px solid ${tint(CAMPUS.purple, 25)}`, background: CAMPUS.purpleTint }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={13} style={{ color: CAMPUS.purple }} />
              <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.purple }}>
                {session.aheadOfSchedule ? "NOTHING DUE - OPTIONAL SESSION" : "TODAY'S REVISION SESSION"}
              </p>
            </div>
            <b className="text-[14px]" style={{ color: CAMPUS.ink }}>
              {session.items.length} topic{session.items.length === 1 ? "" : "s"} · about {estimateSessionMinutes(session.items)} minutes
            </b>
            <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
              {session.aheadOfSchedule
                ? "You are ahead of schedule. These are the next ones due, if you want to get ahead."
                : "Capped at two topics per subject so a session doesn't turn into three hours of one thing."}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          {session.items.map(item => (
            <div key={item.topicId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
              <span className="flex-1 min-w-0">
                <b className="block text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{item.title}</b>
                <span className="block text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{item.subjectName}</span>
              </span>
              <CampusButton size="sm" variant="ghost"
                onClick={() => go("subjects", { subjectId: item.subjectId, topicId: item.topicId })}>
                Open
              </CampusButton>
            </div>
          ))}
        </div>
      </CampusCard>

      {/* frequently wrong questions - the other half of "what to revise" */}
      {buckets.frequentlyWrong.length > 0 && (
        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Brain size={13} style={{ color: CAMPUS.bad }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.bad }}>
              CONCEPTS YOU KEEP GETTING WRONG
            </p>
          </div>
          <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkSoft }}>
            Three or more wrong answers on the same topic, across practice and tests. Re-reading beats re-drilling here.
          </p>
          <div className="space-y-1.5">
            {buckets.frequentlyWrong.slice(0, 8).map(t => {
              const meta = plan.all.find(i => i.topicId === t.topicId);
              return (
                <div key={t.topicId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: CAMPUS.badTint }}>
                  <span className="flex-1 min-w-0 text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>
                    {meta?.title || t.topicId}
                  </span>
                  <CampusChip color={CAMPUS.bad}>{t.hits}× WRONG</CampusChip>
                  {meta && (
                    <CampusButton size="sm" variant="ghost"
                      onClick={() => go("subjects", { subjectId: meta.subjectId, topicId: meta.topicId })}>
                      Re-read
                    </CampusButton>
                  )}
                </div>
              );
            })}
          </div>
          <CampusButton size="sm" variant="secondary" className="mt-3" onClick={() => go("mistakes")}>
            Open the mistake notebook
          </CampusButton>
        </CampusCard>
      )}

      {/* full plan */}
      <div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 mb-3">
          {BUCKET_TABS.map(t => {
            const active = t.key === tab;
            const n = lists[t.key]?.length || 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{
                  background: active ? CAMPUS.tealTint : CAMPUS.paper,
                  border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                  color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                }}>
                {t.label} {n}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <CampusCard className="p-5">
            <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>Nothing in this bucket right now.</p>
          </CampusCard>
        ) : (
          <div className="space-y-2">
            {list.map(item => (
              <CampusCard key={item.topicId} className="p-3.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{item.title}</b>
                      {item.priority === REVISION_PRIORITY.CRITICAL && <CampusChip color={CAMPUS.bad}>CRITICAL</CampusChip>}
                      {item.priority === REVISION_PRIORITY.HIGH && <CampusChip color={CAMPUS.warn}>OVERDUE</CampusChip>}
                      {item.revisionCount > 0 && (
                        <CampusChip color={CAMPUS.inkFaint}>REVISED {item.revisionCount}×</CampusChip>
                      )}
                      {item.hasShortNotes && <CampusChip color={CAMPUS.blue}>HAS SHORT NOTES</CampusChip>}
                    </div>
                    <span className="text-[11px] block" style={{ color: CAMPUS.inkFaint }}>
                      {item.subjectName} · {item.module}
                    </span>
                    <p className="text-[12px] mt-1" style={{ color: CAMPUS.inkSoft }}>{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <CampusButton size="sm" variant="secondary" icon={ArrowRight}
                      onClick={() => go("subjects", { subjectId: item.subjectId, topicId: item.topicId })}>
                      Revise
                    </CampusButton>
                    <CampusButton size="sm" variant="ghost" icon={Check} disabled={marking === item.topicId}
                      onClick={() => markRevised(item)}>
                      {marking === item.topicId ? "..." : "Done"}
                    </CampusButton>
                  </div>
                </div>
              </CampusCard>
            ))}
          </div>
        )}
      </div>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>HOW THE SCHEDULE WORKS</p>
        <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
          After you complete a topic it comes back after {REVISION_INTERVALS_DAYS[0]} day, then
          {" "}{REVISION_INTERVALS_DAYS.slice(1).join(", ")} days - each pass buys a longer gap. Topics you get wrong in
          practice or tests jump the queue regardless of their interval. Nothing here is a black box: every row above states
          its own reason, and the intervals are fixed rather than tuned by anything you cannot see.
        </p>
      </CampusCard>
    </div>
  );
}

// ---------------- short notes ----------------

// Three depths, from a five-minute read down to the one thing not to blank on.
// The night-before depth is deliberately last and deliberately separate: it is
// the only view designed to be read end-to-end in one sitting, which is why it
// gets the print affordance.
export function GateShortNotes() {
  const { tree, progress, go } = useGate();
  const [depth, setDepth] = useState("fiveMinute");
  const [subjectFilter, setSubjectFilter] = useState(null);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  const completed = useMemo(() => new Set(progress?.completedTopicIds || []), [progress]);

  const filteredTree = useMemo(() => {
    return (tree || [])
      .filter(s => !subjectFilter || s.id === subjectFilter)
      .map(s => ({
        ...s,
        topics: onlyCompleted ? (s.topics || []).filter(t => completed.has(t.id)) : s.topics,
      }));
  }, [tree, subjectFilter, onlyCompleted, completed]);

  const groups = useMemo(() => collectShortNotes(filteredTree, depth), [filteredTree, depth]);
  const total = groups.reduce((n, g) => n + g.notes.length, 0);
  const meta = SHORT_NOTE_DEPTHS.find(d => d.key === depth);

  return (
    <div className="space-y-5">
      <GateSectionHeading label="SHORT NOTES" icon={ScrollText} title="Short notes"
        description="Every topic's own condensed summary, at three depths. Written per topic by the same people who wrote the lessons - not auto-generated from them."
        action={total > 0 ? (
          <CampusButton size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </CampusButton>
        ) : null} />

      <div className="grid sm:grid-cols-3 gap-2">
        {SHORT_NOTE_DEPTHS.map(d => {
          const active = d.key === depth;
          const Icon = d.key === "nightBefore" ? Moon : d.key === "oneMinute" ? Timer : FileText;
          return (
            <button key={d.key} onClick={() => setDepth(d.key)}
              className="text-left p-3 rounded-xl transition-colors"
              style={{
                background: active ? CAMPUS.tealTint : CAMPUS.paper,
                border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={12} style={{ color: active ? CAMPUS.teal : CAMPUS.inkFaint }} />
                <b className="text-[12.5px]" style={{ color: active ? CAMPUS.teal : CAMPUS.ink }}>{d.label}</b>
              </div>
              <span className="block text-[11px] leading-snug" style={{ color: CAMPUS.inkFaint }}>{d.detail}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setOnlyCompleted(v => !v)}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
          style={{
            background: onlyCompleted ? CAMPUS.tealTint : CAMPUS.surface,
            border: `1px solid ${onlyCompleted ? CAMPUS.teal : CAMPUS.line}`,
            color: onlyCompleted ? CAMPUS.teal : CAMPUS.inkSoft,
          }}>
          Only topics I&apos;ve studied
        </button>
        <select value={subjectFilter || ""} onChange={e => setSubjectFilter(e.target.value || null)}
          className="text-[12px] px-3 py-1.5 rounded-lg outline-none"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
          <option value="">Every subject</option>
          {(tree || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
          {total} note{total === 1 ? "" : "s"} at this depth
        </span>
      </div>

      {total === 0 ? (
        <CampusEmptyState icon={ScrollText} title={`No ${meta?.label.toLowerCase()} notes yet`}
          description="Short notes are authored per topic alongside the lesson. They appear here as soon as an admin writes them - and every topic that has one is marked in the Syllabus view." />
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <CampusCard key={group.subjectId} className="p-4">
              <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.teal }}>
                {group.subjectName.toUpperCase()} · {group.notes.length}
              </p>
              <div className="space-y-3">
                {group.notes.map(note => (
                  <div key={note.topicId} className="pb-3" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                    <button onClick={() => go("subjects", { subjectId: group.subjectId, topicId: note.topicId })}
                      className="text-left mb-1">
                      <b className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{note.title}</b>
                      {note.module && (
                        <span className="text-[10.5px] ml-2" style={{ color: CAMPUS.inkFaint }}>{note.module}</span>
                      )}
                    </button>
                    <div className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
                      <LessonBody text={note.text} />
                    </div>
                  </div>
                ))}
              </div>
            </CampusCard>
          ))}
        </div>
      )}
    </div>
  );
}
