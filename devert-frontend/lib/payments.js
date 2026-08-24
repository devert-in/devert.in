// Razorpay Standard Checkout, client half.
//
// The browser's job here is deliberately small: ask the server for an order,
// hand that order to Razorpay's modal, and pass the callback back for
// verification. It never sees the key secret, never chooses a price, and never
// decides that a payment succeeded.
//
// Access is granted by the razorpayWebhook function, not by anything in this
// file. A browser can always close the tab a millisecond after paying, so any
// design where the client's "it worked" call is what unlocks the product is a
// design where the attacker chooses whether to pay. verifyRazorpayPayment
// exists to give the user an honest immediate answer, not to entitle them.

import { functions, db } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Plan ids must match the PLANS map in functions/index.js. Only the id travels
// over the wire - the amount is the server's to decide, so a tampered client
// cannot buy an annual plan for one rupee.
export const PLANS = Object.freeze({
  INDIVIDUAL_MONTHLY: "individual_monthly",
  INDIVIDUAL_ANNUAL: "individual_annual",
});

let scriptPromise = null;

// Loaded on demand rather than from the root layout: it is a third-party script
// on every page load otherwise, and the overwhelming majority of sessions never
// open Checkout. Cached so repeated opens reuse one <script>.
export function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.reject(new Error("not in a browser"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = CHECKOUT_SRC;
    el.async = true;
    el.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay failed to initialise")));
    el.onerror = () => {
      // Reset so a later retry can try again rather than being stuck on a
      // permanently rejected promise (a blocked CDN is often transient, and ad
      // blockers routinely eat payment scripts).
      scriptPromise = null;
      reject(new Error("Could not load Razorpay Checkout. Check your connection or any ad blocker."));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Runs the full Checkout flow for one plan.
 *
 * Resolves { status: "verified" | "dismissed" | "failed", ... } rather than
 * throwing on the non-happy paths, because "the user changed their mind" is an
 * ordinary outcome and not an error the caller should have to catch.
 */
export async function startCheckout({ planId, user, onStatus }) {
  const say = (s) => { try { onStatus?.(s); } catch { /* caller's problem, not ours */ } };

  say("loading");
  const [Razorpay, order] = await Promise.all([
    loadRazorpayCheckout(),
    httpsCallable(functions, "createRazorpayOrder")({ planId }).then(r => r.data),
  ]);

  if (!order?.keyId) {
    throw new Error("Payments are not configured on the server yet (missing Razorpay key id).");
  }

  say("open");

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (v) => { if (!settled) { settled = true; resolve(v); } };

    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "DeVert",
      description: order.label,
      image: "https://devert.in/icon-192.png",
      prefill: {
        name: user?.displayName || "",
        email: user?.email || "",
      },
      theme: { color: "#4F46E5" },
      modal: {
        // The user closing the modal is not a failure - it must not leave the
        // caller hanging on an unresolved promise forever.
        ondismiss: () => finish({ status: "dismissed" }),
      },
      handler: async (response) => {
        say("verifying");
        try {
          const res = await httpsCallable(functions, "verifyRazorpayPayment")({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          finish({ status: "verified", ...res.data });
        } catch (err) {
          // The money may well have left the account even though our check
          // failed, so this must never read as "nothing happened".
          finish({
            status: "verify_failed",
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            message: err?.message || "We could not confirm the payment.",
          });
        }
      },
    });

    rzp.on("payment.failed", (resp) => {
      finish({
        status: "failed",
        message: resp?.error?.description || "The payment did not go through.",
        code: resp?.error?.code || "",
      });
    });

    try { rzp.open(); } catch (err) { settled = true; reject(err); }
  });
}

/**
 * Live view of the signed-in user's entitlement.
 *
 * A listener rather than a one-shot read because the webhook grants access
 * asynchronously - it commonly lands a second or two AFTER Checkout closes, so a
 * single read at that moment would usually see nothing and the UI would tell a
 * paying user they had not paid.
 */
export function watchSubscription(uid, cb) {
  if (!uid) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, "subscriptions", uid),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => cb(null),
  );
}

// Pure - an expired-but-present doc must not read as active just because
// status says so; the webhook sets status once and never revisits it.
export function isSubscriptionActive(sub, now = Date.now()) {
  if (!sub || sub.status !== "active") return false;
  const until = sub.expiresAtMs || sub.expiresAt?.toMillis?.() || 0;
  return until > now;
}
