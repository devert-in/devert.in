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
  Briefcase, Check, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, X,
} from "lucide-react";
import { Input, Textarea } from "@/components/admin/admin-ui";
import {
  EMPLOYMENT_TYPES, JOB_STATUS, LOCATION_TYPES, deleteRole, fetchAllRoles,
  saveRole, setRoleStatus, slugify,
} from "@/lib/careers";

const STATUS_META = {
  [JOB_STATUS.DRAFT]: { label: "DRAFT", color: "#FF9500" },
  [JOB_STATUS.PUBLISHED]: { label: "PUBLISHED", color: "#00FF41" },
  [JOB_STATUS.CLOSED]: { label: "CLOSED", color: "rgba(255,255,255,0.35)" },
};

const EMPTY = {
  title: "", team: "", employmentType: "full-time", locationType: "hybrid",
  location: "", experience: "", blurb: "", description: "",
  responsibilities: "", requirements: "", niceToHave: "", perks: "",
  order: "500", validThrough: "",
};

// One item per line, the same shape every other array field in this console uses
// (hackathon whyParticipate, coding-problem hints, ambassador tier perks).
const toLines = (arr) => (arr || []).join("\n");
const fromLines = (text) => (text || "").split("\n").map((s) => s.trim()).filter(Boolean);

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

