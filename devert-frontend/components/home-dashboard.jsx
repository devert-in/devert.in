"use client";

import { motion } from "framer-motion";
import { WelcomeBanner } from "@/components/welcome-banner";
import { HackathonSpotlight } from "@/components/hackathon-spotlight";
import { Devert100Spotlight } from "@/components/devert100-spotlight";
import { CampusSpotlight } from "@/components/campus-spotlight";
import { LiveOnDevert } from "@/components/live-on-devert";
import { QuickStatsRow } from "@/components/quick-stats-row";
import { NotificationsSummary } from "@/components/notifications-summary";
import { PlatformUpdates } from "@/components/platform-updates";
import { UpcomingContestsCard } from "@/components/upcoming-contests-card";
// RankLadder used to live only on the logged-OUT landing page, so a signed-in
// member saw less of the product than a stranger did. It is mounted here for
// that reason.
//
// Four cards were REMOVED from this dashboard rather than kept:
//   MissionBoard       - rendered one mission as a narrow card stranded in a
//                        full-width row, most of it empty. A board needs
//                        enough entries to look like a board; with one it
//                        reads as a layout bug. /missions still has it.
//   TodayTaskCard      - advertised "DSA Fundamentals, Day 1" at 0% to every
//                        member whether or not they had enrolled. Replaced by
//                        DailyDevTip, which at least says something true.
//   DevertJourneyCard  - "your_devert_today.log": four rows reading Campus /
//                        Events / Shipyard / Pulse with a generic tagline
//                        each. It claimed to be today's and was identical
//                        every day for everyone - the navbar in a box.
//   QuickActionsGrid   - eight tiles, every one a link already in the bottom
//                        dock AND the top bar. A third copy of the sitemap.
import { DailyDevTip } from "@/components/daily-dev-tip";
import { RankLadder } from "@/components/rank-ladder";

export function HomeDashboard() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-4 relative">
      {/* No backdrop here: body::before (globals.css) paints the plate for
          every route. The grid-bg overlay that used to sit here is gone
          too - a wireframe grid on top of circuit tracery is two textures
          competing for the same pixels. */}
      <div className="relative max-w-xl lg:max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// / - command_center.home</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none"
            style={{ fontSize: "clamp(2.2rem,7vw,4rem)" }}>
            DEVERT <span className="text-neon-green">HQ</span>
          </h1>
        </motion.div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start">
          <div className="lg:col-span-2">
            <WelcomeBanner />
            {/* One real, checkable technical fact a day, rotating on the IST
                date so everyone sees the same one.

                It replaced TodayTaskCard, which advertised "DSA Fundamentals -
                Day 1" at 0% to every member regardless of whether they had
                enrolled - prime dashboard space spent telling you that you had
                not started something. */}
            <DailyDevTip />
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
              <Devert100Spotlight />
              <HackathonSpotlight />
              <CampusSpotlight />
            </div>
            <LiveOnDevert />
            <QuickStatsRow />
          </div>
          <div className="lg:col-span-1">
            <UpcomingContestsCard />
            <NotificationsSummary />
            <RankLadder compact />
            <PlatformUpdates />
          </div>
        </div>
      </div>
    </main>
  );
}
