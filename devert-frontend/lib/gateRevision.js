// The Smart Revision Engine.
//
// Entirely deterministic and entirely local - no model, no service call, no
// stored schedule to drift out of sync. Every recommendation below is a pure
// function of data the student already generated (which topics they completed
// and when, when they last revised each one, and their per-topic accuracy), so
// it works offline, produces the same plan twice for the same inputs, and can
// always explain itself: every returned item carries a `reason` the UI shows
// verbatim. "Because the algorithm said so" is not an acceptable answer to a
// candidate deciding how to spend a Sunday.
//
// This is also the seam the future AI planner plugs into. Everything here has
// the shape (state) -> ranked list of {topic, reason, priority}. An AI planner
// is a different implementation of that same signature, so swapping or A/B-ing
// one in later needs no change to any screen - which is what "AI-ready
// architecture" has to mean concretely to be worth claiming.

import { topicHasContent } from "@/lib/gate";
import { weakConceptsFromMistakes } from "@/lib/gatePyq";

// Expanding intervals in days, indexed by how many times a topic has already
// been revised. Roughly the standard spaced-repetition ladder, compressed at
// the tail: a GATE cycle is about a year, so an interval beyond ~5 weeks would
// schedule a topic's third revision after the exam. The last value repeats for
// every subsequent revision.
export const REVISION_INTERVALS_DAYS = [1, 3, 7, 16, 35];

export function intervalForCount(count) {
  const i = Math.min(Math.max(0, count | 0), REVISION_INTERVALS_DAYS.length - 1);
  return REVISION_INTERVALS_DAYS[i];
}

function daysSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

// Priority bands, so the UI can group rather than render a flat list of 60
// topics. Ordering between bands is fixed; ordering within a band is by how
// overdue an item is.
export const REVISION_PRIORITY = {
  CRITICAL: 3, // studied, never revised, and you get it wrong
  HIGH: 2,     // overdue by more than its own interval again
  DUE: 1,      // due now
  SOON: 0,     // not yet due
};

// The core scheduler. `tree` is fetchSyllabusTree's output, `progress` the
// student's gate_progress doc, `notes` their gate_notes doc, `pyqProgress`
// their gate_pyq_progress doc. Any of the last three may be null on day one -
// a student who has completed topics but never attempted a question still gets
// a sane schedule, just without the accuracy signal.
export function buildRevisionPlan({ tree, progress, notes, pyqProgress }) {
  const completed = new Set(progress?.completedTopicIds || []);
  const revisedAt = progress?.revisedAt || {};
  const revisionCount = progress?.revisionCount || {};
  const topicStats = pyqProgress?.topicStats || {};
  const weakTopicIds = new Set(weakConceptsFromMistakes(notes).map(t => t.topicId));

  const items = [];
  for (const subject of tree || []) {
    for (const topic of subject.topics || []) {
      // Only topics the student has actually finished are revision candidates.
      // Recommending revision of something never studied is a study
      // recommendation wearing the wrong label - lib/gate.js's
      // recommendNextTopic owns that.
      if (!completed.has(topic.id)) continue;

      const count = revisionCount[topic.id] || 0;
      const interval = intervalForCount(count);
      const since = daysSince(revisedAt[topic.id]);
      const stat = topicStats[topic.id];
      const accuracy = stat?.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : null;
      const isWeak = weakTopicIds.has(topic.id) || (accuracy !== null && accuracy < 50);

      let priority, reason, overdueBy = 0;
      if (since === null) {
        // Completed but never revised at all.
        priority = isWeak ? REVISION_PRIORITY.CRITICAL : REVISION_PRIORITY.DUE;
        reason = isWeak
          ? "Studied but never revised, and your accuracy here is low."
          : "Studied but never revised.";
        overdueBy = 999;
      } else {
        overdueBy = since - interval;
        if (overdueBy >= interval) {
          priority = isWeak ? REVISION_PRIORITY.CRITICAL : REVISION_PRIORITY.HIGH;
          reason = `${since} days since your last revision - more than double the ${interval}-day interval.`;
        } else if (overdueBy >= 0) {
          priority = isWeak ? REVISION_PRIORITY.HIGH : REVISION_PRIORITY.DUE;
          reason = `Due now - last revised ${since} day${since === 1 ? "" : "s"} ago.`;
        } else {
          priority = REVISION_PRIORITY.SOON;
          reason = `Next revision in ${-overdueBy} day${-overdueBy === 1 ? "" : "s"}.`;
        }
        if (isWeak && priority !== REVISION_PRIORITY.SOON) {
          reason += accuracy !== null ? ` Accuracy here is ${accuracy}%.` : " This topic is in your mistake notebook.";
        }
      }

      items.push({
        topicId: topic.id, title: topic.title, module: topic.module,
        subjectId: subject.id, subjectName: subject.name,
        revisionCount: count, intervalDays: interval, daysSinceRevision: since,
        accuracy, isWeak, priority, reason, overdueBy,
        hasContent: topicHasContent(topic),
        hasShortNotes: !!(topic.shortNotes?.oneMinute || topic.shortNotes?.fiveMinute || topic.shortNotes?.nightBefore),
      });
    }
  }

  items.sort((a, b) => b.priority - a.priority || b.overdueBy - a.overdueBy);
  return {
    all: items,
    due: items.filter(i => i.priority >= REVISION_PRIORITY.DUE),
    critical: items.filter(i => i.priority === REVISION_PRIORITY.CRITICAL),
    upcoming: items.filter(i => i.priority === REVISION_PRIORITY.SOON),
  };
}

