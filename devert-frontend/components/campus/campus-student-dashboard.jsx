"use client";

import { useEffect, useState } from "react";
import {
  Mail, Calendar, Clock, Pencil, KeyRound, Megaphone, Ban, UserX, UserCheck, UserMinus,
  ExternalLink, CodeXml, BrainCircuit, ListChecks, Building2, GraduationCap, User,
  Trophy, Zap, Coins, ChevronDown, Check, X as XIcon, CircleDashed, Loader2,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { useAuth } from "@/context/AuthContext";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar,
} from "@/components/campus/campus-ui";
import { fetchStudentAnalytics } from "@/lib/studentAnalytics";
// The activityType -> friendly-label map lives in lib/campusDashboard.js so
// this admin-facing timeline and the student's own Recent Activity feed render
// the same ledger with the same vocabulary instead of two drifting copies.
import { activityLabel } from "@/lib/campusDashboard";
import { fetchRewardDetail } from "@/lib/rewardDetail";
import {
  updateStudentIdentity, suspendStudent, approveStudent, setContestRestriction,
  removeStudentFromInstitution, sendStudentPasswordReset, sendAnnouncement,
} from "@/lib/institutions";

function initials(name) {
  return (name || "?").trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(ts) {
  if (!ts?.toDate) return "-";
  return ts.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(ts) {
  if (!ts?.toDate) return "Never";
  return ts.toDate().toLocaleString();
}

// Full-page replacement for the Students roster (same "screen router within
// a Manage tab" pattern as ManagePracticePreview/CampusContestsTab elsewhere
// in campus-manage.jsx), not a real Next.js route - a per-student static
// export route isn't possible with output:'export', and this is an
// admin-internal view with no SEO surface anyway.
export function StudentAnalyticsDashboard({ institutionId, institution, student, onBack, onChanged }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(undefined);

  const reload = () => {
    setAnalytics(undefined);
    fetchStudentAnalytics(student.uid).then(setAnalytics).catch(e => { console.error(e); setAnalytics(null); });
  };
  useEffect(reload, [student.uid]);

  if (analytics === undefined) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to Students" />
        <CampusCard className="p-5"><CampusSkeleton variant="rect" height={140} /></CampusCard>
      </div>
    );
  }
  if (analytics === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to Students" />
        <CampusEmptyState icon={User} title="Couldn't load this student's analytics"
          description="Something went wrong fetching their progress. Try again." />
      </div>
    );
  }

  const profile = analytics.profile || {};

  return (
    <div className="space-y-5">
      <CampusBackButton onClick={onBack} label="Back to Students" />
      <OverviewCard student={student} institution={institution} profile={profile} />
      <QuickActions institutionId={institutionId} student={student} profile={profile} adminUid={user?.uid}
        onChanged={() => { onChanged?.(); reload(); }} />
      <RewardsSection rewards={analytics.rewards} timeline={analytics.rewardTimeline} />
      <ProgrammingSection data={analytics.programming} />
      <CsCoreSection data={analytics.csCore} />
      <DsaSection data={analytics.dsa} />
      <CompanyVaultSection data={analytics.companyVault} />
    </div>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0" style={{ color: CAMPUS.inkSoft }}>
      <Icon size={12} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
      <span className="truncate text-[12.5px]">{label}</span>
    </div>
  );
}

function OverviewCard({ student, institution, profile }) {
  return (
    <CampusCard className="p-5">
      <div className="flex items-start gap-4 flex-wrap">
        {profile.photoURL ? (
          <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            {initials(student.name)}
          </div>
        )}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>{student.name || "(no name)"}</h2>
            {student.status === "suspended" ? (
              <CampusChip color={CAMPUS.bad}>SUSPENDED</CampusChip>
            ) : (
              <CampusChip color={CAMPUS.good}>ACTIVE</CampusChip>
            )}
            {student.contestRestricted && <CampusChip color={CAMPUS.warn}>CONTEST RESTRICTED</CampusChip>}
          </div>
          <p className="text-[12.5px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>{student.rollNumber || "-"}</p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            <InfoRow icon={Mail} label={student.email || "(no email on file)"} />
            <InfoRow icon={GraduationCap}
              label={[student.department, student.year && `Year ${student.year}`, student.section && `Sec ${student.section}`].filter(Boolean).join(" · ") || "-"} />
            <InfoRow icon={Building2} label={institution?.name || "-"} />
            <InfoRow icon={Clock} label={`Last active: ${formatDateTime(profile.lastActiveAt)}`} />
            <InfoRow icon={Calendar} label={`Joined DeVert: ${formatDate(profile.joinedAt)}`} />
          </div>
        </div>
      </div>
    </CampusCard>
  );
}

