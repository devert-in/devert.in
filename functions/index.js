/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const fs = require("fs");
const path = require("path");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// ---------------------------------------------------------------------------
// uHandleRouter / contestPreviewRouter / campusPreviewRouter - one per
// crawler-previewable entity type, each fronting its own "/<prefix>/**"
// Hosting rewrite (/u, /contest, /campus). Firebase Hosting rewrites can only
// target a fixed static file OR a Cloud Function - never conditionally by
// header - so the crawler-vs-human branching has to happen here, in code, on
// every single hit. makePreviewRouter() below is the shared shape; only the
// static shell file and the devert-backend preview path differ per entity.
//
// - Known link-preview crawler UA (LinkedIn/Twitter/Facebook/Slack/Discord/
//   Telegram/WhatsApp/Googlebot/etc.): proxy to the matching devert-backend
//   .../preview/{id} endpoint (PortfolioPreviewController/ContestPreview
//   Controller/CampusPreviewController), which reads the public doc
//   server-side and returns real per-entity Open Graph/Twitter meta tags.
//   Hard 2.5s timeout - devert-backend runs on Cloud Run with
//   min-instances=0, so it cold-starts after enough idle time, and most
//   crawlers give up well before that. On any error/timeout, fall back to a
//   generic DeVert-branded response - a crawler should NEVER see a broken
//   preview.
// - Everything else (real browsers, or anyone pasting the raw URL): served
//   the exact same static SPA shell as before any of these Functions
//   existed - a copy of the matching devert-frontend/out/*.html, bundled
//   into functions/static/ by the CI deploy pipeline (see
//   .github/workflows/deploy-prod.yml's "Sync static SPA shells" step). Zero
//   behavior change for the ~99% of traffic that isn't a crawler.
// ---------------------------------------------------------------------------

const CRAWLER_UA_RE = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|Googlebot|Pinterest|redditbot|Applebot|bingbot/i;

const BACKEND_BASE_URL = process.env.DEVERT_BACKEND_URL || "";
const CRAWLER_TIMEOUT_MS = 2500;

// reqPath looks like "/u/somehandle" (or "/contest/abc123/") - Hosting's
// "/<prefix>/**" rewrites pass the full original path through; the entity id
// is always the second path segment regardless of which prefix.
function extractEntityId(reqPath) {
  const parts = reqPath.split("/").filter(Boolean);
  return parts[1] || "";
}

let shellCache = {};
function readStaticShell(fileName) {
  if (shellCache[fileName]) return shellCache[fileName];
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, "static", fileName), "utf8");
  } catch (e) {
    logger.error(`static/${fileName} not found - did the deploy pipeline copy it?`, e);
    html = "<!DOCTYPE html><html><body>DeVert.in</body></html>";
  }
  shellCache[fileName] = html;
  return html;
}

// Shared by every crawler-vs-human preview router (uHandleRouter and its
// siblings below) - only the entity type differs (which static shell to serve
// humans, which devert-backend preview path to proxy crawlers to). See
// uHandleRouter's own original comment block for the full rationale; this is
// that same logic, parameterized instead of copy-pasted per entity type.
function makePreviewRouter({ shellFile, backendPreviewPath, genericFallbackHtml }) {
  return onRequest({ region: "us-central1" }, async (req, res) => {
    // Next.js's client-side router fetches its own internal per-segment
    // cache/RSC payloads (e.g. "/campus/mrcet/__next.campus.$d$slug.__PAGE__.txt")
    // as background requests during a normal Link click - these never exist
    // as real static files (the exporter writes them under a nested
    // directory shape the client's flattened, dot-separated request path
    // doesn't match - a Next 16 static-export quirk), so Hosting's "/<prefix>/**"
    // rewrite sends them here right along with real page hits. Every OTHER
    // branch below happily answers with 200 + a full HTML shell, which is
    // exactly the wrong shape for this: the client router expects a genuine
    // 404 for a cache miss (and recovers by falling back to a normal
    // navigation when it gets one - confirmed directly), not a whole
        // unrelated HTML document, which corrupts the in-flight fetch and
    // silently kills the navigation instead - the actual bug behind "the
    // campus card isn't clickable" in production. A real human or crawler
    // never requests a "__next.*" path directly, so this is safe to 404
    // unconditionally before any of the crawler/shell logic below.
    if (req.path.includes("__next")) {
      res.status(404).send("Not Found");
      return;
    }

    const userAgent = req.get("user-agent") || "";
    const id = extractEntityId(req.path);

    // Explicit no-store on every path this function serves - it never set
    // its own Cache-Control before, which left Firebase's default
    // ("private", no freshness lifetime) in place. That's ambiguous enough
    // that a browser or a mobile carrier's transparent caching proxy can
    // legally reuse an old copy indefinitely, so a real redeploy (like the
    // static-shell resync that fixed a chunk-hash mismatch here earlier)
    // doesn't reach every client - some just keep replaying whatever they
    // cached before the fix shipped. The static shell this serves already
    // only ever references the CURRENT build's hashed asset filenames, so
    // there is nothing here worth caching past this exact deploy.
    res.set("Cache-Control", "no-store");

    if (!CRAWLER_UA_RE.test(userAgent)) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(readStaticShell(shellFile));
      return;
    }

    if (!BACKEND_BASE_URL) {
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(genericFallbackHtml(id));
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CRAWLER_TIMEOUT_MS);
      const upstream = await fetch(`${BACKEND_BASE_URL}${backendPreviewPath(id)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const html = await upstream.text();
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(html);
    } catch (e) {
      logger.warn(`${shellFile}: preview fetch failed/timed out, serving generic fallback`, e);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(genericFallbackHtml(id));
    }
  });
}

exports.uHandleRouter = makePreviewRouter({
  shellFile: "u.html",
  backendPreviewPath: (handle) => `/api/portfolio/preview/${encodeURIComponent(handle)}`,
  genericFallbackHtml: (handle) => {
    const canonicalUrl = `https://devert.in/u/${encodeURIComponent(handle)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<title>DeVert.in - Builder's OS</title>` +
      `<meta property="og:site_name" content="DeVert.in">` +
      `<meta property="og:title" content="DeVert.in - Builder's OS">` +
      `<meta property="og:description" content="A developer portfolio, hosted by DeVert.">` +
      `<meta property="og:image" content="https://devert.in/logo.png">` +
      `<meta property="og:url" content="${canonicalUrl}">` +
      `<meta http-equiv="refresh" content="0;url=${canonicalUrl}"></head>` +
      `<body>Redirecting...</body></html>`;
  },
});

