import { Trophy } from "lucide-react";
import { wallOfFame } from "@/lib/data/placements";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  const parts = name.replace(".", "").split(" ").filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function WallOfFame() {
  return (
    <section>
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="text-gold-600" size={22} />
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Top Placement Offers — Wall of Fame</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {wallOfFame.map((record) => {
          const isTopTier = record.ctc >= 15;
          return (
            <Card
              key={record.id}
              className={cn(
                "card-hover relative overflow-hidden",
                isTopTier && "border-gold-500/50 bg-gold-100/40 dark:bg-gold-500/10"
              )}
            >
              {isTopTier && (
                <span className="absolute right-3 top-3 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-extrabold text-navy-950">
                  TOP TIER
                </span>
              )}
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <Avatar className="h-14 w-14">
                  <AvatarFallback>{initialsOf(record.studentName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold">{record.studentName}</h3>
                  <p className="text-xs text-foreground/60">{record.department}</p>
                </div>
                <Badge variant="outline">{record.company}</Badge>
                <p className="text-xs text-foreground/60">{record.role}</p>
                <p className={cn("text-lg font-extrabold", isTopTier ? "text-gold-600" : "text-navy-800 dark:text-gold-100")}>
                  {record.ctc} LPA
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
