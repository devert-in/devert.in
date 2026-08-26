"use client";

// Campus student Profile tab - LeetCode-style analytics, built entirely from
// real, already-existing data (see lib/campusProfile.js's fetchProfileAnalytics
// for exactly which collection backs every number here). Four widgets that
// don't have a real DeVert equivalent were replaced with an honest substitute
// rather than fabricated:
//   - Contest RATING over time  -> real score% per contest attempted
//   - Global rank/percentile    -> real institution-scoped rank/percentile
//   - Badge shelf                -> the student's real, already-computed
//                                    Rank Tier (userData.tier, see AuthContext's
//                                    getTier())
//   - Best streak                 -> computed on read from real CodeLab
//                                    submission + aptitude attempt history
//                                    (lib/activityDates.js's computeLongestStreak),
//                                    not stored anywhere, but not invented either

import { useEffect, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera, Loader2, Building2, Hash, GraduationCap, Mail, Phone,
  Trophy, Medal, Code2, ListChecks,
} from "lucide-react";
import { storage, storageRef, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { slideUp, staggerContainer } from "@/lib/campus-motion";
import { ROLE_CATALOG } from "@/lib/permissions";
import { fetchProfileAnalytics } from "@/lib/campusProfile";
import {
  CampusCard, CampusStat, CampusChip, CampusProgressBar, CampusSkeleton, CampusEmptyState,
} from "@/components/campus/campus-ui";
import { ProgressRing, StreakRingCard, RecentActivityCard, smoothPath } from "@/components/campus/campus-dashboard-widgets";
import { CampusActivityHeatmap } from "@/components/campus/campus-activity-heatmap";

// Downscales to maxDim and re-encodes as JPEG via canvas - this also strips
// EXIF (orientation/GPS/etc) as a side effect, since canvas drawing never
// copies source metadata. Same technique as app/profile/page.jsx's avatar
// upload, kept local here rather than shared - it's a single self-contained
// helper, not a growing API.
const resizeAvatarImage = (file, maxDim = 512) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("canvas encode failed")), "image/jpeg", 0.9);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
  img.src = url;
});

function ProfileRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-mono tracking-wide mb-0.5" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</span>
        <span className="block text-[13.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>{value}</span>
      </div>
    </div>
  );
}

function InstitutionRankCard({ standing, institutionName, loading }) {
  if (loading) return <CampusCard glass className="p-5"><CampusSkeleton variant="rect" height={110} /></CampusCard>;
  return (
    <CampusCard glass className="p-5 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.gold, 14), color: CAMPUS.gold }}>
          <Trophy size={16} />
        </div>
        <span className="text-[11px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>INSTITUTION RANK</span>
      </div>
      <p className="leading-tight" style={{ color: CAMPUS.ink }}>
        <span className="text-2xl font-bold">#{standing.rank}</span>
        <span className="text-[13px] font-medium ml-1.5" style={{ color: CAMPUS.inkFaint }}>of {standing.total}</span>
      </p>
      <p className="text-[12px] mt-1" style={{ color: CAMPUS.inkSoft }}>
        {standing.percentile != null
          ? `Better than ${standing.percentile}% of students at ${institutionName || "your institution"}`
          : institutionName}
      </p>
    </CampusCard>
  );
}

const DSA_DIFFICULTIES = [
  { key: "Easy", color: CAMPUS.good },
  { key: "Medium", color: CAMPUS.warn },
  { key: "Hard", color: CAMPUS.bad },
];

function SolvedGauge({ dsa, loading }) {
  if (loading) return <CampusCard glass className="p-5"><CampusSkeleton variant="rect" height={150} /></CampusCard>;
  if (!dsa.totalProblems) {
    return <CampusEmptyState icon={Code2} color={CAMPUS.teal} title="No DSA problems published yet"
      description="Once CodeLab problems are published, your solved breakdown shows up here." />;
  }
  const pct = Math.round((dsa.problemsSolved / dsa.totalProblems) * 100);
  return (
    <CampusCard glass className="p-5">
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: CAMPUS.ink }}>DSA Problems Solved</h3>
      <div className="flex items-center gap-5">
        <ProgressRing pct={pct} size={92} stroke={8} color={CAMPUS.teal}
          ariaLabel={`${dsa.problemsSolved} of ${dsa.totalProblems} problems solved`}>
          <span className="text-[16px] font-bold leading-tight" style={{ color: CAMPUS.ink }}>{dsa.problemsSolved}</span>
          <span className="text-[10px]" style={{ color: CAMPUS.inkFaint }}>/{dsa.totalProblems}</span>
        </ProgressRing>
        <div className="flex-1 space-y-2 min-w-0">
          {DSA_DIFFICULTIES.map(d => (
            <div key={d.key} className="flex items-center justify-between text-[12.5px]">
              <span style={{ color: d.color }}>{d.key}</span>
              <span className="tabular-nums" style={{ color: CAMPUS.inkSoft }}>
                {dsa.byDifficulty[d.key]}/{dsa.totalByDifficulty[d.key]}
              </span>
            </div>
          ))}
        </div>
      </div>
      {dsa.acceptanceRate != null && (
        <p className="text-[11.5px] mt-4 pt-3" style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
          {dsa.acceptanceRate}% acceptance rate across {dsa.totalSubmissions} submission{dsa.totalSubmissions === 1 ? "" : "s"}
        </p>
      )}
    </CampusCard>
  );
}

