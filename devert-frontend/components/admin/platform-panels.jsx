"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Shield, KeyRound, Layers, Database, Eye, CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { KIT, StatGrid, DataTable, Drawer, Pill, ProgressBar } from "@/components/admin/admin-kit";
import { ROLE_CATALOG, PERMISSIONS, PERMISSION_LABELS, FALLBACK_ROLE_PERMISSIONS } from "@/lib/permissions";
import { logAdminActivity } from "@/lib/adminActivityLog";
import { FEATURES, isFeatureEnabled, setFeatureEnabled, useFeatureFlags } from "@/lib/featureFlags";

// Ecosystem-wide panels for /admin's Operations group. Roles came from the
// separate /manage "control center" page, which was folded into /admin (one
// admin console, per CLAUDE.md) and now 301s there via firebase.json. Its old
// "visibility only" product registry is replaced by real feature switches.

// One row per entry in lib/featureFlags.js's FEATURES. Flipping a switch
// writes system/featureFlags, and every open tab on all three sites picks it
// up live - components/feature-gate.jsx swaps the pages for a "turned off"
// screen and the navbars drop the entry. Turning OFF asks for confirmation;
// turning back ON is one click, since that is the recovery path.
export function FeatureSwitchesPanel() {
  const flags = useFeatureFlags();
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");
  const [confirmKey, setConfirmKey] = useState(null);

  const groups = [...new Set(FEATURES.map(f => f.group))];
  const offCount = FEATURES.filter(f => !isFeatureEnabled(flags, f.key)).length;

  const flip = async (f, enabled) => {
    setSaving(f.key);
    setError("");
    try {
      await setFeatureEnabled(f.key, enabled);
      logAdminActivity(enabled ? "feature.enable" : "feature.disable", f.label, "global");
    } catch (err) {
      setError(err?.message || "Could not save that switch.");
    } finally {
      setSaving(null);
      setConfirmKey(null);
    }
  };

  if (!flags.ready) return <p className="font-sans text-sm text-white/35 animate-pulse">Loading switches...</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg px-4 py-3 border"
        style={{ background: offCount ? "rgba(255,149,0,0.06)" : "rgba(0,255,65,0.04)", borderColor: offCount ? "rgba(255,149,0,0.25)" : "rgba(0,255,65,0.18)" }}>
        <p className="font-sans text-sm" style={{ color: offCount ? "#FF9500" : "rgba(255,255,255,0.65)" }}>
          {offCount
            ? `${offCount} feature${offCount === 1 ? " is" : "s are"} turned off for every user, admins included.`
            : "Everything is on. Turning a feature off hides it from the menus and replaces its pages with a \"turned off\" screen for every user - instantly, on all three sites."}
        </p>
      </div>

      {error && (
        <p className="font-sans text-sm px-3 py-2 rounded-lg" style={{ color: "#FF9A9A", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>{error}</p>
      )}

      {groups.map(g => (
        <div key={g}>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-2">{g}</p>
          <div className="rounded-lg border border-white/8 divide-y divide-white/6 overflow-hidden">
            {FEATURES.filter(f => f.group === g).map(f => {
              const on = isFeatureEnabled(flags, f.key);
              const where = f.app ? `${f.app}.devert.in` : f.paths.join(", ");
              return (
                <div key={f.key} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-white/90">{f.label}</p>
                    <p className="font-sans text-xs text-white/40 truncate">{f.desc} <span className="font-mono text-white/25">{where}</span></p>
                  </div>
                  {confirmKey === f.key ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-sans text-xs text-white/50 hidden sm:inline">Turn off for everyone?</span>
                      <button onClick={() => flip(f, false)} disabled={saving === f.key}
                        className="font-sans text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50"
                        style={{ background: "#FF5050", color: "#05080F" }}>
                        {saving === f.key ? "Saving..." : "Turn off"}
                      </button>
                      <button onClick={() => setConfirmKey(null)} className="font-sans text-xs text-white/50 px-2 py-1.5 hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button role="switch" aria-checked={on} aria-label={`${f.label} ${on ? "on" : "off"}`}
                      disabled={saving === f.key}
                      onClick={() => (on ? setConfirmKey(f.key) : flip(f, true))}
                      className="flex items-center gap-2.5 flex-shrink-0 disabled:opacity-50">
                      <span className="font-sans text-xs w-6 text-right" style={{ color: on ? "#00FF41" : "rgba(255,255,255,0.4)" }}>{on ? "On" : "Off"}</span>
                      <span className="relative w-10 h-[22px] rounded-full transition-colors"
                        style={{ background: on ? "#00FF41" : "rgba(255,255,255,0.14)" }}>
                        <span className="absolute top-[3px] w-4 h-4 rounded-full transition-all"
                          style={{ left: on ? 21 : 3, background: on ? "#05080F" : "rgba(255,255,255,0.7)" }} />
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="font-sans text-xs text-white/30 leading-relaxed">
        The admin console and login can never be switched off, so there is always a way back in.
        Switches stop the pages and menus people use; they do not change database rules.
      </p>
    </div>
  );
}

// Read-only: roles are defined in lib/permissions.js and their defaults are
// seeded into system/rolePermissionDefaults (scripts/seed-role-permission-
// defaults.mjs). firestore.rules' hasPermission() enforces them; this view
// shows what is actually seeded, falling back to the code copy if the doc is
// missing - and says which one you are looking at.
export function RolesPanel() {
  const [live, setLive] = useState(undefined); // undefined loading, null missing
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    let alive = true;
    getDoc(doc(db, "system", "rolePermissionDefaults"))
      .then(snap => alive && setLive(snap.exists() ? snap.data() : null))
      .catch(() => alive && setLive(null));
    return () => { alive = false; };
  }, []);

  const source = live || FALLBACK_ROLE_PERMISSIONS;
  const granted = (key) => PERMISSIONS.filter(p => source?.[key]?.[p] === true);
  const rows = [
    ...Object.entries(ROLE_CATALOG).map(([key, r]) => ({ id: key, label: r.label, scope: r.scopeType, n: granted(key).length })),
    { id: "institutionAdmin", label: "Institution Admin", scope: "institution", n: PERMISSIONS.length, note: "via institutions/{id}/admins - full access to its institution" },
  ];
  const sel = rows.find(r => r.id === openKey);
  const loading = live === undefined;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Roles", value: rows.length, sub: "Campus staff roles", icon: Shield, color: KIT.purple },
        { label: "Permissions", value: PERMISSIONS.length, sub: "In the catalog", icon: KeyRound, color: KIT.cyan },
        { label: "Scope levels", value: new Set(rows.map(r => r.scope)).size, sub: "Institution, department, classroom", icon: Layers, color: KIT.orange },
        { label: "Defaults source", value: loading ? "..." : live ? "Seeded" : "Code fallback", sub: live ? "system/rolePermissionDefaults" : "Doc missing - run the seed script", icon: Database, color: live ? KIT.green : KIT.orange },
      ]} />
      <DataTable title="Campus roles" icon={Shield} subtitle="Default permissions per role. Enforced by firestore.rules; read-only here."
        rows={rows} loading={loading} onRowClick={r => setOpenKey(r.id)}
        columns={[
          { key: "label", label: "Role", render: r => (
            <div className="min-w-0 w-[260px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.label}</p>
              <p className="font-mono text-xs text-white/40 truncate">{r.id}</p>
            </div>
          ) },
          { key: "scope", label: "Scope", render: r => <Pill color={KIT.cyan}>{r.scope}</Pill> },
          { key: "n", label: "Permissions", render: r => <ProgressBar value={(100 * r.n) / PERMISSIONS.length} /> },
        ]}
        rowActions={r => [{ icon: Eye, label: "View permissions", onClick: () => setOpenKey(r.id) }]}
      />
      <Drawer open={!!sel} onClose={() => setOpenKey(null)} width={560} title={sel?.label || ""}
        subtitle={sel ? `${sel.n} of ${PERMISSIONS.length} permissions · scope: ${sel.scope}` : ""}>
        {sel && (
          <div className="space-y-3">
            {sel.note && <p className="font-sans text-sm text-white/60">{sel.note}</p>}
            <div className="rounded-lg border divide-y overflow-hidden" style={{ borderColor: KIT.line }}>
              {PERMISSIONS.map(p => {
                const on = sel.id === "institutionAdmin" || source?.[sel.id]?.[p] === true;
                return (
                  <div key={p} className="flex items-center gap-3 px-3 py-2" style={{ borderColor: KIT.line }}>
                    {on ? <CheckCircle2 size={14} style={{ color: KIT.green }} /> : <XCircle size={14} className="text-white/25" />}
                    <span className={`font-sans text-sm ${on ? "text-white/85" : "text-white/40"}`}>{PERMISSION_LABELS[p] || p}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