exports.contestPreviewRouter = makePreviewRouter({
  shellFile: "contest.html",
  backendPreviewPath: (id) => `/api/contest/preview/${encodeURIComponent(id)}`,
  genericFallbackHtml: (id) => {
    const canonicalUrl = `https://devert.in/contest/${encodeURIComponent(id)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<title>Contest | DeVert.in</title>` +
      `<meta property="og:site_name" content="DeVert.in">` +
      `<meta property="og:title" content="Contest | DeVert.in">` +
      `<meta property="og:description" content="Compete in a scheduled, ranked contest on DeVert Arena.">` +
      `<meta property="og:image" content="https://devert.in/logo.png">` +
      `<meta property="og:url" content="${canonicalUrl}">` +
      `<meta http-equiv="refresh" content="0;url=${canonicalUrl}"></head>` +
      `<body>Redirecting...</body></html>`;
  },
});

exports.campusPreviewRouter = makePreviewRouter({
  shellFile: "campus.html",
  backendPreviewPath: (slug) => `/api/campus/preview/${encodeURIComponent(slug)}`,
  genericFallbackHtml: (slug) => {
    const canonicalUrl = `https://devert.in/campus/${encodeURIComponent(slug)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<title>DeVert Campus</title>` +
      `<meta property="og:site_name" content="DeVert.in">` +
      `<meta property="og:title" content="DeVert Campus">` +
      `<meta property="og:description" content="Structured learning & placement prep, run by your college.">` +
      `<meta property="og:image" content="https://devert.in/logo.png">` +
      `<meta property="og:url" content="${canonicalUrl}">` +
      `<meta http-equiv="refresh" content="0;url=${canonicalUrl}"></head>` +
      `<body>Redirecting...</body></html>`;
  },
});

exports.pulsePreviewRouter = makePreviewRouter({
  shellFile: "pulse.html",
  backendPreviewPath: (id) => `/api/pulse/preview/${encodeURIComponent(id)}`,
  genericFallbackHtml: (id) => {
    const canonicalUrl = `https://devert.in/pulse/${encodeURIComponent(id)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">` +
      `<title>Pulse | DeVert.in</title>` +
      `<meta property="og:site_name" content="DeVert.in">` +
      `<meta property="og:title" content="Pulse | DeVert.in">` +
      `<meta property="og:description" content="The dev community feed on DeVert.">` +
      `<meta property="og:image" content="https://devert.in/logo.png">` +
      `<meta property="og:url" content="${canonicalUrl}">` +
      `<meta http-equiv="refresh" content="0;url=${canonicalUrl}"></head>` +
      `<body>Redirecting...</body></html>`;
  },
});

// ---------------------------------------------------------------------------
// Proctoring frame access for invigilators.
//
// storage.rules can only express ONE invigilator identity - the platform `admin`
// custom claim - because a Storage rule cannot reliably reach across into
// Firestore to ask "is this caller an admin/HOD/faculty of the institution that
// owns this contest" (see the institution_branding block's note on
// firestore.exists() being unreliable there). But that Firestore question is
// exactly what decides who may look at a student's face. So the check happens
// here, server-side with the Admin SDK, where it is both reliable and cheap, and
// the bucket itself stays locked to admin-claim reads only.
//
// Frames are returned as base64 rather than as signed URLs, deliberately:
//
// - No IAM setup. V4 signed URLs need the runtime service account to hold
//   roles/iam.serviceAccountTokenCreator to call signBlob; getting that wrong
//   fails at runtime, in production, on the one feature nobody can debug
//   casually. Reading bytes needs nothing beyond the bucket access the function
//   already has.
// - No leaked capability. A signed URL is a bearer token in a string - it works
//   for anyone it is forwarded to, for its whole lifetime. This response is
//   scoped to one authenticated invigilator and cannot be replayed.
//
// A proctoring frame is a 480px JPEG (~35KB, ~47KB base64), so one frame per
// call sits comfortably inside the callable response limit. The console fetches
// frames one student at a time, on demand, rather than hydrating a grid of a
// hundred faces nobody asked to see.
// ---------------------------------------------------------------------------

