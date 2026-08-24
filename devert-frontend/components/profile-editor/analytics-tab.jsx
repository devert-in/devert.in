"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Coins, Trophy, ListChecks, Code2, GraduationCap, Cpu, Briefcase, BookOpen, Calculator } from "lucide-react";
import { fetchStudentAnalytics } from "@/lib/studentAnalytics";
import CodingHeatmap from "@/components/profile-editor/coding-heatmap";

// Every number on this tab comes straight from lib/studentAnalytics.js -
// the same aggregation the Campus admin Student Analytics Dashboard already
// uses. Nothing here is invented or estimated: a module with no activity
// yet just shows an empty state, never a fabricated placeholder number.

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="p-3.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        <Icon size={13} />
        <span className="font-mono text-[9px] tracking-widest text-white/30">{label}</span>
      </div>
      <p className="font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, color, empty, children }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Icon size={13} style={{ color }} />
        <span className="font-mono text-[10.5px] font-semibold text-white/70 tracking-wide">{title}</span>
      </div>
      <div className="p-4">
        {empty ? <p className="font-mono text-[11px] text-white/25">No activity yet - start practicing to see this fill in.</p> : children}
      </div>
    </div>
  );
}

function Bar({ label, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[11px] text-white/55">{label}</span>
        <span className="font-mono text-[10px] text-white/30">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const ACTIVITY_LABELS = {
  daily_learning_day: "Completed a Daily Learning day",
  daily_learning_problem: "Solved a Daily Learning problem",
  programming_topic: "Completed a Programming topic",
  cscore_topic: "Completed a CS Core topic",
  aptitude_topic: "Completed an Aptitude Academy topic",
};

export default function AnalyticsTab({ uid }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    fetchStudentAnalytics(uid).then(d => { if (!cancelled) setData(d); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [uid]);

  if (error) return <p className="font-mono text-xs text-white/25">Couldn&apos;t load analytics - check your connection and reopen this tab.</p>;
  if (!data) return <p className="font-mono text-xs text-white/25 animate-pulse">loading analytics...</p>;

  const { programming, csCore, dsa, companyVault, dailyLearning, aptitude, rewardTimeline, rewards } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <StatTile icon={Zap} label="XP" value={rewards.xp} color="#00FFFF" />
        <StatTile icon={Coins} label="COINS" value={rewards.coins} color="#FFD700" />
        <StatTile icon={Trophy} label="SCORE" value={rewards.score} color="#C77DFF" />
        <StatTile icon={Flame} label="STREAK" value={`${rewards.streak}d`} color="#FF9500" />
        <StatTile icon={ListChecks} label="ACTIVITIES" value={rewards.totalActivitiesCompleted} color="#00FF41" />
      </div>

      <ModuleCard icon={Code2} title="CODING HEATMAP" color="#00FF41" empty={false}>
        <CodingHeatmap uid={uid} />
      </ModuleCard>

      <ModuleCard icon={Code2} title="DSA / CODELAB" color="#00FF41" empty={dsa.problemsSolved === 0}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div><p className="font-mono text-lg font-bold text-white">{dsa.problemsSolved}</p><p className="font-mono text-[9px] text-white/30">SOLVED</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{dsa.acceptanceRate ?? "-"}{dsa.acceptanceRate != null && "%"}</p><p className="font-mono text-[9px] text-white/30">ACCEPTANCE RATE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{dsa.totalSubmissions}</p><p className="font-mono text-[9px] text-white/30">SUBMISSIONS</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center py-1.5 rounded" style={{ background: "rgba(0,255,65,0.08)" }}><p className="font-mono text-sm font-bold" style={{ color: "#00FF41" }}>{dsa.byDifficulty.Easy}</p><p className="font-mono text-[8px] text-white/30">EASY</p></div>
          <div className="text-center py-1.5 rounded" style={{ background: "rgba(255,149,0,0.08)" }}><p className="font-mono text-sm font-bold" style={{ color: "#FF9500" }}>{dsa.byDifficulty.Medium}</p><p className="font-mono text-[8px] text-white/30">MEDIUM</p></div>
          <div className="text-center py-1.5 rounded" style={{ background: "rgba(255,80,80,0.08)" }}><p className="font-mono text-sm font-bold" style={{ color: "#FF5050" }}>{dsa.byDifficulty.Hard}</p><p className="font-mono text-[8px] text-white/30">HARD</p></div>
        </div>
        {dsa.topicBreakdown.length > 0 && (
          <div className="space-y-2 mb-4">
            {dsa.topicBreakdown.slice(0, 5).map(t => <Bar key={t.category} label={t.category} pct={t.pct} color="#00FF41" />)}
          </div>
        )}
        {Object.keys(dsa.languageUsage).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(dsa.languageUsage).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
              <span key={lang} className="font-mono text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>{lang} × {count}</span>
            ))}
          </div>
        )}
      </ModuleCard>

      <ModuleCard icon={BookOpen} title="DAILY LEARNING" color="#00FF41" empty={dailyLearning.daysCompleted === 0}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><p className="font-mono text-lg font-bold text-white">{dailyLearning.daysCompleted}</p><p className="font-mono text-[9px] text-white/30">DAYS DONE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{dailyLearning.avgMcqScorePct ?? "-"}{dailyLearning.avgMcqScorePct != null && "%"}</p><p className="font-mono text-[9px] text-white/30">AVG QUIZ SCORE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{dailyLearning.totalProblemsSolved}</p><p className="font-mono text-[9px] text-white/30">PROBLEMS SOLVED</p></div>
          <div><p className="font-mono text-lg font-bold" style={{ color: "#00FFFF" }}>+{dailyLearning.xpEarned}</p><p className="font-mono text-[9px] text-white/30">XP EARNED</p></div>
        </div>
      </ModuleCard>

      <ModuleCard icon={Calculator} title="APTITUDE" color="#FF9500" empty={aptitude.questionsAttempted === 0}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div><p className="font-mono text-lg font-bold text-white">{aptitude.topicsCompleted}</p><p className="font-mono text-[9px] text-white/30">TOPICS DONE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{aptitude.questionsAttempted}</p><p className="font-mono text-[9px] text-white/30">ATTEMPTED</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{aptitude.overallAccuracyPct ?? "-"}{aptitude.overallAccuracyPct != null && "%"}</p><p className="font-mono text-[9px] text-white/30">ACCURACY</p></div>
        </div>
        {aptitude.weakTopics.length > 0 && (
          <div className="mb-3">
            <p className="font-mono text-[9px] text-white/30 mb-1.5">NEEDS WORK</p>
            <div className="flex flex-wrap gap-1.5">
              {aptitude.weakTopics.map(t => (
                <span key={t.name} className="font-mono text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,80,80,0.1)", color: "#FF5050" }}>{t.name} ({t.accuracy}%)</span>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {aptitude.categoryBreakdown.map(c => <Bar key={c.category} label={c.category} pct={c.pct} color="#FF9500" />)}
        </div>
      </ModuleCard>

      <ModuleCard icon={Cpu} title="PROGRAMMING" color="#00FFFF" empty={programming.languagesEnrolled === 0}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div><p className="font-mono text-lg font-bold text-white">{programming.languagesEnrolled}</p><p className="font-mono text-[9px] text-white/30">LANGUAGES</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{programming.totalTopicsCompleted}</p><p className="font-mono text-[9px] text-white/30">TOPICS DONE</p></div>
          <div><p className="font-mono text-sm font-bold text-white truncate">{programming.currentLanguage || "-"}</p><p className="font-mono text-[9px] text-white/30">CURRENT</p></div>
        </div>
        <div className="space-y-2">
          {programming.languageBreakdown.slice(0, 5).map(l => <Bar key={l.id} label={l.name} pct={l.pct} color="#00FFFF" />)}
        </div>
      </ModuleCard>

      <ModuleCard icon={GraduationCap} title="CS CORE" color="#C77DFF" empty={csCore.subjectsStarted === 0}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><p className="font-mono text-lg font-bold text-white">{csCore.subjectsCompleted}/{csCore.subjectsStarted}</p><p className="font-mono text-[9px] text-white/30">SUBJECTS COMPLETE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{csCore.totalTopicsCompleted}</p><p className="font-mono text-[9px] text-white/30">TOPICS DONE</p></div>
        </div>
        {csCore.strongestSubject && <p className="font-mono text-[11px] text-white/50 mb-1">Strongest: <span style={{ color: "#00FF41" }}>{csCore.strongestSubject}</span></p>}
        {csCore.weakestSubject && <p className="font-mono text-[11px] text-white/50 mb-3">Needs work: <span style={{ color: "#FF9500" }}>{csCore.weakestSubject}</span></p>}
        <div className="space-y-2">
          {csCore.subjectBreakdown.slice(0, 5).map(s => <Bar key={s.id} label={s.name} pct={s.pct} color="#C77DFF" />)}
        </div>
      </ModuleCard>

      <ModuleCard icon={Briefcase} title="COMPANY VAULT" color="#FFD700" empty={companyVault.companiesStarted === 0}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div><p className="font-mono text-lg font-bold text-white">{companyVault.totalSolved}</p><p className="font-mono text-[9px] text-white/30">SOLVED</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{companyVault.companiesCompleted}/{companyVault.companiesStarted}</p><p className="font-mono text-[9px] text-white/30">COMPANIES DONE</p></div>
          <div><p className="font-mono text-lg font-bold text-white">{companyVault.totalBookmarked}</p><p className="font-mono text-[9px] text-white/30">BOOKMARKED</p></div>
        </div>
        <div className="space-y-2">
          {companyVault.companyBreakdown.slice(0, 5).map(c => <Bar key={c.id} label={c.name} pct={c.pct} color="#FFD700" />)}
        </div>
      </ModuleCard>

      <ModuleCard icon={Flame} title="ACTIVITY TIMELINE" color="#FF9500" empty={rewardTimeline.length === 0}>
        <div className="space-y-2.5 max-h-64 overflow-y-auto">
          {rewardTimeline.slice(0, 20).map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="font-mono text-white/60">{ACTIVITY_LABELS[r.activityType] || r.activityType}</span>
              <span className="font-mono text-white/25 flex-shrink-0">
                {r.xp > 0 && `+${r.xp} XP`}{r.coins > 0 && ` +${r.coins} coins`}
              </span>
            </div>
          ))}
        </div>
      </ModuleCard>
    </motion.div>
  );
}
