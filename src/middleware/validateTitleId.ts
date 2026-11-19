import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

const TITLE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9\-_]{0,63}$/;

export function validateTitleIdParam(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { titleId } = req.params;

  if (!titleId || !TITLE_ID_PATTERN.test(titleId)) {
    next(
      new AppError(
        400,
        'Invalid titleId. Use 1–64 alphanumeric characters, hyphens, or underscores.'
      )
    );
    return;
  }

  next();
}
