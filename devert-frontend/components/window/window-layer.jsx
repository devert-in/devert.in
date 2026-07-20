"use client";

import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useWindowManager } from "@/context/WindowManagerContext";
import { WINDOW_REGISTRY } from "@/context/window-registry";
import { Window } from "./window";

// One lazy component per app, created once and reused across renders -
// React.lazy must see a stable reference or it remounts/re-suspends every render.
const lazyCache = {};
function getLazyApp(appId) {
  if (!lazyCache[appId]) {
    const cfg = WINDOW_REGISTRY[appId];
    lazyCache[appId] = lazy(() => cfg.load().then((m) => ({ default: m[cfg.exportName] })));
  }
  return lazyCache[appId];
}

export function WindowLayer() {
  const { tabs, activeTabId, launchParamsById } = useWindowManager();
  const pathname = usePathname();

  // Public portfolios, Campus, and Login are standalone surfaces with no
  // DeVert chrome - a Builder's OS window left open in state (e.g. opened
  // before navigating here, or via a "Login" click from inside a window)
  // must never float over any of them.
  if (pathname.startsWith("/u/") || pathname.startsWith("/campus") || pathname.startsWith("/login")) return null;
  if (tabs.length === 0) return null;

  return (
    <AnimatePresence>
      <Window key="wm-frame">
        {tabs.map((id) => {
          const LazyApp = getLazyApp(id);
          // Every open tab stays mounted, just visually hidden when inactive -
          // switching tabs must preserve each app's own state (a running match
          // timer, in-progress code, scroll position) like backgrounded browser
          // tabs, not remount it from scratch.
          return (
            <div key={id} style={{ display: id === activeTabId ? "contents" : "none" }}>
              <Suspense fallback={null}>
                <LazyApp {...(launchParamsById[id] || {})} />
              </Suspense>
            </div>
          );
        })}
      </Window>
    </AnimatePresence>
  );
}
