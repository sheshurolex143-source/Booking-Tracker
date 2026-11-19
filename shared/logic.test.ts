import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysSinceUpdate,
  computeSummaryMetrics,
  filterAndSortRecords,
  isRecordStale,
  isValidCalendarDate,
  validateCancellationInput,
  validateFollowUpInput,
  validateThresholdDays,
} from './logic';
import { BookingCategory, CancellationRecord, RefundStatus } from './types';

const NOW = new Date('2026-11-18T12:00:00.000Z');

const sampleRecords: CancellationRecord[] = [
  {
    id: '1',
    bookingTitle: 'Delta Flight DL-402 JFK to LHR',
    provider: 'Delta Air Lines',
    category: BookingCategory.Flight,
    bookingDate: '2026-12-01',
    cancellationDate: '2026-11-01',
    referenceNumber: 'DL-REF-88412',
    expectedRefundAmount: 840.5,
    currency: 'USD',
    status: RefundStatus.Pending,
    notes: 'Submitted online cancellation form.',
    followUpHistory: [],
    lastUpdatedAt: '2026-11-04T12:00:00.000Z', // 14 days ago
    createdAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: '2',
    bookingTitle: 'Grand Park Hotel Kyoto',
    provider: 'Booking.com',
    category: BookingCategory.Accommodation,
    bookingDate: '2026-12-10',
    cancellationDate: '2026-11-14',
    referenceNumber: 'BKG-20491',
    expectedRefundAmount: 420,
    currency: 'USD',
    status: RefundStatus.Processing,
    notes: 'Hotel confirmed refund approval.',
    followUpHistory: [],
    lastUpdatedAt: '2026-11-15T12:00:00.000Z', // 3 days ago
    createdAt: '2026-11-14T12:00:00.000Z',
  },
  {
    id: '3',
    bookingTitle: 'Berlin Symphony Gala Tickets',
    provider: 'Eventim',
    category: BookingCategory.Event,
    bookingDate: '2026-10-20',
    cancellationDate: '2026-10-10',
    referenceNumber: 'EV-77310',
    expectedRefundAmount: 195,
    currency: 'EUR',
    status: RefundStatus.Refunded,
    notes: 'Credited back to Visa.',
    followUpHistory: [],
    lastUpdatedAt: '2026-10-15T12:00:00.000Z', // 34 days ago, but Refunded
    createdAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: '4',
    bookingTitle: 'Sixt SUV Rental Munich',
    provider: 'Sixt',
    category: BookingCategory.CarRental,
    bookingDate: '2026-11-28',
    cancellationDate: '2026-11-08',
    referenceNumber: 'SXT-3319',
    expectedRefundAmount: 310,
    currency: 'EUR',
    status: RefundStatus.Disputed,
    notes: 'Escalated with credit card issuer.',
    followUpHistory: [],
    lastUpdatedAt: '2026-11-08T12:00:00.000Z', // 10 days ago
    createdAt: '2026-11-08T12:00:00.000Z',
  },
];

test('calendar date validation rejects impossible dates', () => {
  assert.equal(isValidCalendarDate('2026-11-18'), true);
  assert.equal(isValidCalendarDate('2026-02-29'), false);
  assert.equal(isValidCalendarDate('2024-02-29'), true);
  assert.equal(isValidCalendarDate('not-a-date'), false);
});

test('staleness calculation accurately flags active records exceeding threshold', () => {
  assert.equal(calculateDaysSinceUpdate(sampleRecords[0], NOW), 14);
  assert.equal(isRecordStale(sampleRecords[0], 7, NOW), true);
  assert.equal(isRecordStale(sampleRecords[0], 14, NOW), false);
  assert.equal(isRecordStale(sampleRecords[0], 13, NOW), true);

  // Fresh active record (3 days old)
  assert.equal(isRecordStale(sampleRecords[1], 7, NOW), false);

  // Refunded record is never stale regardless of age
  assert.equal(isRecordStale(sampleRecords[2], 7, NOW), false);

  // Disputed record 10 days old exceeds 7d threshold, does not exceed 14d threshold
  assert.equal(isRecordStale(sampleRecords[3], 7, NOW), true);
  assert.equal(isRecordStale(sampleRecords[3], 14, NOW), false);
});

