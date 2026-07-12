// Firestore data layer for the Placements Prep module (design §9).
// Every helper throws a plain Error with a readable message on failure.
// Reads retry transient errors with backoff; queries stick to the composite
// indexes declared in firestore.indexes.json (extra sorting happens client-side).

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const ROLL_RE = /^[A-Z0-9]{6,14}$/;
const BATCH_LIMIT = 450; // headroom under Firestore's 500-write batch cap
export const DEFAULT_PISTON_URL = "https://emkc.org/api/v2/piston";

// ── internals ──────────────────────────────────────────────────────────────

function fail(message, err) {
  const detail = err && (err.code || err.message);
  throw new Error(detail ? `${message} (${detail})` : message);
}

const RETRYABLE = new Set(["unavailable", "deadline-exceeded", "resource-exhausted", "aborted"]);

async function withRetry(fn, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE.has(err && err.code)) throw err;
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
  }
  throw lastErr;
}

const snapToObj = (snap) => ({ id: snap.id, ...snap.data() });

function toTimestamp(v) {
  if (v == null) return null;
  if (v instanceof Timestamp) return v;
  if (v instanceof Date) return Timestamp.fromDate(v);
  if (typeof v === "number") return Timestamp.fromMillis(v);
  if (typeof v.toDate === "function") return v; // already Timestamp-like
  return Timestamp.fromDate(new Date(v));
}

// ── dates ──────────────────────────────────────────────────────────────────

/** yyyy-mm-dd for the given instant, in Asia/Kolkata. */
export function dateKey(d = new Date()) {
  try {
    // en-CA formats as yyyy-mm-dd
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** yyyy-mm-dd of yesterday in Asia/Kolkata (IST has no DST, so -24h is exact). */
export function yesterdayKey() {
  return dateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

// ── questions ──────────────────────────────────────────────────────────────

export async function getQuestions({ category, topic, difficulty, type, max = 100 } = {}) {
  try {
    const clauses = [];
    if (category) clauses.push(where("category", "==", category));
    if (topic) clauses.push(where("topic", "==", topic));
    if (difficulty) clauses.push(where("difficulty", "==", difficulty));
    if (type) clauses.push(where("type", "==", type));
    // orderBy(createdAt) is only index-backed for no-filter and the exact
    // (category, difficulty) combination — other mixes sort client-side.
    // (An index prefix cannot skip its middle field.)
    const canOrder =
      !topic && !type && ((!!category && !!difficulty) || (!category && !difficulty));
    if (canOrder) clauses.push(orderBy("createdAt", "desc"));
    clauses.push(limit(max));
    const snap = await withRetry(() => getDocs(query(collection(db, "prepQuestions"), ...clauses)));
    const rows = snap.docs.map(snapToObj);
    if (!canOrder) {
      rows.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    return rows;
  } catch (err) {
    fail("Failed to load questions", err);
  }
}

export async function getQuestion(qid) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepQuestions", qid)));
    return snap.exists() ? snapToObj(snap) : null;
  } catch (err) {
    fail("Failed to load question", err);
  }
}

export async function addQuestion(data, createdBy) {
  try {
    const ref = await addDoc(collection(db, "prepQuestions"), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: createdBy || data.createdBy || null,
    });
    return ref.id;
  } catch (err) {
    fail("Failed to add question", err);
  }
}

export async function updateQuestion(qid, patch) {
  try {
    await updateDoc(doc(db, "prepQuestions", qid), patch);
  } catch (err) {
    fail("Failed to update question", err);
  }
}

export async function deleteQuestion(qid) {
  try {
    await deleteDoc(doc(db, "prepQuestions", qid));
  } catch (err) {
    fail("Failed to delete question", err);
  }
}

/**
 * Bulk-import validated question rows, chunked into write batches of 450.
 * Rows may carry a deterministic `id` (used by the seed pack); otherwise an
 * auto id is generated. Returns { count, ids }.
 */
export async function importQuestions(rows, createdBy) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No questions to import");
  }
  try {
    const ids = [];
    for (let i = 0; i < rows.length; i += BATCH_LIMIT) {
      const chunk = rows.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const row of chunk) {
        const { id, ...data } = row;
        const ref = id ? doc(db, "prepQuestions", id) : doc(collection(db, "prepQuestions"));
        batch.set(ref, {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: createdBy || data.createdBy || null,
        });
        ids.push(ref.id);
      }
      await batch.commit();
    }
    return { count: ids.length, ids };
  } catch (err) {
    fail("Failed to import questions", err);
  }
}

