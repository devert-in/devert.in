import { useCallback, useEffect, useRef, useState } from "react";

// Fetch-when-a-key-changes, without a synchronous setState in the effect body.
//
// The obvious way to write this - setData(null) to show a skeleton, then fetch
// and setData(rows) - calls setState directly inside the effect. That cascades an
// extra render on every key change and this project's React lint rules flag it as
// an error (react-hooks/set-state-in-effect). It is also easy to get subtly wrong:
// forget the reset and the screen shows the PREVIOUS key's data while the new
// fetch is in flight, which is how a GATE paper switch ends up rendering the old
// paper's questions for a second.
//
// Keying the stored value by what it was fetched FOR removes both problems at
// once: data belonging to a different key simply reads as "not loaded yet",
// because that is exactly what it is. No reset write, no stale window.
//
// Returns `null` while loading (or before any key is set). A failed fetch
// resolves to `fallback` - pass `[]` for list-shaped data so a permission error
// renders an honest empty state instead of a skeleton that never goes away.
//
// `reload()` re-runs the fetch for the current key. Used by screens whose own
// writes change what the fetch would return.
export function useKeyedFetch(key, fetcher, { fallback = null } = {}) {
  // Latest-fetcher-in-a-ref, so the effect can depend on `key` alone rather than
  // on a closure that is a new function identity every render. Same idiom
  // lib/campusNav.js's useCampusBackHandler uses for the same reason.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ key: undefined, data: null });

  useEffect(() => {
    if (key === null || key === undefined || key === "") return;
    let cancelled = false;
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then(data => { if (!cancelled) setState({ key, data }); })
      .catch(() => { if (!cancelled) setState({ key, data: fallback }); });
    return () => { cancelled = true; };
    // `fallback` is deliberately not a dependency - it is a constant per call
    // site, and including it would re-fetch on every render for the common
    // `fallback: []` case, since a fresh array literal is never referentially
    // equal to the last one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  return [state.key === key ? state.data : null, reload];
}
