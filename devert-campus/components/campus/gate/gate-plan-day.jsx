"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Target, Lock, Loader2, AlertCircle, BookOpen,
  Sigma, Moon, Clock, Save, Repeat, FileQuestion, Trash2, Info, Flag,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import {
  fetchPlanDay, formatPlanDate, planDayState, DAY_STATE, canLogDay, currentPlanDay, GATE_PLAN_LAST_DAY,
  LOG_STATUS, LOG_STATUS_LABEL, saveDayLog, clearDayLog, pct, isActiveMember,
} from "@/lib/gatePlan";
import { WEEKDAY_ROUTINE, SUNDAY_ROUTINE, MISSED_DAY_RULE, WEEKS, ladderStep, SPLIT_TIP } from "@/lib/gatePlanGuide";
import {
  Kicker, Panel, PaperChip, TypeChip, PlanLink, BulletList, bandColor, fmtPct, STATUS_COLOR,
} from "@/components/campus/gate/gate-plan-ui";

// One day of the plan: the workbook row, laid out in the order the day is
// actually lived (Block A -> break -> Block B), with the log on the side.
//
// The log mirrors the workbook's yellow cells exactly - Status, then correct /
// attempted for the topic PYQs, the evening PYQs and GA, then the main
// mistake - plus the two Sunday sign-off lines from the PDF. Nothing here is
// graded: the questions live on GATE Overflow and the student types their
// own score.

const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

export function PlanDayView({ day, member, adminPreview, onOpenDay, onBack }) {
  // Keyed by day, so switching days reads as "loading" without a synchronous
  // reset inside the effect.
  const [loaded, setLoaded] = useState({ day: null, doc: undefined });
  const doc = loaded.day === day ? loaded.doc : undefined;

  useEffect(() => {
    let cancelled = false;
    fetchPlanDay(day)
      .then(d => { if (!cancelled) setLoaded({ day, doc: d }); })
      .catch(() => { if (!cancelled) setLoaded({ day, doc: null }); });
    return () => { cancelled = true; };
  }, [day]);

  const logs = member?.logs || {};
  const state = planDayState(day, logs);
  const live = currentPlanDay();

  const nav = (
    <div className="flex items-center gap-2 flex-wrap">
      <CampusButton variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>All days</CampusButton>
      <div className="flex items-center gap-1.5 ml-auto">
        <CampusButton variant="secondary" size="sm" disabled={day <= 0} onClick={() => onOpenDay(day - 1)}>
          <ArrowLeft size={12} /> D{Math.max(0, day - 1)}
        </CampusButton>
        {live >= 0 && live !== day && (
          <CampusButton variant="ghost" size="sm" onClick={() => onOpenDay(live)}>Today (D{live})</CampusButton>
        )}
        <CampusButton variant="secondary" size="sm" disabled={day >= GATE_PLAN_LAST_DAY} onClick={() => onOpenDay(day + 1)}>
          D{Math.min(GATE_PLAN_LAST_DAY, day + 1)} <ArrowRight size={12} />
        </CampusButton>
      </div>
    </div>
  );

  if (doc === undefined) {
    return <div className="space-y-4">{nav}<CampusCard className="p-5"><CampusSkeleton height={140} /></CampusCard></div>;
  }
  if (!doc) {
    return (
      <div className="space-y-4">{nav}
        <CampusEmptyState icon={AlertCircle} title={`D${day} is not available`}
          description="This day could not be loaded. If you were just approved, refresh the page - access can take a moment to apply." />
      </div>
    );
  }

  const week = WEEKS[doc.week];
  const isSunday = doc.type === "sunday";
  const isTopic = doc.type === "topic";
  const stateChip = state === DAY_STATE.DONE ? { c: CAMPUS.good, i: CheckCircle2, t: "Done" }
    : state === DAY_STATE.TODAY ? { c: CAMPUS.cyan, i: Target, t: "Today" }
    : state === DAY_STATE.UPCOMING ? { c: CAMPUS.inkFaint, i: Lock, t: `Upcoming · ${formatPlanDate(day)}` }
    : null;

  return (
    <div className="space-y-4">
      {nav}

      {/* ── header ── */}
      <CampusCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded-md" style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>D{day}</span>
          <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
            {formatPlanDate(day, { weekday: true, year: true })} · {doc.week === "Start" ? "Day 0" : doc.week}
          </span>
          <PaperChip paper={doc.paper} />
          <TypeChip type={doc.type} />
          {stateChip && <CampusChip color={stateChip.c} icon={stateChip.i}>{stateChip.t}</CampusChip>}
        </div>
        <p className="text-[11px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>{doc.subject.toUpperCase()}</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: CAMPUS.ink }}>{doc.topic}</h2>
        {week?.title && doc.week !== "Start" && (
          <p className="text-[12px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
            {doc.week === "Lock-in" ? "Lock-in" : `Week ${doc.week.slice(1)}`}: {week.title}
          </p>
        )}
        {adminPreview && (
          <p className="text-[11.5px] mt-3 flex items-center gap-1.5" style={{ color: CAMPUS.gold }}>
            <Info size={12} /> Admin preview - you can read every day, but logging needs a member seat.
          </p>
        )}
      </CampusCard>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        {/* ── left: the day ── */}
        <div className="space-y-4 min-w-0">
          {isSunday ? <SundayBlocks doc={doc} /> : <CoverPanel doc={doc} />}

          {!isSunday && (isTopic || doc.lecture?.primary || doc.pyqs?.primary) && (
            <Panel title={isTopic ? "BLOCK A · 2.5 H · LECTURE + TOPIC PYQS" : "RESOURCES"} icon={BookOpen}>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <PlanLink link={doc.lecture?.primary} label="Primary lecture · Search YouTube" />
                <PlanLink link={doc.lecture?.backup} label="Backup lecture · Search YouTube" />
                <PlanLink link={doc.pyqs?.primary} label="Topic PYQs" />
                <PlanLink link={doc.pyqs?.backup} label="PYQs backup" />
              </div>
              {doc.pyqTarget && (
                <p className="text-[12px] mt-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkSoft }}>
                  <FileQuestion size={12} style={{ color: CAMPUS.teal }} /> Target: <b style={{ color: CAMPUS.ink }}>{doc.pyqTarget}</b>
                </p>
              )}
              {isTopic && (
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: CAMPUS.inkFaint }}>
                  Lecture links are YouTube searches for the recommended channel and today&apos;s topic - pick the matching video
                  (usually the top result or the channel&apos;s playlist entry). Hard cap: 60 minutes at 1.5x.
                </p>
              )}
            </Panel>
          )}

          {doc.formulas?.length > 0 && (
            <Panel title="FORMULAS & KEY FACTS" icon={Sigma}>
              <div className="space-y-4 mt-2">
                {doc.formulas.map((g, i) => (
                  <div key={i}>
                    {g.title && <p className="text-[10.5px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.purple }}>{g.title.toUpperCase()}</p>}
                    <BulletList items={g.items} color={g.title ? CAMPUS.purple : CAMPUS.teal} />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {!isSunday && <BlockB doc={doc} onOpenDay={onOpenDay} />}

          {isTopic && <RoutinePanel />}
        </div>

        {/* ── right: the log ── */}
        <div className="lg:sticky lg:top-4 space-y-4 min-w-0">
          {/* Keyed on the saved log's timestamp: the form seeds from the saved
              values when the day or the saved log changes, and never from a
              live snapshot mid-typing. */}
          <LogPanel key={`${day}:${logs[String(day)]?.loggedAt || ""}`} day={day} doc={doc} member={member} adminPreview={adminPreview} />
          {isSunday && (
            <CampusCard className="p-4">
              <Kicker icon={Repeat} color={CAMPUS.warn}>MISSED A WEEKDAY?</Kicker>
              <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{MISSED_DAY_RULE}</p>
            </CampusCard>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverPanel({ doc }) {
  return (
    <Panel title={doc.type === "topic" ? "WHAT TO COVER TODAY" : doc.type === "lockin" ? "LOCK-IN" : "TODAY"} icon={Target}>
      {doc.cover && <p className="text-[13.5px] leading-relaxed mt-1" style={{ color: CAMPUS.ink }}>{doc.cover}</p>}
      {doc.mustKnow && (
        <div className="mt-4 rounded-xl p-3.5" style={{ background: tint(CAMPUS.gold, 8), border: `1px solid ${tint(CAMPUS.gold, 32)}` }}>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.gold }}>MUST-KNOW · YOUR EXIT TEST</p>
          <p className="text-[13px] leading-relaxed" style={{ color: CAMPUS.ink }}>{doc.mustKnow}</p>
          <p className="text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>By the end of today, write this from memory. Then copy it into your formula sheet.</p>
        </div>
      )}
    </Panel>
  );
}

function SundayBlocks({ doc }) {
  const blocks = (doc.blocks?.length ? doc.blocks : SUNDAY_ROUTINE.map(r => ({ label: r.label, minutes: r.to - r.from, text: r.how })))
    .reduce((acc, b) => {
      const from = acc.length ? acc[acc.length - 1].to : 0;
      return [...acc, { ...b, from, to: from + (b.minutes || 0) }];
    }, []);
  return (
    <Panel title="SUNDAY · TEST, RECAP & GA · 3.5 H" icon={CalendarDays} color={CAMPUS.gold}>
      <ol className="mt-2 space-y-2">
        {blocks.map((b, i) => {
          const { from, to: at } = b;
          return (
            <li key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <div className="w-[68px] flex-shrink-0">
                <p className="font-mono text-[11px]" style={{ color: CAMPUS.inkFaint }}>{clock(from)}-{clock(at)}</p>
                <p className="font-mono text-[10px]" style={{ color: CAMPUS.inkFaint }}>{b.minutes} min</p>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{b.label}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{b.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {(doc.lecture?.primary || doc.pyqs?.primary) && (
        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          <PlanLink link={doc.lecture?.primary} label="GA lecture · Search YouTube" />
          <PlanLink link={doc.pyqs?.primary} label="GA PYQs" />
        </div>
      )}
      {doc.pyqTarget && <p className="text-[12px] mt-3" style={{ color: CAMPUS.inkSoft }}>Target: <b style={{ color: CAMPUS.ink }}>{doc.pyqTarget}</b></p>}
    </Panel>
  );
}

function BlockB({ doc, onOpenDay }) {
  const ev = doc.evening || {};
  const hasEvening = ev.kind && ev.kind !== "none";
  const hasGa = doc.ga?.theme || doc.ga?.lecture || doc.ga?.pyqs;
  if (!hasEvening && !hasGa) return null;
  return (
    <Panel title="BLOCK B · 50 MIN · KEEP-WARM + GA" icon={Moon} color={CAMPUS.cyan}>
      {hasEvening && (
        <div className="mt-2">
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>
            {ev.kind === "compiler" ? `COMPILER DESIGN · SESSION ${ev.compilerSession?.n} OF ${ev.compilerSession?.of} · 35 MIN` : "REVISION PYQS · 35 MIN"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
              {ev.kind === "revise" ? `Revise D${ev.reviseDay} · ${ev.topic}` : ev.kind === "compiler" ? ev.topic : ev.text}
            </p>
            {ev.kind === "revise" && (
              <CampusButton variant="ghost" size="sm" onClick={() => onOpenDay(ev.reviseDay)}>Open D{ev.reviseDay} <ArrowRight size={12} /></CampusButton>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            <PlanLink link={ev.lecture} label="Evening lecture · Search YouTube" compact />
            <PlanLink link={ev.pyqs} label={ev.kind === "compiler" ? "Compiler PYQs" : "Revision PYQs"} compact />
          </div>
        </div>
      )}
      {hasGa && (
        <div className={hasEvening ? "mt-4 pt-4" : "mt-2"} style={hasEvening ? { borderTop: `1px solid ${CAMPUS.line}` } : undefined}>
          <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>GENERAL APTITUDE · 5 QUESTIONS · ~10 MIN</p>
          {doc.ga.theme && <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{doc.ga.theme}</p>}
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            <PlanLink link={doc.ga.lecture} label="GA lecture · Search YouTube" compact />
            <PlanLink link={doc.ga.pyqs} label="GA PYQs" compact />
          </div>
        </div>
      )}
    </Panel>
  );
}

function RoutinePanel() {
  const color = { A: CAMPUS.teal, break: CAMPUS.inkFaint, B: CAMPUS.cyan };
  return (
    <Panel title="THE 3.5-HOUR ROUTINE" icon={Clock}>
      {/* A proportional bar first - the shape of the day at a glance - then
          the blocks as a list with the how-to for each. */}
      <div className="flex h-2.5 rounded-full overflow-hidden mt-2 mb-3" role="img" aria-label="Block A 2.5 hours, 10 minute break, Block B 50 minutes">
        {WEEKDAY_ROUTINE.map(r => (
          <div key={r.label} style={{ width: `${((r.to - r.from) / 210) * 100}%`, background: r.block === "break" ? CAMPUS.line : tint(color[r.block], r.label.includes("PYQ") ? 90 : 55) }} />
        ))}
      </div>
      <ol className="space-y-1.5">
        {WEEKDAY_ROUTINE.map(r => (
          <li key={r.label} className="flex items-start gap-3 text-[12px]">
            <span className="font-mono w-[76px] flex-shrink-0" style={{ color: color[r.block] }}>{clock(r.from)}-{clock(r.to)}</span>
            <span className="min-w-0" style={{ color: CAMPUS.inkSoft }}><b style={{ color: CAMPUS.ink }}>{r.label}.</b> {r.how}</span>
          </li>
        ))}
      </ol>
      <p className="text-[11px] mt-3" style={{ color: CAMPUS.inkFaint }}>{SPLIT_TIP}</p>
    </Panel>
  );
}

// ── the log ───────────────────────────────────────────────────────────────

// What each score pair means depends on the kind of day - a Sunday's "topic"
// count is the 25-question weekly test, a lock-in day's is the mock.
function scoreRows(doc) {
  const compiler = doc.evening?.kind === "compiler";
  switch (doc.type) {
    case "sunday": return [["topic", "Weekly test PYQs", "of 25"], ["ga", "GA questions", "of 15"]];
    case "setup": return [["topic", "PYQs", "target 15"], ["ga", "GA baseline", "of 10"]];
    case "lockin": return [["topic", /mock/i.test(doc.topic) ? "Mock questions" : "PYQs redone", ""], ["ga", "GA questions", "of 5"]];
    default: return [["topic", "Topic PYQs", doc.pyqTarget?.match(/^[\d–-]+/)?.[0] || ""], ["evening", compiler ? "Compiler PYQs" : "Revision PYQs", compiler ? "~6" : "~8"], ["ga", "GA questions", "of 5"]];
  }
}

const numInput = "w-full rounded-lg px-2.5 py-2 text-[13px] font-mono outline-none text-center";

function LogPanel({ day, doc, member, adminPreview }) {
  const existing = member?.logs?.[String(day)] || null;
  const blank = { status: "", topicCorrect: "", topicAttempted: "", eveningCorrect: "", eveningAttempted: "", gaCorrect: "", gaAttempted: "", hours: "", mistake: "", weakest: "", repair: "" };
  // Seeded once from the saved log; the parent re-keys this component when the
  // day or the saved log changes (see PlanDayView).
  const [form, setForm] = useState(() => {
    const e = existing || {};
    return { ...blank, ...Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v == null ? "" : String(v)])), status: e.status || "" };
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const rows = useMemo(() => scoreRows(doc), [doc]);
  const loggable = canLogDay(day);
  const member_ = isActiveMember(member);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const topicPct = pct(form.topicCorrect, form.topicAttempted);
  const step = doc.type === "topic" ? ladderStep(topicPct) : null;

  async function save(statusOverride) {
    const status = statusOverride || form.status || LOG_STATUS.IN_PROGRESS;
    setBusy(true); setMsg(null);
    try {
      await saveDayLog(member.uid, day, { ...form, status });
      setMsg({ ok: true, text: status === LOG_STATUS.DONE ? `D${day} marked done.` : "Saved." });
    } catch (e) {
      setMsg({ ok: false, text: e?.message || "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  if (adminPreview || !member_) {
    return (
      <CampusCard className="p-4">
        <Kicker icon={Save}>DAILY LOG</Kicker>
        <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>Logging is for approved members.</p>
      </CampusCard>
    );
  }

  if (!loggable) {
    return (
      <CampusCard className="p-4">
        <Kicker icon={Lock}>DAILY LOG</Kicker>
        <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
          You can read ahead, but D{day} can be logged from {formatPlanDate(day, { weekday: true })}.
        </p>
      </CampusCard>
    );
  }

  const statuses = [LOG_STATUS.IN_PROGRESS, LOG_STATUS.DONE, LOG_STATUS.MISSED, ...(doc.type === "topic" ? [LOG_STATUS.MOVED] : [])];

  return (
    <CampusCard className="p-4 sm:p-5" style={existing?.status === LOG_STATUS.DONE ? { border: `1px solid ${tint(CAMPUS.good, 40)}` } : undefined}>
      <Kicker icon={Save} color={CAMPUS.teal}>DAILY LOG · D{day}</Kicker>

      <p className="text-[10px] font-mono tracking-widest mb-1.5 mt-1" style={{ color: CAMPUS.inkFaint }}>STATUS</p>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {statuses.map(s => {
          const on = form.status === s;
          return (
            <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))} aria-pressed={on}
              className="text-[12px] font-semibold px-2.5 py-2 rounded-lg transition-colors"
              style={{ background: on ? tint(STATUS_COLOR[s], 16) : CAMPUS.paper, color: on ? STATUS_COLOR[s] : CAMPUS.inkSoft, border: `1px solid ${on ? STATUS_COLOR[s] : CAMPUS.line}` }}>
              {LOG_STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>SCORES · CORRECT / ATTEMPTED</p>
      <div className="space-y-2 mb-3">
        {rows.map(([k, label, hint]) => {
          const p = pct(form[`${k}Correct`], form[`${k}Attempted`]);
          return (
            <div key={k} className="grid grid-cols-[1fr_56px_12px_56px_44px] items-center gap-1.5">
              <span className="text-[12px] min-w-0" style={{ color: CAMPUS.ink }}>
                {label}{hint && <span className="block text-[10px]" style={{ color: CAMPUS.inkFaint }}>{hint}</span>}
              </span>
              <input aria-label={`${label} correct`} inputMode="numeric" className={numInput} style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
                value={form[`${k}Correct`]} onChange={e => setForm(f => ({ ...f, [`${k}Correct`]: e.target.value.replace(/\D/g, "").slice(0, 3) }))} />
              <span className="text-center text-[12px]" style={{ color: CAMPUS.inkFaint }}>/</span>
              <input aria-label={`${label} attempted`} inputMode="numeric" className={numInput} style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
                value={form[`${k}Attempted`]} onChange={e => setForm(f => ({ ...f, [`${k}Attempted`]: e.target.value.replace(/\D/g, "").slice(0, 3) }))} />
              <span className="text-right font-mono text-[12px] font-bold" style={{ color: bandColor(p) }}>{fmtPct(p)}</span>
            </div>
          );
        })}
      </div>

      {step && (
        <p className="text-[11.5px] leading-relaxed rounded-lg p-2.5 mb-3" style={{ background: tint(bandColor(topicPct), 10), color: CAMPUS.ink, border: `1px solid ${tint(bandColor(topicPct), 30)}` }}>
          <b style={{ color: bandColor(topicPct) }}>{step.meaning}.</b> {step.next}.
        </p>
      )}

      <label className="block mb-3">
        <span className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>HOURS STUDIED (OPTIONAL)</span>
        <input inputMode="decimal" className="w-24 rounded-lg px-2.5 py-2 text-[13px] font-mono outline-none" placeholder="3.5"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
          value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value.replace(/[^\d.]/g, "").slice(0, 4) }))} />
      </label>

      <label className="block mb-3">
        <span className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>MAIN MISTAKE / NOTES</span>
        <textarea rows={3} maxLength={1500} value={form.mistake} onChange={set("mistake")}
          placeholder={'e.g. "Mixed up circular vs linear arrangements - redo Q7 and Q11 on Sunday."'}
          className="w-full rounded-lg px-3 py-2.5 text-[12.5px] outline-none resize-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </label>

      {doc.type === "sunday" && (
        <div className="rounded-xl p-3 mb-3 space-y-2.5" style={{ background: tint(CAMPUS.gold, 7), border: `1px solid ${tint(CAMPUS.gold, 28)}` }}>
          <p className="text-[10px] font-mono tracking-widest flex items-center gap-1.5" style={{ color: CAMPUS.gold }}><Flag size={11} /> WEEK SIGN-OFF</p>
          <input maxLength={200} value={form.weakest} onChange={set("weakest")} placeholder="Weakest topic this week"
            className="w-full rounded-lg px-3 py-2 text-[12.5px] outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          <input maxLength={400} value={form.repair} onChange={set("repair")} placeholder="Repair plan"
            className="w-full rounded-lg px-3 py-2 text-[12.5px] outline-none" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        </div>
      )}

      {msg && (
        <p className="flex items-start gap-1.5 text-[12px] mb-3" style={{ color: msg.ok ? CAMPUS.good : CAMPUS.bad }}>
          {msg.ok ? <CheckCircle2 size={13} className="mt-[1px]" /> : <AlertCircle size={13} className="mt-[1px]" />} {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <CampusButton icon={busy ? Loader2 : Save} disabled={busy} onClick={() => save()}>{busy ? "Saving..." : "Save log"}</CampusButton>
        {form.status !== LOG_STATUS.DONE && (
          <CampusButton variant="success" icon={CheckCircle2} disabled={busy} onClick={() => { setForm(f => ({ ...f, status: LOG_STATUS.DONE })); save(LOG_STATUS.DONE); }}>
            Save as done
          </CampusButton>
        )}
        {existing && (
          <CampusButton variant="danger" size="sm" icon={Trash2} disabled={busy}
            onClick={async () => {
              if (!window.confirm(`Clear your D${day} log?`)) return;
              setBusy(true);
              try { await clearDayLog(member.uid, day); setMsg({ ok: true, text: "Log cleared." }); }
              catch (e) { setMsg({ ok: false, text: e?.message || "Could not clear." }); }
              finally { setBusy(false); }
            }}>Clear</CampusButton>
        )}
      </div>
      <p className="text-[10.5px] leading-relaxed mt-3" style={{ color: CAMPUS.inkFaint }}>
        Done means done: topic + revision PYQs and GA attempted, scores written, log filled. Scores are your own count -
        nothing here checks your answers.
      </p>
    </CampusCard>
  );
}
