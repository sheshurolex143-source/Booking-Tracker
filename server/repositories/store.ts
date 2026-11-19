import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  BookingCategory,
  CancellationInput,
  CancellationRecord,
  CurrencyCode,
  FollowUpEntry,
  RefundStatus,
  TrackerSettings,
} from '../../shared/types';
import { isMongoConnected } from '../db/connect';
import { createInitialSeedRecords } from '../db/seedData';
import { CancellationModel, ICancellationDoc } from '../models/Cancellation';
import { SettingsModel } from '../models/Settings';

interface LocalStoreFile {
  settings: TrackerSettings;
  cancellations: CancellationRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'tracker-store.json');

let memoryStore: LocalStoreFile | null = null;

function mapMongoDoc(doc: ICancellationDoc): CancellationRecord {
  return {
    id: doc._id.toString(),
    bookingTitle: doc.bookingTitle,
    provider: doc.provider,
    category: doc.category,
    bookingDate: doc.bookingDate,
    cancellationDate: doc.cancellationDate,
    referenceNumber: doc.referenceNumber,
    expectedRefundAmount: doc.expectedRefundAmount,
    currency: doc.currency,
    status: doc.status,
    notes: doc.notes ?? '',
    followUpHistory: (doc.followUpHistory ?? []).map((entry) => ({
      id: entry.id,
      note: entry.note,
      statusAfter: entry.statusAfter,
      createdAt: new Date(entry.createdAt).toISOString(),
    })),
    lastUpdatedAt: new Date(doc.lastUpdatedAt).toISOString(),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

function loadLocalStore(): LocalStoreFile {
  if (memoryStore) {
    return memoryStore;
  }

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as LocalStoreFile;
      if (parsed && Array.isArray(parsed.cancellations) && parsed.settings) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[store] Failed to read local store file, re-seeding:', err);
  }

  memoryStore = {
    settings: {
      staleThresholdDays: 7,
      defaultCurrency: 'USD',
      updatedAt: new Date().toISOString(),
    },
    cancellations: createInitialSeedRecords(),
  };
  saveLocalStore(memoryStore);
  return memoryStore;
}

function saveLocalStore(store: LocalStoreFile): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[store] Failed to persist local store file:', err);
  }
}

export async function ensureSeededDatabase(): Promise<void> {
  if (isMongoConnected()) {
    const existingSettings = await SettingsModel.findOne({ key: 'default' });
    if (!existingSettings) {
      await SettingsModel.create({
        key: 'default',
        staleThresholdDays: 7,
        defaultCurrency: 'USD',
      });
    }
    const count = await CancellationModel.countDocuments();
    if (count === 0) {
      const seeds = createInitialSeedRecords();
      await CancellationModel.insertMany(
        seeds.map((s) => ({
          bookingTitle: s.bookingTitle,
          provider: s.provider,
          category: s.category,
          bookingDate: s.bookingDate,
          cancellationDate: s.cancellationDate,
          referenceNumber: s.referenceNumber,
          expectedRefundAmount: s.expectedRefundAmount,
          currency: s.currency,
          status: s.status,
          notes: s.notes,
          followUpHistory: s.followUpHistory.map((f) => ({
            id: f.id,
            note: f.note,
            statusAfter: f.statusAfter,
            createdAt: new Date(f.createdAt),
          })),
          lastUpdatedAt: new Date(s.lastUpdatedAt),
          createdAt: new Date(s.createdAt),
        }))
      );
    }
  } else {
    loadLocalStore();
  }
}

export async function listCancellations(): Promise<CancellationRecord[]> {
  if (isMongoConnected()) {
    const docs = await CancellationModel.find().sort({ lastUpdatedAt: -1 });
    return docs.map(mapMongoDoc);
  }
  const store = loadLocalStore();
  return [...store.cancellations];
}

