// Shared constants for the Placements Prep module.
// Icon names are lucide-react export names — consumers resolve them themselves
// so this module stays import-free and safe for any context.

export const PISTON_DEFAULT_URL = "https://emkc.org/api/v2/piston";

export const COLORS = {
  cyan: "#00FFFF",
  green: "#00FF41",
  orange: "#FF9500",
  red: "#FF3B3B",
  gold: "#FFD700",
};

export const CATEGORIES = [
  { id: "aptitude", label: "Aptitude", icon: "Calculator", color: "#00FFFF" },
  { id: "reasoning", label: "Reasoning", icon: "Puzzle", color: "#FF9500" },
  { id: "verbal", label: "Verbal", icon: "BookOpen", color: "#FF6EC7" },
  { id: "dsa", label: "DSA", icon: "Binary", color: "#00FF41" },
  { id: "python", label: "Python", icon: "Code2", color: "#FFD700" },
  { id: "java", label: "Java", icon: "Coffee", color: "#FF6430" },
  { id: "cs-core", label: "CS Core", icon: "Cpu", color: "#B794F6" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const BRANCHES = ["CSE", "CSE-AIML", "CSE-DS", "ECE", "IT", "MECH", "AERO"];

export const DIFFICULTIES = [
  { id: "easy", label: "EASY", color: "#00FF41" },
  { id: "medium", label: "MEDIUM", color: "#FF9500" },
  { id: "hard", label: "HARD", color: "#FF3B3B" },
];

export const DIFFICULTY_MAP = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d]));

// judge: 'pyodide' → in-browser python worker, 'worker' → sandboxed JS worker,
// 'piston' → remote Piston execution API. `piston` is the Piston language name.
export const LANGUAGES = [
  { id: "python", label: "Python", judge: "pyodide", piston: "python", ext: "py" },
  { id: "javascript", label: "JavaScript", judge: "worker", piston: "javascript", ext: "js" },
  { id: "java", label: "Java", judge: "piston", piston: "java", ext: "java" },
  { id: "c", label: "C", judge: "piston", piston: "c", ext: "c" },
  { id: "cpp", label: "C++", judge: "piston", piston: "c++", ext: "cpp" },
];

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));

export const ROLES = [
  { id: "student", label: "Student", color: "#00FFFF" },
  { id: "faculty", label: "Faculty", color: "#00FF41" },
  { id: "tpo", label: "TPO", color: "#FF9500" },
  { id: "admin", label: "Admin", color: "#FFD700" },
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]));

export const STAFF_ROLES = ["faculty", "tpo", "admin"];

export const DEFAULT_CLASS_GROUPS = [
  { name: "CSE-A", branch: "CSE" },
  { name: "CSE-B", branch: "CSE" },
  { name: "CSE-C", branch: "CSE" },
  { name: "CSE-AIML-A", branch: "CSE-AIML" },
  { name: "CSE-DS-A", branch: "CSE-DS" },
  { name: "ECE-A", branch: "ECE" },
  { name: "IT-A", branch: "IT" },
];

export const ROLL_NUMBER_REGEX = /^[A-Z0-9]{6,14}$/;
