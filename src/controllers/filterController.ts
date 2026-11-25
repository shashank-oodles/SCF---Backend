import { Request, Response, NextFunction } from 'express';
import {
  getAllTitles,
  getTitleById,
  findTitleByPattern,
  validateFilterConfig,
  createTitle,
  publishTitle,
} from '../services/filterService';
import { AppError } from '../middleware/errorHandler';
import type { CreateTitleRequest, PublishTitleRequest } from '../types';

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

export function createTitleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const body = req.body as CreateTitleRequest;

    if (!body || typeof body !== 'object') {
      throw new AppError(400, 'Request body is required');
    }
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new AppError(400, 'title is required');
    }
    if (body.kind !== 'movie' && body.kind !== 'show') {
      throw new AppError(400, 'kind must be "movie" or "show"');
    }
    if (typeof body.videoUrl !== 'string' || !body.videoUrl.trim()) {
      throw new AppError(400, 'videoUrl is required');
    }
    if (typeof body.gti !== 'string' || !/amzn1\.dv\.gti\./i.test(body.gti)) {
      throw new AppError(400, 'gti (amzn1.dv.gti.… ) is required');
    }
    if (
      body.kind === 'show' &&
      (typeof body.episodeName !== 'string' || !body.episodeName.trim())
    ) {
      throw new AppError(400, 'episodeName is required for shows');
    }

    const config = createTitle({
      title: body.title,
      kind: body.kind,
      episodeName: body.episodeName,
      gti: body.gti,
      videoUrl: body.videoUrl,
      provider: body.provider,
      matchPatterns: body.matchPatterns,
    });

    const validationErrors = validateFilterConfig(config);
    if (validationErrors.length > 0) {
      throw new AppError(500, 'Created title failed validation', validationErrors);
    }

    res.status(201).json({
      success: true,
      data: config,
      message: 'Title created',
    });
  } catch (err) {
    if (err instanceof Error && !(err instanceof AppError)) {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
}

export function publishTitleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { titleId } = req.params;
    const body = req.body as PublishTitleRequest;

    if (!titleId?.trim()) {
      throw new AppError(400, 'titleId parameter is required');
    }
    if (!body || typeof body !== 'object') {
      throw new AppError(400, 'Request body is required');
    }
    if (!Array.isArray(body.filters)) {
      throw new AppError(400, 'filters must be an array');
    }

    if (!getTitleById(titleId.trim())) {
      throw new AppError(404, `No filter configuration found for titleId: ${titleId}`);
    }

    const config = publishTitle(titleId.trim(), body);
    const validationErrors = validateFilterConfig(config);
    if (validationErrors.length > 0) {
      throw new AppError(400, 'Published filters are invalid', validationErrors);
    }

    res.status(200).json({
      success: true,
      data: config,
      message: 'Filters published',
    });
  } catch (err) {
    if (err instanceof Error && !(err instanceof AppError)) {
      next(new AppError(400, err.message));
      return;
    }
    next(err);
  }
}
