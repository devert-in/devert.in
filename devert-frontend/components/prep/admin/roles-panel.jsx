"use client";

// Admin — role manager (design §2 + §3). Email lookup → set role with
// confirmation; staff correction of a student's roll number/branch/class
// group; list of current staff.

import { useState, useEffect, useCallback } from "react";
import { Search, ShieldCheck, AlertTriangle, UserCog } from "lucide-react";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  NeonBadge,
  EmptyState,
  LoadingRows,
  PrepModal,
} from "@/components/prep/ui";
import { findUserByEmail, setRoleByEmail, staffUpdateUser, getStudents } from "@/lib/prep/db";
import { ROLES, ROLE_MAP, BRANCHES } from "@/lib/prep/constants";

export default function RolesPanel() {
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [found, setFound] = useState(null);
  const [pendingRole, setPendingRole] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");

  const [rollDraft, setRollDraft] = useState("");
  const [branchDraft, setBranchDraft] = useState("");
  const [classGroupDraft, setClassGroupDraft] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [correctMsg, setCorrectMsg] = useState("");

  const [staff, setStaff] = useState(null);
  const [staffError, setStaffError] = useState("");

  const loadStaff = useCallback(async () => {
    setStaffError("");
    try {
      const rows = await getStudents({ role: null, max: 1000 });
      setStaff(rows.filter((r) => r.role && r.role !== "student"));
    } catch (e) {
      setStaffError(e?.message || "Failed to load staff list");
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLooking(true);
    setLookupError("");
    setFound(null);
    setApplyMsg("");
    setCorrectMsg("");
    try {
      const user = await findUserByEmail(email.trim());
      if (!user) {
        setLookupError("No user found with that email — they must sign in at least once first.");
        return;
      }
      setFound(user);
      setPendingRole(user.role || "student");
      setRollDraft(user.rollNumber || "");
      setBranchDraft(user.branch || "");
      setClassGroupDraft(user.classGroup || "");
    } catch (e2) {
      setLookupError(e2?.message || "Lookup failed");
    } finally {
      setLooking(false);
    }
  };

  const handleApplyRole = async () => {
    if (!found) return;
    setApplying(true);
    setApplyMsg("");
    try {
      const updated = await setRoleByEmail(found.email, pendingRole);
      setFound(updated);
      setConfirming(false);
      setApplyMsg(`✓ Role updated to "${pendingRole}".`);
      await loadStaff();
    } catch (e) {
      setApplyMsg(e?.message || "Failed to update role");
    } finally {
      setApplying(false);
    }
  };

  const handleCorrectProfile = async () => {
    if (!found) return;
    setCorrecting(true);
    setCorrectMsg("");
    try {
      const patch = {
        rollNumber: rollDraft.trim().toUpperCase() || null,
        branch: branchDraft || null,
        classGroup: classGroupDraft || null,
      };
      await staffUpdateUser(found.id, patch);
      setFound({ ...found, ...patch });
      setCorrectMsg("✓ Profile corrected.");
    } catch (e) {
      setCorrectMsg(e?.message || "Failed to correct profile");
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="role-lookup.sh" icon={Search} delay={0}>
        <form onSubmit={handleLookup} className="flex items-center gap-2 mb-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@college.edu"
            type="email"
            className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
          />
          <BracketButton type="submit" variant="cyan" size="sm" loading={looking} loadingText="LOOKING">
            LOOKUP
          </BracketButton>
        </form>

        {lookupError && (
          <p className="font-mono text-xs text-[#FF3B3B] flex items-center gap-2 mb-4">
            <AlertTriangle size={13} /> {lookupError}
          </p>
        )}

        {found && (
          <div className="border border-white/10 rounded-lg p-4 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-sans text-sm font-semibold text-white">{found.displayName || "(no name)"}</span>
              <span className="font-mono text-[11px] text-white/35">{found.email}</span>
              {ROLE_MAP[found.role] && <NeonBadge color={ROLE_MAP[found.role].color}>{ROLE_MAP[found.role].label.toUpperCase()}</NeonBadge>}
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1.5">SET ROLE</label>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={pendingRole}
                  onChange={(e) => setPendingRole(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <BracketButton
                  size="sm"
                  variant="gold"
                  onClick={() => setConfirming(true)}
                  disabled={pendingRole === found.role}
                >
                  APPLY_ROLE
                </BracketButton>
              </div>
              {applyMsg && <p className="font-mono text-[11px] text-neon-green mt-2">{applyMsg}</p>}
            </div>

            <div className="border-t border-white/8 pt-4">
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-2 flex items-center gap-1.5">
                <UserCog size={11} /> STAFF CORRECTION (roll number is otherwise immutable)
              </label>
              <div className="grid sm:grid-cols-3 gap-2 mb-2">
                <input
                  value={rollDraft}
                  onChange={(e) => setRollDraft(e.target.value.toUpperCase())}
                  placeholder="roll number"
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
                />
                <select
                  value={branchDraft}
                  onChange={(e) => setBranchDraft(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2 py-2 font-mono text-xs text-white outline-none cursor-pointer"
                >
                  <option value="">no branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  value={classGroupDraft}
                  onChange={(e) => setClassGroupDraft(e.target.value)}
                  placeholder="class group e.g. CSE-A"
                  className="bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
                />
              </div>
              <BracketButton size="sm" variant="cyan" onClick={handleCorrectProfile} loading={correcting} loadingText="SAVING">
                SAVE_CORRECTION
              </BracketButton>
              {correctMsg && <p className="font-mono text-[11px] text-neon-green mt-2">{correctMsg}</p>}
            </div>
          </div>
        )}
      </TerminalCard>

      <TerminalCard filename="staff.log" icon={ShieldCheck} delay={0.1}>
        <p className="font-mono text-xs text-white/35 mb-4">Everyone with a non-student role.</p>
        {staffError && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{staffError}</p>}
        {staff === null ? (
          <LoadingRows rows={4} />
        ) : staff.length === 0 ? (
          <EmptyState title="no staff yet" message="Look up a user above and assign faculty/tpo/admin." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "role", dir: "asc" }}
            columns={[
              { key: "displayName", label: "NAME", render: (r) => r.displayName || "(no name)" },
              { key: "email", label: "EMAIL" },
              {
                key: "role",
                label: "ROLE",
                width: "100px",
                render: (r) => (ROLE_MAP[r.role] ? <NeonBadge color={ROLE_MAP[r.role].color}>{ROLE_MAP[r.role].label.toUpperCase()}</NeonBadge> : r.role),
              },
            ]}
            rows={staff}
          />
        )}
      </TerminalCard>

      <PrepModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirm role change"
        filename="confirm.sh"
        maxWidth="max-w-sm"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setConfirming(false)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="gold" onClick={handleApplyRole} loading={applying} loadingText="APPLYING">
              CONFIRM
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed">
          Change <span className="text-white">{found?.email}</span> from{" "}
          <span className="text-white">{ROLE_MAP[found?.role]?.label || found?.role}</span> to{" "}
          <span className="text-white">{ROLE_MAP[pendingRole]?.label || pendingRole}</span>?
        </p>
      </PrepModal>
    </div>
  );
}