test('staleness falls back to cancellationDate if lastUpdatedAt is missing or invalid', () => {
  const fallbackRecord = {
    status: RefundStatus.Pending,
    cancellationDate: '2026-11-01',
    lastUpdatedAt: '',
  };
  assert.equal(calculateDaysSinceUpdate(fallbackRecord, NOW), 17);
  assert.equal(isRecordStale(fallbackRecord, 7, NOW), true);
});

test('cancellation input validation enforces required fields and constraints', () => {
  const emptyRes = validateCancellationInput({});
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors.bookingTitle);
  assert.ok(emptyRes.errors.provider);
  assert.ok(emptyRes.errors.bookingDate);
  assert.ok(emptyRes.errors.cancellationDate);
  assert.ok(emptyRes.errors.referenceNumber);
  assert.ok(emptyRes.errors.expectedRefundAmount);

  const negativeRes = validateCancellationInput({
    bookingTitle: 'Hotel Stay',
    provider: 'Expedia',
    bookingDate: '2026-12-10',
    cancellationDate: '2026-11-10',
    referenceNumber: 'EXP-100',
    expectedRefundAmount: -50,
    currency: 'USD',
    status: RefundStatus.Pending,
  });
  assert.equal(negativeRes.valid, false);
  assert.ok(negativeRes.errors.expectedRefundAmount);

  const validRes = validateCancellationInput({
    bookingTitle: 'Hotel Stay',
    provider: 'Expedia',
    category: BookingCategory.Accommodation,
    bookingDate: '2026-12-10',
    cancellationDate: '2026-11-10',
    referenceNumber: 'EXP-100',
    expectedRefundAmount: 249.99,
    currency: 'USD',
    status: RefundStatus.Pending,
    notes: 'Requested full refund.',
  });
  assert.equal(validRes.valid, true);
  assert.deepEqual(validRes.errors, {});
});

test('threshold and follow-up validation reject invalid values', () => {
  assert.equal(validateThresholdDays(7).valid, true);
  assert.equal(validateThresholdDays(0).valid, false);
  assert.equal(validateThresholdDays(400).valid, false);
  assert.equal(validateThresholdDays(7.5).valid, false);

  assert.equal(validateFollowUpInput({ note: '' }).valid, false);
  assert.equal(validateFollowUpInput({ note: 'Called support; refund escalated.' }).valid, true);
  assert.equal(
    validateFollowUpInput({ note: 'Updated status', status: 'InvalidStatus' }).valid,
    false
  );
});

test('summary metrics and filtering work with custom thresholds', () => {
  const summary7 = computeSummaryMetrics(sampleRecords, 7, NOW);
  assert.equal(summary7.totalCount, 4);
  assert.equal(summary7.pendingProcessingCount, 2);
  assert.equal(summary7.refundedCount, 1);
  assert.equal(summary7.staleCount, 2);
  assert.deepEqual(summary7.pendingProcessingTotals, [{ currency: 'USD', amount: 1260.5 }]);
  assert.deepEqual(summary7.refundedTotals, [{ currency: 'EUR', amount: 195 }]);

  const summary12 = computeSummaryMetrics(sampleRecords, 12, NOW);
  assert.equal(summary12.staleCount, 1);

  const needsFollowUpOnly = filterAndSortRecords(
    sampleRecords,
    {
      search: '',
      status: 'All',
      category: 'All',
      provider: '',
      onlyNeedsFollowUp: true,
      sortBy: 'overdue_first',
    },
    7,
    NOW
  );
  assert.equal(needsFollowUpOnly.length, 2);
  assert.equal(needsFollowUpOnly[0].id, '1');
  assert.equal(needsFollowUpOnly[1].id, '4');
});
