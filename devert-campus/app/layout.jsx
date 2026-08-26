import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CampusContentGuard } from "@/components/campus/campus-content-guard";

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
          <CampusContentGuard />
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
            __html: `try{var s=localStorage.getItem("campus-theme");var d=s==="dark"||(s!=="light"&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.querySelectorAll(".campus-theme").forEach(function(el){el.setAttribute("data-theme","dark");el.style.colorScheme="dark";el.style.setProperty("--campus-bg-image","linear-gradient(rgba(10,14,23,0.62), rgba(10,14,23,0.62)), url(/campus-bg-dark-theme.jpg)");});}}catch(e){}`,
          }}
        />
      </body>
    </html>
  );
}
