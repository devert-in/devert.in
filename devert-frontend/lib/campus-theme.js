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
  // Fixed dark chrome, deliberately NOT theme-inverting - see globals.css's
  // own comment. Use for anything meant to stay a dark block with white text
  // regardless of light/dark toggle (primary buttons, hero banners, the
  // sidebar logo badge) - CAMPUS.ink is a foreground token and will invert.
  chromeBg: "var(--campus-chrome-bg)",
  chromeFg: "var(--campus-chrome-fg)",
  shadow: "var(--campus-shadow)",
  shadowHover: "var(--campus-shadow-hover)",
  shadowLg: "var(--campus-shadow-lg)",
};

// Fixed literal hex, deliberately NOT CAMPUS.* var() references - an
// institution's heroAccentColor is a brand color stored as a plain hex
// string in Firestore and rendered on public-facing banners that must look
// the same regardless of the viewer's light/dark toggle, unlike every other
// CAMPUS token above. Matches the platform's documented neon accent palette
// (see CLAUDE.md's Design System section) - the one shared source for it,
// so campus-branding.jsx's preset swatches don't drift from that palette as
// independently copy-pasted literals.
export const NEON_ACCENT_HEX = ["#00FF41", "#00FFFF", "#FF9500", "#C77DFF", "#FFD700", "#3B82F6"];
