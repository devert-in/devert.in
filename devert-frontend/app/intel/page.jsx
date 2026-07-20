"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IntelApp } from "@/components/intel/intel-app";

function IntelRoute() {
  const tab = useSearchParams().get("tab");
  return <IntelApp initialTab={["feed", "roadmaps"].includes(tab) ? tab : "feed"} />;
}

export default function IntelPage() {
  return (
    <Suspense fallback={null}>
      <IntelRoute />
    </Suspense>
  );
}
