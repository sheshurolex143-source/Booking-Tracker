import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Pencil, Trash2, X } from 'lucide-react';
import {
  calculateDaysSinceUpdate,
  formatCurrencyAmount,
  formatShortDate,
  isRecordStale,
  validateFollowUpInput,
} from '../../shared/logic';
import {
  CancellationRecord,
  FollowUpInput,
  RefundStatus,
  VALID_STATUSES,
} from '../../shared/types';
import { ApiRequestError } from '../services/api';

interface DetailDrawerProps {
  record: CancellationRecord | null;
  thresholdDays: number;
  focusFollowUp: boolean;
  onClose: () => void;
  onLogFollowUp: (id: string, input: FollowUpInput) => Promise<void>;
  onEdit: (record: CancellationRecord) => void;
  onDelete: (record: CancellationRecord) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  record,
  thresholdDays,
  focusFollowUp,
  onClose,
  onLogFollowUp,
  onEdit,
  onDelete,
}) => {
  const [note, setNote] = useState('');
  const [nextStatus, setNextStatus] = useState<RefundStatus>(RefundStatus.Pending);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!record) return;
    setNote('');
    setNextStatus(record.status);
    setError(null);
    if (focusFollowUp) {
      window.setTimeout(() => noteInputRef.current?.focus(), 60);
    }
  }, [record, focusFollowUp]);

  useEffect(() => {
    if (!record) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [record, submitting, onClose]);

  if (!record) return null;

  const daysSince = calculateDaysSinceUpdate(record);
  const stale = isRecordStale(record, thresholdDays);

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(record.referenceNumber).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateFollowUpInput({ note, status: nextStatus });
    if (!validation.valid) {
      setError(validation.errors.note || validation.errors.status || 'Invalid follow-up input.');
      return;
    }

    setSubmitting(true);
    try {
      await onLogFollowUp(record.id, { note: note.trim(), status: nextStatus });
      setNote('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.fields.note || err.message);
      } else {
        setError('Could not save follow-up update. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/40"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2
              id="detail-drawer-title"
              className="font-display text-base font-semibold text-slate-900 leading-snug"
            >
              {record.bookingTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {record.provider} <span aria-hidden="true">·</span> {record.category}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-2 -mr-2 text-slate-400 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {stale && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-red-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs text-red-900 leading-relaxed">
                <p className="font-semibold">
                  Follow-up overdue by {daysSince - thresholdDays}{' '}
                  {daysSince - thresholdDays === 1 ? 'day' : 'days'}
                </p>
                <p className="mt-0.5 text-red-800">
                  Last updated {daysSince} days ago (exceeds your {thresholdDays}-day escalation
                  threshold). Log an update below to refresh the clock.
                </p>
              </div>
            </div>
          )}

          {/* Structured Key-Value Metadata */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 pb-5 border-b border-slate-200 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Expected Refund</dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {formatCurrencyAmount(record.expectedRefundAmount, record.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Refund Status</dt>
              <dd className="mt-1 font-semibold text-slate-900">{record.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Reference Number</dt>
              <dd className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-xs font-medium text-slate-800">
                  {record.referenceNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy reference number"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Last Updated</dt>
              <dd className="mt-1 font-mono text-xs text-slate-800 tabular-nums">
                {formatShortDate(record.lastUpdatedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Booking Date</dt>
              <dd className="mt-1 font-mono text-xs text-slate-800 tabular-nums">
                {formatShortDate(record.bookingDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Cancellation Date</dt>
              <dd className="mt-1 font-mono text-xs text-slate-800 tabular-nums">
                {formatShortDate(record.cancellationDate)}
              </dd>
            </div>
          </dl>

          {/* Log Follow-Up Form */}
          <form onSubmit={handleFollowUpSubmit} noValidate className="space-y-3 pb-5 border-b border-slate-200">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Log Follow-Up Update
            </h3>
            <p className="text-xs text-slate-500">
              Recording a call, email, or status update refreshes the last updated timestamp to
              today.
            </p>

            {error && (
              <div
                role="alert"
                className="p-2.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="followup-status" className="block text-xs font-medium text-slate-700 mb-1">
                Update Status
              </label>
              <select
                id="followup-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as RefundStatus)}
                className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {VALID_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="followup-note" className="block text-xs font-medium text-slate-700 mb-1">
                Follow-Up Note <span className="text-red-600">*</span>
              </label>
              <textarea
                ref={noteInputRef}
                id="followup-note"
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., Called billing desk, confirmed refund batch scheduled for Friday..."
                className="w-full p-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 px-4 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Logging Update...' : 'Save Follow-Up & Refresh Timestamp'}
            </button>
          </form>

          {/* Chronological Follow-Up History */}
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Follow-Up Timeline
            </h3>
            {record.followUpHistory.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                {record.notes || 'No follow-up updates logged yet.'}
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {record.followUpHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">
                        {formatShortDate(entry.createdAt)}
                      </span>
                      {entry.statusAfter && (
                        <span className="font-medium text-slate-700">
                          Status: {entry.statusAfter}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-800 leading-relaxed">{entry.note}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit Record</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(record)}
            className="px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
