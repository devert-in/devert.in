"use client";

import { useState } from "react";
import { AlertTriangle, BarChart3, Check, Pencil, X as XIcon } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard } from "@/components/campus/campus-ui";
import { CONTEST_CATEGORIES, CONTEST_DIFFICULTIES, updateContest } from "@/lib/contests";

// The Contest info card, made editable in place.
//
// Editing these used to mean either walking the seven-step Studio wizard or a
// window.prompt asking for a raw "YYYY-MM-DDTHH:MM" string. Both are the wrong
// shape for "the contest starts an hour later than I thought" - which, with the
// phase now bounded by contestStart/contestEnd rather than lifecycleState
// alone, is the single most consequential edit an admin makes.
//
// Question count is deliberately read-only: it is a property of the question
// list, and letting it be typed here would just let it disagree with reality.

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

// Local wall-clock, not toISOString() - datetime-local inputs are timezone-naive
// and an ISO string is UTC, so using it here would shift every time by the
// viewer's offset (5h30m of silent drift for this institution).
function toLocalInput(v) {
  const d = toDate(v);
  if (!d || isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const fmt = (v) => {
  const d = toDate(v);
  return d && !isNaN(d.getTime())
    ? d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "TBA";
};

const minutesBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 60000);

export function ContestInfoCard({ contest, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  const open = () => {
    setForm({
      category: contest.category || CONTEST_CATEGORIES[0],
      difficulty: contest.difficulty || "Easy",
      durationMinutes: String(contest.durationMinutes ?? 60),
      registrationEnd: toLocalInput(contest.registrationEnd),
      contestStart: toLocalInput(contest.contestStart),
      contestEnd: toLocalInput(contest.contestEnd),
    });
    setError("");
    setEditing(true);
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Live view of the same clash the saved contest may already have, so the
  // admin sees it while typing rather than after saving.
  const draftStart = form && form.contestStart ? new Date(form.contestStart) : null;
  const draftEnd = form && form.contestEnd ? new Date(form.contestEnd) : null;
  const draftWindow = draftStart && draftEnd && !isNaN(draftStart) && !isNaN(draftEnd)
    ? minutesBetween(draftStart, draftEnd) : null;
  const draftDuration = form ? parseInt(form.durationMinutes, 10) : null;

  const save = async () => {
    const start = new Date(form.contestStart);
    const end = new Date(form.contestEnd);
    const duration = parseInt(form.durationMinutes, 10);

    if (!form.contestStart || isNaN(start.getTime())) { setError("A start time is required."); return; }
    if (!form.contestEnd || isNaN(end.getTime())) { setError("An end time is required."); return; }
    if (end <= start) { setError("The contest must end after it starts."); return; }
    if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
      setError("Duration must be between 1 and 600 minutes."); return;
    }

    const patch = {
      category: form.category,
      difficulty: form.difficulty,
      durationMinutes: duration,
      contestStart: start,
      contestEnd: end,
      // Blank clears it; createContest already treats a missing registrationEnd
      // as "closes when the contest starts", so null is the honest value.
      registrationEnd: form.registrationEnd ? new Date(form.registrationEnd) : null,
    };
    if (patch.registrationEnd && isNaN(patch.registrationEnd.getTime())) {
      setError("That registration end date isn't valid."); return;
    }

    setSaving(true); setError("");
    try {
      await updateContest(contest.id, patch);
      setEditing(false);
      await onSaved?.();
    } catch (e) {
      setError(e?.message || "Couldn't save those changes.");
    } finally {
      setSaving(false);
    }
  };

  // Saved-state clash, shown in read mode.
  const savedStart = toDate(contest.contestStart);
  const savedEnd = toDate(contest.contestEnd);
  const savedWindow = savedStart && savedEnd ? minutesBetween(savedStart, savedEnd) : null;
  const savedClash = savedWindow != null && contest.durationMinutes > savedWindow;

  const label = { fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", color: CAMPUS.inkFaint };
  const field = {
    background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink,
    borderRadius: 8, padding: "7px 9px", fontSize: "12.5px", width: "100%", outline: "none",
  };

  return (
    <CampusCard className="p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[12.5px] font-semibold flex items-center gap-1.5 flex-1" style={{ color: CAMPUS.ink }}>
          <BarChart3 size={13} /> Contest info
        </p>
        {editing ? (
          <>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: CAMPUS.good, color: "#fff" }}>
              <Check size={12} /> {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setError(""); }} disabled={saving}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
              style={{ color: CAMPUS.inkFaint }}>
              <XIcon size={12} /> Cancel
            </button>
          </>
        ) : (
          <button onClick={open}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      {error && (
        <p className="text-[12px] mb-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>
      )}

      {!editing ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11.5px]" style={{ color: CAMPUS.inkSoft }}>
            <span>Category: {contest.category}</span>
            <span>Difficulty: {contest.difficulty}</span>
            <span>Questions: {contest.questionCount || 0}</span>
            <span>Duration: {contest.durationMinutes} min</span>
            <span>Reg. ends: {fmt(contest.registrationEnd)}</span>
            <span>Starts: {fmt(contest.contestStart)}</span>
            <span>Ends: {fmt(contest.contestEnd)}</span>
          </div>
          {savedClash && (
            <ClashWarning duration={contest.durationMinutes} windowMin={savedWindow} />
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label style={label} htmlFor="ci-cat">Category</label>
            <select id="ci-cat" value={form.category} onChange={set("category")} style={field} className="mt-1">
              {CONTEST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label} htmlFor="ci-diff">Difficulty</label>
            <select id="ci-diff" value={form.difficulty} onChange={set("difficulty")} style={field} className="mt-1">
              {CONTEST_DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={label} htmlFor="ci-dur">Duration (minutes)</label>
            <input id="ci-dur" type="number" min="1" max="600" value={form.durationMinutes}
              onChange={set("durationMinutes")} style={field} className="mt-1" />
          </div>
          <div>
            <label style={label} htmlFor="ci-reg">Registration ends</label>
            <input id="ci-reg" type="datetime-local" value={form.registrationEnd}
              onChange={set("registrationEnd")} style={field} className="mt-1" />
          </div>
          <div>
            <label style={label} htmlFor="ci-start">Contest starts</label>
            <input id="ci-start" type="datetime-local" value={form.contestStart}
              onChange={set("contestStart")} style={field} className="mt-1" />
          </div>
          <div>
            <label style={label} htmlFor="ci-end">Contest ends</label>
            <input id="ci-end" type="datetime-local" value={form.contestEnd}
              onChange={set("contestEnd")} style={field} className="mt-1" />
          </div>

          <div className="sm:col-span-3 space-y-2">
            <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>
              Questions: {contest.questionCount || 0} - set by the question list, not editable here.
              Times are in your own timezone.
            </p>
            {draftWindow != null && draftWindow > 0 && Number.isFinite(draftDuration) && draftDuration > draftWindow && (
              <ClashWarning duration={draftDuration} windowMin={draftWindow} />
            )}
            {draftStart && form.registrationEnd && new Date(form.registrationEnd) > draftStart && (
              <p className="text-[11.5px] flex items-start gap-1.5" style={{ color: CAMPUS.warn }}>
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                Registration closes after the contest starts, so students can still join once it is under way.
                Allowed, but usually not intended.
              </p>
            )}
          </div>
        </div>
      )}
    </CampusCard>
  );
}

// The attempt timer uses min(contestEnd, startedAt + durationMinutes), so the
// SHORTER of the two always wins. A duration longer than the window is not an
// error, it just silently never applies - and an admin reading "Duration: 60
// min" reasonably expects students to get 60 minutes.
function ClashWarning({ duration, windowMin }) {
  return (
    <p className="text-[11.5px] flex items-start gap-1.5 mt-2" style={{ color: CAMPUS.warn }}>
      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
      Duration is {duration} min but the window is only {windowMin} min. Students get the shorter of the two,
      so nobody will have more than {windowMin} min - and anyone starting late gets less.
    </p>
  );
}
