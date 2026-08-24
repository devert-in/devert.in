"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Upload, X, Loader2, Check, AlertTriangle } from "lucide-react";
import { storage, storageRef, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { updateCampusBranding, institutionInitials } from "@/lib/institutions";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, NEON_ACCENT_HEX } from "@/lib/campus-theme";
import { CampusButton } from "@/components/campus/campus-ui";

const ACCENT_PRESETS = NEON_ACCENT_HEX;

async function uploadCampusImage(institutionId, uid, kind, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `institution_branding/${institutionId}/${uid}/${kind}-${Date.now()}.${ext}`;
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, file);
  return getDownloadURL(sRef);
}

// The exact set of fields this form owns and can save - both the "what did
// we last save" snapshot and the "what does the form currently hold" value
// are built with this same shape, so dirty-checking is a single JSON
// comparison instead of six separate field-by-field checks.
function snapshotOf(fields) {
  return JSON.stringify(fields);
}

// Tiny local toast - no shared toast component exists anywhere in this app
// yet (Missions/Broadcast each have their own bespoke one), so this stays a
// one-file addition until a second Manage flow actually needs it too.
function SaveToast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl"
      style={{
        background: isError ? CAMPUS.bad : CAMPUS.good, color: "#fff",
        boxShadow: CAMPUS.shadowLg, maxWidth: 340,
      }}>
      {isError ? <AlertTriangle size={16} className="flex-shrink-0" /> : <Check size={16} className="flex-shrink-0" />}
      <span className="text-[13px] font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-80 hover:opacity-100 flex-shrink-0"><X size={14} /></button>
    </div>
  );
}

