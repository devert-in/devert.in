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
  // A second, slightly-lifted surface tone (between paper and surface) - for
  // nested/hover states inside a card, or a page's overall dashboard-widget
  // background, where a plain white/pure-surface tone would read too flat
  // against the premium-SaaS glass/depth look.
  surface2: "var(--campus-surface-2)",
  line: "var(--campus-line)",
  ink: "var(--campus-ink)",
  inkSoft: "var(--campus-ink-soft)",
  inkFaint: "var(--campus-ink-faint)",
  // Primary interactive accent (Indigo) - kept the `teal` name since hundreds
  // of already-shipped components key their primary color off CAMPUS.teal;
  // see globals.css's .campus-theme comment for why that made this a
  // one-file palette swap instead of a per-component migration.
  teal: "var(--campus-teal)",
  tealTint: "var(--campus-teal-tint)",
  cyan: "var(--campus-cyan)",
  cyanTint: "var(--campus-cyan-tint)",
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
  glassBg: "var(--campus-glass-bg)",
  glassBorder: "var(--campus-glass-border)",
  gradientPrimary: "var(--campus-gradient-primary)",
  gradientHero: "var(--campus-gradient-hero)",
};

// Translucent tint of any color, for the "tinted icon chip / soft pill"
// idiom used all over Campus (CampusChip, CampusStat, CampusEmptyState,
// SectionHeader...). Exists because the obvious shorthand those call sites
// used - string-concatenating an 8-bit alpha suffix, `${color}18` - only ever
// worked for literal hex. Every CAMPUS.* token is a var() reference, so
// `${CAMPUS.purple}18` produced the string "var(--campus-purple)18", which is
// not a valid <color>: browsers dropped the whole declaration and the chip
// rendered fully transparent instead of tinted. color-mix() composes with
// var() correctly, so this works for both a token and a raw hex (e.g. an
// institution's heroAccentColor, or NEON_ACCENT_HEX below).
//
// `pct` is the color's own share of the mix - tint(CAMPUS.teal, 12) is a 12%
// teal wash over whatever sits behind it, matching the ~0x18/255 ≈ 9-10% the
// old suffix was reaching for, nudged up slightly since it now actually
// renders. Alpha-composites over the parent background rather than blending to
// a fixed white, so a tint stays correct in both light and dark themes.
export function tint(color, pct = 12) {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

// Fixed literal hex, deliberately NOT CAMPUS.* var() references - an
// institution's heroAccentColor is a brand color stored as a plain hex
// string in Firestore and rendered on public-facing banners that must look
// the same regardless of the viewer's light/dark toggle, unlike every other
// CAMPUS token above. Matches the platform's documented neon accent palette
// (see CLAUDE.md's Design System section) - the one shared source for it,
// so campus-branding.jsx's preset swatches don't drift from that palette as
// independently copy-pasted literals.
export const NEON_ACCENT_HEX = ["#00FF41", "#00FFFF", "#FF9500", "#C77DFF", "#FFD700", "#3B82F6"];
