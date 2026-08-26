"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContestResultsView } from "@/components/contests/contest-results-view";

function ContestResultsRoute() {
  const contestId = useSearchParams().get("id");
  const router = useRouter();
  return (
    <ContestResultsView
      contestId={contestId}
      onBack={(id) => router.push(`/arena/contests/details?id=${id}`)}
      onLogin={() => router.push(`/login?next=${encodeURIComponent(`/arena/contests/results?id=${contestId}`)}`)}
    />
  );
}

export default function ContestResultsPage() {
  return (
    <Suspense fallback={null}>
      <ContestResultsRoute />
    </Suspense>
  );
}
