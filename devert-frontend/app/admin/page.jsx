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
  Coins, Medal, Crosshair, Flag, MessageSquare, Eye, ClipboardList,
  GraduationCap, Lock as LockIcon, ListChecks, Download, Code2, EyeOff, Star, Building2,
  Briefcase, CodeXml, Pencil, Layers, BrainCircuit, Copy, Upload, Network, Inbox, Heart,
  Hammer, Globe, Server, Smartphone, Bot, Power, Search, Menu, ChevronRight, ChevronLeft, Database,
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
import { DEFAULT_REWARD_POLICY, loadRewardPolicy, saveRewardPolicy } from "@/lib/rewardPolicy";
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
import { FeatureSwitchesPanel, RolesPanel } from "@/components/admin/platform-panels";
import { ApiServicesPanel, DatabasePanel } from "@/components/admin/platform-ops";
import { DashboardPanel } from "@/components/admin/dashboard-panel";
import { DemoRequestsPanel } from "@/components/admin/demo-requests-panel";
import { CareersPanel } from "@/components/admin/careers-panel";
import { JobApplicationsPanel } from "@/components/admin/job-applications-panel";
import {
  GatePapersPanel, GateSubjectsPanel, GatePyqPanel, GateTestsPanel,
  GateFormulaPanel, GateResourcesPanel, GateLessonImportPanel,
} from "@/components/admin/gate-panel";
import { fetchAptitudeTopics, saveAptitudeTopic } from "@/lib/aptitude";
import { EVENT_TYPES, isHackathon, EVENT_MODES } from "@/lib/eventTypes";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import { LanguageLogo } from "@/components/campus/language-logo";
import { logAdminActivity } from "@/lib/adminActivityLog";
import { ActivityLogPanel } from "@/components/admin/activity-log-panel";
import { Input, Textarea } from "@/components/admin/admin-ui";
import {
  KIT, StatGrid, DataTable, Drawer, DrawerSection, Pill, Toggle, ProgressBar, PrimaryButton, SecondaryButton, IconButton,
  difficultyColor, fmt,
} from "@/components/admin/admin-kit";
import { subjectIcon } from "@/lib/subjectIcon";
import {
  collection, query, orderBy, where, getDocs, addDoc, deleteDoc,
  doc, setDoc, getDoc, serverTimestamp, updateDoc, limit, increment, onSnapshot, writeBatch, runTransaction,
} from "firebase/firestore";

const ADMIN_EMAIL = "devert.contact@gmail.com";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayIST() {
  const IST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return IST.toISOString().slice(0, 10);
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
  // null = closed, "new" = create, otherwise the id being edited.
  const [editingId, setEditingId] = useState(null);
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

  const toForm = (m) => ({
    codename: m.codename || "", objective: m.objective || "", prize: m.prize || "", deadline: m.deadline || "",
    team: String(m.team ?? 2), slots: String(m.slots ?? 10), filled: String(m.filled ?? 0),
    status: m.status || "OPEN", statusColor: m.statusColor || "#00FF41",
    classification: m.classification || "UNCLASSIFIED",
    difficulty: m.difficulty || "MEDIUM", diffColor: m.diffColor || "#FF9500",
    tags: (m.tags || []).join(", "),
  });
  const openCreate = () => { setForm(blank); setError(""); setEditingId("new"); };
  const openEdit = (m) => { setForm(toForm(m)); setError(""); setEditingId(m.id); };

  const handleAdd = async () => {
    if (!form.codename.trim() || !form.objective.trim()) return setError("Codename and objective are required.");
    setSaving(true); setError("");
    try {
      const data = {
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
      };
      if (editingId && editingId !== "new") {
        await updateDoc(doc(db, "missions", editingId), data);
        logAdminActivity("updated mission", data.codename);
      } else {
        await addDoc(collection(db, "missions"), { ...data, createdAt: serverTimestamp() });
        logAdminActivity("created mission", data.codename);
      }
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this mission?")) return;
    await deleteDoc(doc(db, "missions", id));
    logAdminActivity("deleted mission", missions.find(m => m.id === id)?.codename || id);
    load();
  };

  // Copies as LOCKED so a duplicate is never open to applicants by accident.
  const handleDuplicate = async (m) => {
    const { id: _id, ...data } = m;
    await addDoc(collection(db, "missions"), {
      ...data, codename: `${m.codename} (copy)`, filled: 0,
      status: "LOCKED", statusColor: "#555", createdAt: serverTimestamp(),
    });
    load();
  };

  const setOpen = async (m, open) => {
    const o = open ? STATUS_OPTS[0] : STATUS_OPTS[1];
    await updateDoc(doc(db, "missions", m.id), { status: o.v, statusColor: o.c });
    load();
  };

  const openMissions = missions.filter(m => m.status === "OPEN").length;
  const slots = missions.reduce((n, m) => n + (m.slots || 0), 0);
  const filled = missions.reduce((n, m) => n + (m.filled || 0), 0);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Total missions", value: missions.length, sub: "All time", icon: Target, color: KIT.green, loading },
        { label: "Open now", value: openMissions, sub: `${missions.length - openMissions} locked or classified`, icon: Zap, color: KIT.cyan, loading },
        { label: "Slots filled", value: `${fmt(filled)} / ${fmt(slots)}`, sub: "Across all missions", icon: Users, color: KIT.orange, loading },
        { label: "Fill rate", value: slots ? `${Math.round((100 * filled) / slots)}%` : "-", sub: "Filled of total slots", icon: BarChart3, color: KIT.purple, loading },
      ]} />

      <DataTable
        title="All missions" icon={Target} subtitle="Bounty-style missions shown on /missions."
        rows={missions} loading={loading}
        searchKeys={["codename", "objective", "tags", "prize"]} searchPlaceholder="Search missions..."
        filters={[
          { key: "status", label: "All statuses", options: STATUS_OPTS.map(o => ({ value: o.v, label: o.v[0] + o.v.slice(1).toLowerCase() })) },
          { key: "difficulty", label: "All difficulties", options: DIFF_OPTS.map(o => ({ value: o.v, label: o.v[0] + o.v.slice(1).toLowerCase() })) },
        ]}
        primaryAction={{ label: "Create mission", icon: Plus, onClick: openCreate }}
        onRowClick={openEdit}
        emptyText="No missions yet - create the first one."
        columns={[
          { key: "codename", label: "Mission", render: m => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{m.codename}</p>
              <p className="font-sans text-xs text-white/40 truncate">{m.objective}</p>
            </div>
          ) },
          { key: "difficulty", label: "Difficulty", render: m => <Pill color={difficultyColor(m.difficulty)}>{m.difficulty ? m.difficulty[0] + m.difficulty.slice(1).toLowerCase() : "-"}</Pill> },
          { key: "prize", label: "Reward", render: m => <span className="font-sans text-sm text-white/80">{m.prize || "-"}</span> },
          { key: "filled", label: "Slots", sort: m => (m.slots ? (m.filled || 0) / m.slots : 0),
            render: m => <ProgressBar value={m.slots ? (100 * (m.filled || 0)) / m.slots : 0} /> },
          { key: "deadline", label: "Deadline", render: m => <span className="font-sans text-sm text-white/60">{m.deadline || "-"}</span> },
          { key: "status", label: "Status", render: m => (
            <div className="flex items-center gap-2.5">
              <Toggle on={m.status === "OPEN"} label={`Open ${m.codename}`} onChange={on => setOpen(m, on)} />
              <span className="font-sans text-xs" style={{ color: m.status === "OPEN" ? KIT.green : "rgba(255,255,255,0.45)" }}>
                {m.status ? m.status[0] + m.status.slice(1).toLowerCase() : "-"}
              </span>
            </div>
          ) },
        ]}
        rowActions={m => [
          { icon: Pencil, label: "Edit", onClick: () => openEdit(m) },
          { icon: Copy, label: "Duplicate", onClick: () => handleDuplicate(m) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(m.id) },
        ]}
      />

      <Drawer open={!!editingId} onClose={() => setEditingId(null)}
        title={editingId === "new" ? "Create mission" : form.codename || "Edit mission"}
        subtitle={editingId === "new" ? "Shown on /missions as soon as it is saved with status Open." : "Changes go live on /missions immediately."}
        footer={<>
          <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAdd}>{editingId === "new" ? "Create mission" : "Save changes"}</PrimaryButton>
        </>}>
        <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="CODENAME" value={form.codename} onChange={f("codename")} placeholder="OPERATION: ZERO LATENCY" />
          <Input label="PRIZE / REWARD" value={form.prize} onChange={f("prize")} placeholder="₹50,000"
            hint="Informational only - arranged directly between poster and dev, not paid or escrowed by DeVert." />
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
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
            options={[{ value: "", label: "- not linked -" }, ...problems.map(p => ({ value: p.id, label: p.title }))]}
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

// Shared by Daily Grind and Arena: both store an ARRAY of challenges in one
// doc (dailyGrind/{date}, system/arena). The table edits a single challenge
// at a time in the drawer; every save writes the whole array back, so the
// doc is never left half-edited.
const cleanChallenge = (c) => ({
  ...c,
  xp: parseInt(c.xp) || 0,
  tags: typeof c.tags === "string" ? c.tags.split(",").map(t => t.trim()).filter(Boolean) : (c.tags || []),
});
const toEditable = (c) => ({ ...c, tags: Array.isArray(c.tags) ? c.tags.join(", ") : (c.tags || "") });

function ChallengeSetTable({ title, subtitle, rows, loading, onSaveAll, problems, emptyText }) {
  const [editIdx, setEditIdx] = useState(null); // null closed, -1 new, n editing
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const withIdx = (rows || []).map((c, i) => ({ ...c, id: String(i), _i: i }));
  const open = (i) => { setDraft(i === -1 ? { ...BLANK_CHALLENGE } : toEditable(rows[i])); setError(""); setEditIdx(i); };
  const persist = async (next) => {
    setSaving(true); setError("");
    try { await onSaveAll(next.map(cleanChallenge)); return true; }
    catch (e) { setError(e?.message || "Could not save."); return false; }
    finally { setSaving(false); }
  };
  const saveDraft = async () => {
    if (!draft.title?.trim()) return setError("A title is required.");
    const next = [...rows];
    if (editIdx === -1) next.push(draft); else next[editIdx] = draft;
    if (await persist(next)) setEditIdx(null);
  };
  const remove = (i) => { if (confirm(`Remove "${rows[i].title || "this challenge"}"?`)) persist(rows.filter((_, j) => j !== i)); };
  const duplicate = (i) => persist([...rows.slice(0, i + 1), { ...rows[i], title: `${rows[i].title} (copy)` }, ...rows.slice(i + 1)]);
  const problemTitle = (id) => problems?.find(p => p.id === id)?.title;

  return (
    <>
      <DataTable title={title} subtitle={subtitle} icon={Zap} rows={withIdx} loading={loading}
        searchKeys={["title", "description", "type"]} searchPlaceholder="Search challenges..."
        filters={[
          { key: "type", label: "All types", options: TYPE_OPTS.map(o => ({ value: o.v, label: o.v.replace("_", " ") })) },
          { key: "difficulty", label: "All difficulties", options: DIFF_OPTS2.map(o => ({ value: o.v, label: o.v[0] + o.v.slice(1).toLowerCase() })) },
        ]}
        primaryAction={{ label: "Add challenge", icon: Plus, onClick: () => open(-1) }}
        onRowClick={r => open(r._i)} emptyText={emptyText}
        columns={[
          { key: "title", label: "Challenge", render: c => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{c.title || "Untitled"}</p>
              <p className="font-sans text-xs text-white/40 truncate">{c.description}</p>
            </div>
          ) },
          { key: "type", label: "Type", render: c => <Pill color={KIT.cyan}>{(c.type || "-").replace("_", " ")}</Pill> },
          { key: "difficulty", label: "Difficulty", render: c => <Pill color={difficultyColor(c.difficulty)}>{c.difficulty ? c.difficulty[0] + c.difficulty.slice(1).toLowerCase() : "-"}</Pill> },
          { key: "xp", label: "XP", sort: c => parseInt(c.xp) || 0, render: c => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(parseInt(c.xp) || 0)}</span> },
          { key: "time", label: "Time", render: c => <span className="font-sans text-sm text-white/60">{c.time || "-"}</span> },
          ...(problems ? [{ key: "problemId", label: "CodeLab link", sortable: false, render: c => c.problemId
            ? <span className="font-sans text-xs text-white/70 truncate block max-w-[180px]">{problemTitle(c.problemId) || "Linked"}</span>
            : <Pill color={KIT.orange}>Not linked</Pill> }] : []),
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Edit", onClick: () => open(c._i) },
          { icon: Copy, label: "Duplicate", onClick: () => duplicate(c._i), disabled: saving },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => remove(c._i), disabled: saving },
        ]}
      />
      {error && editIdx === null && <p className="font-sans text-sm text-red-400">{error}</p>}
      <Drawer open={editIdx !== null} onClose={() => setEditIdx(null)}
        title={editIdx === -1 ? "Add challenge" : draft?.title || "Edit challenge"}
        subtitle="Saved straight to the live list."
        footer={<>
          <SecondaryButton onClick={() => setEditIdx(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={saveDraft}>{editIdx === -1 ? "Add challenge" : "Save changes"}</PrimaryButton>
        </>}>
        {draft && (
          <>
            <ChallengeForm ch={draft} index={0} problems={problems}
              onChange={(_, k, v) => setDraft(d => ({ ...d, [k]: v }))} onRemove={() => setEditIdx(null)} />
            {error && <p className="font-sans text-xs text-red-400 mt-3">{error}</p>}
          </>
        )}
      </Drawer>
    </>
  );
}

