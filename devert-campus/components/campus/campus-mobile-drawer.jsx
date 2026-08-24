"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { NAV_ITEMS, GROUP_ORDER, NAV_GROUP_LABELS } from "@/lib/campusNavConfig";
import { MANAGE_TABS } from "@/components/campus/campus-manage";
import { TRACK_CATALOG } from "@/lib/dailyLearning";
import { CampusSidebarSearch } from "@/components/campus/campus-search";
import { fetchLanguages } from "@/lib/programming";
import { fetchSubjects } from "@/lib/csCore";
import { LanguageLogo } from "@/components/campus/language-logo";
import { APTITUDE_CATEGORIES } from "@/lib/aptitude";
import { GATE_SECTIONS } from "@/components/campus/gate/gate-app";
import { CODELAB_CATEGORIES } from "@/lib/codelab";
import { fetchPublishedCompanies } from "@/lib/companyPrep";
import { fetchWeekTests, todayISO } from "@/lib/dailyLearning";

const COLLAPSE_STORAGE_KEY = "campus-drawer-collapsed-groups";
// Same 4 phase filters as ContestsSidebarList in campus-app.jsx - small and
// static enough that duplicating the literal array here is simpler than
// exporting it across an app-shell/peer-component boundary for 4 strings.
const CONTEST_PHASES = [
  { key: "all", label: "All Contests" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

// The hamburger drawer - full parity with the desktop rail by construction
// (it renders every NAV_ITEMS entry, the rail's own filter is just a subset
// of visibility flags), a real cross-module search (CampusSidebarSearch,
// shared with the desktop CampusContextSidebar - see lib/campusSearch.js so
// "java" finds the Java curriculum here too, not just module names), plus
// nested lists of Manage/Daily Learning/Programming/CS Core's own sub-items.
// See lib/campusNavConfig.js for the single source of truth this and
// CampusTopNavbar/CampusBottomNav all share.
export function CampusMobileDrawer({
  open, onClose, institution, slug, tab, goTab, isInstAdmin, hiddenTabKeys,
  onJumpToManage, onJumpToTrack, onJumpToDsaCategory, onJumpToCompany, onJumpToContestPhase, onJumpToAssessment,
  onSearchSelect, onRequestExit, themeToggle, onSignOut,
}) {
  const prefersReducedMotion = useReducedMotion();
  // Lazy initializer, not a mount effect - localStorage is already
  // synchronously available the first time this ever renders (this
  // component only lives inside the client-only Campus workspace tree),
  // so there's no need for a read-then-setState render pass.
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); } // corrupt/old value - just start fully expanded
  });
  // Which nav items with a nested sub-list (manage/learning/programming/
  // csCore) currently have that sub-list expanded - starts empty (all
  // collapsed) so the drawer opens as a compact single-level list; expanding
  // one is a click on its own chevron (see DrawerRow's hasNested handling
  // below), independent of tapping the row itself (which still navigates).
  // Not persisted - a fresh, predictable collapsed state each time the
  // drawer opens is preferable to remembering which item was last expanded.
  const [expandedNested, setExpandedNested] = useState(() => new Set());
  const toggleNested = (key) => setExpandedNested(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  // Programming/CS Core's own catalogs, fetched once per drawer session (on
  // first open, not on mount - this component stays mounted at all times so
  // an unconditional fetch would run for every Campus visit, not just the
  // ones where a phone user actually opens the drawer) and nested under
  // their nav item the same way Manage/Daily Learning already are.
  const [languages, setLanguages] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [assessmentTests, setAssessmentTests] = useState(null);
  useEffect(() => {
    if (!open) return;
    if (languages === null) fetchLanguages().then(setLanguages).catch(() => setLanguages([]));
    if (subjects === null) fetchSubjects().then(setSubjects).catch(() => setSubjects([]));
    if (companies === null) fetchPublishedCompanies().then(setCompanies).catch(() => setCompanies([]));
    if (assessmentTests === null) fetchWeekTests(slug).then(setAssessmentTests).catch(() => setAssessmentTests([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey);
      localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Focus moves into the drawer on open and back to whatever had focus
  // before (almost always the hamburger button) on close - the drawer
  // doesn't need a direct reference to that trigger element for this to
  // work correctly.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => panelRef.current?.querySelector("input")?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      if (previouslyFocusedRef.current instanceof HTMLElement) previouslyFocusedRef.current.focus();
    };
  }, [open]);

  const handleClose = () => onClose();

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { handleClose(); return; }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(panelRef.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter(i => !hiddenTabKeys?.has(i.key)),
    [hiddenTabKeys],
  );
  const groupedItems = useMemo(() => (
    GROUP_ORDER.map(groupKey => ({
      key: groupKey,
      label: NAV_GROUP_LABELS[groupKey],
      items: visibleNavItems.filter(i => i.parentGroup === groupKey).sort((a, b) => a.order - b.order),
    })).filter(g => g.items.length > 0)
  ), [visibleNavItems]);

  const goToNavItem = (key) => { goTab(key); handleClose(); };
  const jumpToManageSubTab = (key) => { onJumpToManage(key); handleClose(); };
  const jumpToTrackItem = (key) => { onJumpToTrack(key); handleClose(); };
  // Programming/CS Core don't have Manage/Daily Learning's own bespoke jump
  // mechanism - they're two of the four modules CampusWorkspace's shared
  // search-select handler already knows how to remount straight to a deep
  // link (see campus-app.jsx's handleSearchSelect), so nested clicks here
  // reuse that instead of inventing a third jump prop pair.
  const jumpToLanguage = (langId) => { onSearchSelect({ tab: "programming", params: { lang: langId } }); handleClose(); };
  const jumpToSubject = (subjectId) => { onSearchSelect({ tab: "csCore", params: { subject: subjectId } }); handleClose(); };
  // GATE is the fourth remount-compatible module (same mechanism as
  // Programming/CS Core above). Aptitude has no per-category URL param (only
  // per-topic), so its nested rows just open the tab itself rather than
  // pretending to deep-link into one category. DSA's category filter lives
  // directly in CampusWorkspace's own state, so it gets its own dedicated
  // prop (onJumpToDsaCategory) instead of the shared search-select jump.
  const jumpToGateSection = (key) => { onSearchSelect({ tab: "gate", params: { section: key } }); handleClose(); };
  const jumpToAptitude = () => { goTab("aptitude"); handleClose(); };
  const jumpToDsaCat = (cat) => { onJumpToDsaCategory(cat); handleClose(); };
  const jumpToCompanyItem = (companyId) => { onJumpToCompany(companyId); handleClose(); };
  const jumpToContestPhaseItem = (phase) => { onJumpToContestPhase(phase); handleClose(); };
  const jumpToAssessmentItem = (date) => { onJumpToAssessment(date); handleClose(); };

  const rowStyle = (active) => ({
    background: active ? CAMPUS.gradientPrimary : "transparent",
    color: active ? "#fff" : CAMPUS.ink,
    boxShadow: active ? `0 3px 10px ${tint(CAMPUS.teal, 28)}` : "none",
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="lg:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={handleClose} aria-hidden="true" />
          <motion.div
            ref={panelRef} role="dialog" aria-modal="true" aria-label="Campus navigation"
            onKeyDown={handleKeyDown}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[320px] flex flex-col"
            style={{ background: CAMPUS.surface, boxShadow: CAMPUS.shadowLg }}
            initial={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}>

            <div className="flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden"
                style={institution?.logoUrl ? { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` } : { background: CAMPUS.teal, color: "#fff" }}>
                {institution?.logoUrl
                  ? <img src={institution.logoUrl} alt="" className="w-full h-full object-cover" />
                  : institution?.name?.slice(0, 2).toUpperCase()}
              </div>
              <b className="flex-1 min-w-0 leading-snug text-[13.5px]" style={{ color: CAMPUS.ink }}>
                {institution?.name}
              </b>
              <button onClick={handleClose} aria-label="Close navigation"
                className="flex items-center justify-center flex-shrink-0 rounded-lg" style={{ width: 44, height: 44, color: CAMPUS.inkFaint }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-3 pt-3 flex-shrink-0">
              <CampusSidebarSearch slug={slug} hiddenTabKeys={hiddenTabKeys} collapsed={false}
                onSelect={(item) => { onSearchSelect(item); handleClose(); }} />
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
              {groupedItems.map(group => {
                const collapsed = collapsedGroups.has(group.key);
                return (
                  <div key={group.key} className="flex flex-col gap-0.5">
                    {group.label && (
                      <button onClick={() => toggleGroup(group.key)}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-[9.5px] font-mono tracking-widest"
                        style={{ color: CAMPUS.inkFaint, minHeight: 32 }}
                        aria-expanded={!collapsed}>
                        {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                        {group.label.toUpperCase()}
                      </button>
                    )}
                    {!collapsed && group.items.map(item => {
                      const hasNested = (item.key === "manage" && isInstAdmin)
                        || ["learning", "programming", "csCore", "aptitude", "gate", "dsa", "companyVault", "contests", "assessments"].includes(item.key);
                      const nestedOpen = expandedNested.has(item.key);
                      return (
                      <div key={item.key}>
                        <DrawerRow icon={item.icon} label={item.label} active={tab === item.key}
                          onClick={() => goToNavItem(item.key)} rowStyle={rowStyle}
                          hasNested={hasNested} nestedOpen={nestedOpen} onToggleNested={() => toggleNested(item.key)} />
                        {item.key === "manage" && isInstAdmin && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {MANAGE_TABS.map(t => (
                              <button key={t.key} onClick={() => jumpToManageSubTab(t.key)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "learning" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {TRACK_CATALOG.map(t => (
                              <button key={t.key} onClick={() => jumpToTrackItem(t.key)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "programming" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {languages === null ? (
                              <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>
                            ) : languages.map(lang => (
                              <button key={lang.id} onClick={() => jumpToLanguage(lang.id)}
                                className="flex items-center gap-2 rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                <LanguageLogo name={lang.name} size={13} /> {lang.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "csCore" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {subjects === null ? (
                              <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>
                            ) : subjects.map(subject => (
                              <button key={subject.id} onClick={() => jumpToSubject(subject.id)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {subject.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "aptitude" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {APTITUDE_CATEGORIES.map(cat => (
                              <button key={cat} onClick={jumpToAptitude}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "gate" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {GATE_SECTIONS.map(s => (
                              <button key={s.key} onClick={() => jumpToGateSection(s.key)}
                                className="flex items-center gap-2 rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                <s.icon size={13} className="flex-shrink-0" /> {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "dsa" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3 max-h-[50vh] overflow-y-auto" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {[...CODELAB_CATEGORIES].sort((a, b) => a.localeCompare(b)).map(cat => (
                              <button key={cat} onClick={() => jumpToDsaCat(cat)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "companyVault" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3 max-h-[50vh] overflow-y-auto" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {companies === null ? (
                              <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>
                            ) : companies.map(c => (
                              <button key={c.id} onClick={() => jumpToCompanyItem(c.id)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "contests" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {CONTEST_PHASES.map(f => (
                              <button key={f.key} onClick={() => jumpToContestPhaseItem(f.key)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {f.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {item.key === "assessments" && nestedOpen && (
                          <div className="flex flex-col gap-0.5 ml-4 pl-3" style={{ borderLeft: `1px solid ${CAMPUS.line}` }}>
                            {assessmentTests === null ? (
                              <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>Loading...</p>
                            ) : assessmentTests.length === 0 ? (
                              <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>None published yet</p>
                            ) : assessmentTests.map(t => (
                              <button key={t.date} disabled={t.date > todayISO()} onClick={() => jumpToAssessmentItem(t.date)}
                                className="flex items-center rounded-lg px-3 text-[12.5px] font-medium text-left transition-colors disabled:opacity-50"
                                style={{ minHeight: 40, color: CAMPUS.inkSoft }}>
                                {t.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="flex-shrink-0 px-3 py-3 flex flex-col gap-0.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <div className="flex items-center justify-between px-2" style={{ minHeight: 44 }}>
                <span className="text-[12.5px] font-medium" style={{ color: CAMPUS.inkSoft }}>Theme</span>
                {themeToggle}
              </div>
              <button onClick={() => { handleClose(); onRequestExit("/"); }}
                className="flex items-center rounded-lg px-2 text-[13px] font-medium text-left"
                style={{ minHeight: 44, color: CAMPUS.inkSoft }}>
                Return to DeVert
              </button>
              <button onClick={() => { handleClose(); onSignOut(); }}
                className="flex items-center rounded-lg px-2 text-[13px] font-medium text-left"
                style={{ minHeight: 44, color: CAMPUS.bad }}>
                Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// hasNested items (Manage/Daily Learning/Programming/CS Core) get a second,
// separate chevron button so tapping the row still navigates to that tab
// while tapping the chevron only expands/collapses its sub-list - the two
// gestures shouldn't be conflated onto one tap target.
function DrawerRow({ icon: Icon, label, active, onClick, rowStyle, hasNested, nestedOpen, onToggleNested }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-left transition-colors"
        style={{ minHeight: 44, ...rowStyle(active) }}>
        <Icon size={16} className="flex-shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {hasNested && (
        <button onClick={(e) => { e.stopPropagation(); onToggleNested(); }}
          aria-label={nestedOpen ? `Collapse ${label}` : `Expand ${label}`} aria-expanded={nestedOpen}
          className="flex-shrink-0 flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, color: CAMPUS.inkFaint }}>
          {nestedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
    </div>
  );
}
