import {
  Code2, Anchor, Briefcase, GraduationCap, Award, Trophy, Radio, Clock, Mail,
} from "lucide-react";

// Section keys that can be reordered/hidden by the owner. Hero, identity, and
// stats are always shown first and are NOT part of this list - only the
// storytelling sections below them are user-controllable.
export const ALL_SECTION_KEYS = [
  "techstack", "projects", "experience", "education",
  "certifications", "achievements", "pulse", "timeline", "contact",
];

export const DEFAULT_SECTION_ORDER = [...ALL_SECTION_KEYS];

export const SECTION_META = {
  techstack:      { label: "Tech Stack",     icon: Code2 },
  projects:       { label: "Projects",       icon: Anchor },
  experience:     { label: "Experience",     icon: Briefcase },
  education:      { label: "Education",      icon: GraduationCap },
  certifications: { label: "Certifications", icon: Award },
  achievements:   { label: "Achievements",   icon: Trophy },
  pulse:          { label: "Pulse Activity",  icon: Radio },
  timeline:       { label: "Activity Timeline", icon: Clock },
  contact:        { label: "Contact",        icon: Mail },
};

// Approved DeVert accent palette only - the portfolio theme picker must never
// offer free-form color input (see CLAUDE.md's design-system rule).
export const ACCENT_OPTIONS = [
  { name: "Green",  value: "#00FF41" },
  { name: "Cyan",   value: "#00FFFF" },
  { name: "Orange", value: "#FF9500" },
  { name: "Red",    value: "#FF5050" },
  { name: "Purple", value: "#C77DFF" },
  { name: "Gold",   value: "#FFD700" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "open_to_work",         label: "Open to work" },
  { value: "open_to_freelance",    label: "Open to freelance" },
  { value: "open_to_internships",  label: "Open to internships" },
  { value: "unavailable",          label: "Not currently available" },
];

// Effective, ordered, visible section list for a given profile - every
// consumer (public portfolio page, editor's section-order control) should
// derive from this so an account with neither field set still gets a sane
// default order instead of an empty portfolio.
export function effectiveSections(userData) {
  const order = userData?.sectionOrder?.length ? userData.sectionOrder : DEFAULT_SECTION_ORDER;
  const hidden = new Set(userData?.hiddenSections || []);
  // Any key missing from a stale/partial sectionOrder still appears, appended
  // at the end, so a newly-added section key never silently disappears for
  // existing users who saved an order before it existed.
  const known = new Set(order);
  const withNewKeys = [...order, ...ALL_SECTION_KEYS.filter(k => !known.has(k))];
  return withNewKeys.filter(k => ALL_SECTION_KEYS.includes(k) && !hidden.has(k));
}
