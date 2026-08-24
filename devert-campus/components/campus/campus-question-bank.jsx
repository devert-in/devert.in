"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Copy, Archive, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import Dropdown from "@/components/dropdown";
import {
  blankContestQuestionForm, fetchQuestionBank, saveToQuestionBank, updateBankQuestion, archiveBankQuestion,
} from "@/lib/contests";
import { QuestionEditorForm, questionFormToPayload, questionToForm } from "@/components/campus/campus-contest-studio";

// Standalone bank management, reachable from campus-manage.jsx's Contests tab
// independent of any one contest - lets an admin build up a reusable library
// before ever starting the wizard, and edit/archive what's already there.
// Client-side search/filter only (same convention CampusPracticeList already
// uses) - a single institution's bank is small enough that no new Firestore
// index is needed for this.
export function CampusQuestionBank({ institutionId }) {
  const { user } = useAuth();
  const [bank, setBank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [editing, setEditing] = useState(null); // questionId | "new" | null
  const [qForm, setQForm] = useState(blankContestQuestionForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchQuestionBank(institutionId).then(setBank).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [institutionId]);

  const filtered = useMemo(() => bank.filter(q => {
    if (difficulty !== "all" && q.difficulty !== difficulty) return false;
    if (search.trim()) {
      const n = search.trim().toLowerCase();
      return q.question.toLowerCase().includes(n) || (q.topic || "").toLowerCase().includes(n) || (q.category || "").toLowerCase().includes(n);
    }
    return true;
  }), [bank, search, difficulty]);

  const startNew = () => { setEditing("new"); setQForm(blankContestQuestionForm()); };
  const startEdit = (q) => { setEditing(q.id); setQForm(questionToForm(q)); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = questionFormToPayload(qForm);
      if (editing === "new") {
        await saveToQuestionBank(institutionId, payload, user?.uid);
      } else {
        await updateBankQuestion(institutionId, editing, payload);
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (q) => {
    const { id, createdAt, createdBy, ...rest } = q;
    await saveToQuestionBank(institutionId, { ...rest, question: `${q.question} (copy)` }, user?.uid);
    load();
  };

  const handleArchive = async (questionId) => {
    await archiveBankQuestion(institutionId, questionId);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
          Question Bank {!loading && <span style={{ color: CAMPUS.inkFaint }}>({bank.length})</span>}
        </p>
        <button onClick={startNew} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg"
          style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          <Plus size={13} /> Add question
        </button>
      </div>

      {editing && (
        <CampusCard className="p-4">
          <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>
            {editing === "new" ? "New bank question" : "Edit bank question"}
          </p>
          <QuestionEditorForm qForm={qForm} setQForm={setQForm} onSave={handleSave} saving={saving}
            submitLabel={editing === "new" ? "Save to bank" : "Save changes"} />
          <button onClick={() => setEditing(null)} className="mt-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
        </CampusCard>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by question, topic, category..."
            className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        </div>
        <Dropdown value={difficulty} onChange={setDifficulty} options={["all", "easy", "medium", "hard"]}
          className="w-32" buttonClassName="text-[12.5px] px-3 py-2 rounded-lg bg-[var(--campus-paper)] border border-[var(--campus-line)] text-[var(--campus-ink)]" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <CampusCard key={i} className="p-4">
              <CampusSkeleton variant="text" width={`${65 - i * 8}%`} className="mb-2" />
              <CampusSkeleton variant="text" width="30%" />
            </CampusCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <CampusEmptyState icon={BookOpen} title={bank.length === 0 ? "Question bank is empty" : "No matches"}
          description={bank.length === 0
            ? "Add one, or bulk-upload questions in the Contest Studio - they get saved here automatically."
            : "No questions match your search."} />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {filtered.map((q, i) => (
            <div key={q.id} className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{q.question}</p>
                <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                  {q.type} · {q.difficulty} {q.topic && `· ${q.topic}`} · {q.marks}m
                </span>
              </div>
              {q.category && <CampusChip color={CAMPUS.blue}>{q.category}</CampusChip>}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(q)} title="Edit" style={{ color: CAMPUS.inkFaint }}><Pencil size={13} /></button>
                <button onClick={() => handleDuplicate(q)} title="Duplicate" style={{ color: CAMPUS.inkFaint }}><Copy size={13} /></button>
                <button onClick={() => handleArchive(q.id)} title="Archive" style={{ color: CAMPUS.inkFaint }}><Archive size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
