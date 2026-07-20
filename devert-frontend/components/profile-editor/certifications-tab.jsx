"use client";

import { useRef, useState } from "react";
import { Plus, Check, Trash2, Upload } from "lucide-react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Field, SectionHeader } from "./editor-fields";

const blank = { title: "", issuer: "", issueDate: "", credentialUrl: "", logoUrl: "" };

export default function CertificationsTab({ certifications, onChange, uid }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const logoRef = useRef(null);

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) return;
    setUploading(true);
    try {
      const id = `cert_${Date.now()}`;
      const sRef = storageRef(storage, `cert_logos/${uid}/${id}.jpg`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setForm(f => ({ ...f, logoUrl: url }));
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const add = () => {
    if (!form.title.trim() || !form.issuer.trim()) return;
    onChange([...certifications, { id: `cert_${Date.now()}`, ...form, title: form.title.trim(), issuer: form.issuer.trim() }]);
    setForm(blank); setAdding(false);
  };
  const remove = (id) => onChange(certifications.filter(c => c.id !== id));

  return (
    <div>
      <SectionHeader title="certifications" />
      <div className="space-y-2 mb-4">
        {certifications.length === 0 && <p className="font-mono text-[10px] text-white/20">// no certifications yet - add one below</p>}
        {certifications.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {c.logoUrl && <img src={c.logoUrl} alt="" className="w-7 h-7 rounded object-contain bg-white/5" />}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-white/75 font-semibold">{c.title}</p>
              <p className="font-mono text-[10px] text-white/28">{c.issuer}{c.issueDate ? ` · ${c.issueDate}` : ""}</p>
            </div>
            <button onClick={() => remove(c.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={11} /></button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="space-y-3 p-4 rounded" style={{ background: "rgba(0,255,65,0.03)", border: "1px solid rgba(0,255,65,0.1)" }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="TITLE" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Responsive Web Design" maxLength={80} />
            <Field label="ISSUER" value={form.issuer} onChange={v => setForm(f => ({ ...f, issuer: v }))} placeholder="freeCodeCamp" maxLength={60} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ISSUE DATE" value={form.issueDate} onChange={v => setForm(f => ({ ...f, issueDate: v }))} placeholder="2024" maxLength={20} />
            <Field label="CREDENTIAL URL" value={form.credentialUrl} onChange={v => setForm(f => ({ ...f, credentialUrl: v }))} placeholder="https://..." maxLength={200} />
          </div>
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            <button onClick={() => logoRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 font-mono text-xs text-white/40 border border-white/10 px-3 py-2 rounded hover:text-neon-cyan transition-colors disabled:opacity-50">
              <Upload size={11} /> {uploading ? "uploading..." : "upload issuer logo"}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors"><Check size={11} /> add certification</button>
            <button onClick={() => { setAdding(false); setForm(blank); }} className="font-mono text-xs text-white/25 border border-white/8 px-3 py-2 rounded hover:bg-white/4 transition-colors">cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 font-mono text-xs text-neon-cyan/60 border border-neon-cyan/15 px-3 py-2 rounded hover:bg-neon-cyan/5 transition-colors">
          <Plus size={11} /> add certification
        </button>
      )}
    </div>
  );
}
