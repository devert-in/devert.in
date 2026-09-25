"use client";

// Job posting authoring, for the admin console's CONTENT tab.
//
// Lives inside an existing tab rather than becoming its own top-level admin
// surface, per CLAUDE.md's rule about the admin console. Its review counterpart
// - the applications those postings produce - sits in COMMUNITY alongside the
// other inboxes (demo requests, ambassadors), because working an inbox and
// authoring content are different jobs done at different times.
//
// Two things worth knowing before editing a role here:
//
// 1. The doc ID is the slug and Firestore cannot rename a doc in place. Changing
//    the title of a saved role therefore does NOT move its URL - the slug field
//    is locked once created. Renaming a live posting means creating the new one
//    and deleting the old, which is the correct amount of friction for a URL
//    that may already be in someone's inbox.
// 2. The careers SITE is a different app on a different origin - devert-careers/,
//    served at careers.devert.in (devert.in/careers is only a 301 to it). This
//    panel is the authoring surface; nothing it writes renders in THIS app.
//    Publishing makes the role appear on careers.devert.in immediately (that
//    list is a live query against job_openings), but its own
//    careers.devert.in/{slug} page only exists after devert-careers is
//    rebuilt and deployed - output: 'export' builds those at build time. See
//    devert-careers/lib/careers-seo.js.

