"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, Search, Bookmark, BookmarkCheck, Share2, ExternalLink,
  Clock, MapPin, Award, ChevronLeft, Ban, Users, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOpportunities, fetchOpportunity, fetchSavedOpportunityIds,
  toggleSavedOpportunity, incrementOpportunityStat, deadlineStatus,
} from "@/lib/opportunities";

const TYPE_COLOR = {
  Internship: "#00FFFF", Job: "#00FF41", Certification: "#FFD700", "Free Course": "#FFD700",
  "Paid Course": "#FF9500", Scholarship: "#C77DFF", Fellowship: "#C77DFF", Hackathon: "#FF9500",
  "Coding Contest": "#FF9500", "Campus Ambassador": "#00FFFF", Bootcamp: "#00FF41",
  Workshop: "#A78BFA", Webinar: "#A78BFA", "Open Source Program": "#00FF41",
  "Research Opportunity": "#C77DFF", Challenge: "#FF9500", Event: "#00FFFF",
};

const FILTERS = ["All", "Featured", "Free", "Paid", "Remote", "Trending"];

export function OpportunitiesTab({ initialOppId }) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState(initialOppId || null);

  useEffect(() => {
    fetchOpportunities().then(setOpportunities).catch(() => setOpportunities([]));
  }, []);

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    fetchSavedOpportunityIds(user.uid).then(ids => setSavedIds(new Set(ids))).catch(() => {});
  }, [user]);

  const toggleSave = async (opp) => {
    if (!user) return;
    const isSaved = savedIds.has(opp.id);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(opp.id) : next.add(opp.id);
      return next;
    });
    await toggleSavedOpportunity(user.uid, opp.id, isSaved).catch(() => {});
  };

  const filtered = useMemo(() => {
    if (!opportunities) return [];
    const q = search.trim().toLowerCase();
    return opportunities.filter(o => {
      if (filter === "Featured" && !o.featured) return false;
      if (filter === "Free" && o.details?.salary) return false;
      if (filter === "Paid" && !o.details?.stipend && !o.details?.salary) return false;
      if (filter === "Remote" && o.details?.workMode !== "Remote") return false;
      if (filter === "Trending" && (o.views || 0) < 50) return false;
      if (q) {
        const hay = [o.title, o.organizationName, ...(o.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [opportunities, search, filter]);

  if (openId) {
    return (
      <OpportunityDetail id={openId} onBack={() => setOpenId(null)}
        saved={savedIds.has(openId)} onToggleSave={toggleSave} />
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities, organizations, tags..."
            className="w-full font-mono text-xs text-white/80 pl-8 pr-3 py-2 rounded outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="font-mono text-[11px] px-3 py-2 rounded-lg transition-colors"
              style={{
                color: filter === f ? "#00FFFF" : "rgba(255,255,255,0.4)",
                background: filter === f ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: filter === f ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {opportunities === null ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="terminal-window h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="terminal-window p-10 text-center">
          <Briefcase size={22} className="mx-auto mb-3 text-white/15" />
          <p className="font-mono text-xs text-white/30">No opportunities match right now - check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map(o => (
            <OpportunityCard key={o.id} opp={o} saved={savedIds.has(o.id)}
              onOpen={() => { setOpenId(o.id); incrementOpportunityStat(o.id, "views"); }}
              onToggleSave={() => toggleSave(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ opp, saved, onOpen, onToggleSave }) {
  const deadline = deadlineStatus(opp.registrationDeadline);
  const color = TYPE_COLOR[opp.type] || "#00FFFF";

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/intel?tab=opportunities&opp=${opp.id}`;
    navigator.clipboard?.writeText(url);
    incrementOpportunityStat(opp.id, "shareCount");
  };

  return (
    <div className="terminal-window cursor-pointer group" onClick={onOpen}>
      <div className="h-1" style={{ background: color }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {opp.organizationLogoUrl ? (
            <img src={opp.organizationLogoUrl} alt="" className="w-9 h-9 rounded-lg object-contain flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
              <Briefcase size={15} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <b className="font-sans text-sm text-white/90 block truncate group-hover:text-neon-cyan transition-colors">{opp.title}</b>
            <span className="font-mono text-[10.5px] text-white/35">{opp.organizationName}</span>
          </div>
          {opp.featured && <Award size={14} style={{ color: "#FFD700" }} className="flex-shrink-0 mt-1" />}
        </div>

        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: `${color}15`, color }}>{opp.type}</span>
          {deadline.label && (
            <span className="font-mono text-[10px] px-2 py-1 rounded flex items-center gap-1"
              style={{ background: deadline.expired ? "rgba(255,80,80,0.1)" : "rgba(255,149,0,0.1)", color: deadline.expired ? "#FF5050" : "#FF9500" }}>
              <Clock size={9} /> {deadline.label}
            </span>
          )}
        </div>

        <p className="font-mono text-[12px] text-white/50 leading-relaxed mb-3 line-clamp-2">{opp.shortDescription}</p>

        {opp.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {opp.tags.slice(0, 4).map(t => (
              <span key={t} className="font-mono text-[9.5px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={(e) => { e.stopPropagation(); onToggleSave(); }} title="Save" className="p-1.5">
            {saved ? <BookmarkCheck size={14} style={{ color: "#00FF41" }} /> : <Bookmark size={14} className="text-white/30" />}
          </button>
          <button onClick={handleShare} title="Share" className="p-1.5"><Share2 size={14} className="text-white/30" /></button>
          <a href={opp.registrationUrl} target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); incrementOpportunityStat(opp.id, "applyClicks"); }}
            className="ml-auto font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{ color: deadline.expired ? "rgba(255,255,255,0.3)" : "#000", background: deadline.expired ? "rgba(255,255,255,0.05)" : "#00FF41", pointerEvents: deadline.expired ? "none" : "auto" }}>
            {deadline.expired ? <><Ban size={11} /> Expired</> : <>Apply Now <ExternalLink size={11} /></>}
          </a>
        </div>
      </div>
    </div>
  );
}

function OpportunityDetail({ id, onBack, saved, onToggleSave }) {
  const [opp, setOpp] = useState(null);

  useEffect(() => {
    fetchOpportunity(id).then(setOpp).catch(() => setOpp(null));
  }, [id]);

  if (!opp) {
    return (
      <div>
        <button onClick={onBack} className="font-mono text-xs text-white/40 flex items-center gap-1 mb-4"><ChevronLeft size={13} /> Back to Opportunities</button>
        <div className="terminal-window h-64 animate-pulse" />
      </div>
    );
  }

  const deadline = deadlineStatus(opp.registrationDeadline);
  const color = TYPE_COLOR[opp.type] || "#00FFFF";
  const e = opp.eligibility || {};
  const d = opp.details || {};

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="font-mono text-xs text-white/40 flex items-center gap-1 mb-5"><ChevronLeft size={13} /> Back to Opportunities</button>

      {opp.bannerUrl && (
        <div className="w-full h-40 sm:h-52 rounded-xl mb-5 bg-cover bg-center" style={{ backgroundImage: `url(${opp.bannerUrl})`, border: "1px solid rgba(255,255,255,0.08)" }} />
      )}

      <div className="flex items-start gap-3 mb-4">
        {opp.organizationLogoUrl && <img src={opp.organizationLogoUrl} alt="" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />}
        <div className="flex-1 min-w-0">
          <h1 className="font-sans text-xl font-bold text-white mb-1">{opp.title}</h1>
          <span className="font-mono text-xs text-white/40">{opp.organizationName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="font-mono text-[11px] px-2.5 py-1 rounded" style={{ background: `${color}15`, color }}>{opp.type}</span>
        {deadline.label && (
          <span className="font-mono text-[11px] px-2.5 py-1 rounded flex items-center gap-1"
            style={{ background: deadline.expired ? "rgba(255,80,80,0.1)" : "rgba(255,149,0,0.1)", color: deadline.expired ? "#FF5050" : "#FF9500" }}>
            <Clock size={10} /> {deadline.label}
          </span>
        )}
        {d.workMode && <span className="font-mono text-[11px] px-2.5 py-1 rounded flex items-center gap-1" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}><MapPin size={10} /> {d.workMode}</span>}
        {opp.featured && <span className="font-mono text-[11px] px-2.5 py-1 rounded flex items-center gap-1" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}><Award size={10} /> Featured</span>}
      </div>

      <p className="font-mono text-sm text-white/60 leading-relaxed mb-6">{opp.detailedDescription || opp.shortDescription}</p>

      {(e.degree || e.yearOfStudy || e.branches?.length || e.minCgpa || e.skillsRequired?.length) && (
        <div className="terminal-window p-4 mb-5">
          <p className="font-mono text-[10px] text-white/30 tracking-widest mb-2.5 flex items-center gap-1.5"><GraduationCap size={11} /> ELIGIBILITY</p>
          <div className="grid sm:grid-cols-2 gap-2 font-mono text-xs text-white/60">
            {e.degree && <p>Degree: {e.degree}</p>}
            {e.yearOfStudy && <p>Year: {e.yearOfStudy}</p>}
            {e.branches?.length > 0 && <p>Branches: {e.branches.join(", ")}</p>}
            {e.minCgpa && <p>Min CGPA: {e.minCgpa}</p>}
            {e.backlogCriteria && <p>Backlogs: {e.backlogCriteria}</p>}
            {e.country && <p>Country: {e.country}</p>}
          </div>
          {e.skillsRequired?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {e.skillsRequired.map(s => <span key={s} className="font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF" }}>{s}</span>)}
            </div>
          )}
        </div>
      )}

      {(d.rewards || d.stipend || d.salary || d.certificate || d.ppoAvailable) && (
        <div className="terminal-window p-4 mb-5">
          <p className="font-mono text-[10px] text-white/30 tracking-widest mb-2.5 flex items-center gap-1.5"><Award size={11} /> BENEFITS &amp; REWARDS</p>
          <div className="grid sm:grid-cols-2 gap-2 font-mono text-xs text-white/60">
            {d.stipend && <p>Stipend: {d.stipend}</p>}
            {d.salary && <p>Salary: {d.salary}</p>}
            {d.rewards && <p>Rewards: {d.rewards}</p>}
            {d.certificate && <p>Certificate provided</p>}
            {d.ppoAvailable && <p>PPO available</p>}
            {d.teamSize && <p>Team size: {d.teamSize}</p>}
            {d.difficulty && <p>Difficulty: {d.difficulty}</p>}
            {d.estimatedTime && <p>Estimated time: {d.estimatedTime}</p>}
          </div>
        </div>
      )}

      {opp.tags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          {opp.tags.map(t => <span key={t} className="font-mono text-[10.5px] px-2.5 py-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>{t}</span>)}
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4">
        <a href={opp.registrationUrl} target="_blank" rel="noreferrer" onClick={() => incrementOpportunityStat(opp.id, "applyClicks")}
          className="font-mono text-sm font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
          style={{ color: deadline.expired ? "rgba(255,255,255,0.3)" : "#000", background: deadline.expired ? "rgba(255,255,255,0.05)" : "#00FF41", pointerEvents: deadline.expired ? "none" : "auto" }}>
          {deadline.expired ? <><Ban size={14} /> Registration Closed</> : <>Apply Now <ExternalLink size={13} /></>}
        </a>
        <button onClick={() => onToggleSave(opp)} className="font-mono text-sm px-4 py-3 rounded-xl flex items-center gap-2" style={{ border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
          {saved ? <BookmarkCheck size={15} style={{ color: "#00FF41" }} /> : <Bookmark size={15} />} {saved ? "Saved" : "Save"}
        </button>
        {opp.officialWebsite && (
          <a href={opp.officialWebsite} target="_blank" rel="noreferrer" className="font-mono text-xs text-white/40 flex items-center gap-1">
            <Users size={12} /> Official site
          </a>
        )}
      </div>
    </div>
  );
}