const CHART_VB_W = 640, CHART_VB_H = 180, CHART_PAD_L = 30, CHART_PAD_R = 12, CHART_PAD_T = 14, CHART_PAD_B = 22;

// DeVert has no contest rating/ELO system (see lib/contests.js's
// fetchMyContestHistory) - this charts the student's REAL score % across
// every contest they've attempted, in order, as the honest substitute for a
// LeetCode-style rating-over-time line. Same hand-rolled SVG technique as
// WeeklyProgressCard (this codebase deliberately has no charting library -
// see that component's own header comment), just a single series instead of
// a metric switcher.
function ContestPerformanceChart({ history = [], loading = false }) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(null);

  const { points, linePath, areaPath } = useMemo(() => {
    const innerW = CHART_VB_W - CHART_PAD_L - CHART_PAD_R;
    const innerH = CHART_VB_H - CHART_PAD_T - CHART_PAD_B;
    const step = history.length > 1 ? innerW / (history.length - 1) : 0;
    const pts = history.map((h, i) => ({
      x: CHART_PAD_L + i * step,
      y: CHART_PAD_T + innerH * (1 - (h.scorePct || 0) / 100),
      ...h,
      index: i,
    }));
    const line = smoothPath(pts);
    const baseline = CHART_PAD_T + innerH;
    const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z` : "";
    return { points: pts, linePath: line, areaPath: area };
  }, [history]);

  if (loading) {
    return (
      <CampusCard glass className="p-5 space-y-3">
        <CampusSkeleton variant="rect" height={18} width="46%" />
        <CampusSkeleton variant="rect" height={150} />
      </CampusCard>
    );
  }

  if (history.length === 0) {
    return (
      <CampusEmptyState icon={Trophy} color={CAMPUS.teal} title="No contests attempted yet"
        description="Your score trend across every contest you attempt will show up here." />
    );
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <CampusCard glass className="p-5">
      <h3 className="text-[15px] font-semibold mb-0.5" style={{ color: CAMPUS.ink }}>Contest Performance</h3>
      <p className="text-[12px] mb-4" style={{ color: CAMPUS.inkFaint }}>
        Score % across {history.length} contest{history.length === 1 ? "" : "s"} attempted
      </p>
      <div className="relative">
        <svg viewBox={`0 0 ${CHART_VB_W} ${CHART_VB_H}`} width="100%" style={{ display: "block", overflow: "visible" }}
          role="img" aria-label={`Contest score percentage across ${history.length} contests`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const xInVb = ((e.clientX - rect.left) / rect.width) * CHART_VB_W;
            let nearest = points[0];
            for (const p of points) { if (Math.abs(p.x - xInVb) < Math.abs(nearest.x - xInVb)) nearest = p; }
            setHover(nearest || null);
          }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CAMPUS.teal} stopOpacity="0.28" />
              <stop offset="100%" stopColor={CAMPUS.teal} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {gridLines.map(g => {
            const y = CHART_PAD_T + (CHART_VB_H - CHART_PAD_T - CHART_PAD_B) * g;
            return (
              <g key={g}>
                <line x1={CHART_PAD_L} y1={y} x2={CHART_VB_W - CHART_PAD_R} y2={y} stroke={CAMPUS.line} strokeWidth="1" />
                <text x={CHART_PAD_L - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill={CAMPUS.inkFaint}>{Math.round(100 * (1 - g))}</text>
              </g>
            );
          })}
          {areaPath && (
            <motion.path d={areaPath} fill={`url(#${gradientId})`}
              initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} />
          )}
          {linePath && (
            <motion.path d={linePath} fill="none" stroke={CAMPUS.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
          )}
          {points.map(p => (
            <g key={p.index}>
              {hover?.index === p.index && (
                <line x1={p.x} y1={CHART_PAD_T} x2={p.x} y2={CHART_VB_H - CHART_PAD_B} stroke={CAMPUS.teal}
                  strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
              )}
              <circle cx={p.x} cy={p.y} r={hover?.index === p.index ? 5 : 3} fill={CAMPUS.surface} stroke={CAMPUS.teal} strokeWidth="2.2" />
            </g>
          ))}
        </svg>
        {hover && (
          <div className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              left: `${(hover.x / CHART_VB_W) * 100}%`, top: `${(hover.y / CHART_VB_H) * 100}%`,
              transform: "translate(-50%, calc(-100% - 10px))",
              background: CAMPUS.chromeBg, color: CAMPUS.chromeFg, boxShadow: CAMPUS.shadowLg,
            }}>
            <span className="text-[11px] font-bold">{hover.scorePct}%</span>
            <span className="block text-[10px] opacity-75 truncate" style={{ maxWidth: 160 }}>{hover.title}</span>
          </div>
        )}
      </div>
    </CampusCard>
  );
}

function SkillsBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-[12px] truncate" style={{ color: CAMPUS.inkSoft }}>{label}</span>
        <span className="text-[11px] flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{pct}%</span>
      </div>
      <CampusProgressBar pct={pct} color={color} />
    </div>
  );
}

function SkillsBreakdown({ dsa, aptitude, loading }) {
  if (loading) return <CampusCard glass className="p-5"><CampusSkeleton variant="rect" height={220} /></CampusCard>;

  const hasDsaTopics = dsa.topicBreakdown.length > 0;
  const hasAptitudeTopics = aptitude.topics.length > 0;
  const languageEntries = Object.entries(dsa.languageUsage).sort((a, b) => b[1] - a[1]);
  const hasLanguages = languageEntries.length > 0;

  if (!hasDsaTopics && !hasAptitudeTopics && !hasLanguages) {
    return <CampusEmptyState icon={ListChecks} color={CAMPUS.purple} title="No skills tracked yet"
      description="Solve DSA problems or practice Aptitude topics to build your skills breakdown." />;
  }

  return (
    <CampusCard glass className="p-5 space-y-5">
      <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Skills</h3>
      {hasDsaTopics && (
        <div>
          <p className="text-[10.5px] font-mono tracking-wide mb-2.5" style={{ color: CAMPUS.inkFaint }}>DSA TOPICS</p>
          <div className="space-y-2.5">
            {dsa.topicBreakdown.map(t => <SkillsBar key={t.category} label={t.category} pct={t.pct} color={CAMPUS.teal} />)}
          </div>
        </div>
      )}
      {hasAptitudeTopics && (
        <div>
          <p className="text-[10.5px] font-mono tracking-wide mb-2.5" style={{ color: CAMPUS.inkFaint }}>APTITUDE TOPICS</p>
          <div className="space-y-2.5">
            {aptitude.topics.map(t => <SkillsBar key={t.id} label={`${t.name} × ${t.attempted}`} pct={t.accuracy} color={CAMPUS.orange} />)}
          </div>
        </div>
      )}
      {hasLanguages && (
        <div>
          <p className="text-[10.5px] font-mono tracking-wide mb-2.5" style={{ color: CAMPUS.inkFaint }}>LANGUAGES</p>
          <div className="flex flex-wrap gap-1.5">
            {languageEntries.map(([lang, count]) => (
              <CampusChip key={lang} color={CAMPUS.cyan}>{lang} × {count}</CampusChip>
            ))}
          </div>
        </div>
      )}
    </CampusCard>
  );
}

