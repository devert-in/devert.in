# DeVert.in

A gamified developer social/learning platform. Next.js static export on
Firebase Hosting, talking directly to Firestore from the browser - there is
no application server in the request path.

## Repo layout

- `devert-frontend/` - the actual product. Next.js 16 App Router, `output:
  'export'` (static export, no server-side rendering, no API routes).
- `devert-campus/` - DeVert Campus's own standalone Next.js app (same
  `output: 'export'`), deployed to a separate Firebase Hosting target/site
  (`campus` → `devert-campus`, see `.firebaserc`) at campus.devert.in.
  **Not** a route inside devert-frontend - `/campus/**` on devert.in is a
  301 redirect straight to campus.devert.in (`firebase.json`'s `main`
  target), so any link should point at `https://campus.devert.in` directly,
  never at `/campus`. It imports a lot of shared code straight from
  devert-frontend BY SOURCE - `context/AuthContext.js`, `lib/firebase.js`,
  `lib/codelab.js`, `lib/staffAccounts.js`, and some `components/campus/*`
  primitives that never moved (e.g. `campus-ui.jsx`) - via
  `devert-campus/jsconfig.json`'s `@/*` path falling back to
  `../devert-frontend/*`. Because of that fallback, `NEXT_PUBLIC_API_URL`/
  `NEXT_PUBLIC_AUTH_DOMAIN` have to be set on devert-campus's own build too
  (see the separate `env:` block on `deploy-prod.yml`'s "Build campus"
  step) - omitting them there silently breaks CodeLab execution and
  staff-account admin actions on campus.devert.in without touching
  devert-frontend at all, since Next.js inlines `NEXT_PUBLIC_*` per app at
  build time.
- `devert-careers/` - DeVert Careers, a third standalone Next.js app (same
  `output: 'export'`), deployed to its own Firebase Hosting target/site
  (`careers` → `devert-careers`, see `.firebaserc`) at careers.devert.in.
  **Not** a route inside devert-frontend - `/careers/**` on devert.in is a
  301 redirect straight to careers.devert.in (`firebase.json`'s `main`
  target), so any link should point at `https://careers.devert.in` directly.
  Routes are domain-root: the listing is `/` and a role is `/{slug}`, NOT
  `/careers/{slug}` - the same reshaping Campus went through, and the same
  place its bugs came from.
  It borrows only two files from devert-frontend by source via
  `devert-careers/jsconfig.json`'s `@/*` fallback - `lib/careers.js` (the
  shared data layer, which devert-frontend's admin panels also use) and
  `lib/firebase.js`. Everything else, including every component, is native
  here - except `components/feature-gate.jsx` + `lib/featureFlags.js` (the
  admin's global feature switches, mounted in all three apps' root layouts),
  which is inline-styled precisely so it needs no `@source` here. Two
  consequences worth knowing:
  - It mounts **no `AuthProvider`** and calls no backend, so unlike
    devert-campus its CI build needs no `NEXT_PUBLIC_*` vars. Firebase Auth
    does not span subdomains on its own (that is what
    `devert-frontend/lib/sharedSession.js` exists for), and a hiring site
    needs no signed-in user: the application form is anonymous by design.
    Adding either a signed-in experience or a backend call here means wiring
    that bridge AND adding the env vars to the "Build careers" step.
  - `app/globals.css` has **no `@source` directive**, unlike devert-campus's,
    because no devert-frontend JSX is rendered here. If a devert-frontend
    component is ever imported, add `@source "../../devert-frontend";` or its
    utility classes silently compile to nothing.
  Job postings are authored from devert.in's admin console (CONTENT tab),
  not here - this app is read-only over `job_openings` plus an anonymous
  create into `job_applications`.
