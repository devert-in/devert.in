"use client";

// Admin - announcements editor (design §2). CRUD prepAnnouncements, shown as
// a ticker on /prep.

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, Trash2, Pencil, AlertTriangle, Link2 } from "lucide-react";
import {
  TerminalCard,
  BracketButton,
  DataTable,
  EmptyState,
  LoadingRows,
  PrepModal,
} from "@/components/prep/ui";
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, dateKey } from "@/lib/prep/db";

function emptyAnnouncement() {
  return { text: "", date: dateKey(), link: "" };
}

export default function AnnouncePanel() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await getAnnouncements({ max: 100 }));
    } catch (e) {
      setError(e?.message || "Failed to load announcements");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({ __isNew: true, ...emptyAnnouncement() });
    setSaveError("");
  };
  const openEdit = (a) => {
    setEditing({ __isNew: false, ...a });
    setSaveError("");
  };

  const handleSave = async () => {
    if (!editing.text.trim()) {
      setSaveError("Text is required");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (editing.__isNew) {
        await addAnnouncement({ text: editing.text.trim(), date: editing.date, link: editing.link?.trim() || null });
      } else {
        await updateAnnouncement(editing.id, {
          text: editing.text.trim(),
          date: editing.date,
          link: editing.link?.trim() || null,
        });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setSaveError(e?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAnnouncement(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete announcement");
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="announcements.sh" icon={Megaphone} delay={0}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs text-white/35">Shown as a ticker on the /prep hub.</p>
          <BracketButton variant="green" size="sm" onClick={openNew}>
            <Plus size={11} className="inline mr-1 -mt-0.5" /> NEW_ANNOUNCEMENT
          </BracketButton>
        </div>
        {error && <p className="font-mono text-xs text-[#FF3B3B] mb-4">{error}</p>}
        {rows === null ? (
          <LoadingRows rows={3} />
        ) : rows.length === 0 ? (
          <EmptyState title="no announcements yet" message="Post the first one above." />
        ) : (
          <DataTable
            rowKey="id"
            initialSort={{ key: "date", dir: "desc" }}
            columns={[
              { key: "date", label: "DATE", width: "110px" },
              { key: "text", label: "TEXT" },
              {
                key: "link",
                label: "LINK",
                sortable: false,
                render: (r) =>
                  r.link ? (
                    <a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neon-cyan hover:text-white transition-colors">
                      <Link2 size={11} /> open
                    </a>
                  ) : (
                    <span className="text-white/20">-</span>
                  ),
              },
              {
                key: "actions",
                label: "",
                sortable: false,
                align: "right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEdit(r)} className="text-white/35 hover:text-neon-cyan transition-colors cursor-pointer" aria-label="Edit announcement">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(r)} className="text-white/35 hover:text-[#FF3B3B] transition-colors cursor-pointer" aria-label="Delete announcement">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={rows}
          />
        )}
      </TerminalCard>

      <PrepModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.__isNew ? "New Announcement" : "Edit Announcement"}
        filename="announcement-editor.sh"
        maxWidth="max-w-md"
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
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">TEXT</label>
              <textarea
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 resize-y"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">DATE</label>
              <input
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                placeholder="yyyy-mm-dd"
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wider text-white/35 mb-1">LINK (optional)</label>
              <input
                value={editing.link || ""}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                placeholder="/prep/exams"
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon-cyan/50 placeholder:text-white/20"
              />
            </div>
          </div>
        )}
      </PrepModal>

      <PrepModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete announcement?"
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
        <p className="font-mono text-xs text-white/50 leading-relaxed">This cannot be undone.</p>
      </PrepModal>
    </div>
  );
}
