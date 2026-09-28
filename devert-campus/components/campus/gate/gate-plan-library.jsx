"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Sigma, ListChecks, BookOpen, Library, CheckCircle2, Circle, Loader2, ExternalLink, Scissors,
  ShieldCheck, Clock, CalendarDays, NotebookPen, Compass, FileQuestion, Target, Layers, Info,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusSkeleton, CampusEmptyState, CampusProgressBar } from "@/components/campus/campus-ui";
import { GateBarList } from "@/components/campus/gate/gate-ui";
import {
  fetchFormulaBank, fetchPlanResources, setChecklistItem, CHECK_COLUMNS, WEEK_KEYS, PAPER_LABEL,
} from "@/lib/gatePlan";
import {
  TOPIC_CHECKLIST, CHECKLIST_ITEM_COUNT, HOW_TO_USE_A_DAY, DAILY_CONTRACT, WEEK_SHAPE, TRACKS_NOTE,
  WEEKDAY_ROUTINE, SUNDAY_ROUTINE, NOTEBOOKS, PYQ_STRATEGY, ACCURACY_LADDER, CUT_LIST, NEVER_CUT,
  STRATEGY_NOTES, JANUARY, ADD_HOURS, REALITY_CHECK, HIGH_YIELD, ML_RULE, RESOURCE_RULE, hoursBudget, SPLIT_TIP,
} from "@/lib/gatePlanGuide";
import { Kicker, Panel, PaperChip, PAPER_COLOR, BAND_COLOR, PlanLink } from "@/components/campus/gate/gate-plan-ui";
import { PlanOverview } from "@/components/campus/gate/gate-plan-landing";

const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

// ── Formula bank ──────────────────────────────────────────────────────────
// The workbook's Formula Bank sheet: 523 rows, one fact each, filterable by
// subject, week and paper - "filter by Subject or Week to get a clean formula
// list for any subject", as its own instructions put it.

export function PlanFormulaBank({ onOpenDay }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [week, setWeek] = useState("");
  const [paper, setPaper] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchFormulaBank().then(r => !cancelled && setRows(r)).catch(() => !cancelled && setRows([]));
    return () => { cancelled = true; };
  }, []);

  const subjects = useMemo(() => [...new Set((rows || []).map(r => r.subject))], [rows]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || []).filter(r =>
      (!subject || r.subject === subject) && (!week || r.week === week) && (!paper || r.paper === paper)
      && (!needle || r.text.toLowerCase().includes(needle) || r.topic.toLowerCase().includes(needle)));
  }, [rows, q, subject, week, paper]);

  // Grouped by day so each block reads as "D15 · Matrices & determinants"
  // with its facts beneath - the order they were learned in.
  const groups = useMemo(() => {
    const m = new Map();
    for (const r of filtered) {
      if (!m.has(r.day)) m.set(r.day, { day: r.day, topic: r.topic, subject: r.subject, paper: r.paper, week: r.week, items: [] });
      m.get(r.day).items.push(r);
    }
    return [...m.values()].sort((a, b) => a.day - b.day);
  }, [filtered]);

  if (rows === null) return <CampusCard className="p-5"><CampusSkeleton height={160} /></CampusCard>;
  if (!rows.length) return <CampusEmptyState icon={Sigma} title="Formula bank not loaded yet" description="The admin has not imported the formula bank yet." />;

  const sel = "rounded-lg px-3 py-2 text-[12.5px] outline-none";
  const selStyle = { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink };

  return (
    <div className="space-y-4">
      <CampusCard className="p-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search formulas, e.g. eigen, CRC, Bayes..."
            className="w-full rounded-lg pl-8 pr-3 py-2 text-[12.5px] outline-none" style={selStyle} />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)} className={sel} style={selStyle} aria-label="Subject">
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={week} onChange={e => setWeek(e.target.value)} className={sel} style={selStyle} aria-label="Week">
          <option value="">All weeks</option>
          {WEEK_KEYS.map(w => <option key={w} value={w}>{w === "Start" ? "Day 0" : w}</option>)}
        </select>
        <select value={paper} onChange={e => setPaper(e.target.value)} className={sel} style={selStyle} aria-label="Paper">
          <option value="">Both papers + single</option>
          {["BOTH", "CS", "DA"].map(p => <option key={p} value={p}>{PAPER_LABEL[p]}</option>)}
        </select>
        <span className="text-[11px] font-mono ml-auto" style={{ color: CAMPUS.inkFaint }}>{filtered.length} / {rows.length}</span>
      </CampusCard>

      {groups.length === 0 ? (
        <CampusEmptyState icon={Search} title="No formulas match" description="Try a different search, or clear a filter." size="sm" />
      ) : groups.map(g => (
        <CampusCard key={g.day} className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <button onClick={() => onOpenDay(g.day)} className="font-mono text-[11.5px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>D{g.day}</button>
            <span className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{g.topic}</span>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{g.subject}</span>
            <span className="ml-auto"><PaperChip paper={g.paper} /></span>
          </div>
          <ul className="space-y-1.5">
            {g.items.map(r => (
              <li key={`${r.day}-${r.n}`} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                <span className="font-mono text-[10px] w-5 flex-shrink-0 text-right mt-[3px]" style={{ color: CAMPUS.inkFaint }}>{r.n}</span>
                <span className="min-w-0">{r.text}</span>
              </li>
            ))}
          </ul>
        </CampusCard>
      ))}
    </div>
  );
}