export async function getCancellationById(id: string): Promise<CancellationRecord | null> {
  if (isMongoConnected()) {
    const doc = await CancellationModel.findById(id);
    return doc ? mapMongoDoc(doc) : null;
  }
  const store = loadLocalStore();
  return store.cancellations.find((c) => c.id === id) ?? null;
}

export async function createCancellation(input: CancellationInput): Promise<CancellationRecord> {
  const nowIso = new Date().toISOString();
  const parsedAmount = Math.round(Number(input.expectedRefundAmount) * 100) / 100;
  const normalizedCurrency = String(input.currency).trim().toUpperCase() as CurrencyCode;
  const normalizedStatus = String(input.status).trim() as RefundStatus;
  const normalizedCategory = (input.category ?? BookingCategory.Other) as BookingCategory;
  const normalizedNotes = (input.notes ?? '').trim();

  const initialHistory: FollowUpEntry[] = normalizedNotes
    ? [
        {
          id: `fu-${crypto.randomUUID().slice(0, 8)}`,
          note: normalizedNotes,
          statusAfter: normalizedStatus,
          createdAt: nowIso,
        },
      ]
    : [];

  if (isMongoConnected()) {
    const created = await CancellationModel.create({
      bookingTitle: input.bookingTitle.trim(),
      provider: input.provider.trim(),
      category: normalizedCategory,
      bookingDate: input.bookingDate.trim(),
      cancellationDate: input.cancellationDate.trim(),
      referenceNumber: input.referenceNumber.trim(),
      expectedRefundAmount: parsedAmount,
      currency: normalizedCurrency,
      status: normalizedStatus,
      notes: normalizedNotes,
      followUpHistory: initialHistory.map((h) => ({
        ...h,
        createdAt: new Date(h.createdAt),
      })),
      lastUpdatedAt: input.lastUpdatedAt ? new Date(input.lastUpdatedAt) : new Date(nowIso),
    });
    return mapMongoDoc(created);
  }

  const store = loadLocalStore();
  const record: CancellationRecord = {
    id: `canc-${crypto.randomUUID().slice(0, 8)}`,
    bookingTitle: input.bookingTitle.trim(),
    provider: input.provider.trim(),
    category: normalizedCategory,
    bookingDate: input.bookingDate.trim(),
    cancellationDate: input.cancellationDate.trim(),
    referenceNumber: input.referenceNumber.trim(),
    expectedRefundAmount: parsedAmount,
    currency: normalizedCurrency,
    status: normalizedStatus,
    notes: normalizedNotes,
    followUpHistory: initialHistory,
    lastUpdatedAt: input.lastUpdatedAt || nowIso,
    createdAt: nowIso,
  };

  store.cancellations.unshift(record);
  saveLocalStore(store);
  return record;
}

export async function updateCancellation(
  id: string,
  input: CancellationInput
): Promise<CancellationRecord | null> {
  const nowIso = new Date().toISOString();
  const parsedAmount = Math.round(Number(input.expectedRefundAmount) * 100) / 100;
  const normalizedCurrency = String(input.currency).trim().toUpperCase() as CurrencyCode;
  const normalizedStatus = String(input.status).trim() as RefundStatus;
  const normalizedCategory = (input.category ?? BookingCategory.Other) as BookingCategory;
  const normalizedNotes = (input.notes ?? '').trim();

  if (isMongoConnected()) {
    const updated = await CancellationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          bookingTitle: input.bookingTitle.trim(),
          provider: input.provider.trim(),
          category: normalizedCategory,
          bookingDate: input.bookingDate.trim(),
          cancellationDate: input.cancellationDate.trim(),
          referenceNumber: input.referenceNumber.trim(),
          expectedRefundAmount: parsedAmount,
          currency: normalizedCurrency,
          status: normalizedStatus,
          notes: normalizedNotes,
          lastUpdatedAt: new Date(nowIso),
        },
      },
      { new: true, runValidators: true }
    );
    return updated ? mapMongoDoc(updated) : null;
  }

  const store = loadLocalStore();
  const idx = store.cancellations.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = store.cancellations[idx];
  const updated: CancellationRecord = {
    ...current,
    bookingTitle: input.bookingTitle.trim(),
    provider: input.provider.trim(),
    category: normalizedCategory,
    bookingDate: input.bookingDate.trim(),
    cancellationDate: input.cancellationDate.trim(),
    referenceNumber: input.referenceNumber.trim(),
    expectedRefundAmount: parsedAmount,
    currency: normalizedCurrency,
    status: normalizedStatus,
    notes: normalizedNotes,
    lastUpdatedAt: nowIso,
  };
  store.cancellations[idx] = updated;
  saveLocalStore(store);
  return updated;
}

