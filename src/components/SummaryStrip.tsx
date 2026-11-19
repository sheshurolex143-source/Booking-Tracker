import React from 'react';
import { formatCurrencyAmount } from '../../shared/logic';
import { CurrencyTotal, DashboardSummary } from '../../shared/types';

interface SummaryStripProps {
  summary: DashboardSummary;
  thresholdDays: number;
  onlyNeedsFollowUp: boolean;
  onToggleNeedsFollowUp: () => void;
}

function renderTotals(totals: CurrencyTotal[]): { primary: string; secondary: string } {
  if (totals.length === 0) {
    return { primary: '$0.00', secondary: 'No amounts recorded' };
  }
  const primary = formatCurrencyAmount(totals[0].amount, totals[0].currency);
  if (totals.length === 1) {
    return { primary, secondary: `${totals[0].currency} total` };
  }
  const extras = totals
    .slice(1)
    .map((t) => formatCurrencyAmount(t.amount, t.currency))
    .join(' + ');
  return { primary, secondary: `+ ${extras}` };
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  summary,
  thresholdDays,
  onlyNeedsFollowUp,
  onToggleNeedsFollowUp,
}) => {
  const pendingDisplay = renderTotals(summary.pendingProcessingTotals);
  const refundedDisplay = renderTotals(summary.refundedTotals);

  return (
    <section
      aria-label="Refund summary metrics"
      className="bg-white border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
    >
      <div className="px-5 py-4" data-testid="kpi-total-tracked">
        <p className="text-xs font-medium text-slate-500">Total Tracked</p>
        <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
          {summary.totalCount}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {summary.activeCount} active · {summary.refundedCount} refunded
        </p>
      </div>

      <div className="px-5 py-4" data-testid="kpi-pending-amount">
        <p className="text-xs font-medium text-slate-500">Pending &amp; Processing</p>
        <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
          {pendingDisplay.primary}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums truncate" title={pendingDisplay.secondary}>
          {summary.pendingProcessingCount} open · {pendingDisplay.secondary}
        </p>
      </div>

      <div className="px-5 py-4" data-testid="kpi-refunded-amount">
        <p className="text-xs font-medium text-slate-500">Refunded Total</p>
        <p className="mt-1.5 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
          {refundedDisplay.primary}
        </p>
        <p className="mt-1 text-xs text-slate-500 tabular-nums truncate" title={refundedDisplay.secondary}>
          {summary.refundedCount} settled · {refundedDisplay.secondary}
        </p>
      </div>

      <div
        className={`px-5 py-4 transition-colors duration-150 ${
          summary.staleCount > 0 ? 'bg-red-50/50' : ''
        }`}
        data-testid="kpi-overdue-count"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600">Needs Follow-Up</p>
          <button
            type="button"
            onClick={onToggleNeedsFollowUp}
            className="text-xs font-medium text-red-700 hover:text-red-900 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
          >
            {onlyNeedsFollowUp ? 'Show all' : 'Filter overdue'}
          </button>
        </div>
        <p
          className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${
            summary.staleCount > 0 ? 'text-red-700' : 'text-slate-900'
          }`}
        >
          {summary.staleCount}
        </p>
        <p className="mt-1 text-xs text-slate-600 tabular-nums">
          Unupdated &gt; {thresholdDays} {thresholdDays === 1 ? 'day' : 'days'}
          {summary.disputedCount > 0 ? ` · ${summary.disputedCount} disputed` : ''}
        </p>
      </div>
    </section>
  );
};
