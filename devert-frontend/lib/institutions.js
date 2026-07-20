import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, addDoc, orderBy, runTransaction,
} from "firebase/firestore";

// Case/whitespace-insensitive registry key - "21a91a0512" and "21A91A0512"
// must collide as the same roll number.
function rollNumberKey(rollNumber) {
  return (rollNumber || "").trim().toUpperCase();
}

export const ACCESS_MODES = ["public", "private", "invite_only"];
export const STUDENT_STATUSES = ["pending", "approved", "rejected", "suspended"];

// institutionId IS the slug (institutions/{slug}) - no separate slug->id lookup
// query needed, and it's what /campus/[slug] resolves directly via usePathname().
export async function createInstitution(slug, data) {
  await setDoc(doc(db, "institutions", slug), {
    slug, name: "", logoUrl: "", bannerUrl: "", description: "", website: "",
    location: "", placementOfficerName: "", placementOfficerEmail: "",
    departments: [], academicYear: "", contactEmail: "", contactPhone: "",
    accessMode: "public", status: "active", studentCount: 0,
    createdAt: serverTimestamp(),
    ...data,
  });
}

export async function updateInstitution(slug, data) {
  await updateDoc(doc(db, "institutions", slug), data);
}

// "Save this Campus" - a plain array of institution slugs on the user's own
// profile doc, same owner-writes-their-own-field pattern as any other
// self-editable users/{uid} field (firestore.rules only blocks the specific
// institutionId/department/year/section membership fields from self-edit,
// not arbitrary new ones like this).
export async function toggleFavoriteInstitution(uid, slug, currentlyFavorited) {
  await updateDoc(doc(db, "users", uid), {
    favoriteInstitutions: currentlyFavorited ? arrayRemove(slug) : arrayUnion(slug),
  });
}

