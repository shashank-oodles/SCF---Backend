import { Request, Response } from 'express';
import type { HealthResponse } from '../types';

export function getHealth(_req: Request, res: Response): void {
  const body: HealthResponse = {
    success: true,
    message: 'Backend is running',
  };
  res.status(200).json(body);
}
