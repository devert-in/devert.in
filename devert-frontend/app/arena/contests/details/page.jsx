"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ContestDetailsView } from "@/components/contests/contest-details-view";

function ContestDetailsRoute() {
  const contestId = useSearchParams().get("id");
  const router = useRouter();
  return (
    <ContestDetailsView
      contestId={contestId}
      onBack={() => router.push("/arena")}
      onEnterAttempt={(id) => router.push(`/arena/contests/attempt?id=${id}`)}
      onViewResults={(id) => router.push(`/arena/contests/results?id=${id}`)}
      onLogin={() => router.push(`/login?next=${encodeURIComponent(`/arena/contests/details?id=${contestId}`)}`)}
    />
  );
}

export default function ContestDetailsPage() {
  return (
    <Suspense fallback={null}>
      <ContestDetailsRoute />
    </Suspense>
  );
}
