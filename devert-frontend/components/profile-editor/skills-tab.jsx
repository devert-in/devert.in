"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DotPicker, SectionHeader } from "./editor-fields";

const LEVEL_LABEL = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

export default function SkillsTab({ skills, onChange }) {
  const [newName, setNewName] = useState("");
  const [newLevel, setNewLevel] = useState(3);

  const addSkill = () => {
    if (!newName.trim()) return;
    onChange([...skills, { name: newName.trim(), level: newLevel }]);
    setNewName(""); setNewLevel(3);
  };
  const removeSkill = (i) => onChange(skills.filter((_, j) => j !== i));
  const setLevel = (i, level) => onChange(skills.map((s, j) => j === i ? { ...s, level } : s));

  return (
    <div>
      <SectionHeader title="skills" />
      <div className="space-y-2 mb-4">
        {skills.length === 0 && (
          <p className="font-mono text-[10px] text-white/20">// no skills yet - add your first one below</p>
        )}
        {skills.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="font-mono text-xs text-white/65 flex-1 min-w-0 truncate">{s.name}</span>
            <DotPicker level={s.level} color="#00FF41" size="sm" onChange={v => setLevel(i, v)} />
            <span className="font-mono text-[9px] text-white/25 w-20 text-right hidden sm:block">{LEVEL_LABEL[s.level]}</span>
            <button onClick={() => removeSkill(i)} className="text-white/20 hover:text-red-400 transition-colors ml-1">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addSkill()}
          placeholder="Skill name (e.g. Java)" maxLength={30}
          className="flex-1 min-w-[120px] font-mono text-xs text-white/80 px-3 py-2 rounded outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          onFocus={e => (e.target.style.borderColor = "rgba(0,255,65,0.3)")}
          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
        <DotPicker level={newLevel} onChange={setNewLevel} color="#00FF41" />
        <button onClick={addSkill}
          className="flex items-center gap-1.5 font-mono text-xs text-neon-green border border-neon-green/25 px-3 py-2 rounded hover:bg-neon-green/6 transition-colors">
          <Plus size={11} /> add
        </button>
      </div>
      <p className="font-mono text-[9px] text-white/15 mt-4">// projects now live on Shipyard - dock a project there and it shows up on your portfolio automatically</p>
    </div>
  );
}
