"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { IntroSplash } from "@/components/intro-splash";
import { LandingPage } from "@/components/landing-page";
import { HomeDashboard } from "@/components/home-dashboard";
import { UiEffects } from "@/components/ui-effects";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { hasShownIntro, setHasShownIntro } = useIntro();
  const [showContent, setShowContent] = useState(hasShownIntro);
  const { user, loading } = useAuth();

  const handleIntroComplete = () => {
    setHasShownIntro(true);
    setShowContent(true);
  };

  // Avoid a flash of the marketing page while auth resolves for a
  // returning, already-logged-in member.
  if (loading) {
    return <main className="min-h-screen bg-background text-foreground" />;
  }

  if (user) {
    return <HomeDashboard />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <UiEffects />
      <AnimatePresence mode="wait">
        {!showContent && (
          <IntroSplash onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>
      {showContent && <LandingPage />}
    </main>
  );
}
