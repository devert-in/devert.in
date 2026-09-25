"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Star, Users, CheckCircle2, Type, Eye, RefreshCw, Check, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { KIT, fmt, StatGrid, DataTable, Pill, ProgressBar, Drawer, DrawerSection, SecondaryButton } from "@/components/admin/admin-kit";

// The six portfolio sections a profile can fill, in the order /u/{handle}
// renders them. portfolioCompleteness counts how many are non-empty.
const SECTIONS = [
  { key: "headline",       label: "Headline",       has: u => !!u.headline,               count: () => null },
  { key: "experience",     label: "Experience",     has: u => !!u.experience?.length,     count: u => u.experience?.length || 0 },
  { key: "education",      label: "Education",      has: u => !!u.education?.length,      count: u => u.education?.length || 0 },
  { key: "certifications", label: "Certifications", has: u => !!u.certifications?.length, count: u => u.certifications?.length || 0 },
  { key: "achievements",   label: "Achievements",   has: u => !!u.achievements?.length,   count: u => u.achievements?.length || 0 },
  { key: "skills",         label: "Skills",         has: u => !!u.skills?.length,         count: u => u.skills?.length || 0 },
];

function portfolioCompleteness(u) {
  return SECTIONS.filter(s => s.has(u)).length;
}

const when = (t) => (t?.toDate ? t.toDate() : null);

// Mirrors ShipyardPanel's lighter list+search+inline-action pattern (not
// PulseModerationPanel's pending-queue) - portfolios publish immediately,
// there's no approval gate to model here. Read-only: the only action is
// opening the live portfolio.
export default function PortfoliosPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")))
      .then(snap => { if (alive) setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [nonce]);

  const refresh = () => { setLoading(true); setNonce(n => n + 1); };

  // Only profiles with at least one filled section are listed - an untouched
  // profile has no portfolio to review.
  const withContent = users
    .map(u => ({ ...u, _filled: portfolioCompleteness(u) }))
    .filter(u => u._filled > 0);
  const complete = withContent.filter(u => u._filled === SECTIONS.length).length;
  const withHeadline = withContent.filter(u => !!u.headline).length;
  const sel = withContent.find(u => u.id === openId);
  const openLive = (u) => window.open(`/u/${u.handle}`, "_blank", "noopener");

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Users loaded", value: users.length, sub: "All accounts", icon: Users, color: KIT.cyan, loading },
        { label: "With portfolio content", value: withContent.length, sub: users.length ? `${Math.round((withContent.length / users.length) * 100)}% of users` : "No users yet", icon: Star, color: KIT.gold, loading },
        { label: "Fully complete", value: complete, sub: `All ${SECTIONS.length} sections filled`, icon: CheckCircle2, color: KIT.green, loading },
        { label: "Headline set", value: withHeadline, sub: "Of portfolios with content", icon: Type, color: KIT.purple, loading },
      ]} />

      <DataTable title="Portfolios" icon={Star}
        subtitle="Profiles with at least one portfolio section filled. Portfolios publish immediately - there is no approval step."
        rows={withContent} loading={loading}
        searchKeys={["handle", "headline", "displayName"]} searchPlaceholder="Search handle or headline..."
        filters={[
          { key: "completeness", label: "Any completeness", get: u => (u._filled === SECTIONS.length ? "complete" : "partial"),
            options: [{ value: "complete", label: "Fully complete" }, { value: "partial", label: "Partially filled" }] },
          { key: "hasHeadline", label: "Any headline", get: u => (u.headline ? "yes" : "no"),
            options: [{ value: "yes", label: "Headline set" }, { value: "no", label: "No headline" }] },
        ]}
        toolbarExtra={<div className="ml-auto"><SecondaryButton icon={RefreshCw} onClick={refresh} disabled={loading}>Refresh</SecondaryButton></div>}
        onRowClick={u => setOpenId(u.id)} emptyText="No portfolios with content yet."
        columns={[
          { key: "handle", label: "Developer", render: u => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">@{u.handle}</p>
              <p className="font-sans text-xs text-white/40 truncate">{u.headline || "No headline set"}</p>
            </div>
          ) },
          { key: "_filled", label: "Completeness", sort: u => u._filled, render: u => (
            <div className="w-[120px]">
              <ProgressBar value={(u._filled / SECTIONS.length) * 100} />
              <p className="font-sans text-[11px] text-white/40 mt-1 tabular-nums">{u._filled}/{SECTIONS.length} sections</p>
            </div>
          ) },
          { key: "experience", label: "Experience", sort: u => u.experience?.length || 0, render: u => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(u.experience?.length || 0)}</span> },
          { key: "skills", label: "Skills", sort: u => u.skills?.length || 0, render: u => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(u.skills?.length || 0)}</span> },
          { key: "joinedAt", label: "Joined", sort: u => when(u.joinedAt)?.getTime() || 0,
            render: u => <span className="font-sans text-xs text-white/50">{when(u.joinedAt)?.toLocaleDateString("en-IN", { dateStyle: "medium" }) || "-"}</span> },
        ]}
        rowActions={u => [
          { icon: Eye, label: "Details", onClick: () => setOpenId(u.id) },
          u.handle && { icon: ExternalLink, label: "View live portfolio", onClick: () => openLive(u) },
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={560}
        title={sel ? `@${sel.handle}` : ""}
        subtitle={sel ? `${sel._filled}/${SECTIONS.length} sections filled` : ""}
        footer={sel?.handle ? <SecondaryButton icon={ExternalLink} onClick={() => openLive(sel)}>View live portfolio</SecondaryButton> : null}>
        {sel && (
          <div className="space-y-4">
            {sel.headline && <p className="font-sans text-sm text-white/70 leading-relaxed">{sel.headline}</p>}
            <DrawerSection title="Sections" hint="What this portfolio shows on /u/{handle}.">
              <ul className="space-y-2">
                {SECTIONS.map(s => {
                  const on = s.has(sel);
                  const n = s.count(sel);
                  return (
                    <li key={s.key} className="flex items-center justify-between gap-3 font-sans text-sm">
                      <span className="flex items-center gap-2 text-white/80">
                        {on ? <Check size={14} style={{ color: KIT.green }} /> : <X size={14} style={{ color: KIT.muted }} />}
                        {s.label}
                      </span>
                      {on
                        ? <Pill color={KIT.green}>{n === null ? "Set" : `${fmt(n)} ${n === 1 ? "entry" : "entries"}`}</Pill>
                        : <Pill color={KIT.muted}>Empty</Pill>}
                    </li>
                  );
                })}
              </ul>
            </DrawerSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}
