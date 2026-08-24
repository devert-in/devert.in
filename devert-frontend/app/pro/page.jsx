"use client";

// DeVert Pro pricing page.
//
// Two deliberate choices in the copy, both load-bearing:
//
// 1. The free list is shown FIRST and in full. A pricing page that hides what
//    stays free reads as a bait-and-switch, and for this product the free tier
//    genuinely is the strongest argument - "all the DSA content is free" is what
//    makes someone trust the paid half.
//
// 2. Nothing here claims the paid tier unlocks learning content, because it does
//    not. What is sold is proof (a proctored score), capacity (unmetered
//    execution, which costs real money per run) and intent-moment material
//    (company prep). Copy that overpromised would be a refund queue.

import { Check, Zap, ShieldCheck, Infinity as InfinityIcon, Building2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTier } from "@/lib/useTier";
import { PLANS } from "@/lib/payments";
import { FREE_FOREVER, PRO_PITCH } from "@/lib/entitlements";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";

const ICON = {
  PROCTORED_ASSESSMENTS: ShieldCheck,
  CODELAB_UNLIMITED: InfinityIcon,
  COMPANY_PREP: Building2,
  GATE_TEST_SERIES: Zap,
  PERSONAL_ANALYTICS: Sparkles,
  AMBASSADOR_ELIGIBLE: Building2,
};

export default function ProPage() {
  const { user } = useAuth();
  const { isCampus, isPro, subscription, ready } = useTier();

  return (
    <main className="min-h-screen pt-16 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "rgba(0,255,65,0.55)" }}>
          // DEVERT PRO
        </p>
        <h1 className="font-sans text-3xl sm:text-4xl font-bold tracking-tighter text-white leading-none mb-4">
          The content is free.<br />
          <span className="text-neon-cyan text-glow-cyan">The proof costs ₹499.</span>
        </h1>
        <p className="font-mono text-sm text-white/40 leading-relaxed mb-10 max-w-xl">
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> Every problem, roadmap and subject on
          DeVert is free and always will be.<br />
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> Pro is for when you need a score
          somebody else believes.
        </p>

        {ready && isCampus && (
          <div className="terminal-window mb-10">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">campus account</span>
            </div>
            <div className="p-5">
              <p className="font-mono text-xs text-white/60 leading-relaxed">
                Your college already covers this. You have everything in Pro at no cost - there is
                nothing to buy on this page.
              </p>
            </div>
          </div>
        )}

        {ready && !isCampus && isPro && (
          <div className="terminal-window mb-10">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">active</span>
            </div>
            <div className="p-5">
              <p className="font-mono text-xs text-white/60">
                Pro is active
                {subscription?.expiresAtMs
                  ? ` until ${new Date(subscription.expiresAtMs).toLocaleDateString()}.`
                  : "."}
                {" "}Paying again extends it rather than restarting it.
              </p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">free forever</span>
            </div>
            <div className="p-5">
              <p className="font-sans text-2xl font-bold text-white mb-1">₹0</p>
              <p className="font-mono text-[11px] text-white/35 mb-5">No card. No trial timer.</p>
              <ul className="space-y-2.5">
                {FREE_FOREVER.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#00FF41" }} />
                    <span className="font-mono text-[11.5px] text-white/60 leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro */}
          <div className="terminal-window" style={{ borderColor: "rgba(0,255,255,0.28)" }}>
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">pro</span>
              <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(0,255,255,0.12)", color: "#00FFFF" }}>
                BEST VALUE
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 mb-1">
                <p className="font-sans text-2xl font-bold text-white">₹499</p>
                <p className="font-mono text-[11px] text-white/35 mb-1">/ year</p>
              </div>
              <p className="font-mono text-[11px] text-white/35 mb-5">
                ₹42 a month. Or ₹99 monthly if you would rather not commit.
              </p>

              <ul className="space-y-2.5 mb-6">
                {PRO_PITCH.map((p) => {
                  const Icon = ICON[p.key] || Check;
                  return (
                    <li key={p.key} className="flex items-start gap-2">
                      <Icon size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#00FFFF" }} />
                      <span className="font-mono text-[11.5px] leading-relaxed">
                        <span className="text-white/80">{p.title}</span>
                        <span className="text-white/40"> — {p.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {!user ? (
                <a href="/login"
                  className="block text-center font-mono text-xs py-3 rounded-xl"
                  style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.06)" }}>
                  sign in to subscribe
                </a>
              ) : isCampus ? null : (
                <div className="space-y-3">
                  <RazorpayCheckoutButton planId={PLANS.INDIVIDUAL_ANNUAL} label="Get Pro for a year" priceLabel="₹499" />
                  <RazorpayCheckoutButton planId={PLANS.INDIVIDUAL_MONTHLY} label="Pay monthly" priceLabel="₹99" />
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="font-mono text-[10px] text-white/25 leading-relaxed mt-8 text-center max-w-lg mx-auto">
          Students of a partner college get Pro through their institution at no cost. If your college
          is not on DeVert yet, becoming a Campus Ambassador is how that changes.
        </p>
      </div>
    </main>
  );
}
