"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck, Layers, BarChart3, Sigma, ListChecks, Compass, Library, Eye, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusSkeleton, CampusTabBar, CampusButton } from "@/components/campus/campus-ui";
import { useGate } from "@/components/campus/gate/gate-app";
import {
  fetchPlanIndex, subscribeToPlanSettings, subscribeToRequest, subscribeToMembership, isActiveMember,
  currentPlanDay, GATE_PLAN_LAST_DAY, PAPER_LABEL,
} from "@/lib/gatePlan";
import { PLAN_NAME } from "@/lib/gatePlanGuide";
import { PlanLanding } from "@/components/campus/gate/gate-plan-landing";
import { PlanToday, PlanJourney, PlanTracker } from "@/components/campus/gate/gate-plan-member";
import { PlanFormulaBank, PlanChecklist, PlanGuide, PlanResources } from "@/components/campus/gate/gate-plan-library";
import { PlanDayView } from "@/components/campus/gate/gate-plan-day";

// GATE 2027 Plan - the request-to-join, 96-day CS + DA cohort (lib/gatePlan.js).
//
// A section of the ONE GATE workspace rather than a surface of its own:
// CLAUDE.md is explicit that GATE lives at campus.devert.in/gate and must not
// grow a second destination. It mounts wherever the workspace does (the global
// /gate route and an institution's ?tab=gate) with one cohort behind both.
//
// Three audiences, one screen:
//   - anyone without an active seat sees the landing + request flow;
//   - an approved member sees their workspace (tabs below, or a day card);
//   - the platform admin, who can read everything the rules allow, gets the
//     member workspace in read-only preview so they can check the content
//     without holding a seat, and can flip to the public landing.
//
// URL: ?section=plan&view=<tab>&day=<n> - owned by gate-app.jsx's screen sync,
// so a shared link to "D27" opens D27.

export const PLAN_TABS = [
  { key: "today", label: "Today", icon: CalendarCheck },
  { key: "journey", label: "All 96 days", icon: Layers },
  { key: "tracker", label: "Weekly tracker", icon: BarChart3 },
  { key: "formulas", label: "Formula bank", icon: Sigma },
  { key: "checklist", label: "Checklist", icon: ListChecks },
  { key: "guide", label: "Plan guide", icon: Compass },
  { key: "resources", label: "Resources", icon: Library },
];

const DEFAULT_SETTINGS = { requestsOpen: true, notice: "", closedMessage: "" };

export function GatePlan() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { screen, go } = useGate();
  const [index, setIndex] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // Snapshots tagged with the uid they belong to, so a sign-out (or a switch
  // of account) reads as "no request, no seat" without resetting state inside
  // the effect.
  const [reqSnap, setReqSnap] = useState({ uid: null, value: undefined });
  const [memSnap, setMemSnap] = useState({ uid: null, value: undefined });
  const [publicView, setPublicView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPlanIndex().then(d => !cancelled && setIndex(d)).catch(() => !cancelled && setIndex([]));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => subscribeToPlanSettings(setSettings), []);

  const uid = user?.uid || null;
  useEffect(() => {
    if (authLoading || !uid) return undefined;
    const a = subscribeToRequest(uid, (value) => setReqSnap({ uid, value }));
    const b = subscribeToMembership(uid, (value) => setMemSnap({ uid, value }));
    return () => { a(); b(); };
  }, [uid, authLoading]);
  const request = !uid ? null : reqSnap.uid === uid ? reqSnap.value : undefined;
  const member = !uid ? null : memSnap.uid === uid ? memSnap.value : undefined;

  const view = PLAN_TABS.some(t => t.key === screen.view) ? screen.view : "today";
  const rawDay = screen.day == null ? null : Number(screen.day);
  const day = Number.isInteger(rawDay) && rawDay >= 0 && rawDay <= GATE_PLAN_LAST_DAY ? rawDay : null;
  const setTab = (v) => go("plan", { view: v });
  const openDay = (d) => go("plan", { view, day: d });

  const loading = index === null || authLoading || (user && (request === undefined || member === undefined));
  if (loading) {
    return (
      <div className="space-y-4">
        <CampusCard className="p-5"><CampusSkeleton height={120} /></CampusCard>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton height={60} /></CampusCard>)}
        </div>
      </div>
    );
  }

  const active = isActiveMember(member);
  const adminPreview = !active && isAdmin;

  if ((!active && !adminPreview) || (adminPreview && publicView)) {
    return (
      <div className="space-y-4">
        {adminPreview && (
          <AdminStrip label="Viewing the public landing" action="Open member preview" onClick={() => setPublicView(false)} />
        )}
        <PlanLanding index={index} settings={settings} request={request} member={member} />
      </div>
    );
  }

  const live = currentPlanDay();

  return (
    <div className="space-y-4">
      {adminPreview && <AdminStrip label="Admin preview - read-only member view" action="View public landing" onClick={() => setPublicView(true)} />}

      <CampusCard className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>
            <GraduationCap size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
              GATE 2027 · CS + DA · {live < 0 ? "STARTS SUN 27 SEP" : `D${live} OF D${GATE_PLAN_LAST_DAY}`}
            </p>
            <h2 className="text-[17px] font-bold leading-tight" style={{ color: CAMPUS.ink }}>{PLAN_NAME}</h2>
          </div>
          {active && member.papers && <CampusChip color={CAMPUS.teal}>{PAPER_LABEL[member.papers] || member.papers}</CampusChip>}
          {active && <CampusChip color={CAMPUS.good}>Member since D{member.approvedOnDay ?? 0}</CampusChip>}
        </div>
        {day == null && (
          <div className="mt-4 -mx-1 overflow-x-auto no-scrollbar">
            <CampusTabBar tabs={PLAN_TABS} value={view} onChange={setTab} size="sm" />
          </div>
        )}
      </CampusCard>

      {day != null ? (
        <PlanDayView day={day} member={active ? member : null} adminPreview={adminPreview}
          onOpenDay={openDay} onBack={() => go("plan", { view })} />
      ) : view === "journey" ? <PlanJourney index={index} member={member} onOpenDay={openDay} />
        : view === "tracker" ? <PlanTracker index={index} member={member} onOpenDay={openDay} />
        : view === "formulas" ? <PlanFormulaBank onOpenDay={openDay} />
        : view === "checklist" ? <PlanChecklist member={active ? member : null} readOnly={!active} />
        : view === "guide" ? <PlanGuide index={index} />
        : view === "resources" ? <PlanResources />
        : <PlanToday index={index} member={active ? member : null} settings={settings} adminPreview={adminPreview} onOpenDay={openDay} onTab={setTab} />}
    </div>
  );
}

