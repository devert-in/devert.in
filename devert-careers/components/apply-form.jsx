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

import { useEffect, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { EMPLOYMENT_TYPES, submitApplication } from "@/lib/careers";

const field =
  "w-full rounded-lg border border-ink-200 bg-ink-100 px-3.5 py-2.5 text-[14px] text-ink-900 " +
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
// server-side rule is what actually stops junk. (? & # % are excluded there
// because the admin inbox builds a mailto: link from this address.)
const EMAIL_RE = /^[^@\s?&#%]+@[^@\s?&#%]+\.[^@\s?&#%]+$/;

const URL_FIELDS = [
  ["resumeUrl", "resume link"], ["githubUrl", "GitHub link"],
  ["portfolioUrl", "portfolio link"], ["linkedinUrl", "LinkedIn link"],
];

// People paste `github.com/me` far more often than a full URL. Add the scheme
// rather than reject it, and refuse anything that is not http(s) - the inbox
// only makes http(s) clickable anyway, so a javascript: link is just noise.
function normaliseUrl(raw) {
  const v = raw.trim();
  if (!v) return { ok: true, value: "" };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false };
    if (!u.hostname.includes(".")) return { ok: false };
    return { ok: true, value: u.toString() };
  } catch {
    return { ok: false };
  }
}

// A sentence a candidate can act on, never the SDK's own error text
// ("Missing or insufficient permissions.").
function friendlyError(err) {
  const code = err?.code || "";
  if (code === "permission-denied") {
    return "This application could not be accepted. If this role was just closed, refresh the page and try again, or send a general application.";
  }
  if (code === "unavailable" || code === "deadline-exceeded" || err?.message === "timeout") {
    return "The connection dropped before your application was sent. Check your internet and press Send again.";
  }
  return "Could not send your application. Please try again in a moment.";
}

// ONE APPLICATION PER ROLE. Two layers:
//   - this browser remembers that it applied (key below), and from then on
//     shows the "already applied" panel instead of the form - no refill;
//   - the server is the real guarantee: lib/careers.js keys each application
//     by role + a hash of the email, so a second one from the same address
//     (another browser, another phone) is refused by firestore.rules and
//     surfaces here as code "already-applied".
const appliedKey = (jobId) => `devert-careers:applied:${jobId || "general"}`;

