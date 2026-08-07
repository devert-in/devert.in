// Proctoring data layer for invigilated contests.
//
// Two stores, deliberately split:
//
// - Firestore contests/{contestId}/proctorSessions/{uid} holds the session
//   summary (counters, timestamps, roll number, latest snapshot path) plus an
//   append-only `events` subcollection. Counters live on the parent so a
//   reviewer can sort a whole cohort by violation count without reading every
//   event; the event log is what you actually read when a case is disputed.
//
// - Cloud Storage holds the webcam frames. The object path is keyed by UID, NOT
//   by roll number, even though the requirement is "stored with their roll
//   number" - see snapshotPath() for why that is a security requirement rather
//   than a preference. The roll number rides along in the object's custom
//   metadata, on the session doc, and in the reviewer-facing download filename,
//   so every human-facing surface is still roll-number-keyed.
//
// Everything a student writes here is treated as untrusted: the client can be
// tampered with, so firestore.rules only lets counters go UP and never lets a
// session doc or an event be deleted. A missing heartbeat is itself a signal -
// absence of violations is not proof of good behaviour.

import { db, storage, functions } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, increment,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

// Event types. Kept as a frozen map rather than bare strings so a typo in a
// caller fails loudly at import time instead of writing an event nobody queries.
export const PROCTOR_EVENT = Object.freeze({
  SESSION_START:    "session_start",
  CONSENT:          "consent",
  TAB_SWITCH:       "tab_switch",
  WINDOW_BLUR:      "window_blur",
  FULLSCREEN_EXIT:  "fullscreen_exit",
  FULLSCREEN_ENTER: "fullscreen_enter",
  CAMERA_LOST:      "camera_lost",
  CAMERA_RESTORED:  "camera_restored",
  SNAPSHOT:         "snapshot",
  SNAPSHOT_FAILED:  "snapshot_failed",
  SESSION_END:      "session_end",
});

// Which events count as a violation the student is warned about, and which
// counter on the session doc they bump. Events not listed here are recorded in
// the log but are informational (a restored camera is not a violation).
const VIOLATION_COUNTER = {
  [PROCTOR_EVENT.TAB_SWITCH]:      "tabSwitches",
  [PROCTOR_EVENT.FULLSCREEN_EXIT]: "fullscreenExits",
  [PROCTOR_EVENT.CAMERA_LOST]:     "cameraLosses",
};

export function isViolation(type) {
  return Object.prototype.hasOwnProperty.call(VIOLATION_COUNTER, type);
}

// getUserMedia is gated on a secure context - https, or localhost during
// development. It is NOT available on a plain-http LAN address, which is
// exactly how a coordinator on the college network might open this (the same
// constraint contest-share.jsx documents for navigator.clipboard). Checked up
// front so the gate can refuse with a real explanation instead of letting the
// camera prompt silently never appear.
export function proctoringSupport() {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: "insecure_context",
      message:
        "Proctoring needs a secure connection (https). This page is being served over plain http, " +
        "so the browser will not grant camera access. Open the contest over https and try again.",
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      reason: "no_getusermedia",
      message: "This browser cannot share a camera. Use an up-to-date Chrome, Edge, Firefox or Safari.",
    };
  }
  if (!document.documentElement.requestFullscreen) {
    return {
      ok: false,
      reason: "no_fullscreen",
      message: "This browser cannot enter fullscreen, which this contest requires.",
    };
  }
  return { ok: true };
}

// Roll number is mirrored onto users/{uid} for campus students (see
// firestore.rules' campus-fields list), so the value AuthContext already holds
// is the cheap path. The institution student doc is the fallback for an account
// whose mirror has not been backfilled. Never returns empty: an unidentified
// frame is worse than a frame labelled by uid.
export async function resolveRollNumber(uid, userData) {
  const mirrored = (userData?.rollNumber || "").trim();
  if (mirrored) return mirrored;

  const institutionId = userData?.institutionId;
  if (institutionId) {
    try {
      const snap = await getDoc(doc(db, "institutions", institutionId, "students", uid));
      const fromRoster = ((snap.exists() ? snap.data().rollNumber : "") || "").trim();
      if (fromRoster) return fromRoster;
    } catch {
      // Read denied or offline - fall through to the uid form rather than
      // blocking the attempt over a label.
    }
  }
  return `UID-${uid.slice(0, 8)}`;
}

