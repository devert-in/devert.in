// system/productRegistry - the Global Super Admin dashboard's (/manage) source
// of truth for what exists in the DeVert ecosystem and its publish state.
// Visibility/authoring only for now - no page reads this to gate real access
// yet (see the plan doc this came from for why that's a deliberate, separate
// follow-up, not done here).
//
// Status reflects REALITY, not aspiration: most of these are real, fully
// built, live pages today (Events/Community/Opportunities/Showcase/Build/
// Grind/Arena/Broadcast/Missions are not "future products", they already
// shipped) - only the four ComingSoonShell placeholders are NOT_PUBLISHED.
// Re-running this script overwrites the whole doc - check the /manage
// Products panel first if statuses have since been hand-toggled there.
//
//   node scripts/seed-product-registry.mjs            # dry run
//   node scripts/seed-product-registry.mjs --apply

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const APPLY = process.argv.includes("--apply");

const products = {
  core:          { label: "DeVert Core",  href: "/",              status: "PUBLISHED" },
  campus:        { label: "Campus",       href: "/campus",        status: "PUBLISHED" },
  events:        { label: "Events",       href: "/events",        status: "PUBLISHED" },
  community:     { label: "Community",    href: "/community",     status: "PUBLISHED" },
  opportunities: { label: "Opportunities", href: "/opportunities", status: "PUBLISHED" },
  showcase:      { label: "Showcase",      href: "/showcase",      status: "PUBLISHED" },
  build:         { label: "Build",        href: "/build",         status: "PUBLISHED" },
  grind:         { label: "Grind",        href: "/grind",         status: "PUBLISHED" },
  arena:         { label: "Arena",        href: "/arena",         status: "PUBLISHED" },
  broadcast:     { label: "Broadcast",    href: "/broadcast",     status: "PUBLISHED" },
  missions:      { label: "Missions",     href: "/missions",      status: "PUBLISHED" },
  openSource:    { label: "Open Source",  href: "/open-source",   status: "NOT_PUBLISHED" },
  labs:          { label: "Labs",         href: "/labs",          status: "NOT_PUBLISHED" },
  stories:       { label: "Stories",      href: "/stories",       status: "NOT_PUBLISHED" },
  organizations: { label: "Organizations", href: "/organizations", status: "NOT_PUBLISHED" },
};

async function main() {
  const ref = db.doc("system/productRegistry");
  const existing = await ref.get();
  console.log(existing.exists ? "system/productRegistry already exists - would overwrite:" : "system/productRegistry does not exist yet - would create:");
  console.log(JSON.stringify(products, null, 2));

  if (APPLY) {
    await ref.set({ products, updatedAt: FV.serverTimestamp() });
    console.log("\nApplied.");
  } else {
    console.log("\ndry run - re-run with --apply");
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
