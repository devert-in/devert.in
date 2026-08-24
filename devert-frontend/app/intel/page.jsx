"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IntelApp } from "@/components/intel/intel-app";

function IntelRoute() {
  const params = useSearchParams();
  const tab = params.get("tab");
  const opp = params.get("opp");
  return (
    <IntelApp initialTab={["feed", "roadmaps", "opportunities"].includes(tab) ? tab : "feed"}
      initialOppId={opp || null} />
  );
}

export default function IntelPage() {
  return (
    <Suspense fallback={null}>
      <IntelRoute />
    </Suspense>
  );
}
