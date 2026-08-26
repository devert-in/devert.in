"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HackathonDetailView } from "@/components/hackathons/hackathon-detail-view";

export default function HackathonDetailPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [slug, setSlug] = useState("");

  // usePathname() (not window.location, read once) so client-side navigation
  // between two /h/* hackathons re-resolves the slug instead of leaving the
  // previous hackathon on screen - the static-export /h/** rewrite maps every
  // hackathon URL to this same page.
  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    setSlug(parts[1] || "");
  }, [pathname]);

  return <HackathonDetailView slug={slug} onBack={() => router.push("/hackathons")} />;
}
