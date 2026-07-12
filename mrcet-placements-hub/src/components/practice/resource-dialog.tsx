import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { CompanyResource } from "@/lib/data/practice";

export function ResourceDialog({
  resource,
  open,
  onOpenChange,
}: {
  resource: CompanyResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {resource.companyName} · {resource.type}
          </DialogTitle>
          <DialogDescription>{resource.description}</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          {resource.questions.map((item, index) => (
            <li key={index} className="rounded-xl border border-border-subtle p-3.5">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-foreground/40">Q{index + 1}</span>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {item.topic}
                </Badge>
              </div>
              <p className="text-sm text-foreground/75">{item.question}</p>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
