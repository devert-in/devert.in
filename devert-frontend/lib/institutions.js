import { auth, db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, addDoc, orderBy, runTransaction, Timestamp,
  getCountFromServer, increment, limit,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

// Case/whitespace-insensitive registry key - "21a91a0512" and "21A91A0512"
// must collide as the same roll number.
function rollNumberKey(rollNumber) {
  return (rollNumber || "").trim().toUpperCase();
}

export const ACCESS_MODES = ["public", "private", "invite_only"];
export const STUDENT_STATUSES = ["pending", "approved", "rejected", "suspended"];

// Canonical Campus Entry academic fields - shared across JoinForm/
// CampusIdentityForm, the CSV bulk-assign template, and firestore.rules'
// mirrored enum check (see that file's `students/{uid}` create rule). A
// single hardcoded list for every institution for now - "eventually
// configurable by Campus Admin" is real, but out of scope until an admin
// actually needs a department this list doesn't have.
export const DEPARTMENTS = ["CSE(AI&ML)", "CSE(DS)", "CSE(CS)", "CSE", "CSE(IT)", "MECH", "AERO", "ECE", "EEE", "CIVIL"];
export const YEARS = ["I Year", "II Year", "III Year", "IV Year"];

function slugifyClassroomPart(v) {
  return (v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Deterministic, not random - "does this classroom already exist" is just a
// doc() lookup by this key, never a query, and re-approving a student into
// the same Department+Year+Section combo is naturally idempotent (see
// ensureClassroom below). "III Year"/"CSE(AI&ML)"/"A" -> "iii-year-cse-ai-ml-a".
export function classroomKey(year, department, section) {
  return [year, department, section].map(slugifyClassroomPart).filter(Boolean).join("-");
}

// Same slugification as classroomKey - a Department entity's doc id, deterministic
// from its canonical DEPARTMENTS name so ensureDepartments() is a plain existence
// check per department, never a query. Mirrored server-side by
// AdminAccountService's private slugify() (devert-backend) - keep both in sync if
// this rule ever changes.
export function departmentKey(name) {
  return slugifyClassroomPart(name);
}

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
  await ensureDepartments(slug);
}

export async function updateInstitution(slug, data) {
  await updateDoc(doc(db, "institutions", slug), data);
}

// Fields an institution's own admin (not just platform isAdmin()) may edit -
// must exactly match firestore.rules' affectedKeys().hasOnly(...) allow-list
// for institutions/{id}, or a legitimate branding save gets rejected by the
// rules for touching a field this list doesn't know about.
export const CAMPUS_BRANDING_FIELDS = ["name", "shortName", "description", "tagline", "bannerUrl", "logoUrl", "heroAccentColor"];

export async function updateCampusBranding(slug, patch) {
  const data = {};
  for (const key of CAMPUS_BRANDING_FIELDS) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  await updateDoc(doc(db, "institutions", slug), data);
}

// Words too generic to carry meaning in an abbreviation ("Malla Reddy
// College OF Engineering AND Technology" -> MRCET, not MRCOEAT).
const INSTITUTION_NAME_STOPWORDS = new Set(["of", "and", "the", "for", "in", "&"]);

// Auto-generates a short display name (sidebar, cards, anywhere full legal
// names don't fit) when an institution admin hasn't set `shortName`
// explicitly - "Malla Reddy College of Engineering and Technology" -> MRCET,
// "Vellore Institute of Technology" -> VIT. A name that's already a single
// word (e.g. an institution already named "JNTUH") is assumed to already BE
// an abbreviation - reducing it to its own first letter would be worse than
// the full name it's supposed to shorten, so that case is returned as-is.
export function institutionInitials(name) {
  if (!name) return "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return (words[0] || "").toUpperCase();
  const meaningful = words.filter(w => !INSTITUTION_NAME_STOPWORDS.has(w.toLowerCase()));
  const source = meaningful.length ? meaningful : words;
  return source.map(w => w[0]).join("").toUpperCase().slice(0, 10);
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
export async function requestToJoin(institutionId, user, fields) {
  const uid = user.uid || user; // Fallback just in case some other code passes uid string directly
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
      name: fields.name || "", rollNumber, email: user.email || fields.email || "",
      department: fields.department || "", year: fields.year || "", section: fields.section || "",
      phone: fields.phone || "",
      photoURL: user.photoURL || "",
      emailVerified: user.emailVerified || false,
      provider: user.providerData?.[0]?.providerId || "password",
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

// Server-side count aggregate, not a full-document download - callers that
// only need the number (ManageDailyLearning's "X students" stat, the public
// Directory's per-institution student count) shouldn't pay for every
// approved student's full roster row just to read .length.
export async function fetchApprovedStudentCount(institutionId) {
  const snap = await getCountFromServer(query(collection(db, "institutions", institutionId, "students"), where("status", "==", "approved")));
  return snap.data().count;
}

// The Students management list needs approved AND suspended rows - a
// suspended student must stay visible/reactivatable, not vanish from the
// roster entirely. Deliberately a separate function from
// fetchApprovedStudents rather than widening that one's filter: its callers
// elsewhere (Daily Learning completion %, DSA cohort averages) use "approved"
// to mean "active cohort size" and suspended students shouldn't inflate or
// count toward those denominators.
export async function fetchRosterStudents(institutionId) {
  const snap = await getDocs(query(
    collection(db, "institutions", institutionId, "students"),
    where("status", "in", ["approved", "suspended"]),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Scoped counterparts to fetchRosterStudents, for HOD/Faculty callers -
// NOT just a client-side convenience. firestore.rules' students/{uid} read
// rule only grants an HOD/Faculty caller access to docs whose OWN
// department/classroomId matches their scope; a Firestore list query is
// denied in full (not silently filtered) the instant its result set would
// include even one document outside what the rule permits. The unscoped
// fetchRosterStudents() above spans every department/classroom, so calling
// it as an HOD/Faculty always PERMISSION_DENIEDs the whole query once the
// institution has more than one department/classroom - it happened to look
// like "0 students" because the caller's own .catch() silently swallowed
// that failure. Filtering with a `where` clause instead of client-side
// keeps the result set within what the rule actually allows.
export async function fetchRosterStudentsByDepartment(institutionId, department) {
  const snap = await getDocs(query(
    collection(db, "institutions", institutionId, "students"),
    where("department", "==", department),
    where("status", "in", ["approved", "suspended"]),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchRosterStudentsByClassroom(institutionId, classroomId) {
  const snap = await getDocs(query(
    collection(db, "institutions", institutionId, "students"),
    where("classroomId", "==", classroomId),
    where("status", "in", ["approved", "suspended"]),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// A classroom is pure identity metadata (department/year/section/createdAt)
// - never a place statistics get denormalized. This app has no Cloud
// Functions (blocked on the same Firebase billing gap as the coin economy -
// see CLAUDE.md), so anything that tried to keep a stored count/average in
// sync across every approve/remove/suspend/CSV-bulk-assign call site would
// drift. Student count, active-today, average progress etc. are always
// computed live from fetchApprovedStudents() results instead (same pattern
// ManageStudents already uses for its department/year filters) - see
// campus-classrooms.jsx. The transaction only writes `createdAt` the first
// time a given Department+Year+Section combo is seen; re-approving another
// student into an existing classroom is a no-op read-and-skip, not a
// clobbering overwrite of when it was first created.
export async function ensureClassroom(institutionId, { department, year, section }) {
  if (!department || !year || !section) return null;
  const key = classroomKey(year, department, section);
  const ref = doc(db, "institutions", institutionId, "classrooms", key);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) tx.set(ref, { department, year, section, createdAt: serverTimestamp() });
  });
  return key;
}

// Small, bounded collection (one doc per real Department x Year x Section
// combination an institution actually has) - no pagination needed.
export async function fetchClassrooms(institutionId) {
  const snap = await getDocs(collection(db, "institutions", institutionId, "classrooms"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchClassroom(institutionId, classroomId) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "classrooms", classroomId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Department is a small fixed enum (DEPARTMENTS, ~10 entries), unlike
// classrooms' combinatorial Department x Year x Section space - so unlike
// ensureClassroom (called lazily, per approval), every department doc is
// seeded eagerly by createInstitution(). This backfill helper covers
// institutions created before this feature existed: idempotent (only
// creates docs that don't already exist, never overwrites an existing
// hodUid), safe to call repeatedly. `hodUid` itself is never written from
// here or anywhere client-side - only AdminAccountService (devert-backend)
// ever sets it, transactionally with the matching roleAssignment.
export async function ensureDepartments(institutionId) {
  const existing = await fetchDepartments(institutionId);
  const existingKeys = new Set(existing.map(d => d.id));
  const batch = writeBatch(db);
  let wrote = false;
  for (const name of DEPARTMENTS) {
    const key = departmentKey(name);
    if (existingKeys.has(key)) continue;
    batch.set(doc(db, "institutions", institutionId, "departments", key), {
      key, name, hodUid: null, createdAt: serverTimestamp(),
    });
    wrote = true;
  }
  if (wrote) await batch.commit();
}

// Small, bounded collection (one doc per canonical department) - no
// pagination needed, same precedent as fetchClassrooms.
export async function fetchDepartments(institutionId) {
  const snap = await getDocs(collection(db, "institutions", institutionId, "departments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchDepartment(institutionId, key) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "departments", key));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Institution admins may update any field this way; an HOD may only ever
// successfully write `description` here (see firestore.rules'
// departments/{departmentKey} update rule) - `hodUid` is never client-
// writable from ANY caller, admin included (only devert-backend's
// AdminAccountService sets it, transactionally with the matching
// roleAssignment write), so it's deliberately not accepted as a patch key
// here at all.
export async function updateDepartment(institutionId, key, { description }) {
  await updateDoc(doc(db, "institutions", institutionId, "departments", key), { description });
}

// The three leaderboard scopes that actually exist today (see
// CampusLeaderboardTab in campus-app.jsx) - Contest/DSA/Programming/Custom
// leaderboards aren't real features yet, so there's nothing to gate here for
// them. `leaderboardVisibility` defaults to all-true via .get(scope, true) at
// every read site (see fetchLeaderboardVisibleScopes below) - a classroom
// with no explicit visibility map at all (every classroom before this
// feature existed) gets the "every new classroom defaults to all three
// enabled" behavior for free, no backfill migration needed.
export const LEADERBOARD_SCOPES = ["section", "department", "campus"];

export async function updateClassroomLeaderboardVisibility(institutionId, classroomId, visibility) {
  await updateDoc(doc(db, "institutions", institutionId, "classrooms", classroomId), {
    leaderboardVisibility: visibility,
  });
}

// Institution-wide leaderboard configuration - a master on/off switch, a
// per-scope enable (mirrors the classroom-level toggle, but campus-wide),
// and which stat ranks students. Lives in its own doc (not fields on the
// institution doc itself) so it doesn't need its own entry in
// CAMPUS_BRANDING_FIELDS' affectedKeys() allow-list. Missing doc = every
// default true / "score" - a brand-new institution needs no setup write to
// get working leaderboards.
//
// Score-only, deliberately a single-item list - per the Score/XP/Coins
// architecture, EVERY leaderboard ranks by Score (permanent academic
// performance) and Score alone, never XP (spendable/convertible, not a
// performance measure) or Coins. This used to be a real 3-way admin choice;
// every call site that renders a "pick your ranking metric" control from
// this array (ManageLeaderboards, ClassroomLeaderboardsTab) still works
// unchanged - it just now has exactly one option to render.
export const LEADERBOARD_METRICS = [
  { key: "score", label: "Score" },
];
const DEFAULT_LEADERBOARD_SETTINGS = { enabled: true, sectionEnabled: true, departmentEnabled: true, campusEnabled: true, rankingMetric: "score" };

export async function fetchLeaderboardSettings(institutionId) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "settings", "leaderboard"));
  // rankingMetric is forced to "score" unconditionally, not merged in from
  // whatever's persisted - any institution that picked "xp"/"credits"/
  // "problemsSolvedCount" back when LEADERBOARD_METRICS was a real 3-way
  // choice would otherwise keep ranking by that stale metric forever, since
  // a spread merge lets a persisted value silently override the default.
  // rankingMetric isn't a real per-institution choice anymore (the array
  // above has exactly one entry) - there's nothing left to respect.
  return { ...DEFAULT_LEADERBOARD_SETTINGS, ...(snap.exists() ? snap.data() : {}), rankingMetric: "score" };
}

export async function saveLeaderboardSettings(institutionId, patch) {
  await setDoc(doc(db, "institutions", institutionId, "settings", "leaderboard"), patch, { merge: true });
}

// Weekly leaderboard lock/announce state - lives at the same
// institutions/{id}/settings/{settingId} wildcard path as the leaderboard
// display config above, so no new firestore.rules match block is needed
// (the existing `settings/{settingId}` rule already covers any sibling doc
// id). `rewardConversionLocked` defaults to TRUE (locked) whenever the doc
// doesn't exist yet or the field is unset - a brand-new institution starts
// locked, not accidentally open, matching "reward conversion is locked
// until the admin announces the week" as the safe default. There is no
// Cloud Functions / scheduled job in this stack, so both lock and unlock
// are explicit admin actions (announceWeeklyLeaderboard /
// startNewLeaderboardWeek below), never automatic.
const DEFAULT_WEEKLY_LEADERBOARD_SETTINGS = { currentWeekId: null, rewardConversionLocked: true, lastAnnouncedAt: null, lastAnnouncedWeekId: null };

export async function fetchWeeklyLeaderboardSettings(institutionId) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "settings", "weeklyLeaderboard"));
  return { ...DEFAULT_WEEKLY_LEADERBOARD_SETTINGS, ...(snap.exists() ? snap.data() : {}) };
}

// Admin action: begins a fresh week and re-locks reward conversion - the
// only thing that ever re-locks conversion, since nothing runs on a
// schedule. Safe to call even if a previous week was never announced (an
// admin skipping a week entirely just means students never got that week's
// conversion window).
export async function startNewLeaderboardWeek(institutionId, weekId) {
  await setDoc(doc(db, "institutions", institutionId, "settings", "weeklyLeaderboard"), {
    currentWeekId: weekId, rewardConversionLocked: true,
  }, { merge: true });
}

// Admin action: freezes the current campus-wide ranking into an immutable
// snapshot (institutions/{id}/leaderboardSnapshots/{weekId} - a new
// precedent in this codebase; no existing "copy live state into an
// immutable dated record" pattern existed to reuse, unlike the settings
// doc above), unlocks reward conversion for this completed week, and
// notifies the institution via the same sendAnnouncement mechanism used
// for the Noticeboard (institution-admin-writable, unlike the global
// notifications/bell collection which is platform-admin-only - see that
// function's own comment). Ranking mirrors CampusLeaderboardTab's own query
// shape (campus-app.jsx) - institutionId + score, descending - so the
// snapshot's ordering matches exactly what students already see live.
export async function announceWeeklyLeaderboard(institutionId, weekId, authorUid) {
  const snap = await getDocs(query(
    collection(db, "users"),
    where("institutionId", "==", institutionId),
    orderBy("score", "desc"),
    limit(100),
  ));
  const rows = snap.docs.map((d, i) => {
    const data = d.data();
    return {
      uid: d.id, rank: i + 1,
      displayName: data.campusFullName || data.displayName || data.handle || "Student",
      rollNumber: data.rollNumber || null, department: data.department || null,
      year: data.year || null, section: data.section || null,
      score: data.score || 0, xp: data.xp || 0,
    };
  });

  await setDoc(doc(db, "institutions", institutionId, "leaderboardSnapshots", weekId), {
    weekId, institutionId, announcedAt: serverTimestamp(), announcedBy: authorUid, rows,
  });
  await setDoc(doc(db, "institutions", institutionId, "settings", "weeklyLeaderboard"), {
    rewardConversionLocked: false, lastAnnouncedAt: serverTimestamp(), lastAnnouncedWeekId: weekId,
  }, { merge: true });
  await sendAnnouncement(institutionId, {
    title: "Weekly Campus Leaderboard Announced",
    message: `This week's leaderboard has been finalized. Reward conversion (XP -> Coins -> Wallet) is now unlocked for this week - check the Leaderboard tab to see your rank, XP, and coins.`,
  }, authorUid);
  return rows;
}

export async function fetchLeaderboardSnapshot(institutionId, weekId) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "leaderboardSnapshots", weekId));
  return snap.exists() ? snap.data() : null;
}

// Classroom-level module access - which of these six real, campus-relevant
// modules a specific classroom's students can currently reach. Stored as a
// map on the classroom doc itself (institutions/{id}/classrooms/{classroomId}.
// moduleAccess), keyed by classroomId per the roster's own denormalized
// classroomId field - never by plain-text department/year/section, so a
// later identity correction that changes those fields doesn't orphan the
// permission. A module key absent from the map (every classroom before this
// feature existed, or after resetClassroomModuleAccess) defaults to enabled -
// "new classrooms/modules start open, admins opt into restricting them", not
// the other way around, so nothing regresses for an institution that never
// touches this feature.
//
// Two of these six (contests, dailyLearning) are also enforced in
// firestore.rules, not just here - their write paths are real client
// Firestore writes gated by institution scoping already, so classroom
// scoping layers on cleanly. Programming/CS Core/DSA/Company Vault are
// global, publicly-readable catalogs by design (see lib/programming.js et
// al.'s own comments) - they were never institution-gated at the data layer
// to begin with, so this toggle is a navigation/UX gate for those four
// (hide the tab, block the in-app route), not a new content-read boundary.
export const MODULES = [
  { key: "dailyLearning", label: "Daily Learning" },
  { key: "programming", label: "Programming" },
  { key: "csCore", label: "CS Core" },
  { key: "aptitude", label: "Aptitude" },
  // GATE, like Programming/CS Core/DSA/Company Vault, is a global
  // publicly-readable catalog - so this toggle is a navigation/UX gate for it
  // (hide the tab, block the in-app route), not a content-read boundary. See
  // the comment above and firestore.rules' gatePapers block.
  { key: "gate", label: "GATE Preparation" },
  { key: "dsa", label: "DSA / Practice" },
  { key: "companyPrep", label: "Company Vault" },
  { key: "contests", label: "Contests" },
];

export function isModuleEnabledForClassroom(classroom, moduleKey) {
  return classroom?.moduleAccess?.[moduleKey] !== false;
}

export async function setClassroomModuleAccess(institutionId, classroomId, moduleKey, enabled) {
  await updateDoc(doc(db, "institutions", institutionId, "classrooms", classroomId), {
    [`moduleAccess.${moduleKey}`]: enabled,
  });
}

// Clears this one module's override (not the whole map) back to "no
// override" - isModuleEnabledForClassroom then falls through to its default
// (enabled), same as never having touched this classroom's access at all.
export async function resetClassroomModuleAccess(institutionId, classroomId, moduleKey) {
  await updateDoc(doc(db, "institutions", institutionId, "classrooms", classroomId), {
    [`moduleAccess.${moduleKey}`]: deleteField(),
  });
}

export async function copyClassroomModuleAccess(institutionId, fromClassroomId, toClassroomId, moduleKey) {
  const from = await fetchClassroom(institutionId, fromClassroomId);
  await setClassroomModuleAccess(institutionId, toClassroomId, moduleKey, isModuleEnabledForClassroom(from, moduleKey));
}

// One module, every classroom, in a single batch - "Enable All"/"Disable
// All" from a module's Manage Access view. Small, bounded collection (see
// fetchClassrooms), so one batch covers even a large campus.
export async function bulkSetModuleAccess(institutionId, moduleKey, enabled) {
  const classrooms = await fetchClassrooms(institutionId);
  const batch = writeBatch(db);
  classrooms.forEach(c => {
    batch.update(doc(db, "institutions", institutionId, "classrooms", c.id), { [`moduleAccess.${moduleKey}`]: enabled });
  });
  await batch.commit();
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
// classroomId is stamped on both docs whenever all three academic fields are
// present, and the classroom itself is auto-created (see ensureClassroom) -
// no admin ever creates one by hand.
export async function approveStudent(institutionId, uid, assignment = {}) {
  const classroomId = await ensureClassroom(institutionId, assignment);

  // wasAlreadyApproved is re-read INSIDE the transaction, not via a plain
  // getDoc() beforehand - two near-simultaneous approveStudent calls (e.g.
  // an admin double-clicking Approve, or two admins acting on the same
  // request) used to both read "not yet approved" before either write
  // landed, double-incrementing institutions/{id}.studentCount. Firestore
  // now retries this callback if the roster doc changes underneath it.
  await runTransaction(db, async (tx) => {
    const rosterRef = doc(db, "institutions", institutionId, "students", uid);
    const rosterSnap = await tx.get(rosterRef);
    const roster = rosterSnap.exists() ? rosterSnap.data() : {};
    const wasAlreadyApproved = roster.status === "approved";

    tx.update(rosterRef, {
      status: "approved", reviewedAt: serverTimestamp(),
      ...(assignment.department ? { department: assignment.department } : {}),
      ...(assignment.year ? { year: assignment.year } : {}),
      ...(assignment.section ? { section: assignment.section } : {}),
      ...(classroomId ? { classroomId } : {}),
    });
    tx.update(doc(db, "users", uid), {
      institutionId, institutionSlug: institutionId,
      department: assignment.department || "", year: assignment.year || "", section: assignment.section || "",
      rollNumber: roster.rollNumber || "", campusFullName: roster.name || "",
      ...(classroomId ? { classroomId } : {}),
    });
    // Keeps the Directory's public student-count stat live - only bumped on
    // a genuine pending/suspended -> approved transition, never on a
    // re-approval (e.g. an admin just reassigning department/section on
    // someone already approved), so it can't be inflated by repeat calls.
    if (!wasAlreadyApproved) tx.update(doc(db, "institutions", institutionId), { studentCount: increment(1) });
  });
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

  // Resolved outside the transaction below, only when department/year/section
  // are actually among the edited fields - ensureClassroom runs its own
  // transaction, and Firestore doesn't support nesting one inside another.
  // This is the "manually re-assign a classroom via the identity-edit flow"
  // path for a student who predates classrooms existing, or who transferred
  // section/department/year after already being approved.
  let classroomId;
  if (changes.department !== undefined || changes.year !== undefined || changes.section !== undefined) {
    const preSnap = await getDoc(rosterRef);
    const pre = preSnap.exists() ? preSnap.data() : {};
    classroomId = await ensureClassroom(institutionId, {
      department: changes.department !== undefined ? changes.department : pre.department,
      year: changes.year !== undefined ? changes.year : pre.year,
      section: changes.section !== undefined ? changes.section : pre.section,
    });
  }

  await runTransaction(db, async (tx) => {
    const rosterSnap = await tx.get(rosterRef);
    const current = rosterSnap.exists() ? rosterSnap.data() : {};

    const auditEntries = [];
    const patch = {};
    for (const field of ["name", "rollNumber", "department", "year", "section"]) {
      if (changes[field] !== undefined && changes[field] !== current[field]) {
        patch[field] = changes[field];
        auditEntries.push({
          field, oldValue: current[field] || "", newValue: changes[field],
          editedBy: editedByUid, editedAt: new Date().toISOString(),
        });
      }
    }
    if (auditEntries.length === 0) return;
    if (classroomId) patch.classroomId = classroomId;

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
        ...(patch.department !== undefined ? { department: patch.department } : {}),
        ...(patch.year !== undefined ? { year: patch.year } : {}),
        ...(patch.section !== undefined ? { section: patch.section } : {}),
        ...(patch.classroomId !== undefined ? { classroomId: patch.classroomId } : {}),
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
  // wasApproved is re-read INSIDE the transaction - suspending twice in a
  // row (double-click, two admin tabs) used to unconditionally decrement
  // studentCount both times with no guard at all, unlike approveStudent/
  // removeStudentFromInstitution which at least checked a (stale) snapshot.
  await runTransaction(db, async (tx) => {
    const rosterRef = doc(db, "institutions", institutionId, "students", uid);
    const rosterSnap = await tx.get(rosterRef);
    const wasApproved = rosterSnap.exists() && rosterSnap.data().status === "approved";

    tx.update(rosterRef, { status: "suspended", reviewedAt: serverTimestamp() });
    // Suspended students no longer count toward the Directory's public
    // "active students" stat - approveStudent adds them back if reinstated.
    // Only decrement if they were actually counted (i.e. really approved) -
    // otherwise repeat/no-op suspends would drive this negative.
    if (wasApproved) tx.update(doc(db, "institutions", institutionId), { studentCount: increment(-1) });
    // Clears the SAME denormalized institutionId/department/year/section
    // fields removeStudentFromInstitution clears - without this, a suspended
    // student (including one caught cheating) kept their full rank on every
    // campus/department/section leaderboard indefinitely, since every
    // leaderboard query filters on these users/{uid} fields, not the roster
    // doc's status. rollNumber/campusFullName/classroomId are deliberately
    // left alone (unlike removal) - suspension is reversible, and
    // approveStudent re-supplies fresh department/year/section on
    // reinstatement regardless, so nothing here needs to survive for that to
    // work correctly.
    tx.update(doc(db, "users", uid), {
      institutionId: "", institutionSlug: "", department: "", year: "", section: "",
    });
  });
}

// Narrower than suspend - blocks contest registration/reads only (see
// isApprovedForContest in firestore.rules), leaves daily learning/DSA/
// company vault access untouched. For e.g. a student caught cheating in one
// contest, without cutting off the rest of their placement prep.
export async function setContestRestriction(institutionId, uid, restricted) {
  await updateDoc(doc(db, "institutions", institutionId, "students", uid), {
    contestRestricted: restricted,
  });
}

// Permanent removal, distinct from suspendStudent (reversible, keeps the
// roster record). Deletes the roster doc and releases their roll number back
// to the registry (same as rejectStudent) - a removed student's roll number
// must be claimable again if they (or an admin) re-request access. Also
// clears the denormalized institution fields on users/{uid} so they stop
// appearing on leaderboards/contest rosters immediately, without touching
// their account, XP, or coins - this ends institution *membership*, not the
// user's platform identity.
export async function removeStudentFromInstitution(institutionId, uid) {
  // roster.status is re-read INSIDE the transaction - a plain getDoc()
  // beforehand could race a concurrent suspendStudent() call (both reading
  // "approved" before either write lands), double-decrementing studentCount.
  await runTransaction(db, async (tx) => {
    const rosterRef = doc(db, "institutions", institutionId, "students", uid);
    const rosterSnap = await tx.get(rosterRef);
    const roster = rosterSnap.exists() ? rosterSnap.data() : {};
    const key = rollNumberKey(roster.rollNumber || "");

    tx.delete(rosterRef);
    if (key) tx.delete(doc(db, "institutions", institutionId, "rollNumberRegistry", key));
    // All 8 denormalized fields, not just 6 - campusFullName/classroomId were
    // previously left behind, so a removed-then-elsewhere-re-approved student
    // (or a stale reference in old contest/leaderboard views) could show a
    // stale display name next to a blanked roll number forever.
    tx.update(doc(db, "users", uid), {
      institutionId: "", institutionSlug: "", department: "", year: "", section: "", rollNumber: "",
      campusFullName: "", classroomId: "",
    });
    // Only decrement the Directory's public student-count stat if they were
    // actually counted in it - a pending/rejected/already-suspended removal
    // never incremented it (or already decremented it at suspend time).
    if (roster.status === "approved") tx.update(doc(db, "institutions", institutionId), { studentCount: increment(-1) });
  });
}

// Real Firebase Auth capability, not a campus-scoped roster field - sends
// the standard "reset your password" email to whatever address the roster
// has on file. Requires that address to actually be the student's Auth
// account email (Google sign-in accounts can still use this - Firebase lets
// a password be set on an account that originally had none).
export async function sendStudentPasswordReset(email) {
  if (!email) throw new Error("This student has no email on file.");
  await sendPasswordResetEmail(auth, email);
}

export async function addInstitutionAdmin(institutionId, uid, role) {
  await setDoc(doc(db, "institutions", institutionId, "admins", uid), {
    uid, role, addedAt: serverTimestamp(),
  });
}

// Small, bounded collection (an institution has a handful of admins, not
// thousands) - each doc is just {uid, role, addedAt}, no handle/displayName
// denormalized onto it, so callers that want something human-readable
// resolve uid -> users/{uid} themselves (see InstitutionsPanel in
// app/admin/page.jsx).
export async function fetchInstitutionAdmins(institutionId) {
  const snap = await getDocs(collection(db, "institutions", institutionId, "admins"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Same isAdmin()-only authority as addInstitutionAdmin (see firestore.rules'
// institutions/{id}/admins/{uid} write rule) - granting/revoking campus admin
// access is a platform-admin action from this console, not something an
// institution admin can do to a peer.
export async function removeInstitutionAdmin(institutionId, uid) {
  await deleteDoc(doc(db, "institutions", institutionId, "admins", uid));
}

export async function fetchMyInstitutionAdminRole(institutionId, uid) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "admins", uid));
  return snap.exists() ? snap.data() : null;
}

// Principal/HOD/Faculty-Class-Teacher membership - a SEPARATE collection
// from admins/{uid} (see firestore.rules' isPrincipal()/isHodOfDepartment()/
// isFacultyOfClassroom()), never client-writable (every write to this
// collection goes through devert-backend's AdminAccountService - see
// lib/staffAccounts.js). Read-only helpers here mirror
// fetchMyInstitutionAdminRole's exact shape.
export async function fetchMyRoleAssignment(institutionId, uid) {
  const snap = await getDoc(doc(db, "institutions", institutionId, "roleAssignments", uid));
  return snap.exists() ? snap.data() : null;
}

// Manage Admins' Principal/HOD/Faculty tabs each list a role-filtered slice
// of this - small, bounded collection (one doc per staff account an
// institution actually has), no pagination needed, same precedent as
// fetchInstitutionAdmins.
export async function fetchRoleAssignments(institutionId) {
  const snap = await getDocs(collection(db, "institutions", institutionId, "roleAssignments"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// system/rolePermissionDefaults - the "new role = configuration, not
// redesign" doc (see lib/permissions.js's own comment and
// scripts/seed-role-permission-defaults.mjs). Falls back to
// FALLBACK_ROLE_PERMISSIONS if the doc is missing/unreadable so a brand-new
// or offline institution never crashes - just shows nothing gated, the safe
// default direction (rules-level enforcement is the real boundary, this is
// only ever a client-side merge for UI gating).
export async function fetchRolePermissionDefaults() {
  const snap = await getDoc(doc(db, "system", "rolePermissionDefaults"));
  return snap.exists() ? snap.data() : null;
}

// Manage Admins' Access Logs tab - written only by devert-backend's
// AdminAccountService (every create/status/reset-password/permissions call),
// read directly via the client SDK like any other institution-scoped
// collection (rules-gated to isInstitutionAdmin()/isAdmin(), see
// firestore.rules) - no backend listing endpoint needed for this, same
// "backend only for the privileged WRITE, plain client read otherwise"
// split as roleAssignments itself.
export async function fetchAdminActivityLog(institutionId, limitCount = 100) {
  const snap = await getDocs(query(
    collection(db, "institutions", institutionId, "adminActivityLog"),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  // rollNumberKey() on BOTH sides - every OTHER roll-number comparison in
  // this file (requestToJoin's duplicate check, rejectStudent,
  // updateStudentIdentity, removeStudentFromInstitution) already goes
  // through this same normalization so "21a91a0512"/"21A91A0512" collide as
  // one roll number. This match was the one place still doing a raw exact-
  // string match - a student who typed their own roll number in a different
  // casing than the admin's CSV silently failed to match and was reported
  // as an ordinary "unmatched" row, when they had in fact already requested
  // access.
  const byRoll = new Map(pending.map(s => [rollNumberKey(s.rollNumber), s]));
  const matches = rows.map(row => ({ row, student: byRoll.get(rollNumberKey(row.rollNumber)) })).filter(m => m.student);

  // One ensureClassroom call per DISTINCT combo, not per row - a CSV
  // typically has dozens of students landing in the same handful of
  // classrooms, and ensureClassroom's transaction is a real round trip.
  const classroomIdByCombo = new Map();
  for (const { row } of matches) {
    const combo = `${row.year}|${row.department}|${row.section}`;
    if (!classroomIdByCombo.has(combo)) {
      classroomIdByCombo.set(combo, await ensureClassroom(institutionId, row));
    }
  }

  // Each chunk runs as a transaction, not a blind batch - matches was built
  // from ONE stale fetchPendingStudents() snapshot taken before this whole
  // (potentially slow, multi-chunk) import started. A plain batch.update()
  // trusted that snapshot for the entire operation: a student rejected or
  // removed by an admin mid-import (a side-channel rejectStudent()/
  // removeStudentFromInstitution() call while this loop is still running)
  // would either get silently re-approved (update() has no idea the roster
  // doc's status changed) or, worse, make the ENTIRE chunk fail with
  // NOT_FOUND if the doc was deleted, silently dropping every OTHER
  // legitimate approval in that same chunk. Re-reading each roster doc's
  // live status inside the transaction, immediately before deciding to
  // write, closes both holes at once.
  const CHUNK = 200;
  let approvedCount = 0;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK);
    await runTransaction(db, async (tx) => {
      const rosterRefs = chunk.map(({ student }) => doc(db, "institutions", institutionId, "students", student.uid));
      const rosterSnaps = await Promise.all(rosterRefs.map(ref => tx.get(ref)));
      const stillPending = chunk.filter((_, idx) => rosterSnaps[idx].exists() && rosterSnaps[idx].data().status === "pending");

      stillPending.forEach(({ row, student }) => {
        const classroomId = classroomIdByCombo.get(`${row.year}|${row.department}|${row.section}`);
        tx.update(doc(db, "institutions", institutionId, "students", student.uid), {
          status: "approved", reviewedAt: serverTimestamp(),
          department: row.department || "", year: row.year || "", section: row.section || "",
          ...(classroomId ? { classroomId } : {}),
        });
        tx.update(doc(db, "users", student.uid), {
          institutionId, institutionSlug: institutionId,
          department: row.department || "", year: row.year || "", section: row.section || "",
          rollNumber: student.rollNumber || "", campusFullName: student.name || "",
          ...(classroomId ? { classroomId } : {}),
        });
      });
      if (stillPending.length) tx.update(doc(db, "institutions", institutionId), { studentCount: increment(stillPending.length) });
      approvedCount += stillPending.length;
    });
  }
  return { matched: approvedCount, total: rows.length };
}

// Student Management's "send announcements to selected students" - an empty/
// omitted targetUids means institution-wide broadcast (firestore.rules
// treats size()==0 the same as absent); a non-empty list scopes read access
// to exactly those students (plus admins) - see the announcements match block.
// scheduledFor/expiresAt are both optional plain Date objects (or null/undefined
// for "immediately" / "never expires") - stored as Firestore Timestamps so
// isAnnouncementActive() (below) can compare against `new Date()` client-side
// without needing a server-side scheduled function (none exists yet - see
// CLAUDE.md's Cloud Functions billing note).
export async function sendAnnouncement(institutionId, { title, message, targetUids = [], scheduledFor, expiresAt }, authorUid) {
  await addDoc(collection(db, "institutions", institutionId, "announcements"), {
    title, message, targetUids, authorUid, createdAt: serverTimestamp(),
    scheduledFor: scheduledFor ? Timestamp.fromDate(new Date(scheduledFor)) : null,
    expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
  });
}

export async function deleteAnnouncement(institutionId, announcementId) {
  await deleteDoc(doc(db, "institutions", institutionId, "announcements", announcementId));
}

// Used by both the admin's full list (that role reads everything, per the
// rules' isInstitutionAdmin() branch) and a student's own feed (the rules'
// per-document targetUids check silently omits announcements scoped to
// someone else - same list()-filters-per-candidate pattern as fetchInstitutions()).
// Returns EVERY announcement including scheduled-but-not-yet-live and expired
// ones - Manage's list needs to show/manage those too. Student-facing surfaces
// (Overview's Noticeboard) filter with isAnnouncementActive() at render time.
export async function fetchAnnouncements(institutionId) {
  const snap = await getDocs(query(collection(db, "institutions", institutionId, "announcements"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// "Active" = already started (no scheduledFor, or scheduledFor <= now) AND
// not yet expired (no expiresAt, or expiresAt > now). Pure function so both
// the student-facing feed and Manage's status badges compute the same thing.
export function isAnnouncementActive(a, now = new Date()) {
  const startsAt = a.scheduledFor?.toDate ? a.scheduledFor.toDate() : null;
  const endsAt = a.expiresAt?.toDate ? a.expiresAt.toDate() : null;
  if (startsAt && now < startsAt) return false;
  if (endsAt && now >= endsAt) return false;
  return true;
}

export function announcementStatus(a, now = new Date()) {
  const startsAt = a.scheduledFor?.toDate ? a.scheduledFor.toDate() : null;
  const endsAt = a.expiresAt?.toDate ? a.expiresAt.toDate() : null;
  if (startsAt && now < startsAt) return "scheduled";
  if (endsAt && now >= endsAt) return "expired";
  return "active";
}
