"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;
export type ColumnAlign = "left" | "center" | "right";
export type ColumnFilterType = "text" | "select" | "date" | "number";

export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  header: string;
  accessor?: (row: T) => unknown;
  cell?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  filterOptions?: { label: string; value: string }[];
  filterPlaceholder?: string;
  width?: string;
  minWidth?: string;
  align?: ColumnAlign;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  sticky?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  noTruncate?: boolean;
}

export interface RowAction<T = Record<string, unknown>> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T, rowIndex: number) => void;
  variant?: "default" | "danger";
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey?: string | ((row: T) => string | number);
  rowActions?: RowAction<T>[];
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  bulkActions?: {
    label: string;
    icon?: ReactNode;
    onClick: (selectedKeys: Set<string | number>, selectedRows: T[]) => void;
    variant?: "default" | "danger";
  }[];
  defaultSortKey?: string;
  defaultSortDir?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;
  externalSort?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  externalPagination?: boolean;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  externalSearch?: boolean;
  searchPlaceholder?: string;
  columnFilters?: boolean;
  externalFilter?: boolean;
  columnFilterValues?: Record<string, string>;
  onColumnFilterChange?: (key: string, value: string) => void;
  toolbarSlot?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  onRowClick?: (row: T, rowIndex: number) => void;
  striped?: boolean;
  compact?: boolean;
  maxHeight?: string;
  hideToolbar?: boolean;
  className?: string;
  tableClassName?: string;
  rowClassName?: (row: T, index: number) => string;
  tfoot?: ReactNode;
  footerSummarySlot?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

const IconSort = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1.5L8.5 4.5H3.5L6 1.5Z" fill="currentColor" opacity="0.4"/>
    <path d="M6 10.5L3.5 7.5H8.5L6 10.5Z" fill="currentColor" opacity="0.4"/>
  </svg>
);
const IconSortAsc = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1.5L8.5 4.5H3.5L6 1.5Z" fill="currentColor"/>
    <path d="M6 10.5L3.5 7.5H8.5L6 10.5Z" fill="currentColor" opacity="0.25"/>
  </svg>
);
const IconSortDesc = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1.5L8.5 4.5H3.5L6 1.5Z" fill="currentColor" opacity="0.25"/>
    <path d="M6 10.5L3.5 7.5H8.5L6 10.5Z" fill="currentColor"/>
  </svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronFirst = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 4v8M8 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronLast = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M12 4v8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconDotsVertical = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="4"  r="1.2" fill="currentColor"/>
    <circle cx="8" cy="8"  r="1.2" fill="currentColor"/>
    <circle cx="8" cy="12" r="1.2" fill="currentColor"/>
  </svg>
);
const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getRowKey<T>(row: T, rowKey: DataTableProps<T>["rowKey"], index: number): string | number {
  if (!rowKey) return index;
  if (typeof rowKey === "function") return rowKey(row);
  return (row as Record<string, unknown>)[rowKey] as string | number ?? index;
}

function getValue<T>(row: T, col: ColumnDef<T>): unknown {
  if (col.accessor) return col.accessor(row);
  return (row as Record<string, unknown>)[col.key];
}

function matchesSearch<T>(row: T, columns: ColumnDef<T>[], term: string): boolean {
  if (!term) return true;
  const lower = term.toLowerCase();
  return columns.some((col) => {
    const val = getValue(row, col);
    return String(val ?? "").toLowerCase().includes(lower);
  });
}

function matchesColumnFilters<T>(
  row: T,
  columns: ColumnDef<T>[],
  filterValues: Record<string, string>
): boolean {
  return Object.entries(filterValues).every(([key, val]) => {
    if (!val) return true;
    const col = columns.find((c) => c.key === key);
    if (!col) return true;
    const cellVal = String(getValue(row, col) ?? "").toLowerCase();
    return cellVal.includes(val.toLowerCase());
  });
}

