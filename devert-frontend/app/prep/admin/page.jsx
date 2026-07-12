"use client";

// /prep/admin — the control panel (design §2). Single page, tab layout,
// RequireAdmin-gated. Each tab is its own panel component under
// components/prep/admin/ so this file stays a thin router between them.

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UploadCloud,
  ListChecks,
  ClipboardList,
  BookOpen,
  CalendarDays,
  ShieldCheck,
  Layers,
  Megaphone,
  PackagePlus,
} from "lucide-react";
import { RequireAdmin } from "@/components/prep/guards";
import { PrepShell, BracketButton } from "@/components/prep/ui";
import UploadPanel from "@/components/prep/admin/upload-panel";
import QuestionsPanel from "@/components/prep/admin/questions-panel";
import ExamBuilderPanel from "@/components/prep/admin/exam-builder";
import CoursesPanel from "@/components/prep/admin/courses-panel";
import DailyPanel from "@/components/prep/admin/daily-panel";
import RolesPanel from "@/components/prep/admin/roles-panel";
import GroupsPanel from "@/components/prep/admin/groups-panel";
import AnnouncePanel from "@/components/prep/admin/announce-panel";
import StarterPackPanel from "@/components/prep/admin/starter-pack";

const TABS = [
  { id: "upload", label: "UPLOAD", icon: UploadCloud, Component: UploadPanel },
  { id: "questions", label: "QUESTIONS", icon: ListChecks, Component: QuestionsPanel },
  { id: "exams", label: "EXAM_BUILDER", icon: ClipboardList, Component: ExamBuilderPanel },
  { id: "courses", label: "COURSES", icon: BookOpen, Component: CoursesPanel },
  { id: "daily", label: "DAILY", icon: CalendarDays, Component: DailyPanel },
  { id: "roles", label: "ROLES", icon: ShieldCheck, Component: RolesPanel },
  { id: "groups", label: "GROUPS", icon: Layers, Component: GroupsPanel },
  { id: "announce", label: "ANNOUNCE", icon: Megaphone, Component: AnnouncePanel },
  { id: "starter", label: "STARTER_PACK", icon: PackagePlus, Component: StarterPackPanel },
];

function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const initial = TABS.some((t) => t.id === requested) ? requested : "upload";
  const [tab, setTab] = useState(initial);

  const goTab = useCallback(
    (id) => {
      setTab(id);
      router.replace(`/prep/admin?tab=${id}`, { scroll: false });
    },
    [router]
  );

  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const Active = active.Component;

  return (
    <>
      <div
        role="tablist"
        aria-label="Admin sections"
        className="flex items-center gap-2 flex-wrap mb-8 pb-5 border-b border-white/8"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <BracketButton
              key={t.id}
              size="sm"
              variant={isActive ? "cyan" : "ghost"}
              onClick={() => goTab(t.id)}
              aria-label={t.label}
            >
              <Icon size={11} className="inline mr-1.5 -mt-0.5" />
              {t.label}
            </BracketButton>
          );
        })}
      </div>
      <div role="tabpanel">
        <Active />
      </div>
    </>
  );
}

function AdminPageInner() {
  return (
    <PrepShell
      kicker="// /prep/admin — control_panel.sh"
      title="ADMIN"
      accent="CONTROL"
      subtitle="Questions, exams, courses, daily tasks, roles, groups, and announcements — one terminal."
      maxWidth="max-w-7xl"
    >
      <Suspense fallback={<p className="font-mono text-xs text-white/30">{"// loading control panel…"}</p>}>
        <AdminTabs />
      </Suspense>
    </PrepShell>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminPageInner />
    </RequireAdmin>
  );
}
