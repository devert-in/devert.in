"use client";

// The job application form. Used on the home page (general interest) and on
// every role page.
//
// FULLY ANONYMOUS, and unlike its devert.in predecessor there is no signed-in
// prefill at all. careers.devert.in is a separate origin and Firebase Auth's
// client session does not span subdomains on its own, so a "use my DeVert
// profile" button here would need devert-frontend's lib/sharedSession.js cookie
// bridge - a lot of moving parts to save a candidate four fields. See the note
// in app/layout.jsx.
//
// No file upload either: every write path in storage.rules requires auth, so
// accepting resumes from anonymous applicants would mean opening a new
// unauthenticated Storage path. Applications carry links instead.

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { submitApplication } from "@/lib/careers";

const field =
  "w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-[14px] text-ink-900 " +
  "placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none " +
  "focus:ring-4 focus:ring-brand-50";

function Field({ label, hint, required, htmlFor, children }) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-brand-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-ink-400">{hint}</p>}
    </div>
  );
}

// Deliberately permissive - the same shape firestore.rules enforces, no more.
// A form that rejects a valid-but-unusual address is a lost candidate; the
// server-side rule is what actually stops junk.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function ApplyForm({ jobId, jobTitle, source = "careers" }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", resumeUrl: "", portfolioUrl: "",
    githubUrl: "", linkedinUrl: "", devertHandle: "", coverNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    // Mirrors the bounds firestore.rules enforces, so an invalid application
    // fails here with a sentence a human wrote rather than as a raw
    // permission-denied from the rule.
    if (form.name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!EMAIL_RE.test(form.email.trim())) { setError("That email address doesn't look right."); return; }

    setSubmitting(true);
    setError("");
    try {
      await submitApplication({ ...form, jobId, jobTitle, source });
      setDone(true);
    } catch (err) {
      setError(err?.message || "Could not send your application. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-8 text-center sm:p-10">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
          <Check size={20} className="text-brand-600" />
        </span>
        <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.01em] text-ink-900">
          {jobTitle ? `Applied for ${jobTitle}` : "Application received"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-ink-600">
          A real person reads every application here — there is no keyword filter in between.
          If there is a fit, we will be in touch at <span className="text-ink-900">{form.email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-6 py-5 sm:px-8">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">
          {jobTitle ? `Apply for ${jobTitle}` : "General application"}
        </h3>
        <p className="mt-1 text-[13.5px] text-ink-500">
          No account needed. Fields marked <span className="text-brand-600">*</span> are required.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="px-6 py-6 sm:px-8">
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field label="Full name" required htmlFor="af-name">
            <input id="af-name" className={field} value={form.name} onChange={set("name")}
              placeholder="Ada Lovelace" maxLength={80} autoComplete="name" />
          </Field>
          <Field label="Email" required htmlFor="af-email">
            <input id="af-email" type="email" className={field} value={form.email} onChange={set("email")}
              placeholder="you@example.com" maxLength={160} autoComplete="email" />
          </Field>
          <Field label="Phone" htmlFor="af-phone">
            <input id="af-phone" className={field} value={form.phone} onChange={set("phone")}
              placeholder="+91 ..." maxLength={24} autoComplete="tel" />
          </Field>
          <Field label="DeVert handle" hint="If you already build on DeVert" htmlFor="af-handle">
            <input id="af-handle" className={field} value={form.devertHandle} onChange={set("devertHandle")}
              placeholder="yourhandle" maxLength={40} />
          </Field>
        </div>

        <Field label="Resume link"
          hint="Google Drive, Dropbox or your own site — make sure it's viewable by anyone with the link"
          htmlFor="af-resume">
          <input id="af-resume" type="url" className={field} value={form.resumeUrl} onChange={set("resumeUrl")}
            placeholder="https://..." maxLength={500} />
        </Field>

        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field label="GitHub" htmlFor="af-github">
            <input id="af-github" type="url" className={field} value={form.githubUrl} onChange={set("githubUrl")}
              placeholder="https://github.com/..." maxLength={500} />
          </Field>
          <Field label="Portfolio or website" htmlFor="af-portfolio">
            <input id="af-portfolio" type="url" className={field} value={form.portfolioUrl} onChange={set("portfolioUrl")}
              placeholder="https://..." maxLength={500} />
          </Field>
        </div>

        <Field label="LinkedIn" htmlFor="af-linkedin">
          <input id="af-linkedin" type="url" className={field} value={form.linkedinUrl} onChange={set("linkedinUrl")}
            placeholder="https://linkedin.com/in/..." maxLength={500} />
        </Field>

        <Field label="Why you"
          hint={`${form.coverNote.length}/2000 — what you've built beats what you've studied`}
          htmlFor="af-note">
          <textarea id="af-note" rows={5} className={field} value={form.coverNote} onChange={set("coverNote")}
            maxLength={2000}
            placeholder="Tell us about something you shipped, and what you'd want to own here." />
        </Field>

        {error && (
          <p role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {submitting ? "Sending..." : "Send application"}
        </button>
      </form>
    </div>
  );
}
