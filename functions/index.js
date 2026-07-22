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
