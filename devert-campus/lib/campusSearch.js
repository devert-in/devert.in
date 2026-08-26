// Campus-wide search: one index over every module AND the content inside it, so
// typing "java" finds the Java curriculum rather than only the Programming tab.
//
// WHY AN INDEX AND NOT LIVE QUERIES. Firestore has no substring matching, so
// "search" here means "fetch the catalogs once, match in memory". Those catalogs
// are small, static, admin-authored, and already fetched by the individual modules
// when opened - so building one shared index costs roughly what opening two
// modules costs, and every keystroke after that is free.
//
// Built LAZILY on the first search interaction and cached for the session. Nobody
// who never opens search pays for it.
//
// WHAT IS INDEXED, and the deliberate depth limit:
//   - every nav destination                     - free, static
//   - Programming languages + their topics      - the main ask ("java")
//   - CS Core subjects + their topics
//   - GATE papers + their subjects              - NOT topics; see below
//   - Aptitude topics, DSA problems
//
// GATE topics are excluded on purpose. That tree is three levels deep across
// three papers (~270 topics) and indexing it costs one query per subject - about
// thirty round trips for a section most Campus users never open. Papers and
// subjects are one query per paper and cover the realistic search ("Algorithms",
// "GATE DA"). If that limit ever needs lifting, lift it here and nowhere else.
//
// Every fetch goes through the existing lib functions, so the audiences filter
// (lib/audiences.js) and the mandatory where("status","==","published") are
// inherited rather than reimplemented - a search result can never surface content
// the reader could not otherwise read.

import { NAV_ITEMS } from "@/lib/campusNavConfig";
import { fetchLanguages, fetchTopics as fetchLangTopics } from "@/lib/programming";
import { fetchSubjects as fetchCsSubjects, fetchTopics as fetchCsTopics } from "@/lib/csCore";
import { fetchPapers, fetchSubjects as fetchGateSubjects } from "@/lib/gate";
import { fetchAptitudeTopics } from "@/lib/aptitude";
import { fetchPublishedProblems } from "@/lib/codelab";

// A result's `tab` is the NAV_ITEMS key to switch to; `params` are the query
// params that module reads on mount to land on the right screen. Programming, CS
// Core, Aptitude and GATE all initialise from useSearchParams() inside a useState
// initialiser - which is exactly why a caller can navigate by writing the URL and
// remounting the module. See campus-app.jsx's searchJump.
function result({ id, title, subtitle, kind, path, tab, params, icon }) {
  return { id, title, subtitle: subtitle || "", kind, path, tab, params: params || {}, icon: icon || null };
}

let _cache = null;
let _cacheKey = null;
let _inflight = null;

