"use client";

// The always-on invigilation furniture: the student's own face in the corner, a
// warning banner when a violation is recorded, and a hard blocker whenever the
// invigilation conditions lapse.
//
// The self-view is the actual deterrent. Nobody behaves differently because a
// photo is being filed somewhere they cannot see; people behave differently when
// they can see themselves being watched. So it is deliberately never collapsed
// to an icon, never fully transparent, and pinned above everything.

import { useEffect } from "react";
import { Camera, CameraOff, Maximize2, AlertTriangle, X } from "lucide-react";

// Above the app but below nothing else - the attempt view's own chrome tops out
// well below this, and the obstruction overlay has to cover the paper.
const Z_SELFVIEW = 300;
const Z_WARNING = 310;
const Z_OBSTRUCTION = 320;

export function ProctorSelfView({ videoRef, cameraState, violations, snapshotCount }) {
  const live = cameraState === "live";
  return (
    <div className="fixed bottom-4 right-4 w-[168px] rounded-xl overflow-hidden select-none"
      style={{
        zIndex: Z_SELFVIEW,
        background: "#0a0a0a",
        border: `1px solid ${live ? "rgba(0,255,65,0.35)" : "rgba(255,80,80,0.45)"}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
      }}>
      <div className="relative">
        {/* Mirrored, because an un-mirrored self-view reads as someone else's
            camera and people fight it instead of settling in front of it. */}
        <video ref={videoRef} muted playsInline
          className="w-full h-[126px] object-cover block"
          style={{ transform: "scaleX(-1)", opacity: live ? 1 : 0.2 }} />

        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <CameraOff size={16} style={{ color: "#FF5050" }} />
            <span className="font-mono text-[9px]" style={{ color: "#FF9A9A" }}>camera offline</span>
          </div>
        )}

        {live && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF3B30", animation: "pulse 1.8s infinite" }} />
            <span className="font-mono text-[8.5px] tracking-wider text-white/70">REC</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2 py-1.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[8.5px] text-white/30">
          {snapshotCount} photo{snapshotCount === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[8.5px]"
          style={{ color: violations.total > 0 ? "#FF9500" : "rgba(255,255,255,0.25)" }}>
          {violations.total} flag{violations.total === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function ProctorWarning({ warning, onDismiss }) {
  // Auto-clears so a stack of warnings cannot bury the timer, but stays long
  // enough that it cannot be missed.
  useEffect(() => {
    if (!warning) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [warning, onDismiss]);

  if (!warning) return null;

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center px-4 pt-3" style={{ zIndex: Z_WARNING }}>
      <div className="flex items-start gap-2.5 max-w-md w-full px-4 py-3 rounded-lg"
        style={{
          background: "rgba(30,10,10,0.96)",
          border: "1px solid rgba(255,80,80,0.4)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#FF5050" }} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11.5px] font-semibold mb-0.5" style={{ color: "#FF9A9A" }}>
            {warning.message}
          </p>
          <p className="font-mono text-[10px] text-white/40">
            Recorded and sent to your invigilator. Violation #{warning.count} this attempt.
          </p>
        </div>
        <button onClick={onDismiss} aria-label="Dismiss warning" className="text-white/25 hover:text-white/60 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

/**
 * Covers the paper whenever invigilation has lapsed - camera off, or out of
 * fullscreen. This is the enforceable half of "fullscreen is required": the
 * browser will not stop Esc, but the questions can be made unreadable the
 * instant it is pressed, which removes the reason to press it.
 *
 * Note the timer keeps running underneath. Pausing it would turn every
 * violation into free thinking time.
 */
export function ProctorObstruction({ cameraState, cameraError, isFullscreen, requireFullscreen, onRetryCamera, onEnterFullscreen }) {
  const cameraDown = cameraState !== "live";
  const fsDown = requireFullscreen && !isFullscreen;

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6"
      style={{ zIndex: Z_OBSTRUCTION, background: "rgba(5,5,5,0.97)", backdropFilter: "blur(6px)" }}>
      <div className="max-w-sm text-center">
        {cameraDown ? <CameraOff size={26} className="mx-auto mb-4" style={{ color: "#FF5050" }} />
                    : <Maximize2 size={26} className="mx-auto mb-4" style={{ color: "#FF9500" }} />}

        <h2 className="font-sans text-lg font-bold text-white mb-2">
          {cameraDown ? "Camera required" : "Fullscreen required"}
        </h2>
        <p className="font-mono text-[11.5px] text-white/50 leading-relaxed mb-1">
          {cameraDown
            ? (cameraError || "Your camera stopped. The contest is paused until it is back.")
            : "You left fullscreen. The questions are hidden until you return."}
        </p>
        <p className="font-mono text-[10px] mb-6" style={{ color: "#FF9500" }}>
          Your timer is still running.
        </p>

        {cameraDown ? (
          <button onClick={onRetryCamera}
            className="font-mono text-[11px] px-5 py-2.5 rounded-lg transition-colors"
            style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.35)", background: "rgba(0,255,255,0.06)" }}>
            <Camera size={12} className="inline mr-1.5 -mt-0.5" />
            retry camera
          </button>
        ) : (
          <button onClick={onEnterFullscreen}
            className="font-mono text-[11px] px-5 py-2.5 rounded-lg transition-colors"
            style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.35)", background: "rgba(0,255,65,0.06)" }}>
            <Maximize2 size={12} className="inline mr-1.5 -mt-0.5" />
            return to fullscreen
          </button>
        )}

        {fsDown && cameraDown && (
          <p className="font-mono text-[10px] text-white/25 mt-4">
            Both the camera and fullscreen need to be restored.
          </p>
        )}

        {/* An escape hatch that is deliberately NOT a "skip" button. If the
            browser simply cannot go fullscreen, useProctorSession already stops
            obstructing after a failed retry, so this overlay disappears on its
            own - this text just stops the student thinking they are stuck while
            that happens. Never offer to bypass the CAMERA, which is the actual
            invigilation requirement and is fixable by the student. */}
        {!cameraDown && (
          <p className="font-mono text-[10px] text-white/25 mt-4 max-w-xs mx-auto leading-relaxed">
            If your browser refuses fullscreen, press this once more - the contest
            will continue without it and your invigilator is notified.
          </p>
        )}
      </div>
    </div>
  );
}
