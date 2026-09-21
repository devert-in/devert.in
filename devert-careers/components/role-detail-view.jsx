"use client";

// One job posting, with its apply form at the bottom.
//
// Reads the role client-side by slug even though app/[slug]/page.jsx already
// read it at build time to produce the metadata and JobPosting JSON-LD. That is
// deliberate and not a double-fetch to optimise away: Firestore Timestamps
// cannot cross the server/client boundary as props, and reading live means a
// typo fixed in devert.in/admin is corrected here without waiting for a deploy.
// The build-time read is what crawlers see; this one is what people see.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Briefcase, CheckCircle2, Clock, MapPin, Sparkles, Target, Users, Zap,
} from "lucide-react";
import { ApplyForm } from "@/components/apply-form";
import { EMPLOYMENT_TYPES, JOB_STATUS, LOCATION_TYPES, fetchRoleBySlug } from "@/lib/careers";

function labelFor(list, value) {
  return list.find((o) => o.value === value)?.label || value || "";
}

function BulletList({ title, items, icon: Icon }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.015em] text-ink-900">
        <Icon size={17} className="text-brand-600" />
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" />
            <span className="text-[15px] leading-relaxed text-ink-600">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Meta({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-ink-600">
      <Icon size={14} className="text-ink-400" />
      {children}
    </span>
  );
}

export function RoleDetailView({ slug }) {
  const [role, setRole] = useState(undefined); // undefined = loading, null = gone

  useEffect(() => {
    let alive = true;
    fetchRoleBySlug(slug)
      .then((r) => { if (alive) setRole(r); })
      .catch(() => { if (alive) setRole(null); });
    return () => { alive = false; };
  }, [slug]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-500 transition-colors hover:text-ink-900">
        <ArrowLeft size={14} /> All open roles
      </Link>

      {role === undefined ? (
        <div className="mt-10">
          <div className="h-9 w-2/3 animate-pulse rounded bg-ink-100" />
          <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-ink-100" />
          <div className="mt-8 h-4 w-full animate-pulse rounded bg-ink-100" />
        </div>
      ) : role === null ? (
        <div className="mt-10 rounded-xl border border-ink-200 bg-ink-50 p-10 text-center">
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-ink-900">
            This role is no longer listed
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-600">
            It was either filled or withdrawn. Our current openings are on the careers home page.
          </p>
          <Link href="/"
            className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand-700">
            See open roles
          </Link>
        </div>
      ) : (
        <>
          <header className="mt-8">
            <h1 className="text-[32px] font-semibold leading-[1.12] tracking-display text-ink-900 sm:text-[42px]">
              {role.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              <Meta icon={Users}>{role.team}</Meta>
              <Meta icon={Briefcase}>{labelFor(EMPLOYMENT_TYPES, role.employmentType)}</Meta>
              <Meta icon={MapPin}>
                {[labelFor(LOCATION_TYPES, role.locationType), role.location].filter(Boolean).join(" · ")}
              </Meta>
              <Meta icon={Clock}>{role.experience}</Meta>
            </div>

            {role.status === JOB_STATUS.CLOSED && (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
                This role has closed. You can still send an application — we keep them for when
                it reopens.
              </p>
            )}

            <a href="#apply"
              className="mt-7 inline-flex rounded-full bg-brand-600 px-6 py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-brand-700">
              Apply for this role
            </a>
          </header>

          {role.description && (
            <p className="mt-10 whitespace-pre-line text-[15.5px] leading-relaxed text-ink-700">
              {role.description}
            </p>
          )}

          <BulletList title="What you'll own" items={role.responsibilities} icon={Zap} />
          <BulletList title="What we need" items={role.requirements} icon={CheckCircle2} />
          <BulletList title="Nice to have" items={role.niceToHave} icon={Sparkles} />
          <BulletList title="What you get" items={role.perks} icon={Target} />

          <div id="apply" className="mt-14">
            <ApplyForm jobId={role.id} jobTitle={role.title} source={`careers/${slug}`} />
          </div>
        </>
      )}
    </div>
  );
}
