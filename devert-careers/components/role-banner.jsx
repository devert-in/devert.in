// The on-page twin of the link-preview image scripts/role-images.mjs draws:
// same dark panel, green top rule, circuit traces, "We're hiring" pill.
//
// Rendered from the live role rather than shipped as a PNG, so a role
// published after the last deploy has its banner the moment it appears - the
// PNG only exists for roles that were published at build time.
//
//   variant="card"  slim strip at the top of a role in the open-roles list
//   variant="hero"  the role page's header panel; carries the page's <h1>

// Decorative traces, positioned in percentages so they hold at any width.
const TRACES = [
  { left: "72%", top: "18%", width: "28%", height: 1, tone: "g" },
  { left: "84%", top: "18%", width: 1, height: "26%", tone: "g" },
  { left: "84%", top: "44%", width: "16%", height: 1, tone: "g" },
  { left: "77%", top: "56%", width: "23%", height: 1, tone: "c" },
  { left: "77%", top: "56%", width: 1, height: "22%", tone: "c" },
  { left: "77%", top: "78%", width: "13%", height: 1, tone: "c" },
  { left: "91%", top: "66%", width: 1, height: "34%", tone: "g" },
  { left: "91%", top: "66%", width: "9%", height: 1, tone: "g" },
];
const TONE = { g: "rgba(60,232,111,0.22)", c: "rgba(0,229,255,0.16)" };

function Traces() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {TRACES.map((t, i) => (
        <span key={i} className="absolute block"
          style={{ left: t.left, top: t.top, width: t.width, height: t.height, background: TONE[t.tone] }} />
      ))}
    </div>
  );
}

function HiringPill({ small }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-brand-600 bg-brand-50/70 font-semibold tracking-[0.18em] text-brand-600 ${
      small ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1 text-[11.5px]"}`}>
      WE&apos;RE HIRING
    </span>
  );
}

export function RoleBanner({ role, variant = "card" }) {
  if (!role) return null;
  const panel = "relative overflow-hidden border border-ink-200 bg-[linear-gradient(120deg,#070a12_0%,#05070c_60%,#061018_100%)]";

  if (variant === "card") {
    return (
      <div className={`${panel} -mx-5 -mt-5 mb-4 rounded-t-xl border-x-0 border-t-0 px-5 py-3 sm:-mx-6 sm:-mt-6 sm:px-6`}>
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-brand-600" />
        <Traces />
        <div className="relative flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {role.team || "DeVert"}
          </span>
          <HiringPill small />
        </div>
      </div>
    );
  }

  return (
    <div className={`${panel} rounded-2xl px-6 py-7 sm:px-9 sm:py-9`}>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-brand-600" />
      <Traces />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
            <img src="/devert-campus-badge.png" alt="" width={34} height={34} className="rounded-lg" />
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900">DeVert</span>
            <span className="text-[15px] text-ink-500">Careers</span>
          </span>
          <HiringPill />
        </div>
        {role.team && (
          <p className="mt-7 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-brand-600">{role.team}</p>
        )}
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.1] tracking-display text-ink-900 sm:text-[44px]">
          {role.title}
        </h1>
        {role.blurb && (
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-700">{role.blurb}</p>
        )}
      </div>
    </div>
  );
}
