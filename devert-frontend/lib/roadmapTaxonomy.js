// Admin-editable category/tag registry for Roadmaps, so a new category can
// be added from the admin panel without a code change or redeploy - unlike
// every existing category list on this platform (CODELAB_CATEGORIES,
// APTITUDE_CATEGORIES), which are hardcoded JS arrays.
//
// Modeled directly on lib/rewardPolicy.js's Firestore-overridable-config
// pattern (code defaults as a safety net, a versioned system/ doc as the
// live override, lazy Firestore import so the pure helpers stay usable
// without pulling Firestore into every importer), with ONE deliberate
// difference: rewardPolicy shallow-MERGES its remote doc onto the code
// defaults per-key, which is right for a settings object but wrong for a
// list - an admin who deletes a category must see it actually gone. So a
// saved `categories` array here REPLACES the code defaults wholesale; the
// defaults exist only for the never-been-saved case.
//
// Firestore is imported LAZILY, inside the two functions that actually
// touch it - same reason lib/rewardPolicy.js does: everything else here
// (activeCategories, categoryLabel) is pure, and keeping the module free of
// a top-level firebase import lets it be exercised under plain `node --test`
// with no emulator and no bundler alias resolution.

// Seeded with the MVP's initial role/domain spread - role-based roadmaps
// (e.g. "ML Engineer", "AI Scientist"), not bare subject names (a subject
// like "Java" or "Python" already lives in the separate Programming
// module). Distinct roles are kept distinct rather than collapsed - AI
// Engineer and AI Scientist are different day-to-day jobs, so both exist
// even though they overlap.
export const DEFAULT_ROADMAP_TAXONOMY = {
  version: 1,
  categories: [
    { key: "software-engineering", label: "Software Engineering", accent: "cyan", order: 10, archived: false },
    { key: "backend", label: "Backend Engineering", accent: "cyan", order: 20, archived: false },
    { key: "frontend", label: "Frontend Engineering", accent: "green", order: 30, archived: false },
    { key: "full-stack", label: "Full Stack Development", accent: "green", order: 40, archived: false },
    { key: "mobile", label: "Mobile Development", accent: "green", order: 50, archived: false },
    { key: "ai-ml", label: "AI & Machine Learning", accent: "purple", order: 60, archived: false },
    { key: "data", label: "Data Science & Analytics", accent: "gold", order: 70, archived: false },
    { key: "cloud-devops", label: "Cloud & DevOps", accent: "orange", order: 80, archived: false },
    { key: "cybersecurity", label: "Cybersecurity & Ethical Hacking", accent: "red", order: 90, archived: false },
    { key: "hardware-embedded", label: "Hardware & Embedded Systems", accent: "orange", order: 100, archived: false },
    { key: "robotics-iot", label: "Robotics & IoT", accent: "orange", order: 110, archived: false },
    { key: "vlsi", label: "VLSI & Chip Design", accent: "orange", order: 120, archived: false },
    { key: "design", label: "Product & UX Design", accent: "purple", order: 130, archived: false },
    { key: "product-business", label: "Product & Business", accent: "gold", order: 140, archived: false },
    { key: "research-academia", label: "Research & Academia", accent: "cyan", order: 150, archived: false },
    { key: "dsa-cp", label: "DSA & Competitive Programming", accent: "green", order: 160, archived: false },
  ],
  tagSuggestions: [
    "spring", "kubernetes", "docker", "pytorch", "tensorflow", "react", "next.js",
    "figma", "aws", "gcp", "azure", "linux", "verilog", "embedded-c", "arduino",
    "penetration-testing", "network-security", "burp-suite", "wireshark",
  ],
};

let loaded = false;
let inflight = null;
export const ROADMAP_TAXONOMY = JSON.parse(JSON.stringify(DEFAULT_ROADMAP_TAXONOMY));

export async function loadRoadmapTaxonomy() {
  if (loaded) return ROADMAP_TAXONOMY;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [{ db }, { doc, getDoc }] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/firestore"),
      ]);
      const snap = await getDoc(doc(db, "system", "roadmapTaxonomy"));
      if (snap.exists()) {
        const remote = snap.data();
        // Wholesale replace, not merge - see this file's header for why.
        if (Array.isArray(remote.categories)) ROADMAP_TAXONOMY.categories = remote.categories;
        if (Array.isArray(remote.tagSuggestions)) ROADMAP_TAXONOMY.tagSuggestions = remote.tagSuggestions;
        if (typeof remote.version === "number") ROADMAP_TAXONOMY.version = remote.version;
      }
    } catch {
      // Absent/denied doc = code defaults, never an empty category list -
      // same silent-fallback contract as loadRewardPolicy().
    }
    loaded = true;
    inflight = null;
    return ROADMAP_TAXONOMY;
  })();
  return inflight;
}

// Admin write path. Bumps `version` so a reader can tell a retune happened
// without diffing every field - same convention as saveRewardPolicy().
export async function saveRoadmapTaxonomy(patch) {
  const [{ db }, { doc, setDoc, serverTimestamp }] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/firestore"),
  ]);
  await setDoc(doc(db, "system", "roadmapTaxonomy"), {
    ...patch,
    version: (ROADMAP_TAXONOMY.version || 0) + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  loaded = false;
}

export function activeCategories(taxonomy = ROADMAP_TAXONOMY) {
  return (taxonomy.categories || []).filter((c) => !c.archived).sort((a, b) => (a.order || 0) - (b.order || 0));
}

// A category key resolves to a label even if archived (a roadmap authored
// against it before archival must not render a raw slug to a student - the
// same class of bug lib/campusDashboard.js's ACTIVITY_LABELS documents for
// activity types). Falls back to the raw key only if the category was
// removed from the registry entirely, never silently dropped from a
// roadmap's own categories array.
export function categoryLabel(key, taxonomy = ROADMAP_TAXONOMY) {
  return (taxonomy.categories || []).find((c) => c.key === key)?.label || key;
}
