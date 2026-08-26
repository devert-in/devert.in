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
// page is the branded replacement, and devert-backend's AdminAccountService
// (plus CampusStaffLogin's own "Forgot password") both aim their reset links
// at it via ActionCodeSettings, carrying two plain routing hints -
// `campus`/`role` - so whoever lands here ends up on their own role's login
// page without ever needing to sign in first just to look up where they
// belong.
//
// Whether this page runs the reset itself or only catches the user afterwards
// depends on a console setting outside this repo - see routingHints() below,
// which is why it handles a link with no `oobCode` as a normal outcome rather
// than an error.
const ROLE_LABELS = { principal: "Principal", hod: "Head of Department", faculty: "Faculty / Class Teacher" };

const CAMPUS_SLUG = /^[a-z0-9][a-z0-9-]*$/i;

// `role` gets interpolated straight into a path, and both params are just URL
// text anyone can edit - keep them to the exact shapes a real login page has
// (a slug, and one of the three known role segments) so a crafted link can't
// steer the redirect below anywhere but a DeVert Campus login page.
//
// Absolute campus.devert.in URL, not a same-origin "/campus/..." path - this
// page lives on devert.in, but the Campus staff login it sends people back to
// now lives on a different origin entirely. router.replace() (next/navigation)
// only ever does a client-side transition within THIS app's own route table,
// so a same-origin-looking path here would 404 instead of reaching Campus -
// see the window.location.href navigations below, used for exactly this href.
function loginHrefFor(campus, role) {
  if (!campus || !CAMPUS_SLUG.test(campus) || !ROLE_LABELS[role]) return null;
  return `https://campus.devert.in/${campus}/${role}`;
}

// loginHref is cross-origin (campus.devert.in); "/login" isn't. router.replace
// only handles the latter, so branch on shape rather than assuming one or the
// other everywhere this fires.
function navigateTo(router, href) {
  if (href.startsWith("http")) window.location.href = href;
  else router.replace(href);
}

// Two link shapes reach this page, and which one you get depends on a Firebase
// Console setting (Auth -> Templates -> "Customize action URL"), not on
// anything in this repo:
//   1. Not customized (what's live today): the email points at Firebase's own
//      __/auth/action handler, which completes the reset itself and then sends
//      the user HERE with only ?campus=&role= - no mode/oobCode, because
//      there's nothing left to verify. See the effect below.
//   2. Customized to /reset-password: the email lands here directly with
//      mode/oobCode, and campus/role ride along nested inside `continueUrl`.
// Reading the routing hints from either place keeps the destination right
// under both, so flipping that console setting needs no code change.
function routingHints(searchParams) {
  const campus = searchParams.get("campus");
  const role = searchParams.get("role");
  if (campus && role) return { campus, role };
  const continueUrl = searchParams.get("continueUrl");
  if (!continueUrl) return { campus, role };
  try {
    const nested = new URL(continueUrl, "https://devert.in").searchParams;
    return { campus: campus || nested.get("campus"), role: role || nested.get("role") };
  } catch {
    return { campus, role };
  }
}

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
  const { campus, role } = routingHints(searchParams);
  const roleLabel = ROLE_LABELS[role] || null;
  const loginHref = loginHrefFor(campus, role);

  const [status, setStatus] = useState("verifying"); // verifying | form | success | redirecting | error
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      // No code to verify. With campus/role in hand this is link shape 1 above
      // - Firebase already took the new password and just bounced the user
      // here - so finish the job by putting them on their own role's login
      // page, instead of showing a "bad link" error for a reset that in fact
      // succeeded. Only a link with no routing hints at all is genuinely broken.
      if (loginHref) {
        setStatus("redirecting");
        navigateTo(router, loginHref);
        return;
      }
      setErrorMsg("This link is missing required information. Contact your administrator for a new one.");
      setStatus("error");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => { setEmail(verifiedEmail); setStatus("form"); })
      .catch((e) => { setErrorMsg(friendlyError(e.code)); setStatus("error"); });
  }, [mode, oobCode, loginHref, router]);

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

  const continueHref = loginHref || "/login";
  const continueLabel = loginHref ? `Continue to ${roleLabel} Login →` : "Continue to Sign In →";

  return (
    <CampusShell>
      <CampusCard className="p-7 w-full max-w-sm">
        {status === "verifying" && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <CampusSkeleton className="h-10 w-10 rounded-full" />
            <CampusSkeleton className="h-4 w-40" />
          </div>
        )}

        {status === "redirecting" && (
          <div className="flex flex-col items-center text-center gap-3 py-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>Your password is set</h3>
            <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>
              Taking you to the {roleLabel} login page…
            </p>
            <CampusButton onClick={() => navigateTo(router, loginHref)} icon={ArrowRight} className="w-full mt-2">
              Go to Login →
            </CampusButton>
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
            <CampusButton onClick={() => navigateTo(router, continueHref)} icon={ArrowRight} className="w-full mt-3">
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
