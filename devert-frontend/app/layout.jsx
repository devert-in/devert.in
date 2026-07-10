import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { IntroProvider } from "@/context/IntroContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
      { url: "/logo.png", sizes: "2048x2048",   type: "image/png" },
    ],
    apple:   [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo.png",
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background text-foreground overflow-x-hidden`}
      >
        <AuthProvider>
          <IntroProvider>
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
