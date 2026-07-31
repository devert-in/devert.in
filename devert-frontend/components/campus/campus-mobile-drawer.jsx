"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Search, ChevronRight, ChevronDown, ShieldCheck } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { NAV_ITEMS, GROUP_ORDER, NAV_GROUP_LABELS } from "@/lib/campusNavConfig";
import { MANAGE_TABS } from "@/components/campus/campus-manage";

const COLLAPSE_STORAGE_KEY = "campus-drawer-collapsed-groups";

// The hamburger drawer - full parity with the desktop rail by construction
// (it renders every NAV_ITEMS entry, the rail's own filter is just a subset
// of visibility flags), plus an admin-only nested list of Manage's own
// sub-tabs and a quick-search over both. See lib/campusNavConfig.js for the
// single source of truth this and CampusNavRail/CampusBottomNav all share.
export function CampusMobileDrawer({
  open, onClose, institution, tab, goTab, isInstAdmin, hiddenTabKeys,
  onJumpToManage, onRequestExit, themeToggle, onSignOut,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");
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
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
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
    const raf = requestAnimationFrame(() => searchInputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
      if (previouslyFocusedRef.current instanceof HTMLElement) previouslyFocusedRef.current.focus();
    };
  }, [open]);

  // Clears the search query as part of the SAME event that closes the
  // drawer (not a separate effect reacting to `open`) - every internal
  // close path (backdrop, X, Escape, selecting a destination) routes
  // through this instead of the raw onClose prop.
  const handleClose = () => { setQuery(""); onClose(); };

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

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const navMatches = visibleNavItems.filter(i => i.label.toLowerCase().includes(q));
    const manageMatches = isInstAdmin ? MANAGE_TABS.filter(t => t.label.toLowerCase().includes(q)) : [];
    return { navMatches, manageMatches };
  }, [query, visibleNavItems, isInstAdmin]);

  const goToNavItem = (key) => { goTab(key); handleClose(); };
  const jumpToManageSubTab = (key) => { onJumpToManage(key); handleClose(); };

  const rowStyle = (active) => ({
    background: active ? CAMPUS.gradientPrimary : "transparent",
    color: active ? "#fff" : CAMPUS.ink,
    boxShadow: active ? "0 3px 10px rgba(99,102,241,0.28)" : "none",
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
                  ? <img src={institution.logoUrl} alt="" className="w-full h-full object-contain" />
                  : institution?.name?.slice(0, 2).toUpperCase()}
              </div>
              <b className="flex-1 min-w-0 truncate text-[13.5px]" style={{ color: CAMPUS.ink }} title={institution?.name}>
                {institution?.name}
              </b>
              <button onClick={handleClose} aria-label="Close navigation"
                className="flex items-center justify-center flex-shrink-0 rounded-lg" style={{ width: 44, height: 44, color: CAMPUS.inkFaint }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-3 pt-3 flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
                <input ref={searchInputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search navigation..." aria-label="Search navigation"
                  className="w-full pl-9 pr-3 rounded-lg text-[13px] outline-none"
                  style={{ height: 40, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
              {searchResults ? (
                searchResults.navMatches.length === 0 && searchResults.manageMatches.length === 0 ? (
                  <p className="px-2 py-4 text-[12.5px] text-center" style={{ color: CAMPUS.inkFaint }}>No matches.</p>
                ) : (
                  <>
                    {searchResults.navMatches.map(item => (
                      <DrawerRow key={item.key} icon={item.icon} label={item.label} active={tab === item.key}
                        onClick={() => goToNavItem(item.key)} rowStyle={rowStyle} />
                    ))}
                    {searchResults.manageMatches.map(t => (
                      <DrawerRow key={`manage-${t.key}`} icon={ShieldCheck} label={`Manage → ${t.label}`}
                        onClick={() => jumpToManageSubTab(t.key)} rowStyle={rowStyle} />
                    ))}
                  </>
                )
              ) : (
                groupedItems.map(group => {
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
                      {!collapsed && group.items.map(item => (
                        <div key={item.key}>
                          <DrawerRow icon={item.icon} label={item.label} active={tab === item.key}
                            onClick={() => goToNavItem(item.key)} rowStyle={rowStyle} />
                          {item.key === "manage" && isInstAdmin && (
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
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
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

function DrawerRow({ icon: Icon, label, active, onClick, rowStyle }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium text-left transition-colors"
      style={{ minHeight: 44, ...rowStyle(active) }}>
      <Icon size={16} className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
