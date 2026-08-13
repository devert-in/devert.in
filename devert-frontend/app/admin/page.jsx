"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Users, Target, Zap, Swords, Shield,
  Plus, Trash2, Check, X, ChevronDown, ChevronUp, LogOut,
  Tv2, GitCommit, Radio, Activity, BookOpen, Wallet, ShieldCheck,
  Bell, BarChart3, ExternalLink, Trophy, Megaphone, Anchor, Gavel,
  Coins, Medal, Crosshair, Command, Flag, MessageSquare, Eye, ClipboardList,
  GraduationCap, Lock as LockIcon, ListChecks, Download, Code2, EyeOff, Star, Building2,
  Briefcase, CodeXml, Pencil, Layers, BrainCircuit, Copy, Upload, Network, Inbox, Heart,
} from "lucide-react";
import {
  db, auth
} from "@/lib/firebase";
import { writeNotification } from "@/components/notification-bell";
import PortfoliosPanel from "@/components/admin/portfolios-panel";
import { LessonConceptField } from "@/components/admin/lesson-concept-field";
import Dropdown from "@/components/dropdown";
import { DEFAULT_TIERS } from "@/lib/ranks";
import { DEFAULT_ECONOMY } from "@/lib/economy";
import {
  CONTEST_CATEGORIES, CONTEST_DIFFICULTIES, QUESTION_TYPES, contestPhase,
  CONTEST_STATUSES, blankContestForm, blankContestQuestionForm, CONTEST_CSV_HELP,
  downloadContestCsvTemplate, csvRowsToContestQuestions, parseCSV,
} from "@/lib/contests";
import { CODELAB_CATEGORIES, CODELAB_DIFFICULTIES, CODELAB_LANGUAGES, COMPANY_TAG_SUGGESTIONS, fetchPublishedProblems } from "@/lib/codelab";
import {
  COMPANY_QUESTION_DIFFICULTIES, COMPANY_QUESTION_CSV_HELP,
  downloadCompanyQuestionCsvTemplate, csvRowsToCompanyQuestions,
} from "@/lib/companyPrep";
import { ACCESS_MODES, createInstitution, updateInstitution, addInstitutionAdmin, fetchInstitutionAdmins, removeInstitutionAdmin } from "@/lib/institutions";
import {
  fetchLanguages, saveLanguage, deleteLanguage, fetchTopics, saveTopic, deleteTopic,
  PROGRAMMING_DIFFICULTIES,
} from "@/lib/programming";
import {
  fetchSubjects, saveSubject, deleteSubject, fetchTopics as fetchCsCoreTopics,
  saveTopic as saveCsCoreTopic, deleteTopic as deleteCsCoreTopic, CS_CORE_DIFFICULTIES,
} from "@/lib/csCore";
import {
  fetchOpportunities, saveOpportunity, deleteOpportunity, notifyNewOpportunity,
  OPPORTUNITY_TYPES, WORK_MODES, DIFFICULTIES as OPP_DIFFICULTIES,
} from "@/lib/opportunities";
import { StringListField, McqListField } from "@/components/campus/campus-daily-learning-editor";
import { SeModulesPanel } from "@/components/admin/se-panel";
import { AmbassadorPanel } from "@/components/admin/ambassador-panel";
import { DemoRequestsPanel } from "@/components/admin/demo-requests-panel";
import {
  GatePapersPanel, GateSubjectsPanel, GatePyqPanel, GateTestsPanel,
  GateFormulaPanel, GateResourcesPanel, GateLessonImportPanel,
} from "@/components/admin/gate-panel";
import { fetchAptitudeTopics, saveAptitudeTopic } from "@/lib/aptitude";
import { EVENT_TYPES, isHackathon } from "@/lib/eventTypes";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import { LanguageLogo } from "@/components/campus/language-logo";
import { subjectIcon } from "@/components/campus/campus-cscore";
import {
  collection, query, orderBy, where, getDocs, addDoc, deleteDoc,
  doc, setDoc, getDoc, serverTimestamp, updateDoc, limit, increment, onSnapshot, writeBatch, runTransaction,
  getCountFromServer, getAggregateFromServer, sum,
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
    action, detail, actor: auth.currentUser?.email || ADMIN_EMAIL, createdAt: serverTimestamp(),
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
  problemId: "",
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

function ChallengeForm({ ch, onChange, onRemove, index, problems }) {
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
      {problems && (
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">
            LINKED CODELAB PROBLEM {!ch.problemId && <span className="text-orange-400/70">(unplayable until linked)</span>}
          </p>
          <Dropdown value={ch.problemId || ""} onChange={v => onChange(index, "problemId", v)}
            options={[{ value: "", label: "— not linked —" }, ...problems.map(p => ({ value: p.id, label: p.title }))]}
            className="w-full"
            buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
            />
        </div>
      )}
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
  const [problems,   setProblems]   = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    getDoc(doc(db, "system", "arena"))
      .then(snap => {
        if (snap.exists()) setChallenges(snap.data().challenges.map(c => ({ ...c, tags: (c.tags || []).join(", ") })));
      })
      .catch(console.error);
    // Solo challenges are only playable once linked to a real, published CodeLab
    // problem - see GradingService.gradeArenaSubmission, which grades against
    // exactly this collection.
    fetchPublishedProblems().then(setProblems).catch(console.error);
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
          <ChallengeForm key={i} ch={ch} onChange={updateCh} onRemove={removeCh} index={i} problems={problems} />
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

// DeVert Campus - platform staff provision each institution and designate its
// first admin here; day-to-day running (approving students, publishing content)
// happens inside the Campus workspace itself (components/campus/campus-app.jsx),
// gated on institutions/{id}/admins/{uid} rather than this admin console's
// isAdmin() claim - a different persona, so it deliberately isn't managed here.
function InstitutionsPanel() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slug: "", name: "", location: "", website: "", accessMode: "public" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [adminHandle, setAdminHandle] = useState({});
  const [working, setWorking] = useState({});
  const [adminFeedback, setAdminFeedback] = useState({});
  const [adminsByInst, setAdminsByInst] = useState({});
  const [removingAdmin, setRemovingAdmin] = useState(null); // `${institutionId}_${uid}` currently confirming

  // Admin docs only carry {uid, role, addedAt} (see addInstitutionAdmin) -
  // resolve each uid against users/{uid} for a human-readable handle/name,
  // same "resolve after the fact" shape as handleAddAdmin's own handle ->
  // uid lookup, just in reverse.
  const loadAdmins = async (institutionId) => {
    const rows = await fetchInstitutionAdmins(institutionId);
    const resolved = await Promise.all(rows.map(async (a) => {
      const snap = await getDoc(doc(db, "users", a.uid));
      const u = snap.exists() ? snap.data() : null;
      return { ...a, handle: u?.handle || "", displayName: u?.displayName || "" };
    }));
    setAdminsByInst(p => ({ ...p, [institutionId]: resolved }));
  };

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "institutions"), orderBy("createdAt", "desc")))
      .then(async (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setInstitutions(list);
        await Promise.all(list.map(inst => loadAdmins(inst.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // Keeps studentCount live without disturbing the rest of `load()`'s
  // behavior (admin resolution, loading state, manual refresh-after-mutation
  // call sites below) - this panel used to only ever see the count as of
  // whatever it looked like on the last full load(), going stale the moment
  // another admin session approved/imported students elsewhere.
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "institutions"), snap => {
      const countById = new Map(snap.docs.map(d => [d.id, d.data().studentCount]));
      setInstitutions(prev => prev.map(inst => countById.has(inst.id) ? { ...inst, studentCount: countById.get(inst.id) } : inst));
    }, err => console.error("[onSnapshot:InstitutionsPanel:institutions]", err));
    return unsub;
  }, []);

  const handleRemoveAdmin = async (institutionId, uid) => {
    setWorking(p => ({ ...p, [`${institutionId}_${uid}`]: true }));
    try {
      await removeInstitutionAdmin(institutionId, uid);
      setRemovingAdmin(null);
      await loadAdmins(institutionId);
    } catch (e) {
      setAdminFeedback(p => ({ ...p, [institutionId]: { type: "error", text: e.message || "Failed to remove admin." } }));
    } finally {
      setWorking(p => ({ ...p, [`${institutionId}_${uid}`]: false }));
    }
  };

  const handleCreate = async () => {
    setError("");
    const slug = form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug || !form.name.trim()) { setError("Slug and name are required."); return; }
    setCreating(true);
    try {
      await createInstitution(slug, {
        name: form.name.trim(), location: form.location.trim(), website: form.website.trim(),
        accessMode: form.accessMode,
      });
      setForm({ slug: "", name: "", location: "", website: "", accessMode: "public" });
      load();
    } catch (e) {
      setError(e.message || "Failed to create institution.");
    } finally {
      setCreating(false);
    }
  };

  const handleAddAdmin = async (institutionId) => {
    const handle = (adminHandle[institutionId] || "").trim().toLowerCase();
    if (!handle) return;
    setWorking(p => ({ ...p, [institutionId]: true }));
    setAdminFeedback(p => ({ ...p, [institutionId]: null }));
    try {
      const snap = await getDocs(query(collection(db, "users"), where("handle", "==", handle), limit(1)));
      if (snap.empty) {
        setAdminFeedback(p => ({ ...p, [institutionId]: { type: "error", text: `No DeVert account found with handle "${handle}".` } }));
        return;
      }
      const uid = snap.docs[0].id;
      await addInstitutionAdmin(institutionId, uid, "faculty");
      setAdminHandle(p => ({ ...p, [institutionId]: "" }));
      setAdminFeedback(p => ({ ...p, [institutionId]: { type: "success", text: `@${handle} added as an admin.` } }));
      await loadAdmins(institutionId);
    } catch (e) {
      setAdminFeedback(p => ({ ...p, [institutionId]: { type: "error", text: e.message || "Failed to add admin." } }));
    } finally {
      setWorking(p => ({ ...p, [institutionId]: false }));
    }
  };

  const toggleStatus = async (inst) => {
    const next = inst.status === "active" ? "suspended" : "active";
    await updateDoc(doc(db, "institutions", inst.id), { status: next });
    load();
  };

  const handleChangeAccessMode = async (inst, accessMode) => {
    setAdminFeedback(p => ({ ...p, [inst.id]: null }));
    try {
      await updateInstitution(inst.id, { accessMode });
      setAdminFeedback(p => ({ ...p, [inst.id]: { type: "success", text: `Access mode set to "${accessMode}".` } }));
      load();
    } catch (e) {
      setAdminFeedback(p => ({ ...p, [inst.id]: { type: "error", text: e.message || "Failed to update access mode." } }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="SLUG (used as /campus/<slug>)" value={form.slug} onChange={v => setForm(p => ({ ...p, slug: v }))} placeholder="mrcet" />
        <Input label="COLLEGE NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Malla Reddy College of Engineering & Technology" />
        <Input label="LOCATION" value={form.location} onChange={v => setForm(p => ({ ...p, location: v }))} placeholder="Hyderabad, Telangana" />
        <Input label="WEBSITE" value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} placeholder="https://mrcet.ac.in" />
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">ACCESS MODE</p>
          <Dropdown value={form.accessMode} onChange={v => setForm(p => ({ ...p, accessMode: v }))}
            options={ACCESS_MODES}
            className="w-full"
            buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.1]"
            />
        </div>
      </div>
      {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
      <button onClick={handleCreate} disabled={creating}
        className="font-mono text-xs px-4 py-2 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors disabled:opacity-50">
        {creating ? "creating..." : "+ create institution"}
      </button>

      <div className="border-t border-white/6 pt-4 space-y-2">
        {loading ? (
          <p className="font-mono text-xs text-white/25">loading...</p>
        ) : institutions.length === 0 ? (
          <p className="font-mono text-xs text-white/25">No institutions yet.</p>
        ) : institutions.map(inst => (
          <div key={inst.id} className="rounded-lg border border-white/6 p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-white/80">{inst.name}</span>
              <span className="font-mono text-[10px] text-white/25">/campus/{inst.id}</span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                style={{ color: inst.status === "active" ? "#00FF41" : "#FF5050", background: inst.status === "active" ? "rgba(0,255,65,0.08)" : "rgba(255,80,80,0.08)" }}>
                {inst.status?.toUpperCase()}
              </span>
              <Dropdown value={inst.accessMode || "public"} onChange={v => handleChangeAccessMode(inst, v)}
                options={ACCESS_MODES} className="w-32"
                buttonClassName="font-mono text-[10px] px-2 py-1 rounded bg-white/[0.04] border border-white/[0.1] text-white/70" />
              <span className="font-mono text-[10px] text-white/25 ml-auto">{inst.studentCount || 0} students</span>
              <button onClick={() => toggleStatus(inst)}
                className="font-mono text-[10px] px-2 py-1 rounded border border-white/10 text-white/50 hover:text-white/80 transition-colors">
                {inst.status === "active" ? "suspend" : "activate"}
              </button>
            </div>
            <p className="font-mono text-[9px] text-white/18">
              public = anyone can request to join, you approve each one. invite_only = self-serve requests are blocked, only you can add students (bulk roster import or direct approval). private = hidden from the /campus directory entirely - only admins and already-approved students can reach it.
            </p>
            <div className="flex items-center gap-2">
              <input value={adminHandle[inst.id] || ""} onChange={e => setAdminHandle(p => ({ ...p, [inst.id]: e.target.value }))}
                placeholder="handle of first admin (faculty/placement officer)"
                className="flex-1 font-mono text-[11px] text-white/70 px-2.5 py-1.5 rounded outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <button onClick={() => handleAddAdmin(inst.id)} disabled={working[inst.id]}
                className="font-mono text-[10px] px-2.5 py-1.5 rounded border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors disabled:opacity-50 flex-shrink-0">
                + add admin
              </button>
            </div>
            {adminFeedback[inst.id] && (
              <p className="font-mono text-[10px]" style={{ color: adminFeedback[inst.id].type === "success" ? "#00FF41" : "#FF5050" }}>
                {adminFeedback[inst.id].text}
              </p>
            )}
            <div className="space-y-1.5">
              {(adminsByInst[inst.id] || []).length === 0 ? (
                <p className="font-mono text-[10px] text-white/20">No admins yet - add one above.</p>
              ) : adminsByInst[inst.id].map(a => {
                const key = `${inst.id}_${a.uid}`;
                return (
                  <div key={a.uid} className="flex items-center gap-2 px-2.5 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="font-mono text-[11px] text-white/70 flex-1 min-w-0 truncate">
                      {a.displayName || "(no name)"} {a.handle && <span className="text-white/30">@{a.handle}</span>}
                    </span>
                    <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{a.role}</span>
                    {removingAdmin === key ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleRemoveAdmin(inst.id, a.uid)} disabled={working[key]}
                          className="font-mono text-[10px] px-2 py-1 rounded border border-red-400/30 text-red-400 hover:bg-red-400/8 transition-colors disabled:opacity-50">
                          {working[key] ? "removing..." : "confirm"}
                        </button>
                        <button onClick={() => setRemovingAdmin(null)} className="font-mono text-[10px] px-1.5 text-white/30 hover:text-white/50">
                          cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setRemovingAdmin(key)}
                        className="font-mono text-[10px] px-2 py-1 rounded border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors flex-shrink-0">
                        remove as admin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  // Previously computed newXP as an absolute value from stale local React
  // state (u.xp), then set() it directly - a second admin action (or a
  // student's own concurrent XP-earning write) landing between this read and
  // write was silently clobbered, and there was no audit trail anywhere of
  // who granted what/when. Now uses increment() (atomic server-side, no
  // read-modify-write race) and records the grant in the same central
  // reward_grants ledger every other reward path writes to, with
  // grantedBy set to the acting admin - so a student's Reward Timeline
  // correctly shows manual admin adjustments alongside their other rewards.
  const handleXP = async (uid, sign) => {
    const u = users.find(u => u.uid === uid);
    if (!u) return;
    const delta = parseInt(xpDelta[uid]) || 100;
    const signedDelta = sign * delta;
    setWorking(p => ({ ...p, [`xp-${uid}`]: true }));
    try {
      // A unique id per grant, not a stable activity key - unlike every other
      // ledger entry (meant to dedupe a repeatable event), a manual admin
      // grant is deliberately NOT idempotent: an admin clicking +XP twice
      // means two separate, intended grants.
      const ledgerId = doc(collection(db, "reward_grants")).id;
      await runTransaction(db, async (tx) => {
        tx.update(doc(db, "users", uid), { xp: increment(signedDelta) });
        tx.set(doc(db, "reward_grants", ledgerId), {
          uid, activityType: "admin_manual", activityId: ledgerId,
          xp: signedDelta, coins: 0, score: 0,
          sourceModule: "admin_manual", grantedAt: serverTimestamp(),
          grantedBy: auth.currentUser?.uid || "admin", status: "granted",
        });
      });
      setUsers(prev => prev.map(x => x.uid === uid ? { ...x, xp: Math.max(0, (x.xp || 0) + signedDelta) } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(p => ({ ...p, [`xp-${uid}`]: false })); }
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

function blankOpportunityForm() {
  return {
    title: "", shortDescription: "", detailedDescription: "",
    organizationName: "", organizationLogoUrl: "", bannerUrl: "", type: OPPORTUNITY_TYPES[0],
    registrationUrl: "", officialWebsite: "", sourceUrl: "",
    registrationDeadline: "", eventStart: "", eventEnd: "", resultDate: "",
    eligibility: { degree: "", yearOfStudy: "", branches: [], minCgpa: "", backlogCriteria: "", skillsRequired: [], country: "", collegeRestrictions: "" },
    details: { rewards: "", stipend: "", salary: "", certificate: false, ppoAvailable: false, workMode: "Remote", teamSize: "", difficulty: OPP_DIFFICULTIES[0], estimatedTime: "" },
    tags: [], featured: false, status: "draft",
  };
}

function OpportunitiesPanel() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankOpportunityForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchOpportunities({ includeUnpublished: true }).then(setOpportunities).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (o) => {
    setEditingId(o.id);
    setForm({ ...blankOpportunityForm(), ...o, eligibility: { ...blankOpportunityForm().eligibility, ...o.eligibility }, details: { ...blankOpportunityForm().details, ...o.details } });
    setAdding(false);
  };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankOpportunityForm()); };

  const handleSave = async (publishAndNotify = false) => {
    if (!form.title.trim() || !form.registrationUrl.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const wasPublished = opportunities.find(o => o.id === id)?.status === "published";
      const data = { ...form, status: publishAndNotify ? "published" : form.status };
      await saveOpportunity(id, data);
      if (publishAndNotify && !wasPublished) await notifyNewOpportunity({ ...data, id });
      setEditingId(null); setAdding(false); setForm(blankOpportunityForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this opportunity?")) return;
    await deleteOpportunity(id);
    load();
  };

  const handleDuplicate = (o) => {
    setAdding(true); setEditingId(null);
    setForm({ ...blankOpportunityForm(), ...o, title: o.title + " (copy)", status: "draft" });
  };

  return (
    <div className="space-y-4">
      <button onClick={startAdd} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded"
        style={{ background: "rgba(0,255,65,0.08)", color: "#00FF41", border: "1px solid rgba(0,255,65,0.25)" }}>
        <Plus size={12} /> Add Opportunity
      </button>

      {(adding || editingId) && (
        <div className="p-3 rounded space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="font-mono text-[10px] text-white/40 tracking-widest">BASIC INFORMATION</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="GeeksforGeeks x MongoDB Campus Mantri - Level 2" />
            <Input label="ORGANIZATION NAME" value={form.organizationName} onChange={v => setForm(p => ({ ...p, organizationName: v }))} placeholder="GeeksforGeeks" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">TYPE</p>
              <Dropdown value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={OPPORTUNITY_TYPES} className="w-full" />
            </div>
            <Input label="ORGANIZATION LOGO URL" value={form.organizationLogoUrl} onChange={v => setForm(p => ({ ...p, organizationLogoUrl: v }))} placeholder="https://..." />
            <Input label="BANNER IMAGE URL" value={form.bannerUrl} onChange={v => setForm(p => ({ ...p, bannerUrl: v }))} placeholder="https://..." />
          </div>
          <Textarea label="SHORT DESCRIPTION (shown on the card)" value={form.shortDescription} onChange={v => setForm(p => ({ ...p, shortDescription: v }))} rows={2} />
          <Textarea label="DETAILED DESCRIPTION (shown on the detail page)" value={form.detailedDescription} onChange={v => setForm(p => ({ ...p, detailedDescription: v }))} rows={4} />

          <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">LINKS</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="REGISTRATION URL (Apply Now)" value={form.registrationUrl} onChange={v => setForm(p => ({ ...p, registrationUrl: v }))} placeholder="https://gfgcdn.com/tu/10jJ/" />
            <Input label="OFFICIAL WEBSITE" value={form.officialWebsite} onChange={v => setForm(p => ({ ...p, officialWebsite: v }))} placeholder="https://..." />
          </div>

          <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">TIMELINE</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="REGISTRATION DEADLINE" type="datetime-local" value={form.registrationDeadline} onChange={v => setForm(p => ({ ...p, registrationDeadline: v }))} />
            <Input label="EVENT START (optional)" type="datetime-local" value={form.eventStart} onChange={v => setForm(p => ({ ...p, eventStart: v }))} />
          </div>

          <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">ELIGIBILITY</p>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="DEGREE" value={form.eligibility.degree} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, degree: v } }))} placeholder="B.Tech / BE" />
            <Input label="YEAR OF STUDY" value={form.eligibility.yearOfStudy} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, yearOfStudy: v } }))} placeholder="2nd, 3rd, 4th year" />
            <Input label="MIN CGPA" value={form.eligibility.minCgpa} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, minCgpa: v } }))} />
            <Input label="COUNTRY" value={form.eligibility.country} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, country: v } }))} placeholder="India" />
          </div>
          <StringListField label="BRANCHES" items={form.eligibility.branches} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, branches: v } }))} />
          <StringListField label="SKILLS REQUIRED" items={form.eligibility.skillsRequired} onChange={v => setForm(p => ({ ...p, eligibility: { ...p.eligibility, skillsRequired: v } }))} />

          <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">ADDITIONAL DETAILS</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="STIPEND" value={form.details.stipend} onChange={v => setForm(p => ({ ...p, details: { ...p.details, stipend: v } }))} />
            <Input label="SALARY" value={form.details.salary} onChange={v => setForm(p => ({ ...p, details: { ...p.details, salary: v } }))} />
            <Input label="REWARDS" value={form.details.rewards} onChange={v => setForm(p => ({ ...p, details: { ...p.details, rewards: v } }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">WORK MODE</p>
              <Dropdown value={form.details.workMode} onChange={v => setForm(p => ({ ...p, details: { ...p.details, workMode: v } }))} options={WORK_MODES} className="w-full" />
            </div>
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.details.difficulty} onChange={v => setForm(p => ({ ...p, details: { ...p.details, difficulty: v } }))} options={OPP_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="ESTIMATED TIME" value={form.details.estimatedTime} onChange={v => setForm(p => ({ ...p, details: { ...p.details, estimatedTime: v } }))} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <input type="checkbox" checked={form.details.certificate} onChange={e => setForm(p => ({ ...p, details: { ...p.details, certificate: e.target.checked } }))} /> Certificate provided
            </label>
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <input type="checkbox" checked={form.details.ppoAvailable} onChange={e => setForm(p => ({ ...p, details: { ...p.details, ppoAvailable: e.target.checked } }))} /> PPO available
            </label>
          </div>

          <StringListField label="TAGS" items={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="MongoDB, Backend, Database" />

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-white/50">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} /> Featured (pinned + highlighted)
            </label>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
              <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published", "archived"]} className="w-36" />
            </div>
          </div>
          <p className="font-mono text-[10px] text-white/20">Note: no push/email notification pipeline exists yet - &quot;Publish &amp; Notify&quot; sends an in-app notification only.</p>

          <div className="flex gap-2 pt-1">
            <button onClick={() => handleSave(false)} disabled={saving || !form.title.trim() || !form.registrationUrl.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving || !form.title.trim() || !form.registrationUrl.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Publish & Notify"}
            </button>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : opportunities.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No opportunities yet.</p>
      ) : (
        <div className="space-y-2">
          {opportunities.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <b className="font-mono text-xs text-white/80">{o.title}</b>
                  {o.featured && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}>FEATURED</span>}
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: o.status === "published" ? "rgba(0,255,65,0.1)" : o.status === "archived" ? "rgba(255,80,80,0.1)" : "rgba(255,255,255,0.08)",
                      color: o.status === "published" ? "#00FF41" : o.status === "archived" ? "#FF5050" : "rgba(255,255,255,0.4)" }}>
                    {o.status?.toUpperCase() || "DRAFT"}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/30">{o.organizationName} · {o.type} · {o.views || 0} views · {o.applyClicks || 0} apply-clicks · {o.saveCount || 0} saves</span>
              </div>
              <button onClick={() => handleDuplicate(o)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#00FFFF" }}>
                <Copy size={11} /> Duplicate
              </button>
              <button onClick={() => startEdit(o)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FFD700" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => handleDelete(o.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FF5050" }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

// ── Communities panel (Pulse chapters) ────────────────────────────────────────
// Admin-created content, same editingId/startEdit CRUD pattern used
// elsewhere in this file. Deleting a community here does NOT delete the
// pulse_posts tagged with its id or the community_members join docs - those
// are left as harmless orphans (same tradeoff already accepted for a
// deleted hackathon's slug-keyed docs elsewhere) rather than adding a bulk
// cleanup pass for what's expected to be rare, admin-only content churn.

function blankCommunityForm() {
  return { slug: "", name: "", topic: "", description: "" };
}

function CommunitiesPanel() {
  const [communities, setCommunities] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [editingId,   setEditingId]   = useState(null);
  const [form, setForm] = useState(blankCommunityForm);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "communities"), orderBy("createdAt", "desc")))
      .then(snap => setCommunities(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (c) => {
    setEditingId(c.id);
    setError("");
    setForm({ slug: c.id, name: c.name || "", topic: c.topic || "", description: c.description || "" });
  };
  const cancelEdit = () => { setEditingId(null); setForm(blankCommunityForm()); setError(""); };

  const handleSave = async () => {
    if (!editingId && !form.slug.trim()) return setError("Slug is required.");
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true); setError("");
    try {
      const payload = { name: form.name.trim(), topic: form.topic.trim(), description: form.description.trim() };
      if (editingId) {
        await updateDoc(doc(db, "communities", editingId), payload);
      } else {
        await setDoc(doc(db, "communities", form.slug.trim()), {
          ...payload, memberCount: 0, createdAt: serverTimestamp(),
        });
      }
      cancelEdit();
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete community "${id}"?`)) return;
    await deleteDoc(doc(db, "communities", id));
    if (editingId === id) cancelEdit();
    load();
  };

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : (
        <div className="space-y-2">
          {communities.length === 0 && <p className="font-mono text-xs text-white/20">No communities yet.</p>}
          {communities.map(c => (
            <div key={c.id} className="flex items-center gap-3 border border-white/6 rounded-lg px-4 py-3">
              <span className="font-mono text-[10px] text-white/35 flex-shrink-0">{c.id}</span>
              <span className="font-mono text-xs text-white/75 flex-1 truncate">{c.name}</span>
              <span className="font-mono text-[10px] text-neon-cyan flex-shrink-0">{c.memberCount ?? 0} members</span>
              <button onClick={() => startEdit(c)} className="text-white/20 hover:text-yellow-400 transition-colors flex-shrink-0"><Pencil size={12} /></button>
              <button onClick={() => handleDelete(c.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-neon-cyan tracking-wider">{editingId ? `// editing ${editingId}` : "// create community"}</p>
          {editingId && (
            <button onClick={cancelEdit} className="font-mono text-[10px] text-white/30 hover:text-white/55 flex items-center gap-1">
              <X size={10} /> cancel
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="SLUG (doc ID)" value={form.slug} onChange={f("slug")} placeholder="ai-builders" hint={editingId ? "locked once created" : undefined} />
          <Input label="NAME" value={form.name} onChange={f("name")} placeholder="AI Builders" />
        </div>
        <Input label="TOPIC (optional)" value={form.topic} onChange={f("topic")} placeholder="ai" />
        <Textarea label="DESCRIPTION" value={form.description} onChange={f("description")} placeholder="What's this community about?" rows={2} />
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleSave} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "saving..." : editingId ? "save changes" : "create community"}
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
                <div key={mod.id} className="flex flex-wrap items-center gap-2 border border-white/6 rounded-lg px-3 py-2">
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
                    className="font-mono text-[10px] text-white/70 px-2 py-1 rounded outline-none w-full sm:w-[220px] flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
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

  // Re-checks AND decrements the user's real, live pulseCoins balance as
  // part of approval itself, inside a transaction - payout_requests.create's
  // own balance check (firestore.rules) only bounds a single create against
  // whatever the balance happened to be at that moment, and a raw client
  // write bypassing the Wallet page's own decrement-at-request-time
  // transaction could create multiple pending requests all claiming the
  // same, never-actually-reserved balance. Re-validating and decrementing
  // here, right before marking a request approved, means approving two such
  // duplicates for the same real balance can only ever pay out once - the
  // second approval's live re-read sees the already-decremented balance and
  // is correctly refused, instead of both silently succeeding and doubling
  // (or worse) the real INR paid out for one real coin balance.
  const handleApprove = async (req) => {
    if (!confirm(`Approve ₹${(req.inrAmount || 0).toFixed(2)} payout to @${req.handle}?`)) return;
    setWorking(p => ({ ...p, [req.id]: true }));
    try {
      await runTransaction(db, async (tx) => {
        const earningsRef = doc(db, "user_earnings", req.uid);
        const earningsSnap = await tx.get(earningsRef);
        const liveCoins = earningsSnap.exists() ? (earningsSnap.data().pulseCoins || 0) : 0;
        if (liveCoins < req.coins) {
          throw new Error(`${req.handle}'s current balance (${liveCoins} coins) is less than this request's ${req.coins} coins - likely already paid out via a duplicate request. Refusing to approve.`);
        }
        tx.update(earningsRef, { pulseCoins: increment(-req.coins) });
        tx.update(doc(db, "payout_requests", req.id), { status: "approved", processedAt: serverTimestamp() });
      });
      writeNotification(req.uid, {
        type: "payout",
        title: `Payout of ₹${(req.inrAmount || 0).toFixed(2)} approved`,
        body: "Your withdrawal request has been approved. Payment is being processed.",
        ctaHref: "/wallet",
        ctaLabel: "view wallet",
      });
      notifyPayoutStatus(req, "approved");
      load();
    } catch (e) { console.error(e); alert(e.message || "Failed to approve payout."); }
    finally { setWorking(p => ({ ...p, [req.id]: false })); }
  };

  // Transactional and idempotent on the request's OWN status, same reasoning
  // as handleApprove above - two admins (or two tabs, or a double-click)
  // rejecting the same request used to both refund req.coins unconditionally,
  // with no check that the request hadn't already been processed. Re-reading
  // the request doc live and only refunding while it's still genuinely
  // 'pending' closes that double-refund; it does NOT retroactively prove the
  // coins were really deducted at creation time in the first place (that
  // gap is the payout_requests architecture limitation flagged in the
  // sign-off report, not something a single-request-idempotency fix can
  // close on its own).
  const handleReject = async (req) => {
    const reason = prompt("Rejection reason (optional):");
    if (reason === null) return;
    setWorking(p => ({ ...p, [req.id]: true }));
    try {
      await runTransaction(db, async (tx) => {
        const reqRef = doc(db, "payout_requests", req.id);
        const reqSnap = await tx.get(reqRef);
        if (!reqSnap.exists() || reqSnap.data().status !== "pending") {
          throw new Error("This request is no longer pending (already processed elsewhere) - refusing to refund again.");
        }
        tx.update(doc(db, "user_earnings", req.uid), { pulseCoins: increment(req.coins) });
        tx.update(reqRef, { status: "rejected", note: reason || "", processedAt: serverTimestamp() });
      });
      writeNotification(req.uid, {
        type: "rejection",
        title: `Payout request rejected`,
        body: reason ? `Reason: ${reason}` : "Your withdrawal request was not approved. Contact support if needed.",
        ctaHref: "/wallet",
        ctaLabel: "view wallet",
      });
      notifyPayoutStatus(req, "rejected");
      load();
    } catch (e) { console.error(e); alert(e.message || "Failed to reject payout."); }
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
    // Previously fetched EVERY user document just to derive a count, a sum,
    // and a top-5 - fine at a few hundred users, a real and growing cost
    // once the platform has thousands. All three are now computed server-
    // side: totalUsers/totalXP via Firestore's count()/sum() aggregation
    // (no documents transferred at all), topBuilders via a proper indexed
    // top-5 query instead of client-side sort-then-slice over the full set.
    const load = async () => {
      const usersCol = collection(db, "users");
      const [userCountSnap, xpSumSnap, topBuildersSnap, postsSnap, missionsSnap, broadcastsSnap, payoutsSnap] = await Promise.allSettled([
        getCountFromServer(usersCol),
        getAggregateFromServer(usersCol, { total: sum("xp") }),
        getDocs(query(usersCol, orderBy("xp", "desc"), limit(5))),
        getCountFromServer(collection(db, "pulse_posts")),
        getCountFromServer(query(collection(db, "missions"), where("status", "==", "OPEN"))),
        getCountFromServer(collection(db, "broadcasts")),
        getCountFromServer(query(collection(db, "payout_requests"), where("status", "==", "pending"))),
      ]);
      setStats({
        totalUsers:     userCountSnap.status === "fulfilled"    ? userCountSnap.value.data().count : 0,
        totalXP:        xpSumSnap.status === "fulfilled"        ? (xpSumSnap.value.data().total || 0) : 0,
        topBuilders:    topBuildersSnap.status === "fulfilled"  ? topBuildersSnap.value.docs.map(d => d.data()) : [],
        pulsePosts:     postsSnap.status === "fulfilled"        ? postsSnap.value.data().count      : 0,
        openMissions:   missionsSnap.status === "fulfilled"     ? missionsSnap.value.data().count   : 0,
        broadcasts:     broadcastsSnap.status === "fulfilled"   ? broadcastsSnap.value.data().count : 0,
        pendingPayouts: payoutsSnap.status === "fulfilled"      ? payoutsSnap.value.data().count    : 0,
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
        Course -&gt; Module -&gt; Task(+Quiz). Tasks unlock sequentially for learners - Task 2 stays locked until Task 1&apos;s quiz is passed.
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
// Fixed vocabulary for exam relevance badges - shared by the manual form and
// the CSV importer (which drops anything outside this list, with a warning,
// rather than failing the whole row).
const APTITUDE_EXAM_TAGS = ["GATE", "CAT", "Campus Placement", "Product Companies", "Banking", "SSC", "UPSC", "GRE"];

const CSV_HELP = `Columns (first row = header, exact names): question,option1,option2,option3,option4,correctOption,explanation,videoUrl,difficulty,subtopic,estimatedTimeSec,companies,examTags,shortcut,formula,commonMistake,alternativeApproach,interviewTip,marks,negativeMarks
- correctOption is 1-4 (which option is right)
- videoUrl, difficulty (easy/medium/hard, default "medium"), subtopic, estimatedTimeSec (seconds), shortcut, formula, commonMistake, alternativeApproach, interviewTip, marks (default 1) and negativeMarks (default 0) are all optional
- companies and examTags can hold MULTIPLE values - separate them with a semicolon inside the cell, e.g. "Amazon;Google;TCS" (commas already separate columns, so a comma-separated list would silently spill into the next column instead of erroring)
- examTags must be from: ${APTITUDE_EXAM_TAGS.join(", ")} - anything else is dropped with a warning, not a row failure
- Wrap any field containing a comma in double quotes (only needed for actual .csv files - pasting straight from Excel/Sheets works as-is)`;

const CSV_TEMPLATE_HEADER = "question,option1,option2,option3,option4,correctOption,explanation,videoUrl,difficulty,subtopic,estimatedTimeSec,companies,examTags,shortcut,formula,commonMistake,alternativeApproach,interviewTip,marks,negativeMarks";
const CSV_TEMPLATE_EXAMPLE_ROWS = [
  ['What is 20% of 150?', '20', '30', '35', '40', '2', '20% = 1/5, so 150 / 5 = 30.', '', 'easy', 'Basic Percentages', '45', 'Amazon;TCS', 'Campus Placement;SSC', 'Convert 20% to 1/5 and divide directly - avoids the multiplication step entirely.', 'Percentage = (Value / Total) x 100', 'Multiplying by 20 instead of converting to 0.2 first.', '', 'Interviewers love quick mental math here - drill the 10/20/25/50% fraction shortcuts.', '1', '0'],
  ['A number increased by 25% gives 100. What is the original number?', '70', '75', '80', '85', '3', 'Let the number be N. N + 25% of N = 100, so 1.25N = 100, N = 80.', 'https://youtu.be/example', 'medium', 'Successive Percentage Change', '90', 'Google;Microsoft;Infosys', 'GATE;Product Companies', 'Divide 100 by 1.25 directly instead of solving the algebra.', 'Final = Original x (1 + percent/100)', 'Students subtract 25 from 100 instead of dividing.', 'Work backwards from the answer choices by testing each against the 25% increase.', '', '1', '0.25'],
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
function blankQuestionForm() {
  return {
    question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", videoUrl: "", difficulty: "medium",
    subtopic: "", estimatedTimeSec: "", companies: "", examTags: "",
    shortcut: "", formula: "", commonMistake: "", alternativeApproach: "", interviewTip: "",
    marks: "", negativeMarks: "",
  };
}

// companies/examTags hold multiple values per cell - semicolon-separated
// (commas are already the column delimiter, so a comma list would silently
// spill into the next column instead of raising a row error).
function splitMultiValue(raw) {
  return (raw || "").split(";").map(t => t.trim()).filter(Boolean);
}

function normalizeExamTags(raw, errors, lineNo) {
  const out = [];
  for (const v of splitMultiValue(raw)) {
    const match = APTITUDE_EXAM_TAGS.find(t => t.toLowerCase() === v.toLowerCase());
    if (match) out.push(match);
    else errors.push(`Row ${lineNo}: unrecognized exam tag "${v}" - dropped (not a row failure).`);
  }
  return out;
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
    const getCol = (name) => (col(name) !== -1 ? (r[col(name)] || "").trim() : "");
    const estimatedTimeSec = parseInt(getCol("estimatedtimesec"), 10);
    const marksRaw = getCol("marks");
    const negMarksRaw = getCol("negativemarks");
    questions.push({
      question, options, correctIndex,
      explanation: getCol("explanation"),
      videoUrl:    getCol("videourl"),
      difficulty:  getCol("difficulty") || "medium",
      subtopic:    getCol("subtopic"),
      estimatedTimeSec: Number.isFinite(estimatedTimeSec) ? estimatedTimeSec : 0,
      companies: splitMultiValue(getCol("companies")),
      examTags: normalizeExamTags(getCol("examtags"), errors, lineNo),
      shortcut: getCol("shortcut"),
      formula: getCol("formula"),
      commonMistake: getCol("commonmistake"),
      alternativeApproach: getCol("alternativeapproach"),
      interviewTip: getCol("interviewtip"),
      marks: marksRaw ? parseFloat(marksRaw) : 1,
      negativeMarks: negMarksRaw ? parseFloat(negMarksRaw) : 0,
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
      const examTags = qForm.examTags.split(",").map(t => t.trim()).filter(Boolean)
        .map(t => APTITUDE_EXAM_TAGS.find(v => v.toLowerCase() === t.toLowerCase())).filter(Boolean);
      await addDoc(collection(db, "aptitude_topics", topicId, "questions"), {
        ...qForm,
        question: qForm.question.trim(),
        options: qForm.options.map(o => o.trim()),
        subtopic: qForm.subtopic.trim(),
        estimatedTimeSec: parseInt(qForm.estimatedTimeSec, 10) || 0,
        companies: qForm.companies.split(",").map(t => t.trim()).filter(Boolean),
        examTags,
        shortcut: qForm.shortcut.trim(),
        formula: qForm.formula.trim(),
        commonMistake: qForm.commonMistake.trim(),
        alternativeApproach: qForm.alternativeApproach.trim(),
        interviewTip: qForm.interviewTip.trim(),
        marks: qForm.marks.trim() ? parseFloat(qForm.marks) : 1,
        negativeMarks: qForm.negativeMarks.trim() ? parseFloat(qForm.negativeMarks) : 0,
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
                        <Textarea label="EXPLANATION (Method 1 - step-by-step)" value={qForm.explanation} onChange={v => setQForm(p => ({ ...p, explanation: v }))} rows={3} placeholder="Step-by-step worked solution..." />
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="VIDEO URL (optional)" value={qForm.videoUrl} onChange={v => setQForm(p => ({ ...p, videoUrl: v }))} placeholder="https://youtu.be/..." />
                          <div>
                            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
                            <Dropdown value={qForm.difficulty} onChange={v => setQForm(p => ({ ...p, difficulty: v }))}
                              options={["easy", "medium", "hard"]}
                              className="w-full"
                              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
                              />
                          </div>
                        </div>

                        <p className="font-mono text-[9px] text-white/25 tracking-widest pt-1">SOLUTION DEPTH (optional)</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input label="SHORTCUT (Method 2)" value={qForm.shortcut} onChange={v => setQForm(p => ({ ...p, shortcut: v }))} placeholder="Faster approach..." />
                          <Input label="FORMULA" value={qForm.formula} onChange={v => setQForm(p => ({ ...p, formula: v }))} placeholder="Percentage = (Value/Total) x 100" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input label="COMMON MISTAKE" value={qForm.commonMistake} onChange={v => setQForm(p => ({ ...p, commonMistake: v }))} placeholder="Students subtract instead of multiplying..." />
                          <Input label="ALTERNATIVE APPROACH" value={qForm.alternativeApproach} onChange={v => setQForm(p => ({ ...p, alternativeApproach: v }))} placeholder="Work backwards from the options..." />
                        </div>
                        <Input label="REAL INTERVIEW TIP" value={qForm.interviewTip} onChange={v => setQForm(p => ({ ...p, interviewTip: v }))} placeholder="Interviewers often follow up by asking..." />

                        <p className="font-mono text-[9px] text-white/25 tracking-widest pt-1">COMPANIES &amp; EXAMS (optional)</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input label="SUBTOPIC" value={qForm.subtopic} onChange={v => setQForm(p => ({ ...p, subtopic: v }))} placeholder="Successive Percentage Change" />
                          <Input label="COMPANIES (comma separated)" value={qForm.companies} onChange={v => setQForm(p => ({ ...p, companies: v }))} placeholder="Amazon, Google, TCS" />
                        </div>
                        <Input label="EXAM TAGS (comma separated)" value={qForm.examTags} onChange={v => setQForm(p => ({ ...p, examTags: v }))}
                          placeholder="GATE, Campus Placement" hint={`Recognized: ${APTITUDE_EXAM_TAGS.join(", ")}`} />

                        <p className="font-mono text-[9px] text-white/25 tracking-widest pt-1">TIMING &amp; MARKS (optional)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input label="EST. TIME (sec)" type="number" value={qForm.estimatedTimeSec} onChange={v => setQForm(p => ({ ...p, estimatedTimeSec: v }))} placeholder="90" />
                          <Input label="MARKS" type="number" value={qForm.marks} onChange={v => setQForm(p => ({ ...p, marks: v }))} placeholder="1" />
                          <Input label="NEGATIVE MARKS" type="number" value={qForm.negativeMarks} onChange={v => setQForm(p => ({ ...p, negativeMarks: v }))} placeholder="0" />
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
            <Dropdown value={topicForm.category} onChange={v => setTopicForm(p => ({ ...p, category: v }))}
              options={APTITUDE_CATEGORIES}
              className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
              />
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

// ── Aptitude topic lesson-content editor ──────────────────────────────────────
// Adds the Programming/CS Core-style lesson layer (concept/keyPoints/mcqs/
// etc.) ON TOP OF topics already created by AptitudePanel above (category/
// name/description + their practice-question subcollection, both untouched
// here) - editor-only, no "create topic" here on purpose, since that stays
// AptitudePanel's job. Mirrors ProgrammingTopicsPanel's form shape exactly
// (same StringListField/McqListField reuse), minus codeExample (not
// applicable to aptitude topics) and practiceProblemIds (aptitude topics
// already have their OWN practice-question subcollection, not CodeLab
// problem references).
function blankAptitudeTopicContent() {
  return {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: [], prerequisites: [], concept: "", keyPoints: [],
    commonMistakes: [], interviewTips: [], realWorldApplications: [],
    mcqs: [], goingDeeper: "", assignment: "", xpReward: 15, coinReward: 5,
  };
}

function AptitudeTopicsPanel() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankAptitudeTopicContent());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAptitudeTopics({ includeUnpublished: true }).then(setTopics).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({ ...blankAptitudeTopicContent(), ...t, status: t.status || "published" });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await saveAptitudeTopic(editingId, form);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const grouped = APTITUDE_CATEGORIES.map(cat => ({ cat, items: topics.filter(t => t.category === cat) }));

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] text-white/40">
        Adds lesson content (concept, key points, quiz, rewards) to topics already created above. Editing an existing topic only - use the ADD TOPIC form above to create a brand new one first.
      </p>

      {editingId && (
        <div className="p-3 rounded space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h4 className="font-mono text-sm" style={{ color: "#00FFFF" }}>Editing: {topics.find(t => t.id === editingId)?.name}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={["Beginner", "Intermediate", "Advanced"]} className="w-full" />
            </div>
            <Input label="EST. MINUTES" type="number" value={form.estimatedMinutes} onChange={v => setForm(p => ({ ...p, estimatedMinutes: Number(v) || 0 }))} />
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">STATUS</p>
              <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published"]} className="w-full" />
            </div>
          </div>
          <StringListField label="WHAT YOU'LL LEARN" items={form.whatYoullLearn} onChange={v => setForm(p => ({ ...p, whatYoullLearn: v }))} />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />
          <LessonConceptField value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <StringListField label="KEY POINTS" items={form.keyPoints} onChange={v => setForm(p => ({ ...p, keyPoints: v }))} />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <StringListField label="INTERVIEW TIPS" items={form.interviewTips} onChange={v => setForm(p => ({ ...p, interviewTips: v }))} />
          <StringListField label="REAL-WORLD APPLICATIONS" items={form.realWorldApplications} onChange={v => setForm(p => ({ ...p, realWorldApplications: v }))} />
          <McqListField items={form.mcqs} onChange={v => setForm(p => ({ ...p, mcqs: v }))} />
          <Textarea label="GOING DEEPER (optional)" value={form.goingDeeper} onChange={v => setForm(p => ({ ...p, goingDeeper: v }))} rows={4} />
          <Textarea label="ASSIGNMENT" value={form.assignment} onChange={v => setForm(p => ({ ...p, assignment: v }))} rows={2} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: Number(v) || 0 }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: Number(v) || 0 }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditingId(null)} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ cat, items }) => items.length > 0 && (
            <div key={cat}>
              <p className="font-mono text-[10px] text-white/25 tracking-widest mb-1.5">{cat.toUpperCase()}</p>
              <div className="space-y-1.5">
                {items.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded flex-wrap"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex-1 min-w-0"><span className="font-mono text-xs text-white/80">{t.name}</span></div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: t.status === "published" ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)", color: t.status === "published" ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
                      {(t.status || "published").toUpperCase()}
                    </span>
                    {!(t.concept?.trim() || t.keyPoints?.length) && (
                      <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO CONTENT</span>
                    )}
                    <button onClick={() => startEdit(t)} className="flex items-center gap-1 font-mono text-[10.5px] px-2 py-1" style={{ color: "#FFD700" }}>
                      <Pencil size={11} /> Edit Content
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Company Prep panel ────────────────────────────────────────────────────────
// Company -> Round -> Category -> Question, global DeVert-authored content
// (lib/companyPrep.js has the shared fetchers/CSV helpers the student side
// also reads from; this panel owns every write, same convention as Aptitude/
// Contests above). A draft company - and everything nested under it - is
// admin-only until published, same status gate a contest's own questions/
// answerKeys already use. Firestore doesn't cascade-delete subcollections,
// so removing a company/round/category walks its own children first.

function blankCompanyPrepForm() {
  return { name: "", logo: "", description: "", website: "", eligibility: "", ctc: "", hiringOverview: "", difficulty: "Medium", resources: "" };
}
function blankRoundForm() {
  return {
    name: "", description: "", duration: "", passingMarks: "", instructions: "",
    whatTheyEvaluate: "", format: "", eliminationCriteria: "", prepStrategy: "", commonMistakes: "",
  };
}
function blankCategoryForm() { return { name: "" }; }
function blankCategoryLessonForm() {
  return { whatYoullLearn: [], concept: "", keyPoints: [], commonMistakes: [], interviewTips: [] };
}
function blankRoadmapDay(dayNumber) { return { day: dayNumber, title: "", focus: "", tasksText: "" }; }
function blankInterviewExperienceForm() {
  return { studentName: "", year: "", role: "", difficulty: "Medium", roundsFaced: "", questionsAsked: "", tips: "" };
}
function blankMockInterviewForm() { return { name: "", type: "technical", timeLimitMinutes: 30 }; }

// "Title | URL | Type" per line, one resource per line - backward
// compatible with a company authored before this structured shape existed
// (a line with no "|" separator is treated as a bare URL, matching the old
// one-URL-per-line format exactly).
function parseResourcesText(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split("|").map(p => p.trim());
    if (parts.length === 1) return { title: "Resource", url: parts[0], type: "link" };
    return { title: parts[0] || "Resource", url: parts[1] || "", type: parts[2] || "link" };
  }).filter(r => r.url);
}
function blankCompanyQuestionForm() {
  return { question: "", options: ["", "", "", ""], correctIndex: 0, difficulty: "Medium", marks: "", explanation: "", tags: "" };
}

async function deleteCompanyCategoryCascade(companyId, roundId, categoryId) {
  const qSnap = await getDocs(collection(db, "companies", companyId, "rounds", roundId, "categories", categoryId, "questions"));
  await Promise.all(qSnap.docs.map(q => deleteDoc(q.ref)));
  await deleteDoc(doc(db, "companies", companyId, "rounds", roundId, "categories", categoryId));
}
async function deleteCompanyRoundCascade(companyId, roundId) {
  const catSnap = await getDocs(collection(db, "companies", companyId, "rounds", roundId, "categories"));
  await Promise.all(catSnap.docs.map(c => deleteCompanyCategoryCascade(companyId, roundId, c.id)));
  await deleteDoc(doc(db, "companies", companyId, "rounds", roundId));
}
async function deleteCompanyCascade(companyId) {
  const roundSnap = await getDocs(collection(db, "companies", companyId, "rounds"));
  await Promise.all(roundSnap.docs.map(r => deleteCompanyRoundCascade(companyId, r.id)));
  await deleteDoc(doc(db, "companies", companyId));
}

function blankLanguageForm() {
  return {
    name: "", difficulty: "Beginner", estimatedDuration: "", order: 0,
    placementRelevance: "", industryUsage: "", status: "draft",
  };
}

function ProgrammingLanguagesPanel() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankLanguageForm());
  const [adding, setAdding] = useState(false);
  const [managingTopicsFor, setManagingTopicsFor] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchLanguages({ includeUnpublished: true }).then(setLanguages).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (lang) => { setEditingId(lang.id); setForm({ ...blankLanguageForm(), ...lang }); setAdding(false); };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankLanguageForm()); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveLanguage(id, form);
      setEditingId(null); setAdding(false); setForm(blankLanguageForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this language and all of its topics? This can't be undone.")) return;
    await deleteLanguage(id);
    load();
  };

  if (managingTopicsFor) {
    const lang = languages.find(l => l.id === managingTopicsFor);
    return <ProgrammingTopicsPanel langId={managingTopicsFor} langName={lang?.name} onBack={() => setManagingTopicsFor(null)} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={startAdd} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded"
        style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF", border: "1px solid rgba(0,255,255,0.25)" }}>
        <Plus size={12} /> Add Language
      </button>

      {(adding || editingId) && (
        <div className="p-3 rounded space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Input label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Java" />
          <p className="font-mono text-[10px] text-white/30 -mt-1.5">Icon is picked automatically from the name - no emoji, matches the rest of the app.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={PROGRAMMING_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="ESTIMATED DURATION" value={form.estimatedDuration} onChange={v => setForm(p => ({ ...p, estimatedDuration: v }))} placeholder="8-10 weeks" />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: Number(v) || 0 }))} />
          </div>
          <Textarea label="PLACEMENT RELEVANCE" value={form.placementRelevance} onChange={v => setForm(p => ({ ...p, placementRelevance: v }))}
            placeholder="Most-asked language in service company interviews (TCS, Infosys, Wipro, Accenture)." rows={2} />
          <Textarea label="INDUSTRY USAGE" value={form.industryUsage} onChange={v => setForm(p => ({ ...p, industryUsage: v }))}
            placeholder="Enterprise backend systems, Android development, banking software." rows={2} />
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published", "archived"]} className="w-40" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : languages.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No languages yet.</p>
      ) : (
        <div className="space-y-2">
          {languages.map(lang => {
            return (
            <div key={lang.id} className="flex items-center gap-3 p-3 rounded flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <LanguageLogo name={lang.name} size={18} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <b className="font-mono text-xs text-white/80">{lang.name}</b>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: lang.status === "published" ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)", color: lang.status === "published" ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
                    {lang.status?.toUpperCase() || "DRAFT"}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/30">{lang.difficulty} · {lang.estimatedDuration} · {lang.topicCount || 0} topics</span>
              </div>
              <button onClick={() => setManagingTopicsFor(lang.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1 rounded" style={{ color: "#00FFFF" }}>
                <Layers size={11} /> Topics
              </button>
              <button onClick={() => startEdit(lang)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FFD700" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => handleDelete(lang.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FF5050" }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function blankProgrammingTopicForm() {
  return {
    title: "", module: "", order: 0, status: "draft",
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: [], prerequisites: [], concept: "", keyPoints: [],
    commonMistakes: [], interviewTips: [], realWorldApplications: [],
    codeExample: { language: "java", code: "" },
    mcqs: [], goingDeeper: "",
    assignment: "", xpReward: 25, coinReward: 10,
    practiceProblemIds: [],
  };
}

function ProgrammingTopicsPanel({ langId, langName, onBack }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankProgrammingTopicForm());
  const [saving, setSaving] = useState(false);
  const [practiceIdsText, setPracticeIdsText] = useState("");

  const load = () => {
    setLoading(true);
    fetchTopics(langId, { includeUnpublished: true }).then(setTopics).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [langId]);

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({ ...blankProgrammingTopicForm(), ...t });
    setPracticeIdsText((t.practiceProblemIds || []).join(", "));
    setAdding(false);
  };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankProgrammingTopicForm()); setPracticeIdsText(""); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const practiceProblemIds = practiceIdsText.split(",").map(s => s.trim()).filter(Boolean);
      await saveTopic(langId, id, { ...form, practiceProblemIds });
      // Keep the language doc's topicCount denormalized so the landing grid's
      // progress bar never needs an N-topic subcollection read per language.
      await saveLanguage(langId, { topicCount: (await fetchTopics(langId, { includeUnpublished: true })).length });
      setEditingId(null); setAdding(false); setForm(blankProgrammingTopicForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic?")) return;
    await deleteTopic(langId, id);
    await saveLanguage(langId, { topicCount: Math.max(0, (topics.length - 1)) });
    load();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="font-mono text-xs text-white/40">&larr; Back to Languages</button>
      <h4 className="font-mono text-sm" style={{ color: "#00FFFF" }}>{langName} - Topics ({topics.length})</h4>

      <button onClick={startAdd} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded"
        style={{ background: "rgba(0,255,255,0.08)", color: "#00FFFF", border: "1px solid rgba(0,255,255,0.25)" }}>
        <Plus size={12} /> Add Topic
      </button>

      {(adding || editingId) && (
        <div className="p-3 rounded space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Arrays" />
            <Input label="MODULE (groups topics in the roadmap tree)" value={form.module} onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="Fundamentals" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: Number(v) || 0 }))} />
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={PROGRAMMING_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="EST. MINUTES" type="number" value={form.estimatedMinutes} onChange={v => setForm(p => ({ ...p, estimatedMinutes: Number(v) || 0 }))} />
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS (published = visible in roadmap; content below can still be empty = shows &quot;coming soon&quot;)</p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published", "archived"]} className="w-40" />
          </div>

          <StringListField label="WHAT YOU'LL LEARN" items={form.whatYoullLearn} onChange={v => setForm(p => ({ ...p, whatYoullLearn: v }))} placeholder="How arrays store elements in contiguous memory" />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} placeholder="Variables & Data Types" />
          <LessonConceptField value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CODE EXAMPLE LANGUAGE</p>
              <Dropdown value={form.codeExample?.language || "java"} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, language: v } }))}
                options={CODELAB_LANGUAGES.map(l => l.id)} className="w-full" />
            </div>
          </div>
          <Textarea label="CODE EXAMPLE" value={form.codeExample?.code || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, code: v } }))} rows={5} />
          <Textarea label="EXPECTED OUTPUT (shown if live Run is ever unavailable - optional but recommended)"
            value={form.codeExample?.expectedOutput || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, expectedOutput: v } }))} rows={2} />
          <StringListField label="KEY POINTS" items={form.keyPoints} onChange={v => setForm(p => ({ ...p, keyPoints: v }))} />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <StringListField label="INTERVIEW TIPS" items={form.interviewTips} onChange={v => setForm(p => ({ ...p, interviewTips: v }))} />
          <StringListField label="REAL-WORLD APPLICATIONS" items={form.realWorldApplications} onChange={v => setForm(p => ({ ...p, realWorldApplications: v }))} />
          <McqListField items={form.mcqs} onChange={v => setForm(p => ({ ...p, mcqs: v }))} />
          <Textarea label="GOING DEEPER (optional - advanced-learner content, shown collapsed below the main lesson)"
            value={form.goingDeeper} onChange={v => setForm(p => ({ ...p, goingDeeper: v }))} rows={4}
            placeholder="Denser, more technical detail for students who want to go beyond the beginner explanation above." />
          <Textarea label="ASSIGNMENT" value={form.assignment} onChange={v => setForm(p => ({ ...p, assignment: v }))} rows={2} />
          <Input label="PRACTICE PROBLEM IDS (comma-separated CodeLab problem IDs)" value={practiceIdsText} onChange={setPracticeIdsText} placeholder="0Iwq5sfiExGtB62k6fOd, ..." />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: Number(v) || 0 }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: Number(v) || 0 }))} />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : topics.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No topics yet.</p>
      ) : (
        <div className="space-y-1.5">
          {topics.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2.5 rounded flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{t.order}</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-white/80">{t.title}</span>
                <span className="font-mono text-[10px] text-white/30 ml-2">{t.module}</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: t.status === "published" ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)", color: t.status === "published" ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
                {t.status?.toUpperCase() || "DRAFT"}
              </span>
              {!(t.concept?.trim() || t.keyPoints?.length) && (
                <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO CONTENT</span>
              )}
              <button onClick={() => startEdit(t)} className="flex items-center gap-1 font-mono text-[10.5px] px-2 py-1" style={{ color: "#FFD700" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2 py-1" style={{ color: "#FF5050" }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function blankSubjectForm() {
  return {
    name: "", difficulty: "Beginner", estimatedDuration: "", order: 0,
    placementRelevance: "", industryUsage: "", status: "draft",
    // The subject-level introduction - what renders on the Overview tab of the
    // subject screen. Every field is optional there: a subject with none of
    // them authored simply opens on its roadmap, exactly as it did before this
    // existed. Bulk-authored by scripts/write-cscore-subject-intros.mjs; these
    // controls are for editing one subject without running a script.
    overview: "", whyLearn: [], whereUsed: [], skillsGained: [],
    prerequisites: [], interviewImportance: 0, topCompanies: [], interviewQuestions: [],
  };
}

function CsCoreSubjectsPanel() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankSubjectForm());
  const [adding, setAdding] = useState(false);
  const [managingTopicsFor, setManagingTopicsFor] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchSubjects({ includeUnpublished: true }).then(setSubjects).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startEdit = (s) => { setEditingId(s.id); setForm({ ...blankSubjectForm(), ...s }); setAdding(false); };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankSubjectForm()); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await saveSubject(id, form);
      setEditingId(null); setAdding(false); setForm(blankSubjectForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject and all of its topics? This can't be undone.")) return;
    await deleteSubject(id);
    load();
  };

  if (managingTopicsFor) {
    const subject = subjects.find(s => s.id === managingTopicsFor);
    return <CsCoreTopicsPanel subjectId={managingTopicsFor} subjectName={subject?.name} onBack={() => setManagingTopicsFor(null)} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={startAdd} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded"
        style={{ background: "rgba(167,139,250,0.08)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}>
        <Plus size={12} /> Add Subject
      </button>

      {(adding || editingId) && (
        <div className="p-3 rounded space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Input label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Operating Systems" />
          <p className="font-mono text-[10px] text-white/30 -mt-1.5">Icon is picked automatically from the name - no emoji, matches the rest of the app.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={CS_CORE_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="ESTIMATED DURATION" value={form.estimatedDuration} onChange={v => setForm(p => ({ ...p, estimatedDuration: v }))} placeholder="6-8 weeks" />
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: Number(v) || 0 }))} />
          </div>
          <Textarea label="PLACEMENT RELEVANCE" value={form.placementRelevance} onChange={v => setForm(p => ({ ...p, placementRelevance: v }))}
            placeholder="Asked in nearly every technical interview across product and service companies." rows={2} />
          <Textarea label="INDUSTRY USAGE" value={form.industryUsage} onChange={v => setForm(p => ({ ...p, industryUsage: v }))}
            placeholder="Underpins process scheduling, memory management, and file systems in every real system." rows={2} />

          {/* Everything below renders on the subject's Overview tab. Leave it
              all empty and the subject opens straight on its roadmap, which is
              exactly how every subject behaved before this section existed. */}
          <div className="pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="font-mono text-[10px] tracking-widest mb-0.5" style={{ color: "#A78BFA" }}>SUBJECT INTRODUCTION</p>
            <p className="font-mono text-[10px] text-white/20 mb-2.5">Optional. Shown on the Overview tab before a student reaches the chapter list.</p>
          </div>
          <Textarea label="OVERVIEW (WHAT IS THIS SUBJECT?)" value={form.overview} onChange={v => setForm(p => ({ ...p, overview: v }))}
            placeholder={"## What Does An Operating System Actually Do?\n\n::: story\nPicture a restaurant at 8pm on a Saturday...\n:::"} rows={8} />
          <p className="font-mono text-[10px] text-white/20 -mt-1.5">Same lesson-block format as a topic body - ## headings, ::: story, ::: cards, ::: flow.</p>
          <StringListField label="WHY LEARN THIS" items={form.whyLearn} onChange={v => setForm(p => ({ ...p, whyLearn: v }))} />
          <StringListField label="WHERE IT'S USED" items={form.whereUsed} onChange={v => setForm(p => ({ ...p, whereUsed: v }))} />
          <StringListField label="SKILLS YOU'LL GAIN" items={form.skillsGained} onChange={v => setForm(p => ({ ...p, skillsGained: v }))} />
          <StringListField label="BEFORE YOU START (PREREQUISITES)" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input label="INTERVIEW IMPORTANCE (0-5)" type="number" value={form.interviewImportance}
              onChange={v => setForm(p => ({ ...p, interviewImportance: Math.max(0, Math.min(5, Number(v) || 0)) }))}
              hint="0 hides the stars. 5 = asked in almost every technical interview." />
          </div>
          <StringListField label="ASKED AT (COMPANIES)" items={form.topCompanies} onChange={v => setForm(p => ({ ...p, topCompanies: v }))} />
          <StringListField label="INTERVIEW QUESTIONS" items={form.interviewQuestions} onChange={v => setForm(p => ({ ...p, interviewQuestions: v }))} />

          <div className="flex items-center gap-3 pt-1">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS</p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published", "archived"]} className="w-40" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : subjects.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No subjects yet.</p>
      ) : (
        <div className="space-y-2">
          {subjects.map(s => {
            const SubjIcon = subjectIcon(s.name);
            return (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <SubjIcon size={18} className="flex-shrink-0" style={{ color: "#A78BFA" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <b className="font-mono text-xs text-white/80">{s.name}</b>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: s.status === "published" ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)", color: s.status === "published" ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
                    {s.status?.toUpperCase() || "DRAFT"}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/30">
                  {s.difficulty} · {s.estimatedDuration} · {s.topicCount || 0} topics
                  {/* Whether the Overview tab has anything behind it - the one
                      thing about a subject you can't tell from its name here. */}
                  {s.overview?.trim() ? " · intro" : " · no intro"}
                </span>
              </div>
              <button onClick={() => setManagingTopicsFor(s.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1 rounded" style={{ color: "#A78BFA" }}>
                <Layers size={11} /> Topics
              </button>
              <button onClick={() => startEdit(s)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FFD700" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2.5 py-1" style={{ color: "#FF5050" }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function blankCsCoreTopicForm() {
  return {
    title: "", module: "", order: 0, status: "draft",
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: [], prerequisites: [], concept: "", keyPoints: [],
    commonMistakes: [], interviewTips: [], realWorldApplications: [],
    codeExample: { language: "java", code: "" },
    mcqs: [], goingDeeper: "",
    assignment: "", xpReward: 25, coinReward: 10,
    practiceProblemIds: [],
  };
}

function CsCoreTopicsPanel({ subjectId, subjectName, onBack }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankCsCoreTopicForm());
  const [saving, setSaving] = useState(false);
  const [practiceIdsText, setPracticeIdsText] = useState("");

  const load = () => {
    setLoading(true);
    fetchCsCoreTopics(subjectId, { includeUnpublished: true }).then(setTopics).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [subjectId]);

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({ ...blankCsCoreTopicForm(), ...t });
    setPracticeIdsText((t.practiceProblemIds || []).join(", "));
    setAdding(false);
  };
  const startAdd = () => { setAdding(true); setEditingId(null); setForm(blankCsCoreTopicForm()); setPracticeIdsText(""); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const id = editingId || form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const practiceProblemIds = practiceIdsText.split(",").map(s => s.trim()).filter(Boolean);
      await saveCsCoreTopic(subjectId, id, { ...form, practiceProblemIds });
      await saveSubject(subjectId, { topicCount: (await fetchCsCoreTopics(subjectId, { includeUnpublished: true })).length });
      setEditingId(null); setAdding(false); setForm(blankCsCoreTopicForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic?")) return;
    await deleteCsCoreTopic(subjectId, id);
    await saveSubject(subjectId, { topicCount: Math.max(0, (topics.length - 1)) });
    load();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="font-mono text-xs text-white/40">&larr; Back to Subjects</button>
      <h4 className="font-mono text-sm" style={{ color: "#A78BFA" }}>{subjectName} - Topics ({topics.length})</h4>

      <button onClick={startAdd} className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded"
        style={{ background: "rgba(167,139,250,0.08)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}>
        <Plus size={12} /> Add Topic
      </button>

      {(adding || editingId) && (
        <div className="p-3 rounded space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="CPU Scheduling" />
            <Input label="MODULE (groups topics in the roadmap tree)" value={form.module} onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="Process Management" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input label="ORDER" type="number" value={form.order} onChange={v => setForm(p => ({ ...p, order: Number(v) || 0 }))} />
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">DIFFICULTY</p>
              <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={CS_CORE_DIFFICULTIES} className="w-full" />
            </div>
            <Input label="EST. MINUTES" type="number" value={form.estimatedMinutes} onChange={v => setForm(p => ({ ...p, estimatedMinutes: Number(v) || 0 }))} />
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] text-white/30 tracking-wider">STATUS (published = visible in roadmap; content below can still be empty = shows &quot;coming soon&quot;)</p>
            <Dropdown value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={["draft", "published", "archived"]} className="w-40" />
          </div>

          <StringListField label="WHAT YOU'LL LEARN" items={form.whatYoullLearn} onChange={v => setForm(p => ({ ...p, whatYoullLearn: v }))} />
          <StringListField label="PREREQUISITES" items={form.prerequisites} onChange={v => setForm(p => ({ ...p, prerequisites: v }))} />
          <LessonConceptField value={form.concept} onChange={v => setForm(p => ({ ...p, concept: v }))} />
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CODE EXAMPLE LANGUAGE</p>
              <Dropdown value={form.codeExample?.language || "java"} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, language: v } }))}
                options={CODELAB_LANGUAGES.map(l => l.id)} className="w-full" />
            </div>
          </div>
          <Textarea label="CODE EXAMPLE" value={form.codeExample?.code || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, code: v } }))} rows={5} />
          <Textarea label="EXPECTED OUTPUT (shown if live Run is ever unavailable - optional but recommended)"
            value={form.codeExample?.expectedOutput || ""} onChange={v => setForm(p => ({ ...p, codeExample: { ...p.codeExample, expectedOutput: v } }))} rows={2} />
          <StringListField label="KEY POINTS" items={form.keyPoints} onChange={v => setForm(p => ({ ...p, keyPoints: v }))} />
          <StringListField label="COMMON MISTAKES" items={form.commonMistakes} onChange={v => setForm(p => ({ ...p, commonMistakes: v }))} />
          <StringListField label="INTERVIEW TIPS" items={form.interviewTips} onChange={v => setForm(p => ({ ...p, interviewTips: v }))} />
          <StringListField label="REAL-WORLD APPLICATIONS" items={form.realWorldApplications} onChange={v => setForm(p => ({ ...p, realWorldApplications: v }))} />
          <McqListField items={form.mcqs} onChange={v => setForm(p => ({ ...p, mcqs: v }))} />
          <Textarea label="GOING DEEPER (optional - advanced-learner content, shown collapsed below the main lesson)"
            value={form.goingDeeper} onChange={v => setForm(p => ({ ...p, goingDeeper: v }))} rows={4}
            placeholder="Denser, more technical detail for students who want to go beyond the beginner explanation above." />
          <Textarea label="ASSIGNMENT" value={form.assignment} onChange={v => setForm(p => ({ ...p, assignment: v }))} rows={2} />
          <Input label="PRACTICE PROBLEM IDS (comma-separated CodeLab problem IDs)" value={practiceIdsText} onChange={setPracticeIdsText} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="XP REWARD" type="number" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: Number(v) || 0 }))} />
            <Input label="COIN REWARD" type="number" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: Number(v) || 0 }))} />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="font-mono text-xs px-3 py-1.5 rounded disabled:opacity-50" style={{ background: "#00FF41", color: "#000" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setEditingId(null); setAdding(false); }} className="font-mono text-xs px-3 py-1.5 text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-white/30">Loading...</p>
      ) : topics.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No topics yet.</p>
      ) : (
        <div className="space-y-1.5">
          {topics.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2.5 rounded flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="font-mono text-[10px] text-white/20 w-8 flex-shrink-0">#{t.order}</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-white/80">{t.title}</span>
                <span className="font-mono text-[10px] text-white/30 ml-2">{t.module}</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: t.status === "published" ? "rgba(0,255,65,0.1)" : "rgba(255,255,255,0.08)", color: t.status === "published" ? "#00FF41" : "rgba(255,255,255,0.4)" }}>
                {t.status?.toUpperCase() || "DRAFT"}
              </span>
              {!(t.concept?.trim() || t.keyPoints?.length) && (
                <span className="font-mono text-[10px]" style={{ color: "#FF9500" }}>NO CONTENT</span>
              )}
              <button onClick={() => startEdit(t)} className="flex items-center gap-1 font-mono text-[10.5px] px-2 py-1" style={{ color: "#FFD700" }}>
                <Pencil size={11} /> Edit
              </button>
              <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1 font-mono text-[10.5px] px-2 py-1" style={{ color: "#FF5050" }}>
                <Trash2 size={11} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyPrepPanel() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [form, setForm] = useState(blankCompanyPrepForm());
  const [roadmapDays, setRoadmapDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);
  const [rowFeedback, setRowFeedback] = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "companies"), orderBy("order", "asc")))
      .then(snap => setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAddCompany = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setFormFeedback(null);
    try {
      await addDoc(collection(db, "companies"), {
        name: form.name.trim(),
        logo: form.logo.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
        eligibility: form.eligibility.trim(),
        ctc: form.ctc.trim(),
        hiringOverview: form.hiringOverview.trim(),
        difficulty: form.difficulty,
        resources: parseResourcesText(form.resources),
        prepRoadmap: roadmapDays.map(d => ({ day: d.day, title: d.title.trim(), focus: d.focus.trim(), tasks: d.tasksText.split("\n").map(t => t.trim()).filter(Boolean) })).filter(d => d.title),
        status: "draft",
        order: companies.length,
        createdAt: serverTimestamp(),
      });
      const name = form.name.trim();
      setForm(blankCompanyPrepForm());
      setRoadmapDays([]);
      setFormFeedback({ type: "success", text: `"${name}" added as a draft - publish it from the row below once its rounds/questions are ready.` });
      logAdminActivity("added company prep entry", name);
      load();
    } catch (e) {
      console.error(e);
      setFormFeedback({ type: "error", text: e.message || "Failed to add company - check console." });
    } finally { setSaving(false); }
  };

  const handleDeleteCompany = async (companyId, name) => {
    if (!confirm(`Delete "${name}" and every round/category/question under it? This can't be undone.`)) return;
    setRowFeedback(p => ({ ...p, [companyId]: null }));
    try {
      await deleteCompanyCascade(companyId);
      if (expandedCompany === companyId) setExpandedCompany(null);
      load();
    } catch (e) {
      console.error(e);
      setRowFeedback(p => ({ ...p, [companyId]: { type: "error", text: e.message || "Failed to delete - check console." } }));
    }
  };

  const handleTogglePublish = async (company) => {
    const next = company.status === "published" ? "draft" : "published";
    setRowFeedback(p => ({ ...p, [company.id]: null }));
    try {
      await updateDoc(doc(db, "companies", company.id), { status: next });
      logAdminActivity(next === "published" ? "published company prep entry" : "unpublished company prep entry", company.name);
      setRowFeedback(p => ({ ...p, [company.id]: { type: "success", text: next === "published" ? "Published - visible to students now." : "Unpublished - hidden from students." } }));
      load();
    } catch (e) {
      console.error(e);
      setRowFeedback(p => ({ ...p, [company.id]: { type: "error", text: e.message || "Failed to update status - check console." } }));
    }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] text-white/18">
        Company -&gt; Round -&gt; Category -&gt; Question. Drafts (and everything nested under them) stay admin-only until published.
      </p>

      {companies.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no companies yet</p>}

      <div className="space-y-2">
        {companies.map(company => (
          <CompanyPrepRow key={company.id} company={company}
            expanded={expandedCompany === company.id}
            onToggle={() => setExpandedCompany(p => (p === company.id ? null : company.id))}
            onDelete={() => handleDeleteCompany(company.id, company.name)}
            onTogglePublish={() => handleTogglePublish(company)}
            feedback={rowFeedback[company.id]} />
        ))}
      </div>

      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// add company</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="COMPANY NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Cognizant" />
          <Input label="LOGO URL (optional)" value={form.logo} onChange={v => setForm(p => ({ ...p, logo: v }))} placeholder="https://..." />
        </div>
        <Textarea label="DESCRIPTION" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} rows={2} placeholder="Fortune 500 IT services company, founded 1994..." />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="WEBSITE" value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} placeholder="https://cognizant.com" />
          <Input label="TYPICAL CTC" value={form.ctc} onChange={v => setForm(p => ({ ...p, ctc: v }))} placeholder="4.0 - 6.75 LPA" />
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
            <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
              options={COMPANY_QUESTION_DIFFICULTIES} className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
          </div>
        </div>
        <Textarea label="ELIGIBILITY" value={form.eligibility} onChange={v => setForm(p => ({ ...p, eligibility: v }))} rows={2} placeholder="60% or 6 CGPA across all stages, no standing backlogs, max 2-year gap..." />
        <Textarea label="HIRING PROCESS OVERVIEW" value={form.hiringOverview} onChange={v => setForm(p => ({ ...p, hiringOverview: v }))} rows={3} placeholder="Communication Assessment -> Aptitude -> Technical -> HR Interview..." />
        <Textarea label="RESOURCES (one per line: Title | URL | Type - Type optional, e.g. pdf/video/article)"
          value={form.resources} onChange={v => setForm(p => ({ ...p, resources: v }))} rows={2}
          placeholder="Company Prep Sheet | https://... | pdf" />

        <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2.5">
          <p className="font-mono text-[9px] text-neon-purple tracking-wider">PREP ROADMAP (optional, day-by-day)</p>
          {roadmapDays.map((d, i) => (
            <div key={i} className="border border-white/8 rounded p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/40">DAY {d.day}</span>
                <button onClick={() => setRoadmapDays(days => days.filter((_, j) => j !== i))} className="text-white/25 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
              </div>
              <Input label="TITLE" value={d.title} onChange={v => setRoadmapDays(days => days.map((day, j) => j === i ? { ...day, title: v } : day))} placeholder="Java + Spring Boot Revision" />
              <Textarea label="FOCUS (one-line summary, optional)" value={d.focus} onChange={v => setRoadmapDays(days => days.map((day, j) => j === i ? { ...day, focus: v } : day))} rows={1} />
              <Textarea label="TASKS (one per line)" value={d.tasksText} onChange={v => setRoadmapDays(days => days.map((day, j) => j === i ? { ...day, tasksText: v } : day))} rows={3}
                placeholder={"Revise OOP + Collections\nSolve 5 REST API questions\nMock interview practice"} />
            </div>
          ))}
          <button onClick={() => setRoadmapDays(days => [...days, blankRoadmapDay(days.length + 1)])}
            className="w-full font-mono text-[10px] py-1.5 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors rounded">
            <Plus size={11} className="inline mr-1" /> add day
          </button>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddCompany} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
          <Plus size={12} className="inline mr-1" /> {saving ? "adding..." : "add company"}
        </motion.button>
        {formFeedback && (
          <p className="font-mono text-[10px]" style={{ color: formFeedback.type === "success" ? "#00FF41" : "#FF5050" }}>
            {formFeedback.text}
          </p>
        )}
      </div>
    </div>
  );
}

