"use client";

import { useRef } from "react";
import { Upload, MapPin, Lock, FileUp, ImagePlus } from "lucide-react";
import { Field, TextAreaField, SelectField, SectionHeader } from "./editor-fields";
import { AVAILABILITY_OPTIONS } from "@/lib/portfolio-sections";

export default function IdentityTab({
  form, patch, handle, userEmail,
  onPhotoFile, photoUploading,
  onCoverFile, coverUploading,
  onResumeFile, resumeUploading,
}) {
  const photoRef  = useRef(null);
  const coverRef  = useRef(null);
  const resumeRef = useRef(null);

  return (
    <div className="space-y-10">
      <div>
        <SectionHeader title="profile_info" />

        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            {form.photoURL ? (
              <img src={form.photoURL} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" style={{ border: "1px solid rgba(0,255,255,0.2)" }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-bold text-3xl"
                style={{ background: "rgba(0,255,255,0.08)", border: "1px solid rgba(0,255,255,0.2)", color: "#00FFFF" }}>
                {handle[0]?.toUpperCase()}
              </div>
            )}
            {photoUploading && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(5,5,5,0.7)" }}>
                <span className="w-5 h-5 border border-white/20 border-t-neon-cyan rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoFile} />
            <button onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 font-mono text-xs text-white/40 border border-white/10 px-3 py-2 rounded hover:text-neon-cyan hover:border-neon-cyan/25 transition-colors">
              <Upload size={11} /> upload photo
            </button>
            <p className="font-mono text-[9px] text-white/18">or paste URL below</p>
            <input value={form.photoURL} onChange={e => patch({ photoURL: e.target.value })}
              placeholder="https://..."
              className="w-full font-mono text-[10px] text-white/60 px-2 py-1.5 rounded outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(0,255,255,0.3)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Field label="FULL NAME" value={form.displayName} onChange={v => patch({ displayName: v })} placeholder="Your name" maxLength={40} />
          <Field label="USERNAME" value={form.handle} onChange={v => patch({ handle: v.toLowerCase() })} placeholder="your_handle" maxLength={20}
            hint="3-20 chars · lowercase, numbers, underscores" prefix="@" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Field label="HEADLINE" value={form.headline} onChange={v => patch({ headline: v })} placeholder="AI/ML Developer | Python & Java" maxLength={80} />
          <Field label="CURRENT ROLE" value={form.currentRole} onChange={v => patch({ currentRole: v })} placeholder="ML Intern @ SWECHA" maxLength={60} />
        </div>
        <div className="mb-4">
          <TextAreaField label="BIO" value={form.bio} onChange={v => patch({ bio: v })} placeholder="One line. Who are you." maxLength={120} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Field label="LOCATION" value={form.location} onChange={v => patch({ location: v })} placeholder="City, Country" maxLength={50} prefix={<MapPin size={12} />} />
          <SelectField label="AVAILABILITY" value={form.availability} onChange={v => patch({ availability: v })} options={AVAILABILITY_OPTIONS} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">COVER BANNER</p>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCoverFile} />
            <button onClick={() => coverRef.current?.click()} disabled={coverUploading}
              className="flex items-center gap-2 font-mono text-xs text-white/40 border border-white/10 px-3 py-2 rounded hover:text-neon-cyan hover:border-neon-cyan/25 transition-colors disabled:opacity-50">
              <ImagePlus size={11} /> {coverUploading ? "uploading..." : form.coverImage ? "replace banner" : "upload banner"}
            </button>
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/28 mb-1 tracking-widest">RESUME (PDF)</p>
            <input ref={resumeRef} type="file" accept="application/pdf" className="hidden" onChange={onResumeFile} />
            <button onClick={() => resumeRef.current?.click()} disabled={resumeUploading}
              className="flex items-center gap-2 font-mono text-xs text-white/40 border border-white/10 px-3 py-2 rounded hover:text-neon-green hover:border-neon-green/25 transition-colors disabled:opacity-50">
              <FileUp size={11} /> {resumeUploading ? "uploading..." : form.resumeUrl ? "replace resume" : "upload resume"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="social_links" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GITHUB" value={form.github} onChange={v => patch({ github: v })} placeholder="github.com/username" maxLength={100} />
          <Field label="LINKEDIN" value={form.linkedin} onChange={v => patch({ linkedin: v })} placeholder="linkedin.com/in/username" maxLength={100} />
          <Field label="TWITTER / X" value={form.twitter} onChange={v => patch({ twitter: v })} placeholder="twitter.com/username" maxLength={100} />
          <Field label="WEBSITE" value={form.website} onChange={v => patch({ website: v })} placeholder="https://yoursite.com" maxLength={100} />
        </div>
      </div>

      <div>
        <SectionHeader title="public contact" />
        <Field label="CONTACT EMAIL (shown on your portfolio, optional)" value={form.contactEmail} onChange={v => patch({ contactEmail: v })}
          placeholder="hello@yoursite.com" maxLength={100}
          hint="Separate from your login email, which is never shown publicly." />
      </div>

      <div>
        <SectionHeader title="account" />
        <div className="flex items-center gap-2 mb-3">
          <Lock size={10} className="text-white/20" />
          <span className="font-mono text-[10px] text-white/25 tracking-widest">LOGIN EMAIL (private, cannot change)</span>
        </div>
        <div className="font-mono text-xs text-white/25 px-3 py-2 rounded"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {userEmail}
        </div>
      </div>
    </div>
  );
}
