"use client";

// Seven-day free trial.
//
// Hidden rather than disabled once used: an account gets exactly one trial ever
// (enforced in startFreeTrial, not here), and offering a button that can only
// answer "you already had this" is worse than not offering it. The server still
// refuses a second one regardless of what this renders - the check is not here
// because it cannot be.

import { useState } from "react";
import { Gift, Loader2, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { startFreeTrial, hasUsedTrial, isSubscriptionActive } from "@/lib/payments";
import { useTier } from "@/lib/useTier";

export function FreeTrialButton({ onStarted, className = "" }) {
  const { user } = useAuth();
  const { subscription, isCampus, ready } = useTier();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  // Nothing to offer: a campus student already has everything, an active
  // subscriber does not need a trial, and a past trial cannot be repeated.
  if (!ready) return null;
  if (isCampus) return null;
  if (hasUsedTrial(subscription) || isSubscriptionActive(subscription)) return null;

  const start = async () => {
    if (!user) { setNotice({ bad: true, text: "Sign in to start your free trial." }); return; }
    setBusy(true);
    const res = await startFreeTrial();
    setBusy(false);
    if (res.ok) {
      setNotice({ bad: false, text: `Your ${res.trialDays}-day trial is active. No card needed.` });
      onStarted?.(res);
    } else {
      setNotice({ bad: true, text: res.message });
    }
  };

  return (
    <div className={className}>
      <button onClick={start} disabled={busy}
        className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        style={{
          color: "#00FF41",
          border: "1px solid rgba(0,255,65,0.35)",
          background: "rgba(0,255,65,0.06)",
        }}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
        {busy ? "starting..." : "Start 7 days free"}
      </button>
      <p className="text-[10px] mt-2 text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
        No card required. Nothing renews automatically.
      </p>

      {notice && (
        <div className="flex items-start gap-2 mt-2.5 px-3 py-2.5 rounded-lg"
          style={{
            background: notice.bad ? "rgba(248,113,113,0.10)" : "rgba(52,211,153,0.10)",
            border: `1px solid ${notice.bad ? "rgba(248,113,113,0.35)" : "rgba(52,211,153,0.35)"}`,
          }}>
          {notice.bad
            ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#F87171" }} />
            : <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#34D399" }} />}
          <p className="text-[11.5px] leading-relaxed" style={{ color: notice.bad ? "#F87171" : "#34D399" }}>
            {notice.text}
          </p>
        </div>
      )}
    </div>
  );
}
