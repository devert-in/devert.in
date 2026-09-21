// careers.devert.in home.
//
// A server component: everything here is static copy, so only the two genuinely
// interactive pieces (RoleList, which holds a live Firestore listener and the
// filters, and Faq) ship as client bundles. The devert.in version of this page
// was one big "use client" file; that was fine for a neon-terminal page behind
// a nav, and wrong for the page a cold candidate loads from a search result.

import Link from "next/link";
import {
  ArrowRight, Blocks, Building2, Compass, GraduationCap, Handshake, Hammer,
  MapPin, MessageSquare, Rocket, ScrollText, Search, Users,
} from "lucide-react";
import { RoleList } from "@/components/role-list";
import { Faq } from "@/components/faq";
import { Founders } from "@/components/founders";
import { FOUNDERS } from "@/lib/founders";

const DEVERT_URL = "https://devert.in";
const CAMPUS_URL = "https://campus.devert.in";

const FACTS = [
  { icon: Compass, label: "Workplace", value: "Flexible hybrid" },
  { icon: MapPin, label: "Based in", value: "India" },
  { icon: Building2, label: "Stage", value: "Early, shipping" },
];

const VALUES = [
  {
    icon: Hammer,
    title: "You own the thing, not a ticket",
    body: "The team is small enough that whole surfaces belong to one person. You will ship to real users in your first weeks, not spend a quarter reading onboarding docs.",
  },
  {
    icon: Users,
    title: "Your users are developers",
    body: "Everyone here builds for people who can read the source. That raises the bar on craft and kills a lot of the usual product theatre — our users notice, and they tell us.",
  },
  {
    icon: Blocks,
    title: "Small team, real scope",
    body: "DeVert is early enough that the decisions you make still shape the product. Less structure than a big company, far more say in what gets built.",
  },
  {
    icon: GraduationCap,
    title: "The work reaches students",
    body: "DeVert Campus runs inside colleges — scheduled learning, proctored contests, placement prep. What you build lands in front of entire cohorts, not an anonymous funnel.",
  },
];

const HIRING = [
  { icon: Search, title: "Apply", body: "A real person reads it. No keyword filter, no automated rejection." },
  { icon: MessageSquare, title: "Intro call", body: "Thirty minutes on what you have built and what you want to own." },
  { icon: Hammer, title: "Paid build task", body: "Something small and scoped, close to the real work. We pay for your time." },
  { icon: Handshake, title: "Decision", body: "An answer either way, with a reason, quickly." },
];

const FAQS = [
  { q: "Do I need a degree to apply?", a: "No. We look at what you have built and how you think about it. A repository, a shipped side project, or a DeVert profile with real work on it tells us more than a transcript does." },
  { q: "Are these roles remote?", a: "DeVert runs a flexible hybrid model — remote collaboration, with in-person time for planning, events and the work that genuinely benefits from a room. Each role states its own expectation, and the full Workplace Policy is on devert.in." },
  { q: "Do you hire students or interns?", a: "Yes. When an internship is open it is listed here like any other role. We do not run an unpaid programme, and interns own real work rather than shadowing someone who does." },
  { q: "What if nothing listed fits me?", a: "Send a general application anyway. We keep them, and a strong one has opened a role more than once. Tell us what you would want to own here." },
  { q: "How long does the process take?", a: "Usually one to two weeks end to end. If we are slower than that on your application, chase us — we would rather be chased than leave you guessing." },
  { q: "Will I hear back if it is a no?", a: "Yes. Every application that reaches the intro call gets a decision and a reason. We do not ghost." },
];

// The same questions and answers the page renders below, so this is real
// structured data for visible content rather than crawler-only markup.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DeVert",
  url: DEVERT_URL,
  logo: `${DEVERT_URL}/og-image.png`,
  founder: FOUNDERS.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role })),
  sameAs: [
    "https://www.linkedin.com/company/111474265/",
    "https://www.instagram.com/devert.in",
    "https://youtube.com/@devert5",
  ],
};

export default function CareersHome() {
  return (
    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Careers at DeVert
          </p>
          <h1 className="mt-4 max-w-3xl text-[38px] font-semibold leading-[1.08] tracking-display text-ink-900 sm:text-[56px]">
            Build the platform developers actually use.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-600 sm:text-[18px]">
            DeVert is a developer operating system, and a learning platform used by college
            cohorts across India. We are a small team that ships — and we hire people who
            have built something they can talk about.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#open-roles"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700">
              See open roles <ArrowRight size={16} />
            </a>
            <a href={DEVERT_URL}
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-[15px] font-semibold text-ink-700 transition-colors hover:border-ink-400 hover:text-ink-900">
              Explore the product
            </a>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <f.icon size={17} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <dt className="text-[12px] font-medium uppercase tracking-wider text-ink-400">{f.label}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold text-ink-900">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Life at DeVert */}
      <section id="life" className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink-900 sm:text-[34px]">
          Life at DeVert
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-600">
          We are small, remote-friendly, and biased toward shipping. Here is what that
          actually means day to day.
        </p>

        <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <v.icon size={18} className="text-brand-600" />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink-900">{v.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-ink-200 bg-ink-50 px-6 py-5">
          <ScrollText size={18} className="shrink-0 text-ink-400" />
          <p className="flex-1 text-[14.5px] leading-relaxed text-ink-600">
            Our full hybrid-working policy — how we split remote and in-person, and what we
            expect of each other — is published openly.
          </p>
          <a href={`${DEVERT_URL}/workplace`}
            className="text-[14px] font-semibold text-brand-600 transition-colors hover:text-brand-700">
            Read the policy
          </a>
        </div>
      </section>

      <Founders />

      {/* Open roles (live) */}
      <div className="border-y border-ink-200 bg-ink-50/60">
        <RoleList />
      </div>

      {/* How we hire */}
      <section id="hiring" className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink-900 sm:text-[34px]">
          How we hire
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-600">
          Four steps, no theatre. No whiteboard trivia, no six-round gauntlet, and no unpaid
          take-home that quietly ships to production.
        </p>

        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HIRING.map((s, i) => (
            <li key={s.title}>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 bg-white text-[13px] font-semibold text-ink-500">
                  {i + 1}
                </span>
                <s.icon size={17} className="text-brand-600" />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-ink-900 sm:text-[34px]">
          Before you apply
        </h2>
        <div className="mt-8">
          <Faq items={FAQS} />
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-5xl px-5 pb-8 sm:px-8">
        <div className="rounded-2xl bg-ink-900 px-8 py-12 text-center sm:px-12 sm:py-16">
          <Rocket size={22} className="mx-auto text-brand-300" />
          <h2 className="mx-auto mt-5 max-w-xl text-[26px] font-semibold tracking-[-0.025em] text-white sm:text-[32px]">
            Come build the thing you wish existed.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-300">
            Every one of us was a developer frustrated with the tools before we were
            building these ones.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#open-roles"
              className="rounded-full bg-white px-6 py-3 text-[14.5px] font-semibold text-ink-900 transition-colors hover:bg-ink-100">
              See open roles
            </a>
            <a href={CAMPUS_URL}
              className="rounded-full border border-ink-700 px-6 py-3 text-[14.5px] font-semibold text-ink-200 transition-colors hover:border-ink-500 hover:text-white">
              Visit DeVert Campus
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
