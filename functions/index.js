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

// ---------------------------------------------------------------------------
// Razorpay Standard Checkout - order creation, signature verification, webhook.
//
// Why here and not devert-frontend: the frontend is output: "export" (a static
// export), so it has no API routes at all and never will. Order creation needs
// the key secret and signature verification needs to be untamperable, so both
// have to be server-side. devert-backend (Spring Boot) was the other candidate
// and is where CLAUDE.md points for browser-unsafe work, but Cloud Functions
// wins here on two counts: Razorpay's official SDK is Node, and the webhook
// needs a stable always-warm-enough HTTPS endpoint that CI already deploys.
//
// The KEY SECRET must never go in functions/.env - that file is committed (see
// .gitignore's !functions/.env negation), so a secret placed there lands in git.
// How it is supplied is covered in detail just below, at the point where it is
// read; the short version is process.env now, Secret Manager at launch.
//
// The KEY ID is the publishable half and lives in functions/.env - it is handed
// to every browser that opens Checkout, so it is not a secret.
// ---------------------------------------------------------------------------

const crypto = require("crypto");
const Razorpay = require("razorpay");

// Launched 2026-08-09: both secrets are now in Secret Manager and bound via
// `secrets: [...]` on createRazorpayOrder/verifyRazorpayPayment (KEY_SECRET)
// and razorpayWebhook (WEBHOOK_SECRET) - Firebase injects a bound secret as
// process.env.<NAME>, so the read sites below needed no change at all.
//
// Before launch, this deliberately read process.env with NO `secrets: [...]`
// binding and no defineSecret() at all: defineSecret() makes a secret's
// existence a DEPLOY-TIME requirement, and with deploy-prod.yml running
// `deploy --only hosting,functions` as one command, a missing Razorpay
// credential would have failed the functions half and taken hosting down
// with it - so an unlaunched payment feature could have blocked an unrelated
// frontend hotfix from ever shipping. That risk is gone now that the secrets
// genuinely exist and aren't going away, but it's why the two-step
// (env-only, then bind once real) shape existed at all.
const RAZORPAY_KEY_SECRET = { value: () => process.env.RAZORPAY_KEY_SECRET || "" };
const RAZORPAY_WEBHOOK_SECRET = { value: () => process.env.RAZORPAY_WEBHOOK_SECRET || "" };

// The price list lives HERE, server-side, and the client sends only a planId.
//
// This is a deliberate departure from the usual "client posts an amount" sample
// code. An amount chosen by the browser is an amount an attacker chooses: paying
// 100 paise for an annual plan is a one-line devtools edit. The server is the
// only party allowed to say what something costs.
//
// amount is in PAISE (Razorpay's smallest-unit convention). 100 paise is
// Razorpay's own documented minimum.
const PLANS = Object.freeze({
  individual_monthly: { amount: 9900, currency: "INR", label: "DeVert Campus - Individual (1 month)", days: 31 },
  individual_annual: { amount: 49900, currency: "INR", label: "DeVert Campus - Individual (12 months)", days: 366 },
});

function razorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = RAZORPAY_KEY_SECRET.value();
  if (!keyId || !keySecret) {
    throw new HttpsError("failed-precondition",
      "Payments are not configured on the server (missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET).");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Creates a Razorpay order for one of the server-defined plans.
 *
 * Returns exactly what Checkout needs and nothing more - notably the key id, so
 * the frontend never has to hardcode it or read it from its own env at build
 * time (a build-time value would need a rebuild to rotate).
 */
exports.createRazorpayOrder = onCall(
  { region: "us-central1", maxInstances: 10, secrets: ["RAZORPAY_KEY_SECRET"] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before paying.");

    const planId = String((request.data || {}).planId || "");
    const plan = PLANS[planId];
    if (!plan) throw new HttpsError("invalid-argument", `Unknown plan "${planId}".`);
    if (plan.amount < 100) throw new HttpsError("internal", "Plan amount is below Razorpay's 100 paise minimum.");

    // receipt is our own correlation id and is capped at 40 chars by Razorpay.
    const receipt = `dv_${planId.slice(0, 12)}_${request.auth.uid.slice(0, 10)}_${Date.now().toString(36)}`.slice(0, 40);

    let order;
    try {
      order = await razorpayClient().orders.create({
        amount: plan.amount,
        currency: plan.currency,
        receipt,
        // notes come back on the webhook payload, which is how the webhook
        // knows which account to entitle without trusting anything the browser
        // says at verify time.
        notes: { uid: request.auth.uid, planId },
      });
    } catch (err) {
      const status = err?.statusCode;
      logger.error("razorpay order create failed", { status, err: err?.error || String(err) });
      if (status === 401) throw new HttpsError("failed-precondition", "Razorpay rejected our credentials.");
      throw new HttpsError("internal", "Could not start the payment. Please try again.");
    }

    // Recorded before the user ever sees Checkout, so a payment that succeeds at
    // Razorpay but whose callback never reaches us is still reconcilable.
    await admin.firestore().doc(`payments/${order.id}`).set({
      uid: request.auth.uid,
      planId,
      amount: plan.amount,
      currency: plan.currency,
      receipt,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      label: plan.label,
    };
  }
);

/**
 * Verifies the Checkout callback signature.
 *
 * HMAC-SHA256(order_id + "|" + payment_id, key_secret) compared against
 * razorpay_signature, in constant time.
 *
 * This confirms the callback genuinely came from Razorpay and was not forged in
 * the browser. It is NOT the authority for granting access - the webhook is.
 * A client can simply never call this (close the tab at the right moment), so
 * treating it as the entitlement trigger would make entitlement depend on the
 * attacker's cooperation. It exists to give the user an immediate, trustworthy
 * "yes, that worked" while the webhook settles.
 */
exports.verifyRazorpayPayment = onCall(
  { region: "us-central1", maxInstances: 10, secrets: ["RAZORPAY_KEY_SECRET"] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in first.");

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      request.data || {};
    if (!orderId || !paymentId || !signature) {
      throw new HttpsError("invalid-argument", "orderId, paymentId and signature are all required.");
    }

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // timingSafeEqual throws on length mismatch, so compare lengths first.
    const ok = expected.length === String(signature).length
      && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));

    if (!ok) {
      logger.warn("razorpay signature mismatch", { orderId, paymentId, uid: request.auth.uid });
      await admin.firestore().doc(`payments/${orderId}`).set({
        status: "signature_mismatch",
        signatureCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      throw new HttpsError("permission-denied", "Payment signature did not match. Nothing has been activated.");
    }

    const ref = admin.firestore().doc(`payments/${orderId}`);
    const snap = await ref.get();
    // The order was created against a uid; a different signed-in account
    // presenting the same callback is not the payer.
    if (snap.exists && snap.get("uid") && snap.get("uid") !== request.auth.uid) {
      throw new HttpsError("permission-denied", "This payment belongs to a different account.");
    }

    await ref.set({
      paymentId,
      status: "verified",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { verified: true, orderId, paymentId };
  }
);

/**
 * Razorpay webhook - the authority for granting access.
 *
 * Plain onRequest rather than a callable because Razorpay POSTs here directly
 * and knows nothing about Firebase callable envelopes. Signature is verified
 * over the RAW body: re-serialising the parsed JSON changes the bytes and the
 * HMAC will never match.
 *
 * Idempotent by design. Razorpay retries on any non-2xx and can deliver the same
 * event more than once, so granting is written with a deterministic doc id and a
 * status guard rather than blindly incrementing anything.
 *
 * Always answers 200 once the signature is valid, even if our own bookkeeping
 * then fails - a non-2xx makes Razorpay retry the same event for hours, which
 * turns one bug into a stampede. Failures are logged for reconciliation instead.
 */
exports.razorpayWebhook = onRequest(
  { region: "us-central1", maxInstances: 10, secrets: ["RAZORPAY_WEBHOOK_SECRET"] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    const signature = req.get("X-Razorpay-Signature") || "";
    const secret = RAZORPAY_WEBHOOK_SECRET.value();
    if (!secret) { logger.error("webhook secret not configured"); res.status(500).send("not configured"); return; }

    // req.rawBody is the untouched request bytes - the only thing the HMAC is
    // computed over.
    const raw = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const valid = expected.length === signature.length
      && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

    if (!valid) {
      logger.warn("razorpay webhook signature invalid");
      res.status(400).send("invalid signature");
      return;
    }

    let event;
    try { event = JSON.parse(raw); } catch { res.status(400).send("bad json"); return; }

    const type = event.event || "";
    const payment = event.payload?.payment?.entity || null;
    logger.info("razorpay webhook", { type, paymentId: payment?.id, orderId: payment?.order_id });

    try {
      if ((type === "payment.captured" || type === "order.paid") && payment) {
        const orderId = payment.order_id;
        const uid = payment.notes?.uid;
        const planId = payment.notes?.planId;
        const plan = PLANS[planId];

        await admin.firestore().doc(`payments/${orderId}`).set({
          status: "paid",
          paymentId: payment.id,
          method: payment.method || "",
          amountPaid: payment.amount,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        if (uid && plan) {
          const subRef = admin.firestore().doc(`subscriptions/${uid}`);
          await admin.firestore().runTransaction(async (tx) => {
            const cur = await tx.get(subRef);
            // Extend from the later of now and any existing expiry, so paying
            // again before expiry adds time instead of discarding it.
            const now = Date.now();
            const existing = cur.exists ? cur.get("expiresAtMs") || 0 : 0;
            const base = Math.max(now, existing);
            const expiresAtMs = base + plan.days * 24 * 60 * 60 * 1000;

            // Same payment arriving twice must not extend twice.
            const seen = cur.exists ? (cur.get("appliedPaymentIds") || []) : [];
            if (seen.includes(payment.id)) return;

            tx.set(subRef, {
              uid,
              plan: planId,
              status: "active",
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
              expiresAtMs,
              expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
              lastOrderId: orderId,
              lastPaymentId: payment.id,
              appliedPaymentIds: [...seen, payment.id].slice(-20),
            }, { merge: true });
          });
          logger.info("subscription granted", { uid, planId });
        } else {
          logger.error("paid payment missing uid/plan notes - manual reconciliation needed",
            { orderId, uid, planId });
        }
      } else if (type === "payment.failed" && payment) {
        await admin.firestore().doc(`payments/${payment.order_id}`).set({
          status: "failed",
          paymentId: payment.id,
          failureReason: payment.error_description || "",
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      // Deliberately still a 200 - see the header comment.
      logger.error("razorpay webhook bookkeeping failed", { type, err: String(err) });
    }

    res.status(200).send("ok");
  }
);

// ---------------------------------------------------------------------------
// Contest submission auto-grading
// ---------------------------------------------------------------------------
//
// Grading used to be lazy and client-only: lib/contests.js's persistGrading()
// ran in the student's own browser, the first time they reopened their
// result AFTER contestEnd - and firestore.rules blocked that write entirely
// until then, specifically so a graded score could never sit in a document
// the student can always read (their own submission) while the contest was
// still open to everyone else. A student who never came back stayed
// "pending" forever, needing an admin to run a manual grading sweep
// (gradeUngradedSubmissions) - and that sweep is ALSO blocked by the same
// contestEnd gate, so a contest whose window got extended (e.g. to give
// students a retry after an outage) left every straggler ungraded and
// unreachable from the UI until the new end time actually arrived.
//
// This trigger grades every submission the moment it's written, admin-SDK
// side - which already bypasses firestore.rules entirely, so the contestEnd
// gate stays exactly as strict as before for every client-side path (a
// compromised or malicious browser still cannot grade early). It does NOT
// expose anything to the student early: the results/leaderboard screen only
// ever fetches leaderboard data once contestPhase(contest) === "past" (see
// CampusContestResults in campus-contests.jsx), and isSettingReleased()'s
// "after_end" mode resolves the same way - both keyed off contestEnd, not
// off this `graded` flag. Grading early just means the number is already
// sitting there, correctly computed, for the moment release time arrives -
// exactly mirroring what an admin already did by hand via a one-off script
// during the 2026-08-08/09 outage.
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

function isContestAnswerCorrect(question, key, given) {
  if (question.type === "multiselect") {
    const a = [...(given || [])].sort();
    const b = [...(key.correctOptionIds || [])].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (question.type === "fillblank") {
    const accepted = (key.correctText || "").split("|").map(s => s.trim().toLowerCase()).filter(Boolean);
    return accepted.includes(String(given).trim().toLowerCase());
  }
  return given === (key.correctOptionIds || [])[0];
}

// Mirrors lib/contests.js's gradeSubmission() field-for-field - any change
// there needs the same change here, or the two grading paths (this trigger,
// and the client's own lazy self-grade / admin sweep, both of which check
// `graded` first and no-op if this already ran) would silently disagree.
function computeContestGrade(questions, answerKeys, answers, codingResults) {
  let score = 0, maxScore = 0, correctCount = 0, attemptedCount = 0;
  for (const q of questions) {
    const marks = q.marks || 1;
    maxScore += marks;
    if (q.type === "coding") {
      const result = codingResults[q.id];
      if (!result) continue;
      attemptedCount++;
      score += Math.max(0, Math.min(marks, result.score || 0));
      if (result.verdict === "Accepted") correctCount++;
      continue;
    }
    const key = answerKeys[q.id];
    const given = answers ? answers[q.id] : undefined;
    const isBlank = given === undefined || given === null || given === ""
      || (Array.isArray(given) && given.length === 0);
    if (!key || isBlank) continue;
    attemptedCount++;
    if (isContestAnswerCorrect(q, key, given)) { score += marks; correctCount++; }
    else if (q.negativeMarks) score -= q.negativeMarks;
  }
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  return { score, maxScore, correctCount, attemptedCount, accuracy };
}

// asia-south1, not us-central1 like every other function in this file -
// that's where this Firestore database actually lives, and a Firestore
// trigger must run in its database's region or every event pays an
// unnecessary cross-region hop (Firebase warns on deploy if this drifts).
exports.gradeContestSubmissionOnCreate = onDocumentCreated(
  { region: "asia-south1", document: "contests/{contestId}/submissions/{uid}" },
  async (event) => {
    const { contestId, uid } = event.params;
    const snap = event.data;
    if (!snap) return;
    const sub = snap.data();
    if (sub.graded) return; // already graded some other way - nothing to do

    const db = admin.firestore();
    const submissionRef = snap.ref;

    try {
      const [questionsSnap, answerKeysSnap, codingResultsSnap] = await Promise.all([
        db.collection("contests").doc(contestId).collection("questions").get(),
        db.collection("contests").doc(contestId).collection("answerKeys").get(),
        submissionRef.collection("codingResults").get(),
      ]);
      const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const answerKeys = {};
      answerKeysSnap.forEach(d => { answerKeys[d.id] = d.data(); });
      const codingResults = {};
      codingResultsSnap.forEach(d => { codingResults[d.id] = d.data(); });

      const grading = computeContestGrade(questions, answerKeys, sub.answers || {}, codingResults);

      // Transaction, re-reading `graded` live: the client's own lazy
      // self-grade path could theoretically win a race against this trigger
      // (Cloud Functions at-least-once delivery can also redeliver this same
      // event) - whichever writes first wins, the other is a no-op.
      await db.runTransaction(async (tx) => {
        const current = await tx.get(submissionRef);
        if (current.data()?.graded) return;
        tx.update(submissionRef, {
          graded: true,
          score: grading.score,
          accuracy: grading.accuracy,
          correctCount: grading.correctCount,
        });
      });
      logger.info("contest submission auto-graded", { contestId, uid, score: grading.score, maxScore: grading.maxScore });
    } catch (err) {
      // Never throws past this point - the client-side lazy grade and the
      // admin's manual sweep both remain as fallbacks, so a transient failure
      // here (e.g. a Firestore hiccup) doesn't leave the submission stuck;
      // it just grades a little later than "immediately".
      logger.error("contest auto-grading failed", { contestId, uid, err: String(err) });
    }
  }
);
