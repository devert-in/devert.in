"use client";

import { usePathname, useRouter } from "next/navigation";
import { ContestDetailsView } from "@/components/contests/contest-details-view";

// New clean, shareable, crawler-previewable entry point for a contest -
// contestPreviewRouter (functions/index.js) fronts /contest/** for
// link-preview bots; real browsers land here and get the exact same
// ContestDetailsView the existing /arena/contests/details?id= route already
// uses, unchanged. That query-param route keeps working as-is for in-app
// navigation - this is purely an additional canonical URL, not a replacement.
export default function ContestPage() {
  const pathname = usePathname();
  const router = useRouter();
  const contestId = pathname.split("/").filter(Boolean)[1] || null;

  return (
    <ContestDetailsView
      contestId={contestId}
      onBack={() => router.push("/arena")}
      onEnterAttempt={(id) => router.push(`/arena/contests/attempt?id=${id}`)}
      onViewResults={(id) => router.push(`/arena/contests/results?id=${id}`)}
      onLogin={() => router.push(`/login?next=${encodeURIComponent(`/contest/${contestId}`)}`)}
    />
  );
}
