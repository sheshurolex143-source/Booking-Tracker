import {
  BookingCategory,
  CancellationInput,
  CancellationRecord,
  CurrencyCode,
  CurrencyTotal,
  DashboardSummary,
  FilterCriteria,
  FollowUpInput,
  RefundStatus,
  SUPPORTED_CURRENCIES,
  VALID_CATEGORIES,
  VALID_STATUSES,
  ValidationResult,
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string' || !ISO_DATE_PATTERN.test(dateStr.trim())) {
    return false;
  }
  const [yStr, mStr, dStr] = dateStr.trim().split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

/**
 * Returns the reference timestamp used for staleness checks:
 * lastUpdatedAt if valid, otherwise cancellationDate at UTC midnight.
 */
export function getReferenceTimestampMs(
  record: Pick<CancellationRecord, 'lastUpdatedAt' | 'cancellationDate'>
): number {
  const updatedMs = Date.parse(record.lastUpdatedAt);
  if (!Number.isNaN(updatedMs)) {
    return updatedMs;
  }
  const cancelMs = Date.parse(`${record.cancellationDate}T00:00:00.000Z`);
  if (!Number.isNaN(cancelMs)) {
    return cancelMs;
  }
  return Date.now();
}

/**
 * Computes whole elapsed days since the record was last updated (clamped to >= 0).
 */
export function calculateDaysSinceUpdate(
  record: Pick<CancellationRecord, 'lastUpdatedAt' | 'cancellationDate'>,
  now: Date = new Date()
): number {
  const refMs = getReferenceTimestampMs(record);
  const diffMs = now.getTime() - refMs;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / MS_PER_DAY);
}

/**
 * A record is stale / needs follow-up if it is NOT completed (status !== Refunded)
 * and elapsed days since lastUpdatedAt (or cancellationDate) strictly exceeds thresholdDays.
 */
export function isRecordStale(
  record: Pick<CancellationRecord, 'status' | 'lastUpdatedAt' | 'cancellationDate'>,
  thresholdDays: number,
  now: Date = new Date()
): boolean {
  if (record.status === RefundStatus.Refunded) {
    return false;
  }
  const safeThreshold = Math.max(1, Math.floor(thresholdDays));
  const days = calculateDaysSinceUpdate(record, now);
  return days > safeThreshold;
}

