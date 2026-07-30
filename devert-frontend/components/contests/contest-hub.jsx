"use client";

import { useEffect, useState, useMemo } from "react";
import { Rss, Radio, CalendarClock, History, User, LayoutGrid, Megaphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ContestCard } from "@/components/contests/contest-card";
import { ContestDetailsView } from "@/components/contests/contest-details-view";
import { ContestAttemptView } from "@/components/contests/contest-attempt-view";
import { ContestResultsView } from "@/components/contests/contest-results-view";
import {
  fetchPublishedContests, bucketContests, registerForContest, fetchMyRegistration,
  fetchRecentAnnouncements, CONTEST_CATEGORIES,
} from "@/lib/contests";

const SUBTABS = [
  { key: "featured",      label: "Featured",      icon: Rss },
  { key: "live",          label: "Live",          icon: Radio },
  { key: "upcoming",      label: "Upcoming",      icon: CalendarClock },
  { key: "past",          label: "Past",          icon: History },
  { key: "mine",          label: "My Registered", icon: User },
  { key: "categories",    label: "Categories",    icon: LayoutGrid },
  { key: "announcements", label: "Announcements", icon: Megaphone },
];

export function ContestHub() {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegs, setMyRegs] = useState({});
  const [registering, setRegistering] = useState(null);
  const [subtab, setSubtab] = useState("featured");
  const [announcements, setAnnouncements] = useState(null);
  // A selected contest's details/attempt/results render in place of the hub -
  // never as a real route change, so this never leaves the Arena window tab
  // (or, standalone, the /arena route) out from under itself.
  const [view, setView] = useState(null); // { mode: "details"|"attempt"|"results", contestId }

  const openDetails = (contestId) => setView({ mode: "details", contestId });
  const openAttempt = (contestId) => setView({ mode: "attempt", contestId });
  const openResults = (contestId) => setView({ mode: "results", contestId });
  const backToHub = () => setView(null);

  useEffect(() => {
    fetchPublishedContests().then(setContests).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || contests.length === 0) return;
    Promise.all(contests.map(c => fetchMyRegistration(c.id, user.uid).then(r => [c.id, !!r])))
      .then(entries => setMyRegs(Object.fromEntries(entries)))
      .catch(console.error);
  }, [user, contests]);

  useEffect(() => {
    if (subtab === "announcements" && announcements === null && contests.length > 0) {
      fetchRecentAnnouncements(contests.map(c => c.id), 15).then(setAnnouncements).catch(() => setAnnouncements([]));
    }
  }, [subtab, announcements, contests]);

  const buckets = useMemo(() => bucketContests(contests), [contests]);
  const registeredContests = useMemo(() => contests.filter(c => myRegs[c.id]), [contests, myRegs]);
  const featured = useMemo(() => {
    const pool = [...buckets.live, ...buckets.upcoming];
    return [...pool].sort((a, b) => (b.prizeXp || 0) - (a.prizeXp || 0))[0] || null;
  }, [buckets]);

  const handleRegister = async (contestId) => {
    if (!user) { window.location.href = "/login?next=/arena"; return; }
    setRegistering(contestId);
    try {
      await registerForContest(contestId, user.uid);
      setMyRegs(p => ({ ...p, [contestId]: true }));
      setContests(cs => cs.map(c => c.id === contestId ? { ...c, participantCount: (c.participantCount || 0) + 1 } : c));
    } catch (e) { console.error(e); }
    finally { setRegistering(null); }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse py-10 text-center">loading contests...</p>;

  if (view?.mode === "details") {
    return (
      <ContestDetailsView
        contestId={view.contestId}
        onBack={backToHub}
        onEnterAttempt={openAttempt}
        onViewResults={openResults}
        onLogin={() => { window.location.href = "/login?next=/arena"; }}
      />
    );
  }
  if (view?.mode === "attempt") {
    return (
      <ContestAttemptView
        contestId={view.contestId}
        onBack={openDetails}
        onViewResults={openResults}
      />
    );
  }
  if (view?.mode === "results") {
    return (
      <ContestResultsView
        contestId={view.contestId}
        onBack={openDetails}
        onLogin={() => { window.location.href = "/login?next=/arena"; }}
      />
    );
  }

  const grid = (list) => list.length === 0 ? (
    <p className="font-mono text-xs text-white/20 text-center py-10">nothing here yet</p>
  ) : (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map(c => (
        <ContestCard key={c.id} contest={c} registered={!!myRegs[c.id]} registering={registering === c.id}
          onRegister={handleRegister} onViewDetails={openDetails} onViewResults={openResults} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-6 overflow-x-auto no-scrollbar">
        {SUBTABS.map(t => {
          const Icon = t.icon;
          const isActive = subtab === t.key;
          return (
            <button key={t.key} onClick={() => setSubtab(t.key)}
              className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{
                color: isActive ? "#00FFFF" : "rgba(255,255,255,0.35)",
                background: isActive ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: isActive ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              <Icon size={11} /> {t.label}
            </button>
          );
        })}
      </div>

      {subtab === "featured" && (
        featured ? (
          <div className="max-w-md">
            <ContestCard contest={featured} registered={!!myRegs[featured.id]} registering={registering === featured.id}
              onRegister={handleRegister} onViewDetails={openDetails} onViewResults={openResults} />
          </div>
        ) : <p className="font-mono text-xs text-white/20 text-center py-10">no featured contest right now</p>
      )}
      {subtab === "live" && grid(buckets.live)}
      {subtab === "upcoming" && grid(buckets.upcoming)}
      {subtab === "past" && grid(buckets.past)}
      {subtab === "mine" && (
        user ? grid(registeredContests) : (
          <p className="font-mono text-xs text-white/20 text-center py-10">
            <a href="/login?next=/arena" className="text-neon-cyan hover:underline">login</a> to see your registered contests
          </p>
        )
      )}
      {subtab === "categories" && (
        <div className="space-y-5">
          {CONTEST_CATEGORIES.map(cat => {
            const inCat = contests.filter(c => c.category === cat);
            if (inCat.length === 0) return null;
            return (
              <div key={cat}>
                <p className="font-mono text-[9px] text-white/25 tracking-widest mb-2">{cat.toUpperCase()}</p>
                {grid(inCat)}
              </div>
            );
          })}
          {contests.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-10">no contests yet</p>}
        </div>
      )}
      {subtab === "announcements" && (
        <div className="space-y-2 max-w-2xl">
          {(announcements || []).length === 0 && <p className="font-mono text-xs text-white/20 text-center py-10">no announcements yet</p>}
          {(announcements || []).map(a => (
            <div key={a.id} className="border border-white/6 rounded-lg px-4 py-3">
              <p className="font-mono text-xs text-white/60">{a.text}</p>
              <button onClick={() => openDetails(a.contestId)} className="font-mono text-[10px] text-neon-cyan hover:underline mt-1 inline-block">view contest →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