- `devert-backend/` - a small Spring Boot service that does ONLY things a
  browser can't safely do. Deployed on Google Cloud Run (`asia-south1`/Mumbai - see `NEXT_PUBLIC_API_URL` in `.github/workflows/deploy-prod.yml` and
  `deploy-mock.yml`, both pointed at the same `*.run.app` URL). `render.yaml`
  is still in the repo but is not what's actually live - don't trust it as
  the deployment source of truth. Two jobs:
  - Send real emails (payout status, hackathon registration confirmation)
    using SMTP credentials that must stay server-side. The frontend calls
    this via `NEXT_PUBLIC_API_URL` and no-ops silently if that's unset, so
    its absence never breaks a real feature.
  - CodeLab's code execution/grading: proxies OnlineCompiler.io calls
    (`CodeExecutionService` - migrated off Judge0 CE/RapidAPI for a far
    higher free quota; the API key must never reach the browser) and grades
    submissions against hidden test cases, which it reads server-side via
    `firebase-admin` - the ONLY code path that ever sees them, since Firestore
    rules block every client read of `problems/{id}/hiddenTests`.
    `FirebaseConfig`'s Firestore bean fails soft (returns null, logs a
    warning) if `FIREBASE_SERVICE_ACCOUNT_JSON`/`ONLINECOMPILER_API_KEY`
    aren't set, so a missing secret degrades CodeLab's endpoints only - it
    never takes down email.
- `scripts/` - one-off Node admin scripts using `firebase-admin` +
  `scripts/service-account.json` (gitignored, never commit it). Includes
  `set-admin-claim.mjs` for granting/revoking admin access.
- `firestore.rules`, `firestore.indexes.json`, `storage.rules` - the actual
  authority boundary. Nothing server-side double-checks these; if a rule is
  wrong, that's the whole vulnerability, not just a speed bump.

## Architecture

Every page reads/writes Firestore directly via the client SDK
(`lib/firebase.js`), most through live `onSnapshot` listeners so likes,
follows, notifications, and progress update across tabs/users without a
manual refresh. `AuthContext` is the single source of truth for the signed-in
user, their live profile doc, and whether they're an admin.

**Admin model:** a custom Firebase Auth claim (`admin: true`), not an email
check. Grant/revoke with `node scripts/set-admin-claim.mjs <email> [--revoke]` - the user must sign out/in (or get a token refresh) afterward for it to take
effect. `isAdmin()` in both rules files, and `isAdmin`/`adminChecked` from
`useAuth()` on the client, all key off this claim. Never reintroduce a
hardcoded admin email - it was migrated away from deliberately (see git
history around the security-hardening commit).

**Coin economy is trust-boundary-sensitive.** Coins convert to real INR
payouts (Wallet page). Any rule change touching `user_earnings`,
`pulse_posts` engagement counters, or `coin_transactions` must keep the
existing bounded-delta pattern (see `firestore.rules`) - a non-owner may only
ever move a counter by a validated ±1 or a known reward amount read live from
`system/economy`, never an arbitrary value. The durable fix - moving
reward-granting server-side via Cloud Functions - is **no longer blocked**:
billing is active and `functions/` is deployed (see `firebase.json`'s `main`
target hosting rewrites: `uHandleRouter`, `contestPreviewRouter`,
`pulsePreviewRouter`, which require the Blaze plan - `campusPreviewRouter`
still exists in `functions/index.js` but is dead code now, since that
same target's `/campus/**` 301 redirect to campus.devert.in fires before
Hosting ever considers the rewrite, for crawlers and browsers alike).
It just hasn't been done yet, so until it is, the rules-level bounds remain
the only thing standing between a user and forging their own balance. Anything
that needs a trusted server path (reward granting, paid-API proxying, audio
caching) can now use a Cloud Function rather than being designed around its
absence.

