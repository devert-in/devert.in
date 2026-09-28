"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays, Clock, Target, Layers, ShieldCheck, CheckCircle2, Hourglass, XCircle, Ban,
  Send, Loader2, AlertCircle, Pencil, Trash2, ListChecks, GraduationCap, BarChart3, Megaphone,
  Flag, Lock, BookOpen, Sigma, Repeat,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusGoogleButton } from "@/components/campus/campus-ui";
import {
  currentPlanDay, hasPlanStarted, hasPlanEnded, formatPlanDate, GATE_PLAN_LAST_DAY,
  REQUEST_STATUS, REQUEST_STAGES, REQUEST_PAPERS, REQUEST_ATTEMPTS, REQUEST_LIMITS,
  submitJoinRequest, withdrawJoinRequest, validateRequest, WEEK_KEYS,
} from "@/lib/gatePlan";
import {
  PLAN_NAME, PLAN_TAGLINE, HEADLINE_NUMBERS, GOAL, PHASES, FOUR_RULES, EXAM_FORMAT, OVERLAP,
  CS_ONLY, DA_ONLY, TIERS, MARKS, MARKS_MATH, MARKS_CAVEAT, WEEKS, WHY_BUILT_THIS_WAY, CHECKLIST_ITEM_COUNT,
} from "@/lib/gatePlanGuide";
import { Kicker, Panel } from "@/components/campus/gate/gate-plan-ui";

// The public face of the GATE 2027 Plan: what it is, the whole 13-week
// outline, and the request-to-join flow. Everything on this screen is
// readable without an account - a student deciding whether to ask for a seat
// needs to see what they are asking for. The day cards themselves are the
// member-only part (firestore.rules: isGatePlanMember()).

const TONE = { good: CAMPUS.good, cyan: CAMPUS.cyan, purple: CAMPUS.purple, warn: CAMPUS.warn, muted: CAMPUS.inkSoft };

export function PlanLanding({ index, settings, request, member }) {
  const { user } = useAuth();
  const live = currentPlanDay();
  const started = hasPlanStarted();
  const ended = hasPlanEnded();

  return (
    <div className="space-y-5">
      {/* ── hero ── */}
      <CampusCard className="p-5 sm:p-7 relative overflow-hidden">
        <Kicker icon={GraduationCap} color={CAMPUS.teal}>GATE 2027 · CS + DA · REQUEST-TO-JOIN COHORT</Kicker>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5" style={{ color: CAMPUS.ink }}>{PLAN_NAME}</h2>
        <p className="text-[14px] font-semibold mb-3" style={{ color: CAMPUS.teal }}>{PLAN_TAGLINE}</p>
        <p className="text-[13px] leading-relaxed max-w-3xl mb-5" style={{ color: CAMPUS.inkSoft }}>{GOAL}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
          {HEADLINE_NUMBERS.map(n => (
            <div key={n.label} className="rounded-xl px-3.5 py-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <span className="block font-mono text-xl sm:text-2xl font-bold leading-none" style={{ color: CAMPUS.ink }}>{n.value}</span>
              <span className="block text-[11.5px] font-semibold mt-1" style={{ color: CAMPUS.inkSoft }}>{n.label}</span>
              <span className="block text-[10.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{n.sub}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CampusChip color={CAMPUS.cyan} icon={CalendarDays}>
            {!started ? `Starts ${formatPlanDate(0, { weekday: true })}` : ended ? "The Dec plan has ended - January is mocks"
              : `D${live} of D${GATE_PLAN_LAST_DAY} is live · ${formatPlanDate(live, { weekday: true })}`}
          </CampusChip>
          <CampusChip color={CAMPUS.gold} icon={ShieldCheck}>Every request is reviewed by the DeVert admin</CampusChip>
        </div>
      </CampusCard>

      {settings.notice && (
        <CampusCard className="p-4 flex items-start gap-3" style={{ border: `1px solid ${tint(CAMPUS.cyan, 40)}` }}>
          <Megaphone size={16} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.cyan }} />
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: CAMPUS.ink }}>{settings.notice}</p>
        </CampusCard>
      )}

      {/* ── request ── */}
      <RequestPanel user={user} settings={settings} request={request} member={member} />

      {/* ── what members get ── */}
      <Panel title="WHAT A SEAT GIVES YOU" icon={Lock}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
          {[
            [CalendarDays, "96 day cards", "Subject, topic and the exact subtopics for every day, with the Must-know exit test."],
            [Sigma, "523-formula bank", "Every formula and key fact from the plan, filterable by subject, week and paper."],
            [BookOpen, "Lectures + PYQs, per day", "A primary and backup lecture source and the GATE Overflow PYQ search for the topic."],
            [Repeat, "Evening keep-warm", "Spaced revision (1 or 3 weeks back) and 12 Compiler Design evenings in December."],
            [BarChart3, "Your tracker", "Daily scores, accuracy bands, weekly tracker, streaks and a weak-topic repair list."],
            [ListChecks, "Topic checklist", `Learned, PYQs, 70% and Revised for all ${CHECKLIST_ITEM_COUNT} checklist topics.`],
          ].map(([Icon, t, d]) => (
            <div key={t} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={13} style={{ color: CAMPUS.teal }} />
                <span className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>{t}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{d}</p>
            </div>
          ))}
        </div>
      </Panel>

      <PlanOverview index={index} />
    </div>
  );
}

