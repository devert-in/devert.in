"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Users, Target, Zap, Swords, Shield,
  Plus, Trash2, Check, X, ChevronDown, ChevronUp, LogOut,
  Tv2, GitCommit, Radio, Activity, BookOpen, Wallet, ShieldCheck,
  Bell, BarChart3, ExternalLink, Trophy, Megaphone, Anchor, Gavel,
  Coins, Medal, Crosshair, Command, Flag, MessageSquare, Eye, ClipboardList,
  GraduationCap, Lock as LockIcon, ListChecks, Download,
} from "lucide-react";
import {
  db
} from "@/lib/firebase";
import { writeNotification } from "@/components/notification-bell";
import { DEFAULT_TIERS } from "@/lib/ranks";
import { DEFAULT_ECONOMY } from "@/lib/economy";
import {
  collection, query, orderBy, where, getDocs, addDoc, deleteDoc,
  doc, setDoc, getDoc, serverTimestamp, updateDoc, limit, increment, onSnapshot, writeBatch
} from "firebase/firestore";

const ADMIN_EMAIL = "devert.contact@gmail.com";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayIST() {
  const IST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return IST.toISOString().slice(0, 10);
}

// Fire-and-forget audit trail for admin actions - never blocks the action
// itself if the write fails.
function logAdminActivity(action, detail) {
  addDoc(collection(db, "admin_activity_log"), {
    action, detail, actor: ADMIN_EMAIL, createdAt: serverTimestamp(),
  }).catch(() => {});
}

