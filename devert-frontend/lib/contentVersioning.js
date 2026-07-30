// Shared "snapshot the previous version before overwriting" helper for
// admin-edited lesson/problem content (Programming topics, CS Core topics,
// CodeLab problems). Capped at the last 5 versions per document - just
// enough to recover from a bad edit without building a full CMS diff UI.
// Client-clock timestamp (not serverTimestamp()) because Firestore rejects
// the serverTimestamp() sentinel inside array elements.

const MAX_VERSIONS = 5;

// `existing` is the document's current data before this save (undefined/null
// for a brand-new document - nothing to snapshot yet).
export function withVersionSnapshot(existing) {
  if (!existing) return { previousVersions: [] };
  const { previousVersions: _drop, updatedAt: _drop2, ...snapshot } = existing;
  const prior = existing.previousVersions || [];
  return {
    previousVersions: [...prior, { ...snapshot, savedAt: new Date().toISOString() }].slice(-MAX_VERSIONS),
  };
}
