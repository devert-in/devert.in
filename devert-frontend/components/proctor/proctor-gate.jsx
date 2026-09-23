"use client";

// Pre-attempt gate for an invigilated contest. Exists for three reasons, in
// descending order of how much trouble skipping it causes:
//
// 1. Consent. A webcam frame of a student's face is personal data, and in India
//    the DPDP Act 2023 requires notice of what is collected, why, and for how
//    long, before collection - not buried in a policy page. Nothing starts
//    until this screen is acknowledged, and the acknowledgement is logged.
//
// 2. The fullscreen gesture. requestFullscreen() only resolves from a real user
//    gesture, so there has to be a button the student presses. A useEffect that
//    tries to go fullscreen on mount silently fails in every browser.
//
// 3. A device check the student can act on. Finding out the camera is blocked
//    should happen here, with the timer not yet running - not at minute 3 of a
//    60-minute paper.

import { useState, useSyncExternalStore } from "react";
import { Camera, Maximize2, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import { proctoringSupport } from "@/lib/proctoring";

// Capability detection is a browser-only read that must not happen during
// render (the static build would disagree with the client on hydration) and must
// not happen in an effect either - this project's React lint rules treat
// setState in an effect body as an error, and rightly so. useSyncExternalStore
// is the shape that fits: a server snapshot of null, a client snapshot read once
// and cached, and no subscription because secure-context and API availability
// cannot change within a page's lifetime.
let cachedSupport = null;
function readSupport() {
  if (!cachedSupport) cachedSupport = proctoringSupport();
  return cachedSupport;
}
// Stable identities - a new function per render would resubscribe every time.
const subscribeNever = () => () => {};
const serverSnapshot = () => null;

function Rule({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon size={13} className="flex-shrink-0 mt-0.5" style={{ color: "rgba(0,255,255,0.55)" }} />
      <span className="font-mono text-[11.5px] text-white/55 leading-relaxed">{children}</span>
    </li>
  );
}

export function ProctorGate({
  contestTitle,
  rollNumber,
  snapshotSeconds,
  requireFullscreen,
  retainFrames,
  videoRef,
  cameraState,
  cameraError,
  onBegin,
  onCancel,
}) {
  const support = useSyncExternalStore(subscribeNever, readSupport, serverSnapshot);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const everyMinutes = Math.round((snapshotSeconds || 300) / 60);

  const handleBegin = async () => {
    setStarting(true);
    const ok = await onBegin();
    if (!ok) setStarting(false);
  };

  if (support && !support.ok) {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <div className="terminal-window">
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">proctoring unavailable</span>
          </div>
          <div className="p-6">
            <AlertTriangle size={22} className="mb-3" style={{ color: "#FF5050" }} />
            <h1 className="font-sans text-lg font-bold text-white mb-2">This device cannot be invigilated</h1>
            <p className="font-mono text-[11.5px] text-white/50 leading-relaxed mb-5">{support.message}</p>
            <button onClick={onCancel}
              className="font-mono text-[11px] text-white/40 border border-white/12 px-4 py-2 rounded-lg hover:text-white/70 transition-colors">
              back to contest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">invigilated session</span>
          <span className="ml-auto font-mono text-[10px]" style={{ color: "rgba(0,255,65,0.6)" }}>
            {rollNumber}
          </span>
        </div>

        <div className="p-6">
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "rgba(0,255,65,0.55)" }}>
            // PROCTORING REQUIRED
          </p>
          <h1 className="font-sans text-xl font-bold text-white leading-tight mb-1">{contestTitle}</h1>
          <p className="font-mono text-[11px] text-white/35 mb-6">
            Read this before you start. The timer begins when you press start.
          </p>

          {/* Live preview before committing - lets them frame themselves and
              confirm the camera actually works while nothing is at stake. */}
          <div className="relative rounded-lg overflow-hidden mb-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <video ref={videoRef} muted playsInline
              className="w-full h-44 object-cover"
              style={{ transform: "scaleX(-1)", opacity: cameraState === "live" ? 1 : 0.25 }} />
            {cameraState !== "live" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                {cameraState === "starting" ? (
                  <Loader2 size={18} className="animate-spin text-white/40" />
                ) : (
                  <Camera size={18} className="text-white/30" />
                )}
                <span className="font-mono text-[10px] text-white/35">
                  {cameraState === "starting" ? "requesting camera..." : "camera preview appears here"}
                </span>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="font-mono text-[10.5px] leading-relaxed mb-4 px-3 py-2.5 rounded-lg"
              style={{ color: "#FF9A9A", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
              {cameraError}
            </p>
          )}

          <ul className="space-y-2.5 mb-5">
            <Rule icon={Camera}>
              Your camera stays on for the whole attempt and your own video is shown to you at all
              times. A still photo is captured every {everyMinutes} minute{everyMinutes === 1 ? "" : "s"} and
              filed against roll number <span className="text-white/75">{rollNumber}</span>.
              {retainFrames
                ? " Each photo is kept for the invigilator's record."
                : " Each new photo replaces the previous one, so only the most recent is kept."}
            </Rule>
            {requireFullscreen && (
              <Rule icon={Maximize2}>
                The contest runs in fullscreen. If you leave fullscreen the questions are hidden
                until you return, and the exit is recorded.
              </Rule>
            )}
            <Rule icon={ShieldAlert}>
              Leaving this tab or window is detected and recorded with a timestamp. You will be
              warned each time, and the invigilator sees the full list.
            </Rule>
            <Rule icon={AlertTriangle}>
              No audio is recorded and your screen is not captured. Photos are visible only to your
              institution&apos;s invigilators, never to other students.
            </Rule>
          </ul>

          <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#00FF41]" />
            <span className="font-mono text-[11px] text-white/55 leading-relaxed">
              I consent to my camera being used as described for the duration of this contest.
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={onCancel} disabled={starting}
              className="font-mono text-[11px] text-white/35 border border-white/12 px-4 py-2.5 rounded-lg hover:text-white/70 transition-colors disabled:opacity-40">
              cancel
            </button>
            <button onClick={handleBegin} disabled={!agreed || starting || !support}
              className="flex-1 font-mono text-[11px] py-2.5 rounded-lg transition-colors disabled:opacity-35"
              style={{
                color: "#00FF41",
                border: "1px solid rgba(0,255,65,0.35)",
                background: "rgba(0,255,65,0.05)",
              }}>
              {starting ? "starting session..." : "[ START_INVIGILATED_ATTEMPT ]"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
