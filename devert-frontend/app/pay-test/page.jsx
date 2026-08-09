"use client";

// Razorpay integration harness. Development aid, not a product surface.
//
// Deliberately a standalone route rather than the button dropped into Campus:
// the individual-access model, pricing copy and the ambassador programme are all
// still undecided, and wiring a live pay button into a real screen before those
// are settled is how a half-finished paywall reaches a student.
//
// Shows the raw payment + subscription documents as they change, because the
// interesting part of this flow is what the SERVER ends up believing, not what
// the modal said. Delete this route (or gate it behind isAdmin) before launch.

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PLANS, watchSubscription, isSubscriptionActive } from "@/lib/payments";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";

function Row({ k, v }) {
  return (
    <div className="flex gap-3 py-1 font-mono text-[11px]">
      <span className="text-white/30 w-40 flex-shrink-0">{k}</span>
      <span className="text-white/70 break-all">{String(v)}</span>
    </div>
  );
}

export default function PayTestPage() {
  const { user, loading } = useAuth();
  const [sub, setSub] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!user) return;
    return watchSubscription(user.uid, setSub);
  }, [user]);

  // Watches the payment doc the server created, so the created -> verified ->
  // paid progression is visible as it happens. "paid" only ever arrives from the
  // webhook, so on localhost it will stay at "verified" - see the note below.
  useEffect(() => {
    if (!orderId) return;
    return onSnapshot(doc(db, "payments", orderId), s => setPayment(s.exists() ? s.data() : null), () => setPayment(null));
  }, [orderId]);

  const active = isSubscriptionActive(sub);

  return (
    <main className="min-h-screen pt-16 pb-32 px-6">
      <div className="max-w-lg mx-auto">
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "rgba(0,255,65,0.55)" }}>
          // RAZORPAY TEST HARNESS
        </p>
        <h1 className="font-sans text-2xl font-bold text-white mb-2">Payment integration test</h1>
        <p className="font-mono text-xs text-white/40 mb-8">
          Test mode. Card 4111 1111 1111 1111, CVV 123, expiry 12/26 - or UPI test@razorpay.
        </p>

        {loading ? (
          <p className="font-mono text-xs text-white/30">loading auth...</p>
        ) : !user ? (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">not signed in</span>
            </div>
            <div className="p-5">
              <p className="font-mono text-xs text-white/50 mb-4">
                Both callables require auth, so sign in first.
              </p>
              <a href="/login" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg inline-block">
                go to login
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="terminal-window mb-5">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">entitlement</span>
                <span className="ml-auto font-mono text-[10px]" style={{ color: active ? "#00FF41" : "#FF9500" }}>
                  {active ? "ACTIVE" : "NONE"}
                </span>
              </div>
              <div className="p-4">
                <Row k="uid" v={user.uid} />
                <Row k="subscriptions/{uid}" v={sub ? JSON.stringify({ plan: sub.plan, status: sub.status }) : "(no doc)"} />
                <Row k="expires" v={sub?.expiresAtMs ? new Date(sub.expiresAtMs).toLocaleString() : "-"} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <RazorpayCheckoutButton
                planId={PLANS.MONTHLY}
                label="Subscribe monthly"
                priceLabel="Rs 29"
                onPaid={(r) => setOrderId(r.orderId || "")}
              />
              <RazorpayCheckoutButton
                planId={PLANS.YEARLY}
                label="Subscribe annually"
                priceLabel="Rs 229"
                onPaid={(r) => setOrderId(r.orderId || "")}
              />
            </div>

            {payment && (
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <span className="font-mono text-[10px] text-white/25 ml-2">payments/{orderId}</span>
                </div>
                <div className="p-4">
                  <Row k="status" v={payment.status} />
                  <Row k="planId" v={payment.planId} />
                  <Row k="amount (paise)" v={payment.amount} />
                  <Row k="paymentId" v={payment.paymentId || "-"} />
                </div>
              </div>
            )}

            <p className="font-mono text-[10px] text-white/25 leading-relaxed mt-6">
              status reaches <span className="text-white/50">verified</span> from the signature check.
              It only becomes <span className="text-white/50">paid</span>, and the subscription only
              appears, when the webhook fires - and Razorpay cannot reach localhost, so on a local run
              it stops at verified. Use a tunnel or a deployed function to exercise the grant.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
