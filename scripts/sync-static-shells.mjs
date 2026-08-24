// Copies the built static shells that functions/index.js's crawler-vs-human
// routers (uHandleRouter/contestPreviewRouter/pulsePreviewRouter) serve to
// real browsers. These are plain copies of devert-frontend/out/{u,contest,
// pulse}.html - NOT re-templated, just relocated - so they always reference
// the exact same content-hashed /_next/static/chunks/*.js filenames the just-
// built devert-frontend/out actually contains. Skipping this step (or running
// it before `next build` instead of after) leaves the Cloud Functions serving
// stale chunk references - since every hosting deploy replaces the previous
// build's chunk files outright, a stale shell 404s on every JS asset it
// points to, which surfaces to a real user as a blank "Application error"
// page, not an obviously-static-file problem. Node's fs, not a shell `cp`, so
// this runs identically from PowerShell, cmd.exe, or a POSIX shell.
//
// campus.html is deliberately NOT in this list: Campus moved out of
// devert-frontend into its own devert-campus app (campus.devert.in), so
// devert-frontend/out no longer produces a campus.html to copy - see
// .github/workflows/deploy-prod.yml's "Sync static SPA shells" CI step,
// which only ever copied u/contest/pulse for the same reason. functions/
// static/campus.html is left as a stale, unsynced file: campusPreviewRouter
// is unreachable in production anyway, since the main hosting target's
// "/campus/**" redirect (firebase.json) fires before its rewrite ever would.
import { copyFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "devert-frontend", "out");
const staticDir = join(root, "functions", "static");

const SHELLS = ["u.html", "contest.html", "pulse.html"];

for (const file of SHELLS) {
  copyFileSync(join(outDir, file), join(staticDir, file));
  console.log(`Synced ${file}`);
}
