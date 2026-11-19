import mongoose, { Document, Schema } from 'mongoose';
import {
  BookingCategory,
  CurrencyCode,
  RefundStatus,
  SUPPORTED_CURRENCIES,
  VALID_CATEGORIES,
  VALID_STATUSES,
} from '../../shared/types';

export interface IFollowUpSubdoc {
  id: string;
  note: string;
  statusAfter?: RefundStatus;
  createdAt: Date;
}

export interface ICancellationDoc extends Document {
  bookingTitle: string;
  provider: string;
  category: BookingCategory;
  bookingDate: string;
  cancellationDate: string;
  referenceNumber: string;
  expectedRefundAmount: number;
  currency: CurrencyCode;
  status: RefundStatus;
  notes: string;
  followUpHistory: IFollowUpSubdoc[];
  lastUpdatedAt: Date;
  createdAt: Date;
}

const FollowUpSchema = new Schema<IFollowUpSubdoc>(
  {
    id: { type: String, required: true },
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    statusAfter: { type: String, enum: VALID_STATUSES, required: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CancellationSchema = new Schema<ICancellationDoc>(
  {
    bookingTitle: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
    provider: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, index: true },
    category: {
      type: String,
      enum: VALID_CATEGORIES,
      default: BookingCategory.Other,
    },
    bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    cancellationDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    referenceNumber: { type: String, required: true, trim: true, minlength: 2, maxlength: 64 },
    expectedRefundAmount: { type: Number, required: true, min: 0, max: 1_000_000 },
    currency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: 'USD',
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: RefundStatus.Pending,
      index: true,
    },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
    followUpHistory: { type: [FollowUpSchema], default: [] },
    lastUpdatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CancellationModel =
  (mongoose.models.Cancellation as mongoose.Model<ICancellationDoc>) ||
  mongoose.model<ICancellationDoc>('Cancellation', CancellationSchema);
