import { DEVERT100_CATALOG, catalogEntry } from "@/lib/devert100Catalog";
import { DEVERT100_START, DEVERT100_TOTAL_DAYS, dateForDay } from "@/lib/devert100";

// SEO for DeVert100.
//
// WHY THIS IS WORTH DOING PROPERLY: the run is 100 pages, each about one named,
// heavily-searched problem. "two sum java solution" and "leetcode 283
// explanation" are queries people actually type, and before this every one of
// those pages shared the site's default title and had no description at all -
// so Google had 100 near-identical entries and no reason to surface any of
// them.
//
// Everything here reads the BUILD-TIME catalogue, never Firestore. Titles must
// exist for all 100 pages at `next build`, and a build that cannot reach the
// network must not silently emit 100 untitled pages.

export const DEVERT100_URL = "https://devert.in/devert100";

export function dayUrl(day) {
  return `${DEVERT100_URL}/day/${day}`;
}

// Titles lead with the PROBLEM, not the day.
//
// "Day 42" is meaningless to a searcher and identical-looking across 100
// results; the problem name is the thing they typed. The day number still
// appears, after the name, because it is what makes this page different from
// the thousand other pages about Two Sum.
export function dayMetadata(day) {
  const entry = catalogEntry(day);
  const n = Number(day);

  if (!entry) {
    // Out-of-range days are still statically generated (the route builds 1..100
    // from a constant), so they need *something* - but they must never be
    // indexed as thin pages.
    return {
      title: `Day ${n} - DeVert100`,
      robots: { index: false, follow: true },
    };
  }

  const lc = /^\d+$/.test(entry.problemNumber) ? ` (LeetCode ${entry.problemNumber})` : "";
  const title = `${entry.name}${lc} - ${entry.pattern} | DeVert100 Day ${n}`;

  const description = [
    entry.blurb,
    `Pattern: ${entry.pattern}.`,
    `Brute force, the optimal approach, a dry run, Java code and edge cases -`,
    `day ${n} of the DeVert100 100-day DSA run.`,
  ].join(" ").slice(0, 300);

  return {
    title,
    description,
    keywords: [
      entry.name,
      `${entry.name} solution`,
      `${entry.name} java`,
      entry.pattern,
      entry.topic,
      "DSA",
      "LeetCode",
      "DeVert100",
    ],
    alternates: { canonical: dayUrl(n) },
    openGraph: {
      type: "article",
      title: `${entry.name} - ${entry.pattern}`,
      description: entry.blurb || description,
      url: dayUrl(n),
      siteName: "DeVert",
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.name} - ${entry.pattern}`,
      description: entry.blurb || description,
    },
  };
}

// TechArticle rather than the more obvious Course: a Course is the whole run,
// and this page is one explanatory article within it. Marking each day as a
// Course would put 100 competing Course entities on one site.
export function dayJsonLd(day) {
  const entry = catalogEntry(day);
  if (!entry) return [];

  const published = dateForDay(entry.day).toISOString();

  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `${entry.name} - ${entry.pattern}`,
      abstract: entry.blurb,
      url: dayUrl(entry.day),
      datePublished: published,
      inLanguage: "en",
      proficiencyLevel: entry.difficulty || "Beginner",
      keywords: [entry.name, entry.pattern, entry.topic, "DSA", "Java"].join(", "),
      about: { "@type": "Thing", name: entry.topic },
      isPartOf: { "@type": "Course", name: "DeVert100", url: DEVERT100_URL },
      publisher: {
        "@type": "Organization",
        name: "DeVert",
        url: "https://devert.in",
      },
    },
    // Lets Google render the day as a step in the run rather than an orphan.
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "DeVert", item: "https://devert.in" },
        { "@type": "ListItem", position: 2, name: "DeVert100", item: DEVERT100_URL },
        { "@type": "ListItem", position: 3, name: `Day ${entry.day}: ${entry.name}`, item: dayUrl(entry.day) },
      ],
    },
  ];
}

// The landing page is the Course itself, with every day as a syllabus entry.
// This is the markup that can earn a course rich result, and the reason each
// day is a TechArticle rather than a Course of its own.
export function runJsonLd() {
  const end = dateForDay(DEVERT100_TOTAL_DAYS).toISOString().slice(0, 10);

  return [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "DeVert100",
      description:
        "A 100-day, execution-first DSA run. One problem a day with the pattern, " +
        "the brute force, the optimal approach, a dry run, Java code, edge cases " +
        "and the interview takeaway already written down.",
      url: DEVERT100_URL,
      inLanguage: "en",
      isAccessibleForFree: true,
      teaches: [...new Set(DEVERT100_CATALOG.map(d => d.topic))],
      provider: { "@type": "Organization", name: "DeVert", url: "https://devert.in" },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: `PT1H`,
        startDate: DEVERT100_START,
        endDate: end,
      },
      syllabusSections: DEVERT100_CATALOG.map(d => ({
        "@type": "Syllabus",
        name: `Day ${d.day}: ${d.name}`,
        description: d.blurb,
        url: dayUrl(d.day),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "DeVert100 - all 100 days",
      numberOfItems: DEVERT100_CATALOG.length,
      itemListElement: DEVERT100_CATALOG.map(d => ({
        "@type": "ListItem",
        position: d.day,
        name: d.name,
        url: dayUrl(d.day),
      })),
    },
  ];
}

// Sitemap entries: the landing page plus all 100 days.
//
// lastModified is the day's OWN date, not the build time. Stamping every page
// with "now" on every deploy tells crawlers all 100 changed whenever anything
// did, which is both false and a good way to have the signal ignored.
export function devert100SitemapEntries() {
  return [
    {
      url: DEVERT100_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...DEVERT100_CATALOG.map(d => ({
      url: dayUrl(d.day),
      lastModified: dateForDay(d.day),
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
