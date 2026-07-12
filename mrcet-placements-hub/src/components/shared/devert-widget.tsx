import { ArrowUpRight, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DevertWidgetProps {
  companyName?: string;
}

export function DevertWidget({ companyName }: DevertWidgetProps) {
  return (
    <Card className="glass border-gold-500/30 bg-navy-gradient text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-navy-950">
            <Target size={17} />
          </span>
          <CardTitle className="text-white">Prep Smarter on Devert</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-white/75">
          {companyName
            ? `Preparing for ${companyName}? Solve curated company-specific mock tests and coding sheets now on Devert.in.`
            : "Solve curated company-specific mock tests and coding sheets now on Devert.in."}
        </p>
        <a
          href="https://devert.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-4 py-2.5 text-sm font-bold text-navy-950 transition-transform hover:-translate-y-0.5"
        >
          Open Devert.in
          <ArrowUpRight size={15} />
        </a>
      </CardContent>
    </Card>
  );
}