export function validateCancellationInput(input: Partial<CancellationInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const bookingTitle = typeof input.bookingTitle === 'string' ? input.bookingTitle.trim() : '';
  if (!bookingTitle) {
    errors.bookingTitle = 'Booking title is required.';
  } else if (bookingTitle.length < 2 || bookingTitle.length > 140) {
    errors.bookingTitle = 'Booking title must be between 2 and 140 characters.';
  }

  const provider = typeof input.provider === 'string' ? input.provider.trim() : '';
  if (!provider) {
    errors.provider = 'Provider name is required.';
  } else if (provider.length < 2 || provider.length > 100) {
    errors.provider = 'Provider name must be between 2 and 100 characters.';
  }

  if (input.category !== undefined && !VALID_CATEGORIES.includes(input.category as BookingCategory)) {
    errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
  }

  const bookingDate = typeof input.bookingDate === 'string' ? input.bookingDate.trim() : '';
  if (!bookingDate) {
    errors.bookingDate = 'Booking date is required.';
  } else if (!isValidCalendarDate(bookingDate)) {
    errors.bookingDate = 'Enter a valid booking date (YYYY-MM-DD).';
  }

  const cancellationDate =
    typeof input.cancellationDate === 'string' ? input.cancellationDate.trim() : '';
  if (!cancellationDate) {
    errors.cancellationDate = 'Cancellation date is required.';
  } else if (!isValidCalendarDate(cancellationDate)) {
    errors.cancellationDate = 'Enter a valid cancellation date (YYYY-MM-DD).';
  }

  const referenceNumber =
    typeof input.referenceNumber === 'string' ? input.referenceNumber.trim() : '';
  if (!referenceNumber) {
    errors.referenceNumber = 'Cancellation or refund reference number is required.';
  } else if (referenceNumber.length < 2 || referenceNumber.length > 64) {
    errors.referenceNumber = 'Reference number must be between 2 and 64 characters.';
  }

  const rawAmount = input.expectedRefundAmount;
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    errors.expectedRefundAmount = 'Expected refund amount is required.';
  } else {
    const parsedAmount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount);
    if (!Number.isFinite(parsedAmount)) {
      errors.expectedRefundAmount = 'Expected refund amount must be a valid number.';
    } else if (parsedAmount < 0) {
      errors.expectedRefundAmount = 'Expected refund amount cannot be negative.';
    } else if (parsedAmount > 1_000_000) {
      errors.expectedRefundAmount = 'Expected refund amount exceeds maximum allowed limit.';
    }
  }

  const currency = typeof input.currency === 'string' ? input.currency.trim().toUpperCase() : '';
  if (!currency || !SUPPORTED_CURRENCIES.includes(currency as CurrencyCode)) {
    errors.currency = `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`;
  }

  const status = typeof input.status === 'string' ? input.status.trim() : '';
  if (!status || !VALID_STATUSES.includes(status as RefundStatus)) {
    errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
  }

  if (input.notes !== undefined && typeof input.notes !== 'string') {
    errors.notes = 'Follow-up notes must be plain text.';
  } else if (typeof input.notes === 'string' && input.notes.length > 2000) {
    errors.notes = 'Follow-up notes cannot exceed 2,000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateFollowUpInput(input: Partial<FollowUpInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const note = typeof input.note === 'string' ? input.note.trim() : '';

  if (!note) {
    errors.note = 'Follow-up note is required.';
  } else if (note.length < 3) {
    errors.note = 'Follow-up note must be at least 3 characters.';
  } else if (note.length > 1000) {
    errors.note = 'Follow-up note cannot exceed 1,000 characters.';
  }

  if (input.status !== undefined && input.status !== '') {
    if (!VALID_STATUSES.includes(input.status as RefundStatus)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}.`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateThresholdDays(value: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const num = typeof value === 'number' ? value : Number(value);

  if (value === undefined || value === null || value === '' || !Number.isFinite(num)) {
    errors.staleThresholdDays = 'Threshold must be a valid whole number of days.';
  } else if (!Number.isInteger(num)) {
    errors.staleThresholdDays = 'Threshold must be a whole number (no decimals).';
  } else if (num < 1 || num > 365) {
    errors.staleThresholdDays = 'Threshold must be between 1 and 365 days.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function aggregateByCurrency(records: CancellationRecord[]): CurrencyTotal[] {
  const map = new Map<CurrencyCode, number>();
  for (const r of records) {
    const prev = map.get(r.currency) ?? 0;
    map.set(r.currency, Math.round((prev + r.expectedRefundAmount) * 100) / 100);
  }
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeSummaryMetrics(
  records: CancellationRecord[],
  thresholdDays: number,
  now: Date = new Date()
): DashboardSummary {
  const pendingOrProcessing = records.filter(
    (r) => r.status === RefundStatus.Pending || r.status === RefundStatus.Processing
  );
  const refunded = records.filter((r) => r.status === RefundStatus.Refunded);
  const disputed = records.filter((r) => r.status === RefundStatus.Disputed);
  const active = records.filter((r) => r.status !== RefundStatus.Refunded);
  const stale = records.filter((r) => isRecordStale(r, thresholdDays, now));

  return {
    totalCount: records.length,
    activeCount: active.length,
    pendingProcessingCount: pendingOrProcessing.length,
    refundedCount: refunded.length,
    disputedCount: disputed.length,
    staleCount: stale.length,
    pendingProcessingTotals: aggregateByCurrency(pendingOrProcessing),
    refundedTotals: aggregateByCurrency(refunded),
    disputedTotals: aggregateByCurrency(disputed),
  };
}

export function filterAndSortRecords(
  records: CancellationRecord[],
  criteria: FilterCriteria,
  thresholdDays: number,
  now: Date = new Date()
): CancellationRecord[] {
  const query = criteria.search.trim().toLowerCase();
  const providerFilter = criteria.provider.trim().toLowerCase();

  const filtered = records.filter((record) => {
    if (criteria.status !== 'All' && record.status !== criteria.status) {
      return false;
    }
    if (criteria.category !== 'All' && record.category !== criteria.category) {
      return false;
    }
    if (providerFilter && record.provider.toLowerCase() !== providerFilter) {
      return false;
    }
    if (criteria.onlyNeedsFollowUp && !isRecordStale(record, thresholdDays, now)) {
      return false;
    }
    if (query) {
      const haystack = [
        record.bookingTitle,
        record.provider,
        record.referenceNumber,
        record.notes,
        record.category,
        record.status,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (criteria.sortBy === 'overdue_first') {
      const aStale = isRecordStale(a, thresholdDays, now) ? 1 : 0;
      const bStale = isRecordStale(b, thresholdDays, now) ? 1 : 0;
      if (aStale !== bStale) {
        return bStale - aStale;
      }
      // Among overdue or non-overdue, sort oldest updated first for active, then newest
      const aDone = a.status === RefundStatus.Refunded ? 1 : 0;
      const bDone = b.status === RefundStatus.Refunded ? 1 : 0;
      if (aDone !== bDone) {
        return aDone - bDone;
      }
      return getReferenceTimestampMs(a) - getReferenceTimestampMs(b);
    }

    if (criteria.sortBy === 'newest_updated') {
      return getReferenceTimestampMs(b) - getReferenceTimestampMs(a);
    }

    if (criteria.sortBy === 'oldest_updated') {
      return getReferenceTimestampMs(a) - getReferenceTimestampMs(b);
    }

    if (criteria.sortBy === 'amount_desc') {
      return b.expectedRefundAmount - a.expectedRefundAmount;
    }

    // cancellation_desc
    return b.cancellationDate.localeCompare(a.cancellationDate);
  });
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatShortDate(isoDateOrTimestamp: string): string {
  if (!isoDateOrTimestamp) return '—';
  const dateOnly = ISO_DATE_PATTERN.test(isoDateOrTimestamp)
    ? new Date(`${isoDateOrTimestamp}T00:00:00.000Z`)
    : new Date(isoDateOrTimestamp);
  if (Number.isNaN(dateOnly.getTime())) return isoDateOrTimestamp;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: ISO_DATE_PATTERN.test(isoDateOrTimestamp) ? 'UTC' : undefined,
  }).format(dateOnly);
}