function EditIdentityForm({ form, setForm, onCancel, onSave, busy }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const fieldStyle = { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink };
  return (
    <div className="space-y-2.5">
      <input value={form.name} onChange={set("name")} placeholder="Full name"
        className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={fieldStyle} />
      <input value={form.rollNumber} onChange={set("rollNumber")} placeholder="Roll number"
        className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none font-mono" style={fieldStyle} />
      <div className="flex gap-2">
        <input value={form.department} onChange={set("department")} placeholder="Department"
          className="flex-1 text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={fieldStyle} />
        <input value={form.year} onChange={set("year")} placeholder="Year"
          className="w-24 text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={fieldStyle} />
        <input value={form.section} onChange={set("section")} placeholder="Section"
          className="w-24 text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={fieldStyle} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          {busy ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
      </div>
    </div>
  );
}

function ConfirmBar({ message, onConfirm, onCancel, busy, danger = false }) {
  return (
    <div className="mt-3 p-3 rounded-lg space-y-2" style={{ background: danger ? CAMPUS.badTint : CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      <p className="text-[12px]" style={{ color: danger ? CAMPUS.bad : CAMPUS.inkSoft }}>{message}</p>
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={busy} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ background: danger ? CAMPUS.bad : CAMPUS.ink, color: "#fff" }}>
          {busy ? "Working..." : "Confirm"}
        </button>
        <button onClick={onCancel} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
      </div>
    </div>
  );
}

