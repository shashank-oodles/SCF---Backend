import { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    success: false,
    message: 'Route not found',
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('[Error]', err);
  const body: ApiErrorResponse = {
    success: false,
    message: 'Internal server error',
  };
  res.status(500).json(body);
}
