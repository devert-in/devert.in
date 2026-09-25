"use client";

// Campus Ambassador application + dashboard, on one route.
//
// One route rather than two because the states are mutually exclusive and the
// transition matters: an applicant who has just submitted should see their own
// pending application, not be bounced back to a form that would let them submit
// again. Which state renders is decided by the ambassadors/{uid} doc, so it
// survives a reload and cannot be faked by navigating.
//
// Two columns from lg up: the pitch (perks, how it works) on the left, the
// form or dashboard on the right. That uses the width without widening any
// line of text - this is still a form page, and CLAUDE.md keeps those narrow
// for readability; each column is.

import { useEffect, useState } from "react";
import {
  Building2, Check, Clock, Copy, Loader2, ShieldCheck, Users, XCircle, AlertTriangle,
  Send, BadgeCheck, Share2, Hourglass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AMBASSADOR_PERKS, AMBASSADOR_STATUS, applyForAmbassador, suggestReferralCode,
  normalizeReferralCode, watchMyAmbassador, watchMyReferralCount,
} from "@/lib/ambassadors";

function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <span className="font-mono text-[10px] tracking-wider text-white/40 block mb-1.5">{label}</span>
      {children}
      {hint && <span className="font-mono text-[10px] text-white/25 block mt-1">{hint}</span>}
    </label>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
};
const inputClass = "w-full font-mono text-[13px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none focus:border-neon-cyan/40";

const STEPS = [
  { icon: Send,       title: "Apply",           body: "Tell us which college you represent and how many students you can reach." },
  { icon: BadgeCheck, title: "Get approved",    body: "We review every application by hand. One ambassador per college." },
  { icon: Share2,     title: "Share your link", body: "Every new account made through your link is credited to you, permanently." },
];

