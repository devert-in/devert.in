// Global feature switches - the admin's on/off button for every DeVert feature.
//
// What exists is defined HERE, in code (so a new feature is one entry, and no
// seed script has to run before the admin panel shows it). Whether each one is
// on lives in ONE Firestore doc, system/featureFlags = { disabled: { key: true } },
// readable by anyone (firestore.rules' system/** is public-read, admin-write).
// A key missing from `disabled` is ON - so a brand-new feature ships enabled.
//
// Enforced by components/feature-gate.jsx, mounted in all three apps' root
// layouts (devert.in, campus.devert.in, careers.devert.in): a switched-off
// feature's pages render a "turned off" screen for EVERYONE, admins included,
// and its nav entries disappear. /admin itself is never switchable, so the
// switch can always be turned back on.
//
// Scope, stated plainly: this is a UI kill switch. It stops every page, link
// and nav entry, which is what real users go through - but it does not rewrite
// firestore.rules per collection, so a script calling the Firestore SDK
// directly is not stopped by it. Do that per feature in the rules if a switch
// ever has to hold against a hostile client.
//
// Shared with devert-campus and devert-careers via their jsconfig `@/*`
// fallback - no JSX and no class names here, same as lib/useScrolled.js.

import { useSyncExternalStore } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

// `paths` are devert.in path prefixes; `app` marks a whole standalone site.
export const FEATURES = Object.freeze([
  // Social
  { key: "pulse",         group: "Social",   label: "Pulse",           desc: "The social feed.",                    paths: ["/pulse"] },
  { key: "community",     group: "Social",   label: "Communities",     desc: "Dev communities.",                    paths: ["/community"] },
  { key: "broadcast",     group: "Social",   label: "Broadcast",       desc: "Live build sessions.",                paths: ["/broadcast"] },
  { key: "intel",         group: "Social",   label: "Intel",           desc: "News, drops and dev updates.",        paths: ["/intel"] },
  // Practice & compete
  { key: "arena",         group: "Compete",  label: "Arena",           desc: "Timed coding battles.",               paths: ["/arena"] },
  { key: "grind",         group: "Compete",  label: "Daily Grind",     desc: "Daily coding reps.",                  paths: ["/grind"] },
  { key: "contests",      group: "Compete",  label: "Contests",        desc: "Timed contests.",                     paths: ["/contest"] },
  { key: "events",        group: "Compete",  label: "Events",          desc: "Hackathons, workshops, meetups.",     paths: ["/events"] },
  { key: "missions",      group: "Compete",  label: "Missions",        desc: "Community bounties & tasks.",         paths: ["/missions"] },
  { key: "build",         group: "Compete",  label: "Build",           desc: "Challenges & sprints.",               paths: ["/build"] },
  { key: "devert100",     group: "Compete",  label: "DeVert 100",      desc: "The 100-day DSA run.",                paths: ["/devert100"] },
  { key: "ranks",         group: "Compete",  label: "Ranks",           desc: "Leaderboards and the rank ladder.",   paths: ["/ranks"] },
  // Learn
  { key: "learn",         group: "Learn",    label: "Learn",           desc: "Learning paths.",                     paths: ["/learn"] },
  { key: "fundamentals",  group: "Learn",    label: "SE Fundamentals", desc: "The Software Engineering course.",    paths: ["/fundamentals"] },
  { key: "prep",          group: "Learn",    label: "Prep",            desc: "Placement & interview prep.",         paths: ["/prep"] },
  // Build & showcase
  { key: "shipyard",      group: "Showcase", label: "Shipyard",        desc: "Project docking.",                    paths: ["/shipyard"] },
  { key: "showcase",      group: "Showcase", label: "Showcase",        desc: "Dock projects, get judged.",          paths: ["/showcase"] },
  { key: "workplace",     group: "Showcase", label: "Workplace",       desc: "The workplace surface.",              paths: ["/workplace"] },
  { key: "opportunities", group: "Showcase", label: "Opportunities",   desc: "Internships, jobs, programs.",        paths: ["/opportunities"] },
  // Money & growth
  { key: "wallet",        group: "Money",    label: "Wallet",          desc: "Coin balance and payouts.",           paths: ["/wallet"] },
  { key: "ambassador",    group: "Money",    label: "Ambassador",      desc: "Campus ambassador programme.",        paths: ["/ambassador"] },
  // Placeholders
  { key: "open-source",   group: "Coming soon", label: "Open Source",   desc: "Placeholder page.",                  paths: ["/open-source"] },
  { key: "labs",          group: "Coming soon", label: "Labs",          desc: "Placeholder page.",                  paths: ["/labs"] },
  { key: "stories",       group: "Coming soon", label: "Stories",       desc: "Placeholder page.",                  paths: ["/stories"] },
  { key: "organizations", group: "Coming soon", label: "Organizations", desc: "Placeholder page.",                  paths: ["/organizations"] },
  // Whole sites
  { key: "campus",        group: "Sites",    label: "DeVert Campus",   desc: "All of campus.devert.in.",            paths: [], app: "campus" },
  { key: "careers",       group: "Sites",    label: "DeVert Careers",  desc: "All of careers.devert.in.",           paths: [], app: "careers" },
]);

