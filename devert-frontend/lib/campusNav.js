import { useEffect, useRef } from "react";

// Fixes the "Back button shows Leave Campus?" bug: every in-campus screen
// that has its own drill-down (Programming's language/topic, Manage's
// tab/studentsView, Classrooms' Year/Dept/Section/student, etc.) previously
// kept that state purely local, with no real browser history entry per
// step - so the FIRST Back press anywhere inside Campus consumed the exit
// guard's one reserved history entry and asked to leave, no matter how many
// screens deep the user actually was.
//
// Rather than rearchitect every module to push a real history entry per
// navigation step (a much larger, separate project - see the class-level
// comment in campus-app.jsx's useCampusExitGuard for why that's deferred),
// this is a depth-keyed registry: any screen that is NOT at its own
// shallowest/root view registers "here's what one step back means for me
// right now" under an explicit depth number reflecting how deep it sits in
// the Campus hierarchy (1 = the top-level tab switch itself, 2 = a tab's own
// internal drill-down, 3 = a nested drill-down one level deeper still, e.g.
// Manage -> Classrooms). The exit guard's popstate handler asks this
// registry "is there anything to step back through right now" BEFORE ever
// showing the Leave Campus dialog - only when the registry is empty (every
// mounted screen is already at its own root) does a Back press genuinely
// mean "leave Campus".
//
// A depth-keyed Map (not a push/pop stack) specifically because sibling
// hooks in the same component (e.g. CampusWorkspace registering both its
// own top-level fallback AND whichever of practice/companyPrep/contests is
// currently active) would otherwise register in whatever order React
// happens to run those effects, which has no reliable relationship to which
// one is actually "deeper" in the UI - depth is asserted explicitly by the
// caller instead of inferred from registration order.
const registry = new Map();

// Reserved for overlay/modal-style UI (currently just the mobile nav
// drawer) that can be open SIMULTANEOUSLY with any per-tab drill-down
// underneath it - unlike the numbered per-tab depths above, which are
// mutually exclusive with each other (only one tab is ever active), an
// overlay is not, so it must never share a depth with anything else or
// registerCampusBack's plain Map.set would silently clobber whichever
// registered second, permanently losing that screen's own Back step
// until re-triggered. Deliberately far above any real tab-depth number
// so it always wins popCampusBack()'s Math.max() and nothing ever needs
// renumbering to stay below it.
export const OVERLAY_BACK_DEPTH = 999;

export function registerCampusBack(depth, onBack) {
  registry.set(depth, onBack);
  return () => { if (registry.get(depth) === onBack) registry.delete(depth); };
}

// Returns true if some registered screen handled the step back (the exit
// guard should NOT show its dialog), false if nothing was registered at all
// (every mounted screen was already at its own root - a real "leave?" moment).
export function popCampusBack() {
  if (registry.size === 0) return false;
  const maxDepth = Math.max(...registry.keys());
  registry.get(maxDepth)();
  return true;
}

// `active` is "am I currently showing a non-root view" - the hook
// registers only while true, and always calls the LATEST onBack (via a ref)
// rather than whatever closure existed when `active` last flipped true, so
// callers don't need onBack to be stable across renders.
export function useCampusBackHandler(depth, active, onBack) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  useEffect(() => {
    if (!active) return;
    return registerCampusBack(depth, () => onBackRef.current());
  }, [depth, active]);
}