// forwardRef + useImperativeHandle so CampusManage (the parent that owns tab
// switching) can force a save or a discard from ITS OWN "you have unsaved
// branding changes" confirm dialog, without lifting all six form fields up a
// level - the dirty flag and the save/discard actions are the only things
// that need to cross the component boundary.
export const CampusBrandingForm = forwardRef(function CampusBrandingForm(
  { institutionId, institution, onSaved, onDirtyChange, onCancel },
  ref,
) {
  const { user } = useAuth();
  const initialFields = useMemo(() => ({
    name: institution?.name || "",
    shortName: institution?.shortName || "",
    description: institution?.description || "",
    tagline: institution?.tagline || "",
    heroAccentColor: institution?.heroAccentColor || ACCENT_PRESETS[0],
    bannerUrl: institution?.bannerUrl || "",
    logoUrl: institution?.logoUrl || "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const [name, setName] = useState(initialFields.name);
  const [shortName, setShortName] = useState(initialFields.shortName);
  const [description, setDescription] = useState(initialFields.description);
  const [tagline, setTagline] = useState(initialFields.tagline);
  const [accentColor, setAccentColor] = useState(initialFields.heroAccentColor);
  const [bannerUrl, setBannerUrl] = useState(initialFields.bannerUrl);
  const [logoUrl, setLogoUrl] = useState(initialFields.logoUrl);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotOf(initialFields));

  const currentFields = useMemo(() => ({
    name: name.trim(), shortName: shortName.trim(), description: description.trim(), tagline: tagline.trim(),
    heroAccentColor: accentColor, bannerUrl, logoUrl,
  }), [name, shortName, description, tagline, accentColor, bannerUrl, logoUrl]);

  const isDirty = snapshotOf(currentFields) !== savedSnapshot;

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  // Native "leave site?" prompt on refresh/close/URL-bar navigation - modern
  // browsers ignore any custom returnValue text for security reasons, so
  // this can only trigger the browser's own generic warning, not the
  // specific 3-button dialog shown for in-app tab switching below.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpload = async (kind, file, setUrl, setUploading) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setUploading(true);
    setError("");
    try {
      const url = await uploadCampusImage(institutionId, user.uid, kind, file);
      setUrl(url);
    } catch (e) {
      setError(e.message || `Failed to upload ${kind}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveFailed(false);
    setError("");
    try {
      await updateCampusBranding(institutionId, currentFields);
      setSavedSnapshot(snapshotOf(currentFields));
      setToast({ type: "success", message: "Branding updated successfully." });
      onSaved?.(currentFields);
    } catch (e) {
      setSaveFailed(true);
      setError(e.message || "Failed to save branding.");
      setToast({ type: "error", message: e.message || "Failed to save branding." });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setName(initialFields.name);
    setShortName(initialFields.shortName);
    setDescription(initialFields.description);
    setTagline(initialFields.tagline);
    setAccentColor(initialFields.heroAccentColor);
    setBannerUrl(initialFields.bannerUrl);
    setLogoUrl(initialFields.logoUrl);
    setSaveFailed(false);
    setError("");
  };

  useImperativeHandle(ref, () => ({
    isDirty: () => isDirty,
    save: handleSave,
    discard: handleDiscard,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isDirty, currentFields]);

  const buttonLabel = saving ? "Saving..." : saveFailed ? "Retry Save" : isDirty ? "Save Changes" : "Saved";
  const buttonStyle = saving
    ? { background: CAMPUS.inkFaint, color: "#fff" }
    : saveFailed
      ? { background: CAMPUS.bad, color: "#fff" }
      : isDirty
        ? { background: CAMPUS.teal, color: "#fff" }
        : { background: CAMPUS.good, color: "#fff" };

  return (
    <div className="space-y-4">
      <SaveToast toast={toast} onDismiss={() => setToast(null)} />
      {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>}

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>CAMPUS BANNER</label>
        <div className="rounded-xl overflow-hidden relative" style={{ border: `1px solid ${CAMPUS.line}`, height: 140, background: bannerUrl ? undefined : CAMPUS.paper }}>
          {bannerUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }} />}
          {!bannerUrl && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              No banner uploaded - a default gradient shows to students until one is set.
            </div>
          )}
          {bannerUploading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <label className="text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            <Upload size={12} /> {bannerUrl ? "Replace" : "Upload"} banner
            <input type="file" accept="image/*" className="hidden" disabled={bannerUploading}
              onChange={e => handleUpload("banner", e.target.files?.[0], setBannerUrl, setBannerUploading)} />
          </label>
          {bannerUrl && (
            <button onClick={() => setBannerUrl("")} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ color: CAMPUS.bad }}>
              <X size={12} /> Remove
            </button>
          )}
        </div>
        <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>Recommended 1920x450, under 5MB.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ border: `1px solid ${CAMPUS.line}`, background: CAMPUS.paper }}>
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px]" style={{ color: CAMPUS.inkFaint }}>LOGO</span>}
        </div>
        <label className="text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
          <Upload size={12} /> {logoUploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
          <input type="file" accept="image/*" className="hidden" disabled={logoUploading}
            onChange={e => handleUpload("logo", e.target.files?.[0], setLogoUrl, setLogoUploading)} />
        </label>
        {logoUrl && (
          <button onClick={() => setLogoUrl("")} className="text-[12px] font-semibold" style={{ color: CAMPUS.bad }}><X size={13} /></button>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>CAMPUS NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Malla Reddy College of Engineering and Technology"
          className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>SHORT NAME / ABBREVIATION</label>
        <input value={shortName} onChange={e => setShortName(e.target.value)} placeholder={institutionInitials(name) || "MRCET"}
          className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>
          Shown in the sidebar instead of the full campus name, which gets cut off there.
          {!shortName.trim() && institutionInitials(name) && <> Leave blank to auto-use <b>{institutionInitials(name)}</b>.</>}
        </p>
      </div>

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>TAGLINE</label>
        <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Learn. Practice. Get Placed."
          className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>SHORT DESCRIPTION</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Placement preparation hub for..."
          className="w-full text-[13px] px-3 py-2 rounded-lg outline-none resize-none"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>

      <div>
        <label className="block text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>ACCENT COLOR</label>
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENT_PRESETS.map(c => (
            <button key={c} onClick={() => setAccentColor(c)} title={c}
              className="w-7 h-7 rounded-full flex-shrink-0"
              style={{ background: c, border: accentColor === c ? `2px solid ${CAMPUS.ink}` : "2px solid transparent", boxShadow: accentColor === c ? CAMPUS.shadow : "none" }} />
          ))}
          <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer" style={{ border: `1px solid ${CAMPUS.line}` }} />
        </div>
      </div>

      <div className="flex gap-2 pt-1 items-center">
        <CampusButton onClick={handleSave} disabled={saving || bannerUploading || logoUploading || !name.trim() || (!isDirty && !saveFailed)}
          icon={saving ? Loader2 : saveFailed ? undefined : !isDirty ? Check : undefined}
          style={buttonStyle}
          className={saving ? "[&_svg]:animate-spin" : ""}>
          {buttonLabel}
        </CampusButton>
        {onCancel && (
          <button onClick={onCancel} className="text-[12.5px] font-semibold px-3.5 py-2" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
        )}
      </div>
    </div>
  );
});
