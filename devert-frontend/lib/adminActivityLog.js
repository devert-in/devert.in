import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAIL = "devert.contact@gmail.com";

// Fire-and-forget audit trail for admin actions - never blocks the action
// itself if the write fails. `product` scopes the entry (defaults to "core"
// so every existing call site across app/admin/page.jsx needs zero changes);
// /manage's own mutations pass "global" explicitly.
export function logAdminActivity(action, detail, product = "core") {
  addDoc(collection(db, "admin_activity_log"), {
    action, detail, product, actor: auth.currentUser?.email || ADMIN_EMAIL, createdAt: serverTimestamp(),
  }).catch(() => {});
}