export async function logCancellationFollowUp(
  id: string,
  note: string,
  nextStatus?: RefundStatus
): Promise<CancellationRecord | null> {
  const nowIso = new Date().toISOString();
  const entry: FollowUpEntry = {
    id: `fu-${crypto.randomUUID().slice(0, 8)}`,
    note: note.trim(),
    statusAfter: nextStatus,
    createdAt: nowIso,
  };

  if (isMongoConnected()) {
    const existing = await CancellationModel.findById(id);
    if (!existing) return null;

    existing.followUpHistory.unshift({
      id: entry.id,
      note: entry.note,
      statusAfter: nextStatus ?? existing.status,
      createdAt: new Date(nowIso),
    });
    if (nextStatus) {
      existing.status = nextStatus;
    }
    existing.notes = entry.note;
    existing.lastUpdatedAt = new Date(nowIso);
    await existing.save();
    return mapMongoDoc(existing);
  }

  const store = loadLocalStore();
  const idx = store.cancellations.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = store.cancellations[idx];
  const resolvedStatus = nextStatus ?? current.status;
  const updated: CancellationRecord = {
    ...current,
    status: resolvedStatus,
    notes: entry.note,
    followUpHistory: [
      { ...entry, statusAfter: resolvedStatus },
      ...current.followUpHistory,
    ],
    lastUpdatedAt: nowIso,
  };
  store.cancellations[idx] = updated;
  saveLocalStore(store);
  return updated;
}

export async function deleteCancellation(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    const deleted = await CancellationModel.findByIdAndDelete(id);
    return Boolean(deleted);
  }

  const store = loadLocalStore();
  const initialLen = store.cancellations.length;
  store.cancellations = store.cancellations.filter((c) => c.id !== id);
  if (store.cancellations.length === initialLen) {
    return false;
  }
  saveLocalStore(store);
  return true;
}

export async function getTrackerSettings(): Promise<TrackerSettings> {
  if (isMongoConnected()) {
    let doc = await SettingsModel.findOne({ key: 'default' });
    if (!doc) {
      doc = await SettingsModel.create({
        key: 'default',
        staleThresholdDays: 7,
        defaultCurrency: 'USD',
      });
    }
    return {
      staleThresholdDays: doc.staleThresholdDays,
      defaultCurrency: doc.defaultCurrency,
      updatedAt: new Date(doc.updatedAt).toISOString(),
    };
  }

  const store = loadLocalStore();
  return { ...store.settings };
}

export async function updateTrackerSettings(
  staleThresholdDays: number,
  defaultCurrency?: CurrencyCode
): Promise<TrackerSettings> {
  const nowIso = new Date().toISOString();

  if (isMongoConnected()) {
    const doc = await SettingsModel.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          staleThresholdDays,
          ...(defaultCurrency ? { defaultCurrency } : {}),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );
    return {
      staleThresholdDays: doc.staleThresholdDays,
      defaultCurrency: doc.defaultCurrency,
      updatedAt: new Date(doc.updatedAt).toISOString(),
    };
  }

  const store = loadLocalStore();
  store.settings = {
    staleThresholdDays,
    defaultCurrency: defaultCurrency ?? store.settings.defaultCurrency,
    updatedAt: nowIso,
  };
  saveLocalStore(store);
  return { ...store.settings };
}