function GrindPanel() {
  const [date, setDate] = useState(todayIST());
  const [challenges, setChallenges] = useState(null);
  const [schedule, setSchedule] = useState(null);

  const loadSchedule = () => getDocs(collection(db, "dailyGrind"))
    .then(snap => setSchedule(snap.docs.map(d => ({ id: d.id, n: (d.data().challenges || []).length }))))
    .catch(() => setSchedule([]));
  useEffect(() => { loadSchedule(); }, []);

  useEffect(() => {
    let alive = true;
    getDoc(doc(db, "dailyGrind", date))
      .then(snap => alive && setChallenges(snap.exists() ? (snap.data().challenges || []) : []))
      .catch(() => alive && setChallenges([]));
    return () => { alive = false; };
  }, [date]);

  const saveAll = async (next) => {
    await setDoc(doc(db, "dailyGrind", date), { challenges: next, updatedAt: serverTimestamp() });
    setChallenges(next);
    logAdminActivity("updated daily grind", `${date}: ${next.length} challenge(s)`);
    loadSchedule();
  };

  const today = todayIST();
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T00:00:00`); d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, label: i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }) };
  });
  const byDate = Object.fromEntries((schedule || []).map(d => [d.id, d.n]));
  const upcoming = (schedule || []).filter(d => d.id >= today && d.n > 0).length;
  const gaps = next7.filter(d => !byDate[d.iso]).length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Days scheduled", value: schedule?.length, sub: "All time", icon: ListChecks, color: KIT.green, loading: !schedule },
        { label: "Upcoming days ready", value: upcoming, sub: "Today onwards", icon: Zap, color: KIT.cyan, loading: !schedule },
        { label: "Gaps this week", value: gaps, sub: gaps ? "Days with no challenges" : "Every day covered", icon: Target, color: gaps ? KIT.orange : KIT.green, loading: !schedule },
        { label: "Selected day", value: challenges?.length, sub: `${date} · resets at IST midnight`, icon: Trophy, color: KIT.purple, loading: !challenges },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        {next7.map(d => (
          <button key={d.iso} onClick={() => setDate(d.iso)}
            className="font-sans text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={date === d.iso
              ? { background: "rgba(0,255,65,0.1)", borderColor: "rgba(0,255,65,0.4)", color: "#fff" }
              : { borderColor: "rgba(255,255,255,0.1)", color: byDate[d.iso] ? "rgba(255,255,255,0.75)" : KIT.orange }}>
            {d.label}{!byDate[d.iso] && " ·  empty"}
          </button>
        ))}
        <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)}
          className="font-sans text-sm text-white/80 px-3 py-1.5 rounded-lg border border-white/10 outline-none [color-scheme:dark]"
          style={{ background: "rgba(255,255,255,0.03)" }} aria-label="Pick any date" />
      </div>

      <ChallengeSetTable title={`Challenges for ${date}`} subtitle="What every user sees on /grind that day."
        rows={challenges || []} loading={!challenges} onSaveAll={saveAll}
        emptyText="Nothing scheduled for this day - add the first challenge." />
    </div>
  );
}

function ArenaPanel() {
  const [challenges, setChallenges] = useState(null);
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    getDoc(doc(db, "system", "arena"))
      .then(snap => setChallenges(snap.exists() ? (snap.data().challenges || []) : []))
      .catch(() => setChallenges([]));
    // Solo challenges are only playable once linked to a real, published CodeLab
    // problem - see GradingService.gradeArenaSubmission, which grades against
    // exactly this collection.
    fetchPublishedProblems().then(setProblems).catch(console.error);
  }, []);

  const saveAll = async (next) => {
    await setDoc(doc(db, "system", "arena"), { challenges: next, updatedAt: serverTimestamp() });
    setChallenges(next);
    logAdminActivity("updated arena challenges", `${next.length} challenge(s)`);
  };

  const linked = (challenges || []).filter(c => c.problemId).length;
  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Arena challenges", value: challenges?.length, sub: "In the solo pool", icon: Swords, color: KIT.orange, loading: !challenges },
        { label: "Playable", value: linked, sub: "Linked to a CodeLab problem", icon: Check, color: KIT.green, loading: !challenges },
        { label: "Not linked", value: challenges ? challenges.length - linked : null, sub: "Can't be graded until linked", icon: Target, color: (challenges?.length || 0) - linked ? KIT.red : KIT.green, loading: !challenges },
        { label: "Published problems", value: problems.length, sub: "Available to link", icon: Code2, color: KIT.cyan },
      ]} />
      <ChallengeSetTable title="Arena challenge pool" subtitle="Solo Arena challenges. Each must link to a published CodeLab problem to be graded."
        rows={challenges || []} loading={!challenges} onSaveAll={saveAll} problems={problems}
        emptyText="No Arena challenges yet." />
    </div>
  );
}

// ── Build challenges panel ────────────────────────────────────────────────────

// Deliberately not reusing BLANK_CHALLENGE/ChallengeForm above - those are
// shaped for CodeLab-linked challenges (EASY/MEDIUM/HARD, problemId, xp).
// Build challenges are open-ended, ungraded project briefs: Beginner/
// Intermediate/Advanced, a category, a stack, and no XP - see firestore.rules'
// build_attempts comment for why no reward is ever attached to these.
const BLANK_BUILD_CHALLENGE = {
  id: "", title: "", category: "web",
  difficulty: "BEGINNER", diffColor: "#00FF41",
  brief: "", description: "", stack: "", locked: false,
};

const BUILD_DIFF_OPTS = [
  { v: "BEGINNER",     c: "#00FF41" },
  { v: "INTERMEDIATE", c: "#FF9500" },
  { v: "ADVANCED",     c: "#FF3B3B" },
];

const BUILD_CATEGORY_OPTS = [
  { v: "web",     label: "Web",      icon: Globe },
  { v: "backend", label: "Backend",  icon: Server },
  { v: "mobile",  label: "Mobile",   icon: Smartphone },
  { v: "ai",      label: "AI",       icon: Bot },
];

function BuildChallengeForm({ ch, onChange, onRemove, index }) {
  const f = (k) => (v) => onChange(index, k, v);
  return (
    <div className="border border-white/8 rounded-lg p-4 space-y-3 relative">
      <button onClick={() => onRemove(index)} className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors">
        <X size={13} />
      </button>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">CATEGORY</p>
          <div className="flex gap-1.5">
            {BUILD_CATEGORY_OPTS.map(o => (
              <button key={o.v} onClick={() => onChange(index, "category", o.v)}
                title={o.label}
                className="flex-1 flex items-center justify-center py-1.5 rounded transition-colors"
                style={{
                  color:      ch.category === o.v ? "#00FFFF" : "rgba(255,255,255,0.3)",
                  background: ch.category === o.v ? "rgba(0,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  border:     ch.category === o.v ? "1px solid rgba(0,255,255,0.35)" : "1px solid rgba(255,255,255,0.06)",
                }}
              ><o.icon size={13} /></button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">DIFFICULTY</p>
          <div className="flex gap-1.5">
            {BUILD_DIFF_OPTS.map(o => (
              <button key={o.v} onClick={() => { onChange(index, "difficulty", o.v); onChange(index, "diffColor", o.c); }}
                className="flex-1 font-mono text-[9px] py-1.5 rounded transition-colors"
                style={{
                  color:      ch.difficulty === o.v ? o.c : "rgba(255,255,255,0.3)",
                  background: ch.difficulty === o.v ? `${o.c}15` : "rgba(255,255,255,0.03)",
                  border:     ch.difficulty === o.v ? `1px solid ${o.c}40` : "1px solid rgba(255,255,255,0.06)",
                }}
              >{o.v}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="TITLE" value={ch.title} onChange={f("title")} placeholder="Build a URL Shortener" />
        <Input label="ID SLUG" value={ch.id} onChange={f("id")} placeholder="url-shortener" hint="Stable - don't change once a build has started against it." />
      </div>
      <Textarea label="BRIEF (shown on the card)" value={ch.brief} onChange={f("brief")} placeholder="One-line hook." rows={2} />
      <Textarea label="FULL DESCRIPTION (shown in the detail view)" value={ch.description} onChange={f("description")} placeholder="What to build, constraints, suggested approach..." rows={4} />
      <Input label="SUGGESTED STACK (comma separated)" value={ch.stack} onChange={f("stack")} placeholder="Any backend language, A database, Redis (optional)" />
    </div>
  );
}

function BuildChallengesPanel() {
  const [challenges, setChallenges] = useState(null);
  const [editIdx, setEditIdx] = useState(null); // null closed, -1 new, n editing
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoc(doc(db, "system", "build"))
      .then(snap => setChallenges(snap.exists() ? (snap.data().challenges || []) : []))
      .catch(() => setChallenges([]));
  }, []);

  // Same one-doc-array shape as Grind/Arena: every save writes the whole list.
  const persist = async (next) => {
    setSaving(true); setError("");
    try {
      const cleaned = next.map(c => ({
        ...c,
        stack: typeof c.stack === "string" ? c.stack.split(",").map(t => t.trim()).filter(Boolean) : (c.stack || []),
      }));
      await setDoc(doc(db, "system", "build"), { challenges: cleaned, updatedAt: serverTimestamp() });
      setChallenges(cleaned);
      logAdminActivity("updated build challenges", `${cleaned.length} challenge(s)`);
      return true;
    } catch (e) { setError(e?.message || "Could not save."); return false; }
    finally { setSaving(false); }
  };
  const open = (i) => {
    const c = i === -1 ? { ...BLANK_BUILD_CHALLENGE } : challenges[i];
    setDraft({ ...c, stack: Array.isArray(c.stack) ? c.stack.join(", ") : (c.stack || "") });
    setError(""); setEditIdx(i);
  };
  const saveDraft = async () => {
    if (!draft.title?.trim()) return setError("A title is required.");
    const next = [...challenges];
    if (editIdx === -1) next.push(draft); else next[editIdx] = draft;
    if (await persist(next)) setEditIdx(null);
  };
  const setLocked = (i, locked) => persist(challenges.map((c, j) => (j === i ? { ...c, locked } : c)));

  const rows = (challenges || []).map((c, i) => ({ ...c, _i: i, _key: String(i) }));
  const locked = rows.filter(c => c.locked).length;
  const cats = [...new Set(rows.map(c => c.category).filter(Boolean))];

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Build challenges", value: challenges?.length, sub: "On /build", icon: Hammer, color: KIT.green, loading: !challenges },
        { label: "Open", value: challenges ? rows.length - locked : null, sub: "Builders can start these", icon: Check, color: KIT.cyan, loading: !challenges },
        { label: "Locked", value: challenges ? locked : null, sub: "Visible but not startable", icon: LockIcon, color: KIT.orange, loading: !challenges },
        { label: "Categories", value: challenges ? cats.length : null, sub: cats.slice(0, 3).join(", "), icon: Layers, color: KIT.purple, loading: !challenges },
      ]} />
      <DataTable title="All build challenges" icon={Hammer} subtitle="Project-based challenges shown on /build."
        rows={rows} loading={!challenges} rowKey={r => r._key}
        searchKeys={["title", "brief", "description", "id"]} searchPlaceholder="Search challenges..."
        filters={[
          { key: "category", label: "All categories", options: BUILD_CATEGORY_OPTS.map(o => ({ value: o.v, label: o.label })) },
          { key: "difficulty", label: "All levels", options: BUILD_DIFF_OPTS.map(o => ({ value: o.v, label: o.v[0] + o.v.slice(1).toLowerCase() })) },
        ]}
        primaryAction={{ label: "Add challenge", icon: Plus, onClick: () => open(-1) }}
        onRowClick={r => open(r._i)} emptyText="No build challenges yet."
        columns={[
          { key: "title", label: "Challenge", render: c => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{c.title || "Untitled"}</p>
              <p className="font-sans text-xs text-white/40 truncate">{c.brief}</p>
            </div>
          ) },
          { key: "category", label: "Category", render: c => <Pill color={KIT.cyan}>{BUILD_CATEGORY_OPTS.find(o => o.v === c.category)?.label || c.category || "-"}</Pill> },
          { key: "difficulty", label: "Level", render: c => <Pill color={BUILD_DIFF_OPTS.find(o => o.v === c.difficulty)?.c || KIT.muted}>{c.difficulty ? c.difficulty[0] + c.difficulty.slice(1).toLowerCase() : "-"}</Pill> },
          { key: "stack", label: "Stack", sortable: false, render: c => <span className="font-sans text-xs text-white/55 truncate block max-w-[200px]">{(c.stack || []).join(", ") || "-"}</span> },
          { key: "locked", label: "Status", render: c => (
            <div className="flex items-center gap-2.5">
              <Toggle on={!c.locked} label={`Open ${c.title}`} disabled={saving} onChange={on => setLocked(c._i, !on)} />
              <span className="font-sans text-xs" style={{ color: c.locked ? "rgba(255,255,255,0.45)" : KIT.green }}>{c.locked ? "Locked" : "Open"}</span>
            </div>
          ) },
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Edit", onClick: () => open(c._i) },
          { icon: Copy, label: "Duplicate", disabled: saving, onClick: () => persist([...challenges.slice(0, c._i + 1), { ...challenges[c._i], id: `${challenges[c._i].id || "challenge"}-copy`, title: `${c.title} (copy)`, locked: true }, ...challenges.slice(c._i + 1)]) },
          { icon: Trash2, label: "Delete", danger: true, disabled: saving, onClick: () => confirm(`Remove "${c.title}"?`) && persist(challenges.filter((_, j) => j !== c._i)) },
        ]}
      />
      {error && editIdx === null && <p className="font-sans text-sm text-red-400">{error}</p>}
      <Drawer open={editIdx !== null} onClose={() => setEditIdx(null)}
        title={editIdx === -1 ? "Add build challenge" : draft?.title || "Edit build challenge"}
        subtitle="Saved straight to /build."
        footer={<>
          <SecondaryButton onClick={() => setEditIdx(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={saveDraft}>{editIdx === -1 ? "Add challenge" : "Save changes"}</PrimaryButton>
        </>}>
        {draft && (
          <>
            <BuildChallengeForm ch={draft} index={0} onChange={(_, k, v) => setDraft(d => ({ ...d, [k]: v }))} onRemove={() => setEditIdx(null)} />
            {error && <p className="font-sans text-xs text-red-400 mt-3">{error}</p>}
          </>
        )}
      </Drawer>
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
  const [drawer, setDrawer] = useState(null); // "new" | institution id | null

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
      logAdminActivity("created institution", `${form.name.trim()} (${slug})`);
      setDrawer(slug);
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
    logAdminActivity(next === "active" ? "activated institution" : "suspended institution", inst.name || inst.id);
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

  const sel = drawer && drawer !== "new" ? institutions.find(i => i.id === drawer) : null;
  const active = institutions.filter(i => i.status === "active").length;
  const students = institutions.reduce((n, i) => n + (i.studentCount || 0), 0);
  const noAdmin = institutions.filter(i => !(adminsByInst[i.id] || []).length).length;
  const MODE_C = { public: KIT.green, invite_only: KIT.orange, private: KIT.purple };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Institutions", value: institutions.length, sub: `${active} active`, icon: Building2, color: KIT.cyan, loading },
        { label: "Students", value: students, sub: institutions.length ? `${fmt(Math.round(students / institutions.length))} per college` : "", icon: Users, color: KIT.green, loading },
        { label: "Suspended", value: institutions.length - active, sub: "Access paused", icon: X, color: institutions.length - active ? KIT.red : KIT.muted, loading },
        { label: "Without an admin", value: noAdmin, sub: noAdmin ? "Nobody can run these yet" : "Every college has one", icon: ShieldCheck, color: noAdmin ? KIT.orange : KIT.green, loading },
      ]} />

      <DataTable title="Campus institutions" icon={Building2} subtitle="Each college's workspace at campus.devert.in/<slug>."
        rows={institutions} loading={loading}
        searchKeys={["name", "id", "location", "website"]} searchPlaceholder="Search colleges..."
        filters={[
          { key: "status", label: "All statuses", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] },
          { key: "accessMode", label: "All access modes", get: i => i.accessMode || "public", options: ACCESS_MODES.map(m => ({ value: m, label: m.replace("_", " ") })) },
        ]}
        primaryAction={{ label: "Add institution", icon: Plus, onClick: () => { setError(""); setDrawer("new"); } }}
        onRowClick={i => setDrawer(i.id)} emptyText="No institutions yet."
        columns={[
          { key: "name", label: "Institution", render: i => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{i.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">campus.devert.in/{i.id}{i.location ? ` · ${i.location}` : ""}</p>
            </div>
          ) },
          { key: "studentCount", label: "Students", sort: i => i.studentCount || 0, render: i => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(i.studentCount || 0)}</span> },
          { key: "admins", label: "Admins", sort: i => (adminsByInst[i.id] || []).length,
            render: i => (adminsByInst[i.id] || []).length ? <span className="font-sans text-sm text-white/70 tabular-nums">{(adminsByInst[i.id] || []).length}</span> : <Pill color={KIT.orange}>None</Pill> },
          { key: "accessMode", label: "Access", render: i => <Pill color={MODE_C[i.accessMode || "public"] || KIT.muted}>{(i.accessMode || "public").replace("_", " ")}</Pill> },
          { key: "status", label: "Status", render: i => (
            <div className="flex items-center gap-2.5">
              <Toggle on={i.status === "active"} label={`Activate ${i.name}`} onChange={() => toggleStatus(i)} />
              <span className="font-sans text-xs" style={{ color: i.status === "active" ? KIT.green : KIT.red }}>{i.status === "active" ? "Active" : "Suspended"}</span>
            </div>
          ) },
        ]}
        rowActions={i => [
          { icon: Pencil, label: "Manage", onClick: () => setDrawer(i.id) },
          { icon: ExternalLink, label: "Open campus page", onClick: () => window.open(`https://campus.devert.in/${i.id}`, "_blank", "noopener") },
        ]}
      />

      <Drawer open={drawer === "new"} onClose={() => setDrawer(null)} width={600} title="Add institution"
        subtitle="Creates the college's workspace. Add its first admin right after."
        footer={<>
          <SecondaryButton onClick={() => setDrawer(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Plus} busy={creating} onClick={handleCreate}>Create institution</PrimaryButton>
        </>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="SLUG (campus.devert.in/<slug>)" value={form.slug} onChange={v => setForm(p => ({ ...p, slug: v }))} placeholder="mrcet" />
          <Input label="COLLEGE NAME" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Malla Reddy College of Engineering & Technology" />
          <Input label="LOCATION" value={form.location} onChange={v => setForm(p => ({ ...p, location: v }))} placeholder="Hyderabad, Telangana" />
          <Input label="WEBSITE" value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} placeholder="https://mrcet.ac.in" />
          <div>
            <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">ACCESS MODE</p>
            <Dropdown value={form.accessMode} onChange={v => setForm(p => ({ ...p, accessMode: v }))} options={ACCESS_MODES} className="w-full"
              buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.1]" />
          </div>
        </div>
        {error && <p className="font-sans text-xs text-red-400 mt-3">{error}</p>}
      </Drawer>

      <Drawer open={!!sel} onClose={() => { setDrawer(null); setRemovingAdmin(null); }} width={640}
        title={sel?.name || ""} subtitle={sel ? `campus.devert.in/${sel.id} · ${fmt(sel.studentCount || 0)} students` : ""}>
        {sel && (
          <div className="space-y-4">
            <DrawerSection title="Access mode" hint="public: anyone can request to join, you approve each. invite_only: only admins add students (roster import or direct approval). private: hidden from the directory - only admins and approved students can reach it.">
              <Dropdown value={sel.accessMode || "public"} onChange={v => handleChangeAccessMode(sel, v)} options={ACCESS_MODES} className="w-48"
                buttonClassName="font-mono text-xs px-3 py-2 rounded bg-white/[0.04] border border-white/[0.1] text-white/80" />
            </DrawerSection>

            <DrawerSection title="Status">
              <label className="flex items-center gap-3">
                <Toggle on={sel.status === "active"} label="Institution active" onChange={() => toggleStatus(sel)} />
                <span className="font-sans text-sm text-white/70">{sel.status === "active" ? "Active - students and staff can use it" : "Suspended - access is paused"}</span>
              </label>
            </DrawerSection>

            <DrawerSection title="Admins" hint="Faculty or placement officers who run this college's workspace.">
              <div className="flex gap-2">
                <input value={adminHandle[sel.id] || ""} onChange={e => setAdminHandle(p => ({ ...p, [sel.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleAddAdmin(sel.id)} placeholder="DeVert handle, e.g. priya"
                  className="flex-1 font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25"
                  style={{ background: "rgba(255,255,255,0.03)" }} />
                <PrimaryButton icon={Plus} busy={working[sel.id]} onClick={() => handleAddAdmin(sel.id)}>Add admin</PrimaryButton>
              </div>
              {adminFeedback[sel.id] && (
                <p className="font-sans text-xs" style={{ color: adminFeedback[sel.id].type === "success" ? KIT.green : KIT.red }}>{adminFeedback[sel.id].text}</p>
              )}
              <div className="rounded-lg border divide-y overflow-hidden" style={{ borderColor: KIT.line }}>
                {(adminsByInst[sel.id] || []).length === 0 ? (
                  <p className="font-sans text-sm text-white/35 px-3 py-3">No admins yet.</p>
                ) : adminsByInst[sel.id].map(a => {
                  const key = `${sel.id}_${a.uid}`;
                  return (
                    <div key={a.uid} className="flex items-center gap-3 px-3 py-2.5" style={{ borderColor: KIT.line }}>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-sm text-white truncate">{a.displayName || "(no name)"}</p>
                        {a.handle && <p className="font-sans text-xs text-white/40">@{a.handle}</p>}
                      </div>
                      <Pill color={KIT.cyan}>{a.role}</Pill>
                      {removingAdmin === key ? (
                        <>
                          <SecondaryButton onClick={() => setRemovingAdmin(null)}>Cancel</SecondaryButton>
                          <button onClick={() => handleRemoveAdmin(sel.id, a.uid)} disabled={working[key]}
                            className="font-sans text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50" style={{ background: KIT.red, color: "#05080F" }}>
                            {working[key] ? "Removing..." : "Remove"}
                          </button>
                        </>
                      ) : (
                        <IconButton icon={Trash2} label="Remove as admin" danger onClick={() => setRemovingAdmin(key)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function UsersPanel() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
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

  const handleExpand = async (uid) => {
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

  const u = users.find(x => x.uid === expanded);
  const d = u ? detail[u.uid] : null;
  const joined = (x) => (x.joinedAt?.toDate ? x.joinedAt.toDate() : null);
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const tiers = [...new Set(users.map(x => x.tier?.name).filter(Boolean))];
  const campus = users.filter(x => (x.institutionId || "").trim()).length;
  const totalXp = users.reduce((n, x) => n + (x.xp || 0), 0);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Total users", value: users.length, sub: `${fmt(users.filter(x => joined(x)?.getTime() > week).length)} joined this week`, icon: Users, color: KIT.green, loading },
        { label: "Campus students", value: campus, sub: "Linked to an institution", icon: Building2, color: KIT.cyan, loading },
        { label: "Total XP", value: totalXp, sub: users.length ? `${fmt(Math.round(totalXp / users.length))} per user` : "", icon: Zap, color: KIT.purple, loading },
        { label: "Arena wins", value: users.reduce((n, x) => n + (x.arenaWins || 0), 0), sub: "Across all users", icon: Swords, color: KIT.orange, loading },
      ]} />

      <DataTable title="All users" icon={Users} subtitle="Every account, highest XP first. Click a user for details and XP adjustments."
        rows={users} loading={loading} rowKey={x => x.uid || x.id} pageSize={15}
        searchKeys={["handle", "email", "displayName", "uid"]} searchPlaceholder="Search handle, email, name or UID..."
        filters={[
          { key: "tier", label: "All tiers", get: x => x.tier?.name || "RECRUIT", options: [...new Set(["RECRUIT", ...tiers])].map(t => ({ value: t, label: t[0] + t.slice(1).toLowerCase() })) },
          { key: "campus", label: "All accounts", get: x => ((x.institutionId || "").trim() ? "campus" : "individual"), options: [{ value: "campus", label: "Campus students" }, { value: "individual", label: "Individual" }] },
        ]}
        onRowClick={x => handleExpand(x.uid)}
        columns={[
          { key: "handle", label: "User", render: x => (
            <div className="min-w-0 w-[240px] xl:w-[300px]">
              <p className="font-sans text-sm font-medium text-white truncate">{x.displayName || `@${x.handle || "?"}`}</p>
              <p className="font-sans text-xs text-white/40 truncate">@{x.handle || "?"} · {x.email || "no email"}</p>
            </div>
          ) },
          { key: "tier", label: "Tier", sort: x => x.xp || 0, render: x => <Pill color={x.tier?.color || KIT.muted}>{x.tier?.name || "RECRUIT"}</Pill> },
          { key: "xp", label: "XP", sort: x => x.xp || 0, render: x => <span className="font-sans text-sm text-white/85 tabular-nums">{fmt(x.xp || 0)}</span> },
          { key: "arenaWins", label: "Arena wins", sort: x => x.arenaWins || 0, render: x => <span className="font-sans text-sm text-white/65 tabular-nums">{fmt(x.arenaWins || 0)}</span> },
          { key: "ships", label: "Ships", sort: x => x.ships || 0, render: x => <span className="font-sans text-sm text-white/65 tabular-nums">{fmt(x.ships || 0)}</span> },
          { key: "joinedAt", label: "Joined", sort: x => joined(x)?.getTime() || 0,
            render: x => <span className="font-sans text-xs text-white/50">{joined(x)?.toLocaleDateString("en-IN", { dateStyle: "medium" }) || "-"}</span> },
        ]}
        rowActions={x => [
          { icon: Eye, label: "Details", onClick: () => handleExpand(x.uid) },
          { icon: ExternalLink, label: "Open profile", onClick: () => window.open(`/u/${x.handle}`, "_blank", "noopener") },
        ]}
      />

      <Drawer open={!!u} onClose={() => setExpanded(null)} title={u ? (u.displayName || `@${u.handle}`) : ""}
        subtitle={u ? `@${u.handle} · ${u.email || "no email"}` : ""}>
        {u && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ["XP", fmt(u.xp || 0)], ["Tier", u.tier?.name || "RECRUIT"], ["Arena wins", fmt(u.arenaWins || 0)],
                ["Ships", fmt(u.ships || 0)], ["Pulse posts", d ? fmt(d.postCount) : "..."], ["Projects", d ? fmt(d.projectCount) : "..."],
                ["Coins", fmt(u.coins || 0)], ["Followers", fmt(u.followersCount || 0)], ["Earnings", d ? `₹${(d.earnings?.totalInr || 0).toFixed(2)}` : "..."],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3" style={{ borderColor: KIT.line }}>
                  <p className="font-sans text-[11px] text-white/45">{k}</p>
                  <p className="font-sans text-base font-semibold text-white tabular-nums mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            <DrawerSection title="Adjust XP" hint="Atomic, and recorded in the reward_grants ledger with you as the granter - it shows on the user's Reward Timeline.">
              <div className="flex flex-wrap items-center gap-2">
                <input type="number" min="1" value={xpDelta[u.uid] ?? "100"}
                  onChange={e => setXpDelta(p => ({ ...p, [u.uid]: e.target.value }))}
                  className="font-sans text-sm text-white/85 w-28 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25"
                  style={{ background: "rgba(255,255,255,0.03)" }} aria-label="XP amount" />
                <PrimaryButton icon={Plus} busy={working[`xp-${u.uid}`]} onClick={() => handleXP(u.uid, 1)}>Grant XP</PrimaryButton>
                <SecondaryButton onClick={() => handleXP(u.uid, -1)} disabled={working[`xp-${u.uid}`]}>Remove XP</SecondaryButton>
              </div>
            </DrawerSection>

            <DrawerSection title="Account">
              <p className="font-mono text-xs text-white/55 break-all">UID: {u.uid}</p>
              {u.institutionId && <p className="font-sans text-xs text-white/55">Institution: <span className="font-mono">{u.institutionId}</span></p>}
              {joined(u) && <p className="font-sans text-xs text-white/55">Joined {joined(u).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</p>}
              {u.bio && <p className="font-sans text-sm text-white/65 leading-relaxed">{u.bio}</p>}
              <div><SecondaryButton icon={ExternalLink} onClick={() => window.open(`/u/${u.handle}`, "_blank", "noopener")}>Open public profile</SecondaryButton></div>
            </DrawerSection>
          </div>
        )}
      </Drawer>
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
  const [adding,      setAdding]      = useState(false);

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
      logAdminActivity("added broadcast episode", form.title.trim());
      setForm(blankEp);
      setAdding(false);
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
      logAdminActivity("went live", url);
    } catch (err) { console.error(err); }
    finally { setLiveLoading(false); }
  };

  const handleEndStream = async () => {
    setLiveLoading(true);
    try {
      await setDoc(doc(db, "system", "broadcast"), { liveUrl: "", isLive: false, liveUpdatedAt: serverTimestamp() }, { merge: true });
      setLiveUrl(""); setIsLive(false); setLiveInput("");
      logAdminActivity("ended live stream", "");
    } catch (err) { console.error(err); }
    finally { setLiveLoading(false); }
  };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Stream", value: isLive ? "Live" : "Offline", sub: isLive ? "Broadcasting now" : "Not streaming", icon: Radio, color: isLive ? KIT.red : KIT.muted, loading },
        { label: "Episodes", value: episodes.length, sub: "Past recordings", icon: Tv2, color: KIT.cyan, loading },
        { label: "Upcoming", value: upcoming.length, sub: "Scheduled streams", icon: Flag, color: KIT.orange, loading },
        { label: "Registrations", value: upcoming.reduce((n, u) => n + (parseInt(u.registered) || 0), 0), sub: "For upcoming streams", icon: Users, color: KIT.purple, loading },
      ]} />

      <div className="rounded-xl border p-4 sm:p-5" style={{ background: KIT.surface, borderColor: isLive ? "rgba(255,80,80,0.45)" : KIT.line }}>
        <div className="flex items-start gap-3 mb-3">
          <span className="relative flex h-2.5 w-2.5 mt-1.5">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? "bg-red-500" : "bg-white/20"}`} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-sans text-base font-semibold text-white">Live stream</h2>
            <p className="font-sans text-xs text-white/45 mt-0.5">{isLive ? "Everyone on /broadcast sees this stream right now." : "Paste a YouTube Live link and go live - /broadcast switches over instantly."}</p>
          </div>
          {isLive && <Pill color={KIT.red}>Live now</Pill>}
        </div>
        {isLive ? (
          <div className="flex flex-wrap items-center gap-3">
            <a href={liveUrl} target="_blank" rel="noreferrer" className="font-mono text-xs text-white/60 hover:text-white break-all flex-1 min-w-0">{liveUrl}</a>
            <SecondaryButton icon={X} onClick={handleEndStream} disabled={liveLoading}>{liveLoading ? "Ending..." : "End stream"}</SecondaryButton>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]"><Input label="YOUTUBE LIVE URL" value={liveInput} onChange={setLiveInput} placeholder="https://youtube.com/live/... or youtu.be/..." /></div>
            <PrimaryButton icon={Radio} busy={liveLoading} disabled={!liveInput.trim()} onClick={handleGoLive}>Go live</PrimaryButton>
          </div>
        )}
      </div>

      <DataTable title="Past episodes" icon={Tv2} subtitle="Recordings listed on /broadcast, newest first."
        rows={episodes} loading={loading}
        searchKeys={["title", "ep", "tag"]} searchPlaceholder="Search episodes..."
        primaryAction={{ label: "Add episode", icon: Plus, onClick: () => { setForm(blankEp); setError(""); setAdding(true); } }}
        emptyText="No episodes yet."
        columns={[
          { key: "ep", label: "Ep", render: e => <span className="font-mono text-xs text-white/60">{e.ep || "-"}</span> },
          { key: "title", label: "Title", render: e => <span className="font-sans text-sm font-medium text-white truncate block w-[260px] xl:w-[340px]">{e.title}</span> },
          { key: "tag", label: "Tag", render: e => e.tag ? <Pill color={KIT.cyan}>{e.tag}</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
          { key: "duration", label: "Duration", render: e => <span className="font-sans text-xs text-white/60">{e.duration || "-"}</span> },
          { key: "views", label: "Views", render: e => <span className="font-sans text-xs text-white/60">{e.views || "-"}</span> },
          { key: "date", label: "Date", render: e => <span className="font-sans text-xs text-white/60">{e.date || "-"}</span> },
        ]}
        rowActions={e => [
          e.url && { icon: ExternalLink, label: "Watch", onClick: () => window.open(e.url, "_blank", "noopener") },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteEpisode(e.id) },
        ]}
      />

      <div className="rounded-xl border p-4 sm:p-5 space-y-3" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-sans text-base font-semibold text-white">Upcoming streams</h2>
            <p className="font-sans text-xs text-white/45 mt-0.5">The schedule shown on /broadcast. Rows with no title are dropped on save.</p>
          </div>
          <PrimaryButton icon={Check} busy={saving && !adding} onClick={handleSaveUpcoming}>{saved ? "Saved" : "Save schedule"}</PrimaryButton>
        </div>
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
      </div>

      <Drawer open={adding} onClose={() => setAdding(false)} width={600} title="Add episode" subtitle="Listed on /broadcast immediately."
        footer={<>
          <SecondaryButton onClick={() => setAdding(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAddEpisode}>Add episode</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
  const [editingId, setEditingId] = useState(null); // null closed, "new", or an id

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
      if (editingId && editingId !== "new") {
        await updateDoc(doc(db, "changelog", editingId), { ...form });
        logAdminActivity("updated changelog entry", form.hash);
      } else {
        await addDoc(collection(db, "changelog"), { ...form, createdAt: serverTimestamp() });
        logAdminActivity("added changelog entry", form.hash);
      }
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this log entry?")) return;
    await deleteDoc(doc(db, "changelog", id));
    load();
  };

  const TYPE_C = { feat: KIT.cyan, fix: KIT.red, perf: KIT.green, chore: KIT.muted, docs: KIT.purple, refactor: KIT.orange };
  const openEdit = (log) => {
    setForm({ hash: log.hash || "", type: log.type || "feat", msg: log.msg || "", detail: log.detail || "", date: log.date || "", author: log.author || "" });
    setError(""); setEditingId(log.id);
  };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Changelog entries", value: logs.length, sub: "Shown on /logs", icon: GitCommit, color: KIT.green, loading },
        { label: "Features", value: logs.filter(l => l.type === "feat").length, sub: "type: feat", icon: Zap, color: KIT.cyan, loading },
        { label: "Fixes", value: logs.filter(l => l.type === "fix").length, sub: "type: fix", icon: Hammer, color: KIT.red, loading },
        { label: "Latest", value: logs[0]?.hash || "-", sub: logs[0]?.date || "", icon: Flag, color: KIT.purple, loading },
      ]} />
      <DataTable title="Changelog" icon={GitCommit} subtitle="Public release notes on /logs, newest first."
        rows={logs} loading={loading}
        searchKeys={["hash", "msg", "detail", "author"]} searchPlaceholder="Search entries..."
        filters={[{ key: "type", label: "All types", options: LOG_TYPE_OPTS.map(t => ({ value: t, label: t })) }]}
        primaryAction={{ label: "Add entry", icon: Plus, onClick: () => { setForm(blank); setError(""); setEditingId("new"); } }}
        onRowClick={openEdit} emptyText="No changelog entries yet."
        columns={[
          { key: "hash", label: "Version", render: l => <span className="font-mono text-sm text-white/85">{l.hash}</span> },
          { key: "type", label: "Type", render: l => <Pill color={TYPE_C[l.type] || KIT.muted}>{l.type}</Pill> },
          { key: "msg", label: "Message", render: l => (
            <div className="min-w-0 w-[260px] xl:w-[340px]">
              <p className="font-sans text-sm text-white truncate">{l.msg}</p>
              <p className="font-sans text-xs text-white/40 truncate">{l.detail}</p>
            </div>
          ) },
          { key: "date", label: "Date", render: l => <span className="font-sans text-xs text-white/55">{l.date || "-"}</span> },
          { key: "author", label: "Author", render: l => <span className="font-sans text-xs text-white/55">{l.author || "-"}</span> },
        ]}
        rowActions={l => [
          { icon: Pencil, label: "Edit", onClick: () => openEdit(l) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(l.id) },
        ]}
      />
      <Drawer open={!!editingId} onClose={() => setEditingId(null)} width={600}
        title={editingId === "new" ? "Add changelog entry" : `Edit ${form.hash}`} subtitle="Published on /logs."
        footer={<>
          <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAdd}>{editingId === "new" ? "Add entry" : "Save changes"}</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
      logAdminActivity(publishAndNotify ? "published opportunity" : "saved opportunity", data.title);
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

  const STATUS_C = { published: KIT.green, draft: KIT.muted, archived: KIT.red };
  const pub = opportunities.filter(o => o.status === "published");
  const views = opportunities.reduce((n, o) => n + (o.views || 0), 0);
  const clicks = opportunities.reduce((n, o) => n + (o.applyClicks || 0), 0);
  const types = [...new Set(opportunities.map(o => o.type).filter(Boolean))];
  const setPublished = async (o, on) => {
    // Status only: merging the whole row back would overwrite view/apply
    // counters that moved since this list loaded.
    await saveOpportunity(o.id, { status: on ? "published" : "draft" });
    load();
  };
  const canSave = !saving && form.title.trim() && form.registrationUrl.trim();

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Opportunities", value: opportunities.length, sub: `${pub.length} published`, icon: Briefcase, color: KIT.green, loading },
        { label: "Views", value: views, sub: "Detail page views", icon: Eye, color: KIT.cyan, loading },
        { label: "Apply clicks", value: clicks, sub: views ? `${Math.round((100 * clicks) / views)}% of views` : "", icon: ExternalLink, color: KIT.orange, loading },
        { label: "Saves", value: opportunities.reduce((n, o) => n + (o.saveCount || 0), 0), sub: "Bookmarked by students", icon: Star, color: KIT.purple, loading },
      ]} />
      <DataTable title="All opportunities" icon={Briefcase} subtitle="Internships, jobs and programs on /opportunities."
        rows={opportunities} loading={loading}
        searchKeys={["title", "organizationName", "type", "shortDescription"]} searchPlaceholder="Search opportunities..."
        filters={[
          { key: "status", label: "All statuses", options: ["published", "draft", "archived"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          ...(types.length ? [{ key: "type", label: "All types", options: types.map(t => ({ value: t, label: t })) }] : []),
        ]}
        primaryAction={{ label: "Add opportunity", icon: Plus, onClick: startAdd }}
        onRowClick={startEdit} emptyText="No opportunities yet."
        columns={[
          { key: "title", label: "Opportunity", render: o => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{o.title}{o.featured && <Star size={12} className="inline ml-1.5 -mt-0.5" style={{ color: KIT.gold }} />}</p>
              <p className="font-sans text-xs text-white/40 truncate">{o.organizationName}</p>
            </div>
          ) },
          { key: "type", label: "Type", render: o => <Pill color={KIT.cyan}>{o.type || "-"}</Pill> },
          { key: "views", label: "Views", sort: o => o.views || 0, render: o => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(o.views || 0)}</span> },
          { key: "applyClicks", label: "Applies", sort: o => o.applyClicks || 0, render: o => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(o.applyClicks || 0)}</span> },
          { key: "registrationDeadline", label: "Deadline", render: o => <span className="font-sans text-xs text-white/55">{o.registrationDeadline ? new Date(o.registrationDeadline).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-"}</span> },
          { key: "status", label: "Status", render: o => (
            <div className="flex items-center gap-2.5">
              <Toggle on={o.status === "published"} label={`Publish ${o.title}`} onChange={on => setPublished(o, on)} />
              <span className="font-sans text-xs" style={{ color: STATUS_C[o.status] || KIT.muted }}>{o.status ? o.status[0].toUpperCase() + o.status.slice(1) : "Draft"}</span>
            </div>
          ) },
        ]}
        rowActions={o => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(o) },
          { icon: Copy, label: "Duplicate", onClick: () => handleDuplicate(o) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(o.id) },
        ]}
      />
      <Drawer open={adding || !!editingId} onClose={() => { setEditingId(null); setAdding(false); }}
        title={editingId ? `Edit ${form.title || "opportunity"}` : "Add opportunity"}
        subtitle="Publishing for the first time also sends an in-app notification."
        footer={<>
          <SecondaryButton onClick={() => { setEditingId(null); setAdding(false); }}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => handleSave(false)} disabled={!canSave}>Save as draft</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!canSave} onClick={() => handleSave(true)}>Publish & notify</PrimaryButton>
        </>}>
        <div className="space-y-3">
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

        </div>
      </Drawer>
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
  const [drawer,     setDrawer]     = useState(null); // "news" | "job" | null

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
      setTicker(items);
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
      logAdminActivity("added intel news", newsForm.title.trim());
      setNewsForm(blankNews);
      setDrawer(null);
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
      logAdminActivity("added intel job", `${jobForm.company.trim()} - ${jobForm.role.trim()}`);
      setJobForm(blankJob);
      setDrawer(null);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm("Delete?")) return;
    await deleteDoc(doc(db, "intel_jobs", id));
    loadData();
  };


  const SIGNAL_C = { HIGH: KIT.green, MED: KIT.orange, LOW: KIT.muted };
  const when = (t) => (t?.toDate ? t.toDate() : null);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "News articles", value: news.length, sub: `${news.filter(n => n.signal === "HIGH").length} high signal`, icon: Radio, color: KIT.cyan, loading },
        { label: "Job listings", value: jobs.length, sub: `${jobs.filter(j => j.hot).length} marked hot`, icon: Briefcase, color: KIT.green, loading },
        { label: "Ticker items", value: ticker.length, sub: "Scrolling headline bar", icon: Tv2, color: KIT.orange, loading },
        { label: "Internships", value: jobs.filter(j => j.type === "Internship").length, sub: "Of the job listings", icon: GraduationCap, color: KIT.purple, loading },
      ]} />

      <div className="rounded-xl border p-4 sm:p-5 space-y-3" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-sans text-base font-semibold text-white">Headline ticker</h2>
            <p className="font-sans text-xs text-white/45 mt-0.5">The scrolling bar at the top of /intel. One headline per line.</p>
          </div>
          <PrimaryButton icon={Check} busy={saving && !drawer} onClick={handleSaveTicker}>{saved ? "Saved" : "Save ticker"}</PrimaryButton>
        </div>
        <Textarea label="TICKER ITEMS" value={tickerRaw} onChange={setTickerRaw}
          placeholder={"RUST SURPASSES GO IN BACKEND ADOPTION\nOPENAI DROPS GPT-5 API..."} rows={4} />
      </div>

      <DataTable title="News articles" icon={Radio} subtitle="Stories on the /intel feed, newest first."
        rows={news} loading={loading}
        searchKeys={["title", "source", "tag"]} searchPlaceholder="Search news..."
        filters={[{ key: "signal", label: "All signals", options: SIGNAL_OPTS.map(v => ({ value: v, label: v })) }]}
        primaryAction={{ label: "Add article", icon: Plus, onClick: () => { setNewsForm(blankNews); setError(""); setDrawer("news"); } }}
        emptyText="No news yet."
        columns={[
          { key: "title", label: "Headline", render: n => <span className="font-sans text-sm font-medium text-white truncate block w-[280px] xl:w-[380px]">{n.title}</span> },
          { key: "signal", label: "Signal", render: n => <Pill color={SIGNAL_C[n.signal] || KIT.muted}>{n.signal || "-"}</Pill> },
          { key: "source", label: "Source", render: n => <span className="font-sans text-xs text-white/60">{n.source || "-"}</span> },
          { key: "tag", label: "Tag", render: n => n.tag ? <Pill color={KIT.cyan}>{n.tag}</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
          { key: "createdAt", label: "Added", sort: n => when(n.createdAt)?.getTime() || 0, render: n => <span className="font-sans text-xs text-white/50">{when(n.createdAt)?.toLocaleDateString("en-IN", { dateStyle: "medium" }) || "-"}</span> },
        ]}
        rowActions={n => [
          n.url && { icon: ExternalLink, label: "Open article", onClick: () => window.open(n.url, "_blank", "noopener") },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteNews(n.id) },
        ]}
      />

      <DataTable title="Job listings" icon={Briefcase} subtitle="Roles on the /intel jobs board."
        rows={jobs} loading={loading}
        searchKeys={["company", "role", "stack", "ctc"]} searchPlaceholder="Search jobs..."
        filters={[
          { key: "type", label: "All types", options: [{ value: "Full-time", label: "Full-time" }, { value: "Internship", label: "Internship" }] },
          { key: "hot", label: "Any priority", get: j => (j.hot ? "hot" : "normal"), options: [{ value: "hot", label: "Hot only" }, { value: "normal", label: "Not hot" }] },
        ]}
        primaryAction={{ label: "Add job", icon: Plus, onClick: () => { setJobForm(blankJob); setError(""); setDrawer("job"); } }}
        emptyText="No jobs yet."
        columns={[
          { key: "company", label: "Company", render: j => <span className="font-sans text-sm font-medium text-white">{j.company}</span> },
          { key: "role", label: "Role", render: j => <span className="font-sans text-sm text-white/75 truncate block max-w-[240px]">{j.role}</span> },
          { key: "type", label: "Type", render: j => <Pill color={j.type === "Internship" ? KIT.purple : KIT.cyan}>{j.type || "-"}</Pill> },
          { key: "ctc", label: "CTC", render: j => <span className="font-sans text-sm text-white/75">{j.ctc || "-"}</span> },
          { key: "hot", label: "Hot", sort: j => (j.hot ? 1 : 0), render: j => j.hot ? <Pill color={KIT.orange}>Hot</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
        ]}
        rowActions={j => [
          j.url && { icon: ExternalLink, label: "Open listing", onClick: () => window.open(j.url, "_blank", "noopener") },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteJob(j.id) },
        ]}
      />

      <Drawer open={drawer === "news"} onClose={() => setDrawer(null)} width={600} title="Add news article" subtitle="Appears on /intel immediately."
        footer={<>
          <SecondaryButton onClick={() => setDrawer(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAddNews}>Add article</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
          <Input label="URL (optional)" value={newsForm.url} onChange={nf("url")} placeholder="https://..." />
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
      <Drawer open={drawer === "job"} onClose={() => setDrawer(null)} width={600} title="Add job listing" subtitle="Appears on the /intel jobs board immediately."
        footer={<>
          <SecondaryButton onClick={() => setDrawer(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAddJob}>Add job</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
          <Input label="APPLY URL (optional)" value={jobForm.url} onChange={jf("url")} placeholder="https://..." />
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
  const [creating, setCreating] = useState(false);

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
      setCreating(false);
      logAdminActivity("published pulse post", form.title.trim());
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this pulse post?")) return;
    await deleteDoc(doc(db, "pulse_posts", id));
    logAdminActivity("deleted pulse post", posts.find(x => x.id === id)?.title || id);
    load();
  };

  const when = (t) => (t?.toDate ? t.toDate() : null);
  const setFeatured = async (p, featured) => {
    await updateDoc(doc(db, "pulse_posts", p.id), { featured });
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, featured } : x));
  };
  const STATUS_C = { approved: KIT.green, pending: KIT.orange, rejected: KIT.red };
  const statuses = [...new Set(posts.map(x => x.status).filter(Boolean))];

  // The create form, moved verbatim into the drawer.
  const createForm = (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">TYPE</p>
        <div className="flex gap-1.5 flex-wrap">
          {PULSE_TYPES.map(t => (
            <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
              className="font-sans text-xs px-2.5 py-1 rounded-full transition-colors"
              style={{
                color: form.type === t ? "#00FF41" : "rgba(255,255,255,0.45)",
                background: form.type === t ? "rgba(0,255,65,0.08)" : "rgba(255,255,255,0.03)",
                border: form.type === t ? "1px solid rgba(0,255,65,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >{t}</button>
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
      <label className="flex items-center gap-3">
        <Toggle on={form.featured} label="Featured post" onChange={v => setForm(p => ({ ...p, featured: v }))} />
        <span className="font-sans text-sm text-white/60">Feature this post</span>
      </label>
      {error && <p className="font-sans text-xs text-red-400">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Pulse posts", value: posts.length, sub: "All time", icon: Activity, color: KIT.green, loading },
        { label: "Featured", value: posts.filter(x => x.featured).length, sub: "Pinned to the top", icon: Star, color: KIT.gold, loading },
        { label: "Awaiting review", value: posts.filter(x => x.status === "pending").length, sub: "In the moderation queue", icon: ShieldCheck, color: KIT.orange, loading },
        { label: "Likes", value: posts.reduce((n, x) => n + (x.likeCount || 0), 0), sub: "Across all posts", icon: Heart, color: KIT.red, loading },
      ]} />
      <DataTable title="Pulse feed" icon={Activity} subtitle="Every post on /pulse. Pending posts are reviewed in Moderation > Pulse queue."
        rows={posts} loading={loading} pageSize={15}
        searchKeys={["title", "body", "handle", "tags"]} searchPlaceholder="Search posts..."
        filters={[
          { key: "type", label: "All types", options: PULSE_TYPES.map(t => ({ value: t, label: t })) },
          { key: "status", label: "All statuses", options: statuses.map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
        ]}
        primaryAction={{ label: "New post", icon: Plus, onClick: () => { setForm(blank); setError(""); setCreating(true); } }}
        emptyText="No posts yet."
        columns={[
          { key: "title", label: "Post", render: x => (
            <div className="min-w-0 w-[260px] xl:w-[340px]">
              <p className="font-sans text-sm font-medium text-white truncate">{x.title || (x.body || "").slice(0, 60)}</p>
              <p className="font-sans text-xs text-white/40 truncate">{x.body}</p>
            </div>
          ) },
          { key: "type", label: "Type", render: x => <Pill color={KIT.cyan}>{x.type || "-"}</Pill> },
          { key: "likeCount", label: "Likes", sort: x => x.likeCount || 0, render: x => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(x.likeCount || 0)}</span> },
          { key: "status", label: "Status", render: x => <Pill color={STATUS_C[x.status] || KIT.muted}>{x.status ? x.status[0].toUpperCase() + x.status.slice(1) : "-"}</Pill> },
          { key: "featured", label: "Featured", sort: x => (x.featured ? 1 : 0), render: x => <Toggle on={!!x.featured} label={`Feature ${x.title}`} onChange={v => setFeatured(x, v)} /> },
          { key: "createdAt", label: "Posted", sort: x => when(x.createdAt)?.getTime() || 0, render: x => <span className="font-sans text-xs text-white/50">{when(x.createdAt)?.toLocaleDateString("en-IN", { dateStyle: "medium" }) || "-"}</span> },
        ]}
        rowActions={x => [{ icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(x.id) }]}
      />
      <Drawer open={creating} onClose={() => setCreating(false)} title="New Pulse post" subtitle="Published immediately as approved, under your account."
        footer={<>
          <SecondaryButton onClick={() => setCreating(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleAdd}>Publish post</PrimaryButton>
        </>}>
        {createForm}
      </Drawer>
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
  const [drawerOpen,  setDrawerOpen]  = useState(false);
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
    setDrawerOpen(true);
  };
  const startCreate = () => { setEditingId(null); setForm(blankCommunityForm()); setError(""); setDrawerOpen(true); };
  const cancelEdit = () => { setEditingId(null); setForm(blankCommunityForm()); setError(""); setDrawerOpen(false); };

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
      logAdminActivity(editingId ? "updated community" : "created community", payload.name);
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

  const members = communities.reduce((n, c) => n + (c.memberCount || 0), 0);
  const topics = [...new Set(communities.map(c => c.topic).filter(Boolean))];

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Communities", value: communities.length, sub: "On /community", icon: Users, color: KIT.green, loading },
        { label: "Members", value: members, sub: "Total memberships", icon: Users, color: KIT.cyan, loading },
        { label: "Avg size", value: communities.length ? Math.round(members / communities.length) : 0, sub: "Members per community", icon: BarChart3, color: KIT.purple, loading },
        { label: "Topics", value: topics.length, sub: topics.slice(0, 3).join(", "), icon: Layers, color: KIT.orange, loading },
      ]} />
      <DataTable title="All communities" icon={Users} subtitle="Dev communities people can join on /community."
        rows={communities} loading={loading}
        searchKeys={["name", "id", "topic", "description"]} searchPlaceholder="Search communities..."
        filters={topics.length ? [{ key: "topic", label: "All topics", options: topics.map(t => ({ value: t, label: t })) }] : []}
        primaryAction={{ label: "Create community", icon: Plus, onClick: startCreate }}
        onRowClick={startEdit} emptyText="No communities yet."
        columns={[
          { key: "name", label: "Community", render: c => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{c.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{c.description}</p>
            </div>
          ) },
          { key: "id", label: "Slug", render: c => <span className="font-mono text-xs text-white/55">{c.id}</span> },
          { key: "topic", label: "Topic", render: c => c.topic ? <Pill color={KIT.cyan}>{c.topic}</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
          { key: "memberCount", label: "Members", sort: c => c.memberCount || 0, render: c => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(c.memberCount || 0)}</span> },
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(c) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(c.id) },
        ]}
      />
      <Drawer open={drawerOpen} onClose={cancelEdit} width={600}
        title={editingId ? `Edit ${form.name || editingId}` : "Create community"}
        subtitle={editingId ? "The slug is the document ID, so it can't change." : "The slug becomes the community's URL."}
        footer={<>
          <SecondaryButton onClick={cancelEdit}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleSave}>{editingId ? "Save changes" : "Create community"}</PrimaryButton>
        </>}>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {editingId
              ? <div><p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">SLUG</p><p className="font-mono text-sm text-white/70 py-2">{editingId}</p></div>
              : <Input label="SLUG (doc ID)" value={form.slug} onChange={f("slug")} placeholder="ai-builders" />}
            <Input label="NAME" value={form.name} onChange={f("name")} placeholder="AI Builders" />
          </div>
          <Input label="TOPIC (optional)" value={form.topic} onChange={f("topic")} placeholder="ai" />
          <Textarea label="DESCRIPTION" value={form.description} onChange={f("description")} placeholder="What's this community about?" rows={3} />
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
  const [openId,    setOpenId]    = useState(null);

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

  const rows = ADMIN_RESOURCE_BUNDLES.flatMap(bundle => bundle.modules.map((mod, i) => ({
    id: mod.id, n: i + 1, title: mod.title, type: mod.type, bundle: bundle.title, bundleId: bundle.id, color: bundle.color,
    live: resources[mod.id]?.status === "available" && !!resources[mod.id]?.url, url: resources[mod.id]?.url || "",
  })));
  const live = rows.filter(r => r.live).length;
  const sel = rows.find(r => r.id === openId);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Resource modules", value: rows.length, sub: `${ADMIN_RESOURCE_BUNDLES.length} bundles`, icon: BookOpen, color: KIT.cyan },
        { label: "Live", value: live, sub: "Have a download link", icon: Check, color: KIT.green },
        { label: "Coming soon", value: rows.length - live, sub: "Waiting for a link", icon: Target, color: rows.length - live ? KIT.orange : KIT.green },
        { label: "Coverage", value: rows.length ? `${Math.round((100 * live) / rows.length)}%` : "-", sub: "Modules with a link", icon: BarChart3, color: KIT.purple },
      ]} />
      <DataTable title="Intel resources" icon={BookOpen} subtitle="Saving a link flips a module to Live on /intel; clearing it flips it back to Coming soon."
        rows={rows} pageSize={20}
        searchKeys={["title", "bundle", "type"]} searchPlaceholder="Search modules..."
        filters={[
          { key: "bundleId", label: "All bundles", options: ADMIN_RESOURCE_BUNDLES.map(bd => ({ value: bd.id, label: bd.title })) },
          { key: "live", label: "Any status", get: r => (r.live ? "live" : "soon"), options: [{ value: "live", label: "Live" }, { value: "soon", label: "Coming soon" }] },
        ]}
        onRowClick={r => setOpenId(r.id)}
        columns={[
          { key: "title", label: "Module", render: r => <span className="font-sans text-sm font-medium text-white truncate block w-[240px] xl:w-[320px]">{r.title}</span> },
          { key: "bundle", label: "Bundle", render: r => <Pill color={r.color}>{r.bundle}</Pill> },
          { key: "type", label: "Type", render: r => <span className="font-sans text-xs text-white/55">{r.type}</span> },
          { key: "live", label: "Status", sort: r => (r.live ? 1 : 0), render: r => r.live ? <Pill color={KIT.green}>Live</Pill> : <Pill color={KIT.muted}>Coming soon</Pill> },
        ]}
        rowActions={r => [
          { icon: Pencil, label: "Set link", onClick: () => setOpenId(r.id) },
          r.live && { icon: ExternalLink, label: "Open link", onClick: () => window.open(r.url, "_blank", "noopener") },
        ]}
      />
      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={560} title={sel?.title || ""} subtitle={sel ? `${sel.bundle} · ${sel.type}` : ""}
        footer={sel && <>
          <SecondaryButton onClick={() => setOpenId(null)}>Close</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving[sel.id]} onClick={() => handleSave(sel.id)}>{saved[sel.id] ? "Saved" : "Save link"}</PrimaryButton>
        </>}>
        {sel && (
          <div className="space-y-3">
            <Input label="DOWNLOAD URL" value={urls[sel.id] || ""} onChange={v => setUrls(p => ({ ...p, [sel.id]: v }))}
              placeholder="https://drive.google.com/..." hint="Any direct link - Google Drive, S3, etc. Leave empty to mark it Coming soon." />
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Payouts panel ─────────────────────────────────────────────────────────────

function PayoutsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [openId,   setOpenId]   = useState(null);
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

  const STATUS_C = { pending: KIT.orange, approved: KIT.green, rejected: KIT.red };
  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const inr = (list) => list.reduce((n, r) => n + (r.inrAmount || 0), 0);
  const money = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const when = (t) => (t?.toDate ? t.toDate() : null);
  const sel = requests.find(r => r.id === openId);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Pending requests", value: pending.length, sub: `${money(inr(pending))} waiting`, icon: Wallet, color: pending.length ? KIT.orange : KIT.green, loading },
        { label: "Paid out", value: money(inr(approved)), sub: `${fmt(approved.length)} approved requests`, icon: Check, color: KIT.green, loading },
        { label: "Rejected", value: requests.filter(r => r.status === "rejected").length, sub: "Coins refunded", icon: X, color: KIT.red, loading },
        { label: "All requests", value: requests.length, sub: "All time", icon: ClipboardList, color: KIT.cyan, loading },
      ]} />

      <DataTable title="Payout requests" icon={Wallet}
        subtitle="Approving re-checks the user's live coin balance and deducts it in one transaction, so a duplicate request can never pay out twice."
        rows={requests} loading={loading}
        searchKeys={["handle", "email", "upiId", "accountNumber"]} searchPlaceholder="Search handle, email, UPI or account..."
        filters={[
          { key: "status", label: "All statuses", options: ["pending", "approved", "rejected"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { key: "method", label: "All methods", options: [{ value: "upi", label: "UPI" }, { value: "bank", label: "Bank transfer" }] },
        ]}
        onRowClick={r => setOpenId(r.id)} emptyText="No payout requests yet."
        columns={[
          { key: "handle", label: "User", render: r => (
            <div className="min-w-0 w-[220px]">
              <p className="font-sans text-sm font-medium text-white truncate">@{r.handle}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.email}</p>
            </div>
          ) },
          { key: "inrAmount", label: "Amount", sort: r => r.inrAmount || 0, render: r => <span className="font-sans text-sm font-semibold text-white tabular-nums">{money(r.inrAmount)}</span> },
          { key: "coins", label: "Coins", sort: r => r.coins || 0, render: r => <span className="font-sans text-sm text-white/60 tabular-nums">{fmt(r.coins || 0)}</span> },
          { key: "method", label: "Method", render: r => <Pill color={KIT.cyan}>{r.method === "bank" ? "Bank" : "UPI"}</Pill> },
          { key: "createdAt", label: "Requested", sort: r => when(r.createdAt)?.getTime() || 0,
            render: r => <span className="font-sans text-xs text-white/50">{when(r.createdAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
          { key: "status", label: "Status", render: r => <Pill color={STATUS_C[r.status] || KIT.muted}>{r.status ? r.status[0].toUpperCase() + r.status.slice(1) : "-"}</Pill> },
        ]}
        rowActions={r => r.status === "pending" ? [
          { icon: Check, label: "Approve", disabled: working[r.id], onClick: () => handleApprove(r) },
          { icon: X, label: "Reject", danger: true, disabled: working[r.id], onClick: () => handleReject(r) },
        ] : [{ icon: Eye, label: "Details", onClick: () => setOpenId(r.id) }]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={560}
        title={sel ? `${money(sel.inrAmount)} to @${sel.handle}` : ""}
        subtitle={sel ? `${fmt(sel.coins || 0)} coins · ${sel.status}` : ""}
        footer={sel?.status === "pending" ? <>
          <SecondaryButton icon={X} onClick={() => handleReject(sel)} disabled={working[sel.id]}>Reject & refund</SecondaryButton>
          <PrimaryButton icon={Check} busy={working[sel.id]} onClick={() => handleApprove(sel)}>Approve payout</PrimaryButton>
        </> : null}>
        {sel && (
          <div className="space-y-4">
            <DrawerSection title="Pay to">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">Method</dt><dd className="text-white/85">{sel.method === "bank" ? "Bank transfer" : "UPI"}</dd>
                {sel.upiId && <><dt className="text-white/45">UPI ID</dt><dd className="font-mono text-white/85 break-all">{sel.upiId}</dd></>}
                {sel.bankName && <><dt className="text-white/45">Bank</dt><dd className="text-white/85">{sel.bankName}</dd></>}
                {sel.accountNumber && <><dt className="text-white/45">Account</dt><dd className="font-mono text-white/85 break-all">{sel.accountNumber}</dd></>}
                {sel.ifscCode && <><dt className="text-white/45">IFSC</dt><dd className="font-mono text-white/85">{sel.ifscCode}</dd></>}
              </dl>
            </DrawerSection>
            <DrawerSection title="Request">
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-sans text-sm">
                <dt className="text-white/45">User</dt><dd className="text-white/85">@{sel.handle} · {sel.email}</dd>
                <dt className="text-white/45">Requested</dt><dd className="text-white/85">{when(sel.createdAt)?.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) || "-"}</dd>
                {when(sel.processedAt) && <><dt className="text-white/45">Processed</dt><dd className="text-white/85">{when(sel.processedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</dd></>}
                {sel.note && <><dt className="text-white/45">Reason</dt><dd className="text-red-300">{sel.note}</dd></>}
              </dl>
            </DrawerSection>
          </div>
        )}
      </Drawer>
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
  const [q,        setQ]        = useState("");

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

  const isPending = (p) => !p.status || p.status === "pending";
  const needle = q.trim().toLowerCase();
  const filtered = posts.filter(p => {
    if (filter === "pending" && !isPending(p)) return false;
    if (filter !== "all" && filter !== "pending" && p.status !== filter) return false;
    return !needle || `${p.handle || ""} ${p.caption || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(needle);
  });
  const counts = {
    pending: posts.filter(isPending).length,
    approved: posts.filter(p => p.status === "approved").length,
    rejected: posts.filter(p => p.status === "rejected").length,
    all: posts.length,
  };
  const STATUS_C = { pending: KIT.orange, approved: KIT.green, rejected: KIT.red };
  const pendingVisible = filtered.filter(isPending);
  const allSelected = pendingVisible.length > 0 && pendingVisible.every(p => selected.has(p.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pendingVisible.map(p => p.id)));

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Awaiting review", value: counts.pending, sub: counts.pending ? "Oldest first is fairest" : "Queue is clear", icon: ShieldCheck, color: counts.pending ? KIT.orange : KIT.green, loading },
        { label: "Approved", value: counts.approved, sub: "Live on Pulse", icon: Check, color: KIT.green, loading },
        { label: "Rejected", value: counts.rejected, sub: "Author was notified", icon: X, color: KIT.red, loading },
        { label: "Approval rate", value: counts.approved + counts.rejected ? `${Math.round((100 * counts.approved) / (counts.approved + counts.rejected))}%` : "-", sub: "Of reviewed posts", icon: BarChart3, color: KIT.purple, loading },
      ]} />

      <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
        <div className="px-4 sm:px-5 py-3 border-b flex flex-wrap items-center gap-2" style={{ borderColor: KIT.line }}>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: KIT.line }} role="tablist">
            {["pending", "approved", "rejected", "all"].map(sv => (
              <button key={sv} role="tab" aria-selected={filter === sv} onClick={() => { setFilter(sv); setSelected(new Set()); }}
                className="font-sans text-sm px-3.5 py-1.5 transition-colors border-r last:border-r-0"
                style={{ borderColor: KIT.line, color: filter === sv ? "#fff" : "rgba(255,255,255,0.5)", background: filter === sv ? "rgba(255,255,255,0.07)" : "transparent" }}>
                {sv[0].toUpperCase() + sv.slice(1)} <span className="tabular-nums text-white/40 ml-1">{counts[sv]}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search author, caption or tag..."
              className="w-full font-sans text-sm text-white/85 pl-9 pr-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 placeholder:text-white/30"
              style={{ background: "rgba(255,255,255,0.03)" }} />
          </div>
          {pendingVisible.length > 0 && (
            <label className="flex items-center gap-2 font-sans text-sm text-white/60 ml-auto cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-green-500" />
              Select all pending
            </label>
          )}
        </div>

        {selected.size > 0 && (
          <div className="px-4 sm:px-5 py-2.5 border-b flex flex-wrap items-center gap-2" style={{ borderColor: KIT.line, background: "rgba(0,255,65,0.05)" }}>
            <span className="font-sans text-sm text-white/80">{selected.size} selected</span>
            <div className="ml-auto flex items-center gap-2">
              <SecondaryButton onClick={() => setSelected(new Set())}>Clear</SecondaryButton>
              <SecondaryButton icon={X} onClick={handleBulkReject} disabled={bulkBusy}>Reject selected</SecondaryButton>
              <PrimaryButton icon={Check} busy={bulkBusy} onClick={handleBulkApprove}>Approve selected</PrimaryButton>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map(n => <div key={n} className="h-28 rounded-lg bg-white/[0.03] animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="font-sans text-sm text-white/35 text-center py-12">{filter === "pending" && !needle ? "Nothing waiting for review." : "No posts match."}</p>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {filtered.map(post => {
                const st = post.status || "pending";
                return (
                  <article key={post.id} className="rounded-xl border p-4 flex flex-col gap-3"
                    style={{ borderColor: selected.has(post.id) ? "rgba(0,255,65,0.4)" : KIT.line, background: "rgba(255,255,255,0.015)" }}>
                    <header className="flex items-center gap-2.5">
                      {isPending(post) && (
                        <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleSelect(post.id)}
                          className="w-4 h-4 accent-green-500 flex-shrink-0" aria-label={`Select post by ${post.handle}`} />
                      )}
                      {post.photoURL
                        ? <img src={post.photoURL} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm font-semibold flex-shrink-0"
                            style={{ background: "rgba(0,255,65,0.1)", color: KIT.green }}>{(post.handle || "?")[0].toUpperCase()}</div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-sm font-medium text-white truncate">@{post.handle}</p>
                        <p className="font-sans text-xs text-white/40">{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
                      </div>
                      {post.category && <Pill color={KIT.cyan}>{post.category}</Pill>}
                      <Pill color={STATUS_C[st] || KIT.muted}>{st[0].toUpperCase() + st.slice(1)}</Pill>
                    </header>

                    {post.caption && <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">{post.caption}</p>}
                    {post.imageUrl && <img src={post.imageUrl} alt="" className="rounded-lg max-h-56 object-cover w-full" />}
                    {post.code && (
                      <pre className="font-mono text-[11px] text-white/70 p-3 rounded-lg overflow-x-auto max-h-32 leading-relaxed"
                        style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${KIT.line}` }}>
                        {post.code.slice(0, 400)}{post.code.length > 400 ? "..." : ""}
                      </pre>
                    )}
                    {post.linkUrl && <a href={post.linkUrl} target="_blank" rel="noreferrer" className="font-sans text-xs text-neon-cyan/80 hover:underline truncate">{post.linkUrl}</a>}
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">{post.tags.map(t => <span key={t} className="font-sans text-xs text-white/45">#{t}</span>)}</div>
                    )}
                    {post.rejectionNote && (
                      <p className="font-sans text-xs text-red-300 rounded-lg px-3 py-2" style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
                        Rejected: {post.rejectionNote}
                      </p>
                    )}

                    <footer className="flex items-center gap-2 pt-1 mt-auto">
                      {isPending(post) && (
                        <>
                          <PrimaryButton icon={Check} busy={working[post.id]} onClick={() => handleApprove(post)}>Approve</PrimaryButton>
                          <SecondaryButton icon={X} onClick={() => handleReject(post)} disabled={working[post.id]}>Reject</SecondaryButton>
                        </>
                      )}
                      {post.status === "approved" && (
                        <SecondaryButton icon={X} onClick={() => handleReject(post)} disabled={working[post.id]}>Revoke</SecondaryButton>
                      )}
                      <div className="ml-auto"><IconButton icon={Trash2} label="Delete permanently" danger onClick={() => handleDelete(post)} /></div>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────────────────

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
  const [creating, setCreating] = useState(false);

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
      setCreating(false);
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
      logAdminActivity("deleted course", courses.find(c => c.id === courseId)?.title || courseId);
      if (expandedCourse === courseId) setExpandedCourse(null);
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


  const course = courses.find(c => c.id === expandedCourse);
  const cats = [...new Set(courses.map(c => c.category).filter(Boolean))];
  const published = courses.filter(c => (c.status || "published") === "published").length;
  const openCourse = (id) => { if (expandedCourse !== id) toggleCourse(id); };
  const setCourseStatus = async (c, on) => {
    await updateDoc(doc(db, "courses", c.id), { status: on ? "published" : "draft" });
    logAdminActivity(on ? "published course" : "unpublished course", c.title);
    loadCourses();
  };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Courses", value: courses.length, sub: "Learning paths", icon: GraduationCap, color: KIT.green, loading },
        { label: "Published", value: published, sub: `${courses.length - published} hidden`, icon: Eye, color: KIT.cyan, loading },
        { label: "Categories", value: cats.length, sub: cats.slice(0, 3).join(", "), icon: Layers, color: KIT.orange, loading },
        { label: "Modules loaded", value: course ? (modules[course.id] || []).length : "-", sub: course ? `In ${course.title}` : "Open a course to see", icon: ListChecks, color: KIT.purple },
      ]} />
      <DataTable title="Learning paths" icon={GraduationCap}
        subtitle="Course -> Module -> Task (+ quiz). Tasks unlock in order - Task 2 stays locked until Task 1's quiz is passed."
        rows={courses} loading={loading}
        searchKeys={["title", "description", "category"]} searchPlaceholder="Search courses..."
        filters={cats.length ? [{ key: "category", label: "All categories", options: cats.map(c => ({ value: c, label: c })) }] : []}
        primaryAction={{ label: "Add course", icon: Plus, onClick: () => setCreating(true) }}
        onRowClick={c => openCourse(c.id)} emptyText="No courses yet."
        columns={[
          { key: "title", label: "Course", render: c => (
            <div className="min-w-0 w-[260px] xl:w-[340px]">
              <p className="font-sans text-sm font-medium text-white truncate flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color || KIT.green }} />{c.title}
              </p>
              <p className="font-sans text-xs text-white/40 truncate">{c.description}</p>
            </div>
          ) },
          { key: "category", label: "Category", render: c => c.category ? <Pill color={KIT.cyan}>{c.category}</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
          { key: "order", label: "Order", sort: c => c.order ?? 0, render: c => <span className="font-sans text-sm text-white/60 tabular-nums">{(c.order ?? 0) + 1}</span> },
          { key: "status", label: "Status", render: c => (
            <div className="flex items-center gap-2.5">
              <Toggle on={(c.status || "published") === "published"} label={`Publish ${c.title}`} onChange={on => setCourseStatus(c, on)} />
              <span className="font-sans text-xs text-white/55">{(c.status || "published") === "published" ? "Live" : "Hidden"}</span>
            </div>
          ) },
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Modules & tasks", onClick: () => openCourse(c.id) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteCourse(c.id) },
        ]}
      />

      <Drawer open={creating} onClose={() => setCreating(false)} width={600} title="Add course" subtitle="Published immediately; add modules and tasks after."
        footer={<>
          <SecondaryButton onClick={() => setCreating(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Plus} busy={savingCourse} disabled={!courseForm.title.trim()} onClick={handleAddCourse}>Add course</PrimaryButton>
        </>}>
        <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="COURSE TITLE" value={courseForm.title} onChange={v => setCourseForm(p => ({ ...p, title: v }))} placeholder="DSA Fundamentals" />
          <Input label="CATEGORY" value={courseForm.category} onChange={v => setCourseForm(p => ({ ...p, category: v }))} placeholder="DSA" />
        </div>
        <Textarea label="DESCRIPTION" value={courseForm.description} onChange={v => setCourseForm(p => ({ ...p, description: v }))} rows={2} placeholder="What will learners get out of this course?" />
        </div>
      </Drawer>

      <Drawer open={!!course} onClose={() => setExpandedCourse(null)} width={820}
        title={course?.title || ""} subtitle={course ? `${course.category || "Uncategorised"} · ${(modules[course.id] || []).length} modules` : ""}>
        {course && (
          <div className="space-y-3">
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
      </Drawer>
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
  const [creating, setCreating] = useState(false);

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
      setCreating(false);
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


  const topic = topics.find(t => t.id === expandedTopic);
  const openTopic = (id) => { if (expandedTopic !== id) toggleTopic(id); };
  const usedCats = APTITUDE_CATEGORIES.filter(c => topics.some(t => t.category === c));
  const setTopicStatus = async (t, on) => {
    await updateDoc(doc(db, "aptitude_topics", t.id), { status: on ? "published" : "draft" });
    logAdminActivity(on ? "published aptitude topic" : "unpublished aptitude topic", t.name);
    loadTopics();
  };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Topics", value: topics.length, sub: `${usedCats.length} categories`, icon: ListChecks, color: KIT.cyan, loading },
        { label: "Published", value: topics.filter(t => (t.status || "published") === "published").length, sub: "Open for practice", icon: Eye, color: KIT.green, loading },
        { label: "Categories", value: usedCats.length, sub: usedCats.slice(0, 3).join(", "), icon: Layers, color: KIT.orange, loading },
        { label: "Questions loaded", value: topic ? (questions[topic.id] || []).length : "-", sub: topic ? `In ${topic.name}` : "Open a topic to see", icon: BrainCircuit, color: KIT.purple },
      ]} />
      <DataTable title="Aptitude question bank" icon={ListChecks}
        subtitle="Topic -> question bank. No sequential unlock - students practise any topic, in any order, unlimited attempts."
        rows={topics} loading={loading}
        searchKeys={["name", "description", "category"]} searchPlaceholder="Search topics..."
        filters={[{ key: "category", label: "All categories", options: APTITUDE_CATEGORIES.map(c => ({ value: c, label: c })) }]}
        primaryAction={{ label: "Add topic", icon: Plus, onClick: () => setCreating(true) }}
        onRowClick={t => openTopic(t.id)} emptyText="No topics yet."
        columns={[
          { key: "name", label: "Topic", render: t => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{t.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{t.description}</p>
            </div>
          ) },
          { key: "category", label: "Category", render: t => <Pill color={KIT.cyan}>{t.category}</Pill> },
          { key: "order", label: "Order", sort: t => t.order ?? 0, render: t => <span className="font-sans text-sm text-white/55 tabular-nums">{(t.order ?? 0) + 1}</span> },
          { key: "status", label: "Status", render: t => (
            <div className="flex items-center gap-2.5">
              <Toggle on={(t.status || "published") === "published"} label={`Publish ${t.name}`} onChange={on => setTopicStatus(t, on)} />
              <span className="font-sans text-xs text-white/55">{(t.status || "published") === "published" ? "Live" : "Hidden"}</span>
            </div>
          ) },
        ]}
        rowActions={t => [
          { icon: Pencil, label: "Questions", onClick: () => openTopic(t.id) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteTopic(t.id) },
        ]}
      />
      <Drawer open={creating} onClose={() => setCreating(false)} width={600} title="Add topic" subtitle="Published immediately; add questions after."
        footer={<>
          <SecondaryButton onClick={() => setCreating(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Plus} busy={savingTopic} disabled={!topicForm.name.trim()} onClick={handleAddTopic}>Add topic</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
        </div>
      </Drawer>
      <Drawer open={!!topic} onClose={() => setExpandedTopic(null)} width={800}
        title={topic?.name || ""} subtitle={topic ? `${topic.category} · ${(questions[topic.id] || []).length} questions` : ""}>
        {topic && (
          <div className="space-y-3">
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
      </Drawer>
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
      // The form is seeded from the whole loaded doc - drop the fields the
      // save helper or other writers own, so a stale copy never lands back.
      const { id: _id, updatedAt: _u, createdAt: _c, ...data } = form;
      await saveAptitudeTopic(editingId, data);
      logAdminActivity("updated aptitude lesson", topics.find(t => t.id === editingId)?.name || editingId);
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };


  const hasContent = (t) => !!(t.concept?.trim() || t.keyPoints?.length);
  const withContent = topics.filter(hasContent).length;
  const editing = topics.find(t => t.id === editingId);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Topics", value: topics.length, sub: "From the question bank", icon: ListChecks, color: KIT.cyan, loading },
        { label: "Lessons written", value: withContent, sub: topics.length ? `${Math.round((100 * withContent) / topics.length)}% of topics` : "", icon: BookOpen, color: KIT.green, loading },
        { label: "Missing lessons", value: topics.length - withContent, sub: "No concept or key points yet", icon: Pencil, color: topics.length - withContent ? KIT.orange : KIT.green, loading },
        { label: "Practice MCQs", value: topics.reduce((n, t) => n + (t.mcqs?.length || 0), 0), sub: "Across all lessons", icon: BrainCircuit, color: KIT.purple, loading },
      ]} />
      <DataTable title="Aptitude lessons" icon={GraduationCap}
        subtitle="Lesson content (concept, key points, quiz, rewards) for topics created in Aptitude questions."
        rows={topics} loading={loading}
        searchKeys={["name", "category"]} searchPlaceholder="Search topics..."
        filters={[
          { key: "category", label: "All categories", options: APTITUDE_CATEGORIES.map(c => ({ value: c, label: c })) },
          { key: "content", label: "Any content", get: t => (hasContent(t) ? "yes" : "no"), options: [{ value: "no", label: "Missing a lesson" }, { value: "yes", label: "Lesson written" }] },
        ]}
        onRowClick={startEdit} emptyText="No topics yet - create them in Aptitude questions first."
        columns={[
          { key: "name", label: "Topic", render: t => <span className="font-sans text-sm font-medium text-white truncate block w-[240px] xl:w-[300px]">{t.name}</span> },
          { key: "category", label: "Category", render: t => <Pill color={KIT.cyan}>{t.category}</Pill> },
          { key: "difficulty", label: "Level", render: t => t.difficulty ? <Pill color={difficultyColor(t.difficulty === "Beginner" ? "easy" : t.difficulty === "Advanced" ? "hard" : "medium")}>{t.difficulty}</Pill> : <span className="font-sans text-xs text-white/30">-</span> },
          { key: "mcqs", label: "MCQs", sort: t => t.mcqs?.length || 0, render: t => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(t.mcqs?.length || 0)}</span> },
          { key: "content", label: "Lesson", sort: t => (hasContent(t) ? 1 : 0), render: t => hasContent(t) ? <Pill color={KIT.green}>Written</Pill> : <Pill color={KIT.orange}>Missing</Pill> },
          { key: "status", label: "Status", render: t => <Pill color={(t.status || "published") === "published" ? KIT.green : KIT.muted}>{(t.status || "published") === "published" ? "Published" : "Draft"}</Pill> },
        ]}
        rowActions={t => [{ icon: Pencil, label: "Edit lesson", onClick: () => startEdit(t) }]}
      />
      <Drawer open={!!editingId} onClose={() => setEditingId(null)} width={820}
        title={editing ? `Lesson: ${editing.name}` : ""} subtitle={editing?.category || ""}
        footer={<>
          <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleSave}>Save lesson</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
        </div>
      </Drawer>
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
      // Never write back fields other code maintains: topicCount moves as
      // topics are added/removed, and a stale updatedAt from the loaded doc
      // would overwrite the fresh timestamp the save helper sets.
      const { id: _id, updatedAt: _u, topicCount: _t, createdAt: _c, ...data } = form;
      await saveLanguage(id, data);
      logAdminActivity(editingId ? "updated language" : "created language", form.name.trim());
      setEditingId(null); setAdding(false); setForm(blankLanguageForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this language and all of its topics? This can't be undone.")) return;
    await deleteLanguage(id);
    logAdminActivity("deleted language", languages.find(x => x.id === id)?.name || id);
    load();
  };

  if (managingTopicsFor) {
    const lang = languages.find(l => l.id === managingTopicsFor);
    return <ProgrammingTopicsPanel langId={managingTopicsFor} langName={lang?.name} onBack={() => setManagingTopicsFor(null)} />;
  }

  const STATUS_C = { published: KIT.green, draft: KIT.muted, archived: KIT.red };
  const pub = languages.filter(x => x.status === "published").length;
  const topics = languages.reduce((n, x) => n + (x.topicCount || 0), 0);
  const setPublished = async (x, on) => {
    await saveLanguage(x.id, { status: on ? "published" : "draft" });
    logAdminActivity(on ? "published language" : "unpublished language", x.name);
    load();
  };
  const closeForm = () => { setEditingId(null); setAdding(false); };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Languages", value: languages.length, sub: `${pub} published`, icon: CodeXml, color: KIT.cyan, loading },
        { label: "Topics", value: topics, sub: languages.length ? `${Math.round(topics / languages.length)} per language` : "", icon: Layers, color: KIT.green, loading },
        { label: "Drafts", value: languages.filter(x => (x.status || "draft") === "draft").length, sub: "Not visible to students", icon: Pencil, color: KIT.orange, loading },
        { label: "Archived", value: languages.filter(x => x.status === "archived").length, sub: "Retired roadmaps", icon: Flag, color: KIT.purple, loading },
      ]} />
      <DataTable title="Programming languages" icon={CodeXml} subtitle="Language roadmaps. Click a language to manage its topics."
        rows={languages} loading={loading}
        searchKeys={["name", "difficulty", "placementRelevance"]} searchPlaceholder="Search languages..."
        filters={[
          { key: "status", label: "All statuses", get: x => x.status || "draft", options: ["published", "draft", "archived"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { key: "difficulty", label: "All levels", options: PROGRAMMING_DIFFICULTIES.map(d => ({ value: d, label: d })) },
        ]}
        primaryAction={{ label: "Add language", icon: Plus, onClick: startAdd }}
        onRowClick={x => setManagingTopicsFor(x.id)} emptyText="No languages yet."
        columns={[
          { key: "name", label: "Language", render: x => (
            <div className="min-w-0 w-[240px] xl:w-[300px] flex items-center gap-3">
              <LanguageLogo name={x.name} size={20} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-white truncate">{x.name}</p>
                <p className="font-sans text-xs text-white/40 truncate">{x.estimatedDuration || "-"}</p>
              </div>
            </div>
          ) },
          { key: "difficulty", label: "Level", render: x => <Pill color={difficultyColor(x.difficulty)}>{x.difficulty || "-"}</Pill> },
          { key: "topicCount", label: "Topics", sort: x => x.topicCount || 0, render: x => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(x.topicCount || 0)}</span> },
          { key: "order", label: "Order", sort: x => x.order ?? 0, render: x => <span className="font-sans text-sm text-white/55 tabular-nums">{x.order ?? 0}</span> },
          
          { key: "status", label: "Status", render: x => (
            <div className="flex items-center gap-2.5">
              <Toggle on={x.status === "published"} label={`Publish ${x.name}`} onChange={on => setPublished(x, on)} />
              <span className="font-sans text-xs" style={{ color: STATUS_C[x.status || "draft"] }}>{(x.status || "draft")[0].toUpperCase() + (x.status || "draft").slice(1)}</span>
            </div>
          ) },
        ]}
        rowActions={x => [
          { icon: Layers, label: "Topics", onClick: () => setManagingTopicsFor(x.id) },
          { icon: Pencil, label: "Edit details", onClick: () => startEdit(x) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(x.id) },
        ]}
      />
      <Drawer open={adding || !!editingId} onClose={closeForm} width={720}
        title={editingId ? `Edit ${form.name || "language"}` : "Add language"}
        subtitle="Topics are managed from the table - click a row."
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.name.trim()} onClick={handleSave}>Save</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
        </div>
      </Drawer>
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
      // Recomputed PUBLISHED-only (default includeUnpublished:false) - this
      // field's only real consumer is that same progress bar's denominator
      // (LanguageCard, LanguageRoadmap, Student Analytics Dashboard), all of
      // which only ever see published topics; counting drafts here used to
      // silently inflate the denominator relative to what a student could
      // ever complete, understating their % on the landing card versus the
      // roadmap screen for the same language.
      await saveLanguage(langId, { topicCount: (await fetchTopics(langId)).length });
      setEditingId(null); setAdding(false); setForm(blankProgrammingTopicForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic?")) return;
    await deleteTopic(langId, id);
    // Re-fetched rather than derived from this admin panel's own draft-inclusive
    // `topics` state (fetched with includeUnpublished:true above) - same
    // published-only reasoning as handleSave.
    await saveLanguage(langId, { topicCount: (await fetchTopics(langId)).length });
    load();
  };

  // No inline publish toggle here on purpose: the parent's topicCount is
  // recomputed from PUBLISHED topics on every save/delete (see handleSave),
  // so status changes go through the drawer's Save to keep that count true.
  const hasContent = (t) => !!(t.concept?.trim() || t.keyPoints?.length);
  const pub = topics.filter(t => t.status === "published").length;
  const written = topics.filter(hasContent).length;
  const modulesList = [...new Set(topics.map(t => t.module).filter(Boolean))];
  const closeForm = () => { setEditingId(null); setAdding(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SecondaryButton icon={ChevronLeft} onClick={onBack}>Back to languages</SecondaryButton>
        <h2 className="font-sans text-base font-semibold text-white">{langName} <span className="text-white/40 font-normal">topics</span></h2>
      </div>
      <StatGrid stats={[
        { label: "Topics", value: topics.length, sub: `${modulesList.length} modules`, icon: Layers, color: KIT.cyan, loading },
        { label: "Published", value: pub, sub: "Counted in the roadmap", icon: Eye, color: KIT.green, loading },
        { label: "Lessons written", value: written, sub: topics.length ? `${Math.round((100 * written) / topics.length)}% of topics` : "", icon: BookOpen, color: KIT.purple, loading },
        { label: "Missing content", value: topics.length - written, sub: "No concept or key points", icon: Pencil, color: topics.length - written ? KIT.orange : KIT.green, loading },
      ]} />
      <DataTable title="Topics" icon={Layers} subtitle="In roadmap order. Click a topic to edit its lesson."
        rows={topics} loading={loading}
        searchKeys={["title", "module"]} searchPlaceholder="Search topics..."
        filters={[
          ...(modulesList.length ? [{ key: "module", label: "All modules", options: modulesList.map(m => ({ value: m, label: m })) }] : []),
          { key: "status", label: "All statuses", get: t => t.status || "draft", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
          { key: "content", label: "Any content", get: t => (hasContent(t) ? "yes" : "no"), options: [{ value: "no", label: "Missing content" }, { value: "yes", label: "Written" }] },
        ]}
        primaryAction={{ label: "Add topic", icon: Plus, onClick: startAdd }}
        onRowClick={startEdit} emptyText="No topics yet."
        columns={[
          { key: "order", label: "Order", sort: t => t.order ?? 0, render: t => <span className="font-sans text-sm text-white/50 tabular-nums">{t.order ?? "-"}</span> },
          { key: "title", label: "Topic", render: t => (
            <div className="min-w-0 w-[240px] xl:w-[300px]">
              <p className="font-sans text-sm font-medium text-white truncate">{t.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">{t.module || "No module"}</p>
            </div>
          ) },
          { key: "content", label: "Lesson", sort: t => (hasContent(t) ? 1 : 0), render: t => hasContent(t) ? <Pill color={KIT.green}>Written</Pill> : <Pill color={KIT.orange}>Missing</Pill> },
          { key: "status", label: "Status", render: t => <Pill color={t.status === "published" ? KIT.green : KIT.muted}>{t.status === "published" ? "Published" : "Draft"}</Pill> },
        ]}
        rowActions={t => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(t) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(t.id) },
        ]}
      />
      <Drawer open={adding || !!editingId} onClose={closeForm} width={820}
        title={editingId ? `Edit ${form.title || "topic"}` : "Add topic"} subtitle={langName}
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.title.trim()} onClick={handleSave}>Save topic</PrimaryButton>
        </>}>
        <div className="space-y-3">
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

        </div>
      </Drawer>
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
      // Never write back fields other code maintains: topicCount moves as
      // topics are added/removed, and a stale updatedAt from the loaded doc
      // would overwrite the fresh timestamp the save helper sets.
      const { id: _id, updatedAt: _u, topicCount: _t, createdAt: _c, ...data } = form;
      await saveSubject(id, data);
      logAdminActivity(editingId ? "updated subject" : "created subject", form.name.trim());
      setEditingId(null); setAdding(false); setForm(blankSubjectForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject and all of its topics? This can't be undone.")) return;
    await deleteSubject(id);
    logAdminActivity("deleted subject", subjects.find(x => x.id === id)?.name || id);
    load();
  };

  if (managingTopicsFor) {
    const subject = subjects.find(s => s.id === managingTopicsFor);
    return <CsCoreTopicsPanel subjectId={managingTopicsFor} subjectName={subject?.name} onBack={() => setManagingTopicsFor(null)} />;
  }

  const STATUS_C = { published: KIT.green, draft: KIT.muted, archived: KIT.red };
  const pub = subjects.filter(x => x.status === "published").length;
  const topics = subjects.reduce((n, x) => n + (x.topicCount || 0), 0);
  const setPublished = async (x, on) => {
    await saveSubject(x.id, { status: on ? "published" : "draft" });
    logAdminActivity(on ? "published subject" : "unpublished subject", x.name);
    load();
  };
  const closeForm = () => { setEditingId(null); setAdding(false); };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Subjects", value: subjects.length, sub: `${pub} published`, icon: BrainCircuit, color: KIT.cyan, loading },
        { label: "Topics", value: topics, sub: subjects.length ? `${Math.round(topics / subjects.length)} per subject` : "", icon: Layers, color: KIT.green, loading },
        { label: "Drafts", value: subjects.filter(x => (x.status || "draft") === "draft").length, sub: "Not visible to students", icon: Pencil, color: KIT.orange, loading },
        { label: "With an intro", value: subjects.filter(x => x.overview?.trim()).length, sub: "Overview tab written", icon: BookOpen, color: KIT.purple, loading },
      ]} />
      <DataTable title="CS Core subjects" icon={BrainCircuit} subtitle="Core computer science subjects. Click a subject to manage its topics."
        rows={subjects} loading={loading}
        searchKeys={["name", "difficulty", "placementRelevance"]} searchPlaceholder="Search subjects..."
        filters={[
          { key: "status", label: "All statuses", get: x => x.status || "draft", options: ["published", "draft", "archived"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { key: "difficulty", label: "All levels", options: CS_CORE_DIFFICULTIES.map(d => ({ value: d, label: d })) },
        ]}
        primaryAction={{ label: "Add subject", icon: Plus, onClick: startAdd }}
        onRowClick={x => setManagingTopicsFor(x.id)} emptyText="No subjects yet."
        columns={[
          { key: "name", label: "Subject", render: x => (
            <div className="min-w-0 w-[240px] xl:w-[300px] flex items-center gap-3">
              {(() => { const SubjIcon = subjectIcon(x.name); return <SubjIcon size={20} className="flex-shrink-0" style={{ color: KIT.purple }} />; })()}
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-white truncate">{x.name}</p>
                <p className="font-sans text-xs text-white/40 truncate">{x.estimatedDuration || "-"}</p>
              </div>
            </div>
          ) },
          { key: "difficulty", label: "Level", render: x => <Pill color={difficultyColor(x.difficulty)}>{x.difficulty || "-"}</Pill> },
          { key: "topicCount", label: "Topics", sort: x => x.topicCount || 0, render: x => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(x.topicCount || 0)}</span> },
          { key: "order", label: "Order", sort: x => x.order ?? 0, render: x => <span className="font-sans text-sm text-white/55 tabular-nums">{x.order ?? 0}</span> },
          { key: "overview", label: "Intro", sort: x => (x.overview?.trim() ? 1 : 0), render: x => x.overview?.trim() ? <Pill color={KIT.green}>Written</Pill> : <Pill color={KIT.muted}>None</Pill> },
          { key: "status", label: "Status", render: x => (
            <div className="flex items-center gap-2.5">
              <Toggle on={x.status === "published"} label={`Publish ${x.name}`} onChange={on => setPublished(x, on)} />
              <span className="font-sans text-xs" style={{ color: STATUS_C[x.status || "draft"] }}>{(x.status || "draft")[0].toUpperCase() + (x.status || "draft").slice(1)}</span>
            </div>
          ) },
        ]}
        rowActions={x => [
          { icon: Layers, label: "Topics", onClick: () => setManagingTopicsFor(x.id) },
          { icon: Pencil, label: "Edit details", onClick: () => startEdit(x) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(x.id) },
        ]}
      />
      <Drawer open={adding || !!editingId} onClose={closeForm} width={720}
        title={editingId ? `Edit ${form.name || "subject"}` : "Add subject"}
        subtitle="Topics are managed from the table - click a row."
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.name.trim()} onClick={handleSave}>Save</PrimaryButton>
        </>}>
        <div className="space-y-3">
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
        </div>
      </Drawer>
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
      // Recomputed PUBLISHED-only (default includeUnpublished:false) - same
      // fix/reasoning as ProgrammingTopicsPanel's identical handleSave above:
      // this field's only real consumer is SubjectCard/SubjectRoadmap/Student
      // Analytics's progress-bar denominator, which only ever sees published
      // topics.
      await saveSubject(subjectId, { topicCount: (await fetchCsCoreTopics(subjectId)).length });
      setEditingId(null); setAdding(false); setForm(blankCsCoreTopicForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this topic?")) return;
    await deleteCsCoreTopic(subjectId, id);
    // Re-fetched rather than derived from this admin panel's own draft-inclusive
    // `topics` state - same published-only reasoning as handleSave above.
    await saveSubject(subjectId, { topicCount: (await fetchCsCoreTopics(subjectId)).length });
    load();
  };

  // No inline publish toggle here on purpose: the parent's topicCount is
  // recomputed from PUBLISHED topics on every save/delete (see handleSave),
  // so status changes go through the drawer's Save to keep that count true.
  const hasContent = (t) => !!(t.concept?.trim() || t.keyPoints?.length);
  const pub = topics.filter(t => t.status === "published").length;
  const written = topics.filter(hasContent).length;
  const modulesList = [...new Set(topics.map(t => t.module).filter(Boolean))];
  const closeForm = () => { setEditingId(null); setAdding(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SecondaryButton icon={ChevronLeft} onClick={onBack}>Back to subjects</SecondaryButton>
        <h2 className="font-sans text-base font-semibold text-white">{subjectName} <span className="text-white/40 font-normal">topics</span></h2>
      </div>
      <StatGrid stats={[
        { label: "Topics", value: topics.length, sub: `${modulesList.length} modules`, icon: Layers, color: KIT.cyan, loading },
        { label: "Published", value: pub, sub: "Counted in the roadmap", icon: Eye, color: KIT.green, loading },
        { label: "Lessons written", value: written, sub: topics.length ? `${Math.round((100 * written) / topics.length)}% of topics` : "", icon: BookOpen, color: KIT.purple, loading },
        { label: "Missing content", value: topics.length - written, sub: "No concept or key points", icon: Pencil, color: topics.length - written ? KIT.orange : KIT.green, loading },
      ]} />
      <DataTable title="Topics" icon={Layers} subtitle="In roadmap order. Click a topic to edit its lesson."
        rows={topics} loading={loading}
        searchKeys={["title", "module"]} searchPlaceholder="Search topics..."
        filters={[
          ...(modulesList.length ? [{ key: "module", label: "All modules", options: modulesList.map(m => ({ value: m, label: m })) }] : []),
          { key: "status", label: "All statuses", get: t => t.status || "draft", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
          { key: "content", label: "Any content", get: t => (hasContent(t) ? "yes" : "no"), options: [{ value: "no", label: "Missing content" }, { value: "yes", label: "Written" }] },
        ]}
        primaryAction={{ label: "Add topic", icon: Plus, onClick: startAdd }}
        onRowClick={startEdit} emptyText="No topics yet."
        columns={[
          { key: "order", label: "Order", sort: t => t.order ?? 0, render: t => <span className="font-sans text-sm text-white/50 tabular-nums">{t.order ?? "-"}</span> },
          { key: "title", label: "Topic", render: t => (
            <div className="min-w-0 w-[240px] xl:w-[300px]">
              <p className="font-sans text-sm font-medium text-white truncate">{t.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">{t.module || "No module"}</p>
            </div>
          ) },
          { key: "content", label: "Lesson", sort: t => (hasContent(t) ? 1 : 0), render: t => hasContent(t) ? <Pill color={KIT.green}>Written</Pill> : <Pill color={KIT.orange}>Missing</Pill> },
          { key: "status", label: "Status", render: t => <Pill color={t.status === "published" ? KIT.green : KIT.muted}>{t.status === "published" ? "Published" : "Draft"}</Pill> },
        ]}
        rowActions={t => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(t) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(t.id) },
        ]}
      />
      <Drawer open={adding || !!editingId} onClose={closeForm} width={820}
        title={editingId ? `Edit ${form.title || "topic"}` : "Add topic"} subtitle={subjectName}
        footer={<>
          <SecondaryButton onClick={closeForm}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} disabled={!form.title.trim()} onClick={handleSave}>Save topic</PrimaryButton>
        </>}>
        <div className="space-y-3">
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

        </div>
      </Drawer>
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
  const [creating, setCreating] = useState(false);

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
      setCreating(false);
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


  const sel = companies.find(c => c.id === expandedCompany);
  const published = companies.filter(c => c.status === "published").length;
  const roadmapped = companies.filter(c => (c.prepRoadmap || []).length).length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Companies", value: companies.length, sub: `${published} published`, icon: Briefcase, color: KIT.cyan, loading },
        { label: "Drafts", value: companies.length - published, sub: "Admin-only until published", icon: Pencil, color: companies.length - published ? KIT.orange : KIT.muted, loading },
        { label: "With a roadmap", value: roadmapped, sub: "Day-by-day prep plan", icon: ListChecks, color: KIT.green, loading },
        { label: "Resources", value: companies.reduce((n, c) => n + (c.resources?.length || 0), 0), sub: "Linked prep material", icon: BookOpen, color: KIT.purple, loading },
      ]} />
      {formFeedback && !creating && (
        <p className="font-sans text-sm" style={{ color: formFeedback.type === "success" ? KIT.green : KIT.red }}>{formFeedback.text}</p>
      )}
      <DataTable title="Company prep" icon={Briefcase}
        subtitle="Company -> Round -> Category -> Question. Drafts (and everything under them) stay admin-only until published."
        rows={companies} loading={loading}
        searchKeys={["name", "description", "ctc", "hiringOverview"]} searchPlaceholder="Search companies..."
        filters={[
          { key: "status", label: "All statuses", get: c => c.status || "draft", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
          { key: "difficulty", label: "All difficulties", options: COMPANY_QUESTION_DIFFICULTIES.map(d => ({ value: d, label: d })) },
        ]}
        primaryAction={{ label: "Add company", icon: Plus, onClick: () => { setFormFeedback(null); setCreating(true); } }}
        onRowClick={c => setExpandedCompany(c.id)} emptyText="No companies yet."
        columns={[
          { key: "name", label: "Company", render: c => (
            <div className="min-w-0 w-[240px] xl:w-[300px]">
              <p className="font-sans text-sm font-medium text-white truncate">{c.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{c.description}</p>
            </div>
          ) },
          { key: "ctc", label: "CTC", render: c => <span className="font-sans text-sm text-white/70">{c.ctc || "-"}</span> },
          { key: "difficulty", label: "Difficulty", render: c => <Pill color={difficultyColor(c.difficulty)}>{c.difficulty || "-"}</Pill> },
          { key: "prepRoadmap", label: "Roadmap", sort: c => c.prepRoadmap?.length || 0, render: c => <span className="font-sans text-sm text-white/65 tabular-nums">{c.prepRoadmap?.length ? `${c.prepRoadmap.length} days` : "-"}</span> },
          { key: "status", label: "Status", render: c => (
            <div className="flex items-center gap-2.5">
              <Toggle on={c.status === "published"} label={`Publish ${c.name}`} onChange={() => handleTogglePublish(c)} />
              <span className="font-sans text-xs" style={{ color: c.status === "published" ? KIT.green : "rgba(255,255,255,0.45)" }}>{c.status === "published" ? "Published" : "Draft"}</span>
            </div>
          ) },
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Rounds & questions", onClick: () => setExpandedCompany(c.id) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDeleteCompany(c.id, c.name) },
        ]}
      />
      <Drawer open={creating} onClose={() => setCreating(false)} width={760} title="Add company" subtitle="Added as a draft - publish it once its rounds and questions are ready."
        footer={<>
          <SecondaryButton onClick={() => setCreating(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Plus} busy={saving} disabled={!form.name.trim()} onClick={handleAddCompany}>Add company</PrimaryButton>
        </>}>
        <div className="space-y-3">
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

          {formFeedback && <p className="font-sans text-xs" style={{ color: formFeedback.type === "success" ? KIT.green : KIT.red }}>{formFeedback.text}</p>}
        </div>
      </Drawer>
      {/* CompanyPrepRow owns the whole rounds -> categories -> questions
          editor and its own loading; it is reused as-is, pinned open. */}
      <Drawer open={!!sel} onClose={() => setExpandedCompany(null)} width={820}
        title={sel?.name || ""} subtitle={sel ? `${sel.status === "published" ? "Published" : "Draft"} · ${sel.ctc || "CTC not set"}` : ""}>
        {sel && (
          <CompanyPrepRow key={sel.id} company={sel} expanded onToggle={() => {}}
            onDelete={() => handleDeleteCompany(sel.id, sel.name)}
            onTogglePublish={() => handleTogglePublish(sel)}
            feedback={rowFeedback[sel.id]} />
        )}
      </Drawer>
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
  const [drawer, setDrawer] = useState(null); // { mode: "create" } | { mode: "edit", id }

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
      setDrawer(null);
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


  const openEdit = (id) => { if (expanded !== id) toggleExpand(id); setDrawer({ mode: "edit", id }); };
  const closeDrawer = () => { setDrawer(null); setExpanded(null); };
  const editing = drawer?.mode === "edit" ? contests.find(c => c.id === drawer.id) : null;
  const PHASE_C = { live: KIT.green, upcoming: KIT.cyan, closed: KIT.orange, past: KIT.muted };
  const statusC = (v) => (CONTEST_STATUSES.find(s => s.v === v) || CONTEST_STATUSES[0]).c;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Contests", value: stats.total, sub: `${stats.draft} drafts`, icon: Trophy, color: KIT.cyan, loading },
        { label: "Live now", value: stats.live, sub: "Running at this moment", icon: Zap, color: KIT.green, loading },
        { label: "Upcoming", value: stats.upcoming, sub: "Published, not started", icon: Flag, color: KIT.orange, loading },
        { label: "Registrations", value: stats.registrations, sub: "Across all contests", icon: Users, color: KIT.purple, loading },
      ]} />

      <DataTable title="All contests" icon={Trophy} subtitle="Timed contests on /contest. Click one to manage questions, registrations and announcements."
        rows={contests} loading={loading}
        searchKeys={["title", "category", "organizer", "description"]} searchPlaceholder="Search contests..."
        filters={[
          { key: "status", label: "All statuses", options: CONTEST_STATUSES.map(s => ({ value: s.v, label: s.v[0].toUpperCase() + s.v.slice(1) })) },
          { key: "phase", label: "Any phase", get: c => contestPhase(c), options: ["upcoming", "closed", "live", "past"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { key: "category", label: "All categories", options: CONTEST_CATEGORIES.map(c => ({ value: c, label: c })) },
        ]}
        primaryAction={{ label: "Create contest", icon: Plus, onClick: () => { setForm(blankContestForm()); setError(""); setDrawer({ mode: "create" }); } }}
        onRowClick={c => openEdit(c.id)} emptyText="No contests yet."
        columns={[
          { key: "title", label: "Contest", render: c => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{c.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">{c.category} · {c.difficulty}</p>
            </div>
          ) },
          { key: "contestStart", label: "Starts", sort: c => toDate(c.contestStart)?.getTime() || 0,
            render: c => <span className="font-sans text-xs text-white/60">{toDate(c.contestStart)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
          { key: "phase", label: "Phase", sort: c => contestPhase(c), render: c => <Pill color={PHASE_C[contestPhase(c)] || KIT.muted}>{contestPhase(c)}</Pill> },
          { key: "questionCount", label: "Questions", sort: c => c.questionCount || 0, render: c => <span className="font-sans text-sm text-white/75 tabular-nums">{fmt(c.questionCount || 0)}</span> },
          { key: "participantCount", label: "Registered", sort: c => c.participantCount || 0, render: c => <span className="font-sans text-sm text-white/75 tabular-nums">{fmt(c.participantCount || 0)}</span> },
          { key: "status", label: "Status", render: c => (
            <div className="flex items-center gap-2.5">
              <Toggle on={c.status === "published"} label={`Publish ${c.title}`} onChange={on => handleSetStatus(c.id, on ? "published" : "draft")} />
              <span className="font-sans text-xs" style={{ color: statusC(c.status) }}>{c.status ? c.status[0].toUpperCase() + c.status.slice(1) : "-"}</span>
            </div>
          ) },
        ]}
        rowActions={c => [
          { icon: Pencil, label: "Manage", onClick: () => openEdit(c.id) },
          { icon: Copy, label: "Duplicate", onClick: () => handleDuplicate(c) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(c.id, c.title) },
        ]}
      />

      <Drawer open={!!drawer} onClose={closeDrawer} width={800}
        title={drawer?.mode === "create" ? "Create contest" : editing?.title || "Contest"}
        subtitle={drawer?.mode === "create" ? "Contests no longer grant platform XP/coins - describe any real prize in the form." : editing ? `${editing.category} · ${contestPhase(editing)} · ${fmt(editing.questionCount || 0)} questions · ${fmt(editing.participantCount || 0)} registered` : ""}>
        {drawer?.mode === "create" && (
          <div className="space-y-3">
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
        )}
        {editing && (contest => (
          <div className="space-y-4">
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
        ))(editing)}
      </Drawer>
    </div>
  );
}

// ── CodeLab problems panel ────────────────────────────────────────────────────

const CODELAB_STATUSES = [
  { v: "draft",     c: "rgba(255,255,255,0.4)" },
  { v: "published", c: "#00FF41" },
  { v: "archived",  c: "#FF9500" },
];

function basicsFormFromProblem(p) {
  if (!p) return null;
  return {
    title: p.title || "", category: p.category || CODELAB_CATEGORIES[0], difficulty: p.difficulty || "Easy",
    tags: (p.tags || []).join(", "), statement: p.statement || "", constraints: p.constraints || "",
    examplesText: p.examplesText || "", hints: (p.hints || []).join("\n"),
    estimatedTime: String(p.estimatedTime ?? 15), xpReward: String(p.xpReward ?? 0), coinReward: String(p.coinReward ?? 0),
  };
}

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

  // Drawer: { mode: "create" } or { mode: "edit", id }. The per-problem
  // editor that used to expand inline under each row now lives in here.
  const [drawer, setDrawer] = useState(null);
  const [basicsForm, setBasicsForm] = useState(null);
  const [savingBasics, setSavingBasics] = useState(false);
  const [busyId, setBusyId] = useState(null);

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
    setBasicsForm(basicsFormFromProblem(problems.find(p => p.id === problemId)));
    if (!sampleTests[problemId]) loadTests(problemId);
  };

  const openEdit = (problemId) => {
    if (expanded !== problemId) toggleExpand(problemId);
    setDrawer({ mode: "edit", id: problemId });
  };
  const openCreate = () => {
    setForm(blankProblemForm());
    setError("");
    setDrawer({ mode: "create" });
  };
  const closeDrawer = () => { setDrawer(null); setExpanded(null); };

  // Title, statement, category... were settable only at creation before -
  // there was no way to fix a typo in a live problem's statement.
  const handleSaveBasics = async (problemId) => {
    if (!basicsForm.title.trim() || !basicsForm.statement.trim()) return;
    setSavingBasics(true);
    try {
      const existing = problems.find(p => p.id === problemId);
      await updateDoc(doc(db, "problems", problemId), {
        ...withVersionSnapshot(existing),
        title: basicsForm.title.trim(), category: basicsForm.category, difficulty: basicsForm.difficulty,
        tags: basicsForm.tags.split(",").map(t => t.trim()).filter(Boolean),
        statement: basicsForm.statement.trim(), constraints: basicsForm.constraints.trim(),
        examplesText: basicsForm.examplesText.trim(),
        hints: basicsForm.hints.split("\n").map(h => h.trim()).filter(Boolean),
        estimatedTime: parseInt(basicsForm.estimatedTime) || 15,
        xpReward: parseInt(basicsForm.xpReward) || 0, coinReward: parseInt(basicsForm.coinReward) || 0,
      });
      logAdminActivity("updated coding problem", basicsForm.title.trim());
      load();
    } catch (e) { console.error(e); }
    finally { setSavingBasics(false); }
  };

  // Copies the problem AND its sample/hidden tests, as a fresh draft with
  // zeroed counters - a duplicate must never go live by accident or inherit
  // the original's submission stats.
  const handleDuplicate = async (problem) => {
    setBusyId(problem.id);
    try {
      const { id: _id, ...data } = problem;
      const ref = await addDoc(collection(db, "problems"), {
        ...data, title: `${problem.title} (copy)`, status: "draft",
        totalSubmissions: 0, acceptedSubmissions: 0,
        createdAt: serverTimestamp(), createdBy: auth.currentUser?.email || ADMIN_EMAIL,
      });
      const [sSnap, hSnap] = await Promise.all([
        getDocs(collection(db, "problems", problem.id, "sampleTests")),
        getDocs(collection(db, "problems", problem.id, "hiddenTests")),
      ]);
      const batch = writeBatch(db);
      sSnap.docs.forEach(d => batch.set(doc(collection(db, "problems", ref.id, "sampleTests")), d.data()));
      hSnap.docs.forEach(d => batch.set(doc(collection(db, "problems", ref.id, "hiddenTests")), d.data()));
      await batch.commit();
      logAdminActivity("duplicated coding problem", problem.title);
      load();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
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
      setDrawer(null);
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

  const editing = drawer?.mode === "edit" ? problems.find(p => p.id === drawer.id) : null;
  const totalSubs = problems.reduce((n, p) => n + (p.totalSubmissions || 0), 0);
  const accepted = problems.reduce((n, p) => n + (p.acceptedSubmissions || 0), 0);
  const published = problems.filter(p => p.status === "published").length;
  const rate = (p) => (p.totalSubmissions ? (100 * (p.acceptedSubmissions || 0)) / p.totalSubmissions : 0);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Total problems", value: problems.length, sub: `${published} published`, icon: Code2, color: KIT.green, loading },
        { label: "Published", value: published, sub: `${problems.length - published} draft or archived`, icon: Eye, color: KIT.cyan, loading },
        { label: "Total submissions", value: totalSubs, sub: "Across all problems", icon: Activity, color: KIT.orange, loading },
        { label: "Acceptance rate", value: totalSubs ? `${Math.round((100 * accepted) / totalSubs)}%` : "-", sub: `${fmt(accepted)} accepted`, icon: BarChart3, color: KIT.purple, loading },
      ]} />

      <DataTable
        title="All problems" icon={Zap}
        subtitle="Sample tests are shown to solvers. Hidden tests never reach the browser - devert-backend grades against them."
        rows={problems} loading={loading}
        searchKeys={["title", "category", "statement", "tags"]} searchPlaceholder="Search problems..."
        filters={[
          { key: "status", label: "All statuses", options: CODELAB_STATUSES.map(s => ({ value: s.v, label: s.v[0].toUpperCase() + s.v.slice(1) })) },
          { key: "category", label: "All categories", options: CODELAB_CATEGORIES.map(c => ({ value: c, label: c })) },
          { key: "difficulty", label: "All difficulties", options: CODELAB_DIFFICULTIES.map(d => ({ value: d, label: d })) },
        ]}
        primaryAction={{ label: "Create problem", icon: Plus, onClick: openCreate }}
        onRowClick={p => openEdit(p.id)}
        emptyText="No problems yet - create the first one."
        columns={[
          { key: "title", label: "Title", render: p => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{p.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">{(p.statement || "").slice(0, 90)}</p>
            </div>
          ) },
          { key: "category", label: "Category", render: p => <Pill color={KIT.cyan}>{p.category || "-"}</Pill> },
          { key: "difficulty", label: "Difficulty", render: p => <Pill color={difficultyColor(p.difficulty)}>{p.difficulty || "-"}</Pill> },
          { key: "totalSubmissions", label: "Submissions", sort: p => p.totalSubmissions || 0,
            render: p => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(p.totalSubmissions || 0)}</span> },
          { key: "rate", label: "Success rate", sort: rate, render: p => p.totalSubmissions ? <ProgressBar value={rate(p)} /> : <span className="font-sans text-xs text-white/30">No attempts</span> },
          { key: "status", label: "Status", render: p => (
            <div className="flex items-center gap-2.5">
              <Toggle on={p.status === "published"} label={`Publish ${p.title}`}
                onChange={on => handleSetStatus(p.id, on ? "published" : "draft")} />
              <span className="font-sans text-xs" style={{ color: (CODELAB_STATUSES.find(s => s.v === p.status) || CODELAB_STATUSES[0]).c }}>
                {p.status === "published" ? "Live" : p.status === "archived" ? "Archived" : "Draft"}
              </span>
            </div>
          ) },
        ]}
        rowActions={p => [
          { icon: Pencil, label: "Edit", onClick: () => openEdit(p.id) },
          { icon: Copy, label: "Duplicate", onClick: () => handleDuplicate(p), disabled: busyId === p.id },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(p.id, p.title) },
        ]}
      />

      <Drawer open={!!drawer} onClose={closeDrawer}
        title={drawer?.mode === "create" ? "Create problem" : editing?.title || "Problem"}
        subtitle={drawer?.mode === "create" ? "New problems start as drafts unless you pick another status." : `${editing?.category || ""} · ${editing?.difficulty || ""} · ${(sampleTests[editing?.id]?.length || 0)} sample / ${(hiddenTests[editing?.id]?.length || 0)} hidden tests`}>
        {drawer?.mode === "create" && (
          <div className="space-y-3">
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
        )}
        {editing && (
          <div className="space-y-4">
            {basicsForm && (
              <DrawerSection title="Basics" hint="What solvers see first. Saving keeps a version snapshot of the previous text.">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="TITLE" value={basicsForm.title} onChange={v => setBasicsForm(p => ({ ...p, title: v }))} />
                  <div>
                    <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">CATEGORY</p>
                    <Dropdown value={basicsForm.category} onChange={v => setBasicsForm(p => ({ ...p, category: v }))}
                      options={CODELAB_CATEGORIES} className="w-full"
                      buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
                  </div>
                </div>
                <Textarea label="PROBLEM STATEMENT" value={basicsForm.statement} onChange={v => setBasicsForm(p => ({ ...p, statement: v }))} rows={5} />
                <Textarea label="CONSTRAINTS" value={basicsForm.constraints} onChange={v => setBasicsForm(p => ({ ...p, constraints: v }))} rows={2} />
                <Textarea label="EXAMPLES" value={basicsForm.examplesText} onChange={v => setBasicsForm(p => ({ ...p, examplesText: v }))} rows={3} />
                <Textarea label="HINTS (one per line)" value={basicsForm.hints} onChange={v => setBasicsForm(p => ({ ...p, hints: v }))} rows={2} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">DIFFICULTY</p>
                    <Dropdown value={basicsForm.difficulty} onChange={v => setBasicsForm(p => ({ ...p, difficulty: v }))}
                      options={CODELAB_DIFFICULTIES} className="w-full"
                      buttonClassName="font-mono text-xs text-white/80 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08]" />
                  </div>
                  <Input label="TAGS (comma separated)" value={basicsForm.tags} onChange={v => setBasicsForm(p => ({ ...p, tags: v }))} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input label="ESTIMATED TIME (min)" value={basicsForm.estimatedTime} onChange={v => setBasicsForm(p => ({ ...p, estimatedTime: v }))} />
                  <Input label="XP REWARD" value={basicsForm.xpReward} onChange={v => setBasicsForm(p => ({ ...p, xpReward: v }))} />
                  <Input label="COIN REWARD" value={basicsForm.coinReward} onChange={v => setBasicsForm(p => ({ ...p, coinReward: v }))} />
                </div>
                <div className="flex justify-end">
                  <PrimaryButton icon={Check} busy={savingBasics} onClick={() => handleSaveBasics(editing.id)}
                    disabled={!basicsForm.title.trim() || !basicsForm.statement.trim()}>Save basics</PrimaryButton>
                </div>
              </DrawerSection>
            )}
            {(problem => (
              <>
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
              </>
            ))(editing)}
          </div>
        )}
      </Drawer>
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
    registrationOpen: "", submissionDeadline: "", resultsDate: "", registrationCloseAt: "",
    maxTeamSize: "4", minTeamSize: "", tags: "", status: "upcoming",
    registrationFee: "", prizePool: "", venue: "", durationLabel: "",
    registrationFormUrl: "", perks: "", whyParticipate: "", faq: "",
    bannerImage: "", mode: "",
  };
}

// "Question :: Answer" per line - same low-fidelity convention as the
// comma-separated tags/perks fields, kept simple since this is admin-only
// data entry, not user-facing input.
function parseFaqText(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
    const [q, ...rest] = line.split("::");
    return { q: q.trim(), a: rest.join("::").trim() };
  }).filter(f => f.q && f.a);
}

function faqToText(faq) {
  return (faq || []).map(f => `${f.q} :: ${f.a}`).join("\n");
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setDrawerOpen(true);
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
      registrationCloseAt: tsToInputStr(h.registrationCloseAt, true),
      maxTeamSize: String(h.maxTeamSize ?? "4"),
      minTeamSize: h.minTeamSize ? String(h.minTeamSize) : "",
      tags: (h.tags || []).join(", "),
      status: h.status || "upcoming",
      registrationFee: h.registrationFee || "",
      prizePool: h.prizePool || "",
      venue: h.venue || "",
      durationLabel: h.durationLabel || "",
      registrationFormUrl: h.registrationFormUrl || "",
      bannerImage: h.bannerImage || "",
      mode: h.mode || "",
      perks: (h.perks || []).join(", "),
      whyParticipate: (h.whyParticipate || []).join("\n"),
      faq: faqToText(h.faq),
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(blankHackathonForm()); setError(""); setDrawerOpen(false); };
  const startCreate = () => { setEditingId(null); setForm(blankHackathonForm()); setError(""); setDrawerOpen(true); };

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
        registrationCloseAt: form.registrationCloseAt ? new Date(form.registrationCloseAt) : null,
        maxTeamSize:   parseInt(form.maxTeamSize) || 4,
        minTeamSize:   form.minTeamSize ? parseInt(form.minTeamSize) || null : null,
        tags:          form.tags.split(",").map(t => t.trim()).filter(Boolean),
        status:        form.status,
        statusColor:   statusObj.c,
        registrationFee:     form.registrationFee.trim(),
        prizePool:           form.prizePool.trim(),
        venue:               form.venue.trim(),
        durationLabel:       form.durationLabel.trim(),
        registrationFormUrl: form.registrationFormUrl.trim(),
        bannerImage: form.bannerImage.trim(),
        mode: form.mode,
        perks:               form.perks.split(",").map(t => t.trim()).filter(Boolean),
        whyParticipate:      form.whyParticipate.split("\n").map(t => t.trim()).filter(Boolean),
        faq:                 parseFaqText(form.faq),
      };
      if (editingId) {
        await updateDoc(doc(db, "hackathons", editingId), payload);
      } else {
        await setDoc(doc(db, "hackathons", form.slug.trim()), {
          ...payload, registrationCount: 0, submissionCount: 0, createdAt: serverTimestamp(),
        });
      }
      logAdminActivity(editingId ? "updated event" : "created event", form.title?.trim() || form.slug);
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
    logAdminActivity("deleted event", id);
    load();
  };

  const handleSetStatus = async (id, status) => {
    await updateDoc(doc(db, "hackathons", id), {
      status, statusColor: HACKATHON_STATUSES.find(s => s.v === status)?.c,
    });
    load();
  };

  const isHack = form.eventType === "hackathon";

  const when = (v) => { const d = v?.toDate ? v.toDate() : v ? new Date(v) : null; return d && !isNaN(d) ? d : null; };
  const typeOf = (h) => h.eventType || "hackathon";
  const statusC = (v) => (HACKATHON_STATUSES.find(s => s.v === v) || HACKATHON_STATUSES[0]).c;
  const regs = hackathons.reduce((n, h) => n + (h.registrationCount || 0), 0);
  const subs = hackathons.reduce((n, h) => n + (h.submissionCount || 0), 0);
  const live = hackathons.filter(h => h.status === "active").length;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Events", value: hackathons.length, sub: `${hackathons.filter(h => typeOf(h) === "hackathon").length} hackathons`, icon: Trophy, color: KIT.orange, loading },
        { label: "Running now", value: live, sub: `${hackathons.filter(h => h.status === "upcoming").length} upcoming`, icon: Zap, color: KIT.green, loading },
        { label: "Registrations", value: regs, sub: "Across all events", icon: Users, color: KIT.cyan, loading },
        { label: "Submissions", value: subs, sub: regs ? `${Math.round((100 * subs) / regs)}% of registrants` : "", icon: Upload, color: KIT.purple, loading },
      ]} />
      <DataTable title="Events" icon={Trophy} subtitle="Hackathons, workshops, meetups and talks on /events."
        rows={hackathons} loading={loading}
        searchKeys={["title", "id", "organizer", "tagline"]} searchPlaceholder="Search events..."
        filters={[
          { key: "eventType", label: "All types", get: typeOf, options: EVENT_TYPES.map(t => ({ value: t.v, label: t.label })) },
          { key: "status", label: "All statuses", get: h => h.status || "upcoming", options: HACKATHON_STATUSES.map(s => ({ value: s.v, label: s.v[0].toUpperCase() + s.v.slice(1) })) },
        ]}
        primaryAction={{ label: "Create event", icon: Plus, onClick: startCreate }}
        onRowClick={startEdit} emptyText="No events yet."
        columns={[
          { key: "title", label: "Event", render: h => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{h.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">/events/{h.id}</p>
            </div>
          ) },
          { key: "eventType", label: "Type", render: h => <Pill color={KIT.cyan}>{EVENT_TYPES.find(t => t.v === typeOf(h))?.label || "Hackathon"}</Pill> },
          { key: "registrationCount", label: "Registered", sort: h => h.registrationCount || 0, render: h => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(h.registrationCount || 0)}</span> },
          { key: "submissionCount", label: "Submitted", sort: h => h.submissionCount || 0, render: h => <span className="font-sans text-sm text-white/80 tabular-nums">{fmt(h.submissionCount || 0)}</span> },
          { key: "submissionDeadline", label: "Deadline", sort: h => when(h.submissionDeadline)?.getTime() || 0,
            render: h => <span className="font-sans text-xs text-white/55">{when(h.submissionDeadline)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
          { key: "status", label: "Status", render: h => (
            <select value={h.status || "upcoming"} onClick={e => e.stopPropagation()} onChange={e => handleSetStatus(h.id, e.target.value)}
              aria-label={`Status of ${h.title}`}
              className="font-sans text-xs font-medium pl-2 pr-6 py-1 rounded-md outline-none cursor-pointer appearance-none"
              style={{ color: statusC(h.status), background: `${statusC(h.status)}14`, border: `1px solid ${statusC(h.status)}40` }}>
              {HACKATHON_STATUSES.map(s => <option key={s.v} value={s.v} style={{ background: "#0b0f17", color: "#fff" }}>{s.v[0].toUpperCase() + s.v.slice(1)}</option>)}
            </select>
          ) },
        ]}
        rowActions={h => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(h) },
          { icon: ExternalLink, label: "View page", onClick: () => window.open(`/events/${h.id}`, "_blank", "noopener") },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(h.id) },
        ]}
      />
      <Drawer open={drawerOpen} onClose={cancelEdit} width={760}
        title={editingId ? `Edit ${form.title || editingId}` : "Create event"}
        subtitle={editingId ? "Changes go live on /events immediately." : "The slug becomes the event's URL and can't change later."}
        footer={<>
          <SecondaryButton onClick={cancelEdit}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleSave}>{editingId ? "Save changes" : "Create event"}</PrimaryButton>
        </>}>
        <div className="space-y-3">
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

        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">MODE (optional)</p>
          <div className="flex gap-2 flex-wrap">
            {EVENT_MODES.map(m => (
              <button key={m.v} onClick={() => setForm(p => ({ ...p, mode: p.mode === m.v ? "" : m.v }))}
                className="flex-1 font-mono text-[10px] py-1.5 rounded transition-colors"
                style={{
                  color:      form.mode === m.v ? "#00FFFF" : "rgba(255,255,255,0.3)",
                  background: form.mode === m.v ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border:     form.mode === m.v ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >{m.label.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="SLUG (doc ID)" value={form.slug} onChange={f("slug")} placeholder="devcon-2026" hint={editingId ? "locked once created" : undefined} />
          <Input label="TITLE" value={form.title} onChange={f("title")} placeholder="DevCon Hackathon 2026" />
        </div>
        <Input label="TAGLINE" value={form.tagline} onChange={f("tagline")} placeholder="Think. Build. Electrify." />
        <Textarea label="DESCRIPTION" value={form.description} onChange={f("description")} placeholder="What's this event about?" rows={3} />
        <Input label="BANNER IMAGE URL (optional)" value={form.bannerImage} onChange={f("bannerImage")}
          placeholder="https://..." hint="Shown at the top of the listing card and event page when set - card falls back to the plain accent bar otherwise" />

        {!isHack && (
          <Input label="HOST / SPEAKER" value={form.host} onChange={f("host")} placeholder="e.g. Jane Doe, Senior SWE @ Acme" />
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="THEME (optional)" value={form.theme} onChange={f("theme")} placeholder="AI, Web3, Open Innovation" />
          <Input label="ACCENT COLOR" type="color" value={form.accentColor} onChange={f("accentColor")} />
          <Input label="VENUE (optional)" value={form.venue} onChange={f("venue")} placeholder="TBA" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="MIN TEAM SIZE (optional)" value={form.minTeamSize} onChange={f("minTeamSize")} placeholder="2" />
          <Input label="MAX TEAM SIZE" value={form.maxTeamSize} onChange={f("maxTeamSize")} placeholder="4" />
          <Input label="DURATION LABEL (optional)" value={form.durationLabel} onChange={f("durationLabel")} placeholder="12 Hours" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="REGISTRATION FEE (optional)" value={form.registrationFee} onChange={f("registrationFee")} placeholder="₹950 / team" />
          <Input label="PRIZE POOL HEADLINE (optional)" value={form.prizePool} onChange={f("prizePool")} placeholder="₹20,000" />
        </div>
        <Input label="TAGS (comma separated)" value={form.tags} onChange={f("tags")} placeholder="Web, AI, Mobile" />
        <Input label="PERKS (comma separated, optional)" value={form.perks} onChange={f("perks")} placeholder="Breakfast, Lunch, Snacks, Certificates" />

        <div>
          <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">
            EXTERNAL REGISTRATION FORM (optional)
          </p>
          <Input label="FORM URL" value={form.registrationFormUrl} onChange={f("registrationFormUrl")}
            placeholder="https://forms.gle/..." hint="When set, Register buttons link out here instead of registering in-app" />
        </div>

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

        <Textarea label="WHY PARTICIPATE (one reason per line, optional)" value={form.whyParticipate} onChange={f("whyParticipate")}
          placeholder={"Build something real\nCompete with developers\nNetwork with builders"} rows={3} />
        <Textarea label='FAQ ("Question :: Answer" per line, optional)' value={form.faq} onChange={f("faq")}
          placeholder={"What is the registration fee? :: ₹950 per team"} rows={3} />

        <p className="font-mono text-[10px] text-white/40 tracking-widest pt-2">TIMELINE</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="REGISTRATIONS OPEN" type="datetime-local" value={form.registrationOpen} onChange={f("registrationOpen")} />
          <Input label="REGISTRATIONS CLOSE (optional)" type="datetime-local" value={form.registrationCloseAt} onChange={f("registrationCloseAt")} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={isHack ? "SUBMISSION DEADLINE" : "EVENT DATE/TIME"} type="datetime-local" value={form.submissionDeadline} onChange={f("submissionDeadline")} />
          {isHack && <Input label="RESULTS DATE" type="date" value={form.resultsDate} onChange={f("resultsDate")} />}
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
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
  const [composing, setComposing] = useState(false);

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
      setComposing(false);
      logAdminActivity("sent notification", `${form.target === "all" ? "all users" : form.uid.trim()}: ${form.title.trim()}`);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };


  const when = (t) => (t?.toDate ? t.toDate() : null);
  const typeC = (v) => NOTIF_TYPES.find(t => t.v === v)?.c || KIT.cyan;
  const broadcasts = notifs.filter(n => n.targetUid === "all").length;
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const handleDelete = async (n) => {
    if (!confirm(`Delete "${n.title}"? It disappears from every recipient's bell.`)) return;
    await deleteDoc(doc(db, "notifications", n.id));
    logAdminActivity("deleted notification", n.title);
    load();
  };
  const resend = (n) => {
    setForm({ target: n.targetUid === "all" ? "all" : "specific", uid: n.targetUid === "all" ? "" : n.targetUid || "",
      type: n.type || "info", title: n.title || "", body: n.body || "", ctaLabel: n.ctaLabel || "", ctaHref: n.ctaHref || "" });
    setError(""); setComposing(true);
  };

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Notifications", value: notifs.length, sub: "All time", icon: Bell, color: KIT.cyan, loading },
        { label: "To everyone", value: broadcasts, sub: "Broadcast to all users", icon: Megaphone, color: KIT.purple, loading },
        { label: "To one user", value: notifs.length - broadcasts, sub: "Targeted", icon: Users, color: KIT.green, loading },
        { label: "Last 7 days", value: notifs.filter(n => when(n.createdAt)?.getTime() > week).length, sub: "Sent this week", icon: Activity, color: KIT.orange, loading },
      ]} />
      <DataTable title="Notifications" icon={Bell} subtitle="Every notification in users' bells - system-generated ones included."
        rows={notifs} loading={loading} pageSize={15}
        searchKeys={["title", "body", "targetUid"]} searchPlaceholder="Search title, body or user UID..."
        filters={[
          { key: "type", label: "All types", options: NOTIF_TYPES.map(t => ({ value: t.v, label: t.v })) },
          { key: "audience", label: "All audiences", get: n => (n.targetUid === "all" ? "all" : "user"), options: [{ value: "all", label: "Everyone" }, { value: "user", label: "One user" }] },
        ]}
        primaryAction={{ label: "Send notification", icon: Bell, onClick: () => { setForm(blank); setError(""); setComposing(true); } }}
        emptyText="No notifications sent yet."
        columns={[
          { key: "title", label: "Notification", render: n => (
            <div className="min-w-0 w-[260px] xl:w-[340px]">
              <p className="font-sans text-sm font-medium text-white truncate">{n.title}</p>
              <p className="font-sans text-xs text-white/40 truncate">{n.body}</p>
            </div>
          ) },
          { key: "type", label: "Type", render: n => <Pill color={typeC(n.type)}>{n.type || "-"}</Pill> },
          { key: "targetUid", label: "Audience", render: n => n.targetUid === "all"
            ? <span className="font-sans text-sm text-white/80">Everyone</span>
            : <span className="font-mono text-xs text-white/55">{(n.targetUid || "").slice(0, 12)}{(n.targetUid || "").length > 12 ? "..." : ""}</span> },
          { key: "ctaLabel", label: "Button", sortable: false, render: n => <span className="font-sans text-xs text-white/55">{n.ctaLabel || "-"}</span> },
          { key: "createdAt", label: "Sent", sort: n => when(n.createdAt)?.getTime() || 0, render: n => <span className="font-sans text-xs text-white/50">{when(n.createdAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
        ]}
        rowActions={n => [
          { icon: Copy, label: "Send again", onClick: () => resend(n) },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(n) },
        ]}
      />
      <Drawer open={composing} onClose={() => setComposing(false)} width={600} title="Send notification"
        subtitle="Appears in the bell immediately."
        footer={<>
          <SecondaryButton onClick={() => setComposing(false)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Bell} busy={saving} onClick={handleSend}>{sent ? "Sent" : "Send"}</PrimaryButton>
        </>}>
        <div className="space-y-4">
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
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
        </div>
      </Drawer>
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
  const [openId,   setOpenId]   = useState(null);
  const [working,  setWorking]  = useState({});

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")))
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);


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
    logAdminActivity("deleted shipyard project", p.name || p.id);
    setOpenId(null);
    load();
  };

  const when = (t) => (t?.toDate ? t.toDate() : null);
  const sel = projects.find(x => x.id === openId);
  const reacted = projects.filter(x => x.reaction).length;
  const reactionColor = (v) => SHIP_REACTIONS.find(r => r.v === v)?.c || KIT.muted;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Projects", value: projects.length, sub: "Docked on Shipyard", icon: Anchor, color: KIT.cyan, loading },
        { label: "Awaiting review", value: projects.length - reacted, sub: "No reaction yet", icon: Eye, color: projects.length - reacted ? KIT.orange : KIT.green, loading },
        { label: "Likes", value: projects.reduce((n, x) => n + (x.likeCount || 0), 0), sub: "Across all projects", icon: Heart, color: KIT.red, loading },
        { label: "Comments", value: projects.reduce((n, x) => n + (x.commentCount || 0), 0), sub: "Across all projects", icon: MessageSquare, color: KIT.purple, loading },
      ]} />
      <DataTable title="Shipyard projects" icon={Anchor} subtitle="Give each project a reaction; it shows on the project card."
        rows={projects} loading={loading}
        searchKeys={["name", "ownerHandle", "description"]} searchPlaceholder="Search project or owner..."
        filters={[
          { key: "reaction", label: "Any reaction", get: x => x.reaction || "none", options: [{ value: "none", label: "No reaction yet" }, ...SHIP_REACTIONS.map(r => ({ value: r.v, label: r.v }))] },
        ]}
        onRowClick={x => setOpenId(x.id)} emptyText="No projects docked yet."
        columns={[
          { key: "name", label: "Project", render: x => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{x.name}</p>
              <p className="font-sans text-xs text-white/40 truncate">{x.description}</p>
            </div>
          ) },
          { key: "ownerHandle", label: "Owner", render: x => <span className="font-sans text-sm text-white/70">@{x.ownerHandle || "?"}</span> },
          { key: "likeCount", label: "Likes", sort: x => x.likeCount || 0, render: x => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(x.likeCount || 0)}</span> },
          { key: "commentCount", label: "Comments", sort: x => x.commentCount || 0, render: x => <span className="font-sans text-sm text-white/70 tabular-nums">{fmt(x.commentCount || 0)}</span> },
          { key: "reaction", label: "Reaction", render: x => x.reaction ? <Pill color={reactionColor(x.reaction)}>{x.reaction}</Pill> : <span className="font-sans text-xs text-white/35">None yet</span> },
          { key: "createdAt", label: "Docked", sort: x => when(x.createdAt)?.getTime() || 0, render: x => <span className="font-sans text-xs text-white/50">{when(x.createdAt)?.toLocaleDateString("en-IN", { dateStyle: "medium" }) || "-"}</span> },
        ]}
        rowActions={x => [
          { icon: Eye, label: "Review", onClick: () => setOpenId(x.id) },
          x.url && { icon: ExternalLink, label: "Open project", onClick: () => window.open(x.url, "_blank", "noopener") },
          { icon: Trash2, label: "Delete", danger: true, onClick: () => handleDelete(x) },
        ]}
      />
      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={600} title={sel?.name || ""}
        subtitle={sel ? `by @${sel.ownerHandle} · ${fmt(sel.likeCount || 0)} likes · ${fmt(sel.commentCount || 0)} comments` : ""}>
        {sel && (
          <div className="space-y-4">
            {sel.description && <p className="font-sans text-sm text-white/70 leading-relaxed">{sel.description}</p>}
            {sel.url && <SecondaryButton icon={ExternalLink} onClick={() => window.open(sel.url, "_blank", "noopener")}>Open project</SecondaryButton>}
            <DrawerSection title="Reaction" hint="Shown on the project card. Pick one.">
              <div className="flex flex-wrap gap-2">
                {SHIP_REACTIONS.map(r => (
                  <button key={r.v} disabled={working[sel.id]} onClick={() => handleReaction(sel, r.v)}
                    className="font-sans text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                    style={sel.reaction === r.v ? { color: r.c, background: `${r.c}14`, borderColor: `${r.c}55` } : { color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {r.v}
                  </button>
                ))}
              </div>
            </DrawerSection>
          </div>
        )}
      </Drawer>
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
  const [openId,      setOpenId]      = useState(null);

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
      logAdminActivity("scored hackathon submission", `${sub.projectName} (${slug}): ${d.score === "" ? "-" : d.score}`);
      loadSubmissions(slug);
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [sub.id]: false })); }
  };

  const scored = submissions.filter(s => s.score != null).length;
  const winners = submissions.filter(s => s.winner).length;
  const avg = scored ? submissions.filter(s => s.score != null).reduce((n, s) => n + s.score, 0) / scored : 0;
  const sel = submissions.find(s => s.id === openId);
  const d = sel ? drafts[sel.id] || {} : {};
  const numCls = "w-full font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 tabular-nums";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-sans text-sm text-white/55">Hackathon</span>
        <select value={slug} onChange={e => setSlug(e.target.value)} aria-label="Hackathon to judge"
          className="font-sans text-sm text-white/85 pl-3 pr-8 py-2 rounded-lg outline-none border border-white/10 min-w-[260px]"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          {hackathons.length === 0 && <option value="">No hackathons yet</option>}
          {hackathons.map(h => <option key={h.id} value={h.id} style={{ background: "#0b0f17" }}>{h.title}</option>)}
        </select>
      </div>

      <StatGrid stats={[
        { label: "Submissions", value: submissions.length, sub: "For this hackathon", icon: Upload, color: KIT.cyan, loading },
        { label: "Scored", value: `${scored} / ${submissions.length}`, sub: submissions.length - scored ? `${submissions.length - scored} still to judge` : "All judged", icon: Gavel, color: submissions.length - scored ? KIT.orange : KIT.green, loading },
        { label: "Average score", value: scored ? avg.toFixed(1) : "-", sub: "Of scored projects", icon: BarChart3, color: KIT.purple, loading },
        { label: "Winners", value: winners, sub: "Marked as winner", icon: Trophy, color: KIT.gold, loading },
      ]} />

      <DataTable title="Submissions" icon={Gavel} subtitle="Highest score first. Click a project to review and score it."
        rows={submissions} loading={loading}
        searchKeys={["projectName", "handle", "description"]} searchPlaceholder="Search projects or builders..."
        filters={[{ key: "judged", label: "All submissions", get: s => (s.score != null ? "scored" : "unscored"), options: [{ value: "unscored", label: "Not scored yet" }, { value: "scored", label: "Scored" }] }]}
        onRowClick={s => setOpenId(s.id)} emptyText={slug ? "No submissions yet." : "Pick a hackathon."}
        columns={[
          { key: "projectName", label: "Project", render: s => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{s.projectName}{s.winner && <Trophy size={12} className="inline ml-1.5 -mt-0.5" style={{ color: KIT.gold }} />}</p>
              <p className="font-sans text-xs text-white/40 truncate">@{s.handle}</p>
            </div>
          ) },
          { key: "stack", label: "Stack", sortable: false, render: s => <span className="font-sans text-xs text-white/55 truncate block max-w-[200px]">{(s.stack || []).join(", ") || "-"}</span> },
          { key: "score", label: "Score", sort: s => s.score ?? -1, render: s => s.score != null ? <span className="font-sans text-sm font-semibold text-white tabular-nums">{s.score}</span> : <Pill color={KIT.orange}>Not scored</Pill> },
          { key: "rank", label: "Rank", sort: s => s.rank ?? 9999, render: s => <span className="font-sans text-sm text-white/70 tabular-nums">{s.rank ?? "-"}</span> },
        ]}
        rowActions={s => [
          { icon: Gavel, label: "Score", onClick: () => setOpenId(s.id) },
          s.repoUrl && { icon: ExternalLink, label: "Open repo", onClick: () => window.open(s.repoUrl, "_blank", "noopener") },
        ]}
      />

      <Drawer open={!!sel} onClose={() => setOpenId(null)} width={620} title={sel?.projectName || ""} subtitle={sel ? `by @${sel.handle}` : ""}
        footer={sel && <>
          <SecondaryButton onClick={() => setOpenId(null)}>Close</SecondaryButton>
          <PrimaryButton icon={Check} busy={working[sel.id]} onClick={() => handleSave(sel)}>Save score</PrimaryButton>
        </>}>
        {sel && (
          <div className="space-y-4">
            {sel.description && <p className="font-sans text-sm text-white/70 leading-relaxed">{sel.description}</p>}
            <div className="flex flex-wrap gap-2">
              {sel.repoUrl && <SecondaryButton icon={ExternalLink} onClick={() => window.open(sel.repoUrl, "_blank", "noopener")}>Repository</SecondaryButton>}
              {sel.demoUrl && <SecondaryButton icon={ExternalLink} onClick={() => window.open(sel.demoUrl, "_blank", "noopener")}>Live demo</SecondaryButton>}
            </div>
            {sel.stack?.length > 0 && <div className="flex flex-wrap gap-1.5">{sel.stack.map(t => <Pill key={t} color={KIT.cyan}>{t}</Pill>)}</div>}
            <DrawerSection title="Judging" hint="Leave score or rank empty to clear it.">
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="font-mono text-[10px] text-white/30 tracking-wider">SCORE</span>
                  <input type="number" value={d.score} onChange={e => setDraft(sel.id, "score", e.target.value)} className={`${numCls} mt-1`} style={{ background: "rgba(255,255,255,0.03)" }} /></label>
                <label className="block"><span className="font-mono text-[10px] text-white/30 tracking-wider">RANK</span>
                  <input type="number" value={d.rank} onChange={e => setDraft(sel.id, "rank", e.target.value)} className={`${numCls} mt-1`} style={{ background: "rgba(255,255,255,0.03)" }} /></label>
              </div>
              <label className="flex items-center gap-3">
                <Toggle on={!!d.winner} label="Winner" onChange={v => setDraft(sel.id, "winner", v)} />
                <span className="font-sans text-sm text-white/70">Mark as a winner</span>
              </label>
            </DrawerSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Arena matches panel ───────────────────────────────────────────────────────

function ArenaMatchesPanel() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState({});

  useEffect(() => {
    getDocs(query(collection(db, "arena_matches"), orderBy("finishedAt", "desc"), limit(300)))
      .then(snap => setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (m) => {
    if (!confirm(`Revoke this win by @${m.handle} (${m.xp} XP)?`)) return;
    setWorking(w => ({ ...w, [m.id]: true }));
    try {
      await updateDoc(doc(db, "arena_matches", m.id), { status: "revoked", revokedAt: serverTimestamp() });
      if (m.uid) {
        await updateDoc(doc(db, "users", m.uid), { xp: increment(-(m.xp || 0)), arenaWins: increment(-1) });
      }
      logAdminActivity("revoked arena win", `@${m.handle} (${m.xp || 0} XP)`);
      setMatches(prev => prev.map(x => x.id === m.id ? { ...x, status: "revoked" } : x));
    } catch (e) { console.error(e); }
    finally { setWorking(w => ({ ...w, [m.id]: false })); }
  };

  const STATUS_COLORS = { won: KIT.green, forfeit: "rgba(255,255,255,0.45)", timeout: KIT.orange, revoked: KIT.red };
  const won = matches.filter(m => m.status === "won");
  const xpAwarded = won.reduce((n, m) => n + (m.xp || 0), 0);
  const when = (t) => (t?.toDate ? t.toDate() : null);

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Matches loaded", value: matches.length, sub: "Most recent 300", icon: Crosshair, color: KIT.cyan, loading },
        { label: "Wins", value: won.length, sub: matches.length ? `${Math.round((100 * won.length) / matches.length)}% of matches` : "", icon: Trophy, color: KIT.green, loading },
        { label: "XP awarded", value: xpAwarded, sub: "From wins in this list", icon: Zap, color: KIT.purple, loading },
        { label: "Revoked", value: matches.filter(m => m.status === "revoked").length, sub: "Wins taken back", icon: X, color: KIT.red, loading },
      ]} />
      <DataTable title="Arena matches" icon={Crosshair} subtitle="Finished matches, newest first. Revoking a win also takes back its XP."
        rows={matches} loading={loading}
        searchKeys={["handle", "challenge"]} searchPlaceholder="Search by player or challenge..."
        filters={[{ key: "status", label: "All results", options: ["won", "forfeit", "timeout", "revoked"].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) }]}
        emptyText="No matches yet."
        columns={[
          { key: "handle", label: "Player", render: m => <span className="font-sans text-sm font-medium text-white">@{m.handle || "?"}</span> },
          { key: "challenge", label: "Challenge", render: m => <span className="font-sans text-sm text-white/65 truncate block max-w-[280px]">{m.challenge || "-"}</span> },
          { key: "status", label: "Result", render: m => <Pill color={STATUS_COLORS[m.status] || KIT.muted}>{m.status ? m.status[0].toUpperCase() + m.status.slice(1) : "-"}</Pill> },
          { key: "xp", label: "XP", sort: m => m.xp || 0, render: m => <span className="font-sans text-sm text-white/80 tabular-nums">+{fmt(m.xp || 0)}</span> },
          { key: "finishedAt", label: "Finished", sort: m => when(m.finishedAt)?.getTime() || 0,
            render: m => <span className="font-sans text-xs text-white/50">{when(m.finishedAt)?.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) || "-"}</span> },
        ]}
        rowActions={m => [m.status === "won" && { icon: X, label: "Revoke win", danger: true, disabled: working[m.id], onClick: () => handleRevoke(m) }]}
      />
    </div>
  );
}

