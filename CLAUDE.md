# DeVert.in

A gamified developer social/learning platform. Next.js static export on
Firebase Hosting, talking directly to Firestore from the browser — there is
no application server in the request path.

## Repo layout

- `devert-frontend/` — the actual product. Next.js 16 App Router, `output:
  'export'` (static export, no server-side rendering, no API routes).
- `devert-backend/` — a small Spring Boot service that does ONLY things a
  browser can't safely do. Deployed on Google Cloud Run (`asia-south1`/Mumbai
  — see `NEXT_PUBLIC_API_URL` in `.github/workflows/deploy-prod.yml` and
  `deploy-mock.yml`, both pointed at the same `*.run.app` URL). `render.yaml`
  is still in the repo but is not what's actually live — don't trust it as
  the deployment source of truth. Two jobs:
  - Send real emails (payout status, hackathon registration confirmation)
    using SMTP credentials that must stay server-side. The frontend calls
    this via `NEXT_PUBLIC_API_URL` and no-ops silently if that's unset, so
    its absence never breaks a real feature.
  - CodeLab's code execution/grading: proxies Judge0 CE calls (`Judge0Service`,
    hosted on RapidAPI — the API key must never reach the browser) and grades
    submissions against hidden test cases, which it reads server-side via
    `firebase-admin` — the ONLY code path that ever sees them, since Firestore
    rules block every client read of `problems/{id}/hiddenTests`.
    `FirebaseConfig`'s Firestore bean fails soft (returns null, logs a
    warning) if `FIREBASE_SERVICE_ACCOUNT_JSON`/`JUDGE0_API_KEY` aren't set,
    so a missing secret degrades CodeLab's endpoints only — it never takes
    down email.
- `scripts/` — one-off Node admin scripts using `firebase-admin` +
  `scripts/service-account.json` (gitignored, never commit it). Includes
  `set-admin-claim.mjs` for granting/revoking admin access.
- `firestore.rules`, `firestore.indexes.json`, `storage.rules` — the actual
  authority boundary. Nothing server-side double-checks these; if a rule is
  wrong, that's the whole vulnerability, not just a speed bump.

## Architecture

Every page reads/writes Firestore directly via the client SDK
(`lib/firebase.js`), most through live `onSnapshot` listeners so likes,
follows, notifications, and progress update across tabs/users without a
manual refresh. `AuthContext` is the single source of truth for the signed-in
user, their live profile doc, and whether they're an admin.

**Admin model:** a custom Firebase Auth claim (`admin: true`), not an email
check. Grant/revoke with `node scripts/set-admin-claim.mjs <email> [--revoke]`
— the user must sign out/in (or get a token refresh) afterward for it to take
effect. `isAdmin()` in both rules files, and `isAdmin`/`adminChecked` from
`useAuth()` on the client, all key off this claim. Never reintroduce a
hardcoded admin email — it was migrated away from deliberately (see git
history around the security-hardening commit).

**Coin economy is trust-boundary-sensitive.** Coins convert to real INR
payouts (Wallet page). Any rule change touching `user_earnings`,
`pulse_posts` engagement counters, or `coin_transactions` must keep the
existing bounded-delta pattern (see `firestore.rules`) — a non-owner may only
ever move a counter by a validated ±1 or a known reward amount read live from
`system/economy`, never an arbitrary value. The durable fix (moving
reward-granting server-side via Cloud Functions) is blocked on the project's
Firebase billing account being reactivated; until then, the rules-level
bounds are the only thing standing between a user and forging their own
balance.

## Design system

**This section describes the main site** (landing page, Arena, Shipyard,
Pulse, Grind, etc.) — the neon-terminal identity below. **DeVert Campus has
its own, deliberately different design system** (a premium-SaaS look:
Indigo/Violet/Cyan on deep navy, glassmorphism, Inter typography, gradient
buttons, dark-first theming) — see `lib/campus-theme.js`'s `CAMPUS` tokens
and `globals.css`'s `.campus-theme` block for the actual values, and
`components/campus/campus-ui.jsx` for the shared primitives (`CampusCard`,
`CampusButton`, `CampusStat`, etc.) every Campus screen builds from. Campus
was the neon-terminal look before; that was a deliberate full pivot, not an
oversight — don't backport it to the main site or vice versa.

- **Palette:** near-black background, neon accents — green `#00FF41`
  (primary/positive), cyan `#00FFFF` (secondary/info), orange `#FF9500`,
  red `#FF5050`, purple `#C77DFF`/`#A78BFA`, gold `#FFD700`. Pick from this
  set; don't introduce new accent colors casually.
- **Type:** `font-mono` for chrome, labels, data, terminal text; `font-sans`
  for prose/headings. `lucide-react` is the only icon library — **no
  emoji anywhere in the UI**, use a Lucide icon instead, even for things like
  medal rankings or status indicators.
  - **Exception — programming language / brand logos:** where a specific
    language or brand needs to be instantly recognizable (Programming
    module's language cards/roadmap header, `CodeExampleBlock`'s editor
    header, the admin language list), use the official mark via `simple-icons`
    (self-hosted SVG path data + brand hex color, no CDN, tree-shaken per-icon
    — see `package.json`'s `sideEffects: false`), through the single shared
    `LanguageLogo` component (`components/campus/language-logo.jsx`). Never
    import `simple-icons` ad hoc elsewhere — that component is the one place
    the language→logo map lives. Not every language has a licensable brand
    asset (Java/C#/PowerShell/MATLAB aren't in Simple Icons); those fall back
    to a plain Lucide glyph from the same file, per its own comments. This is
    the only sanctioned emoji-adjacent exception — everything else in the UI
    stays Lucide-only.
- **Chrome:** the `.terminal-window` / `.terminal-header` / `.terminal-dot`
  classes (globals.css) are the standard card/panel treatment across the
  entire app — three colored dots, a mono label, content below. Reach for
  this before inventing a new container style.
- **Page width is a deliberate choice, not an oversight:**
  - Dashboard/list/grid pages (Home, Arena, Grind, Shipyard, Intel, Missions,
    Ranks, Broadcast, Hackathons, Wallet, admin) go wide on desktop —
    `lg:max-w-5xl` to `lg:max-w-6xl`, reflowing into multi-column grids or a
    main-content + sidebar split above the `lg:` breakpoint.
  - Reading/form pages (Learn lessons, legal pages, changelog, login) stay
    narrow (`max-w-2xl`–`max-w-3xl`) on every breakpoint on purpose — long
    line lengths hurt readability, widening these is a regression, not an
    improvement.
  - The Pulse feed stays a narrow single column by design (like any
    social feed) — don't stretch it to match the dashboard pages.
- **Navbar** is a single floating bottom dock component (`navbar.jsx`) used
  at every breakpoint — icon-only and compact on mobile, icon+label and
  larger on `lg:`. Don't add a second, separate top-nav component for
  desktop; extend this one.
- **Admin console extends existing tabs**, it never grows a second
  top-level admin surface. A new admin capability belongs inside
  Overview/Content/Community/Challenges/Moderation, not a new tab family.

## Before recommending a "let's add X page/nav item"

Check `components/navbar.jsx`'s `NAV_ITEMS` first — new features integrate
into an existing route/tab rather than adding new top-level navigation,
unless a human explicitly asks for a new nav entry.
