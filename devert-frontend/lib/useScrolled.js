"use client";

import { useEffect, useState } from "react";

// Has the page scrolled far enough that a sticky bar needs a surface?
//
// This is the whole mechanism behind the adaptive navbar shared by devert.in,
// campus.devert.in and careers.devert.in: at the top of a page the bar is
// transparent so the brushed-metal plate reads unbroken, and the moment content
// starts passing underneath it takes a fill and a hairline so its labels stay
// legible. One hook, three apps - campus and careers reach it through their
// jsconfig `@/*` fallback to ../devert-frontend/*.
//
// SAFE TO SHARE, unlike a component. CLAUDE.md's warning about importing
// devert-frontend JSX into devert-careers is about Tailwind: that app's
// globals.css has no `@source` directive, so utility classes in a foreign
// component compile to nothing. This file has no JSX and no class names, so
// that trap does not apply.
//
// The threshold is 8px rather than 0 so a one-or-two-pixel rubber-band on
// trackpads and iOS does not flicker the surface on and off at rest.
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // passive: this listener never calls preventDefault, and saying so lets the
    // browser keep scrolling on the compositor instead of waiting on JS.
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll(); // a reload restoring mid-page scroll must start solid, not transparent
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
