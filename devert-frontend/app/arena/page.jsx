"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArenaApp } from "@/components/arena/arena-app";

function ArenaRoute() {
  const tab = useSearchParams().get("tab");
  return <ArenaApp initialTab={["solo", "contests"].includes(tab) ? tab : "solo"} />;
}

export default function ArenaPage() {
  return (
    <Suspense fallback={null}>
      <ArenaRoute />
    </Suspense>
  );
}
