// Audience strings - the single source of truth for content distribution.
// See docs/CONTENT-ENGINE-ARCHITECTURE.md sections 4, 5 and 6a.
//
// An audience is a flat string. Content carries an array of them; a reader
// presents an array of them; visibility is set intersection. That flatness is
// forced by Firestore, not chosen for simplicity: rules cannot join, get() caps
// at 10 reads per request, and list queries must be statically provable - so the
// Platform/Campus/Institution/Department/Year/Section hierarchy cannot be walked
// at read time. It is expanded HERE, at write time and at claim-minting time,
// into the flat strings both sides compare.
//
// DEPENDENCY-FREE ON PURPOSE. Same constraint as lib/lessonBlocks.js: this file
// is imported by the browser, by node scripts (via a data: URL, since
// devert-frontend is CommonJS-resolved), and eventually by whatever mints custom
// claims. It must not import anything.
//
// THE INVARIANT THAT KEEPS THIS HONEST
//   Exclusion comes from the QUERY. The rule is defence in depth.
// Emulator probing (doc section 6a) found list() returning documents that get()
// denies, contradicting the documented "rules are not filters" model. Rather than
// depend on an unresolved semantic, every consumer MUST filter on `audiences`,
// and `audiences: []` is then unreachable by construction - no audience string
// can match an empty array, whatever list() does with rules.

// ---------------- well-known audiences ----------------

// Every content document that existed before the distribution layer carries
// this, and every reader carries it, so legacy visibility is unchanged. It is
// NOT a synonym for "public": revoking it per-collection later is how content
// gets migrated into deliberate publishing.
export const AUDIENCE_LEGACY = "legacy";

// World-readable, no authentication. A one-way door - see doc open question 5.
export const AUDIENCE_PUBLIC = "public";

// Core product surfaces.
export const AUDIENCE_CORE_LEARN = "core:learn";
export const AUDIENCE_CORE_PRACTICE = "core:practice";

// Any Campus institution. A public learner does NOT carry this, which is
// precisely what makes it useful: it separates Campus users from everyone else,
// while campus:<slug> separates institutions from each other.
export const AUDIENCE_CAMPUS_ANY = "campus:*";

// Authors and platform staff, for content that should never reach a student.
export const AUDIENCE_INTERNAL = "internal";

// What a reader gets when they have no `aud` claim at all. This is not a corner
// case - it is the state of EVERY account until claims are minted, so it has to
// preserve today's behaviour exactly.
//
// `legacy` is in here deliberately. Published content is currently readable
// unauthenticated (firestore.rules has no isAuth() on the content read), so
// omitting it would break public reads of every existing lesson the moment the
// rules ship.
export const DEFAULT_READER_AUDIENCES = [AUDIENCE_PUBLIC, AUDIENCE_LEGACY];

// Firestore's array-contains-any ceiling. A reader cannot present more than this
// many audiences in one query, which is the real limit on how many groups one
// person can belong to.
export const MAX_QUERY_AUDIENCES = 30;

// Firebase custom claims are capped at 1000 bytes TOTAL, shared with every other
// claim (including `admin`). Budgeting well under it leaves room.
export const CLAIM_BYTE_BUDGET = 800;

// ---------------- building audience strings ----------------

