import mongoose, { Document, Schema } from 'mongoose';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../shared/types';

export interface ISettingsDoc extends Document {
  key: string;
  staleThresholdDays: number;
  defaultCurrency: CurrencyCode;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    staleThresholdDays: { type: Number, required: true, min: 1, max: 365, default: 7 },
    defaultCurrency: {
      type: String,
      enum: SUPPORTED_CURRENCIES,
      default: 'USD',
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const SettingsModel =
  (mongoose.models.Settings as mongoose.Model<ISettingsDoc>) ||
  mongoose.model<ISettingsDoc>('Settings', SettingsSchema);
