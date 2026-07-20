"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { WINDOW_REGISTRY, DOCK_RESERVED_PX } from "./window-registry";

const WindowManagerContext = createContext(null);

// Shrinks a default size so it can never be taller than the space above the
// dock, then centers it within that same safe area.
function fitAndCenter(size) {
  if (typeof window === "undefined") return { size, pos: { x: 80, y: 80 } };
  const safeH = Math.max(200, window.innerHeight - DOCK_RESERVED_PX - 24);
  const h = Math.min(size.h, safeH);
  const fitted = { w: size.w, h };
  const x = Math.max(24, (window.innerWidth - fitted.w) / 2);
  const maxY = Math.max(24, window.innerHeight - DOCK_RESERVED_PX - fitted.h);
  const y = Math.min(Math.max(24, (window.innerHeight - fitted.h) / 2 - 20), maxY);
  return { size: fitted, pos: { x, y } };
}

// One shared floating frame with an ordered tab list, browser/VS-Code style -
// launching a second app adds a tab to the same frame instead of spawning a
// second frame. Geometry (pos/size/minimized/maximized) belongs to the frame,
// not to any individual tab.
const initialState = {
  tabs: [],
  activeTabId: null,
  launchParamsById: {},
  minimized: false,
  maximized: false,
  pos: { x: 80, y: 80 },
  size: { w: 1040, h: 820 },
};

function reducer(state, action) {
  switch (action.type) {
    // Single entry point for dock clicks - decides new-tab vs switch-to vs
    // restore-from-minimized, so callers never race a stale snapshot.
    case "LAUNCH": {
      const alreadyOpen = state.tabs.includes(action.id);
      if (alreadyOpen) {
        if (state.activeTabId === action.id && !state.minimized) return state; // already frontmost - no-op
        return { ...state, activeTabId: action.id, minimized: false };
      }
      const isFirstTab = state.tabs.length === 0;
      const { size, pos } = isFirstTab ? fitAndCenter(action.size) : { size: state.size, pos: state.pos };
      return {
        ...state,
        tabs: [...state.tabs, action.id],
        launchParamsById: { ...state.launchParamsById, [action.id]: action.params || {} },
        activeTabId: action.id,
        minimized: false,
        pos,
        size,
      };
    }
    case "CLOSE": {
      const idx = state.tabs.indexOf(action.id);
      if (idx === -1) return state;
      const tabs = state.tabs.filter((id) => id !== action.id);
      const launchParamsById = { ...state.launchParamsById };
      delete launchParamsById[action.id];
      let activeTabId = state.activeTabId;
      if (activeTabId === action.id) {
        activeTabId = tabs.length === 0 ? null : tabs[Math.max(0, idx - 1)];
      }
      return { ...state, tabs, launchParamsById, activeTabId };
    }
    case "FOCUS": {
      if (!state.tabs.includes(action.id)) return state;
      if (state.activeTabId === action.id && !state.minimized) return state;
      return { ...state, activeTabId: action.id, minimized: false };
    }
    case "MINIMIZE": {
      if (state.minimized || state.tabs.length === 0) return state;
      return { ...state, minimized: true };
    }
    case "TOGGLE_MAXIMIZE": {
      if (state.tabs.length === 0) return state;
      return { ...state, maximized: !state.maximized };
    }
    case "MOVE": {
      return { ...state, pos: action.pos };
    }
    case "RESIZE": {
      // No-op while maximized - the fullscreen rect is derived, not stored,
      // so a stray resize commit here would corrupt the rect restore-to later.
      if (state.maximized) return state;
      return { ...state, pos: action.pos, size: action.size };
    }
    default:
      return state;
  }
}

export function WindowManagerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const launch = useCallback((id, params) => {
    const cfg = WINDOW_REGISTRY[id];
    if (!cfg) return;
    dispatch({ type: "LAUNCH", id, params, size: cfg.defaultSize });
  }, []);
  const close = useCallback((id) => dispatch({ type: "CLOSE", id }), []);
  const focus = useCallback((id) => dispatch({ type: "FOCUS", id }), []);
  const minimize = useCallback(() => dispatch({ type: "MINIMIZE" }), []);
  const toggleMaximize = useCallback(() => dispatch({ type: "TOGGLE_MAXIMIZE" }), []);
  const move = useCallback((pos) => dispatch({ type: "MOVE", pos }), []);
  const resize = useCallback((pos, size) => dispatch({ type: "RESIZE", pos, size }), []);

  // Plain DOM-element registry for the dock icons, not reducer state - the
  // minimize/restore "genie" animation in Window needs each dock icon's live
  // getBoundingClientRect() at the moment it fires, but reading/writing this
  // must never itself trigger a re-render (it's not something anyone should
  // "subscribe" to).
  const dockIconsRef = useRef(new Map());
  const registerDockIcon = useCallback((id, el) => {
    if (el) dockIconsRef.current.set(id, el);
    else dockIconsRef.current.delete(id);
  }, []);
  const getDockIconRect = useCallback((id) => {
    const el = dockIconsRef.current.get(id);
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const isOpen = useCallback((id) => state.tabs.includes(id), [state.tabs]);
  const isRunning = isOpen;
  const isFocused = useCallback((id) => state.activeTabId === id && !state.minimized, [state.activeTabId, state.minimized]);
  const isMinimized = useCallback(() => state.minimized, [state.minimized]);

  // Address-bar sync only - never drives Next's router, so it can never
  // trigger a route transition/remount. usePathname() won't see these
  // changes; consumers that need "is this app focused" must read WM state.
  //
  // Must NOT run on the very first mount: `activeTabId` starts at its inert
  // initial value (null) on every fresh page load, and firing this then would
  // force-rewrite the URL to "/" on ANY route loaded directly - /login,
  // /profile, /arena visited fresh, etc - even though the real page underneath
  // is correct. Only react to activeTabId actually changing as a result of a
  // genuine launch/focus/close after mount.
  const historySyncedOnce = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!historySyncedOnce.current) { historySyncedOnce.current = true; return; }
    const cfg = state.activeTabId ? WINDOW_REGISTRY[state.activeTabId] : null;
    const target = cfg ? cfg.route : "/";
    if (window.location.pathname === target) return;
    // pushState when opening from/closing to the desktop (nothing <-> something)
    // so Back unwinds one tab at a time; replaceState when just swapping focus
    // between two tabs that are both already open in the same frame.
    const method = state.tabs.length <= 1 ? "pushState" : "replaceState";
    window.history[method]({ wm: true, id: state.activeTabId }, "", target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeTabId]);

  useEffect(() => {
    function onPopState() {
      const path = window.location.pathname;
      const entry = Object.values(WINDOW_REGISTRY).find((a) => a.route === path);
      if (entry) {
        launch(entry.id);
      } else if (path === "/" && state.activeTabId) {
        minimize();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [state.activeTabId, launch, minimize]);

  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      launchParamsById: state.launchParamsById,
      minimized: state.minimized,
      maximized: state.maximized,
      pos: state.pos,
      size: state.size,
      launch, close, focus, minimize, toggleMaximize, move, resize,
      registerDockIcon, getDockIconRect,
      isOpen, isRunning, isFocused, isMinimized,
    }),
    [state, launch, close, focus, minimize, toggleMaximize, move, resize,
      registerDockIcon, getDockIconRect, isOpen, isRunning, isFocused, isMinimized],
  );

  return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used within a WindowManagerProvider");
  return ctx;
}
