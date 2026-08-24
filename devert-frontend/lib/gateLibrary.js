// The reference half of the GATE module: the Formula Book, the Resources shelf,
// and paper announcements.
//
// Short Notes are NOT here. They live on the topic document itself
// (topic.shortNotes = { oneMinute, fiveMinute, nightBefore }) because a topic's
// one-minute summary is that topic's content, not a separate library entry - and
// storing it inline means a topic's lesson screen, the revision engine's session
// cards and the night-before sweep all read the same authored text with no join
// and no risk of one drifting from another. The accessors at the bottom of this
// file are the shared read model for them.
//
// Formulas are a flat, paperId-tagged collection for exactly the reason
// lib/gatePyq.js's bank is: the Formula Book is browsed by subject, searched
// across every subject at once, filtered to bookmarked entries, and printed as
// a single document. A nested layout would turn three of those four into a
// fan-out.
import { db } from "@/lib/firebase";
import {
  collection, doc, addDoc, deleteDoc, getDocs, setDoc,
  query, where, serverTimestamp, writeBatch,
} from "firebase/firestore";

// What kind of thing an entry is. This drives grouping and the print layout,
// and it is a closed set on purpose - "Definitions / Theorems / Important
// Formulae / Memory Tricks / Quick Revision Cards" are the five the product
// asks for, and a free-text kind field would immediately produce "formula",
// "Formula" and "formulae" as three separate groups.
export const FORMULA_KINDS = [
  { key: "formula", label: "Formula", detail: "An expression to apply." },
  { key: "definition", label: "Definition", detail: "A term stated precisely." },
  { key: "theorem", label: "Theorem", detail: "A result you may cite." },
  { key: "trick", label: "Memory Trick", detail: "A mnemonic or shortcut." },
  { key: "card", label: "Revision Card", detail: "A compact fact for a final sweep." },
];

export function formulaKindLabel(key) {
  return FORMULA_KINDS.find(k => k.key === key)?.label || key;
}

// ---------------- formula book ----------------

export async function fetchFormulas(paperId, { subjectId, includeUnpublished = false } = {}) {
  const filters = [where("paperId", "==", paperId)];
  if (!includeUnpublished) filters.push(where("status", "==", "published"));
  if (subjectId) filters.push(where("subjectId", "==", subjectId));
  const snap = await getDocs(query(collection(db, "gate_formulas"), ...filters));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.title || "").localeCompare(b.title || ""));
}

