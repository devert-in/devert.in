import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function DifficultyStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={cn(index < rating ? "fill-gold-500 text-gold-500" : "fill-transparent text-foreground/25")}
        />
      ))}
    </div>
  );
}