// ── Ranks ladder panel ────────────────────────────────────────────────────────

// A titled settings block with its own save button - the admin console's
// shape for config docs (system/economy, reward policy...), as opposed to
// DataTable for collections.
function SettingsCard({ title, subtitle, dirty, saving, saved, onSave, children }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: KIT.surface, borderColor: KIT.line }}>
      <div className="px-4 sm:px-5 py-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: KIT.line }}>
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="font-sans text-xs text-white/45 mt-0.5 max-w-2xl">{subtitle}</p>}
        </div>
        {dirty && !saving && <span className="font-sans text-xs" style={{ color: KIT.orange }}>Unsaved changes</span>}
        {onSave && <PrimaryButton icon={Check} busy={saving} disabled={!dirty && !saved} onClick={onSave}>{saved ? "Saved" : "Save changes"}</PrimaryButton>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function RanksPanel() {
  const [tiers,   setTiers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

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
      logAdminActivity("updated rank ladder", `${cleaned.length} tiers`);
      setOpenIdx(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };


  const rows = tiers.map((t, i) => ({ ...t, _i: i, _key: t.tier || String(i) }));
  const sel = openIdx !== null ? tiers[openIdx] : null;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Tiers", value: tiers.length, sub: "On the /ranks ladder", icon: Medal, color: KIT.gold, loading },
        { label: "Locked tiers", value: tiers.filter(t => t.locked).length, sub: "Shown as locked", icon: LockIcon, color: KIT.orange, loading },
        { label: "Perks", value: tiers.reduce((n, t) => n + (t.perksRaw || "").split("\n").filter(s => s.trim()).length, 0), sub: "Across all tiers", icon: Star, color: KIT.purple, loading },
        { label: "Top tier", value: tiers[tiers.length - 1]?.tier || "-", sub: tiers[tiers.length - 1]?.xp || "", icon: Trophy, color: KIT.green, loading },
      ]} />
      <DataTable title="Rank ladder" icon={Medal}
        subtitle="Edits how /ranks displays each tier. The XP thresholds that actually assign a user's tier live in code and don't change here."
        rows={rows} loading={loading} rowKey={r => r._key} onRowClick={r => setOpenIdx(r._i)}
        columns={[
          { key: "tier", label: "Tier", sortable: false, render: t => (
            <span className="inline-flex items-center gap-2 font-sans text-sm font-medium text-white">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />{t.tier}
            </span>
          ) },
          { key: "xp", label: "XP", sortable: false, render: t => <span className="font-sans text-sm text-white/75 tabular-nums">{t.xp || "-"}</span> },
          { key: "req", label: "Requirement", sortable: false, render: t => <span className="font-sans text-sm text-white/65 truncate block max-w-[260px]">{t.req || "-"}</span> },
          { key: "perks", label: "Perks", sortable: false, render: t => <span className="font-sans text-sm text-white/60 tabular-nums">{(t.perksRaw || "").split("\n").filter(s => s.trim()).length}</span> },
          { key: "locked", label: "Status", sortable: false, render: t => t.locked ? <Pill color={KIT.orange}>Locked</Pill> : <Pill color={KIT.green}>Unlocked</Pill> },
        ]}
        rowActions={t => [{ icon: Pencil, label: "Edit", onClick: () => setOpenIdx(t._i) }]}
      />
      <Drawer open={!!sel} onClose={() => setOpenIdx(null)} width={600} title={sel ? `Edit ${sel.tier}` : ""}
        subtitle="Saving writes the whole ladder."
        footer={<>
          <SecondaryButton onClick={() => setOpenIdx(null)}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={saving} onClick={handleSave}>Save ladder</PrimaryButton>
        </>}>
        {sel && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input label="COLOR (hex)" value={sel.color} onChange={v => update(openIdx, "color", v)} placeholder="#00FFFF" />
              <Input label="REQUIREMENT" value={sel.req} onChange={v => update(openIdx, "req", v)} placeholder="Win 1 Mission" />
              <Input label="XP LABEL" value={sel.xp} onChange={v => update(openIdx, "xp", v)} placeholder="2,000+" />
            </div>
            <Textarea label="PERKS (one per line)" value={sel.perksRaw} onChange={v => update(openIdx, "perksRaw", v)} rows={5} />
            <label className="flex items-center gap-3">
              <Toggle on={!!sel.locked} label="Locked tier" onChange={v => update(openIdx, "locked", v)} />
              <span className="font-sans text-sm text-white/65">Show this tier as locked</span>
            </label>
          </div>
        )}
      </Drawer>
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
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "system", "economy"))
      .then(snap => { const v = { ...DEFAULT_ECONOMY, ...(snap.exists() ? snap.data() : {}) }; setForm(v); setInitial(v); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const cleaned = Object.fromEntries(ECONOMY_FIELDS.map(f => [f.k, parseInt(form[f.k]) || 0]));
      await setDoc(doc(db, "system", "economy"), { ...cleaned, updatedAt: serverTimestamp() });
      logAdminActivity("updated wallet economy", ECONOMY_FIELDS.map(f => `${f.k}=${cleaned[f.k]}`).join(", "));
      setInitial({ ...form, ...cleaned });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };


  const n = (k) => parseInt(form[k]) || 0;
  const dirty = !!initial && ECONOMY_FIELDS.some(f => String(form[f.k] ?? "") !== String(initial[f.k] ?? ""));
  const inrPerCoin = n("COINS_PER_INR") ? 1 / n("COINS_PER_INR") : 0;
  const GROUPS = [
    { title: "Earning rates", hint: "Coins a creator earns per engagement on their Pulse posts.", keys: ["PER_LIKE", "PER_COMMENT", "PER_SAVE"] },
    { title: "Conversion & payouts", hint: "How coins turn into XP and real money on /wallet.", keys: ["XP_PER_COIN", "COINS_PER_INR", "MIN_PAYOUT"] },
  ];

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "1 coin is worth", value: inrPerCoin ? `₹${inrPerCoin.toFixed(inrPerCoin < 0.1 ? 3 : 2)}` : "-", sub: `${fmt(n("COINS_PER_INR"))} coins = ₹1`, icon: Coins, color: KIT.gold, loading },
        { label: "Minimum payout", value: n("COINS_PER_INR") ? `₹${(n("MIN_PAYOUT") / n("COINS_PER_INR")).toFixed(2)}` : "-", sub: `${fmt(n("MIN_PAYOUT"))} coins`, icon: Wallet, color: KIT.green, loading },
        { label: "A like earns", value: `${fmt(n("PER_LIKE"))} coins`, sub: `Comment ${fmt(n("PER_COMMENT"))} · save ${fmt(n("PER_SAVE"))}`, icon: Heart, color: KIT.red, loading },
        { label: "1 coin gives", value: `${fmt(n("XP_PER_COIN"))} XP`, sub: "XP conversion rate", icon: Zap, color: KIT.purple, loading },
      ]} />
      <SettingsCard title="Wallet economy" dirty={dirty} saving={saving} saved={saved} onSave={handleSave}
        subtitle="Drives /wallet and /pulse coin earning directly. Applies to new activity from the moment you save - past balances are not recalculated.">
        {loading ? <div className="h-40 rounded-lg bg-white/[0.03] animate-pulse" /> : (
          <div className="grid lg:grid-cols-2 gap-5">
            {GROUPS.map(g => (
              <div key={g.title} className="space-y-3">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-white/90">{g.title}</h3>
                  <p className="font-sans text-xs text-white/40">{g.hint}</p>
                </div>
                {ECONOMY_FIELDS.filter(f => g.keys.includes(f.k)).map(f => (
                  <Input key={f.k} label={f.label} type="number" value={form[f.k] ?? ""} onChange={v => setForm(p => ({ ...p, [f.k]: v }))} />
                ))}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

// The per-module XP/coins a topic pays on a perfect paper - system/rewardPolicy
// itself has been live-configurable (see lib/rewardPolicy.js's loadRewardPolicy/
// saveRewardPolicy) since before this panel existed, but saveRewardPolicy() had
// zero callers anywhere in the frontend: changing a reward meant hand-writing
// the Firestore doc directly. This is the admin surface that was missing, not
// new config plumbing - mirrors EconomyPanel above field-for-field, just
// keyed by module instead of a flat rate list. Deliberately scoped to xp/coins
// only, not every tunable in DEFAULT_REWARD_POLICY (passPct, maxAttempts,
// wrongPenaltyRatio, lockOnFail, completionRequiresPass) - those are rarer,
// higher-blast-radius gating knobs (e.g. mis-setting maxAttempts could lock
// every student out of a module), left as hand-edit-only until there's a
// concrete need for a UI around them specifically.
const REWARD_MODULE_FIELDS = [
  { key: "defaults",               label: "DEFAULT (fallback for any module)" },
  { key: "cscore",                 label: "CS CORE TOPIC" },
  { key: "gate",                   label: "GATE TOPIC" },
  { key: "programming",            label: "PROGRAMMING TOPIC" },
  { key: "softwareEngineering",    label: "SOFTWARE ENGINEERING TOPIC" },
  { key: "dsaConcepts",            label: "DSA CONCEPT" },
  { key: "aptitude",               label: "APTITUDE TOPIC" },
  { key: "daily_learning",         label: "DAILY LEARNING (DAY)" },
  { key: "daily_learning_problem", label: "DAILY LEARNING (PROBLEM)" },
  { key: "gate_day",               label: "GATE DAILY GOAL" },
  { key: "roadmaps",               label: "ROADMAP TOPIC" },
];

function RewardPolicyPanel() {
  // Flat by module key ({ defaults: {xp,coins}, cscore: {xp,coins}, ... }),
  // reassembled into DEFAULT_REWARD_POLICY's real { defaults, modules } shape
  // only at save time - simpler to read/update per-field than threading the
  // real nested shape through every input's onChange.
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    loadRewardPolicy().then(policy => {
      const flat = { defaults: { xp: policy.defaults.xp, coins: policy.defaults.coins } };
      for (const f of REWARD_MODULE_FIELDS) {
        if (f.key === "defaults") continue;
        const mod = policy.modules[f.key] || {};
        flat[f.key] = { xp: mod.xp ?? policy.defaults.xp, coins: mod.coins ?? policy.defaults.coins };
      }
      setForm(flat);
      setInitial(JSON.stringify(flat));
    }).catch(console.error);
  }, []);

  const setFieldValue = (key, sub, v) => {
    setForm(prev => ({ ...prev, [key]: { ...prev[key], [sub]: v } }));
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const modules = {};
      for (const f of REWARD_MODULE_FIELDS) {
        if (f.key === "defaults") continue;
        modules[f.key] = { xp: parseInt(form[f.key].xp) || 0, coins: parseInt(form[f.key].coins) || 0 };
      }
      await saveRewardPolicy({
        defaults: { xp: parseInt(form.defaults.xp) || 0, coins: parseInt(form.defaults.coins) || 0 },
        modules,
      });
      logAdminActivity("updated reward policy", `default ${form.defaults.xp} XP / ${form.defaults.coins} coins`);
      setInitial(JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };


  const dirty = !!form && initial !== JSON.stringify(form);
  const mods = form ? REWARD_MODULE_FIELDS.filter(f => f.key !== "defaults") : [];
  const custom = form ? mods.filter(f => String(form[f.key].xp) !== String(form.defaults.xp) || String(form[f.key].coins) !== String(form.defaults.coins)).length : 0;
  const cell = "w-full font-sans text-sm text-white/85 px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/25 tabular-nums";

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Default reward", value: form ? `${fmt(parseInt(form.defaults.xp) || 0)} XP` : null, sub: form ? `${fmt(parseInt(form.defaults.coins) || 0)} coins per perfect topic` : "", icon: Trophy, color: KIT.green, loading: !form },
        { label: "Modules", value: mods.length, sub: "With their own reward", icon: Layers, color: KIT.cyan },
        { label: "Custom rates", value: form ? custom : null, sub: "Differ from the default", icon: Pencil, color: KIT.orange, loading: !form },
        { label: "Highest XP", value: form ? Math.max(...REWARD_MODULE_FIELDS.map(f => parseInt(form[f.key].xp) || 0)) : null, sub: "Any single module", icon: Zap, color: KIT.purple, loading: !form },
      ]} />
      <SettingsCard title="Reward policy" dirty={dirty} saving={saving} saved={saved} onSave={handleSave}
        subtitle="What a topic pays on a perfect paper, spread across its questions (wrong answers cost a fraction - see lib/rewardPolicy.js). A topic's own xpReward/coinReward still overrides these.">
        {!form ? <div className="h-64 rounded-lg bg-white/[0.03] animate-pulse" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead><tr className="border-b" style={{ borderColor: KIT.line }}>
                <th className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left py-2.5 pr-3">Module</th>
                <th className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left py-2.5 px-2 w-32">XP</th>
                <th className="font-sans text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left py-2.5 pl-2 w-32">Coins</th>
              </tr></thead>
              <tbody>
                {REWARD_MODULE_FIELDS.map(f => (
                  <tr key={f.key} className="border-b last:border-b-0" style={{ borderColor: KIT.line, background: f.key === "defaults" ? "rgba(0,255,65,0.03)" : undefined }}>
                    <td className="py-2 pr-3 font-sans text-sm text-white/80">
                      {f.label.replace(/ \(.*\)$/, "").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                      {f.key === "defaults" && <span className="font-sans text-xs text-white/40 ml-2">fallback for any module</span>}
                    </td>
                    <td className="py-2 px-2"><input type="number" aria-label={`${f.label} XP`} value={form[f.key]?.xp ?? ""} onChange={e => setFieldValue(f.key, "xp", e.target.value)} className={cell} style={{ background: "rgba(255,255,255,0.03)" }} /></td>
                    <td className="py-2 pl-2"><input type="number" aria-label={`${f.label} coins`} value={form[f.key]?.coins ?? ""} onChange={e => setFieldValue(f.key, "coins", e.target.value)} className={cell} style={{ background: "rgba(255,255,255,0.03)" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────

// ── Admin console shell ───────────────────────────────────────────────────────
//
// One registry drives the sidebar, the Ctrl/Cmd+K search, the breadcrumb and
// the URL (/admin?tab=<group>&section=<section>). A new admin capability is
// ONE entry here, inside the group that actually owns it - a group's name must
// describe everything under it (the first version filed Campus sales and job
// applications under "Community", and payouts beside database tools).
// Section keys are unique across ALL groups, so an old link keeps working
// after a section moves group: resolveLocation() finds it by key.
// `superOnly` hides a section from anyone without the superAdmin claim.
const ADMIN_NAV = [
  { key: "overview", label: "Overview", icon: BarChart3, sections: [
    { key: "dashboard", label: "Dashboard",    icon: BarChart3,     Panel: DashboardPanel,       desc: "Platform-wide numbers at a glance." },
    { key: "activity",  label: "Activity log", icon: ClipboardList, Panel: ActivityLogPanel, desc: "Every admin action, newest first." },
  ]},
  { key: "moderation", label: "Moderation", icon: ShieldCheck, sections: [
    { key: "pulse",    label: "Pulse queue", icon: ShieldCheck, Panel: PulseModerationPanel, desc: "Approve or reject posts waiting for review.", badge: "pending" },
    { key: "shipyard", label: "Shipyard",    icon: Anchor,      Panel: ShipyardPanel,        desc: "Review projects submitted to Shipyard." },
  ]},
  { key: "users", label: "Users", icon: Users, sections: [
    { key: "users",      label: "Users",      icon: Users, Panel: UsersPanel,      desc: "Search, inspect and manage accounts." },
    { key: "notifications", label: "Notifications", icon: Megaphone, Panel: NotificationsPanel, desc: "Send notifications to users." },
  ]},
  { key: "community", label: "Community", icon: Activity, sections: [
    { key: "pulse-feed",    label: "Pulse feed",    icon: Activity,  Panel: PulsePanel,         desc: "Published Pulse posts." },
    { key: "communities",   label: "Communities",   icon: Users,     Panel: CommunitiesPanel,   desc: "Community spaces and their settings." },
    { key: "portfolios", label: "Portfolios", icon: Star,  Panel: PortfoliosPanel, desc: "Featured developer portfolios." },
  ]},
  { key: "challenges", label: "Challenges", icon: Zap, sections: [
    { key: "codelab",       label: "CodeLab problems",  icon: Code2,     Panel: CodingProblemsPanel,   desc: "Problems, test cases and publishing." },
    { key: "missions",      label: "Missions",          icon: Target,    Panel: MissionsPanel,         desc: "Bounty-style missions with rewards." },
    { key: "grind",         label: "Daily Grind",       icon: Zap,       Panel: GrindPanel,            desc: "The daily coding challenge rotation." },
    { key: "arena",         label: "Arena challenges",  icon: Swords,    Panel: ArenaPanel,            desc: "Head-to-head Arena problems." },
    { key: "arena-matches", label: "Arena matches",     icon: Crosshair, Panel: ArenaMatchesPanel,     desc: "Live and completed Arena matches." },
    { key: "build",         label: "Build challenges",  icon: Hammer,    Panel: BuildChallengesPanel,  desc: "Project-based build challenges." },
  ]},
  { key: "events", label: "Events", icon: Trophy, sections: [
    { key: "contests",      label: "Contests",          icon: Trophy,    Panel: ContestsPanel,         desc: "Timed coding contests." },
    { key: "hackathons",    label: "Hackathons",        icon: Trophy,    Panel: HackathonsPanel,       desc: "Hackathon events and registrations." },
    { key: "judging",       label: "Hackathon judging", icon: Gavel,     Panel: HackathonJudgingPanel, desc: "Score and rank hackathon submissions." },
  ]},
  { key: "learning", label: "Learning", icon: GraduationCap, sections: [
    { key: "learning-paths",  label: "Learning paths",        icon: GraduationCap, Panel: LearningPanel,             desc: "Courses, modules and tasks. Tasks unlock in order for learners." },
    { key: "se-fundamentals", label: "SE Fundamentals",       icon: Network,       Panel: SeModulesPanel,            desc: "The Software Engineering Fundamentals course." },
    { key: "programming",     label: "Programming languages", icon: CodeXml,       Panel: ProgrammingLanguagesPanel, desc: "Language roadmaps and lessons." },
    { key: "cs-core",         label: "CS Core subjects",      icon: BrainCircuit,  Panel: CsCoreSubjectsPanel,       desc: "Core computer science subjects." },
    { key: "aptitude",        label: "Aptitude questions",    icon: ListChecks,    Panel: AptitudePanel,             desc: "Aptitude & reasoning question bank." },
    { key: "aptitude-topics", label: "Aptitude lessons",      icon: GraduationCap, Panel: AptitudeTopicsPanel,       desc: "Per-topic aptitude lesson content." },
    { key: "company-prep",    label: "Company prep",          icon: Briefcase,     Panel: CompanyPrepPanel,          desc: "Company-specific interview prep." },
  ]},
  { key: "gate", label: "GATE", icon: Layers, sections: [
    { key: "gate-papers",    label: "Papers & syllabus",       icon: GraduationCap, Panel: GatePapersPanel,       desc: "Seed GATE papers from the official syllabus." },
    { key: "gate-subjects",  label: "Subjects & lessons",      icon: Layers,        Panel: GateSubjectsPanel,     desc: "Subject, topic and lesson content." },
    { key: "gate-import",    label: "Bulk lesson import",      icon: Upload,        Panel: GateLessonImportPanel, desc: "Import many lessons at once." },
    { key: "gate-pyqs",      label: "Previous year questions", icon: ListChecks,    Panel: GatePyqPanel,          desc: "Review PYQ drafts before publishing." },
    { key: "gate-tests",     label: "Tests & mocks",           icon: ClipboardList, Panel: GateTestsPanel,        desc: "Topic tests and full mocks." },
    { key: "gate-formulas",  label: "Formula book",            icon: BookOpen,      Panel: GateFormulaPanel,      desc: "The GATE formula reference." },
    { key: "gate-resources", label: "Resources & notices",     icon: Megaphone,     Panel: GateResourcesPanel,    desc: "GATE resources and announcements." },
  ]},
  { key: "campus", label: "Campus", icon: Building2, sections: [
    { key: "institutions",  label: "Institutions",  icon: Building2, Panel: InstitutionsPanel, desc: "Campus institutions and their admins." },
    { key: "demo-requests", label: "Demo requests", icon: Inbox,     Panel: DemoRequestsPanel, desc: "Colleges asking for a Campus demo." },
    { key: "ambassadors",   label: "Ambassadors",   icon: Building2, Panel: AmbassadorPanel,   desc: "Campus ambassador applications." },
  ]},
  { key: "careers", label: "Careers", icon: Briefcase, sections: [
    { key: "careers",       label: "Job openings",  icon: Briefcase, Panel: CareersPanel,       desc: "Roles listed on careers.devert.in." },
    { key: "job-applications", label: "Job applications", icon: Inbox, Panel: JobApplicationsPanel, desc: "Candidates who applied on careers.devert.in." },
  ]},
  { key: "media", label: "News & media", icon: Radio, sections: [
    { key: "intel",         label: "Intel feed",    icon: Radio,     Panel: IntelPanel,         desc: "Tech news on the Intel page." },
    { key: "opportunities", label: "Opportunities", icon: Briefcase, Panel: OpportunitiesPanel, desc: "Internships, jobs and programs." },
    { key: "resources",     label: "Resources",     icon: BookOpen,  Panel: ResourcesPanel,     desc: "Curated learning resources." },
    { key: "broadcast",     label: "Broadcast",     icon: Tv2,       Panel: BroadcastPanel,     desc: "Broadcast page content." },
  ]},
  { key: "economy", label: "Economy", icon: Coins, sections: [
    { key: "wallet",  label: "Wallet economy", icon: Coins,  Panel: EconomyPanel,      desc: "Coin reward amounts and conversion." },
    { key: "rewards", label: "Reward policy",  icon: Trophy, Panel: RewardPolicyPanel, desc: "Rules for when rewards are granted." },
    { key: "ranks",   label: "Rank ladder",    icon: Medal,  Panel: RanksPanel,        desc: "Tiers and the XP needed for each." },
    { key: "payouts",  label: "Payout requests",     icon: Wallet,    Panel: PayoutsPanel,         desc: "Review and process wallet payouts." },
  ]},
  { key: "platform", label: "Platform", icon: Server, sections: [
    { key: "features", label: "Feature switches",    icon: Power,     Panel: FeatureSwitchesPanel, desc: "Turn any DeVert feature on or off for every user." },
    { key: "services", label: "APIs & services",     icon: Server,    Panel: ApiServicesPanel,     desc: "Live health of every service DeVert runs on, plus the Cloud Functions and backend inventory." },
    { key: "database", label: "Database",            icon: Database,  Panel: DatabasePanel,        desc: "Every Firestore collection with live document counts. Browse read-only." },
    { key: "logs",     label: "System logs",         icon: GitCommit, Panel: LogsPanel,            desc: "Changelog and system events." },
    { key: "roles",    label: "Roles & permissions", icon: Shield,    Panel: RolesPanel,           desc: "Campus roles and the permission catalog.", superOnly: true },
  ]},
];

// One accent for "you are here" instead of a colour per tab.
const ACCENT = "#00FF41";
const BADGE_STYLE = { background: "#FF9500", color: "#05080F" };

function visibleNav(isSuperAdmin) {
  return ADMIN_NAV
    .map(g => ({ ...g, sections: g.sections.filter(s => !s.superOnly || isSuperAdmin) }))
    .filter(g => g.sections.length > 0);
}

// Old links were /admin?tab=<group> only - resolve those to the group's first
// section so bookmarks keep working. Unknown values land on Overview.
function resolveLocation(nav, tab, section) {
  const owner = section && nav.find(g => g.sections.some(s => s.key === section));
  if (owner) return { tab: owner.key, section };
  const group = nav.find(g => g.key === tab) || nav[0];
  return { tab: group.key, section: group.sections[0].key };
}

function AdminCommandPalette({ nav, onClose, onNavigate }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const all = nav.flatMap(g => g.sections.map(s => ({ ...s, group: g })));
  const needle = q.trim().toLowerCase();
  const results = needle
    ? all.filter(s => `${s.label} ${s.group.label} ${s.sub || ""} ${s.desc}`.toLowerCase().includes(needle))
    : all;
  const active = Math.min(cursor, Math.max(results.length - 1, 0));

  const go = (s) => { onNavigate(s.group.key, s.key); onClose(); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(Math.min(active + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(Math.max(active - 1, 0)); }
    else if (e.key === "Enter" && results[active]) go(results[active]);
    else if (e.key === "Escape") onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg rounded-xl overflow-hidden border border-white/10"
        style={{ background: "#0b0f17", boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-white/8">
          <Search size={15} className="text-white/35" />
          <input autoFocus value={q} onChange={e => { setQ(e.target.value); setCursor(0); }} onKeyDown={onKey}
            placeholder="Search admin sections..."
            className="flex-1 font-sans text-sm text-white/90 py-3.5 outline-none bg-transparent placeholder:text-white/30"
          />
          <kbd className="font-mono text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="p-1.5 max-h-80 overflow-y-auto">
          {results.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={`${s.group.key}/${s.key}`} onClick={() => go(s)} onMouseEnter={() => setCursor(i)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                style={{ background: i === active ? "rgba(255,255,255,0.06)" : "transparent" }}
              >
                <Icon size={14} className="text-white/45 flex-shrink-0" />
                <span className="font-sans text-sm text-white/85 truncate">{s.label}</span>
                <span className="ml-auto font-sans text-xs text-white/30 flex-shrink-0">{s.group.label}{s.sub ? ` / ${s.sub}` : ""}</span>
              </button>
            );
          })}
          {results.length === 0 && <p className="font-sans text-sm text-white/30 text-center py-6">No matching sections</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminSidebar({ nav, loc, openGroups, toggleGroup, onNavigate, pendingCount }) {
  return (
    <nav className="flex flex-col h-full">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/8 flex-shrink-0">
        <img src="/Logo.png" alt="" className="w-6 h-6 object-contain" />
        <span className="font-sans text-sm font-semibold text-white">DeVert</span>
        <span className="font-sans text-[11px] text-white/45 border border-white/10 rounded px-1.5 py-px">Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-0.5">
        {nav.map(g => {
          const GIcon = g.icon;
          const isOpen = openGroups.has(g.key);
          const isActiveGroup = loc.tab === g.key;
          const groupBadge = g.sections.some(s => s.badge === "pending") ? pendingCount : 0;
          let lastSub = null;
          return (
            <div key={g.key}>
              <button onClick={() => toggleGroup(g.key)} aria-expanded={isOpen}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-sans text-[13px] transition-colors hover:bg-white/5"
                style={{ color: isActiveGroup ? "#fff" : "rgba(255,255,255,0.62)" }}
              >
                <GIcon size={15} style={{ color: isActiveGroup ? ACCENT : "rgba(255,255,255,0.4)" }} />
                <span className="font-medium">{g.label}</span>
                <span className="ml-auto flex items-center gap-2">
                  {groupBadge > 0 && !isOpen && (
                    <span className="font-mono text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center" style={BADGE_STYLE}>{groupBadge}</span>
                  )}
                  <ChevronDown size={13} className={`text-white/30 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                </span>
              </button>
              {isOpen && (
                <div className="ml-[18px] pl-3 border-l border-white/8 mt-0.5 mb-1.5 space-y-px">
                  {g.sections.map(s => {
                    const isActive = isActiveGroup && loc.section === s.key;
                    const showSub = s.sub && s.sub !== lastSub;
                    if (s.sub) lastSub = s.sub;
                    return (
                      <div key={s.key}>
                        {showSub && (
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-white/30 px-2.5 pt-2.5 pb-1">{s.sub}</p>
                        )}
                        <button onClick={() => onNavigate(g.key, s.key)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md font-sans text-[13px] text-left transition-colors ${isActive ? "" : "hover:bg-white/[0.04] hover:text-white/80"}`}
                          style={{
                            color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                            background: isActive ? "rgba(0,255,65,0.09)" : undefined,
                            boxShadow: isActive ? `inset 2px 0 0 ${ACCENT}` : "none",
                          }}
                        >
                          <span className="truncate">{s.label}</span>
                          {s.badge === "pending" && pendingCount > 0 && (
                            <span className="ml-auto font-mono text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center" style={BADGE_STYLE}>{pendingCount}</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function AdminPageInner() {
  const { user, loading, isAdmin, isSuperAdmin, adminChecked, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nav = visibleNav(isSuperAdmin);
  const [loc, setLoc] = useState(() => resolveLocation(ADMIN_NAV, searchParams.get("tab"), searchParams.get("section")));
  const [openGroups, setOpenGroups] = useState(() => new Set([loc.tab]));
  const [pendingCount, setPendingCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (tab, section) => {
    setLoc({ tab, section });
    setOpenGroups(prev => prev.has(tab) ? prev : new Set(prev).add(tab));
    setDrawerOpen(false);
    // pushState (not replaceState) so browser back/forward moves between
    // sections. Bypasses Next's router for the same reason campus-app.jsx's
    // tab sync does: this URL change is bookkeeping, not a navigation.
    window.history.pushState(null, "", `/admin?tab=${tab}&section=${section}`);
    document.getElementById("admin-main")?.scrollTo({ top: 0 });
  };
  const toggleGroup = (key) => setOpenGroups(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // Normalise the address bar once (a ?tab=-only link gains its section),
  // then follow back/forward.
  useEffect(() => {
    window.history.replaceState(null, "", `/admin?tab=${loc.tab}&section=${loc.section}`);
    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      const next = resolveLocation(ADMIN_NAV, p.get("tab"), p.get("section"));
      setLoc(next);
      setOpenGroups(prev => new Set(prev).add(next.tab));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live pending-moderation count - the number admins care about above
  // everything else - shown in the sidebar and as a top-bar pill.
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      query(collection(db, "pulse_posts"), where("status", "==", "pending")),
      snap => setPendingCount(snap.size),
      () => {},
    );
    return unsub;
  }, [isAdmin]);

  // Cmd/Ctrl+K opens section search without touching the mouse.
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

  // Unauthorized visitors (logged out or logged in but not an admin) never
  // see any part of this UI - not an "access denied" screen, not a
  // /login?next=/admin URL revealing the route exists. Straight to /pulse,
  // silently, exactly like the route was never there.
  useEffect(() => {
    if (loading || !adminChecked) return;
    if (!user || !isAdmin) router.replace("/pulse");
  }, [user, loading, isAdmin, adminChecked]);

  if (loading || !adminChecked || !user || !isAdmin) {
    return <main className="min-h-screen bg-background" />;
  }

  // Re-resolved against the visible nav, so a superOnly section in the URL
  // falls back to its group's first section for a plain admin.
  const safe = resolveLocation(nav, loc.tab, loc.section);
  const group = nav.find(g => g.key === safe.tab);
  const section = group.sections.find(s => s.key === safe.section);
  const { Panel } = section;
  const SectionIcon = section.icon;

  const sidebar = (
    <AdminSidebar nav={nav} loc={safe} openGroups={openGroups} toggleGroup={toggleGroup}
      onNavigate={navigate} pendingCount={pendingCount} />
  );

  return (
    <div className="fixed inset-0 flex" style={{ background: "rgba(5,7,12,0.6)" }}>
      {/* Sidebar - a fixed column on desktop, a drawer below lg */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-white/8" style={{ background: "rgba(8,11,18,0.94)" }}>
        {sidebar}
      </aside>
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[70] bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.aside key="drawer" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: 0.18 }}
              className="lg:hidden fixed inset-y-0 left-0 z-[80] w-72 border-r border-white/8" style={{ background: "#0a0e16" }}>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 border-b border-white/8" style={{ background: "rgba(8,11,18,0.9)" }}>
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu"
            className="lg:hidden p-1.5 -ml-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-1.5 font-sans text-sm min-w-0">
            <span className="text-white/40 hidden sm:inline">{group.label}</span>
            {section.sub && (
              <>
                <ChevronRight size={13} className="text-white/20 hidden md:inline" />
                <span className="text-white/40 hidden md:inline">{section.sub}</span>
              </>
            )}
            <ChevronRight size={13} className="text-white/20 hidden sm:inline" />
            <span className="text-white font-medium truncate">{section.label}</span>
          </div>

          <button onClick={() => setPaletteOpen(true)} aria-label="Search sections"
            className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors md:w-64"
          >
            <Search size={14} />
            <span className="font-sans text-[13px] hidden md:inline">Search sections</span>
            <kbd className="ml-auto font-mono text-[10px] border border-white/10 rounded px-1.5 py-px hidden md:inline">Ctrl K</kbd>
          </button>

          {pendingCount > 0 && (
            <button onClick={() => navigate("moderation", "pulse")}
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-sans text-xs transition-colors hover:brightness-125"
              style={{ background: "rgba(255,149,0,0.1)", border: "1px solid rgba(255,149,0,0.3)", color: "#FF9500" }}
            >
              <Bell size={13} /> {pendingCount} pending
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/8">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-sans text-xs font-semibold" style={{ background: "rgba(0,255,65,0.12)", color: ACCENT }}>
              {(user.email || "?")[0].toUpperCase()}
            </div>
            <span className="font-sans text-xs text-white/50 max-w-[180px] truncate">{user.email}</span>
          </div>
          <button onClick={async () => { await logout(); router.push("/"); }} title="Log out" aria-label="Log out"
            className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors">
            <LogOut size={16} />
          </button>
        </header>

        {/* Content - one section at a time, no accordions */}
        <main id="admin-main" className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                <SectionIcon size={17} style={{ color: ACCENT }} />
              </div>
              <div className="min-w-0">
                <h1 className="font-sans text-xl font-semibold text-white leading-tight">{section.label}</h1>
                <p className="font-sans text-sm text-white/45 mt-0.5">{section.desc}</p>
              </div>
            </div>

            {/* No wrapper card: every section is built from the admin kit, which
                brings its own cards (StatGrid, DataTable, SettingsCard...). */}
            <motion.div key={`${safe.tab}/${safe.section}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <Panel />
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <AdminCommandPalette nav={nav} onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
        )}
      </AnimatePresence>
    </div>
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