import { useEffect, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import {
  Briefcase, Check, Copy, Eye, FileText, Inbox, Pencil, Plus, RefreshCw, Trash2, XCircle,
} from "lucide-react";
import { Input, Textarea } from "@/components/admin/admin-ui";
import {
  KIT, fmt, StatGrid, Pill, Toggle, DataTable, Drawer, DrawerSection,
  PrimaryButton, SecondaryButton,
} from "@/components/admin/admin-kit";
import { logAdminActivity } from "@/lib/adminActivityLog";
import {
  APPLICATION_STATUS, EMPLOYMENT_TYPES, JOB_STATUS, LOCATION_TYPES, deleteRole,
  fetchAllRoles, fetchApplications, saveRole, setRoleStatus, slugify,
} from "@/lib/careers";

const STATUS_META = {
  [JOB_STATUS.DRAFT]: { label: "Draft", color: KIT.orange },
  [JOB_STATUS.PUBLISHED]: { label: "Published", color: KIT.green },
  [JOB_STATUS.CLOSED]: { label: "Closed", color: KIT.muted },
};

const EMPTY = {
  title: "", team: "", employmentType: "full-time", locationType: "hybrid",
  location: "", experience: "", blurb: "", description: "",
  responsibilities: "", requirements: "", niceToHave: "", perks: "",
  order: "500", validThrough: "",
};

// fetchApplications() caps at this many docs; the applications stat says so
// when it is hit rather than presenting a truncated count as the total.
const APPLICATION_CAP = 200;

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || "-";

// One item per line, the same shape every other array field in this console uses
// (hackathon whyParticipate, coding-problem hints, ambassador tier perks).
const toLines = (arr) => (arr || []).join("\n");
const fromLines = (text) => (text || "").split("\n").map((s) => s.trim()).filter(Boolean);

const tsMillis = (ts) => (ts?.toMillis ? ts.toMillis() : ts?.seconds ? ts.seconds * 1000 : 0);
const fmtDate = (ts) => {
  const ms = tsMillis(ts);
  return ms ? new Date(ms).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
};

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0a0a0a" }}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Row -> form, shared by edit and duplicate.
function formFromRole(r) {
  return {
    title: r.title || "",
    team: r.team || "",
    employmentType: r.employmentType || "full-time",
    locationType: r.locationType || "hybrid",
    location: r.location || "",
    experience: r.experience || "",
    blurb: r.blurb || "",
    description: r.description || "",
    responsibilities: toLines(r.responsibilities),
    requirements: toLines(r.requirements),
    niceToHave: toLines(r.niceToHave),
    perks: toLines(r.perks),
    order: String(Number.isFinite(r.order) ? r.order : 500),
    // <input type="date"> needs yyyy-mm-dd; a Firestore Timestamp is neither.
    validThrough: r.validThrough?.toDate
      ? r.validThrough.toDate().toISOString().slice(0, 10)
      : (r.validThrough || ""),
  };
}

export function CareersPanel() {
  const [rows, setRows] = useState(null);
  // Application counts per jobId. Loaded alongside the roles but failing on its
  // own - a missing count must never hide the postings themselves.
  const [apps, setApps] = useState(null);
  const [editing, setEditing] = useState(null); // slug being edited, or "" for a new role
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchAllRoles()
      .then((r) => { if (alive) { setRows(r); setError(""); } })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        setError(e?.message || "Could not load job openings.");
      });
    fetchApplications(APPLICATION_CAP)
      .then((a) => { if (alive) setApps(a); })
      .catch(() => { if (alive) setApps([]); });
    return () => { alive = false; };
  }, [nonce]);

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const startNew = () => { setEditing(""); setForm(EMPTY); setError(""); };

  const startEdit = (r) => {
    setEditing(r.id);
    setError("");
    setForm(formFromRole(r));
  };

  // A duplicate is a NEW role (editing = ""), so it gets its own slug from its
  // own title and lands as a draft - the collision check in save() still applies.
  const startDuplicate = (r) => {
    setEditing("");
    setError("");
    setForm({ ...formFromRole(r), title: `${r.title || ""} (copy)` });
  };

  const closeDrawer = () => { setEditing(null); setError(""); };

  const save = async () => {
    if (!form.title.trim()) { setError("A role needs a title."); return; }
    setBusy("save");
    setError("");
    try {
      const slug = editing || slugify(form.title);
      const existing = rows?.find((r) => r.id === slug);
      // Creating a role whose title slugifies onto an existing one would
      // silently merge over that posting, because the slug IS the doc ID. Refuse
      // instead - the fix is a different title, not a surprise overwrite.
      if (!editing && existing) {
        setError(`A role already exists at careers.devert.in/${slug}. Edit it, or pick a different title.`);
        setBusy("");
        return;
      }
      const payload = {
        title: form.title.trim(),
        team: form.team.trim(),
        employmentType: form.employmentType,
        locationType: form.locationType,
        location: form.location.trim(),
        experience: form.experience.trim(),
        blurb: form.blurb.trim().slice(0, 200),
        description: form.description.trim(),
        responsibilities: fromLines(form.responsibilities),
        requirements: fromLines(form.requirements),
        niceToHave: fromLines(form.niceToHave),
        perks: fromLines(form.perks),
        order: Number(form.order) || 500,
        validThrough: form.validThrough ? new Date(form.validThrough) : null,
        // Admin-only bookkeeping for the table's "Updated" column. Deliberately a
        // separate field from postedAt - see the next comment.
        updatedAt: serverTimestamp(),
        // Stamped once, on creation. A re-save must not move datePosted - that
        // field is what Google keys a JobPosting's freshness off, and quietly
        // bumping it every time a typo is fixed is the kind of thing that gets
        // structured data flagged as manipulative.
        ...(existing ? {} : { postedAt: serverTimestamp(), status: JOB_STATUS.DRAFT }),
      };
      await saveRole(slug, payload);
      logAdminActivity(existing ? "updated job opening" : "created job opening", `${payload.title} (${slug})`, "careers");
      setEditing(null);
      setNonce((n) => n + 1);
    } catch (e) {
      setError(e?.message || "Could not save that role.");
    } finally {
      setBusy("");
    }
  };

  const changeStatus = async (slug, status) => {
    setBusy(slug);
    setError("");
    try {
      await setRoleStatus(slug, status);
      setRows((prev) => prev.map((r) => (r.id === slug ? { ...r, status } : r)));
      logAdminActivity(`set job opening ${status}`, slug, "careers");
    } catch (e) {
      setError(e?.message || "Could not change that role's status.");
    } finally {
      setBusy("");
    }
  };

  const remove = async (slug) => {
    // Deleting a posting orphans nothing - applications keep their own jobId and
    // jobTitle copy, so the inbox stays readable after the role is gone.
    if (!confirm(`Delete "${slug}" permanently? Applications already received are kept.`)) return;
    setBusy(slug);
    try {
      await deleteRole(slug);
      setRows((prev) => prev.filter((r) => r.id !== slug));
      logAdminActivity("deleted job opening", slug, "careers");
      if (editing === slug) setEditing(null);
    } catch (e) {
      setError(e?.message || "Could not delete that role.");
    } finally {
      setBusy("");
    }
  };

  const loading = rows === null;
  const list = rows || [];
  const countBy = (s) => list.filter((r) => (r.status || JOB_STATUS.DRAFT) === s).length;
  const appsByJob = (apps || []).reduce((m, a) => { m[a.jobId] = (m[a.jobId] || 0) + 1; return m; }, {});
  const newApps = (apps || []).filter((a) => a.status === APPLICATION_STATUS.NEW).length;
  const teams = [...new Set(list.map((r) => r.team).filter(Boolean))];
  const editingRow = editing ? list.find((r) => r.id === editing) : null;

  return (
    <div className="space-y-5">
      <StatGrid stats={[
        { label: "Job openings", value: list.length, sub: `${countBy(JOB_STATUS.DRAFT)} drafts`, icon: Briefcase, color: KIT.cyan, loading },
        { label: "Published", value: countBy(JOB_STATUS.PUBLISHED), sub: "Listed on careers.devert.in", icon: Eye, color: KIT.green, loading },
        { label: "Closed", value: countBy(JOB_STATUS.CLOSED), sub: "No longer listed", icon: XCircle, color: KIT.orange, loading },
        {
          label: "Applications", value: apps?.length ?? 0,
          sub: apps && apps.length >= APPLICATION_CAP ? `latest ${APPLICATION_CAP} loaded - ${newApps} new` : `${newApps} awaiting review`,
          icon: Inbox, color: KIT.purple, loading: apps === null,
        },
      ]} />

      {error && editing === null && (
        <p className="font-sans text-sm px-3 py-2 rounded-lg"
          style={{ color: KIT.red, background: `${KIT.red}0F`, border: `1px solid ${KIT.red}33` }}>
          {error}
        </p>
      )}

      <DataTable title="Job openings" icon={Briefcase}
        subtitle="Roles on careers.devert.in. New roles start as drafts; publishing lists them immediately."
        rows={list} loading={loading}
        searchKeys={["title", "team", "id", "location", "blurb"]} searchPlaceholder="Search roles..."
        filters={[
          { key: "status", label: "All statuses", get: (r) => r.status || JOB_STATUS.DRAFT,
            options: Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label })) },
          { key: "employmentType", label: "All types", options: EMPLOYMENT_TYPES.map((o) => ({ value: o.value, label: o.label })) },
          { key: "locationType", label: "All locations", options: LOCATION_TYPES.map((o) => ({ value: o.value, label: o.label })) },
          ...(teams.length ? [{ key: "team", label: "All teams", options: teams.map((t) => ({ value: t, label: t })) }] : []),
        ]}
        primaryAction={{ label: "New role", icon: Plus, onClick: startNew }}
        toolbarExtra={(
          <button onClick={() => setNonce((n) => n + 1)}
            className="ml-auto inline-flex items-center gap-1.5 font-sans text-xs text-white/50 hover:text-white px-2 py-2">
            <RefreshCw size={12} /> Refresh
          </button>
        )}
        onRowClick={startEdit}
        emptyText="No job openings yet. Seed some with scripts/seed-job-openings.mjs, or create one."
        columns={[
          { key: "title", label: "Role", render: (r) => (
            <div className="min-w-0 w-[260px] xl:w-[320px]">
              <p className="font-sans text-sm font-medium text-white truncate">{r.title || "(untitled)"}</p>
              <p className="font-sans text-xs text-white/40 truncate">{r.team || "No team"} - careers.devert.in/{r.id}</p>
            </div>
          ) },
          { key: "locationType", label: "Location", render: (r) => (
            <div className="min-w-0">
              <p className="font-sans text-sm text-white/75 truncate">{labelOf(LOCATION_TYPES, r.locationType)}{r.location ? `, ${r.location}` : ""}</p>
              <p className="font-sans text-xs text-white/40">{labelOf(EMPLOYMENT_TYPES, r.employmentType)}</p>
            </div>
          ) },
          { key: "applications", label: "Applications", sort: (r) => appsByJob[r.id] || 0, render: (r) => (
            <span className="font-sans text-sm text-white/70 tabular-nums">{apps === null ? "-" : fmt(appsByJob[r.id] || 0)}</span>
          ) },
          { key: "updatedAt", label: "Updated", sort: (r) => tsMillis(r.updatedAt) || tsMillis(r.postedAt), render: (r) => (
            <span className="font-sans text-xs text-white/55">{fmtDate(r.updatedAt || r.postedAt)}</span>
          ) },
          { key: "status", label: "Status", sort: (r) => r.status || JOB_STATUS.DRAFT, render: (r) => {
            const meta = STATUS_META[r.status] || STATUS_META[JOB_STATUS.DRAFT];
            const live = r.status === JOB_STATUS.PUBLISHED;
            return (
              <div className="flex items-center gap-2.5">
                {/* On publishes; off CLOSES rather than returning to draft - a
                    role that was live has been seen, and "closed" says so. */}
                <Toggle on={live} disabled={busy === r.id} label={`${live ? "Close" : "Publish"} ${r.title || r.id}`}
                  onChange={(on) => changeStatus(r.id, on ? JOB_STATUS.PUBLISHED : JOB_STATUS.CLOSED)} />
                <Pill color={meta.color}>{meta.label}</Pill>
              </div>
            );
          } },
        ]}
        rowActions={(r) => [
          { icon: Pencil, label: "Edit", onClick: () => startEdit(r) },
          { icon: Copy, label: "Duplicate", onClick: () => startDuplicate(r) },
          { icon: Trash2, label: "Delete", danger: true, disabled: busy === r.id, onClick: () => remove(r.id) },
        ]}
      />

      <p className="font-sans text-xs text-white/35 leading-relaxed">
        Publishing shows a role on careers.devert.in straight away - that list is a live query.
        Its own careers.devert.in/&#123;slug&#125; page and its Google-indexable JobPosting markup are
        built at deploy time (a SEPARATE app and Hosting target, devert-careers - so shipping a new
        role URL means deploying that site, not this one).
      </p>

      <Drawer open={editing !== null} onClose={closeDrawer}
        title={editing ? `Edit ${form.title || editing}` : "New role"}
        subtitle={editing ? `careers.devert.in/${editing} - the slug is locked once created` : "Saved as a draft; publish it from the table."}
        footer={<>
          {editingRow && (
            <div className="mr-auto">
              <Pill color={(STATUS_META[editingRow.status] || STATUS_META[JOB_STATUS.DRAFT]).color}>
                {(STATUS_META[editingRow.status] || STATUS_META[JOB_STATUS.DRAFT]).label}
              </Pill>
            </div>
          )}
          <SecondaryButton onClick={closeDrawer}>Cancel</SecondaryButton>
          <PrimaryButton icon={Check} busy={busy === "save"} disabled={!form.title.trim()} onClick={save}>
            {editing ? "Save changes" : "Create as draft"}
          </PrimaryButton>
        </>}>
        {error && (
          <p className="font-sans text-sm mb-4 px-3 py-2 rounded-lg"
            style={{ color: KIT.red, background: `${KIT.red}0F`, border: `1px solid ${KIT.red}33` }}>
            {error}
          </p>
        )}

        <DrawerSection title="Role" hint="What the listing on careers.devert.in shows.">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="TITLE" value={form.title} onChange={set("title")}
              placeholder="Frontend Engineer" maxLength={120}
              hint={editing ? `slug locked: ${editing}` : `slug will be: ${slugify(form.title) || "..."}`} />
            <Input label="TEAM" value={form.team} onChange={set("team")} placeholder="Engineering" maxLength={60} />
            <Select label="EMPLOYMENT TYPE" value={form.employmentType} onChange={set("employmentType")} options={EMPLOYMENT_TYPES} />
            <Select label="LOCATION TYPE" value={form.locationType} onChange={set("locationType")} options={LOCATION_TYPES} />
            <Input label="LOCATION" value={form.location} onChange={set("location")} placeholder="Hyderabad" maxLength={80} />
            <Input label="EXPERIENCE" value={form.experience} onChange={set("experience")} placeholder="0-2 years" maxLength={40} />
          </div>
          <Input label="BLURB" value={form.blurb} onChange={set("blurb")} maxLength={200}
            placeholder="One line shown on the careers list" hint={`${form.blurb.length}/200`} />
        </DrawerSection>

        <DrawerSection title="Listing" hint="Ordering and structured data.">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="ORDER" value={form.order} onChange={set("order")} type="number"
              hint="lower sorts first on careers.devert.in" />
            <Input label="VALID THROUGH" value={form.validThrough} onChange={set("validThrough")} type="date"
              hint="optional - used by JobPosting structured data" />
          </div>
        </DrawerSection>

        <DrawerSection title="Role page" hint="The body of careers.devert.in/{slug}. List fields take one item per line.">
          <Textarea label="DESCRIPTION" value={form.description} onChange={set("description")} rows={4}
            placeholder="The full prose intro shown at the top of the role page." />
          <Textarea label="RESPONSIBILITIES (one per line)" value={form.responsibilities} onChange={set("responsibilities")} rows={5} />
          <Textarea label="REQUIREMENTS (one per line)" value={form.requirements} onChange={set("requirements")} rows={5} />
          <Textarea label="NICE TO HAVE (one per line)" value={form.niceToHave} onChange={set("niceToHave")} rows={3} />
          <Textarea label="WHAT YOU GET (one per line)" value={form.perks} onChange={set("perks")} rows={4} />
        </DrawerSection>

        {editing && (
          <p className="font-sans text-xs text-white/35 flex items-center gap-1.5">
            <FileText size={12} /> {fmt(appsByJob[editing] || 0)} applications received for this role.
          </p>
        )}
      </Drawer>
    </div>
  );
}
