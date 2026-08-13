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
  // Primary interactive accent - kept the `teal` name since hundreds of
  // already-shipped components key their primary color off CAMPUS.teal; see
  // globals.css's .campus-theme comment for why that made this a one-file
  // palette swap instead of a per-component migration. Now warm orange/amber
  // (was Purple, before that Indigo) - third pivot, this time to match the
  // photographic hanging-bulb background behind the student Dashboard.
  teal: "var(--campus-teal)",
  tealTint: "var(--campus-teal-tint)",
  // Secondary accent (Pink) - new token, no prior name to repoint.
  pink: "var(--campus-pink)",
  pinkTint: "var(--campus-pink-tint)",
  // Tertiary decorative accent (Orange) - new token, distinct from `gold`
  // (which stays reserved for currency/coins everywhere it's already used -
  // repointing it would break that semantic pairing across the app).
  orange: "var(--campus-orange)",
  orangeTint: "var(--campus-orange-tint)",
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

// The photographic hanging-bulb backdrop behind EVERY Campus surface (the
// authenticated workspace's every tab, the public landing/info pages, the
// pre-auth gate screens) - not just the student Dashboard the redesign
// started on. One function so every page reads the same two files and
// applies the same scrim math, rather than five near-identical inline style
// objects silently drifting apart over time. `backgroundAttachment: "fixed"`
// keeps the photo pinned to the viewport rather than tiling/scrolling with
// page content, which matters most on the long marketing pages.
// `customUrl` - a student's own uploaded photo (users/{uid}.campusBgUrl, see
// BackgroundUploadCard in campus-app.jsx) - overrides the default theme
// photo everywhere this is called, so picking one photo once re-skins the
// whole app rather than just the Dashboard tab that exposes the control.
// Returns a CSS custom property, not a direct `backgroundImage` - the photo
// itself renders through the "campus-photo-bg" class's ::before layer
// (globals.css), which is what carries the blur. A literal `filter: blur()`
// on THIS element would blur its own children too (every card and every
// line of text on the page) - putting the blurred photo on a separate
// negative-z-index pseudo-element behind the real content is what lets the
// backdrop soften without smearing anything sitting on top of it. Callers
// must add the "campus-photo-bg" class alongside this style spread - see
// its call sites (CampusWorkspace, CampusLanding, CampusShell, etc).
export function campusPhotoBg(theme, customUrl) {
  const url = customUrl || (theme === "dark" ? "/campus-bg-dark-theme.jpg" : "/campus-bg-light-theme.jpg");
  const scrim = theme === "dark" ? "rgba(10,14,23,0.62)" : "rgba(248,249,250,0.55)";
  return {
    "--campus-bg-image": `linear-gradient(${scrim}, ${scrim}), url(${url})`,
  };
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
