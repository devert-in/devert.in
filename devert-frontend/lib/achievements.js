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
