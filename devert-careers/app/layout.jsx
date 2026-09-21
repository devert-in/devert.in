import "./globals.css";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Self-hosted at build time by next/font, so there is no render-blocking
// request to Google's CDN and no layout shift - both of which matter more here
// than on the other two apps, since this is the page a candidate lands on cold
// from a search result or a shared link.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Note the absence of an AuthProvider, which both other apps mount at the root.
// That is deliberate: careers.devert.in is a separate origin, and Firebase
// Auth's client session does not span subdomains on its own - devert-frontend's
// lib/sharedSession.js exists precisely because campus.devert.in needed a
// cookie bridge to get one. A hiring site needs no signed-in user at all: the
// application form is anonymous by design (see firestore.rules'
// isValidJobApplication, which treats `uid` as optional), so pulling in auth
// would mean carrying that entire bridge for a prefill convenience. If sign-in
// is ever genuinely wanted here, that bridge is the thing to wire up - not a
// bare AuthProvider, which would silently sign nobody in.
export const metadata = {
  metadataBase: new URL("https://careers.devert.in"),
  title: {
    default: "Careers at DeVert - build the developer platform",
    template: "%s | DeVert Careers",
  },
  description:
    "Open roles at DeVert. We build a developer operating system and a learning platform used by college cohorts across India. Engineering, content, design and community.",
  alternates: { canonical: "https://careers.devert.in" },
  openGraph: {
    title: "Careers at DeVert",
    description: "Open roles at DeVert - built by people who ship, for people who ship.",
    url: "https://careers.devert.in",
    siteName: "DeVert Careers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at DeVert",
    description: "Open roles at DeVert - built by people who ship, for people who ship.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-ink-800">
        {/* Keyboard and screen-reader users land on the header's nav first;
            without this they would tab through it on every page to reach the
            role they actually came for. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