// ── Topic checklist ───────────────────────────────────────────────────────

export function PlanChecklist({ member, readOnly }) {
  const saved = member?.checklist || {};
  const [local, setLocal] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [paper, setPaper] = useState(null);
  const get = (id) => ({ ...(saved[id] || {}), ...(local[id] || {}) });

  const counts = useMemo(() => {
    const c = Object.fromEntries(CHECK_COLUMNS.map(col => [col.key, 0]));
    for (const g of TOPIC_CHECKLIST) for (const it of g.items) for (const col of CHECK_COLUMNS) if (get(it.id)[col.key]) c[col.key]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, local]);

  async function toggle(id, key) {
    if (readOnly) return;
    const next = { ...get(id), [key]: !get(id)[key] };
    setLocal(l => ({ ...l, [id]: next }));
    setBusyId(`${id}:${key}`); setError("");
    try { await setChecklistItem(member.uid, id, next); }
    catch (e) { setError(e?.message || "Could not save."); setLocal(l => Object.fromEntries(Object.entries(l).filter(([k]) => k !== id))); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <CampusCard className="p-4 sm:p-5">
        <Kicker icon={ListChecks} color={CAMPUS.teal}>TOPIC CHECKLIST</Kicker>
        <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>
          Tick each column as you go: <b style={{ color: CAMPUS.ink }}>Learned</b> (lecture + notes), <b style={{ color: CAMPUS.ink }}>PYQs</b> (topic-wise set done),
          <b style={{ color: CAMPUS.ink }}> 70%</b> (accuracy reached), <b style={{ color: CAMPUS.ink }}>Revised</b> (covered again in an evening slot, a Sunday test or the lock-in).
          By Dec 31 this should be complete.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CHECK_COLUMNS.map(col => (
            <div key={col.key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-semibold" style={{ color: CAMPUS.ink }}>{col.label}</span>
                <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{counts[col.key]}/{CHECKLIST_ITEM_COUNT}</span>
              </div>
              <CampusProgressBar pct={(100 * counts[col.key]) / CHECKLIST_ITEM_COUNT} color={col.key === "seventy" ? CAMPUS.good : CAMPUS.teal} />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-4">
          {[[null, "All"], ["BOTH", "Shared"], ["CS", "CS only"], ["DA", "DA only"]].map(([v, l]) => (
            <button key={l} onClick={() => setPaper(v)} className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: paper === v ? CAMPUS.tealTint : CAMPUS.paper, border: `1px solid ${paper === v ? CAMPUS.teal : CAMPUS.line}`, color: paper === v ? CAMPUS.teal : CAMPUS.inkSoft }}>{l}</button>
          ))}
        </div>
        {error && <p className="text-[12px] mt-3" style={{ color: CAMPUS.bad }}>{error}</p>}
        {readOnly && <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.gold }}>Admin preview - ticks are for members.</p>}
      </CampusCard>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {TOPIC_CHECKLIST.filter(g => !paper || g.paper === paper).map(g => (
          <CampusCard key={g.title} className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{g.title}</span>
              <span className="ml-auto"><PaperChip paper={g.paper} /></span>
            </div>
            <div className="grid grid-cols-[1fr_repeat(4,44px)] gap-y-1 items-center">
              <span />
              {CHECK_COLUMNS.map(c => (
                <span key={c.key} className="text-[9px] font-mono tracking-wider text-center" style={{ color: CAMPUS.inkFaint }} title={c.hint}>{c.label.toUpperCase()}</span>
              ))}
              {g.items.map(it => {
                const v = get(it.id);
                return [
                  <span key={`${it.id}-l`} className="text-[12px] pr-2 py-1" style={{ color: CAMPUS.ink, borderTop: `1px solid ${CAMPUS.line}` }}>{it.label}</span>,
                  ...CHECK_COLUMNS.map(c => {
                    const on = !!v[c.key];
                    const busy = busyId === `${it.id}:${c.key}`;
                    return (
                      <span key={`${it.id}-${c.key}`} className="flex justify-center py-1" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                        <button onClick={() => toggle(it.id, c.key)} disabled={readOnly} aria-pressed={on}
                          aria-label={`${it.label}: ${c.label}`} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:cursor-default"
                          style={{ background: on ? tint(CAMPUS.good, 16) : "transparent", color: on ? CAMPUS.good : CAMPUS.inkFaint }}>
                          {busy ? <Loader2 size={13} className="animate-spin" /> : on ? <CheckCircle2 size={15} /> : <Circle size={14} />}
                        </button>
                      </span>
                    );
                  }),
                ];
              })}
            </div>
          </CampusCard>
        ))}
      </div>
    </div>
  );
}

