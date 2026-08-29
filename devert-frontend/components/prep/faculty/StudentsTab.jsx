"use client";

import { useMemo, useState } from "react";
import { Search, Download, CheckCircle2, XCircle, MinusCircle, Clock3 } from "lucide-react";
import { DataTable, EmptyState, BracketButton, Tag } from "@/components/prep/ui";
import { outcomeCounts, downloadCsv, slugify } from "./facultyUtils";

const STATUS_STYLE = {
  submitted: { label: "SUBMITTED", color: "#00FF41" },
  "in-progress": { label: "IN PROGRESS", color: "#FF9500" },
  absent: { label: "ABSENT", color: "#FF3B3B" },
};

function fmtTimestamp(ts) {
  if (!ts || typeof ts.toDate !== "function") return "—";
  return ts.toDate().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Builds one row per student in the roster: matched submission (any status)
 * or a synthetic ABSENT row for students with no submission doc at all.
 */
function buildRows(students, records) {
  const byUid = new Map(records.map((r) => [r.uid, r]));
  const rows = students.map((s) => {
    const record = byUid.get(s.id) || null;
    return {
      uid: s.id,
      rollNumber: s.rollNumber || "—",
      displayName: s.displayName || "—",
      branch: s.branch || "—",
      classGroup: s.classGroup || "—",
      status: record ? record.sub.status : "absent",
      record,
    };
  });
  // Submissions whose author fell outside the fetched roster (rare — role/group
  // edited after submitting) still deserve a visible row instead of vanishing.
  const knownUids = new Set(students.map((s) => s.id));
  records.forEach((r) => {
    if (knownUids.has(r.uid)) return;
    rows.push({
      uid: r.uid,
      rollNumber: r.sub.rollNumber || "—",
      displayName: r.sub.displayName || "—",
      branch: r.sub.branch || "—",
      classGroup: r.sub.classGroup || "—",
      status: r.sub.status,
      record: r,
    });
  });
  return rows;
}

export function StudentsTab({ exam, paper, records, students, group, onOpenStudent }) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => buildRows(students, records), [students, records]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.rollNumber.toUpperCase().includes(q) || r.displayName.toUpperCase().includes(q)
    );
  }, [rows, search]);

  const handleExport = () => {
    const qCount = paper?.questions?.length || 0;
    const header = [
      "Roll Number",
      "Name",
      "Branch",
      "Class Group",
      "Score",
      "Max",
      "Percent",
      "Correct",
      "Wrong",
      "Blank",
      "Submitted At",
      "Status",
      ...Array.from({ length: qCount }, (_, i) => `Q${i + 1}`),
    ];
    const csvRows = [header];
    filtered.forEach((r) => {
      const rec = r.record;
      const score = rec ? rec.score : null;
      const counts = rec ? outcomeCounts(rec) : { correct: 0, wrong: 0, blank: qCount };
      const perQ = new Map((rec?.score?.perQuestion || []).map((q) => [q.idx, q]));
      const responses = rec?.sub?.responses || {};
      const qCells = Array.from({ length: qCount }, (_, idx) => {
        const q = perQ.get(idx);
        if (!q) return "";
        const attempted = q.type === "coding" ? responses[idx] !== undefined && responses[idx] !== null : q.chosen !== null;
        if (!attempted) return "B";
        return q.correct ? "C" : "W";
      });
      csvRows.push([
        r.rollNumber,
        r.displayName,
        r.branch,
        r.classGroup,
        score ? score.total : "",
        score ? score.max : "",
        score && score.max ? Math.round((score.total / score.max) * 100) : "",
        counts.correct,
        counts.wrong,
        counts.blank,
        rec?.sub?.submittedAt?.toDate ? rec.sub.submittedAt.toDate().toISOString() : "",
        r.status,
        ...qCells,
      ]);
    });
    downloadCsv(`${slugify(exam?.title)}_${slugify(group || "all")}_results.csv`, csvRows);
  };

  if (!exam) {
    return <EmptyState title="pick an exam" message="Select an exam above to see student rows." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by roll number or name…"
            className="w-full font-mono text-xs pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded outline-none text-white placeholder:text-white/20 focus:border-neon-cyan/50 transition-colors"
            aria-label="Search students"
          />
        </div>
        <BracketButton variant="green" onClick={handleExport} disabled={!filtered.length}>
          <Download size={12} /> EXPORT_CSV
        </BracketButton>
      </div>

      <DataTable
        rows={filtered}
        rowKey="uid"
        onRowClick={onOpenStudent}
        initialSort={{ key: "rollNumber", dir: "asc" }}
        empty={<EmptyState title="no students" message="No students match this filter." />}
        columns={[
          {
            key: "rollNumber",
            label: "Roll Number",
            render: (r) => <span className="text-neon-cyan font-semibold">{r.rollNumber}</span>,
          },
          { key: "displayName", label: "Name" },
          { key: "branch", label: "Branch" },
          { key: "classGroup", label: "Group" },
          {
            key: "score",
            label: "Score",
            align: "right",
            sortValue: (r) => (r.record ? r.record.score.total : -1),
            render: (r) =>
              r.record ? (
                <span>
                  {r.record.score.total}/{r.record.score.max}
                </span>
              ) : (
                <span className="text-white/20">—</span>
              ),
          },
          {
            key: "outcome",
            label: "C / W / B",
            align: "center",
            sortable: false,
            render: (r) => {
              if (!r.record) return <span className="text-white/20">— / — / —</span>;
              const c = outcomeCounts(r.record);
              return (
                <span className="inline-flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-neon-green inline-flex items-center gap-1"><CheckCircle2 size={10} />{c.correct}</span>
                  <span className="text-[#FF3B3B] inline-flex items-center gap-1"><XCircle size={10} />{c.wrong}</span>
                  <span className="text-white/30 inline-flex items-center gap-1"><MinusCircle size={10} />{c.blank}</span>
                </span>
              );
            },
          },
          {
            key: "submittedAt",
            label: "Submitted At",
            sortValue: (r) => r.record?.sub?.submittedAt?.toMillis?.() || 0,
            render: (r) => (
              <span className="inline-flex items-center gap-1 text-white/40">
                <Clock3 size={10} /> {fmtTimestamp(r.record?.sub?.submittedAt)}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            sortValue: (r) => r.status,
            render: (r) => {
              const s = STATUS_STYLE[r.status] || STATUS_STYLE.absent;
              return <Tag color={s.color}>{s.label}</Tag>;
            },
          },
        ]}
      />
    </div>
  );
}
