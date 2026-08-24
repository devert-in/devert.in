"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContestAttemptView } from "@/components/contests/contest-attempt-view";

function ContestAttemptRoute() {
  const contestId = useSearchParams().get("id");
  const router = useRouter();
  return (
    <ContestAttemptView
      contestId={contestId}
      onBack={(id) => router.push(`/arena/contests/details?id=${id}`)}
      onViewResults={(id) => router.push(`/arena/contests/results?id=${id}`)}
    />
  );
}

export default function ContestAttemptPage() {
  return (
    <Suspense fallback={null}>
      <ContestAttemptRoute />
    </Suspense>
  );
}
