// Shared pure date-bucketing + streak math, extracted from
// components/profile-editor/coding-heatmap.jsx so the exact same algorithm
// backs both the dark-terminal heatmap (global /profile) and the Campus
// heatmap/best-streak stat - two renderers, one implementation, rather than
// a second hand-copied version of the same day-grid/streak logic.

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// dates: Date[] (duplicates/multiple-per-day are fine, they just raise that
// day's count). Returns a Sunday-aligned week grid covering the last
// `daysBack` days plus today, month label markers for the header row, and
// summary counts - the exact shape coding-heatmap.jsx already renders.
export function buildActivityWeeks(dates, daysBack = 364) {
  const countsByDate = new Map();
  dates.forEach(d => { const k = toDateKey(d); countsByDate.set(k, (countsByDate.get(k) || 0) + 1); });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - daysBack);
  start.setDate(start.getDate() - start.getDay()); // roll back to the most recent Sunday

  const days = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = toDateKey(cursor);
    days.push({ date: new Date(cursor), key, count: countsByDate.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthMarkers = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstOfWeek = week[0].date;
    if (firstOfWeek.getMonth() !== lastMonth) { monthMarkers.push({ wi, label: MONTH_LABELS[firstOfWeek.getMonth()] }); lastMonth = firstOfWeek.getMonth(); }
  });

  let total = 0, activeDays = 0, streak = 0, maxStreak = 0;
  days.forEach(d => {
    total += d.count;
    if (d.count > 0) { activeDays++; streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  });

  return { weeks, monthMarkers, total, activeDays, maxStreak };
}

// Longest run of consecutive calendar days containing at least one activity
// date, across one or more merged/possibly-overlapping sources (e.g. CodeLab
// submissions + aptitude attempts) - used where only the single "best streak"
// number is needed, not a full grid.
export function computeLongestStreak(dates) {
  if (!dates.length) return 0;
  const DAY_MS = 86400000;
  const uniqueDays = Array.from(new Set(dates.map(d => toDateKey(d))))
    .map(k => { const [y, m, day] = k.split("-").map(Number); return new Date(y, m - 1, day).getTime(); })
    .sort((a, b) => a - b);

  let longest = 1, current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const gapDays = Math.round((uniqueDays[i] - uniqueDays[i - 1]) / DAY_MS);
    if (gapDays === 1) { current++; longest = Math.max(longest, current); }
    else if (gapDays > 1) { current = 1; }
  }
  return longest;
}
