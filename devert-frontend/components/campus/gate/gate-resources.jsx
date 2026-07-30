"use client";

import { useMemo, useState } from "react";
import {
  BookOpen, ExternalLink, FileText, Library, Megaphone, Pin, PlaySquare, ScrollText,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusSkeleton, CampusEmptyState,
} from "@/components/campus/campus-ui";
import { Inline } from "@/components/campus/lesson-blocks";
import { fetchResources, fetchAnnouncements, RESOURCE_KINDS } from "@/lib/gateLibrary";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { useGate } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateFilterRow } from "@/components/campus/gate/gate-ui";

// Resources and announcements. Small on purpose: this is a shelf of pointers, not
// another content system. Everything a student should actually study lives in
// Subjects, PYQs and the Formula Book - a resources tab that tries to compete with
// those just fragments where a student looks for things.
//
// External links open in a new tab with rel="noreferrer" - these are
// admin-authored URLs pointing off-platform, and the referrer of a student's
// preparation session is not something to leak to third parties.

const KIND_ICON = {
  book: BookOpen,
  video: PlaySquare,
  notes: FileText,
  paper: ScrollText,
  link: ExternalLink,
};

export function GateResources() {
  const { paper, tree } = useGate();
  const [kind, setKind] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [resources] = useKeyedFetch(paper?.id, () => fetchResources(paper.id), { fallback: [] });
  const [announcements] = useKeyedFetch(paper?.id, () => fetchAnnouncements(paper.id), { fallback: [] });

  const subjectNames = useMemo(() => new Map((tree || []).map(s => [s.id, s.name])), [tree]);

  const filtered = useMemo(() => {
    if (!resources) return [];
    return resources
      .filter(r => !kind || (r.kind || "link") === kind)
      .filter(r => !subjectId || r.subjectId === subjectId);
  }, [resources, kind, subjectId]);

  const availableKinds = useMemo(() => {
    if (!resources) return [];
    return RESOURCE_KINDS.filter(k => resources.some(r => (r.kind || "link") === k.key));
  }, [resources]);

  if (resources === null) return <CampusCard className="p-4"><CampusSkeleton height={200} /></CampusCard>;

  return (
    <div className="space-y-5">
      <GateSectionHeading label="RESOURCES" icon={Library} title="Resources"
        description="Books, lecture series, notes and past papers worth your time, plus any announcements about this paper." />

      {announcements?.length > 0 && (
        <div className="space-y-2">
          {announcements.map(a => (
            <CampusCard key={a.id} className="p-4"
              style={a.pinned ? { border: `1px solid ${CAMPUS.gold}40`, background: CAMPUS.goldTint } : undefined}>
              <div className="flex items-center gap-2 mb-1.5">
                {a.pinned
                  ? <Pin size={13} style={{ color: CAMPUS.gold }} />
                  : <Megaphone size={13} style={{ color: CAMPUS.blue }} />}
                <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{a.title}</b>
                {a.pinned && <CampusChip color={CAMPUS.gold}>PINNED</CampusChip>}
                {a.createdAt?.toDate && (
                  <span className="text-[10.5px] font-mono ml-auto" style={{ color: CAMPUS.inkFaint }}>
                    {a.createdAt.toDate().toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>
                <Inline text={a.body} />
              </p>
            </CampusCard>
          ))}
        </div>
      )}

      {resources.length === 0 ? (
        <CampusEmptyState icon={Library} title="No resources listed yet"
          description="Recommended books, lecture series and past papers are curated per paper in /admin. Nothing is listed here until someone has actually vetted it." />
      ) : (
        <>
          <CampusCard className="p-4 space-y-3">
            {availableKinds.length > 1 && (
              <GateFilterRow label="TYPE" value={kind} onChange={setKind} allLabel="Everything"
                options={availableKinds.map(k => ({ v: k.key, label: k.label }))} />
            )}
            <GateFilterRow label="SUBJECT" value={subjectId} onChange={setSubjectId} allLabel="All subjects"
              options={(tree || []).map(s => ({ v: s.id, label: s.name }))} />
          </CampusCard>

          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(r => {
              const Icon = KIND_ICON[r.kind || "link"] || ExternalLink;
              const inner = (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <b className="text-[13px] block" style={{ color: CAMPUS.ink }}>{r.title}</b>
                      {r.author && <span className="text-[11px] block" style={{ color: CAMPUS.inkFaint }}>{r.author}</span>}
                    </div>
                    {r.url && <ExternalLink size={13} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                  </div>
                  {r.description && (
                    <p className="text-[11.5px] leading-relaxed mt-2.5" style={{ color: CAMPUS.inkSoft }}>{r.description}</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap mt-2.5">
                    <CampusChip color={CAMPUS.blue}>
                      {(RESOURCE_KINDS.find(k => k.key === (r.kind || "link"))?.label || "Link").toUpperCase()}
                    </CampusChip>
                    {r.subjectId && subjectNames.get(r.subjectId) && (
                      <CampusChip color={CAMPUS.inkFaint}>{subjectNames.get(r.subjectId)}</CampusChip>
                    )}
                  </div>
                </>
              );
              return r.url ? (
                <CampusCard key={r.id} hover as="a" href={r.url} target="_blank" rel="noreferrer noopener"
                  className="p-4 block cursor-pointer">
                  {inner}
                </CampusCard>
              ) : (
                <CampusCard key={r.id} className="p-4">{inner}</CampusCard>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <CampusCard className="p-5">
              <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>Nothing matches those filters.</p>
            </CampusCard>
          )}
        </>
      )}
    </div>
  );
}
