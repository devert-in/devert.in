import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { TopNavbar } from "@/components/top-navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";
import { ReferralCapture } from "@/components/referral-capture";
import { FeatureGate } from "@/components/feature-gate";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// DeVert Campus's own typeface (see globals.css's .campus-theme) - scoped to
// that class only, not the marketing site's Space Grotesk/JetBrains Mono
// identity, so this is a Campus-only typography change, not a site-wide one.
// self-hosted at build time by next/font (no runtime font CDN request).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://devert.in"),
  title: {
    default:  "DeVert - Builder's OS",
    template: "%s | DeVert",
  },
  description:
    "Introvert. Extrovert. DeVert. Developer + Verts - a new identity for builders who ship. Arena, Shipyard, Intel Feed, Missions, Daily Grind, Pulse and more. This is your Builder's OS.",
  keywords: [
    "DeVert", "developer platform", "coding arena", "developer community",
    "Developer Verts", "DeVerts", "introvert extrovert developer",
    "hackathons", "DSA practice", "dev missions", "tech pulse", "shipyard projects",
    "grind challenges", "developer OS", "builder platform", "builder identity",
  ],
  authors:   [{ name: "DeVert", url: "https://devert.in" }],
  creator:   "DeVert",
  publisher: "DeVert",
  // Matches devert-campus and devert-careers exactly. Two entries were
  // removed rather than re-pointed:
  //
  // /logo.svg - an SVG favicon, which Chrome and Firefox PREFER over every
  // PNG and ICO below it. It held the old `</>` chevron mark, so it was the
  // icon actually being displayed no matter what the raster set contained;
  // regenerating the PNGs alone changed nothing visible. The file is gone
  // too - it was referenced nowhere else in the app. There is no SVG of the
  // current logo because the logo is raster artwork, and a rasterised SVG
  // would only reintroduce the same precedence trap.
  //
  // icon-192/512 - PWA install icons. They belong in app/manifest.ts, which
  // already lists them (with the maskable variants); declaring them as
  // <link rel=icon> as well just gave the browser two more candidates to
  // pick the wrong one from for a 16px tab.
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple:   [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         "https://devert.in",
    siteName:    "DeVert",
    title:       "DeVert - Builder's OS",
    description: "Introvert. Extrovert. DeVert. A new identity for developers who build, ship, and grind.",
    // og-image.png, not logo.png. logo.png is a 2048x2048 SQUARE weighing
    // 6.6 MB - over Twitter's documented 5 MB image ceiling, so the card
    // image was being dropped outright, and square art gets centre-cropped
    // to 1.91:1 by every major unfurler anyway. og-image.png is a purpose-
    // built 1200x630 at ~58 KB (generated from logo.png + the design-system
    // palette; regenerate it if the mark changes).
    images: [{
      url:    "https://devert.in/og-image.png",
      width:  1200,
      height: 630,
      alt:    "DeVert - Builder's OS",
    }],
  },
  twitter: {
    // Safe to use the large card now that the image is 1.91:1 and well under
    // the size ceiling; matches what buildCampusMetadata already emits for
    // every Campus page (lib/campus-seo.js).
    card:        "summary_large_image",
    site:        "@devert_in",
    title:       "DeVert - Builder's OS",
    description: "Introvert. Extrovert. DeVert. A new identity for builders.",
    images:      ["https://devert.in/og-image.png"],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
  alternates: {
    canonical: "https://devert.in",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#050505",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://devert.in/#website",
      "name": "DeVert",
      "alternateName": ["DeVert", "DeVert - Builder's OS", "devert.in"],
      "url": "https://devert.in",
      "description": "Introvert. Extrovert. DeVert. Developer + Verts - a new identity for builders who ship.",
      // No SearchAction/potentialAction on purpose. It previously pointed at
      // https://devert.in/u/{search_term_string} - but /u/{handle} is the USER
      // PROFILE route, not a site search. A SearchAction declares a sitelinks
      // searchbox, so Google would have piped arbitrary queries ("dsa
      // problems") into a profile URL and 404'd them.
      //
      // Declaring a searchbox that doesn't work is strictly worse than
      // declaring none, and there is no public search route to point at
      // (CommandPalette is client-side and has no URL). Re-add this only
      // alongside a real indexable /search?q= route.
    },
    {
      "@type": "Organization",
      "@id": "https://devert.in/#organization",
      "name": "DeVert",
      // The ONE legitimate, non-spammy place to declare brand aliases. Google
      // reads alternateName on the Organization entity; a <meta keywords> list
      // of misspellings does nothing (dropped as a ranking signal ~2009) and
      // repeating variants in body copy reads as keyword stuffing.
      //
      // "Divert" is the misspelling students actually type. Google may well
      // ignore it - "divert" is a common English verb, so the query is
      // dominated by unrelated intent and no amount of markup outranks that.
      // What actually builds the association is aggregate behaviour: people
      // searching a variant, skipping the dictionary results, then clicking
      // DeVert. This field only makes the relationship legible; it can't force
      // it. Kept deliberately short - a long alias list dilutes rather than
      // strengthens the entity.
      "alternateName": [
        "Devert",
        "DVert",
        "DVRT",
        "DeVrt",
        "Devrt",
        "Devret",
        "De Vert",
        "Divert",
        "devert.in",
        "DeVert Campus",
        "DeVert100",
        "DeVert - Builder's OS",
      ],
      "url": "https://devert.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://devert.in/logo.png",
        "width": 2048,
        "height": 2048,
      },
      "description": "Introvert. Extrovert. DeVert. Developer + Verts - a new identity for builders. Arena, Shipyard, Intel Feed, Missions, Daily Grind, Pulse, Hackathons and more.",
      "foundingDate": "2026",
      // THE FIELD THAT ACTUALLY MOVES THE NEEDLE, and it was empty.
      //
      // sameAs is how Google connects this domain to the brand as an ENTITY -
      // it is the primary input to entity resolution and to a Knowledge Panel.
      // An alias list says "we are also called X"; sameAs proves it, by
      // pointing at profiles Google already has indexed and trusts. For brand
      // recognition it is worth more than every spelling variant above put
      // together.
      //
      // These three are the real, live profiles already linked in the footer.
      // Only add a URL here that genuinely belongs to DeVert and genuinely
      // exists - a dead or wrong sameAs weakens the entity instead of
      // strengthening it.
      "sameAs": [
        "https://www.linkedin.com/company/111474265/",
        "https://www.instagram.com/devert.in",
        "https://youtube.com/@devert5",
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} antialiased font-sans text-foreground overflow-x-hidden`}
      >
        <AuthProvider>
          {/* The content guard that used to mount here is gone. It blocked
              right-click, text selection, drag-out and Ctrl+C/X/V/A across the
              whole app for every non-admin, as anti-scraping for the learning
              content. Removed on request: it was also stopping people copying
              a code snippet out of a lesson, a company name out of the vault,
              or opening a link in a new tab.

              EXAMS ARE UNAFFECTED. use-proctor-session.js does its own
              contextmenu/keydown/screenshot blocking in JS and sets
              .proctor-active on <html> itself; globals.css keeps the
              html.proctor-active rules. An invigilated attempt is still
              locked down - only ordinary browsing is not. */}
          {/* Inside AuthProvider: it needs the signed-in user to attribute, and
              must run on every route since an ambassador link can point anywhere. */}
          <ReferralCapture />
          <IntroProvider>
            {/* The Builder's OS window manager is deliberately NOT mounted.
                Core DeVert opened most dock destinations as floating,
                draggable windows; every one of those modules already had a
                working standalone route, so the window layer mainly added a
                window-management mental model on top of a product still
                establishing its basics.

                The implementation is intact and unreferenced -
                context/WindowManagerContext.jsx, context/window-registry.js
                and components/window/** - so a specialised surface that
                genuinely wants panes (an AI workspace, a multi-file editor,
                DevTools) can mount WindowManagerProvider + WindowLayer around
                just itself. Nothing in the default flow depends on it, which
                is the property that makes that possible. */}
            <CommandPalette />
            <TopNavbar />
            <Navbar />
            {/* Admin on/off switches (lib/featureFlags.js) - a switched-off
                feature's pages show a "turned off" screen for everyone. */}
            <FeatureGate>{children}</FeatureGate>
            <Footer />
          </IntroProvider>
        </AuthProvider>
        {/* Prevents a flash-of-light-theme on a hard load of any Campus page.
            output:'export' bakes each page's HTML at BUILD time, when
            localStorage/matchMedia don't exist - CampusThemeProvider's lazy
            useState initializer (campus-theme-provider.jsx) falls back to
            "light" in that environment, so the FIRST PAINT a real visitor's
            browser shows is always light, even if their saved preference (or,
            with none saved, their OS) is dark; React's hydration then
            corrects `theme` state a moment later, but the wrong-theme paint
            already happened by then. This script runs synchronously as the
            last thing in <body> - by that point every .campus-theme root the
            page rendered already exists in the DOM, parsed but not yet
            painted - so it can patch the attribute/background BEFORE the
            browser's first paint rather than after React's. Mirrors that
            provider's own saved-vs-system precedence exactly: an explicit
            "light" wins even over a dark OS, no saved value falls through to
            prefers-color-scheme. Only acts on landing in dark: the SSR
            default is already "light", so a light outcome has nothing to
            correct. The hardcoded scrim/URL below must stay in sync with
            lib/campus-theme.js's campusPhotoBg() dark branch - it can't
            import that module, since this string runs before any JS bundle
            loads. Doesn't know about a signed-in student's own uploaded
            campusBgUrl (that's a Firestore read, unavoidably async) - it
            corrects the default photo only, same as everyone else, until
            React swaps in their custom one moments later. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.querySelectorAll(".campus-theme").forEach(function(el){el.setAttribute("data-theme","dark");el.style.colorScheme="dark";});}catch(e){}`,
          }}
        />
      </body>
    </html>
  );
}
