import { Request, Response, NextFunction } from 'express';
import {
  getAllTitles,
  getTitleById,
  findTitleByPattern,
  validateFilterConfig,
} from '../services/filterService';
import { AppError } from '../middleware/errorHandler';

export function listFilters(_req: Request, res: Response, next: NextFunction): void {
  try {
    const titles = getAllTitles();
    res.status(200).json({
      success: true,
      data: titles,
    });
  } catch (err) {
    next(err);
  }
}

export function getFiltersByTitleId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { titleId } = req.params;

    if (!titleId || !titleId.trim()) {
      throw new AppError(400, 'titleId parameter is required');
    }

    const config = getTitleById(titleId.trim());
    if (!config) {
      throw new AppError(404, `No filter configuration found for titleId: ${titleId}`);
    }

    const validationErrors = validateFilterConfig(config);
    if (validationErrors.length > 0) {
      throw new AppError(500, 'Stored filter configuration is invalid', validationErrors);
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    next(err);
  }
}

export function resolveFilters(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const query = String(req.query.q ?? '').trim();
    if (!query) {
      throw new AppError(400, 'Query parameter "q" is required');
    }

    const config = findTitleByPattern(query);
    if (!config) {
      throw new AppError(404, 'No matching title found for the given pattern');
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    next(err);
  }
}