function readApplied(jobId) {
  try {
    const raw = localStorage.getItem(appliedKey(jobId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function rememberApplied(jobId, record) {
  try { localStorage.setItem(appliedKey(jobId), JSON.stringify(record)); } catch { /* private mode */ }
}

const typeLabel = (v) => EMPLOYMENT_TYPES.find((o) => o.value === v)?.label || v;

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

function AppliedPanel({ jobTitle, record, justSent }) {
  const when = record?.at
    ? new Date(record.at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-100 p-8 text-center sm:p-10">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50">
        <Check size={20} className="text-brand-600" />
      </span>
      <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.01em] text-ink-900">
        {justSent
          ? (jobTitle ? `Applied for ${jobTitle}` : "Application received")
          : (jobTitle ? `You have already applied for ${jobTitle}` : "You have already applied")}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-600">
        {justSent
          ? "A real person reads every application here - there is no keyword filter in between."
          : `We have your application${when ? `, sent on ${when}` : ""}. There is no need to send it again.`}
        {record?.email && (
          <> If there is a fit, we will be in touch at <span className="text-ink-900">{record.email}</span>.</>
        )}
      </p>
    </div>
  );
}

// `employmentTypes`: the bases a role is offered on. With more than one
// ("part-time" or "internship") the applicant must say which they want.
export function ApplyForm({ jobId, jobTitle, source = "careers", employmentTypes = [] }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", resumeUrl: "", portfolioUrl: "",
    githubUrl: "", linkedinUrl: "", devertHandle: "", coverNote: "",
  });
  // Honeypot: a field no human can see or reach. Bots fill every input they
  // find; a filled one means the submission is silently dropped.
  const [website, setWebsite] = useState("");
  const choices = employmentTypes.length > 1 ? employmentTypes : [];
  const [engagement, setEngagement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // undefined until localStorage has been read: rendering the form first and
  // swapping it out would flash a form the visitor is not allowed to fill.
  const [applied, setApplied] = useState(undefined);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => { setApplied(readApplied(jobId)); }, [jobId]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    // Mirrors the bounds firestore.rules enforces, so an invalid application
    // fails here with a sentence a human wrote rather than as a raw
    // permission-denied from the rule.
    if (form.name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!EMAIL_RE.test(form.email.trim())) { setError("That email address doesn't look right."); return; }
    const links = {};
    for (const [k, label] of URL_FIELDS) {
      const r = normaliseUrl(form[k]);
      if (!r.ok) { setError(`Your ${label} doesn't look like a web address.`); return; }
      links[k] = r.value;
    }

    if (choices.length && !engagement) {
      setError(`Please choose how you want to work with us: ${choices.map(typeLabel).join(" or ")}.`);
      return;
    }

    if (website) { setJustSent(true); setApplied({ email: form.email.trim() }); return; }

    setSubmitting(true);
    setError("");
    const email = form.email.trim();
    try {
      await withTimeout(submitApplication({ ...form, ...links, jobId, jobTitle, source, engagement }), 20000);
      const record = { email, at: Date.now() };
      rememberApplied(jobId, record);
      setJustSent(true);
      setApplied(record);
    } catch (err) {
      if (err?.code === "already-applied") {
        // The server already holds an application from this email for this
        // role (sent from another browser or device). Remember it here too.
        const record = { email, at: null };
        rememberApplied(jobId, record);
        setApplied(record);
      } else {
        setError(friendlyError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (applied === undefined) return null;
  if (applied) return <AppliedPanel jobTitle={jobTitle} record={applied} justSent={justSent} />;

  return (
    <div className="rounded-xl border border-ink-200 bg-ink-100">
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
          {choices.length > 0 && (
            <fieldset className="mb-5 sm:col-span-2">
              <legend className="mb-1.5 block text-[13px] font-medium text-ink-700">
                Applying as<span className="ml-0.5 text-brand-600">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {choices.map((t) => (
                  <label key={t}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors ${
                      engagement === t
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-ink-200 bg-ink-100 text-ink-600 hover:border-ink-300 hover:text-ink-900"}`}>
                    <input type="radio" name="af-engagement" value={t} checked={engagement === t}
                      onChange={() => setEngagement(t)} className="sr-only" />
                    {typeLabel(t)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
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
          hint="Google Drive, Dropbox or your own site - make sure it's viewable by anyone with the link"
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
          hint={`${form.coverNote.length}/2000 - what you've built beats what you've studied`}
          htmlFor="af-note">
          <textarea id="af-note" rows={5} className={field} value={form.coverNote} onChange={set("coverNote")}
            maxLength={2000}
            placeholder="Tell us about something you shipped, and what you'd want to own here." />
        </Field>

        {/* Honeypot - see the comment on `website` above. Off-screen rather
            than display:none, which some bots know to skip. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="af-website">Website</label>
          <input id="af-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <p className="mb-5 text-[12.5px] leading-relaxed text-ink-500">
          We use these details only to consider your application and to contact you about it, and
          delete them on request - write to{" "}
          <a href="mailto:devert.contact@gmail.com" className="text-ink-700 underline underline-offset-2 hover:text-ink-900">devert.contact@gmail.com</a>.
          See our{" "}
          <a href="https://devert.in/privacy" target="_blank" rel="noopener noreferrer" className="text-ink-700 underline underline-offset-2 hover:text-ink-900">privacy policy</a>.
          DeVert is an equal-opportunity organisation.
        </p>

        {error && (
          <p role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-[14px] font-semibold text-[#05080F] transition-colors hover:bg-brand-700 disabled:opacity-50">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {submitting ? "Sending..." : "Send application"}
        </button>
      </form>
    </div>
  );
}
