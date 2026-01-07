"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { IntroSplash } from "@/components/intro-splash";
import { MainFeed } from "@/components/main-feed";
import { StackMarquee } from "@/components/stack-marquee";

import { LootBox } from "@/components/loot-box";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { UiEffects } from "@/components/ui-effects";
import { useIntro } from "@/context/IntroContext";

export default function Home() {
  const { hasShownIntro, setHasShownIntro } = useIntro();
  const [showContent, setShowContent] = useState(hasShownIntro);

  const handleIntroComplete = () => {
    setHasShownIntro(true);
    setShowContent(true);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <UiEffects />

      <AnimatePresence mode="wait">
        {!showContent && (
          <IntroSplash onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {showContent && (
        <>
          <MainFeed hasShownIntro={hasShownIntro} />
          <StackMarquee />
          <LootBox />

          <Footer />
        </>
      )}
    </main>
  );
}