function Pitch() {
  const live = AMBASSADOR_PERKS.filter(p => p.live);
  const soon = AMBASSADOR_PERKS.filter(p => !p.live);
  return (
    <div className="space-y-5">
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">what you get</span>
        </div>
        <div className="p-5 space-y-2.5">
          {live.map((p) => (
            <div key={p.text} className="flex items-start gap-2">
              <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#00FF41" }} />
              <span className="font-mono text-[11.5px] text-white/65 leading-relaxed">{p.text}</span>
            </div>
          ))}
          {soon.map((p) => (
            <div key={p.text} className="flex items-start gap-2">
              <Hourglass size={13} className="flex-shrink-0 mt-0.5 text-white/30" />
              <span className="font-mono text-[11.5px] text-white/40 leading-relaxed">
                {p.text}
                <span className="ml-2 font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded text-white/40 border border-white/10 align-middle">COMING SOON</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">how it works</span>
        </div>
        <ol className="p-5 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,255,0.06)", border: "1px solid rgba(0,255,255,0.2)" }}>
                <s.icon size={13} style={{ color: "#00FFFF" }} />
              </span>
              <div>
                <p className="font-sans text-sm font-semibold text-white/85">{i + 1}. {s.title}</p>
                <p className="font-mono text-[11px] text-white/40 leading-relaxed mt-0.5">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function AmbassadorPage() {
  const { user, userData, loading } = useAuth();
  const [amb, setAmb] = useState(null);
  const [ambChecked, setAmbChecked] = useState(false);
  const [referrals, setReferrals] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ collegeName: "", city: "", whyMe: "", expectedReach: "", referralCode: "" });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!user) { setAmbChecked(true); return; }
    return watchMyAmbassador(user.uid, (a) => { setAmb(a); setAmbChecked(true); });
  }, [user]);

  useEffect(() => {
    if (!amb || amb.status !== AMBASSADOR_STATUS.ACTIVE) return;
    return watchMyReferralCount(amb.uid, setReferrals);
  }, [amb]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.collegeName.trim()) { setError("Which college are you representing?"); return; }
    if (!form.city.trim()) { setError("Which city is the college in?"); return; }
    if (form.referralCode && normalizeReferralCode(form.referralCode).length < 4) {
      setError("A referral code needs at least 4 letters or numbers.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await applyForAmbassador(user.uid, {
        ...form,
        displayName: userData?.displayName || user.displayName || "",
        email: user.email || "",
      });
    } catch (err) {
      setError(err?.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  // The live origin, so the link works on whichever DeVert host this is
  // (localhost included) rather than always pointing at production.
  const origin = typeof window !== "undefined" ? window.location.origin : "https://devert.in";
  const shareUrl = amb?.referralCode ? `${origin}/?ref=${amb.referralCode}` : "";

  const copy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  let panel;
  if (loading || !ambChecked) {
    panel = <p className="font-mono text-xs text-white/30 animate-pulse">loading...</p>;
  } else if (!user) {
    panel = (
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">sign in required</span>
        </div>
        <div className="p-6">
          <p className="font-mono text-[11.5px] text-white/50 leading-relaxed mb-4">
            Applications are tied to your DeVert account, so your referral credit follows you.
          </p>
          <a href="/login?next=/ambassador"
            className="font-mono text-xs font-semibold px-4 py-2.5 rounded-lg inline-block"
            style={{ background: "#00FF41", color: "#05080F" }}>
            Sign in to apply
          </a>
        </div>
      </div>
    );
  } else if (amb?.status === AMBASSADOR_STATUS.ACTIVE) {
    panel = (
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">active ambassador</span>
          <span className="ml-auto font-mono text-[10px] truncate" style={{ color: "#00FF41" }}>{amb.collegeName}</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="font-mono text-[10px] text-white/35 mb-1">SIGNUPS CREDITED</p>
              <p className="font-sans text-2xl font-bold text-white flex items-center gap-2">
                <Users size={16} style={{ color: "#00FFFF" }} />{referrals}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-white/35 mb-1">YOUR CODE</p>
              <p className="font-mono text-lg font-bold break-all" style={{ color: "#00FF41" }}>{amb.referralCode}</p>
            </div>
          </div>

          <p className="font-mono text-[10px] text-white/35 mb-1.5">SHARE THIS LINK</p>
          <div data-allow-clipboard className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-2" style={inputStyle}>
            <span className="font-mono text-[11px] text-white/70 truncate flex-1">{shareUrl}</span>
            <button onClick={copy} className="flex-shrink-0 flex items-center gap-1 font-mono text-[10px]"
              style={{ color: copied ? "#00FF41" : "rgba(255,255,255,0.5)" }} title="Copy link">
              {copied ? <><Check size={13} /> copied</> : <><Copy size={13} /> copy</>}
            </button>
          </div>
          <p className="font-mono text-[10px] text-white/25 leading-relaxed mb-4">
            New accounts made through this link are credited to you permanently - attribution is
            written once and cannot be reassigned. Existing DeVert users who click it are not counted.
          </p>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(0,255,65,0.05)", border: "1px solid rgba(0,255,65,0.2)" }}>
            <ShieldCheck size={13} style={{ color: "#00FF41" }} />
            <span className="font-mono text-[11px] text-white/65">DeVert Pro is active on your account.</span>
          </div>
        </div>
      </div>
    );
  } else if (amb?.status === AMBASSADOR_STATUS.PENDING) {
    panel = (
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">under review</span>
        </div>
        <div className="p-6 text-center">
          <Clock size={20} className="mx-auto mb-3" style={{ color: "#FF9500" }} />
          <h3 className="font-sans text-lg font-bold text-white mb-2">Application received</h3>
          <p className="font-mono text-[11.5px] text-white/45 leading-relaxed mb-1">
            For <span className="text-white/75">{amb.collegeName}</span>. We review applications
            manually - one ambassador per college, so this is a real decision rather than a
            formality. You&apos;ll get a notification when it&apos;s decided.
          </p>
          <p className="font-mono text-[10px] text-white/25 mt-3">
            Your reserved code is <span className="text-white/50">{amb.referralCode}</span>. It
            starts crediting signups once you are approved, not before.
          </p>
        </div>
      </div>
    );
  } else if (amb?.status === AMBASSADOR_STATUS.REJECTED || amb?.status === AMBASSADOR_STATUS.SUSPENDED) {
    panel = (
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">{amb.status}</span>
        </div>
        <div className="p-6 text-center">
          <XCircle size={20} className="mx-auto mb-3" style={{ color: "#FF5050" }} />
          <p className="font-mono text-[11.5px] text-white/50 leading-relaxed">
            {amb.status === AMBASSADOR_STATUS.SUSPENDED
              ? "Your ambassador access is suspended. Reach out if you think that is wrong."
              : "This application wasn't taken forward - often because the college already has an ambassador."}
          </p>
        </div>
      </div>
    );
  } else {
    const suggested = suggestReferralCode(userData?.displayName || user.displayName, user.uid);
    panel = (
      <form onSubmit={submit} className="terminal-window" noValidate>
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">apply</span>
        </div>
        <div className="p-5">
          <Field label="YOUR COLLEGE *">
            <input value={form.collegeName} onChange={set("collegeName")} maxLength={160} required
              placeholder="Malla Reddy College of Engineering and Technology"
              className={inputClass} style={inputStyle} />
          </Field>

          <Field label="CITY *">
            <input value={form.city} onChange={set("city")} placeholder="Hyderabad" maxLength={80} required
              className={inputClass} style={inputStyle} />
          </Field>

          <Field label="ROUGHLY HOW MANY STUDENTS CAN YOU REACH?"
            hint="An honest number is worth more than a big one.">
            <input type="number" min="0" max="100000" value={form.expectedReach} onChange={set("expectedReach")}
              placeholder="150" className={inputClass} style={inputStyle} />
          </Field>

          <Field label="PREFERRED REFERRAL CODE"
            hint={`Left blank we'll use ${suggested}. Letters and numbers only; if it's taken we add digits.`}>
            <input value={form.referralCode} onChange={set("referralCode")} placeholder="MRCET2026" maxLength={20}
              className={`${inputClass} uppercase`} style={inputStyle} />
          </Field>

          <Field label="WHY YOU?" hint={`Two lines is plenty. What would you actually do first? (${form.whyMe.length}/1000)`}>
            <textarea value={form.whyMe} onChange={set("whyMe")} rows={3} maxLength={1000}
              placeholder="I run our coding club's WhatsApp group and we already do weekly practice sessions..."
              className={`${inputClass} text-[12.5px] resize-none`} style={inputStyle} />
          </Field>

          {error && (
            <div role="alert" className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#FF9A9A" }} />
              <p className="font-mono text-[11px]" style={{ color: "#FF9A9A" }}>{error}</p>
            </div>
          )}

          {/* Green fill carries dark text (CLAUDE.md: white on neon green is ~1.5:1). */}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 font-mono text-xs font-semibold py-3 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#00FF41", color: "#05080F" }}>
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
            {submitting ? "submitting..." : "Apply as ambassador"}
          </button>

          <p className="font-mono text-[10px] text-white/25 mt-3 text-center">
            One ambassador per college. Applications are reviewed by hand.
          </p>
        </div>
      </form>
    );
  }

  return (
    <main className="min-h-screen pt-16 pb-32 px-4 sm:px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-2xl lg:max-w-6xl mx-auto">
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "rgba(0,255,65,0.55)" }}>
          // CAMPUS AMBASSADOR
        </p>
        <h1 className="font-sans text-3xl lg:text-4xl font-bold tracking-tighter text-white leading-none mb-4">
          Bring DeVert to<br /><span className="text-neon-cyan text-glow-cyan">your college.</span>
        </h1>
        <p className="font-mono text-sm text-white/40 leading-relaxed mb-10 max-w-xl">
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> You know which of your seniors got
          placed and which didn&apos;t.<br />
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> Run DeVert on your campus and get
          paid for it.
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 items-start">
          {/* Form/dashboard first on mobile - it is what the visitor came to do. */}
          <div className="lg:order-2">{panel}</div>
          <div className="lg:order-1"><Pitch /></div>
        </div>
      </div>
    </main>
  );
}
