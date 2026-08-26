import { Globe, Server, Smartphone, Bot } from "lucide-react";

export const TIMEBOX_OPTIONS = [7, 14, 30];

export const CATEGORY_META = {
  web:     { label: "Web",     Icon: Globe },
  backend: { label: "Backend", Icon: Server },
  mobile:  { label: "Mobile",  Icon: Smartphone },
  ai:      { label: "AI",      Icon: Bot },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// startedAt can be a Firestore Timestamp (server round-trip) or a plain Date
// (optimistic local state right after starting an attempt) - handle both so
// callers never need to know which one they have.
export function deadlineDate(startedAt, timeboxDays) {
  const started = startedAt?.toDate ? startedAt.toDate() : new Date(startedAt);
  return new Date(started.getTime() + timeboxDays * DAY_MS);
}

export function daysRemaining(startedAt, timeboxDays) {
  if (!startedAt) return timeboxDays;
  const msLeft = deadlineDate(startedAt, timeboxDays).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / DAY_MS));
}
