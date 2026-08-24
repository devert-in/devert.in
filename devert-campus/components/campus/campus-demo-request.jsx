"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X as CloseIcon, Check, Copy, Mail, Loader2, AlertTriangle } from "lucide-react";
import { db, addDoc, collection, serverTimestamp } from "@/lib/firebase";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard } from "@/components/campus/campus-ui";

// "Request a demo" used to be a plain mailto: link, which is a dead button on
// any machine with no mail client registered to the protocol - i.e. most
// browsers, most of the time. Nothing appeared to happen at all, so the single
// conversion path on the whole institution pitch silently did nothing.
//
// This captures the lead in Firestore instead, and keeps the mail route as a
// secondary option rather than the only one.
//
// WRITE PATH, AND WHY IT IS UNAUTHENTICATED: the person filling this in is a
// placement officer or HOD who does not have a DeVert account and has no reason
// to make one before talking to us - so requiring isAuth() here would reject
// exactly the lead the form exists to capture. firestore.rules constrains the
// write tightly instead (fixed field whitelist, length caps, status pinned to
// "new", createdAt pinned to request.time) and allows NO public read, so the
// collection cannot be used as a message board or read back by anyone but an
// admin. Rules cannot rate-limit, so this is still an open write endpoint; App
// Check is the durable fix and is worth adding before this gets any traffic.

export const DEMO_EMAIL = "devert.contact@gmail.com";

const ROLES = ["Principal", "HOD", "Training & Placement Officer", "Faculty", "Other"];
const SIZES = ["Under 500", "500 - 2,000", "2,000 - 5,000", "5,000+"];

// Exported for campus-waitlist.jsx, which is the same shape of thing - an
// unauthenticated lead-capture dialog replacing a dead mailto: - and should not
// carry a second, drifting copy of the same input chrome.
export function Field({ label, value, onChange, placeholder, type = "text", required, maxLength }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: CAMPUS.inkFaint }}>
        {label}{required && <span style={{ color: CAMPUS.bad }}> *</span>}
      </span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        required={required} maxLength={maxLength}
        className="w-full text-[13.5px] px-3 py-2.5 outline-none rounded-lg"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
    </label>
  );
}

function Choice({ label, options, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: CAMPUS.inkFaint }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-[13.5px] px-3 py-2.5 outline-none rounded-lg"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// Shown when the write is refused. Not a generic "something went wrong": the
// most likely cause on a fresh deploy is that firestore.rules has not been
// pushed yet (rules ship by hand, separately from hosting), and in that case the
// visitor still needs a way to reach us - so this degrades to the address
// itself, copyable, rather than to an apology.
export function MailFallback({ subject }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked - the address is selectable text anyway */ }
  };

  return (
    <div className="rounded-lg p-4" style={{ background: tint(CAMPUS.warn, 8), border: `1px solid ${tint(CAMPUS.warn, 30)}` }}>
      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed mb-3" style={{ color: CAMPUS.ink }}>
        <AlertTriangle size={14} style={{ color: CAMPUS.warn, marginTop: 2, flexShrink: 0 }} />
        We couldn&apos;t submit that form just now. Email us directly and we&apos;ll pick it up from there.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-[12.5px] px-2.5 py-1.5 rounded" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
          {DEMO_EMAIL}
        </code>
        <button onClick={copy} className="text-[12px] font-semibold inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded"
          style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.teal }}>
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
        <a href={`mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}`}
          className="text-[12px] font-semibold inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded"
          style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
          <Mail size={12} /> Open mail app
        </a>
      </div>
    </div>
  );
}

export function DemoRequestDialog({ open, onClose, source = "campus" }) {
  const [form, setForm] = useState({
    institution: "", name: "", role: ROLES[0], email: "", phone: "", students: SIZES[0], message: "",
  });
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
  const canSubmit = form.institution.trim().length >= 2 && form.name.trim().length >= 2 && emailOk;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || state === "sending") return;
    setState("sending");
    try {
      // Field names and caps mirror firestore.rules' isValidDemoRequest()
      // exactly - a mismatch here is a permission-denied, not a silent
      // truncation, so the two must be changed together.
      await addDoc(collection(db, "demo_requests"), {
        institution: form.institution.trim().slice(0, 120),
        name: form.name.trim().slice(0, 80),
        role: form.role.slice(0, 40),
        email: form.email.trim().slice(0, 160),
        phone: form.phone.trim().slice(0, 24),
        students: form.students.slice(0, 24),
        message: form.message.trim().slice(0, 1000),
        source: source.slice(0, 40),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setState("sent");
    } catch (err) {
      console.error("demo request failed", err);
      setState("failed");
    }
  };

  const subject = `DeVert Campus - demo request${form.institution ? ` (${form.institution})` : ""}`;

  return createPortal(
    <div className="campus-theme fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <CampusCard className="w-full max-w-lg my-auto" style={{ background: CAMPUS.surface }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-6 pb-4" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
          <div>
            <h2 className="text-[18px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>Request a demo</h2>
            <p className="text-[12.5px] mt-1" style={{ color: CAMPUS.inkSoft }}>
              Tell us about your institution and we&apos;ll come back with a walkthrough and a quote.
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
            <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Request received</h3>
            <p className="text-[13px] leading-relaxed mb-6 max-w-[44ch] mx-auto" style={{ color: CAMPUS.inkSoft }}>
              We&apos;ll reach out to <b style={{ color: CAMPUS.ink }}>{form.email.trim()}</b>. If it&apos;s urgent,
              email {DEMO_EMAIL} and mention {form.institution.trim()}.
            </p>
            <button onClick={onClose} className="campus-btn text-[13px] font-bold px-6 py-3 rounded-xl"
              style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <Field label="Institution" value={form.institution} onChange={set("institution")}
              placeholder="e.g. MRCET" required maxLength={120} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" value={form.name} onChange={set("name")} placeholder="Full name" required maxLength={80} />
              <Choice label="Your role" options={ROLES} value={form.role} onChange={set("role")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Work email" type="email" value={form.email} onChange={set("email")}
                placeholder="you@college.edu" required maxLength={160} />
              <Field label="Phone (optional)" value={form.phone} onChange={set("phone")} placeholder="+91" maxLength={24} />
            </div>
            <Choice label="Students" options={SIZES} value={form.students} onChange={set("students")} />
            <label className="block">
              <span className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: CAMPUS.inkFaint }}>
                Anything specific? (optional)
              </span>
              <textarea value={form.message} onChange={e => set("message")(e.target.value)} rows={3} maxLength={1000}
                placeholder="Departments, timelines, modules you care about..."
                className="w-full text-[13.5px] px-3 py-2.5 outline-none rounded-lg resize-y"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </label>

            {state === "failed" && <MailFallback subject={subject} />}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={!canSubmit || state === "sending"}
                className="campus-btn campus-btn-glow text-[13.5px] font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-45"
                style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
                {state === "sending" ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : "Send request"}
              </button>
              <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>No account needed.</span>
            </div>
          </form>
        )}
      </CampusCard>
    </div>,
    document.body,
  );
}
