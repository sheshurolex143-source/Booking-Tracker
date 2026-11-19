export enum RefundStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Refunded = 'Refunded',
  Disputed = 'Disputed',
}

export enum BookingCategory {
  Flight = 'Flight',
  Accommodation = 'Accommodation',
  Event = 'Event',
  CarRental = 'Car Rental',
  Rail = 'Rail',
  Other = 'Other',
}

export const VALID_STATUSES: readonly RefundStatus[] = [
  RefundStatus.Pending,
  RefundStatus.Processing,
  RefundStatus.Refunded,
  RefundStatus.Disputed,
];

export const VALID_CATEGORIES: readonly BookingCategory[] = [
  BookingCategory.Flight,
  BookingCategory.Accommodation,
  BookingCategory.Event,
  BookingCategory.CarRental,
  BookingCategory.Rail,
  BookingCategory.Other,
];

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface FollowUpEntry {
  id: string;
  note: string;
  statusAfter?: RefundStatus;
  createdAt: string;
}

export interface CancellationRecord {
  id: string;
  bookingTitle: string;
  provider: string;
  category: BookingCategory;
  bookingDate: string; // YYYY-MM-DD
  cancellationDate: string; // YYYY-MM-DD
  referenceNumber: string;
  expectedRefundAmount: number;
  currency: CurrencyCode;
  status: RefundStatus;
  notes: string;
  followUpHistory: FollowUpEntry[];
  lastUpdatedAt: string; // ISO string
  createdAt: string; // ISO string
}

export interface CancellationInput {
  bookingTitle: string;
  provider: string;
  category?: BookingCategory;
  bookingDate: string;
  cancellationDate: string;
  referenceNumber: string;
  expectedRefundAmount: number | string;
  currency: CurrencyCode | string;
  status: RefundStatus | string;
  notes?: string;
  lastUpdatedAt?: string;
}

export interface FollowUpInput {
  note: string;
  status?: RefundStatus | string;
}

export interface TrackerSettings {
  staleThresholdDays: number;
  defaultCurrency: CurrencyCode;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface CurrencyTotal {
  currency: CurrencyCode;
  amount: number;
}

export interface DashboardSummary {
  totalCount: number;
  activeCount: number;
  pendingProcessingCount: number;
  refundedCount: number;
  disputedCount: number;
  staleCount: number;
  pendingProcessingTotals: CurrencyTotal[];
  refundedTotals: CurrencyTotal[];
  disputedTotals: CurrencyTotal[];
}

export type SortOption = 'overdue_first' | 'newest_updated' | 'oldest_updated' | 'amount_desc' | 'cancellation_desc';

export interface FilterCriteria {
  search: string;
  status: 'All' | RefundStatus;
  category: 'All' | BookingCategory;
  provider: string;
  onlyNeedsFollowUp: boolean;
  sortBy: SortOption;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
