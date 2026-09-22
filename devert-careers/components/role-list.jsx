"use client";

// The live open-roles list, with filters.
//
// Reads job_openings through an onSnapshot, so a role published from
// devert.in/admin appears here without a deploy. Its own /{slug} page is
// build-time - see the freshness note in lib/careers-seo.js.
//
// Filters are derived from the roles actually present rather than from a fixed
// list of teams, so a new team in the admin panel needs no change here, and a
// filter never offers a choice that would return nothing.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock, MapPin, SearchX } from "lucide-react";
import {
  EMPLOYMENT_TYPES, GENERAL_INTEREST_JOB_ID, LOCATION_TYPES, watchPublishedRoles,
} from "@/lib/careers";
import { ApplyForm } from "@/components/apply-form";

function labelFor(list, value) {
  return list.find((o) => o.value === value)?.label || value || "";
}

const ALL = "all";

function FilterGroup({ label, options, value, onChange }) {
  if (options.length <= 1) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[12px] font-medium uppercase tracking-wider text-ink-400">{label}</span>
      {[{ value: ALL, label: "All" }, ...options].map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900"
            }`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RoleRow({ role }) {
  return (
    <Link href={`/${role.id}`}
      className="group block rounded-xl border border-ink-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.18)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink-900 group-hover:text-brand-700">
            {role.title}
          </h3>
          {role.team && (
            <p className="mt-1 text-[13px] font-medium text-ink-500">{role.team}</p>
          )}
        </div>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
        />
      </div>

      {role.blurb && (
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-600">{role.blurb}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {role.employmentType && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500">
            <Briefcase size={13} className="text-ink-400" />
            {labelFor(EMPLOYMENT_TYPES, role.employmentType)}
          </span>
        )}
        {(role.locationType || role.location) && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500">
            <MapPin size={13} className="text-ink-400" />
            {[labelFor(LOCATION_TYPES, role.locationType), role.location].filter(Boolean).join(" · ")}
          </span>
        )}
        {role.experience && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500">
            <Clock size={13} className="text-ink-400" />
            {role.experience}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6">
      <div className="h-4 w-52 animate-pulse rounded bg-ink-100" />
      <div className="mt-3 h-3 w-32 animate-pulse rounded bg-ink-100" />
      <div className="mt-5 h-3 w-full max-w-md animate-pulse rounded bg-ink-100" />
    </div>
  );
}

export function RoleList() {
  const [roles, setRoles] = useState(null);
  const [team, setTeam] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [place, setPlace] = useState(ALL);

  useEffect(() => watchPublishedRoles(setRoles), []);

  const teamOptions = useMemo(() => {
    const seen = [...new Set((roles || []).map((r) => r.team).filter(Boolean))].sort();
    return seen.map((t) => ({ value: t, label: t }));
  }, [roles]);

  const typeOptions = useMemo(() => {
    const present = new Set((roles || []).map((r) => r.employmentType).filter(Boolean));
    return EMPLOYMENT_TYPES.filter((o) => present.has(o.value));
  }, [roles]);

  const placeOptions = useMemo(() => {
    const present = new Set((roles || []).map((r) => r.locationType).filter(Boolean));
    return LOCATION_TYPES.filter((o) => present.has(o.value));
  }, [roles]);

  const visible = (roles || []).filter((r) =>
    (team === ALL || r.team === team)
    && (type === ALL || r.employmentType === type)
    && (place === ALL || r.locationType === place));

  const filtering = team !== ALL || type !== ALL || place !== ALL;

  return (
    <section id="open-roles" className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink-900 sm:text-[34px]">
          Open roles
        </h2>
        {roles !== null && roles.length > 0 && (
          <p className="text-[14px] text-ink-500">
            {visible.length} {visible.length === 1 ? "role" : "roles"}
            {filtering && roles.length !== visible.length ? ` of ${roles.length}` : ""}
          </p>
        )}
      </div>

      {roles === null ? (
        <div className="mt-8 space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : roles.length === 0 ? (
        <div className="mt-8">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-8 text-center">
            <h3 className="text-[18px] font-semibold text-ink-900">No open roles right now</h3>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-600">
              That changes often, and it has changed <em>because</em> of an application more than
              once. Tell us what you would want to own here, and we will read it when a role opens.
            </p>
          </div>
          <div className="mt-8">
            <ApplyForm jobId={GENERAL_INTEREST_JOB_ID} jobTitle="" source="careers-general" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-7 space-y-3 border-y border-ink-200 py-5">
            <FilterGroup label="Team" options={teamOptions} value={team} onChange={setTeam} />
            <FilterGroup label="Type" options={typeOptions} value={type} onChange={setType} />
            <FilterGroup label="Location" options={placeOptions} value={place} onChange={setPlace} />
          </div>

          {visible.length === 0 ? (
            <div className="mt-10 flex flex-col items-center py-10 text-center">
              <SearchX size={22} className="text-ink-300" />
              <p className="mt-3 text-[15px] font-medium text-ink-800">No roles match those filters</p>
              <button type="button"
                onClick={() => { setTeam(ALL); setType(ALL); setPlace(ALL); }}
                className="mt-3 text-[14px] font-medium text-brand-600 hover:text-brand-700">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {visible.map((r) => <RoleRow key={r.id} role={r} />)}
            </div>
          )}

          <p className="mt-8 text-[13.5px] text-ink-500">
            Nothing here fits?{" "}
            <a href="#general" className="font-medium text-brand-600 underline-offset-2 hover:underline">
              Send a general application
            </a>{" "}
            — we read those too.
          </p>

          <div id="general" className="mt-10">
            <ApplyForm jobId={GENERAL_INTEREST_JOB_ID} jobTitle="" source="careers-general" />
          </div>
        </>
      )}
    </section>
  );
}
