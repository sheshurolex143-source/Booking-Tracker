import React, { useEffect, useState } from 'react';
import { computeSummaryMetrics, validateThresholdDays } from '../../shared/logic';
import {
  CancellationRecord,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  TrackerSettings,
} from '../../shared/types';
import { ApiRequestError } from '../services/api';

interface SettingsViewProps {
  settings: TrackerSettings;
  records: CancellationRecord[];
  onSaveSettings: (thresholdDays: number, defaultCurrency: CurrencyCode) => Promise<void>;
  onViewOverdue: () => void;
}

const PRESET_THRESHOLDS = [3, 5, 7, 14, 21, 30];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  records,
  onSaveSettings,
  onViewOverdue,
}) => {
  const [thresholdInput, setThresholdInput] = useState(String(settings.staleThresholdDays));
  const [currencyInput, setCurrencyInput] = useState<CurrencyCode>(settings.defaultCurrency);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setThresholdInput(String(settings.staleThresholdDays));
    setCurrencyInput(settings.defaultCurrency);
  }, [settings]);

  const parsedPreview = Number(thresholdInput);
  const previewValid = Number.isInteger(parsedPreview) && parsedPreview >= 1 && parsedPreview <= 365;
  const previewSummary = computeSummaryMetrics(
    records,
    previewValid ? parsedPreview : settings.staleThresholdDays
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(null);

    const check = validateThresholdDays(thresholdInput);
    if (!check.valid) {
      setError(check.errors.staleThresholdDays || 'Invalid threshold value.');
      return;
    }

    setSaving(true);
    try {
      await onSaveSettings(Number(thresholdInput), currencyInput);
      setSavedNotice(
        `Saved. Active bookings unupdated for more than ${Number(thresholdInput)} ${
          Number(thresholdInput) === 1 ? 'day' : 'days'
        } are now flagged.`
      );
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.fields.staleThresholdDays || err.message);
      } else {
        setError('Could not save settings. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-slate-900">
          Follow-Up Escalation Rules
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure how many days an active cancellation request can go without an update before
          it is flagged as overdue.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200"
      >
        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
            >
              {error}
            </div>
          )}

          {savedNotice && (
            <div
              role="status"
              className="p-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md"
            >
              {savedNotice}
            </div>
          )}

          <div>
            <label
              htmlFor="threshold-days-input"
              className="block text-sm font-medium text-slate-900"
            >
              Stale / Overdue Threshold (Days)
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Applies to Pending, Processing, and Disputed cancellations. Refunded items are never
              flagged.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                id="threshold-days-input"
                type="number"
                min={1}
                max={365}
                step={1}
                value={thresholdInput}
                onChange={(e) => {
                  setThresholdInput(e.target.value);
                  setError(null);
                  setSavedNotice(null);
                }}
                className="w-28 h-10 px-3 text-sm font-mono tabular-nums rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />

              <div
                role="group"
                aria-label="Quick threshold presets"
                className="inline-flex flex-wrap items-center gap-1.5"
              >
                {PRESET_THRESHOLDS.map((days) => {
                  const active = Number(thresholdInput) === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setThresholdInput(String(days));
                        setError(null);
                        setSavedNotice(null);
                      }}
                      className={`h-9 px-3 text-xs font-mono tabular-nums rounded-md border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {days}d
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-600">
              Live impact preview:{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {previewSummary.staleCount}
              </span>{' '}
              of{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {previewSummary.activeCount}
              </span>{' '}
              active cancellations exceed{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {previewValid ? parsedPreview : settings.staleThresholdDays}
              </span>{' '}
              days without an update.
              {previewSummary.staleCount > 0 && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={onViewOverdue}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    Review flagged requests
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-2">
          <label
            htmlFor="default-currency-select"
            className="block text-sm font-medium text-slate-900"
          >
            Default Currency for New Entries
          </label>
          <p className="text-xs text-slate-500">
            Pre-selected currency when creating a new booking cancellation record.
          </p>
          <select
            id="default-currency-select"
            value={currencyInput}
            onChange={(e) => {
              setCurrencyInput(e.target.value as CurrencyCode);
              setSavedNotice(null);
            }}
            className="mt-2 w-40 h-10 px-3 text-sm font-mono rounded-md border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {saving ? 'Saving Rules...' : 'Save Threshold & Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