// `hiddenTabKeys` is the classroom module-access gate. Filtering here as well as
// in the nav is not decoration: without it, search would happily offer a student
// a route into a module their classroom has switched off.
export async function buildCampusSearchIndex({ slug, hiddenTabKeys } = {}) {
  const key = `${slug}:${[...(hiddenTabKeys || [])].sort().join(",")}`;
  if (_cache && _cacheKey === key) return _cache;
  if (_inflight && _cacheKey === key) return _inflight;

  _cacheKey = key;
  _inflight = (async () => {
    const hidden = hiddenTabKeys || new Set();
    const allow = (tabKey) => !hidden.has(tabKey);
    const out = [];

    for (const item of NAV_ITEMS) {
      if (!allow(item.key)) continue;
      out.push(result({
        id: `nav:${item.key}`,
        title: item.label,
        kind: "Module",
        path: [item.label],
        tab: item.key,
        icon: item.icon,
      }));
    }

    // Every catalog below is best-effort and individually caught. A failed fetch
    // must degrade to "fewer results", never to a broken search box - which one
    // Promise.all without per-source catches would do.
    const safe = (p, fallback) => Promise.resolve(p).catch(() => fallback);

    const [languages, csSubjects, papers, aptitude, problems] = await Promise.all([
      allow("programming") ? safe(fetchLanguages(), []) : [],
      allow("csCore") ? safe(fetchCsSubjects(), []) : [],
      allow("gate") ? safe(fetchPapers(), []) : [],
      allow("aptitude") ? safe(fetchAptitudeTopics(), []) : [],
      allow("dsa") ? safe(fetchPublishedProblems(), []) : [],
    ]);

    for (const lang of languages) {
      out.push(result({
        id: `prog:${lang.id}`,
        title: lang.name,
        subtitle: lang.difficulty || "",
        kind: "Language",
        path: ["Programming", lang.name],
        tab: "programming",
        params: { lang: lang.id },
      }));
    }

    for (const s of csSubjects) {
      out.push(result({
        id: `cs:${s.id}`,
        title: s.name,
        subtitle: s.difficulty || "",
        kind: "Subject",
        path: ["CS Core", s.name],
        tab: "csCore",
        params: { subject: s.id },
      }));
    }

    for (const p of papers) {
      out.push(result({
        id: `gate:${p.id}`,
        title: p.name || p.code,
        subtitle: p.fullName || "",
        kind: "GATE Paper",
        path: ["GATE", p.name || p.code],
        tab: "gate",
        params: { section: "overview" },
      }));
    }

    for (const t of aptitude) {
      out.push(result({
        id: `apt:${t.id}`,
        title: t.name || t.title || t.id,
        subtitle: t.category || "",
        kind: "Aptitude Topic",
        path: ["Aptitude", ...(t.category ? [t.category] : []), t.name || t.title || t.id],
        tab: "aptitude",
        params: { topic: t.id },
      }));
    }

    for (const p of problems) {
      out.push(result({
        id: `dsa:${p.id}`,
        title: p.title,
        subtitle: p.difficulty || "",
        kind: "Problem",
        path: ["DSA", ...(p.category ? [p.category] : []), p.title],
        tab: "dsa",
        params: { problem: p.id },
      }));
    }

    // The second tier - topics inside a language or subject, and subjects inside
    // a GATE paper. One query per parent, all issued in parallel, and only for
    // parents that actually exist. This is what makes a result read
    // "Programming › Java › Loops" rather than just naming the module.
    const [langTopics, csTopics, gateSubjects] = await Promise.all([
      Promise.all(languages.map(l => safe(fetchLangTopics(l.id), []).then(ts => ({ parent: l, topics: ts })))),
      Promise.all(csSubjects.map(s => safe(fetchCsTopics(s.id), []).then(ts => ({ parent: s, topics: ts })))),
      Promise.all(papers.map(p => safe(fetchGateSubjects(p.id), []).then(ss => ({ parent: p, subjects: ss })))),
    ]);

    for (const { parent, topics } of langTopics) {
      for (const t of topics) {
        out.push(result({
          id: `prog:${parent.id}:${t.id}`,
          title: t.title,
          subtitle: parent.name,
          kind: "Topic",
          path: ["Programming", parent.name, ...(t.module ? [t.module] : []), t.title],
          tab: "programming",
          params: { lang: parent.id, topic: t.id },
        }));
      }
    }

    for (const { parent, topics } of csTopics) {
      for (const t of topics) {
        out.push(result({
          id: `cs:${parent.id}:${t.id}`,
          title: t.title,
          subtitle: parent.name,
          kind: "Topic",
          path: ["CS Core", parent.name, ...(t.module ? [t.module] : []), t.title],
          tab: "csCore",
          params: { subject: parent.id, topic: t.id },
        }));
      }
    }

    for (const { parent, subjects } of gateSubjects) {
      for (const s of subjects) {
        out.push(result({
          id: `gate:${parent.id}:${s.id}`,
          title: s.name,
          subtitle: s.weightageMarks ? `~${s.weightageMarks} marks` : "",
          kind: "GATE Subject",
          path: ["GATE", parent.name || parent.code, s.name],
          tab: "gate",
          params: { section: "subjects", subject: s.id },
        }));
      }
    }

    _cache = out;
    _inflight = null;
    return out;
  })();

  return _inflight;
}

// Cleared when the reader's audiences change (signing in or out changes what they
// may see), so a stale index cannot outlive the permissions it was built under.
export function clearCampusSearchIndex() {
  _cache = null;
  _cacheKey = null;
  _inflight = null;
}

// ---------------- matching ----------------

// Ranked, not merely filtered. An exact title match has to beat a mid-word hit in
// some topic's parent name, or searching "java" buries the Java curriculum under
// thirty topics that happen to mention it.
const KIND_WEIGHT = {
  Module: 0,
  Language: 1, Subject: 1, "GATE Paper": 1,
  "GATE Subject": 2,
  Topic: 3, "Aptitude Topic": 3,
  Problem: 4,
};

