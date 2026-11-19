import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  MessageSquarePlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  calculateDaysSinceUpdate,
  formatCurrencyAmount,
  formatShortDate,
  isRecordStale,
} from '../../shared/logic';
import { CancellationRecord, RefundStatus } from '../../shared/types';

interface CancellationTableProps {
  records: CancellationRecord[];
  thresholdDays: number;
  loading: boolean;
  hasActiveFilters: boolean;
  onSelectRecord: (record: CancellationRecord) => void;
  onQuickFollowUp: (record: CancellationRecord) => void;
  onEditRecord: (record: CancellationRecord) => void;
  onDeleteRecord: (record: CancellationRecord) => void;
  onClearFilters: () => void;
  onCreateNew: () => void;
}

function getStatusTextClass(status: RefundStatus): string {
  switch (status) {
    case RefundStatus.Refunded:
      return 'text-emerald-700';
    case RefundStatus.Processing:
      return 'text-blue-700';
    case RefundStatus.Pending:
      return 'text-amber-700';
    case RefundStatus.Disputed:
      return 'text-red-700';
  }
}

export const CancellationTable: React.FC<CancellationTableProps> = ({
  records,
  thresholdDays,
  loading,
  hasActiveFilters,
  onSelectRecord,
  onQuickFollowUp,
  onEditRecord,
  onDeleteRecord,
  onClearFilters,
  onCreateNew,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyRef = (e: React.MouseEvent, record: CancellationRecord) => {
    e.stopPropagation();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(record.referenceNumber).catch(() => {});
    }
    setCopiedId(record.id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === record.id ? null : prev));
    }, 1500);
  };

  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading cancellations"
        className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200"
      >
        {[0, 1, 2, 3, 4].map((idx) => (
          <div key={idx} className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-56 bg-slate-100 rounded" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-6 py-14 text-center">
        <h3 className="font-display text-base font-semibold text-slate-900">
          {hasActiveFilters
            ? 'No cancellations match these filters'
            : 'No booking cancellations tracked yet'}
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
          {hasActiveFilters
            ? 'Try widening your search query, switching statuses, or clearing active filters to see all tracked refunds.'
            : 'Log your first flight, hotel, rail, or event cancellation to monitor refund reference numbers and overdue follow-ups.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Log First Cancellation
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      data-testid="cancellation-ledger"
    >
      {/* Desktop Data Grid */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th scope="col" className="py-3 pl-5 pr-3">
                Booking &amp; Provider
              </th>
              <th scope="col" className="py-3 px-3">
                Reference &amp; Dates
              </th>
              <th scope="col" className="py-3 px-3 text-right">
                Expected Refund
              </th>
              <th scope="col" className="py-3 px-3">
                Status
              </th>
              <th scope="col" className="py-3 px-3">
                Last Updated
              </th>
              <th scope="col" className="py-3 pl-3 pr-5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {records.map((record) => {
              const daysSince = calculateDaysSinceUpdate(record);
              const stale = isRecordStale(record, thresholdDays);

              return (
                <tr
                  key={record.id}
                  data-stale={stale ? 'true' : 'false'}
                  className={`transition-colors duration-150 ${
                    stale
                      ? 'bg-red-50/55 hover:bg-red-50/90'
                      : 'bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-3 max-w-[300px]">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="text-left group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                    >
                      <span className="block font-medium text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                        {record.bookingTitle}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {record.provider} <span aria-hidden="true">·</span> {record.category}
                      </span>
                    </button>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-medium text-slate-800 tabular-nums">
                        {record.referenceNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyRef(e, record)}
                        aria-label={`Copy reference ${record.referenceNumber}`}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
                      >
                        {copiedId === record.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                      Cancelled {formatShortDate(record.cancellationDate)}
                    </p>
                  </td>

                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatCurrencyAmount(record.expectedRefundAmount, record.currency)}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-slate-400">
                      {record.currency}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold ${getStatusTextClass(record.status)}`}>
                      {record.status}
                    </span>
                    {stale && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-red-700 tabular-nums">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Overdue · {daysSince}d silent</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-700 tabular-nums block">
                      {formatShortDate(record.lastUpdatedAt)}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs tabular-nums ${
                        stale ? 'text-red-700 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {record.status === RefundStatus.Refunded
                        ? 'Completed'
                        : daysSince === 0
                        ? 'Updated today'
                        : `${daysSince} ${daysSince === 1 ? 'day' : 'days'} ago`}
                    </span>
                  </td>

                  <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickFollowUp(record)}
                        aria-label={`Log follow-up for ${record.bookingTitle}`}
                        className={`px-2.5 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                          stale
                            ? 'bg-white text-red-700 border-red-300 hover:bg-red-700 hover:text-white hover:border-red-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Follow-Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditRecord(record)}
                        aria-label={`Edit ${record.bookingTitle}`}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(record)}
                        aria-label={`Delete ${record.bookingTitle}`}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Hairline List */}
      <div className="md:hidden divide-y divide-slate-200">
        {records.map((record) => {
          const daysSince = calculateDaysSinceUpdate(record);
          const stale = isRecordStale(record, thresholdDays);

          return (
            <article
              key={record.id}
              data-stale={stale ? 'true' : 'false'}
              className={`p-4 space-y-3 ${stale ? 'bg-red-50/55' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectRecord(record)}
                  className="text-left min-w-0 flex-1"
                >
                  <h3 className="font-medium text-sm text-slate-900 leading-snug">
                    {record.bookingTitle}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {record.provider} <span aria-hidden="true">·</span> {record.category}
                  </p>
                </button>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {formatCurrencyAmount(record.expectedRefundAmount, record.currency)}
                  </p>
                  <p className={`mt-0.5 text-xs font-semibold ${getStatusTextClass(record.status)}`}>
                    {record.status}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <span className="font-mono tabular-nums">
                  Ref {record.referenceNumber} · Cancelled {formatShortDate(record.cancellationDate)}
                </span>
                {stale ? (
                  <span className="inline-flex items-center gap-1 font-medium text-red-700 tabular-nums">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    Overdue · {daysSince}d silent
                  </span>
                ) : (
                  <span className="text-slate-500 tabular-nums">
                    {record.status === RefundStatus.Refunded
                      ? `Settled ${formatShortDate(record.lastUpdatedAt)}`
                      : daysSince === 0
                      ? 'Updated today'
                      : `Updated ${daysSince}d ago`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onQuickFollowUp(record)}
                  aria-label={`Log follow-up for ${record.bookingTitle}`}
                  className={`flex-1 h-10 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-md border transition-colors ${
                    stale
                      ? 'bg-red-700 text-white border-red-700 hover:bg-red-800'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log Follow-Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditRecord(record)}
                  aria-label={`Edit ${record.bookingTitle}`}
                  className="h-10 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRecord(record)}
                  aria-label={`Delete ${record.bookingTitle}`}
                  className="h-10 px-3 text-xs font-medium text-red-700 bg-white border border-slate-200 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
