"use client";

// Institution demo request review, for the admin console's COMMUNITY tab.
//
// Sits directly ABOVE "CAMPUS INSTITUTIONS" on purpose: a demo request is the
// step BEFORE an institution exists here at all - this is the sales inbox for
// the "Bring DeVert to your campus" pitch, and working a request is usually
// what leads to creating the institution row just below it.
//
// Loads the whole collection once (no status filter in the query) and filters
// client-side - see lib/demoRequests.js for why that avoids needing a
// composite index deployed. The old status tabs are now the DataTable's
// status filter over that same single load.

import { useEffect, useState } from "react";
import { Check, Building2, RefreshCw, X, Mail, Phone, RotateCcw, Inbox, Eye, Send, Trophy } from "lucide-react";
import { DEMO_REQUEST_STATUS, fetchDemoRequests, setDemoRequestStatus } from "@/lib/demoRequests";
import { logAdminActivity } from "@/lib/adminActivityLog";
import { KIT, fmt, StatGrid, DataTable, Pill, Drawer, DrawerSection, PrimaryButton, SecondaryButton } from "@/components/admin/admin-kit";

const STATUS_META = {
  [DEMO_REQUEST_STATUS.NEW]: { label: "New", color: KIT.orange },
  [DEMO_REQUEST_STATUS.CONTACTED]: { label: "Contacted", color: KIT.cyan },
  [DEMO_REQUEST_STATUS.CONVERTED]: { label: "Converted", color: KIT.green },
  [DEMO_REQUEST_STATUS.CLOSED]: { label: "Closed", color: KIT.muted },
};

const metaOf = (r) => STATUS_META[r.status] || STATUS_META[DEMO_REQUEST_STATUS.NEW];
const when = (t) => (t?.toDate ? t.toDate() : null);

// The one forward step available from each status, same progression the old
// per-card buttons offered: new -> contacted -> converted, with close from any
// open state and reopen from any terminal one.
function nextActions(r) {
  const s = r.status;
  const out = [];
  if (s === DEMO_REQUEST_STATUS.NEW) out.push({ next: DEMO_REQUEST_STATUS.CONTACTED, label: "Mark contacted", icon: Send });
  if (s === DEMO_REQUEST_STATUS.CONTACTED) out.push({ next: DEMO_REQUEST_STATUS.CONVERTED, label: "Mark converted", icon: Trophy });
  if (s !== DEMO_REQUEST_STATUS.CLOSED && s !== DEMO_REQUEST_STATUS.CONVERTED) out.push({ next: DEMO_REQUEST_STATUS.CLOSED, label: "Close", icon: X, danger: true });
  if (s === DEMO_REQUEST_STATUS.CLOSED || s === DEMO_REQUEST_STATUS.CONVERTED) out.push({ next: DEMO_REQUEST_STATUS.NEW, label: "Reopen", icon: RotateCcw });
  return out;
}

