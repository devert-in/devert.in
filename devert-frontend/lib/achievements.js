import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

// Read-only client for the achievements collection (see firestore.rules'
// own comment on it) - discrete, awarded badges, distinct from the
// reward_grants ledger. Nothing here ever writes: an achievement is granted
// only by a Cloud Function via the Admin SDK (functions/index.js's
// grantStreakAchievementOnUpdate is the first source) or an admin manual
// grant, never by a client. World-readable by design, so this works for a
// visitor viewing someone else's /u/{handle} portfolio, not just the owner.
export async function fetchUserAchievements(uid) {
  if (!uid) return [];
  const snap = await getDocs(query(
    collection(db, "achievements"),
    where("uid", "==", uid),
    orderBy("awardedAt", "desc"),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Palette colors from CLAUDE.md's fixed accent set, not invented ones -
// bronze has no real slot in that palette, so it takes the closest existing
// accent (orange) rather than a new hex value.
const TIER_COLOR = { bronze: "#FF9500", silver: "#00FFFF", gold: "#FFD700", platinum: "#C77DFF" };

// Maps a raw achievements/{id} doc onto AchievementsSection's existing
// {id, title, org, description, date, color} card shape, so a real,
// server-granted achievement can render through the exact same component
// self-reported profile.achievements entries already use, with no separate
// "system achievement card" variant to build and keep visually in sync.
export function formatSystemAchievement(a) {
  return {
    id: a.id,
    title: a.title,
    org: a.tier ? `${a.tier.charAt(0).toUpperCase()}${a.tier.slice(1)} Tier` : "DeVert",
    description: a.description,
    date: a.awardedAt?.toDate?.()?.toLocaleDateString("en-US", { month: "short", year: "numeric" }) || "",
    color: TIER_COLOR[a.tier] || "#FFD700",
  };
}