export function ProfileTab({ userData, totalCoins, membership, institution, isInstAdmin, staffScope }) {
  const { user, updateProfile } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const uid = userData?.uid;
  const institutionId = institution?.id;

  useEffect(() => {
    if (!uid || !institutionId) return;
    let cancelled = false;
    fetchProfileAnalytics(uid, institutionId, userData?.score || 0)
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { console.error("[CampusProfile] analytics failed", e); if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [uid, institutionId, userData?.score]);

  const loading = !data && !error;

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please choose an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Image must be under 2MB."); return; }
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const resized = await resizeAvatarImage(file);
      const sRef = storageRef(storage, `avatars/${user.uid}/avatar.jpg`);
      await uploadBytes(sRef, resized);
      const photoURL = await getDownloadURL(sRef);
      await updateProfile({ photoURL });
    } catch (err) {
      console.error(err);
      setAvatarError("Upload failed - try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <motion.div variants={slideUp} className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold overflow-hidden"
            style={{ background: CAMPUS.goldTint, color: CAMPUS.gold }}>
            {userData?.photoURL
              ? <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
              : (userData?.displayName || "?").slice(0, 2).toUpperCase()}
          </div>
          <label title="Change photo" className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: CAMPUS.teal, color: "#fff", border: `2px solid ${CAMPUS.paper}` }}>
            {avatarUploading ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
            <input type="file" accept="image/*" className="hidden" disabled={avatarUploading} onChange={handleAvatarFile} />
          </label>
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold truncate" style={{ color: CAMPUS.ink }}>{userData?.displayName || "Your Profile"}</h2>
          <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>@{userData?.handle || "-"}</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 flex-wrap">
            <CampusChip color={CAMPUS.teal}>
              {isInstAdmin ? "INSTITUTION ADMIN" : staffScope ? (ROLE_CATALOG[staffScope.role]?.label || "STAFF").toUpperCase() : "STUDENT"}
            </CampusChip>
            {userData?.tier && (
              <CampusChip icon={Medal} color={userData.tier.color}>{userData.tier.name}</CampusChip>
            )}
          </span>
          {avatarError && <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.bad }}>{avatarError}</p>}
        </div>
      </motion.div>

      <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <CampusStat label="Score" value={userData?.score ?? 0} color={CAMPUS.purple}
          hint="Your permanent academic performance score. Never decreases and is never spent - this is what leaderboards and rankings are based on." />
        <CampusStat label="XP" value={userData?.xp ?? 0} color={CAMPUS.teal}
          hint="Spendable reward points earned from learning activities. Convert XP to Coins in the Wallet - this can go down." />
        <CampusStat label="Coins" value={totalCoins ?? 0} color={CAMPUS.gold}
          hint="Your real wallet balance. Coins can be withdrawn as INR from the Wallet page." />
        <CampusStat label="Year" value={membership?.year || "-"} />
        <CampusStat label="Section" value={membership?.section || "-"} />
      </motion.div>

      {error ? (
        <motion.div variants={slideUp} className="mb-6">
          <CampusEmptyState icon={Trophy} color={CAMPUS.bad} title="Couldn't load your analytics"
            description="Check your connection and reopen this tab - your Score/XP/Coins above are unaffected." />
        </motion.div>
      ) : (
        <>
          <motion.div variants={slideUp} className="grid sm:grid-cols-2 gap-3 mb-6">
            <StreakRingCard streak={userData?.streak ?? 0} bestStreak={data?.bestStreak ?? 0} />
            <InstitutionRankCard standing={data?.standing || { rank: 0, total: 0, percentile: null }}
              institutionName={institution?.name} loading={loading} />
          </motion.div>

          <motion.div variants={slideUp} className="grid lg:grid-cols-2 gap-3 mb-6 items-start">
            <SolvedGauge dsa={data?.dsa || {}} loading={loading} />
            <ContestPerformanceChart history={data?.contestHistory || []} loading={loading} />
          </motion.div>

          <motion.div variants={slideUp} className="mb-6">
            <CampusActivityHeatmap dates={data?.submissionDates} loading={loading} />
          </motion.div>

          <motion.div variants={slideUp} className="grid lg:grid-cols-2 gap-3 mb-6 items-start">
            <SkillsBreakdown dsa={data?.dsa || { topicBreakdown: [], languageUsage: {} }} aptitude={data?.aptitude || { topics: [] }} loading={loading} />
            <RecentActivityCard items={data?.recentActivity || []} loading={loading} />
          </motion.div>
        </>
      )}

      <motion.div variants={slideUp}>
        <CampusCard className="px-5">
          <ProfileRow icon={Building2} label="Institution" value={institution?.name} />
          <ProfileRow icon={Hash} label="Roll number" value={membership?.rollNumber} />
          <ProfileRow icon={GraduationCap} label="Department" value={membership?.department} />
          <ProfileRow icon={Mail} label="Contact email" value={userData?.contactEmail} />
          <ProfileRow icon={Phone} label="Phone" value={membership?.phone} />
        </CampusCard>
      </motion.div>
    </motion.div>
  );
}
