import { NextFunction, Request, Response } from 'express';

interface MongooseLikeError extends Error {
  name: string;
  code?: number;
  errors?: Record<string, { message: string }>;
}

export function apiNotFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} was not found.`,
    },
  });
}

export function apiErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error = err as MongooseLikeError;

  if (error?.name === 'SyntaxError' && 'body' in error) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request payload contains malformed JSON.',
      },
    });
    return;
  }

  if (error?.name === 'CastError') {
    res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'The supplied cancellation ID format is invalid.',
      },
    });
    return;
  }

  if (error?.name === 'ValidationError' && error.errors) {
    const fields: Record<string, string> = {};
    for (const [key, val] of Object.entries(error.errors)) {
      fields[key] = val.message;
    }
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation failed for one or more fields.',
        fields,
      },
    });
    return;
  }

  console.error('[api] Unhandled server error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred. Please try again.',
    },
  });
}