function clean(part) {
  return String(part ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

// campus:mrcet / campus:mrcet/cse / campus:mrcet/cse/3 / campus:mrcet/cse/3/a
//
// Segments are dropped from the right as soon as one is missing, so a student
// with no section recorded yields campus:mrcet/cse/3 rather than a malformed
// string with an empty trailing segment.
export function campusAudience({ institutionId, departmentId, year, section } = {}) {
  const inst = clean(institutionId);
  if (!inst) return null;
  const parts = [inst];
  for (const seg of [departmentId, year, section]) {
    const c = clean(seg);
    if (!c) break;
    parts.push(c);
  }
  return `campus:${parts.join("/")}`;
}

export function orgAudience(orgId) {
  const c = clean(orgId);
  return c ? `org:${c}` : null;
}

// ---------------- expansion ----------------

// The ancestor chain for one campus placement, general to specific:
//   campus:*  campus:mrcet  campus:mrcet/cse  campus:mrcet/cse/3  campus:mrcet/cse/3/a
//
// A reader carries the WHOLE chain. That is what makes `campus:*` and
// `campus:mrcet` work as grants without any write-time fan-out: content tagged
// at any level is matched by anyone whose chain contains that level.
export function expandCampusChain({ institutionId, departmentId, year, section } = {}) {
  const inst = clean(institutionId);
  if (!inst) return [];
  const chain = [AUDIENCE_CAMPUS_ANY];
  const segs = [inst];
  chain.push(`campus:${inst}`);
  for (const seg of [departmentId, year, section]) {
    const c = clean(seg);
    if (!c) break;
    segs.push(c);
    chain.push(`campus:${segs.join("/")}`);
  }
  return chain;
}

// Everything a reader should present. This is both what goes into their custom
// claim and what a consumer passes to array-contains-any, so the two can never
// disagree.
export function expandReaderAudiences({
  institutionId, departmentId, year, section,
  orgIds = [],
  isStaff = false,
  isInternal = false,
} = {}) {
  const out = [AUDIENCE_PUBLIC, AUDIENCE_LEGACY, AUDIENCE_CORE_LEARN, AUDIENCE_CORE_PRACTICE];
  out.push(...expandCampusChain({ institutionId, departmentId, year, section }));
  if (isStaff && clean(institutionId)) out.push(`staff:${clean(institutionId)}`);
  for (const o of orgIds) { const a = orgAudience(o); if (a) out.push(a); }
  if (isInternal) out.push(AUDIENCE_INTERNAL);
  return dedupe(out);
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const a of list) if (a && !seen.has(a)) { seen.add(a); out.push(a); }
  return out;
}

// ---------------- reading ----------------

// The custom-claim key. `auds`, NOT `aud`.
//
// `aud` is a RESERVED JWT claim holding the Firebase project id. Using it made
// firestore.rules' token.get('aud', []) return that string, .size() return its
// character length, and hasAny() receive a string rather than a list - which
// threw and denied every AUTHENTICATED content read. Unauthenticated reads kept
// working, so the bug hid until an emulator test with a signed-in user caught
// it. The Admin SDK also refuses to set reserved claims, so minting would have
// failed too. Never rename this back.
export const CLAIM_KEY = "auds";

// ---------------- the ambient reader ----------------
//
// Every content list query must carry array-contains-any on `audiences` or
// Firestore denies it outright - its list authorisation is ANALYTICAL, so the
// query must PROVE every matching document satisfies the rule regardless of what
// the data contains (see doc section 6a). That filter is needed at dozens of call
// sites across eight lib modules, none of which currently receive the signed-in
// user.
//
// Rather than thread claims through all of them, AuthContext publishes the
// current reader's audiences here once, and consumers read them ambiently. This
// is deliberate module-level state, and it is safe in one specific direction:
//
//   The default is the LEAST-privileged set (public + legacy). So a query that
//   races ahead of AuthContext under-fetches - it can miss restricted content it
//   was entitled to - and can never over-fetch. Firestore rules independently
//   enforce the same predicate, so even a wrong value here cannot widen access.
//
// The visible symptom of that race, once claims exist, is restricted content
// briefly missing from a list on a cold load. Re-running the query after
// AuthContext resolves fixes it; over-fetching is impossible.
let _currentAudiences = [...DEFAULT_READER_AUDIENCES];

export function setCurrentAudiences(auds) {
  _currentAudiences = Array.isArray(auds) && auds.length
    ? auds.slice(0, MAX_QUERY_AUDIENCES)
    : [...DEFAULT_READER_AUDIENCES];
}

export function currentAudiences() {
  return _currentAudiences;
}

// What this reader presents to queries. Mirrors readerAud() in firestore.rules -
// if you change one, change the other, or a query will return documents the rule
// then denies (or the reverse, which is worse).
export function readerAudiences(claims) {
  const auds = claims?.[CLAIM_KEY];
  if (!Array.isArray(auds) || auds.length === 0) return [...DEFAULT_READER_AUDIENCES];
  return auds.slice(0, MAX_QUERY_AUDIENCES);
}

// True if content with these audiences is visible to this reader. Pure set
// intersection - the same predicate the rule evaluates, kept here so a consumer
// can filter an already-fetched list without a second round trip.
export function audienceAllows(contentAudiences, readerAuds) {
  if (!Array.isArray(contentAudiences) || contentAudiences.length === 0) return false;
  const reader = new Set(readerAuds || DEFAULT_READER_AUDIENCES);
  return contentAudiences.some(a => reader.has(a));
}

// ---------------- validation ----------------

// Guards the two hard limits before they become production surprises: more than
// 30 audiences cannot be queried, and an oversized claim is rejected by Firebase
// outright.
export function validateReaderAudiences(auds) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(auds) || auds.length === 0) {
    errors.push("reader has no audiences - they would see nothing");
    return { ok: false, errors, warnings, bytes: 0 };
  }
  if (auds.length > MAX_QUERY_AUDIENCES) {
    errors.push(`${auds.length} audiences exceeds Firestore's array-contains-any limit of ${MAX_QUERY_AUDIENCES}`);
  }
  const bytes = new TextEncoder().encode(JSON.stringify({ aud: auds })).length;
  if (bytes > CLAIM_BYTE_BUDGET) {
    errors.push(`claim payload ${bytes}B exceeds the ${CLAIM_BYTE_BUDGET}B budget (Firebase hard cap is 1000B including other claims)`);
  } else if (bytes > CLAIM_BYTE_BUDGET * 0.75) {
    warnings.push(`claim payload ${bytes}B is approaching the ${CLAIM_BYTE_BUDGET}B budget`);
  }
  return { ok: errors.length === 0, errors, warnings, bytes };
}