// Below this length, a query must match at a WORD BOUNDARY. Mid-word substring
// matching is genuinely useful for a longer query ("authentic" finding
// "Authentication") and actively misleading for a short one: "oop" is a substring
// of "Loops", so without this rule an acronym search returns five Loops topics
// and no indication that nothing actually matched. Returning nothing is the more
// honest answer.
const MIN_LEN_FOR_MIDWORD = 4;

// Acronyms students actually type, mapped to words that appear in real content
// titles. Verified against the live catalog: CS Core stores "Database Management
// System" with no acronym anywhere in the document, so "dbms" - which is what a
// student types - matched nothing at all before this existed.
//
// Deliberately a short, hand-checked list rather than generated initials:
// deriving an acronym from "Database Management System" yields "DMS", not "DBMS",
// so the mapping genuinely cannot be computed. Extend it when a query is observed
// to fail, not speculatively.
const QUERY_ALIASES = {
  dbms: ["database"],
  oop: ["object-oriented", "oop"],
  os: ["operating system"],
  dsa: ["data structures", "algorithms"],
  ai: ["artificial intelligence"],
  ml: ["machine learning"],
  coa: ["computer organization"],
  toc: ["theory of computation"],
  cn: ["computer networks"],
  se: ["software engineering"],
  dld: ["digital logic"],
  sql: ["sql"],
};

export function searchCampus(index, rawQuery, { limit = 24 } = {}) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (q.length < 2) return [];
  const allowMidword = q.length >= MIN_LEN_FOR_MIDWORD;
  const wordStart = new RegExp(`\\b${escapeRe(q)}`);
  // Alias hits are scored strictly below every direct match, so expanding an
  // acronym can add results but never outrank something the user literally typed.
  const aliases = QUERY_ALIASES[q] || [];

  const scored = [];
  for (const item of index || []) {
    const title = (item.title || "").toLowerCase();
    const path = item.path.join(" > ").toLowerCase();
    const sub = (item.subtitle || "").toLowerCase();
    // Optional, and only some indexes populate it - see lib/csCore.js's
    // buildCsCoreSearchIndex. Already lowercased by whoever built the index so
    // this stays a plain substring test per keystroke.
    const keywords = item.keywords || "";

    let score;
    if (title === q) score = 0;
    else if (title.startsWith(q)) score = 1;
    else if (wordStart.test(title)) score = 2;
    else if (allowMidword && title.includes(q)) score = 3;
    else if (wordStart.test(path) || wordStart.test(sub)) score = 4;
    else if (allowMidword && (path.includes(q) || sub.includes(q))) score = 5;
    // A hit inside the lesson's own vocabulary (what you'll learn, key points)
    // rather than anywhere in its title or route. This is what makes "deadlock"
    // find the Synchronization lesson that never says "deadlock" in its title -
    // but it ranks below every name match, because a student who typed a word
    // that IS a lesson name wants that lesson first.
    else if (keywords && (wordStart.test(keywords) || (allowMidword && keywords.includes(q)))) score = 6;
    // Scored last on purpose - an acronym expansion is a guess about intent, so
    // it fills the tail of the list rather than competing with a literal match.
    else if (aliases.length && aliases.some(a => title.includes(a) || path.includes(a))) score = 7;
    else continue;

    // Kind is a tiebreaker, never a filter - a deep topic whose title matches
    // exactly still outranks a module that merely contains the word.
    scored.push({ item, score: score * 10 + (KIND_WEIGHT[item.kind] ?? 5) });
  }

  scored.sort((a, b) => a.score - b.score || a.item.title.length - b.item.title.length);
  return scored.slice(0, limit).map(s => s.item);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Groups results by kind for a sectioned dropdown, preserving rank order inside
// each group and the order the groups first appear in the ranked list.
export function groupResults(results) {
  const groups = [];
  const byKind = new Map();
  for (const r of results) {
    if (!byKind.has(r.kind)) {
      byKind.set(r.kind, { kind: r.kind, items: [] });
      groups.push(byKind.get(r.kind));
    }
    byKind.get(r.kind).items.push(r);
  }
  return groups;
}

// The URL a result navigates to. Built here rather than in the component so the
// search UI and campus-app's jump handler cannot disagree about its shape.
export function resultUrl(slug, item) {
  const params = new URLSearchParams({ tab: item.tab, ...item.params });
  return `/${slug}?${params.toString()}`;
}
