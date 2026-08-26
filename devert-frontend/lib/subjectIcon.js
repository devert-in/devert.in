import {
  BookOpen, Cpu, Database, Network, Puzzle, Ruler, CircuitBoard, Hammer,
  Blocks, Landmark, Cloud, Terminal, GitBranch, Plug, ShieldCheck, Calculator,
  Binary, ToggleLeft, Share2, Brain, LineChart, MessageSquare, Palette,
  PieChart, Layers, MemoryStick, ShieldAlert,
} from "lucide-react";

// Shared between devert-frontend's admin (CS Core content authoring) and
// devert-campus's CampusCsCoreTab (the actual learner-facing view) - see
// language-logo.jsx's identical cross-project reasoning. Subject badges are
// Lucide icons, not the free-text emoji admins can type into a subject's
// `icon` field. Matched by a substring of the subject name (lowercased)
// since these names are long/prose-like, not slugs
// ("System Design (Beginner)"), with a generic fallback for anything new.
const SUBJECT_ICONS = [
  ["operating system", Cpu],
  ["database", Database],
  ["computer networks", Network],
  ["object-oriented", Puzzle],
  ["software engineering", Ruler],
  ["organization", CircuitBoard],
  ["architecture", CircuitBoard],
  ["compiler", Hammer],
  ["design pattern", Blocks],
  ["system design", Landmark],
  ["cloud", Cloud],
  ["linux", Terminal],
  ["git & github", GitBranch],
  ["rest api", Plug],
  ["security fundamentals", ShieldCheck],
  ["aptitude", Calculator],
  ["theory of computation", Binary],
  ["digital logic", ToggleLeft],
  ["distributed systems", Share2],
  ["artificial intelligence", Brain],
  ["machine learning", LineChart],
  ["natural language", MessageSquare],
  ["computer graphics", Palette],
  ["data mining", PieChart],
  ["parallel computing", Layers],
  ["microprocessor", MemoryStick],
  ["cyber security", ShieldAlert],
];

export function subjectIcon(name) {
  const n = (name || "").toLowerCase();
  return (SUBJECT_ICONS.find(([key]) => n.includes(key)) || [null, BookOpen])[1];
}
