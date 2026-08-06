import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";
import { ContentGuard } from "@/components/content-guard";

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
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
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
    images: [{
      url:    "https://devert.in/logo.png",
      width:  2048,
      height: 2048,
      alt:    "DeVert - Builder's OS",
    }],
  },
  twitter: {
    card:        "summary",
    site:        "@devert_in",
    title:       "DeVert - Builder's OS",
    description: "Introvert. Extrovert. DeVert. A new identity for builders.",
    images:      ["https://devert.in/logo.png"],
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
      "alternateName": "DeVert - Builder's OS",
      "url": "https://devert.in",
      "description": "Introvert. Extrovert. DeVert. Developer + Verts - a new identity for builders who ship.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://devert.in/u/{search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://devert.in/#organization",
      "name": "DeVert",
      "url": "https://devert.in",
      "logo": {
        "@type": "ImageObject",
        "url": "https://devert.in/logo.png",
        "width": 2048,
        "height": 2048,
      },
      "description": "Introvert. Extrovert. DeVert. Developer + Verts - a new identity for builders. Arena, Shipyard, Intel Feed, Missions, Daily Grind, Pulse, Hackathons and more.",
      "foundingDate": "2026",
      "sameAs": [],
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} antialiased font-sans bg-background text-foreground overflow-x-hidden`}
      >
        <AuthProvider>
          <ContentGuard />
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
            <Navbar />
            {children}
            <Footer />
          </IntroProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
