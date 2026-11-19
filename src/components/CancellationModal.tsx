import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { validateCancellationInput } from '../../shared/logic';
import {
  BookingCategory,
  CancellationInput,
  CancellationRecord,
  CurrencyCode,
  RefundStatus,
  SUPPORTED_CURRENCIES,
  VALID_CATEGORIES,
  VALID_STATUSES,
} from '../../shared/types';
import { ApiRequestError } from '../services/api';

interface CancellationModalProps {
  open: boolean;
  editingRecord: CancellationRecord | null;
  defaultCurrency: CurrencyCode;
  onClose: () => void;
  onSave: (input: CancellationInput, existingId?: string) => Promise<void>;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  open,
  editingRecord,
  defaultCurrency,
  onClose,
  onSave,
}) => {
  const [bookingTitle, setBookingTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState<BookingCategory>(BookingCategory.Flight);
  const [bookingDate, setBookingDate] = useState('');
  const [cancellationDate, setCancellationDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [expectedRefundAmount, setExpectedRefundAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [status, setStatus] = useState<RefundStatus>(RefundStatus.Pending);
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingRecord) {
      setBookingTitle(editingRecord.bookingTitle);
      setProvider(editingRecord.provider);
      setCategory(editingRecord.category);
      setBookingDate(editingRecord.bookingDate);
      setCancellationDate(editingRecord.cancellationDate);
      setReferenceNumber(editingRecord.referenceNumber);
      setExpectedRefundAmount(String(editingRecord.expectedRefundAmount));
      setCurrency(editingRecord.currency);
      setStatus(editingRecord.status);
      setNotes(editingRecord.notes);
    } else {
      setBookingTitle('');
      setProvider('');
      setCategory(BookingCategory.Flight);
      setBookingDate('');
      setCancellationDate(todayIsoDate());
      setReferenceNumber('');
      setExpectedRefundAmount('');
      setCurrency(defaultCurrency);
      setStatus(RefundStatus.Pending);
      setNotes('');
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, editingRecord, defaultCurrency]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload: CancellationInput = {
      bookingTitle,
      provider,
      category,
      bookingDate,
      cancellationDate,
      referenceNumber,
      expectedRefundAmount,
      currency,
      status,
      notes,
    };

    const validation = validateCancellationInput(payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFormError('Please fix the highlighted validation errors before saving.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSave(payload, editingRecord?.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
        if (Object.keys(err.fields).length > 0) {
          setFieldErrors(err.fields);
        }
      } else {
        setFormError('Could not save cancellation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancellation-modal-title"
    >
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2
              id="cancellation-modal-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              {editingRecord ? 'Edit Cancellation Record' : 'New Cancellation Request'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingRecord
                ? 'Saving changes automatically updates the last updated timestamp.'
                : 'Record booking details, cancellation reference, and expected refund amount.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-800 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto px-6 py-5 space-y-4">
          {formError && (
            <div
              role="alert"
              className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="field-booking-title"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Booking Title <span className="text-red-600">*</span>
              </label>
              <input
                id="field-booking-title"
                type="text"
                value={bookingTitle}
                onChange={(e) => {
                  setBookingTitle(e.target.value);
                  clearFieldError('bookingTitle');
                }}
                placeholder="e.g., Swiss Air LX-41 Zurich to San Francisco"
                aria-invalid={Boolean(fieldErrors.bookingTitle)}
                className={`w-full h-10 px-3 text-sm rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.bookingTitle
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.bookingTitle && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.bookingTitle}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-provider"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Provider / Merchant <span className="text-red-600">*</span>
              </label>
              <input
                id="field-provider"
                type="text"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  clearFieldError('provider');
                }}
                placeholder="e.g., Delta Air Lines, Booking.com"
                aria-invalid={Boolean(fieldErrors.provider)}
                className={`w-full h-10 px-3 text-sm rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.provider
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.provider && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.provider}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-category"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Booking Type
              </label>
              <select
                id="field-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BookingCategory)}
                className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="field-booking-date"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Booking / Travel Date <span className="text-red-600">*</span>
              </label>
              <input
                id="field-booking-date"
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  clearFieldError('bookingDate');
                }}
                aria-invalid={Boolean(fieldErrors.bookingDate)}
                className={`w-full h-10 px-3 text-sm font-mono tabular-nums rounded-md border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.bookingDate
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.bookingDate && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.bookingDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-cancellation-date"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Cancellation Date <span className="text-red-600">*</span>
              </label>
              <input
                id="field-cancellation-date"
                type="date"
                value={cancellationDate}
                onChange={(e) => {
                  setCancellationDate(e.target.value);
                  clearFieldError('cancellationDate');
                }}
                aria-invalid={Boolean(fieldErrors.cancellationDate)}
                className={`w-full h-10 px-3 text-sm font-mono tabular-nums rounded-md border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.cancellationDate
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.cancellationDate && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.cancellationDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-reference-number"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Cancellation / Refund Ref # <span className="text-red-600">*</span>
              </label>
              <input
                id="field-reference-number"
                type="text"
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value);
                  clearFieldError('referenceNumber');
                }}
                placeholder="e.g., RF-2026-88412"
                aria-invalid={Boolean(fieldErrors.referenceNumber)}
                className={`w-full h-10 px-3 text-sm font-mono rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.referenceNumber
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.referenceNumber && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.referenceNumber}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-status"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Refund Status <span className="text-red-600">*</span>
              </label>
              <select
                id="field-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as RefundStatus);
                  clearFieldError('status');
                }}
                className="w-full h-10 px-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {VALID_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.status}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-refund-amount"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Expected Refund Amount <span className="text-red-600">*</span>
              </label>
              <input
                id="field-refund-amount"
                type="number"
                step="0.01"
                min="0"
                value={expectedRefundAmount}
                onChange={(e) => {
                  setExpectedRefundAmount(e.target.value);
                  clearFieldError('expectedRefundAmount');
                }}
                placeholder="0.00"
                aria-invalid={Boolean(fieldErrors.expectedRefundAmount)}
                className={`w-full h-10 px-3 text-sm font-mono tabular-nums rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 ${
                  fieldErrors.expectedRefundAmount
                    ? 'border-red-400 focus:border-red-600'
                    : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {fieldErrors.expectedRefundAmount && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.expectedRefundAmount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="field-currency"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Currency <span className="text-red-600">*</span>
              </label>
              <select
                id="field-currency"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value as CurrencyCode);
                  clearFieldError('currency');
                }}
                className="w-full h-10 px-3 text-sm font-mono rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="field-notes"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Follow-Up Notes
              </label>
              <textarea
                id="field-notes"
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearFieldError('notes');
                }}
                placeholder="Support case numbers, refund policy details, agent quotes, or card digits..."
                className="w-full p-3 text-sm rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
              {fieldErrors.notes && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.notes}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {submitting
                ? 'Saving...'
                : editingRecord
                ? 'Save Changes'
                : 'Save Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
