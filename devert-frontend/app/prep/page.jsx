"use client";

// /prep — hub landing. Public (works logged-out for the MRCET redirect
// funnel); stats/missions light up once a session exists. Dynamic content
// (?src=mrcet) is read via useSearchParams inside a Suspense boundary, per
// the static-export constraint — no server rendering involved.

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Target,
  Terminal as TerminalIcon,
  Swords,
  ClipboardList,
  BarChart3,
  ShieldAlert,
  Users,
  Flame,
  Zap,
  Trophy,
  Percent,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PrepShell, StatTile, BracketButton } from "@/components/prep/ui";
import AnnouncementTicker from "@/components/prep/hub/AnnouncementTicker";
import DailyMissionsPanel from "@/components/prep/hub/DailyMissions";
import { getAnnouncements, getProgress, getDailyTasks, getMyAttempts, dateKey } from "@/lib/prep/db";

const MotionLink = motion(Link);

const MRCET_SRC_KEY = "devert-prep-src";
const MRCET_DISMISS_KEY = "devert-prep-mrcet-dismissed";

/* ────────────────────────── MRCET welcome banner ─────────────────────────── */

function MrcetBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("src") === "mrcet";
    if (fromQuery) {
      try {
        window.localStorage.setItem(MRCET_SRC_KEY, "mrcet");
      } catch {
        // localStorage unavailable (private mode) — banner just won't persist
      }
    }
    let persisted = false;
    let dismissed = false;
    try {
      persisted = window.localStorage.getItem(MRCET_SRC_KEY) === "mrcet";
      dismissed = window.localStorage.getItem(MRCET_DISMISS_KEY) === "1";
    } catch {
      // ignore — fromQuery alone still works this visit
    }
    // localStorage is a client-only external system; reading it at render time
    // would mismatch server/client output, so this must stay in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible((fromQuery || persisted) && !dismissed);
  }, [searchParams]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(MRCET_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex items-center gap-3 rounded-lg border border-neon-green/25 bg-neon-green/[0.06] px-4 py-3"
    >
      <GraduationCap size={16} className="text-neon-green flex-shrink-0" />
      <p className="font-mono text-xs text-white/75 flex-1 leading-relaxed">
        Welcome, MRCET students <span aria-hidden="true">🎓</span> — this is your official placements
        practice portal.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 cursor-pointer"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/* ──────────────────────────────── Section cards ──────────────────────────── */

const BASE_CARDS = [
  {
    key: "learn",
    href: "/prep/learn",
    icon: BookOpen,
    label: "LEARN",
    desc: "Weekday lessons with inline quizzes and instant feedback.",
    color: "#00FFFF",
  },
  {
    key: "practice",
    href: "/prep/practice",
    icon: Target,
    label: "PRACTICE",
    desc: "Drill the question bank by category, topic and difficulty.",
    color: "#00FF41",
  },
  {
    key: "code",
    href: "/prep/code",
    icon: TerminalIcon,
    label: "CODE",
    desc: "A live playground — write, run and test code in 5 languages.",
    color: "#FFD700",
  },
  {
    key: "contests",
    href: "/prep/contests",
    icon: Swords,
    label: "CONTESTS",
    desc: "Timed coding contests against the clock and the judge.",
    color: "#FF9500",
  },
  {
    key: "exams",
    href: "/prep/exams",
    icon: ClipboardList,
    label: "EXAMS",
    desc: "Weekend tests — MCQ + coding, autosaved, instantly scored.",
    color: "#FF3B3B",
  },
  {
    key: "analytics",
    href: "/prep/analytics",
    icon: BarChart3,
    label: "ANALYTICS",
    desc: "Your accuracy, streak and exam history — charted.",
    color: "#B794F6",
  },
];

const FACULTY_CARD = {
  key: "faculty",
  href: "/prep/faculty",
  icon: Users,
  label: "FACULTY",
  desc: "Class-group dashboards with drill-down by roll number.",
  color: "#00FF41",
};

const ADMIN_CARD = {
  key: "admin",
  href: "/prep/admin",
  icon: ShieldAlert,
  label: "ADMIN",
  desc: "Question bank, exam builder, roles, and the starter pack.",
  color: "#FFD700",
};

function SectionCard({ card, index }) {
  const Icon = card.icon;
  return (
    <MotionLink
      href={card.href}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.07, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={{ y: -4, borderColor: `${card.color}55` }}
      className="terminal-window p-5 flex flex-col gap-3 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${card.color}14` }}
        >
          <Icon size={16} style={{ color: card.color }} />
        </div>
        <span className="font-mono text-xs tracking-wider" style={{ color: card.color }}>
          {card.label}
        </span>
      </div>
      <p className="font-mono text-[11px] text-white/40 leading-relaxed flex-1">{card.desc}</p>
      <span className="font-mono text-[10px] text-white/25 group-hover:text-white/50 transition-colors">
        [ OPEN → ]
      </span>
    </MotionLink>
  );
}

/* ──────────────────────────────────── Hub ────────────────────────────────── */

function PrepHub() {
  const { user, profile, isStaff, isAdmin, loading: authLoading } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);

  const [progress, setProgress] = useState(null);
  const [progLoading, setProgLoading] = useState(false);
  const [progError, setProgError] = useState("");

  const [dailyItems, setDailyItems] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState("");

  const [todayAttempts, setTodayAttempts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getAnnouncements({ max: 10 });
        if (!cancelled) setAnnouncements(rows || []);
      } catch {
        // announcements are decorative — fail silent, ticker just stays hidden
      } finally {
        if (!cancelled) setAnnLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getDailyTasks(dateKey());
        if (!cancelled) setDailyItems(items || []);
      } catch (err) {
        if (!cancelled) setDailyError(err?.message || "Couldn't load today's missions.");
      } finally {
        if (!cancelled) setDailyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    setProgLoading(true);
    (async () => {
      try {
        const p = await getProgress(user.uid);
        if (!cancelled) setProgress(p);
      } catch (err) {
        if (!cancelled) setProgError(err?.message || "Couldn't load your progress.");
      } finally {
        if (!cancelled) setProgLoading(false);
      }
      try {
        const attempts = await getMyAttempts(user.uid, { max: 60 });
        const today = dateKey();
        if (!cancelled) setTodayAttempts((attempts || []).filter((a) => a.date === today));
      } catch {
        // ticks are a nice-to-have — silent fail keeps the checklist usable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = useMemo(() => {
    const list = [...BASE_CARDS];
    if (isStaff) list.push(FACULTY_CARD);
    if (isAdmin) list.push(ADMIN_CARD);
    return list;
  }, [isStaff, isAdmin]);

  const stats = useMemo(() => {
    const catStats = progress?.categoryStats || {};
    let attempted = 0;
    let correct = 0;
    Object.values(catStats).forEach((c) => {
      attempted += c?.attempted || 0;
      correct += c?.correct || 0;
    });
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    return {
      streak: progress?.streak || 0,
      xp: progress?.xp || 0,
      solved: progress?.totalSolved || 0,
      accuracy,
    };
  }, [progress]);

  return (
    <PrepShell
      kicker="// /prep — placements_prep.sh"
      title="PLACEMENTS"
      accent="PREP"
      subtitle={
        user
          ? `Welcome back, ${profile?.displayName || profile?.email || "operator"}. Keep the streak alive.`
          : "Aptitude, DSA, code, and full-length mock exams — one portal, zero server load."
      }
      actions={
        !user &&
        !authLoading && (
          <BracketButton href="/login" variant="green" size="md">
            LOGIN_TO_TRACK_PROGRESS
          </BracketButton>
        )
      }
    >
      <Suspense fallback={null}>
        <MrcetBanner />
      </Suspense>

      <AnnouncementTicker items={announcements} loading={annLoading} className="mb-8" />

      {user && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatTile
            label="STREAK"
            value={progLoading ? "—" : `${stats.streak}d`}
            sub={stats.streak > 0 ? "don't break the chain" : "solve one today to start"}
            icon={Flame}
            color="#FF6430"
            delay={0.05}
          />
          <StatTile
            label="XP"
            value={progLoading ? "—" : stats.xp.toLocaleString()}
            sub="lifetime experience"
            icon={Zap}
            color="#FFD700"
            delay={0.1}
          />
          <StatTile
            label="SOLVED"
            value={progLoading ? "—" : stats.solved}
            sub="questions correct"
            icon={Trophy}
            color="#00FF41"
            delay={0.15}
          />
          <StatTile
            label="ACCURACY"
            value={progLoading ? "—" : `${stats.accuracy}%`}
            sub="across all categories"
            icon={Percent}
            color="#00FFFF"
            delay={0.2}
          />
        </div>
      )}
      {progError && <p className="font-mono text-xs text-[#FF3B3B] mb-8">{progError}</p>}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-12"
      >
        <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">{"// today's missions"}</p>
        <DailyMissionsPanel
          items={dailyItems}
          loading={dailyLoading}
          error={dailyError}
          uid={user?.uid}
          todayAttempts={todayAttempts}
          className="max-w-2xl"
        />
      </motion.div>

      <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">{"// module map"}</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <SectionCard key={card.key} card={card} index={i} />
        ))}
      </div>
    </PrepShell>
  );
}

export default function PrepPage() {
  return <PrepHub />;
}
