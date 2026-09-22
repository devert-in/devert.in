"use client";

// Route guards for the Placements Prep module. Each guard reads auth state
// from AuthContext, shows a single loading skeleter while that resolves (no
// flicker between "logged out" and "logged in" states), then either renders
// children or a styled lock/redirect screen.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, ShieldAlert, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function GuardShell({ children }) {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative flex items-center justify-center">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <GuardShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="terminal-window p-10 flex flex-col items-center gap-3 text-center"
      >
        <Loader2 size={20} className="text-neon-cyan/60 animate-spin" />
        <p className="font-mono text-xs text-white/35 tracking-wider">{"// authenticating_session.sh"}</p>
      </motion.div>
    </GuardShell>
  );
}

function LockScreen({ icon: Icon = Lock, kicker, title, message, action }) {
  return (
    <GuardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="terminal-window overflow-hidden"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-2">access_denied.sh</span>
        </div>
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,59,59,0.08)" }}
          >
            <Icon size={24} className="text-[#FF3B3B]" />
          </div>
          {kicker && (
            <p className="font-mono text-xs text-neon-green/55 tracking-wider">{kicker}</p>
          )}
          <h2 className="font-sans text-xl font-bold text-white leading-snug">{title}</h2>
          {message && (
            <p className="font-mono text-xs text-white/40 leading-relaxed">{message}</p>
          )}
          {action}
        </div>
      </motion.div>
    </GuardShell>
  );
}

/** Redirects to /login if not authenticated. Renders children once authed. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />; // brief window before redirect fires
  return children;
}

/** Requires auth AND a completed prep onboarding profile (roll number etc). */
export function RequireOnboarded({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const onboarded = !!profile?.prepOnboarded;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!onboarded) {
      router.replace("/prep/onboarding");
    }
  }, [loading, user, onboarded, router]);

  if (loading || !user || !onboarded) return <LoadingScreen />;
  return children;
}

/** Requires faculty/tpo/admin role. Renders a lock screen (no redirect loop) if not staff. */
export function RequireStaff({ children }) {
  const { user, isStaff, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;
  if (!isStaff) {
    return (
      <LockScreen
        kicker="// /prep — staff_only.sh"
        title="Staff Access Required"
        message="This section is restricted to faculty, TPO, and admin accounts. If you believe this is a mistake, contact your placements coordinator to have your role updated."
      />
    );
  }
  return children;
}

/** Requires a Prep admin - either the platform isAdmin claim, or this
    module's own prep-scoped role: "admin" (see firestore.rules' isPrepAdmin(),
    role == "admin" || isAdmin()). Previously checked bare isAdmin only, unlike
    RequireStaff's already-OR'd isStaff below - a user granted prep-only admin
    via the Firestore-console bootstrap PREP_MODULE.md describes would pass
    the server rule for every actual write but get wrongly locked out of this
    screen by the client gate before ever reaching it. */
export function RequireAdmin({ children }) {
  const { user, isAdmin, role, loading } = useAuth();
  const router = useRouter();
  const isPrepAdmin = role === "admin" || isAdmin;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;
  if (!isPrepAdmin) {
    return (
      <LockScreen
        icon={ShieldAlert}
        kicker="// /prep/admin — admin_only.sh"
        title="Admin Access Required"
        message="This panel is restricted to Prep admins. Ask an existing admin to grant your account the 'admin' role from the role manager."
      />
    );
  }
  return children;
}

export { LockScreen, LoadingScreen, GuardShell };
export const OnboardingLockIcon = GraduationCap;