// firebase-functions/https (not /v2/https) to match the onRequest import at the
// top of this file - in v7 the root path IS v2, and mixing the two spellings in
// one file invites someone to "fix" the inconsistency in the wrong direction.
const { onCall, HttpsError } = require("firebase-functions/https");
const admin = require("firebase-admin");

if (admin.apps.length === 0) admin.initializeApp();

// Resolves whether the caller may invigilate `contestId`, using the same
// identity model firestore.rules uses: the platform admin claim, membership of
// the institution's admins collection, or an active roleAssignment (which is
// what Principal, HOD and Faculty-Class-Teacher all hold).
async function assertCanInvigilate(auth, contestId) {
  if (!auth) throw new HttpsError("unauthenticated", "Sign in first.");
  if (auth.token && auth.token.admin === true) return;

  const db = admin.firestore();
  const contestSnap = await db.doc(`contests/${contestId}`).get();
  if (!contestSnap.exists) throw new HttpsError("not-found", "Contest not found.");

  const institutionId = contestSnap.get("institutionId") || "";
  if (!institutionId) {
    // A global contest has no institution staff to defer to, so only the
    // platform admin (handled above) can review it.
    throw new HttpsError("permission-denied", "Not an invigilator for this contest.");
  }

  const [adminDoc, roleDoc] = await Promise.all([
    db.doc(`institutions/${institutionId}/admins/${auth.uid}`).get(),
    db.doc(`institutions/${institutionId}/roleAssignments/${auth.uid}`).get(),
  ]);

  if (adminDoc.exists) return;
  if (roleDoc.exists && roleDoc.get("status") === "active") return;

  throw new HttpsError("permission-denied", "Not an invigilator for this contest.");
}

function proctorPrefix(contestId, studentUid) {
  return `proctor/${contestId}/${studentUid}`;
}

/**
 * Returns one proctoring frame as base64. `seq` omitted means the rolling
 * latest.jpg; a number means that archived frame (only present when the contest
 * has proctorRetainFrames on).
 */
exports.getProctorFrame = onCall({ region: "us-central1", maxInstances: 10 }, async (request) => {
  const { contestId, uid: studentUid, seq } = request.data || {};
  if (!contestId || !studentUid) {
    throw new HttpsError("invalid-argument", "contestId and uid are required.");
  }
  await assertCanInvigilate(request.auth, contestId);

  const objectPath = seq === undefined || seq === null
    ? `${proctorPrefix(contestId, studentUid)}/latest.jpg`
    : `${proctorPrefix(contestId, studentUid)}/frames/${String(seq).padStart(4, "0")}.jpg`;

  const file = admin.storage().bucket().file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError("not-found", "No photo captured for this student yet.");

  const [buffer] = await file.download();
  const [meta] = await file.getMetadata();

  // Audit trail: looking at a student's face is itself an action worth logging.
  logger.info("proctor frame served", {
    contestId, studentUid, objectPath, reviewer: request.auth.uid,
  });

  return {
    contentType: meta.contentType || "image/jpeg",
    dataBase64: buffer.toString("base64"),
    rollNumber: (meta.metadata && meta.metadata.rollNumber) || "",
    capturedAt: (meta.metadata && meta.metadata.capturedAt) || meta.updated || null,
    sizeBytes: Number(meta.size) || buffer.length,
  };
});

/**
 * Lists the archived frames for one student, newest first. Metadata only - no
 * image bytes - so a reviewer sees the capture timeline and then pulls just the
 * frame they want.
 */
exports.listProctorFrames = onCall({ region: "us-central1", maxInstances: 10 }, async (request) => {
  const { contestId, uid: studentUid } = request.data || {};
  if (!contestId || !studentUid) {
    throw new HttpsError("invalid-argument", "contestId and uid are required.");
  }
  await assertCanInvigilate(request.auth, contestId);

  const [files] = await admin.storage().bucket().getFiles({
    prefix: `${proctorPrefix(contestId, studentUid)}/frames/`,
  });

  const frames = files.map((f) => {
    const seqMatch = f.name.match(/frames\/(\d+)\.jpg$/);
    return {
      seq: seqMatch ? Number(seqMatch[1]) : null,
      capturedAt: (f.metadata.metadata && f.metadata.metadata.capturedAt) || f.metadata.updated || null,
      sizeBytes: Number(f.metadata.size) || 0,
    };
  }).filter((f) => f.seq !== null);

  frames.sort((a, b) => b.seq - a.seq);
  return { frames };
});
