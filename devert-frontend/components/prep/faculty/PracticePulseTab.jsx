"use client";

// Class-group-wide practice pulse - no exam required. Two data sources kept
// deliberately separate so neither read pattern scales with cohort size in a
// way that could time out:
//   1. attemptsForClassGroup (collectionGroup `records`, one query per group,
//      date-ranged) → "active today / this week" - scales with attempt count,
//      not roster size.
//   2. prepProgress fetched per uid, PAGINATED 200-at-a-time with a
//      load-more button → avg streak + category-accuracy heat table - this is
//      the read that scales with roster size, so it stays bounded (design §8).

import { useEffect, useMemo, useState } from "react";
import { Activity, Flame, Users, Search, Loader2, AlertCircle } from "lucide-react";
import { StatTile, TerminalCard, EmptyState, BracketButton } from "@/components/prep/ui";
import { getStudents, attemptsForClassGroup, getProgress, dateKey } from "@/lib/prep/db";
import { CATEGORIES } from "@/lib/prep/constants";
import { average, round1, pctColor } from "./facultyUtils";

const PAGE_SIZE = 200;
const PROGRESS_CHUNK = 25;

function weekWindow() {
  const today = dateKey();
  const weekAgo = dateKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  return { today, weekAgo };
}

async function fetchProgressChunked(uids, onEach) {
  for (let i = 0; i < uids.length; i += PROGRESS_CHUNK) {
    const chunk = uids.slice(i, i + PROGRESS_CHUNK);
    const results = await Promise.all(
      chunk.map(async (uid) => {
        try {
          return [uid, await getProgress(uid)];
        } catch {
          return [uid, null];
        }
      })
    );
    onEach(results);
  }
}

