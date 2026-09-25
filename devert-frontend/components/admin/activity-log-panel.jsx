"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Users, CalendarClock, Activity } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { KIT, StatGrid, DataTable, Pill } from "@/components/admin/admin-kit";

const LOG_LIMIT = 50;

const when = (t) => (t?.toDate ? t.toDate() : null);

// Rendered on app/admin/page.jsx's Overview tab -
// same collection, same live query, no product filter (a global control
// center's whole point is seeing everything, not a scoped subset - and
// avoids needing a new composite index for a where("product",...) query).
// Product/action filtering is therefore done client-side by the DataTable,
// over the same newest-50 window the live query returns.
//
// Read-only on purpose: an audit trail an admin can edit from the console
// isn't an audit trail.
export function ActivityLogPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  // Start of the local day, captured when a snapshot lands rather than read
  // during render (render must stay pure), so "today" stays in step with the data.
  const [dayStart, setDayStart] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "admin_activity_log"), orderBy("createdAt", "desc"), limit(LOG_LIMIT)),
      snap => {
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        setDayStart(midnight.getTime());
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const actors = new Set(logs.map(l => l.actor).filter(Boolean));
    const today = logs.filter(l => (when(l.createdAt)?.getTime() || 0) >= dayStart).length;
    const counts = {};
    logs.forEach(l => { if (l.action) counts[l.action] = (counts[l.action] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { actors: actors.size, today, top };
  }, [logs, dayStart]);

  const productOf = (l) => l.product || "core";
  const products = [...new Set(logs.map(productOf))].sort();
  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Entries loaded", value: logs.length, sub: `Newest ${LOG_LIMIT}, live`, icon: ClipboardList, color: KIT.cyan, loading },
        { label: "Distinct actors", value: stats.actors, sub: "Admins in this window", icon: Users, color: KIT.purple, loading },
        { label: "Today", value: stats.today, sub: "Actions since midnight", icon: CalendarClock, color: KIT.green, loading },
        { label: "Most common action", value: stats.top ? stats.top[0] : "-", sub: stats.top ? `${stats.top[1]} of ${logs.length} entries` : "No entries yet", icon: Activity, color: KIT.orange, loading },
      ]} />

      <DataTable title="Admin activity" icon={ClipboardList}
        subtitle="Every logged admin action, newest first. Updates live as other admins work."
        rows={logs} loading={loading}
        searchKeys={["action", "detail", "actor"]} searchPlaceholder="Search action, detail or actor..."
        filters={[
          { key: "product", label: "All products", get: productOf, options: products.map(p => ({ value: p, label: p })) },
          { key: "action", label: "All actions", options: actions.map(a => ({ value: a, label: a })) },
        ]}
        emptyText="No admin activity logged yet."
        columns={[
          { key: "action", label: "Action", render: l => <Pill color={KIT.green}>{l.action || "-"}</Pill> },
          { key: "detail", label: "Detail", render: l => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm text-white/80 truncate" title={l.detail || ""}>{l.detail || "-"}</p>
            </div>
          ) },
          { key: "actor", label: "Actor", render: l => <span className="font-sans text-xs text-white/60 break-all">{l.actor || "-"}</span> },
          { key: "product", label: "Product", sort: productOf, render: l => <Pill color={productOf(l) === "core" ? KIT.muted : KIT.cyan}>{productOf(l)}</Pill> },
          { key: "createdAt", label: "Time", sort: l => when(l.createdAt)?.getTime() || 0,
            render: l => <span className="font-sans text-xs text-white/50 whitespace-nowrap">{when(l.createdAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
        ]}
      />
    </div>
  );
}
