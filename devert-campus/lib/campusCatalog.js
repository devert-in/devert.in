// The public Campus catalog - one aggregated read of every centrally-owned
// content collection the /campus landing page advertises.
//
// WHY THIS CAN BE READ BY A LOGGED-OUT VISITOR AT ALL: every collection below
// is global admin-authored content, not institution-owned, and firestore.rules'
// contentReadable() gates it on `status == "published" && audienceAllows()`
// with no isAuth() - and Phase 0 backfilled `audiences: ["legacy"]` onto all
// 1,305 existing content documents, while an anonymous reader falls back to
// ["public","legacy"]. So the landing page needs no rules change and no
// service account; see docs/CONTENT-ENGINE-ARCHITECTURE.md sections 4 and 6.
//
// WHAT THIS DOES NOT READ: anything institution-scoped. Daily Learning weeks
// live at institutions/{id}/dailyLearning and per-institution student rosters
// are admin-gated, so neither is reachable here by design - the landing page
// presents Daily Learning as a Campus capability, never with a fabricated
// number attached to it.
//
// EVERY NUMBER HERE IS A REAL LENGTH OF A REAL QUERY. Nothing is estimated,
// rounded up for effect, or hardcoded - same policy lib/studentAnalytics.js's
// header states and lib/campusDashboard.js follows. A fetch that fails yields
// `null`, never 0, and consumers must render null as a placeholder rather than
// a count: "0 languages" is a factual claim about the product, an unknown count
// is not.
import { db, collection, getCountFromServer, getDocs, query, where } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import { fetchLanguages } from "@/lib/programming";
import { fetchSubjects } from "@/lib/csCore";
import { fetchConceptTracks } from "@/lib/dsaConcepts";
import { fetchAptitudeTopics } from "@/lib/aptitude";
import { fetchModules as fetchSeModules } from "@/lib/softwareEngineering";
import { fetchSheets } from "@/lib/dsaSheets";

// Independently caught, one per collection. These reads are already public, so
// the normal case is that all of them succeed - but a single collection going
// away (a rules edit, an index still building, an offline visitor) must degrade
// that one figure rather than blanking the entire page, which is what a bare
// Promise.all would do.
function safe(promise, fallback = null) {
  return promise.then(v => v).catch(() => fallback);
}

// COUNTED SERVER-SIDE, deliberately not via the existing
// fetchPublishedProblems()/fetchPublishedCompanies() list helpers. Those return
// full documents - ~545 problem statements with tags and metadata - and this
// page only ever renders their length. An aggregate query is billed at one read
// per 1,000 matched documents instead of one per document, and transfers a
// single integer, which for a page every search visitor lands on is the whole
// difference between a cheap page and an expensive one.
//
// The filters MIRROR those list helpers exactly, because an aggregate query is
// authorised the same analytical way a list() is: firestore.rules must be able
// to prove every matched document is readable, so dropping the status/audiences
// filters here would not "count everything", it would be denied outright.
// `problems` has no audiences filter for the same reason its list helper
// doesn't - that collection was deliberately left out of the audience rollout
// (docs/CONTENT-ENGINE-ARCHITECTURE.md open question 4).
function countPublishedProblems() {
  return getCountFromServer(query(collection(db, "problems"), where("status", "==", "published")))
    .then(snap => snap.data().count).catch(() => null);
}

function countPublishedCompanies() {
  return getCountFromServer(query(
    collection(db, "companies"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", currentAudiences()),
  )).then(snap => snap.data().count).catch(() => null);
}

// The whole-platform DeVert account count, not "students on Campus". Only one
// institution is live, so an approved-student count would be both tiny and
// double-counting (every approved Campus student is already a row in `users`).
function fetchLearnerCount() {
  return getCountFromServer(collection(db, "users")).then(snap => snap.data().count).catch(() => null);
}

// Server-side aggregate for the same reason countPublishedProblems is one: the
// landing page renders only the size of this bank, and the bank is the largest
// collection Campus has any reason to count.
//
// The where() is not optional. firestore.rules gates a gate_pyq on
// `resource.data.get('status','draft') == 'published'`, and an aggregate query
// is authorised exactly as analytically as a list() - the rules engine has to
// be able to prove every matched document is readable, so an unfiltered count
// is denied outright rather than counting drafts. That is also precisely what
// keeps UNVERIFIED IMPORTED QUESTIONS OUT OF THIS NUMBER: a PDF-extracted
// draft awaiting review carries status:"draft" (see scripts/extract-gate-pyqs.mjs),
// so it is invisible both to this count and to every student-facing query
// until an admin publishes it. The advertised figure can therefore only ever
// be questions a human has actually verified.
function countPublishedPyqs() {
  return getCountFromServer(query(collection(db, "gate_pyqs"), where("status", "==", "published")))
    .then(snap => snap.data().count).catch(() => null);
}

// The published GATE papers, read HERE as a direct query rather than through
// lib/gate.js's fetchPapers(). The filters are identical (they have to be -
// see countPublishedProblems above on why an unfiltered read is denied rather
// than permissive), but importing that module for one four-line query would
// pull its whole graph - the rewards ledger, content versioning, transaction
// helpers - into the landing page's bundle, for a page whose only use of GATE
// is printing two paper names. Every other figure on this page is fetched the
// same direct way for the same reason.
//
// Ordered by the same `order` field fetchPapers() sorts on, so the landing
// page lists papers in the sequence an admin arranged them rather than by
// document id.
function fetchGatePapers() {
  return getDocs(query(
    collection(db, "gatePapers"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", currentAudiences()),
  )).then(snap => snap.docs
    .map(d => ({ id: d.id, name: d.data().name, order: d.data().order || 0 }))
    .sort((a, b) => a.order - b.order));
}

export async function fetchPublicCatalog() {
  const [
    languages, subjects, conceptTracks, aptitudeTopics, seModules, sheets,
    problemCount, companyCount, learners, gatePapers, gatePyqCount,
  ] = await Promise.all([
    safe(fetchLanguages(), []),
    safe(fetchSubjects(), []),
    safe(fetchConceptTracks(), []),
    safe(fetchAptitudeTopics(), []),
    safe(fetchSeModules(), []),
    safe(fetchSheets(), []),
    countPublishedProblems(),
    countPublishedCompanies(),
    fetchLearnerCount(),
    // Full docs rather than a count: there are at most a handful of papers
    // (CS, DA), and the GATE card names them ("GATE CS", "GATE DA") instead of
    // printing "2 papers", which tells a candidate nothing about whether their
    // paper is one of them.
    safe(fetchGatePapers(), []),
    countPublishedPyqs(),
  ]);

  return {
    // Full docs, not just counts, for the tracks the landing page names
    // individually (the Learn explorer lists actual language/subject names).
    // These are small top-level catalogs - one document per language/subject/
    // sheet, with no per-topic fan-out.
    languages, subjects, conceptTracks, aptitudeTopics, seModules, sheets,
    problemCount, companyCount, learners, gatePapers, gatePyqCount,
  };
}
