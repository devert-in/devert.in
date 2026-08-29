"use client";

import { useMemo } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { DataTable, EmptyState, BracketButton, Tag, ProgressBar } from "@/components/prep/ui";
import { OptionMiniBars } from "./ChartBits";
import { questionStats, categoryLabel, pctColor, downloadCsv, slugify } from "./facultyUtils";
import { DIFFICULTY_MAP } from "@/lib/prep/constants";

export function QuestionAnalysisTab({ exam, paper, records, group }) {
  const stats = useMemo(() => {
    const submitted = records.filter((r) => r.sub.status === "submitted");
    return questionStats(submitted, paper);
  }, [records, paper]);

  const handleExport = () => {
    const header = [
      "Q#",
      "Topic",
      "Category",
      "Difficulty",
      "Type",
      "Attempted",
      "Correct",
      "% Correct",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Flagged (< 35%)",
    ];
    const rows = [header];
    stats.forEach((s) => {
      rows.push([
        s.idx + 1,
        s.topic,
        categoryLabel(s.category),
        s.difficulty,
        s.type,
        s.attempted,
        s.correct,
        s.pctCorrect,
        s.optionCounts?.[0] ?? "",
        s.optionCounts?.[1] ?? "",
        s.optionCounts?.[2] ?? "",
        s.optionCounts?.[3] ?? "",
        s.flagged ? "YES" : "NO",
      ]);
    });
    downloadCsv(`${slugify(exam?.title)}_${slugify(group || "all")}_question_analysis.csv`, rows);
  };

  if (!exam) {
    return <EmptyState title="pick an exam" message="Select an exam above to see question-wise analysis." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="font-mono text-[11px] text-white/35">
          {stats.filter((s) => s.flagged).length} question(s) flagged below 35% correct — consider a review session.
        </p>
        <BracketButton variant="green" onClick={handleExport} disabled={!stats.length}>
          <Download size={12} /> EXPORT_CSV
        </BracketButton>
      </div>

      <DataTable
        rows={stats}
        rowKey="idx"
        initialSort={{ key: "pctCorrect", dir: "asc" }}
        empty={<EmptyState title="no submissions" message="Question analysis appears once students submit." />}
        columns={[
          { key: "idx", label: "Q#", width: 50, render: (s) => <span className="text-white/50">Q{s.idx + 1}</span> },
          { key: "topic", label: "Topic" },
          {
            key: "category",
            label: "Category",
            render: (s) => <Tag>{categoryLabel(s.category)}</Tag>,
          },
          {
            key: "difficulty",
            label: "Difficulty",
            render: (s) => <Tag color={DIFFICULTY_MAP[s.difficulty]?.color}>{s.difficulty?.toUpperCase()}</Tag>,
          },
          {
            key: "pctCorrect",
            label: "% Correct",
            width: 160,
            render: (s) => (
              <div className="min-w-[120px]">
                <ProgressBar value={s.pctCorrect} color={pctColor(s.pctCorrect)} />
                <p className="font-mono text-[9px] text-white/25 mt-1">{s.correct}/{s.attempted} attempted</p>
              </div>
            ),
          },
          {
            key: "optionCounts",
            label: "Option Distribution",
            sortable: false,
            render: (s) =>
              s.type === "mcq" ? (
                <OptionMiniBars counts={s.optionCounts} correctIndex={s.correctIndex} />
              ) : (
                <span className="text-white/20 font-mono text-[10px]">coding</span>
              ),
          },
          {
            key: "flagged",
            label: "Flag",
            render: (s) =>
              s.flagged ? (
                <Tag color="#FF3B3B">
                  <AlertTriangle size={9} /> HARD/REVIEW
                </Tag>
              ) : (
                <span className="text-white/15">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