// ── exams / papers / keys ──────────────────────────────────────────────────

export async function getExams({ kind, publishedOnly = true, max = 100 } = {}) {
  try {
    const clauses = [];
    if (publishedOnly) clauses.push(where("published", "==", true));
    if (kind) clauses.push(where("kind", "==", kind));
    // (published, startsAt) and (kind, startsAt) are indexed; the 3-field
    // combination is not, so that case sorts client-side.
    const canOrder = !(publishedOnly && kind);
    if (canOrder) clauses.push(orderBy("startsAt", "desc"));
    clauses.push(limit(max));
    const snap = await withRetry(() => getDocs(query(collection(db, "prepExams"), ...clauses)));
    const rows = snap.docs.map(snapToObj);
    if (!canOrder) {
      rows.sort((a, b) => (b.startsAt?.toMillis?.() || 0) - (a.startsAt?.toMillis?.() || 0));
    }
    return rows;
  } catch (err) {
    fail("Failed to load exams", err);
  }
}

export async function getExam(examId) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepExams", examId)));
    return snap.exists() ? snapToObj(snap) : null;
  } catch (err) {
    fail("Failed to load exam", err);
  }
}

export async function getPaper(examId) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepExamPapers", examId)));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error("The paper unlocks when the exam starts (permission-denied)");
    }
    fail("Failed to load exam paper", err);
  }
}

export async function getKey(examId) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepExamKeys", examId)));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error("The answer key is locked until the exam ends (permission-denied)");
    }
    fail("Failed to load answer key", err);
  }
}

/**
 * Create exam + paper + key in ONE write batch. The draft carries full
 * questions (answers, explanations, hidden tests); this helper is the ONLY
 * place they get split apart. The paper doc must never contain correctIndex,
 * explanation, or hidden test cases — that separation IS the security model.
 *
 * draft: { id?, title, kind, description?, startsAt, endsAt, durationMins,
 *          classGroups?, categories?, published?, createdBy?,
 *          questions: [{ type, category, topic, difficulty, prompt, marks?,
 *                        options?, correctIndex?, explanation?,
 *                        starterCode?, testCases?: [{input, expectedOutput, hidden}] }] }
 * Returns the examId.
 */
