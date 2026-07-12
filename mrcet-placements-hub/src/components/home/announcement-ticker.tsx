import { Megaphone } from "lucide-react";
import { announcements } from "@/lib/data/announcements";

export function AnnouncementTicker() {
  const items = [...announcements, ...announcements];

  return (
    <div className="flex items-center gap-4 border-y border-border-subtle bg-surface-muted/60 py-3">
      <span className="ml-4 flex shrink-0 items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold text-navy-950 sm:ml-6">
        <Megaphone size={13} />
        Live
      </span>
      <div className="group relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 group-hover:[animation-play-state:paused]">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex shrink-0 items-center gap-2.5 text-sm">
              <span className="font-bold text-gold-600">{item.date}</span>
              <span className="text-foreground/75">{item.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
