"use client";

// Renders a "turned off" screen in place of any page whose feature an admin has
// switched off (lib/featureFlags.js). Mounted in the root layout of all three
// apps: devert.in passes nothing and matches by pathname; campus.devert.in and
// careers.devert.in pass `feature` and gate the whole site.
//
// Inline styles only, no Tailwind classes: devert-careers imports this through
// its `@/*` fallback and its globals.css has no `@source` for devert-frontend,
// so class names here would silently compile to nothing on that site.

import { usePathname } from "next/navigation";
import { featureByKey, featureForPath, isFeatureEnabled, useFeatureFlags } from "@/lib/featureFlags";

export function FeatureGate({ feature, children }) {
  const pathname = usePathname();
  const flags = useFeatureFlags();
  const f = feature ? featureByKey(feature) : featureForPath(pathname);

  if (!f || isFeatureEnabled(flags, f.key)) return children;

  const home = f.app ? "https://devert.in/" : "/";
  return (
    <main style={{
      minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "96px 16px",
    }}>
      <div style={{
        maxWidth: 440, width: "100%", textAlign: "center", padding: "32px 28px", borderRadius: 14,
        background: "rgba(10,14,22,0.88)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{
          width: 44, height: 44, margin: "0 auto 16px", borderRadius: 12, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.3)",
        }}>
          {/* Lucide "power" glyph, inlined so this renders on every app. */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#fff", margin: "0 0 8px" }}>
          {f.label} is turned off
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.55)", margin: "0 0 22px" }}>
          This part of DeVert has been paused for everyone for now. Please check back later.
        </p>
        <a href={home} style={{
          display: "inline-block", padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: "#3ce86f", color: "#05080F", textDecoration: "none",
        }}>
          Back to DeVert
        </a>
      </div>
    </main>
  );
}
