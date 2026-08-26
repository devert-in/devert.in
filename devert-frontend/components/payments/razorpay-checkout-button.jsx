"use client";

// The pay button. Owns exactly one thing: turning a click into a Checkout
// session and reporting honestly what came back.
//
// Deliberately does NOT flip any local "you're subscribed now" state. Access
// comes from the subscriptions/{uid} doc the webhook writes, which the parent
// watches via watchSubscription() - so the UI unlocks because entitlement
// genuinely exists, not because this component believes it should.

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { startCheckout } from "@/lib/payments";

const BUSY = new Set(["loading", "open", "verifying"]);

const BUSY_LABEL = {
  loading: "preparing...",
  open: "waiting for payment...",
  verifying: "confirming...",
};

export function RazorpayCheckoutButton({ planId, label = "Subscribe", priceLabel, onPaid, className = "" }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("idle");
  const [notice, setNotice] = useState(null); // { tone, text }

  const busy = BUSY.has(phase);

  const pay = async () => {
    if (!user) {
      setNotice({ tone: "warn", text: "Sign in before subscribing." });
      return;
    }
    setNotice(null);
    try {
      const res = await startCheckout({ planId, user, onStatus: setPhase });

      if (res.status === "verified") {
        setPhase("done");
        setNotice({
          tone: "good",
          // The verify call now grants as well as verifies, so `granted` is
          // usually true and access is immediate. It can still be false if the
          // payment doc lost its planId, in which case the webhook is the
          // backstop - so the wording stays honest in both cases rather than
          // promising instant access and rendering a locked screen.
          text: res.granted
            ? "Payment confirmed. Your access is active now."
            : "Payment confirmed. Your access is being activated - this takes a few seconds.",
        });
        onPaid?.(res);
        return;
      }

      setPhase("idle");
      if (res.status === "dismissed") {
        setNotice({ tone: "info", text: "Payment cancelled. Nothing was charged." });
      } else if (res.status === "failed") {
        setNotice({ tone: "bad", text: res.message || "The payment did not go through." });
      } else if (res.status === "verify_failed") {
        setNotice({
          tone: "bad",
          // Never say "nothing happened" here - the money may have moved.
          text: `${res.message} If you were charged, your access will still activate automatically. ` +
                `Reference: ${res.paymentId || res.orderId || "unknown"}.`,
        });
      }
    } catch (err) {
      setPhase("idle");
      setNotice({ tone: "bad", text: err?.message || "Could not start the payment." });
    }
  };

  const toneStyle = {
    good: { color: "#34D399", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.35)", Icon: CheckCircle2 },
    bad: { color: "#F87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.35)", Icon: AlertTriangle },
    warn: { color: "#FBBF24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.35)", Icon: AlertTriangle },
    info: { color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", Icon: Info },
  }[notice?.tone || "info"];

  return (
    <div className={className}>
      <button
        onClick={pay}
        disabled={busy || phase === "done"}
        className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        style={{
          color: "#FFFFFF",
          background: "linear-gradient(135deg, #4F46E5, #9333EA)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
        {busy ? BUSY_LABEL[phase] : phase === "done" ? "Payment confirmed" : label}
        {!busy && phase !== "done" && priceLabel && (
          <span className="opacity-80 font-normal">· {priceLabel}</span>
        )}
      </button>

      {notice && (
        <div
          className="flex items-start gap-2 mt-2.5 px-3 py-2.5 rounded-lg"
          style={{ background: toneStyle.bg, border: `1px solid ${toneStyle.border}` }}
        >
          <toneStyle.Icon size={13} className="flex-shrink-0 mt-0.5" style={{ color: toneStyle.color }} />
          <p className="text-[11.5px] leading-relaxed" style={{ color: toneStyle.color }}>{notice.text}</p>
        </div>
      )}

      <p className="text-[10px] mt-2 text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
        Secured by Razorpay · UPI, cards, netbanking &amp; wallets
      </p>
    </div>
  );
}
