"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShieldCheck, KeyRound, Ban, CheckCircle2, RotateCcw, History, X,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusButton, CampusChip, CampusEmptyState, CampusSkeleton, CampusTable } from "@/components/campus/campus-ui";
import { DEPARTMENTS, fetchRoleAssignments, fetchClassrooms, fetchAdminActivityLog } from "@/lib/institutions";
import { ROLE_CATALOG, PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";
import {
  createStaffAccount, setStaffAccountStatus, resetStaffAccountPassword,
  resendStaffAccountSetup, updateStaffAccountPermissions,
} from "@/lib/staffAccounts";

// The central place Institution Admins create/manage Principal/HOD/Faculty-
// Class-Teacher accounts. Every mutating action here goes through
// devert-backend's AdminAccountController (lib/staffAccounts.js) - nothing
// in this file ever writes to institutions/{id}/roleAssignments directly
// (firestore.rules makes that isAdmin()-only, i.e. no client write path
// exists at all - see that collection's own rule comment).
export const MANAGE_ADMINS_TABS = [
  { key: "principal", label: "Principal" },
  { key: "hod", label: "Heads of Department" },
  // ONE tab, not two - Faculty and Class Teacher are the same role
  // (facultyClassTeacher). A row's assigned classroom (shown inline) IS its
  // class-teacher designation; there's no second criterion to split a
  // "Class Teachers" tab on.
  { key: "facultyClassTeacher", label: "Faculty & Class Teachers" },
  { key: "permissions", label: "Permissions" },
  { key: "accessLogs", label: "Access Logs" },
  { key: "security", label: "Security" },
];

export function CampusManageAdmins({ institutionId }) {
  const [tab, setTab] = useState("principal");
  const [roleAssignments, setRoleAssignments] = useState(null); // null = loading
  const [classrooms, setClassrooms] = useState([]);
  const [createModalRole, setCreateModalRole] = useState(null);

  const reload = () => {
    fetchRoleAssignments(institutionId).then(setRoleAssignments).catch(() => setRoleAssignments([]));
  };
  useEffect(() => {
    reload();
    fetchClassrooms(institutionId).then(setClassrooms).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  return (
    <div>
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {MANAGE_ADMINS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="campus-btn text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-150"
            style={{
              background: tab === t.key ? CAMPUS.gradientPrimary : "transparent",
              color: tab === t.key ? "#fff" : CAMPUS.inkSoft,
              boxShadow: tab === t.key ? `0 3px 10px ${tint(CAMPUS.teal, 28)}` : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {roleAssignments === null ? (
        <div className="space-y-2"><CampusSkeleton className="h-14" /><CampusSkeleton className="h-14" /></div>
      ) : (tab === "principal" || tab === "hod" || tab === "facultyClassTeacher") ? (
        <StaffRoleSection roleKey={tab} roleAssignments={roleAssignments} classrooms={classrooms}
          institutionId={institutionId} onChanged={reload} onAdd={() => setCreateModalRole(tab)} />
      ) : tab === "permissions" ? (
        <PermissionsPanel roleAssignments={roleAssignments} institutionId={institutionId} onChanged={reload} />
      ) : tab === "accessLogs" ? (
        <AccessLogsPanel institutionId={institutionId} />
      ) : (
        <SecurityPanel roleAssignments={roleAssignments} institutionId={institutionId} onChanged={reload} />
      )}

      {createModalRole && (
        <CreateStaffAccountModal institutionId={institutionId} roleKey={createModalRole} classrooms={classrooms}
          onClose={() => setCreateModalRole(null)}
          onCreated={() => { setCreateModalRole(null); reload(); }} />
      )}
    </div>
  );
}

function classroomLabel(c) {
  return c ? `${c.year} - ${c.department} - ${c.section}` : "-";
}

function StaffRoleSection({ roleKey, roleAssignments, classrooms, institutionId, onChanged, onAdd }) {
  const rows = useMemo(() => roleAssignments.filter(r => r.roleKey === roleKey), [roleAssignments, roleKey]);
  const classroomById = useMemo(() => new Map(classrooms.map(c => [c.id, c])), [classrooms]);
  const roleLabel = ROLE_CATALOG[roleKey]?.label || roleKey;
  // Only one active Principal per institution (per spec) - same one-active-
  // per-scope rule the backend already enforces for HOD/department and
  // Faculty/classroom; this just hides the "+ Add" button once satisfied
  // rather than letting the click round-trip to a guaranteed backend error.
  const activeCount = rows.filter(r => r.status === "active").length;
  const canAddMore = roleKey !== "principal" || activeCount === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{rows.length} account{rows.length === 1 ? "" : "s"}</p>
        {canAddMore && (
          <CampusButton icon={Plus} size="sm" onClick={onAdd}>Add {roleLabel}</CampusButton>
        )}
      </div>
      <CampusTable
        rows={rows}
        emptyState={<CampusEmptyState icon={ShieldCheck} title={`No ${roleLabel} accounts yet`}
          description={`Create the first ${roleLabel.toLowerCase()} account for ${roleKey === "principal" ? "this institution" : "this scope"}.`} />}
        columns={[
          { key: "displayName", label: "Name", sortable: true },
          { key: "email", label: "Email" },
          ...(roleKey === "hod" ? [{ key: "scope", label: "Department", render: r => r.scope?.department || "-" }] : []),
          ...(roleKey === "facultyClassTeacher" ? [{ key: "scope", label: "Classroom", render: r => classroomLabel(classroomById.get(r.scope?.classroomId)) }] : []),
          { key: "status", label: "Status", render: r => (
            <CampusChip color={r.status === "active" ? CAMPUS.good : CAMPUS.bad}>{r.status?.toUpperCase()}</CampusChip>
          ) },
          { key: "actions", label: "", render: r => (
            <StaffRowActions institutionId={institutionId} account={r} onChanged={onChanged} />
          ) },
        ]}
      />
    </div>
  );
}

function StaffRowActions({ institutionId, account, onChanged }) {
  const [busy, setBusy] = useState(false);

  const run = async (fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try { await fn(); onChanged(); } catch (e) { alert(e.message || "Action failed."); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1.5">
      {account.status === "active" ? (
        <button disabled={busy} title="Disable account"
          onClick={() => run(() => setStaffAccountStatus({ institutionId, uid: account.id, status: "disabled" }),
            `Disable ${account.displayName}'s access? They'll be signed out immediately.`)}
          className="p-1.5 rounded-lg" style={{ color: CAMPUS.bad }}>
          <Ban size={14} />
        </button>
      ) : (
        <button disabled={busy} title="Re-enable account"
          onClick={() => run(() => setStaffAccountStatus({ institutionId, uid: account.id, status: "active" }))}
          className="p-1.5 rounded-lg" style={{ color: CAMPUS.good }}>
          <CheckCircle2 size={14} />
        </button>
      )}
      <button disabled={busy} title="Reset password"
        onClick={() => run(() => resetStaffAccountPassword({ institutionId, uid: account.id }),
          `Send a password reset email to ${account.email}?`)}
        className="p-1.5 rounded-lg" style={{ color: CAMPUS.blue }}>
        <KeyRound size={14} />
      </button>
      <button disabled={busy} title="Resend setup email"
        onClick={() => run(() => resendStaffAccountSetup({ institutionId, uid: account.id }))}
        className="p-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

function CreateStaffAccountModal({ institutionId, roleKey, classrooms, onClose, onCreated }) {
  const roleLabel = ROLE_CATALOG[roleKey]?.label || roleKey;
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !displayName.trim()) { setError("Name and email are required."); return; }
    if (roleKey === "facultyClassTeacher" && !classroomId) { setError("Select a classroom."); return; }
    setSubmitting(true);
    try {
      const res = await createStaffAccount({
        institutionId, roleKey, email: email.trim(), displayName: displayName.trim(),
        department: roleKey === "hod" ? department : undefined,
        classroomId: roleKey === "facultyClassTeacher" ? classroomId : undefined,
      });
      setResult(res);
    } catch (e2) {
      setError(e2.message || "Could not create this account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[70]" style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }} />
      <div role="dialog" aria-modal="true" className="fixed z-[71] left-1/2 top-1/2 w-[92vw] max-w-[440px] p-6"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg, transform: "translate(-50%,-50%)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Add {roleLabel}</h3>
          <button onClick={onClose} style={{ color: CAMPUS.inkFaint }}><X size={16} /></button>
        </div>

        {result ? (
          <div className="text-center py-4">
            <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: CAMPUS.good }} />
            <p className="text-[13.5px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Account created</p>
            <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkSoft }}>
              {result.emailSent ? `A setup email was sent to ${email}.` : `Account created, but the setup email couldn't be sent - use "Resend setup email" from the list.`}
            </p>
            <CampusButton onClick={onCreated} className="w-full">Done</CampusButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-[11.5px] font-medium mb-1" style={{ color: CAMPUS.inkSoft }}>Full name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 rounded-lg text-[13px] outline-none" style={{ height: 40, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium mb-1" style={{ color: CAMPUS.inkSoft }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 rounded-lg text-[13px] outline-none" style={{ height: 40, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            {roleKey === "hod" && (
              <div>
                <label className="block text-[11.5px] font-medium mb-1" style={{ color: CAMPUS.inkSoft }}>Department</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 rounded-lg text-[13px] outline-none" style={{ height: 40, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            {roleKey === "facultyClassTeacher" && (
              <div>
                <label className="block text-[11.5px] font-medium mb-1" style={{ color: CAMPUS.inkSoft }}>Classroom</label>
                <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full px-3 rounded-lg text-[13px] outline-none" style={{ height: 40, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                  {classrooms.length === 0 && <option value="">No classrooms yet</option>}
                  {classrooms.map(c => <option key={c.id} value={c.id}>{classroomLabel(c)}</option>)}
                </select>
              </div>
            )}
            {error && <p className="text-[12.5px]" style={{ color: CAMPUS.bad }}>{error}</p>}
            <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
              A setup email is sent to let them choose their own password - nobody, including you, ever sees it.
            </p>
            <CampusButton type="submit" disabled={submitting} className="w-full mt-1">
              {submitting ? "Creating..." : "Create account"}
            </CampusButton>
          </form>
        )}
      </div>
    </>
  );
}

// One row per staff account, checkbox grid over the full permission catalog.
// A checked box that ISN'T one of the role's own defaults is an explicit
// grant; an unchecked box that WOULD be a default is an explicit revoke -
// both are just entries in permissionOverrides, resolved against
// system/rolePermissionDefaults everywhere else (rules, useHasPermission).
function PermissionsPanel({ roleAssignments, institutionId, onChanged }) {
  const [editing, setEditing] = useState(null);
  if (roleAssignments.length === 0) {
    return <CampusEmptyState icon={ShieldCheck} title="No staff accounts yet" description="Create a Principal, HOD, or Faculty account first." />;
  }
  return (
    <div>
      <CampusTable rows={roleAssignments}
        columns={[
          { key: "displayName", label: "Name", sortable: true },
          { key: "roleKey", label: "Role", render: r => ROLE_CATALOG[r.roleKey]?.label || r.roleKey },
          { key: "overrides", label: "Overrides", render: r => Object.keys(r.permissionOverrides || {}).length || "-" },
          { key: "actions", label: "", render: r => (
            <button onClick={() => setEditing(r)} className="text-[12px] font-semibold" style={{ color: CAMPUS.teal }}>Edit permissions</button>
          ) },
        ]} />
      {editing && (
        <EditPermissionsModal account={editing} institutionId={institutionId}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
    </div>
  );
}

function EditPermissionsModal({ account, institutionId, onClose, onSaved }) {
  const [overrides, setOverrides] = useState(() => ({ ...(account.permissionOverrides || {}) }));
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setOverrides(prev => {
    const next = { ...prev };
    if (next[key] === true) next[key] = false;
    else if (next[key] === false) delete next[key];
    else next[key] = true;
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStaffAccountPermissions({ institutionId, uid: account.id, permissionOverrides: overrides });
      onSaved();
    } catch (e) {
      alert(e.message || "Could not save permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[70]" style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }} />
      <div role="dialog" aria-modal="true" className="fixed z-[71] left-1/2 top-1/2 w-[92vw] max-w-[480px] max-h-[80vh] overflow-y-auto p-6"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg, transform: "translate(-50%,-50%)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>{account.displayName}&apos;s permissions</h3>
          <button onClick={onClose} style={{ color: CAMPUS.inkFaint }}><X size={16} /></button>
        </div>
        <p className="text-[11.5px] mb-3" style={{ color: CAMPUS.inkFaint }}>
          Unchecked entries follow {ROLE_CATALOG[account.roleKey]?.label || account.roleKey}&apos;s own default. Toggle to override just for this account.
        </p>
        <div className="flex flex-col gap-1 mb-4">
          {PERMISSIONS.map(key => (
            <label key={key} className="flex items-center gap-2.5 py-1.5 text-[13px]" style={{ color: CAMPUS.ink }}>
              <input type="checkbox" checked={overrides[key] === true} onChange={() => toggle(key)} />
              {PERMISSION_LABELS[key] || key}
              {overrides[key] === false && <span className="text-[10.5px]" style={{ color: CAMPUS.bad }}>(revoked)</span>}
            </label>
          ))}
        </div>
        <CampusButton onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save permissions"}</CampusButton>
      </div>
    </>
  );
}

function AccessLogsPanel({ institutionId }) {
  const [logs, setLogs] = useState(null);
  useEffect(() => { fetchAdminActivityLog(institutionId).then(setLogs).catch(() => setLogs([])); }, [institutionId]);
  if (logs === null) return <CampusSkeleton className="h-40" />;
  return (
    <CampusTable rows={logs}
      emptyState={<CampusEmptyState icon={History} title="No activity yet" description="Account creations, status changes, and permission edits will show up here." />}
      columns={[
        { key: "createdAt", label: "When", render: r => r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : "-" },
        { key: "action", label: "Action" },
        { key: "actorUid", label: "By" },
        { key: "targetUid", label: "Target" },
        { key: "details", label: "Details", render: r => r.details || "-" },
      ]} />
  );
}

function SecurityPanel({ roleAssignments, institutionId, onChanged }) {
  if (roleAssignments.length === 0) {
    return <CampusEmptyState icon={ShieldCheck} title="No staff accounts yet" description="Security telemetry (last login, failed attempts) will show up here once accounts exist." />;
  }
  return (
    <CampusTable rows={roleAssignments}
      columns={[
        { key: "displayName", label: "Name", sortable: true },
        { key: "roleKey", label: "Role", render: r => ROLE_CATALOG[r.roleKey]?.label || r.roleKey },
        { key: "lastLoginAt", label: "Last login", sortable: true, render: r => r.lastLoginAt?.toDate ? r.lastLoginAt.toDate().toLocaleString() : "Never" },
        { key: "failedLoginCount", label: "Failed attempts", sortable: true, render: r => r.failedLoginCount || 0 },
        { key: "lockedUntil", label: "Locked?", render: r => (r.lockedUntil?.toDate && r.lockedUntil.toDate() > new Date())
          ? <CampusChip color={CAMPUS.bad}>LOCKED</CampusChip> : "-" },
        { key: "actions", label: "", render: r => <StaffRowActions institutionId={institutionId} account={r} onChanged={onChanged} /> },
      ]} />
  );
}