export async function saveFormula(formulaId, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (formulaId) {
    await setDoc(doc(db, "gate_formulas", formulaId), payload, { merge: true });
    return formulaId;
  }
  const ref = await addDoc(collection(db, "gate_formulas"), { ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteFormula(formulaId) {
  await deleteDoc(doc(db, "gate_formulas", formulaId));
}

export async function importFormulasBatch(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const batch = writeBatch(db);
    rows.slice(i, i + 200).forEach((row, idx) => {
      batch.set(doc(collection(db, "gate_formulas")), {
        ...row, order: row.order ?? (i + idx + 1),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

// Client-side search across an already-fetched formula list. Deliberately not a
// Firestore query: Firestore has no substring matching, and the alternative
// (an external search index) is disproportionate for a few hundred entries that
// are already in memory the moment the screen opens. Matches title, statement,
// expression, notes and tags, so searching "cache" finds a formula whose title
// never says the word.
export function searchFormulas(formulas, term) {
  const q = (term || "").trim().toLowerCase();
  if (!q) return formulas;
  return formulas.filter(f => [
    f.title, f.statement, f.expression, f.notes, f.memoryTrick, ...(f.tags || []),
  ].some(v => (v || "").toLowerCase().includes(q)));
}

export function groupFormulasBySubject(formulas, tree) {
  const nameById = new Map((tree || []).map(s => [s.id, s.name]));
  const groups = new Map();
  for (const f of formulas) {
    const key = f.subjectId || "unassigned";
    if (!groups.has(key)) {
      groups.set(key, { subjectId: key, subjectName: nameById.get(key) || "Unassigned", formulas: [] });
    }
    groups.get(key).formulas.push(f);
  }
  // Syllabus order, not alphabetical - the Formula Book should read in the same
  // sequence as the syllabus tree it mirrors.
  const order = new Map((tree || []).map((s, i) => [s.id, i]));
  return [...groups.values()].sort((a, b) =>
    (order.get(a.subjectId) ?? 999) - (order.get(b.subjectId) ?? 999));
}

// ---------------- resources ----------------

export const RESOURCE_KINDS = [
  { key: "book", label: "Book" },
  { key: "video", label: "Video / Lecture Series" },
  { key: "notes", label: "Notes / PDF" },
  { key: "paper", label: "Past Paper" },
  { key: "link", label: "Link" },
];

export async function fetchResources(paperId, { includeUnpublished = false } = {}) {
  const filters = [where("paperId", "==", paperId)];
  if (!includeUnpublished) filters.push(where("status", "==", "published"));
  const snap = await getDocs(query(collection(db, "gate_resources"), ...filters));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function saveResource(resourceId, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (resourceId) {
    await setDoc(doc(db, "gate_resources", resourceId), payload, { merge: true });
    return resourceId;
  }
  const ref = await addDoc(collection(db, "gate_resources"), { ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteResource(resourceId) {
  await deleteDoc(doc(db, "gate_resources", resourceId));
}

// ---------------- announcements ----------------

export async function fetchAnnouncements(paperId, { includeUnpublished = false } = {}) {
  const filters = [where("paperId", "==", paperId)];
  if (!includeUnpublished) filters.push(where("status", "==", "published"));
  const snap = await getDocs(query(collection(db, "gate_announcements"), ...filters));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)
      || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function saveAnnouncement(announcementId, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (announcementId) {
    await setDoc(doc(db, "gate_announcements", announcementId), payload, { merge: true });
    return announcementId;
  }
  const ref = await addDoc(collection(db, "gate_announcements"), { ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteAnnouncement(announcementId) {
  await deleteDoc(doc(db, "gate_announcements", announcementId));
}

// ---------------- short notes (read model over topic docs) ----------------

// The three depths a revision pass can happen at, in escalating brevity. The
// order here is the order they are offered, and `key` matches the field on
// topic.shortNotes.
export const SHORT_NOTE_DEPTHS = [
  { key: "fiveMinute", label: "5-minute revision", detail: "The topic's essentials, readable in a coffee break." },
  { key: "oneMinute", label: "1-minute revision", detail: "Just the facts you must not blank on." },
  { key: "nightBefore", label: "Night before the exam", detail: "The single highest-yield reminder for this topic." },
];

export function hasShortNotes(topic) {
  return SHORT_NOTE_DEPTHS.some(d => topic?.shortNotes?.[d.key]?.trim());
}

// Every authored short note across a whole syllabus tree, flattened for the
// "night before" sweep - one scrollable document per subject rather than
// clicking through 130 topics. Topics with nothing authored are simply absent
// rather than rendered as empty cards.
export function collectShortNotes(tree, depthKey) {
  return (tree || []).map(subject => ({
    subjectId: subject.id,
    subjectName: subject.name,
    notes: (subject.topics || [])
      .filter(t => t.shortNotes?.[depthKey]?.trim())
      .map(t => ({ topicId: t.id, title: t.title, module: t.module, text: t.shortNotes[depthKey] })),
  })).filter(g => g.notes.length > 0);
}

// Every formula authored inline on a topic (topic.formulas is a plain string
// array - the formula box in the lesson), merged with the standalone Formula
// Book entries so the book is complete rather than showing only whichever half
// an admin happened to author in the dedicated panel. Inline entries are marked
// so the UI can link them back to their lesson.
export function mergeInlineFormulas(formulas, tree) {
  const inline = [];
  for (const subject of tree || []) {
    for (const topic of subject.topics || []) {
      (topic.formulas || []).forEach((text, i) => {
        if (!text?.trim()) return;
        inline.push({
          id: `inline__${subject.id}__${topic.id}__${i}`,
          paperId: null, subjectId: subject.id, topicId: topic.id,
          kind: "formula", title: topic.title, statement: text,
          fromLesson: true, order: 100000 + i, status: "published",
        });
      });
    }
  }
  return [...formulas, ...inline];
}
