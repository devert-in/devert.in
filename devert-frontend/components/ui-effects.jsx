"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// Landing-page chrome. Currently just the scroll progress bar.
//
// THE CUSTOM CURSOR IS GONE, deliberately. It was a neon ring plus a cyan dot
// that chased the pointer on a spring. Three reasons it is not coming back:
//
//   - It replaced information the OS cursor carries for free. A native cursor
//     changes shape over text, links and inputs; a ring and a dot say the same
//     thing everywhere, so the page got less legible, not more.
//   - It lagged. Spring-following a pointer always trails the real position,
//     which reads as the page being slow even when nothing else is.
//   - It cost a `mousemove` listener that ran on every pixel of movement and
//     set React state each time, re-rendering two spring-animated elements for
//     the entire life of the page.
//
// Removing it took the listener with it, so nothing here reacts to the mouse
// any more.
export function UiEffects() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-neon-cyan origin-left z-50 shadow-[0_0_15px_#00FFFF]"
      style={{ scaleX }}
    />
  );
}
