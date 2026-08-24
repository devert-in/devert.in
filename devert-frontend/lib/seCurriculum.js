// The Software Engineering Fundamentals curriculum, as seed data.
//
// Same reasoning as lib/gateSyllabus.js: the shape of a course is a structural
// decision that belongs in reviewable source, not in a series of untracked form
// submissions against production. Seeding is idempotent and additive (merge:true
// throughout), so re-seeding after a curriculum revision restores any missing
// module or lesson shell and refreshes the structural fields - title, order,
// module grouping - without touching a single authored word. Authored sections
// are simply absent from the payload below, so a merge leaves them alone.
//
// Lessons are seeded PUBLISHED with no body. That is deliberate and matches how
// the GATE syllabus behaves: the curriculum itself is real information a learner
// should be able to see and plan against on day one, and the reader renders an
// honest "this lesson is being written" state for a lesson with no authored
// content. Publishing the skeleton is not the same as pretending the lessons
// exist.
//
// ACCENTS come from the platform palette in CLAUDE.md's design system. No new
// colours are introduced.

import { db } from "@/lib/firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

function slug(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export { SE_ACCENTS, SE_MODULES, countCurriculum } from "@/lib/se-curriculum-data.mjs";
import { SE_MODULES } from "@/lib/se-curriculum-data.mjs";

// Lives here (a dependency-free data module), not in se-lesson-blocks.jsx
// where it used to be re-exported from - se-app.jsx needed it from there
// while se-lesson-blocks.jsx separately imports useSe from se-app.jsx,
// which is a genuine two-file import cycle Turbopack won't tolerate (fails
// at module-eval time with "Cannot access 'ACCENT'/'SE_ACCENT' before
// initialization" the moment the two files load in the wrong order - this
// is not cosmetic, it broke the entire Campus workspace, not just
// Fundamentals). se-lesson-blocks.jsx still re-exports SE_ACCENT from here
// for its own existing consumers (se-lesson.jsx, se-ui.jsx,
// admin/se-panel.jsx), so only se-app.jsx's own import needed to move.
export const SE_ACCENT = {
  green: "#00FF41",
  cyan: "#00FFFF",
  orange: "#FF9500",
  purple: "#C77DFF",
  gold: "#FFD700",
  red: "#FF5050",
  blue: "#3B82F6",
  violet: "#A78BFA",
};

// Order is gapped by 10 at both levels, matching lib/campusNavConfig.js's
// convention: inserting a lesson between two existing ones later never requires
// renumbering its siblings.
export async function seedCurriculum({ onProgress } = {}) {
  const ops = [];

  SE_MODULES.forEach((m, mi) => {
    ops.push({
      ref: doc(db, "seModules", m.id),
      data: {
        number: m.number,
        title: m.title,
        subtitle: m.subtitle,
        question: m.question,
        description: m.description,
        accent: m.accent,
        estimatedHours: m.estimatedHours,
        order: (mi + 1) * 10,
        status: "published",
        lessonCount: m.lessons.length,
        curriculumVersion: "v1",
        seededAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    });

    m.lessons.forEach((title, li) => {
      ops.push({
        ref: doc(db, "seModules", m.id, "lessons", slug(title)),
        data: {
          title,
          order: (li + 1) * 10,
          status: "published",
          difficulty: m.number <= 2 ? "Beginner" : m.number <= 7 ? "Intermediate" : "Advanced",
          estimatedMinutes: 25,
          xpReward: 20,
          coinReward: 8,
          // Video is modelled from the start so publishing the YouTube series
          // later is a data change, never a schema change. See
          // lib/softwareEngineering.js's videoState.
          video: { status: "coming-soon", provider: "youtube", youtubeId: "", url: "", durationSeconds: null, chapters: [], transcript: "", notesUrl: "" },
          updatedAt: serverTimestamp(),
        },
      });
    });
  });

  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
    onProgress?.(Math.min(i + 450, ops.length), ops.length);
  }

  return { written: ops.length };
}
