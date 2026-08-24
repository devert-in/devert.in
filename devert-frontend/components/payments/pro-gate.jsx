"use client";

// Paywall for a single Pro feature.
//
// Three rules this component exists to enforce consistently, because getting any
// of them wrong is worse than having no paywall at all:
//
// 1. NEVER flash the paywall at somebody who has paid. useTier().ready is false
//    until both the admin claim and the subscription listener have answered, and
//    until then this renders nothing rather than guessing. A paying user seeing
//    "upgrade to continue" for one frame is the worst possible greeting.
//
// 2. Say what is still free. A wall that only says "pay" reads as a shakedown;
//    one that names the free alternative reads as an honest boundary. Every
//    caller passes `freeAlternative` for that reason.
//
// 3. Campus students never see this. They resolve to CAMPUS in resolveTier(),
//    so `can()` already returns true - but the copy below also never implies a
//    college student owes anything.

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useTier } from "@/lib/useTier";
import { FEATURES } from "@/lib/entitlements";

export function ProGate({ feature, title, children, freeAlternative, compact = false }) {
  const { can, ready } = useTier();

  // Unknown feature keys must not paywall anything - a typo should degrade to
  // "visible", never to "locked".
  if (!FEATURES[feature]) return children;

  if (!ready) return null;
  if (can(feature)) return children;

  if (compact) {
    return (
      <Link href="/campus/pro" className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{ background: "rgba(0,255,255,0.05)", border: "1px solid rgba(0,255,255,0.22)" }}>
        <Lock size={12} style={{ color: "#00FFFF" }} />
        <span className="font-mono text-[11px]" style={{ color: "#00FFFF" }}>
          {title || "Pro feature"} — ₹499/yr
        </span>
        <ArrowRight size={11} className="ml-auto" style={{ color: "#00FFFF" }} />
      </Link>
    );
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <span className="font-mono text-[10px] text-white/25 ml-2">pro</span>
      </div>
      <div className="p-6 text-center">
        <Lock size={20} className="mx-auto mb-3" style={{ color: "#00FFFF" }} />
        <h3 className="font-sans text-lg font-bold text-white mb-2">{title || "This is a Pro feature"}</h3>

        {freeAlternative && (
          <p className="font-mono text-[11.5px] text-white/45 leading-relaxed mb-4 max-w-sm mx-auto">
            {freeAlternative}
          </p>
        )}

        <Link href="/campus/pro"
          className="inline-flex items-center gap-2 font-mono text-xs px-5 py-2.5 rounded-lg transition-colors"
          style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.06)" }}>
          see what Pro includes <ArrowRight size={12} />
        </Link>

        <p className="font-mono text-[10px] text-white/25 mt-4">
          ₹499 a year. Students of a partner college already have it.
        </p>
      </div>
    </div>
  );
}