function AnnounceForm({ institutionId, uid, adminUid, onCancel, onSent }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    setSending(true); setError("");
    try {
      await sendAnnouncement(institutionId, { title: title.trim(), message: message.trim(), targetUids: [uid] }, adminUid);
      onSent();
    } catch (e) {
      setError(e.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const fieldStyle = { background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink };
  return (
    <div className="mt-3 p-3 rounded-lg space-y-2" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      {error && <p className="text-[11.5px]" style={{ color: CAMPUS.bad }}>{error}</p>}
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none" style={fieldStyle} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" rows={3}
        className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none resize-none" style={fieldStyle} />
      <div className="flex gap-2">
        <button onClick={send} disabled={sending || !title.trim() || !message.trim()}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          {sending ? "Sending..." : "Send"}
        </button>
        <button onClick={onCancel} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
      </div>
    </div>
  );
}

function ActionLink({ href, icon: Icon, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-1.5 font-semibold transition-colors rounded-lg px-3 py-1.5 text-[12px]"
      style={{ background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
      <Icon size={12} /> {children}
    </a>
  );
}

// Reset Password / Send Announcement / Suspend / Restrict-from-contests /
// Remove-from-institution are all real, already-existing capabilities (see
// lib/institutions.js) - View Profile links to the student's actual public
// Dev Card. Deliberately no "Send Message" or "Delete Student" button: there
// is no in-app messaging system to send through, and account deletion is a
// separate, far more destructive action than anything else here.
function QuickActions({ institutionId, student, profile, adminUid, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const run = async (fn, successMsg) => {
    setBusy(true); setError("");
    try {
      await fn();
      setNotice(successMsg);
      setTimeout(() => setNotice(""), 4000);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Action failed.");
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const startEdit = () => {
    setEditForm({
      name: student.name || "", rollNumber: student.rollNumber || "",
      department: student.department || "", year: student.year || "", section: student.section || "",
    });
    setEditing(true);
  };

  const saveEdit = () => run(async () => {
    await updateStudentIdentity(institutionId, student.uid, editForm, adminUid);
    setEditing(false);
  }, "Identity updated.");

  return (
    <CampusCard className="p-4">
      <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>QUICK ACTIONS</p>

      {error && <p className="text-[12.5px] mb-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>}
      {notice && <p className="text-[12.5px] mb-3 px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>{notice}</p>}

      {editing ? (
        <EditIdentityForm form={editForm} setForm={setEditForm} busy={busy} onCancel={() => setEditing(false)} onSave={saveEdit} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.handle && <ActionLink href={`/u/${profile.handle}`} icon={ExternalLink}>View Profile</ActionLink>}
          {student.email && <ActionLink href={`mailto:${student.email}`} icon={Mail}>Email</ActionLink>}
          <CampusButton variant="secondary" size="sm" icon={Pencil} onClick={startEdit}>Edit Student</CampusButton>
          <CampusButton variant="secondary" size="sm" icon={KeyRound} disabled={busy || !student.email}
            onClick={() => setConfirmAction("resetPassword")}>
            Reset Password
          </CampusButton>
          <CampusButton variant="secondary" size="sm" icon={Megaphone} onClick={() => setConfirmAction("announce")}>
            Send Announcement
          </CampusButton>
          <CampusButton variant={student.status === "suspended" ? "secondary" : "danger"} size="sm"
            icon={student.status === "suspended" ? UserCheck : UserX}
            onClick={() => student.status === "suspended"
              ? run(() => approveStudent(institutionId, student.uid, { department: student.department, year: student.year, section: student.section }), "Reactivated.")
              : setConfirmAction("suspend")}>
            {student.status === "suspended" ? "Reactivate" : "Suspend"}
          </CampusButton>
          <CampusButton variant="secondary" size="sm" icon={Ban}
            onClick={() => student.contestRestricted
              ? run(() => setContestRestriction(institutionId, student.uid, false), "Contest restriction lifted.")
              : setConfirmAction("restrict")}>
            {student.contestRestricted ? "Lift Contest Restriction" : "Restrict from Contests"}
          </CampusButton>
          <CampusButton variant="danger" size="sm" icon={UserMinus} onClick={() => setConfirmAction("remove")}>
            Remove from Institution
          </CampusButton>
        </div>
      )}

      {confirmAction === "resetPassword" && (
        <ConfirmBar busy={busy} message={`Send a password reset email to ${student.email}?`}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => run(() => sendStudentPasswordReset(student.email), "Password reset email sent.")} />
      )}
      {confirmAction === "suspend" && (
        <ConfirmBar busy={busy} danger message="Suspend this student? They lose access until reactivated."
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => run(() => suspendStudent(institutionId, student.uid), "Student suspended.")} />
      )}
      {confirmAction === "restrict" && (
        <ConfirmBar busy={busy} message="Restrict this student from contests? Daily Learning/DSA/Company Vault access is unaffected."
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => run(() => setContestRestriction(institutionId, student.uid, true), "Restricted from contests.")} />
      )}
      {confirmAction === "remove" && (
        <ConfirmBar busy={busy} danger
          message="Permanently remove this student from the institution? Their roll number becomes claimable again and they must submit a brand new request to rejoin. Their DeVert account, XP and coins are untouched."
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => run(() => removeStudentFromInstitution(institutionId, student.uid), "Removed from institution.")} />
      )}
      {confirmAction === "announce" && (
        <AnnounceForm institutionId={institutionId} uid={student.uid} adminUid={adminUid}
          onCancel={() => setConfirmAction(null)}
          onSent={() => { setConfirmAction(null); setNotice("Announcement sent."); setTimeout(() => setNotice(""), 4000); }} />
      )}
    </CampusCard>
  );
}

// Seconds matter here: minute-only precision is what made a real, distinct
// pair of completions in different modules 571ms apart read as one action
// that had somehow paid twice (verified against the live ledger - two rows a
// minute apart with no seconds shown are indistinguishable from duplicates,
// even though the ledger's create-only rule and completeTopic's transaction
// make an actual double-grant structurally impossible). Showing seconds lets
// an admin see "0.6s apart, different modules" and read it correctly as two
// separate submissions rather than one bug.
function formatGrantedAt(ts) {
  if (!ts?.toDate) return "-";
  return ts.toDate().toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
}

function QuizStat({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} style={{ color }} />
      <span className="text-[12px] font-mono font-semibold" style={{ color: CAMPUS.ink }}>{value}</span>
      <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{label}</span>
    </div>
  );
}

// One expanded reward. The ledger row alone answers "how much" but not "for
// what" or "how well" - both of those live elsewhere and are fetched here, ONLY
// when a row is actually opened. Loading them for every row up front would turn
// one screen into a hundred reads for a timeline most of which is never expanded.
function RewardDetail({ grant }) {
  const [state, setState] = useState({ loading: true, data: null, error: false });

  useEffect(() => {
    let cancelled = false;
    fetchRewardDetail(grant)
      .then(data => { if (!cancelled) setState({ loading: false, data, error: false }); })
      .catch(() => { if (!cancelled) setState({ loading: false, data: null, error: true }); });
    return () => { cancelled = true; };
  }, [grant]);

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 text-[12px]" style={{ color: CAMPUS.inkFaint }}>
        <Loader2 size={13} className="animate-spin" /> Loading details…
      </div>
    );
  }
  if (state.error || !state.data) {
    return <p className="px-3 py-3 text-[12px]" style={{ color: CAMPUS.inkFaint }}>Couldn&apos;t load the details for this reward.</p>;
  }

  const d = state.data;
  const latest = d.history[0] || null;

  return (
    <div className="px-3 pb-3 pt-1 space-y-3">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
        <Detail label="Activity" value={d.kind} />
        <Detail label="Topic" value={d.name || d.rawId || "-"} />
        {d.context && <Detail label="Under" value={d.context} />}
        <Detail label="Ledger id" value={d.rawId || "-"} mono />
        <Detail label="XP" value={`${grant.xp > 0 ? "+" : ""}${grant.xp || 0}`} />
        <Detail label="Coins" value={`${grant.coins > 0 ? "+" : ""}${grant.coins || 0}`} />
        {grant.score != null && <Detail label="Score banked" value={grant.score} />}
        <Detail label="Granted" value={formatGrantedAt(grant.grantedAt)} />
        <Detail label="Granted by" value={grant.grantedBy === "system" ? "System (automatic)" : `Admin ${grant.grantedBy}`} />
        <Detail label="Status" value={grant.status === "reversed" ? "REVERSED" : "Granted"} />
      </div>

      {d.quizless ? (
        <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
          This activity has no quiz attached, so there are no answers to show.
        </p>
      ) : !latest ? (
        <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
          No quiz attempt recorded. Rewards granted before quiz attempts were tracked server-side have no
          answer history - the reward itself is still authoritative.
        </p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap px-3 py-2.5" style={{ background: CAMPUS.paper }}>
            <div className="flex items-center gap-4 flex-wrap">
              <QuizStat icon={Check} value={latest.correct} label="correct" color={CAMPUS.good} />
              <QuizStat icon={XIcon} value={latest.wrong} label="wrong" color={CAMPUS.bad} />
              {!!latest.unanswered && <QuizStat icon={CircleDashed} value={latest.unanswered} label="skipped" color={CAMPUS.inkFaint} />}
              <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.inkSoft }}>
                {latest.correct}/{latest.total} · {Math.round((latest.pct || 0) * 100)}%
              </span>
            </div>
            <CampusChip color={latest.passed ? CAMPUS.good : CAMPUS.bad}>
              {latest.passed ? "PASSED" : "FAILED"}
            </CampusChip>
          </div>

          {/* Earlier attempts, newest first. Shown whenever there is more than
              one, because "passed on the fourth try" is a materially different
              fact from "passed first time" and the summary above hides it. */}
          {d.history.length > 1 && (
            <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[10px] font-mono tracking-widest px-3 pt-2.5 pb-1" style={{ color: CAMPUS.inkFaint }}>
                ALL {d.history.length} ATTEMPTS
              </p>
              {d.history.map(h => (
                <div key={h.attemptNo} className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11.5px] font-mono"
                  style={{ color: CAMPUS.inkSoft }}>
                  <span>#{h.attemptNo}</span>
                  <span style={{ color: CAMPUS.good }}>{h.correct} right</span>
                  <span style={{ color: CAMPUS.bad }}>{h.wrong} wrong</span>
                  <span>{Math.round((h.pct || 0) * 100)}%</span>
                  <span style={{ color: h.passed ? CAMPUS.good : CAMPUS.inkFaint }}>{h.passed ? "passed" : "failed"}</span>
                  <span style={{ color: h.xpNet < 0 ? CAMPUS.bad : CAMPUS.inkFaint }}>
                    {h.xpNet > 0 ? "+" : ""}{h.xpNet} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[10.5px] font-mono uppercase tracking-wide flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{label}</span>
      <span className={`truncate ${mono ? "font-mono text-[11.5px]" : "text-[12px]"}`} style={{ color: CAMPUS.ink }}>{value}</span>
    </div>
  );
}

// Collapsed by default; the detail underneath is fetched lazily on first open
// and then kept mounted, so re-opening a row costs nothing.
function RewardRow({ grant }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left">
        <div className="min-w-0 flex items-center gap-2">
          <ChevronDown size={13} style={{ color: CAMPUS.inkFaint, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>
              {activityLabel(grant.activityType)}
            </p>
            <p className="text-[10.5px] font-mono truncate" style={{ color: CAMPUS.inkFaint }}>
              {formatGrantedAt(grant.grantedAt)}
              {grant.grantedBy && grant.grantedBy !== "system" && ` · granted by admin ${grant.grantedBy}`}
              {grant.status === "reversed" && " · REVERSED"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {!!grant.xp && (
            <span className="flex items-center gap-1 text-[11.5px] font-mono font-semibold" style={{ color: grant.xp < 0 ? CAMPUS.bad : CAMPUS.teal }}>
              <Zap size={11} /> {grant.xp > 0 ? "+" : ""}{grant.xp}
            </span>
          )}
          {!!grant.coins && (
            <span className="flex items-center gap-1 text-[11.5px] font-mono font-semibold" style={{ color: grant.coins < 0 ? CAMPUS.bad : CAMPUS.good }}>
              <Coins size={11} /> {grant.coins > 0 ? "+" : ""}{grant.coins}
            </span>
          )}
        </div>
      </button>
      {open && <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}><RewardDetail grant={grant} /></div>}
    </div>
  );
}

// Requirement: an admin opening a student from the leaderboard should
// immediately understand how every reward was earned - this reads directly
// from the central reward_grants ledger (lib/rewards.js), never computed or
// assumed from progress percentages, so it's exactly as trustworthy as the
// ledger itself (including surfacing manual admin XP grants, which have no
// other visible trace anywhere else in the app).
function RewardsSection({ rewards, timeline }) {
  return (
    <CampusCard className="p-5">
      <SectionHeader icon={Trophy} title="Rewards" color={CAMPUS.gold} />
      <StatRow stats={[
        { label: "CURRENT XP", value: rewards.xp, color: CAMPUS.teal },
        { label: "CURRENT COINS", value: rewards.coins, color: CAMPUS.good },
        { label: "CURRENT STREAK", value: rewards.streak, color: CAMPUS.warn },
        { label: "ACTIVITIES COMPLETED", value: rewards.totalActivitiesCompleted },
      ]} />
      <p className="text-[10px] font-mono tracking-widest mb-2 mt-1" style={{ color: CAMPUS.inkFaint }}>REWARD TIMELINE</p>
      {timeline.length === 0 ? (
        <CampusEmptyState size="sm" icon={Trophy} title="No rewards granted yet" description="Nothing in the reward ledger for this student yet." />
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {timeline.map(t => <RewardRow key={t.id} grant={t} />)}
        </div>
      )}
    </CampusCard>
  );
}

function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tint(color, 14), color }}>
        <Icon size={14} />
      </div>
      <h3 className="text-[14.5px] font-semibold" style={{ color: CAMPUS.ink }}>{title}</h3>
    </div>
  );
}

function StatRow({ stats }) {
  return (
    <div className="grid sm:grid-cols-4 gap-3 mb-4">
      {stats.map(s => (
        <div key={s.label} className="text-center px-2">
          <p className={typeof s.value === "number" ? "text-lg font-bold font-mono" : "text-[13px] font-bold truncate"}
            style={{ color: s.color || CAMPUS.ink }}>
            {s.value}
          </p>
          <p className="text-[9.5px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function BreakdownBar({ label, sub, pct, color = CAMPUS.teal }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11.5px] w-28 flex-shrink-0 truncate" style={{ color: CAMPUS.inkSoft }}>{label}</span>
      <div className="flex-1"><CampusProgressBar pct={pct} color={color} /></div>
      <span className="text-[10.5px] font-mono w-24 text-right flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{sub}</span>
    </div>
  );
}

function ProgrammingSection({ data }) {
  return (
    <CampusCard className="p-5">
      <SectionHeader icon={CodeXml} title="Programming" color={CAMPUS.teal} />
      {data.languagesEnrolled === 0 ? (
        <CampusEmptyState size="sm" icon={CodeXml} title="Hasn't started Programming yet" description="No language progress recorded for this student." />
      ) : (
        <>
          <StatRow stats={[
            { label: "LANGUAGES ENROLLED", value: data.languagesEnrolled },
            { label: "LANGUAGES COMPLETED", value: data.languagesCompleted, color: CAMPUS.good },
            { label: "CURRENT LANGUAGE", value: data.currentLanguage || "-", color: CAMPUS.teal },
            { label: "TOPICS COMPLETED", value: data.totalTopicsCompleted },
          ]} />
          <div className="space-y-2.5">
            {data.languageBreakdown.map(l => (
              <BreakdownBar key={l.id} label={l.name} sub={`${l.completed}/${l.total} · ${l.pct}%`} pct={l.pct} color={CAMPUS.teal} />
            ))}
          </div>
        </>
      )}
    </CampusCard>
  );
}

function CsCoreSection({ data }) {
  return (
    <CampusCard className="p-5">
      <SectionHeader icon={BrainCircuit} title="CS Core" color={CAMPUS.purple} />
      {data.subjectsStarted === 0 ? (
        <CampusEmptyState size="sm" icon={BrainCircuit} title="Hasn't started CS Core yet" description="No subject progress recorded for this student." />
      ) : (
        <>
          <StatRow stats={[
            { label: "SUBJECTS STARTED", value: data.subjectsStarted },
            { label: "SUBJECTS COMPLETED", value: data.subjectsCompleted, color: CAMPUS.good },
            { label: "STRONGEST SUBJECT", value: data.strongestSubject || "-", color: CAMPUS.good },
            { label: "WEAKEST SUBJECT", value: data.weakestSubject || "-", color: CAMPUS.warn },
          ]} />
          <div className="space-y-2.5">
            {data.subjectBreakdown.map(s => (
              <BreakdownBar key={s.id} label={s.name} sub={`${s.completed}/${s.total} · ${s.pct}%`} pct={s.pct} color={CAMPUS.purple} />
            ))}
          </div>
        </>
      )}
    </CampusCard>
  );
}

function DsaSection({ data }) {
  return (
    <CampusCard className="p-5">
      <SectionHeader icon={ListChecks} title="DSA / CodeLab" color={CAMPUS.blue} />
      {data.problemsSolved === 0 ? (
        <CampusEmptyState size="sm" icon={ListChecks} title="Hasn't solved any problems yet" description="No CodeLab submissions recorded for this student." />
      ) : (
        <>
          <StatRow stats={[
            { label: "PROBLEMS SOLVED", value: data.problemsSolved },
            { label: "TOTAL SUBMISSIONS", value: data.totalSubmissions },
            { label: "ACCEPTANCE RATE", value: data.acceptanceRate != null ? `${data.acceptanceRate}%` : "-", color: CAMPUS.good },
            { label: "EASY / MED / HARD", value: `${data.byDifficulty.Easy}/${data.byDifficulty.Medium}/${data.byDifficulty.Hard}` },
          ]} />
          {data.topicBreakdown.length > 0 && (
            <div className="space-y-2.5">
              {data.topicBreakdown.map(t => (
                <BreakdownBar key={t.category} label={t.category} sub={`${t.solved}/${t.total} · ${t.pct}%`} pct={t.pct} color={CAMPUS.blue} />
              ))}
            </div>
          )}
        </>
      )}
    </CampusCard>
  );
}

function CompanyVaultSection({ data }) {
  return (
    <CampusCard className="p-5">
      <SectionHeader icon={Building2} title="Company Vault" color={CAMPUS.gold} />
      {data.companiesStarted === 0 ? (
        <CampusEmptyState size="sm" icon={Building2} title="Hasn't started Company Vault yet" description="No company prep activity recorded for this student." />
      ) : (
        <>
          <StatRow stats={[
            { label: "COMPANIES STARTED", value: data.companiesStarted },
            { label: "COMPANIES COMPLETED", value: data.companiesCompleted, color: CAMPUS.good },
            { label: "QUESTIONS SOLVED", value: data.totalSolved },
            { label: "QUESTIONS BOOKMARKED", value: data.totalBookmarked },
          ]} />
          <div className="space-y-2.5">
            {data.companyBreakdown.map(c => (
              <BreakdownBar key={c.id} label={c.name} sub={`${c.solved}/${c.total} · ${c.pct}%`} pct={c.pct} color={CAMPUS.gold} />
            ))}
          </div>
        </>
      )}
    </CampusCard>
  );
}
