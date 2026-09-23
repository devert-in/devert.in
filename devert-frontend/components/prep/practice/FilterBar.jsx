"use client";

// Filter bar for /prep/practice: category chips (server-side filter),
// difficulty chips (server-side filter), MCQ/CODING type toggle (server-side
// filter), topic select + search box (both client-side over the loaded batch).

import { Search, X, LayoutGrid } from "lucide-react";
import { cn } from "@/components/prep/ui";
import { CATEGORIES, DIFFICULTIES } from "@/lib/prep/constants";
import { CategoryIcon } from "./category-icons";

const TYPE_OPTIONS = [
  { id: "all", label: "ALL" },
  { id: "mcq", label: "MCQ" },
  { id: "coding", label: "CODING" },
];

function Chip({ active, color = "#00FFFF", onClick, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer",
        active ? "text-black font-semibold" : "text-white/50 hover:text-white/80"
      )}
      style={
        active
          ? { background: color, borderColor: color }
          : { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }
      }
    >
      {icon}
      {children}
    </button>
  );
}

export default function FilterBar({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  type,
  onTypeChange,
  topic,
  onTopicChange,
  topics = [],
  search,
  onSearchChange,
}) {
  return (
    <div className="space-y-4">
      {/* category chips */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by category">
        <Chip active={category === "all"} color="#00FFFF" onClick={() => onCategoryChange("all")} icon={<LayoutGrid size={11} />}>
          ALL
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            color={c.color}
            onClick={() => onCategoryChange(c.id)}
            icon={<CategoryIcon name={c.icon} size={11} />}
          >
            {c.label.toUpperCase()}
          </Chip>
        ))}
      </div>

      <div className="flex items-center gap-x-6 gap-y-3 flex-wrap">
        {/* difficulty chips */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by difficulty">
          <span className="font-mono text-[9px] text-white/25 tracking-wider uppercase mr-1">level</span>
          <Chip active={difficulty === "all"} color="#00FFFF" onClick={() => onDifficultyChange("all")}>
            ALL
          </Chip>
          {DIFFICULTIES.map((d) => (
            <Chip key={d.id} active={difficulty === d.id} color={d.color} onClick={() => onDifficultyChange(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>

        {/* type toggle */}
        <div className="flex items-center gap-2" role="group" aria-label="Filter by question type">
          <span className="font-mono text-[9px] text-white/25 tracking-wider uppercase mr-1">type</span>
          <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTypeChange(t.id)}
                aria-pressed={type === t.id}
                className={cn(
                  "font-mono text-[11px] px-3 py-1.5 transition-colors cursor-pointer",
                  type === t.id ? "bg-neon-cyan/15 text-neon-cyan" : "text-white/40 hover:text-white/70"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* topic select - distinct topics of currently loaded questions */}
        <div className="flex items-center gap-2">
          <label htmlFor="practice-topic" className="font-mono text-[9px] text-white/25 tracking-wider uppercase">
            topic
          </label>
          <select
            id="practice-topic"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 font-mono text-[11px] text-white/70 focus:border-neon-cyan/50 outline-none cursor-pointer max-w-[220px]"
          >
            <option value="all">All topics ({topics.length})</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* search - client-side over prompt/topic/tags */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="search prompt, topic, tags…"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded pl-8 pr-8 py-1.5 font-mono text-[11px] text-white/70 placeholder:text-white/20 focus:border-neon-cyan/50 outline-none"
            aria-label="Search questions"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
