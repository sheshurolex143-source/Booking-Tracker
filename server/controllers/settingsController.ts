import { NextFunction, Request, Response } from 'express';
import { CurrencyCode } from '../../shared/types';
import { getTrackerSettings, updateTrackerSettings } from '../repositories/store';

export async function handleGetSettings(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await getTrackerSettings();
    res.status(200).json({ data: settings });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const staleThresholdDays = Number(req.body.staleThresholdDays);
    const defaultCurrency = req.body.defaultCurrency
      ? (String(req.body.defaultCurrency).trim().toUpperCase() as CurrencyCode)
      : undefined;

    const updated = await updateTrackerSettings(staleThresholdDays, defaultCurrency);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}
