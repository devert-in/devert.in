"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Layers, Trophy, Users } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusSkeleton, CampusTable, CampusEmptyState,
} from "@/components/campus/campus-ui";
import {
  fetchTests, fetchTestResults, rankRows, aggregateResults, testTypeLabel,
} from "@/lib/gateTests";
import { useGate, GateNoContent } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateFilterRow, GateEstimateNote, formatDuration, formatMarks,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// Leaderboards, scoped every way the product asks for - campus, department, year,
// section, weekly, monthly, subject-wise - all derived from ONE cheap query per
// test against the answer-free results subcollection (see lib/gateTests.js's
// persistGrading for why that document exists at all).
//
// Two honest constraints, stated in the UI rather than hidden:
//
//  1. Every scope is a client-side filter over a per-test board. That is correct
//     and cheap, and it means a department board ranks 1..n within the department
//     rather than showing global ranks with gaps (see rankRows).
//
//  2. A true cross-test "overall GATE rank" over every student on the platform
//     needs server-side aggregation, which this deployment does not have (Cloud
//     Functions are blocked on the project's billing account - the same
//     constraint documented for the coin economy). The Overall view therefore
//     aggregates a BOUNDED set of recent mocks, loaded only when asked for, and
//     says exactly what it included. It is a real ranking of a stated sample,
//     not a fabricated global one.

const SCOPES = [
  { key: "all", label: "Everyone", icon: Trophy },
  { key: "campus", label: "My campus", icon: Building2 },
  { key: "department", label: "My department", icon: Layers },
  { key: "year", label: "My year", icon: Users },
  { key: "section", label: "My section", icon: Users },
];

const WINDOWS = [
  { v: null, label: "All time" },
  { v: 7, label: "This week" },
  { v: 30, label: "This month" },
];

