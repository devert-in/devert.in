// Single source of truth for every route that appears in EITHER main-site
// nav surface - components/navbar.jsx's mobile bottom dock and
// components/top-navbar.jsx's desktop top pill. top-navbar.jsx's own header
// comment used to warn "keep both files' route lists in sync by hand -
// there's no shared source of truth between them" as a known risk; that risk
// had already materialized (desktop was missing /intel and /prep, both real
// routes the mobile dock already had) before this file existed.
//
// This is deliberately NOT devert-campus/lib/campusNavConfig.js's pattern
// (one flat list, the SAME items, rendered as different widget shapes) -
// the two surfaces here show DIFFERENT scopes on purpose: the mobile dock is
// a curated "used every session" set (a phone-width bar has no room for a
// full sitemap), the desktop pill affords a fuller, categorized menu. So
// each entry below declares which surface(s) it belongs to - `mobile: true`
// for the dock, `desktop: "<group>"` for one of the top pill's dropdown
// groups (or `"standalone"` for Pulse, which sits outside any group) -
// rather than one array both files render identically. Add a route once,
// here; each nav file filters/groups this same array instead of maintaining
// its own separate list.
import {
  Home, Activity, Swords, Radio, GraduationCap, Tv2, Flame, Target, Rocket,
  ClipboardCheck, Anchor, Hammer, Zap, Users, Megaphone,
} from "lucide-react";
import { CAMPUS_URL } from "@/lib/campusUrl";

// DELIBERATELY ABSENT: open-source, labs, stories, organizations.
//
// All four were nav entries whose desc read "Coming soon" and whose route
// rendered a ComingSoonShell - four separate promises with nothing behind
// them, listed in the footer's Connect column and the top bar's More menu.
// A visitor who clicked two of them learned the product is mostly plans.
//
// The pages still exist and still render, so any existing link keeps working;
// they are simply no longer advertised. Add one back here the day it does
// something.
export const NAV_ROUTES = [
  // ---- on the mobile dock (see navbar.jsx's own comment on why Shipyard/
  // Ranks/Logs/Grind/Fundamentals stay off it - deliberate, not an omission) ----
  { key: "home",      icon: Home,           label: "Home",      href: "/" ,        mobile: true },
  { key: "pulse",     icon: Activity,       label: "Pulse",     href: "/pulse",    mobile: true, desktop: "standalone" },
  { key: "arena",     icon: Swords,         label: "Arena",     href: "/arena",    mobile: true, desktop: "build",   desc: "Timed coding battles" },
  { key: "intel",     icon: Radio,          label: "Intel",     href: "/intel",    mobile: true, desktop: "explore", desc: "News, drops, and dev updates" },
  { key: "campus",    icon: GraduationCap,  label: "Campus",    href: CAMPUS_URL,  mobile: true, desktop: "explore", desc: "Learn, practice, prepare" },
  { key: "broadcast", icon: Tv2,            label: "Broadcast", href: "/broadcast",mobile: true, desktop: "connect", desc: "Live build sessions" },
  { key: "events",    icon: Flame,          label: "Events",    href: "/events",   mobile: true, desktop: "explore", desc: "Hackathons, workshops, meetups" },
  { key: "missions",  icon: Target,         label: "Missions",  href: "/missions", mobile: true, desktop: "connect", desc: "Community bounties & tasks" },
  { key: "prep",      icon: ClipboardCheck, label: "Prep",      href: "/prep",     mobile: true, desktop: "build",   desc: "Placement & interview prep" },

  // ---- desktop-only groups (no mobile dock entry) ----
  { key: "opportunities", icon: Radio,        label: "Opportunities", href: "/opportunities", desktop: "explore", desc: "Internships, jobs, programs" },
  { key: "showcase",      icon: Anchor,       label: "Showcase",      href: "/showcase",      desktop: "build",    desc: "Dock projects, get judged" },
  { key: "build",         icon: Hammer,       label: "Build",         href: "/build",         desktop: "build",    desc: "Challenges & sprints" },
  { key: "grind",         icon: Zap,          label: "Grind",         href: "/grind",         desktop: "build",    desc: "Daily coding reps" },
  { key: "devert100",     icon: Rocket,       label: "DeVert 100",    href: "/devert100",     desktop: "build",    desc: "100-day DSA run" },
  { key: "community",     icon: Users,        label: "Community",     href: "/community",     desktop: "connect",  desc: "Join dev communities" },
  { key: "ambassador",    icon: Megaphone,    label: "Ambassador",    href: "/ambassador",    desktop: "more",     desc: "Represent DeVert on your campus" },
];

export const DESKTOP_GROUPS = [
  { key: "explore", label: "Explore" },
  { key: "build",   label: "Build" },
  { key: "connect", label: "Connect" },
  { key: "more",    label: "More" },
];