**GATE is a global Campus section, not an institution feature.** The module
itself is large and already built - `lib/gate.js` (three-level
`gatePapers/{id}/subjects/{id}/topics/{id}` catalog), `lib/gatePyq.js` (the
flat `gate_pyqs` bank, attempts, bookmarks, mistakes notebook), `lib/gateTests.js`,
and a sixteen-section workspace in `devert-campus/components/campus/gate/`
driven by `gate-app.jsx`'s `GATE_SECTIONS`. It mounts in **two** places from
that one implementation: inside an institution workspace as `?tab=gate` (gated
on the per-classroom `gate` module toggle in `lib/campusNavConfig.js`), and at
the public **`campus.devert.in/gate`**, which is in `GLOBAL_SECTIONS`
(`lib/campus-seo.js`) and deliberately carries no module gate - a GATE
candidate need not be any college's student. Same precedent as `/roadmaps`:
one national syllabus and one PYQ bank, so a per-college URL would be N copies
of identical content. Don't add a second GATE surface or a per-institution
`/{college}/gate` segment.

**PYQ content comes from PDFs and is never auto-published.** The official
question papers live in `GATE/` and are turned into drafts by
`scripts/extract-gate-pyqs.mjs` → `scripts/import-gate-pyq-drafts.mjs`. Three
facts about that source drive the whole design and are not going to change:
the papers contain **no answer keys**, extraction **drops mathematical symbols**
(a formula's variables vanish - the parser detects this, it cannot repair it),
and **figures are absent from the text layer entirely**. So every imported
question lands as `status:"draft"` with `needsReview:true` and a `reviewFlags`
array, is invisible to students (`firestore.rules` + every `fetchPyqs()` carries
`where("status","==","published")`), and is excluded from the count the landing
page advertises. `pyqPublishBlockers()` in `lib/gatePyq.js` is the one gate to
publishing and refuses anything with no answer or no subject - publishing an
unanswered question would mark a correct student wrong and file it into their
mistakes notebook. The extractor self-checks against GATE's **100-mark
invariant** (65 questions, 30 × 1 mark + 35 × 2), which is what catches
question-splitting and mark-band bugs; keep that check passing.

## Design system

**The three apps now share one palette.** As of 2026-09-23 all three run on
the logo's own green and cyan over a dark brushed-metal plate. They still
differ in *density and voice* - devert.in is neon-terminal (mono chrome,
`.terminal-window` cards), Campus is premium-SaaS (Inter, glass, rounded),
Careers is quiet and typographic - but they are no longer three separate
colour identities.

**Careers was light-first until 2026-09-23** and its `globals.css` header
still records why (a candidate deciding whether to send a resume is not a
user being sold a product; the terminal aesthetic reads as a toy to senior
engineers). That argument was overruled in favour of one consistent brand.
It is kept written down because it was a real position, not an oversight - if the hiring site ever feels off-brand for its audience, that is the
reasoning to re-read before flipping it back.

**How the Careers flip was done, because it constrains future edits:** the
`ink-*` ramp was **inverted** rather than every component rewritten - `ink-50` is now the darkest and `ink-900` the lightest. Every component
there already used the ramp semantically (`text-ink-900` = strongest text,
`border-ink-200` = hairline, `bg-ink-50` = faintest surface), so reversing
the values re-themed the app without touching those class names. Keep using
the ramp semantically and new components stay correct. The `brand-*` ramp
**brightens** with the scale for the same reason: on a dark surface a hover
must go lighter, so `brand-700` is brighter than `brand-600`.

**Green fills always carry dark text.** `bg-brand-600` (`#3ce86f`) with
`text-white` measures ~1.5:1. Every CTA on Careers uses `text-[#05080F]`,
and the same rule holds on Campus (`--campus-teal` is `#22C55E` precisely so
it CAN carry white) and on devert.in's
`Enter HQ` button.

**One shared surface cuts across all three: the hero plate.**
`public/devert-hero-bg.jpg` - the logo's own brushed-metal circuit backing
with the chevrons removed - is the hero backdrop on devert.in,
campus.devert.in and careers.devert.in, so the three sites open the same way.
**All three now carry it site-wide on `body`**, not just in the hero. The
JPEG is duplicated into each app's `public/` (each Next app serves its own;
the jsconfig `@/*` source sharing does not cover static assets), at one
config everywhere: `#05070c` base, `rgba(5,7,12,.66/.82)` scrim, `cover`,
`center`, `background-attachment: fixed`.

