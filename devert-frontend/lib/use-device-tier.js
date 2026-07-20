"use client";

import { useEffect, useState } from "react";

const QUERIES = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
};

// "mobile" | "tablet" | "desktop" - breakpoints match navbar.jsx's existing
// lg: (1024px) split and globals.css's existing mobile window-frame override,
// so the window manager's own tiering never disagrees with those.
//
// SSR-safe default of "desktop" pre-hydration: globals.css's
// `@media (max-width: 767px)` rule already forces windows fullscreen on
// mobile regardless of this hook's timing, so a one-frame mismatch before
// hydration settles is harmless - no pointer event can fire in that window.
export function useDeviceTier() {
  const [tier, setTier] = useState("desktop");

  useEffect(() => {
    const mobileMq = window.matchMedia(QUERIES.mobile);
    const tabletMq = window.matchMedia(QUERIES.tablet);
    const update = () => setTier(mobileMq.matches ? "mobile" : tabletMq.matches ? "tablet" : "desktop");
    update();
    mobileMq.addEventListener("change", update);
    tabletMq.addEventListener("change", update);
    return () => {
      mobileMq.removeEventListener("change", update);
      tabletMq.removeEventListener("change", update);
    };
  }, []);

  return tier;
}
