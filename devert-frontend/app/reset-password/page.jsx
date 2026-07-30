"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { CheckCircle2, AlertTriangle, KeyRound, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import { CampusShell } from "@/components/campus/campus-theme-provider";

// Firebase Hosting's default password-reset page lives at
// <project>.firebaseapp.com/__/auth/action - functional, but it exposes
// Firebase's own domain/branding to what should read as a DeVert flow. This
// page is that branded replacement: devert-backend's AdminAccountService
// (and CampusStaffLogin's own "Forgot password") now both generate reset
// links whose continue URL points HERE instead, carrying the same
// `mode`/`oobCode` Firebase always appends (that's what actually verifies
// and completes the reset - only the domain around it changes) plus two
// plain routing hints, `campus`/`role`, so the success screen can send
// someone straight back to their own role's login page without ever needing
// to sign them in first just to look up where they belong.
const ROLE_LABELS = { principal: "Principal", hod: "Head of Department", faculty: "Faculty / Class Teacher" };

function friendlyError(code) {
  switch (code) {
    case "auth/expired-action-code":
      return "This link has expired. Ask your administrator to resend the setup email.";
    case "auth/invalid-action-code":
      return "This link is invalid or has already been used. If you've already set your password, sign in normally instead.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your administrator.";
    case "auth/user-not-found":
      return "We couldn't find an account for this link. Contact your administrator.";
    case "auth/weak-password":
      return "Choose a stronger password - at least 6 characters.";
    default:
      return "This link isn't valid. Contact your administrator for a new one.";
  }
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const campus = searchParams.get("campus");
  const role = searchParams.get("role");
  const roleLabel = ROLE_LABELS[role] || null;

  const [status, setStatus] = useState("verifying"); // verifying | form | success | error
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setErrorMsg("This link is missing required information. Contact your administrator for a new one.");
      setStatus("error");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => { setEmail(verifiedEmail); setStatus("form"); })
      .catch((e) => { setErrorMsg(friendlyError(e.code)); setStatus("error"); });
  }, [mode, oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setFormError("Passwords don't match."); return; }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch (e) {
      setErrorMsg(friendlyError(e.code));
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const continueHref = campus && role ? `/campus/${campus}/${role}` : "/login";
  const continueLabel = campus && role ? `Continue to ${roleLabel || "Login"} →` : "Continue to Sign In →";

  return (
    <CampusShell>
      <CampusCard className="p-7 w-full max-w-sm">
        {status === "verifying" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CampusSkeleton className="h-10 w-10 rounded-full" />
            <CampusSkeleton className="h-4 w-40" />
          </div>
        )}

        {status === "error" && (
          <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't verify this link" description={errorMsg} />
        )}

        {status === "form" && (
          <>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                <KeyRound size={20} />
              </div>
              <h3 className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>Set Your Password</h3>
              <p className="text-[13px] mt-1" style={{ color: CAMPUS.inkSoft }}>{email}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: CAMPUS.inkSoft }}>New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" autoFocus
                  className="w-full px-3 rounded-lg text-[13.5px] outline-none" style={{ height: 42, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: CAMPUS.inkSoft }}>Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
                  className="w-full px-3 rounded-lg text-[13.5px] outline-none" style={{ height: 42, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              </div>
              {formError && <p className="text-[12.5px]" style={{ color: CAMPUS.bad }}>{formError}</p>}
              <CampusButton type="submit" icon={KeyRound} disabled={submitting} className="w-full mt-1">
                {submitting ? "Setting password..." : "Set Password"}
              </CampusButton>
            </form>
          </>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>Password Created Successfully</h3>
            <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>Your account is ready.</p>
            {roleLabel && (
              <span className="text-[10.5px] font-mono tracking-widest px-2.5 py-1 rounded-full" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                {roleLabel.toUpperCase()}
              </span>
            )}
            <CampusButton onClick={() => router.push(continueHref)} icon={ArrowRight} className="w-full mt-3">
              {continueLabel}
            </CampusButton>
            <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>
              For your security, sign in again with your new password on the login page.
            </p>
          </div>
        )}
      </CampusCard>
    </CampusShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
