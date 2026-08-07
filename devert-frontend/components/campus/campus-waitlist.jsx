"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X as CloseIcon, Check, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard } from "@/components/campus/campus-ui";
import { Field, MailFallback, DEMO_EMAIL } from "@/components/campus/campus-demo-request";

// "Join the waitlist" was a mailto: link on all six pricing CTAs. On a machine
// with no mail client registered to the protocol - i.e. most browsers, most of
// the time - clicking it does nothing whatsoever: no new tab, no error, no
// feedback. Every conversion path on the pricing page was silently dead.
//
// This captures the signup in Firestore instead, with the plan the visitor
// actually clicked recorded on the document, and keeps mail as the fallback for
// when the write is refused rather than as the only route.
//
// WHAT THIS IS NOT: a purchase, a hold, or an entitlement. Nothing is
// purchasable yet (see the pricing band's own copy and the two blockers noted
// there - there is no payment integration in this repo and no proven mechanism
// for restricting content). A row here means "tell me when this exists", and the
// dialog says exactly that rather than implying a place in a queue for something
// that can be bought today.
//
// WRITE PATH, AND WHY IT IS UNAUTHENTICATED: the whole point of a waitlist is to
// reach people before they commit to an account. Requiring isAuth() would reject
// exactly the visitor it exists to capture. firestore.rules constrains the write
// tightly instead (fixed field whitelist, length caps, status pinned to "new",
// createdAt pinned to request.time, uid either absent or provably the caller's)
// and allows NO public read, so the collection can't be mined or used as a
// message board. Same trade-off, and same open edge, as demo_requests: rules
// cannot rate-limit, so App Check remains the durable fix for volume.

const WAITLIST_COLLECTION = "premium_waitlist";

export function WaitlistDialog({ open, onClose, plan = "Premium", source = "pricing" }) {
  const { user, userData } = useAuth();
  // Prefilled from the signed-in account via a LAZY INITIALIZER, not a
  // reset-on-open effect: callers mount this only while it is open (see
  // WaitlistButton), so every opening is a fresh mount and the initializer runs
  // exactly when the old effect would have. That keeps the "reopen for a
  // different plan doesn't inherit the last submission's success screen"
  // behaviour without a setState in an effect body, which cascades a render.
  const [form, setForm] = useState(() => ({
    email: user?.email || "",
    name: userData?.displayName || "",
    institution: "",
  }));
  const [state, setState] = useState("idle"); // idle | sending | sent | failed
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // Escape closes, and the page behind must not scroll under the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!emailOk || state === "sending") return;
    setState("sending");
    try {
      // Field names and caps mirror firestore.rules' isValidWaitlistSignup()
      // exactly - a mismatch here is a permission-denied, not a silent
      // truncation, so the two must be changed together.
      await addDoc(collection(db, WAITLIST_COLLECTION), {
        email: form.email.trim().slice(0, 160),
        name: form.name.trim().slice(0, 80),
        institution: form.institution.trim().slice(0, 120),
        plan: String(plan).slice(0, 40),
        // Present only when there IS an account - rules accept the field absent
        // or equal to the caller's own uid, never an arbitrary one.
        ...(user ? { uid: user.uid } : {}),
        source: source.slice(0, 40),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setState("sent");
    } catch (err) {
      console.error("waitlist signup failed", err);
      setState("failed");
    }
  };

  const subject = `DeVert Campus Premium waitlist - ${plan}`;

  return createPortal(
    <div className="campus-theme fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <CampusCard className="w-full max-w-md my-auto" style={{ background: CAMPUS.surface }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-6 pb-4" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
          <div>
            <h2 className="text-[18px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>Join the waitlist</h2>
            <p className="text-[12.5px] mt-1" style={{ color: CAMPUS.inkSoft }}>
              Premium is still in build. Leave an address and we&apos;ll tell you the day
              <b style={{ color: CAMPUS.ink }}> {plan}</b> goes live - nothing is charged and nothing is reserved.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ color: CAMPUS.inkFaint }}><CloseIcon size={18} /></button>
        </div>

        {state === "sent" ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: tint(CAMPUS.good, 14), color: CAMPUS.good }}>
              <Check size={22} />
            </div>
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>You&apos;re on the list</h3>
            <p className="text-[13px] leading-relaxed mb-6 max-w-[40ch] mx-auto" style={{ color: CAMPUS.inkSoft }}>
              We&apos;ll write to <b style={{ color: CAMPUS.ink }}>{form.email.trim()}</b> when {plan} is ready.
              Everything already on Campus stays free to use in the meantime.
            </p>
            <button onClick={onClose} className="campus-btn text-[13px] font-bold px-6 py-3 rounded-xl"
              style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg"
              style={{ background: tint(CAMPUS.teal, 10), color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 24)}` }}>
              Plan: <b>{plan}</b>
            </div>

            <Field label="Email" type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" required maxLength={160} />
            <Field label="Your name (optional)" value={form.name} onChange={set("name")}
              placeholder="Full name" maxLength={80} />
            <Field label="College (optional)" value={form.institution} onChange={set("institution")}
              placeholder="e.g. MRCET" maxLength={120} />

            {state === "failed" && <MailFallback subject={subject} />}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={!emailOk || state === "sending"}
                className="campus-btn campus-btn-glow text-[13.5px] font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-45"
                style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                {state === "sending" ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : "Join the waitlist"}
              </button>
              <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>No account needed.</span>
            </div>

            <p className="text-[11px] leading-relaxed" style={{ color: CAMPUS.inkFaint }}>
              We use this address for one thing: telling you when Premium ships. Reach us any time at {DEMO_EMAIL}.
            </p>
          </form>
        )}
      </CampusCard>
    </div>,
    document.body,
  );
}
