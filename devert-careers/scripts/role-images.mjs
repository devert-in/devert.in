// Draws the link-preview images careers pages advertise in og:image /
// twitter:image - what WhatsApp, LinkedIn and X show when a role is shared.
//
// Runs as `prebuild`, so CI makes them on every deploy:
//   public/og/careers.png          the careers site itself
//   public/og/roles/{slug}.png     one per PUBLISHED role
//
// WHY A BUILD STEP AND NOT app/[slug]/opengraph-image.jsx: under
// output: 'export' that route emits an extension-less file, which Firebase
// Hosting serves without an image content type - and link-preview crawlers are
// exactly the clients that refuse to guess. A plain .png in public/ is served
// as image/png by every host, every time.
//
// The renderer is next/og's ImageResponse (satori + resvg, bundled with Next),
// so this adds no dependency. Roles are read from Firestore's REST API as an
// anonymous client - the same public read the site itself makes; firestore.rules
// allows it only for published / closed roles.
//
// A role published AFTER a deploy has no PNG yet; its page (served by the
// shell fallback) advertises careers.png until the next deploy draws its own.
// components/role-banner.jsx is the on-page twin of this design and renders
// live, so the site itself never waits for a deploy.

import { ImageResponse } from "next/og.js";
import { ROLE_ART } from "../lib/role-art.mjs";
import { createElement as h } from "react";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og");
const PROJECT = "devert-me";
const W = 1200, H = 630;

const C = {
  bg: "#05070c",
  ink900: "#f4f7fb", ink700: "#bcc4d1", ink600: "#9aa3b4", ink400: "#6a7589",
  brand: "#3ce86f", brandDim: "#04210f", cyan: "#00e5ff", onBrand: "#05080F",
};
const EMPLOYMENT = { "full-time": "Full-time", internship: "Internship", contract: "Contract", "part-time": "Part-time" };
const LOCATION = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

const dataUrl = (file, mime) => `data:${mime};base64,${readFileSync(join(ROOT, "public", file)).toString("base64")}`;

// Circuit traces in the right third, echoing the hero plate: [x, y, w, h, colour].
const G = "rgba(60,232,111,0.16)", Cy = "rgba(0,229,255,0.12)";
const TRACES = [
  [860, 120, 340, 2, G], [1000, 120, 2, 140, G], [1000, 258, 200, 2, G],
  [920, 340, 280, 2, Cy], [920, 340, 2, 120, Cy], [920, 458, 160, 2, Cy],
  [1080, 400, 2, 230, G], [1080, 400, 120, 2, G], [780, 520, 300, 2, Cy],
  [1140, 60, 2, 60, Cy], [1140, 180, 60, 2, Cy],
];
const BADGE = dataUrl("devert-campus-badge.png", "image/png");

// ---- data --------------------------------------------------------------------

function fromFirestore(v) {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestore);
  return undefined;
}

async function publishedRoles() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "job_openings" }],
      where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
    } }),
  });
  if (!res.ok) throw new Error(`Firestore query failed: HTTP ${res.status}`);
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => {
    const f = r.document.fields || {};
    return {
      slug: r.document.name.split("/").pop(),
      title: fromFirestore(f.title) || "",
      team: fromFirestore(f.team) || "",
      employmentType: fromFirestore(f.employmentType) || "",
      employmentTypes: fromFirestore(f.employmentTypes) || [],
      locationType: fromFirestore(f.locationType) || "",
      location: fromFirestore(f.location) || "",
      blurb: fromFirestore(f.blurb) || "",
    };
  });
}

// ---- drawing -------------------------------------------------------------------
// Satori needs display:flex on every element with more than one child.

const row = (style, ...kids) => h("div", { style: { display: "flex", ...style } }, ...kids);

