"use client";

// Per-language snippet dropdown for the code playground. Inserting a
// snippet writes straight into CodeRunner's own localStorage slot for the
// current (question, language) pair and the caller forces a CodeRunner
// remount (via `key`) - that's the only supported way to push code into it
// from outside without touching the foundation-owned component.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileCode2 } from "lucide-react";

export const SNIPPETS = {
  python: [
    { id: "hello", label: "Hello, World", code: 'print("Hello, World!")\n' },
    {
      id: "fastio",
      label: "Fast I/O template",
      code:
        'import sys\n\n\ndef main():\n    data = sys.stdin.read().split()\n    # data is a list of whitespace-separated tokens\n    print(len(data))\n\n\nif __name__ == "__main__":\n    main()\n',
    },
  ],
  javascript: [
    { id: "hello", label: "Hello, World", code: 'console.log("Hello, World!");\n' },
    {
      id: "fastio",
      label: "Fast I/O template",
      code:
        'const tokens = [];\nlet line;\nwhile ((line = readLine()) !== "") {\n  tokens.push(...line.trim().split(/\\s+/).filter(Boolean));\n}\n\nconsole.log(tokens.length);\n',
    },
  ],
  java: [
    {
      id: "hello",
      label: "Hello, World",
      code:
        'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
    },
    {
      id: "fastio",
      label: "Fast I/O template",
      code:
        "import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StreamTokenizer st = new StreamTokenizer(br);\n        int count = 0;\n        while (st.nextToken() != StreamTokenizer.TT_EOF) count++;\n        System.out.println(count);\n    }\n}\n",
    },
  ],
  c: [
    {
      id: "hello",
      label: "Hello, World",
      code: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
    },
    {
      id: "fastio",
      label: "Fast I/O template",
      code:
        '#include <stdio.h>\n\nint main(void) {\n    long long x;\n    int count = 0;\n    while (scanf("%lld", &x) == 1) count++;\n    printf("%d\\n", count);\n    return 0;\n}\n',
    },
  ],
  cpp: [
    {
      id: "hello",
      label: "Hello, World",
      code: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
    },
    {
      id: "fastio",
      label: "Fast I/O template",
      code:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    long long x;\n    int count = 0;\n    while (cin >> x) count++;\n    cout << count << endl;\n    return 0;\n}\n",
    },
  ],
};

export default function SnippetMenu({ lang, onInsert, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const items = SNIPPETS[lang] || [];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || items.length === 0}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-white/40 border border-white/10 rounded px-2.5 py-1.5 hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileCode2 size={11} /> SNIPPETS <ChevronDown size={10} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute z-20 top-full left-0 mt-1.5 min-w-[190px] rounded-lg border border-white/10 overflow-hidden"
          style={{ background: "rgba(8,8,8,0.98)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}
        >
          {items.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onInsert(s.code);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 font-mono text-[11px] text-white/60 hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors cursor-pointer border-b border-white/5 last:border-0"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
