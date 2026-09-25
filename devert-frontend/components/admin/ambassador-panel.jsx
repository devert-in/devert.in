"use client";

// Ambassador application review, for the admin console's COMMUNITY tab.
//
// Lives inside an existing tab rather than becoming its own top-level admin
// surface, per CLAUDE.md's rule about the admin console.
//
// Approving is the only action that grants anything, and it is the only one that
// writes `status` - which firestore.rules restricts to isAdmin(). The applicant
// can amend their own details while pending but can never move their own status,
// so this panel is the single place the decision actually happens.
//
// All four statuses are fetched in parallel (one single-field where(status) query
// each - see fetchAmbassadorApplications for why that shape avoids a composite
// index) and merged, so the old status tabs become a table filter and the stat
// cards can count every bucket at once.

import { useEffect, useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, X, Users, RefreshCw, Ban, Clock, Eye, UserCheck, ClipboardList } from "lucide-react";
import { AMBASSADOR_STATUS, fetchAmbassadorApplications } from "@/lib/ambassadors";
import { writeNotification } from "@/components/notification-bell";
import { logAdminActivity } from "@/lib/adminActivityLog";
import { KIT, fmt, StatGrid, DataTable, Pill, Drawer, DrawerSection, PrimaryButton, SecondaryButton } from "@/components/admin/admin-kit";

const STATUS_META = {
  [AMBASSADOR_STATUS.PENDING]: { label: "Pending", color: KIT.orange },
  [AMBASSADOR_STATUS.ACTIVE]: { label: "Active", color: KIT.green },
  [AMBASSADOR_STATUS.REJECTED]: { label: "Rejected", color: KIT.red },
  [AMBASSADOR_STATUS.SUSPENDED]: { label: "Suspended", color: KIT.muted },
};

const DECISION_NOTES = {
  [AMBASSADOR_STATUS.ACTIVE]: { title: "You're a DeVert Campus Ambassador", body: "Your application was approved. Your referral link is live and DeVert Pro is on for you." },
  [AMBASSADOR_STATUS.REJECTED]: { title: "About your ambassador application", body: "Your application wasn't taken forward this time." },
  [AMBASSADOR_STATUS.SUSPENDED]: { title: "Ambassador access paused", body: "Your ambassador access has been suspended. Reach out if you think that's wrong." },
};

const metaOf = (a) => STATUS_META[a.status] || { label: a.status || "-", color: KIT.muted };
const when = (t) => (t?.toDate ? t.toDate() : null);

// The decisions available from each status - identical to the old per-tab
// buttons: pending -> approve/reject, active -> suspend, rejected/suspended -> reinstate.
function decisionsFor(a) {
  switch (a.status) {
    case AMBASSADOR_STATUS.PENDING:
      return [
        { next: AMBASSADOR_STATUS.ACTIVE, label: "Approve", icon: Check, primary: true },
        { next: AMBASSADOR_STATUS.REJECTED, label: "Reject", icon: X, danger: true },
      ];
    case AMBASSADOR_STATUS.ACTIVE:
      return [{ next: AMBASSADOR_STATUS.SUSPENDED, label: "Suspend", icon: Ban, danger: true }];
    case AMBASSADOR_STATUS.REJECTED:
    case AMBASSADOR_STATUS.SUSPENDED:
      return [{ next: AMBASSADOR_STATUS.ACTIVE, label: "Reinstate", icon: Check, primary: true }];
    default:
      return [];
  }
}

