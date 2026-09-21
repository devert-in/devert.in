// Careers - job openings, and the applications people send against them.
//
// Two collections with deliberately opposite trust models, which is the whole
// reason this file exists rather than the page components talking to Firestore
// directly:
//
// 1. job_openings is WORLD-READABLE, including to a logged-out crawler. That is
//    unusual for this codebase - almost every adjacent collection is gated - but
//    a job posting nobody can read without an account is not a job posting. It
//    is also the only way the JobPosting structured data in lib/careers-seo.js
//    can be built at `next build` time, since output: 'export' has no
//    per-request server and no admin credentials at build time. Writes are
//    admin-only, so "public" here means public to READ.
//
// 2. job_applications is the mirror image: an unauthenticated stranger may
//    CREATE one and nobody but an admin may ever read it back. Same shape as
//    demo_requests (see lib/demoRequests.js) and for the same reason - requiring
//    an account before someone can apply for a job would cost more candidates
//    than it would ever filter. firestore.rules pins status to "new" and
//    whitelists every field, so nothing an applicant writes can be forged into a
//    decision.
//
// What is deliberately NOT here: any file upload. Every write path in
// storage.rules requires auth, so accepting resumes from anonymous applicants
// would mean opening a new unauthenticated Storage path - a standing invitation
// to anyone who finds the form. Applications carry LINKS instead, and a
// signed-in applicant can reuse the resume already on their DeVert profile
// (resumes/{uid} is public-read already, so this stores a string, never a file).

import { db } from "@/lib/firebase";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";

export const JOB_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
});

export const APPLICATION_STATUS = Object.freeze({
  NEW: "new",
  SCREENING: "screening",
  INTERVIEWING: "interviewing",
  HIRED: "hired",
  REJECTED: "rejected",
  CLOSED: "closed",
});

export const EMPLOYMENT_TYPES = Object.freeze([
  { value: "full-time", label: "Full-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "part-time", label: "Part-time" },
]);

export const LOCATION_TYPES = Object.freeze([
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]);

// The pseudo-job id used by the general-interest form that renders when there
// are no published roles. A real value rather than an empty string, so the admin
// inbox can tell "applied to nothing in particular" apart from "applied to a
// role that has since been deleted".
export const GENERAL_INTEREST_JOB_ID = "general";

// Most important first, without needing an index. `order` is the manual override
// an admin sets; postedAt breaks ties. See fetchPublishedRoles for why the sort
// happens here rather than in the query.
function byDisplayOrder(a, b) {
  const ao = Number.isFinite(a.order) ? a.order : 500;
  const bo = Number.isFinite(b.order) ? b.order : 500;
  if (ao !== bo) return ao - bo;
  return (b.postedAt?.seconds || 0) - (a.postedAt?.seconds || 0);
}

function withId(snap) {
  return { id: snap.id, ...snap.data() };
}

// Single equality filter, no orderBy: that combination needs no composite index
// deployed, and index deploys are a separate manual step in this repo that is
// easy to forget (lib/demoRequests.js documents the same decision, and the
// ambassadors panel is what forgetting it looks like in production). The list of
// open roles is small by nature, so sorting it in the browser costs nothing.
export async function fetchPublishedRoles() {
  const snap = await getDocs(query(
    collection(db, "job_openings"),
    where("status", "==", JOB_STATUS.PUBLISHED),
  ));
  return snap.docs.map(withId).sort(byDisplayOrder);
}

// Live variant for the listing page, so a role published from /admin appears
// without a reload. Errors resolve to an empty list rather than throwing: a
// careers page rendering its "no open roles" state is a far better failure than
// one rendering a stack trace.
export function watchPublishedRoles(cb) {
  return onSnapshot(
    query(collection(db, "job_openings"), where("status", "==", JOB_STATUS.PUBLISHED)),
    (snap) => cb(snap.docs.map(withId).sort(byDisplayOrder)),
    () => cb([]),
  );
}

// Returns null rather than throwing for an unknown slug, so a build against a
// role that has since been deleted can call notFound() instead of failing the
// whole static export - same convention as hackathonForSlug.
export async function fetchRoleBySlug(slug) {
  if (!slug) return null;
  const snap = await getDoc(doc(db, "job_openings", slug)).catch(() => null);
  return snap?.exists() ? withId(snap) : null;
}

/**
 * Submits an application. Works signed out by design.
 *
 * `uid` is passed only when there is a signed-in user; firestore.rules requires
 * it to equal the caller's own uid when present, so it can identify an applicant
 * but can never attribute an application to somebody else.
 */
export async function submitApplication({
  jobId, jobTitle, name, email, phone, resumeUrl, portfolioUrl, githubUrl,
  linkedinUrl, devertHandle, coverNote, source, uid,
}) {
  const clean = (v, max) => (v || "").toString().trim().slice(0, max);

  const payload = {
    jobId: clean(jobId, 120) || GENERAL_INTEREST_JOB_ID,
    jobTitle: clean(jobTitle, 160),
    name: clean(name, 80),
    email: clean(email, 160),
    phone: clean(phone, 24),
    resumeUrl: clean(resumeUrl, 500),
    portfolioUrl: clean(portfolioUrl, 500),
    githubUrl: clean(githubUrl, 500),
    linkedinUrl: clean(linkedinUrl, 500),
    devertHandle: clean(devertHandle, 40),
    coverNote: clean(coverNote, 2000),
    source: clean(source, 40) || "careers",
    status: APPLICATION_STATUS.NEW,
    createdAt: serverTimestamp(),
  };
  // Omitted entirely rather than written as "" for a logged-out applicant: the
  // rule treats uid as optional-but-verified, and an empty string is not a uid.
  if (uid) payload.uid = uid;

  const ref = await addDoc(collection(db, "job_applications"), payload);
  return { id: ref.id, ...payload };
}

// Admin inbox. No where() for the same index-avoidance reason as
// fetchPublishedRoles - the panel filters by status client-side.
export async function fetchApplications(max = 200) {
  const snap = await getDocs(query(
    collection(db, "job_applications"),
    orderBy("createdAt", "desc"),
    limit(max),
  ));
  return snap.docs.map(withId);
}

export async function setApplicationStatus(id, status) {
  await updateDoc(doc(db, "job_applications", id), { status });
}

// ---- admin authoring -------------------------------------------------------
// Unpublished roles are listed here and nowhere else. Note what that does NOT
// mean: firestore.rules lets anyone read job_openings/{slug} directly, so a
// draft is unlisted, not secret. Never put anything confidential in one.

export async function fetchAllRoles(max = 200) {
  const snap = await getDocs(query(collection(db, "job_openings"), limit(max)));
  return snap.docs.map(withId).sort(byDisplayOrder);
}

// Doc ID IS the slug, matching hackathons/{slug} - that is what makes
// /careers/{slug} a single read rather than a query, and makes slug uniqueness a
// property of Firestore rather than something this code has to enforce.
export function slugify(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function saveRole(slug, data) {
  const id = slug || slugify(data.title);
  if (!id) throw new Error("A role needs a title before it can be saved.");
  await setDoc(doc(db, "job_openings", id), { ...data, slug: id }, { merge: true });
  return id;
}

export async function setRoleStatus(slug, status) {
  await updateDoc(doc(db, "job_openings", slug), { status });
}

export async function deleteRole(slug) {
  await deleteDoc(doc(db, "job_openings", slug));
}
