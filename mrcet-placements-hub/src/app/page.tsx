import { Hero } from "@/components/home/hero";
import { AnnouncementTicker } from "@/components/home/announcement-ticker";
import { LeadershipGrid } from "@/components/home/leadership-grid";
import { DevertCTA } from "@/components/shared/devert-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <AnnouncementTicker />
      <LeadershipGrid />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <DevertCTA />
      </div>
    </>
  );
}
