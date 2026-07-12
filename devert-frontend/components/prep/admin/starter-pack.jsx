"use client";

// Admin — "Install starter pack" (design §2 + §10). Batch-writes the seed
// content from lib/prep/seed. Every seed id is deterministic, and every write
// here is a setDoc/batch.set (never addDoc), so re-running this is always
// safe — it overwrites, never duplicates.

import { useState } from "react";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { PackagePlus, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { TerminalCard, BracketButton, PrepModal } from "@/components/prep/ui";
import { importQuestions, upsertCourse, upsertClassGroup, setDailyTasks, dateKey } from "@/lib/prep/db";
import {
  seedQuestions,
  seedCourses,
  seedClassGroups,
  seedAnnouncements,
  buildSeedDailyTasks,
  buildSeedExams,
} from "@/lib/prep/seed";

const STEP_ICONS = {
  pending: <Loader2 size={12} className="animate-spin text-neon-cyan/70" />,
  done: <CheckCircle2 size={12} className="text-neon-green" />,
  error: <XCircle size={12} className="text-[#FF3B3B]" />,
};

export default function StarterPackPanel() {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);

  // Marks the most recent log entry with a final status.
  const settle = (status, textOverride) => {
    setLog((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = { ...next[next.length - 1], status };
      if (textOverride) last.text = textOverride;
      next[next.length - 1] = last;
      return next;
    });
  };

  const runInstall = async () => {
    setConfirming(false);
    setInstalling(true);
    setDone(false);
    setLog([]);
    try {
      setLog([{ text: "Importing question bank…", status: "pending" }]);
      const qResult = await importQuestions(seedQuestions, user?.uid);
      settle("done", `✓ Imported ${qResult.count} questions`);

      setLog((prev) => [...prev, { text: "Installing class groups…", status: "pending" }]);
      for (const g of seedClassGroups) {
        await upsertClassGroup({ id: g.id, name: g.name, branch: g.branch, active: g.active });
      }
      settle("done", `✓ Installed ${seedClassGroups.length} class groups`);

      setLog((prev) => [...prev, { text: "Installing courses…", status: "pending" }]);
      for (const c of seedCourses) {
        await upsertCourse(c.id, {
          title: c.title,
          category: c.category,
          description: c.description,
          order: c.order,
          published: c.published,
          lessons: c.lessons,
        });
      }
      settle("done", `✓ Installed ${seedCourses.length} courses (${seedCourses.reduce((s, c) => s + c.lessons.length, 0)} lessons)`);

      setLog((prev) => [...prev, { text: "Installing announcements…", status: "pending" }]);
      const annBatch = writeBatch(db);
      for (const a of seedAnnouncements) {
        annBatch.set(
          doc(db, "prepAnnouncements", a.id),
          { text: a.text, date: a.date, link: a.link || null, createdAt: serverTimestamp() },
          { merge: true }
        );
      }
      await annBatch.commit();
      settle("done", `✓ Installed ${seedAnnouncements.length} announcements`);

      setLog((prev) => [...prev, { text: "Scheduling daily tasks…", status: "pending" }]);
      const dailyMap = buildSeedDailyTasks(dateKey());
      const dayEntries = Object.entries(dailyMap);
      for (const [day, data] of dayEntries) {
        await setDailyTasks(day, data.items);
      }
      settle("done", `✓ Scheduled ${dayEntries.length} days of daily tasks starting today`);

      setLog((prev) => [...prev, { text: "Building sample exams…", status: "pending" }]);
      const bundles = buildSeedExams(new Date());
      for (const b of bundles) {
        const examBatch = writeBatch(db);
        examBatch.set(doc(db, "prepExams", b.id), {
          ...b.exam,
          createdBy: user?.uid || null,
          createdAt: serverTimestamp(),
        });
        examBatch.set(doc(db, "prepExamPapers", b.id), b.paper);
        examBatch.set(doc(db, "prepExamKeys", b.id), b.key);
        await examBatch.commit();
      }
      settle("done", `✓ Installed ${bundles.length} sample exams (weekend test + coding contest)`);

      setDone(true);
    } catch (e) {
      settle("error", `✗ FAILED: ${e?.message || "unknown error"}`);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="space-y-6">
      <TerminalCard filename="starter-pack.sh" icon={PackagePlus} delay={0}>
        <p className="font-mono text-xs text-white/45 leading-relaxed mb-4">
          Installs the full Devert Prep starter pack in one click: {seedQuestions.length} question-bank entries
          (aptitude, reasoning, verbal, DSA, python, java + coding problems), {seedCourses.length} weekday courses,{" "}
          {seedClassGroups.length} class groups, {seedAnnouncements.length} announcements, 7 days of scheduled daily
          tasks, and a sample weekend test + coding contest.
        </p>
        <p className="font-mono text-[11px] text-white/25 leading-relaxed mb-5">
          Every seed record has a deterministic id, so this is safe to run more than once — re-installing overwrites
          the same records rather than duplicating them.
        </p>

        <BracketButton
          variant="gold"
          onClick={() => setConfirming(true)}
          disabled={installing}
          loading={installing}
          loadingText="INSTALLING"
        >
          INSTALL_STARTER_PACK
        </BracketButton>

        {log.length > 0 && (
          <div className="mt-6 border border-white/10 rounded-lg bg-black/50 p-4 space-y-2 max-h-80 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="flex items-center gap-2.5 font-mono text-[11px]">
                {STEP_ICONS[entry.status]}
                <span className={entry.status === "error" ? "text-[#FF3B3B]" : "text-white/60"}>{entry.text}</span>
              </div>
            ))}
            {done && (
              <p className="pt-2 mt-2 border-t border-white/10 font-mono text-xs text-neon-green tracking-wider">
                STARTER PACK INSTALLED ✓
              </p>
            )}
          </div>
        )}
      </TerminalCard>

      <PrepModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Install starter pack?"
        filename="confirm.sh"
        maxWidth="max-w-sm"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setConfirming(false)}>
              CANCEL
            </BracketButton>
            <BracketButton variant="gold" onClick={runInstall}>
              INSTALL
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed flex items-start gap-2">
          <AlertTriangle size={14} className="text-[#FF9500] flex-shrink-0 mt-0.5" />
          This overwrites any existing questions, courses, class groups, announcements, daily tasks, or sample exams
          that share the seed pack&apos;s ids. Custom content with different ids is untouched.
        </p>
      </PrepModal>
    </div>
  );
}