export function DemoRequestsPanel() {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchDemoRequests()
      .then((r) => { if (alive) setRows(r); })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        setError(e?.message || "Could not load demo requests.");
      });
    return () => { alive = false; };
  }, [nonce]);

  const refresh = () => { setError(""); setRows(null); setNonce((n) => n + 1); };

  const decide = async (r, next) => {
    setBusy(r.id);
    setError("");
    try {
      await setDemoRequestStatus(r.id, next);
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
      logAdminActivity(`demo_request.${next}`, r.institution || r.email || r.id);
    } catch (e) {
      setError(e?.message || "Could not update that request.");
    } finally {
      setBusy("");
    }
  };

  const loading = rows === null;
  const list = rows || [];
  const count = (s) => list.filter((r) => r.status === s).length;
  const converted = count(DEMO_REQUEST_STATUS.CONVERTED);
  const sources = [...new Set(list.map((r) => r.source).filter(Boolean))].sort();
  const sel = list.find((r) => r.id === openId);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "New requests", value: count(DEMO_REQUEST_STATUS.NEW), sub: "Not contacted yet", icon: Inbox, color: count(DEMO_REQUEST_STATUS.NEW) ? KIT.orange : KIT.green, loading },
        { label: "Contacted", value: count(DEMO_REQUEST_STATUS.CONTACTED), sub: "In conversation", icon: Send, color: KIT.cyan, loading },
        { label: "Converted", value: converted, sub: list.length ? `${Math.round((converted / list.length) * 100)}% of all requests` : "No requests yet", icon: Trophy, color: KIT.green, loading },
        { label: "All requests", value: list.length, sub: `${fmt(count(DEMO_REQUEST_STATUS.CLOSED))} closed`, icon: Building2, color: KIT.purple, loading },
      ]} />

      {error && (
        <p className="font-sans text-sm px-3 py-2 rounded-lg break-words [overflow-wrap:anywhere]"
          style={{ color: KIT.red, background: `${KIT.red}10`, border: `1px solid ${KIT.red}33` }}>
          {error}
        </p>
      )}

      <DataTable title="Demo requests" icon={Inbox} defaultFilters={{ status: DEMO_REQUEST_STATUS.NEW }}
        subtitle={"From the unauthenticated \"Request a demo\" dialog on the campus marketing pages - firestore.rules whitelists the fields it can write and pins status to \"new\", so nothing here can be forged by the submitter."}
        rows={list} loading={loading}
        searchKeys={["institution", "name", "email", "phone", "role", "message"]} searchPlaceholder="Search institution, contact or email..."
        filters={[
          { key: "status", label: "All statuses", get: (r) => r.status || DEMO_REQUEST_STATUS.NEW,
            options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
          ...(sources.length ? [{ key: "source", label: "All sources", options: sources.map((s) => ({ value: s, label: s })) }] : []),
        ]}
        toolbarExtra={<div className="ml-auto"><SecondaryButton icon={RefreshCw} onClick={refresh} disabled={loading}>Refresh</SecondaryButton></div>}
        onRowClick={(r) => setOpenId(r.id)} emptyText="No demo requests yet."
        columns={[
          { key: "institution", label: "Institution", render: (r) => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.institution || "(no institution given)"}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.name || "(no name)"} · {r.role || "no role"}</p>
            </div>
          ) },
          { key: "email", label: "Contact", render: (r) => (
            <div className="min-w-0 max-w-[220px]">
              <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()}
                className="font-sans text-xs hover:underline truncate block" style={{ color: KIT.cyan }}>{r.email}</a>
              {r.phone && <p className="font-sans text-xs text-white/40 truncate">{r.phone}</p>}
            </div>
          ) },
          { key: "students", label: "Size", render: (r) => <span className="font-sans text-sm text-white/70">{r.students || "Unknown"}</span> },
          { key: "source", label: "Source", render: (r) => <span className="font-sans text-xs text-white/50">{r.source || "-"}</span> },
          { key: "createdAt", label: "Received", sort: (r) => when(r.createdAt)?.getTime() || 0,
            render: (r) => <span className="font-sans text-xs text-white/50 whitespace-nowrap">{when(r.createdAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
          { key: "status", label: "Status", render: (r) => <Pill color={metaOf(r).color}>{metaOf(r).label}</Pill> },
        ]}
        rowActions={(r) => [
          { icon: Eye, label: "Details", onClick: () => setOpenId(r.id) },
          ...nextActions(r).map((a) => ({ icon: a.icon, label: a.label, danger: a.danger, disabled: busy === r.id, onClick: () => decide(r, a.next) })),
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={560}
        title={sel ? sel.institution || "(no institution given)" : ""}
        subtitle={sel ? `${metaOf(sel).label} · received ${when(sel.createdAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}` : ""}
        footer={sel ? <>
          {nextActions(sel).filter((a) => a.next !== DEMO_REQUEST_STATUS.CONTACTED && a.next !== DEMO_REQUEST_STATUS.CONVERTED).map((a) => (
            <SecondaryButton key={a.next} icon={a.icon} disabled={busy === sel.id} onClick={() => decide(sel, a.next)}>{a.label}</SecondaryButton>
          ))}
          {nextActions(sel).filter((a) => a.next === DEMO_REQUEST_STATUS.CONTACTED || a.next === DEMO_REQUEST_STATUS.CONVERTED).map((a) => (
            <PrimaryButton key={a.next} icon={Check} busy={busy === sel.id} onClick={() => decide(sel, a.next)}>{a.label}</PrimaryButton>
          ))}
        </> : null}>
        {sel && (
          <div className="space-y-4">
            <DrawerSection title="Contact">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Name</dt><dd className="text-white/85">{sel.name || "(no name)"}</dd>
                <dt className="text-white/45">Role</dt><dd className="text-white/85">{sel.role || "No role given"}</dd>
                <dt className="text-white/45">Email</dt>
                <dd><a href={`mailto:${sel.email}`} className="inline-flex items-center gap-1.5 hover:underline break-all" style={{ color: KIT.cyan }}><Mail size={13} /> {sel.email}</a></dd>
                {sel.phone && <><dt className="text-white/45">Phone</dt><dd className="text-white/85 inline-flex items-center gap-1.5"><Phone size={13} className="text-white/40" /> {sel.phone}</dd></>}
              </dl>
            </DrawerSection>
            <DrawerSection title="Institution">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Name</dt><dd className="text-white/85">{sel.institution || "(no institution given)"}</dd>
                <dt className="text-white/45">Students</dt><dd className="text-white/85">{sel.students || "Size unknown"}</dd>
                {sel.source && <><dt className="text-white/45">Source</dt><dd className="text-white/85">{sel.source}</dd></>}
              </dl>
            </DrawerSection>
            {sel.message && (
              <DrawerSection title="Message">
                <p className="font-sans text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{sel.message}</p>
              </DrawerSection>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
