"use client";

// Users > Score integrity - is a user's XP actually earned?
//
// XP is only legitimate when it traces back to a source. Today every XP source
// writes a reward_grants ledger entry (learning modules via lib/rewards.js,
// admin manual grants, streak milestones from Cloud Functions); CodeLab, Arena
// and contests grant none; Placements Prep XP lives on prepProgress, not here.
// XP leaves through Wallet conversion (coin_transactions type xp_convert).
// So for each account:  expected XP = sum(ledger xp) - converted coins * XP_PER_COIN
// and anything above that is unexplained.
//
// Being backed by the ledger proves the grant happened, NOT that it was earned
// honestly: rewards are still granted from the browser (CLAUDE.md), so the
// pacing signals below - how fast topic rewards arrive - are what separate
// study from click-through or scripting. Read-only; nothing here writes.

import { useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { ShieldCheck, AlertTriangle, Gauge, Users, Play, Eye } from "lucide-react";
import { db } from "@/lib/firebase";
import { ECONOMY, loadEconomy } from "@/lib/economy";
import { getTier } from "@/context/AuthContext";
import { KIT, StatGrid, DataTable, Drawer, DrawerSection, Pill, PrimaryButton, fmt } from "@/components/admin/admin-kit";

const UNEXPLAINED_LIMIT = 200;   // xp - tolerance for pre-ledger history
const FAST_MEDIAN_S = 30;        // a lesson + quiz in under 30s is not reading
const BURST_PER_DAY = 100;

async function auditUser(u, xpPerCoin) {
  const [gSnap, cSnap] = await Promise.all([
    getDocs(query(collection(db, "reward_grants"), where("uid", "==", u.id))),
    getDocs(query(collection(db, "coin_transactions"), where("uid", "==", u.id), where("type", "==", "xp_convert"))),
  ]);
  const grants = gSnap.docs.map((d) => d.data());
  const ledgerXp = grants.reduce((n, g) => n + (g.xp || 0), 0);
  const convertedCoins = cSnap.docs.reduce((n, d) => n + (d.data().amount || 0), 0);
  const expected = ledgerXp - convertedCoins * xpPerCoin;
  const unexplained = (u.xp || 0) - expected;

  const timed = grants.filter((g) => g.grantedAt?.toMillis && /_topic$/.test(g.activityType || ""))
    .map((g) => g.grantedAt.toMillis()).sort((a, b) => a - b);
  const gaps = timed.slice(1).map((t, i) => (t - timed[i]) / 1000);
  const sorted = [...gaps].sort((a, b) => a - b);
  const medianGap = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const under20 = gaps.filter((g) => g < 20).length;
  const perDay = {};
  for (const g of grants) {
    const t = g.grantedAt?.toDate?.();
    if (t) { const k = t.toISOString().slice(0, 10); perDay[k] = (perDay[k] || 0) + 1; }
  }
  const [busiestDay, busiestCount] = Object.entries(perDay).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  const byType = {};
  for (const g of grants) byType[g.activityType] = (byType[g.activityType] || 0) + (g.xp || 0);

  const flags = [];
  if (unexplained > UNEXPLAINED_LIMIT) flags.push({ level: "high", text: `${fmt(Math.round(unexplained))} XP is not backed by any ledger entry.` });
  if (medianGap !== null && timed.length >= 20 && medianGap < FAST_MEDIAN_S) flags.push({ level: "medium", text: `Topic rewards arrive every ${Math.round(medianGap)}s (median) - a lesson plus quiz that fast isn't being read.` });
  if (busiestCount > BURST_PER_DAY) flags.push({ level: "medium", text: `${busiestCount} rewards on ${busiestDay} alone.` });
  return {
    id: u.id, handle: u.handle || "", name: u.displayName || u.handle || u.id, email: u.email || "", institution: u.institutionId || "",
    xp: u.xp || 0, ledgerXp, convertedCoins, expected, unexplained, grants: grants.length, medianGap, under20,
    busiestDay, busiestCount, byType, flags, risk: flags.some((f) => f.level === "high") ? "high" : flags.length ? "medium" : "clean",
  };
}

export function ScoreAuditPanel() {
  const [rows, setRows] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [size, setSize] = useState(50);
  const [openId, setOpenId] = useState(null);

  const run = async () => {
    setRunning(true); setProgress(0); setRows(null);
    await loadEconomy().catch(() => {});
    const xpPerCoin = ECONOMY.XP_PER_COIN || 5;
    const users = (await getDocs(query(collection(db, "users"), orderBy("xp", "desc"), limit(size)))).docs.map((d) => ({ id: d.id, ...d.data() }));
    const out = [];
    for (let i = 0; i < users.length; i += 5) {
      out.push(...(await Promise.all(users.slice(i, i + 5).map((u) => auditUser(u, xpPerCoin).catch(() => null)))).filter(Boolean));
      setProgress(Math.min(users.length, i + 5) / users.length);
    }
    // Possible duplicate people: same display name on more than one account.
    const byName = {};
    for (const r of out) { const k = r.name.toLowerCase().trim(); (byName[k] ||= []).push(r); }
    for (const group of Object.values(byName)) {
      if (group.length > 1) for (const r of group) {
        r.flags.push({ level: "medium", text: `Same name as ${group.filter((x) => x !== r).map((x) => `@${x.handle}`).join(", ")} - possibly one person with several accounts.` });
        if (r.risk === "clean") r.risk = "medium";
      }
    }
    setRows(out);
    setRunning(false);
  };

  const list = rows || [];
  const sel = list.find((r) => r.id === openId);
  const RISK = { high: { label: "Unbacked XP", color: KIT.red }, medium: { label: "Review", color: KIT.orange }, clean: { label: "Clean", color: KIT.green } };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4 sm:p-5 flex flex-wrap items-center gap-3" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="flex-1 min-w-[240px]">
          <h2 className="font-sans text-base font-semibold text-white">Run an integrity check</h2>
          <p className="font-sans text-xs text-white/45 mt-0.5 max-w-2xl">
            Reconciles each account&apos;s XP against the reward ledger and checks how fast rewards arrived. Read-only - it changes nothing.
          </p>
        </div>
        <select value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="How many accounts"
          className="font-sans text-sm text-white/85 pl-3 pr-8 py-2 rounded-lg border border-white/10 outline-none" style={{ background: "rgba(255,255,255,0.03)" }}>
          {[25, 50, 100, 200].map((n) => <option key={n} value={n} style={{ background: "#0b0f17" }}>Top {n} by XP</option>)}
        </select>
        <PrimaryButton icon={Play} busy={running} onClick={run}>{running ? `Checking ${Math.round(progress * 100)}%` : "Run check"}</PrimaryButton>
      </div>

      {rows && (
        <StatGrid stats={[
          { label: "Accounts checked", value: list.length, sub: `Top ${size} by XP`, icon: Users, color: KIT.cyan },
          { label: "Clean", value: list.filter((r) => r.risk === "clean").length, sub: "Backed and normally paced", icon: ShieldCheck, color: KIT.green },
          { label: "Unbacked XP", value: list.filter((r) => r.risk === "high").length, sub: `More than ${UNEXPLAINED_LIMIT} XP with no ledger entry`, icon: AlertTriangle, color: list.some((r) => r.risk === "high") ? KIT.red : KIT.muted },
          { label: "Needs review", value: list.filter((r) => r.risk === "medium").length, sub: "Too fast, bursts, or look-alike accounts", icon: Gauge, color: KIT.orange },
        ]} />
      )}

      {(rows || running) && (
        <DataTable title="Integrity results" icon={ShieldCheck}
          subtitle="Expected XP = reward ledger total minus XP spent on coins. Click a row for the evidence."
          rows={list} loading={running} pageSize={25} defaultFilters={{}}
          searchKeys={["name", "handle", "email", "institution"]} searchPlaceholder="Search accounts..."
          filters={[{ key: "risk", label: "All results", options: [{ value: "high", label: "Unbacked XP" }, { value: "medium", label: "Needs review" }, { value: "clean", label: "Clean" }] }]}
          onRowClick={(r) => setOpenId(r.id)} emptyText="Run the check to see results."
          columns={[
            { key: "name", label: "Account", render: (r) => (
              <div className="min-w-0 w-[220px] xl:w-[260px]">
                <p className="font-sans text-sm font-medium text-white truncate">{r.name}</p>
                <p className="font-sans text-xs text-white/40 truncate">@{r.handle}{r.institution ? ` · ${r.institution}` : ""}</p>
              </div>
            ) },
            { key: "xp", label: "XP", sort: (r) => r.xp, render: (r) => <span className="font-sans text-sm text-white/85 tabular-nums">{fmt(r.xp)} <span className="text-white/35 text-xs">{getTier(r.xp).name}</span></span> },
            { key: "unexplained", label: "Unbacked", sort: (r) => r.unexplained,
              render: (r) => <span className="font-sans text-sm tabular-nums" style={{ color: r.unexplained > UNEXPLAINED_LIMIT ? KIT.red : "rgba(255,255,255,0.55)" }}>{r.unexplained > 0 ? `+${fmt(Math.round(r.unexplained))}` : fmt(Math.round(r.unexplained))}</span> },
            { key: "grants", label: "Rewards", sort: (r) => r.grants, render: (r) => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(r.grants)}</span> },
            { key: "medianGap", label: "Pace", sort: (r) => r.medianGap ?? 9e9,
              render: (r) => r.medianGap === null ? <span className="font-sans text-xs text-white/30">-</span>
                : <span className="font-sans text-sm tabular-nums" style={{ color: r.medianGap < FAST_MEDIAN_S ? KIT.orange : "rgba(255,255,255,0.7)" }}>{Math.round(r.medianGap)}s / topic</span> },
            { key: "busiestCount", label: "Busiest day", sort: (r) => r.busiestCount,
              render: (r) => <span className="font-sans text-sm tabular-nums" style={{ color: r.busiestCount > BURST_PER_DAY ? KIT.orange : "rgba(255,255,255,0.7)" }}>{fmt(r.busiestCount)}</span> },
            { key: "risk", label: "Result", sort: (r) => ({ high: 0, medium: 1, clean: 2 })[r.risk], render: (r) => <Pill color={RISK[r.risk].color}>{RISK[r.risk].label}</Pill> },
          ]}
          rowActions={(r) => [{ icon: Eye, label: "Evidence", onClick: () => setOpenId(r.id) }]}
        />
      )}

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={620} title={sel?.name || ""} subtitle={sel ? `@${sel.handle} · ${sel.email}` : ""}>
        {sel && (
          <div className="space-y-4">
            <DrawerSection title="Reconciliation">
              <dl className="grid grid-cols-[200px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">XP on the account</dt><dd className="text-white/85 tabular-nums">{fmt(sel.xp)}</dd>
                <dt className="text-white/45">Reward ledger total</dt><dd className="text-white/85 tabular-nums">{fmt(sel.ledgerXp)} from {fmt(sel.grants)} entries</dd>
                <dt className="text-white/45">Spent on coins</dt><dd className="text-white/85 tabular-nums">{fmt(sel.convertedCoins)} coins</dd>
                <dt className="text-white/45">Expected XP</dt><dd className="text-white/85 tabular-nums">{fmt(Math.round(sel.expected))}</dd>
                <dt className="text-white/45">Not backed by ledger</dt><dd className="tabular-nums" style={{ color: sel.unexplained > UNEXPLAINED_LIMIT ? KIT.red : "rgba(255,255,255,0.85)" }}>{fmt(Math.round(sel.unexplained))}</dd>
              </dl>
              <p className="font-sans text-xs text-white/40">Small positive amounts are usually XP from before the ledger existed.</p>
            </DrawerSection>
            <DrawerSection title="Pacing">
              <dl className="grid grid-cols-[200px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Median gap between topics</dt><dd className="text-white/85 tabular-nums">{sel.medianGap === null ? "-" : `${Math.round(sel.medianGap)}s`}</dd>
                <dt className="text-white/45">Topics under 20s apart</dt><dd className="text-white/85 tabular-nums">{fmt(sel.under20)}</dd>
                <dt className="text-white/45">Busiest day</dt><dd className="text-white/85 tabular-nums">{sel.busiestDay ? `${fmt(sel.busiestCount)} rewards on ${sel.busiestDay}` : "-"}</dd>
              </dl>
            </DrawerSection>
            <DrawerSection title="XP by source">
              {Object.entries(sel.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex justify-between font-sans text-sm"><span className="text-white/60">{k.replace(/_/g, " ")}</span><span className="text-white/85 tabular-nums">{fmt(v)}</span></div>
              ))}
            </DrawerSection>
            <DrawerSection title="Findings">
              {sel.flags.length ? sel.flags.map((f) => (
                <p key={f.text} className="font-sans text-sm" style={{ color: f.level === "high" ? "#FF9A9A" : KIT.orange }}>{f.text}</p>
              )) : <p className="font-sans text-sm" style={{ color: KIT.green }}>Nothing unusual - backed by the ledger at a normal pace.</p>}
            </DrawerSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}
