"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Compass, User, Trophy, Terminal, Swords, Medal, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ProblemCard } from "@/components/codelab/problem-card";
import {
  fetchPublishedProblems, fetchUserCodelabProgress, fetchAttemptedProblemIds, fetchMySubmissions, fetchTopSolvers,
  CODELAB_CATEGORIES, CODELAB_DIFFICULTIES,
} from "@/lib/codelab";
import Dropdown from "@/components/dropdown";

const SUBTABS = [
  { key: "explore",     label: "Explore",      icon: Compass },
  { key: "myprogress",  label: "My Progress",  icon: User },
  { key: "leaderboard", label: "Leaderboards", icon: Trophy },
];

export function CodeLabHub({ onSolve }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtab, setSubtab] = useState("explore");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [search, setSearch] = useState("");

  const [progress, setProgress] = useState(null);
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [submissions, setSubmissions] = useState(null);
  const [topSolvers, setTopSolvers] = useState(null);

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setProgress(null); setAttemptedIds(new Set()); return; }
    fetchUserCodelabProgress(user.uid).then(setProgress).catch(console.error);
    fetchAttemptedProblemIds(user.uid).then(setAttemptedIds).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (subtab === "myprogress" && user && submissions === null) {
      fetchMySubmissions(user.uid).then(setSubmissions).catch(() => setSubmissions([]));
    }
    if (subtab === "leaderboard" && topSolvers === null) {
      fetchTopSolvers().then(setTopSolvers).catch(() => setTopSolvers([]));
    }
  }, [subtab, user, submissions, topSolvers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter(p =>
      (category === "All" || p.category === category) &&
      (difficulty === "All" || p.difficulty === difficulty) &&
      (!q || p.title?.toLowerCase().includes(q) || String(p.number ?? "").includes(q))
    );
  }, [problems, category, difficulty, search]);

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse py-10 text-center">loading problems...</p>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {SUBTABS.map(t => {
            const Icon = t.icon;
            const isActive = subtab === t.key;
            return (
              <button key={t.key} onClick={() => setSubtab(t.key)}
                className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  color: isActive ? "#C77DFF" : "rgba(255,255,255,0.35)",
                  background: isActive ? "rgba(199,125,255,0.08)" : "rgba(255,255,255,0.03)",
                  border: isActive ? "1px solid rgba(199,125,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <Icon size={11} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <Link href="/codelab/playground"
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors">
            <Terminal size={11} /> Playground
          </Link>
          <Link href="/arena?tab=contests"
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors">
            <Swords size={11} /> Contests
          </Link>
        </div>
      </div>

      {subtab === "explore" && (
        <div>
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title or number..."
              className="w-full font-mono text-[12px] text-white/80 pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] outline-none placeholder:text-white/25"
            />
          </div>
          <div className="flex gap-2 flex-wrap mb-5">
            <Dropdown value={category} onChange={setCategory}
              options={[{ value: "All", label: "All Categories" }, ...CODELAB_CATEGORIES.map(c => ({ value: c, label: c }))]}
              className="w-44"
              buttonClassName="font-mono text-[11px] text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
              />
            <Dropdown value={difficulty} onChange={setDifficulty}
              options={[{ value: "All", label: "All Difficulties" }, ...CODELAB_DIFFICULTIES.map(d => ({ value: d, label: d }))]}
              className="w-40"
              buttonClassName="font-mono text-[11px] text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
              />
          </div>
          {filtered.length === 0 ? (
            <p className="font-mono text-xs text-white/20 text-center py-10">no problems match these filters yet</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <ProblemCard key={p.id} problem={p} solved={!!progress?.solvedProblems?.[p.id]} attempted={attemptedIds.has(p.id)} onSolve={onSolve} />
              ))}
            </div>
          )}
        </div>
      )}

      {subtab === "myprogress" && (
        !user ? (
          <p className="font-mono text-xs text-white/20 text-center py-10">
            <a href="/login?next=/codelab" className="text-neon-cyan hover:underline">login</a> to track your CodeLab progress
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "SOLVED", val: progress?.problemsSolvedCount || 0, c: "#00FF41" },
                { label: "SUBMISSIONS", val: progress?.totalSubmissions || 0, c: "#00FFFF" },
                { label: "LANGUAGES USED", val: Object.keys(progress?.languageUsage || {}).length, c: "#C77DFF" },
              ].map(s => (
                <div key={s.label} className="terminal-window p-4 text-center">
                  <p className="font-mono text-lg font-bold" style={{ color: s.c }}>{s.val}</p>
                  <p className="font-mono text-[9px] text-white/25 tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {progress?.languageUsage && Object.keys(progress.languageUsage).length > 0 && (
              <div>
                <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">LANGUAGE USAGE</p>
                <div className="space-y-1.5">
                  {Object.entries(progress.languageUsage).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                    <div key={lang} className="flex items-center gap-2 font-mono text-xs text-white/50">
                      <span className="w-24 flex-shrink-0">{lang}</span>
                      <span className="text-neon-cyan">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">RECENT SUBMISSIONS</p>
              {(submissions || []).length === 0 ? (
                <p className="font-mono text-xs text-white/20">no submissions yet</p>
              ) : (
                <div className="space-y-1.5">
                  {submissions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-3 py-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ color: s.verdict === "Accepted" ? "#00FF41" : "#FF5050", background: s.verdict === "Accepted" ? "rgba(0,255,65,0.1)" : "rgba(255,80,80,0.1)" }}>
                        {s.verdict}
                      </span>
                      <span className="font-mono text-[10px] text-white/40 flex-1">{s.language}</span>
                      <span className="font-mono text-[10px] text-white/25">{s.testsPassed}/{s.testsTotal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {subtab === "leaderboard" && (
        <div>
          <div className="terminal-window mb-4">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">codelab.top_solvers</span>
            </div>
            {(topSolvers || []).length === 0 ? (
              <div className="px-4 py-10 text-center"><p className="font-mono text-xs text-white/25">no solves yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/6">
                      {["#", "HANDLE", "SOLVED"].map(h => (
                        <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topSolvers.map(row => {
                      const isMe = user && row.uid === user.uid;
                      return (
                        <tr key={row.uid} className="border-b border-white/4" style={isMe ? { background: "rgba(0,255,65,0.04)" } : {}}>
                          <td className="font-mono text-xs px-4 py-3">
                            {row.rank <= 3
                              ? <span className="flex items-center gap-1 font-bold" style={{ color: row.rank === 1 ? "#FFD700" : row.rank === 2 ? "#C0C0C0" : "#CD7F32" }}><Medal size={12} /> {row.rank}</span>
                              : <span className="text-white/30">{row.rank}</span>}
                          </td>
                          <td className="font-mono text-xs px-4 py-3" style={{ color: isMe ? "#00FF41" : "white" }}>
                            @{row.handle || "dev"}{isMe && <span className="text-[9px] text-neon-green/50 ml-1.5">you</span>}
                          </td>
                          <td className="font-mono text-xs text-neon-cyan px-4 py-3">{row.problemsSolvedCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Link href="/ranks" className="font-mono text-xs text-neon-cyan hover:underline">view global XP leaderboard →</Link>
        </div>
      )}
    </div>
  );
}
