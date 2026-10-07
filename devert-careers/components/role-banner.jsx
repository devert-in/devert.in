// A role's banner - the on-page version of its link-preview card, laid out
// after the DeVert Campus Leader artwork the founders approved: green top
// rule, "DeVert | Careers" with a "WE'RE HIRING" pill, a monospace team
// label, a heavy headline, the blurb, a meta line, and the role's link beside
// an Apply button - with the role's illustration on the right.
//
// Everything here is real text rendered from the live role, never baked into
// an image: it stays sharp, searchable, and correct the moment a role is
// edited in admin. Only the illustration is a picture, and only roles listed
// in lib/role-art.mjs have one; the rest get the drawn circuit traces.
//
//   variant="card"  slim strip at the top of a role in the open-roles list
//   variant="hero"  the role page's header panel; carries the page's <h1>

import { ROLE_ART } from "@/lib/role-art.mjs";
import { EMPLOYMENT_TYPES, LOCATION_TYPES } from "@/lib/careers";

const SITE_HOST = "careers.devert.in";

const labelFor = (list, value) => list.find((o) => o.value === value)?.label || value || "";

// Fallback decoration for roles without art: positioned in percentages so it
// holds at any width.
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

// The illustration, bled off the right edge and faded into the panel so the
// text never sits on a hard image edge. On a phone there is no room beside
// the text, so it drops behind it, dimmed.
function Art({ src, card }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
    <img src={src} alt="" aria-hidden="true" loading={card ? "lazy" : "eager"}
      className={card
        // Card strip: a fixed-width box no wider than the art itself (596px),
        // so it is only ever scaled DOWN - it was stretched across 46% of a
        // wide card and cropped to a thin band of windows - and framed on the
        // clock tower and roofline so the campus is recognisable at a glance.
        ? "pointer-events-none absolute right-0 top-0 h-full w-[58%] max-w-[360px] object-cover object-[50%_30%]"
        : "pointer-events-none absolute right-0 top-0 h-full w-full object-cover object-right opacity-25 sm:w-[44%] sm:opacity-100"}
      style={{
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 48%)",
        maskImage: "linear-gradient(to right, transparent 0%, #000 48%)",
      }} />
  );
}

function HiringPill({ small }) {
  return (
    <span className={`inline-flex items-center rounded-lg border-2 border-brand-600 bg-[#05070c]/70 font-mono font-bold tracking-[0.12em] text-brand-600 ${
      small ? "px-2 py-0.5 text-[10px]" : "px-3.5 py-1.5 text-[12px] sm:text-[13px]"}`}>
      WE&apos;RE HIRING
    </span>
  );
}

const PANEL = "relative overflow-hidden bg-[#05070c] bg-[linear-gradient(120deg,#070a12_0%,#05070c_60%,#061018_100%)]";

export function RoleBanner({ role, variant = "card" }) {
  if (!role) return null;
  const art = ROLE_ART[role.id]?.art;

  if (variant === "card") {
    return (
      <div className={`${PANEL} -mx-5 -mt-5 mb-4 ${art ? "h-[112px] sm:h-[136px]" : "h-[72px] sm:h-[84px]"} border-b border-ink-200 px-5 sm:-mx-6 sm:-mt-6 sm:px-6`}>
        <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-[3px] bg-brand-600" />
        {art ? <Art src={art} card /> : <Traces />}
        <div className="relative flex h-full items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            {role.team || "DeVert"}
          </span>
          {!art && <HiringPill small />}
        </div>
      </div>
    );
  }

  const meta = [labelFor(EMPLOYMENT_TYPES, role.employmentType), labelFor(LOCATION_TYPES, role.locationType), role.location]
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className={`${PANEL} rounded-2xl border border-ink-200`}>
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-1 bg-brand-600" />
      {art ? <Art src={art} /> : <Traces />}
      {/* A dark band behind the text column. The artwork's brightest strokes
          sat right under the end of a long title ("Leader" in DeVert Campus
          Leader); this keeps the words on near-black at any width. */}
      {art && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#05070c_0%,rgba(5,7,12,0.92)_52%,rgba(5,7,12,0.4)_66%,transparent_80%)]" />
      )}

      <div className="relative px-6 pb-7 pt-7 sm:px-10 sm:pb-9 sm:pt-9">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-3">
            <span className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900 sm:text-[26px]">DeVert</span>
            <span aria-hidden="true" className="h-6 w-px bg-ink-300" />
            <span className="text-[19px] text-ink-600 sm:text-[22px]">Careers</span>
          </span>
          <HiringPill />
        </div>

        <div className={`mt-10 sm:mt-14 ${art ? "sm:max-w-[58%]" : "max-w-[620px]"}`}>
          {role.team && (
            <p className="font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-brand-600 sm:text-[15px]">
              {role.team}
            </p>
          )}
          <h1 className="mt-2 text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink-900 [text-shadow:0_2px_18px_rgba(5,7,12,0.95)] sm:text-[44px] lg:text-[48px]">
            {role.title}
          </h1>
          {role.blurb && (
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-700 sm:text-[17px]">{role.blurb}</p>
          )}
          {meta.length > 0 && (
            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 text-[14px] text-ink-500 sm:text-[15px]">
              {meta.map((m, i) => (
                <span key={m} className="inline-flex items-center gap-2.5">
                  {i > 0 && <span aria-hidden="true" className="text-ink-400">&bull;</span>}
                  {m}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 sm:mt-14">
          <span className="break-all font-mono text-[13px] font-medium text-[#00e5ff] sm:text-[15px]">
            {SITE_HOST}/{role.id}
          </span>
          <a href="#apply"
            className="inline-flex rounded-xl bg-brand-600 px-7 py-3 text-[15px] font-bold text-[#05080F] transition-colors hover:bg-brand-700">
            Apply now
          </a>
        </div>
      </div>
    </div>
  );
}