// The Overview's pointer to the plan. It reads the viewer's own request and
// membership so the call to action is the right one - "Request a seat",
// "Request pending", or "Open today" - rather than a generic banner.
export function PlanSpotlight({ onOpen }) {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const [reqSnap, setReqSnap] = useState({ uid: null, value: null });
  const [memSnap, setMemSnap] = useState({ uid: null, value: null });
  useEffect(() => {
    if (!uid) return undefined;
    const a = subscribeToRequest(uid, (value) => setReqSnap({ uid, value }));
    const b = subscribeToMembership(uid, (value) => setMemSnap({ uid, value }));
    return () => { a(); b(); };
  }, [uid]);
  const request = reqSnap.uid === uid ? reqSnap.value : null;
  const member = memSnap.uid === uid ? memSnap.value : null;

  const live = currentPlanDay();
  const active = isActiveMember(member);
  const cta = active ? `Open D${Math.max(0, live)}` : request?.status === "pending" ? "Request pending" : "Request a seat";
  return (
    <CampusCard hover onClick={onOpen} className="p-4 sm:p-5 flex flex-wrap items-center gap-3"
      style={{ border: `1px solid ${tint(CAMPUS.teal, 38)}` }}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint(CAMPUS.teal, 14), color: CAMPUS.teal }}>
        <CalendarCheck size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.teal }}>
          {active ? "YOUR COHORT" : "NEW · REQUEST-TO-JOIN COHORT"}{live >= 0 && live <= GATE_PLAN_LAST_DAY ? ` · D${live} IS LIVE` : ""}
        </p>
        <p className="text-[14.5px] font-bold" style={{ color: CAMPUS.ink }}>{PLAN_NAME} · CS + DA in 96 days</p>
        <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>A day card for every date to Dec 31, a 523-formula bank, and a tracker - 3.5 hours a day.</p>
      </div>
      <CampusButton size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>{cta}</CampusButton>
    </CampusCard>
  );
}

function AdminStrip({ label, action, onClick }) {
  return (
    <CampusCard className="px-4 py-2.5 flex flex-wrap items-center gap-2" style={{ border: `1px solid ${tint(CAMPUS.gold, 40)}` }}>
      <Eye size={14} style={{ color: CAMPUS.gold }} />
      <span className="text-[12px] font-semibold" style={{ color: CAMPUS.ink }}>{label}</span>
      <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Requests and members are managed at devert.in/admin → GATE → Prep cohort.</span>
      <CampusButton variant="ghost" size="sm" className="ml-auto" onClick={onClick}>{action}</CampusButton>
    </CampusCard>
  );
}
