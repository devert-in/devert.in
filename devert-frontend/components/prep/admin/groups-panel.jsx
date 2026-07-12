"use client";

// Admin — class group manager (design §2). CRUD prepClassGroups.

import { useState, useEffect, useCallback } from "react";
import { Layers, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  NeonBadge,
  EmptyState,
  LoadingRows,
  PrepModal,
} from "@/components/prep/ui";
import { getClassGroups, upsertClassGroup, deleteClassGroup } from "@/lib/prep/db";
import { BRANCHES } from "@/lib/prep/constants";

function emptyGroup() {
  return { name: "", branch: BRANCHES[0], active: true };
}

export default function GroupsPanel() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setGroups(await getClassGroups({ activeOnly: false }));
    } catch (e) {
      setError(e?.message || "Failed to load class groups");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({ __isNew: true, ...emptyGroup() });
    setSaveError("");
  };
  const openEdit = (g) => {
    setEditing({ __isNew: false, ...g });
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editing.name.trim()) {
      setSaveError("Name is required");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await upsertClassGroup({
        id: editing.__isNew ? undefined : editing.id,
        name: editing.name.trim(),
        branch: editing.branch,
        active: !!editing.active,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setSaveError(e?.message || "Failed to save class group");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteClassGroup(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete class group");
      setConfirmDelete(null);
    }
  };

  const toggleActive = async (g) => {
    try {
      await upsertClassGroup({ id: g.id, name: g.name, branch: g.branch, active: !g.active });
      await load();
    } catch (e) {
      setError(e?.message || "Failed to update class group");
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="class-groups.sh" icon={Layers} delay={0}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs text-white/35">Used in onboarding, exam targeting, and faculty dashboards.</p>
          <BracketButton variant="green" size="sm" onClick={openNew}>
            <Plus size={11} className="inline mr-1 -mt-0.5" /> NEW_GROUP
          </BracketButton>
        </div>
        {error && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{error}</p>}
        {groups === null ? (
          <LoadingRows rows={4} />
        ) : groups.length === 0 ? (
          <EmptyState title="no class groups yet" message="Add one above, or install the starter pack for the default 7." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "name", dir: "asc" }}
            columns={[
              { key: "name", label: "NAME" },
              { key: "branch", label: "BRANCH", width: "110px" },
              {
                key: "active",
                label: "STATUS",
                width: "100px",
                sortValue: (r) => (r.active !== false ? 1 : 0),
                render: (r) => (
                  <button onClick={() => toggleActive(r)} className="cursor-pointer">
                    {r.active !== false ? <NeonBadge color="#00FF41">ACTIVE</NeonBadge> : <NeonBadge color="#FF9500">INACTIVE</NeonBadge>}
                  </button>
                ),
              },
              {
                key: "actions",
                label: "",
                sortable: false,
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEdit(r)} className="text-white/35 hover:text-neon-cyan transition-colors cursor-pointer" aria-label={`Edit ${r.name}`}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(r)} className="text-white/35 hover:text-[#FF3B3B] transition-colors cursor-pointer" aria-label={`Delete ${r.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={groups}
          />
        )}
      </TerminalCard>

      <PrepModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.__isNew ? "New Class Group" : "Edit Class Group"}
        filename="group-editor.sh"
        maxWidth="max-w-sm"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setEditing(null)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="green" onClick={handleSave} loading={saving} loadingText="SAVING">
              SAVE
            </BracketButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            {saveError && (
              <p className="font-mono text-xs text-[#FF3B3B] flex items-center gap-2">
                <AlertTriangle size={13} /> {saveError}
              </p>
            )}
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">NAME</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="CSE-D"
                disabled={!editing.__isNew}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">BRANCH</label>
              <select
                value={editing.branch}
                onChange={(e) => setEditing({ ...editing, branch: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none cursor-pointer"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 font-mono text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Active
            </label>
          </div>
        )}
      </PrepModal>

      <PrepModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete class group?"
        filename="confirm.sh"
        maxWidth="max-w-sm"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setConfirmDelete(null)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="red" onClick={handleDelete}>
              DELETE
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed">
          This removes <span className="text-white">{confirmDelete?.name}</span> from the picker lists. Students
          already assigned to it keep the value on their profile. This cannot be undone.
        </p>
      </PrepModal>
    </div>
  );
}