export function GateLeaderboard() {
  const { user, userData } = useAuth();
  const { paper, tree } = useGate();

  const [tests, setTests] = useState(null);
  const [mode, setMode] = useState("test");
  const [testId, setTestId] = useState(null);
  const [results, setResults] = useState(null);
  const [scope, setScope] = useState("all");
  const [windowDays, setWindowDays] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [overall, setOverall] = useState(null);
  const [overallBasis, setOverallBasis] = useState([]);
  const [loadingOverall, setLoadingOverall] = useState(false);

  useEffect(() => {
    if (!paper?.id) return;
    let cancelled = false;
    setTests(null);
    fetchTests(paper.id).then(list => {
      if (cancelled) return;
      setTests(list);
      // Default to the most substantial board available: a full-length mock if
      // one exists, otherwise whatever is first.
      const preferred = list.find(t => t.testType === "full" || t.testType === "pyq") || list[0];
      setTestId(preferred?.id || null);
    }).catch(() => setTests([]));
    return () => { cancelled = true; };
  }, [paper?.id]);

  useEffect(() => {
    if (!testId) { setResults(null); return; }
    let cancelled = false;
    setResults(null);
    fetchTestResults(testId, 100).then(r => { if (!cancelled) setResults(r); }).catch(() => setResults([]));
    return () => { cancelled = true; };
  }, [testId]);

  const scopeOf = (row) => {
    if (scope === "all") return true;
    if (!userData) return false;
    if (scope === "campus") return row.institutionId && row.institutionId === userData.institutionId;
    if (scope === "department") return row.department && row.department === userData.department
      && row.institutionId === userData.institutionId;
    if (scope === "year") return String(row.year) === String(userData.year)
      && row.institutionId === userData.institutionId;
    if (scope === "section") return row.section && row.section === userData.section
      && String(row.year) === String(userData.year) && row.institutionId === userData.institutionId;
    return true;
  };

  const inWindow = (row) => {
    if (!windowDays) return true;
    const ms = row.submittedAt?.toMillis?.();
    if (!ms) return false;
    return Date.now() - ms <= windowDays * 86400000;
  };

  // Subject-wise ranking re-scores each row on ONE subject's marks from the
  // stored breakdown, rather than showing overall scores under a subject
  // heading - "who is best at Theory of Computation" has to mean the TOC marks.
  const rescoreBySubject = (rows) => {
    if (!subjectId) return rows;
    return rows
      .map(r => {
        const s = (r.subjectBreakdown || []).find(x => x.subjectId === subjectId);
        if (!s || !s.maxMarks) return null;
        return { ...r, score: s.marks, maxScore: s.maxMarks, accuracy: s.accuracy };
      })
      .filter(Boolean);
  };

  const rows = useMemo(() => {
    const base = mode === "overall" ? (overall || []) : (results || []);
    let filtered = base.filter(scopeOf);
    if (mode === "test") filtered = filtered.filter(inWindow);
    if (mode === "test") filtered = rescoreBySubject(filtered);
    return rankRows(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, overall, results, scope, windowDays, subjectId, userData]);

  // Deliberately explicit and user-triggered: aggregating several boards is the
  // one expensive read on this screen, so it never happens on page load.
  const computeOverall = async () => {
    if (!tests?.length) return;
    setLoadingOverall(true);
    try {
      const mocks = tests.filter(t => t.testType === "full" || t.testType === "pyq").slice(0, 3);
      const pool = mocks.length ? mocks : tests.slice(0, 3);
      const loaded = await Promise.all(pool.map(t =>
        fetchTestResults(t.id, 100).then(results => ({ testId: t.id, title: t.title, results })).catch(() => ({ testId: t.id, title: t.title, results: [] }))
      ));
      setOverall(aggregateResults(loaded));
      setOverallBasis(loaded.map(l => l.title));
      setMode("overall");
    } finally {
      setLoadingOverall(false);
    }
  };

  if (tests === null) return <CampusCard className="p-4"><CampusSkeleton height={220} /></CampusCard>;
  if (tests.length === 0) {
    return (
      <div className="space-y-5">
        <GateSectionHeading label="LEADERBOARD" icon={Trophy} title="Leaderboard"
          description="Rankings come from timed test attempts, so there is nothing to rank until tests are published." />
        <GateNoContent what="tests" hint="Once a platform admin publishes a test and students attempt it, its leaderboard appears here." />
      </div>
    );
  }

  const selected = tests.find(t => t.id === testId);
  const myRow = rows.find(r => r.uid === user?.uid);
  const noCampus = scope !== "all" && !userData?.institutionId;

  return (
    <div className="space-y-5">
      <GateSectionHeading label="LEADERBOARD" icon={Trophy} title="Leaderboard"
        description="Ranked by score, then by time taken. Only students who have submitted the test appear - there is no way to place without attempting." />

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setMode("test")}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: mode === "test" ? CAMPUS.tealTint : CAMPUS.paper,
            border: `1px solid ${mode === "test" ? CAMPUS.teal : CAMPUS.line}`,
            color: mode === "test" ? CAMPUS.teal : CAMPUS.inkSoft,
          }}>
          Per test
        </button>
        <button onClick={() => (overall ? setMode("overall") : computeOverall())} disabled={loadingOverall}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: mode === "overall" ? CAMPUS.tealTint : CAMPUS.paper,
            border: `1px solid ${mode === "overall" ? CAMPUS.teal : CAMPUS.line}`,
            color: mode === "overall" ? CAMPUS.teal : CAMPUS.inkSoft,
          }}>
          {loadingOverall ? "Computing..." : "Overall"}
        </button>
      </div>

      {mode === "test" && (
        <CampusCard className="p-4 space-y-3">
          <div>
            <p className="text-[9.5px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>TEST</p>
            <select value={testId || ""} onChange={e => setTestId(e.target.value)}
              className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.title} - {testTypeLabel(t.testType)}</option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <GateFilterRow label="PERIOD" value={windowDays} onChange={setWindowDays} allLabel="All time"
              options={WINDOWS.filter(w => w.v).map(w => ({ v: w.v, label: w.label }))} />
            <GateFilterRow label="SUBJECT-WISE" value={subjectId} onChange={setSubjectId} allLabel="Whole test"
              options={(tree || []).map(s => ({ v: s.id, label: s.name }))} />
          </div>
        </CampusCard>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {SCOPES.map(s => {
          const active = s.key === scope;
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setScope(s.key)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{
                background: active ? CAMPUS.chromeBg : CAMPUS.paper,
                border: `1px solid ${active ? CAMPUS.chromeBg : CAMPUS.line}`,
                color: active ? CAMPUS.chromeFg : CAMPUS.inkSoft,
              }}>
              <Icon size={12} /> {s.label}
            </button>
          );
        })}
      </div>

      {noCampus ? (
        <CampusCard className="p-4">
          <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
            Campus, department, year and section rankings need your campus membership. Join your college&apos;s Campus
            workspace and these scopes fill in automatically.
          </p>
        </CampusCard>
      ) : mode === "test" && results === null ? (
        <CampusCard className="p-4"><CampusSkeleton height={180} /></CampusCard>
      ) : rows.length === 0 ? (
        <CampusEmptyState icon={Trophy} title="No ranked attempts yet"
          description={mode === "test"
            ? `Nobody in this scope has submitted ${selected?.title || "this test"} yet${windowDays ? " in this period" : ""}. Be the first.`
            : "No attempts in the aggregated sample yet."} />
      ) : (
        <>
          {myRow && (
            <CampusCard className="p-3.5 flex items-center gap-3"
              style={{ border: `1px solid ${CAMPUS.teal}`, background: CAMPUS.tealTint }}>
              <span className="font-mono text-lg font-bold flex-shrink-0" style={{ color: CAMPUS.teal }}>#{myRow.rank}</span>
              <div className="flex-1 min-w-0">
                <b className="text-[13px] block" style={{ color: CAMPUS.ink }}>You</b>
                <span className="text-[11px]" style={{ color: CAMPUS.inkSoft }}>
                  {formatMarks(myRow.score)} / {myRow.maxScore}
                  {myRow.timeTakenSeconds ? ` · ${formatDuration(myRow.timeTakenSeconds)}` : ""}
                </span>
              </div>
              <CampusChip color={CAMPUS.teal}>
                TOP {Math.max(1, Math.round((myRow.rank / rows.length) * 100))}%
              </CampusChip>
            </CampusCard>
          )}

          <CampusCard className="p-4">
            <CampusTable
              rowKey="uid"
              rows={rows}
              rowStyle={r => (r.uid === user?.uid ? { background: CAMPUS.tealTint } : {})}
              columns={[
                { key: "rank", label: "#", render: r => <span className="font-mono font-bold">{r.rank}</span> },
                {
                  key: "who", label: "Student",
                  render: r => (
                    <span>
                      <b style={{ color: CAMPUS.ink }}>{r.campusFullName || r.handle || "Anonymous"}</b>
                      {r.rollNumber && <span className="font-mono text-[10.5px] ml-2" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
                    </span>
                  ),
                },
                {
                  key: "score", label: mode === "overall" ? "Avg / 100" : "Score", sortable: true,
                  render: r => <span className="font-mono">{formatMarks(r.score)}{mode === "overall" ? "" : ` / ${r.maxScore}`}</span>,
                },
                ...(mode === "overall"
                  ? [{ key: "testsTaken", label: "Tests", sortable: true }]
                  : [{ key: "accuracy", label: "Accuracy", render: r => `${r.accuracy ?? 0}%` }]),
                {
                  key: "timeTakenSeconds", label: "Time", sortable: true,
                  render: r => (r.timeTakenSeconds ? formatDuration(r.timeTakenSeconds) : "-"),
                },
                ...(scope === "all" ? [{ key: "department", label: "Dept", render: r => r.department || "-" }] : []),
              ]} />
          </CampusCard>

          {mode === "test" ? (
            <GateEstimateNote>
              Top 100 submissions for {selected?.title}, then filtered to your selected scope and ranked within it.
              {subjectId ? " Scores here are that subject's marks only, taken from each attempt's stored breakdown." : ""}
              {" "}Ties break on time taken.
            </GateEstimateNote>
          ) : (
            <GateEstimateNote>
              Averaged across {overallBasis.length} test{overallBasis.length === 1 ? "" : "s"}
              {overallBasis.length ? ` (${overallBasis.join(", ")})` : ""}, top 100 submissions each, normalised to 100 marks
              so a shorter test cannot count for more. An average rather than a total, so this ranks preparation quality
              rather than who took the most tests. A platform-wide ranking across every test would need server-side
              aggregation, which this deployment does not run yet.
            </GateEstimateNote>
          )}
        </>
      )}
    </div>
  );
}
