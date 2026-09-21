"use client";

// FAQ accordion. Native <details>/<summary> rather than a state-driven
// disclosure: it is keyboard- and screen-reader-correct for free, it renders
// open-able with JavaScript disabled, and the content stays in the DOM for
// crawlers - which matters because these same questions and answers are the
// FAQPage structured data emitted on the home page.

import { ChevronDown } from "lucide-react";

export function Faq({ items }) {
  return (
    <div className="divide-y divide-ink-200 border-y border-ink-200">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="text-[15.5px] font-medium text-ink-900">{item.q}</span>
            <ChevronDown
              size={17}
              className="shrink-0 text-ink-400 transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="max-w-3xl pb-6 text-[14.5px] leading-relaxed text-ink-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
