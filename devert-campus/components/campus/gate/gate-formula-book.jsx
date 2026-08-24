"use client";

import { useMemo, useState } from "react";
import { BookOpen, Printer, Search, Sigma } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState,
} from "@/components/campus/campus-ui";
import { Inline } from "@/components/campus/lesson-blocks";
import {
  fetchFormulas, searchFormulas, groupFormulasBySubject, mergeInlineFormulas,
  FORMULA_KINDS, formulaKindLabel,
} from "@/lib/gateLibrary";
import { toggleBookmark, isBookmarked } from "@/lib/gatePyq";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { useGate } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateBookmarkButton, GateFilterRow } from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// The Formula Book: definitions, theorems, formulae, memory tricks and revision
// cards, searchable across the whole paper and printable as one document.
//
// It merges TWO sources - standalone Formula Book entries authored in the admin
// panel, and the formula box authored inline on each topic's lesson (see
// mergeInlineFormulas). Without that merge the book would show only whichever
// half an admin happened to fill in, and a student would reasonably conclude the
// other half didn't exist. Inline entries are labelled and link back to their
// lesson.

const KIND_COLOR = {
  formula: CAMPUS.gold,
  definition: CAMPUS.blue,
  theorem: CAMPUS.purple,
  trick: CAMPUS.teal,
  card: CAMPUS.good,
};

export function GateFormulaBook() {
  const { user } = useAuth();
  const { paper, tree, notes, go, reload } = useGate();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [formulas] = useKeyedFetch(paper?.id, () => fetchFormulas(paper.id), { fallback: [] });

  const all = useMemo(() => (formulas ? mergeInlineFormulas(formulas, tree) : []), [formulas, tree]);

  const filtered = useMemo(() => {
    let rows = searchFormulas(all, search);
    if (kind) rows = rows.filter(f => (f.kind || "formula") === kind);
    if (subjectId) rows = rows.filter(f => f.subjectId === subjectId);
    if (onlyBookmarked) rows = rows.filter(f => isBookmarked(notes, "formula", f.id));
    return rows;
  }, [all, search, kind, subjectId, onlyBookmarked, notes]);

  const groups = useMemo(() => groupFormulasBySubject(filtered, tree), [filtered, tree]);
  const subjectOptions = useMemo(() => (tree || []).map(s => ({ v: s.id, label: s.name })), [tree]);

  if (formulas === null) return <CampusCard className="p-4"><CampusSkeleton height={240} /></CampusCard>;

  if (all.length === 0) {
    return (
      <div className="space-y-5">
        <GateSectionHeading label="FORMULA BOOK" icon={Sigma} title="Formula book"
          description="Every definition, theorem, formula and memory trick for this paper, in one searchable place." />
        <CampusEmptyState icon={Sigma} title="No formulas yet"
          description="Formulas come from two places: the dedicated Formula Book panel in /admin, and the formula box on each topic's lesson. Anything authored in either appears here automatically." />
      </div>
    );
  }

  const inlineCount = all.filter(f => f.fromLesson).length;

  return (
    <div className="space-y-5">
      <GateSectionHeading label="FORMULA BOOK" icon={Sigma} title="Formula book"
        description={`${all.length} entries across ${tree.length} subjects${inlineCount ? `, including ${inlineCount} pulled from lesson formula boxes` : ""}.`}
        action={
          <CampusButton size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </CampusButton>
        } />

      <CampusCard className="p-4 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          <Search size={13} style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search titles, statements, expressions, notes and tags..."
            className="flex-1 bg-transparent outline-none text-[12.5px]" style={{ color: CAMPUS.ink }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <GateFilterRow label="TYPE" value={kind} onChange={setKind} allLabel="Everything"
            options={FORMULA_KINDS.map(k => ({ v: k.key, label: k.label }))} />
          <GateFilterRow label="SUBJECT" value={subjectId} onChange={setSubjectId} allLabel="All subjects"
            options={subjectOptions} />
        </div>
        {user && (
          <button onClick={() => setOnlyBookmarked(v => !v)}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
            style={{
              background: onlyBookmarked ? CAMPUS.goldTint : CAMPUS.paper,
              border: `1px solid ${onlyBookmarked ? CAMPUS.gold : CAMPUS.line}`,
              color: onlyBookmarked ? CAMPUS.gold : CAMPUS.inkSoft,
            }}>
            Only my bookmarks
          </button>
        )}
      </CampusCard>

      <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
        {filtered.length} of {all.length} entries shown.
      </p>

      <div className="space-y-4">
        {groups.map(group => (
          <CampusCard key={group.subjectId} className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.teal }}>
              {group.subjectName.toUpperCase()} · {group.formulas.length}
            </p>
            <div className="space-y-2.5">
              {group.formulas.map(f => (
                <FormulaCard key={f.id} formula={f}
                  bookmarked={isBookmarked(notes, "formula", f.id)}
                  onBookmark={user && !f.fromLesson ? async () => {
                    const on = !isBookmarked(notes, "formula", f.id);
                    await toggleBookmark({ uid: user.uid, paperId: paper.id, kind: "formula", id: f.id, on }).catch(() => {});
                    await reload.notes();
                  } : undefined}
                  onOpenLesson={f.fromLesson && f.topicId
                    ? () => go("subjects", { subjectId: f.subjectId, topicId: f.topicId })
                    : undefined} />
              ))}
            </div>
          </CampusCard>
        ))}
      </div>
    </div>
  );
}

function FormulaCard({ formula, bookmarked, onBookmark, onOpenLesson }) {
  const kind = formula.kind || "formula";
  const color = KIND_COLOR[kind] || CAMPUS.gold;
  return (
    <div className="p-3.5 rounded-xl" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <CampusChip color={color}>{formulaKindLabel(kind).toUpperCase()}</CampusChip>
          <b className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{formula.title}</b>
          {formula.fromLesson && <CampusChip color={CAMPUS.inkFaint}>FROM LESSON</CampusChip>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onOpenLesson && (
            <button onClick={onOpenLesson} title="Open the lesson this came from"
              className="p-1 rounded" style={{ color: CAMPUS.inkFaint }}>
              <BookOpen size={12} />
            </button>
          )}
          {onBookmark && <GateBookmarkButton on={bookmarked} onToggle={onBookmark} size={12} />}
        </div>
      </div>

      {formula.expression?.trim() && (
        <pre className="text-[13px] font-mono px-3 py-2 rounded-lg my-2 overflow-x-auto"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: color }}>
          {formula.expression}
        </pre>
      )}
      {formula.statement?.trim() && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
          <Inline text={formula.statement} />
        </p>
      )}
      {formula.notes?.trim() && (
        <p className="text-[11.5px] leading-relaxed mt-1.5" style={{ color: CAMPUS.inkFaint }}>
          <Inline text={formula.notes} />
        </p>
      )}
      {formula.memoryTrick?.trim() && (
        <p className="text-[11.5px] leading-relaxed mt-2 px-2.5 py-1.5 rounded-lg"
          style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          Remember it as: <Inline text={formula.memoryTrick} />
        </p>
      )}
      {formula.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2">
          {formula.tags.map((t, i) => (
            <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: CAMPUS.surface, color: CAMPUS.inkFaint }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
