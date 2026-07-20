// DeVert Campus's palette - deliberately separate from Builder's OS's permanent
// dark/neon tokens in globals.css. Values are CSS var references, not literal
// hex - the actual light/dark values live in globals.css's .campus-theme block,
// toggled via the data-theme attribute (see CampusThemeToggle). Every component
// using CAMPUS.* in an inline style repaints on toggle automatically, with no
// per-component theme prop needed - the alternative (passing a resolved color
// object down) would mean threading theme state through every component that
// renders inside Campus.
export const CAMPUS = {
  paper: "var(--campus-paper)",
  surface: "var(--campus-surface)",
  line: "var(--campus-line)",
  ink: "var(--campus-ink)",
  inkSoft: "var(--campus-ink-soft)",
  inkFaint: "var(--campus-ink-faint)",
  teal: "var(--campus-teal)",
  tealTint: "var(--campus-teal-tint)",
  gold: "var(--campus-gold)",
  goldTint: "var(--campus-gold-tint)",
  good: "var(--campus-good)",
  goodTint: "var(--campus-good-tint)",
  warn: "var(--campus-warn)",
  warnTint: "var(--campus-warn-tint)",
  bad: "var(--campus-bad)",
  badTint: "var(--campus-bad-tint)",
  blue: "var(--campus-blue)",
  blueTint: "var(--campus-blue-tint)",
  purple: "var(--campus-purple)",
  purpleTint: "var(--campus-purple-tint)",
  shadow: "var(--campus-shadow)",
  shadowHover: "var(--campus-shadow-hover)",
  shadowLg: "var(--campus-shadow-lg)",
};
