// One composing fetch for the Campus student Profile tab - lighter than
// lib/studentAnalytics.js's fetchStudentAnalytics (built for the admin
// Student Analytics Dashboard, which also walks Programming/CS Core/Company
// Vault - more reads than a page every student opens routinely should pay
// for). Mirrors lib/campusDashboard.js's own reasoning for existing
// alongside studentAnalytics.js rather than just calling the heavier one.
//
// Every number here traces to a real collection - see the per-function
// comments in lib/studentAnalytics.js, lib/contests.js and
// lib/institutions.js for where each one is actually read from. Nothing is
// invented (no session/rating/badge tracking exists, and this file doesn't
// pretend otherwise).
import { fetchDsaSummary, fetchAptitudeFullBreakdown, fetchRewardTimeline } from "@/lib/studentAnalytics";
import { fetchMyContestHistory } from "@/lib/contests";
import { fetchMyInstitutionStanding } from "@/lib/institutions";
import { fetchSubmissionDatesForUser } from "@/lib/codelab";
import { activityLabel } from "@/lib/campusDashboard";
import { computeLongestStreak } from "@/lib/activityDates";

export async function fetchProfileAnalytics(uid, institutionId, myScore) {
  // Same 371-day lookback as the heatmap itself (a few extra days so the
  // grid's first partial week is fully populated) - one fetch backs both
  // the heatmap grid and the best-streak number below.
  const since = new Date();
  since.setDate(since.getDate() - 371);

  const [dsa, aptitude, standing, contestHistory, submissionDates, rewardTimeline] = await Promise.all([
    fetchDsaSummary(uid),
    fetchAptitudeFullBreakdown(uid),
    fetchMyInstitutionStanding(institutionId, myScore),
    fetchMyContestHistory(institutionId, uid),
    fetchSubmissionDatesForUser(uid, since),
    fetchRewardTimeline(uid),
  ]);

  // Best streak = longest run of consecutive days with a CodeLab submission
  // or an aptitude attempt. users/{uid}.streak (the LIVE counter) now also
  // extends from CS Core/Programming/GATE/Daily Learning/DSA Concepts/SE
  // activity (see lib/rewards.js's bumpStreak), but this historical
  // calculation still only sees the two date sources it has always had -
  // those modules' progress docs don't keep a per-day activity history the
  // way CodeLab submissions and aptitude attempts do. So this can now
  // under-report a student's true best streak relative to the live number;
  // fixing that needs each of those modules to expose its own activity
  // dates the same way, which is real follow-up work, not done here.
  const bestStreak = computeLongestStreak([...submissionDates, ...aptitude.attemptDates]);

  const recentActivity = rewardTimeline.slice(0, 30).map(r => ({
    id: r.id,
    activityType: r.activityType,
    label: activityLabel(r.activityType),
    grantedAt: r.grantedAt,
    xp: r.xp || 0,
    coins: r.coins || 0,
    reversed: r.status === "reversed",
  }));

  return { dsa, aptitude, standing, contestHistory, submissionDates, bestStreak, recentActivity };
}
