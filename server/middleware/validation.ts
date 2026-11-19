import { NextFunction, Request, Response } from 'express';
import {
  validateCancellationInput,
  validateFollowUpInput,
  validateThresholdDays,
} from '../../shared/logic';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../shared/types';

export function validateCancellationBody(req: Request, res: Response, next: NextFunction): void {
  const result = validateCancellationInput(req.body ?? {});
  if (!result.valid) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please review the highlighted fields and correct any invalid values.',
        fields: result.errors,
      },
    });
    return;
  }
  next();
}

export function validateFollowUpBody(req: Request, res: Response, next: NextFunction): void {
  const result = validateFollowUpInput(req.body ?? {});
  if (!result.valid) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please provide a valid follow-up note.',
        fields: result.errors,
      },
    });
    return;
  }
  next();
}

export function validateSettingsBody(req: Request, res: Response, next: NextFunction): void {
  const body = req.body ?? {};
  const thresholdResult = validateThresholdDays(body.staleThresholdDays);
  const fields: Record<string, string> = { ...thresholdResult.errors };

  if (body.defaultCurrency !== undefined) {
    const code = String(body.defaultCurrency).trim().toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(code as CurrencyCode)) {
      fields.defaultCurrency = `Default currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`;
    }
  }

  if (Object.keys(fields).length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid threshold or settings values provided.',
        fields,
      },
    });
    return;
  }

  next();
}