const BY_KEY = Object.fromEntries(FEATURES.map(f => [f.key, f]));

// Never switchable, whatever the doc says - the way back in must stay open.
const ALWAYS_ON = ["/admin", "/login", "/reset-password"];

const CACHE_KEY = "devert.featureFlags";
const EMPTY = Object.freeze({ disabled: Object.freeze({}), ready: false });

let state = EMPTY;
let started = false;
const listeners = new Set();

function emit(next) {
  state = next;
  listeners.forEach(l => l());
}

// Last-known flags from localStorage, so a returning visitor to a switched-off
// page gets the "turned off" screen immediately rather than a flash of the
// page first. The live snapshot corrects it within one round trip.
function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) return { disabled: JSON.parse(raw) || {}, ready: false };
  } catch { /* private mode - just wait for the snapshot */ }
  return EMPTY;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  state = readCache();
  onSnapshot(
    doc(db, "system", "featureFlags"),
    snap => {
      const disabled = (snap.exists() && snap.data().disabled) || {};
      try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(disabled)); } catch { /* noop */ }
      emit({ disabled, ready: true });
    },
    // Fail OPEN: an unreadable flags doc must never take the whole site down.
    () => emit({ disabled: {}, ready: true }),
  );
}

function subscribe(cb) {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Live `{ disabled, ready }` - one shared listener for the whole tab. */
export function useFeatureFlags() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function isFeatureEnabled(flags, key) {
  return !(flags?.disabled || {})[key];
}

export function featureByKey(key) {
  return BY_KEY[key] || null;
}

/** The feature that owns a devert.in pathname, or null for unswitchable pages. */
export function featureForPath(pathname) {
  if (!pathname || ALWAYS_ON.some(p => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return FEATURES.find(f => f.paths.some(p => pathname === p || pathname.startsWith(`${p}/`))) || null;
}

/** Is a nav href (internal path or an absolute site URL) switched off? */
export function isHrefDisabled(flags, href) {
  if (!href) return false;
  if (/^https?:\/\/campus\./.test(href)) return !isFeatureEnabled(flags, "campus");
  if (/^https?:\/\/careers\./.test(href)) return !isFeatureEnabled(flags, "careers");
  const f = featureForPath(href.split(/[?#]/)[0]);
  return !!f && !isFeatureEnabled(flags, f.key);
}

/** Admin-only by firestore.rules (system/** write is isAdmin()). */
export async function setFeatureEnabled(key, enabled) {
  await setDoc(
    doc(db, "system", "featureFlags"),
    { disabled: { [key]: !enabled }, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
