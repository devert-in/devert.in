"use client";

import { createContext, useContext } from "react";

// True only when rendered inside a <Window> frame (dock-launched instance).
// The standalone route render never provides this, so it defaults to false.
const IsWindowedContext = createContext(false);

export function IsWindowedProvider({ value, children }) {
  return <IsWindowedContext.Provider value={value}>{children}</IsWindowedContext.Provider>;
}

export function useIsWindowed() {
  return useContext(IsWindowedContext);
}

// "fixed" outside a window (true viewport), "absolute" inside one (clipped
// to the window frame, which is itself position:relative + overflow:hidden).
export function usePositionClass() {
  return useIsWindowed() ? "absolute" : "fixed";
}

// Modals in the piloted apps are plain "fixed inset-0 ...". Swap the
// positioning strategy only: fixed (true viewport) when standalone or when
// the window frame itself is fullscreen (maximized/mobile - see window.jsx),
// absolute (clipped to the window frame) when floating.
export function useOverlayClass(base) {
  return `${usePositionClass()} inset-0 ${base}`;
}