function frame(children, footerLeft) {
  return row({ width: W, height: H, position: "relative", background: C.bg, fontFamily: "sans-serif" },
    // Drawn, not the brushed-metal JPEG: the photo's grain made every card
    // ~500 KB, and WhatsApp - the channel these links travel on - tends to drop
    // previews above ~300 KB. Flat fills and a few hairlines compress to a
    // fraction of that and read the same at thumbnail size.
    row({ position: "absolute", left: 0, top: 0, width: W, height: H, background: "linear-gradient(120deg, #070a12 0%, #05070c 60%, #061018 100%)" }),
    ...TRACES.map(([x, y, w, hh, color]) => row({ position: "absolute", left: x, top: y, width: w, height: hh, background: color })),
    row({ position: "absolute", left: 0, top: 0, width: W, height: 6, background: C.brand }),
    row({ position: "relative", flexDirection: "column", width: W, height: H, padding: "56px 72px" },
      row({ alignItems: "center", justifyContent: "space-between" },
        row({ alignItems: "center", gap: 18 },
          h("img", { src: BADGE, width: 60, height: 60, style: { borderRadius: 14 } }),
          row({ fontSize: 34, fontWeight: 700, color: C.ink900, letterSpacing: -0.5 }, "DeVert"),
          row({ fontSize: 30, color: C.ink600 }, "Careers"),
        ),
        row({ fontSize: 22, fontWeight: 700, color: C.brand, border: `2px solid ${C.brand}`, borderRadius: 999, padding: "10px 22px", letterSpacing: 3, background: "rgba(4,33,15,0.6)" }, "WE'RE HIRING"),
      ),
      row({ flexDirection: "column", flexGrow: 1, justifyContent: "center" }, ...children),
      row({ alignItems: "center", justifyContent: "space-between" },
        row({ fontSize: 26, color: C.cyan, letterSpacing: 0.5 }, footerLeft),
        row({ fontSize: 26, fontWeight: 700, color: C.onBrand, background: C.brand, borderRadius: 999, padding: "16px 34px" }, "Apply now"),
      ),
    ),
  );
}

function roleCard(role) {
  const types = (role.employmentTypes.length ? role.employmentTypes : [role.employmentType]).filter(Boolean);
  const meta = [types.map((t) => EMPLOYMENT[t] || t).join(" or "), LOCATION[role.locationType] || role.locationType, role.location]
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join("  ·  ");
  const title = role.title.length > 46 ? role.title.slice(0, 45) + "…" : role.title;
  const blurb = role.blurb.length > 130 ? role.blurb.slice(0, 128).replace(/\s+\S*$/, "") + "…" : role.blurb;
  return frame([
    role.team ? row({ fontSize: 24, color: C.brand, letterSpacing: 2, marginBottom: 14 }, role.team.toUpperCase()) : null,
    row({ fontSize: title.length > 28 ? 64 : 76, fontWeight: 700, color: C.ink900, lineHeight: 1.05, letterSpacing: -1.5 }, title),
    blurb ? row({ fontSize: 28, color: C.ink700, lineHeight: 1.35, marginTop: 22, maxWidth: 980 }, blurb) : null,
    meta ? row({ fontSize: 24, color: C.ink400, marginTop: 24 }, meta) : null,
  ].filter(Boolean), `careers.devert.in/${role.slug}`);
}

function siteCard() {
  return frame([
    row({ fontSize: 76, fontWeight: 700, color: C.ink900, lineHeight: 1.05, letterSpacing: -1.5 }, "Build DeVert with us"),
    row({ fontSize: 30, color: C.ink700, lineHeight: 1.35, marginTop: 22, maxWidth: 960 },
      "Open roles at DeVert - the developer platform for learning, building and getting hired."),
  ], "careers.devert.in");
}

async function png(element) {
  const res = new ImageResponse(element, { width: W, height: H });
  return Buffer.from(await res.arrayBuffer());
}

// ---- main ----------------------------------------------------------------------

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "roles"), { recursive: true });

writeFileSync(join(OUT, "careers.png"), await png(siteCard()));
console.log("role-images: public/og/careers.png");

let roles = [];
try {
  roles = await publishedRoles();
} catch (e) {
  // Not fatal: every page still has careers.png to fall back to, and a missing
  // per-role preview is far better than a failed deploy of the whole site.
  console.warn(`role-images: could not read roles (${e.message}) - per-role images skipped`);
}
for (const role of roles) {
  if (!/^[a-z0-9-]+$/.test(role.slug)) continue;
  // A role with a hand-made card (lib/role-art.mjs) advertises that instead.
  if (ROLE_ART[role.slug]?.card) { console.log(`role-images: ${role.slug} uses its hand-made card`); continue; }
  writeFileSync(join(OUT, "roles", `${role.slug}.png`), await png(roleCard(role)));
  console.log(`role-images: public/og/roles/${role.slug}.png`);
}
