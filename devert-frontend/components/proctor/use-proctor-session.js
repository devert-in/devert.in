"use client";

// The proctoring state machine for a live invigilated attempt.
//
// What this can and cannot do, stated plainly because the difference matters
// when you tell students what is being enforced:
//
// - A web page CANNOT prevent a tab or application switch. There is no API for
//   it; Alt+Tab, Cmd+Tab and clicking another window are the operating
//   system's, not the document's. What is possible is *detecting* the switch
//   (visibilitychange / blur), recording it with a timestamp, and confronting
//   the student with it immediately. Genuine prevention needs a native kiosk
//   app or a managed-browser policy, not JavaScript.
//
// - Fullscreen cannot be forced either. requestFullscreen() only resolves from
//   a user gesture, and the spec guarantees Esc always exits. So fullscreen is
//   entered from the student's own click in ProctorGate, and any exit blanks
//   the paper behind a re-enter overlay. The paper is never readable outside
//   fullscreen, which is the enforceable version of "fullscreen required".
//
// Both events are logged either way, so the invigilator's record is complete
// even where the browser's hands are tied.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROCTOR_EVENT, captureFrame, logProctorEvent, proctorHeartbeat,
  startProctorSession, uploadProctorSnapshot,
} from "@/lib/proctoring";

const HEARTBEAT_MS = 60_000;

// A tab switch fires both `visibilitychange` and `blur`, and some window
// managers fire blur twice. Collapsing anything inside this window into one
// violation keeps a single Alt+Tab from being recorded as three.
const DEDUPE_MS = 1200;

