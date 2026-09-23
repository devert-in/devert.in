"use client";

import { useMemo, useState } from "react";
import { Check, FlaskConical, RotateCcw, Search, Trash2, UserPlus } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusSkeleton } from "@/components/campus/campus-ui";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import {
  addContestReviewer, removeContestReviewer, setContestReviewerEnabled,
  fetchContestReviewers, fetchContestDryRuns, deleteContestDryRun,
} from "@/lib/contests";

// Mock Reviewers - people the admin lists to test a paper end to end before it
// opens to students.
//
// Reviewers are picked from the institution's own roster rather than typed in
// free-form. An email or roll number typed by hand has to be resolved to a uid
// to be useful, and a typo would silently create a roster entry nobody can use;
// searching the roster you already loaded means the uid is right by
// construction. The search covers name, roll number, department, year and
// section, which is every identifier the spec asked to add reviewers by.
//
// Everything that keeps reviewer activity out of production is enforced in
// firestore.rules, not here - see the emulator tests. This component only
// manages the roster.

export function ContestReviewersPanel({ contestId, roster = [], adminUid }) {
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  const key = `${contestId}:${nonce}`;
  const [data, reload] = useKeyedFetch(key, async () => {
    const [reviewers, dryRuns] = await Promise.all([
      fetchContestReviewers(contestId),
      fetchContestDryRuns(contestId).catch(() => []),
    ]);
    return { reviewers, dryRuns };
  }, { fallback: { reviewers: [], dryRuns: [] } });

  const reviewers = data?.reviewers || [];
  const dryRunByUid = useMemo(
    () => new Map((data?.dryRuns || []).map(d => [d.uid, d])), [data]);

  const listed = useMemo(() => new Set(reviewers.map(r => r.uid)), [reviewers]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return roster
      .filter(s => !listed.has(s.uid))
      .filter(s => [s.name, s.rollNumber, s.email, s.department, s.year, s.section]
        .some(v => String(v || "").toLowerCase().includes(q)))
      .slice(0, 6);
  }, [query, roster, listed]);

  const run = async (label, fn) => {
    setBusy(label); setError("");
    try { await fn(); setNonce(n => n + 1); }
    catch (e) {
      // Firebase's raw "Missing or insufficient permissions." tells an admin
      // nothing they can act on. The overwhelmingly likely cause is that the
      // reviewer rules have not been deployed yet - this collection is new, so
      // a project still running older firestore.rules has no match block for
      // it at all and denies every read and write.
      setError(e?.code === "permission-denied"
        ? "Firestore refused that. If mock reviewers are new to this project, firestore.rules probably hasn't been deployed yet - run: firebase deploy --only firestore:rules"
        : (e?.message || "That didn't work."));
    }
    finally { setBusy(""); }
  };

  const add = (s) => run(`add:${s.uid}`, async () => {
    await addContestReviewer(contestId, s.uid, {
      name: s.name, rollNumber: s.rollNumber, email: s.email,
    }, adminUid);
    setQuery("");
  });

  return (
    <CampusCard className="p-4 mt-4">
      <p className="text-[12.5px] font-semibold mb-1 flex items-center gap-1.5" style={{ color: CAMPUS.ink }}>
        <FlaskConical size={13} /> Mock reviewers
        {reviewers.length > 0 && <CampusChip color={CAMPUS.teal}>{reviewers.length}</CampusChip>}
      </p>
      <p className="text-[11.5px] mb-3" style={{ color: CAMPUS.inkFaint }}>
        Let someone sit this paper before it opens - even if they are outside the target audience.
        Their attempt is saved separately and never reaches the leaderboard, participant count or any average.
      </p>

      {error && (
        <p className="text-[12px] mb-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>
      )}

      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Add a reviewer - search by name, roll number, email, department..."
          aria-label="Search the roster for a reviewer"
          className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        {matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg overflow-hidden"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
            {matches.map(s => (
              <button key={s.uid} onClick={() => add(s)} disabled={busy === `add:${s.uid}`}
                className="w-full text-left px-3 py-2 flex items-center gap-2 disabled:opacity-50">
                <UserPlus size={12} style={{ color: CAMPUS.teal }} />
                <span className="text-[12.5px] flex-1 min-w-0 truncate" style={{ color: CAMPUS.ink }}>
                  {s.name || "(no name)"}
                </span>
                <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                  {s.rollNumber} {s.year ? `· ${s.year}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
        {query.trim().length >= 2 && matches.length === 0 && (
          <p className="text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>
            Nobody on the roster matches, or they are already a reviewer.
          </p>
        )}
      </div>

      {data === null ? (
        <CampusSkeleton variant="rect" height={48} />
      ) : reviewers.length === 0 ? (
        <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
          No reviewers yet. You can still dry-run the paper yourself with the Dry run button above.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {reviewers.map((r, i) => {
            const attempt = dryRunByUid.get(r.uid);
            const off = r.enabled === false;
            return (
              <div key={r.uid} className="flex items-center gap-2 px-3 py-2.5 flex-wrap"
                style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                <div className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-medium truncate" style={{ color: off ? CAMPUS.inkFaint : CAMPUS.ink }}>
                    {r.name || r.uid}
                  </span>
                  <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                    {r.rollNumber || r.email || r.uid.slice(0, 10)}
                  </span>
                </div>

                {off && <CampusChip color={CAMPUS.inkFaint}>DISABLED</CampusChip>}
                {attempt ? (
                  <CampusChip color={CAMPUS.good}>
                    TESTED {typeof attempt.score === "number" ? `· ${attempt.score}/${attempt.maxScore}` : ""}
                  </CampusChip>
                ) : (
                  <CampusChip color={CAMPUS.warn}>NOT YET</CampusChip>
                )}

                <button onClick={() => run(`t:${r.uid}`, () => setContestReviewerEnabled(contestId, r.uid, off))}
                  disabled={!!busy} title={off ? "Re-enable access" : "Suspend access, keeping their history"}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
                  style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                  {off ? "Enable" : "Disable"}
                </button>
                {attempt && (
                  <button onClick={() => run(`r:${r.uid}`, () => deleteContestDryRun(contestId, r.uid))}
                    disabled={!!busy} title="Clear their attempt so they can test again from scratch"
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                    style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
                <button onClick={() => run(`d:${r.uid}`, () => removeContestReviewer(contestId, r.uid))}
                  disabled={!!busy} title="Remove from the reviewer list"
                  className="disabled:opacity-50" style={{ color: CAMPUS.inkFaint }}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {reviewers.length > 0 && (
        <p className="text-[10.5px] mt-2.5 flex items-start gap-1.5" style={{ color: CAMPUS.inkFaint }}>
          <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.good }} />
          Reviewers see the questions but not the answer key - that unlocks only once they submit their own dry run,
          so review access can never be a way to read the answers early.
        </p>
      )}
    </CampusCard>
  );
}
