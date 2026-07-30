"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bookmark, Check, CheckCircle2, FileQuestion, FileText, Sigma,
  Trash2, Undo2,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusEmptyState, CampusSkeleton,
} from "@/components/campus/campus-ui";
import { Inline } from "@/components/campus/lesson-blocks";
import {
  mistakeList, weakConceptsFromMistakes, MISTAKE_REASONS, resolveMistake,
  clearMistake, setMistakeReason, fetchPyqs, toggleBookmark,
} from "@/lib/gatePyq";
import { fetchFormulas, mergeInlineFormulas } from "@/lib/gateLibrary";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateStat, GateQuestion, GateSolution, GateFilterRow,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// ---------------- bookmarks ----------------

// Four kinds of bookmark in one place, because "the things I saved" is one mental
// category even though the underlying documents are topics, questions and
// formulas. Each kind resolves its own labels lazily - a student with no
// bookmarked formulas never pays for the formula fetch.

export function GateBookmarks() {
  const { user } = useAuth();
  const { paper, tree, notes, go, reload } = useGate();
  const [kind, setKind] = useState("topic");
  const [pyqs, setPyqs] = useState(null);
  const [formulas, setFormulas] = useState(null);

  const bookmarkedTopicIds = notes?.bookmarkedTopicIds || [];
  const bookmarkedPyqIds = notes?.bookmarkedPyqIds || [];
  const bookmarkedFormulaIds = notes?.bookmarkedFormulaIds || [];

  useEffect(() => {
    if (kind !== "pyq" || !paper?.id || pyqs !== null || bookmarkedPyqIds.length === 0) return;
    fetchPyqs(paper.id).then(setPyqs).catch(() => setPyqs([]));
  }, [kind, paper?.id, pyqs, bookmarkedPyqIds.length]);

  useEffect(() => {
    if (kind !== "formula" || !paper?.id || formulas !== null || bookmarkedFormulaIds.length === 0) return;
    fetchFormulas(paper.id).then(setFormulas).catch(() => setFormulas([]));
  }, [kind, paper?.id, formulas, bookmarkedFormulaIds.length]);

  const topicIndex = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) {
      m.set(t.id, { title: t.title, module: t.module, subjectId: s.id, subjectName: s.name });
    }
    return m;
  }, [tree]);

  if (!user) return <GateSignInPrompt what="your bookmarks" />;

  const total = bookmarkedTopicIds.length + bookmarkedPyqIds.length + bookmarkedFormulaIds.length;
  const tabs = [
    { key: "topic", label: "Topics", n: bookmarkedTopicIds.length, icon: FileText },
    { key: "pyq", label: "Questions", n: bookmarkedPyqIds.length, icon: FileQuestion },
    { key: "formula", label: "Formulas", n: bookmarkedFormulaIds.length, icon: Sigma },
  ];

  const unbookmark = async (k, id) => {
    await toggleBookmark({ uid: user.uid, paperId: paper.id, kind: k, id, on: false }).catch(() => {});
    await reload.notes();
  };

  return (
    <div className="space-y-5">
      <GateSectionHeading label="BOOKMARKS" icon={Bookmark} title="Bookmarks"
        description="Everything you've saved while studying - topics to come back to, questions worth a second look, and formulas you keep needing." />

      {total === 0 ? (
        <CampusEmptyState icon={Bookmark} title="Nothing bookmarked yet"
          description="Tap the bookmark icon on any topic, previous-year question or formula and it lands here." />
      ) : (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {tabs.map(t => {
              const active = t.key === kind;
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setKind(t.key)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: active ? CAMPUS.tealTint : CAMPUS.paper,
                    border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                    color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                  }}>
                  <Icon size={12} /> {t.label} {t.n}
                </button>
              );
            })}
          </div>

          {kind === "topic" && (
            bookmarkedTopicIds.length === 0
              ? <Empty what="topics" />
              : <div className="space-y-2">
                {bookmarkedTopicIds.map(id => {
                  const meta = topicIndex.get(id);
                  return (
                    <CampusCard key={id} className="p-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <b className="text-[13px] block truncate" style={{ color: CAMPUS.ink }}>{meta?.title || id}</b>
                        <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>
                          {meta ? `${meta.subjectName} · ${meta.module}` : "This topic no longer exists in the syllabus"}
                        </span>
                      </div>
                      {meta && (
                        <CampusButton size="sm" variant="secondary"
                          onClick={() => go("subjects", { subjectId: meta.subjectId, topicId: id })}>
                          Open
                        </CampusButton>
                      )}
                      <CampusButton size="sm" variant="ghost" onClick={() => unbookmark("topic", id)}>Remove</CampusButton>
                    </CampusCard>
                  );
                })}
              </div>
          )}

          {kind === "pyq" && (
            bookmarkedPyqIds.length === 0 ? <Empty what="questions" />
              : pyqs === null ? <CampusCard className="p-4"><CampusSkeleton height={160} /></CampusCard>
                : <div className="space-y-4">
                  {bookmarkedPyqIds.map((id, i) => {
                    const pyq = pyqs.find(p => p.id === id);
                    if (!pyq) return (
                      <CampusCard key={id} className="p-3.5">
                        <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
                          A bookmarked question is no longer published.
                          <button onClick={() => unbookmark("pyq", id)} className="ml-2 font-semibold" style={{ color: CAMPUS.teal }}>
                            Remove it
                          </button>
                        </p>
                      </CampusCard>
                    );
                    return (
                      <div key={id} className="space-y-2">
                        <GateQuestion question={pyq} index={i} mode="study" answer={null} onAnswer={() => {}}
                          bookmarked onToggleBookmark={() => unbookmark("pyq", id)} />
                        <GateSolution answerKey={pyq} />
                      </div>
                    );
                  })}
                </div>
          )}

          {kind === "formula" && (
            bookmarkedFormulaIds.length === 0 ? <Empty what="formulas" />
              : formulas === null ? <CampusCard className="p-4"><CampusSkeleton height={140} /></CampusCard>
                : <div className="space-y-2">
                  {mergeInlineFormulas(formulas, tree)
                    .filter(f => bookmarkedFormulaIds.includes(f.id))
                    .map(f => (
                      <CampusCard key={f.id} className="p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <b className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{f.title}</b>
                          <CampusButton size="sm" variant="ghost" onClick={() => unbookmark("formula", f.id)}>Remove</CampusButton>
                        </div>
                        {f.expression && (
                          <pre className="text-[12.5px] font-mono px-2.5 py-1.5 rounded-lg overflow-x-auto"
                            style={{ background: CAMPUS.paper, color: CAMPUS.gold }}>{f.expression}</pre>
                        )}
                        {f.statement && (
                          <p className="text-[12px] mt-1.5" style={{ color: CAMPUS.inkSoft }}><Inline text={f.statement} /></p>
                        )}
                      </CampusCard>
                    ))}
                </div>
          )}
        </>
      )}
    </div>
  );
}