// Best-effort payout confirmation email via devert-backend. The Firestore
// status update is already the source of truth by the time this fires - this
// is a nice-to-have side effect, so it silently no-ops if no backend URL is
// configured or the call fails.
function notifyPayoutStatus(req, status) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return;
  getDoc(doc(db, "users", req.uid)).then(snap => {
    const email = snap.exists() ? snap.data().email : null;
    if (!email) return;
    fetch(`${apiUrl}/api/notify/payout-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: snap.data().displayName || req.handle || "builder",
        status,
        coins: req.coins || 0,
        inrAmount: req.inrAmount || 0,
      }),
    }).catch(() => {});
  }).catch(() => {});
}

function Input({ label, value, onChange, placeholder, maxLength, hint, type = "text" }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
      {hint && <p className="font-mono text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3, maxLength }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows} maxLength={maxLength}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none resize-none transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.35)")}
        onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

function Section({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="terminal-window mb-6">
      <button onClick={() => setOpen(o => !o)}
        className="terminal-header w-full flex items-center gap-2 hover:bg-white/2 transition-colors"
      >
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <Icon size={11} className="ml-2" style={{ color }} />
        <span className="font-mono text-xs ml-1" style={{ color }}>{title}</span>
        <span className="ml-auto mr-1">{open ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Missions panel ────────────────────────────────────────────────────────────

function MissionsPanel() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState("");

  const blank = {
    codename: "", objective: "", prize: "", deadline: "",
    team: "2", slots: "10", filled: "0",
    status: "OPEN", statusColor: "#00FF41",
    classification: "UNCLASSIFIED",
    difficulty: "MEDIUM", diffColor: "#FF9500",
    tags: "",
  };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const STATUS_OPTS = [
    { v: "OPEN",     c: "#00FF41" },
    { v: "LOCKED",   c: "#555"    },
    { v: "CLASSIFIED", c: "#FF6B35" },
  ];
  const DIFF_OPTS = [
    { v: "EASY",    c: "#00FF41" },
    { v: "MEDIUM",  c: "#FF9500" },
    { v: "HARD",    c: "#FF3B3B" },
    { v: "EXTREME", c: "#FF3B3B" },
  ];

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "missions"), orderBy("createdAt", "desc")))
      .then(snap => setMissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.codename.trim() || !form.objective.trim()) return setError("Codename and objective are required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "missions"), {
        codename:       form.codename.trim(),
        objective:      form.objective.trim(),
        prize:          form.prize.trim(),
        deadline:       form.deadline.trim(),
        team:           parseInt(form.team) || 2,
        slots:          parseInt(form.slots) || 10,
        filled:         parseInt(form.filled) || 0,
        status:         form.status,
        statusColor:    form.statusColor,
        classification: form.classification,
        difficulty:     form.difficulty,
        diffColor:      form.diffColor,
        tags:           form.tags.split(",").map(t => t.trim()).filter(Boolean),
        createdAt:      serverTimestamp(),
      });
      setForm(blank);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this mission?")) return;
    await deleteDoc(doc(db, "missions", id));
    load();
  };

  return (
    <div className="space-y-6">
      {/* Existing missions */}
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2">
          {missions.length === 0 && <p className="font-mono text-xs text-white/20">No missions yet.</p>}
          {missions.map(m => (
            <div key={m.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-3">
              <span className="font-mono text-xs text-white/70 flex-1 truncate">{m.codename}</span>
              <span className="font-mono text-[10px]" style={{ color: m.statusColor }}>{m.status}</span>
              <span className="font-mono text-[10px] text-neon-cyan">{m.prize}</span>
              <button onClick={() => handleDelete(m.id)} className="text-white/20 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider mb-2">// add mission</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="CODENAME" value={form.codename} onChange={f("codename")} placeholder="OPERATION: ZERO LATENCY" />
          <Input label="PRIZE" value={form.prize} onChange={f("prize")} placeholder="₹50,000" />
        </div>
        <Textarea label="OBJECTIVE" value={form.objective} onChange={f("objective")} placeholder="What needs to be built..." rows={2} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="DEADLINE" value={form.deadline} onChange={f("deadline")} placeholder="3 days" />
          <Input label="TEAM SIZE" value={form.team} onChange={f("team")} placeholder="2" />
          <Input label="TOTAL SLOTS" value={form.slots} onChange={f("slots")} placeholder="10" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="CLASSIFICATION" value={form.classification} onChange={f("classification")} placeholder="TOP SECRET" />
          <Input label="TAGS (comma separated)" value={form.tags} onChange={f("tags")} placeholder="Backend, Go, Distributed" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">STATUS</p>
            <div className="flex gap-2">
              {STATUS_OPTS.map(o => (
                <button key={o.v} onClick={() => setForm(p => ({ ...p, status: o.v, statusColor: o.c }))}
                  className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                  style={{
                    color: form.status === o.v ? o.c : "rgba(255,255,255,0.3)",
                    background: form.status === o.v ? `${o.c}15` : "rgba(255,255,255,0.03)",
                    border: form.status === o.v ? `1px solid ${o.c}40` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{o.v}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">DIFFICULTY</p>
            <div className="flex gap-1.5">
              {DIFF_OPTS.map(o => (
                <button key={o.v} onClick={() => setForm(p => ({ ...p, difficulty: o.v, diffColor: o.c }))}
                  className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                  style={{
                    color: form.difficulty === o.v ? o.c : "rgba(255,255,255,0.3)",
                    background: form.difficulty === o.v ? `${o.c}15` : "rgba(255,255,255,0.03)",
                    border: form.difficulty === o.v ? `1px solid ${o.c}40` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{o.v}</button>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleAdd} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "adding..." : "add mission"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Daily Grind panel ─────────────────────────────────────────────────────────

const BLANK_CHALLENGE = {
  type: "DSA", typeColor: "#00FFFF",
  title: "", description: "",
  difficulty: "MEDIUM", diffColor: "#FF9500", diffBg: "rgba(255,149,0,0.08)",
  time: "30 min", tags: "", xp: "150",
};

const TYPE_OPTS = [
  { v: "DSA",           c: "#00FFFF" },
  { v: "SYSTEM_DESIGN", c: "#FF9500" },
  { v: "BUILD",         c: "#00FF41" },
];
const DIFF_OPTS2 = [
  { v: "EASY",   c: "#00FF41", bg: "rgba(0,255,65,0.06)"  },
  { v: "MEDIUM", c: "#FF9500", bg: "rgba(255,149,0,0.08)" },
  { v: "HARD",   c: "#FF3B3B", bg: "rgba(255,59,59,0.08)" },
  { v: "OPEN",   c: "#00FF41", bg: "rgba(0,255,65,0.06)"  },
];

function ChallengeForm({ ch, onChange, onRemove, index }) {
  const f = (k) => (v) => onChange(index, k, v);
  return (
    <div className="border border-white/8 rounded-lg p-4 space-y-3 relative">
      <button onClick={() => onRemove(index)} className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors">
        <X size={13} />
      </button>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
          <div className="flex gap-2">
            {TYPE_OPTS.map(o => (
              <button key={o.v} onClick={() => onChange(index, "type", o.v) || onChange(index, "typeColor", o.c)}
                className="flex-1 font-mono text-[9px] py-1.5 rounded transition-colors"
                style={{
                  color: ch.type === o.v ? o.c : "rgba(255,255,255,0.3)",
                  background: ch.type === o.v ? `${o.c}12` : "rgba(255,255,255,0.03)",
                  border: ch.type === o.v ? `1px solid ${o.c}35` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{o.v}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">DIFFICULTY</p>
          <div className="flex gap-1.5">
            {DIFF_OPTS2.map(o => (
              <button key={o.v} onClick={() => { onChange(index, "difficulty", o.v); onChange(index, "diffColor", o.c); onChange(index, "diffBg", o.bg); }}
                className="flex-1 font-mono text-[9px] py-1.5 rounded transition-colors"
                style={{
                  color: ch.difficulty === o.v ? o.c : "rgba(255,255,255,0.3)",
                  background: ch.difficulty === o.v ? o.bg : "rgba(255,255,255,0.03)",
                  border: ch.difficulty === o.v ? `1px solid ${o.c}35` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{o.v}</button>
            ))}
          </div>
        </div>
      </div>
      <Input label="TITLE" value={ch.title} onChange={f("title")} placeholder="Binary Tree Maximum Path Sum" />
      <Textarea label="DESCRIPTION" value={ch.description} onChange={f("description")} placeholder="Brief problem description..." rows={2} />
      <div className="grid sm:grid-cols-3 gap-3">
        <Input label="TIME" value={ch.time} onChange={f("time")} placeholder="30 min" />
        <Input label="XP REWARD" value={ch.xp} onChange={f("xp")} placeholder="150" />
        <Input label="TAGS (comma separated)" value={ch.tags} onChange={f("tags")} placeholder="Trees, DFS" />
      </div>
    </div>
  );
}

function GrindPanel() {
  const [date,       setDate]       = useState(todayIST());
  const [challenges, setChallenges] = useState([{ ...BLANK_CHALLENGE }]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [loading,    setLoading]    = useState(false);

  const loadDate = async (d) => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "dailyGrind", d));
      if (snap.exists()) setChallenges(snap.data().challenges.map(c => ({ ...c, tags: (c.tags || []).join(", ") })));
      else setChallenges([{ ...BLANK_CHALLENGE }]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDate(date); }, [date]);

  const updateCh = (i, k, v) => setChallenges(prev => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const removeCh = (i) => setChallenges(prev => prev.filter((_, idx) => idx !== i));
  const addCh    = () => setChallenges(prev => [...prev, { ...BLANK_CHALLENGE }]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = challenges.map(c => ({
        ...c,
        xp:   parseInt(c.xp) || 0,
        tags: typeof c.tags === "string" ? c.tags.split(",").map(t => t.trim()).filter(Boolean) : c.tags,
      }));
      await setDoc(doc(db, "dailyGrind", date), { challenges: cleaned, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input label="DATE (YYYY-MM-DD)" value={date} onChange={d => { setDate(d); }} placeholder={todayIST()} />
        </div>
        <p className="font-mono text-[10px] text-white/20 mt-5">IST midnight reset</p>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : (
        <>
          <div className="space-y-3">
            {challenges.map((ch, i) => (
              <ChallengeForm key={i} ch={ch} onChange={updateCh} onRemove={removeCh} index={i} />
            ))}
          </div>
          <button onClick={addCh}
            className="w-full font-mono text-xs text-white/30 border border-dashed border-white/10 py-2 hover:text-white/50 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={11} /> add challenge
          </button>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleSave} disabled={saving}
            className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            style={saved
              ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
              : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
            }
          >
            {saved ? <><Check size={12} /> saved!</> : saving ? "saving..." : "save challenges for this date"}
          </motion.button>
        </>
      )}
    </div>
  );
}

// ── Arena challenges panel ────────────────────────────────────────────────────

function ArenaPanel() {
  const [challenges, setChallenges] = useState([{ ...BLANK_CHALLENGE }]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "arena"))
      .then(snap => {
        if (snap.exists()) setChallenges(snap.data().challenges.map(c => ({ ...c, tags: (c.tags || []).join(", ") })));
      })
      .catch(console.error);
  }, []);

  const updateCh = (i, k, v) => setChallenges(prev => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  const removeCh = (i) => setChallenges(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = challenges.map(c => ({
        ...c,
        xp:   parseInt(c.xp) || 0,
        tags: typeof c.tags === "string" ? c.tags.split(",").map(t => t.trim()).filter(Boolean) : c.tags,
      }));
      await setDoc(doc(db, "system", "arena"), { challenges: cleaned, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {challenges.map((ch, i) => (
          <ChallengeForm key={i} ch={ch} onChange={updateCh} onRemove={removeCh} index={i} />
        ))}
      </div>
      <button onClick={() => setChallenges(prev => [...prev, { ...BLANK_CHALLENGE }])}
        className="w-full font-mono text-xs text-white/30 border border-dashed border-white/10 py-2 hover:text-white/50 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={11} /> add challenge
      </button>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={handleSave} disabled={saving}
        className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        style={saved
          ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
          : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
        }
      >
        {saved ? <><Check size={12} /> saved!</> : saving ? "saving..." : "save arena challenges"}
      </motion.button>
    </div>
  );
}

// ── Users panel ───────────────────────────────────────────────────────────────

function UsersPanel() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);
  const [detail,   setDetail]   = useState({});
  const [xpDelta,  setXpDelta]  = useState({});
  const [working,  setWorking]  = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "users"), orderBy("xp", "desc")))
      .then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    !search ||
    u.handle?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExpand = async (uid) => {
    if (expanded === uid) { setExpanded(null); return; }
    setExpanded(uid);
    if (detail[uid]) return;
    const [earningsSnap, postsSnap, projectsSnap] = await Promise.allSettled([
      getDoc(doc(db, "user_earnings", uid)),
      getDocs(query(collection(db, "pulse_posts"), where("uid", "==", uid))),
      getDocs(query(collection(db, "projects"), where("ownerId", "==", uid))),
    ]);
    setDetail(prev => ({
      ...prev,
      [uid]: {
        earnings:     earningsSnap.status === "fulfilled" && earningsSnap.value.exists() ? earningsSnap.value.data() : null,
        postCount:    postsSnap.status === "fulfilled"    ? postsSnap.value.size    : 0,
        projectCount: projectsSnap.status === "fulfilled" ? projectsSnap.value.size : 0,
      },
    }));
  };

  const handleXP = async (uid, sign) => {
    const u = users.find(u => u.uid === uid);
    if (!u) return;
    const delta  = parseInt(xpDelta[uid]) || 100;
    const newXP  = Math.max(0, (u.xp || 0) + sign * delta);
    setWorking(p => ({ ...p, [`xp-${uid}`]: true }));
    try {
      await updateDoc(doc(db, "users", uid), { xp: newXP });
      setUsers(prev => prev.map(x => x.uid === uid ? { ...x, xp: newXP } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [`xp-${uid}`]: false })); }
  };

  const handleSuspend = async (u) => {
    const next = !u.suspended;
    setWorking(p => ({ ...p, [`sus-${u.uid}`]: true }));
    try {
      await updateDoc(doc(db, "users", u.uid), { suspended: next });
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, suspended: next } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [`sus-${u.uid}`]: false })); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input label="SEARCH" value={search} onChange={setSearch} placeholder="handle or email..." />
        </div>
        <span className="font-mono text-[10px] text-white/25 mt-5 flex-shrink-0">{users.length} users</span>
      </div>
      {loading ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading users...</p>
      ) : (
        <div className="space-y-1">
          {filtered.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no users found</p>}
          {filtered.map(u => (
            <div key={u.uid} className="border border-white/6 rounded-lg overflow-hidden">
              <button
                onClick={() => handleExpand(u.uid)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 transition-colors text-left"
              >
                <span className="font-mono text-xs text-white flex-shrink-0">@{u.handle}</span>
                {u.suspended && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: "#FF3B3B", background: "rgba(255,59,59,0.1)", border: "1px solid rgba(255,59,59,0.3)" }}>
                    SUSPENDED
                  </span>
                )}
                <span className="font-mono text-[10px] text-white/35 truncate flex-1">{u.email}</span>
                <span className="font-mono text-xs text-neon-cyan flex-shrink-0">{(u.xp || 0).toLocaleString()} XP</span>
                <span className="font-mono text-[9px] flex-shrink-0" style={{ color: u.tier?.color || "#666" }}>{u.tier?.name || "RECRUIT"}</span>
                {expanded === u.uid
                  ? <ChevronUp size={11} className="text-white/30 flex-shrink-0" />
                  : <ChevronDown size={11} className="text-white/30 flex-shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {expanded === u.uid && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/5">
                      {/* Stats grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { label: "XP",        val: (u.xp || 0).toLocaleString(),           color: "#00FFFF" },
                          { label: "SHIPS",      val: u.ships || 0,                            color: "#C77DFF" },
                          { label: "ARENA_W",    val: u.arenaWins || 0,                        color: "#FF9500" },
                          { label: "POSTS",      val: detail[u.uid]?.postCount ?? "…",         color: "#00FF41" },
                          { label: "COINS",      val: (u.coins || 0).toLocaleString(),          color: "#FFD700" },
                          { label: "FOLLOWERS",  val: u.followersCount || 0,                   color: "#FF6430" },
                        ].map(s => (
                          <div key={s.label} className="border border-white/6 rounded p-2 text-center">
                            <p className="font-mono text-[8px] text-white/25 tracking-wider">{s.label}</p>
                            <p className="font-mono text-xs mt-0.5" style={{ color: s.color }}>{s.val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Earnings + projects */}
                      {detail[u.uid] && (
                        <p className="font-mono text-[10px] text-white/40">
                          EARNINGS:{" "}
                          <span style={{ color: "#00FF41" }}>
                            ₹{(detail[u.uid].earnings?.totalInr || 0).toFixed(2)}
                          </span>
                          {" · "}projects: {detail[u.uid].projectCount}
                        </p>
                      )}

                      {/* UID + Bio */}
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-white/25 break-all">UID: {u.uid}</p>
                        {u.bio && <p className="font-mono text-[10px] text-white/35 leading-relaxed">{u.bio}</p>}
                      </div>

                      {/* Actions row */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          type="number"
                          value={xpDelta[u.uid] ?? "100"}
                          onChange={e => setXpDelta(p => ({ ...p, [u.uid]: e.target.value }))}
                          className="font-mono text-[10px] text-white/70 w-16 px-2 py-1 rounded outline-none text-center"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                        <button
                          onClick={() => handleXP(u.uid, 1)}
                          disabled={working[`xp-${u.uid}`]}
                          className="font-mono text-[10px] px-2.5 py-1 text-neon-green border border-neon-green/25 hover:bg-neon-green/8 transition-colors disabled:opacity-50"
                        >+XP</button>
                        <button
                          onClick={() => handleXP(u.uid, -1)}
                          disabled={working[`xp-${u.uid}`]}
                          className="font-mono text-[10px] px-2.5 py-1 text-red-400 border border-red-500/25 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                        >-XP</button>
                        <a
                          href={`/u/${u.handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] px-2.5 py-1 text-neon-cyan border border-neon-cyan/25 hover:bg-neon-cyan/8 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink size={9} /> view profile
                        </a>
                        <button
                          onClick={() => handleSuspend(u)}
                          disabled={working[`sus-${u.uid}`]}
                          className="font-mono text-[10px] px-2.5 py-1 transition-colors disabled:opacity-50 border"
                          style={u.suspended
                            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.25)", background: "rgba(0,255,65,0.06)" }
                            : { color: "#FF3B3B", borderColor: "rgba(255,59,59,0.25)", background: "rgba(255,59,59,0.06)" }
                          }
                        >
                          {working[`sus-${u.uid}`] ? "..." : u.suspended ? "restore" : "suspend"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Broadcast panel ───────────────────────────────────────────────────────────

function BroadcastPanel() {
  const [episodes,    setEpisodes]    = useState([]);
  const [upcoming,    setUpcoming]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [isLive,      setIsLive]      = useState(false);
  const [liveUrl,     setLiveUrl]     = useState("");
  const [liveInput,   setLiveInput]   = useState("");
  const [liveLoading, setLiveLoading] = useState(false);

  const blankEp = { ep: "", title: "", duration: "", views: "", date: "", tag: "", url: "" };
  const [form, setForm] = useState(blankEp);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const blankUp = { title: "", date: "", registered: "" };
  const [upForm, setUpForm] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [snap, sysSnap] = await Promise.all([
        getDocs(query(collection(db, "broadcasts"), orderBy("createdAt", "desc"))),
        getDoc(doc(db, "system", "broadcast")),
      ]);
      setEpisodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      const sysData = sysSnap.exists() ? sysSnap.data() : {};
      setUpForm(sysData.upcoming || []);
      setUpcoming(sysData.upcoming || []);
      setIsLive(sysData.isLive || false);
      setLiveUrl(sysData.liveUrl || "");
      setLiveInput(sysData.liveUrl || "");
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddEpisode = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "broadcasts"), { ...form, createdAt: serverTimestamp() });
      setForm(blankEp);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteEpisode = async (id) => {
    if (!confirm("Delete this episode?")) return;
    await deleteDoc(doc(db, "broadcasts", id));
    loadData();
  };

  const handleSaveUpcoming = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = upForm
        .filter(u => u.title.trim())
        .map(u => ({ ...u, registered: parseInt(u.registered) || 0 }));
      await setDoc(doc(db, "system", "broadcast"), { upcoming: cleaned, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleGoLive = async () => {
    const url = liveInput.trim();
    if (!url) return;
    setLiveLoading(true);
    try {
      await setDoc(doc(db, "system", "broadcast"), { liveUrl: url, isLive: true, liveUpdatedAt: serverTimestamp() }, { merge: true });
      setLiveUrl(url);
      setIsLive(true);
    } catch (err) { console.error(err); }
    finally { setLiveLoading(false); }
  };

  const handleEndStream = async () => {
    setLiveLoading(true);
    try {
      await setDoc(doc(db, "system", "broadcast"), { liveUrl: "", isLive: false, liveUpdatedAt: serverTimestamp() }, { merge: true });
      setLiveUrl(""); setIsLive(false); setLiveInput("");
    } catch (err) { console.error(err); }
    finally { setLiveLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Live stream control */}
      <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: isLive ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.15)" }}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-red-500" : "bg-white/15"}`} />
          </span>
          <p className="font-mono text-[10px] text-red-400/80 tracking-wider">// live stream control</p>
          {isLive && <span className="font-mono text-[9px] text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded ml-auto">LIVE NOW</span>}
        </div>
        {isLive ? (
          <div className="space-y-2">
            <p className="font-mono text-[10px] text-white/35 break-all">{liveUrl}</p>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleEndStream} disabled={liveLoading}
              className="w-full font-mono text-xs py-2.5 text-red-400 border border-red-500/30 hover:bg-red-500/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {liveLoading ? "ending..." : "[ END STREAM ]"}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input label="YOUTUBE LIVE URL" value={liveInput} onChange={setLiveInput} placeholder="https://youtube.com/live/... or youtu.be/..." />
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleGoLive} disabled={liveLoading || !liveInput.trim()}
              className="w-full font-mono text-xs py-2.5 text-red-400 border border-red-500/30 hover:bg-red-500/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Radio size={11} /> {liveLoading ? "going live..." : "[ GO LIVE ]"}
            </motion.button>
          </div>
        )}
      </div>

      {/* Episodes list */}
      <div>
        <p className="font-mono text-[10px] text-white/25 mb-2 tracking-wider">// past episodes</p>
        {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
          <div className="space-y-2 mb-4">
            {episodes.length === 0 && <p className="font-mono text-xs text-white/20">No episodes yet.</p>}
            {episodes.map(ep => (
              <div key={ep.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
                {ep.ep && <span className="font-mono text-[10px] text-neon-cyan flex-shrink-0">{ep.ep}</span>}
                <span className="font-mono text-xs text-white/70 flex-1 truncate">{ep.title}</span>
                <span className="font-mono text-[10px] text-white/28 flex-shrink-0">{ep.date}</span>
                <button onClick={() => handleDeleteEpisode(ep.id)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Add episode form */}
        <div className="border border-white/6 rounded-lg p-4 space-y-3">
          <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// add episode</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="EPISODE #" value={form.ep} onChange={f("ep")} placeholder="E13" />
            <Input label="TAG" value={form.tag} onChange={f("tag")} placeholder="Backend" />
          </div>
          <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="Building a Rate Limiter..." />
          <div className="grid sm:grid-cols-3 gap-3">
            <Input label="DURATION" value={form.duration} onChange={f("duration")} placeholder="1h 24m" />
            <Input label="VIEWS" value={form.views} onChange={f("views")} placeholder="2.4k" />
            <Input label="DATE" value={form.date} onChange={f("date")} placeholder="Jun 18" />
          </div>
          <Input label="URL (optional)" value={form.url} onChange={f("url")} placeholder="https://youtube.com/..." />
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleAddEpisode} disabled={saving}
            className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={12} /> {saving ? "adding..." : "add episode"}
          </motion.button>
        </div>
      </div>

      {/* Upcoming streams */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider mb-2">// upcoming streams (saved to system/broadcast)</p>
        {upForm.map((u, i) => (
          <div key={i} className="flex items-center gap-2 border border-white/5 rounded-lg p-3 relative">
            <div className="flex-1 grid sm:grid-cols-3 gap-2">
              <Input label="TITLE" value={u.title} onChange={v => setUpForm(prev => prev.map((x, idx) => idx === i ? { ...x, title: v } : x))} placeholder="Live Grind: DSA Sprint" />
              <Input label="DATE" value={u.date} onChange={v => setUpForm(prev => prev.map((x, idx) => idx === i ? { ...x, date: v } : x))} placeholder="Jun 25, 8PM IST" />
              <Input label="REGISTERED" value={u.registered} onChange={v => setUpForm(prev => prev.map((x, idx) => idx === i ? { ...x, registered: v } : x))} placeholder="142" />
            </div>
            <button onClick={() => setUpForm(prev => prev.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-red-400 transition-colors self-end pb-1 ml-1">
              <X size={13} />
            </button>
          </div>
        ))}
        <button onClick={() => setUpForm(prev => [...prev, { ...blankUp }])}
          className="w-full font-mono text-xs text-white/30 border border-dashed border-white/10 py-2 hover:text-white/50 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={11} /> add upcoming stream
        </button>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleSaveUpcoming} disabled={saving}
          className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          style={saved
            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
            : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
          }
        >
          {saved ? <><Check size={12} /> saved!</> : saving ? "saving..." : "save upcoming schedule"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Logs / Changelog panel ────────────────────────────────────────────────────

const LOG_TYPE_OPTS = ["deploy", "feat", "fix", "perf", "drop", "chore"];

function LogsPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const blank = { hash: "", type: "feat", msg: "", detail: "", date: "", author: "The Duo" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "changelog"), orderBy("createdAt", "desc")))
      .then(snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.hash.trim() || !form.msg.trim()) return setError("Version hash and message are required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "changelog"), { ...form, createdAt: serverTimestamp() });
      setForm(blank);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this log entry?")) return;
    await deleteDoc(doc(db, "changelog", id));
    load();
  };

  return (
    <div className="space-y-4">
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 && <p className="font-mono text-xs text-white/20">No log entries yet.</p>}
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-mono text-[10px] text-white/28 flex-shrink-0">{log.hash}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: log.type === "feat" ? "#00FFFF" : log.type === "fix" ? "#FF5050" : "#00FF41", background: "rgba(255,255,255,0.04)" }}>
                {log.type}
              </span>
              <span className="font-mono text-xs text-white/60 flex-1 truncate">{log.msg}</span>
              <button onClick={() => handleDelete(log.id)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// add changelog entry</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="VERSION / HASH" value={form.hash} onChange={f("hash")} placeholder="v2.1.0" />
          <Input label="DATE" value={form.date} onChange={f("date")} placeholder="Jun 24, 2026" />
        </div>
        <Input label="MESSAGE" value={form.msg} onChange={f("msg")} placeholder="Add Intel Feed page" />
        <Textarea label="DETAIL" value={form.detail} onChange={f("detail")} placeholder="Detailed description..." rows={2} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="AUTHOR" value={form.author} onChange={f("author")} placeholder="The Duo" />
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
            <div className="flex gap-1.5 flex-wrap">
              {LOG_TYPE_OPTS.map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                  className="font-mono text-[10px] px-2 py-1 rounded transition-colors"
                  style={{
                    color: form.type === t ? "#00FFFF" : "rgba(255,255,255,0.3)",
                    background: form.type === t ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                    border: form.type === t ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{t}</button>
              ))}
            </div>
          </div>
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleAdd} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "adding..." : "add log entry"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Intel panel ───────────────────────────────────────────────────────────────

const SIGNAL_OPTS = ["HIGH", "MED", "LOW"];

function IntelPanel() {
  const [ticker,     setTicker]     = useState([]);
  const [tickerRaw,  setTickerRaw]  = useState("");
  const [repos,      setRepos]      = useState([]);
  const [news,       setNews]       = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");

  const blankNews = { title: "", signal: "HIGH", source: "", tag: "", url: "" };
  const [newsForm, setNewsForm] = useState(blankNews);
  const nf = (k) => (v) => setNewsForm(p => ({ ...p, [k]: v }));

  const blankJob = { company: "", role: "", stack: "", type: "Full-time", ctc: "", hot: false, url: "" };
  const [jobForm, setJobForm] = useState(blankJob);
  const jf = (k) => (v) => setJobForm(p => ({ ...p, [k]: v }));

  const loadData = async () => {
    setLoading(true);
    try {
      const [sysSnap, newsSnap, jobsSnap] = await Promise.all([
        getDoc(doc(db, "system", "intel")),
        getDocs(query(collection(db, "intel_news"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "intel_jobs"), orderBy("createdAt", "desc"))),
      ]);
      if (sysSnap.exists()) {
        const t = sysSnap.data().ticker || [];
        setTicker(t);
        setTickerRaw(t.join("\n"));
        setRepos(sysSnap.data().repos || []);
      }
      setNews(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveTicker = async () => {
    setSaving(true); setSaved(false);
    try {
      const items = tickerRaw.split("\n").map(s => s.trim()).filter(Boolean);
      await setDoc(doc(db, "system", "intel"), { ticker: items, repos, updatedAt: serverTimestamp() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleAddNews = async () => {
    if (!newsForm.title.trim()) return setError("Title is required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "intel_news"), { ...newsForm, createdAt: serverTimestamp() });
      setNewsForm(blankNews);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteNews = async (id) => {
    if (!confirm("Delete?")) return;
    await deleteDoc(doc(db, "intel_news", id));
    loadData();
  };

  const handleAddJob = async () => {
    if (!jobForm.company.trim() || !jobForm.role.trim()) return setError("Company and role are required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "intel_jobs"), { ...jobForm, createdAt: serverTimestamp() });
      setJobForm(blankJob);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete?")) return;
    await deleteDoc(doc(db, "intel_jobs", id));
    loadData();
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-6">
      {/* Ticker */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// ticker items (one per line)</p>
        <Textarea label="TICKER ITEMS" value={tickerRaw} onChange={setTickerRaw}
          placeholder={"RUST SURPASSES GO IN BACKEND ADOPTION\nOPENAI DROPS GPT-5 API..."} rows={5} />
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleSaveTicker} disabled={saving}
          className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          style={saved
            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
            : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
          }
        >
          {saved ? <><Check size={12} /> saved!</> : "save ticker"}
        </motion.button>
      </div>

      {/* News */}
      <div>
        <p className="font-mono text-[10px] text-white/25 mb-2 tracking-wider">// intel news</p>
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {news.length === 0 && <p className="font-mono text-xs text-white/20">No news yet.</p>}
          {news.map(n => (
            <div key={n.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: n.signal === "HIGH" ? "#00FF41" : n.signal === "MED" ? "#FF9500" : "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}>
                {n.signal}
              </span>
              <span className="font-mono text-xs text-white/60 flex-1 truncate">{n.title}</span>
              <span className="font-mono text-[10px] text-white/25 flex-shrink-0">{n.source}</span>
              <button onClick={() => handleDeleteNews(n.id)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="border border-white/6 rounded-lg p-4 space-y-3">
          <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// add news article</p>
          <Input label="TITLE" value={newsForm.title} onChange={nf("title")} placeholder="Why Microservices Are Making Things Worse" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="SOURCE" value={newsForm.source} onChange={nf("source")} placeholder="martinfowler.com" />
            <Input label="TAG" value={newsForm.tag} onChange={nf("tag")} placeholder="Architecture" />
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">SIGNAL</p>
            <div className="flex gap-2">
              {SIGNAL_OPTS.map(s => (
                <button key={s} onClick={() => setNewsForm(p => ({ ...p, signal: s }))}
                  className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                  style={{
                    color: newsForm.signal === s ? (s === "HIGH" ? "#00FF41" : s === "MED" ? "#FF9500" : "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.3)",
                    background: newsForm.signal === s ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                    border: newsForm.signal === s ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleAddNews} disabled={saving}
            className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={12} /> {saving ? "adding..." : "add news"}
          </motion.button>
        </div>
      </div>

      {/* Jobs */}
      <div>
        <p className="font-mono text-[10px] text-white/25 mb-2 tracking-wider">// job listings</p>
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {jobs.length === 0 && <p className="font-mono text-xs text-white/20">No jobs yet.</p>}
          {jobs.map(j => (
            <div key={j.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-sans text-xs text-white/70 flex-shrink-0">{j.company}</span>
              <span className="font-mono text-xs text-white/45 flex-1 truncate">{j.role}</span>
              <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>{j.ctc}</span>
              <button onClick={() => handleDeleteJob(j.id)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="border border-white/6 rounded-lg p-4 space-y-3">
          <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// add job listing</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="COMPANY" value={jobForm.company} onChange={jf("company")} placeholder="Razorpay" />
            <Input label="ROLE" value={jobForm.role} onChange={jf("role")} placeholder="SDE-2 Backend" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="STACK (comma separated)" value={jobForm.stack} onChange={jf("stack")} placeholder="Go, Kafka" />
            <Input label="CTC" value={jobForm.ctc} onChange={jf("ctc")} placeholder="40-60 LPA" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
              <div className="flex gap-2">
                {["Full-time", "Internship"].map(t => (
                  <button key={t} onClick={() => setJobForm(p => ({ ...p, type: t }))}
                    className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                    style={{
                      color: jobForm.type === t ? "#00FFFF" : "rgba(255,255,255,0.3)",
                      background: jobForm.type === t ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      border: jobForm.type === t ? "1px solid rgba(0,255,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={() => setJobForm(p => ({ ...p, hot: !p.hot }))}
                className="flex items-center gap-2 font-mono text-[10px] transition-colors"
                style={{ color: jobForm.hot ? "#FF9500" : "rgba(255,255,255,0.3)" }}
              >
                <span className="w-4 h-4 border rounded flex items-center justify-center"
                  style={{ borderColor: jobForm.hot ? "#FF9500" : "rgba(255,255,255,0.15)", background: jobForm.hot ? "rgba(255,149,0,0.1)" : "transparent" }}>
                  {jobForm.hot && <Check size={9} />}
                </span>
                HOT LISTING
              </button>
            </div>
          </div>
          {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleAddJob} disabled={saving}
            className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={12} /> {saving ? "adding..." : "add job"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Pulse panel ───────────────────────────────────────────────────────────────

const PULSE_TYPES = ["tip", "news", "tool", "code", "career", "hot"];

function PulsePanel() {
  const { user } = useAuth();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const blank = { type: "tip", title: "", body: "", code: "", codeLang: "", tags: "", url: "", featured: false };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "pulse_posts"), orderBy("createdAt", "desc")))
      .then(snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError("Title and body are required."); return; }
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "pulse_posts"), {
        uid:      user.uid,
        type:     form.type,
        title:    form.title.trim(),
        body:     form.body.trim(),
        code:     form.code.trim() || null,
        codeLang: form.codeLang.trim() || null,
        tags:     form.tags.split(",").map(t => t.trim()).filter(Boolean),
        url:      form.url.trim() || null,
        featured: form.featured,
        status:   "approved",
        createdAt: serverTimestamp(),
      });
      updateDoc(doc(db, "users", user.uid), { pulsePostsCount: increment(1) }).catch(() => {});
      setForm(blank);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this pulse post?")) return;
    await deleteDoc(doc(db, "pulse_posts", id));
    load();
  };

  return (
    <div className="space-y-4">
      {/* Existing posts */}
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {posts.length === 0 && <p className="font-mono text-xs text-white/20">No posts yet.</p>}
          {posts.map(p => (
            <div key={p.id} className="flex items-start gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0"
                style={{ color: "#00FF41", background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.15)" }}>
                {p.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-white/70 truncate">{p.title}</p>
                <p className="font-mono text-[10px] text-white/28 truncate mt-0.5">{p.body}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-white/20 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New post form */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// create pulse post</p>

        {/* Type selector */}
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
          <div className="flex gap-1.5 flex-wrap">
            {PULSE_TYPES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                className="font-mono text-[10px] px-2.5 py-1 rounded-full transition-colors"
                style={{
                  color: form.type === t ? "#00FF41" : "rgba(255,255,255,0.3)",
                  background: form.type === t ? "rgba(0,255,65,0.08)" : "rgba(255,255,255,0.03)",
                  border: form.type === t ? "1px solid rgba(0,255,65,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="e.g. Why senior devs prefer boring tech" maxLength={120} />
        <Textarea label="BODY" value={form.body} onChange={f("body")} placeholder="The insight in 1-3 sentences..." rows={3} maxLength={400} />
        <Textarea label="CODE SNIPPET (optional)" value={form.code} onChange={f("code")} placeholder="// paste code here" rows={4} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="CODE LANGUAGE" value={form.codeLang} onChange={f("codeLang")} placeholder="javascript" />
          <Input label="SOURCE URL (optional)" value={form.url} onChange={f("url")} placeholder="https://..." />
        </div>
        <Input label="TAGS (comma-separated)" value={form.tags} onChange={f("tags")} placeholder="react, performance, career" />

        {/* Featured toggle */}
        <div className="flex items-center gap-3">
          <button onClick={() => setForm(p => ({ ...p, featured: !p.featured }))}
            className="w-9 h-5 rounded-full transition-all relative"
            style={{ background: form.featured ? "rgba(0,255,65,0.3)" : "rgba(255,255,255,0.08)", border: `1px solid ${form.featured ? "rgba(0,255,65,0.5)" : "rgba(255,255,255,0.12)"}` }}
          >
            <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{ left: form.featured ? "calc(100% - 1.1rem)" : "0.1rem", background: form.featured ? "#00FF41" : "rgba(255,255,255,0.3)" }} />
          </button>
          <p className="font-mono text-[10px] text-white/40">featured post</p>
        </div>

        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleAdd} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "publishing..." : "publish post"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Intel Resources panel ─────────────────────────────────────────────────────

const ADMIN_RESOURCE_BUNDLES = [
  {
    id: "java-ebook", title: "Java Ebook Course Bundle", color: "#FF9500",
    modules: [
      { id: "java-handwritten", title: "Java Handwritten Notes",   type: "pdf"  },
      { id: "java-digital",     title: "Java Digital Notes",       type: "pdf"  },
      { id: "java-cheatsheet",  title: "Java CheatSheet Notes",    type: "pdf"  },
      { id: "java-interview",   title: "Java Interview Q&A",       type: "pdf"  },
      { id: "java-projects",    title: "Java Projects",            type: "code" },
      { id: "java-paid-links",  title: "Java Course Paid Links",   type: "link" },
      { id: "java-dsa",         title: "Java With DSA",            type: "pdf"  },
      { id: "company-leetcode", title: "Company Wise Leetcode",    type: "pdf"  },
      { id: "ds-leetcode",      title: "Data Structures Leetcode", type: "pdf"  },
      { id: "java-backend",     title: "Java Backend Topic Guide", type: "pdf"  },
    ],
  },
  {
    id: "java-spring", title: "Java · Spring Boot · Microservices", color: "#00FFFF",
    modules: [
      { id: "core-java",        title: "Core Java",           type: "video" },
      { id: "advanced-java",    title: "Advanced Java",       type: "video" },
      { id: "spring",           title: "Spring Framework",    type: "video" },
      { id: "springboot",       title: "Spring Boot",         type: "video" },
      { id: "hibernate",        title: "Hibernate & JPA",     type: "video" },
      { id: "microservices",    title: "Microservices",       type: "video" },
      { id: "spring-bonus",     title: "Bonus Content",       type: "mixed" },
      { id: "spring-interview", title: "Interview Questions", type: "pdf"   },
    ],
  },
];

function ResourcesPanel() {
  const [resources, setResources] = useState({});
  const [urls,      setUrls]      = useState({});
  const [saving,    setSaving]    = useState({});
  const [saved,     setSaved]     = useState({});

  useEffect(() => {
    getDocs(collection(db, "intel_resources"))
      .then(snap => {
        const map = {};
        const urlMap = {};
        snap.docs.forEach(d => {
          map[d.id]    = d.data();
          urlMap[d.id] = d.data().url || "";
        });
        setResources(map);
        setUrls(urlMap);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (moduleId) => {
    setSaving(p => ({ ...p, [moduleId]: true }));
    try {
      const url = (urls[moduleId] || "").trim();
      await setDoc(doc(db, "intel_resources", moduleId), {
        url,
        status:    url ? "available" : "coming_soon",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setResources(p => ({ ...p, [moduleId]: { url, status: url ? "available" : "coming_soon" } }));
      setSaved(p => ({ ...p, [moduleId]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [moduleId]: false })), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(p => ({ ...p, [moduleId]: false })); }
  };

  return (
    <div className="space-y-6">
      {ADMIN_RESOURCE_BUNDLES.map(bundle => (
        <div key={bundle.id}>
          <p className="font-mono text-[10px] mb-3 tracking-wider" style={{ color: bundle.color }}>
            // {bundle.title}
          </p>
          <div className="space-y-2">
            {bundle.modules.map((mod, i) => {
              const res     = resources[mod.id];
              const isAvail = res?.status === "available" && res?.url;
              return (
                <div key={mod.id} className="flex items-center gap-2 border border-white/6 rounded-lg px-3 py-2">
                  <span className="font-mono text-[9px] text-white/18 w-4 flex-shrink-0 text-right">{i + 1}</span>
                  <span className="font-mono text-xs text-white/55 flex-1 min-w-0 truncate">{mod.title}</span>
                  <span className="font-mono text-[9px] text-white/22 flex-shrink-0">{mod.type}</span>
                  <span className="font-mono text-[9px] flex-shrink-0 w-8 text-center"
                    style={{ color: isAvail ? "#00FF41" : "rgba(255,255,255,0.18)" }}>
                    {isAvail ? "LIVE" : "SOON"}
                  </span>
                  <input
                    type="text"
                    value={urls[mod.id] || ""}
                    onChange={e => setUrls(p => ({ ...p, [mod.id]: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="font-mono text-[10px] text-white/70 px-2 py-1 rounded outline-none flex-shrink-0"
                    style={{ width: 220, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => (e.target.style.borderColor = `${bundle.color}50`)}
                    onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button
                    onClick={() => handleSave(mod.id)}
                    disabled={saving[mod.id]}
                    className="font-mono text-[9px] px-2.5 py-1 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                    style={saved[mod.id]
                      ? { color: "#00FF41", background: "rgba(0,255,65,0.08)",   border: "1px solid rgba(0,255,65,0.25)"           }
                      : { color: bundle.color, background: `${bundle.color}08`, border: `1px solid ${bundle.color}25` }}
                  >
                    {saved[mod.id] ? <span className="inline-flex items-center gap-1"><Check size={10} /> OK</span> : saving[mod.id] ? "..." : "SAVE"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="font-mono text-[10px] text-white/18">
        Paste a direct Google Drive / S3 / any URL. Status flips to LIVE automatically when a URL is saved.
      </p>
    </div>
  );
}

// ── Payouts panel ─────────────────────────────────────────────────────────────

function PayoutsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");
  const [working,  setWorking]  = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "payout_requests"), orderBy("createdAt", "desc")))
      .then(snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (req) => {
    if (!confirm(`Approve ₹${(req.inrAmount || 0).toFixed(2)} payout to @${req.handle}?`)) return;
    setWorking(p => ({ ...p, [req.id]: true }));
    try {
      await updateDoc(doc(db, "payout_requests", req.id), { status: "approved", processedAt: serverTimestamp() });
      writeNotification(req.uid, {
        type: "payout",
        title: `Payout of ₹${(req.inrAmount || 0).toFixed(2)} approved`,
        body: "Your withdrawal request has been approved. Payment is being processed.",
        ctaHref: "/wallet",
        ctaLabel: "view wallet",
      });
      notifyPayoutStatus(req, "approved");
      load();
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [req.id]: false })); }
  };

  const handleReject = async (req) => {
    const reason = prompt("Rejection reason (optional):");
    if (reason === null) return;
    setWorking(p => ({ ...p, [req.id]: true }));
    try {
      await updateDoc(doc(db, "payout_requests", req.id), { status: "rejected", note: reason || "", processedAt: serverTimestamp() });
      writeNotification(req.uid, {
        type: "rejection",
        title: `Payout request rejected`,
        body: reason ? `Reason: ${reason}` : "Your withdrawal request was not approved. Contact support if needed.",
        ctaHref: "/wallet",
        ctaLabel: "view wallet",
      });
      notifyPayoutStatus(req, "rejected");
      load();
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [req.id]: false })); }
  };

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["pending", "approved", "rejected", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
            style={{
              color:      filter === s ? "#00FFFF" : "rgba(255,255,255,0.3)",
              background: filter === s ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border:     filter === s ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >{s}</button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-white/22 self-center">
          {pendingCount} pending
        </span>
      </div>

      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <p className="font-mono text-xs text-white/20">No requests.</p>}
          {filtered.map(req => (
            <div key={req.id} className="border border-white/6 rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-white/80">@{req.handle}</span>
                <span className="font-mono text-[10px] text-white/35 truncate">{req.email}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    color:      req.status === "approved" ? "#00FF41" : req.status === "rejected" ? "#FF5050" : "#FF9500",
                    background: req.status === "approved" ? "rgba(0,255,65,0.08)" : req.status === "rejected" ? "rgba(255,59,59,0.08)" : "rgba(255,149,0,0.08)",
                    border:     `1px solid ${req.status === "approved" ? "rgba(0,255,65,0.2)" : req.status === "rejected" ? "rgba(255,59,59,0.2)" : "rgba(255,149,0,0.2)"}`,
                  }}>
                  {req.status.toUpperCase()}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold" style={{ color: "#00FFFF" }}>
                  ₹{(req.inrAmount || 0).toFixed(2)}
                </span>
                <span className="font-mono text-xs text-white/35">{(req.coins || 0).toLocaleString()} coins</span>
                <span className="font-mono text-[10px] border border-white/8 px-1.5 py-0.5 rounded text-white/40">{req.method}</span>
              </div>

              {/* Payment details */}
              <div className="font-mono text-[10px] text-white/30 space-y-0.5">
                {req.method === "upi" && req.upiId && (
                  <p>UPI ID: <span className="text-white/55">{req.upiId}</span></p>
                )}
                {req.method === "bank" && (
                  <>
                    {req.bankName      && <p>Bank:  <span className="text-white/55">{req.bankName}</span></p>}
                    {req.accountNumber && <p>A/C:   <span className="text-white/55">{req.accountNumber}</span></p>}
                    {req.ifscCode      && <p>IFSC:  <span className="text-white/55">{req.ifscCode}</span></p>}
                  </>
                )}
              </div>

              {req.status === "rejected" && req.note && (
                <p className="font-mono text-[10px] text-red-400/60">Reason: {req.note}</p>
              )}

              {req.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req)} disabled={working[req.id]}
                    className="flex-1 font-mono text-[10px] py-1.5 text-neon-green border border-neon-green/25 hover:bg-neon-green/8 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1">
                    {working[req.id] ? "..." : <><Check size={10} /> APPROVE</>}
                  </button>
                  <button onClick={() => handleReject(req)} disabled={working[req.id]}
                    className="flex-1 font-mono text-[10px] py-1.5 text-red-400 border border-red-500/25 hover:bg-red-500/8 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1">
                    {working[req.id] ? "..." : <><X size={10} /> REJECT</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pulse Moderation panel ────────────────────────────────────────────────────

function PulseModerationPanel() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState({});
  const [filter,  setFilter]  = useState("pending");
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "pulse_posts"), orderBy("createdAt", "desc")))
      .then(snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (post) => {
    setWorking(p => ({ ...p, [post.id]: true }));
    try {
      await updateDoc(doc(db, "pulse_posts", post.id), { status: "approved", reviewedAt: serverTimestamp() });
      updateDoc(doc(db, "users", post.uid), { pulsePostsCount: increment(1) }).catch(() => {});
      logAdminActivity("approved pulse", `@${post.handle}'s post "${(post.caption || "").slice(0, 40)}"`);
      writeNotification(post.uid, {
        type: "approval",
        title: "Your Pulse post was approved",
        body: post.caption?.slice(0, 60) || "Your post is now live on Pulse.",
        ctaHref: "/pulse",
        ctaLabel: "view pulse",
      });
      load();
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [post.id]: false })); }
  };

  const handleReject = async (post) => {
    const reason = prompt("Rejection reason (shown to user - optional):");
    if (reason === null) return;
    setWorking(p => ({ ...p, [post.id]: true }));
    try {
      const wasApproved = post.status === "approved";
      await updateDoc(doc(db, "pulse_posts", post.id), { status: "rejected", rejectionNote: reason || "", reviewedAt: serverTimestamp() });
      if (wasApproved) {
        // Revoking a previously-approved post - roll back its counted stats.
        updateDoc(doc(db, "users", post.uid), {
          pulsePostsCount:       increment(-1),
          totalLikesReceived:    increment(-(post.likeCount || 0)),
          totalCommentsReceived: increment(-(post.commentCount || 0)),
          totalSavesReceived:    increment(-(post.saveCount || 0)),
        }).catch(() => {});
      }
      logAdminActivity(wasApproved ? "revoked pulse" : "rejected pulse", `@${post.handle}'s post${reason ? ` (${reason})` : ""}`);
      writeNotification(post.uid, {
        type: "rejection",
        title: "Your Pulse post was rejected",
        body: reason ? `Reason: ${reason}` : "Your post didn't meet community guidelines.",
        ctaHref: "/pulse",
        ctaLabel: "view pulse",
      });
      load();
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [post.id]: false })); }
  };

  const handleDelete = async (post) => {
    if (!confirm("Permanently delete this post?")) return;
    await deleteDoc(doc(db, "pulse_posts", post.id));
    if (post.status === "approved") {
      updateDoc(doc(db, "users", post.uid), {
        pulsePostsCount:       increment(-1),
        totalLikesReceived:    increment(-(post.likeCount || 0)),
        totalCommentsReceived: increment(-(post.commentCount || 0)),
        totalSavesReceived:    increment(-(post.saveCount || 0)),
      }).catch(() => {});
    }
    logAdminActivity("deleted pulse", `@${post.handle}'s post`);
    load();
  };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const handleBulkApprove = async () => {
    const targets = posts.filter(p => selected.has(p.id) && (!p.status || p.status === "pending"));
    if (targets.length === 0) return;
    setBulkBusy(true);
    try {
      const batch = writeBatch(db);
      targets.forEach(post => {
        batch.update(doc(db, "pulse_posts", post.id), { status: "approved", reviewedAt: serverTimestamp() });
        batch.update(doc(db, "users", post.uid), { pulsePostsCount: increment(1) });
      });
      await batch.commit();
      targets.forEach(post => writeNotification(post.uid, {
        type: "approval", title: "Your Pulse post was approved",
        body: post.caption?.slice(0, 60) || "Your post is now live on Pulse.",
        ctaHref: "/pulse", ctaLabel: "view pulse",
      }));
      logAdminActivity("bulk approved", `${targets.length} pulses`);
      setSelected(new Set());
      load();
    } catch (e) { console.error(e); }
    finally { setBulkBusy(false); }
  };

  const handleBulkReject = async () => {
    const targets = posts.filter(p => selected.has(p.id) && (!p.status || p.status === "pending"));
    if (targets.length === 0) return;
    if (!confirm(`Reject ${targets.length} selected posts?`)) return;
    setBulkBusy(true);
    try {
      const batch = writeBatch(db);
      targets.forEach(post => {
        batch.update(doc(db, "pulse_posts", post.id), { status: "rejected", reviewedAt: serverTimestamp() });
      });
      await batch.commit();
      targets.forEach(post => writeNotification(post.uid, {
        type: "rejection", title: "Your Pulse post was rejected",
        body: "Your post didn't meet community guidelines.",
        ctaHref: "/pulse", ctaLabel: "view pulse",
      }));
      logAdminActivity("bulk rejected", `${targets.length} pulses`);
      setSelected(new Set());
      load();
    } catch (e) { console.error(e); }
    finally { setBulkBusy(false); }
  };

  const filtered = posts.filter(p => {
    if (filter === "all")     return true;
    if (filter === "pending") return !p.status || p.status === "pending";
    return p.status === filter;
  });

  const pendingCount = posts.filter(p => !p.status || p.status === "pending").length;

  const statusColor = (s) => {
    if (!s || s === "pending")  return { color: "#FF9500", bg: "rgba(255,149,0,0.08)",   border: "rgba(255,149,0,0.25)"  };
    if (s === "approved")       return { color: "#00FF41", bg: "rgba(0,255,65,0.08)",    border: "rgba(0,255,65,0.25)"   };
    return                             { color: "#FF5050", bg: "rgba(255,59,59,0.08)",   border: "rgba(255,59,59,0.25)"  };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["pending", "approved", "rejected", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
            style={{
              color:      filter === s ? "#00FF41" : "rgba(255,255,255,0.3)",
              background: filter === s ? "rgba(0,255,65,0.08)" : "rgba(255,255,255,0.03)",
              border:     filter === s ? "1px solid rgba(0,255,65,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >{s}</button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-neon-green/50 self-center">{pendingCount} pending review</span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }}>
          <span className="font-mono text-[10px] text-neon-green/70">{selected.size} selected</span>
          <button onClick={handleBulkApprove} disabled={bulkBusy}
            className="ml-auto font-mono text-[10px] px-3 py-1 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50 inline-flex items-center gap-1">
            {bulkBusy ? "..." : <><Check size={10} /> approve selected</>}
          </button>
          <button onClick={handleBulkReject} disabled={bulkBusy}
            className="font-mono text-[10px] px-3 py-1 text-red-400 border border-red-500/30 hover:bg-red-500/8 transition-colors disabled:opacity-50 inline-flex items-center gap-1">
            {bulkBusy ? "..." : <><X size={10} /> reject selected</>}
          </button>
          <button onClick={() => setSelected(new Set())} className="font-mono text-[10px] text-white/30 hover:text-white/60 px-2">clear</button>
        </div>
      )}

      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-3 max-h-[700px] overflow-y-auto">
          {filtered.length === 0 && <p className="font-mono text-xs text-white/20">Nothing here.</p>}
          {filtered.map(post => {
            const sc = statusColor(post.status);
            return (
              <div key={post.id} className="border border-white/6 rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(!post.status || post.status === "pending") && (
                    <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)}
                      className="w-3.5 h-3.5 accent-green-500 flex-shrink-0" />
                  )}
                  {post.photoURL
                    ? <img src={post.photoURL} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] flex-shrink-0"
                        style={{ background: "rgba(0,255,65,0.1)", color: "#00FF41" }}>
                        {(post.handle || "?")[0].toUpperCase()}
                      </div>
                  }
                  <span className="font-mono text-xs text-white/75">@{post.handle}</span>
                  {post.category && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/40">{post.category}</span>
                  )}
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                    style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    {(post.status || "PENDING").toUpperCase()}
                  </span>
                  <span className="font-mono text-[9px] text-white/22 ml-auto">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString("en-IN") : ""}
                  </span>
                </div>

                {/* Caption */}
                <p className="font-sans text-sm text-white/75 leading-relaxed">{post.caption}</p>

                {/* Image preview */}
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="rounded-lg max-h-48 object-cover w-full" />
                )}

                {/* Code preview */}
                {post.code && (
                  <pre className="font-mono text-[10px] text-neon-green/65 p-3 rounded-lg overflow-x-auto max-h-28 leading-relaxed"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,65,0.1)" }}>
                    {post.code.slice(0, 300)}{post.code.length > 300 ? "…" : ""}
                  </pre>
                )}

                {/* Link */}
                {post.linkUrl && (
                  <p className="font-mono text-[10px] text-neon-cyan/60 truncate">{post.linkUrl}</p>
                )}

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                  </div>
                )}

                {/* Rejection note */}
                {post.rejectionNote && (
                  <p className="font-mono text-[10px] text-red-400/70 border border-red-500/15 rounded px-2 py-1 flex items-center gap-1">
                    <X size={10} className="flex-shrink-0" /> Rejected: {post.rejectionNote}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {(!post.status || post.status === "pending") && (
                    <>
                      <button disabled={working[post.id]} onClick={() => handleApprove(post)}
                        className="flex-1 font-mono text-[11px] py-1.5 text-neon-green border border-neon-green/25 hover:bg-neon-green/8 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-1">
                        {working[post.id] ? "..." : <><Check size={11} /> APPROVE</>}
                      </button>
                      <button disabled={working[post.id]} onClick={() => handleReject(post)}
                        className="flex-1 font-mono text-[11px] py-1.5 text-red-400 border border-red-500/25 hover:bg-red-500/8 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-1">
                        {working[post.id] ? "..." : <><X size={11} /> REJECT</>}
                      </button>
                    </>
                  )}
                  {post.status === "approved" && (
                    <button disabled={working[post.id]} onClick={() => handleReject(post)}
                      className="font-mono text-[11px] py-1.5 px-4 text-red-400/60 border border-red-500/15 hover:bg-red-500/5 transition-colors disabled:opacity-40">
                      revoke
                    </button>
                  )}
                  <button onClick={() => handleDelete(post)}
                    className="font-mono text-[11px] py-1.5 px-3 text-white/20 hover:text-red-400 border border-white/6 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, postsSnap, missionsSnap, broadcastsSnap, payoutsSnap] = await Promise.allSettled([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "pulse_posts")),
        getDocs(query(collection(db, "missions"), where("status", "==", "OPEN"))),
        getDocs(collection(db, "broadcasts")),
        getDocs(query(collection(db, "payout_requests"), where("status", "==", "pending"))),
      ]);
      const users = usersSnap.status === "fulfilled" ? usersSnap.value.docs.map(d => d.data()) : [];
      const totalXP = users.reduce((sum, u) => sum + (u.xp || 0), 0);
      const topBuilders = [...users].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5);
      setStats({
        totalUsers:     users.length,
        totalXP,
        topBuilders,
        pulsePosts:     postsSnap.status === "fulfilled"      ? postsSnap.value.size      : 0,
        openMissions:   missionsSnap.status === "fulfilled"   ? missionsSnap.value.size   : 0,
        broadcasts:     broadcastsSnap.status === "fulfilled" ? broadcastsSnap.value.size : 0,
        pendingPayouts: payoutsSnap.status === "fulfilled"    ? payoutsSnap.value.size    : 0,
      });
      setLoading(false);
    };
    load().catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading stats...</p>;
  if (!stats)  return <p className="font-mono text-xs text-white/25">failed to load stats.</p>;

  const cards = [
    { label: "TOTAL USERS",     val: stats.totalUsers,                 color: "#C77DFF" },
    { label: "TOTAL XP",        val: stats.totalXP.toLocaleString(),   color: "#00FFFF" },
    { label: "PULSE POSTS",     val: stats.pulsePosts,                 color: "#00FF41" },
    { label: "OPEN MISSIONS",   val: stats.openMissions,               color: "#FF9500" },
    { label: "BROADCASTS",      val: stats.broadcasts,                 color: "#FF6430" },
    { label: "PENDING PAYOUTS", val: stats.pendingPayouts,             color: stats.pendingPayouts > 0 ? "#FF3B3B" : "#00FF41" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.label} className="border border-white/6 rounded-lg p-4">
            <p className="font-mono text-[9px] text-white/25 tracking-wider mb-2">{c.label}</p>
            <p className="font-mono text-2xl font-bold leading-none" style={{ color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="font-mono text-[10px] text-white/25 mb-3 tracking-wider">// top builders by xp</p>
        <div className="space-y-2">
          {stats.topBuilders.map((u, i) => (
            <div key={u.uid || i} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-mono text-[10px] text-white/25 w-4 flex-shrink-0">{i + 1}</span>
              <span className="font-mono text-xs text-white/75 flex-1 truncate">@{u.handle}</span>
              <span className="font-mono text-xs" style={{ color: "#00FFFF" }}>{(u.xp || 0).toLocaleString()} XP</span>
              <span className="font-mono text-[9px]" style={{ color: u.tier?.color || "#666" }}>{u.tier?.name || "RECRUIT"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Activity log panel ────────────────────────────────────────────────────────

function ActivityLogPanel() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "admin_activity_log"), orderBy("createdAt", "desc"), limit(50)),
      snap => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const timeLabel = (ts) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {logs.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no admin activity logged yet</p>}
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-3 border border-white/6 rounded-lg px-4 py-2.5">
          <span className="font-mono text-[9px] text-white/25 flex-shrink-0 mt-0.5 w-28">{timeLabel(log.createdAt)}</span>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded mr-2" style={{ color: "#00FF41", background: "rgba(0,255,65,0.06)" }}>{log.action}</span>
            <span className="font-mono text-xs text-white/60">{log.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Learning panel (Course -> Module -> Task + Quiz) ──────────────────────────

const blankQuizQuestion = () => ({ id: `q${Date.now()}${Math.random().toString(36).slice(2, 6)}`, text: "", options: ["", "", "", ""], correctIndex: 0 });
const blankTaskForm = () => ({ title: "", lessonBody: "", xpReward: "50", coinReward: "10", quiz: [blankQuizQuestion()] });

function LearningPanel() {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [modules,  setModules]  = useState({});
  const [expandedModule, setExpandedModule] = useState(null);
  const [tasks,    setTasks]    = useState({});

  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", color: "#00FFFF" });
  const [savingCourse, setSavingCourse] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [savingModule, setSavingModule] = useState(false);
  const [taskForm, setTaskForm] = useState(blankTaskForm());
  const [savingTask, setSavingTask] = useState(false);

  const loadCourses = () => {
    setLoading(true);
    getDocs(collection(db, "courses"))
      .then(snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadCourses(); }, []);

  const loadModules = (courseId) => {
    getDocs(query(collection(db, "courses", courseId, "modules"), orderBy("order", "asc")))
      .then(snap => setModules(p => ({ ...p, [courseId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) })))
      .catch(console.error);
  };

  const loadTasks = (courseId, moduleId) => {
    getDocs(query(collection(db, "courses", courseId, "modules", moduleId, "tasks"), orderBy("order", "asc")))
      .then(snap => setTasks(p => ({ ...p, [moduleId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) })))
      .catch(console.error);
  };

  const toggleCourse = (courseId) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return; }
    setExpandedCourse(courseId);
    setExpandedModule(null);
    if (!modules[courseId]) loadModules(courseId);
  };

  const toggleModule = (courseId, moduleId) => {
    if (expandedModule === moduleId) { setExpandedModule(null); return; }
    setExpandedModule(moduleId);
    if (!tasks[moduleId]) loadTasks(courseId, moduleId);
  };

  const handleAddCourse = async () => {
    if (!courseForm.title.trim()) return;
    setSavingCourse(true);
    try {
      await addDoc(collection(db, "courses"), {
        title: courseForm.title.trim(),
        description: courseForm.description.trim(),
        category: courseForm.category.trim(),
        color: courseForm.color,
        status: "published",
        order: courses.length,
        createdAt: serverTimestamp(),
      });
      setCourseForm({ title: "", description: "", category: "", color: "#00FFFF" });
      logAdminActivity("created course", courseForm.title.trim());
      loadCourses();
    } catch (e) { console.error(e); }
    finally { setSavingCourse(false); }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Delete this course and all its modules/tasks? This can't be undone.")) return;
    try {
      const modSnap = await getDocs(collection(db, "courses", courseId, "modules"));
      for (const m of modSnap.docs) {
        const taskSnap = await getDocs(collection(db, "courses", courseId, "modules", m.id, "tasks"));
        await Promise.all(taskSnap.docs.map(t => deleteDoc(t.ref)));
        await deleteDoc(m.ref);
      }
      await deleteDoc(doc(db, "courses", courseId));
      loadCourses();
    } catch (e) { console.error(e); }
  };

  const handleAddModule = async (courseId) => {
    if (!moduleForm.title.trim()) return;
    setSavingModule(true);
    try {
      const count = (modules[courseId] || []).length;
      await addDoc(collection(db, "courses", courseId, "modules"), {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
        order: count,
        status: "published",
        createdAt: serverTimestamp(),
      });
      setModuleForm({ title: "", description: "" });
      loadModules(courseId);
    } catch (e) { console.error(e); }
    finally { setSavingModule(false); }
  };

  const handleDeleteModule = async (courseId, moduleId) => {
    if (!confirm("Delete this module and all its tasks?")) return;
    try {
      const taskSnap = await getDocs(collection(db, "courses", courseId, "modules", moduleId, "tasks"));
      await Promise.all(taskSnap.docs.map(t => deleteDoc(t.ref)));
      await deleteDoc(doc(db, "courses", courseId, "modules", moduleId));
      loadModules(courseId);
    } catch (e) { console.error(e); }
  };

  const handleAddTask = async (courseId, moduleId) => {
    if (!taskForm.title.trim() || !taskForm.lessonBody.trim()) return;
    const cleanQuiz = taskForm.quiz.filter(q => q.text.trim() && q.options.every(o => o.trim()));
    setSavingTask(true);
    try {
      const count = (tasks[moduleId] || []).length;
      await addDoc(collection(db, "courses", courseId, "modules", moduleId, "tasks"), {
        title: taskForm.title.trim(),
        lessonBody: taskForm.lessonBody.trim(),
        xpReward: parseInt(taskForm.xpReward) || 0,
        coinReward: parseInt(taskForm.coinReward) || 0,
        quiz: cleanQuiz,
        order: count,
        status: "published",
        createdAt: serverTimestamp(),
      });
      setTaskForm(blankTaskForm());
      logAdminActivity("added task", `"${taskForm.title.trim()}"`);
      loadTasks(courseId, moduleId);
    } catch (e) { console.error(e); }
    finally { setSavingTask(false); }
  };

  const handleDeleteTask = async (courseId, moduleId, taskId) => {
    if (!confirm("Delete this task?")) return;
    await deleteDoc(doc(db, "courses", courseId, "modules", moduleId, "tasks", taskId));
    loadTasks(courseId, moduleId);
  };

  const updateQuestion = (i, patch) => setTaskForm(p => ({ ...p, quiz: p.quiz.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));
  const updateOption = (qi, oi, val) => setTaskForm(p => ({ ...p, quiz: p.quiz.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? val : o) } : q) }));
  const addQuestion = () => setTaskForm(p => ({ ...p, quiz: [...p.quiz, blankQuizQuestion()] }));
  const removeQuestion = (i) => setTaskForm(p => ({ ...p, quiz: p.quiz.filter((_, idx) => idx !== i) }));

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] text-white/18">
        Course -&gt; Module -&gt; Task(+Quiz). Tasks unlock sequentially for learners - Task 2 stays locked until Task 1's quiz is passed.
      </p>

      {courses.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no courses yet</p>}

      {courses.map(course => (
        <div key={course.id} className="border border-white/8 rounded-lg overflow-hidden">
          <button onClick={() => toggleCourse(course.id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/2 transition-colors text-left">
            <GraduationCap size={13} style={{ color: course.color || "#00FF41" }} />
            <span className="font-sans text-sm text-white/80 flex-1">{course.title}</span>
            {course.category && <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{course.category}</span>}
            <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
            {expandedCourse === course.id ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
          </button>

          {expandedCourse === course.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
              {(modules[course.id] || []).map(mod => (
                <div key={mod.id} className="border border-white/6 rounded-lg overflow-hidden ml-2">
                  <button onClick={() => toggleModule(course.id, mod.id)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/2 transition-colors text-left">
                    <ListChecks size={12} className="text-neon-cyan/60" />
                    <span className="font-mono text-xs text-white/70 flex-1">{mod.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(course.id, mod.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                    {expandedModule === mod.id ? <ChevronUp size={11} className="text-white/30" /> : <ChevronDown size={11} className="text-white/30" />}
                  </button>

                  {expandedModule === mod.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                      {(tasks[mod.id] || []).map((t, i) => (
                        <div key={t.id} className="flex items-center gap-2 border border-white/6 rounded px-3 py-2">
                          <span className="font-mono text-[9px] text-white/25 w-5">{i + 1}</span>
                          <span className="font-mono text-xs text-white/60 flex-1">{t.title}</span>
                          <span className="font-mono text-[9px] text-neon-green/50">{t.quiz?.length || 0}q</span>
                          <span className="font-mono text-[9px] text-white/25">+{t.xpReward}xp</span>
                          <button onClick={() => handleDeleteTask(course.id, mod.id, t.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ))}

                      <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2 mt-2">
                        <p className="font-mono text-[9px] text-neon-green tracking-wider">+ new task</p>
                        <Input label="TASK TITLE" value={taskForm.title} onChange={v => setTaskForm(p => ({ ...p, title: v }))} placeholder="Day 1: Arrays Basics" />
                        <Textarea label="LESSON CONTENT" value={taskForm.lessonBody} onChange={v => setTaskForm(p => ({ ...p, lessonBody: v }))} rows={4} placeholder="Explain the lesson..." />
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="XP REWARD" type="number" value={taskForm.xpReward} onChange={v => setTaskForm(p => ({ ...p, xpReward: v }))} />
                          <Input label="COIN REWARD" type="number" value={taskForm.coinReward} onChange={v => setTaskForm(p => ({ ...p, coinReward: v }))} />
                        </div>

                        <div className="space-y-2">
                          <p className="font-mono text-[9px] text-white/30 tracking-wider">QUIZ QUESTIONS (green dot = correct answer)</p>
                          {taskForm.quiz.map((q, qi) => (
                            <div key={q.id} className="border border-white/8 rounded p-2.5 space-y-1.5 relative">
                              <button onClick={() => removeQuestion(qi)} className="absolute top-2 right-2 text-white/20 hover:text-red-400"><X size={11} /></button>
                              <Input label={`QUESTION ${qi + 1}`} value={q.text} onChange={v => updateQuestion(qi, { text: v })} placeholder="What is the time complexity of...?" />
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <button onClick={() => updateQuestion(qi, { correctIndex: oi })}
                                    className="w-4 h-4 rounded-full border flex-shrink-0 transition-colors"
                                    style={{ borderColor: q.correctIndex === oi ? "#00FF41" : "rgba(255,255,255,0.2)", background: q.correctIndex === oi ? "#00FF41" : "transparent" }} />
                                  <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`}
                                    className="flex-1 font-mono text-[11px] text-white/70 px-2 py-1 rounded outline-none"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                                </div>
                              ))}
                            </div>
                          ))}
                          <button onClick={addQuestion} className="w-full font-mono text-[10px] text-white/30 border border-dashed border-white/10 py-1.5 hover:text-white/50 transition-colors">+ add question</button>
                        </div>

                        <button onClick={() => handleAddTask(course.id, mod.id)} disabled={savingTask}
                          className="w-full font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                          {savingTask ? "saving..." : "add task"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2 ml-2">
                <p className="font-mono text-[9px] text-neon-cyan tracking-wider">+ new module</p>
                <Input label="MODULE TITLE" value={moduleForm.title} onChange={v => setModuleForm(p => ({ ...p, title: v }))} placeholder="Arrays & Strings" />
                <Textarea label="DESCRIPTION" value={moduleForm.description} onChange={v => setModuleForm(p => ({ ...p, description: v }))} rows={2} />
                <button onClick={() => handleAddModule(course.id)} disabled={savingModule}
                  className="w-full font-mono text-xs py-2 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors disabled:opacity-50">
                  {savingModule ? "saving..." : "add module"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// add course</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="COURSE TITLE" value={courseForm.title} onChange={v => setCourseForm(p => ({ ...p, title: v }))} placeholder="DSA Fundamentals" />
          <Input label="CATEGORY" value={courseForm.category} onChange={v => setCourseForm(p => ({ ...p, category: v }))} placeholder="DSA" />
        </div>
        <Textarea label="DESCRIPTION" value={courseForm.description} onChange={v => setCourseForm(p => ({ ...p, description: v }))} rows={2} placeholder="What will learners get out of this course?" />
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddCourse} disabled={savingCourse}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
          <Plus size={12} className="inline mr-1" /> {savingCourse ? "adding..." : "add course"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Aptitude & Reasoning panel ────────────────────────────────────────────────

const APTITUDE_CATEGORIES = ["Quantitative", "Logical", "Verbal"];
const CSV_HELP = `Columns (first row = header, exact names): question,option1,option2,option3,option4,correctOption,explanation,videoUrl,difficulty
- correctOption is 1-4 (which option is right)
- videoUrl and difficulty (easy/medium/hard) are optional - difficulty defaults to "medium" if blank
- Wrap any field containing a comma in double quotes (only needed for actual .csv files - pasting straight from Excel/Sheets works as-is)`;

const CSV_TEMPLATE_HEADER = "question,option1,option2,option3,option4,correctOption,explanation,videoUrl,difficulty";
const CSV_TEMPLATE_EXAMPLE_ROWS = [
  ['What is 20% of 150?', '20', '30', '35', '40', '2', '20% = 1/5, so 150 / 5 = 30.', '', 'easy'],
  ['A number increased by 25% gives 100. What is the original number?', '70', '75', '80', '85', '3', 'Let the number be N. N + 25% of N = 100, so 1.25N = 100, N = 80.', 'https://youtu.be/example', 'medium'],
];
const CSV_TEMPLATE = [CSV_TEMPLATE_HEADER, ...CSV_TEMPLATE_EXAMPLE_ROWS.map(r =>
  r.map(f => (f.includes(",") || f.includes('"') ? `"${f.replace(/"/g, '""')}"` : f)).join(",")
)].join("\n");

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aptitude-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function blankTopicForm() { return { category: "Quantitative", name: "", description: "" }; }
function blankQuestionForm() { return { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", videoUrl: "", difficulty: "medium" }; }

// Small hand-rolled delimited-text parser - handles quoted fields with
// embedded commas/tabs and escaped ("") quotes, which a naive .split() gets
// wrong. Auto-detects comma vs tab so pasting directly out of Excel/Google
// Sheets (which copies as tab-separated) works without an explicit "export
// as CSV" step - only a real .csv file needs actual comma-quoting.
function parseCSV(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.split("\t").length > firstLine.split(",").length) ? "\t" : ",";
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else field += c;
    } else if (c === '"') { inQuotes = true; }
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && next === '\n') i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvRowsToQuestions(rows) {
  if (rows.length < 2) return { questions: [], errors: ["No data rows found (need a header row + at least one question row)."] };
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const need = ["question", "option1", "option2", "option3", "option4", "correctoption"];
  const missing = need.filter(n => col(n) === -1);
  if (missing.length) return { questions: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };

  const questions = [];
  const errors = [];
  rows.slice(1).forEach((r, i) => {
    const lineNo = i + 2;
    const question = (r[col("question")] || "").trim();
    const options = [1, 2, 3, 4].map(n => (r[col(`option${n}`)] || "").trim());
    const correctRaw = (r[col("correctoption")] || "").trim();
    const correctIndex = parseInt(correctRaw, 10) - 1;
    if (!question || options.some(o => !o) || ![0, 1, 2, 3].includes(correctIndex)) {
      errors.push(`Row ${lineNo}: skipped - missing question/option or correctOption isn't 1-4.`);
      return;
    }
    questions.push({
      question, options, correctIndex,
      explanation: col("explanation") !== -1 ? (r[col("explanation")] || "").trim() : "",
      videoUrl:    col("videourl")    !== -1 ? (r[col("videourl")]    || "").trim() : "",
      difficulty:  (col("difficulty") !== -1 && (r[col("difficulty")] || "").trim()) || "medium",
    });
  });
  return { questions, errors };
}

function AptitudePanel() {
  const [topics,   setTopics]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [questions, setQuestions] = useState({});

  const [topicForm, setTopicForm] = useState(blankTopicForm());
  const [savingTopic, setSavingTopic] = useState(false);
  const [qForm, setQForm] = useState(blankQuestionForm());
  const [savingQ, setSavingQ] = useState(false);

  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const loadTopics = () => {
    setLoading(true);
    getDocs(query(collection(db, "aptitude_topics"), orderBy("order", "asc")))
      .then(snap => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadTopics(); }, []);

  const loadQuestions = (topicId) => {
    getDocs(query(collection(db, "aptitude_topics", topicId, "questions"), orderBy("order", "asc")))
      .then(snap => setQuestions(p => ({ ...p, [topicId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) })))
      .catch(console.error);
  };

  const toggleTopic = (topicId) => {
    if (expandedTopic === topicId) { setExpandedTopic(null); return; }
    setExpandedTopic(topicId);
    setCsvText(""); setCsvResult(null);
    if (!questions[topicId]) loadQuestions(topicId);
  };

  const handleAddTopic = async () => {
    if (!topicForm.name.trim()) return;
    setSavingTopic(true);
    try {
      await addDoc(collection(db, "aptitude_topics"), {
        category: topicForm.category,
        name: topicForm.name.trim(),
        description: topicForm.description.trim(),
        status: "published",
        order: topics.length,
        createdAt: serverTimestamp(),
      });
      setTopicForm(blankTopicForm());
      logAdminActivity("created aptitude topic", topicForm.name.trim());
      loadTopics();
    } catch (e) { console.error(e); }
    finally { setSavingTopic(false); }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!confirm("Delete this topic and all its questions? This can't be undone.")) return;
    try {
      const qSnap = await getDocs(collection(db, "aptitude_topics", topicId, "questions"));
      await Promise.all(qSnap.docs.map(q => deleteDoc(q.ref)));
      await deleteDoc(doc(db, "aptitude_topics", topicId));
      loadTopics();
    } catch (e) { console.error(e); }
  };

  const handleAddQuestion = async (topicId) => {
    if (!qForm.question.trim() || qForm.options.some(o => !o.trim())) return;
    setSavingQ(true);
    try {
      const count = (questions[topicId] || []).length;
      await addDoc(collection(db, "aptitude_topics", topicId, "questions"), {
        ...qForm, question: qForm.question.trim(), options: qForm.options.map(o => o.trim()),
        order: count, createdAt: serverTimestamp(),
      });
      setQForm(blankQuestionForm());
      loadQuestions(topicId);
    } catch (e) { console.error(e); }
    finally { setSavingQ(false); }
  };

  const handleDeleteQuestion = async (topicId, questionId) => {
    if (!confirm("Delete this question?")) return;
    await deleteDoc(doc(db, "aptitude_topics", topicId, "questions", questionId));
    loadQuestions(topicId);
  };

  const handleImportCsv = async (topicId) => {
    const { questions: parsed, errors } = csvRowsToQuestions(parseCSV(csvText));
    if (parsed.length === 0) { setCsvResult({ imported: 0, errors }); return; }
    setImporting(true);
    try {
      const startOrder = (questions[topicId] || []).length;
      // Firestore batches cap at 500 writes - chunk generously under that.
      for (let i = 0; i < parsed.length; i += 400) {
        const chunk = parsed.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((q, idx) => {
          const ref = doc(collection(db, "aptitude_topics", topicId, "questions"));
          batch.set(ref, { ...q, order: startOrder + i + idx, createdAt: serverTimestamp() });
        });
        await batch.commit();
      }
      logAdminActivity("bulk imported aptitude questions", `${parsed.length} question(s)`);
      setCsvResult({ imported: parsed.length, errors });
      setCsvText("");
      loadQuestions(topicId);
    } catch (e) { console.error(e); setCsvResult({ imported: 0, errors: [...errors, "Import failed - check console."] }); }
    finally { setImporting(false); }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] text-white/18">
        Topic -&gt; Question bank. No sequential unlock - students practice any topic, any order, unlimited attempts.
      </p>

      {topics.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no topics yet</p>}

      {APTITUDE_CATEGORIES.map(cat => {
        const catTopics = topics.filter(t => t.category === cat);
        if (catTopics.length === 0) return null;
        return (
          <div key={cat}>
            <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1.5">{cat.toUpperCase()}</p>
            <div className="space-y-2 mb-3">
              {catTopics.map(topic => (
                <div key={topic.id} className="border border-white/8 rounded-lg overflow-hidden">
                  <button onClick={() => toggleTopic(topic.id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/2 transition-colors text-left">
                    <ListChecks size={13} className="text-neon-cyan/60" />
                    <span className="font-sans text-sm text-white/80 flex-1">{topic.name}</span>
                    <span className="font-mono text-[9px] text-white/25">{(questions[topic.id] || []).length || ""}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    {expandedTopic === topic.id ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
                  </button>

                  {expandedTopic === topic.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
                      {(questions[topic.id] || []).map((q, i) => (
                        <div key={q.id} className="flex items-center gap-2 border border-white/6 rounded px-3 py-2">
                          <span className="font-mono text-[9px] text-white/25 w-5">{i + 1}</span>
                          <span className="font-mono text-xs text-white/60 flex-1 truncate">{q.question}</span>
                          <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{q.difficulty}</span>
                          {q.videoUrl && <ExternalLink size={10} className="text-neon-purple/60" />}
                          <button onClick={() => handleDeleteQuestion(topic.id, q.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ))}

                      {/* Manual add */}
                      <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
                        <p className="font-mono text-[9px] text-neon-green tracking-wider">+ add question manually</p>
                        <Textarea label="QUESTION" value={qForm.question} onChange={v => setQForm(p => ({ ...p, question: v }))} rows={2} placeholder="A shopkeeper marks up an item by 40%..." />
                        {qForm.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => setQForm(p => ({ ...p, correctIndex: oi }))}
                              className="w-4 h-4 rounded-full border flex-shrink-0 transition-colors"
                              style={{ borderColor: qForm.correctIndex === oi ? "#00FF41" : "rgba(255,255,255,0.2)", background: qForm.correctIndex === oi ? "#00FF41" : "transparent" }} />
                            <input value={opt} onChange={e => setQForm(p => ({ ...p, options: p.options.map((o, idx) => idx === oi ? e.target.value : o) }))}
                              placeholder={`Option ${oi + 1}`}
                              className="flex-1 font-mono text-[11px] text-white/70 px-2 py-1 rounded outline-none"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                          </div>
                        ))}
                        <Textarea label="EXPLANATION" value={qForm.explanation} onChange={v => setQForm(p => ({ ...p, explanation: v }))} rows={3} placeholder="Step-by-step worked solution..." />
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="VIDEO URL (optional)" value={qForm.videoUrl} onChange={v => setQForm(p => ({ ...p, videoUrl: v }))} placeholder="https://youtu.be/..." />
                          <div>
                            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
                            <select value={qForm.difficulty} onChange={e => setQForm(p => ({ ...p, difficulty: e.target.value }))}
                              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <option value="easy">easy</option>
                              <option value="medium">medium</option>
                              <option value="hard">hard</option>
                            </select>
                          </div>
                        </div>
                        <button onClick={() => handleAddQuestion(topic.id)} disabled={savingQ}
                          className="w-full font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                          {savingQ ? "saving..." : "add question"}
                        </button>
                      </div>

                      {/* Bulk CSV import */}
                      <div className="border border-dashed border-neon-purple/25 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[9px] text-neon-purple tracking-wider">+ bulk import from CSV</p>
                          <button onClick={downloadCsvTemplate}
                            className="flex items-center gap-1 font-mono text-[9px] text-white/40 hover:text-neon-purple transition-colors">
                            <Download size={10} /> download template
                          </button>
                        </div>
                        <pre className="font-mono text-[9px] text-white/25 whitespace-pre-wrap leading-relaxed">{CSV_HELP}</pre>
                        <p className="font-mono text-[9px] text-white/18">
                          Fill the template in Excel/Google Sheets, then either paste the cells directly here (Ctrl+A, Ctrl+C in the sheet, Ctrl+V below) or export as .csv and paste that text.
                        </p>
                        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={5}
                          placeholder="question,option1,option2,option3,option4,correctOption,explanation,videoUrl,difficulty"
                          className="w-full font-mono text-[11px] text-white/70 px-3 py-2 rounded outline-none"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(199,125,255,0.2)" }} />
                        {csvResult && (
                          <p className="font-mono text-[10px]" style={{ color: csvResult.imported > 0 ? "#00FF41" : "#FF5050" }}>
                            {csvResult.imported > 0 && `imported ${csvResult.imported} question(s). `}
                            {csvResult.errors.length > 0 && `${csvResult.errors.length} row(s) skipped: ${csvResult.errors.slice(0, 3).join(" ")}`}
                          </p>
                        )}
                        <button onClick={() => handleImportCsv(topic.id)} disabled={importing || !csvText.trim()}
                          className="w-full font-mono text-xs py-2 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors disabled:opacity-50">
                          {importing ? "importing..." : "import CSV"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// add topic</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">CATEGORY</p>
            <select value={topicForm.category} onChange={e => setTopicForm(p => ({ ...p, category: e.target.value }))}
              className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {APTITUDE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="TOPIC NAME" value={topicForm.name} onChange={v => setTopicForm(p => ({ ...p, name: v }))} placeholder="Percentages" />
        </div>
        <Textarea label="DESCRIPTION" value={topicForm.description} onChange={v => setTopicForm(p => ({ ...p, description: v }))} rows={2} placeholder="What this topic covers..." />
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddTopic} disabled={savingTopic}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
          <Plus size={12} className="inline mr-1" /> {savingTopic ? "adding..." : "add topic"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Hackathons panel ──────────────────────────────────────────────────────────

const HACKATHON_STATUSES = [
  { v: "upcoming", c: "#00FFFF" },
  { v: "live",     c: "#00FF41" },
  { v: "judging",  c: "#FF9500" },
  { v: "ended",    c: "rgba(255,255,255,0.3)" },
];

function HackathonsPanel() {
  const [hackathons, setHackathons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const blank = {
    slug: "", title: "", tagline: "", prize: "",
    deadline: "", maxTeamSize: "4", registrations: "0",
    tags: "", status: "upcoming",
  };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc")))
      .then(snap => setHackathons(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.slug.trim() || !form.title.trim()) return setError("Slug and title are required.");
    setSaving(true); setError("");
    try {
      const statusObj = HACKATHON_STATUSES.find(s => s.v === form.status) || HACKATHON_STATUSES[0];
      await setDoc(doc(db, "hackathons", form.slug.trim()), {
        title:         form.title.trim(),
        tagline:       form.tagline.trim(),
        prize:         form.prize.trim(),
        deadline:      form.deadline.trim(),
        maxTeamSize:   parseInt(form.maxTeamSize) || 4,
        registrations: parseInt(form.registrations) || 0,
        tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
        status:        form.status,
        statusColor:   statusObj.c,
        createdAt:     serverTimestamp(),
      });
      setForm(blank);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete hackathon "${id}"?`)) return;
    await deleteDoc(doc(db, "hackathons", id));
    load();
  };

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : (
        <div className="space-y-2">
          {hackathons.length === 0 && <p className="font-mono text-xs text-white/20">No hackathons yet.</p>}
          {hackathons.map(h => {
            const sc = HACKATHON_STATUSES.find(s => s.v === h.status) || HACKATHON_STATUSES[0];
            return (
              <div key={h.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-3">
                <span className="font-mono text-[10px] text-white/35 flex-shrink-0">{h.id}</span>
                <span className="font-mono text-xs text-white/75 flex-1 truncate">{h.title}</span>
                <span className="font-mono text-[10px] flex-shrink-0" style={{ color: sc.c }}>{h.status.toUpperCase()}</span>
                <span className="font-mono text-[10px] text-neon-cyan flex-shrink-0">{h.prize}</span>
                <button onClick={() => handleDelete(h.id)} className="text-white/20 hover:text-red-400 transition-colors ml-1 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// create hackathon</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="SLUG (doc ID)" value={form.slug} onChange={f("slug")} placeholder="devcon-2026" />
          <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="DevCon Hackathon 2026" />
        </div>
        <Input label="TAGLINE" value={form.tagline} onChange={f("tagline")} placeholder="Build the future in 48 hours" />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="PRIZE" value={form.prize} onChange={f("prize")} placeholder="₹1,00,000" />
          <Input label="DEADLINE" value={form.deadline} onChange={f("deadline")} placeholder="Aug 31, 2026" />
          <Input label="MAX TEAM SIZE" value={form.maxTeamSize} onChange={f("maxTeamSize")} placeholder="4" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="REGISTRATIONS" value={form.registrations} onChange={f("registrations")} placeholder="0" />
          <Input label="TAGS (comma separated)" value={form.tags} onChange={f("tags")} placeholder="Web, AI, Mobile" />
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">STATUS</p>
          <div className="flex gap-2 flex-wrap">
            {HACKATHON_STATUSES.map(s => (
              <button key={s.v} onClick={() => setForm(p => ({ ...p, status: s.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color:      form.status === s.v ? s.c : "rgba(255,255,255,0.3)",
                  background: form.status === s.v ? `${s.c}12` : "rgba(255,255,255,0.03)",
                  border:     form.status === s.v ? `1px solid ${s.c}35` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{s.v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleCreate} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "creating..." : "create hackathon"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────

const NOTIF_TYPES = [
  { v: "info",    c: "#00FFFF" },
  { v: "success", c: "#00FF41" },
  { v: "warning", c: "#FF9500" },
  { v: "system",  c: "#C77DFF" },
  { v: "promo",   c: "#FFD700" },
];

function NotificationsPanel() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const blank = { target: "all", uid: "", type: "info", title: "", body: "", ctaLabel: "", ctaHref: "" };
  const [form, setForm] = useState(blank);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")))
      .then(snap => setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return setError("Title and body are required.");
    if (form.target === "specific" && !form.uid.trim()) return setError("UID is required for a specific-user notification.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "notifications"), {
        targetUid: form.target === "all" ? "all" : form.uid.trim(),
        type:      form.type,
        title:     form.title.trim(),
        body:      form.body.trim(),
        ctaLabel:  form.ctaLabel.trim() || null,
        ctaHref:   form.ctaHref.trim()  || null,
        createdAt: serverTimestamp(),
      });
      setForm(blank);
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const typeObj = NOTIF_TYPES.find(t => t.v === form.type) || NOTIF_TYPES[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[10px] text-white/25 mb-2 tracking-wider">// sent notifications</p>
        {loading ? (
          <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifs.length === 0 && <p className="font-mono text-xs text-white/20">No notifications sent yet.</p>}
            {notifs.map(n => {
              const tc = NOTIF_TYPES.find(t => t.v === n.type)?.c || "#00FFFF";
              return (
                <div key={n.id} className="flex items-start gap-3 border border-white/6 rounded-lg px-4 py-2.5">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0"
                    style={{ color: tc, background: `${tc}12`, border: `1px solid ${tc}30` }}>
                    {n.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white/70 truncate">{n.title}</p>
                    <p className="font-mono text-[10px] text-white/30 truncate mt-0.5">{n.body}</p>
                  </div>
                  <span className="font-mono text-[9px] text-white/20 flex-shrink-0">
                    {n.targetUid === "all" ? "ALL" : `uid:${n.targetUid?.slice(0, 8)}…`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border border-white/6 rounded-lg p-4 space-y-4">
        <p className="font-mono text-[10px] text-neon-cyan tracking-wider">// send notification</p>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TARGET</p>
          <div className="flex gap-2">
            {[{ v: "all", label: "ALL USERS" }, { v: "specific", label: "SPECIFIC USER" }].map(o => (
              <button key={o.v} onClick={() => setForm(p => ({ ...p, target: o.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color:      form.target === o.v ? "#00FFFF" : "rgba(255,255,255,0.3)",
                  background: form.target === o.v ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border:     form.target === o.v ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>
        {form.target === "specific" && (
          <Input label="USER UID" value={form.uid} onChange={f("uid")} placeholder="Firestore user UID..." />
        )}
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
          <div className="flex gap-1.5 flex-wrap">
            {NOTIF_TYPES.map(t => (
              <button key={t.v} onClick={() => setForm(p => ({ ...p, type: t.v }))}
                className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
                style={{
                  color:      form.type === t.v ? t.c : "rgba(255,255,255,0.3)",
                  background: form.type === t.v ? `${t.c}10` : "rgba(255,255,255,0.03)",
                  border:     form.type === t.v ? `1px solid ${t.c}40` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{t.v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="Platform maintenance at 2AM IST" maxLength={100} />
        <Textarea label="BODY" value={form.body} onChange={f("body")} placeholder="We'll be down for ~15 minutes..." rows={3} maxLength={300} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="CTA LABEL (optional)" value={form.ctaLabel} onChange={f("ctaLabel")} placeholder="Learn more" />
          <Input label="CTA HREF (optional)" value={form.ctaHref} onChange={f("ctaHref")} placeholder="https://..." />
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleSend} disabled={saving}
          className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          style={sent
            ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
            : { color: typeObj.c, borderColor: `${typeObj.c}40`, background: `${typeObj.c}08` }
          }
        >
          <Bell size={11} /> {sent ? "sent!" : saving ? "sending..." : "send notification"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Shipyard moderation panel ─────────────────────────────────────────────────

const SHIP_REACTIONS = [
  { v: "Shipped",     c: "#00FFFF" },
  { v: "Fire",        c: "#FF6430" },
  { v: "Needs Work",  c: "#FF5050" },
];

function ShipyardPanel() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [working,  setWorking]  = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")))
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.ownerHandle?.toLowerCase().includes(search.toLowerCase())
  );

  const handleReaction = async (p, reaction) => {
    setWorking(w => ({ ...w, [p.id]: true }));
    try {
      await updateDoc(doc(db, "projects", p.id), { reaction });
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, reaction } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [p.id]: false })); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    await deleteDoc(doc(db, "projects", p.id));
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input label="SEARCH" value={search} onChange={setSearch} placeholder="project name or owner handle..." />
        </div>
        <span className="font-mono text-[10px] text-white/25 mt-5 flex-shrink-0">{projects.length} projects</span>
      </div>
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no projects found</p>}
          {filtered.map(p => (
            <div key={p.id} className="border border-white/6 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-white/80 truncate">{p.name}</p>
                  <p className="font-mono text-[10px] text-neon-green/60">@{p.ownerHandle}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-white/20 hover:text-neon-cyan transition-colors">
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(p)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="font-mono text-[10px] text-white/30 leading-relaxed">{p.description}</p>
              <div className="flex gap-1.5">
                {SHIP_REACTIONS.map(r => (
                  <button key={r.v} disabled={working[p.id]} onClick={() => handleReaction(p, r.v)}
                    className="font-mono text-[9px] px-2 py-1 rounded transition-colors disabled:opacity-50"
                    style={{
                      color:      p.reaction === r.v ? r.c : "rgba(255,255,255,0.3)",
                      background: p.reaction === r.v ? `${r.c}12` : "rgba(255,255,255,0.03)",
                      border:     p.reaction === r.v ? `1px solid ${r.c}35` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >{r.v}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hackathon judging panel ───────────────────────────────────────────────────

function HackathonJudgingPanel() {
  const [hackathons,  setHackathons]  = useState([]);
  const [slug,        setSlug]        = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [drafts,      setDrafts]      = useState({});
  const [working,     setWorking]     = useState({});

  useEffect(() => {
    getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc")))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHackathons(list);
        if (list.length && !slug) setSlug(list[0].id);
      })
      .catch(console.error);
  }, []);

  const loadSubmissions = (s) => {
    if (!s) return;
    setLoading(true);
    getDocs(query(collection(db, "hackathon_submissions"), where("hackathonSlug", "==", s)))
      .then(snap => {
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        setSubmissions(subs);
        setDrafts(Object.fromEntries(subs.map(sub => [sub.id, { score: sub.score ?? "", rank: sub.rank ?? "", winner: !!sub.winner }])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubmissions(slug); }, [slug]);

  const setDraft = (id, k, v) => setDrafts(p => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const handleSave = async (sub) => {
    const d = drafts[sub.id];
    setWorking(w => ({ ...w, [sub.id]: true }));
    try {
      await updateDoc(doc(db, "hackathon_submissions", sub.id), {
        score:  d.score === "" ? null : parseInt(d.score),
        rank:   d.rank  === "" ? null : parseInt(d.rank),
        winner: !!d.winner,
      });
      loadSubmissions(slug);
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [sub.id]: false })); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">HACKATHON</p>
        <div className="flex gap-2 flex-wrap">
          {hackathons.length === 0 && <p className="font-mono text-xs text-white/20">No hackathons yet.</p>}
          {hackathons.map(h => (
            <button key={h.id} onClick={() => setSlug(h.id)}
              className="font-mono text-[10px] px-2.5 py-1.5 rounded transition-colors"
              style={{
                color:      slug === h.id ? "#00FFFF" : "rgba(255,255,255,0.3)",
                background: slug === h.id ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border:     slug === h.id ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >{h.title}</button>
          ))}
        </div>
      </div>

      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading submissions...</p> : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {slug && submissions.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no submissions yet</p>}
          {submissions.map(sub => {
            const d = drafts[sub.id] || {};
            return (
              <div key={sub.id} className="border border-white/6 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-white/80 truncate">{sub.projectName}</p>
                    <p className="font-mono text-[10px] text-neon-green/60">@{sub.handle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="font-mono text-[9px] text-neon-cyan/70 hover:text-neon-cyan flex items-center gap-1">
                      <ExternalLink size={9} /> repo
                    </a>
                    {sub.demoUrl && (
                      <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="font-mono text-[9px] text-white/30 hover:text-white/60 flex items-center gap-1">
                        <ExternalLink size={9} /> demo
                      </a>
                    )}
                  </div>
                </div>
                {sub.description && <p className="font-mono text-[10px] text-white/30 leading-relaxed">{sub.description}</p>}
                {sub.stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {sub.stack.map(t => <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <input type="number" value={d.score} onChange={e => setDraft(sub.id, "score", e.target.value)}
                    placeholder="score" className="font-mono text-[10px] text-white/70 w-20 px-2 py-1 rounded outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <input type="number" value={d.rank} onChange={e => setDraft(sub.id, "rank", e.target.value)}
                    placeholder="rank" className="font-mono text-[10px] text-white/70 w-16 px-2 py-1 rounded outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button onClick={() => setDraft(sub.id, "winner", !d.winner)}
                    className="font-mono text-[9px] px-2 py-1 rounded transition-colors flex items-center gap-1"
                    style={d.winner
                      ? { color: "#FFD700", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }
                      : { color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  ><Trophy size={9} /> winner</button>
                  <button onClick={() => handleSave(sub)} disabled={working[sub.id]}
                    className="font-mono text-[9px] px-2.5 py-1 text-neon-green border border-neon-green/25 hover:bg-neon-green/8 transition-colors disabled:opacity-50 ml-auto"
                  >{working[sub.id] ? "..." : "save"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Arena matches panel ───────────────────────────────────────────────────────

function ArenaMatchesPanel() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("won");
  const [working, setWorking] = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "arena_matches"), orderBy("finishedAt", "desc"), limit(100)))
      .then(snap => setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = matches.filter(m => filter === "all" || m.status === filter);

  const handleRevoke = async (m) => {
    if (!confirm(`Revoke this win by @${m.handle} (${m.xp} XP)?`)) return;
    setWorking(w => ({ ...w, [m.id]: true }));
    try {
      await updateDoc(doc(db, "arena_matches", m.id), { status: "revoked", revokedAt: serverTimestamp() });
      if (m.uid) {
        await updateDoc(doc(db, "users", m.uid), { xp: increment(-(m.xp || 0)), arenaWins: increment(-1) });
      }
      setMatches(prev => prev.map(x => x.id === m.id ? { ...x, status: "revoked" } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [m.id]: false })); }
  };

  const STATUS_COLORS = { won: "#00FF41", forfeit: "rgba(255,255,255,0.3)", timeout: "#FF9500", revoked: "#FF5050" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["won", "forfeit", "timeout", "revoked", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
            style={{
              color:      filter === s ? "#00FFFF" : "rgba(255,255,255,0.3)",
              background: filter === s ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border:     filter === s ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >{s}</button>
        ))}
      </div>
      {loading ? <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p> : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no matches found</p>}
          {filtered.map(m => (
            <div key={m.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-2.5">
              <span className="font-mono text-xs text-white/70 flex-shrink-0">@{m.handle || "?"}</span>
              <span className="font-mono text-[10px] text-white/35 flex-1 truncate">{m.challenge}</span>
              <span className="font-mono text-[10px] flex-shrink-0" style={{ color: STATUS_COLORS[m.status] || "#666" }}>{(m.status || "").toUpperCase()}</span>
              <span className="font-mono text-[10px] text-neon-cyan flex-shrink-0">+{m.xp || 0} XP</span>
              {m.status === "won" && (
                <button onClick={() => handleRevoke(m)} disabled={working[m.id]}
                  className="font-mono text-[9px] px-2 py-1 text-red-400 border border-red-500/25 hover:bg-red-500/8 transition-colors disabled:opacity-50 flex-shrink-0"
                >{working[m.id] ? "..." : "revoke"}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ranks ladder panel ────────────────────────────────────────────────────────

function RanksPanel() {
  const [tiers,   setTiers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "ranks"))
      .then(snap => {
        const t = snap.exists() && Array.isArray(snap.data().tiers) && snap.data().tiers.length
          ? snap.data().tiers
          : DEFAULT_TIERS;
        setTiers(t.map(x => ({ ...x, perksRaw: (x.perks || []).join("\n") })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (i, k, v) => setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = tiers.map(({ perksRaw, ...t }) => ({
        ...t,
        perks: perksRaw.split("\n").map(s => s.trim()).filter(Boolean),
      }));
      await setDoc(doc(db, "system", "ranks"), { tiers: cleaned, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] text-white/18">
        Edits the /ranks ladder display (color, requirement text, perks). XP thresholds that assign a user's tier are fixed in code and not changed here.
      </p>
      <div className="space-y-3">
        {tiers.map((t, i) => (
          <div key={t.tier} className="border border-white/8 rounded-lg p-4 space-y-3">
            <p className="font-mono text-xs tracking-wider" style={{ color: t.color }}>{t.tier}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input label="COLOR (hex)" value={t.color} onChange={v => update(i, "color", v)} placeholder="#00FFFF" />
              <Input label="REQUIREMENT" value={t.req} onChange={v => update(i, "req", v)} placeholder="Win 1 Mission" />
              <Input label="XP LABEL" value={t.xp} onChange={v => update(i, "xp", v)} placeholder="2,000+" />
            </div>
            <Textarea label="PERKS (one per line)" value={t.perksRaw} onChange={v => update(i, "perksRaw", v)} rows={3} />
            <button onClick={() => update(i, "locked", !t.locked)}
              className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 w-fit"
              style={t.locked
                ? { color: "#FF9500", background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.3)" }
                : { color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            ><Shield size={10} /> {t.locked ? "locked tier" : "unlocked tier"}</button>
          </div>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={handleSave} disabled={saving}
        className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        style={saved
          ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
          : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
        }
      >
        {saved ? <><Check size={12} /> saved!</> : saving ? "saving..." : "save rank ladder"}
      </motion.button>
    </div>
  );
}

// ── Economy panel ─────────────────────────────────────────────────────────────

const ECONOMY_FIELDS = [
  { k: "PER_LIKE",      label: "COINS PER LIKE" },
  { k: "PER_COMMENT",   label: "COINS PER COMMENT" },
  { k: "PER_SAVE",      label: "COINS PER SAVE" },
  { k: "XP_PER_COIN",   label: "XP PER COIN" },
  { k: "COINS_PER_INR", label: "COINS PER ₹1" },
  { k: "MIN_PAYOUT",    label: "MIN PAYOUT (COINS)" },
];

function EconomyPanel() {
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "economy"))
      .then(snap => setForm({ ...DEFAULT_ECONOMY, ...(snap.exists() ? snap.data() : {}) }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = Object.fromEntries(ECONOMY_FIELDS.map(f => [f.k, parseInt(form[f.k]) || 0]));
      await setDoc(doc(db, "system", "economy"), { ...cleaned, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] text-white/18">
        Drives the /wallet and /pulse coin-earning rates directly. Changes apply to new activity going forward.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {ECONOMY_FIELDS.map(f => (
          <Input key={f.k} label={f.label} type="number" value={form[f.k] ?? ""} onChange={v => setForm(p => ({ ...p, [f.k]: v }))} />
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={handleSave} disabled={saving}
        className="w-full font-mono text-xs py-2.5 border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        style={saved
          ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.4)", background: "rgba(0,255,65,0.06)" }
          : { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)" }
        }
      >
        {saved ? <><Check size={12} /> saved!</> : saving ? "saving..." : "save economy config"}
      </motion.button>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { key: "moderation", label: "MODERATION",  icon: ShieldCheck, color: "#00FF41" },
  { key: "overview",   label: "OVERVIEW",    icon: BarChart3, color: "#00FFFF" },
  { key: "challenges", label: "CHALLENGES",  icon: Zap,       color: "#FF9500" },
  { key: "community",  label: "COMMUNITY",   icon: Users,     color: "#C77DFF" },
  { key: "content",    label: "CONTENT",     icon: BookOpen,  color: "#A78BFA" },
  { key: "economy",    label: "ECONOMY",     icon: Coins,     color: "#FFD700" },
  { key: "ops",        label: "OPS",         icon: GitCommit, color: "#00FF41" },
];

function AdminCommandPalette({ onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const results = ADMIN_TABS.filter(t => t.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="terminal-window w-full max-w-md" onClick={e => e.stopPropagation()}
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-2">admin_palette.sh</span>
        </div>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
          placeholder="jump to section..."
          className="w-full font-mono text-sm text-white/80 px-4 py-3 outline-none bg-transparent border-b border-white/6 placeholder:text-white/25"
        />
        <div className="p-2 max-h-72 overflow-y-auto">
          {results.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => { onNavigate(tab.key); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon size={13} style={{ color: tab.color }} /> {tab.label}
              </button>
            );
          })}
          {results.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no matches</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminPage() {
  const { user, loading, isAdmin, adminChecked, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("moderation");
  const [pendingCount, setPendingCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Live pending-moderation count, shown as a badge on the tab and a banner
  // on Overview - this is the number admins care about above everything else.
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      query(collection(db, "pulse_posts"), where("status", "==", "pending")),
      snap => setPendingCount(snap.size),
      () => {},
    );
    return unsub;
  }, [isAdmin]);

  // Cmd/Ctrl+K jumps between admin sections without touching the mouse.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Unauthorized visitors (logged out or logged in but not the admin
  // account) never see any part of this UI - not an "access denied" screen,
  // not a /login?next=/admin URL revealing the route exists. Straight to
  // /pulse, silently, exactly like the route was never there.
  useEffect(() => {
    if (loading || !adminChecked) return;
    if (!user || !isAdmin) router.replace("/pulse");
  }, [user, loading, isAdmin, adminChecked]);

  if (loading || !adminChecked || !user || !isAdmin) {
    return <main className="min-h-screen bg-background" />;
  }

  const activeColor = ADMIN_TABS.find(t => t.key === activeTab)?.color || "#00FFFF";

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /admin - control_panel.sh</p>
            <h1 className="font-sans font-bold tracking-tighter text-white leading-none" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
              ADMIN <span className="text-neon-cyan">PANEL</span>
            </h1>
            <p className="font-mono text-xs text-white/30 mt-2">{user.email}</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => setPaletteOpen(true)}
              className="font-mono text-[10px] text-white/25 hover:text-neon-cyan transition-colors flex items-center gap-1.5 border border-white/8 px-2.5 py-1.5 rounded-lg"
            >
              <Command size={11} /> ⌘K
            </button>
            <button onClick={async () => { await logout(); router.push("/"); }}
              className="font-mono text-xs text-white/25 hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={12} /> logout
            </button>
          </div>
        </motion.div>

        {pendingCount > 0 && activeTab !== "moderation" && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setActiveTab("moderation")}
            className="w-full mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs transition-colors"
            style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.3)", color: "#FF9500" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Pending Approvals ({pendingCount}) - jump to moderation →
          </motion.button>
        )}

        {/* Tab navigation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="terminal-window mb-6 overflow-hidden"
        >
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" />
            <div className="terminal-dot bg-yellow-500/70" />
            <div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">control_panel.tabs</span>
          </div>
          <div className="flex items-stretch overflow-x-auto no-scrollbar">
            {ADMIN_TABS.map((tab, i) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3.5 font-mono text-[11px] tracking-wider flex-shrink-0 transition-all"
                  style={{
                    color: isActive ? tab.color : "rgba(255,255,255,0.3)",
                    background: isActive ? `${tab.color}08` : "transparent",
                    borderRight: i < ADMIN_TABS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <Icon size={12} />
                  {tab.label}
                  {isActive && (
                    <motion.div layoutId="adminTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: tab.color }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "moderation" && (
              <Section title="PULSE MODERATION" icon={ShieldCheck} color="#00FF41" defaultOpen={true}>
                <PulseModerationPanel />
              </Section>
            )}

            {activeTab === "overview" && (
              <>
                <Section title="PLATFORM STATS" icon={BarChart3} color="#00FFFF" defaultOpen={true}>
                  <StatsPanel />
                </Section>
                <Section title="ACTIVITY LOG" icon={ClipboardList} color="#C77DFF">
                  <ActivityLogPanel />
                </Section>
              </>
            )}

            {activeTab === "challenges" && (
              <>
                <Section title="MISSIONS" icon={Target} color="#00FFFF" defaultOpen={true}>
                  <MissionsPanel />
                </Section>
                <Section title="DAILY GRIND CHALLENGES" icon={Zap} color="#00FF41">
                  <GrindPanel />
                </Section>
                <Section title="ARENA CHALLENGES" icon={Swords} color="#FF9500">
                  <ArenaPanel />
                </Section>
                <Section title="HACKATHONS" icon={Trophy} color="#FF6430">
                  <HackathonsPanel />
                </Section>
                <Section title="HACKATHON JUDGING" icon={Gavel} color="#FF6430">
                  <HackathonJudgingPanel />
                </Section>
                <Section title="ARENA MATCHES" icon={Crosshair} color="#FF9500">
                  <ArenaMatchesPanel />
                </Section>
              </>
            )}

            {activeTab === "community" && (
              <>
                <Section title="USERS" icon={Users} color="#C77DFF" defaultOpen={true}>
                  <UsersPanel />
                </Section>
                <Section title="SHIPYARD MODERATION" icon={Anchor} color="#00FFFF">
                  <ShipyardPanel />
                </Section>
                <Section title="PULSE FEED" icon={Activity} color="#00FF41">
                  <PulsePanel />
                </Section>
                <Section title="NOTIFICATIONS" icon={Megaphone} color="#C77DFF">
                  <NotificationsPanel />
                </Section>
              </>
            )}

            {activeTab === "content" && (
              <>
                <Section title="LEARNING PATHS" icon={GraduationCap} color="#00FF41" defaultOpen={true}>
                  <LearningPanel />
                </Section>
                <Section title="APTITUDE & REASONING" icon={ListChecks} color="#00FFFF">
                  <AptitudePanel />
                </Section>
                <Section title="INTEL FEED" icon={Radio} color="#C77DFF">
                  <IntelPanel />
                </Section>
                <Section title="INTEL RESOURCES" icon={BookOpen} color="#FF9500">
                  <ResourcesPanel />
                </Section>
                <Section title="BROADCAST" icon={Tv2} color="#FF6430">
                  <BroadcastPanel />
                </Section>
              </>
            )}

            {activeTab === "economy" && (
              <>
                <Section title="RANK LADDER" icon={Medal} color="#FFD700" defaultOpen={true}>
                  <RanksPanel />
                </Section>
                <Section title="WALLET ECONOMY" icon={Coins} color="#00FF41">
                  <EconomyPanel />
                </Section>
              </>
            )}

            {activeTab === "ops" && (
              <>
                <Section title="PAYOUT REQUESTS" icon={Wallet} color="#A78BFA" defaultOpen={true}>
                  <PayoutsPanel />
                </Section>
                <Section title="SYSTEM LOGS" icon={GitCommit} color="#00FF41">
                  <LogsPanel />
                </Section>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <AdminCommandPalette onClose={() => setPaletteOpen(false)} onNavigate={setActiveTab} />
        )}
      </AnimatePresence>
    </main>
  );
}