export async function createExam(draft) {
  if (!draft || !draft.title) throw new Error("Exam needs a title");
  if (!Array.isArray(draft.questions) || draft.questions.length === 0) {
    throw new Error("Exam needs at least one question");
  }
  if (!draft.startsAt || !draft.endsAt) throw new Error("Exam needs a start and end time");

  const paperQuestions = [];
  const answers = {};
  const explanations = {};
  const hiddenTestCases = {};
  const categorySet = new Set();

  draft.questions.forEach((q, i) => {
    if (!q || !q.prompt) throw new Error(`Question ${i + 1} is missing a prompt`);
    const idx = i;
    const marks = Number(q.marks) > 0 ? Number(q.marks) : q.type === "coding" ? 5 : 1;
    if (q.category) categorySet.add(q.category);

    const pq = {
      idx,
      type: q.type === "coding" ? "coding" : "mcq",
      category: q.category || "aptitude",
      topic: q.topic || "",
      difficulty: q.difficulty || "medium",
      prompt: q.prompt,
      marks,
    };

    if (pq.type === "mcq") {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${i + 1}: MCQs need exactly 4 options`);
      }
      const ci = Number(q.correctIndex);
      if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
        throw new Error(`Question ${i + 1}: correctIndex must be 0-3`);
      }
      pq.options = q.options;
      answers[idx] = ci;
      explanations[idx] = q.explanation || "";
    } else {
      if (q.starterCode) pq.starterCode = q.starterCode;
      const cases = Array.isArray(q.testCases) ? q.testCases : [];
      pq.publicTestCases = cases
        .filter((t) => !t.hidden)
        .map((t) => ({ input: t.input ?? "", expectedOutput: t.expectedOutput ?? "" }));
      hiddenTestCases[idx] = cases
        .filter((t) => t.hidden)
        .map((t) => ({ input: t.input ?? "", expectedOutput: t.expectedOutput ?? "" }));
      if (q.explanation) explanations[idx] = q.explanation;
    }
    paperQuestions.push(pq);
  });

  try {
    const examRef = draft.id ? doc(db, "prepExams", draft.id) : doc(collection(db, "prepExams"));
    const examId = examRef.id;
    const batch = writeBatch(db);
    batch.set(examRef, {
      title: draft.title,
      kind: draft.kind || "weekend-test",
      description: draft.description || "",
      startsAt: toTimestamp(draft.startsAt),
      endsAt: toTimestamp(draft.endsAt),
      durationMins: Number(draft.durationMins) || 60,
      categories: Array.isArray(draft.categories) && draft.categories.length
        ? draft.categories
        : [...categorySet],
      questionCount: paperQuestions.length,
      totalMarks: paperQuestions.reduce((s, q) => s + q.marks, 0),
      classGroups: Array.isArray(draft.classGroups) ? draft.classGroups : [],
      published: !!draft.published,
      createdBy: draft.createdBy || null,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "prepExamPapers", examId), { questions: paperQuestions });
    batch.set(doc(db, "prepExamKeys", examId), { answers, explanations, hiddenTestCases });
    await batch.commit();
    return examId;
  } catch (err) {
    fail("Failed to create exam", err);
  }
}

export async function updateExam(examId, patch) {
  try {
    const clean = { ...patch };
    if (clean.startsAt) clean.startsAt = toTimestamp(clean.startsAt);
    if (clean.endsAt) clean.endsAt = toTimestamp(clean.endsAt);
    await updateDoc(doc(db, "prepExams", examId), clean);
  } catch (err) {
    fail("Failed to update exam", err);
  }
}

/** Deletes exam + paper + key (submissions are kept for the record). */
export async function deleteExam(examId) {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "prepExams", examId));
    batch.delete(doc(db, "prepExamPapers", examId));
    batch.delete(doc(db, "prepExamKeys", examId));
    await batch.commit();
  } catch (err) {
    fail("Failed to delete exam", err);
  }
}

// ── submissions ────────────────────────────────────────────────────────────

const submissionId = (examId, uid) => `${examId}_${uid}`;

export async function getMySubmission(examId, uid) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepSubmissions", submissionId(examId, uid))));
    return snap.exists() ? snapToObj(snap) : null;
  } catch (err) {
    fail("Failed to load your submission", err);
  }
}

/**
 * Create the submission doc at exam start if it doesn't exist yet.
 * Returns the (re-read) doc so callers get the server-written startedAt —
 * used to measure client-clock skew for the countdown.
 * profile: { rollNumber, classGroup, branch, displayName }
 */
export async function startSubmission(examId, uid, profile = {}) {
  try {
    const ref = doc(db, "prepSubmissions", submissionId(examId, uid));
    const existing = await withRetry(() => getDoc(ref));
    if (existing.exists()) return snapToObj(existing);
    await setDoc(ref, {
      examId,
      uid,
      rollNumber: profile.rollNumber || null,
      classGroup: profile.classGroup || null,
      branch: profile.branch || null,
      displayName: profile.displayName || null,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "in-progress",
      responses: {},
    });
    const created = await withRetry(() => getDoc(ref));
    return created.exists() ? snapToObj(created) : null;
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error(
        "Could not start: the exam window is closed, or your roll number is not set (permission-denied)"
      );
    }
    fail("Failed to start the exam", err);
  }
}

/** Merge-write (autosave). Pass responses/partial fields in `patch`. */
export async function upsertSubmission(examId, uid, patch = {}) {
  try {
    await setDoc(
      doc(db, "prepSubmissions", submissionId(examId, uid)),
      { examId, uid, ...patch, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error("Autosave rejected: the exam window has closed (permission-denied)");
    }
    fail("Failed to save your answers", err);
  }
}

/** Final submit. `responses` (if given) replaces the whole map — no stale keys. */
export async function submitExam(examId, uid, responses) {
  try {
    const patch = {
      status: "submitted",
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (responses !== undefined) patch.responses = responses;
    await updateDoc(doc(db, "prepSubmissions", submissionId(examId, uid)), patch);
  } catch (err) {
    if (err && err.code === "permission-denied") {
      throw new Error("Submit rejected: the exam window has closed (permission-denied)");
    }
    if (err && err.code === "not-found") {
      throw new Error("No submission found to submit — start the exam first");
    }
    fail("Failed to submit the exam", err);
  }
}

/**
 * Staff: all submissions for an exam, optionally narrowed to one class group.
 * Uses the (examId, classGroup, rollNumber) index when classGroup is given,
 * otherwise (examId, submittedAt).
 */
export async function getSubmissionsForExam(examId, { classGroup, max = 500 } = {}) {
  try {
    const clauses = [where("examId", "==", examId)];
    if (classGroup) {
      clauses.push(where("classGroup", "==", classGroup), orderBy("rollNumber", "asc"));
    }
    // No orderBy(submittedAt) in the unfiltered case: ordering on a field
    // excludes docs that lack it, which would hide in-progress submissions
    // from attendance counts. Equality-only + client sort sees everything.
    clauses.push(limit(max));
    const snap = await withRetry(() => getDocs(query(collection(db, "prepSubmissions"), ...clauses)));
    const rows = snap.docs.map(snapToObj);
    if (!classGroup) {
      rows.sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
    }
    return rows;
  } catch (err) {
    fail("Failed to load submissions", err);
  }
}

// ── attempts & progress ────────────────────────────────────────────────────

/** record: { qid, category, topic, difficulty, correct, source, courseId?, lang?, timeMs } */
export async function logAttempt(uid, record) {
  try {
    const ref = await addDoc(collection(db, "prepAttempts", uid, "records"), {
      ...record,
      date: record.date || dateKey(),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    fail("Failed to log attempt", err);
  }
}

export async function getMyAttempts(uid, { max = 300 } = {}) {
  try {
    const snap = await withRetry(() =>
      getDocs(
        query(collection(db, "prepAttempts", uid, "records"), orderBy("createdAt", "desc"), limit(max))
      )
    );
    return snap.docs.map(snapToObj);
  } catch (err) {
    fail("Failed to load attempts", err);
  }
}

export async function getProgress(uid) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepProgress", uid)));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    fail("Failed to load progress", err);
  }
}

/**
 * Record activity: streak logic (lastActiveDate yesterday → streak+1,
 * today → unchanged, anything else → reset to 1) plus categoryStats counters.
 * Returns { streak, lastActiveDate }.
 */
export async function bumpProgress(uid, { category, correct, xp, rollNumber, classGroup } = {}) {
  try {
    const ref = doc(db, "prepProgress", uid);
    const snap = await withRetry(() => getDoc(ref));
    const prev = snap.exists() ? snap.data() : {};
    const today = dateKey();
    let streak;
    if (prev.lastActiveDate === today) streak = prev.streak || 1;
    else if (prev.lastActiveDate === yesterdayKey()) streak = (prev.streak || 0) + 1;
    else streak = 1;

    const patch = {
      streak,
      lastActiveDate: today,
      totalSolved: increment(correct ? 1 : 0),
      xp: increment(typeof xp === "number" ? xp : correct ? 10 : 2),
    };
    if (category) {
      patch.categoryStats = {
        [category]: { attempted: increment(1), correct: increment(correct ? 1 : 0) },
      };
    }
    // denormalized so staff queries never need a users join
    if (rollNumber) patch.rollNumber = rollNumber;
    if (classGroup) patch.classGroup = classGroup;

    await setDoc(ref, patch, { merge: true });
    return { streak, lastActiveDate: today };
  } catch (err) {
    fail("Failed to update progress", err);
  }
}

/**
 * Staff: attempts across a whole class group via the `records` collection
 * group. The record docs don't carry classGroup, so we take a date-ranged
 * slice (index-backed) and join against the group's student uids client-side.
 */
export async function attemptsForClassGroup(classGroup, { dateFrom, dateTo, category, max = 2000 } = {}) {
  if (!classGroup) throw new Error("attemptsForClassGroup needs a class group");
  try {
    const students = await getStudents({ classGroup });
    const uidSet = new Set(students.map((s) => s.id));
    const clauses = [];
    if (dateFrom) clauses.push(where("date", ">=", dateFrom));
    if (dateTo) clauses.push(where("date", "<=", dateTo));
    clauses.push(orderBy("date", "asc"), limit(max));
    const snap = await withRetry(() => getDocs(query(collectionGroup(db, "records"), ...clauses)));
    return snap.docs
      .map((d) => ({ id: d.id, uid: d.ref.parent.parent.id, ...d.data() }))
      .filter((r) => uidSet.has(r.uid) && (!category || r.category === category));
  } catch (err) {
    fail("Failed to load class attempts", err);
  }
}

/** Staff: every attempt at one question (per-question difficulty analysis). */
export async function getAttemptsForQuestion(qid, { max = 1000 } = {}) {
  try {
    const snap = await withRetry(() =>
      getDocs(query(collectionGroup(db, "records"), where("qid", "==", qid), limit(max)))
    );
    return snap.docs.map((d) => ({ id: d.id, uid: d.ref.parent.parent.id, ...d.data() }));
  } catch (err) {
    fail("Failed to load question attempts", err);
  }
}

// ── courses & daily tasks ──────────────────────────────────────────────────

export async function getCourses({ publishedOnly = true, max = 100 } = {}) {
  try {
    // Tiny collection; no orderBy so docs missing `order` still show up.
    const snap = await withRetry(() => getDocs(query(collection(db, "prepCourses"), limit(max))));
    const rows = snap.docs.map(snapToObj);
    rows.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    return publishedOnly ? rows.filter((c) => c.published) : rows;
  } catch (err) {
    fail("Failed to load courses", err);
  }
}

export async function getCourse(courseId) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepCourses", courseId)));
    return snap.exists() ? snapToObj(snap) : null;
  } catch (err) {
    fail("Failed to load course", err);
  }
}

export async function upsertCourse(courseId, data) {
  try {
    if (courseId) {
      await setDoc(doc(db, "prepCourses", courseId), data, { merge: true });
      return courseId;
    }
    const ref = await addDoc(collection(db, "prepCourses"), data);
    return ref.id;
  } catch (err) {
    fail("Failed to save course", err);
  }
}

export async function deleteCourse(courseId) {
  try {
    await deleteDoc(doc(db, "prepCourses", courseId));
  } catch (err) {
    fail("Failed to delete course", err);
  }
}

/** Returns the items array for the day ([] when nothing is scheduled). */
export async function getDailyTasks(dateStr) {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "prepDailyTasks", dateStr || dateKey())));
    return snap.exists() ? snap.data().items || [] : [];
  } catch (err) {
    fail("Failed to load daily tasks", err);
  }
}

export async function setDailyTasks(dateStr, items) {
  try {
    await setDoc(doc(db, "prepDailyTasks", dateStr), { items: items || [] });
  } catch (err) {
    fail("Failed to save daily tasks", err);
  }
}

// ── announcements ──────────────────────────────────────────────────────────

export async function getAnnouncements({ max = 20 } = {}) {
  try {
    const snap = await withRetry(() =>
      getDocs(query(collection(db, "prepAnnouncements"), orderBy("createdAt", "desc"), limit(max)))
    );
    return snap.docs.map(snapToObj);
  } catch (err) {
    fail("Failed to load announcements", err);
  }
}

export async function addAnnouncement({ text, date, link } = {}) {
  if (!text || !text.trim()) throw new Error("Announcement text is required");
  try {
    const ref = await addDoc(collection(db, "prepAnnouncements"), {
      text: text.trim(),
      date: date || dateKey(),
      link: link || null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    fail("Failed to add announcement", err);
  }
}

export async function updateAnnouncement(id, patch) {
  try {
    await updateDoc(doc(db, "prepAnnouncements", id), patch);
  } catch (err) {
    fail("Failed to update announcement", err);
  }
}

export async function deleteAnnouncement(id) {
  try {
    await deleteDoc(doc(db, "prepAnnouncements", id));
  } catch (err) {
    fail("Failed to delete announcement", err);
  }
}

// ── class groups ───────────────────────────────────────────────────────────

export async function getClassGroups({ activeOnly = true, max = 200 } = {}) {
  try {
    const snap = await withRetry(() => getDocs(query(collection(db, "prepClassGroups"), limit(max))));
    const rows = snap.docs.map(snapToObj);
    rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    return activeOnly ? rows.filter((g) => g.active !== false) : rows;
  } catch (err) {
    fail("Failed to load class groups", err);
  }
}

/** Doc id defaults to the name ("CSE-A") so re-installs stay idempotent. */
export async function upsertClassGroup({ id, name, branch, active = true } = {}) {
  if (!name || !name.trim()) throw new Error("Class group name is required");
  try {
    const gid = id || name.trim().toUpperCase().replace(/[^A-Z0-9-]+/g, "-");
    await setDoc(
      doc(db, "prepClassGroups", gid),
      { name: name.trim(), branch: branch || "", active: !!active },
      { merge: true }
    );
    return gid;
  } catch (err) {
    fail("Failed to save class group", err);
  }
}

export async function deleteClassGroup(id) {
  try {
    await deleteDoc(doc(db, "prepClassGroups", id));
  } catch (err) {
    fail("Failed to delete class group", err);
  }
}

// ── users, roles & onboarding ──────────────────────────────────────────────

/** Staff: list students, optionally by class group. Pass role:null for all roles. */
export async function getStudents({ classGroup, role = "student", max = 1000 } = {}) {
  try {
    const clauses = [];
    if (role) clauses.push(where("role", "==", role));
    if (classGroup) clauses.push(where("classGroup", "==", classGroup));
    clauses.push(limit(max));
    const snap = await withRetry(() => getDocs(query(collection(db, "users"), ...clauses)));
    const rows = snap.docs.map(snapToObj);
    rows.sort((a, b) => String(a.rollNumber || "￿").localeCompare(String(b.rollNumber || "￿")));
    return rows;
  } catch (err) {
    fail("Failed to load students", err);
  }
}

export async function findUserByEmail(email) {
  if (!email || !email.trim()) throw new Error("Email is required");
  try {
    const lookup = async (value) => {
      const snap = await withRetry(() =>
        getDocs(query(collection(db, "users"), where("email", "==", value), limit(1)))
      );
      return snap.empty ? null : snapToObj(snap.docs[0]);
    };
    const raw = email.trim();
    return (await lookup(raw)) || (raw !== raw.toLowerCase() ? await lookup(raw.toLowerCase()) : null);
  } catch (err) {
    fail("Failed to look up user", err);
  }
}

export async function setRoleByEmail(email, role) {
  const allowed = ["student", "faculty", "tpo", "admin"];
  if (!allowed.includes(role)) throw new Error(`Role must be one of: ${allowed.join(", ")}`);
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`No user found with email "${email}" — they must log in once first`);
  try {
    await updateDoc(doc(db, "users", user.id), { role });
    return { ...user, role };
  } catch (err) {
    fail("Failed to update role", err);
  }
}

/**
 * Student onboarding. Roll number is normalized, validated, and IMMUTABLE
 * once set (staff correct mistakes via staffUpdateUser).
 */
export async function saveOnboardingProfile(uid, { rollNumber, branch, classGroup } = {}) {
  const roll = String(rollNumber || "").trim().toUpperCase();
  if (!ROLL_RE.test(roll)) throw new Error("Roll number must be 6-14 letters and digits");
  if (!branch) throw new Error("Branch is required");
  if (!classGroup) throw new Error("Class group is required");
  try {
    const ref = doc(db, "users", uid);
    const snap = await withRetry(() => getDoc(ref));
    const prev = snap.exists() ? snap.data() : {};
    if (prev.rollNumber && prev.rollNumber !== roll) {
      throw new Error("Roll number is locked once set — ask staff to correct it");
    }
    await setDoc(ref, { rollNumber: roll, branch, classGroup, prepOnboarded: true }, { merge: true });
    return { rollNumber: roll, branch, classGroup };
  } catch (err) {
    if (err instanceof Error && !err.code) throw err;
    fail("Failed to save profile", err);
  }
}

/** Staff correction path (e.g. fixing a mistyped roll number). */
export async function staffUpdateUser(uid, patch) {
  try {
    await updateDoc(doc(db, "users", uid), patch);
  } catch (err) {
    fail("Failed to update user", err);
  }
}

// ── config ─────────────────────────────────────────────────────────────────

export async function getPrepConfig() {
  try {
    const snap = await withRetry(() => getDoc(doc(db, "system", "prepConfig")));
    return {
      pistonUrl: DEFAULT_PISTON_URL,
      enabledLanguages: ["python", "javascript", "java", "c", "cpp"],
      submissionGraceSecs: 120,
      ...(snap.exists() ? snap.data() : {}),
    };
  } catch (err) {
    fail("Failed to load prep config", err);
  }
}

export async function savePrepConfig(patch) {
  try {
    await setDoc(doc(db, "system", "prepConfig"), patch, { merge: true });
  } catch (err) {
    fail("Failed to save prep config", err);
  }
}
