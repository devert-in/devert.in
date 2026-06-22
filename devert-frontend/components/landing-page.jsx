"use client";

import { Hero } from "@/components/hero";
import { ShipyardPreview } from "@/components/shipyard-preview";
import { MissionBoard } from "@/components/mission-board";
import { GrindPreview } from "@/components/grind-preview";
import { DuoTerminal } from "@/components/duo-terminal";
import { RankLadder } from "@/components/rank-ladder";
import { SignalCta } from "@/components/signal-cta";

export function LandingPage() {
  return (
    <div className="relative">
      {/* Section 1 — HUD Hero */}
      <Hero />

      {/* Horizontal rule */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 2 — This Week in the Shipyard */}
      <ShipyardPreview />

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 3 — Mission Board */}
      <MissionBoard />

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 4 — Today's Grind */}
      <GrindPreview />

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 5 — Duo Terminal */}
      <DuoTerminal />

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 6 — Rank Ladder */}
      <RankLadder />

      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Section 7 — Signal CTA */}
      <SignalCta />
    </div>
  );
}
