"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, ArrowUpRight, CheckCircle2, Target, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DEVERT100_TOTAL_DAYS, currentDay, hasRunStarted, formatDayDate,
  subscribeToParticipant, progressSummary,
} from "@/lib/devert100";

const GREEN = "#00FF41";

// The homepage entry point to DeVert100, in the same shape as the hackathon
// and campus spotlight cards beside it.
//
// It PERSONALISES rather than advertising at everyone: a participant sees where
// they are and one button back into it, a visitor sees what the thing is. The
// same card doing both is the point - a returning user should never have to
// read the pitch for something they joined three weeks ago.
export function Devert100Spotlight() {
  const { user, loading } = useAuth();
  const [participant, setParticipant] = useState(undefined);

  useEffect(() => {
    if (loading) return undefined;
    if (!user) { setParticipant(null); return undefined; }
    return subscribeToParticipant(user.uid, setParticipant);
  }, [user, loading]);

  const started = hasRunStarted();
  const live = currentDay();
  const joined = !!participant;
  const summary = progressSummary(participant);

  // Render the visitor state while the participant doc is still resolving
  // rather than a spinner: this card sits above the fold on the landing page,
  // and a loading shimmer there is worse than briefly generic copy.
  const resolving = participant === undefined;

  let badge, headline, sub, cta;
  if (!started) {
    badge = { icon: CalendarDays, text: "STARTS " + formatDayDate(1).toUpperCase() };
    headline = "100 Days. 100+ Problems.";
    sub = "A structured DSA run that ends with the year.";
    cta = "SEE THE PLAN";
  } else if (joined && summary.isComplete) {
    badge = { icon: CheckCircle2, text: "100 / 100 COMPLETE" };
    headline = "You finished DeVert100.";
    sub = `${summary.longestStreak}-day best streak. The whole run, done.`;
    cta = "VIEW JOURNEY";
  } else if (joined && !resolving) {
    badge = { icon: Target, text: `DAY ${live} / ${DEVERT100_TOTAL_DAYS}` };
    headline = `${summary.completed} days done, ${summary.percent}% of the run.`;
    sub = summary.currentStreak > 0
      ? `${summary.currentStreak}-day streak. Today's problem is waiting.`
      : "Pick the streak back up today.";
    cta = "CONTINUE JOURNEY";
  } else {
    badge = { icon: Flame, text: `DAY ${live} - LIVE NOW` };
    headline = "100 Days. 100+ Problems.";
    sub = "Stop collecting tutorials. Start solving.";
    cta = "JOIN DEVERT100";
  }

  const BadgeIcon = badge.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.045 }}
      // NO h-full HERE. This element is the flex item, and align-items:stretch
      // only stretches an item whose cross-size is auto. `h-full` sets
      // height:100%, which is not auto, so stretch was skipped - and 100% of a
      // parent with no definite height falls back to content height, which is
      // exactly why the two cards ended up different sizes. The h-full on the
      // Link and the card below is fine: by then the wrapper HAS a resolved
      // height for them to be 100% of.
      className="mb-5 sm:flex-1 sm:min-w-0">
      <Link href="/devert100" className="block group h-full">
        <div className="terminal-window overflow-hidden transition-colors duration-200 h-full flex flex-col"
          style={{ borderColor: `${GREEN}30` }}>
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">devert_100.run</span>
          </div>
          <div className="p-5 sm:p-6 relative overflow-hidden flex-1 flex flex-col">
            <div className="relative flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-1 rounded mb-2.5"
                  style={{ color: GREEN, background: `${GREEN}15`, border: `1px solid ${GREEN}35` }}>
                  <BadgeIcon size={11} /> {badge.text}
                </span>
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
                  DeVert100
                </h2>
                <p className="font-mono text-xs text-white/40 mb-3">{headline}</p>
                <p className="font-mono text-[11px] text-white/55">{sub}</p>

                {joined && !summary.isComplete && (
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden max-w-[220px]"
                    style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.max(summary.percent, 1.5)}%`, background: GREEN }} />
                  </div>
                )}
              </div>
            {/* Pinned to the bottom with mt-auto so this button lands on the
                same line as the neighbouring card's, whatever length the copy
                above it happens to be. Inside the text block it floated to a
                different height per card. */}
            <div className="relative mt-auto pt-5">
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-2.5 rounded"
                style={{ color: "#05080F", background: GREEN }}>
                {cta} <ArrowUpRight size={13} />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
