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

// The backdrop behind EVERY Campus surface (the
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
  // A student's own uploaded photo still gets the original photographic
  // treatment - scrim on top, blurred by the ::before layer. Only the DEFAULT
  // backdrop changed.
  if (customUrl) {
    const scrim = theme === "dark" ? "rgba(10,14,23,0.62)" : "rgba(248,249,250,0.55)";
    return { "--campus-bg-image": `linear-gradient(${scrim}, ${scrim}), url(${customUrl})` };
  }

  // Default in DARK theme: the brand plate, the same devert-hero-bg.jpg that
  // devert.in and careers.devert.in paint on body. Campus used to be the odd
  // one out - only its landing hero (.vs-canvas) carried the plate, so every
  // other surface (Campuses, Pricing, For institutions, the whole workspace)
  // was flat black while the rest of the platform was textured.
  //
  // History, so the old backdrops do not come back: this originally loaded two
  // hanging-bulb JPEGs, which is what made every Campus surface read warm/tan
  // and why --campus-teal had been pivoted to warm orange to stop fighting
  // them. Those were replaced by a green/cyan radial mesh, which was rejected
  // for glowing, then by a flat canvas, which is what this replaces.
  //
  // LIGHT THEME STAYS FLAT. The plate is dark artwork; putting it behind
  // Campus's light theme would leave dark text on a dark photo. Campus is the
  // only one of the three apps with a light/dark toggle, so it is the only one
  // that needs this branch at all.
  //
  // The flat value is a same-colour linear-gradient rather than `none`: this
  // is consumed as a background-image on .campus-photo-bg's ::before layer,
  // and `none` would make that layer transparent and leave the canvas to
  // whatever the element behind it happens to paint.
  if (theme === "dark") {
    return {
      "--campus-bg-image": "linear-gradient(rgba(5,7,12,0.66), rgba(5,7,12,0.82)), url(/devert-hero-bg.jpg)",
      // Sharp. The 30px default exists to soften a student's uploaded photo;
      // applying it to the plate would smear the circuit tracery into the mush
      // that got the first background rejected as blurry.
      "--campus-bg-blur": "0px",
      // No overscan either. The -40px default exists so a 30px blur never
      // samples past the layer's edge and darkens it; with blur off it only
      // scales the plate differently from devert.in and careers, which paint
      // it as a plain body background with no overscan at all. Matching them
      // is the whole point - the three landings must read as one surface.
      "--campus-bg-inset": "0px",
    };
  }
  return { "--campus-bg-image": "linear-gradient(#F8F9FA, #F8F9FA)", "--campus-bg-blur": "0px" };
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

