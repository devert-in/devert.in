import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// Generic fallback - real per-institution title/description come from
// CampusPreviewService via a preview router (see functions/index.js /
// campusPreviewRouter, which only crawlers ever see).
// Reworded when /campus stopped being a college picker and became the open
// learning surface (see components/campus/campus-landing.jsx's header): a
// description promising something "run by your college" is the wrong first
// impression for the search visitor who has no college here, and it was the
// leak - they arrived, found only a login they could not pass, and left.
export const metadata = {
  title: { default: "DeVert Campus - learn to code, prepare for placements", template: "%s | DeVert Campus" },
  description: "Programming, CS Core, aptitude, DSA and company-wise interview prep - open to anyone, no college required. Colleges add scheduled Daily Learning, assessments, contests and leaderboards on top.",
  alternates: { canonical: "https://campus.devert.in" },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    title: "DeVert Campus",
    description: "Open technical learning and placement prep - plus a licensed workspace for colleges.",
    url: "https://campus.devert.in",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
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
          {children}
        </AuthProvider>
        {/* Prevents a flash-of-light-theme AND a React hydration mismatch on a
            hard load of any page here. output:'export' bakes each page's HTML
            at BUILD time, when localStorage/matchMedia don't exist -
            CampusThemeProvider's lazy useState initializer
            (components/campus/campus-theme-provider.jsx, imported from
            devert-frontend) falls back to "light" in that environment, so the
            prerendered HTML always says data-theme="light" even for a visitor
            whose saved preference (or OS) is dark. This script runs
            synchronously as the last thing in <body>, patching every
            .campus-theme root's data-theme/colorScheme/--campus-bg-image
            BEFORE the browser's first paint AND before React's own hydration
            walk reaches those nodes - so by the time CampusThemeProvider's
            client-side initializer independently computes "dark" from the
            same signals, the DOM already agrees, and React sees no mismatch
            to warn about. Copied verbatim from devert-frontend/app/layout.jsx
            (same script, same reasoning) - devert-campus just never got this
            when the Campus pages moved here. Only acts on landing in dark:
            the SSR default is already "light", so a light outcome has
            nothing to correct. The hardcoded scrim/URL must stay in sync with
            lib/campus-theme.js's campusPhotoBg() dark branch - it can't
            import that module, since this string runs before any JS bundle
            loads. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.querySelectorAll(".campus-theme").forEach(function(el){el.setAttribute("data-theme","dark");el.style.colorScheme="dark";});}catch(e){}`,
          }}
        />
      </body>
    </html>
  );
}
