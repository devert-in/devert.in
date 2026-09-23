"use client";

import { ClipboardList, Users } from "lucide-react";
import { NeonBadge } from "@/components/prep/ui";

const KIND_LABEL = { "weekend-test": "WEEKEND TEST", "coding-contest": "CODING CONTEST" };

function fmtExamOption(exam) {
  const when = exam.startsAt?.toDate ? exam.startsAt.toDate() : null;
  const dateStr = when
    ? when.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "no date";
  return `${exam.title} - ${dateStr}${exam.published ? "" : " (draft)"}`;
}

/**
 * Exam + class-group selector shared by every faculty tab. `exams` may be
 * empty (Practice Pulse tab needs only a class group, so examId can stay "").
 */
export function ExamGroupSelector({
  exams,
  classGroups,
  examId,
  onExamChange,
  group,
  onGroupChange,
  examOptional = false,
}) {
  return (
    <div className="terminal-window p-4 mb-6 flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[240px]">
        <label htmlFor="faculty-exam" className="flex items-center gap-1.5 font-mono text-[10px] text-white/35 tracking-wider mb-1.5">
          <ClipboardList size={11} /> EXAM {examOptional && <span className="text-white/20">(optional for pulse)</span>}
        </label>
        <select
          id="faculty-exam"
          value={examId}
          onChange={(e) => onExamChange(e.target.value)}
          className="w-full font-mono text-xs px-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white focus:border-neon-cyan/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0a0a0a]">
            {exams.length ? "Select an exam…" : "No exams found"}
          </option>
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id} className="bg-[#0a0a0a]">
              {fmtExamOption(ex)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[200px]">
        <label htmlFor="faculty-group" className="flex items-center gap-1.5 font-mono text-[10px] text-white/35 tracking-wider mb-1.5">
          <Users size={11} /> CLASS GROUP
        </label>
        <select
          id="faculty-group"
          value={group}
          onChange={(e) => onGroupChange(e.target.value)}
          className="w-full font-mono text-xs px-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white focus:border-neon-cyan/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="ALL" className="bg-[#0a0a0a]">
            ALL GROUPS
          </option>
          {classGroups.map((g) => (
            <option key={g.id || g.name} value={g.name} className="bg-[#0a0a0a]">
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {examId && (
        <NeonBadge color="#00FFFF">
          {KIND_LABEL[exams.find((e) => e.id === examId)?.kind] || "EXAM"}
        </NeonBadge>
      )}
    </div>
  );
}