export function CareersPanel() {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // slug being edited, or "" for a new role
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState("");
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");
    fetchAllRoles()
      .then((r) => { if (alive) setRows(r); })
      .catch((e) => {
        if (!alive) return;
        setRows([]);
        setError(e?.message || "Could not load job openings.");
      });
    return () => { alive = false; };
  }, [nonce]);

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const startNew = () => { setEditing(""); setForm(EMPTY); setError(""); };

  const startEdit = (r) => {
    setEditing(r.id);
    setError("");
    setForm({
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
    });
  };

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
        // Stamped once, on creation. A re-save must not move datePosted - that
        // field is what Google keys a JobPosting's freshness off, and quietly
        // bumping it every time a typo is fixed is the kind of thing that gets
        // structured data flagged as manipulative.
        ...(existing ? {} : { postedAt: serverTimestamp(), status: JOB_STATUS.DRAFT }),
      };
      await saveRole(slug, payload);
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
    } catch (e) {
      setError(e?.message || "Could not delete that role.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={startNew}
          className="font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ color: "#00FF41", background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.3)" }}>
          <Plus size={10} /> NEW ROLE
        </button>
        <button onClick={() => setNonce((n) => n + 1)}
          className="ml-auto font-mono text-[10px] text-white/35 flex items-center gap-1.5 px-2.5 py-1.5">
          <RefreshCw size={10} /> refresh
        </button>
      </div>

      {error && (
        <p className="font-mono text-[10.5px] mb-3 px-3 py-2 rounded-lg"
          style={{ color: "#FF9A9A", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)" }}>
          {error}
        </p>
      )}

      {editing !== null && (
        <div className="p-4 rounded-lg mb-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,255,0.18)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[11px]" style={{ color: "#00FFFF" }}>
              {editing ? `EDIT / ${editing}` : "NEW ROLE"}
            </p>
            <button onClick={() => setEditing(null)} className="text-white/30"><X size={13} /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Input label="TITLE" value={form.title} onChange={set("title")}
              placeholder="Frontend Engineer" maxLength={120}
              hint={editing ? `slug locked: ${editing}` : `slug will be: ${slugify(form.title) || "..."}`} />
            <Input label="TEAM" value={form.team} onChange={set("team")} placeholder="Engineering" maxLength={60} />
            <Select label="EMPLOYMENT TYPE" value={form.employmentType} onChange={set("employmentType")} options={EMPLOYMENT_TYPES} />
            <Select label="LOCATION TYPE" value={form.locationType} onChange={set("locationType")} options={LOCATION_TYPES} />
            <Input label="LOCATION" value={form.location} onChange={set("location")} placeholder="Hyderabad" maxLength={80} />
            <Input label="EXPERIENCE" value={form.experience} onChange={set("experience")} placeholder="0-2 years" maxLength={40} />
            <Input label="ORDER" value={form.order} onChange={set("order")} type="number"
              hint="lower sorts first on careers.devert.in" />
            <Input label="VALID THROUGH" value={form.validThrough} onChange={set("validThrough")} type="date"
              hint="optional - used by JobPosting structured data" />
          </div>

          <div className="space-y-3">
            <Input label="BLURB" value={form.blurb} onChange={set("blurb")} maxLength={200}
              placeholder="One line shown on the careers list" hint={`${form.blurb.length}/200`} />
            <Textarea label="DESCRIPTION" value={form.description} onChange={set("description")} rows={4}
              placeholder="The full prose intro shown at the top of the role page." />
            <Textarea label="RESPONSIBILITIES (one per line)" value={form.responsibilities} onChange={set("responsibilities")} rows={5} />
            <Textarea label="REQUIREMENTS (one per line)" value={form.requirements} onChange={set("requirements")} rows={5} />
            <Textarea label="NICE TO HAVE (one per line)" value={form.niceToHave} onChange={set("niceToHave")} rows={3} />
            <Textarea label="WHAT YOU GET (one per line)" value={form.perks} onChange={set("perks")} rows={4} />
          </div>

          <button onClick={save} disabled={busy === "save"}
            className="mt-4 font-mono text-[11px] px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-40"
            style={{ color: "#00FF41", background: "rgba(0,255,65,0.08)", border: "1px solid rgba(0,255,65,0.3)" }}>
            {busy === "save" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            {editing ? "save changes" : "create as draft"}
          </button>
        </div>
      )}

      {rows === null ? (
        <p className="font-mono text-xs text-white/25 animate-pulse">loading...</p>
      ) : rows.length === 0 ? (
        <p className="font-mono text-xs text-white/25">No job openings yet. Seed some with scripts/seed-job-openings.mjs, or create one above.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META[JOB_STATUS.DRAFT];
            return (
              <div key={r.id} className="p-3.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-mono text-[12px] text-white/85 flex items-center gap-2 flex-wrap">
                      <Briefcase size={11} style={{ color: "#FF9500" }} />
                      {r.title || "(untitled)"}
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded"
                        style={{ color: meta.color, background: `${meta.color}12` }}>
                        {meta.label}
                      </span>
                    </p>
                    <p className="font-mono text-[10.5px] text-white/40 mt-0.5">
                      careers.devert.in/{r.id} · {r.team || "no team"} · {r.employmentType || "?"} · {r.locationType || "?"}
                      {r.location ? ` · ${r.location}` : ""}
                    </p>
                    {r.blurb && <p className="font-mono text-[10.5px] text-white/45 mt-1.5 leading-relaxed">{r.blurb}</p>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button onClick={() => startEdit(r)}
                      className="font-mono text-[10px] px-3 py-1.5 rounded-lg"
                      style={{ color: "#00FFFF", border: "1px solid rgba(0,255,255,0.3)" }}>
                      edit
                    </button>
                    {r.status !== JOB_STATUS.PUBLISHED ? (
                      <button onClick={() => changeStatus(r.id, JOB_STATUS.PUBLISHED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "#00FF41", border: "1px solid rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }}>
                        {busy === r.id ? <Loader2 size={10} className="animate-spin" /> : <Eye size={10} />} publish
                      </button>
                    ) : (
                      <button onClick={() => changeStatus(r.id, JOB_STATUS.CLOSED)} disabled={busy === r.id}
                        className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                        style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
                        <EyeOff size={10} /> close
                      </button>
                    )}
                    <button onClick={() => remove(r.id)} disabled={busy === r.id}
                      className="font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
                      style={{ color: "#FF5050", border: "1px solid rgba(255,80,80,0.3)" }}>
                      <Trash2 size={10} /> delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="font-mono text-[10px] text-white/25 mt-4 leading-relaxed">
        Publishing shows a role on careers.devert.in straight away - that list is a live query.
        Its own careers.devert.in/&#123;slug&#125; page and its Google-indexable JobPosting markup are
        built at deploy time (a SEPARATE app and Hosting target, devert-careers - so shipping a new
        role URL means deploying that site, not this one).
      </p>
    </div>
  );
}
