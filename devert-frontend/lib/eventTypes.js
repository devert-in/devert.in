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
