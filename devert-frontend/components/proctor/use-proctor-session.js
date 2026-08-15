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
  // A Mock Reviewer's own sit-through of the paper - every mechanic here
  // (camera, fullscreen, violation detection) runs for real, just written to
  // dryRunProctorSessions/proctor-dryrun instead of the real collections, so
  // it can never blend into or block that same person's later genuine
  // attempt (see firestore.rules' dryRunProctorSessions).
  dryRun = false,
}) {
  // The element the UI is currently showing the student. This CHANGES mid-session:
  // ProctorGate renders one <video>, and the moment the attempt starts the gate
  // unmounts and the HUD's self-view mounts a completely different one.
  const videoElRef = useRef(null);
  // A detached <video> owned by this hook, never rendered. Snapshots are taken
  // from THIS one, never from whatever the UI happens to be showing - see
  // captureVideoEl() for why that separation is the whole fix.
  const captureElRef = useRef(null);
  const streamRef = useRef(null);
  const seqRef = useRef(0);
  const lastEventAtRef = useRef({});
  const startedRef = useRef(false);

  const [cameraState, setCameraState] = useState("idle"); // idle|starting|live|denied|lost
  const [cameraError, setCameraError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Set when the browser refuses fullscreen outright. Suppresses the fullscreen
  // half of `obstructed` for the rest of the session so a browser that CANNOT
  // comply does not cost the student their paper - the refusal is logged for the
  // invigilator instead. Deliberately not reset on a later success: a session
  // that started degraded stays flagged as such in the record.
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false);
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

    await logProctorEvent(contestId, uid, type, meta, dryRun);
  }, [contestId, uid, maxViolations, dryRun]);

  // ---- camera ----------------------------------------------------------------

  // Attaches the live stream to whichever <video> is on screen right now.
  //
  // This is a CALLBACK ref, not a plain ref object, and that is the entire fix
  // for "the camera goes black once the test starts". srcObject used to be
  // assigned once, inside startCamera(), to whatever videoRef.current happened to
  // be at that instant - the GATE's element. The gate then unmounted, the HUD
  // mounted a different <video>, and nothing ever attached the stream to it. The
  // student saw a dead black box for the whole attempt.
  //
  // A callback ref fires on every mount/unmount, so each new element gets the
  // stream as it appears. The srcObject !== check keeps it idempotent - React can
  // invoke a callback ref more than once for the same element.
  const attachVideo = useCallback((el) => {
    videoElRef.current = el;
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      // Belt-and-suspenders, same as captureVideoEl below: autoplay policies
      // gate play() on the element's actual `.muted` IDL PROPERTY at call
      // time, not on the JSX `muted` attribute alone - React does not always
      // have that property synced yet on a raw DOM node a callback ref just
      // received (this fires the instant the element mounts, in the same
      // tick as the srcObject assignment). Relying on the JSX attribute alone
      // was the exact shape of the "self-view goes black once the exam
      // starts" report: cameraState stays "live" (getUserMedia genuinely
      // succeeded), the element mounts and attaches correctly, but a rejected
      // play() - silently swallowed below - never actually paints a frame, so
      // nothing about the visible symptom (a blank box, no error, no
      // "camera offline" state) points back to autoplay at all.
      el.muted = true;
      el.playsInline = true;
      el.srcObject = streamRef.current;
      el.play().catch((err) => console.warn("[proctor] self-view play() failed", err));
    }
  }, []);

  // The element snapshots are read from. Deliberately NOT the one on screen.
  //
  // Same bug, worse consequence: captureFrame() was reading the UI's <video>, so
  // once that element was swapped it had no stream, readyState stayed below 2,
  // and every single capture returned null and was skipped in silence. A whole
  // contest ran with zero photographic evidence while the violation counter
  // climbed, which is the worst possible failure for an invigilation system - it
  // looks like it is working.
  //
  // An offscreen element the hook owns cannot be unmounted by a UI change, so
  // evidence capture no longer depends on what is rendered.
  const captureVideoEl = useCallback(() => {
    if (!streamRef.current) return null;
    if (!captureElRef.current) {
      const el = document.createElement("video");
      el.muted = true;
      el.playsInline = true;
      // Safari refuses to decode frames from a video that was never displayed
      // unless it is explicitly told to play.
      el.setAttribute("playsinline", "");
      captureElRef.current = el;
    }
    const el = captureElRef.current;
    if (el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
    return el;
  }, []);

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
      // Attach to whatever is on screen now, and prime the offscreen capture
      // element so the very first snapshot does not race the stream warming up.
      attachVideo(videoElRef.current);
      captureVideoEl();

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
  }, [record, attachVideo, captureVideoEl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoElRef.current) videoElRef.current.srcObject = null;
    if (captureElRef.current) {
      captureElRef.current.srcObject = null;
      captureElRef.current = null;
    }
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

    if (requireFullscreen) {
      const fsOk = await enterFullscreen();
      if (!fsOk) {
        // The return value used to be discarded, and that cost students their
        // papers. requestFullscreen() can reject for reasons the student cannot
        // do anything about - an embedded webview, a managed-browser policy, the
        // gesture being consumed elsewhere. isFullscreen then stayed false, the
        // obstruction overlay covered the questions, and the only offered action
        // was a button that would fail for exactly the same reason. A permanent
        // lockout, in an exam, caused by us.
        //
        // Invigilation must never hold the exam hostage. Record it loudly - the
        // invigilator sees FULLSCREEN_UNAVAILABLE against that student and can
        // weigh it - and let them sit the paper.
        setFullscreenUnavailable(true);
        await logProctorEvent(contestId, uid, PROCTOR_EVENT.FULLSCREEN_UNAVAILABLE, {
          reason: "requestFullscreen rejected at session start",
        }, dryRun);
      }
    }

    startedRef.current = true;
    await startProctorSession(contestId, uid, { rollNumber, displayName, dryRun });
    await logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_START, {
      requireFullscreen, snapshotSeconds, retainFrames,
    }, dryRun);
    return true;
  }, [contestId, uid, rollNumber, displayName, requireFullscreen, snapshotSeconds,
      retainFrames, startCamera, enterFullscreen, dryRun]);

  // ---- capture loop ----------------------------------------------------------

  const capture = useCallback(async () => {
    // Offscreen element, never the on-screen one - the UI's <video> is swapped
    // when the gate hands over to the HUD, and reading it there produced null
    // frames for an entire contest.
    const blob = await captureFrame(captureVideoEl());
    if (!blob) return;
    const seq = seqRef.current + 1;
    seqRef.current = seq;
    try {
      await uploadProctorSnapshot(contestId, uid, blob, { rollNumber, seq, retainFrames, dryRun });
      setSnapshotCount(seq);
    } catch (err) {
      console.error("[proctor] snapshot upload failed", err);
      // Recorded, not retried: a retry storm on a bad network would compete
      // with the student's own answer submissions for bandwidth.
      await logProctorEvent(contestId, uid, PROCTOR_EVENT.SNAPSHOT_FAILED, {
        seq, error: String(err?.code || err?.message || err).slice(0, 200),
      }, dryRun);
    }
  }, [contestId, uid, rollNumber, retainFrames, dryRun, captureVideoEl]);

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
    const iv = setInterval(() => proctorHeartbeat(contestId, uid, dryRun), HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [enabled, contestId, uid, dryRun]);

  // ---- focus / visibility / fullscreen listeners ------------------------------

  // Marks the document for the duration of an invigilated attempt, so
  // globals.css can withdraw ContentGuard's Monaco/form-field exemptions for
  // exactly as long as the exam is running and no longer.
  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("proctor-active");
    return () => document.documentElement.classList.remove("proctor-active");
  }, [enabled]);

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
        logProctorEvent(contestId, uid, PROCTOR_EVENT.FULLSCREEN_ENTER, {}, dryRun);
      }
    };

    // Best-effort friction against the obvious copy paths. None of this is a
    // security boundary - the paper's real protection is that it is only
    // readable in fullscreen with a camera on the student's face.
    const onContextMenu = e => e.preventDefault();

    // Clipboard during an exam, with NO exemptions - deliberately stricter than
    // the site-wide ContentGuard.
    //
    // ContentGuard exempts form fields and .monaco-editor, which is right for
    // the rest of the product: a code editor whose clipboard does not work is
    // broken, and the code in it belongs to the user. Inside an invigilated
    // contest that reasoning inverts. Pasting a prepared solution into the
    // answer box or the Monaco editor is precisely the thing being invigilated
    // against, and copying the paper out is how question banks leak.
    //
    // Typing is untouched - only clipboard transfer and select-all are blocked,
    // so students still write their own code and their own answers normally.
    const onClipboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    // Screenshots cannot be prevented from a web page - there is no API for it,
    // and Win+Shift+S / Snipping Tool / a phone camera all live entirely outside
    // the browser. What IS possible is noticing the attempts we can see and
    // making them expensive:
    //
    // - PrintScreen fires a keyup in Chromium on Windows. We cannot stop the
    //   capture (it has already happened by then) but we can overwrite the
    //   clipboard immediately, so a paste yields the placeholder rather than the
    //   paper, and we can record the attempt against the student.
    // - Win+Shift+S does NOT reach the page at all. It does usually steal focus,
    //   which the existing blur handler already records as a tab switch - so
    //   that path is caught, just under a different label.
    const onScreenshotKey = (e) => {
      if (e.key !== "PrintScreen") return;
      navigator.clipboard?.writeText("Screenshots are not permitted during this contest.").catch(() => {});
      record(PROCTOR_EVENT.SCREENSHOT_ATTEMPT, { via: "printscreen" });
    };

    const onKeyDown = e => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.altKey && ["c", "x", "v", "a"].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (k === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k)) || (mod && ["p", "s", "u"].includes(k))) {
        e.preventDefault();
      }
    };
    // Fires on tab close / reload / navigate-away. Recorded so an attempt that
    // vanishes mid-paper is distinguishable from one that simply ended.
    const onBeforeUnload = () => {
      logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_END, { via: "beforeunload" }, dryRun);
    };

    // Capture phase on all of these, so the exam's stricter policy runs before
    // ContentGuard's exemption check and before Monaco's own handlers.
    const cap = { capture: true };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("contextmenu", onContextMenu, cap);
    document.addEventListener("keydown", onKeyDown, cap);
    document.addEventListener("keyup", onScreenshotKey, cap);
    document.addEventListener("copy", onClipboard, cap);
    document.addEventListener("cut", onClipboard, cap);
    document.addEventListener("paste", onClipboard, cap);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("contextmenu", onContextMenu, cap);
      document.removeEventListener("keydown", onKeyDown, cap);
      document.removeEventListener("keyup", onScreenshotKey, cap);
      document.removeEventListener("copy", onClipboard, cap);
      document.removeEventListener("cut", onClipboard, cap);
      document.removeEventListener("paste", onClipboard, cap);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled, requireFullscreen, record, contestId, uid, dryRun]);

  useEffect(() => stopCamera, [stopCamera]);

  const finish = useCallback(async () => {
    await logProctorEvent(contestId, uid, PROCTOR_EVENT.SESSION_END, { via: "submit" }, dryRun);
    stopCamera();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [contestId, uid, stopCamera, dryRun]);

  return {
    // A callback ref, not a ref object. Consumers still write
    // <video ref={proctor.videoRef} />, but every element that mounts now gets
    // the live stream attached - which is what keeps the self-view alive across
    // the gate -> HUD handover.
    videoRef: attachVideo,
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
    // Wrapped rather than passed raw: if the retry ALSO fails, the student is
    // otherwise left pressing a button that can never work. A second refusal
    // downgrades the session instead of trapping them.
    enterFullscreen: async () => {
      const ok = await enterFullscreen();
      if (!ok) {
        setFullscreenUnavailable(true);
        await logProctorEvent(contestId, uid, PROCTOR_EVENT.FULLSCREEN_UNAVAILABLE, {
          reason: "requestFullscreen rejected on retry",
        }, dryRun);
      }
      return ok;
    },
    fullscreenUnavailable,
    // The paper must be unreadable whenever the invigilation conditions are not
    // met - this single flag is what the attempt view gates its content on.
    //
    // fullscreenUnavailable is excluded deliberately: a browser that cannot go
    // fullscreen must not permanently hide the questions. The camera condition
    // has no such escape hatch, because a proctored contest genuinely cannot
    // proceed without one and that failure IS actionable by the student.
    obstructed: enabled && (
      cameraState !== "live"
      || (requireFullscreen && !isFullscreen && !fullscreenUnavailable)
    ),
  };
}
