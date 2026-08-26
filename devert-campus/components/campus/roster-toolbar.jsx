"use client";

import { useMemo } from "react";
import { ArrowUpDown, Filter, Loader2, Search, X as XIcon } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  DEFAULT_ROSTER_FILTERS, ROSTER_FLAGS, ROSTER_STATUSES, UNSET,
  activeRosterChips, deriveRosterFacets, groupSortOptions, reconcileRosterFilters,
} from "@/lib/rosterFilters";

// Search + sort + cascading Department/Year/Section/Status/Flag controls, shared
// by campus-manage's roster and its pending-requests list.
//
// The parent owns `filters` and `sort` state - this component is presentational
// and derives its dropdown options from the SAME student array the parent
// filters, so what the dropdowns offer and what the list shows can never
// disagree.
//
// Native <select> on purpose: a department with 40 sections is a long list, and
// the OS picker handles that (and touch, and keyboard type-ahead) better than
// any custom popover, at every breakpoint.

const selectStyle = {
  background: CAMPUS.paper,
  border: `1px solid ${CAMPUS.line}`,
  color: CAMPUS.ink,
};

function FacetSelect({ value, onChange, allLabel, options, labelFor }) {
  // Hidden rather than rendered-empty: an institution with a single department
  // has nothing to filter by, and an always-visible dropdown holding one option
  // reads as a control that is broken instead of one that is unnecessary. The
  // `value === "all"` guard matters - once a selection is active the control
  // must stay put even if it narrowed the list to one option, or there is no
  // way left to undo it.
  if (!options.length || (options.length === 1 && value === "all")) return null;
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
      style={selectStyle}>
      <option value="all">{allLabel}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {(labelFor ? labelFor(o) : o.label)} ({o.count})
        </option>
      ))}
    </select>
  );
}

export function RosterToolbar({
  students,           // the FULL unfiltered array - facet options come from here
  filters, onFiltersChange,
  sort, onSortChange,
  sortOptions,
  statsLoading = false,
  showStatusFilters = true,
  resultCount, totalCount,
  searchPlaceholder = "Search by name, roll number or email...",
}) {
  const facets = useMemo(() => deriveRosterFacets(students, filters), [students, filters]);
  const sortGroups = useMemo(() => groupSortOptions(sortOptions), [sortOptions]);
  const chips = useMemo(() => activeRosterChips(filters), [filters]);

  // Reconciled in the handler, not an effect: a stranded downstream selection
  // (IV Year kept while switching to a department with no IV Year students) is a
  // pure function of the new filters, and react-hooks/set-state-in-effect
  // rightly forbids the effect version.
  const set = (patch) => onFiltersChange(reconcileRosterFilters(students, { ...filters, ...patch }));

  const clearAll = () => onFiltersChange({ ...DEFAULT_ROSTER_FILTERS });

  const filtered = resultCount !== totalCount;

  return (
    <div className="mb-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input value={filters.search} onChange={e => set({ search: e.target.value })}
            placeholder={searchPlaceholder} aria-label="Search students"
            className="w-full text-[12.5px] pl-8 pr-8 py-2 rounded-lg outline-none"
            style={selectStyle} />
          {filters.search && (
            <button onClick={() => set({ search: "" })} aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }}>
              <XIcon size={13} />
            </button>
          )}
        </div>

        <div className="relative">
          {statsLoading
            ? <Loader2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none animate-spin" style={{ color: CAMPUS.teal }} />
            : <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: CAMPUS.inkFaint }} />}
          <select value={sort} onChange={e => onSortChange(e.target.value)} aria-label="Sort students"
            className="text-[12.5px] pl-7 pr-3 py-2 rounded-lg outline-none appearance-none"
            style={selectStyle}>
            {sortGroups.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* The cascade. Each of these is fed the facet list its parent's
            selection produced, so picking CSE(AI&ML) leaves the Year dropdown
            offering only that department's years, with that department's
            counts - and a level whose parent narrowed to a single value drops
            out entirely rather than sitting there with nothing to choose. */}
        <FacetSelect value={filters.department} onChange={v => set({ department: v })}
          allLabel="All departments" options={facets.departments} />
        <FacetSelect value={filters.year} onChange={v => set({ year: v })}
          allLabel="All years" options={facets.years} />
        <FacetSelect value={filters.section} onChange={v => set({ section: v })}
          allLabel="All sections" options={facets.sections}
          labelFor={o => (o.value === UNSET ? o.label : `Section ${o.label}`)} />

        {showStatusFilters && (
          <>
            <select value={filters.status} onChange={e => set({ status: e.target.value })} aria-label="Filter by status"
              className="text-[12.5px] px-3 py-2 rounded-lg outline-none" style={selectStyle}>
              {ROSTER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filters.flag} onChange={e => set({ flag: e.target.value })} aria-label="Filter by flag"
              className="text-[12.5px] px-3 py-2 rounded-lg outline-none" style={selectStyle}>
              {ROSTER_FLAGS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </>
        )}
      </div>

      {(chips.length > 0 || filtered) && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          {filtered && (
            <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: CAMPUS.inkSoft }}>
              <Filter size={10} /> {resultCount} of {totalCount}
            </span>
          )}
          {chips.map(c => (
            <button key={c.field} onClick={() => set({ [c.field]: c.reset })}
              title={`Remove this filter`}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1"
              style={{ background: CAMPUS.tealTint, color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}` }}>
              {c.label} <XIcon size={10} />
            </button>
          ))}
          {chips.length > 0 && (
            <button onClick={clearAll} className="text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{ color: CAMPUS.inkFaint }}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