// "private" institutions are deliberately excluded via a `where` clause, not
// a client-side .filter() after the fact - firestore.rules' matching read
// rule (`accessMode != 'private'`) can only be proven safe for a `list()`
// query whose own filter already guarantees that, the same way
// fetchPublishedContests()/fetchPublishedCompanies() filter server-side. A
// plain unfiltered query here would return private institutions' data over
// the wire before any client-side filtering ran - not a real security
// boundary, since firestore.rules is the actual authority. Institutions
// created before accessMode existed (or edited outside createInstitution)
// have no accessMode field at all and won't match this `in` filter either -
// same one-time backfill needed as any other retrofitted field.
export async function fetchInstitutions() {
  const snap = await getDocs(query(
    collection(db, "institutions"),
    where("status", "==", "active"),
    where("accessMode", "in", ["public", "invite_only"]),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchInstitution(slug) {
  const snap = await getDoc(doc(db, "institutions", slug));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchMyMembership(institutionId, uid) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "students", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// The join request AND the roster record are the same document (see
// firestore.rules) - creating it at status "pending" IS the request.
//
// Duplicate roll numbers are rejected via a small side registry
// (institutions/{id}/rollNumberRegistry/{normalizedRollNumber} -> {uid}),
// not a query over `students` - a not-yet-approved applicant can only read
// their OWN student doc (see firestore.rules), so there's no permission to
// run a "does anyone else have this roll number" query against the roster
// directly, and opening that up would mean any signed-in stranger could
// enumerate the whole roster. The registry doc exposes only "taken or not"
// by a known key, never who. Wrapped in a transaction so two applicants
// racing to claim the same roll number can't both succeed.
export async function requestToJoin(institutionId, uid, fields) {
  const rollNumber = (fields.rollNumber || "").trim();
  const key = rollNumberKey(rollNumber);
  const studentRef = doc(db, "institutions", institutionId, "students", uid);
  const regRef = key ? doc(db, "institutions", institutionId, "rollNumberRegistry", key) : null;

  await runTransaction(db, async (tx) => {
    if (regRef) {
      const regSnap = await tx.get(regRef);
      if (regSnap.exists() && regSnap.data().uid !== uid) {
        throw new Error("This roll number already exists. Contact your campus admin.");
      }
    }
    tx.set(studentRef, {
      uid, status: "pending", requestedAt: serverTimestamp(),
      name: fields.name || "", rollNumber, email: fields.email || "",
      department: fields.department || "", year: fields.year || "", section: fields.section || "",
      phone: fields.phone || "",
    });
    if (regRef) tx.set(regRef, { uid, rollNumber, claimedAt: serverTimestamp() });
  });
}

export async function fetchPendingStudents(institutionId) {
  const snap = await getDocs(query(collection(db, "institutions", institutionId, "students"), where("status", "==", "pending")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchApprovedStudents(institutionId) {
  const snap = await getDocs(query(collection(db, "institutions", institutionId, "students"), where("status", "==", "approved")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Approving writes BOTH the roster record (authoritative, under this
// institution) and a denormalized copy on users/{uid} (what leaderboard
// queries actually filter/order on - see firestore.indexes.json) - batched so
// a partial failure can't leave those two out of sync. rollNumber and the
// campus-specific full name are read off the roster doc itself (already
// captured at submission time by JoinForm/CampusIdentityForm) and copied over
// so leaderboards/contest results/reports can show "Name (Roll Number)"
// instead of the global @handle - see CampusLeaderboardTab, fetchLeaderboard.
// Like institutionId/department/year/section, this is a flat overwritable
// field on users/{uid} (one active campus identity at a time), not a map
// keyed by institution - consistent with the existing denormalization shape.
export async function approveStudent(institutionId, uid, assignment = {}) {
  const rosterSnap = await getDoc(doc(db, "institutions", institutionId, "students", uid));
  const roster = rosterSnap.exists() ? rosterSnap.data() : {};

  const batch = writeBatch(db);
  batch.update(doc(db, "institutions", institutionId, "students", uid), {
    status: "approved", reviewedAt: serverTimestamp(),
    ...(assignment.department ? { department: assignment.department } : {}),
    ...(assignment.year ? { year: assignment.year } : {}),
    ...(assignment.section ? { section: assignment.section } : {}),
  });
  batch.update(doc(db, "users", uid), {
    institutionId, institutionSlug: institutionId,
    department: assignment.department || "", year: assignment.year || "", section: assignment.section || "",
    rollNumber: roster.rollNumber || "", campusFullName: roster.name || "",
  });
  await batch.commit();
}

// Admin-only correction path for an already-submitted identity (the Roll
// Number Lock means the student themselves can never reach this - see
// firestore.rules). Every call appends a structured entry to
// identityAuditLog (field/old/new/who/when) in the SAME write as the
// correction, and mirrors the change onto users/{uid} if the student is
// already approved (unapproved/pending students have no denormalized copy
// yet - approveStudent will pick up the corrected values when they're
// eventually approved).
export async function updateStudentIdentity(institutionId, uid, changes, editedByUid) {
  const rosterRef = doc(db, "institutions", institutionId, "students", uid);

  await runTransaction(db, async (tx) => {
    const rosterSnap = await tx.get(rosterRef);
    const current = rosterSnap.exists() ? rosterSnap.data() : {};

    const auditEntries = [];
    const patch = {};
    for (const field of ["name", "rollNumber"]) {
      if (changes[field] !== undefined && changes[field] !== current[field]) {
        patch[field] = changes[field];
        auditEntries.push({
          field, oldValue: current[field] || "", newValue: changes[field],
          editedBy: editedByUid, editedAt: new Date().toISOString(),
        });
      }
    }
    if (auditEntries.length === 0) return;

    // Re-point the roll-number registry too, so a corrected/reassigned roll
    // number is duplicate-checked against everyone else and the old value
    // becomes claimable again - reads happen before any writes below,
    // since Firestore transactions require every get() first.
    let newRegRef = null, oldRegRef = null;
    if (patch.rollNumber !== undefined) {
      const newKey = rollNumberKey(patch.rollNumber);
      const oldKey = rollNumberKey(current.rollNumber);
      if (newKey && newKey !== oldKey) {
        newRegRef = doc(db, "institutions", institutionId, "rollNumberRegistry", newKey);
        const newRegSnap = await tx.get(newRegRef);
        if (newRegSnap.exists() && newRegSnap.data().uid !== uid) {
          throw new Error("This roll number already exists. Contact your campus admin.");
        }
        if (oldKey) oldRegRef = doc(db, "institutions", institutionId, "rollNumberRegistry", oldKey);
      }
    }

    tx.update(rosterRef, { ...patch, identityAuditLog: arrayUnion(...auditEntries) });
    if (current.status === "approved") {
      tx.update(doc(db, "users", uid), {
        ...(patch.rollNumber !== undefined ? { rollNumber: patch.rollNumber } : {}),
        ...(patch.name !== undefined ? { campusFullName: patch.name } : {}),
      });
    }
    if (newRegRef) tx.set(newRegRef, { uid, rollNumber: patch.rollNumber, claimedAt: serverTimestamp() });
    if (oldRegRef) tx.delete(oldRegRef);
  });
}

// Releases the claimed roll number back to the registry on rejection - a
// declined applicant (wrong roll number, duplicate/fraudulent entry, etc.)
// should never permanently block that roll number for its real owner.
export async function rejectStudent(institutionId, uid, reason) {
  const rosterRef = doc(db, "institutions", institutionId, "students", uid);
  const rosterSnap = await getDoc(rosterRef);
  const key = rollNumberKey(rosterSnap.exists() ? rosterSnap.data().rollNumber : "");

  const batch = writeBatch(db);
  batch.update(rosterRef, { status: "rejected", reviewedAt: serverTimestamp(), rejectionReason: reason || "" });
  if (key) batch.delete(doc(db, "institutions", institutionId, "rollNumberRegistry", key));
  await batch.commit();
}

export async function suspendStudent(institutionId, uid) {
  await updateDoc(doc(db, "institutions", institutionId, "students", uid), {
    status: "suspended", reviewedAt: serverTimestamp(),
  });
}

export async function addInstitutionAdmin(institutionId, uid, role) {
  await setDoc(doc(db, "institutions", institutionId, "admins", uid), {
    uid, role, addedAt: serverTimestamp(),
  });
}

export async function fetchMyInstitutionAdminRole(institutionId, uid) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "admins", uid));
  return snap.exists() ? snap.data() : null;
}

// Bulk CSV import matches EXISTING join requests by rollNumber and
// bulk-approves + assigns department/year/section in one pass - it can't
// invite students who've never signed up. firestore.rules requires a
// student's own uid to create their pending doc (an admin-writable "invite"
// path would let a college silently enroll someone who never asked), and
// mapping an email to a not-yet-known uid isn't possible client-side without
// a Cloud Function - blocked on the same Cloud Functions billing gap as the
// coin economy (see CLAUDE.md). Chunked at 200 rows/batch to stay under
// Firestore's 500-writes-per-batch limit (2 writes per matched row).
export async function bulkAssignByRollNumber(institutionId, rows) {
  const pending = await fetchPendingStudents(institutionId);
  const byRoll = new Map(pending.map(s => [s.rollNumber, s]));
  const matches = rows.map(row => ({ row, student: byRoll.get(row.rollNumber) })).filter(m => m.student);

  const CHUNK = 200;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const { row, student } of matches.slice(i, i + CHUNK)) {
      batch.update(doc(db, "institutions", institutionId, "students", student.uid), {
        status: "approved", reviewedAt: serverTimestamp(),
        department: row.department || "", year: row.year || "", section: row.section || "",
      });
      batch.update(doc(db, "users", student.uid), {
        institutionId, institutionSlug: institutionId,
        department: row.department || "", year: row.year || "", section: row.section || "",
        rollNumber: student.rollNumber || "", campusFullName: student.name || "",
      });
    }
    await batch.commit();
  }
  return { matched: matches.length, total: rows.length };
}

// Student Management's "send announcements to selected students" - an empty/
// omitted targetUids means institution-wide broadcast (firestore.rules
// treats size()==0 the same as absent); a non-empty list scopes read access
// to exactly those students (plus admins) - see the announcements match block.
export async function sendAnnouncement(institutionId, { title, message, targetUids = [] }, authorUid) {
  await addDoc(collection(db, "institutions", institutionId, "announcements"), {
    title, message, targetUids, authorUid, createdAt: serverTimestamp(),
  });
}

// Used by both the admin's full list (that role reads everything, per the
// rules' isInstitutionAdmin() branch) and a student's own feed (the rules'
// per-document targetUids check silently omits announcements scoped to
// someone else - same list()-filters-per-candidate pattern as fetchInstitutions()).
export async function fetchAnnouncements(institutionId) {
  const snap = await getDocs(query(collection(db, "institutions", institutionId, "announcements"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