function Empty({ what }) {
  return (
    <CampusCard className="p-5">
      <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>No {what} bookmarked yet.</p>
    </CampusCard>
  );
}

// ---------------- mistake notebook ----------------

// Populated automatically - a student never has to remember to log anything.
// Wrong answers in practice and in tests are filed by lib/gatePyq.js at the
// moment they happen, along with correct-but-far-too-slow answers, which are a
// real weakness in a timed paper even though nothing was marked wrong.
//
// The three actions are deliberate: mark resolved (you fixed it, keep the record),
// re-label why it happened (a silly mistake and a concept gap need completely
// different responses), and delete. Nothing auto-expires - a notebook that
// quietly forgets your mistakes is not a notebook.

export function GateMistakes() {
  const { user } = useAuth();
  const { paper, tree, notes, go, reload } = useGate();
  const [reason, setReason] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [showResolved, setShowResolved] = useState(false);
  const [busy, setBusy] = useState(null);

  const topicIndex = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) {
      m.set(t.id, { title: t.title, subjectId: s.id, subjectName: s.name });
    }
    return m;
  }, [tree]);

  const rows = useMemo(
    () => mistakeList(notes, { reason, subjectId, includeResolved: showResolved }),
    [notes, reason, subjectId, showResolved]);
  const weak = useMemo(() => weakConceptsFromMistakes(notes), [notes]);
  const allOpen = useMemo(() => mistakeList(notes), [notes]);
  const allResolved = useMemo(
    () => mistakeList(notes, { includeResolved: true }).filter(m => m.resolved), [notes]);
  const subjectOptions = useMemo(() => (tree || []).map(s => ({ v: s.id, label: s.name })), [tree]);
  const byReason = useMemo(() => {
    const counts = {};
    for (const m of allOpen) counts[m.reason] = (counts[m.reason] || 0) + 1;
    return counts;
  }, [allOpen]);

  // Every hook above the early return, unconditionally - React identifies hooks
  // by call order, so a useMemo below a conditional `return` silently corrupts
  // the hook list the moment `user` flips from null to signed-in.
  if (!user) return <GateSignInPrompt what="your mistake notebook" />;

  const act = async (fn, key) => {
    setBusy(key);
    try { await fn(); await reload.notes(); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <GateSectionHeading label="MISTAKES NOTEBOOK" icon={AlertTriangle} title="Mistakes notebook"
        description="Filled in for you. Every wrong answer from practice and from tests lands here automatically, along with anything you got right but far too slowly." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Open mistakes" value={allOpen.length} color={CAMPUS.bad} icon={AlertTriangle} />
        <GateStat label="Marked fixed" value={allResolved.length} color={CAMPUS.good} icon={CheckCircle2} />
        <GateStat label="Weak concepts" value={weak.length} color={CAMPUS.warn}
          hint="Topics with two or more unresolved mistakes - a pattern rather than a slip." />
        <GateStat label="Repeat offenders" value={allOpen.filter(m => (m.timesWrong || 0) > 1).length} color={CAMPUS.purple}
          hint="Questions you have got wrong more than once." />
      </div>

      {allOpen.length === 0 && allResolved.length === 0 ? (
        <CampusEmptyState icon={AlertTriangle} title="Nothing here - which is a good thing"
          description="Your notebook fills itself as you practise and take tests. Nothing to do." />
      ) : (
        <>
          {weak.length > 0 && (
            <CampusCard className="p-4" style={{ border: `1px solid ${CAMPUS.bad}40`, background: CAMPUS.badTint }}>
              <p className="text-[10px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.bad }}>
                CONCEPTS TO GO BACK TO, NOT JUST QUESTIONS TO REDO
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {weak.slice(0, 10).map(t => {
                  const meta = topicIndex.get(t.topicId);
                  return (
                    <button key={t.topicId} disabled={!meta}
                      onClick={meta ? () => go("subjects", { subjectId: meta.subjectId, topicId: t.topicId }) : undefined}
                      className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.bad}40`, color: CAMPUS.ink }}>
                      {meta?.title || t.topicId} <span style={{ color: CAMPUS.bad }}>×{t.hits}</span>
                    </button>
                  );
                })}
              </div>
              <CampusButton size="sm" variant="secondary" className="mt-3" onClick={() => go("practice")}>
                Practise these specifically
              </CampusButton>
            </CampusCard>
          )}

          <CampusCard className="p-4 space-y-3">
            <GateFilterRow label="WHY IT WENT WRONG" value={reason} onChange={setReason} allLabel="Any reason"
              options={MISTAKE_REASONS.map(r => ({ v: r.key, label: `${r.label}${byReason[r.key] ? ` (${byReason[r.key]})` : ""}` }))} />
            <GateFilterRow label="SUBJECT" value={subjectId} onChange={setSubjectId} allLabel="All subjects"
              options={subjectOptions} />
            <button onClick={() => setShowResolved(v => !v)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: showResolved ? CAMPUS.goodTint : CAMPUS.paper,
                border: `1px solid ${showResolved ? CAMPUS.good : CAMPUS.line}`,
                color: showResolved ? CAMPUS.good : CAMPUS.inkSoft,
              }}>
              {showResolved ? "Showing fixed ones too" : "Show the ones I've fixed"}
            </button>
          </CampusCard>

          <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
            {rows.length} entr{rows.length === 1 ? "y" : "ies"}, most-repeated first.
          </p>

          <div className="space-y-2">
            {rows.map(m => {
              const meta = topicIndex.get(m.topicId);
              const source = m.source?.startsWith("test:") ? "Test" : "Practice";
              return (
                <CampusCard key={m.key} className="p-3.5"
                  style={m.resolved ? { opacity: 0.7 } : undefined}>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CampusChip color={m.resolved ? CAMPUS.good : CAMPUS.bad}>
                        {m.resolved ? "FIXED" : (MISTAKE_REASONS.find(r => r.key === m.reason)?.label || m.reason).toUpperCase()}
                      </CampusChip>
                      {(m.timesWrong || 0) > 1 && <CampusChip color={CAMPUS.purple}>WRONG {m.timesWrong}×</CampusChip>}
                      <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                        {source}{m.year ? ` · GATE ${m.year}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!m.resolved && (
                        <CampusButton size="sm" variant="ghost" icon={Check} disabled={busy === m.key}
                          onClick={() => act(() => resolveMistake({ uid: user.uid, paperId: paper.id, source: m.source, questionId: m.questionId }), m.key)}>
                          Fixed
                        </CampusButton>
                      )}
                      <button title="Remove from notebook" disabled={busy === m.key}
                        onClick={() => act(() => clearMistake({ uid: user.uid, paperId: paper.id, source: m.source, questionId: m.questionId }), m.key)}
                        className="p-1.5 rounded" style={{ color: CAMPUS.inkFaint }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[12.5px] leading-relaxed mb-1.5" style={{ color: CAMPUS.ink }}>
                    <Inline text={m.stem} />{(m.stem || "").length >= 240 ? "…" : ""}
                  </p>
                  <span className="text-[11px] block mb-2" style={{ color: CAMPUS.inkFaint }}>
                    {meta ? `${meta.subjectName} · ${meta.title}` : "Topic no longer in the syllabus"}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {meta && (
                      <CampusButton size="sm" variant="secondary"
                        onClick={() => go("subjects", { subjectId: meta.subjectId, topicId: m.topicId })}>
                        Re-read the topic
                      </CampusButton>
                    )}
                    <select value={m.reason} disabled={busy === m.key}
                      onChange={e => act(() => setMistakeReason({
                        uid: user.uid, paperId: paper.id, source: m.source, questionId: m.questionId, reason: e.target.value,
                      }), m.key)}
                      className="text-[11.5px] px-2.5 py-1.5 rounded-lg outline-none"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                      {MISTAKE_REASONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    {m.resolved && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: CAMPUS.good }}>
                        <Undo2 size={11} /> kept for the record
                      </span>
                    )}
                  </div>
                </CampusCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
