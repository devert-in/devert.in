"use client";

// Mandatory profile completion — roll number, branch, class group.
// Students cannot take exams/tests, log attempts, or see faculty dashboards
// correctly without this. Roll number is immutable once set (design §3).

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock, GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/prep/guards";
import { PrepShell, TerminalCard, BracketButton } from "@/components/prep/ui";
import { getClassGroups, saveOnboardingProfile } from "@/lib/prep/db";
import { BRANCHES, DEFAULT_CLASS_GROUPS, ROLL_NUMBER_REGEX } from "@/lib/prep/constants";

function OnboardingForm() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const alreadyOnboarded = !!profile?.prepOnboarded;
  const lockedRoll = profile?.rollNumber || "";

  const [rollNumber, setRollNumber] = useState(lockedRoll);
  const [branch, setBranch] = useState(profile?.branch || "");
  const [classGroup, setClassGroup] = useState(profile?.classGroup || "");
  const [groups, setGroups] = useState(null); // null = loading
  const [groupsError, setGroupsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rollTouchError, setRollTouchError] = useState("");

  // Already fully onboarded — bounce to the hub instead of re-showing the form.
  useEffect(() => {
    if (alreadyOnboarded) router.replace("/prep");
  }, [alreadyOnboarded, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getClassGroups({ activeOnly: true });
        if (cancelled) return;
        setGroups(rows && rows.length ? rows : DEFAULT_CLASS_GROUPS.map((g) => ({ id: g.name, ...g })));
      } catch {
        if (cancelled) return;
        setGroupsError("Couldn't reach the class-group list — showing the default set.");
        setGroups(DEFAULT_CLASS_GROUPS.map((g) => ({ id: g.name, ...g })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    if (!branch) return groups;
    const filtered = groups.filter((g) => g.branch === branch);
    return filtered.length ? filtered : groups;
  }, [groups, branch]);

  // If the selected class group falls out of the branch-filtered list, clear it.
  useEffect(() => {
    if (classGroup && visibleGroups.length && !visibleGroups.some((g) => g.name === classGroup)) {
      setClassGroup("");
    }
  }, [visibleGroups, classGroup]);

  const rollLocked = !!lockedRoll;
  const normalizedRoll = rollNumber.trim().toUpperCase();
  const rollValid = ROLL_NUMBER_REGEX.test(normalizedRoll);

  const handleRollChange = (e) => {
    const v = e.target.value.toUpperCase().replace(/\s+/g, "");
    setRollNumber(v);
    setRollTouchError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!rollValid) {
      setRollTouchError("Roll number must be 6-14 letters/digits (e.g. 21A91A0501).");
      return;
    }
    if (!branch) {
      setError("Please select your branch.");
      return;
    }
    if (!classGroup) {
      setError("Please select your class group.");
      return;
    }

    setSubmitting(true);
    try {
      await saveOnboardingProfile(user.uid, {
        rollNumber: rollLocked ? lockedRoll : normalizedRoll,
        branch,
        classGroup,
      });
      await refreshProfile?.();
      router.push("/prep");
    } catch (err) {
      setError(err?.message || "Failed to save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyOnboarded) {
    return (
      <PrepShell kicker="// /prep/onboarding — profile_setup.sh" title="ALL" accent="SET">
        <TerminalCard filename="redirecting.sh">
          <p className="font-mono text-sm text-white/50">Profile already complete — taking you to the hub…</p>
        </TerminalCard>
      </PrepShell>
    );
  }

  return (
    <PrepShell
      kicker="// /prep/onboarding — profile_setup.sh"
      title="COMPLETE"
      accent="YOUR PROFILE"
      subtitle="One-time setup. Your roll number becomes your test identity — it's used on every submission, dashboard row, and export."
      maxWidth="max-w-2xl"
    >
      <TerminalCard filename="onboarding-form.sh" icon={GraduationCap} delay={0.1}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Roll number */}
          <div>
            <label htmlFor="rollNumber" className="flex items-center gap-2 font-mono text-xs text-white/50 mb-2 tracking-wider">
              ROLL_NUMBER
              {rollLocked && <Lock size={11} className="text-white/30" />}
            </label>
            {rollLocked ? (
              <div className="flex items-center gap-2 font-mono text-sm px-3 py-2.5 border border-white/10 rounded bg-white/[0.02] text-white/70">
                <Lock size={13} className="text-white/25 flex-shrink-0" />
                {lockedRoll}
                <span className="ml-auto text-[10px] text-white/25">LOCKED — contact staff to correct</span>
              </div>
            ) : (
              <>
                <input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={handleRollChange}
                  placeholder="e.g. 21A91A0501"
                  maxLength={14}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full font-mono text-sm px-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white placeholder:text-white/20 focus:border-neon-cyan/50 transition-colors uppercase"
                  aria-invalid={!!rollTouchError}
                  aria-describedby="rollNumber-hint"
                />
                <p id="rollNumber-hint" className="font-mono text-[10px] text-white/25 mt-1.5">
                  6-14 letters/digits, no spaces. This cannot be changed once saved.
                </p>
                {rollTouchError && (
                  <p className="font-mono text-[11px] text-[#FF3B3B] mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={11} /> {rollTouchError}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Branch */}
          <div>
            <label htmlFor="branch" className="block font-mono text-xs text-white/50 mb-2 tracking-wider">
              BRANCH
            </label>
            <select
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full font-mono text-sm px-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white focus:border-neon-cyan/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select branch…
              </option>
              {BRANCHES.map((b) => (
                <option key={b} value={b} className="bg-[#0a0a0a]">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Class group */}
          <div>
            <label htmlFor="classGroup" className="block font-mono text-xs text-white/50 mb-2 tracking-wider">
              CLASS_GROUP
            </label>
            <select
              id="classGroup"
              value={classGroup}
              onChange={(e) => setClassGroup(e.target.value)}
              disabled={!groups}
              className="w-full font-mono text-sm px-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white focus:border-neon-cyan/50 transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {groups ? "Select class group…" : "Loading class groups…"}
              </option>
              {visibleGroups.map((g) => (
                <option key={g.id || g.name} value={g.name} className="bg-[#0a0a0a]">
                  {g.name}
                </option>
              ))}
            </select>
            {groupsError && (
              <p className="font-mono text-[10px] text-[#FF9500] mt-1.5">{groupsError}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 font-mono text-xs text-[#FF3B3B] border border-[#FF3B3B]/25 bg-[#FF3B3B]/5 px-3 py-2.5 rounded">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <BracketButton type="submit" variant="green" size="lg" loading={submitting} loadingText="SAVING">
              SAVE_PROFILE
            </BracketButton>
            <p className="font-mono text-[10px] text-white/25 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-neon-green/50" /> Required before exams/contests
            </p>
          </div>
        </form>
      </TerminalCard>
    </PrepShell>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingForm />
    </RequireAuth>
  );
}
