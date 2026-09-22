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

// Space reserved for the floating bottom dock (navbar.jsx) - floating windows
// must never size/position themselves so their bottom edge lands under it,
// or that last slice of content becomes permanently covered (the dock paints
// on top of it; no amount of scrolling inside the window can reach it).
export const DOCK_RESERVED_PX = 110;

// Data-driven registry of "apps" the window manager can launch. Adding a new
// windowed module later is a new entry here, not a rewrite of the manager.
export const WINDOW_REGISTRY = {
  pulse: {
    id: "pulse",
    title: "pulse — community_feed.live",
    route: "/pulse",
    accent: "#00FF41",
    icon: "Activity",
    load: () => import("@/components/pulse/pulse-app"),
    exportName: "PulseApp",
    defaultSize: { w: 720, h: 820 },
  },
  arena: {
    id: "arena",
    title: "arena — the_arena",
    route: "/arena",
    accent: "#00FFFF",
    icon: "Swords",
    load: () => import("@/components/arena/arena-app"),
    exportName: "ArenaApp",
    defaultSize: { w: 1040, h: 820 },
  },
  grind: {
    id: "grind",
    title: "grind — practice.sh",
    route: "/grind",
    accent: "#FF6430",
    icon: "Zap",
    load: () => import("@/components/grind/grind-app"),
    exportName: "GrindApp",
    defaultSize: { w: 1040, h: 820 },
  },
  intel: {
    id: "intel",
    title: "intel — dev_intelligence.feed",
    route: "/intel",
    accent: "#00FFFF",
    icon: "Radio",
    load: () => import("@/components/intel/intel-app"),
    exportName: "IntelApp",
    defaultSize: { w: 1100, h: 820 },
  },
  missions: {
    id: "missions",
    title: "missions — classified.db",
    route: "/missions",
    accent: "#00FFFF",
    icon: "Target",
    load: () => import("@/components/missions/missions-app"),
    exportName: "MissionsApp",
    defaultSize: { w: 1040, h: 820 },
  },
  broadcast: {
    id: "broadcast",
    title: "broadcast — devcast.live",
    route: "/broadcast",
    accent: "#00FFFF",
    icon: "Tv2",
    load: () => import("@/components/broadcast/broadcast-app"),
    exportName: "BroadcastApp",
    defaultSize: { w: 1080, h: 820 },
  },
  hackathons: {
    id: "hackathons",
    title: "hackathons.log",
    route: "/events",
    accent: "#FF6430",
    icon: "Flame",
    load: () => import("@/components/hackathons/hackathons-app"),
    exportName: "HackathonsApp",
    defaultSize: { w: 900, h: 800 },
  },
};

export const WINDOW_APP_IDS = Object.keys(WINDOW_REGISTRY);
