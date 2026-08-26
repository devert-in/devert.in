import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";

// `companies` and `problems` are global, platform-admin-owned collections
// (firestore.rules: write is isAdmin() only) - shared by every institution
// and the main app, so a campus admin can never hide/disable those docs
// directly without affecting everyone else too. This is the institution-
// scoped override instead: one small doc per institution listing which
// global companies/problems THAT institution's students shouldn't see,
// living under institutions/{slug}/contentVisibility (isInstitutionAdmin-
// writable, same as dailyLearning/announcements) rather than touching the
// global content at all.

async function fetchVisibility(slug) {
  const snap = await getDoc(doc(db, "institutions", slug, "contentVisibility", "config"));
  return snap.exists() ? snap.data() : { hiddenProblemIds: [], hiddenCompanyIds: [] };
}

export const fetchContentVisibility = fetchVisibility;

export async function setProblemHidden(slug, problemId, hidden) {
  await setDoc(doc(db, "institutions", slug, "contentVisibility", "config"), {
    hiddenProblemIds: hidden ? arrayUnion(problemId) : arrayRemove(problemId),
  }, { merge: true });
}

export async function setCompanyHidden(slug, companyId, hidden) {
  await setDoc(doc(db, "institutions", slug, "contentVisibility", "config"), {
    hiddenCompanyIds: hidden ? arrayUnion(companyId) : arrayRemove(companyId),
  }, { merge: true });
}
