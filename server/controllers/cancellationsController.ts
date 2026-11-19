import { NextFunction, Request, Response } from 'express';
import {
  computeSummaryMetrics,
  filterAndSortRecords,
  isRecordStale,
} from '../../shared/logic';
import {
  BookingCategory,
  RefundStatus,
  SortOption,
  VALID_CATEGORIES,
  VALID_STATUSES,
} from '../../shared/types';
import {
  createCancellation,
  deleteCancellation,
  getCancellationById,
  getTrackerSettings,
  listCancellations,
  logCancellationFollowUp,
  updateCancellation,
} from '../repositories/store';

export async function handleListCancellations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [allRecords, settings] = await Promise.all([
      listCancellations(),
      getTrackerSettings(),
    ]);

    const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'All';
    const rawCategory = typeof req.query.category === 'string' ? req.query.category : 'All';
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const provider = typeof req.query.provider === 'string' ? req.query.provider : '';
    const onlyNeedsFollowUp = req.query.stale === 'true' || req.query.needsFollowUp === 'true';
    const sortBy = (
      typeof req.query.sortBy === 'string' ? req.query.sortBy : 'overdue_first'
    ) as SortOption;

    const status = VALID_STATUSES.includes(rawStatus as RefundStatus)
      ? (rawStatus as RefundStatus)
      : 'All';
    const category = VALID_CATEGORIES.includes(rawCategory as BookingCategory)
      ? (rawCategory as BookingCategory)
      : 'All';

    const now = new Date();
    const filtered = filterAndSortRecords(
      allRecords,
      { search, status, category, provider, onlyNeedsFollowUp, sortBy },
      settings.staleThresholdDays,
      now
    );

    const summary = computeSummaryMetrics(allRecords, settings.staleThresholdDays, now);

    res.status(200).json({
      data: filtered.map((record) => ({
        ...record,
        isStale: isRecordStale(record, settings.staleThresholdDays, now),
      })),
      summary,
      settings,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetCancellation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const record = await getCancellationById(req.params.id);
    if (!record) {
      res.status(404).json({
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Cancellation record not found.',
        },
      });
      return;
    }
    res.status(200).json({ data: record });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateCancellation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const created = await createCancellation(req.body);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateCancellation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await updateCancellation(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Cancellation record not found.',
        },
      });
      return;
    }
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleLogFollowUp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { note, status } = req.body as { note: string; status?: RefundStatus };
    const updated = await logCancellationFollowUp(
      req.params.id,
      note,
      status && VALID_STATUSES.includes(status) ? status : undefined
    );
    if (!updated) {
      res.status(404).json({
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Cancellation record not found.',
        },
      });
      return;
    }
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteCancellation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const removed = await deleteCancellation(req.params.id);
    if (!removed) {
      res.status(404).json({
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Cancellation record not found.',
        },
      });
      return;
    }
    res.status(200).json({ data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
}
