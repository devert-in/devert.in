"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { allExperienceTags, type Experience, type ExperienceRound, type ExperienceStatus } from "@/lib/data/experiences";

const STATUS_OPTIONS: ExperienceStatus[] = ["Selected", "Not Selected", "Waitlisted"];
const TOTAL_STEPS = 4;

interface ShareExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (experience: Experience) => void;
}

const emptyRound: ExperienceRound = { roundName: "", description: "" };

export function ShareExperienceDialog({ open, onOpenChange, onSubmit }: ShareExperienceDialogProps) {
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [branch, setBranch] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ExperienceStatus>("Selected");
  const [rounds, setRounds] = useState<ExperienceRound[]>([{ ...emptyRound }]);
  const [proTip, setProTip] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [tags, setTags] = useState<string[]>([]);

  function resetForm() {
    setStep(1);
    setStudentName("");
    setBranch("");
    setCompany("");
    setRole("");
    setStatus("Selected");
    setRounds([{ ...emptyRound }]);
    setProTip("");
    setDifficulty(3);
    setTags([]);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function updateRound(index: number, field: keyof ExperienceRound, value: string) {
    setRounds((prev) => prev.map((round, i) => (i === index ? { ...round, [field]: value } : round)));
  }

  function addRound() {
    setRounds((prev) => [...prev, { ...emptyRound }]);
  }

  function removeRound(index: number) {
    setRounds((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const step1Valid = studentName.trim() && branch.trim() && company.trim() && role.trim();
  const step2Valid = rounds.every((round) => round.roundName.trim() && round.description.trim());

  function handleSubmit() {
    const newExperience: Experience = {
      id: `user-${Date.now()}`,
      studentName: studentName.trim() || "Anonymous",
      branch: branch.trim(),
      company: company.trim(),
      role: role.trim(),
      status,
      difficulty,
      tags: tags.length > 0 ? tags : [company.trim()],
      rounds: rounds.filter((round) => round.roundName.trim() && round.description.trim()),
      proTip: proTip.trim() || "Stay consistent with your preparation and mock interviews.",
    };
    onSubmit(newExperience);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share Your Interview Experience</DialogTitle>
          <DialogDescription>Step {step} of {TOTAL_STEPS}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <span
              key={index}
              className={cn("h-1.5 flex-1 rounded-full", index < step ? "bg-gold-gradient" : "bg-surface-muted")}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <Input placeholder="Your name (or leave blank for Anonymous)" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            <Input placeholder="Branch (e.g. CSE-AI&ML)" value={branch} onChange={(e) => setBranch(e.target.value)} />
            <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input placeholder="Role (e.g. SDE-1)" value={role} onChange={(e) => setRole(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    status === option ? "border-transparent bg-navy-gradient text-white" : "border-border-subtle text-foreground/65"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
            {rounds.map((round, index) => (
              <div key={index} className="rounded-xl border border-border-subtle p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-gold-600">Round {index + 1}</span>
                  {rounds.length > 1 && (
                    <button type="button" onClick={() => removeRound(index)} aria-label={`Remove round ${index + 1}`}>
                      <Trash2 size={15} className="text-foreground/40 hover:text-rose-500" />
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Round name (e.g. Technical Interview 1)"
                  value={round.roundName}
                  onChange={(e) => updateRound(index, "roundName", e.target.value)}
                  className="mb-2"
                />
                <Textarea
                  placeholder="Describe what happened in this round — supports basic formatting"
                  value={round.description}
                  onChange={(e) => updateRound(index, "description", e.target.value)}
                  rows={3}
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRound} className="gap-1.5">
              <Plus size={14} /> Add Round
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-sm font-semibold">Pro tip for juniors</p>
              <Textarea
                placeholder="Share a piece of advice — supports basic formatting"
                value={proTip}
                onChange={(e) => setProTip(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold">Difficulty Rating</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button key={index} type="button" onClick={() => setDifficulty(index + 1)} aria-label={`Rate ${index + 1} out of 5`}>
                    <Star size={22} className={cn(index < difficulty ? "fill-gold-500 text-gold-500" : "fill-transparent text-foreground/25")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold">Tags</p>
              <div className="flex flex-wrap gap-2">
                {allExperienceTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      tags.includes(tag) ? "border-transparent bg-navy-gradient text-white" : "border-border-subtle text-foreground/65"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-foreground/60">Review your submission before posting it to the feed.</p>
            <div className="rounded-xl border border-border-subtle p-4">
              <p className="font-bold">{studentName || "Anonymous"} · {company}</p>
              <p className="text-foreground/60">{branch} · {role} · {status}</p>
              <p className="mt-2 font-semibold">{rounds.length} round(s) documented</p>
              <p className="mt-2 italic text-foreground/70">&ldquo;{proTip || "No pro tip provided."}&rdquo;</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(tags.length > 0 ? tags : [company]).map((tag) => (
                  <span key={tag} className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < TOTAL_STEPS && (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
            >
              Next
            </Button>
          )}
          {step === TOTAL_STEPS && <Button variant="gold" onClick={handleSubmit}>Submit Experience</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
