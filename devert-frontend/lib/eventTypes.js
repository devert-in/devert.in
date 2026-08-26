// Shared "is this a hackathon" source of truth for the /hackathons + /h/{slug}
// feature now that it covers more than hackathons (workshops, meetups, open
// mic, tech talks). Pre-existing `hackathons/{slug}` docs have no eventType
// field at all - every call site must default a missing field to "hackathon",
// never the other way, or every hackathon created before this change vanishes
// from its own submissions/judging/prizes UI.
export const EVENT_TYPES = [
  { v: "hackathon", label: "Hackathon", hasSubmissions: true },
  { v: "workshop",  label: "Workshop",  hasSubmissions: false },
  { v: "meetup",    label: "Meetup",    hasSubmissions: false },
  { v: "open_mic",  label: "Open Mic",  hasSubmissions: false },
  { v: "tech_talk", label: "Tech Talk", hasSubmissions: false },
];

export function isHackathon(h) {
  return (h?.eventType || "hackathon") === "hackathon";
}

// Timestamp coercion shared by the registration-phase/timeline helpers below -
// duplicated from hackathon-detail-view.jsx's own tsToMs on purpose (that one
// stays private to the detail view; this is the copy the schema-level helpers
// here depend on).
function tsToMs(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  return null;
}

// Registration-specific phase, separate from the admin-set lifecycle `status`
// (upcoming/active/judging/ended). Optional `registrationCloseAt` lets an
// event auto-close signups on a schedule without an admin manually flipping
// status; events that don't set it just fall back to the existing
// upcoming/active-gated behavior, so this is a pure addition.
export function registrationPhase(h) {
  if (!h) return "closed";
  const now = Date.now();
  const opens = tsToMs(h.registrationOpen);
  const closes = tsToMs(h.registrationCloseAt);
  if (opens && now < opens) return "upcoming";
  if (closes && now >= closes) return "closed";
  if (!["upcoming", "active"].includes(h.status)) return "closed";
  return "open";
}

// Human-readable team-size range from the optional minTeamSize/maxTeamSize
// fields. Returns "" when neither is set, so callers can skip rendering.
export function teamSizeLabel(h) {
  const min = h?.minTeamSize, max = h?.maxTeamSize;
  if (min && max && min !== max) return `${min}-${max} Members`;
  if (max) return `${max} Member${max === 1 ? "" : "s"}`;
  if (min) return `${min}+ Members`;
  return "";
}

// Shared "Free | Virtual" listing-card label set for the optional `mode`
// field. Kept generic (any event type can set this), matching MODE_KEYS'
// three values one-to-one so a listing card and the admin form's button
// group can both drive off the same source.
export const EVENT_MODES = [
  { v: "in_person", label: "In Person" },
  { v: "virtual", label: "Virtual" },
  { v: "hybrid", label: "Hybrid" },
];

// One shared date formatter for anything event-related that displays a
// plain "closes on"/"happens on" date (listing cards, detail timeline) -
// en-IN locale, short month, matches the existing convention already used
// throughout hackathon-detail-view.jsx.
export function formatEventDate(ts) {
  const ms = tsToMs(ts);
  if (!ms) return null;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
