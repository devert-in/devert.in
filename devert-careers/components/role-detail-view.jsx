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
import { usePathname } from "next/navigation";
import {
  ArrowLeft, Building2, CheckCircle2, ClipboardList, FileText, ListChecks, Scale, Send, Sparkles, Target, Zap,
} from "lucide-react";
import { ApplyForm } from "@/components/apply-form";
import { RoleBanner } from "@/components/role-banner";
import { JOB_STATUS, LOCATION_TYPES, employmentLabel, fetchRoleBySlug, roleEmploymentTypes } from "@/lib/careers";

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

function Section({ title, icon: Icon, children }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.015em] text-ink-900">
        <Icon size={17} className="text-brand-600" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// The same for every role - a candidate reading any posting should know who
// we are and what happens after they press Send.
const ABOUT_DEVERT =
  "DeVert is a home for developer culture - a community where developers learn, build, compete and grow together, from their first line of code to their first job and well beyond. AI is at the core of where we are heading, and everything we build is shaped by the developers who use it. We are a small, founder-led team, which means real ownership from your first week.";

const SELECTION_PROCESS = [
  "Application review - every application is read by the founding team, not filtered by keywords",
  "Introductory call - a short conversation about you, the role and how you like to work",
  "Practical task - a small piece of real work relevant to the role, so you can show what you can do",
  "Final conversation with the founders, followed by an offer letter that sets out the role, commitment and compensation",
];

// Key facts in one table, the way a formal job notification opens. Rows with
// no value are left out rather than shown as blanks.
function JobDetails({ role }) {
  const rows = [
    ["Position", role.title],
    ["Department", role.team],
    ["Employment type", employmentLabel(role)],
    ["Location", [LOCATION_TYPES.find((o) => o.value === role.locationType)?.label, role.location].filter(Boolean).join(", ")],
    ["Eligibility", role.experience],
    ["Time commitment", role.commitment],
    ["Duration", role.duration],
    ["Compensation", role.compensation],
  ].filter(([, v]) => v);
  return (
    <dl className="overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
      {rows.map(([k, v], i) => (
        <div key={k} className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr] sm:gap-4 ${i > 0 ? "border-t border-ink-200" : ""}`}>
          <dt className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-500">{k}</dt>
          <dd className="text-[15px] leading-relaxed text-ink-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RoleDetailView({ slug: builtSlug }) {
  const [role, setRole] = useState(undefined); // undefined = loading, null = gone

  // The slug comes from the ADDRESS BAR, not only the build-time prop. A role
  // published after the last deploy has no HTML of its own; firebase.json
  // rewrites its URL to the no-open-roles shell, so the prop says
  // "no-open-roles" while the visitor asked for the real role.
  const pathname = usePathname();
  // Roles live at /roles/{slug}; the segment after "roles" is the slug.
  const parts = (pathname || "").split("/").filter(Boolean);
  const slug = (parts[0] === "roles" ? parts[1] : null) || builtSlug;

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
            className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-semibold text-[#05080F] transition-colors hover:bg-brand-700">
            See open roles
          </Link>
        </div>
      ) : (
        <>
          <header className="mt-8">
            <RoleBanner role={role} variant="hero" />


            {role.status === JOB_STATUS.CLOSED && (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
                This role has closed. You can still send an application - we keep them for when
                it reopens.
              </p>
            )}

          </header>

          {/* A formal job notification, in the order candidates expect:
              the key facts, who we are, the role, what it involves, what it
              needs, what it offers, and what happens after applying. */}
          <Section title="Job Details" icon={ClipboardList}>
            <JobDetails role={role} />
          </Section>

          <Section title="About DeVert" icon={Building2}>
            <p className="text-[15px] leading-relaxed text-ink-700">{ABOUT_DEVERT}</p>
          </Section>

          {role.description && (
            <Section title="Job Description" icon={FileText}>
              <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-ink-700">{role.description}</p>
            </Section>
          )}

          <BulletList title="Roles & Responsibilities" items={role.responsibilities} icon={Zap} />
          <BulletList title="Required Skills & Qualifications" items={role.requirements} icon={CheckCircle2} />
          <BulletList title="Preferred Qualifications" items={role.niceToHave} icon={Sparkles} />
          <BulletList title="What We Offer" items={role.perks} icon={Target} />
          <BulletList title="Selection Process" items={SELECTION_PROCESS} icon={ListChecks} />

          <Section title="Equal Opportunity" icon={Scale}>
            <p className="text-[15px] leading-relaxed text-ink-700">
              DeVert is an equal-opportunity organisation. We welcome applicants of every gender,
              background, college, branch and year of study, and we consider every application
              on the work it shows.
            </p>
          </Section>

          <div id="apply" className="mt-14">
            <h2 className="mb-4 flex items-center gap-2 text-[18px] font-semibold tracking-[-0.015em] text-ink-900">
              <Send size={17} className="text-brand-600" />
              How to Apply
            </h2>
            <ApplyForm jobId={role.id} jobTitle={role.title} source={`careers/${slug}`} employmentTypes={roleEmploymentTypes(role)} />
          </div>
        </>
      )}
    </div>
  );
}