export function PracticePulseTab({ group, classGroups }) {
  const [students, setStudents] = useState(null);
  const [rosterError, setRosterError] = useState("");
  const [attempts, setAttempts] = useState(null); // { activeToday:Set, activeWeek:Set }
  const [attemptsError, setAttemptsError] = useState("");
  const [progressMap, setProgressMap] = useState(new Map());
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [search, setSearch] = useState("");

  // Roster + attempts reload whenever the class-group scope changes.
  useEffect(() => {
    let cancelled = false;
    setStudents(null);
    setRosterError("");
    setAttempts(null);
    setAttemptsError("");
    setProgressMap(new Map());
    setPageSize(PAGE_SIZE);

    (async () => {
      try {
        const roster = await getStudents({ classGroup: group === "ALL" ? undefined : group, max: 3000 });
        if (cancelled) return;
        setStudents(roster);
      } catch (err) {
        if (!cancelled) setRosterError(err?.message || "Failed to load roster");
      }
    })();

    (async () => {
      try {
        const { today, weekAgo } = weekWindow();
        const groupsToQuery = group === "ALL" ? classGroups.map((g) => g.name) : [group];
        const perGroup = await Promise.all(
          groupsToQuery.map((g) => attemptsForClassGroup(g, { dateFrom: weekAgo, dateTo: today, max: 3000 }))
        );
        if (cancelled) return;
        const activeToday = new Set();
        const activeWeek = new Set();
        let total = 0;
        perGroup.flat().forEach((rec) => {
          total += 1;
          activeWeek.add(rec.uid);
          if (rec.date === today) activeToday.add(rec.uid);
        });
        setAttempts({ activeToday, activeWeek, total });
      } catch (err) {
        if (!cancelled) setAttemptsError(err?.message || "Failed to load recent activity");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [group, classGroups]);

  // Fetch prepProgress for whichever slice of the roster is newly visible.
  useEffect(() => {
    if (!students) return;
    const slice = students.slice(0, pageSize);
    const missing = slice.filter((s) => !progressMap.has(s.id));
    if (!missing.length) return;
    let cancelled = false;
    setLoadingProgress(true);
    fetchProgressChunked(
      missing.map((s) => s.id),
      (results) => {
        if (cancelled) return;
        setProgressMap((prev) => {
          const next = new Map(prev);
          results.forEach(([uid, p]) => next.set(uid, p));
          return next;
        });
      }
    ).finally(() => {
      if (!cancelled) setLoadingProgress(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, pageSize]);

  const loadedSlice = useMemo(() => (students || []).slice(0, pageSize), [students, pageSize]);
  const loadedWithProgress = useMemo(
    () => loadedSlice.filter((s) => progressMap.has(s.id) && progressMap.get(s.id)),
    [loadedSlice, progressMap]
  );

  const avgStreak = round1(average(loadedWithProgress.map((s) => progressMap.get(s.id)?.streak || 0)));

  const filteredRows = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q
      ? loadedSlice.filter(
          (s) =>
            (s.rollNumber || "").toUpperCase().includes(q) || (s.displayName || "").toUpperCase().includes(q)
        )
      : loadedSlice;
    return [...base].sort((a, b) => (a.rollNumber || "￿").localeCompare(b.rollNumber || "￿"));
  }, [loadedSlice, search]);

  if (rosterError) {
    return <EmptyState icon={AlertCircle} title="couldn't load roster" message={rosterError} />;
  }

  if (!students) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs text-white/35 py-10 justify-center">
        <Loader2 size={14} className="animate-spin" /> loading roster…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Students in scope" value={students.length} icon={Users} color="#00FFFF" />
        <StatTile
          label="Active Today"
          value={attempts ? attempts.activeToday.size : "…"}
          sub={attemptsError ? "load failed" : `of ${students.length}`}
          icon={Activity}
          color="#00FF41"
          delay={0.05}
        />
        <StatTile
          label="Active This Week"
          value={attempts ? attempts.activeWeek.size : "…"}
          sub={attemptsError ? attemptsError : `of ${students.length}`}
          icon={Activity}
          color="#FF9500"
          delay={0.1}
        />
        <StatTile
          label="Avg Streak"
          value={avgStreak}
          sub={`based on ${loadedWithProgress.length}/${loadedSlice.length} loaded`}
          icon={Flame}
          color="#FF6430"
          delay={0.15}
        />
      </div>

      <TerminalCard filename="category-accuracy-heat.log">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="font-mono text-[10px] text-white/30 tracking-wider">CATEGORY_ACCURACY_HEAT (per student)</p>
          <div className="relative w-full max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roll number or name…"
              className="w-full font-mono text-[11px] pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded outline-none text-white placeholder:text-white/20 focus:border-neon-cyan/50 transition-colors"
              aria-label="Search students in heat table"
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState title="no students" message="No students match this scope or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-3 py-2 text-white/30 uppercase text-[10px] tracking-wider">Roll Number</th>
                  <th className="text-left px-3 py-2 text-white/30 uppercase text-[10px] tracking-wider">Name</th>
                  <th className="text-center px-3 py-2 text-white/30 uppercase text-[10px] tracking-wider">Streak</th>
                  {CATEGORIES.map((c) => (
                    <th key={c.id} className="text-center px-2 py-2 text-white/30 uppercase text-[10px] tracking-wider">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s) => {
                  const progress = progressMap.get(s.id);
                  const known = progressMap.has(s.id);
                  return (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-neon-cyan font-semibold">{s.rollNumber || "-"}</td>
                      <td className="px-3 py-2 text-white/60">{s.displayName || "-"}</td>
                      <td className="px-3 py-2 text-center text-white/60">
                        {known ? progress?.streak || 0 : <Loader2 size={10} className="inline animate-spin text-white/20" />}
                      </td>
                      {CATEGORIES.map((c) => {
                        if (!known) {
                          return <td key={c.id} className="px-2 py-2 text-center text-white/15">…</td>;
                        }
                        const stat = progress?.categoryStats?.[c.id];
                        const attempted = stat?.attempted || 0;
                        const correct = stat?.correct || 0;
                        if (!attempted) {
                          return <td key={c.id} className="px-2 py-2 text-center text-white/15">-</td>;
                        }
                        const pct = Math.round((correct / attempted) * 100);
                        const color = pctColor(pct);
                        return (
                          <td key={c.id} className="px-2 py-2 text-center">
                            <span
                              className="inline-block min-w-[36px] px-1.5 py-0.5 rounded font-mono"
                              style={{ color, background: `${color}14`, border: `1px solid ${color}40` }}
                            >
                              {pct}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-5">
          {loadingProgress && (
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-white/35">
              <Loader2 size={12} className="animate-spin" /> loading progress…
            </span>
          )}
          {pageSize < students.length && (
            <BracketButton variant="ghost" onClick={() => setPageSize((p) => p + PAGE_SIZE)}>
              LOAD_MORE ({Math.min(pageSize, students.length)}/{students.length})
            </BracketButton>
          )}
        </div>
      </TerminalCard>
    </div>
  );
}
