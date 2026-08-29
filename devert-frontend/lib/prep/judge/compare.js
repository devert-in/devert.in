// Output comparison for the code judge.
// Normalization rule (design §6): trim trailing whitespace on every line,
// drop trailing blank lines, then compare exactly.

export function normalizeOutput(text) {
  if (text == null) return "";
  const lines = String(text)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\r]+$/g, ""));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function outputsMatch(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
