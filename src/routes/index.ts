import { Router } from 'express';
import { getHealth } from '../controllers/healthController';
import {
  listFilters,
  getFiltersByTitleId,
  resolveFilters,
} from '../controllers/filterController';
import { validateTitleIdParam } from '../middleware/validateTitleId';

const router = Router();

router.get('/health', getHealth);
router.get('/filters', listFilters);
router.get('/filters/resolve', resolveFilters);
router.get('/filters/:titleId', validateTitleIdParam, getFiltersByTitleId);

export default router;
