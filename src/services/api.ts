import {
  ApiErrorPayload,
  CancellationInput,
  CancellationRecord,
  CurrencyCode,
  DashboardSummary,
  FollowUpInput,
  TrackerSettings,
} from '../../shared/types';

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fields: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code = 'REQUEST_FAILED',
    fields: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const errBody = parsed as Partial<ApiErrorPayload> | null;
    const message =
      errBody?.error?.message || `Request failed with status ${response.status}.`;
    const code = errBody?.error?.code || 'REQUEST_FAILED';
    const fields = errBody?.error?.fields ?? {};
    throw new ApiRequestError(message, response.status, code, fields);
  }

  return parsed as T;
}

export interface ListCancellationsResponse {
  data: CancellationRecord[];
  summary: DashboardSummary;
  settings: TrackerSettings;
}

export async function fetchCancellations(): Promise<ListCancellationsResponse> {
  return requestJson<ListCancellationsResponse>('/api/cancellations');
}

export async function createCancellationRecord(
  input: CancellationInput
): Promise<CancellationRecord> {
  const res = await requestJson<{ data: CancellationRecord }>('/api/cancellations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateCancellationRecord(
  id: string,
  input: CancellationInput
): Promise<CancellationRecord> {
  const res = await requestJson<{ data: CancellationRecord }>(
    `/api/cancellations/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
  return res.data;
}

export async function logFollowUpRecord(
  id: string,
  input: FollowUpInput
): Promise<CancellationRecord> {
  const res = await requestJson<{ data: CancellationRecord }>(
    `/api/cancellations/${encodeURIComponent(id)}/follow-up`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return res.data;
}

export async function deleteCancellationRecord(id: string): Promise<void> {
  await requestJson<{ data: { id: string; deleted: boolean } }>(
    `/api/cancellations/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function updateSettings(
  staleThresholdDays: number,
  defaultCurrency?: CurrencyCode
): Promise<TrackerSettings> {
  const res = await requestJson<{ data: TrackerSettings }>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ staleThresholdDays, defaultCurrency }),
  });
  return res.data;
}