function sortData<T>(
  data: T[],
  columns: ColumnDef<T>[],
  sortKey: string,
  sortDir: SortDirection
): T[] {
  if (!sortKey || !sortDir) return data;
  const col = columns.find((c) => c.key === sortKey);
  return [...data].sort((a, b) => {
    const av = col ? getValue(a, col) : (a as Record<string, unknown>)[sortKey];
    const bv = col ? getValue(b, col) : (b as Record<string, unknown>)[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return sortDir === "asc" ? -1 : 1;
    if (bv == null) return sortDir === "asc" ? 1 : -1;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    const as = String(av).toLowerCase();
    const bs = String(bv).toLowerCase();
    const cmp = as < bs ? -1 : as > bs ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW ACTION MENU
// ─────────────────────────────────────────────────────────────────────────────

function ActionMenu<T>({
  row,
  rowIndex,
  actions,
}: {
  row: T;
  rowIndex: number;
  actions: RowAction<T>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const visible = actions.filter((a) => !a.hidden?.(row));
  if (!visible.length) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer",
          "text-[var(--dt-cell-fg-muted)] hover:text-[var(--dt-cell-fg)] hover:bg-[var(--dt-row-hover)]",
          open && "bg-[var(--dt-row-hover)] text-[var(--dt-cell-fg)]"
        )}
      >
        <IconDotsVertical />
      </button>

      {open && (
        <div className="dt-action-menu">
          {visible.map((action, i) => {
            const isDisabled = action.disabled?.(row);
            return (
              <button
                key={i}
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick(row, rowIndex);
                }}
                className={cn(
                  "dt-action-item",
                  action.variant === "danger" && "dt-action-danger"
                )}
              >
                {action.icon && (
                  <span style={{ width: "0.875rem", height: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {action.icon}
                  </span>
                )}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLUMN FILTER INPUT
// ─────────────────────────────────────────────────────────────────────────────

function ColumnFilter<T>({
  col,
  value,
  onChange,
}: {
  col: ColumnDef<T>;
  value: string;
  onChange: (v: string) => void;
}) {
  if (col.filterType === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="dt-col-filter-input"
        style={{ cursor: "pointer" }}
      >
        <option value="">{col.filterPlaceholder ?? "All"}</option>
        {col.filterOptions?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (col.filterType === "date") {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="dt-col-filter-input"
      />
    );
  }
  return (
    <input
      type={col.filterType === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={col.filterPlaceholder ?? "Filter…"}
      onClick={(e) => e.stopPropagation()}
      className="dt-col-filter-input"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  rowKey,
  rowActions,
  selectable,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  bulkActions,
  defaultSortKey,
  defaultSortDir = null,
  onSortChange,
  externalSort = false,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  totalCount,
  currentPage: controlledPage,
  onPageChange,
  onPageSizeChange,
  externalPagination = false,
  searchable = false,
  searchValue: controlledSearch,
  onSearchChange,
  externalSearch = false,
  searchPlaceholder = "Search…",
  columnFilters: showColumnFilters = false,
  externalFilter = false,
  columnFilterValues: controlledColFilters,
  onColumnFilterChange,
  toolbarSlot,
  emptyState,
  loading = false,
  onRowClick,
  striped = false,
  compact = false,
  maxHeight = "calc(100vh - 280px)",
  hideToolbar = false,
  className,
  tableClassName,
  rowClassName,
  tfoot,
  footerSummarySlot,
}: DataTableProps<T>) {
  // ── Internal state ──────────────────────────────────────────────────────────
  const [internalSearch, setInternalSearch] = useState("");
  const [internalSortKey, setInternalSortKey] = useState<string>(defaultSortKey ?? "");
  const [internalSortDir, setInternalSortDir] = useState<SortDirection>(defaultSortKey ? defaultSortDir : null);
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const [internalColFilters, setInternalColFilters] = useState<Record<string, string>>({});
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(new Set());
  const [colFiltersVisible, setColFiltersVisible] = useState(showColumnFilters);

  // ── Resolved values ─────────────────────────────────────────────────────────
  const searchVal   = controlledSearch        !== undefined ? controlledSearch        : internalSearch;
  const sortKey     = internalSortKey;
  const sortDir     = internalSortDir;
  const page        = controlledPage          !== undefined ? controlledPage          : internalPage;
  const pageSize    = internalPageSize;
  const colFilterVals = controlledColFilters  !== undefined ? controlledColFilters    : internalColFilters;
  const selectedKeys  = controlledSelectedKeys !== undefined ? controlledSelectedKeys : internalSelected;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: string) => {
    let nextDir: SortDirection = "asc";
    if (sortKey === key) {
      nextDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
    }
    setInternalSortKey(nextDir ? key : "");
    setInternalSortDir(nextDir);
    onSortChange?.(key, nextDir);
  }, [sortKey, sortDir, onSortChange]);

  const handleColFilter = useCallback((key: string, value: string) => {
    if (!externalFilter) {
      setInternalColFilters((prev) => ({ ...prev, [key]: value }));
      setInternalPage(1);
    }
    onColumnFilterChange?.(key, value);
  }, [externalFilter, onColumnFilterChange]);

  const handleSearch = useCallback((v: string) => {
    if (!externalSearch) {
      setInternalSearch(v);
      setInternalPage(1);
    }
    onSearchChange?.(v);
  }, [externalSearch, onSearchChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    const keys = checked
      ? new Set(data.map((row, i) => getRowKey(row, rowKey, i)))
      : new Set<string | number>();
    if (!controlledSelectedKeys) setInternalSelected(keys);
    onSelectionChange?.(keys);
  }, [data, rowKey, controlledSelectedKeys, onSelectionChange]);

  const handleSelectRow = useCallback((key: string | number, checked: boolean) => {
    const next = new Set(selectedKeys);
    checked ? next.add(key) : next.delete(key);
    if (!controlledSelectedKeys) setInternalSelected(next);
    onSelectionChange?.(next);
  }, [selectedKeys, controlledSelectedKeys, onSelectionChange]);

  // ── Processed data ──────────────────────────────────────────────────────────
  const processed = useMemo(() => {
    let rows = [...data];
    if (!externalSearch && searchVal)
      rows = rows.filter((r) => matchesSearch(r, columns, searchVal));
    if (!externalFilter)
      rows = rows.filter((r) => matchesColumnFilters(r, columns, colFilterVals));
    if (!externalSort && sortKey && sortDir)
      rows = sortData(rows, columns, sortKey, sortDir);
    return rows;
  }, [data, columns, searchVal, colFilterVals, sortKey, sortDir, externalSearch, externalFilter, externalSort]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const total      = totalCount ?? processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    if (externalPagination || !pagination) return processed;
    const start = (safePage - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, safePage, pageSize, pagination, externalPagination]);

  const handlePageChange = (p: number) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    if (!controlledPage) setInternalPage(clamped);
    onPageChange?.(clamped);
  };

  const handlePageSizeChange = (s: number) => {
    setInternalPageSize(s);
    if (!controlledPage) setInternalPage(1);
    onPageSizeChange?.(s);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeFilterCount = Object.values(colFilterVals).filter(Boolean).length;
  const allSelected  = data.length > 0 && data.every((row, i) => selectedKeys.has(getRowKey(row, rowKey, i)));
  const someSelected = !allSelected && data.some((row, i) => selectedKeys.has(getRowKey(row, rowKey, i)));

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("dt-root", className)}>

      {/* ── Toolbar ── */}
      {!hideToolbar && (
        <div className="dt-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, flexWrap: "wrap" }}>

            {/* Search */}
            {searchable && (
              <div className="dt-search-wrap">
                <span className="dt-search-icon"><IconSearch /></span>
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="dt-search-input"
                />
              </div>
            )}

            {/* Column filter toggle */}
            {columns.some((c) => c.filterable) && (
              <button
                onClick={() => setColFiltersVisible((p) => !p)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border transition-colors cursor-pointer text-[var(--dt-cell-fg-muted)]",
                  colFiltersVisible || activeFilterCount > 0
                    ? "border-[var(--primary)] text-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_10%,transparent)]"
                    : "border-[var(--dt-border-strong)] hover:text-[var(--dt-cell-fg)] hover:bg-[var(--dt-row-hover)]"
                )}
              >
                <IconFilter />
                <span className="hidden sm:inline" style={{ fontSize: "0.8125rem" }}>Filters</span>
                {activeFilterCount > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "9999px", width: "1rem", height: "1rem",
                    fontSize: "0.625rem", fontWeight: 600,
                    background: "var(--primary)", color: "var(--primary-foreground)"
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  if (!externalFilter) setInternalColFilters({});
                  columns.forEach((c) => onColumnFilterChange?.(c.key, ""));
                }}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs cursor-pointer transition-colors"
                style={{
                  color: "var(--dt-cell-fg-muted)",
                  border: "1px solid var(--dt-border-strong)",
                  background: "transparent"
                }}
              >
                <IconX /> Clear
              </button>
            )}

            {/* Bulk actions */}
            {selectable && selectedKeys.size > 0 && bulkActions && bulkActions.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "0.25rem", paddingLeft: "0.5rem", borderLeft: "1px solid var(--dt-border-strong)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--dt-cell-fg-muted)", whiteSpace: "nowrap" }}>
                  {selectedKeys.size} selected
                </span>
                {bulkActions.map((ba, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const rows = data.filter((r, idx) => selectedKeys.has(getRowKey(r, rowKey, idx)));
                      ba.onClick(selectedKeys, rows);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium border transition-colors cursor-pointer",
                      ba.variant === "danger"
                        ? "border-[var(--destructive)] text-[var(--destructive)]"
                        : "border-[var(--dt-border-strong)] text-[var(--dt-cell-fg)]"
                    )}
                  >
                    {ba.icon && <span style={{ width: "0.75rem", height: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{ba.icon}</span>}
                    {ba.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar slot */}
          {toolbarSlot && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>{toolbarSlot}</div>
          )}
        </div>
      )}

      {/* ── Scroll area ── */}
      <div className="dt-scroll" style={{ maxHeight }}>
        <table className={cn("dt-table", compact && "dt-compact", tableClassName)}>

          {/* ── THEAD ── */}
          <thead>
            <tr className="dt-header-row">
              {selectable && (
                <th className="dt-col-checkbox">
                  <input
                    type="checkbox"
                    className="dt-checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.sortable && "dt-sortable",
                    sortKey === col.key && sortDir && "dt-sort-active",
                    col.align === "right"  && "dt-align-right",
                    col.align === "center" && "dt-align-center",
                    col.sticky && "dt-sticky",
                    col.hideOnMobile  && "dt-hide-mobile",
                    col.hideOnTablet  && "dt-hide-tablet",
                    col.headerClassName
                  )}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    ...(col.align === "right"  ? { flexDirection: "row-reverse", width: "100%", justifyContent: "flex-start" } : {}),
                    ...(col.align === "center" ? { justifyContent: "center", width: "100%" } : {}),
                  }}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span style={{ flexShrink: 0, opacity: sortKey === col.key && sortDir ? 1 : 0.6 }}>
                        {sortKey === col.key && sortDir === "asc"  ? <IconSortAsc /> :
                         sortKey === col.key && sortDir === "desc" ? <IconSortDesc /> :
                         <IconSort />}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {rowActions && rowActions.length > 0 && (
                <th className="dt-col-actions" />
              )}
            </tr>

            {/* Column filter row */}
            {colFiltersVisible && columns.some((c) => c.filterable) && (
              <tr className="dt-filter-row">
                {selectable && <td />}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      col.sticky && "dt-sticky",
                      col.hideOnMobile && "dt-hide-mobile",
                      col.hideOnTablet && "dt-hide-tablet",
                    )}
                  >
                    {col.filterable ? (
                      <ColumnFilter
                        col={col}
                        value={colFilterVals[col.key] ?? ""}
                        onChange={(v) => handleColFilter(col.key, v)}
                      />
                    ) : null}
                  </td>
                ))}
                {rowActions && rowActions.length > 0 && <td />}
              </tr>
            )}
          </thead>

          {/* ── TBODY ── */}
          <tbody>
            {/* Loading skeleton */}
            {loading && pageRows.length === 0 && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {selectable && <td style={{ padding: "0.75rem" }}><div className="dt-skeleton" style={{ width: "1rem", height: "1rem", borderRadius: "0.25rem" }} /></td>}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(col.hideOnMobile && "dt-hide-mobile", col.hideOnTablet && "dt-hide-tablet")}
                    >
                      <div
                        className="dt-skeleton"
                        style={{ width: `${55 + (i * 13 + col.key.length * 7) % 35}%` }}
                      />
                    </td>
                  ))}
                  {rowActions && <td><div className="dt-skeleton" style={{ width: "1.25rem", height: "1.25rem" }} /></td>}
                </tr>
              ))
            )}

            {/* Empty state */}
            {!loading && pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)}
                >
                  <div className="dt-empty">
                    {emptyState ?? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                          <rect x="4" y="8" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4"/>
                          <path d="M4 14h28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4"/>
                          <path d="M10 20h6M10 23h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4"/>
                        </svg>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>No results found</p>
                        <p style={{ fontSize: "0.75rem" }}>Try adjusting your filters or search query.</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {pageRows.map((row, rowIndex) => {
              const key = getRowKey(row, rowKey, rowIndex);
              const isSelected = selectedKeys.has(key);
              const rClass = rowClassName?.(row, rowIndex);

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={cn(
                    isSelected    && "dt-row-selected",
                    onRowClick    && "dt-row-clickable",
                    loading       && "dt-row-loading",
                    rClass
                  )}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()} style={{ paddingLeft: "0.875rem", paddingRight: "0.5rem" }}>
                      <input
                        type="checkbox"
                        className="dt-checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(key, e.target.checked)}
                      />
                    </td>
                  )}

                  {columns.map((col) => {
                    const rawVal = getValue(row, col);
                    const rendered = col.cell ? col.cell(rawVal, row, rowIndex) : String(rawVal ?? "—");

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          col.align === "right"  && "dt-align-right",
                          col.align === "center" && "dt-align-center",
                          col.sticky && "dt-sticky",
                          col.hideOnMobile && "dt-hide-mobile",
                          col.hideOnTablet && "dt-hide-tablet",
                          col.cellClassName
                        )}
                        style={{ width: col.width, minWidth: col.minWidth }}
                      >
                        {!col.noTruncate ? (
                          <div className="dt-cell-truncate">{rendered}</div>
                        ) : rendered}
                      </td>
                    );
                  })}

                  {rowActions && rowActions.length > 0 && (
                    <td onClick={(e) => e.stopPropagation()} style={{ padding: "0 0.5rem" }}>
                      <ActionMenu row={row} rowIndex={rowIndex} actions={rowActions} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {tfoot && tfoot}
        </table>
      </div>
      
      {footerSummarySlot && (
        <div className="border-t border-[var(--dt-border-strong)] bg-[color-mix(in_oklch,var(--dt-row-hover)_50%,transparent)]">
          {footerSummarySlot}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && (
        <div className="dt-footer">
          {/* Left: info + page size */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem", color: "var(--dt-cell-fg-muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span className="hidden sm:inline">Rows</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                style={{
                  height: "1.75rem", padding: "0 0.375rem", fontSize: "0.75rem",
                  border: "1px solid var(--dt-border-strong)",
                  borderRadius: "calc(var(--radius) * 0.6)",
                  background: "var(--background)", color: "var(--dt-cell-fg)",
                  cursor: "pointer"
                }}
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <span>
              {total === 0 ? "No results" : (
                <>
                  {Math.min((safePage - 1) * pageSize + 1, total)}–{Math.min(safePage * pageSize, total)} of {total.toLocaleString()}
                </>
              )}
            </span>

            {loading && (
              <span style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <IconLoader /> Updating…
              </span>
            )}
          </div>

          {/* Right: page controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button disabled={safePage <= 1} onClick={() => handlePageChange(1)} className="dt-page-btn"><IconChevronFirst /></button>
            <button disabled={safePage <= 1} onClick={() => handlePageChange(safePage - 1)} className="dt-page-btn"><IconChevronLeft /></button>

            {(() => {
              const pages: (number | "…")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (safePage > 3) pages.push("…");
                for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
                if (safePage < totalPages - 2) pages.push("…");
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === "…" ? (
                  <span key={`ell-${i}`} style={{ width: "1.875rem", height: "1.875rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "var(--dt-cell-fg-muted)" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    className={cn("dt-page-btn", safePage === p && "dt-page-active")}
                  >
                    {p}
                  </button>
                )
              );
            })()}

            <button disabled={safePage >= totalPages} onClick={() => handlePageChange(safePage + 1)} className="dt-page-btn"><IconChevronRight /></button>
            <button disabled={safePage >= totalPages} onClick={() => handlePageChange(totalPages)} className="dt-page-btn"><IconChevronLast /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;