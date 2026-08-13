// Institution demo requests, submitted unauthenticated from the public
// "Request a demo" dialog (components/campus/campus-demo-request.jsx) on the
// /campus/institutions pitch and related campus marketing pages.
//
// Read/update/delete is admin-only by rule (firestore.rules' isValidDemoRequest
// block); creation is the one unauthenticated write, locked to a fixed field
// whitelist with status pinned to "new". This file is the admin-side half of
// that trust boundary - it never writes with anything but an admin session.
//
// fetchDemoRequests deliberately has NO where() clause: filtering is done
// client-side in the panel instead, so this never needs a status+createdAt
// composite index deployed (index deploys are a manual, easy-to-forget step
// in this repo - see the ambassadors panel for what that failure looks like).

import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from "firebase/firestore";

export const DEMO_REQUEST_STATUS = Object.freeze({
  NEW: "new",
  CONTACTED: "contacted",
  CONVERTED: "converted",
  CLOSED: "closed",
});

export async function fetchDemoRequests(max = 200) {
  const snap = await getDocs(query(
    collection(db, "demo_requests"),
    orderBy("createdAt", "desc"),
    limit(max),
  ));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setDemoRequestStatus(id, status) {
  await updateDoc(doc(db, "demo_requests", id), { status });
}