Campus got there last and only once it went dark-only. Its plate used to
ride a `::before` so it could swap per theme, and that layer was covered by
an opaque descendant three separate times (`.vs-scope`'s fill, a landing
`<main>` carrying no plate class at all, and `.vs-canvas::before` stacking a
second scrolling copy on the fixed one). `campusPhotoBg()` now returns
`none` by default and that `::before` survives only for a student's uploaded
`campusBgUrl`.

**The plate goes on `body`'s own `background-image`, never a `body::before`
layer.** Both devert.in and Careers set an opaque background on `html`, which
stops `body`'s background propagating to the canvas - so `body` paints its
own box, and a stacking context paints that box *after* its negative
`z-index` children. A `::before` plate is therefore covered by `body`'s own
background on every page. devert.in shipped exactly that bug; the long
version is in its `globals.css`.

**This section describes the main site** (landing page, Arena, Shipyard,
Pulse, Grind, etc.) - the neon-terminal identity below. **DeVert Campus has
its own design system**: Inter typography, glass surfaces, **dark-only**
(the light theme and its toggle were removed on 2026-09-23 - it was the one
surface that could not carry the dark plate), and - as of the 2026-09-22
repaint - **the brand's own green and
cyan, taken from `public/Logo.png`**, replacing three earlier accent pivots
(Indigo → Purple → warm orange/amber). See `lib/campus-theme.js`'s `CAMPUS`
tokens and `globals.css`'s `.campus-theme` block for the actual values, and
`components/campus/campus-ui.jsx` for the shared primitives (`CampusCard`,
`CampusButton`, `CampusStat`, etc.) every Campus screen builds from.

Four rules came with that repaint, all asked for directly:
- **Flat fills, no gradients.** `--campus-gradient-primary`/`-hero` keep their
  names (every call site already references them) but hold a **solid colour**.
  Don't put a `linear-gradient()` back into either.
- **No glows.** No coloured `box-shadow` bleeding off a control - use
  `CAMPUS.shadow`/`shadowHover`/`shadowLg`, which are neutral. The tinted
  active-tab glow that had been copy-pasted into nine files is gone from all
  nine.
- **No decorative backdrop.** `campusPhotoBg()` returns **`none`** - `body`
  paints the plate instead. It
  used to serve a photographic hanging-bulb JPEG - which is the only reason
  the warm orange accent ever existed - and briefly a green/cyan radial mesh;
  both were rejected for competing with content. A student's own uploaded
  `campusBgUrl` still gets the photo treatment; that path is untouched.
- **No terminal-window chrome.** `.terminal-window` and friends stay main-site
  only.

The primary token is `#22C55E`, **not** the logo's
literal neon: `CampusButton`'s primary variant and `CampusTabs`' active tab
paint white text straight onto it, and white on neon green measures ~1.5:1.
The neon is for icons, borders and the mark itself - things nothing sits on
top of. `CampusBadge` renders the single `Logo.png` mark, downscaled to 192px
into *each* app's own `public/` (the `@/*` source-sharing that lets Campus
import the component does not cover static assets); the old two-variant
dark/light badge swap is gone.

Campus was the neon-terminal look before all of this; that was a deliberate
full pivot, not an oversight. Campus and the main site now share a *palette*
but NOT a design language - don't backport the terminal chrome either way.

- **Palette:** near-black background, neon accents - green `#00FF41`
  (primary/positive), cyan `#00FFFF` (secondary/info), orange `#FF9500`,
  red `#FF5050`, purple `#C77DFF`/`#A78BFA`, gold `#FFD700`. Pick from this
  set; don't introduce new accent colors casually.
