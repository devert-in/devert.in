"use client";

import { Hero } from "@/components/hero";
import { MissionVision } from "@/components/mission-vision";
import { PlatformPromises } from "@/components/platform-promises";
import { ShipyardPreview } from "@/components/shipyard-preview";
import { CoreFeatures } from "@/components/core-features";
import { MissionBoard } from "@/components/mission-board";
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

      {/* Section 2 - Mission & Vision */}
      <MissionVision />
      <Divider />

      {/* Section 3 - Platform Promises */}
      <PlatformPromises />
      <Divider />

      {/* Section 4 - This Week in the Shipyard */}
      <ShipyardPreview />
      <Divider />

      {/* Section 5 - Core Features */}
      <CoreFeatures />
      <Divider />

      {/* Section 6 - Mission Board */}
      <MissionBoard />
      <Divider />

      {/* Section 7 - How It Works */}
      <HowItWorks />
      <Divider />

      {/* Section 8 - Today's Grind */}
      <GrindPreview />
      <Divider />

      {/* Section 9 - Platform Stats */}
      <PlatformStats />
      <Divider />

      {/* Section 10 - Benefits by Audience */}
      <BenefitsByAudience />
      <Divider />

      {/* Section 11 - Duo Terminal */}
      <DuoTerminal />
      <Divider />

      {/* Section 12 - Rank Ladder */}
      <RankLadder />
      <Divider />

      {/* Section 13 - FAQ */}
      <FaqSection />
      <Divider />

      {/* Section 14 - Signal CTA */}
      <SignalCta />
    </div>
  );
}
