"use client";

import {
  siPython, siCplusplus, siJavascript, siTypescript, siGo, siRust,
  siKotlin, siDart, siSwift, siPhp, siDotnet, siRuby, siR, siScala, siLua,
  siPerl, siJulia, siGnubash, siC,
} from "simple-icons";
import {
  Coffee, Binary, Cpu, Plus, Braces, FileCode, Hash, Gem, Feather, Blocks,
  CircuitBoard, Sigma, Terminal, Database, Code2, Zap, Target,
} from "lucide-react";

// Centralized language -> logo resolver. Every place in the app that shows
// "this is language X" (Programming's cards/roadmap header, the
// CodeExampleBlock editor header in campus-daily-learning.jsx, the admin
// language list) imports THIS instead of picking its own icon, so the same
// brand mark is used everywhere and never drifts between call sites.
//
// Simple Icons (self-hosted SVG path data, no CDN - see CLAUDE.md's
// design-system exception for brand/language logos) doesn't have an official
// mark for every language: Oracle (Java), Microsoft (C#/PowerShell), and
// MathWorks (MATLAB) don't license their brand to the project. Java
// deliberately has no entry here (OpenJDK's logo reads as an unrelated
// mark, not "Java," to anyone glancing at the card) - it falls through to
// the Lucide Coffee cup below, same as PowerShell/MATLAB/SQL/anything
// unrecognized. C# falls back to the .NET logo (the user's own spec names
// "C#/.NET" as one mark) since that one IS instantly recognizable as C#.
const BRAND_LOGOS = {
  python: siPython,
  c: siC,
  cpp: siCplusplus, "c++": siCplusplus,
  javascript: siJavascript,
  typescript: siTypescript,
  go: siGo, golang: siGo,
  rust: siRust,
  kotlin: siKotlin,
  dart: siDart,
  swift: siSwift,
  php: siPhp,
  "c#": siDotnet, csharp: siDotnet,
  ruby: siRuby,
  r: siR,
  scala: siScala,
  lua: siLua,
  perl: siPerl,
  julia: siJulia,
  bash: siGnubash, shell: siGnubash,
};

// Only reached when a language has no Simple Icons brand mark at all (see
// BRAND_LOGOS above) or isn't recognized - Code2 is the final fallback.
const LUCIDE_FALLBACKS = {
  java: Coffee, python: Binary, c: Cpu, "c++": Plus, javascript: Braces,
  typescript: FileCode, go: Zap, kotlin: Target, "c#": Hash, ruby: Gem,
  swift: Feather, php: Blocks, rust: CircuitBoard,
  matlab: Sigma, powershell: Terminal, sql: Database,
};

export function languageIcon(name) {
  return LUCIDE_FALLBACKS[(name || "").trim().toLowerCase()] || Code2;
}

export function LanguageLogo({ name, size = 18, className = "", style }) {
  const brand = BRAND_LOGOS[(name || "").trim().toLowerCase()];
  if (brand) {
    return (
      <svg role="img" viewBox="0 0 24 24" width={size} height={size} className={className}
        style={style} fill={`#${brand.hex}`}>
        <title>{brand.title}</title>
        <path d={brand.path} />
      </svg>
    );
  }
  const Icon = languageIcon(name);
  return <Icon size={size} className={className} style={style} />;
}