- **Type:** `font-mono` for chrome, labels, data, terminal text; `font-sans`
  for prose/headings. `lucide-react` is the only icon library - **no
  emoji anywhere in the UI**, use a Lucide icon instead, even for things like
  medal rankings or status indicators.
  - **Exception - programming language / brand logos:** where a specific
    language or brand needs to be instantly recognizable (Programming
    module's language cards/roadmap header, `CodeExampleBlock`'s editor
    header, the admin language list), use the official mark via `simple-icons`
    (self-hosted SVG path data + brand hex color, no CDN, tree-shaken per-icon - see `package.json`'s `sideEffects: false`), through the single shared
    `LanguageLogo` component (`components/campus/language-logo.jsx`). Never
    import `simple-icons` ad hoc elsewhere - that component is the one place
    the language→logo map lives. Not every language has a licensable brand
    asset (Java/C#/PowerShell/MATLAB aren't in Simple Icons); those fall back
    to a plain Lucide glyph from the same file, per its own comments. This is
    the only sanctioned emoji-adjacent exception - everything else in the UI
    stays Lucide-only.
- **Chrome:** `.terminal-window` / `.terminal-header` are the standard
  card/panel treatment across the app. **They are PLAIN CARDS now** - a dark
  fill on the plate, a hairline, a quiet header strip. The fake macOS title
  bar is gone: 330 `.terminal-dot` elements were removed from 58 files and
  the class is no longer defined, so one reappearing in markup renders as
  nothing. The names were kept because they are used 541 times across 80
  files and the look lives in CSS, not the name - read `.terminal-window` as
  `.card`. Reach for it before inventing a new container style.
- **Page width is a deliberate choice, not an oversight:**
  - Dashboard/list/grid pages (Home, Arena, Grind, Shipyard, Intel, Missions,
    Ranks, Broadcast, Hackathons, Wallet, admin) go wide on desktop - `lg:max-w-5xl` to `lg:max-w-6xl`, reflowing into multi-column grids or a
    main-content + sidebar split above the `lg:` breakpoint.
  - Reading/form pages (Learn lessons, legal pages, changelog, login) stay
    narrow (`max-w-2xl`-`max-w-3xl`) on every breakpoint on purpose - long
    line lengths hurt readability, widening these is a regression, not an
    improvement.
  - The Pulse feed stays a narrow single column by design (like any
    social feed) - don't stretch it to match the dashboard pages.
- **Navbar** is a floating bottom dock component (`navbar.jsx`) - icon-only
  and compact on mobile, icon+label and larger on `lg:`. `top-navbar.jsx` is
  the desktop top bar with grouped dropdowns; don't add a third nav surface
  without being asked directly. The two intentionally
  show *different* scopes (the dock is a curated "used every session" set,
  the pill affords a fuller categorized sitemap), not the same items twice,
  so both read from one shared route registry, `lib/navConfig.js`, rather
  than keeping their own lists in sync by hand - add a new nav-eligible
  route there, once.
- **The top bar is adaptive, and shared by all three apps.** Transparent at
  the top of a page so the plate reads unbroken, plate surface once scrolled,
  and forced solid whenever a menu is open (a transparent bar over an opaque
  dropdown reads as a bug). Driven by `lib/useScrolled.js`, which campus and
  careers reach through their `@/*` fallback - safe to share despite the
  no-`@source` rule because it has no JSX and no class names. The surface is
  `.devert-navbar` / `.is-solid` / `.devert-navbar-panel`, duplicated per app.
  A gradient scrim sits under the transparent state: the plate's top-left
  carries legible code text that otherwise runs straight through the labels.
  devert.in's floating pill is gone, and so is the 80px spacer that existed
  only because the pill was `position: fixed`.

- **Admin console extends existing tabs**, it never grows a second
  top-level admin surface. A new admin capability belongs inside
  Overview/Content/Community/Challenges/Moderation, not a new tab family.

## Before recommending a "let's add X page/nav item"

Check `lib/navConfig.js`'s `NAV_ROUTES` first (the shared registry both
`navbar.jsx` and `top-navbar.jsx` render from) - new features integrate
into an existing route/tab rather than adding new top-level navigation,
unless a human explicitly asks for a new nav entry.
