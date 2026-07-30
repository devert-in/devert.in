"use client";

import { Suspense } from "react";
import { SeCourseApp } from "@/components/se/se-app";

// Software Engineering Fundamentals lives at ONE static route, with the module
// and lesson carried in the query string (?module=&lesson=). That is not a
// shortcut - this app is `output: 'export'`, so a dynamic segment per lesson
// would mean generateStaticParams over every lesson at build time and a rebuild
// on every content edit. /campus takes the same approach for the same reason.
//
// SeCourseApp reads useSearchParams(), which the static-export prerenderer
// requires behind a Suspense boundary.
export default function FundamentalsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <SeCourseApp />
    </Suspense>
  );
}
