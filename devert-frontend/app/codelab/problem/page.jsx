"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProblemView } from "@/components/codelab/problem-view";

function ProblemRoute() {
  const problemId = useSearchParams().get("id");
  const router = useRouter();
  return <ProblemView problemId={problemId} onBack={() => router.push("/codelab")} />;
}

export default function ProblemPage() {
  return (
    <Suspense fallback={null}>
      <ProblemRoute />
    </Suspense>
  );
}
