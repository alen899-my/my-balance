"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminPageAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
}

export interface AdminPageFilter {
  key: string;
  label: string;
  type: "select" | "input" | "date" | "daterange";
  placeholder?: string;
  options?: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
}

export interface AdminPageTab {
  key: string;
  label: string;
  count?: number;
}

export interface AdminPageStat {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export interface AdminPageLayoutProps {
  // ── Header
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  badge?: { label: string; variant?: "default" | "success" | "warning" | "danger" | "info" };

  // ── Actions
  actions?: AdminPageAction[];

  // ── Stats strip
  stats?: AdminPageStat[];

  // ── Tabs
  tabs?: AdminPageTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;

  // ── Filters
  filters?: AdminPageFilter[];
  onClearFilters?: () => void;
  filterCount?: number;               // controlled externally if needed

  // ── Search
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  // ── Content
  children: React.ReactNode;

  // ── Misc
  loading?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TrendUp = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M2 11l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrendDown = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M2 5l4 4 3-3 5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LoaderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const badgeStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  danger:  "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  info:    "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900",
};

const actionStyles: Record<string, string> = {
  primary:     "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
  secondary:   "bg-transparent text-foreground border-border hover:bg-accent",
  destructive: "bg-transparent text-destructive border-destructive/30 hover:bg-destructive/8",
};

const trendStyles = {
  up:      "text-emerald-600 dark:text-emerald-400",
  down:    "text-red-500 dark:text-red-400",
  neutral: "text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPageLayout({
  title,
  description,
  breadcrumbs,
  badge,
  actions = [],
  stats = [],
  tabs,
  activeTab,
  onTabChange,
  filters = [],
  onClearFilters,
  filterCount,
  searchPlaceholder = "Search…",
  searchValue = "",
  onSearchChange,
  children,
  loading = false,
  className,
}: AdminPageLayoutProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFiltersCount =
    filterCount ??
    filters.filter((f) => f.value && f.value !== "").length;

  return (
    <div className={cn("flex flex-col min-h-full", className)}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="bg-background border-b border-border px-4 sm:px-6 py-4">

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 mb-2 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <span className="text-muted-foreground/50"><ChevronRight /></span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                {badge && (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    badgeStyles[badge.variant ?? "default"]
                  )}>
                    {badge.label}
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  disabled={action.disabled || loading}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                    actionStyles[action.variant ?? "secondary"]
                  )}
                >
                  {action.icon && (
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-end gap-0 mt-4 -mb-4 border-b-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                  activeTab === tab.key
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full min-w-[18px] h-[18px] px-1 text-[10px] font-medium",
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="bg-background border-b border-border px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-foreground leading-none">
                    {stat.value}
                  </span>
                  {stat.trendValue && stat.trend && (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-medium",
                      trendStyles[stat.trend]
                    )}>
                      {stat.trend === "up" ? <TrendUp /> : stat.trend === "down" ? <TrendDown /> : null}
                      {stat.trendValue}
                    </span>
                  )}
                </div>
                {stat.sub && (
                  <span className="text-[11px] text-muted-foreground/70">{stat.sub}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolbar (search + filters) ───────────────────────── */}
      {(onSearchChange || filters.length > 0) && (
        <div className="bg-background border-b border-border px-4 sm:px-6 py-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">

            {/* Search */}
            {onSearchChange && (
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-3 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            {/* Filter toggle */}
            {filters.length > 0 && (
              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border transition-colors cursor-pointer",
                  filtersOpen || activeFiltersCount > 0
                    ? "border-primary/40 text-primary bg-primary/5"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <FilterIcon />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {/* Clear filters */}
            {activeFiltersCount > 0 && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-accent transition-colors cursor-pointer"
              >
                <XIcon /> Clear
              </button>
            )}
          </div>

          {/* Expanded filter row */}
          {filtersOpen && filters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {filters.map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1 min-w-[140px]">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {filter.label}
                  </label>
                  {filter.type === "select" ? (
                    <Select
                      value={filter.value ?? ""}
                      onChange={(val) => filter.onChange(val)}
                      options={filter.options ?? []}
                      placeholder={filter.placeholder ?? "All"}
                    />
                  ) : (
                    <input
                      type={filter.type === "date" ? "date" : "text"}
                      value={filter.value ?? ""}
                      onChange={(e) => filter.onChange(e.target.value)}
                      placeholder={filter.placeholder}
                      className="h-8 w-full px-2.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring dark:[color-scheme:dark]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] flex items-start justify-center pt-16 pointer-events-none">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background border border-border rounded-lg px-4 py-2 shadow-sm">
              <LoaderIcon />
              Loading…
            </div>
          </div>
        )}
        <div className="px-4 sm:px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminPageLayout;