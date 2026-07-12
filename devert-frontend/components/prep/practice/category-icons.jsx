"use client";

// Resolves the icon *name* strings stored in lib/prep/constants.js CATEGORIES
// to actual lucide-react components, so constants.js stays import-free.

import { Calculator, Puzzle, BookOpen, Binary, Code2, Coffee, Cpu, LayoutGrid } from "lucide-react";

export const CATEGORY_ICON_MAP = { Calculator, Puzzle, BookOpen, Binary, Code2, Coffee, Cpu };

export function CategoryIcon({ name, size = 13, className, style }) {
  const Icon = CATEGORY_ICON_MAP[name] || LayoutGrid;
  return <Icon size={size} className={className} style={style} />;
}
