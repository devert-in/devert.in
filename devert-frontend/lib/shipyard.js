import { db } from "@/lib/firebase";
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";

// Shared by Shipyard's own dock flow and Build's "dock the result straight
// to Shipyard" submit step, so both write the exact same shape instead of
// two copies of this drifting apart.
//
// One atomic batch, not addDoc() followed by a separate updateDoc() - a
// failure between the two used to be able to post the project without ever
// crediting the owner's ships counter. doc(collection(...)) generates the
// same auto-id addDoc() would have, so this is otherwise identical to what
// firestore.rules evaluates (a `create` on a new projects/{id} path).
export async function dockProject({ user, userData, data }) {
  const ref = doc(collection(db, "projects"));
  const batch = writeBatch(db);
  batch.set(ref, {
    ...data,
    ownerId:     user.uid,
    ownerHandle: userData?.handle || user.email?.split("@")[0] || "dev",
    createdAt:   serverTimestamp(),
  });
  batch.update(doc(db, "users", user.uid), { ships: increment(1) });
  await batch.commit();
  return ref;
}
