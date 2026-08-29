"use client";

import { useState } from "react";
import { FileText, Code2, NotebookText, Eye } from "lucide-react";
import type { CompanyResource } from "@/lib/data/practice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceDialog } from "@/components/practice/resource-dialog";

const iconMap = {
  "Sample Aptitude Paper": FileText,
  "Previous Year Coding Questions": Code2,
  "Technical Cheat Sheet": NotebookText,
};

export function ResourceCard({ resource }: { resource: CompanyResource }) {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[resource.type];

  return (
    <>
      <Card className="card-hover h-full">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-gradient text-gold-500">
            <Icon size={18} />
          </span>
          <h4 className="text-sm font-bold">{resource.type}</h4>
          <p className="line-clamp-2 text-xs text-foreground/60">{resource.description}</p>
          <p className="text-xs font-semibold text-foreground/40">{resource.questions.length} sample questions</p>
          <Button size="sm" variant="outline" className="mt-auto gap-1.5" onClick={() => setOpen(true)}>
            <Eye size={14} />
            View
          </Button>
        </CardContent>
      </Card>
      <ResourceDialog resource={resource} open={open} onOpenChange={setOpen} />
    </>
  );
}
