"use client";

import { motion } from "framer-motion";
import { WelcomeBanner } from "@/components/welcome-banner";
import { HackathonSpotlight } from "@/components/hackathon-spotlight";
import { CampusSpotlight } from "@/components/campus-spotlight";
import { DevertJourneyCard } from "@/components/devert-journey-card";
import { LiveOnDevert } from "@/components/live-on-devert";
import { QuickStatsRow } from "@/components/quick-stats-row";
import { QuickActionsGrid } from "@/components/quick-actions-grid";
import { NotificationsSummary } from "@/components/notifications-summary";
import { PlatformUpdates } from "@/components/platform-updates";
import { UpcomingContestsCard } from "@/components/upcoming-contests-card";

export function HomeDashboard() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-4 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
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
            <div className="grid sm:grid-cols-2 gap-4">
              <HackathonSpotlight />
              <CampusSpotlight />
            </div>
            <DevertJourneyCard />
            <LiveOnDevert />
            <QuickStatsRow />
            <QuickActionsGrid />
          </div>
          <div className="lg:col-span-1">
            <UpcomingContestsCard />
            <NotificationsSummary />
            <PlatformUpdates />
          </div>
        </div>
      </div>
    </main>
  );
}
