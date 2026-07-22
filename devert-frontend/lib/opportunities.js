// Intel Feed's Opportunities catalog - global, admin-authored (internships,
// jobs, certifications, hackathons, scholarships, etc). See firestore.rules'
// `opportunities`/`opportunity_saves` blocks for the read/write authority
// this defers to.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { writeNotification } from "@/components/notification-bell";

export const OPPORTUNITY_TYPES = [
  "Internship", "Job", "Certification", "Free Course", "Paid Course",
  "Scholarship", "Fellowship", "Hackathon", "Coding Contest",
  "Campus Ambassador", "Bootcamp", "Workshop", "Webinar",
  "Open Source Program", "Research Opportunity", "Challenge", "Event",
];

export const WORK_MODES = ["Remote", "Hybrid", "On-site"];
export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// Same reasoning as lib/programming.js's fetchLanguages: the where() filter
// is required, not optional, for a non-admin list() read to pass
// firestore.rules at all - fetching everything and filtering client-side
// looks correct but fails with permission-denied for every real student.
export async function fetchOpportunities({ includeUnpublished = false } = {}) {
  const col = collection(db, "opportunities");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.publishedAt?.seconds || b.createdAt?.seconds || 0) - (a.publishedAt?.seconds || a.createdAt?.seconds || 0));
}

export async function fetchOpportunity(id) {
  const snap = await getDoc(doc(db, "opportunities", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveOpportunity(id, data) {
  await setDoc(doc(db, "opportunities", id), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

export async function deleteOpportunity(id) {
  await deleteDoc(doc(db, "opportunities", id));
}

// Fires an in-app broadcast (see components/notification-bell.jsx) to every
// signed-in user - "all" is an existing supported convention there. There is
// no push/email notification pipeline in this codebase (devert-backend's
// SMTP is wired for specific transactional emails only, not broadcast) - if
// push/email is ever wanted, that's a separate integration, not a checkbox
// this function can silently make real.
export async function notifyNewOpportunity(opportunity) {
  await writeNotification("all", {
    type: "promo",
    title: "New opportunity: " + opportunity.title,
    body: opportunity.organizationName + " - " + (opportunity.shortDescription || ""),
    ctaHref: "/intel?tab=opportunities&opp=" + opportunity.id,
    ctaLabel: "View opportunity",
  });
}

export async function incrementOpportunityStat(id, field) {
  try { await updateDoc(doc(db, "opportunities", id), { [field]: increment(1) }); } catch {}
}

export async function fetchSavedOpportunityIds(uid) {
  const snap = await getDoc(doc(db, "opportunity_saves", uid));
  return snap.exists() ? (snap.data().saved || []) : [];
}

export async function toggleSavedOpportunity(uid, oppId, currentlySaved) {
  await setDoc(doc(db, "opportunity_saves", uid), {
    saved: currentlySaved ? arrayRemove(oppId) : arrayUnion(oppId),
  }, { merge: true });
  try {
    await updateDoc(doc(db, "opportunities", oppId), { saveCount: increment(currentlySaved ? -1 : 1) });
  } catch {}
}

// Pure - no Firestore reads. `deadline` is a Firestore Timestamp or Date.
export function deadlineStatus(deadline, now = new Date()) {
  if (!deadline) return { label: null, expired: false };
  const d = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const ms = d.getTime() - now.getTime();
  if (ms <= 0) return { label: "Expired", expired: true };
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days === 1) return { label: "Ends tomorrow", expired: false };
  if (days <= 0) return { label: "Ends today", expired: false };
  return { label: `${days} day${days === 1 ? "" : "s"} left`, expired: false };
}