// "Topics not revised", "weak concepts", "forgotten lessons" and "frequently
// incorrect questions" as four named views over one plan, because those are the
// four things the product asks to surface and deriving them separately would
// let them contradict each other.
export function revisionBuckets(plan, notes) {
  return {
    neverRevised: plan.all.filter(i => i.daysSinceRevision === null),
    weakConcepts: plan.all.filter(i => i.isWeak),
    // "Forgotten" is a deliberately conservative label: studied, revised at
    // least once, and then left alone for more than a month. Calling something
    // forgotten after a week would be alarmist and would train students to
    // ignore the flag.
    forgotten: plan.all.filter(i => i.daysSinceRevision !== null && i.daysSinceRevision >= 30),
    frequentlyWrong: weakConceptsFromMistakes(notes, { minHits: 3 }),
  };
}

// A concrete, size-bounded plan for one study session, rather than a wall of 60
// due topics that a student closes without touching. Fills from the highest
// priority band down, and caps how much of one subject can dominate a single
// session - three consecutive Theory of Computation topics is how a session
// gets abandoned halfway.
export function buildSessionPlan(plan, { size = 5, maxPerSubject = 2 } = {}) {
  const picked = [];
  const perSubject = {};
  for (const item of plan.all) {
    if (picked.length >= size) break;
    if (item.priority < REVISION_PRIORITY.DUE) break;
    const n = perSubject[item.subjectId] || 0;
    if (n >= maxPerSubject) continue;
    perSubject[item.subjectId] = n + 1;
    picked.push(item);
  }
  // Nothing is due - offer the soonest-due items instead of an empty session,
  // clearly flagged as ahead of schedule.
  if (picked.length === 0) {
    return { items: plan.upcoming.slice(0, size), aheadOfSchedule: true };
  }
  return { items: picked, aheadOfSchedule: false };
}

// Estimated minutes for a session, from each topic's own authored
// estimatedMinutes but scaled down: a revision pass is not a first read.
// Revision after the first is faster again, which is the whole premise of
// spaced repetition and worth reflecting honestly in the estimate rather than
// quoting the full lesson time.
export function estimateSessionMinutes(items) {
  return items.reduce((n, i) => {
    const base = 20;
    const scale = i.revisionCount === 0 ? 0.5 : i.revisionCount === 1 ? 0.35 : 0.25;
    return n + Math.max(3, Math.round(base * scale));
  }, 0);
}

// ---------------- weekly targets ----------------

// A weekly target derived from the actual gap between where a student is and
// when the exam is, rather than a number they pick optimistically in January
// and never revisit. Returns null when there is no exam date set (see
// daysUntilExam) - an "on track / behind" verdict with no deadline to measure
// against would be invented.
export function computeWeeklyTarget({ completion, daysLeft, weeksBuffer = 6 }) {
  if (!Number.isFinite(daysLeft) || daysLeft <= 0 || !completion?.total) return null;
  const remaining = completion.total - completion.done;
  if (remaining <= 0) {
    return { topicsPerWeek: 0, remaining: 0, weeksAvailable: Math.floor(daysLeft / 7), syllabusDone: true };
  }
  // Reserve the last few weeks for revision and mocks rather than first-pass
  // learning - finishing the syllabus the night before the exam is the classic
  // failure mode this target exists to prevent.
  const weeksAvailable = Math.max(1, Math.floor(daysLeft / 7) - weeksBuffer);
  return {
    topicsPerWeek: Math.ceil(remaining / weeksAvailable),
    remaining,
    weeksAvailable,
    revisionWeeksReserved: weeksBuffer,
    syllabusDone: false,
    // True when the required pace has become implausible - surfaced honestly
    // as "this pace assumes N topics a week" rather than hidden.
    aggressive: remaining / weeksAvailable > 12,
  };
}

// Did this week actually hit the target? Counts completions from the daily
// history (which is what the student did) rather than from completedTopicIds
// (which has no per-day timestamps).
export function weeklyProgress(history, target) {
  const last7 = history.slice(-7);
  const daysStudied = last7.filter(d => d.completed || Object.values(d.steps || {}).some(Boolean)).length;
  return {
    daysStudied,
    daysInWeek: last7.length,
    onTrack: target ? daysStudied >= Math.min(7, Math.ceil(target.topicsPerWeek / 2)) : null,
  };
}

// ---------------- study-hours heatmap ----------------

// A calendar heatmap over the daily history: intensity is how many of the six
// Daily GATE steps were completed that day, 0-6. Deliberately not derived from
// a browser timer - see lib/gate.js's note on why measured wall-clock time is
// not trustworthy here. Weeks start Monday, matching the rest of Campus
// (lib/dailyLearning.js's mondayOf).
export function buildHeatmap(history) {
  const cells = history.map(d => {
    const steps = d.steps || {};
    const doneCount = Object.values(steps).filter(Boolean).length;
    return { date: d.date, level: Math.min(6, doneCount), completed: !!d.completed, empty: !!d.empty };
  });
  const weeks = [];
  let current = [];
  for (const cell of cells) {
    const dow = (new Date(cell.date).getDay() + 6) % 7; // Monday = 0
    if (current.length === 0 && dow > 0) for (let i = 0; i < dow; i++) current.push(null);
    current.push(cell);
    if (current.length === 7) { weeks.push(current); current = []; }
  }
  if (current.length) { while (current.length < 7) current.push(null); weeks.push(current); }
  return { weeks, activeDays: cells.filter(c => c.level > 0).length, totalDays: cells.length };
}
