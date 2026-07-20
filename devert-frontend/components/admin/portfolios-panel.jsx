"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Star, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

const ADMIN_EMAIL = "devert.contact@gmail.com";
function logAdminActivity(action, detail) {
  addDoc(collection(db, "admin_activity_log"), {
    action, detail, actor: auth.currentUser?.email || ADMIN_EMAIL, createdAt: serverTimestamp(),
  }).catch(() => {});
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">{label}</p>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
    </div>
  );
}

function portfolioCompleteness(u) {
  let n = 0;
  if (u.headline) n++;
  if (u.experience?.length) n++;
  if (u.education?.length) n++;
  if (u.certifications?.length) n++;
  if (u.achievements?.length) n++;
  if (u.skills?.length) n++;
  return n;
}

// Mirrors ShipyardPanel's lighter list+search+inline-action pattern (not
// PulseModerationPanel's pending-queue) - portfolios publish immediately,
// there's no approval gate to model here.
export default function PortfoliosPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [working, setWorking] = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "users"), orderBy("joinedAt", "desc")))
      .then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => !search || u.handle?.toLowerCase().includes(search.toLowerCase()));
  const withContent = filtered.filter(u => portfolioCompleteness(u) > 0);

  const toggle = async (u, field) => {
    const next = !u[field];
    setWorking(w => ({ ...w, [`${field}-${u.uid}`]: true }));
    try {
      await updateDoc(doc(db, "users", u.uid), { [field]: next });
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, [field]: next } : x));
      logAdminActivity(`portfolio ${field} -> ${next}`, `@${u.handle}`);
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [`${field}-${u.uid}`]: false })); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1"><Input label="SEARCH" value={search} onChange={setSearch} placeholder="handle..." /></div>
        <span className="font-mono text-[10px] text-white/25 mt-5 flex-shrink-0">{withContent.length} with portfolio content</span>
      </div>
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {withContent.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no portfolios with content yet</p>}
          {withContent.map(u => (
            <div key={u.uid} className="border border-white/6 rounded-lg p-3 flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-white/80">@{u.handle}</span>
                  {u.portfolioFeatured && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#FFD700", background: "rgba(255,215,0,0.1)" }}>FEATURED</span>}
                  {u.portfolioVerified && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#00FF41", background: "rgba(0,255,65,0.1)" }}>VERIFIED</span>}
                  {u.portfolioHidden && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#FF5050", background: "rgba(255,80,80,0.1)" }}>HIDDEN</span>}
                </div>
                <p className="font-mono text-[10px] text-white/30 truncate">{u.headline || "no headline set"} · {portfolioCompleteness(u)}/6 sections filled</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a href={`/u/${u.handle}`} target="_blank" rel="noreferrer" className="text-white/20 hover:text-neon-cyan transition-colors p-1.5" title="View live portfolio">
                  <ExternalLink size={13} />
                </a>
                <button disabled={working[`portfolioFeatured-${u.uid}`]} onClick={() => toggle(u, "portfolioFeatured")}
                  className="p-1.5 transition-colors disabled:opacity-50" style={{ color: u.portfolioFeatured ? "#FFD700" : "rgba(255,255,255,0.25)" }} title="Feature">
                  <Star size={13} fill={u.portfolioFeatured ? "#FFD700" : "none"} />
                </button>
                <button disabled={working[`portfolioVerified-${u.uid}`]} onClick={() => toggle(u, "portfolioVerified")}
                  className="p-1.5 transition-colors disabled:opacity-50" style={{ color: u.portfolioVerified ? "#00FF41" : "rgba(255,255,255,0.25)" }} title="Verify">
                  <ShieldCheck size={13} />
                </button>
                <button disabled={working[`portfolioHidden-${u.uid}`]} onClick={() => toggle(u, "portfolioHidden")}
                  className="p-1.5 transition-colors disabled:opacity-50" style={{ color: u.portfolioHidden ? "#FF5050" : "rgba(255,255,255,0.25)" }} title={u.portfolioHidden ? "Unhide" : "Hide (moderate)"}>
                  {u.portfolioHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
