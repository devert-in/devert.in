"use client";

// Sortable question list for /prep/practice. Attempt state (tick/cross) comes
// from the caller's attemptsMap (built once from the user's prepAttempts
// history), keyed by question id.

import { CheckCircle2, XCircle, Circle } from "lucide-react";
import { DataTable, NeonBadge, Tag, EmptyState } from "@/components/prep/ui";
import { CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";
import { CategoryIcon } from "./category-icons";

function stripMarkdown(md = "") {
  return String(md)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function QuestionList({ questions, attemptsMap = {}, onSelect }) {
  const columns = [
    {
      key: "status",
      label: "",
      sortable: false,
      align: "center",
      width: "36px",
      render: (q) => {
        const a = attemptsMap[q.id];
        if (!a) return <Circle size={12} className="text-white/15" aria-label="Not attempted" />;
        return a.correct ? (
          <CheckCircle2 size={13} className="text-neon-green" aria-label="Solved correctly" />
        ) : (
          <XCircle size={13} className="text-[#FF3B3B]" aria-label="Attempted, not yet correct" />
        );
      },
    },
    {
      key: "prompt",
      label: "question",
      sortValue: (q) => stripMarkdown(q.prompt || "").toLowerCase(),
      render: (q) => (
        <span className="line-clamp-2 text-white/70 max-w-xl inline-block align-middle">
          {stripMarkdown(q.prompt).slice(0, 160) || "(untitled question)"}
        </span>
      ),
    },
    {
      key: "category",
      label: "category",
      sortValue: (q) => CATEGORY_MAP[q.category]?.label || q.category || "",
      render: (q) => {
        const c = CATEGORY_MAP[q.category];
        return c ? (
          <NeonBadge color={c.color}>
            <CategoryIcon name={c.icon} size={10} />
            {c.label.toUpperCase()}
          </NeonBadge>
        ) : (
          <span className="text-white/30">{q.category || "-"}</span>
        );
      },
    },
    {
      key: "difficulty",
      label: "level",
      sortValue: (q) => q.difficulty || "",
      render: (q) => {
        const d = DIFFICULTY_MAP[q.difficulty];
        return d ? <NeonBadge color={d.color}>{d.label}</NeonBadge> : <span className="text-white/30">-</span>;
      },
    },
    {
      key: "topic",
      label: "topic",
      sortValue: (q) => q.topic || "",
      render: (q) => <Tag>{q.topic || "-"}</Tag>,
    },
    {
      key: "type",
      label: "type",
      sortValue: (q) => q.type || "",
      render: (q) => (
        <Tag color={q.type === "coding" ? "#00FF41" : "#00FFFF"}>{(q.type || "mcq").toUpperCase()}</Tag>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={questions}
      rowKey={(q) => q.id}
      onRowClick={onSelect}
      initialSort={{ key: "category", dir: "asc" }}
      empty={
        <EmptyState
          title="no questions match"
          message="Try widening your filters, clearing the search box, or picking a different topic."
        />
      }
    />
  );
}
