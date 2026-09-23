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

import { useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { Activity, Swords, Code2, Zap, Radio, Target, Tv2, Flame, GripHorizontal, X } from "lucide-react";
import { useWindowManager } from "@/context/WindowManagerContext";
import { WINDOW_REGISTRY, DOCK_RESERVED_PX } from "@/context/window-registry";
import { useDeviceTier } from "@/lib/use-device-tier";
import { WindowControls } from "./window-controls";
import { IsWindowedProvider } from "./is-windowed";

const ICONS = { Activity, Swords, Code2, Zap, Radio, Target, Tv2, Flame };
const MIN_W = 360;
const MIN_H = 280;
const MOVE_ANIM = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

function fullscreenRect() {
  if (typeof window === "undefined") return { x: 0, y: 0, w: 1200, h: 800 };
  return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
}

const RESIZE_EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function handleStyle(edge, size) {
  const half = size / 2;
  const cursors = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
  const base = { position: "absolute", zIndex: 2, cursor: cursors[edge] };
  switch (edge) {
    case "n": return { ...base, top: -half, left: size, right: size, height: size };
    case "s": return { ...base, bottom: -half, left: size, right: size, height: size };
    case "e": return { ...base, right: -half, top: size, bottom: size, width: size };
    case "w": return { ...base, left: -half, top: size, bottom: size, width: size };
    case "ne": return { ...base, top: -half, right: -half, width: size * 2, height: size * 2 };
    case "nw": return { ...base, top: -half, left: -half, width: size * 2, height: size * 2 };
    case "se": return { ...base, bottom: -half, right: -half, width: size * 2, height: size * 2 };
    case "sw": return { ...base, bottom: -half, left: -half, width: size * 2, height: size * 2 };
    default: return base;
  }
}

// One tab pill in the header strip - icon + short label + its own close
// button, browser/VS-Code style. Closing a background tab never requires
// switching to it first.
function TabPill({ appId, active, onSelect, onClose }) {
  const cfg = WINDOW_REGISTRY[appId];
  if (!cfg) return null;
  const Icon = ICONS[cfg.icon];
  const shortLabel = cfg.title.split(" - ")[0];
  return (
    <button
      type="button"
      data-window-control
      onClick={onSelect}
      className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md flex-shrink-0 max-w-[140px] transition-colors"
      style={{
        background: active ? `${cfg.accent}14` : "transparent",
        border: active ? `1px solid ${cfg.accent}30` : "1px solid transparent",
      }}
    >
      {Icon && <Icon size={11} style={{ color: active ? cfg.accent : "rgba(255,255,255,0.35)" }} className="flex-shrink-0" />}
      <span
        className="font-mono text-[10px] truncate"
        style={{ color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)" }}
      >
        {shortLabel}
      </span>
      <span
        role="button"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0"
      >
        <X size={10} />
      </span>
    </button>
  );
}

export function Window({ children }) {
  const {
    tabs, activeTabId, minimized, maximized, pos, size,
    focus, close, minimize, toggleMaximize, move, resize, getDockIconRect,
  } = useWindowManager();
  const activeCfg = WINDOW_REGISTRY[activeTabId];
  const tier = useDeviceTier();

  // These motion values ARE the frame's on-screen rect - set directly by the
  // pointer handlers below and by the imperative animate() calls (maximize/
  // restore, minimize/restore-to-dock), never by per-pixel React state. That's
  // the whole performance fix: framer-motion writes straight to the DOM, so
  // dragging/resizing the frame never re-renders the navbar or anything else.
  const x = useMotionValue(pos.x);
  const y = useMotionValue(pos.y);
  const w = useMotionValue(size.w);
  const h = useMotionValue(size.h);

  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  // True while a gesture or an imperative animation owns x/y/w/h - the resync
  // effect below must never fight either of those.
  const interactingRef = useRef(false);
  const prevMinimized = useRef(minimized);
  const prevMaximized = useRef(maximized);

  // Picks up externally-caused changes to pos/size (a MOVE/RESIZE this same
  // frame committed on a previous gesture's pointerup, etc).
  useEffect(() => {
    if (interactingRef.current || maximized) return;
    x.set(pos.x);
    y.set(pos.y);
    w.set(size.w);
    h.set(size.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, size.w, size.h, maximized]);

  // Maximize <-> restore: animate the same 4 motion values instead of an
  // instant CSS-class snap.
  useEffect(() => {
    if (prevMaximized.current === maximized) return;
    prevMaximized.current = maximized;
    interactingRef.current = true;
    const target = maximized ? fullscreenRect() : { x: pos.x, y: pos.y, w: size.w, h: size.h };
    const controls = [
      animate(x, target.x, MOVE_ANIM),
      animate(y, target.y, MOVE_ANIM),
      animate(w, target.w, MOVE_ANIM),
      animate(h, target.h, { ...MOVE_ANIM, onComplete: () => { interactingRef.current = false; } }),
    ];
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maximized]);

  // Minimize -> fly toward the active tab's dock icon. Restore -> fly back.
  useEffect(() => {
    const was = prevMinimized.current;
    prevMinimized.current = minimized;
    if (was === minimized) return;
    // Fullscreen "apps" on mobile have no meaningful dock-icon target to fly
    // toward - just let the inner shell's plain fade (below) handle it.
    if (tier === "mobile") return;
    const iconRect = getDockIconRect?.(activeTabId);
    if (!iconRect) return;
    interactingRef.current = true;
    const iconTarget = {
      x: iconRect.left + iconRect.width / 2 - 14,
      y: iconRect.top + iconRect.height / 2 - 14,
      w: 28, h: 28,
    };
    const floatingTarget = maximized ? fullscreenRect() : { x: pos.x, y: pos.y, w: size.w, h: size.h };
    const target = minimized ? iconTarget : floatingTarget;
    const controls = [
      animate(x, target.x, MOVE_ANIM),
      animate(y, target.y, MOVE_ANIM),
      animate(w, target.w, MOVE_ANIM),
      animate(h, target.h, { ...MOVE_ANIM, onComplete: () => { interactingRef.current = false; } }),
    ];
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimized]);

  const onHeaderPointerDown = useCallback(
    (e) => {
      if (maximized) return;
      if (e.target.closest("[data-window-control]")) return;
      interactingRef.current = true;
      dragRef.current = { startX: e.clientX, startY: e.clientY, originX: x.get(), originY: y.get() };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [maximized, x, y],
  );

  const onHeaderPointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.originX + (e.clientX - d.startX);
      const ny = d.originY + (e.clientY - d.startY);
      const curW = w.get();
      const curH = h.get();
      const maxX = window.innerWidth - 80;
      const maxY = Math.max(24, window.innerHeight - DOCK_RESERVED_PX - curH);
      x.set(Math.min(Math.max(nx, -(curW - 120)), maxX));
      y.set(Math.min(Math.max(ny, 0), maxY));
    },
    [x, y, w, h],
  );

  const onHeaderPointerUp = useCallback(
    (e) => {
      dragRef.current = null;
      interactingRef.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      move({ x: x.get(), y: y.get() });
    },
    [move, x, y],
  );

  // Resize handles - same Pointer Event pattern as the header drag, targeting
  // w/h (and, for top/left edges, x/y too so the opposite edge stays put).
  // Size is clamped FIRST, then the position delta is derived from the
  // clamped size (not the raw pointer delta) - otherwise the frame drifts
  // once the min-size clamp engages.
  const onResizePointerDown = useCallback(
    (edge) => (e) => {
      if (maximized) return;
      e.stopPropagation();
      interactingRef.current = true;
      resizeRef.current = {
        edge, startX: e.clientX, startY: e.clientY,
        originX: x.get(), originY: y.get(), originW: w.get(), originH: h.get(),
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [maximized, x, y, w, h],
  );

  const onResizePointerMove = useCallback(
    (e) => {
      const r = resizeRef.current;
      if (!r) return;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      const maxW = window.innerWidth - r.originX - 8;
      const maxH = window.innerHeight - DOCK_RESERVED_PX - r.originY;

      let nx = r.originX, ny = r.originY, nw = r.originW, nh = r.originH;

      if (r.edge.includes("e")) nw = Math.min(Math.max(r.originW + dx, MIN_W), maxW);
      if (r.edge.includes("s")) nh = Math.min(Math.max(r.originH + dy, MIN_H), maxH);
      if (r.edge.includes("w")) {
        nw = Math.min(Math.max(r.originW - dx, MIN_W), r.originX + r.originW - 24);
        nx = r.originX + (r.originW - nw);
      }
      if (r.edge.includes("n")) {
        nh = Math.min(Math.max(r.originH - dy, MIN_H), r.originY + r.originH - 24);
        ny = r.originY + (r.originH - nh);
      }

      x.set(nx); y.set(ny); w.set(nw); h.set(nh);
    },
    [x, y, w, h],
  );

  const onResizePointerUp = useCallback(
    (e) => {
      resizeRef.current = null;
      interactingRef.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      resize({ x: x.get(), y: y.get() }, { w: w.get(), h: h.get() });
    },
    [resize, x, y, w, h],
  );

  if (tabs.length === 0) return null;

  // Touch has no hover cursor to hint draggability/resizability, so tablet
  // gets a visible grip affordance and bigger resize hit-targets; desktop
  // relies on the cursor: grab/resize CSS cursors already set below.
  const handleSize = tier === "tablet" ? 16 : 8;

  return (
    <motion.div
      className={`window-frame ${maximized ? "window-frame--full" : "window-frame--floating"}`}
      style={{
        top: 0, left: 0, x, y, width: w, height: h,
        zIndex: 30,
        pointerEvents: minimized ? "none" : undefined,
      }}
      aria-hidden={minimized}
    >
      {/* Visual chrome + open/close/minimize fade - fills the shell exactly,
          so this scale/opacity animation never has to fight the shell's own
          position/size, which now live on the outer motion.div above. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={
          minimized
            ? { opacity: 0, scale: 0.9, transitionEnd: { display: "none" } }
            : { opacity: 1, scale: 1, display: "flex" }
        }
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        inert={minimized || undefined}
        className="terminal-window w-full h-full flex flex-col"
        style={{
          background: "#070707",
          borderRadius: maximized ? 0 : undefined,
          boxShadow: `0 0 0 1px ${activeCfg?.accent || "#00FFFF"}33, 0 20px 60px rgba(0,0,0,0.65), 0 0 40px ${activeCfg?.accent || "#00FFFF"}22`,
        }}
      >
        <div
          className={`terminal-header flex-shrink-0 select-none relative gap-1 ${maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
        >
          <WindowControls
            maximized={maximized}
            onClose={() => close(activeTabId)}
            onMinimize={() => minimize()}
            onToggleMaximize={() => toggleMaximize()}
          />
          <div className="flex items-center gap-1 ml-2 min-w-0 overflow-x-auto">
            {tabs.map((id) => (
              <TabPill
                key={id}
                appId={id}
                active={id === activeTabId}
                onSelect={() => focus(id)}
                onClose={() => close(id)}
              />
            ))}
          </div>
          {tier === "tablet" && !maximized && (
            <GripHorizontal size={12} className="absolute left-1/2 -translate-x-1/2 text-white/15 pointer-events-none" />
          )}
        </div>
        <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <IsWindowedProvider value={true}>{children}</IsWindowedProvider>
        </div>
      </motion.div>

      {!maximized && tier !== "mobile" && RESIZE_EDGES.map((edge) => (
        <div key={edge} data-window-control data-resize-edge={edge}
          style={handleStyle(edge, handleSize)}
          onPointerDown={onResizePointerDown(edge)}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
        />
      ))}
    </motion.div>
  );
}
