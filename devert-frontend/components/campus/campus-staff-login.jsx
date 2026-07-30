"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { LogIn, ShieldCheck, KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase";
import { fetchInstitution, fetchMyRoleAssignment } from "@/lib/institutions";
import { recordStaffLoginSuccess, recordStaffLoginFailure } from "@/lib/staffAccounts";
import { ROLE_CATALOG } from "@/lib/permissions";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusButton, CampusSkeleton } from "@/components/campus/campus-ui";
import { CampusShell } from "@/components/campus/campus-theme-provider";

// Dedicated, admin-provisioned-only login for Principal/HOD/Faculty-Class-
// Teacher - there is deliberately no "create account" link anywhere on this
// page. Accounts are created exclusively through Manage -> Manage Admins
// (devert-backend's AdminAccountService); this page only ever signs in to
// one that already exists.
export function CampusStaffLogin({ slug, roleKey }) {
  const router = useRouter();
  const roleInfo = ROLE_CATALOG[roleKey];
  const [institution, setInstitution] = useState(undefined); // undefined = loading, null = not found
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  // Set once an ALREADY-signed-in session turns out to already match this
  // exact role - skips straight to redirecting instead of showing the form
  // at all. null = still checking, false = show the form (either signed out,
  // or signed in as something else).
  const [alreadyMatches, setAlreadyMatches] = useState(null);
  const [switchingFrom, setSwitchingFrom] = useState(null);

  useEffect(() => {
    fetchInstitution(slug).then(setInstitution).catch(() => setInstitution(null));
  }, [slug]);

  // If the browser is already signed in (e.g. the admin who just created
  // this account, or the account holder from an earlier tab) as the RIGHT
  // role for this institution, skip the form and redirect immediately. If
  // signed in as something else, let the form show but flag it - submitting
  // switches accounts (sign out the old one first).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!auth.currentUser) { setAlreadyMatches(false); return; }
      const assignment = await fetchMyRoleAssignment(slug, auth.currentUser.uid).catch(() => null);
      if (cancelled) return;
      if (assignment && assignment.roleKey === roleKey && assignment.status === "active") {
        setAlreadyMatches(true);
        router.push(`/campus/${slug}`);
      } else {
        setSwitchingFrom(auth.currentUser.email || "another account");
        setAlreadyMatches(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, roleKey, router]);

  const roleLabel = roleInfo?.label || "Staff";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setSubmitting(true);
    try {
      if (auth.currentUser) await signOut(auth);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const assignment = await fetchMyRoleAssignment(slug, cred.user.uid).catch(() => null);

      if (!assignment || assignment.roleKey !== roleKey || assignment.status !== "active") {
        await recordStaffLoginFailure({ institutionId: slug, email: email.trim() }).catch(() => {});
        await signOut(auth);
        setError(
          !assignment ? `This account isn't set up as ${roleLabel} for ${institution?.name || "this campus"}.`
            : assignment.status !== "active" ? "This account's access has been suspended. Contact your institution admin."
            : `This account is registered as a different role.`
        );
        return;
      }

      await recordStaffLoginSuccess({ institutionId: slug }).catch(() => {});
      router.push(`/campus/${slug}`);
    } catch {
      await recordStaffLoginFailure({ institutionId: slug, email: email.trim() }).catch(() => {});
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(""); setResetSent(false);
    if (!email.trim()) { setError("Enter your email above first, then tap “Forgot password”."); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch {
      setError("Couldn't send a reset email for that address.");
    }
  };

  if (institution === undefined || alreadyMatches === null || alreadyMatches === true) {
    return (
      <CampusShell>
        <CampusCard className="p-7 w-full max-w-sm">
          <CampusSkeleton className="h-24 w-full" />
        </CampusCard>
      </CampusShell>
    );
  }
  if (institution === null) {
    return (
      <CampusShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Campus not found</h3>
          <p className="text-[13.5px]" style={{ color: CAMPUS.inkSoft }}>This institution doesn&apos;t exist on DeVert Campus.</p>
        </CampusCard>
      </CampusShell>
    );
  }

  return (
    <CampusShell>
      <CampusCard className="p-7 w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>{roleLabel} Login</h3>
          <p className="text-[13px] mt-1" style={{ color: CAMPUS.inkSoft }}>{institution.name}</p>
        </div>

        {switchingFrom && (
          <p className="text-[12px] text-center mb-4 px-3 py-2 rounded-lg" style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
            Signed in as {switchingFrom} - signing in below will switch accounts.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: CAMPUS.inkSoft }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
              className="w-full px-3 rounded-lg text-[13.5px] outline-none" style={{ height: 42, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium mb-1.5" style={{ color: CAMPUS.inkSoft }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              className="w-full px-3 rounded-lg text-[13.5px] outline-none" style={{ height: 42, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          </div>

          {error && <p className="text-[12.5px]" style={{ color: CAMPUS.bad }}>{error}</p>}
          {resetSent && <p className="text-[12.5px]" style={{ color: CAMPUS.good }}>Password reset email sent - check your inbox.</p>}

          <CampusButton type="submit" icon={LogIn} disabled={submitting} className="w-full mt-1">
            {submitting ? "Signing in..." : `Sign in as ${roleLabel}`}
          </CampusButton>
          <button type="button" onClick={handleForgotPassword}
            className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium mt-1" style={{ color: CAMPUS.teal }}>
            <KeyRound size={12} /> Forgot password?
          </button>
        </form>

        <p className="text-[11.5px] text-center mt-5" style={{ color: CAMPUS.inkFaint }}>
          Accounts are created by your institution&apos;s admin team - there&apos;s no self-signup for {roleLabel.toLowerCase()} access.
        </p>
      </CampusCard>
    </CampusShell>
  );
}
