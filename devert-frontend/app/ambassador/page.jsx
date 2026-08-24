"use client";

// Campus Ambassador application + dashboard, on one route.
//
// One route rather than two because the states are mutually exclusive and the
// transition matters: an applicant who has just submitted should see their own
// pending application, not be bounced back to a form that would let them submit
// again. Which state renders is decided by the ambassadors/{uid} doc, so it
// survives a reload and cannot be faked by navigating.

import { useEffect, useState } from "react";
import {
  Building2, Check, Clock, Copy, Loader2, ShieldCheck, Users, XCircle, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AMBASSADOR_PERKS, AMBASSADOR_STATUS, applyForAmbassador, suggestReferralCode,
  watchMyAmbassador, watchMyReferralCount,
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

  const shareUrl = amb?.referralCode ? `https://devert.in/?ref=${amb.referralCode}` : "";

  return (
    <main className="min-h-screen pt-16 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-2xl mx-auto">
        <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "rgba(0,255,65,0.55)" }}>
          // CAMPUS AMBASSADOR
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tighter text-white leading-none mb-4">
          Bring DeVert to<br /><span className="text-neon-cyan text-glow-cyan">your college.</span>
        </h1>
        <p className="font-mono text-sm text-white/40 leading-relaxed mb-10 max-w-xl">
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> You know which of your seniors got
          placed and which didn&apos;t.<br />
          <span style={{ color: "rgba(0,255,65,0.55)" }}>$</span> Run DeVert on your campus and get
          paid for it.
        </p>

        {loading || !ambChecked ? (
          <p className="font-mono text-xs text-white/30 animate-pulse">loading...</p>
        ) : !user ? (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">sign in required</span>
            </div>
            <div className="p-5">
              <a href="/login" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg inline-block">
                sign in to apply
              </a>
            </div>
          </div>
        ) : amb?.status === AMBASSADOR_STATUS.ACTIVE ? (
          <>
            <div className="terminal-window mb-5">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">active ambassador</span>
                <span className="ml-auto font-mono text-[10px]" style={{ color: "#00FF41" }}>{amb.collegeName}</span>
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
                    <p className="font-mono text-lg font-bold" style={{ color: "#00FF41" }}>{amb.referralCode}</p>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-white/35 mb-1.5">SHARE THIS LINK</p>
                <div data-allow-clipboard className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-2"
                  style={inputStyle}>
                  <span className="font-mono text-[11px] text-white/70 truncate flex-1">{shareUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(shareUrl).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }).catch(() => {});
                    }}
                    className="flex-shrink-0"
                    style={{ color: copied ? "#00FF41" : "rgba(255,255,255,0.4)" }}
                    title="Copy"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="font-mono text-[10px] text-white/25">
                  Anyone who signs up through this link is credited to you permanently - attribution is
                  written once and cannot be reassigned.
                </p>
              </div>
            </div>

            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">what you get</span>
              </div>
              <div className="p-5 space-y-2.5">
                {AMBASSADOR_PERKS.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <ShieldCheck size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#00FF41" }} />
                    <span className="font-mono text-[11.5px] text-white/60 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : amb?.status === AMBASSADOR_STATUS.PENDING ? (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">under review</span>
            </div>
            <div className="p-6 text-center">
              <Clock size={20} className="mx-auto mb-3" style={{ color: "#FF9500" }} />
              <h3 className="font-sans text-lg font-bold text-white mb-2">Application received</h3>
              <p className="font-mono text-[11.5px] text-white/45 leading-relaxed mb-1">
                For <span className="text-white/75">{amb.collegeName}</span>. We review applications
                manually - one ambassador per college, so this is a real decision rather than a
                formality.
              </p>
              <p className="font-mono text-[10px] text-white/25 mt-3">
                Your provisional code is <span className="text-white/50">{amb.referralCode}</span>. It
                starts crediting signups once you are approved, not before.
              </p>
            </div>
          </div>
        ) : amb?.status === AMBASSADOR_STATUS.REJECTED || amb?.status === AMBASSADOR_STATUS.SUSPENDED ? (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
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
        ) : (
          <form onSubmit={submit} className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">apply</span>
            </div>
            <div className="p-5">
              <div className="space-y-2.5 mb-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {AMBASSADOR_PERKS.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#00FF41" }} />
                    <span className="font-mono text-[11.5px] text-white/60 leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>

              <Field label="YOUR COLLEGE">
                <input value={form.collegeName} onChange={set("collegeName")}
                  placeholder="Malla Reddy College of Engineering and Technology"
                  className="w-full font-mono text-[13px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none"
                  style={inputStyle} />
              </Field>

              <Field label="CITY">
                <input value={form.city} onChange={set("city")} placeholder="Hyderabad"
                  className="w-full font-mono text-[13px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none"
                  style={inputStyle} />
              </Field>

              <Field label="ROUGHLY HOW MANY STUDENTS CAN YOU REACH?"
                hint="An honest number is worth more than a big one.">
                <input type="number" min="0" value={form.expectedReach} onChange={set("expectedReach")}
                  placeholder="150"
                  className="w-full font-mono text-[13px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none"
                  style={inputStyle} />
              </Field>

              <Field label="PREFERRED REFERRAL CODE"
                hint={`Left blank we'll use ${suggestReferralCode(userData?.displayName || user.displayName, user.uid)}. Letters and numbers only.`}>
                <input value={form.referralCode} onChange={set("referralCode")} placeholder="MRCET2026"
                  className="w-full font-mono text-[13px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none uppercase"
                  style={inputStyle} />
              </Field>

              <Field label="WHY YOU?" hint="Two lines is plenty. What would you actually do first?">
                <textarea value={form.whyMe} onChange={set("whyMe")} rows={3}
                  placeholder="I run our coding club's WhatsApp group and we already do weekly practice sessions..."
                  className="w-full font-mono text-[12.5px] text-white/80 px-3.5 py-2.5 rounded-lg outline-none resize-none"
                  style={inputStyle} />
              </Field>

              {error && (
                <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg"
                  style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#FF9A9A" }} />
                  <p className="font-mono text-[11px]" style={{ color: "#FF9A9A" }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 font-mono text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
                style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.35)", background: "rgba(0,255,65,0.05)" }}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Building2 size={13} />}
                {submitting ? "submitting..." : "[ APPLY_AS_AMBASSADOR ]"}
              </button>

              <p className="font-mono text-[10px] text-white/25 mt-3 text-center">
                One ambassador per college. Applications are reviewed by hand.
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