export function useProctorSession({
  contestId,
  uid,
  rollNumber,
  displayName,
  enabled,
  snapshotSeconds = 300,
  requireFullscreen = true,
  retainFrames = false,
  onSubmitRequested,
  maxViolations = 0,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const seqRef = useRef(0);
  const lastEventAtRef = useRef({});
  const startedRef = useRef(false);

  const [cameraState, setCameraState] = useState("idle"); // idle|starting|live|denied|lost
  const [cameraError, setCameraError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState({ tabSwitches: 0, fullscreenExits: 0, total: 0 });
  const [warning, setWarning] = useState(null); // { kind, message, count }
  const [snapshotCount, setSnapshotCount] = useState(0);

  // Kept in a ref as well: the event listeners below are registered once and
  // must read the CURRENT tally without being torn down and rebuilt on every
  // violation (rebuilding mid-attempt is how you lose an event).
  const violationsRef = useRef(violations);
  useEffect(() => { violationsRef.current = violations; }, [violations]);

  const onSubmitRef = useRef(onSubmitRequested);
  useEffect(() => { onSubmitRef.current = onSubmitRequested; }, [onSubmitRequested]);

  const record = useCallback(async (type, meta = {}) => {
    const now = Date.now();
    if (now - (lastEventAtRef.current[type] || 0) < DEDUPE_MS) return;
    lastEventAtRef.current[type] = now;

    if (type === PROCTOR_EVENT.TAB_SWITCH || type === PROCTOR_EVENT.FULLSCREEN_EXIT) {
      const key = type === PROCTOR_EVENT.TAB_SWITCH ? "tabSwitches" : "fullscreenExits";
      const next = {
        ...violationsRef.current,
        [key]: violationsRef.current[key] + 1,
        total: violationsRef.current.total + 1,
      };
      violationsRef.current = next;
      setViolations(next);
      setWarning({
        kind: type,
        count: next.total,
        message: type === PROCTOR_EVENT.TAB_SWITCH
          ? "Tab switch detected. You left the contest window."
          : "You exited fullscreen. The contest must stay in fullscreen.",
      });

      // 0 means warn-only, which is the default: silently ending someone's
      // attempt is a decision for the invigilator to opt into, never a
      // side-effect of a flaky laptop or a notification stealing focus.
      if (maxViolations > 0 && next.total >= maxViolations) {
        onSubmitRef.current?.({ reason: "violation_limit", violations: next });
      }
    }

    await logProctorEvent(contestId, uid, type, meta);
  }, [contestId, uid, maxViolations]);

  // ---- camera ----------------------------------------------------------------

  const startCamera = useCallback(async () => {
    if (streamRef.current) return true;
    setCameraState("starting");
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Fires when the OS or another app seizes the camera, or the student
      // yanks a USB webcam - the deterrent is gone at that point, so it is a
      // recorded violation rather than a silent downgrade.
      stream.getVideoTracks().forEach(track => {
        track.addEventListener("ended", () => {
          setCameraState("lost");
          record(PROCTOR_EVENT.CAMERA_LOST, { trackLabel: track.label });
        });
      });

      setCameraState("live");
      return true;
    } catch (err) {
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setCameraState(denied ? "denied" : "lost");
      setCameraError(
        denied
          ? "Camera permission was blocked. This contest cannot be taken without it. Allow camera access in your browser's address bar, then retry."
          : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : `Camera could not be started (${err?.name || "unknown error"}).`
      );
      return false;
    }
  }, [record]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ---- fullscreen ------------------------------------------------------------

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ---- session bootstrap -----------------------------------------------------

  const begin = useCallback(async () => {
    if (startedRef.current) return true;
    const camOk = await startCamera();
    if (!camOk) return false;
    if (requireFullscreen) await enterFullscreen();

    startedRef.current = true;
    await startProctorSession(contestId, uid, { rollNumber, displayName });
    await logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_START, {
      requireFullscreen, snapshotSeconds, retainFrames,
    });
    return true;
  }, [contestId, uid, rollNumber, displayName, requireFullscreen, snapshotSeconds,
      retainFrames, startCamera, enterFullscreen]);

  // ---- capture loop ----------------------------------------------------------

  const capture = useCallback(async () => {
    const blob = await captureFrame(videoRef.current);
    if (!blob) return;
    const seq = seqRef.current + 1;
    seqRef.current = seq;
    try {
      await uploadProctorSnapshot(contestId, uid, blob, { rollNumber, seq, retainFrames });
      setSnapshotCount(seq);
    } catch (err) {
      console.error("[proctor] snapshot upload failed", err);
      // Recorded, not retried: a retry storm on a bad network would compete
      // with the student's own answer submissions for bandwidth.
      await logProctorEvent(contestId, uid, PROCTOR_EVENT.SNAPSHOT_FAILED, {
        seq, error: String(err?.code || err?.message || err).slice(0, 200),
      });
    }
  }, [contestId, uid, rollNumber, retainFrames]);

  useEffect(() => {
    if (!enabled || !startedRef.current || cameraState !== "live") return;

    // One immediate frame establishes who actually sat down - without it a
    // short attempt could finish with no evidence at all - then the specified
    // cadence takes over.
    const kickoff = setTimeout(capture, 2000);
    const iv = setInterval(capture, Math.max(30, snapshotSeconds) * 1000);
    return () => { clearTimeout(kickoff); clearInterval(iv); };
  }, [enabled, cameraState, capture, snapshotSeconds]);

  // ---- heartbeat -------------------------------------------------------------

  useEffect(() => {
    if (!enabled || !startedRef.current) return;
    const iv = setInterval(() => proctorHeartbeat(contestId, uid), HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [enabled, contestId, uid]);

  // ---- focus / visibility / fullscreen listeners ------------------------------

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        record(PROCTOR_EVENT.TAB_SWITCH, { via: "visibilitychange" });
      }
    };
    // Catches switching to another application while this tab stays "visible",
    // which visibilitychange alone does not report.
    const onBlur = () => record(PROCTOR_EVENT.TAB_SWITCH, { via: "blur" });

    const onFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && startedRef.current && requireFullscreen) {
        record(PROCTOR_EVENT.FULLSCREEN_EXIT);
      } else if (active && startedRef.current) {
        logProctorEvent(contestId, uid, PROCTOR_EVENT.FULLSCREEN_ENTER);
      }
    };

    // Best-effort friction against the obvious copy paths. None of this is a
    // security boundary - the paper's real protection is that it is only
    // readable in fullscreen with a camera on the student's face.
    const onContextMenu = e => e.preventDefault();
    const onKeyDown = e => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (k === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k)) || (mod && ["p", "s", "u"].includes(k))) {
        e.preventDefault();
      }
    };
    // Fires on tab close / reload / navigate-away. Recorded so an attempt that
    // vanishes mid-paper is distinguishable from one that simply ended.
    const onBeforeUnload = () => {
      logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_END, { via: "beforeunload" });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, requireFullscreen, record, contestId, uid]);

  useEffect(() => stopCamera, [stopCamera]);

  const finish = useCallback(async () => {
    await logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_END, { via: "submit" });
    stopCamera();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [contestId, uid, stopCamera]);

  return {
    videoRef,
    cameraState,
    cameraError,
    isFullscreen,
    violations,
    warning,
    dismissWarning: () => setWarning(null),
    snapshotCount,
    begin,
    finish,
    retryCamera: startCamera,
    enterFullscreen,
    // The paper must be unreadable whenever the invigilation conditions are not
    // met - this single flag is what the attempt view gates its content on.
    obstructed: enabled && (cameraState !== "live" || (requireFullscreen && !isFullscreen)),
  };
}
