"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { updateCampusBranding, institutionInitials } from "@/lib/institutions";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusButton } from "@/components/campus/campus-ui";

const ACCENT_PRESETS = ["#00FF41", "#00FFFF", "#FF9500", "#C77DFF", "#FFD700", "#3B82F6"];

async function uploadCampusImage(institutionId, uid, kind, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `institution_branding/${institutionId}/${uid}/${kind}-${Date.now()}.${ext}`;
  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, file);
  return getDownloadURL(sRef);
}

export function CampusBrandingForm({ institutionId, institution, onSaved, onCancel }) {
  const { user } = useAuth();
  const [name, setName] = useState(institution?.name || "");
  const [shortName, setShortName] = useState(institution?.shortName || "");
  const [description, setDescription] = useState(institution?.description || "");
  const [tagline, setTagline] = useState(institution?.tagline || "");
  const [accentColor, setAccentColor] = useState(institution?.heroAccentColor || ACCENT_PRESETS[0]);
  const [bannerUrl, setBannerUrl] = useState(institution?.bannerUrl || "");
  const [logoUrl, setLogoUrl] = useState(institution?.logoUrl || "");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    try {
      await updateCampusBranding(institutionId, {
        name: name.trim(), shortName: shortName.trim(), description: description.trim(), tagline: tagline.trim(),
        heroAccentColor: accentColor, bannerUrl, logoUrl,
      });
      onSaved?.();
    } catch (e) {
      setError(e.message || "Failed to save branding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-[9px]" style={{ color: CAMPUS.inkFaint }}>LOGO</span>}
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

      <div className="flex gap-2 pt-1">
        <CampusButton onClick={handleSave} disabled={saving || bannerUploading || logoUploading || !name.trim()}>
          {saving ? "Saving..." : "Save branding"}
        </CampusButton>
        {onCancel && (
          <button onClick={onCancel} className="text-[12.5px] font-semibold px-3.5 py-2" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
        )}
      </div>
    </div>
  );
}
