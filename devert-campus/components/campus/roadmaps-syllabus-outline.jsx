import { fetchRoadmapTree, groupModulesByLevel, ROADMAP_LEVELS } from "@/lib/roadmaps";

// A plain, real, server-rendered <h2>/<ol> outline - no "use client", no
// hooks, no interactivity. This is the single biggest SEO win available
// under static export for these two pages: CampusRoadmapsRoute (the real
// interactive UI) is a client component and gives a crawler nothing but
// metadata/JSON-LD until JS hydrates, but the full Level -> Module -> Topic
// tree is already known at build time here, for only 10-20 roadmaps. It's
// deliberately visible to real visitors too (not a hidden keyword div) -
// a genuine, printable "what's in this roadmap" reference, styled minimally
// since the interactive UI above it is the actual product surface.
//
// mode="index": one roadmap per section, titles only (no per-roadmap tree
// read - would be N reads for a list page nobody's asking to see the full
// syllabus of every roadmap at once).
// mode="detail": the full tree for ONE roadmap, every topic title included.
export async function RoadmapsSyllabusOutline({ catalog, roadmap, mode }) {
  if (mode === "index") {
    if (!catalog?.length) return null;
    return (
      <section style={{ maxWidth: 960, margin: "2rem auto 0", padding: "0 1.5rem" }}>
        <h2>Every roadmap</h2>
        <ul>
          {catalog.map((r) => (
            <li key={r.id}>
              <a href={`/roadmaps/${r.slug}`}>{r.title}</a> - {r.tagline}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (!roadmap) return null;
  const tree = await fetchRoadmapTree(roadmap.id).catch(() => []);
  const byLevel = groupModulesByLevel(tree);

  return (
    <section style={{ maxWidth: 960, margin: "2rem auto 0", padding: "0 1.5rem" }}>
      <h2>Full syllabus</h2>
      {byLevel.map((level) => level.modules.length > 0 && (
        <div key={level.key}>
          <h3>{level.label}</h3>
          {level.modules.map((m) => (
            <div key={m.id}>
              <h4>{m.title}</h4>
              <ol>
                {m.topics.map((t) => <li key={t.id}>{t.title}</li>)}
              </ol>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
