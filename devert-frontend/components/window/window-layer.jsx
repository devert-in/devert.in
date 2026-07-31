"use client";

// ============================================================================
// EXPERIMENTAL / NOT MOUNTED
//
// The Builder's OS window manager. Core DeVert no longer mounts this - see the
// comment in app/layout.jsx for why the windowed paradigm was removed as the
// default interaction model (every dock destination already had a working
// standalone route, and the window layer added a window-management mental model
// on top of a product still establishing its basics).
//
// The code is kept, intact and dependency-free from the rest of the app, so a
// specialised surface that genuinely benefits from panes - an AI workspace, a
// multi-file editor, a visual workflow editor, DevTools - can mount
// WindowManagerProvider + WindowLayer around ITSELF without reintroducing
// windows platform-wide.
//
// If you are here to re-enable it: mount the provider and the layer inside that
// one feature's subtree, not in app/layout.jsx.
// ============================================================================

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
