"use client";

import { usePathname } from "next/navigation";
import { SeCourseApp } from "@/components/se/se-app";

// Thin Campus wrapper around the same Software Engineering Fundamentals
// course shell that powers the standalone /fundamentals route - see
// components/se/se-app.jsx's file header for how basePath/staticQuery/
// sidebarSlot/enableBackHandler let one component serve both routes without
// forking the course content or progress-tracking logic.
export function CampusFundamentalsTab({ sidebarSlot }) {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean)[1];

  return (
    <SeCourseApp basePath={`/campus/${slug}`} staticQuery="tab=fundamentals"
      sidebarSlot={sidebarSlot} enableBackHandler campusMode />
  );
}
