"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CampusApp } from "@/components/campus/campus-app";

const TABS = ["dashboard", "profile", "learning", "dsa", "companyVault", "assessments", "contests", "leaderboard", "manage"];

function CampusRoute() {
  const tab = useSearchParams().get("tab");
  return <CampusApp initialTab={TABS.includes(tab) ? tab : "dashboard"} />;
}

export default function CampusPage() {
  return (
    <Suspense fallback={null}>
      <CampusRoute />
    </Suspense>
  );
}