function CompanyPrepRow({ company, expanded, onToggle, onDelete, onTogglePublish, feedback }) {
  const [rounds, setRounds] = useState(null);
  const [expandedRound, setExpandedRound] = useState(null);
  const [roundForm, setRoundForm] = useState(blankRoundForm());
  const [savingRound, setSavingRound] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState(null);

  const loadRounds = () => {
    getDocs(query(collection(db, "companies", company.id, "rounds"), orderBy("order", "asc")))
      .then(snap => setRounds(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error);
  };
  useEffect(() => { if (expanded && rounds === null) loadRounds(); }, [expanded]);

  const handleAddRound = async () => {
    if (!roundForm.name.trim()) return;
    setSavingRound(true);
    setRoundFeedback(null);
    try {
      await addDoc(collection(db, "companies", company.id, "rounds"), {
        name: roundForm.name.trim(),
        description: roundForm.description.trim(),
        duration: roundForm.duration.trim(),
        passingMarks: roundForm.passingMarks.trim(),
        instructions: roundForm.instructions.trim(),
        whatTheyEvaluate: roundForm.whatTheyEvaluate.trim(),
        format: roundForm.format.trim(),
        eliminationCriteria: roundForm.eliminationCriteria.trim(),
        prepStrategy: roundForm.prepStrategy.trim(),
        commonMistakes: roundForm.commonMistakes.trim(),
        order: (rounds || []).length,
        createdAt: serverTimestamp(),
      });
      const name = roundForm.name.trim();
      setRoundForm(blankRoundForm());
      setRoundFeedback({ type: "success", text: `"${name}" round added.` });
      loadRounds();
    } catch (e) {
      console.error(e);
      setRoundFeedback({ type: "error", text: e.message || "Failed to add round - check console." });
    } finally { setSavingRound(false); }
  };

  const handleDeleteRound = async (roundId, name) => {
    if (!confirm(`Delete round "${name}" and every category/question under it?`)) return;
    setRoundFeedback(null);
    try {
      await deleteCompanyRoundCascade(company.id, roundId);
      if (expandedRound === roundId) setExpandedRound(null);
      loadRounds();
    } catch (e) {
      console.error(e);
      setRoundFeedback({ type: "error", text: e.message || "Failed to delete round - check console." });
    }
  };

  return (
    <div className="border border-white/8 rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/2 transition-colors text-left">
        <Briefcase size={13} className="text-neon-cyan/60 flex-shrink-0" />
        <span className="font-sans text-sm text-white/80 flex-1 truncate">{company.name}</span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0" style={{
          color: company.status === "published" ? "#00FF41" : "#FF9500",
          borderColor: company.status === "published" ? "rgba(0,255,65,0.3)" : "rgba(255,149,0,0.3)",
        }}>{(company.status || "draft").toUpperCase()}</span>
        <button onClick={(e) => { e.stopPropagation(); onTogglePublish(); }}
          className="font-mono text-[9px] text-white/30 hover:text-neon-cyan transition-colors flex-shrink-0">
          {company.status === "published" ? "unpublish" : "publish"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={12} /></button>
        {expanded ? <ChevronUp size={12} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={12} className="text-white/30 flex-shrink-0" />}
      </button>

      {feedback && (
        <p className="font-mono text-[10px] px-4 pb-2" style={{ color: feedback.type === "success" ? "#00FF41" : "#FF5050" }}>
          {feedback.text}
        </p>
      )}

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
          {rounds === null ? (
            <p className="font-mono text-[10px] text-white/20">loading rounds...</p>
          ) : (
            <>
              {rounds.length === 0 && <p className="font-mono text-[10px] text-white/20">no rounds yet</p>}
              {rounds.map(round => (
                <CompanyPrepRoundRow key={round.id} companyId={company.id} round={round}
                  expanded={expandedRound === round.id}
                  onToggle={() => setExpandedRound(p => (p === round.id ? null : round.id))}
                  onDelete={() => handleDeleteRound(round.id, round.name)} />
              ))}

              <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
                <p className="font-mono text-[9px] text-neon-green tracking-wider">+ add round</p>
                <Input label="ROUND NAME" value={roundForm.name} onChange={v => setRoundForm(p => ({ ...p, name: v }))} placeholder="Technical Assessment" />
                <Textarea label="DESCRIPTION" value={roundForm.description} onChange={v => setRoundForm(p => ({ ...p, description: v }))} rows={2} placeholder="Cluster-based test on CS fundamentals..." />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="DURATION" value={roundForm.duration} onChange={v => setRoundForm(p => ({ ...p, duration: v }))} placeholder="60 minutes" />
                  <Input label="PASSING MARKS (optional)" value={roundForm.passingMarks} onChange={v => setRoundForm(p => ({ ...p, passingMarks: v }))} placeholder="60%" />
                </div>
                <Textarea label="INSTRUCTIONS (optional)" value={roundForm.instructions} onChange={v => setRoundForm(p => ({ ...p, instructions: v }))} rows={2} placeholder="No negative marking..." />
                <Textarea label="WHAT THEY EVALUATE (optional)" value={roundForm.whatTheyEvaluate} onChange={v => setRoundForm(p => ({ ...p, whatTheyEvaluate: v }))} rows={2} placeholder="Logical thinking, code correctness under time pressure..." />
                <Textarea label="FORMAT (optional)" value={roundForm.format} onChange={v => setRoundForm(p => ({ ...p, format: v }))} rows={2} placeholder="2 coding questions, 60 minutes, any language..." />
                <Textarea label="ELIMINATION CRITERIA (optional)" value={roundForm.eliminationCriteria} onChange={v => setRoundForm(p => ({ ...p, eliminationCriteria: v }))} rows={2} placeholder="Must pass at least 1 of 2 questions to advance..." />
                <Textarea label="HOW TO PREPARE (optional)" value={roundForm.prepStrategy} onChange={v => setRoundForm(p => ({ ...p, prepStrategy: v }))} rows={2} placeholder="Practice medium-difficulty array/string problems..." />
                <Textarea label="COMMON MISTAKES (optional)" value={roundForm.commonMistakes} onChange={v => setRoundForm(p => ({ ...p, commonMistakes: v }))} rows={2} placeholder="Not asking clarifying questions before coding..." />
                <button onClick={handleAddRound} disabled={savingRound}
                  className="w-full font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                  {savingRound ? "saving..." : "add round"}
                </button>
                {roundFeedback && (
                  <p className="font-mono text-[10px]" style={{ color: roundFeedback.type === "success" ? "#00FF41" : "#FF5050" }}>
                    {roundFeedback.text}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/6">
                <p className="font-mono text-[9px] text-blue-400/70 tracking-wider mb-2">INTERVIEW EXPERIENCES</p>
                <CompanyInterviewExperiencesEditor companyId={company.id} />
              </div>
              <div className="pt-2 border-t border-white/6">
                <p className="font-mono text-[9px] text-yellow-400/70 tracking-wider mb-2">MOCK INTERVIEWS</p>
                <CompanyMockInterviewsEditor companyId={company.id} rounds={rounds || []} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Admin-curated interview experiences (see lib/companyPrep.js's header
// comment - genuine student submission is a real follow-up feature, not
// this pass). Flat add/list/delete, matching the category-add simplicity
// elsewhere in this panel.
function CompanyInterviewExperiencesEditor({ companyId }) {
  const [experiences, setExperiences] = useState(null);
  const [form, setForm] = useState(blankInterviewExperienceForm());
  const [saving, setSaving] = useState(false);

  const experiencesRef = collection(db, "companies", companyId, "interviewExperiences");
  const load = () => {
    getDocs(query(experiencesRef, orderBy("order", "asc"))).then(snap => setExperiences(snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(console.error);
  };
  useEffect(() => { load(); }, [companyId]);

  const handleAdd = async () => {
    if (!form.tips.trim() && !form.questionsAsked.trim()) return;
    setSaving(true);
    try {
      await addDoc(experiencesRef, { ...form, order: (experiences || []).length, submittedAt: serverTimestamp() });
      setForm(blankInterviewExperienceForm());
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => { await deleteDoc(doc(experiencesRef, id)); load(); };

  return (
    <div className="space-y-2">
      {(experiences || []).map(e => (
        <div key={e.id} className="flex items-center gap-2 border border-white/6 rounded px-2 py-1.5">
          <span className="font-mono text-[11px] text-white/60 flex-1 truncate">{e.studentName || "Anonymous"} - {e.role || "?"}</span>
          <button onClick={() => handleDelete(e.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={10} /></button>
        </div>
      ))}
      <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="STUDENT NAME (optional)" value={form.studentName} onChange={v => setForm(p => ({ ...p, studentName: v }))} />
          <Input label="YEAR" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} placeholder="2026" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input label="ROLE" value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))} placeholder="Software Engineer Trainee" />
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
            <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))} options={COMPANY_QUESTION_DIFFICULTIES} className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
          </div>
        </div>
        <Textarea label="ROUNDS FACED" value={form.roundsFaced} onChange={v => setForm(p => ({ ...p, roundsFaced: v }))} rows={2} placeholder="Technical screening, coding round, HR" />
        <Textarea label="QUESTIONS ASKED" value={form.questionsAsked} onChange={v => setForm(p => ({ ...p, questionsAsked: v }))} rows={2} />
        <Textarea label="TIPS" value={form.tips} onChange={v => setForm(p => ({ ...p, tips: v }))} rows={2} />
        <button onClick={handleAdd} disabled={saving} className="w-full font-mono text-xs py-2 text-neon-blue border border-blue-400/30 hover:bg-blue-400/8 transition-colors disabled:opacity-50 rounded">
          {saving ? "saving..." : "add experience"}
        </button>
      </div>
    </div>
  );
}

// Mock interview configs - references existing (roundId, categoryId) pairs
// (checkbox multi-select below), pulling their real questions live at
// runtime (see fetchMockInterviewQuestions) rather than duplicating them.
function CompanyMockInterviewsEditor({ companyId, rounds }) {
  const [mockInterviews, setMockInterviews] = useState(null);
  const [categoriesByRound, setCategoriesByRound] = useState({});
  const [form, setForm] = useState(blankMockInterviewForm());
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [saving, setSaving] = useState(false);

  const mockRef = collection(db, "companies", companyId, "mockInterviews");
  const load = () => {
    getDocs(query(mockRef, orderBy("order", "asc"))).then(snap => setMockInterviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))).catch(console.error);
  };
  useEffect(() => { load(); }, [companyId]);

  useEffect(() => {
    Promise.all((rounds || []).map(r =>
      getDocs(query(collection(db, "companies", companyId, "rounds", r.id, "categories"), orderBy("order", "asc")))
        .then(snap => [r.id, snap.docs.map(d => ({ id: d.id, ...d.data() }))])
    )).then(pairs => setCategoriesByRound(Object.fromEntries(pairs))).catch(console.error);
  }, [companyId, rounds]);

  const toggleRef = (roundId, categoryId) => {
    setSelectedRefs(prev => {
      const key = `${roundId}_${categoryId}`;
      const exists = prev.some(r => `${r.roundId}_${r.categoryId}` === key);
      return exists ? prev.filter(r => `${r.roundId}_${r.categoryId}` !== key) : [...prev, { roundId, categoryId }];
    });
  };

  const handleAdd = async () => {
    if (!form.name.trim() || selectedRefs.length === 0) return;
    setSaving(true);
    try {
      await addDoc(mockRef, {
        name: form.name.trim(), type: form.type, timeLimitMinutes: Number(form.timeLimitMinutes) || 30,
        categoryRefs: selectedRefs, order: (mockInterviews || []).length, createdAt: serverTimestamp(),
      });
      setForm(blankMockInterviewForm());
      setSelectedRefs([]);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };
  const handleDelete = async (id) => { await deleteDoc(doc(mockRef, id)); load(); };

  return (
    <div className="space-y-2">
      {(mockInterviews || []).map(m => (
        <div key={m.id} className="flex items-center gap-2 border border-white/6 rounded px-2 py-1.5">
          <span className="font-mono text-[11px] text-white/60 flex-1 truncate">{m.name} ({m.type}, {m.timeLimitMinutes}m, {m.categoryRefs?.length || 0} categories)</span>
          <button onClick={() => handleDelete(m.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={10} /></button>
        </div>
      ))}
      <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input label="NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Full Technical Mock" />
          <Input label="TIME LIMIT (minutes)" type="number" value={form.timeLimitMinutes} onChange={v => setForm(p => ({ ...p, timeLimitMinutes: v }))} />
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">TYPE</p>
          <Dropdown value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={["technical", "hr", "coding"]} className="w-full"
            buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
        </div>
        <p className="font-mono text-[10px] text-white/28 tracking-widest">CATEGORIES TO INCLUDE</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(rounds || []).map(r => (
            <div key={r.id}>
              <p className="font-mono text-[9px] text-white/30 mt-1">{r.name}</p>
              {(categoriesByRound[r.id] || []).map(c => {
                const checked = selectedRefs.some(ref => ref.roundId === r.id && ref.categoryId === c.id);
                return (
                  <button key={c.id} onClick={() => toggleRef(r.id, c.id)} className="w-full flex items-center gap-2 px-2 py-1 text-left">
                    <span className="w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center" style={{ border: `1px solid ${checked ? "#00FF41" : "rgba(255,255,255,0.2)"}`, background: checked ? "#00FF41" : "transparent" }}>
                      {checked && <Check size={9} className="text-black" />}
                    </span>
                    <span className="font-mono text-[10.5px] text-white/60">{c.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={handleAdd} disabled={saving || selectedRefs.length === 0} className="w-full font-mono text-xs py-2 text-neon-yellow border border-yellow-400/30 hover:bg-yellow-400/8 transition-colors disabled:opacity-50 rounded">
          {saving ? "saving..." : "add mock interview"}
        </button>
      </div>
    </div>
  );
}

function CompanyPrepRoundRow({ companyId, round, expanded, onToggle, onDelete }) {
  const [categories, setCategories] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(blankCategoryForm());
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState(null);

  const loadCategories = () => {
    getDocs(query(collection(db, "companies", companyId, "rounds", round.id, "categories"), orderBy("order", "asc")))
      .then(snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error);
  };
  useEffect(() => { if (expanded && categories === null) loadCategories(); }, [expanded]);

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSavingCategory(true);
    setCategoryFeedback(null);
    try {
      await addDoc(collection(db, "companies", companyId, "rounds", round.id, "categories"), {
        name: categoryForm.name.trim(), order: (categories || []).length, createdAt: serverTimestamp(),
      });
      const name = categoryForm.name.trim();
      setCategoryForm(blankCategoryForm());
      setCategoryFeedback({ type: "success", text: `"${name}" category added.` });
      loadCategories();
    } catch (e) {
      console.error(e);
      setCategoryFeedback({ type: "error", text: e.message || "Failed to add category - check console." });
    } finally { setSavingCategory(false); }
  };

  const handleDeleteCategory = async (categoryId, name) => {
    if (!confirm(`Delete category "${name}" and all its questions?`)) return;
    setCategoryFeedback(null);
    try {
      await deleteCompanyCategoryCascade(companyId, round.id, categoryId);
      if (expandedCategory === categoryId) setExpandedCategory(null);
      loadCategories();
    } catch (e) {
      console.error(e);
      setCategoryFeedback({ type: "error", text: e.message || "Failed to delete category - check console." });
    }
  };

  return (
    <div className="border border-white/6 rounded overflow-hidden ml-2">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/2 transition-colors text-left">
        <ClipboardList size={12} className="text-neon-purple/60 flex-shrink-0" />
        <span className="font-mono text-xs text-white/70 flex-1 truncate">{round.name}</span>
        {round.duration && <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{round.duration}</span>}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={11} /></button>
        {expanded ? <ChevronUp size={11} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={11} className="text-white/30 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/6 pt-2">
          {categories === null ? (
            <p className="font-mono text-[10px] text-white/20">loading categories...</p>
          ) : (
            <>
              {categories.length === 0 && <p className="font-mono text-[10px] text-white/20">no categories yet</p>}
              {categories.map(category => (
                <CompanyPrepCategoryRow key={category.id} companyId={companyId} roundId={round.id} category={category}
                  expanded={expandedCategory === category.id}
                  onToggle={() => setExpandedCategory(p => (p === category.id ? null : category.id))}
                  onDelete={() => handleDeleteCategory(category.id, category.name)} />
              ))}

              <div className="flex items-center gap-2">
                <input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })}
                  placeholder="+ new category name (e.g. OOP)"
                  className="flex-1 font-mono text-[11px] text-white/70 px-2 py-1.5 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                <button onClick={handleAddCategory} disabled={savingCategory}
                  className="font-mono text-[10px] text-neon-green border border-neon-green/30 px-3 py-1.5 rounded hover:bg-neon-green/8 transition-colors disabled:opacity-50 flex-shrink-0">
                  {savingCategory ? "..." : "add"}
                </button>
              </div>
              {categoryFeedback && (
                <p className="font-mono text-[10px]" style={{ color: categoryFeedback.type === "success" ? "#00FF41" : "#FF5050" }}>
                  {categoryFeedback.text}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyPrepCategoryRow({ companyId, roundId, category, expanded, onToggle, onDelete }) {
  const [questions, setQuestions] = useState(null);
  const [qForm, setQForm] = useState(blankCompanyQuestionForm());
  const [savingQ, setSavingQ] = useState(false);
  const [qFeedback, setQFeedback] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [editingLesson, setEditingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState(() => ({ ...blankCategoryLessonForm(), ...category }));
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonFeedback, setLessonFeedback] = useState(null);

  const questionsRef = collection(db, "companies", companyId, "rounds", roundId, "categories", category.id, "questions");
  const categoryRef = doc(db, "companies", companyId, "rounds", roundId, "categories", category.id);

  const handleSaveLesson = async () => {
    setSavingLesson(true);
    setLessonFeedback(null);
    try {
      await setDoc(categoryRef, {
        whatYoullLearn: lessonForm.whatYoullLearn, concept: lessonForm.concept.trim(),
        keyPoints: lessonForm.keyPoints, commonMistakes: lessonForm.commonMistakes, interviewTips: lessonForm.interviewTips,
      }, { merge: true });
      setLessonFeedback({ type: "success", text: "Lesson content saved." });
    } catch (e) {
      console.error(e);
      setLessonFeedback({ type: "error", text: e.message || "Failed to save - check console." });
    } finally { setSavingLesson(false); }
  };

  const loadQuestions = () => {
    getDocs(query(questionsRef, orderBy("order", "asc")))
      .then(snap => setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error);
  };
  useEffect(() => { if (expanded && questions === null) loadQuestions(); }, [expanded]);

  const handleAddQuestion = async () => {
    // correctIndex must land on the FILTERED (non-blank) options array, not
    // the raw 4-slot form - a blank middle option would otherwise desync
    // which option "correct" actually points at.
    const trimmedOptions = qForm.options.map(o => o.trim());
    const filledCount = trimmedOptions.filter(Boolean).length;
    if (!qForm.question.trim() || filledCount < 2 || !trimmedOptions[qForm.correctIndex]) {
      setQFeedback({ type: "error", text: "Need a question, at least 2 filled options, and the correct-answer dot on a filled option." });
      return;
    }
    setSavingQ(true);
    setQFeedback(null);
    try {
      const options = trimmedOptions.filter(Boolean);
      const correctIndex = trimmedOptions.slice(0, qForm.correctIndex).filter(Boolean).length;
      await addDoc(questionsRef, {
        question: qForm.question.trim(),
        options,
        correctIndex,
        difficulty: qForm.difficulty,
        marks: qForm.marks.trim() ? parseFloat(qForm.marks) : 1,
        explanation: qForm.explanation.trim(),
        tags: qForm.tags.split(",").map(t => t.trim()).filter(Boolean),
        attemptCount: 0, correctCount: 0, totalTimeSec: 0,
        order: (questions || []).length, createdAt: serverTimestamp(),
      });
      setQForm(blankCompanyQuestionForm());
      setQFeedback({ type: "success", text: "Question added." });
      loadQuestions();
    } catch (e) {
      console.error(e);
      setQFeedback({ type: "error", text: e.message || "Failed to add question - check console." });
    } finally { setSavingQ(false); }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Delete this question?")) return;
    setQFeedback(null);
    try {
      await deleteDoc(doc(questionsRef, questionId));
      loadQuestions();
    } catch (e) {
      console.error(e);
      setQFeedback({ type: "error", text: e.message || "Failed to delete question - check console." });
    }
  };

  const handleImportCsv = async () => {
    const { questions: parsed, errors } = csvRowsToCompanyQuestions(parseCSV(csvText));
    if (parsed.length === 0) { setCsvResult({ imported: 0, errors }); return; }
    setImporting(true);
    try {
      const startOrder = (questions || []).length;
      for (let i = 0; i < parsed.length; i += 400) {
        const chunk = parsed.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((q, idx) => {
          const ref = doc(questionsRef);
          batch.set(ref, { ...q, order: startOrder + i + idx, createdAt: serverTimestamp() });
        });
        await batch.commit();
      }
      logAdminActivity("bulk imported company prep questions", `${parsed.length} question(s) into ${category.name}`);
      setCsvResult({ imported: parsed.length, errors });
      setCsvText("");
      loadQuestions();
    } catch (e) { console.error(e); setCsvResult({ imported: 0, errors: [...errors, "Import failed - check console."] }); }
    finally { setImporting(false); }
  };

  return (
    <div className="border border-white/6 rounded overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/2 transition-colors text-left">
        <ListChecks size={11} className="text-neon-cyan/50 flex-shrink-0" />
        <span className="font-mono text-[11px] text-white/65 flex-1 truncate">{category.name}</span>
        <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{(questions || []).length || ""}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={10} /></button>
        {expanded ? <ChevronUp size={10} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={10} className="text-white/30 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/6 pt-2">
          <button onClick={() => setEditingLesson(o => !o)}
            className="font-mono text-[10px] text-neon-cyan/70 hover:text-neon-cyan transition-colors">
            {editingLesson ? "hide lesson content editor" : (category.concept?.trim() ? "edit lesson content" : "+ add lesson content (turns this category into a topic)")}
          </button>
          {editingLesson && (
            <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2.5">
              <StringListField label="WHAT YOU'LL LEARN" items={lessonForm.whatYoullLearn} onChange={v => setLessonForm(p => ({ ...p, whatYoullLearn: v }))} />
              <LessonConceptField value={lessonForm.concept} onChange={v => setLessonForm(p => ({ ...p, concept: v }))} rows={12} />
              <StringListField label="KEY POINTS" items={lessonForm.keyPoints} onChange={v => setLessonForm(p => ({ ...p, keyPoints: v }))} />
              <StringListField label="COMMON MISTAKES" items={lessonForm.commonMistakes} onChange={v => setLessonForm(p => ({ ...p, commonMistakes: v }))} />
              <StringListField label="INTERVIEW TIPS" items={lessonForm.interviewTips} onChange={v => setLessonForm(p => ({ ...p, interviewTips: v }))} />
              <button onClick={handleSaveLesson} disabled={savingLesson}
                className="w-full font-mono text-xs py-2 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors disabled:opacity-50 rounded">
                {savingLesson ? "saving..." : "save lesson content"}
              </button>
              {lessonFeedback && (
                <p className="font-mono text-[10px]" style={{ color: lessonFeedback.type === "success" ? "#00FF41" : "#FF5050" }}>{lessonFeedback.text}</p>
              )}
            </div>
          )}
          {questions === null ? (
            <p className="font-mono text-[10px] text-white/20">loading questions...</p>
          ) : (
            <>
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-2 border border-white/6 rounded px-2 py-1.5">
                  <span className="font-mono text-[9px] text-white/25 w-5 flex-shrink-0">{i + 1}</span>
                  <span className="font-mono text-[11px] text-white/60 flex-1 truncate">{q.question}</span>
                  <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded flex-shrink-0">{q.difficulty}</span>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={10} /></button>
                </div>
              ))}

              {/* Manual add */}
              <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2">
                <p className="font-mono text-[9px] text-neon-green tracking-wider">+ add question manually</p>
                <Textarea label="QUESTION" value={qForm.question} onChange={v => setQForm(p => ({ ...p, question: v }))} rows={2} placeholder="What is encapsulation?" />
                {qForm.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button onClick={() => setQForm(p => ({ ...p, correctIndex: oi }))}
                      className="w-4 h-4 rounded-full border flex-shrink-0 transition-colors"
                      style={{ borderColor: qForm.correctIndex === oi ? "#00FF41" : "rgba(255,255,255,0.2)", background: qForm.correctIndex === oi ? "#00FF41" : "transparent" }} />
                    <input value={opt} onChange={e => setQForm(p => ({ ...p, options: p.options.map((o, idx) => (idx === oi ? e.target.value : o)) }))}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      className="flex-1 font-mono text-[11px] text-white/70 px-2 py-1 rounded outline-none"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                ))}
                <Textarea label="EXPLANATION (optional)" value={qForm.explanation} onChange={v => setQForm(p => ({ ...p, explanation: v }))} rows={2} placeholder="Why the correct answer is right..." />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
                    <Dropdown value={qForm.difficulty} onChange={v => setQForm(p => ({ ...p, difficulty: v }))}
                      options={COMPANY_QUESTION_DIFFICULTIES} className="w-full"
                      buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
                  </div>
                  <Input label="MARKS" type="number" value={qForm.marks} onChange={v => setQForm(p => ({ ...p, marks: v }))} placeholder="1" />
                  <Input label="TAGS (comma sep.)" value={qForm.tags} onChange={v => setQForm(p => ({ ...p, tags: v }))} placeholder="Idioms, Vocabulary" />
                </div>
                <button onClick={handleAddQuestion} disabled={savingQ}
                  className="w-full font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                  {savingQ ? "saving..." : "add question"}
                </button>
                {qFeedback && (
                  <p className="font-mono text-[10px]" style={{ color: qFeedback.type === "success" ? "#00FF41" : "#FF5050" }}>
                    {qFeedback.text}
                  </p>
                )}
              </div>

              {/* CSV bulk import */}
              <div className="border border-dashed border-neon-purple/25 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] text-neon-purple tracking-wider">+ bulk import from CSV</p>
                  <button onClick={downloadCompanyQuestionCsvTemplate}
                    className="flex items-center gap-1 font-mono text-[9px] text-white/40 hover:text-neon-purple transition-colors">
                    <Download size={10} /> download template
                  </button>
                </div>
                <pre className="font-mono text-[9px] text-white/25 whitespace-pre-wrap leading-relaxed">{COMPANY_QUESTION_CSV_HELP}</pre>
                <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={5}
                  placeholder="question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,marks,explanation,tags"
                  className="w-full font-mono text-[11px] text-white/70 px-3 py-2 rounded outline-none"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(199,125,255,0.2)" }} />
                {csvResult && (
                  <p className="font-mono text-[10px]" style={{ color: csvResult.imported > 0 ? "#00FF41" : "#FF5050" }}>
                    {csvResult.imported > 0 && `imported ${csvResult.imported} question(s). `}
                    {csvResult.errors.length > 0 && `${csvResult.errors.length} row(s) skipped: ${csvResult.errors.slice(0, 3).join(" ")}`}
                  </p>
                )}
                <button onClick={handleImportCsv} disabled={importing || !csvText.trim()}
                  className="w-full font-mono text-xs py-2 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors disabled:opacity-50">
                  {importing ? "importing..." : "import CSV"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Contest Platform panel ────────────────────────────────────────────────────
// CONTEST_STATUSES/blankContestForm/blankContestQuestionForm/CONTEST_CSV_*/
// downloadContestCsvTemplate/csvRowsToContestQuestions all live in
// lib/contests.js now, shared with Campus's own Contest Studio
// (components/campus/campus-contest-studio.jsx).

function ContestsPanel() {
  const [contests, setContests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [cQuestions, setCQuestions] = useState({});
  const [registrations, setRegistrations] = useState({});
  const [announcements, setAnnouncements] = useState({});
  const [announcementText, setAnnouncementText] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const [form, setForm] = useState(blankContestForm());
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const [qForm, setQForm] = useState(blankContestQuestionForm());
  const [savingQ, setSavingQ] = useState(false);

  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "contests"), orderBy("createdAt", "desc")))
      .then(snap => setContests(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const stats = {
    total: contests.length,
    live: contests.filter(c => contestPhase(c) === "live").length,
    upcoming: contests.filter(c => c.status === "published" && contestPhase(c) === "upcoming").length,
    draft: contests.filter(c => c.status === "draft").length,
    registrations: contests.reduce((sum, c) => sum + (c.participantCount || 0), 0),
  };

  const loadQuestions = (contestId) => {
    Promise.all([
      getDocs(query(collection(db, "contests", contestId, "questions"), orderBy("order", "asc"))),
      getDocs(collection(db, "contests", contestId, "answerKeys")),
    ]).then(([qSnap, akSnap]) => {
      const keys = {};
      akSnap.docs.forEach(d => { keys[d.id] = d.data(); });
      setCQuestions(p => ({ ...p, [contestId]: qSnap.docs.map(d => ({ id: d.id, ...d.data(), ...keys[d.id] })) }));
    }).catch(console.error);
  };

  const loadRegistrations = (contestId) => {
    getDocs(collection(db, "contests", contestId, "registrations"))
      .then(snap => setRegistrations(p => ({ ...p, [contestId]: snap.docs.map(d => ({ uid: d.id, ...d.data() })) })))
      .catch(console.error);
  };

  const loadAnnouncements = (contestId) => {
    getDocs(query(collection(db, "contests", contestId, "announcements"), orderBy("createdAt", "desc")))
      .then(snap => setAnnouncements(p => ({ ...p, [contestId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) })))
      .catch(console.error);
  };

  const handlePostAnnouncement = async (contestId) => {
    if (!announcementText.trim()) return;
    setPostingAnnouncement(true);
    try {
      await addDoc(collection(db, "contests", contestId, "announcements"), {
        text: announcementText.trim(), createdAt: serverTimestamp(),
      });
      setAnnouncementText("");
      loadAnnouncements(contestId);
    } catch (e) { console.error(e); }
    finally { setPostingAnnouncement(false); }
  };

  const toggleExpand = (contestId) => {
    if (expanded === contestId) { setExpanded(null); return; }
    setExpanded(contestId);
    setCsvText(""); setCsvResult(null); setQForm(blankContestQuestionForm()); setAnnouncementText("");
    if (!cQuestions[contestId]) loadQuestions(contestId);
    if (!announcements[contestId]) loadAnnouncements(contestId);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.contestStart || !form.contestEnd) {
      return setError("Title, contest start, and contest end are required.");
    }
    if ((parseInt(form.prizeXp) || 0) > 2000 || (parseInt(form.prizeCoins) || 0) > 2000) {
      return setError("Prize XP and prize coins cannot exceed 2000.");
    }
    setSaving(true); setError("");
    try {
      const contestStart = new Date(form.contestStart);
      const contestEnd = new Date(form.contestEnd);
      const registrationEnd = form.registrationEnd ? new Date(form.registrationEnd) : contestStart;
      const registrationStart = form.registrationStart ? new Date(form.registrationStart) : new Date();
      await addDoc(collection(db, "contests"), {
        title: form.title.trim(), category: form.category, difficulty: form.difficulty,
        bannerUrl: form.bannerUrl.trim(), description: form.description.trim(), rules: form.rules.trim(),
        eligibility: form.eligibility.trim(), organizer: form.organizer.trim(),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        registrationStart, registrationEnd, contestStart, contestEnd,
        durationMinutes: parseInt(form.durationMinutes) || 60,
        prizeXp: parseInt(form.prizeXp) || 0, prizeCoins: parseInt(form.prizeCoins) || 0,
        prizeText: form.prizeText.trim(), status: form.status,
        participantCount: 0, questionCount: 0,
        createdAt: serverTimestamp(), createdBy: auth.currentUser?.email || ADMIN_EMAIL,
      });
      setForm(blankContestForm());
      logAdminActivity("created contest", form.title.trim());
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleSetStatus = async (contestId, status) => {
    await updateDoc(doc(db, "contests", contestId), { status });
    logAdminActivity(`contest -> ${status}`, contestId);
    load();
  };

  const handleDuplicate = async (contest) => {
    try {
      const [qSnap, akSnap] = await Promise.all([
        getDocs(collection(db, "contests", contest.id, "questions")),
        getDocs(collection(db, "contests", contest.id, "answerKeys")),
      ]);
      const { id, participantCount, createdAt, ...rest } = contest;
      const newRef = await addDoc(collection(db, "contests"), {
        ...rest, title: `${contest.title} (Copy)`, status: "draft", participantCount: 0,
        createdAt: serverTimestamp(), createdBy: auth.currentUser?.email || ADMIN_EMAIL,
      });
      await Promise.all([
        ...qSnap.docs.map(d => setDoc(doc(db, "contests", newRef.id, "questions", d.id), d.data())),
        ...akSnap.docs.map(d => setDoc(doc(db, "contests", newRef.id, "answerKeys", d.id), d.data())),
      ]);
      logAdminActivity("duplicated contest", contest.title);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (contestId, title) => {
    if (!confirm(`Delete "${title}" and all its questions/registrations/submissions? This can't be undone.`)) return;
    try {
      const [qSnap, akSnap, regSnap, subSnap] = await Promise.all([
        getDocs(collection(db, "contests", contestId, "questions")),
        getDocs(collection(db, "contests", contestId, "answerKeys")),
        getDocs(collection(db, "contests", contestId, "registrations")),
        getDocs(collection(db, "contests", contestId, "submissions")),
      ]);
      await Promise.all([
        ...qSnap.docs.map(d => deleteDoc(d.ref)), ...akSnap.docs.map(d => deleteDoc(d.ref)),
        ...regSnap.docs.map(d => deleteDoc(d.ref)), ...subSnap.docs.map(d => deleteDoc(d.ref)),
      ]);
      await deleteDoc(doc(db, "contests", contestId));
      logAdminActivity("deleted contest", title);
      load();
    } catch (e) { console.error(e); }
  };

  const handleAddQuestion = async (contestId) => {
    const letters = ["a", "b", "c", "d"];
    let options = [], correctOptionIds = [], correctText = "";
    if (qForm.type === "fillblank") {
      correctText = qForm.correctText.trim();
      if (!qForm.question.trim() || !correctText) return;
    } else if (qForm.type === "truefalse") {
      options = [{ id: "true", text: "True" }, { id: "false", text: "False" }];
      correctOptionIds = [qForm.correctIndices[0] === 1 ? "false" : "true"];
      if (!qForm.question.trim()) return;
    } else {
      const texts = qForm.options.map(o => o.trim());
      options = letters.map((id, idx) => ({ id, text: texts[idx] })).filter(o => o.text);
      correctOptionIds = qForm.correctIndices.map(i => letters[i]).filter(id => options.some(o => o.id === id));
      if (!qForm.question.trim() || options.length < 2 || correctOptionIds.length === 0) return;
    }

    setSavingQ(true);
    try {
      const count = (cQuestions[contestId] || []).length;
      const qRef = doc(collection(db, "contests", contestId, "questions"));
      await setDoc(qRef, {
        type: qForm.type, question: qForm.question.trim(), options,
        marks: parseFloat(qForm.marks) || 1, negativeMarks: parseFloat(qForm.negativeMarks) || 0,
        topic: qForm.topic.trim(), difficulty: qForm.difficulty, order: count, createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "contests", contestId, "answerKeys", qRef.id), {
        correctOptionIds, correctText, explanation: qForm.explanation.trim(),
      });
      await updateDoc(doc(db, "contests", contestId), { questionCount: increment(1) });
      setQForm(blankContestQuestionForm(qForm.type));
      loadQuestions(contestId);
      load();
    } catch (e) { console.error(e); }
    finally { setSavingQ(false); }
  };

  const handleDeleteQuestion = async (contestId, questionId) => {
    if (!confirm("Delete this question?")) return;
    await deleteDoc(doc(db, "contests", contestId, "questions", questionId));
    await deleteDoc(doc(db, "contests", contestId, "answerKeys", questionId));
    await updateDoc(doc(db, "contests", contestId), { questionCount: increment(-1) });
    loadQuestions(contestId);
    load();
  };

  const handleImportCsv = async (contestId) => {
    const { questions: parsed, errors } = csvRowsToContestQuestions(parseCSV(csvText));
    if (parsed.length === 0) { setCsvResult({ imported: 0, errors }); return; }
    setImporting(true);
    try {
      const startOrder = (cQuestions[contestId] || []).length;
      // Two writes per row (question + answerKey) - chunk well under the 500-write cap.
      for (let i = 0; i < parsed.length; i += 200) {
        const chunk = parsed.slice(i, i + 200);
        const batch = writeBatch(db);
        chunk.forEach((q, idx) => {
          const qRef = doc(collection(db, "contests", contestId, "questions"));
          batch.set(qRef, {
            type: q.type, question: q.question, options: q.options, marks: q.marks,
            negativeMarks: q.negativeMarks, topic: q.topic, difficulty: q.difficulty,
            order: startOrder + i + idx, createdAt: serverTimestamp(),
          });
          batch.set(doc(db, "contests", contestId, "answerKeys", qRef.id), {
            correctOptionIds: q.correctOptionIds, correctText: q.correctText, explanation: q.explanation,
          });
        });
        await batch.commit();
      }
      await updateDoc(doc(db, "contests", contestId), { questionCount: increment(parsed.length) });
      logAdminActivity("bulk imported contest questions", `${parsed.length} question(s)`);
      setCsvResult({ imported: parsed.length, errors });
      setCsvText("");
      loadQuestions(contestId);
      load();
    } catch (e) { console.error(e); setCsvResult({ imported: 0, errors: [...errors, "Import failed - check console."] }); }
    finally { setImporting(false); }
  };

  const exportRegistrationsCsv = (contestId, title) => {
    const rows = registrations[contestId] || [];
    const csv = ["uid,registeredAt", ...rows.map(r => `${r.uid},${toDate(r.registeredAt)?.toISOString() || ""}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  function toDate(v) { return v ? (typeof v.toDate === "function" ? v.toDate() : new Date(v)) : null; }

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "TOTAL", v: stats.total, c: "#00FFFF" },
          { label: "LIVE", v: stats.live, c: "#00FF41" },
          { label: "UPCOMING", v: stats.upcoming, c: "#FF9500" },
          { label: "REGISTRATIONS", v: stats.registrations, c: "#C77DFF" },
        ].map(s => (
          <div key={s.label} className="border border-white/6 rounded-lg p-3 text-center">
            <p className="font-mono text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="font-mono text-[9px] text-white/25 tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {contests.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no contests yet</p>}

      <div className="space-y-2">
        {contests.map(contest => {
          const sc = CONTEST_STATUSES.find(s => s.v === contest.status) || CONTEST_STATUSES[0];
          const phase = contestPhase(contest);
          return (
            <div key={contest.id} className="border border-white/8 rounded-lg overflow-hidden">
              <button onClick={() => toggleExpand(contest.id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/2 transition-colors text-left flex-wrap">
                <Trophy size={13} className="text-neon-cyan/60 flex-shrink-0" />
                <span className="font-sans text-sm text-white/80 flex-1 min-w-0 truncate">{contest.title}</span>
                <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded flex-shrink-0">{contest.category}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: sc.c, background: `${sc.c}15` }}>{contest.status.toUpperCase()}</span>
                {contest.status === "published" && (
                  <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{phase.toUpperCase()}</span>
                )}
                <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{contest.questionCount || 0}q · {contest.participantCount || 0} reg</span>
                {expanded === contest.id ? <ChevronUp size={12} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={12} className="text-white/30 flex-shrink-0" />}
              </button>

              {expanded === contest.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/6 pt-3">
                  {/* Lifecycle actions */}
                  <div className="flex flex-wrap gap-2">
                    {contest.status !== "published" && (
                      <button onClick={() => handleSetStatus(contest.id, "published")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors">publish</button>
                    )}
                    {contest.status === "published" && (
                      <button onClick={() => handleSetStatus(contest.id, "draft")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-white/10 text-white/40 hover:bg-white/5 transition-colors">unpublish</button>
                    )}
                    {contest.status !== "archived" && (
                      <button onClick={() => handleSetStatus(contest.id, "archived")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-white/10 text-white/40 hover:bg-white/5 transition-colors">archive</button>
                    )}
                    <button onClick={() => handleDuplicate(contest)} className="font-mono text-[10px] px-2.5 py-1 rounded border border-neon-cyan/25 text-neon-cyan/70 hover:bg-neon-cyan/8 transition-colors">duplicate</button>
                    <button onClick={() => handleDelete(contest.id, contest.title)} className="font-mono text-[10px] px-2.5 py-1 rounded border border-red-500/25 text-red-400/70 hover:bg-red-500/8 transition-colors ml-auto">delete</button>
                  </div>

                  {/* Questions */}
                  <div>
                    <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1.5">QUESTIONS</p>
                    <div className="space-y-2">
                      {(cQuestions[contest.id] || []).map((q, i) => (
                        <div key={q.id} className="flex items-center gap-2 border border-white/6 rounded px-3 py-2">
                          <span className="font-mono text-[9px] text-white/25 w-5">{i + 1}</span>
                          <span className="font-mono text-xs text-white/60 flex-1 truncate">{q.question}</span>
                          <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{q.type}</span>
                          <span className="font-mono text-[9px] text-neon-cyan/60">{q.marks}pt</span>
                          <button onClick={() => handleDeleteQuestion(contest.id, q.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>

                    {/* Manual add */}
                    <div className="border border-dashed border-white/10 rounded-lg p-3 space-y-2 mt-2">
                      <p className="font-mono text-[9px] text-neon-green tracking-wider">+ add question manually</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {QUESTION_TYPES.map(t => (
                          <button key={t} onClick={() => setQForm(blankContestQuestionForm(t))}
                            className="font-mono text-[10px] px-2.5 py-1 rounded transition-colors"
                            style={{
                              color: qForm.type === t ? "#00FFFF" : "rgba(255,255,255,0.3)",
                              background: qForm.type === t ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                              border: qForm.type === t ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                            }}>{t}</button>
                        ))}
                      </div>
                      <Textarea label="QUESTION" value={qForm.question} onChange={v => setQForm(p => ({ ...p, question: v }))} rows={2} placeholder="What does the JVM do?" />

                      {qForm.type === "fillblank" ? (
                        <Input label="ACCEPTED ANSWER(S) - use | for alternatives" value={qForm.correctText} onChange={v => setQForm(p => ({ ...p, correctText: v }))} placeholder="extends|inherits" />
                      ) : qForm.type === "truefalse" ? (
                        <div className="flex gap-2">
                          {["True", "False"].map((label, idx) => (
                            <button key={label} onClick={() => setQForm(p => ({ ...p, correctIndices: [idx] }))}
                              className="flex-1 font-mono text-xs py-2 rounded border transition-colors"
                              style={{
                                color: qForm.correctIndices[0] === idx ? "#00FF41" : "rgba(255,255,255,0.4)",
                                borderColor: qForm.correctIndices[0] === idx ? "rgba(0,255,65,0.4)" : "rgba(255,255,255,0.1)",
                                background: qForm.correctIndices[0] === idx ? "rgba(0,255,65,0.08)" : "transparent",
                              }}>{label}</button>
                          ))}
                        </div>
                      ) : (
                        qForm.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => setQForm(p => {
                              const already = p.correctIndices.includes(oi);
                              if (p.type === "multiselect") {
                                return { ...p, correctIndices: already ? p.correctIndices.filter(i => i !== oi) : [...p.correctIndices, oi] };
                              }
                              return { ...p, correctIndices: [oi] };
                            })}
                              className="w-4 h-4 flex-shrink-0 transition-colors"
                              style={{
                                borderRadius: qForm.type === "multiselect" ? 4 : 999,
                                border: `1px solid ${qForm.correctIndices.includes(oi) ? "#00FF41" : "rgba(255,255,255,0.2)"}`,
                                background: qForm.correctIndices.includes(oi) ? "#00FF41" : "transparent",
                              }} />
                            <input value={opt} onChange={e => setQForm(p => ({ ...p, options: p.options.map((o, idx) => idx === oi ? e.target.value : o) }))}
                              placeholder={`Option ${oi + 1}`}
                              className="flex-1 font-mono text-[11px] text-white/70 px-2 py-1 rounded outline-none"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                          </div>
                        ))
                      )}

                      <Textarea label="EXPLANATION" value={qForm.explanation} onChange={v => setQForm(p => ({ ...p, explanation: v }))} rows={2} placeholder="Shown to participants after the contest ends..." />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Input label="MARKS" value={qForm.marks} onChange={v => setQForm(p => ({ ...p, marks: v }))} placeholder="1" />
                        <Input label="NEGATIVE" value={qForm.negativeMarks} onChange={v => setQForm(p => ({ ...p, negativeMarks: v }))} placeholder="0" />
                        <Input label="TOPIC" value={qForm.topic} onChange={v => setQForm(p => ({ ...p, topic: v }))} placeholder="Arrays" />
                        <div>
                          <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
                          <Dropdown value={qForm.difficulty} onChange={v => setQForm(p => ({ ...p, difficulty: v }))}
                            options={["easy", "medium", "hard"]}
                            className="w-full"
                            buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
                            />
                        </div>
                      </div>
                      <button onClick={() => handleAddQuestion(contest.id)} disabled={savingQ}
                        className="w-full font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                        {savingQ ? "saving..." : "add question"}
                      </button>
                    </div>

                    {/* Bulk CSV import */}
                    <div className="border border-dashed border-neon-purple/25 rounded-lg p-3 space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[9px] text-neon-purple tracking-wider">+ bulk import from CSV</p>
                        <button onClick={downloadContestCsvTemplate} className="flex items-center gap-1 font-mono text-[9px] text-white/40 hover:text-neon-purple transition-colors">
                          <Download size={10} /> download template
                        </button>
                      </div>
                      <pre className="font-mono text-[9px] text-white/25 whitespace-pre-wrap leading-relaxed">{CONTEST_CSV_HELP}</pre>
                      <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={5}
                        placeholder="question,optionA,optionB,optionC,optionD,correctAnswer,type,difficulty,marks,negativeMarks,explanation,topic"
                        className="w-full font-mono text-[11px] text-white/70 px-3 py-2 rounded outline-none"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(199,125,255,0.2)" }} />
                      {csvResult && (
                        <p className="font-mono text-[10px]" style={{ color: csvResult.imported > 0 ? "#00FF41" : "#FF5050" }}>
                          {csvResult.imported > 0 && `imported ${csvResult.imported} question(s). `}
                          {csvResult.errors.length > 0 && `${csvResult.errors.length} row(s) skipped: ${csvResult.errors.slice(0, 3).join(" ")}`}
                        </p>
                      )}
                      <button onClick={() => handleImportCsv(contest.id)} disabled={importing || !csvText.trim()}
                        className="w-full font-mono text-xs py-2 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors disabled:opacity-50">
                        {importing ? "importing..." : "import CSV"}
                      </button>
                    </div>
                  </div>

                  {/* Registrations */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-mono text-[9px] text-white/25 tracking-widest">REGISTRATIONS ({contest.participantCount || 0})</p>
                      <div className="flex gap-2">
                        <button onClick={() => loadRegistrations(contest.id)} className="font-mono text-[9px] text-white/40 hover:text-neon-cyan transition-colors">load</button>
                        {registrations[contest.id] && (
                          <button onClick={() => exportRegistrationsCsv(contest.id, contest.title)} className="flex items-center gap-1 font-mono text-[9px] text-white/40 hover:text-neon-cyan transition-colors">
                            <Download size={10} /> export CSV
                          </button>
                        )}
                      </div>
                    </div>
                    {registrations[contest.id] && (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {registrations[contest.id].length === 0 && <p className="font-mono text-[10px] text-white/20">no registrations yet</p>}
                        {registrations[contest.id].map(r => (
                          <div key={r.uid} className="font-mono text-[10px] text-white/40 flex items-center justify-between border-b border-white/4 py-1">
                            <span className="truncate">{r.uid}</span>
                            <span className="text-white/20 flex-shrink-0 ml-2">{toDate(r.registeredAt)?.toLocaleString() || ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Announcements */}
                  <div>
                    <p className="font-mono text-[9px] text-white/25 tracking-widest mb-1.5">ANNOUNCEMENTS</p>
                    <div className="space-y-1 mb-2">
                      {(announcements[contest.id] || []).map(a => (
                        <p key={a.id} className="font-mono text-[10px] text-white/45 border-b border-white/4 py-1">{a.text}</p>
                      ))}
                      {announcements[contest.id]?.length === 0 && <p className="font-mono text-[10px] text-white/20">no announcements yet</p>}
                    </div>
                    <div className="flex gap-2">
                      <input value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                        placeholder="Post an update for registered participants..."
                        className="flex-1 font-mono text-[11px] text-white/70 px-3 py-2 rounded outline-none"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <button onClick={() => handlePostAnnouncement(contest.id)} disabled={postingAnnouncement || !announcementText.trim()}
                        className="font-mono text-[10px] px-3 rounded border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors disabled:opacity-50">
                        post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create contest */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// create contest</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Java Fundamentals Contest #1" />
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">CATEGORY</p>
            <Dropdown value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}
              options={CONTEST_CATEGORIES}
              className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
              />
          </div>
        </div>
        <Textarea label="DESCRIPTION" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} rows={2} placeholder="What this contest covers..." />
        <Textarea label="RULES" value={form.rules} onChange={v => setForm(p => ({ ...p, rules: v }))} rows={2} placeholder="No external tools, one attempt per participant..." />
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
            <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
              options={CONTEST_DIFFICULTIES}
              className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
              />
          </div>
          <Input label="ELIGIBILITY" value={form.eligibility} onChange={v => setForm(p => ({ ...p, eligibility: v }))} placeholder="Open to all" />
          <Input label="ORGANIZER" value={form.organizer} onChange={v => setForm(p => ({ ...p, organizer: v }))} placeholder="DeVert" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="BANNER URL (optional)" value={form.bannerUrl} onChange={v => setForm(p => ({ ...p, bannerUrl: v }))} placeholder="https://..." />
          <Input label="TAGS (comma separated)" value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="DSA, Interview Prep" />
        </div>
        <p className="font-mono text-[9px] text-white/25 tracking-wider mt-2">SCHEDULE (leave registration blank to allow registering until contest start)</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="REGISTRATION START" type="datetime-local" value={form.registrationStart} onChange={v => setForm(p => ({ ...p, registrationStart: v }))} />
          <Input label="REGISTRATION END" type="datetime-local" value={form.registrationEnd} onChange={v => setForm(p => ({ ...p, registrationEnd: v }))} />
          <Input label="CONTEST START" type="datetime-local" value={form.contestStart} onChange={v => setForm(p => ({ ...p, contestStart: v }))} />
          <Input label="CONTEST END" type="datetime-local" value={form.contestEnd} onChange={v => setForm(p => ({ ...p, contestEnd: v }))} />
        </div>
        <Input label="DURATION (minutes)" value={form.durationMinutes} onChange={v => setForm(p => ({ ...p, durationMinutes: v }))} placeholder="60" />
        <p className="font-mono text-[9px] text-white/25 tracking-wider">
          CONTESTS NO LONGER GRANT PLATFORM XP/COINS (ONLY DAILY LEARNING, PROGRAMMING, AND CS CORE DO) - DESCRIBE ANY REAL PRIZE BELOW
        </p>
        <Input label="PRIZE TEXT (optional)" value={form.prizeText} onChange={v => setForm(p => ({ ...p, prizeText: v }))} placeholder="Top 3 get DeVert merch" />
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">STATUS</p>
          <div className="flex gap-2">
            {CONTEST_STATUSES.map(s => (
              <button key={s.v} onClick={() => setForm(p => ({ ...p, status: s.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color: form.status === s.v ? s.c : "rgba(255,255,255,0.3)",
                  background: form.status === s.v ? `${s.c}12` : "rgba(255,255,255,0.03)",
                  border: form.status === s.v ? `1px solid ${s.c}35` : "1px solid rgba(255,255,255,0.06)",
                }}>{s.v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleCreate} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={12} /> {saving ? "creating..." : "create contest"}
        </motion.button>
      </div>
    </div>
  );
}

// ── CodeLab problems panel ────────────────────────────────────────────────────

const CODELAB_STATUSES = [
  { v: "draft",     c: "rgba(255,255,255,0.4)" },
  { v: "published", c: "#00FF41" },
  { v: "archived",  c: "#FF9500" },
];

function blankProblemForm() {
  return {
    title: "", category: CODELAB_CATEGORIES[0], difficulty: "Easy", tags: "", companies: "",
    statement: "", constraints: "", examplesText: "", hints: "",
    estimatedTime: "15", xpReward: "50", coinReward: "20", status: "draft",
  };
}

// "Which companies ask this problem" - purely admin-authored metadata, no
// automatic/inferred tagging anywhere. Editable after creation too (see
// handleSaveCompanies below), same as extrasForm/simpleForm, since almost
// every existing problem predates this field and needs retroactive tagging.
function companiesFormFromProblem(problem) {
  return { companies: (problem?.companies || []).join(", ") };
}

// Competitive-programming-style structure layered on top of the original
// statement/constraints/examplesText (never replaces them) - Input Format/
// Output Format/Edge Cases render as their own labeled sections on the
// student view (see campus-practice.jsx) when present, and are silently
// skipped for any problem that doesn't have them yet, so this is fully
// backward compatible with all 441 pre-existing problems.
function structureFormFromProblem(problem) {
  return {
    inputFormat: problem?.inputFormat || "",
    outputFormat: problem?.outputFormat || "",
    edgeCases: problem?.edgeCases || "",
  };
}

function blankTestForm() { return { input: "", expectedOutput: "", explanation: "", points: "1" }; }

const SOLUTION_APPROACHES = ["brute", "better", "optimal"];
const SOLUTION_DEFAULT_TITLES = { brute: "Brute Force", better: "Better", optimal: "Optimal" };

// Seeds from the problem's own already-saved videoUrl/solutions (so opening
// an existing problem for edit shows what's actually there), not a blank
// slate every time - blank only for a problem that's never had these set.
function extrasFormFromProblem(problem) {
  const form = { videoUrl: problem?.videoUrl || "" };
  SOLUTION_APPROACHES.forEach(k => {
    const s = problem?.solutions?.[k];
    form[k] = { title: s?.title || "", explanation: s?.explanation || "", timeComplexity: s?.timeComplexity || "", spaceComplexity: s?.spaceComplexity || "" };
  });
  return form;
}

// The "teach it like a beginner" layer - purely additive on top of the
// original statement/constraints/examplesText/hiddenTests (never touches
// those), rendered as a callout ABOVE the statement on the student view
// (see campus-practice.jsx). visualWalkthrough is stored as an ordered
// array of steps (one per line here, same newline-split convention as
// `hints`), everything else is free-form prose.
const SIMPLE_EXPLANATION_FIELDS = [
  "simpleExplanation", "realWorldAnalogy", "dryRun", "bruteForceIntuition",
  "optimizedIntuition", "timeComplexityPlain", "spaceComplexityPlain", "interviewTip", "keyObservation",
];
function simpleFormFromProblem(problem) {
  const form = {};
  SIMPLE_EXPLANATION_FIELDS.forEach(f => { form[f] = problem?.[f] || ""; });
  form.visualWalkthrough = (problem?.visualWalkthrough || []).join("\n");
  return form;
}

const CODELAB_CSV_HEADER = "type,input,expectedoutput,explanation,points";
const CODELAB_CSV_EXAMPLE_ROWS = [
  ['sample', '5\n3', '8', 'Add the two numbers: 5 + 3 = 8.', ''],
  ['hidden', '100\n250', '350', '', '1'],
  ['hidden', '-5\n5', '0', '', '1'],
];
const CODELAB_CSV_TEMPLATE = [CODELAB_CSV_HEADER, ...CODELAB_CSV_EXAMPLE_ROWS.map(r =>
  r.map(f => (f.includes(",") || f.includes('"') || f.includes("\n") ? `"${f.replace(/"/g, '""')}"` : f)).join(",")
)].join("\n");
const CODELAB_CSV_HELP = `Columns (first row = header, exact names): type,input,expectedOutput,explanation,points
type: sample (shown to solvers in the problem statement) or hidden (never shown - used for grading only)
explanation is only used for sample tests; points only for hidden tests (defaults to 1)`;

function downloadCodelabCsvTemplate() {
  const blob = new Blob([CODELAB_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codelab-testcases-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvRowsToTestCases(rows) {
  if (rows.length < 2) return { sampleTests: [], hiddenTests: [], errors: ["No data rows found (need a header row + at least one test case row)."] };
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const missing = ["type", "input", "expectedoutput"].filter(n => col(n) === -1);
  if (missing.length) return { sampleTests: [], hiddenTests: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };

  const sampleTests = [], hiddenTests = [], errors = [];
  rows.slice(1).forEach((r, i) => {
    const lineNo = i + 2;
    const get = name => (col(name) !== -1 ? (r[col(name)] || "").trim() : "");
    const type = get("type").toLowerCase();
    const input = get("input");
    const expectedOutput = get("expectedoutput");
    if (!expectedOutput || !["sample", "hidden"].includes(type)) {
      errors.push(`Row ${lineNo}: skipped - type must be "sample" or "hidden", and expectedOutput is required.`);
      return;
    }
    if (type === "sample") sampleTests.push({ input, expectedOutput, explanation: get("explanation") });
    else hiddenTests.push({ input, expectedOutput, points: parseFloat(get("points")) || 1 });
  });
  return { sampleTests, hiddenTests, errors };
}

function CodingProblemsPanel() {
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [sampleTests, setSampleTests] = useState({});
  const [hiddenTests, setHiddenTests] = useState({});

  const [form, setForm] = useState(blankProblemForm());
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const [sampleForm, setSampleForm] = useState(blankTestForm());
  const [hiddenForm, setHiddenForm] = useState(blankTestForm());
  const [savingTest, setSavingTest] = useState(false);

  const [extrasForm, setExtrasForm] = useState(null);
  const [savingExtras, setSavingExtras] = useState(false);

  const [simpleForm, setSimpleForm] = useState(null);
  const [savingSimple, setSavingSimple] = useState(false);

  const [companiesForm, setCompaniesForm] = useState(null);
  const [savingCompanies, setSavingCompanies] = useState(false);

  const [structureForm, setStructureForm] = useState(null);
  const [savingStructure, setSavingStructure] = useState(false);

  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "problems"), orderBy("createdAt", "desc")))
      .then(snap => setProblems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const loadTests = (problemId) => {
    Promise.all([
      getDocs(collection(db, "problems", problemId, "sampleTests")),
      getDocs(collection(db, "problems", problemId, "hiddenTests")),
    ]).then(([sSnap, hSnap]) => {
      setSampleTests(p => ({ ...p, [problemId]: sSnap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      setHiddenTests(p => ({ ...p, [problemId]: hSnap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    }).catch(console.error);
  };

  const toggleExpand = (problemId) => {
    if (expanded === problemId) { setExpanded(null); return; }
    setExpanded(problemId);
    setCsvText(""); setCsvResult(null); setSampleForm(blankTestForm()); setHiddenForm(blankTestForm());
    setExtrasForm(extrasFormFromProblem(problems.find(p => p.id === problemId)));
    setSimpleForm(simpleFormFromProblem(problems.find(p => p.id === problemId)));
    setCompaniesForm(companiesFormFromProblem(problems.find(p => p.id === problemId)));
    setStructureForm(structureFormFromProblem(problems.find(p => p.id === problemId)));
    if (!sampleTests[problemId]) loadTests(problemId);
  };

  const handleSaveCompanies = async (problemId) => {
    setSavingCompanies(true);
    try {
      const companies = companiesForm.companies.split(",").map(t => t.trim()).filter(Boolean);
      await updateDoc(doc(db, "problems", problemId), { companies });
      logAdminActivity("updated problem companies", problems.find(p => p.id === problemId)?.title || "");
      load();
    } catch (e) { console.error(e); }
    finally { setSavingCompanies(false); }
  };

  const handleSaveStructure = async (problemId) => {
    setSavingStructure(true);
    try {
      await updateDoc(doc(db, "problems", problemId), {
        inputFormat: structureForm.inputFormat.trim(),
        outputFormat: structureForm.outputFormat.trim(),
        edgeCases: structureForm.edgeCases.trim(),
      });
      logAdminActivity("updated problem structure (input/output format, edge cases)", problems.find(p => p.id === problemId)?.title || "");
      load();
    } catch (e) { console.error(e); }
    finally { setSavingStructure(false); }
  };

  const handleSaveExtras = async (problemId) => {
    setSavingExtras(true);
    try {
      const solutions = {};
      SOLUTION_APPROACHES.forEach(k => {
        const s = extrasForm[k];
        if (s.explanation.trim()) {
          solutions[k] = {
            title: s.title.trim() || SOLUTION_DEFAULT_TITLES[k],
            explanation: s.explanation.trim(),
            timeComplexity: s.timeComplexity.trim(),
            spaceComplexity: s.spaceComplexity.trim(),
          };
        }
      });
      await updateDoc(doc(db, "problems", problemId), { videoUrl: extrasForm.videoUrl.trim(), solutions });
      logAdminActivity("updated problem video/solutions", problems.find(p => p.id === problemId)?.title || "");
      load();
    } catch (e) { console.error(e); }
    finally { setSavingExtras(false); }
  };

  // `problems` (loaded via the list query above) already holds every field
  // of the current doc client-side, so the version snapshot needs no extra
  // read - unlike lib/programming.js/lib/csCore.js's saveTopic, which fetch
  // fresh since topics aren't preloaded in bulk the same way.
  const handleSaveSimple = async (problemId) => {
    setSavingSimple(true);
    try {
      const existing = problems.find(p => p.id === problemId);
      const patch = {};
      SIMPLE_EXPLANATION_FIELDS.forEach(f => { patch[f] = simpleForm[f].trim(); });
      patch.visualWalkthrough = simpleForm.visualWalkthrough.split("\n").map(s => s.trim()).filter(Boolean);
      await updateDoc(doc(db, "problems", problemId), { ...withVersionSnapshot(existing), ...patch });
      logAdminActivity("updated problem simple explanation", existing?.title || "");
      load();
    } catch (e) { console.error(e); }
    finally { setSavingSimple(false); }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.statement.trim()) return setError("Title and problem statement are required.");
    setSaving(true); setError("");
    try {
      await addDoc(collection(db, "problems"), {
        title: form.title.trim(), category: form.category, difficulty: form.difficulty,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        companies: form.companies.split(",").map(t => t.trim()).filter(Boolean),
        statement: form.statement.trim(), constraints: form.constraints.trim(),
        examplesText: form.examplesText.trim(),
        hints: form.hints.split("\n").map(h => h.trim()).filter(Boolean),
        estimatedTime: parseInt(form.estimatedTime) || 15,
        xpReward: parseInt(form.xpReward) || 0, coinReward: parseInt(form.coinReward) || 0,
        status: form.status, totalSubmissions: 0, acceptedSubmissions: 0,
        createdAt: serverTimestamp(), createdBy: auth.currentUser?.email || ADMIN_EMAIL,
      });
      setForm(blankProblemForm());
      logAdminActivity("created coding problem", form.title.trim());
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleSetStatus = async (problemId, status) => {
    await updateDoc(doc(db, "problems", problemId), { status });
    load();
  };

  const handleDelete = async (problemId, title) => {
    if (!confirm(`Delete "${title}" and all its test cases? This can't be undone.`)) return;
    try {
      const [sSnap, hSnap] = await Promise.all([
        getDocs(collection(db, "problems", problemId, "sampleTests")),
        getDocs(collection(db, "problems", problemId, "hiddenTests")),
      ]);
      await Promise.all([...sSnap.docs.map(d => deleteDoc(d.ref)), ...hSnap.docs.map(d => deleteDoc(d.ref))]);
      await deleteDoc(doc(db, "problems", problemId));
      logAdminActivity("deleted coding problem", title);
      load();
    } catch (e) { console.error(e); }
  };

  const handleAddTest = async (problemId, isHidden) => {
    const f = isHidden ? hiddenForm : sampleForm;
    if (!f.expectedOutput.trim()) return;
    setSavingTest(true);
    try {
      const coll = isHidden ? "hiddenTests" : "sampleTests";
      const payload = isHidden
        ? { input: f.input, expectedOutput: f.expectedOutput.trim(), points: parseFloat(f.points) || 1 }
        : { input: f.input, expectedOutput: f.expectedOutput.trim(), explanation: f.explanation.trim() };
      await addDoc(collection(db, "problems", problemId, coll), payload);
      (isHidden ? setHiddenForm : setSampleForm)(blankTestForm());
      loadTests(problemId);
    } catch (e) { console.error(e); }
    finally { setSavingTest(false); }
  };

  const handleDeleteTest = async (problemId, testId, isHidden) => {
    if (!confirm("Delete this test case?")) return;
    await deleteDoc(doc(db, "problems", problemId, isHidden ? "hiddenTests" : "sampleTests", testId));
    loadTests(problemId);
  };

  const handleImportCsv = async (problemId) => {
    const { sampleTests: parsedSample, hiddenTests: parsedHidden, errors } = csvRowsToTestCases(parseCSV(csvText));
    if (parsedSample.length === 0 && parsedHidden.length === 0) { setCsvResult({ imported: 0, errors }); return; }
    setImporting(true);
    try {
      const batch = writeBatch(db);
      parsedSample.forEach(t => batch.set(doc(collection(db, "problems", problemId, "sampleTests")), t));
      parsedHidden.forEach(t => batch.set(doc(collection(db, "problems", problemId, "hiddenTests")), t));
      await batch.commit();
      const total = parsedSample.length + parsedHidden.length;
      logAdminActivity("bulk imported test cases", `${total} test case(s)`);
      setCsvResult({ imported: total, errors });
      setCsvText("");
      loadTests(problemId);
    } catch (e) { console.error(e); setCsvResult({ imported: 0, errors: [...errors, "Import failed - check console."] }); }
    finally { setImporting(false); }
  };

  if (loading) return <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>;

  return (
    <div className="space-y-5">
      <p className="font-mono text-[10px] text-white/18">
        Sample tests are shown to solvers in the problem statement. Hidden tests are NEVER sent to the browser -
        devert-backend reads them server-side to grade submissions.
      </p>

      {problems.length === 0 && <p className="font-mono text-xs text-white/20 text-center py-4">no problems yet</p>}

      <div className="space-y-2">
        {problems.map(problem => {
          const sc = CODELAB_STATUSES.find(s => s.v === problem.status) || CODELAB_STATUSES[0];
          return (
            <div key={problem.id} className="border border-white/8 rounded-lg overflow-hidden">
              <button onClick={() => toggleExpand(problem.id)} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/2 transition-colors text-left flex-wrap">
                <Code2 size={13} className="text-neon-cyan/60 flex-shrink-0" />
                <span className="font-sans text-sm text-white/80 flex-1 min-w-0 truncate">{problem.title}</span>
                <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded flex-shrink-0">{problem.category}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: sc.c, background: `${sc.c}15` }}>{problem.status.toUpperCase()}</span>
                <span className="font-mono text-[9px] text-white/25 flex-shrink-0">
                  {(sampleTests[problem.id]?.length || 0)}s / {(hiddenTests[problem.id]?.length || 0)}h tests
                </span>
                {expanded === problem.id ? <ChevronUp size={12} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={12} className="text-white/30 flex-shrink-0" />}
              </button>

              {expanded === problem.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/6 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {problem.status !== "published" && (
                      <button onClick={() => handleSetStatus(problem.id, "published")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors">publish</button>
                    )}
                    {problem.status === "published" && (
                      <button onClick={() => handleSetStatus(problem.id, "draft")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-white/10 text-white/40 hover:bg-white/5 transition-colors">unpublish</button>
                    )}
                    {problem.status !== "archived" && (
                      <button onClick={() => handleSetStatus(problem.id, "archived")} className="font-mono text-[10px] px-2.5 py-1 rounded border border-white/10 text-white/40 hover:bg-white/5 transition-colors">archive</button>
                    )}
                    <button onClick={() => handleDelete(problem.id, problem.title)} className="font-mono text-[10px] px-2.5 py-1 rounded border border-red-500/25 text-red-400/70 hover:bg-red-500/8 transition-colors ml-auto">delete</button>
                  </div>

                  {/* Sample tests */}
                  <div>
                    <p className="font-mono text-[9px] text-neon-green tracking-widest mb-1.5 flex items-center gap-1"><Eye size={10} /> SAMPLE TESTS (visible to solvers)</p>
                    <div className="space-y-1.5 mb-2">
                      {(sampleTests[problem.id] || []).map(t => (
                        <div key={t.id} className="flex items-center gap-2 border border-white/6 rounded px-3 py-2">
                          <span className="font-mono text-[10px] text-white/50 flex-1 truncate">in: {t.input || "(empty)"} -&gt; out: {t.expectedOutput}</span>
                          <button onClick={() => handleDeleteTest(problem.id, t.id, false)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 mb-2">
                      <Textarea label="INPUT (stdin)" value={sampleForm.input} onChange={v => setSampleForm(p => ({ ...p, input: v }))} rows={2} placeholder="5&#10;3" />
                      <Textarea label="EXPECTED OUTPUT" value={sampleForm.expectedOutput} onChange={v => setSampleForm(p => ({ ...p, expectedOutput: v }))} rows={2} placeholder="8" />
                    </div>
                    <Input label="EXPLANATION (optional)" value={sampleForm.explanation} onChange={v => setSampleForm(p => ({ ...p, explanation: v }))} placeholder="Why this output is correct..." />
                    <button onClick={() => handleAddTest(problem.id, false)} disabled={savingTest}
                      className="w-full mt-2 font-mono text-xs py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                      add sample test
                    </button>
                  </div>

                  {/* Hidden tests */}
                  <div className="border border-dashed border-red-500/20 rounded-lg p-3">
                    <p className="font-mono text-[9px] text-red-400/70 tracking-widest mb-1.5 flex items-center gap-1"><EyeOff size={10} /> HIDDEN TESTS (never shown to solvers - grading only)</p>
                    <div className="space-y-1.5 mb-2">
                      {(hiddenTests[problem.id] || []).map(t => (
                        <div key={t.id} className="flex items-center gap-2 border border-white/6 rounded px-3 py-2">
                          <span className="font-mono text-[10px] text-white/50 flex-1 truncate">in: {t.input || "(empty)"} -&gt; out: {t.expectedOutput}</span>
                          <span className="font-mono text-[9px] text-neon-cyan/60">{t.points}pt</span>
                          <button onClick={() => handleDeleteTest(problem.id, t.id, true)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 mb-2">
                      <Textarea label="INPUT (stdin)" value={hiddenForm.input} onChange={v => setHiddenForm(p => ({ ...p, input: v }))} rows={2} placeholder="100&#10;250" />
                      <Textarea label="EXPECTED OUTPUT" value={hiddenForm.expectedOutput} onChange={v => setHiddenForm(p => ({ ...p, expectedOutput: v }))} rows={2} placeholder="350" />
                    </div>
                    <Input label="POINTS" value={hiddenForm.points} onChange={v => setHiddenForm(p => ({ ...p, points: v }))} placeholder="1" />
                    <button onClick={() => handleAddTest(problem.id, true)} disabled={savingTest}
                      className="w-full mt-2 font-mono text-xs py-2 text-red-400 border border-red-500/30 hover:bg-red-500/8 transition-colors disabled:opacity-50">
                      add hidden test
                    </button>
                  </div>

                  {/* Bulk CSV import */}
                  <div className="border border-dashed border-neon-purple/25 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[9px] text-neon-purple tracking-wider">+ bulk import test cases from CSV</p>
                      <button onClick={downloadCodelabCsvTemplate} className="flex items-center gap-1 font-mono text-[9px] text-white/40 hover:text-neon-purple transition-colors">
                        <Download size={10} /> download template
                      </button>
                    </div>
                    <pre className="font-mono text-[9px] text-white/25 whitespace-pre-wrap leading-relaxed">{CODELAB_CSV_HELP}</pre>
                    <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={5}
                      placeholder="type,input,expectedOutput,explanation,points"
                      className="w-full font-mono text-[11px] text-white/70 px-3 py-2 rounded outline-none"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(199,125,255,0.2)" }} />
                    {csvResult && (
                      <p className="font-mono text-[10px]" style={{ color: csvResult.imported > 0 ? "#00FF41" : "#FF5050" }}>
                        {csvResult.imported > 0 && `imported ${csvResult.imported} test case(s). `}
                        {csvResult.errors.length > 0 && `${csvResult.errors.length} row(s) skipped: ${csvResult.errors.slice(0, 3).join(" ")}`}
                      </p>
                    )}
                    <button onClick={() => handleImportCsv(problem.id)} disabled={importing || !csvText.trim()}
                      className="w-full font-mono text-xs py-2 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors disabled:opacity-50">
                      {importing ? "importing..." : "import CSV"}
                    </button>
                  </div>

                  {/* Video explanation + Brute/Better/Optimal solution write-ups - shown
                      on the student-facing problem view as buttons above the statement
                      (only for whichever approaches actually have an explanation) and a
                      video icon (only if videoUrl is set). All optional, all editable
                      here for a problem already created - not just at creation time. */}
                  {extrasForm && (
                    <div className="border border-dashed border-neon-cyan/25 rounded-lg p-3 space-y-3">
                      <p className="font-mono text-[9px] text-neon-cyan tracking-widest">VIDEO &amp; SOLUTIONS (shown on the student problem view)</p>
                      <Input label="VIDEO URL (YouTube etc., optional)" value={extrasForm.videoUrl}
                        onChange={v => setExtrasForm(p => ({ ...p, videoUrl: v }))} placeholder="https://youtube.com/watch?v=..." />
                      {SOLUTION_APPROACHES.map(k => (
                        <div key={k} className="border border-white/6 rounded p-2.5 space-y-2">
                          <p className="font-mono text-[9px] text-white/40 tracking-widest">{SOLUTION_DEFAULT_TITLES[k].toUpperCase()} APPROACH (optional)</p>
                          <Input label="LABEL (optional override)" value={extrasForm[k].title}
                            onChange={v => setExtrasForm(p => ({ ...p, [k]: { ...p[k], title: v } }))} placeholder={SOLUTION_DEFAULT_TITLES[k]} />
                          <Textarea label="EXPLANATION" value={extrasForm[k].explanation} rows={3}
                            onChange={v => setExtrasForm(p => ({ ...p, [k]: { ...p[k], explanation: v } }))}
                            placeholder="Describe the approach - leave empty to hide this button on the problem view." />
                          <div className="grid sm:grid-cols-2 gap-2">
                            <Input label="TIME COMPLEXITY" value={extrasForm[k].timeComplexity}
                              onChange={v => setExtrasForm(p => ({ ...p, [k]: { ...p[k], timeComplexity: v } }))} placeholder="O(n^2)" />
                            <Input label="SPACE COMPLEXITY" value={extrasForm[k].spaceComplexity}
                              onChange={v => setExtrasForm(p => ({ ...p, [k]: { ...p[k], spaceComplexity: v } }))} placeholder="O(1)" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => handleSaveExtras(problem.id)} disabled={savingExtras}
                        className="w-full font-mono text-xs py-2 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors disabled:opacity-50">
                        {savingExtras ? "saving..." : "save video & solutions"}
                      </button>
                    </div>
                  )}

                  {/* "Which companies ask this" - purely admin-authored, editable for
                      a problem already created (almost every problem predates this
                      field) - see companiesFormFromProblem/handleSaveCompanies above.
                      Never auto-populated or inferred; COMPANY_TAG_SUGGESTIONS is
                      autocomplete help only, not a claim about any specific problem. */}
                  {companiesForm && (
                    <div className="border border-dashed border-neon-gold/25 rounded-lg p-3 space-y-3">
                      <p className="font-mono text-[9px] text-neon-gold tracking-widest">COMPANIES (shown as &quot;Asked in...&quot; on the student card + powers the Companies filter)</p>
                      <Input label="COMPANIES (comma separated)" value={companiesForm.companies}
                        onChange={v => setCompaniesForm(p => ({ ...p, companies: v }))}
                        placeholder="Amazon, Google, Microsoft"
                        hint={`Suggestions: ${COMPANY_TAG_SUGGESTIONS.join(", ")}`} />
                      <button onClick={() => handleSaveCompanies(problem.id)} disabled={savingCompanies}
                        className="w-full font-mono text-xs py-2 text-neon-gold border border-neon-gold/30 hover:bg-neon-gold/8 transition-colors disabled:opacity-50">
                        {savingCompanies ? "saving..." : "save companies"}
                      </button>
                    </div>
                  )}

                  {/* Competitive-programming structure layered on top of the
                      original statement (never replaces it) - optional, and
                      each section only renders on the student view if
                      actually filled in (see campus-practice.jsx). Expected
                      Complexity isn't editable here - it already surfaces
                      straight from whatever's set in Video & Solutions above. */}
                  {structureForm && (
                    <div className="border border-dashed border-neon-cyan/25 rounded-lg p-3 space-y-3">
                      <p className="font-mono text-[9px] text-neon-cyan tracking-widest">INPUT / OUTPUT FORMAT &amp; EDGE CASES (optional, shown as their own sections on the student view)</p>
                      <Textarea label="INPUT FORMAT" value={structureForm.inputFormat} rows={2}
                        onChange={v => setStructureForm(p => ({ ...p, inputFormat: v }))}
                        placeholder="First line: n. Second line: n space-separated integers." />
                      <Textarea label="OUTPUT FORMAT" value={structureForm.outputFormat} rows={2}
                        onChange={v => setStructureForm(p => ({ ...p, outputFormat: v }))}
                        placeholder="A single integer - the answer." />
                      <Textarea label="EDGE CASES TO CONSIDER" value={structureForm.edgeCases} rows={2}
                        onChange={v => setStructureForm(p => ({ ...p, edgeCases: v }))}
                        placeholder="n = 1, all elements equal, already sorted input." />
                      <button onClick={() => handleSaveStructure(problem.id)} disabled={savingStructure}
                        className="w-full font-mono text-xs py-2 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors disabled:opacity-50">
                        {savingStructure ? "saving..." : "save structure"}
                      </button>
                    </div>
                  )}

                  {/* "Teach it like a beginner" layer - purely additive on top of
                      statement/constraints/examplesText/hiddenTests above (never
                      edits those), rendered as a callout ABOVE the original
                      statement on the student view - see campus-practice.jsx. */}
                  {simpleForm && (
                    <div className="border border-dashed border-neon-purple/25 rounded-lg p-3 space-y-3">
                      <p className="font-mono text-[9px] text-neon-purple tracking-widest">SIMPLE EXPLANATION (shown above the statement on the student view - never changes the statement itself)</p>
                      <Textarea label="SIMPLE EXPLANATION" value={simpleForm.simpleExplanation} rows={3}
                        onChange={v => setSimpleForm(p => ({ ...p, simpleExplanation: v }))}
                        placeholder="Explain the problem in plain, beginner-friendly language before the technical statement." />
                      <Textarea label="REAL-WORLD ANALOGY" value={simpleForm.realWorldAnalogy} rows={3}
                        onChange={v => setSimpleForm(p => ({ ...p, realWorldAnalogy: v }))}
                        placeholder="A relatable everyday story that maps directly onto this problem." />
                      <Textarea label="VISUAL WALKTHROUGH (one step per line)" value={simpleForm.visualWalkthrough} rows={4}
                        onChange={v => setSimpleForm(p => ({ ...p, visualWalkthrough: v }))}
                        placeholder={"Step 1: ...\nStep 2: ...\nStep 3: ..."} />
                      <Textarea label="DRY RUN" value={simpleForm.dryRun} rows={3}
                        onChange={v => setSimpleForm(p => ({ ...p, dryRun: v }))}
                        placeholder="Trace through one worked example input, value by value." />
                      <Textarea label="BRUTE FORCE INTUITION" value={simpleForm.bruteForceIntuition} rows={2}
                        onChange={v => setSimpleForm(p => ({ ...p, bruteForceIntuition: v }))} />
                      <Textarea label="OPTIMIZED INTUITION" value={simpleForm.optimizedIntuition} rows={2}
                        onChange={v => setSimpleForm(p => ({ ...p, optimizedIntuition: v }))} />
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Textarea label="TIME COMPLEXITY (plain language)" value={simpleForm.timeComplexityPlain} rows={2}
                          onChange={v => setSimpleForm(p => ({ ...p, timeComplexityPlain: v }))} />
                        <Textarea label="SPACE COMPLEXITY (plain language)" value={simpleForm.spaceComplexityPlain} rows={2}
                          onChange={v => setSimpleForm(p => ({ ...p, spaceComplexityPlain: v }))} />
                      </div>
                      <Textarea label="INTERVIEW TIP" value={simpleForm.interviewTip} rows={2}
                        onChange={v => setSimpleForm(p => ({ ...p, interviewTip: v }))} />
                      <Textarea label="KEY OBSERVATION" value={simpleForm.keyObservation} rows={2}
                        onChange={v => setSimpleForm(p => ({ ...p, keyObservation: v }))} />
                      <button onClick={() => handleSaveSimple(problem.id)} disabled={savingSimple}
                        className="w-full font-mono text-xs py-2 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/8 transition-colors disabled:opacity-50">
                        {savingSimple ? "saving..." : "save simple explanation"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create problem */}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <p className="font-mono text-[10px] text-neon-green tracking-wider">// create problem</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="TITLE" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Two Sum" />
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">CATEGORY</p>
            <Dropdown value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}
              options={CODELAB_CATEGORIES}
              className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
              />
          </div>
        </div>
        <Textarea label="PROBLEM STATEMENT" value={form.statement} onChange={v => setForm(p => ({ ...p, statement: v }))} rows={4} placeholder="Given an array of integers..." />
        <Textarea label="CONSTRAINTS" value={form.constraints} onChange={v => setForm(p => ({ ...p, constraints: v }))} rows={2} placeholder="1 <= n <= 10^5" />
        <Textarea label="EXAMPLES" value={form.examplesText} onChange={v => setForm(p => ({ ...p, examplesText: v }))} rows={3} placeholder={"Input: [2,7,11,15], target=9\nOutput: [0,1]"} />
        <Textarea label="HINTS (one per line)" value={form.hints} onChange={v => setForm(p => ({ ...p, hints: v }))} rows={2} placeholder={"Try a hash map.\nThink about complements."} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
            <Dropdown value={form.difficulty} onChange={v => setForm(p => ({ ...p, difficulty: v }))}
              options={CODELAB_DIFFICULTIES}
              className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]"
              />
          </div>
          <Input label="TAGS (comma separated)" value={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} placeholder="Array, Hash Map" />
        </div>
        <Input label="COMPANIES (comma separated, optional)" value={form.companies} onChange={v => setForm(p => ({ ...p, companies: v }))}
          placeholder="Amazon, Google, Microsoft" hint={`e.g. ${COMPANY_TAG_SUGGESTIONS.slice(0, 6).join(", ")}...`} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="ESTIMATED TIME (min)" value={form.estimatedTime} onChange={v => setForm(p => ({ ...p, estimatedTime: v }))} placeholder="15" />
          <Input label="XP REWARD" value={form.xpReward} onChange={v => setForm(p => ({ ...p, xpReward: v }))} placeholder="50" />
          <Input label="COIN REWARD" value={form.coinReward} onChange={v => setForm(p => ({ ...p, coinReward: v }))} placeholder="20" />
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">STATUS</p>
          <div className="flex gap-2">
            {CODELAB_STATUSES.map(s => (
              <button key={s.v} onClick={() => setForm(p => ({ ...p, status: s.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color: form.status === s.v ? s.c : "rgba(255,255,255,0.3)",
                  background: form.status === s.v ? `${s.c}12` : "rgba(255,255,255,0.03)",
                  border: form.status === s.v ? `1px solid ${s.c}35` : "1px solid rgba(255,255,255,0.06)",
                }}>{s.v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleCreate} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={12} /> {saving ? "creating..." : "create problem"}
        </motion.button>
      </div>
    </div>
  );
}

// ── Events panel (hackathons + workshops/meetups/open-mic/tech-talks) ─────────
// "live" used to be the stored value here while every read path
// (hackathons-app.jsx/hackathon-detail-view.jsx's statusMeta()) switched on
// "active" - a hackathon set live via this form silently rendered as
// "upcoming" forever. Fixed to "active" alongside adding eventType since this
// form needed touching anyway; a hackathon already stuck on the old "live"
// value just needs its status re-clicked once after this ships.
const HACKATHON_STATUSES = [
  { v: "upcoming", c: "#00FFFF" },
  { v: "active",   c: "#00FF41" },
  { v: "judging",  c: "#FF9500" },
  { v: "ended",    c: "rgba(255,255,255,0.3)" },
];

function blankHackathonForm() {
  return {
    slug: "", title: "", tagline: "", description: "", theme: "", accentColor: "#00FF41",
    eventType: "hackathon", host: "",
    prizes: [
      { place: "1st", label: "1st Place", reward: "" },
      { place: "2nd", label: "2nd Place", reward: "" },
      { place: "3rd", label: "3rd Place", reward: "" },
    ],
    registrationOpen: "", submissionDeadline: "", resultsDate: "",
    maxTeamSize: "4", tags: "", status: "upcoming",
  };
}

// Firestore Timestamp -> <input type="datetime-local"/type="date"> value.
function tsToInputStr(ts, withTime) {
  const ms = ts?.toDate?.()?.getTime?.() ?? (typeof ts === "number" ? ts : null);
  if (!ms) return "";
  const iso = new Date(ms - new Date().getTimezoneOffset() * 60000).toISOString();
  return withTime ? iso.slice(0, 16) : iso.slice(0, 10);
}

function HackathonsPanel() {
  const [hackathons, setHackathons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [editingId,  setEditingId]  = useState(null);

  const [form, setForm] = useState(blankHackathonForm);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const setPrize = (i, k) => (v) => setForm(p => ({
    ...p, prizes: p.prizes.map((pr, idx) => idx === i ? { ...pr, [k]: v } : pr),
  }));

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc")))
      .then(snap => setHackathons(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (h) => {
    setEditingId(h.id);
    setError("");
    setForm({
      slug: h.id, title: h.title || "", tagline: h.tagline || "",
      description: h.description || "", theme: h.theme || "", accentColor: h.accentColor || "#00FF41",
      eventType: h.eventType || "hackathon", host: h.host || "",
      prizes: blankHackathonForm().prizes.map(p => {
        const existing = h.prizes?.find(pr => pr.place === p.place);
        return existing ? { ...p, ...existing } : p;
      }),
      registrationOpen:   tsToInputStr(h.registrationOpen, true),
      submissionDeadline: tsToInputStr(h.submissionDeadline, true),
      resultsDate:        tsToInputStr(h.resultsDate, false),
      maxTeamSize: String(h.maxTeamSize ?? "4"),
      tags: (h.tags || []).join(", "),
      status: h.status || "upcoming",
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(blankHackathonForm()); setError(""); };

  const handleSave = async () => {
    if (!editingId && !form.slug.trim()) return setError("Slug is required.");
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true); setError("");
    try {
      const statusObj = HACKATHON_STATUSES.find(s => s.v === form.status) || HACKATHON_STATUSES[0];
      const isHack = form.eventType === "hackathon";
      const payload = {
        title:         form.title.trim(),
        tagline:       form.tagline.trim(),
        description:   form.description.trim(),
        theme:         form.theme.trim(),
        accentColor:   form.accentColor,
        eventType:     form.eventType,
        host:          isHack ? "" : form.host.trim(),
        prizes:        isHack ? form.prizes.filter(p => p.reward.trim()) : [],
        registrationOpen:   form.registrationOpen   ? new Date(form.registrationOpen)   : null,
        submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline) : null,
        resultsDate:        form.resultsDate         ? new Date(form.resultsDate)        : null,
        maxTeamSize:   parseInt(form.maxTeamSize) || 4,
        tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
        status:        form.status,
        statusColor:   statusObj.c,
      };
      if (editingId) {
        await updateDoc(doc(db, "hackathons", editingId), payload);
      } else {
        await setDoc(doc(db, "hackathons", form.slug.trim()), {
          ...payload, registrationCount: 0, submissionCount: 0, createdAt: serverTimestamp(),
        });
      }
      cancelEdit();
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  // Also cleans up every registration/submission doc for this hackathon -
  // both collections use docId `${slug}_${uid}`, so leaving them behind
  // after a delete meant a LATER hackathon reusing the same slug would
  // resurrect old, unrelated students' registrations/submissions as if they
  // belonged to the new event.
  const handleDelete = async (id) => {
    if (!confirm(`Delete event "${id}"?`)) return;
    const [regSnap, subSnap] = await Promise.all([
      getDocs(query(collection(db, "hackathon_registrations"), where("hackathonSlug", "==", id))),
      getDocs(query(collection(db, "hackathon_submissions"), where("hackathonSlug", "==", id))),
    ]);
    const refs = [...regSnap.docs.map(d => d.ref), ...subSnap.docs.map(d => d.ref), doc(db, "hackathons", id)];
    for (let i = 0; i < refs.length; i += 450) {
      const batch = writeBatch(db);
      refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
      await batch.commit();
    }
    if (editingId === id) cancelEdit();
    load();
  };

  const handleSetStatus = async (id, status) => {
    await updateDoc(doc(db, "hackathons", id), {
      status, statusColor: HACKATHON_STATUSES.find(s => s.v === status)?.c,
    });
    load();
  };

  const isHack = form.eventType === "hackathon";

  return (
    <div className="space-y-5">
      {loading ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : (
        <div className="space-y-2">
          {hackathons.length === 0 && <p className="font-mono text-xs text-white/20">No events yet.</p>}
          {hackathons.map(h => {
            const sc = HACKATHON_STATUSES.find(s => s.v === h.status) || HACKATHON_STATUSES[0];
            const typeLabel = EVENT_TYPES.find(t => t.v === (h.eventType || "hackathon"))?.label || "Hackathon";
            return (
              <div key={h.id} className="border border-white/6 rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/35 flex-shrink-0">{h.id}</span>
                  <span className="font-mono text-xs text-white/75 flex-1 truncate">{h.title}</span>
                  <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded flex-shrink-0">{typeLabel}</span>
                  <span className="font-mono text-[10px] flex-shrink-0" style={{ color: sc.c }}>{(h.status || "upcoming").toUpperCase()}</span>
                  <button onClick={() => startEdit(h)} className="flex items-center gap-1 font-mono text-[10.5px] px-1 flex-shrink-0" style={{ color: "#FFD700" }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(h.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {HACKATHON_STATUSES.map(s => (
                    <button key={s.v} onClick={() => handleSetStatus(h.id, s.v)}
                      className="font-mono text-[9px] px-2 py-1 rounded transition-colors"
                      style={{
                        color:      h.status === s.v ? s.c : "rgba(255,255,255,0.3)",
                        background: h.status === s.v ? `${s.c}12` : "rgba(255,255,255,0.03)",
                        border:     h.status === s.v ? `1px solid ${s.c}35` : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >{s.v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="border border-white/6 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] text-neon-cyan tracking-wider">{editingId ? `// editing ${editingId}` : "// create event"}</p>
          {editingId && (
            <button onClick={cancelEdit} className="font-mono text-[10px] text-white/30 hover:text-white/55 flex items-center gap-1">
              <X size={10} /> cancel
            </button>
          )}
        </div>

        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">EVENT TYPE</p>
          <div className="flex gap-2 flex-wrap">
            {EVENT_TYPES.map(t => (
              <button key={t.v} onClick={() => setForm(p => ({ ...p, eventType: t.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color:      form.eventType === t.v ? "#00FFFF" : "rgba(255,255,255,0.3)",
                  background: form.eventType === t.v ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border:     form.eventType === t.v ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >{t.label.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="SLUG (doc ID)" value={form.slug} onChange={f("slug")} placeholder="devcon-2026" hint={editingId ? "locked once created" : undefined} />
          <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="DevCon Hackathon 2026" />
        </div>
        <Input label="TAGLINE" value={form.tagline} onChange={f("tagline")} placeholder="Build the future in 48 hours" />
        <Textarea label="DESCRIPTION" value={form.description} onChange={f("description")} placeholder="What's this event about?" rows={3} />

        {!isHack && (
          <Input label="HOST / SPEAKER" value={form.host} onChange={f("host")} placeholder="e.g. Jane Doe, Senior SWE @ Acme" />
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="THEME (optional)" value={form.theme} onChange={f("theme")} placeholder="AI, Web3, Open Innovation" />
          <Input label="ACCENT COLOR" type="color" value={form.accentColor} onChange={f("accentColor")} />
          <Input label="MAX TEAM SIZE" value={form.maxTeamSize} onChange={f("maxTeamSize")} placeholder="4" />
        </div>
        <Input label="TAGS (comma separated)" value={form.tags} onChange={f("tags")} placeholder="Web, AI, Mobile" />

        {isHack && (
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">PRIZES</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {form.prizes.map((p, i) => (
                <Input key={p.place} label={p.label} value={p.reward} onChange={setPrize(i, "reward")} placeholder="₹50,000" />
              ))}
            </div>
          </div>
        )}

        <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">TIMELINE</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="REGISTRATIONS OPEN" type="datetime-local" value={form.registrationOpen} onChange={f("registrationOpen")} />
          <Input label={isHack ? "SUBMISSION DEADLINE" : "EVENT DATE/TIME"} type="datetime-local" value={form.submissionDeadline} onChange={f("submissionDeadline")} />
        </div>
        {isHack && (
          <Input label="RESULTS DATE" type="date" value={form.resultsDate} onChange={f("resultsDate")} />
        )}

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
          onClick={handleSave} disabled={saving}
          className="w-full font-mono text-xs py-2.5 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus size={12} /> {saving ? "saving..." : editingId ? "save changes" : "create event"}
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

  // Mirrors PulseModerationPanel's own delete/reject handlers: batch-delete
  // the dependent engagement docs and roll back the owner's aggregate
  // counters, rather than leaving project_comments/project_likes rows
  // pointing at a project that no longer exists and a profile stat that
  // drifts from reality forever (no reconciliation job exists for either).
  const handleDelete = async (p) => {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    const [likeSnap, commentSnap] = await Promise.all([
      getDocs(query(collection(db, "project_likes"), where("projectId", "==", p.id))),
      getDocs(query(collection(db, "project_comments"), where("projectId", "==", p.id))),
    ]);
    const batch = writeBatch(db);
    likeSnap.docs.forEach(d => batch.delete(d.ref));
    commentSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, "projects", p.id));
    if (p.ownerId && (p.likeCount || p.commentCount)) {
      batch.update(doc(db, "users", p.ownerId), {
        totalLikesReceived:    increment(-(p.likeCount    || 0)),
        totalCommentsReceived: increment(-(p.commentCount || 0)),
      });
    }
    await batch.commit();
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[9px] text-white/25 flex items-center gap-2">
                    <Heart size={10} /> {p.likeCount ?? 0}
                    <MessageSquare size={10} /> {p.commentCount ?? 0}
                  </span>
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
        // Judging has no meaning for a workshop/meetup/open-mic/tech-talk -
        // only actual hackathons ever get a hackathon_submissions doc.
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isHackathon);
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
        Edits the /ranks ladder display (color, requirement text, perks). XP thresholds that assign a user&apos;s tier are fixed in code and not changed here.
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

function AdminPageInner() {
  const { user, loading, isAdmin, adminChecked, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = searchParams.get("tab");
    return ADMIN_TABS.some(t => t.key === fromUrl) ? fromUrl : "moderation";
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Refreshing the admin panel used to always drop back to Moderation,
  // discarding whichever tab (Overview/Content/Community/Challenges/
  // Economy/Ops) the admin was actually working in - a real cost on the
  // single busiest internal screen. Bypasses Next.js's router (replaceState
  // directly) for the same reason campus-app.jsx's own tab-sync effect
  // does: updating the URL shouldn't trigger a navigation/re-render, just
  // keep the address bar (and a refresh) in sync with client state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `/admin?tab=${activeTab}`;
    window.history.replaceState(null, "", url);
  }, [activeTab]);

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
                <Section title="CONTESTS" icon={Trophy} color="#00FFFF">
                  <ContestsPanel />
                </Section>
                <Section title="CODELAB PROBLEMS" icon={Code2} color="#C77DFF">
                  <CodingProblemsPanel />
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
                {/* Sits directly above Institutions on purpose: a demo request from
                    the public "Bring DeVert to your campus" pitch is the step
                    BEFORE an institution row exists below - this is that sales
                    inbox. */}
                <Section title="CAMPUS DEMO REQUESTS" icon={Inbox} color="#FF9500" defaultOpen={true}>
                  <DemoRequestsPanel />
                </Section>
                <Section title="CAMPUS INSTITUTIONS" icon={Building2} color="#0E7C86">
                  <InstitutionsPanel />
                </Section>
                {/* Sits next to Institutions on purpose: an approved ambassador is
                    the usual first step toward a new institution appearing above. */}
                <Section title="CAMPUS AMBASSADORS" icon={Building2} color="#00FFFF">
                  <AmbassadorPanel />
                </Section>
                <Section title="SHIPYARD MODERATION" icon={Anchor} color="#00FFFF">
                  <ShipyardPanel />
                </Section>
                <Section title="PORTFOLIOS" icon={Star} color="#FFD700">
                  <PortfoliosPanel />
                </Section>
                <Section title="PULSE FEED" icon={Activity} color="#00FF41">
                  <PulsePanel />
                </Section>
                <Section title="COMMUNITIES" icon={Users} color="#00FF41">
                  <CommunitiesPanel />
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
                <Section title="APTITUDE - TOPIC LESSON CONTENT" icon={GraduationCap} color="#00FFFF">
                  <AptitudeTopicsPanel />
                </Section>
                <Section title="COMPANY PREP" icon={Briefcase} color="#FF9500">
                  <CompanyPrepPanel />
                </Section>
                <Section title="PROGRAMMING LANGUAGES" icon={CodeXml} color="#00FFFF">
                  <ProgrammingLanguagesPanel />
                </Section>
                <Section title="CS CORE SUBJECTS" icon={BrainCircuit} color="#A78BFA">
                  <CsCoreSubjectsPanel />
                </Section>
                {/* Software Engineering Fundamentals - the core-platform flagship
                    course (app/fundamentals). Deliberately listed BEFORE the GATE
                    block: it is a core DeVert product, not part of the Campus
                    exam-prep vertical, and its curriculum seeder is the first
                    thing a new deployment needs. */}
                <Section title="SOFTWARE ENGINEERING FUNDAMENTALS" icon={Network} color="#7DD3FC">
                  <SeModulesPanel />
                </Section>
                {/* GATE - seven sections inside the existing CONTENT tab rather than
                    a new top-level admin tab, per CLAUDE.md. Papers comes first
                    because everything else below is paper-scoped and nothing can be
                    authored until a paper exists (one click, from the official
                    transcribed syllabus). Bulk Lesson Import sits directly after the
                    per-topic editor it scales up, so the two are found together. */}
                <Section title="GATE PAPERS & SYLLABUS SEEDING" icon={GraduationCap} color="#00E5A0">
                  <GatePapersPanel />
                </Section>
                <Section title="GATE SUBJECTS & LESSON CONTENT" icon={Layers} color="#00E5A0">
                  <GateSubjectsPanel />
                </Section>
                <Section title="GATE BULK LESSON IMPORT" icon={Upload} color="#00E5A0">
                  <GateLessonImportPanel />
                </Section>
                <Section title="GATE PREVIOUS YEAR QUESTIONS" icon={ListChecks} color="#00E5A0">
                  <GatePyqPanel />
                </Section>
                <Section title="GATE TESTS & MOCKS" icon={ClipboardList} color="#00E5A0">
                  <GateTestsPanel />
                </Section>
                <Section title="GATE FORMULA BOOK" icon={BookOpen} color="#00E5A0">
                  <GateFormulaPanel />
                </Section>
                <Section title="GATE RESOURCES & ANNOUNCEMENTS" icon={Megaphone} color="#00E5A0">
                  <GateResourcesPanel />
                </Section>
                <Section title="INTEL FEED" icon={Radio} color="#C77DFF">
                  <IntelPanel />
                </Section>
                <Section title="INTEL - OPPORTUNITIES" icon={Briefcase} color="#00FF41">
                  <OpportunitiesPanel />
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

// useSearchParams() requires a Suspense boundary during static-export
// prerendering - same pattern as campus-app.jsx's own top-level
// useSearchParams() usage.
export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageInner />
    </Suspense>
  );
}
