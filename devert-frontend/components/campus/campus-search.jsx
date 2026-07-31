"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, CornerDownLeft, Loader2, Search, X as XIcon } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  buildCampusSearchIndex, searchCampus, groupResults,
} from "@/lib/campusSearch";

// The Campus sidebar's search field, sitting above Dashboard.
//
// Results show the FULL ROUTE to a thing ("Programming > Java > Loops"), not just
// its name, because the whole point is orientation: a student who searches "java"
// needs to learn where Java lives, not only how to jump there once.
//
// The index is built on first focus, not on mount - see lib/campusSearch.js. So
// the cost is paid by people who actually search, and the field is usable
// immediately (typing before the index lands just shows the loading row).

export function CampusSidebarSearch({ slug, hiddenTabKeys, collapsed, onSelect, onExpandSidebar }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const ensureIndex = useCallback(async () => {
    if (index || loading) return;
    setLoading(true);
    try {
      setIndex(await buildCampusSearchIndex({ slug, hiddenTabKeys }));
    } finally {
      setLoading(false);
    }
  }, [index, loading, slug, hiddenTabKeys]);

  const results = useMemo(() => searchCampus(index, query), [index, query]);
  const groups = useMemo(() => groupResults(results), [results]);
  // Flat order drives keyboard navigation; the grouped view is purely visual, so
  // the two must be derived from the same ranked list rather than re-sorted.
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  useEffect(() => { setActive(0); }, [query]);

  // Cmd/Ctrl+K focuses it, matching the /admin palette's shortcut so the gesture
  // is the same everywhere on the platform.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onExpandSidebar?.();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExpandSidebar]);

  // Close on an outside click. Pointerdown rather than click so the dropdown
  // closes before a click on something underneath it registers.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (item) => {
    if (!item) return;
    setOpen(false);
    setQuery("");
    onSelect(item);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!flat.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => (i + 1) % flat.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => (i - 1 + flat.length) % flat.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
  };

  // Collapsed rail: a button rather than a field. Clicking expands the sidebar
  // and focuses the real input, so search is never unreachable in this state.
  if (collapsed) {
    return (
      <button
        onClick={() => { onExpandSidebar?.(); setTimeout(() => inputRef.current?.focus(), 220); }}
        title="Search Campus (Ctrl+K)"
        className="mx-auto mb-1 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
        <Search size={15} />
      </button>
    );
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative px-0 mb-1">
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
        style={{
          background: CAMPUS.paper,
          border: `1px solid ${open ? CAMPUS.teal : CAMPUS.line}`,
          transition: "border-color 0.15s",
        }}>
        {loading
          ? <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: CAMPUS.teal }} />
          : <Search size={13} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }} />}
        <input
          ref={inputRef}
          value={query}
          onFocus={() => { setOpen(true); ensureIndex(); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); ensureIndex(); }}
          onKeyDown={onKeyDown}
          placeholder="Search modules..."
          aria-label="Search Campus"
          className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px]"
          style={{ color: CAMPUS.ink }}
        />
        {query ? (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search"
            className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
            <XIcon size={13} />
          </button>
        ) : (
          <kbd className="flex-shrink-0 font-mono text-[9.5px] px-1.5 py-0.5 rounded"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
            ⌘K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl overflow-hidden"
          style={{
            background: CAMPUS.surface,
            border: `1px solid ${CAMPUS.line}`,
            boxShadow: CAMPUS.shadowLg,
            maxHeight: "min(60vh, 420px)",
            overflowY: "auto",
            // Stays within the sidebar's own width (230px) rather than
            // overflowing into the main content - breadcrumbs wrap onto a
            // second line instead (see the path span's flex-wrap below).
          }}>
          {loading && flat.length === 0 && (
            <p className="px-3 py-3 text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              Building the search index...
            </p>
          )}

          {!loading && flat.length === 0 && (
            <div className="px-3 py-3">
              <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>
                Nothing matches &quot;{query.trim()}&quot;.
              </p>
              <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>
                Try a module name, a language, a subject or a topic.
              </p>
            </div>
          )}

          {groups.map(group => (
            <div key={group.kind}>
              <p className="px-3 pt-2.5 pb-1 text-[9.5px] font-mono tracking-widest"
                style={{ color: CAMPUS.inkFaint }}>
                {group.kind.toUpperCase()}
              </p>
              {group.items.map(item => {
                const i = flat.indexOf(item);
                const isActive = i === active;
                return (
                  <button key={item.id}
                    onClick={() => choose(item)}
                    onMouseEnter={() => setActive(i)}
                    className="w-full text-left px-3 py-2 flex items-start gap-2"
                    style={{ background: isActive ? CAMPUS.tealTint : "transparent" }}>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium truncate"
                        style={{ color: isActive ? CAMPUS.teal : CAMPUS.ink }}>
                        {item.title}
                      </span>
                      {/* The full route - the actual point of this search */}
                      <span className="flex items-center gap-1 flex-wrap mt-0.5">
                        {item.path.map((seg, si) => (
                          <span key={si} className="flex items-center gap-1">
                            {si > 0 && <ChevronRight size={9} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                            <span className="text-[10.5px]"
                              style={{ color: si === item.path.length - 1 ? CAMPUS.inkSoft : CAMPUS.inkFaint }}>
                              {seg}
                            </span>
                          </span>
                        ))}
                      </span>
                    </div>
                    {isActive && <CornerDownLeft size={11} className="flex-shrink-0 mt-1" style={{ color: CAMPUS.teal }} />}
                  </button>
                );
              })}
            </div>
          ))}

          {flat.length > 0 && (
            <p className="px-3 py-2 text-[10px] font-mono"
              style={{ borderTop: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
              ↑↓ to move · ↵ to open · esc to close
            </p>
          )}
        </div>
      )}
    </div>
  );
}
