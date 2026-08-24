"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, RotateCcw, Copy, Settings2 } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  fetchClassrooms, fetchClassroomsByDepartment, YEARS, isModuleEnabledForClassroom,
  setClassroomModuleAccess, resetClassroomModuleAccess, copyClassroomModuleAccess, bulkSetModuleAccess,
} from "@/lib/institutions";
import { CampusCard, CampusButton, CampusEmptyState, CampusSkeleton } from "@/components/campus/campus-ui";

function classroomLabel(c) {
  return `${(c.year || "?").replace(" Year", "")} ${c.department} - ${c.section}`;
}

// One place both components below resolve "which classrooms am I allowed to
// see" - an unscoped list is denied all-or-nothing for a department-scoped
// caller (firestore.rules matches each classroom's own department against
// theirs), which surfaced as "No classrooms yet" rather than an error.
function loadScopedClassrooms(institutionId, scopeDepartment) {
  return scopeDepartment
    ? fetchClassroomsByDepartment(institutionId, scopeDepartment)
    : fetchClassrooms(institutionId);
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 38, height: 21, padding: 0, border: "none", cursor: "pointer", background: value ? CAMPUS.teal : CAMPUS.line }}>
      <span className="absolute rounded-full bg-white transition-transform" style={{ width: 17, height: 17, top: 2, left: 2, transform: value ? "translateX(17px)" : "translateX(0)", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

// A compact, click-to-expand header used from every module's own Manage tab
// (Daily Learning, Programming, CS Core, DSA, Company Vault, Contests) -
// "Available to: X/Y classrooms", expanding into the full per-classroom
// manager below. One shared component instead of six bespoke ones, per
// "every module should have a consistent access management experience".
// scopeDepartment (set for an HOD, null for an Institution Admin/Principal)
// narrows every read AND write below to that one department - see
// loadScopedClassrooms.
export function ModuleAccessSummary({ institutionId, moduleKey, moduleLabel, scopeDepartment = null }) {
  const [open, setOpen] = useState(false);
  const [classrooms, setClassrooms] = useState(null);

  useEffect(() => {
    loadScopedClassrooms(institutionId, scopeDepartment).then(setClassrooms).catch(() => setClassrooms([]));
  }, [institutionId, scopeDepartment]);

  const enabledCount = classrooms?.filter(c => isModuleEnabledForClassroom(c, moduleKey)).length ?? 0;
  const total = classrooms?.length ?? 0;

  return (
    <CampusCard className="p-4 mb-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Settings2 size={15} style={{ color: CAMPUS.teal }} />
          <div className="text-left">
            <p className="text-[13.5px] font-semibold" style={{ color: CAMPUS.ink }}>Manage Access</p>
            <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>
              {classrooms === null ? "Loading..." : total === 0 ? "No classrooms yet" : `Available to ${enabledCount}/${total} classrooms`}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>{open ? "Hide" : "Configure"}</span>
      </button>
      {open && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <ClassroomAccessManager institutionId={institutionId} moduleKey={moduleKey} moduleLabel={moduleLabel}
            scopeDepartment={scopeDepartment} />
        </div>
      )}
    </CampusCard>
  );
}

// The actual per-classroom, per-module access list - every classroom as a
// row (Year Department - Section, sorted by Year then Department then
// Section so it stays organized even with hundreds of rows), an inline
// enable/disable toggle, and a three-dot menu for the two access-specific
// actions that go beyond a plain flip: reset this classroom's override back
// to the default (enabled), and copy this module's setting from another
// classroom. Deliberately does NOT duplicate View Students/Analytics/
// Leaderboards here - those already exist one click away under Students ->
// Classrooms, and re-navigating there from a menu item would just be a
// second path to the same screen.
export function ClassroomAccessManager({ institutionId, moduleKey, moduleLabel, scopeDepartment = null }) {
  const [classrooms, setClassrooms] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [copySource, setCopySource] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    loadScopedClassrooms(institutionId, scopeDepartment).then(setClassrooms).catch(() => setClassrooms([]));
  };
  useEffect(load, [institutionId, scopeDepartment]);

  const sorted = useMemo(() => {
    if (!classrooms) return [];
    return [...classrooms].sort((a, b) =>
      YEARS.indexOf(a.year) - YEARS.indexOf(b.year)
      || (a.department || "").localeCompare(b.department || "")
      || (a.section || "").localeCompare(b.section || ""));
  }, [classrooms]);

  const toggle = async (classroomId, next) => {
    setClassrooms(cs => cs.map(c => c.id === classroomId ? { ...c, moduleAccess: { ...c.moduleAccess, [moduleKey]: next } } : c));
    await setClassroomModuleAccess(institutionId, classroomId, moduleKey, next);
  };

  const bulkSet = async (enabled) => {
    setBusy(true);
    setClassrooms(cs => cs.map(c => ({ ...c, moduleAccess: { ...c.moduleAccess, [moduleKey]: enabled } })));
    try { await bulkSetModuleAccess(institutionId, moduleKey, enabled, scopeDepartment); } finally { setBusy(false); }
  };

  const handleReset = async (classroomId) => {
    await resetClassroomModuleAccess(institutionId, classroomId, moduleKey);
    setMenuFor(null);
    load();
  };

  const handleCopy = async (targetClassroomId) => {
    if (!copySource) return;
    await copyClassroomModuleAccess(institutionId, copySource, targetClassroomId, moduleKey);
    setMenuFor(null);
    setCopySource("");
    load();
  };

  if (classrooms === null) return <CampusCard className="p-4"><CampusSkeleton variant="rect" height={140} /></CampusCard>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{moduleLabel?.toUpperCase()} ACCESS BY CLASSROOM</p>
        <div className="flex gap-2">
          <CampusButton variant="secondary" size="sm" disabled={busy || sorted.length === 0} onClick={() => bulkSet(true)}>Enable All</CampusButton>
          <CampusButton variant="secondary" size="sm" disabled={busy || sorted.length === 0} onClick={() => bulkSet(false)}>Disable All</CampusButton>
        </div>
      </div>

      {sorted.length === 0 ? (
        <CampusEmptyState size="sm" title="No classrooms yet"
          description="Classrooms appear automatically once students are approved with a Department, Year, and Section." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {sorted.map((c, i) => {
            const enabled = isModuleEnabledForClassroom(c, moduleKey);
            return (
              <div key={c.id} style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 text-[13px] font-medium" style={{ color: CAMPUS.ink }}>{classroomLabel(c)}</span>
                  <span className="text-[10.5px] font-mono" style={{ color: enabled ? CAMPUS.good : CAMPUS.inkFaint }}>
                    {enabled ? "ENABLED" : "DISABLED"}
                  </span>
                  <ToggleSwitch value={enabled} onChange={(v) => toggle(c.id, v)} />
                  <button onClick={() => setMenuFor(menuFor === c.id ? null : c.id)} style={{ color: CAMPUS.inkFaint }}>
                    <MoreVertical size={15} />
                  </button>
                </div>
                {menuFor === c.id && (
                  <div className="px-4 pb-3">
                    <div className="rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
                      <button onClick={() => handleReset(c.id)}
                        className="w-full text-left text-[12px] font-semibold px-3 py-2 flex items-center gap-2" style={{ color: CAMPUS.ink }}>
                        <RotateCcw size={12} /> Reset to default (enabled)
                      </button>
                      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                        <Copy size={12} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
                        <select value={copySource} onChange={e => setCopySource(e.target.value)}
                          className="flex-1 text-[11.5px] px-2 py-1 rounded outline-none min-w-0"
                          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                          <option value="">Copy access from...</option>
                          {sorted.filter(o => o.id !== c.id).map(o => <option key={o.id} value={o.id}>{classroomLabel(o)}</option>)}
                        </select>
                        <button onClick={() => handleCopy(c.id)} disabled={!copySource}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded disabled:opacity-40 flex-shrink-0" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
