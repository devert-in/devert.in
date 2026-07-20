// Copies the built static shells that functions/index.js's crawler-vs-human
// routers (uHandleRouter/campusPreviewRouter/contestPreviewRouter/
// pulsePreviewRouter) serve to real browsers. These are plain copies of
// devert-frontend/out/{u,campus,contest,pulse}.html - NOT re-templated, just
// relocated - so they always reference the exact same content-hashed
// /_next/static/chunks/*.js filenames the just-built devert-frontend/out
// actually contains. Skipping this step (or running it before `next build`
// instead of after) leaves the Cloud Functions serving stale chunk
// references - since every hosting deploy replaces the previous build's
// chunk files outright, a stale shell 404s on every JS asset it points to,
// which surfaces to a real user as a blank "Application error" page, not an
// obviously-static-file problem. Node's fs, not a shell `cp`, so this runs
// identically from PowerShell, cmd.exe, or a POSIX shell.
import { copyFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "devert-frontend", "out");
const staticDir = join(root, "functions", "static");

const SHELLS = ["u.html", "campus.html", "contest.html", "pulse.html"];

for (const file of SHELLS) {
  copyFileSync(join(outDir, file), join(staticDir, file));
  console.log(`Synced ${file}`);
}
