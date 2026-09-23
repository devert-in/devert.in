"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, GraduationCap, Flame, Anchor, Activity } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS_URL } from "@/lib/campusUrl";

// One row per DeVert product, each either a real, specific "continue where
// you left off" link or a plain "explore" CTA when there's nothing yet -
// never a fabricated number/status. This is deliberately forward-looking
// ("what's next for you"), not a re-hash of quick-stats-row.jsx's own
// backward-looking XP/coins/followers grid - the two are complementary, not
// duplicates.
function useJourneySignals(user) {
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    if (!user) { setSignals(null); return; }
    let cancelled = false;

    (async () => {
      const [eventReg, project] = await Promise.allSettled([
        // Most recent hackathon/event this user has registered for, if any -
        // cross-referenced against the event doc itself so a cancelled/ended
        // one never shows as "upcoming".
        (async () => {
          const regSnap = await getDocs(query(
            collection(db, "hackathon_registrations"), where("uid", "==", user.uid),
            orderBy("registeredAt", "desc"), limit(5),
          ));
          for (const regDoc of regSnap.docs) {
            const hackSnap = await getDoc(doc(db, "hackathons", regDoc.data().hackathonSlug));
            if (hackSnap.exists() && ["upcoming", "active"].includes(hackSnap.data().status)) {
              return { slug: hackSnap.id, title: hackSnap.data().title, status: hackSnap.data().status };
            }
          }
          return null;
        })(),
        // Most recently docked Shipyard project, if any.
        (async () => {
          const snap = await getDocs(query(
            collection(db, "projects"), where("ownerId", "==", user.uid),
            orderBy("createdAt", "desc"), limit(1),
          ));
          return snap.empty ? null : { id: snap.docs[0].id, name: snap.docs[0].data().name };
        })(),
      ]);

      if (cancelled) return;
      setSignals({
        event: eventReg.status === "fulfilled" ? eventReg.value : null,
        project: project.status === "fulfilled" ? project.value : null,
      });
    })();

    return () => { cancelled = true; };
  }, [user?.uid]);

  return signals;
}

function JourneyRow({ icon: Icon, color, label, value, cta, href }) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3 group">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9px] text-white/25 tracking-widest">{label}</p>
        <p className="font-sans text-[13px] text-white/80 truncate group-hover:text-white transition-colors">{value}</p>
      </div>
      <span className="font-mono text-[10px] flex-shrink-0 flex items-center gap-1 transition-colors" style={{ color: `${color}90` }}>
        {cta} <ArrowRight size={11} />
      </span>
    </Link>
  );
}

export function DevertJourneyCard() {
  const { user, userData } = useAuth();
  const signals = useJourneySignals(user);

  // Only gated on `user`. Every row below already has a designed zero state
  // ("Ship your first project", "Structured learning & placement prep"), so
  // bailing on a missing userData threw away the one widget that is useful
  // precisely when a user has done nothing yet.
  if (!user) return null;
  const profile = userData || {};

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
      className="terminal-window mb-5">
      <div className="terminal-header">
        <span className="font-mono text-[10px] text-white/25 ml-2">your_devert_today.log</span>
      </div>
      <div className="px-5 py-1 divide-y divide-white/5">
        {profile.institutionId ? (
          <JourneyRow icon={GraduationCap} color="#00FFFF" label="CAMPUS"
            value="Continue your Campus workspace" cta="open" href={`${CAMPUS_URL}/${profile.institutionId}`} />
        ) : (
          <JourneyRow icon={GraduationCap} color="#00FFFF" label="CAMPUS"
            value="Structured learning & placement prep" cta="explore" href={CAMPUS_URL} />
        )}

        {signals?.event ? (
          <JourneyRow icon={Flame} color="#FF6430" label="EVENTS"
            value={signals.event.status === "active" ? `Live now: ${signals.event.title}` : `Registered: ${signals.event.title}`}
            cta="view" href={`/h/${signals.event.slug}`} />
        ) : (
          <JourneyRow icon={Flame} color="#FF6430" label="EVENTS"
            value="Hackathons, workshops, meetups & more" cta="explore" href="/events" />
        )}

        {signals?.project ? (
          <JourneyRow icon={Anchor} color="#00FF41" label="SHIPYARD"
            value={`Last docked: ${signals.project.name}`} cta="view" href="/shipyard" />
        ) : (
          <JourneyRow icon={Anchor} color="#00FF41" label="SHIPYARD"
            value="Ship your first project" cta="dock it" href="/shipyard" />
        )}

        <JourneyRow icon={Activity} color="#C77DFF" label="PULSE"
          value="Dev social feed & communities" cta="explore" href="/pulse" />
      </div>
    </motion.div>
  );
}