// Content-side check, for the admin UI. An empty array is VALID - it is the
// deliberate "stored but published nowhere" state, not a mistake.
export function validateContentAudiences(auds) {
  const errors = [];
  if (!Array.isArray(auds)) { errors.push("audiences must be an array"); return { ok: false, errors }; }
  for (const a of auds) {
    if (typeof a !== "string" || !a.trim()) errors.push(`invalid audience: ${JSON.stringify(a)}`);
    else if (!/^(public|legacy|internal|core:[a-z]+|campus:(\*|[a-z0-9-]+(\/[a-z0-9-]+)*)|staff:[a-z0-9-]+|org:[a-z0-9-]+)$/.test(a)) {
      errors.push(`malformed audience: "${a}"`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ---------------- describing, for the admin UI ----------------

export function describeAudience(a) {
  if (a === AUDIENCE_PUBLIC) return "Anyone on the internet";
  if (a === AUDIENCE_LEGACY) return "Existing content (grandfathered)";
  if (a === AUDIENCE_INTERNAL) return "Platform staff only";
  if (a === AUDIENCE_CAMPUS_ANY) return "Every Campus institution";
  if (a === AUDIENCE_CORE_LEARN) return "devert.in/learn";
  if (a === AUDIENCE_CORE_PRACTICE) return "devert.in/practice";
  if (a.startsWith("staff:")) return `Staff at ${a.slice(6)}`;
  if (a.startsWith("org:")) return `Organization ${a.slice(4)}`;
  if (a.startsWith("campus:")) {
    const [inst, dept, year, section] = a.slice(7).split("/");
    if (section) return `${inst.toUpperCase()} - ${dept.toUpperCase()} year ${year}, section ${section.toUpperCase()}`;
    if (year) return `${inst.toUpperCase()} - ${dept.toUpperCase()} year ${year}`;
    if (dept) return `${inst.toUpperCase()} - ${dept.toUpperCase()}`;
    return inst.toUpperCase();
  }
  return a;
}

// Three states, because "legacy" is genuinely distinct from "published" and the
// admin UI must not present ~1,195 grandfathered documents as deliberate
// publishing decisions.
export function publishState(contentAudiences) {
  if (!Array.isArray(contentAudiences) || contentAudiences.length === 0) return "unpublished";
  if (contentAudiences.length === 1 && contentAudiences[0] === AUDIENCE_LEGACY) return "legacy";
  return "published";
}
