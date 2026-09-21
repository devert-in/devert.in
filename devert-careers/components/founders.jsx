// "Who you'd be working with" - the founders, on the careers home page.
//
// A server component: pure content, no state, so it ships no client JS.
//
// Data comes from devert-frontend/lib/founders.js through this app's jsconfig
// @/* fallback - the same single source of truth the three nav surfaces on
// devert.in, campus.devert.in and this site's own header all read. Names,
// roles and handles are edited there, never here.
//
// Two deliberate departures from that shared data:
//
// 1. `f.accent` (#00FF41 / #00FFFF) is NOT used. Those are neon-terminal
//    palette values that belong to devert.in; dropping them onto this
//    light professional surface is exactly the cross-contamination
//    CLAUDE.md's design-system section warns against. The avatars use the
//    neutral/brand scale instead.
// 2. Links go through founderUrl(), not founderPath(). A relative /u/{handle}
//    would resolve against careers.devert.in and 404 - the single most
//    repeated bug of the Campus subdomain cutover.

import { ArrowUpRight } from "lucide-react";
import { FOUNDERS, founderUrl } from "@/lib/founders";

export function Founders() {
  return (
    <section id="founders" className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink-900 sm:text-[34px]">
        Who you&apos;ll work with
      </h2>
      <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-600">
        DeVert is built by two engineers who were tired of mediocre developer content and
        made the platform they wanted instead. On a team this size you work with them
        directly — not with a layer between you and the decisions.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {FOUNDERS.map((f) => (
          <a key={f.key} href={founderUrl(f)}
            className="group flex items-start gap-4 rounded-xl border border-ink-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.18)]">
            {/* Initials, not a headshot: no founder photo is committed to any of
                the three apps' public/ dirs, and the real ones live behind
                runtime Firebase Storage URLs on the user docs - fetching those
                would mean a Firestore read on a fully static page just to paint
                two circles. Same reasoning as lib/founders.js's own note. */}
            <span aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-[16px] font-semibold text-ink-700 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700">
              {f.initials}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">
                    {f.name}
                  </h3>
                  <p className="mt-0.5 text-[13.5px] font-medium text-brand-600">{f.role}</p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="mt-1 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
                />
              </div>

              <p className="mt-3 text-[13.5px] text-ink-500">{f.focus}</p>
              <p className="mt-3 text-[13px] text-ink-400 group-hover:text-ink-600">
                View profile on devert.in
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