export function AmbassadorPanel() {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(Object.values(AMBASSADOR_STATUS).map((s) => fetchAmbassadorApplications(s)))
      .then((lists) => {
        if (!alive) return;
        // Each list is already newest-first; re-sort the merge the same way.
        const ms = (t) => (t?.toMillis ? t.toMillis() : 0);
        setRows(lists.flat().sort((a, b) => ms(b.appliedAt) - ms(a.appliedAt)));
      })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        // Saying so beats an empty list that looks like "no applications".
        setError(e?.message || "Could not load applications.");
      });
    return () => { alive = false; };
  }, [nonce]);

  const refresh = () => { setError(""); setRows(null); setNonce((n) => n + 1); };

  const decide = async (uid, next) => {
    setBusy(uid);
    setError("");
    try {
      await updateDoc(doc(db, "ambassadors", uid), {
        status: next,
        decidedAt: serverTimestamp(),
      });
      // The applicant otherwise only finds out by revisiting /ambassador.
      const note = DECISION_NOTES[next];
      if (note) writeNotification(uid, { type: "ambassador", ...note, ctaHref: "/ambassador", ctaLabel: "Open" });
      logAdminActivity(`ambassador.${next}`, uid);
      setNonce((n) => n + 1);
    } catch (e) {
      setError(e?.message || "Could not update that application.");
    } finally {
      setBusy("");
    }
  };

  const loading = rows === null;
  const list = rows || [];
  const count = (s) => list.filter((a) => a.status === s).length;
  const pending = count(AMBASSADOR_STATUS.PENDING);
  const sel = list.find((a) => a.id === openId);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Pending review", value: pending, sub: "Awaiting a decision", icon: Clock, color: pending ? KIT.orange : KIT.green, loading },
        { label: "Active ambassadors", value: count(AMBASSADOR_STATUS.ACTIVE), sub: "Codes crediting signups", icon: UserCheck, color: KIT.green, loading },
        { label: "Suspended", value: count(AMBASSADOR_STATUS.SUSPENDED), sub: `${fmt(count(AMBASSADOR_STATUS.REJECTED))} rejected`, icon: Ban, color: KIT.red, loading },
        { label: "All applications", value: list.length, sub: "Every status", icon: ClipboardList, color: KIT.cyan, loading },
      ]} />

      {error && (
        <p className="font-sans text-sm px-3 py-2 rounded-lg break-words [overflow-wrap:anywhere]"
          style={{ color: KIT.red, background: `${KIT.red}10`, border: `1px solid ${KIT.red}33` }}>
          {error}
        </p>
      )}

      <DataTable title="Ambassador applications" icon={Users} defaultFilters={{ status: "pending" }}
        subtitle={"A code only starts crediting signups once its ambassador is Active. Suspending stops future attribution but never rewrites past credit - referrals/{uid} is write-once by rule."}
        rows={list} loading={loading}
        searchKeys={["collegeName", "displayName", "email", "city", "referralCode", "uid"]} searchPlaceholder="Search college, name, email or code..."
        filters={[
          { key: "status", label: "All statuses", options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
        ]}
        toolbarExtra={<div className="ml-auto"><SecondaryButton icon={RefreshCw} onClick={refresh} disabled={loading}>Refresh</SecondaryButton></div>}
        onRowClick={(a) => setOpenId(a.id)} emptyText="No ambassador applications yet."
        columns={[
          { key: "collegeName", label: "College", render: (a) => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{a.collegeName || "(no college given)"}</p>
              <p className="font-sans text-xs text-white/40 truncate">{a.displayName || a.uid} · {a.city || "no city"}</p>
            </div>
          ) },
          { key: "email", label: "Email", render: (a) => <span className="font-sans text-xs text-white/60 break-all">{a.email || "No email"}</span> },
          { key: "referralCode", label: "Code", render: (a) => <span className="font-mono text-xs" style={{ color: KIT.green }}>{a.referralCode || "-"}</span> },
          { key: "expectedReach", label: "Claimed reach", sort: (a) => Number(a.expectedReach) || 0,
            render: (a) => <span className="font-sans text-sm text-white/70 tabular-nums">{a.expectedReach ? fmt(Number(a.expectedReach) || a.expectedReach) : "-"}</span> },
          { key: "appliedAt", label: "Applied", sort: (a) => when(a.appliedAt)?.getTime() || 0,
            render: (a) => <span className="font-sans text-xs text-white/50 whitespace-nowrap">{when(a.appliedAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
          { key: "status", label: "Status", render: (a) => <Pill color={metaOf(a).color}>{metaOf(a).label}</Pill> },
        ]}
        rowActions={(a) => [
          { icon: Eye, label: "Review", onClick: () => setOpenId(a.id) },
          ...decisionsFor(a).map((d) => ({ icon: d.icon, label: d.label, danger: d.danger, disabled: busy === a.uid, onClick: () => decide(a.uid, d.next) })),
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={560}
        title={sel ? sel.collegeName || "(no college given)" : ""}
        subtitle={sel ? `${sel.displayName || sel.uid} · ${metaOf(sel).label}` : ""}
        footer={sel ? <>
          {decisionsFor(sel).filter((d) => !d.primary).map((d) => (
            <SecondaryButton key={d.next} icon={d.icon} disabled={busy === sel.uid} onClick={() => decide(sel.uid, d.next)}>{d.label}</SecondaryButton>
          ))}
          {decisionsFor(sel).filter((d) => d.primary).map((d) => (
            <PrimaryButton key={d.next} icon={d.icon} busy={busy === sel.uid} onClick={() => decide(sel.uid, d.next)}>{d.label}</PrimaryButton>
          ))}
        </> : null}>
        {sel && (
          <div className="space-y-4">
            <DrawerSection title="Applicant">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Name</dt><dd className="text-white/85">{sel.displayName || "-"}</dd>
                <dt className="text-white/45">UID</dt><dd className="font-mono text-xs text-white/70 break-all">{sel.uid}</dd>
                <dt className="text-white/45">Email</dt><dd className="text-white/85 break-all">{sel.email || "No email"}</dd>
                <dt className="text-white/45">College</dt><dd className="text-white/85">{sel.collegeName || "(no college given)"}</dd>
                <dt className="text-white/45">City</dt><dd className="text-white/85">{sel.city || "No city"}</dd>
              </dl>
            </DrawerSection>
            <DrawerSection title="Referral" hint="Credits signups only while the ambassador is Active.">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Code</dt><dd className="font-mono" style={{ color: KIT.green }}>{sel.referralCode || "-"}</dd>
                <dt className="text-white/45">Claimed reach</dt><dd className="text-white/85">{sel.expectedReach ? `${sel.expectedReach} students` : "Not given"}</dd>
                <dt className="text-white/45">Applied</dt><dd className="text-white/85">{when(sel.appliedAt)?.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) || "-"}</dd>
                {when(sel.decidedAt) && <><dt className="text-white/45">Decided</dt><dd className="text-white/85">{when(sel.decidedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</dd></>}
              </dl>
            </DrawerSection>
            {sel.whyMe && (
              <DrawerSection title="Why me">
                <p className="font-sans text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{sel.whyMe}</p>
              </DrawerSection>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
