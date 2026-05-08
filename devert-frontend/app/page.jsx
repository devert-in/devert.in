"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { IntroSplash } from "@/components/intro-splash";
import { LandingPage } from "@/components/landing-page";

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
    <main className="min-h-screen bg-background text-foreground">
      <UiEffects />

      <AnimatePresence mode="wait">
        {!showContent && (
          <IntroSplash onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {showContent && (
        <LandingPage hasShownIntro={hasShownIntro} />
      )}
    </main>
  );
}
