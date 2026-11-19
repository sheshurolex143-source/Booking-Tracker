import React from 'react';
import { AlertTriangle, RotateCcw, Search } from 'lucide-react';
import {
  BookingCategory,
  FilterCriteria,
  RefundStatus,
  SortOption,
  VALID_CATEGORIES,
  VALID_STATUSES,
} from '../../shared/types';

interface FilterToolbarProps {
  filters: FilterCriteria;
  providers: string[];
  staleCount: number;
  thresholdDays: number;
  onChange: (next: Partial<FilterCriteria>) => void;
  onReset: () => void;
  onOpenSettings: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  providers,
  staleCount,
  thresholdDays,
  onChange,
  onReset,
  onOpenSettings,
}) => {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'All' ||
    filters.category !== 'All' ||
    filters.provider !== '' ||
    filters.onlyNeedsFollowUp;

  const statusTabs: Array<'All' | RefundStatus> = ['All', ...VALID_STATUSES];

  return (
    <section
      aria-label="Filter and search cancellations"
      className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="cancellation-search" className="sr-only">
            Search bookings, providers, or reference numbers
          </label>
          <input
            id="cancellation-search"
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search booking title, provider, reference #, or notes..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ onlyNeedsFollowUp: !filters.onlyNeedsFollowUp })}
            aria-pressed={filters.onlyNeedsFollowUp}
            className={`h-10 px-3.5 inline-flex items-center gap-2 text-xs font-semibold rounded-md border transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              filters.onlyNeedsFollowUp
                ? 'bg-red-700 text-white border-red-700 hover:bg-red-800'
                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Needs Follow-Up</span>
            <span
              className={`font-mono tabular-nums ${
                filters.onlyNeedsFollowUp ? 'text-red-100' : 'text-red-600'
              }`}
            >
              ({staleCount})
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="h-10 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 whitespace-nowrap shrink-0 font-mono tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Threshold: {thresholdDays}d
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div
          role="group"
          aria-label="Filter by refund status"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md w-full xl:w-auto"
        >
          {statusTabs.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ status })}
                aria-pressed={active}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'All' ? 'All' : status}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="provider-filter" className="text-xs text-slate-500 whitespace-nowrap">
              Provider
            </label>
            <select
              id="provider-filter"
              value={filters.provider}
              onChange={(e) => onChange({ provider: e.target.value })}
              className="h-9 px-2.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="category-filter" className="text-xs text-slate-500 whitespace-nowrap">
              Type
            </label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) =>
                onChange({ category: e.target.value as 'All' | BookingCategory })
              }
              className="h-9 px-2.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Types</option>
              {VALID_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-select" className="text-xs text-slate-500 whitespace-nowrap">
              Sort
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) => onChange({ sortBy: e.target.value as SortOption })}
              className="h-9 px-2.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="overdue_first">Overdue First</option>
              <option value="newest_updated">Recently Updated</option>
              <option value="oldest_updated">Oldest Updated</option>
              <option value="amount_desc">Highest Refund</option>
              <option value="cancellation_desc">Cancellation Date</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="h-9 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