// The method + the outline. Also rendered inside the member workspace's Guide
// tab, which is why it is exported separately from the landing.
export function PlanOverview({ index, compact = false }) {
  const byWeek = useMemo(() => {
    const m = {};
    for (const d of index || []) (m[d.week] = m[d.week] || []).push(d);
    return m;
  }, [index]);

  return (
    <div className="space-y-5">
      {/* phases */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PHASES.map((p, i) => (
          <CampusCard key={p.key} className="p-4">
            <span className="text-[10px] font-mono tracking-widest" style={{ color: i === 3 ? CAMPUS.orange : CAMPUS.teal }}>{p.label.toUpperCase()}</span>
            <p className="text-[12px] font-mono mt-0.5 mb-1.5" style={{ color: CAMPUS.inkFaint }}>{p.dates} · D{p.firstDay}-D{p.lastDay}</p>
            <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.ink }}>{p.text}</p>
          </CampusCard>
        ))}
      </div>

      {/* four rules */}
      <Panel title="THE FOUR RULES" icon={Flag}>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-2">
          {FOUR_RULES.map((r, i) => (
            <div key={r.title} className="flex items-start gap-3 rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-[13px] font-bold"
                style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>{i + 1}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{r.title}</p>
                <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
        {!compact && (
          <div className="mt-4 grid sm:grid-cols-2 gap-x-5 gap-y-2">
            {WHY_BUILT_THIS_WAY.map(([k, v]) => (
              <p key={k} className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                <b style={{ color: CAMPUS.ink }}>{k}.</b> {v}
              </p>
            ))}
          </div>
        )}
      </Panel>

      {/* the 13-week outline */}
      <Panel title="THE ROADMAP, WEEK BY WEEK" icon={Layers}>
        {!index?.length ? (
          <p className="text-[12.5px] mt-2" style={{ color: CAMPUS.inkFaint }}>The day-by-day outline is being loaded into the platform.</p>
        ) : (
          <div className="mt-2 divide-y" style={{ borderColor: CAMPUS.line }}>
            {WEEK_KEYS.filter(k => byWeek[k]).map(k => {
              const days = byWeek[k];
              const meta = WEEKS[k] || {};
              const topics = days.filter(d => d.type === "topic");
              const subjects = [...new Set(topics.map(d => d.subject))];
              const ga = days.find(d => d.type === "sunday")?.ga || days[0]?.ga;
              return (
                <div key={k} className="py-3 grid lg:grid-cols-[150px_1fr] gap-x-4 gap-y-1.5" style={{ borderColor: CAMPUS.line }}>
                  <div>
                    <p className="font-mono text-[12px] font-bold" style={{ color: CAMPUS.teal }}>{k === "Start" ? "DAY 0" : k.toUpperCase()}</p>
                    <p className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{meta.dates} · D{days[0].day}{days.length > 1 ? `-D${days[days.length - 1].day}` : ""}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{meta.title}</p>
                    {subjects.length > 0 && (
                      <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
                        {topics.map(d => d.topic).join(" · ")}
                      </p>
                    )}
                    {meta.goal && (
                      <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: CAMPUS.inkFaint }}>
                        <Target size={10} className="inline -mt-0.5 mr-1" style={{ color: CAMPUS.gold }} />
                        {k === "Lock-in" ? "By Dec 31: " : k === "Start" ? "" : "Goal by Sunday: "}{meta.goal}
                      </p>
                    )}
                    {ga && k !== "Start" && k !== "Lock-in" && (
                      <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>GA theme: <span style={{ color: CAMPUS.inkSoft }}>{ga}</span></p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* exam + overlap */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Panel title="THE EXAM YOU ARE PREPARING FOR" icon={Clock}>
          <dl className="mt-2 space-y-2.5">
            {EXAM_FORMAT.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{k.toUpperCase()}</dt>
                <dd className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.ink }}>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="PRIORITY TIERS" icon={BarChart3}>
          <div className="mt-2 space-y-2">
            {TIERS.map(t => (
              <div key={t.tier} className="rounded-xl p-3" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, borderLeft: `3px solid ${TONE[t.tone]}` }}>
                <p className="text-[10px] font-mono tracking-widest" style={{ color: TONE[t.tone] }}>{t.tier.toUpperCase()}</p>
                <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: CAMPUS.ink }}>{t.subjects}</p>
                <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{t.why}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="THE CS + DA OVERLAP - STUDY ONCE, USE TWICE" icon={Layers}>
        <div className="mt-2 overflow-x-auto -mx-1">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                {["Subject", "CS scope", "DA scope", "How to handle it"].map(h => (
                  <th key={h} className="px-2 py-2 text-[10px] font-mono tracking-widest font-normal" style={{ color: CAMPUS.inkFaint }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OVERLAP.map(r => (
                <tr key={r.subject} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                  <td className="px-2 py-2.5 align-top text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>{r.subject}</td>
                  <td className="px-2 py-2.5 align-top text-[11.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{r.cs}</td>
                  <td className="px-2 py-2.5 align-top text-[11.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{r.da}</td>
                  <td className="px-2 py-2.5 align-top text-[11.5px] leading-relaxed" style={{ color: CAMPUS.teal }}>{r.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
          <div className="rounded-xl p-3" style={{ background: tint(CAMPUS.blue, 8), border: `1px solid ${tint(CAMPUS.blue, 30)}` }}>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.blue }}>CS ONLY</p>
            <p className="text-[12px]" style={{ color: CAMPUS.ink }}>{CS_ONLY.join(" · ")}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: tint(CAMPUS.purple, 8), border: `1px solid ${tint(CAMPUS.purple, 30)}` }}>
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.purple }}>DA ONLY</p>
            <p className="text-[12px]" style={{ color: CAMPUS.ink }}>{DA_ONLY.join(" · ")}</p>
          </div>
        </div>
      </Panel>

      <Panel title="MARKS & THE 90-MARK COVERAGE MATH" icon={Target}>
        <div className="grid lg:grid-cols-2 gap-4 mt-2">
          {["CS", "DA"].map(p => (
            <div key={p}>
              <p className="text-[11px] font-mono tracking-widest mb-1.5" style={{ color: p === "CS" ? CAMPUS.blue : CAMPUS.purple }}>{p} PAPER</p>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                    {["Section", "~Marks", "Covered by Dec 31"].map(h => (
                      <th key={h} className="py-1.5 pr-2 text-[9.5px] font-mono tracking-widest font-normal" style={{ color: CAMPUS.inkFaint }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MARKS[p].map(([s, range, cov]) => (
                    <tr key={s} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                      <td className="py-1.5 pr-2 text-[12px]" style={{ color: CAMPUS.ink }}>{s}</td>
                      <td className="py-1.5 pr-2 text-[12px] font-mono" style={{ color: CAMPUS.inkSoft }}>{range || ""}</td>
                      <td className="py-1.5 text-[12px] font-mono" style={{ color: CAMPUS.teal }}>{cov || ""}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 text-[12px] font-semibold" style={{ color: CAMPUS.ink }}>Total covered</td>
                    <td />
                    <td className="py-1.5 text-[12px] font-mono font-bold" style={{ color: CAMPUS.teal }}>{MARKS.covered[p]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] leading-relaxed mt-4 rounded-xl p-3" style={{ color: CAMPUS.ink, background: tint(CAMPUS.teal, 8), border: `1px solid ${tint(CAMPUS.teal, 25)}` }}>{MARKS_MATH}</p>
        <p className="text-[11px] mt-2" style={{ color: CAMPUS.inkFaint }}>{MARKS_CAVEAT} Confirm exam dates on the official GATE 2027 website.</p>
      </Panel>
    </div>
  );
}

// ── the request panel ─────────────────────────────────────────────────────

function RequestPanel({ user, settings, request, member }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <CampusCard className="p-5 sm:p-6" style={{ border: `1px solid ${tint(CAMPUS.teal, 35)}` }}>
        <Kicker icon={Send} color={CAMPUS.teal}>REQUEST A SEAT</Kicker>
        <h3 className="text-lg font-bold mb-1" style={{ color: CAMPUS.ink }}>Sign in to request a seat</h3>
        <p className="text-[12.5px] leading-relaxed mb-4 max-w-2xl" style={{ color: CAMPUS.inkSoft }}>
          Seats are approved one by one. Sign in with the Google account you use on DeVert, fill a short form, and you will get a
          notification the moment the admin decides.
        </p>
        <div className="max-w-xs"><CampusGoogleButton style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }} /></div>
      </CampusCard>
    );
  }

  // Revoked access: the member document still exists (so a restore keeps the
  // logs), and the request carries the admin's note.
  if (member && member.access === "revoked") {
    return (
      <StatusCard icon={Ban} color={CAMPUS.bad} title="Your access to the plan was revoked"
        body={member.revokeNote || request?.reviewNote || "Contact the DeVert admin if you think this is a mistake."} />
    );
  }

  const status = request?.status;

  if (status === REQUEST_STATUS.APPROVED) {
    // The member listener is a separate snapshot and can land a beat after
    // the request's - a brief "approved, opening" state beats flashing the form.
    return <StatusCard icon={CheckCircle2} color={CAMPUS.good} title="Approved - opening your plan..." body="Your seat is confirmed." />;
  }

  if (status === REQUEST_STATUS.PENDING && !editing) {
    return (
      <CampusCard className="p-5 sm:p-6" style={{ border: `1px solid ${tint(CAMPUS.gold, 40)}` }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.gold, 14), color: CAMPUS.gold }}>
            <Hourglass size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold" style={{ color: CAMPUS.ink }}>Request pending review</h3>
            <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>
              The DeVert admin reviews every request personally. You will get a notification when it is decided -
              until then, the outline below is open to read.
            </p>
            <RequestSummary request={request} />
            {error && <ErrorLine text={error} />}
            <div className="flex flex-wrap gap-2 mt-3.5">
              <CampusButton variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Edit request</CampusButton>
              <CampusButton variant="danger" size="sm" icon={busy ? Loader2 : Trash2} disabled={busy}
                onClick={async () => {
                  if (!window.confirm("Withdraw your request? You can file a new one while requests are open.")) return;
                  setBusy(true); setError("");
                  try { await withdrawJoinRequest(user.uid); } catch (e) { setError(e?.message || "Could not withdraw."); }
                  finally { setBusy(false); }
                }}>Withdraw</CampusButton>
            </div>
          </div>
        </div>
      </CampusCard>
    );
  }

  if (!settings.requestsOpen && status !== REQUEST_STATUS.PENDING && status !== REQUEST_STATUS.REJECTED) {
    return (
      <StatusCard icon={Lock} color={CAMPUS.inkSoft} title="Requests are closed right now"
        body={settings.closedMessage || "The cohort is not taking new requests at the moment. Check back soon."} />
    );
  }

  const rejected = status === REQUEST_STATUS.REJECTED;
  return (
    <CampusCard className="p-5 sm:p-6" style={{ border: `1px solid ${tint(rejected ? CAMPUS.bad : CAMPUS.teal, 35)}` }}>
      {rejected && !editing ? (
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.bad, 14), color: CAMPUS.bad }}>
            <XCircle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold" style={{ color: CAMPUS.ink }}>Your request was not approved</h3>
            {request.reviewNote
              ? <p className="text-[12.5px] leading-relaxed mt-1 rounded-lg p-2.5 whitespace-pre-line" style={{ color: CAMPUS.ink, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                  <span className="block text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>NOTE FROM THE ADMIN</span>
                  {request.reviewNote}
                </p>
              : <p className="text-[12.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>No note was left.</p>}
            {settings.requestsOpen
              ? <CampusButton size="sm" className="mt-3.5" icon={Pencil} onClick={() => setEditing(true)}>Update and apply again</CampusButton>
              : <p className="text-[12px] mt-3" style={{ color: CAMPUS.inkFaint }}>Requests are closed right now, so you cannot re-apply yet.</p>}
          </div>
        </div>
      ) : (
        <RequestForm user={user} initial={request} onDone={() => setEditing(false)}
          onCancel={request ? () => setEditing(false) : null} resubmit={rejected} />
      )}
    </CampusCard>
  );
}

function StatusCard({ icon: Icon, color, title, body }) {
  return (
    <CampusCard className="p-5 flex items-start gap-3" style={{ border: `1px solid ${tint(color, 35)}` }}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(color, 14), color }}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold" style={{ color: CAMPUS.ink }}>{title}</h3>
        {body && <p className="text-[12.5px] leading-relaxed mt-0.5 whitespace-pre-line" style={{ color: CAMPUS.inkSoft }}>{body}</p>}
      </div>
    </CampusCard>
  );
}

function ErrorLine({ text }) {
  return (
    <p className="flex items-start gap-1.5 text-[12px] mt-3" style={{ color: CAMPUS.bad }}>
      <AlertCircle size={13} className="flex-shrink-0 mt-[1px]" /> {text}
    </p>
  );
}

const labelOf = (list, v) => list.find(x => x.value === v)?.label || v || "-";

function RequestSummary({ request }) {
  const rows = [
    ["Papers", labelOf(REQUEST_PAPERS, request.papers)],
    ["Stage", labelOf(REQUEST_STAGES, request.stage)],
    ["College", request.college || "-"],
    ["Attempt", request.attempt === "repeat" ? `Attempted before${request.prevScore ? ` (${request.prevScore})` : ""}` : "First attempt"],
  ];
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-lg px-2.5 py-2" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          <dt className="text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{k.toUpperCase()}</dt>
          <dd className="text-[12px] truncate" style={{ color: CAMPUS.ink }} title={v}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const inputStyle = { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink };
const inputCls = "w-full rounded-lg px-3 py-2.5 text-[13px] outline-none focus:ring-2";

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>{label}</span>
      {children}
      {hint && <span className="block text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>{hint}</span>}
    </label>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const on = o.value === value;
        return (
          <button type="button" key={o.value} onClick={() => onChange(o.value)} aria-pressed={on}
            className="text-[12px] font-semibold px-3 py-2 rounded-lg transition-colors"
            style={{ background: on ? CAMPUS.tealTint : CAMPUS.paper, color: on ? CAMPUS.teal : CAMPUS.inkSoft, border: `1px solid ${on ? CAMPUS.teal : CAMPUS.line}` }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RequestForm({ user, initial, onDone, onCancel, resubmit }) {
  const { userData } = useAuth();
  const [form, setForm] = useState(() => ({
    name: initial?.name || userData?.displayName || user?.displayName || "",
    email: initial?.email || user?.email || "",
    papers: initial?.papers || "BOTH",
    stage: initial?.stage || "final-year",
    college: initial?.college || userData?.college || "",
    gradYear: initial?.gradYear || "",
    attempt: initial?.attempt || "first",
    prevScore: initial?.prevScore || "",
    goal: initial?.goal || "",
    hoursOk: !!initial?.hoursOk,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));

  async function submit(e) {
    e.preventDefault();
    const problem = validateRequest(form);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    try {
      await submitJoinRequest(user.uid, form);
      onDone?.();
    } catch (err) {
      setError(/permission/i.test(err?.message || "") ? "Requests may have just closed - refresh and try again." : (err?.message || "Could not send the request."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Kicker icon={Send} color={CAMPUS.teal}>{resubmit ? "RE-APPLY" : initial ? "EDIT YOUR REQUEST" : "REQUEST A SEAT"}</Kicker>
      <h3 className="text-lg font-bold mb-1" style={{ color: CAMPUS.ink }}>{initial ? "Your request" : "Request to join the GATE 2027 Plan"}</h3>
      <p className="text-[12.5px] leading-relaxed mb-4 max-w-2xl" style={{ color: CAMPUS.inkSoft }}>
        Tell the admin a little about where you are. Nothing here is shown to other students.
      </p>

      <div className="grid sm:grid-cols-2 gap-3.5">
        <Field label="YOUR NAME">
          <input className={inputCls} style={inputStyle} value={form.name} onChange={set("name")} maxLength={REQUEST_LIMITS.name} required />
        </Field>
        <Field label="EMAIL" hint="Where the admin can reach you. Defaults to your sign-in email.">
          <input className={inputCls} style={inputStyle} type="email" value={form.email} onChange={set("email")} maxLength={REQUEST_LIMITS.email} />
        </Field>
        <Field label="WHICH PAPERS" className="sm:col-span-2">
          <Segmented options={REQUEST_PAPERS} value={form.papers} onChange={set("papers")} />
        </Field>
        <Field label="WHERE YOU ARE NOW" className="sm:col-span-2">
          <Segmented options={REQUEST_STAGES} value={form.stage} onChange={set("stage")} />
        </Field>
        <Field label="COLLEGE / ORGANISATION">
          <input className={inputCls} style={inputStyle} value={form.college} onChange={set("college")} maxLength={REQUEST_LIMITS.college} />
        </Field>
        <Field label="GRADUATION YEAR">
          <input className={inputCls} style={inputStyle} inputMode="numeric" placeholder="2027" value={form.gradYear}
            onChange={e => set("gradYear")(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </Field>
        <Field label="GATE ATTEMPT" className={form.attempt === "repeat" ? "" : "sm:col-span-2"}>
          <Segmented options={REQUEST_ATTEMPTS} value={form.attempt} onChange={set("attempt")} />
        </Field>
        {form.attempt === "repeat" && (
          <Field label="PREVIOUS SCORE (OPTIONAL)">
            <input className={inputCls} style={inputStyle} placeholder="e.g. 42 marks, GATE 2026 CS" value={form.prevScore} onChange={set("prevScore")} maxLength={REQUEST_LIMITS.prevScore} />
          </Field>
        )}
        <Field label="YOUR GOAL (OPTIONAL)" className="sm:col-span-2" hint={`${form.goal.length} / ${REQUEST_LIMITS.goal}`}>
          <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={3} value={form.goal} onChange={set("goal")} maxLength={REQUEST_LIMITS.goal}
            placeholder="M.Tech at an IIT, a PSU through CS, AI/DS M.Tech through DA..." />
        </Field>
      </div>

      <label className="flex items-start gap-2.5 mt-4 rounded-xl p-3 cursor-pointer" style={{ background: CAMPUS.paper, border: `1px solid ${form.hoursOk ? CAMPUS.teal : CAMPUS.line}` }}>
        <input type="checkbox" checked={form.hoursOk} onChange={set("hoursOk")} className="mt-0.5 accent-current" style={{ color: CAMPUS.teal }} />
        <span className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.ink }}>
          I can commit <b>3.5 hours every day</b> until February 2027 - Block A (2.5 h topic) and Block B (1 h revision + GA), with
          Sunday for the weekly test. No zero days.
        </span>
      </label>

      {error && <ErrorLine text={error} />}

      <div className="flex flex-wrap gap-2 mt-4">
        <CampusButton type="submit" icon={busy ? Loader2 : Send} disabled={busy}>
          {busy ? "Sending..." : resubmit ? "Send again" : initial ? "Save request" : "Request to join"}
        </CampusButton>
        {onCancel && <CampusButton type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</CampusButton>}
      </div>
    </form>
  );
}
