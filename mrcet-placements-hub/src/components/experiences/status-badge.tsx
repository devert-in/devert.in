import { Badge } from "@/components/ui/badge";
import type { ExperienceStatus } from "@/lib/data/experiences";

const variantMap: Record<ExperienceStatus, "success" | "destructive" | "warning"> = {
  Selected: "success",
  "Not Selected": "destructive",
  Waitlisted: "warning",
};

export function StatusBadge({ status }: { status: ExperienceStatus }) {
  return <Badge variant={variantMap[status]}>{status}</Badge>;
}
