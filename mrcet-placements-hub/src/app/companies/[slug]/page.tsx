import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Building2, CircleCheck, CircleX, GraduationCap, Globe } from "lucide-react";
import { companies, getCompanyBySlug } from "@/lib/data/companies";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RecruitmentTimeline } from "@/components/companies/recruitment-timeline";
import { HiringChart } from "@/components/companies/hiring-chart";
import { DevertWidget } from "@/components/shared/devert-widget";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return { title: "Company Not Found | MRCET Placements Hub" };
  return {
    title: `${company.name} | MRCET Placements Hub`,
    description: company.overview,
  };
}

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/companies" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:underline dark:text-gold-500">
        <ArrowLeft size={15} />
        Back to Companies
      </Link>

      <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-2xl font-extrabold text-white"
          style={{ backgroundImage: `linear-gradient(135deg, ${company.colorFrom}, ${company.colorTo})` }}
          aria-hidden
        >
          {company.initials}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{company.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/60">
            <Building2 size={14} />
            {company.sector}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={company.type === "Product" ? "default" : "muted"}>{company.type} Based</Badge>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border-subtle px-2.5 py-0.5 text-xs font-semibold text-foreground/70 hover:text-gold-600"
            >
              <Globe size={12} />
              Official Careers Site
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/70">{company.overview}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap size={18} className="text-gold-600" />
                Eligibility Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase text-foreground/50">Minimum CGPA</p>
                <p className="mt-1 text-xl font-extrabold text-navy-800 dark:text-gold-100">{company.eligibility.minCgpa}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase text-foreground/50">Active Backlogs</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                  {company.eligibility.backlogsAllowed ? (
                    <>
                      <CircleCheck size={16} className="text-emerald-500" /> Allowed
                    </>
                  ) : (
                    <>
                      <CircleX size={16} className="text-rose-500" /> Not Allowed
                    </>
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-4 sm:col-span-1">
                <p className="text-xs font-semibold uppercase text-foreground/50">Eligible Branches</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {company.eligibility.eligibleBranches.map((branch) => (
                    <Badge key={branch} variant="outline">
                      {branch}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-gold-600" />
                Recruitment Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecruitmentTimeline steps={company.recruitmentPattern} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historical Hiring at MRCET</CardTitle>
            </CardHeader>
            <CardContent>
              <HiringChart data={company.historicalHires} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DevertWidget companyName={company.name} />
          <Card>
            <CardHeader>
              <CardTitle>Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Sector</span>
                <span className="font-semibold">{company.sector}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-foreground/60">Hiring Type</span>
                <span className="font-semibold">{company.type}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-foreground/60">Total Hires (5 yrs)</span>
                <span className="font-semibold">
                  {company.historicalHires.reduce((sum, record) => sum + record.hires, 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-foreground/60">Rounds in Process</span>
                <span className="font-semibold">{company.recruitmentPattern.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
