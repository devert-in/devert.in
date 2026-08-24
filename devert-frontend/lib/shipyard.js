import { db } from "@/lib/firebase";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";

// Shared by Shipyard's own dock flow and Build's "dock the result straight
// to Shipyard" submit step, so both write the exact same shape instead of
// two copies of this drifting apart.
export async function dockProject({ user, userData, data }) {
  const ref = await addDoc(collection(db, "projects"), {
    ...data,
    ownerId:     user.uid,
    ownerHandle: userData?.handle || user.email?.split("@")[0] || "dev",
    createdAt:   serverTimestamp(),
  });
  await updateDoc(doc(db, "users", user.uid), { ships: increment(1) });
  return ref;
}