// ── Guide ─────────────────────────────────────────────────────────────────
// The PDF's method sections, as reference. The outline/rules/tiers/marks half
// is shared with the public landing (PlanOverview).

export function PlanGuide({ index }) {
  const budget = useMemo(() => hoursBudget(index).map(r => ({ key: r.subject, label: r.subject, pct: r.hours })), [index]);
  const [paper, setPaper] = useState("CS");

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="HOW TO USE A DAY" icon={Compass}>
          <ol className="space-y-2 mt-2">
            {HOW_TO_USE_A_DAY.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                <span className="font-mono text-[11px] font-bold w-4 flex-shrink-0 mt-[2px]" style={{ color: CAMPUS.teal }}>{i + 1}</span>
                <span className="min-w-0">{t}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="THE DAILY CONTRACT · NON-NEGOTIABLE" icon={ShieldCheck} color={CAMPUS.gold}>
          <ol className="space-y-2 mt-2">
            {DAILY_CONTRACT.map(([k, v], i) => (
              <li key={k} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                <span className="font-mono text-[11px] font-bold w-4 flex-shrink-0 mt-[2px]" style={{ color: CAMPUS.gold }}>{i + 1}</span>
                <span className="min-w-0"><b style={{ color: CAMPUS.ink }}>{k}</b> {v}</span>
              </li>
            ))}
          </ol>
          <p className="text-[12px] mt-3 italic" style={{ color: CAMPUS.ink }}>I commit to 3.5 hours of GATE preparation every day until February 2027.</p>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="MONDAY TO SATURDAY" icon={Clock}>
          <ol className="space-y-1.5 mt-2">
            {WEEKDAY_ROUTINE.map(r => (
              <li key={r.label} className="flex items-start gap-3 text-[12px]">
                <span className="font-mono w-[76px] flex-shrink-0" style={{ color: r.block === "B" ? CAMPUS.cyan : r.block === "break" ? CAMPUS.inkFaint : CAMPUS.teal }}>{clock(r.from)}-{clock(r.to)}</span>
                <span className="min-w-0" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>{r.label}.</b> {r.how}</span>
              </li>
            ))}
          </ol>
          <p className="text-[11px] mt-3" style={{ color: CAMPUS.inkFaint }}>{SPLIT_TIP}</p>
        </Panel>
        <Panel title="SUNDAY" icon={CalendarDays} color={CAMPUS.gold}>
          <ol className="space-y-1.5 mt-2">
            {SUNDAY_ROUTINE.map(r => (
              <li key={r.label} className="flex items-start gap-3 text-[12px]">
                <span className="font-mono w-[76px] flex-shrink-0" style={{ color: CAMPUS.gold }}>{clock(r.from)}-{clock(r.to)}</span>
                <span className="min-w-0" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>{r.label}.</b> {r.how}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="THE WEEKLY SHAPE · 24.5 H" icon={Layers}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-2">
          {WEEK_SHAPE.map(w => (
            <div key={w.track} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{w.days.toUpperCase()}</p>
              <p className="text-[13px] font-semibold mt-0.5" style={{ color: CAMPUS.ink }}>{w.track} <span className="font-mono text-[11px]" style={{ color: CAMPUS.teal }}>{w.hours}</span></p>
              <p className="text-[11.5px] leading-relaxed mt-1" style={{ color: CAMPUS.inkSoft }}>{w.text}</p>
            </div>
          ))}
        </div>
        <p className="text-[12px] leading-relaxed mt-3" style={{ color: CAMPUS.inkSoft }}>{TRACKS_NOTE}</p>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="THE ACCURACY LADDER" icon={Target}>
          <div className="space-y-1.5 mt-2">
            {ACCURACY_LADDER.map(s => (
              <div key={s.from} className="grid grid-cols-[64px_1fr] gap-3 rounded-xl p-2.5" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, borderLeft: `3px solid ${BAND_COLOR[s.tone]}` }}>
                <span className="font-mono text-[12px] font-bold" style={{ color: BAND_COLOR[s.tone] }}>{s.from}{s.to > 100 ? "%+" : `-${s.to}%`}</span>
                <span className="min-w-0 text-[12px]" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>{s.meaning}.</b> {s.next}.</span>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.inkSoft }}>The target by December: give yourself any PYQ from a finished topic and you instantly know which concept it is testing.</p>
        </Panel>
        <Panel title="IF YOU FALL BEHIND, CUT IN THIS ORDER" icon={Scissors} color={CAMPUS.bad}>
          <ol className="space-y-1.5 mt-2">
            {CUT_LIST.map(([t, p], i) => (
              <li key={t} className="flex items-center gap-2.5 text-[12.5px]" style={{ color: CAMPUS.ink }}>
                <span className="font-mono text-[11px] font-bold w-4" style={{ color: CAMPUS.bad }}>{i + 1}</span>
                <span className="flex-1 min-w-0">{t}</span>
                <CampusChip color={PAPER_COLOR[p]}>{p}</CampusChip>
              </li>
            ))}
          </ol>
          <div className="rounded-xl p-3 mt-3" style={{ background: tint(CAMPUS.good, 8), border: `1px solid ${tint(CAMPUS.good, 28)}` }}>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.good }}>NEVER CUT</p>
            <p className="text-[12px]" style={{ color: CAMPUS.ink }}>{NEVER_CUT.join(" · ")}</p>
          </div>
          <p className="text-[11.5px] leading-relaxed mt-3" style={{ color: CAMPUS.inkSoft }}>{REALITY_CHECK}</p>
        </Panel>
      </div>

      <Panel title="STRATEGY NOTES" icon={Info}>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-2">
          {STRATEGY_NOTES.map(([k, v]) => (
            <div key={k} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>{k}</p>
              <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{v}</p>
            </div>
          ))}
          {NOTEBOOKS.map(n => (
            <div key={n.title} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}><NotebookPen size={12} style={{ color: CAMPUS.teal }} />{n.title}</p>
              <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{n.text}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="HIGH-YIELD FOCUS PER SUBJECT" icon={FileQuestion}
        action={
          <div className="flex gap-1.5">
            {["CS", "DA"].map(p => (
              <button key={p} onClick={() => setPaper(p)} className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: paper === p ? CAMPUS.tealTint : CAMPUS.paper, border: `1px solid ${paper === p ? CAMPUS.teal : CAMPUS.line}`, color: paper === p ? CAMPUS.teal : CAMPUS.inkSoft }}>{p}</button>
            ))}
          </div>
        }>
        <div className="overflow-x-auto -mx-1 mt-2">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                {["Subject", "Master these", "Go light on"].map(h => (
                  <th key={h} className="px-2 py-2 text-[9.5px] font-mono tracking-widest font-normal" style={{ color: CAMPUS.inkFaint }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HIGH_YIELD[paper].map(([s, master, light]) => (
                <tr key={s} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                  <td className="px-2 py-2 align-top text-[12.5px] font-semibold w-[170px]" style={{ color: CAMPUS.ink }}>{s}</td>
                  <td className="px-2 py-2 align-top text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{master}</td>
                  <td className="px-2 py-2 align-top text-[12px] leading-relaxed w-[200px]" style={{ color: CAMPUS.inkFaint }}>{light || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paper === "DA" && (
          <p className="text-[12px] leading-relaxed mt-3 rounded-xl p-3" style={{ color: CAMPUS.ink, background: tint(CAMPUS.purple, 8), border: `1px solid ${tint(CAMPUS.purple, 28)}` }}>
            <b style={{ color: CAMPUS.purple }}>The ML rule.</b> {ML_RULE}
          </p>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="WHERE THE TOPIC HOURS GO" icon={Clock}>
          <p className="text-[11.5px] mt-1 mb-3" style={{ color: CAMPUS.inkFaint }}>Computed from the plan itself: each topic day is a 2.5 h block, each Compiler evening 35 minutes.</p>
          <GateBarList rows={budget} suffix=" h" emptyLabel="The plan outline has not been loaded yet." />
        </Panel>
        <Panel title="JANUARY TO EXAM DAY" icon={CalendarDays}>
          <div className="space-y-2 mt-2">
            {JANUARY.map(j => (
              <div key={j.when} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.teal }}>{j.when.toUpperCase()}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{j.focus}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] leading-relaxed mt-3" style={{ color: CAMPUS.ink }}>{ADD_HOURS}</p>
        </Panel>
      </div>

      <Panel title="PYQ STRATEGY" icon={FileQuestion}>
        <ul className="space-y-1.5 mt-2">
          {PYQ_STRATEGY.map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]" style={{ background: CAMPUS.teal }} />{t}
            </li>
          ))}
        </ul>
      </Panel>

      <PlanOverview index={index} compact />
    </div>
  );
}

// ── Resources ─────────────────────────────────────────────────────────────

export function PlanResources() {
  const [res, setRes] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    fetchPlanResources().then(r => !cancelled && setRes(r)).catch(() => !cancelled && setRes(null));
    return () => { cancelled = true; };
  }, []);

  if (res === undefined) return <CampusCard className="p-5"><CampusSkeleton height={160} /></CampusCard>;
  if (!res) return <CampusEmptyState icon={Library} title="Resources not loaded yet" description="The admin has not imported the resource list yet." />;

  return (
    <div className="space-y-4">
      <CampusCard className="p-4 flex items-start gap-3" style={{ border: `1px solid ${tint(CAMPUS.teal, 35)}` }}>
        <BookOpen size={16} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.teal }} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>One primary teacher per subject.</p>
          <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{RESOURCE_RULE} Switch only if a concept truly is not clicking.</p>
        </div>
      </CampusCard>

      <Panel title="LECTURE CHANNELS" icon={Library}>
        <div className="space-y-2 mt-2">
          {res.channels?.map(c => (
            <div key={c.subject} className="rounded-xl p-3 grid md:grid-cols-[200px_1fr_1fr] gap-2 items-start" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>{c.subject}</p>
                {c.note && <p className="text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{c.note}</p>}
              </div>
              <PlanLink link={c.primary?.link ? { ...c.primary.link, source: c.primary.name } : null} label="Primary" compact />
              <PlanLink link={c.backup?.link ? { ...c.backup.link, source: c.backup.name } : null} label="Backup" compact />
            </div>
          ))}
        </div>
        {res.language && <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>Language: {res.language}</p>}
        <p className="text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>
          These open YouTube searches by channel name. Playlists get reorganised, so pick the most recent complete playlist for the subject.
        </p>
      </Panel>

      <Panel title="PYQ SOURCES" icon={FileQuestion}>
        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          {res.pyqSources?.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="rounded-xl p-3 flex items-start gap-2.5"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <ExternalLink size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.teal }} />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>{p.name}</span>
                <span className="block text-[11.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{p.use}</span>
              </span>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
