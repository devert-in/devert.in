"use client";

import { Hero } from "@/components/hero";
import { CampusPreview } from "@/components/campus-preview";
import { MissionVision } from "@/components/mission-vision";
import { PlatformPromises } from "@/components/platform-promises";
import { ShipyardPreview } from "@/components/shipyard-preview";
import { CommunityPreview } from "@/components/community-preview";
import { CoreFeatures } from "@/components/core-features";
import { MissionBoard } from "@/components/mission-board";
import { EventsPreview } from "@/components/events-preview";
import { HowItWorks } from "@/components/how-it-works";
import { GrindPreview } from "@/components/grind-preview";
import { PlatformStats } from "@/components/platform-stats";
import { BenefitsByAudience } from "@/components/benefits-by-audience";
import { DuoTerminal } from "@/components/duo-terminal";
import { RankLadder } from "@/components/rank-ladder";
import { FaqSection } from "@/components/faq-section";
import { SignalCta } from "@/components/signal-cta";

const Divider = () => (
  <div className="max-w-6xl mx-auto px-6">
    <div className="border-t border-white/5" />
  </div>
);

export function LandingPage() {
  return (
    <div className="relative">
      {/* Section 1 - HUD Hero */}
      <Hero />
      <Divider />

      {/* Section 2 - DeVert Campus */}
      <CampusPreview />
      <Divider />

      {/* Section 3 - Mission & Vision */}
      <MissionVision />
      <Divider />

      {/* Section 4 - Platform Promises */}
      <PlatformPromises />
      <Divider />

      {/* Section 5 - This Week in the Shipyard */}
      <ShipyardPreview />
      <Divider />

      {/* Section 5b - Pulse & Communities */}
      <CommunityPreview />
      <Divider />

      {/* Section 6 - Core Features */}
      <CoreFeatures />
      <Divider />

      {/* Section 7 - Mission Board */}
      <MissionBoard />
      <Divider />

      {/* Section 7b - Events */}
      <EventsPreview />
      <Divider />

      {/* Section 8 - How It Works */}
      <HowItWorks />
      <Divider />

      {/* Section 9 - Today's Grind */}
      <GrindPreview />
      <Divider />

      {/* Section 10 - Platform Stats */}
      <PlatformStats />
      <Divider />

      {/* Section 11 - Benefits by Audience */}
      <BenefitsByAudience />
      <Divider />

      {/* Section 12 - Duo Terminal */}
      <DuoTerminal />
      <Divider />

      {/* Section 13 - Rank Ladder */}
      <RankLadder />
      <Divider />

      {/* Section 14 - FAQ */}
      <FaqSection />
      <Divider />

      {/* Section 15 - Signal CTA */}
      <SignalCta />
    </div>
  );
}
