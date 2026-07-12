import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Company } from "@/lib/data/companies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={`/companies/${company.slug}`} className="group block h-full">
      <Card className="card-hover h-full">
        <CardContent className="flex h-full flex-col gap-4 p-6">
          <div className="flex items-start justify-between">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-extrabold text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${company.colorFrom}, ${company.colorTo})` }}
              aria-hidden
            >
              {company.initials}
            </span>
            <ArrowUpRight className="text-foreground/30 transition-colors group-hover:text-gold-600" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{company.name}</h3>
            <p className="text-xs text-foreground/60">{company.sector}</p>
          </div>
          <p className="line-clamp-2 text-sm text-foreground/65">{company.overview}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Badge variant={company.type === "Product" ? "default" : "muted"}>{company.type}</Badge>
            <Badge variant="outline">Min CGPA {company.eligibility.minCgpa}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
