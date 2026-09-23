"use client";

// Shared "today's missions" checklist - used by both the /prep hub preview
// and the /prep/learn daily-tasks panel, so completion logic lives once.
// Lesson/course items are "done" when the learn page's own localStorage
// completion record exists; quiz/coding items are "done" when today's
// attempt log (prepAttempts) already has a record for that question id.

import Link from "next/link";
import { CheckCircle2, Circle, BookOpen, Code2, HelpCircle, GraduationCap } from "lucide-react";
import { cn, EmptyState, LoadingRows } from "@/components/prep/ui";
import { CATEGORY_MAP } from "@/lib/prep/constants";

const TYPE_ICON = { lesson: BookOpen, quiz: HelpCircle, coding: Code2, course: GraduationCap };

export function dailyItemHref(item) {
  if (!item) return "/prep/learn";
  if (item.type === "lesson") {
    return `/prep/learn?course=${encodeURIComponent(item.courseId || "")}&lesson=${encodeURIComponent(
      item.refId || ""
    )}`;
  }
  if (item.type === "course") {
    return `/prep/learn?course=${encodeURIComponent(item.refId || item.courseId || "")}`;
  }
  // quiz / coding daily items point students at the practice bank, filtered
  // to the relevant category (the practice page owns the rest of its query API).
  return `/prep/practice?category=${encodeURIComponent(item.category || "")}`;
}

export function lessonCompletionKey(uid, courseId, lessonId) {
  return `devert-prep-learn:${uid}:${courseId}:${lessonId}`;
}

export function isDailyItemDone(item, { uid, todayAttempts = [] } = {}) {
  if (!item) return false;
  if (item.type === "lesson" || item.type === "course") {
    if (!uid || typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(lessonCompletionKey(uid, item.courseId, item.refId));
      if (!raw) return false;
      return !!JSON.parse(raw)?.completed;
    } catch {
      return false;
    }
  }
  return todayAttempts.some((a) => a.qid === item.refId);
}

export default function DailyMissionsPanel({
  items,
  loading,
  error,
  uid,
  todayAttempts = [],
  emptyMessage,
  className,
}) {
  if (loading) return <LoadingRows rows={4} className={className} />;
  if (error) {
    return <p className={cn("font-mono text-xs text-[#FF3B3B]", className)}>{error}</p>;
  }
  if (!items || !items.length) {
    return (
      <EmptyState
        title="no missions today"
        message={emptyMessage || "Nothing scheduled for today - check back tomorrow, or head to practice."}
        className={className}
      />
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, i) => {
        const done = isDailyItemDone(item, { uid, todayAttempts });
        const Icon = TYPE_ICON[item.type] || HelpCircle;
        const cat = CATEGORY_MAP[item.category];
        return (
          <li key={`${item.type}-${item.refId}-${i}`}>
            <Link
              href={dailyItemHref(item)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors group",
                done
                  ? "border-neon-green/25 bg-neon-green/[0.04]"
                  : "border-white/8 bg-white/[0.02] hover:border-neon-cyan/30 hover:bg-neon-cyan/5"
              )}
            >
              {done ? (
                <CheckCircle2 size={15} className="text-neon-green flex-shrink-0" />
              ) : (
                <Circle size={15} className="text-white/20 flex-shrink-0" />
              )}
              <Icon size={13} className="text-white/35 flex-shrink-0" />
              <span
                className={cn(
                  "font-mono text-xs flex-1 min-w-0 truncate",
                  done ? "text-white/40 line-through" : "text-white/70"
                )}
              >
                {item.title}
              </span>
              {cat && (
                <span
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: cat.color, background: `${cat.color}14` }}
                >
                  {cat.label.toUpperCase()}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