// Storage-safe form of a roll number, for use in filenames and metadata.
// Mirrors lib/institutions.js's rollNumberKey() normalisation (trim +
// uppercase) and then strips anything that would be awkward in an object name.
export function rollNumberSlug(rollNumber) {
  return (rollNumber || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "UNKNOWN";
}

// Object paths are UID-keyed, not roll-number-keyed, and that is not a style
// choice. A Storage rule can prove `request.auth.uid == uid` directly from the
// path, so an owner-write rule is expressible and airtight. It CANNOT prove
// "this caller owns roll number MRCET21CS001" without a cross-service
// firestore.exists(), which storage.rules already documents as unreliable in
// practice (see the institution_branding block). A roll-number path would
// therefore have to be either world-writable or world-readable to be useful -
// and because roll numbers are sequential and guessable, a readable one means
// every student's face is at a URL anyone can construct. UID in the path,
// roll number in metadata and in the reviewer's download filename.
export function snapshotPath(contestId, uid, { seq = null } = {}) {
  const base = `proctor/${contestId}/${uid}`;
  return seq === null ? `${base}/latest.jpg` : `${base}/frames/${String(seq).padStart(4, "0")}.jpg`;
}

export async function startProctorSession(contestId, uid, { rollNumber, displayName }) {
  const ref = doc(db, "contests", contestId, "proctorSessions", uid);
  // merge: a resumed attempt (reload mid-contest) must not reset the counters a
  // reviewer will be looking at, so only the start-of-session facts are set and
  // the tallies are left to accumulate.
  await setDoc(ref, {
    uid,
    rollNumber: rollNumber || "",
    displayName: displayName || "",
    startedAt: serverTimestamp(),
    lastHeartbeatAt: serverTimestamp(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
    screen: typeof window !== "undefined"
      ? { w: window.screen?.width || 0, h: window.screen?.height || 0 }
      : null,
  }, { merge: true });
}

// Appends to the immutable event log and bumps the matching counter in one
// call. The two writes are deliberately NOT batched: if the counter update is
// rejected (rules, offline) the evidence in the log must still land. Losing a
// tally is recoverable by counting events; losing the event is not.
export async function logProctorEvent(contestId, uid, type, meta = {}) {
  const sessionRef = doc(db, "contests", contestId, "proctorSessions", uid);

  try {
    await addDoc(collection(sessionRef, "events"), {
      type,
      at: serverTimestamp(),
      // Client clock too, so a reviewer can spot a machine whose time is wrong
      // or deliberately skewed.
      clientAt: new Date().toISOString(),
      ...meta,
    });
  } catch (err) {
    console.error("[proctor] event log failed", type, err);
  }

  const counter = VIOLATION_COUNTER[type];
  if (!counter) return;

  try {
    await updateDoc(sessionRef, {
      [counter]: increment(1),
      violations: increment(1),
      lastViolationAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[proctor] counter update failed", type, err);
  }
}

export async function proctorHeartbeat(contestId, uid) {
  try {
    await updateDoc(doc(db, "contests", contestId, "proctorSessions", uid), {
      lastHeartbeatAt: serverTimestamp(),
    });
  } catch {
    // A dropped heartbeat is itself the signal a reviewer reads; never surface
    // it to the student mid-attempt.
  }
}

/**
 * Uploads one webcam frame.
 *
 * `retainFrames: false` (the default) writes only latest.jpg, so each capture
 * replaces the previous one exactly as specified. `retainFrames: true` also
 * writes an immutable numbered frame, which is what you want if a result may
 * ever be challenged - one surviving frame from minute 55 says nothing about
 * minute 10, and if the last capture happens to be clean the incriminating one
 * has already been overwritten. A 480px JPEG is ~35KB, so a 60-minute attempt
 * retains under 0.5MB per student.
 */
export async function uploadProctorSnapshot(contestId, uid, blob, {
  rollNumber,
  seq,
  retainFrames = false,
}) {
  const slug = rollNumberSlug(rollNumber);
  const metadata = {
    contentType: "image/jpeg",
    // Reviewer-facing: a download from the console lands as
    // MRCET21CS001-seq0003.jpg rather than an opaque latest.jpg.
    contentDisposition: `inline; filename="${slug}-seq${String(seq).padStart(4, "0")}.jpg"`,
    customMetadata: {
      rollNumber: slug,
      contestId,
      uid,
      seq: String(seq),
      capturedAt: new Date().toISOString(),
    },
  };

  const latestRef = storageRef(storage, snapshotPath(contestId, uid));
  await uploadBytes(latestRef, blob, metadata);

  if (retainFrames) {
    // Best-effort: the rolling `latest` pointer is the contractual artefact, so
    // a failed archive copy must not fail the capture.
    try {
      await uploadBytes(storageRef(storage, snapshotPath(contestId, uid, { seq })), blob, metadata);
    } catch (err) {
      console.error("[proctor] frame archive failed", err);
    }
  }

  let url = "";
  try {
    url = await getDownloadURL(latestRef);
  } catch {
    // Read is reviewer-only by rule, so a student resolving no URL is expected.
  }

  await updateDoc(doc(db, "contests", contestId, "proctorSessions", uid), {
    snapshotCount: increment(1),
    lastSnapshotAt: serverTimestamp(),
    latestSnapshotPath: snapshotPath(contestId, uid),
    ...(url ? { latestSnapshotUrl: url } : {}),
  });

  return { path: snapshotPath(contestId, uid), url };
}

/**
 * Grabs a single downscaled JPEG from a live <video>.
 *
 * Downscaled to 480px on the long edge: a proctoring frame only has to answer
 * "is this the right person, alone, looking at the screen", and a full-res
 * frame is ~10x the bytes for no extra answer. Returns null rather than
 * throwing when the video has no frame yet (camera still warming up), so the
 * caller can simply skip that tick.
 */
export async function captureFrame(videoEl, { maxEdge = 480, quality = 0.72 } = {}) {
  if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return null;

  const scale = Math.min(1, maxEdge / Math.max(videoEl.videoWidth, videoEl.videoHeight));
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, w, h);

  return new Promise(resolve => {
    canvas.toBlob(b => resolve(b), "image/jpeg", quality);
  });
}

// ---------------------------------------------------------------------------
// Invigilator side
// ---------------------------------------------------------------------------

export async function fetchProctorSessions(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "proctorSessions"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Newest first, capped: a long attempt with a flaky camera can produce hundreds
// of events, and a reviewer reads the most recent ones. `max` is deliberately a
// parameter so a disputed case can pull the whole log.
export async function fetchProctorEvents(contestId, uid, max = 200) {
  const snap = await getDocs(query(
    collection(db, "contests", contestId, "proctorSessions", uid, "events"),
    orderBy("at", "desc"),
    limit(max),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Bytes come back base64 through a callable rather than as a URL - see the
// header comment on getProctorFrame in functions/index.js for why. Converted to
// a blob: URL here so it can be dropped straight into an <img src>.
export async function fetchProctorFrame(contestId, uid, seq = null) {
  const call = httpsCallable(functions, "getProctorFrame");
  const res = await call({ contestId, uid, ...(seq === null ? {} : { seq }) });
  const { dataBase64, contentType, rollNumber, capturedAt, sizeBytes } = res.data;

  const bytes = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: contentType || "image/jpeg" });
  return { objectUrl: URL.createObjectURL(blob), rollNumber, capturedAt, sizeBytes };
}

export async function listProctorFrames(contestId, uid) {
  const call = httpsCallable(functions, "listProctorFrames");
  const res = await call({ contestId, uid });
  return res.data?.frames || [];
}

// A session that has stopped reporting is as interesting as one with
// violations - a student who kills JavaScript stops writing heartbeats but also
// stops writing violations, so "quiet" must never render as "clean".
export function heartbeatStatus(session, now = Date.now(), staleMs = 180_000) {
  const beat = session?.lastHeartbeatAt?.toDate?.();
  if (!beat) return { state: "unknown", label: "no heartbeat" };
  const age = now - beat.getTime();
  if (age > staleMs) {
    const mins = Math.round(age / 60000);
    return { state: "stale", label: `silent ${mins}m`, ageMs: age };
  }
  return { state: "live", label: "live", ageMs: age };
}

// Ranks a cohort worst-first so the rows that need a human are at the top.
// Stale-heartbeat sessions outrank a merely-noisy one because a missing report
// is the harder case to explain away.
export function proctorRiskScore(session, now = Date.now()) {
  const hb = heartbeatStatus(session, now);
  const violations = session?.violations || 0;
  const noPhotos = (session?.snapshotCount || 0) === 0;
  return (hb.state === "stale" ? 100 : 0)
    + (hb.state === "unknown" ? 60 : 0)
    + (noPhotos ? 40 : 0)
    + violations * 5;
}
